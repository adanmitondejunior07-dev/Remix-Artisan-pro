import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../firebase/config.ts';
import type { Artisan, User, QuoteRequest, Message, CallRecord, SocialPost, PostComment } from '../types.ts';
import {
  INITIAL_ARTISANS,
  INITIAL_CLIENTS,
  INITIAL_DEVIS,
  INITIAL_MESSAGES,
  INITIAL_ADMINS,
} from '../data/initialData.ts';
import { INITIAL_POSTS } from '../data/socialFeedData.ts';

// Collection references
const ARTISANS_COL = 'artisans';
const CLIENTS_COL = 'clients';
const DEVIS_COL = 'devis';
const MESSAGES_COL = 'messages';
const ADMINS_COL = 'admins';
const POSTS_COL = 'posts';
const PUBLICATIONS_COL = 'publications';
const COMMENTAIRES_COL = 'commentaires';
const PASSWORD_RESETS_COL = 'password_resets';

let isSeedingArtisans = false;
let isSeedingClients = false;
let isSeedingDevis = false;
let isSeedingMessages = false;
let isSeedingAdmins = false;

export const firestoreService = {
  // ==========================================
  // ARTISANS COLLECTION
  // ==========================================
  async getArtisans(): Promise<Artisan[]> {
    try {
      const colRef = collection(firestore, ARTISANS_COL);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        if (!isSeedingArtisans) {
          isSeedingArtisans = true;
          // Seed default artisans into Firestore for permanent persistence
          try {
            await Promise.all(
              INITIAL_ARTISANS.map((artisan) =>
                setDoc(doc(firestore, ARTISANS_COL, String(artisan.id)), {
                  ...artisan,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              )
            );
          } finally {
            isSeedingArtisans = false;
          }
        }
        return INITIAL_ARTISANS;
      }

      const list: Artisan[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        list.push({
          ...data,
          id: Number(data.id) || Number(d.id) || 1,
        });
      });

      // Prioritize artisans PRO with active subscription (abonnement_actif = true) in first position, then by rating
      return list.sort((a, b) => {
        const aActive = a.abonnement_actif ? 1 : 0;
        const bActive = b.abonnement_actif ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return (b.rating || 0) - (a.rating || 0);
      });
    } catch (err) {
      console.warn('Firestore getArtisans fallback to initial data:', err);
      return INITIAL_ARTISANS;
    }
  },

  async getArtisanById(id: number): Promise<Artisan | null> {
    try {
      const docRef = doc(firestore, ARTISANS_COL, String(id));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
          ...data,
          id: Number(data.id) || id,
        };
      }
      return null;
    } catch (err) {
      console.error('Firestore getArtisanById error:', err);
      return null;
    }
  },

  async saveArtisan(artisan: Partial<Artisan> & { name: string; trade: string }): Promise<Artisan> {
    const existing = await this.getArtisans();
    const newId = artisan.id || (existing.length > 0 ? Math.max(...existing.map((a) => a.id)) + 1 : 1);

    const fullArtisan: Artisan = {
      id: newId,
      name: artisan.name,
      trade: artisan.trade,
      city: artisan.city || 'Abidjan',
      country: artisan.country || 'Côte d’Ivoire',
      rating: artisan.rating ?? 5.0,
      reviewsCount: artisan.reviewsCount ?? 1,
      plan: artisan.plan || 'Pro',
      emoji: artisan.emoji || '🛠️',
      services: artisan.services && artisan.services.length ? artisan.services : ['Prestation générale'],
      description: artisan.description || `Artisan professionnel en ${artisan.trade}`,
      phone: artisan.phone || '+225 00 00 00 00',
      email: artisan.email || `${artisan.name.toLowerCase().replace(/\s+/g, '.')}@artisanpro.africa`,
      lat: artisan.lat ?? 5.3599,
      lng: artisan.lng ?? -3.987,
      verified: artisan.verified ?? true,
      hourlyRate: artisan.hourlyRate || '10 000 FCFA',
      profileViews: artisan.profileViews ?? 12,
      contactsCount: artisan.contactsCount ?? 1,
      joinedDate: artisan.joinedDate || new Date().toISOString().split('T')[0],
      experienceYears: artisan.experienceYears ?? 5,
      address: artisan.address || `${artisan.city || 'Abidjan'}, ${artisan.country || 'Afrique'}`,
    };

    const docRef = doc(firestore, ARTISANS_COL, String(newId));
    await setDoc(docRef, {
      ...fullArtisan,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return fullArtisan;
  },

  async updateArtisan(id: number, data: Partial<Artisan>): Promise<Artisan | null> {
    try {
      const docRef = doc(firestore, ARTISANS_COL, String(id));
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return await this.getArtisanById(id);
    } catch (err) {
      console.error('Firestore updateArtisan error:', err);
      return null;
    }
  },

  async deleteArtisan(id: number): Promise<void> {
    try {
      const docRef = doc(firestore, ARTISANS_COL, String(id));
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteArtisan error:', err);
    }
  },

  onArtisansChange(callback: (artisans: Artisan[]) => void): Unsubscribe {
    const colRef = collection(firestore, ARTISANS_COL);
    return onSnapshot(colRef, (snapshot) => {
      const list: Artisan[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        list.push({
          ...data,
          id: Number(data.id) || Number(d.id) || 1,
        });
      });
      if (list.length > 0) {
        callback(list.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
      }
    });
  },

  // ==========================================
  // CLIENTS COLLECTION
  // ==========================================
  async getClients(): Promise<User[]> {
    try {
      const colRef = collection(firestore, CLIENTS_COL);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        if (!isSeedingClients) {
          isSeedingClients = true;
          try {
            await Promise.all(
              INITIAL_CLIENTS.map((client) =>
                setDoc(doc(firestore, CLIENTS_COL, client.id), {
                  ...client,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              )
            );
          } finally {
            isSeedingClients = false;
          }
        }
        return INITIAL_CLIENTS;
      }

      const list: User[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as User);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getClients fallback to initial data:', err);
      return INITIAL_CLIENTS;
    }
  },

  async saveClient(user: User): Promise<User> {
    const docRef = doc(firestore, CLIENTS_COL, user.id);
    await setDoc(docRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return user;
  },

  /**
   * UPLOAD PHOTO DE PROFIL
   * Règle absolue : TOUJOURS set(..., { merge: true }) ou updateDoc().
   * Ne touche à AUCUN autre champ (la bannière / coverUrl / bannerUrl reste intacte).
   */
  async uploadProfilePhoto(id: string | number, photoUrl: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const strId = String(id);

    // 1. Mise à jour dans collection 'clients'
    try {
      const clientRef = doc(firestore, CLIENTS_COL, strId);
      await setDoc(clientRef, {
        photoUrl,
        avatarUrl: photoUrl,
        avatar: photoUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadProfilePhoto clients error:', err);
    }

    // 2. Mise à jour dans collection 'users'
    try {
      const userRef = doc(firestore, 'users', strId);
      await setDoc(userRef, {
        photoUrl,
        avatarUrl: photoUrl,
        avatar: photoUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadProfilePhoto users error:', err);
    }

    // 3. Si c'est un artisan, mise à jour dans collection 'artisans'
    try {
      const artisanRef = doc(firestore, ARTISANS_COL, strId);
      await setDoc(artisanRef, {
        photoUrl,
        avatarUrl: photoUrl,
        avatar: photoUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadProfilePhoto artisans error:', err);
    }
  },

  /**
   * UPLOAD BANNIÈRE / COVER PHOTO
   * Règle absolue : TOUJOURS set(..., { merge: true }) ou updateDoc().
   * Ne touche à AUCUN autre champ (la photo de profil / photoUrl / avatarUrl reste intacte).
   */
  async uploadCoverPhoto(id: string | number, coverUrl: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const strId = String(id);

    // 1. Mise à jour dans collection 'clients'
    try {
      const clientRef = doc(firestore, CLIENTS_COL, strId);
      await setDoc(clientRef, {
        coverUrl,
        bannerUrl: coverUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadCoverPhoto clients error:', err);
    }

    // 2. Mise à jour dans collection 'users'
    try {
      const userRef = doc(firestore, 'users', strId);
      await setDoc(userRef, {
        coverUrl,
        bannerUrl: coverUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadCoverPhoto users error:', err);
    }

    // 3. Si c'est un artisan, mise à jour dans collection 'artisans'
    try {
      const artisanRef = doc(firestore, ARTISANS_COL, strId);
      await setDoc(artisanRef, {
        coverUrl,
        bannerUrl: coverUrl,
        updatedAt: timestamp,
      }, { merge: true });
    } catch (err) {
      console.warn('uploadCoverPhoto artisans error:', err);
    }
  },

  async getClientById(id: string): Promise<User | null> {
    try {
      const docRef = doc(firestore, CLIENTS_COL, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (err) {
      console.error('Firestore getClientById error:', err);
      return null;
    }
  },

  async deleteClient(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, CLIENTS_COL, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteClient error:', err);
    }
  },

  // ==========================================
  // DEVIS (QUOTES) COLLECTION
  // ==========================================
  async getDevis(params?: { clientId?: string; artisanId?: number }): Promise<QuoteRequest[]> {
    try {
      const colRef = collection(firestore, DEVIS_COL);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        if (!isSeedingDevis) {
          isSeedingDevis = true;
          try {
            await Promise.all(
              INITIAL_DEVIS.map((devis) =>
                setDoc(doc(firestore, DEVIS_COL, devis.id), {
                  ...devis,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              )
            );
          } finally {
            isSeedingDevis = false;
          }
        }
        return INITIAL_DEVIS.filter((d) => {
          if (params?.clientId && d.clientId !== params.clientId) return false;
          if (params?.artisanId && d.artisanId !== params.artisanId) return false;
          return true;
        });
      }

      let list: QuoteRequest[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as QuoteRequest);
      });

      if (params?.clientId) {
        list = list.filter((q) => q.clientId === params.clientId);
      }
      if (params?.artisanId) {
        list = list.filter((q) => q.artisanId === params.artisanId);
      }

      return list.sort(
        (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );
    } catch (err) {
      console.warn('Firestore getDevis fallback:', err);
      return INITIAL_DEVIS;
    }
  },

  async createDevis(data: Partial<QuoteRequest>): Promise<QuoteRequest> {
    const devisId = data.id || `devis-${Date.now()}`;
    const newDevis: QuoteRequest = {
      id: devisId,
      clientId: data.clientId || 'user-client-1',
      clientName: data.clientName || 'Client',
      clientPhone: data.clientPhone || '+225 00 00 00 00',
      artisanId: data.artisanId || 1,
      artisanName: data.artisanName || 'Artisan',
      serviceTitle: data.serviceTitle || 'Demande de prestation',
      description: data.description || 'Devis détaillé demandé',
      estimatedPrice: data.estimatedPrice || 'Sur devis',
      status: data.status || 'en_attente',
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: data.createdAt || new Date().toISOString(),
    };

    const docRef = doc(firestore, DEVIS_COL, devisId);
    await setDoc(docRef, {
      ...newDevis,
      updatedAt: new Date().toISOString(),
    });

    return newDevis;
  },

  async updateDevisStatus(id: string, status: QuoteRequest['status']): Promise<void> {
    try {
      const docRef = doc(firestore, DEVIS_COL, id);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore updateDevisStatus error:', err);
    }
  },

  onDevisChange(callback: (devis: QuoteRequest[]) => void): Unsubscribe {
    const colRef = collection(firestore, DEVIS_COL);
    return onSnapshot(colRef, (snapshot) => {
      const list: QuoteRequest[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as QuoteRequest);
      });
      callback(
        list.sort(
          (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        )
      );
    });
  },

  // ==========================================
  // MESSAGES COLLECTION
  // ==========================================
  async getMessages(params?: { artisanId?: number; clientId?: string }): Promise<Message[]> {
    try {
      const colRef = collection(firestore, MESSAGES_COL);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        if (!isSeedingMessages) {
          isSeedingMessages = true;
          try {
            await Promise.all(
              INITIAL_MESSAGES.map((msg) =>
                setDoc(doc(firestore, MESSAGES_COL, msg.id), {
                  ...msg,
                  createdAt: new Date().toISOString(),
                })
              )
            );
          } finally {
            isSeedingMessages = false;
          }
        }
        return INITIAL_MESSAGES;
      }

      let list: Message[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Message);
      });

      if (params?.artisanId) {
        list = list.filter((m) => m.artisanId === params.artisanId);
      }
      if (params?.clientId) {
        list = list.filter((m) => m.clientId === params.clientId);
      }

      return list.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (err) {
      console.warn('Firestore getMessages fallback:', err);
      return INITIAL_MESSAGES;
    }
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
    const randomSuffix =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const msgId = `msg-${randomSuffix}`;
    const newMsg: Message = {
      id: msgId,
      artisanId: data.artisanId,
      clientId: data.clientId,
      text: data.text,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      timestamp: new Date().toISOString(),
      read: false,
      ...(data.callInfo ? { callInfo: data.callInfo } : {}),
    };

    const docRef = doc(firestore, MESSAGES_COL, msgId);
    await setDoc(docRef, {
      ...newMsg,
      createdAt: new Date().toISOString(),
    });

    return newMsg;
  },

  onMessagesChange(callback: (messages: Message[]) => void): Unsubscribe {
    const colRef = collection(firestore, MESSAGES_COL);
    return onSnapshot(colRef, (snapshot) => {
      const map = new Map<string, Message>();
      snapshot.forEach((d) => {
        const data = d.data() as Message;
        const id = data.id || d.id;
        map.set(id, { ...data, id });
      });
      const list = Array.from(map.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      callback(list);
    });
  },

  // ==========================================
  // CALL HISTORY (VOIP)
  // ==========================================
  async recordCall(call: Omit<CallRecord, 'id'>): Promise<CallRecord> {
    const randomSuffix =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const callId = `call-${randomSuffix}`;
    const newCall: CallRecord = {
      ...call,
      id: callId,
    };

    try {
      const docRef = doc(firestore, 'calls', callId);
      await setDoc(docRef, {
        ...newCall,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore call record fallback:', e);
    }

    // Also persist in localStorage for instant offline access and profile linking
    try {
      if (typeof window !== 'undefined') {
        const storageKey = `artisanpro_calls_${call.artisanId}`;
        const existing: CallRecord[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify([newCall, ...existing]));
      }
    } catch (e) {
      console.warn('localStorage calls error:', e);
    }

    return newCall;
  },

  async getCallHistory(artisanId: number): Promise<CallRecord[]> {
    const list: CallRecord[] = [];
    try {
      const colRef = collection(firestore, 'calls');
      const q = query(colRef, where('artisanId', '==', artisanId));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        list.push(d.data() as CallRecord);
      });
    } catch (e) {
      console.warn('Firestore getCallHistory error:', e);
    }

    // Merge with localStorage
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `artisanpro_calls_${artisanId}`;
        const local: CallRecord[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const map = new Map<string, CallRecord>();
        [...list, ...local].forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (err) {
        console.warn('merge local calls error:', err);
      }
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // ==========================================
  // ADMINS TABLE / COLLECTION ('admins')
  // ==========================================
  async getAdmins(): Promise<any[]> {
    try {
      const colRef = collection(firestore, ADMINS_COL);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        if (!isSeedingAdmins) {
          isSeedingAdmins = true;
          try {
            await Promise.all(
              INITIAL_ADMINS.map((adm) =>
                setDoc(doc(firestore, ADMINS_COL, adm.id), {
                  ...adm,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              )
            );
          } finally {
            isSeedingAdmins = false;
          }
        }
        return INITIAL_ADMINS;
      }

      const list: any[] = [];
      snapshot.forEach((d) => {
        list.push(d.data());
      });
      return list;
    } catch (err) {
      console.warn('Firestore getAdmins fallback to INITIAL_ADMINS:', err);
      return INITIAL_ADMINS;
    }
  },

  async saveAdmin(adminData: any): Promise<any> {
    try {
      const docRef = doc(firestore, ADMINS_COL, adminData.id || `admin-${Date.now()}`);
      await setDoc(
        docRef,
        {
          ...adminData,
          role: 'super_admin',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return adminData;
    } catch (err) {
      console.warn('Firestore saveAdmin fallback:', err);
      return adminData;
    }
  },

  // ==========================================
  // PUBLICATIONS & POSTS (Global Social Feed)
  // Flux provenant de la collection 'posts' dans Firestore (trié par date décroissante)
  // ==========================================
  async getPublications(): Promise<SocialPost[]> {
    try {
      // 1. Essayer la collection 'posts'
      const postsColRef = collection(firestore, POSTS_COL);
      const snapshot = await getDocs(postsColRef);
      if (!snapshot.empty) {
        const list: SocialPost[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as SocialPost);
        });
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // 2. Repli vers collection 'publications' si 'posts' est vide
      const pubColRef = collection(firestore, PUBLICATIONS_COL);
      const pubSnap = await getDocs(pubColRef);
      if (!pubSnap.empty) {
        const list: SocialPost[] = [];
        pubSnap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as SocialPost);
        });
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('allPosts') || localStorage.getItem('artisanpro_social_posts');
          if (local) return JSON.parse(local);
        } catch {}
      }
      return INITIAL_POSTS;
    } catch (err) {
      console.warn('Firestore getPublications fallback:', err);
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('allPosts') || localStorage.getItem('artisanpro_social_posts');
          if (local) return JSON.parse(local);
        } catch {}
      }
      return INITIAL_POSTS;
    }
  },

  async savePublication(post: SocialPost): Promise<void> {
    const timestamp = new Date().toISOString();
    const dataToSave = {
      ...post,
      updatedAt: timestamp,
    };
    try {
      // Écriture prioritaire dans la collection 'posts'
      const postDocRef = doc(firestore, POSTS_COL, post.id);
      await setDoc(postDocRef, dataToSave, { merge: true });

      // Synchronisation de compatibilité avec 'publications'
      try {
        const pubDocRef = doc(firestore, PUBLICATIONS_COL, post.id);
        await setDoc(pubDocRef, dataToSave, { merge: true });
      } catch {}
    } catch (err) {
      console.warn('Firestore savePublication error:', err);
    }
  },

  async deletePublication(postId: string): Promise<void> {
    try {
      try {
        const postDocRef = doc(firestore, POSTS_COL, postId);
        await deleteDoc(postDocRef);
      } catch {}
      const docRef = doc(firestore, PUBLICATIONS_COL, postId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deletePublication error:', err);
      throw err;
    }
  },

  async updatePublication(postId: string, updates: Partial<SocialPost>): Promise<void> {
    try {
      try {
        const postDocRef = doc(firestore, POSTS_COL, postId);
        await setDoc(postDocRef, updates, { merge: true });
      } catch {}
      const docRef = doc(firestore, PUBLICATIONS_COL, postId);
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.warn('Firestore updatePublication error:', err);
      throw err;
    }
  },

  onPublicationsChange(callback: (posts: SocialPost[]) => void): Unsubscribe {
    try {
      const colRef = collection(firestore, POSTS_COL);
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: SocialPost[] = [];
            snapshot.forEach((d) => {
              list.push({ ...d.data(), id: d.id } as SocialPost);
            });
            const sorted = list.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            callback(sorted);
          } else {
            // Si posts est vide, écouter publications
            try {
              const pubRef = collection(firestore, PUBLICATIONS_COL);
              onSnapshot(pubRef, (pubSnap) => {
                if (!pubSnap.empty) {
                  const list: SocialPost[] = [];
                  pubSnap.forEach((d) => {
                    list.push({ ...d.data(), id: d.id } as SocialPost);
                  });
                  callback(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
              });
            } catch {}
          }
        },
        (err) => {
          console.warn('onPublicationsChange snapshot error:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  // ==========================================
  // COMMENTAIRES (Threaded Comments)
  // ==========================================
  async getComments(postId?: string): Promise<PostComment[]> {
    try {
      const colRef = collection(firestore, COMMENTAIRES_COL);
      const snapshot = await getDocs(colRef);
      const list: PostComment[] = [];
      snapshot.forEach((d) => {
        const item = { ...d.data(), id: d.id } as PostComment;
        if (!postId || item.postId === postId) {
          list.push(item);
        }
      });
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      console.warn('Firestore getComments fallback:', err);
      return [];
    }
  },

  async saveComment(comment: PostComment): Promise<void> {
    try {
      const docRef = doc(firestore, COMMENTAIRES_COL, comment.id);
      await setDoc(
        docRef,
        {
          ...comment,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore saveComment error:', err);
    }
  },

  onCommentsChange(postId: string | null, callback: (comments: PostComment[]) => void): Unsubscribe {
    try {
      const colRef = collection(firestore, COMMENTAIRES_COL);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: PostComment[] = [];
          snapshot.forEach((d) => {
            const item = { ...d.data(), id: d.id } as PostComment;
            if (!postId || item.postId === postId) {
              list.push(item);
            }
          });
          callback(list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        },
        (err) => {
          console.warn('onCommentsChange snapshot error:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  // ==========================================
  // PASSWORD RESETS (collection 'password_resets')
  // ==========================================
  async createPasswordReset(data: { email?: string; phone?: string; code: string }): Promise<string> {
    try {
      const id = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(firestore, PASSWORD_RESETS_COL, id);
      await setDoc(docRef, {
        id,
        email: data.email || null,
        phone: data.phone || null,
        code: String(data.code),
        created_at: new Date().toISOString(),
      });
      return id;
    } catch (err) {
      console.warn('createPasswordReset error:', err);
      return `local_reset_${Date.now()}`;
    }
  },

  async verifyPasswordResetCode(identifier: string, code: string): Promise<boolean> {
    try {
      const colRef = collection(firestore, PASSWORD_RESETS_COL);
      const snapshot = await getDocs(colRef);
      const cleanIdent = identifier.trim().toLowerCase();
      const cleanCode = code.trim();

      for (const d of snapshot.docs) {
        const data = d.data();
        const dEmail = (data.email || '').toLowerCase().trim();
        const dPhone = (data.phone || '').trim();
        if ((dEmail === cleanIdent || dPhone === cleanIdent) && String(data.code) === cleanCode) {
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('verifyPasswordResetCode error:', err);
      return false;
    }
  },
};
