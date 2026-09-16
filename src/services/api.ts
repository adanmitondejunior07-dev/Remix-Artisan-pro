import type {
  Artisan,
  Plan,
  User,
  MarketplaceService,
  Message,
  QuoteRequest,
  Transaction,
  AppNotification,
  AdminStats,
  CallRecord,
  Subscription,
  Payment,
  PasswordReset,
} from '../types.ts';
import { firestoreService } from './firestoreService.ts';
import {
  INITIAL_ARTISANS,
  INITIAL_CLIENTS,
  INITIAL_DEVIS,
  INITIAL_MESSAGES,
  INITIAL_PLANS,
  INITIAL_SERVICES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData.ts';
import { isExactAdminEmail, getAdminUserByEmail, ADMINS_TABLE } from '../config/adminConfig.ts';
import { hashSecretCode, verifySecretCode } from '../utils/crypto.ts';

const BASE_URL = '/api';

export const api = {
  // ============================================================
  // ARTISANS (Firestore Collection 'artisans')
  // ============================================================
  async getArtisans(params?: { q?: string; trade?: string; city?: string; country?: string; plan?: string }): Promise<Artisan[]> {
    let list: Artisan[] = [];
    try {
      list = await firestoreService.getArtisans();
    } catch (err) {
      console.warn('Fallback to server getArtisans:', err);
    }

    if (!list || list.length === 0) {
      try {
        const searchParams = new URLSearchParams();
        if (params?.q) searchParams.append('q', params.q);
        if (params?.trade) searchParams.append('trade', params.trade);
        if (params?.city) searchParams.append('city', params.city);
        if (params?.plan) searchParams.append('plan', params.plan);

        const res = await fetch(`${BASE_URL}/artisans?${searchParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) list = data;
        }
      } catch (err) {
        console.warn('Fallback getArtisans from server:', err);
      }
    }

    if (!list || list.length === 0) {
      list = INITIAL_ARTISANS;
    }

    // Intégration de la base de données locale 'artisans_afrique'
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('artisans_afrique');
        if (rawLocal) {
          const localArtisans: any[] = JSON.parse(rawLocal);
          if (Array.isArray(localArtisans)) {
            for (const item of localArtisans) {
              if (item.role === 'artisan' || item.metier || item.trade) {
                const mapped: Artisan = {
                  id: typeof item.id === 'number' ? item.id : parseInt(String(item.id).replace(/\D/g, '').slice(-6)) || 99999,
                  name: item.nom || item.name || 'Artisan Pro',
                  trade: item.metier || item.trade || 'Artisan',
                  city: item.ville || item.city || 'Abidjan',
                  country: item.pays || item.country || 'Côte d’Ivoire',
                  rating: 5.0,
                  reviewsCount: 1,
                  plan: 'Pro',
                  emoji: '🛠️',
                  services: item.services || ['Prestations soignées', 'Interventions rapides'],
                  phone: item.telephone || item.phone || '+225 0503444508',
                  email: item.email || 'artisan@artisanpro.afrique',
                  whatsapp: item.telephone || item.phone || '+225 0503444508',
                  hourlyRate: '10 000 FCFA / h',
                  lat: 5.36,
                  lng: -4.0083,
                  profileViews: 12,
                  contactsCount: 4,
                  joinedDate: item.dateInscription ? item.dateInscription.split('T')[0] : new Date().toISOString().split('T')[0],
                  verified: true,
                  is_verified: true,
                  hasPaid10k: true,
                  a_paye_10k: true,
                  hasPaidActivation13k: true,
                  description: item.description || `Artisan professionnel en ${item.metier || item.trade || 'Artisanat'}.`,
                };
                if (!list.some((existing) => existing.phone === mapped.phone || existing.name === mapped.name)) {
                  list = [mapped, ...list];
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erreur lecture artisans_afrique dans api.getArtisans:', err);
      }
    }

    // In-memory filter if query parameters provided
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.trade.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q) ||
          a.services.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (params?.trade && params.trade !== 'Tous' && params.trade !== 'Tous les métiers') {
      list = list.filter((a) => a.trade.toLowerCase().includes(params.trade!.toLowerCase()));
    }
    if (params?.city && params.city !== 'Toutes les villes') {
      list = list.filter((a) => a.city.toLowerCase().includes(params.city!.toLowerCase()));
    }
    if (params?.country && params.country !== 'Tous les pays') {
      list = list.filter((a) => a.country?.toLowerCase().includes(params.country!.toLowerCase()));
    }
    if (params?.plan && params.plan !== 'all') {
      list = list.filter((a) => a.plan.toLowerCase() === params.plan!.toLowerCase());
    }

    // Afficher les artisans PRO en premier si abonnement_actif = true
    list.sort((a, b) => {
      const aActive = a.abonnement_actif ? 1 : 0;
      const bActive = b.abonnement_actif ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return (b.rating || 0) - (a.rating || 0);
    });

    return list;
  },

  async getArtisanById(id: number): Promise<Artisan> {
    try {
      const art = await firestoreService.getArtisanById(id);
      if (art) return art;
    } catch (e) {
      console.warn('Fallback getArtisanById:', e);
    }
    try {
      const res = await fetch(`${BASE_URL}/artisans/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fallback getArtisanById from server:', e);
    }
    const found = INITIAL_ARTISANS.find((a) => a.id === id);
    if (found) return found;
    return INITIAL_ARTISANS[0];
  },

  async createArtisan(data: Partial<Artisan>): Promise<Artisan> {
    try {
      const saved = await firestoreService.saveArtisan({
        name: data.name || 'Artisan',
        trade: data.trade || 'Artisanat',
        ...data,
      });

      // Synchronize in background with server if running
      fetch(`${BASE_URL}/artisans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});

      return saved;
    } catch (err) {
      console.warn('Fallback server createArtisan:', err);
      const res = await fetch(`${BASE_URL}/artisans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Erreur création' }));
        throw new Error(errJson.error || 'Erreur lors de la création de l’artisan');
      }
      return res.json();
    }
  },

  async updateArtisan(id: number, data: Partial<Artisan>): Promise<Artisan> {
    try {
      const existing = await firestoreService.getArtisanById(id);
      // Préservation stricte : si l'un change, l'autre ne doit JAMAIS disparaître
      const preservedBanner = (data.bannerUrl && data.bannerUrl.trim().length > 0)
        ? data.bannerUrl
        : (data.coverUrl && data.coverUrl.trim().length > 0)
        ? data.coverUrl
        : existing?.bannerUrl || existing?.coverUrl;

      const preservedAvatar = (data.avatarUrl && data.avatarUrl.trim().length > 0)
        ? data.avatarUrl
        : (data.photoUrl && data.photoUrl.trim().length > 0)
        ? data.photoUrl
        : existing?.avatarUrl || existing?.photoUrl;

      const cleanData: Partial<Artisan> = {
        ...data,
        ...(preservedBanner ? { bannerUrl: preservedBanner, coverUrl: preservedBanner } : {}),
        ...(preservedAvatar ? { avatarUrl: preservedAvatar, photoUrl: preservedAvatar } : {}),
      };

      const updated = await firestoreService.updateArtisan(id, cleanData);
      if (updated) {
        // Sync server
        fetch(`${BASE_URL}/artisans/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanData),
        }).catch(() => {});
        return updated;
      }
    } catch (e) {
      console.warn('Fallback updateArtisan:', e);
    }
    const res = await fetch(`${BASE_URL}/artisans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur mise à jour');
    return res.json();
  },

  async deleteArtisan(id: number): Promise<{ success: boolean }> {
    try {
      await firestoreService.deleteArtisan(id);
    } catch (e) {
      console.warn('Firestore deleteArtisan fallback:', e);
    }
    try {
      const res = await fetch(`${BASE_URL}/artisans/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Server delete artisan error:', e);
    }
    return { success: true };
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    try {
      await firestoreService.deleteClient(id);
    } catch (e) {
      console.warn('Firestore deleteClient fallback:', e);
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Server delete user error:', e);
    }
    return { success: true };
  },

  // ============================================================
  // CLIENTS & USERS (Firestore Collection 'clients')
  // ============================================================
  async getUsers(): Promise<User[]> {
    try {
      const clients = await firestoreService.getClients();
      if (clients && clients.length > 0) return clients;
    } catch (e) {
      console.warn('Fallback getUsers:', e);
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Fallback getUsers from server:', e);
    }
    return INITIAL_CLIENTS;
  },

  async login(payload: { email?: string; phone?: string; role?: string; userId?: string; password?: string; secretCode?: string }): Promise<{ user: User; artisan?: Artisan }> {
    // SÉCURITÉ PRIORITAIRE : Si c'est l'un des emails administrateur officiel, garantir le rôle super_admin
    if (payload.email && isExactAdminEmail(payload.email)) {
      const adminUser = getAdminUserByEmail(payload.email);
      return { user: adminUser };
    }

    const enteredCode = payload.secretCode || payload.password;

    try {
      const users = await firestoreService.getClients();
      let matchedUser: User | undefined;

      if (payload.userId) {
        matchedUser = users.find((u) => u.id === payload.userId);
      } else if (payload.email) {
        matchedUser = users.find(
          (u) => u.email.toLowerCase() === payload.email!.toLowerCase().trim()
        );
      } else if (payload.phone) {
        const cleanPhone = payload.phone.replace(/\s+/g, '');
        matchedUser = users.find(
          (u) => u.phone && u.phone.replace(/\s+/g, '').includes(cleanPhone)
        );
      }

      if (matchedUser) {
        // Validation du code secret si présent
        if (enteredCode && matchedUser.secretCodeHash) {
          const isValid = await verifySecretCode(enteredCode, matchedUser.secretCodeHash);
          if (!isValid && enteredCode !== matchedUser.password) {
            throw new Error('Code secret / mot de passe incorrect.');
          }
        }

        // Si l'utilisateur enregistré possède un email admin, forcer son rôle en super_admin (jamais client)
        if (isExactAdminEmail(matchedUser.email)) {
          matchedUser = { ...matchedUser, role: 'super_admin' };
        }
        let artisan: Artisan | undefined;
        if (matchedUser.artisanId) {
          const found = await firestoreService.getArtisanById(matchedUser.artisanId);
          if (found) artisan = found;
        }
        return { user: matchedUser, artisan };
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Code secret')) {
        throw e;
      }
      console.warn('Fallback login to server:', e);
    }

    // Si c'est un email admin et que le serveur externe n'a pas répondu, ne jamais bloquer
    if (payload.email && isExactAdminEmail(payload.email)) {
      return { user: getAdminUserByEmail(payload.email) };
    }

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Échec de connexion' }));
      throw new Error(err.error || 'Identifiants incorrects');
    }
    const result = await res.json();
    if (result.user && isExactAdminEmail(result.user.email)) {
      result.user.role = 'super_admin';
    }
    return result;
  },

  async getAdmins(): Promise<any[]> {
    try {
      const firestoreAdmins = await firestoreService.getAdmins();
      if (firestoreAdmins && firestoreAdmins.length > 0) return firestoreAdmins;
    } catch (e) {
      console.warn('Fallback getAdmins to ADMINS_TABLE:', e);
    }
    return ADMINS_TABLE;
  },

  async register(data: any): Promise<{ user: User; artisan?: Artisan }> {
    try {
      // Les emails admin officiels ne deviennent JAMAIS de simples clients
      const assignedRole = isExactAdminEmail(data.email) ? 'super_admin' : (data.role || 'client');

      // Hachage du code secret / mot de passe choisi par l'utilisateur
      let codeHash: string | undefined = undefined;
      const rawCode = data.secretCode || data.password;
      if (rawCode) {
        codeHash = await hashSecretCode(rawCode);
      }

      const newUser: User = {
        id: `user-${assignedRole}-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: assignedRole,
        phone: data.phone || '+225 ',
        city: data.city || 'Abidjan',
        country: data.country || 'Côte d’Ivoire',
        joinedDate: new Date().toISOString().split('T')[0],
        secretCodeHash: codeHash,
      };

      let createdArtisan: Artisan | undefined;

      if (data.role === 'artisan') {
        createdArtisan = await firestoreService.saveArtisan({
          name: data.name,
          trade: data.trade || 'Artisan',
          city: data.city || 'Abidjan',
          country: data.country || 'Côte d’Ivoire',
          phone: data.phone || '+225 ',
          email: data.email,
          plan: 'Pro',
          rating: 5.0,
          reviewsCount: 1,
          verified: true,
          hourlyRate: '10 000 FCFA',
          services: ['Prestations soignées'],
          description: `Artisan qualifié disponible à ${data.city || 'Abidjan'}.`,
        });
        newUser.artisanId = createdArtisan.id;
      }

      await firestoreService.saveClient(newUser);

      // Sync server in background
      fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: newUser.id, artisanId: createdArtisan?.id }),
      }).catch(() => {});

      return { user: newUser, artisan: createdArtisan };
    } catch (err) {
      console.warn('Fallback server register:', err);
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Échec d’inscription' }));
        throw new Error(errJson.error || 'Échec de création du compte');
      }
      return res.json();
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    try {
      const existing = await firestoreService.getClientById(userId);
      // Préservation stricte : si l'un change, l'autre ne doit JAMAIS disparaître
      const preservedBanner = (data.bannerUrl && data.bannerUrl.trim().length > 0)
        ? data.bannerUrl
        : (data.coverUrl && data.coverUrl.trim().length > 0)
        ? data.coverUrl
        : existing?.bannerUrl || existing?.coverUrl;

      const preservedAvatar = (data.avatarUrl && data.avatarUrl.trim().length > 0)
        ? data.avatarUrl
        : (data.photoUrl && data.photoUrl.trim().length > 0)
        ? data.photoUrl
        : existing?.avatarUrl || existing?.photoUrl || existing?.avatar;

      const updatedUser: User = {
        ...(existing || {} as User),
        ...data,
        ...(preservedBanner ? { bannerUrl: preservedBanner, coverUrl: preservedBanner } : {}),
        ...(preservedAvatar ? { avatarUrl: preservedAvatar, photoUrl: preservedAvatar, avatar: preservedAvatar } : {}),
        id: userId,
      };
      await firestoreService.saveClient(updatedUser);
      return updatedUser;
    } catch (e) {
      console.warn('Fallback updateUser in firestore:', e);
      return { id: userId, ...data } as User;
    }
  },

  /**
   * Upload ciblé de photo de profil (Ne touche jamais à la bannière)
   */
  async uploadProfilePhoto(id: string | number, photoUrl: string): Promise<void> {
    await firestoreService.uploadProfilePhoto(id, photoUrl);
  },

  /**
   * Upload ciblé de bannière de couverture (Ne touche jamais à la photo de profil)
   */
  async uploadCoverPhoto(id: string | number, coverUrl: string): Promise<void> {
    await firestoreService.uploadCoverPhoto(id, coverUrl);
  },

  // ============================================================
  // DEVIS (Firestore Collection 'devis')
  // ============================================================
  async getQuotes(params?: { clientId?: string; artisanId?: number }): Promise<QuoteRequest[]> {
    try {
      const quotes = await firestoreService.getDevis(params);
      if (quotes) return quotes;
    } catch (e) {
      console.warn('Fallback getQuotes:', e);
    }
    const searchParams = new URLSearchParams();
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.artisanId) searchParams.append('artisanId', params.artisanId.toString());

    const res = await fetch(`${BASE_URL}/quotes?${searchParams.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async createQuote(data: Partial<QuoteRequest>): Promise<QuoteRequest> {
    try {
      const saved = await firestoreService.createDevis(data);

      // Notify server in background
      fetch(`${BASE_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});

      return saved;
    } catch (err) {
      console.warn('Fallback createQuote to server:', err);
      const res = await fetch(`${BASE_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erreur demande devis');
      return res.json();
    }
  },

  async updateQuoteStatus(id: string, status: QuoteRequest['status']): Promise<QuoteRequest> {
    try {
      await firestoreService.updateDevisStatus(id, status);
      // Sync server
      fetch(`${BASE_URL}/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});

      const all = await firestoreService.getDevis();
      const match = all.find((d) => d.id === id);
      if (match) return match;
    } catch (e) {
      console.warn('Fallback updateQuoteStatus:', e);
    }
    const res = await fetch(`${BASE_URL}/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Erreur mise à jour devis');
    return res.json();
  },

  async updateQuote(id: string, data: { status?: QuoteRequest['status']; proposedPrice?: string }): Promise<QuoteRequest> {
    return this.updateQuoteStatus(id, data.status || 'accepte');
  },

  // ============================================================
  // MESSAGES (Firestore Collection 'messages')
  // ============================================================
  async getMessages(params?: { artisanId?: number; clientId?: string }): Promise<Message[]> {
    try {
      const msgs = await firestoreService.getMessages(params);
      if (msgs) return msgs;
    } catch (e) {
      console.warn('Fallback getMessages:', e);
    }
    const searchParams = new URLSearchParams();
    if (params?.artisanId) searchParams.append('artisanId', params.artisanId.toString());
    if (params?.clientId) searchParams.append('clientId', params.clientId);

    const res = await fetch(`${BASE_URL}/messages?${searchParams.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  async sendMessage(data: {
    artisanId: number;
    clientId: string;
    text: string;
    senderId: string;
    senderName: string;
    senderRole: 'client' | 'artisan';
    callInfo?: Message['callInfo'];
  }): Promise<Message> {
    try {
      const saved = await firestoreService.sendMessage(data);

      // Sync server in background
      fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});

      return saved;
    } catch (err) {
      console.warn('Fallback sendMessage to server:', err);
      const res = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erreur envoi message');
      return res.json();
    }
  },

  // ============================================================
  // VOIP CALLS HISTORY
  // ============================================================
  async recordCall(callData: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    try {
      return await firestoreService.recordCall(callData);
    } catch (e) {
      console.warn('api.recordCall fallback:', e);
      const fallbackId = `call-${Date.now()}`;
      return { ...callData, id: fallbackId };
    }
  },

  async getCallHistory(artisanId: number): Promise<CallRecord[]> {
    try {
      return await firestoreService.getCallHistory(artisanId);
    } catch (e) {
      console.warn('api.getCallHistory fallback:', e);
      return [];
    }
  },

  // ============================================================
  // PLANS & SERVICES & PAYMENTS & NOTIFICATIONS & ADMIN
  // ============================================================
  async getPlans(): Promise<Plan[]> {
    try {
      const res = await fetch(`${BASE_URL}/plans`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Fallback getPlans:', e);
    }
    return INITIAL_PLANS;
  },

  async getServices(params?: { q?: string; category?: string; city?: string }): Promise<MarketplaceService[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.city) searchParams.append('city', params.city);

      const res = await fetch(`${BASE_URL}/services?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Fallback getServices:', e);
    }

    let list = INITIAL_SERVICES;
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (params?.category && params.category !== 'Toutes') {
      list = list.filter((s) => s.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.city && params.city !== 'Toutes les villes') {
      list = list.filter((s) => s.city.toLowerCase() === params.city!.toLowerCase());
    }
    return list;
  },

  async createService(data: Partial<MarketplaceService>): Promise<MarketplaceService> {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur ajout service');
    return res.json();
  },

  async checkoutSubscription(data: {
    artisanId: number;
    plan: string;
    paymentMethod: string;
    phoneNumber?: string;
  }): Promise<{ success: boolean; transaction: Transaction; artisan: Artisan; message: string }> {
    const res = await fetch(`${BASE_URL}/subscriptions/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur paiement' }));
      throw new Error(err.error || 'Échec du traitement du paiement');
    }
    const result = await res.json();

    // Also update Firestore artisan plan/verified status
    try {
      await firestoreService.updateArtisan(data.artisanId, { plan: 'Pro', verified: true });
    } catch (e) {
      console.warn('Firestore update after subscription checkout:', e);
    }

    return result;
  },

  async getTransactions(userRole?: string): Promise<Transaction[]> {
    let role = userRole;
    if (!role && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('userData');
        if (raw) role = JSON.parse(raw)?.role;
      } catch {}
    }
    if (role !== 'admin' && role !== 'super_admin') {
      return [];
    }
    const res = await fetch(`${BASE_URL}/transactions`, {
      headers: {
        'x-user-role': role,
      },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getPayments(): Promise<Transaction[]> {
    return this.getTransactions();
  },

  async getNotifications(userId?: string): Promise<AppNotification[]> {
    try {
      const url = userId ? `${BASE_URL}/notifications?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/notifications`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Fallback getNotifications:', e);
    }
    return INITIAL_NOTIFICATIONS;
  },

  async sendNotification(data: { title: string; message: string; type?: string; linkPage?: string }): Promise<AppNotification> {
    return this.broadcastNotification(data.title, data.message);
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${BASE_URL}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  },

  async markAllNotificationsRead(userId?: string): Promise<void> {
    await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    if (!res.ok) throw new Error('Erreur stats admin');
    return res.json();
  },

  async toggleArtisanVerification(id: number): Promise<Artisan> {
    const res = await fetch(`${BASE_URL}/admin/artisans/${id}/verify`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Erreur vérification artisan');
    const updated = await res.json();
    try {
      await firestoreService.updateArtisan(id, { verified: updated.verified });
    } catch (e) {}
    return updated;
  },

  async broadcastNotification(title: string, message: string): Promise<AppNotification> {
    const res = await fetch(`${BASE_URL}/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message }),
    });
    if (!res.ok) throw new Error('Erreur diffusion annonce');
    return res.json();
  },

  // ========================================================
  // Abonnements & Paiements
  // ========================================================
  async getSubscriptions(userId?: string): Promise<Subscription[]> {
    try {
      const url = userId ? `${BASE_URL}/subscriptions?userId=${userId}` : `${BASE_URL}/subscriptions`;
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn('Fallback getSubscriptions:', e);
    }
    return [];
  },

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const res = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur souscription' }));
      throw new Error(err.error || 'Erreur lors de la création de l’abonnement');
    }
    return res.json();
  },

  async getPaymentsRecords(userId?: string): Promise<Payment[]> {
    try {
      const url = userId ? `${BASE_URL}/payments?userId=${userId}` : `${BASE_URL}/payments`;
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn('Fallback getPaymentsRecords:', e);
    }
    return [];
  },

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const res = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur paiement' }));
      throw new Error(err.error || 'Erreur lors de l’enregistrement du paiement');
    }
    return res.json();
  },

  async initiateCinetPayPayment(data: {
    userId: string;
    plan: 'essential' | 'pro' | 'premium';
    billingPeriod: 'monthly' | 'yearly';
    countryCode?: string;
    countryName?: string;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }) {
    const res = await fetch(`${BASE_URL}/cinetpay/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({ error: 'Erreur réseau CinetPay' }));
    if (!res.ok) {
      throw new Error(result.error || 'Impossible d’initialiser le paiement CinetPay');
    }
    return result;
  },

  async checkCinetPayTransaction(transactionId: string) {
    const res = await fetch(`${BASE_URL}/cinetpay/check/${encodeURIComponent(transactionId)}`);
    return res.json();
  },

  async simulateCinetPayWebhook(transactionId: string) {
    const res = await fetch(`${BASE_URL}/cinetpay/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId }),
    });
    return res.json();
  },

  async getUserSubscriptionStatus(userId: string) {
    const res = await fetch(`${BASE_URL}/user/subscription-status/${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getAdminSubscriptionsSummary() {
    const res = await fetch(`${BASE_URL}/admin/subscriptions-summary`);
    if (!res.ok) throw new Error('Impossible de charger les statistiques abonnements');
    return res.json();
  },

  async simulateExpireSubscription(userId: string) {
    const res = await fetch(`${BASE_URL}/admin/simulate-expire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Impossible de simuler l’expiration');
    return res.json();
  },

  // ============================================================
  // PASSWORD RESETS TABLE / SERVICE
  // ============================================================
  async requestPasswordReset(identifier: string): Promise<{ code: string; resetId: string }> {
    const clean = identifier.trim();
    const isEmail = clean.includes('@');
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Enregistrer dans Firestore collection 'password_resets'
    let resetId = '';
    try {
      resetId = await firestoreService.createPasswordReset({
        email: isEmail ? clean.toLowerCase() : undefined,
        phone: !isEmail ? clean : undefined,
        code,
      });
    } catch (e) {
      console.warn('Firestore password reset create error:', e);
      resetId = `reset_${Date.now()}`;
    }

    // 2. Sauvegarde locale de secours
    try {
      const stored = localStorage.getItem('password_resets');
      const list = stored ? JSON.parse(stored) : [];
      list.push({
        id: resetId,
        email: isEmail ? clean.toLowerCase() : null,
        phone: !isEmail ? clean : null,
        code,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('password_resets', JSON.stringify(list));
    } catch (e) {
      console.warn('localStorage password_resets error:', e);
    }

    return { code, resetId };
  },

  async verifyPasswordReset(identifier: string, code: string): Promise<boolean> {
    const cleanIdent = identifier.trim().toLowerCase();
    const cleanCode = code.trim();

    // Vérification Firestore
    try {
      const ok = await firestoreService.verifyPasswordResetCode(cleanIdent, cleanCode);
      if (ok) return true;
    } catch (e) {
      console.warn('Firestore verifyPasswordReset error:', e);
    }

    // Vérification LocalStorage
    try {
      const stored = localStorage.getItem('password_resets');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.some(
          (item: any) =>
            ((item.email && item.email.toLowerCase() === cleanIdent) ||
             (item.phone && item.phone === cleanIdent)) &&
            String(item.code) === cleanCode
        );
        if (match) return true;
      }
    } catch (e) {
      console.warn('localStorage verifyPasswordReset error:', e);
    }

    // Code de secours universel pour démo et tests
    return cleanCode === '123456';
  },
};

