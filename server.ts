import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import type { Artisan, MarketplaceService, Message, QuoteRequest, Transaction, AppNotification, User, SocialPost } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Netlify ZIP direct download
  app.get(['/artisan-pro-netlify.zip', '/api/download-netlify-zip'], (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'artisan-pro-netlify.zip');
    res.download(zipPath, 'artisan-pro-netlify.zip');
  });

  // Artisans endpoints
  app.get('/api/artisans', (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    const trade = (req.query.trade as string || '').toLowerCase().trim();
    const city = (req.query.city as string || '').toLowerCase().trim();
    const plan = (req.query.plan as string || '').toLowerCase().trim();

    let artisans = db.getArtisans();

    if (q) {
      artisans = artisans.filter((a) => {
        const full = `${a.name} ${a.trade} ${a.city} ${a.country} ${a.services.join(' ')} ${a.description}`.toLowerCase();
        return full.includes(q);
      });
    }

    if (trade) {
      artisans = artisans.filter((a) => a.trade.toLowerCase().includes(trade));
    }

    if (city) {
      artisans = artisans.filter((a) => a.city.toLowerCase().includes(city));
    }

    if (plan) {
      artisans = artisans.filter((a) => a.plan.toLowerCase() === plan);
    }

    // Sort: Premium first, then Pro, then Free, then by rating desc
    artisans.sort((a, b) => {
      const planWeight = { Premium: 3, Pro: 2, Free: 1 };
      const diff = planWeight[b.plan] - planWeight[a.plan];
      if (diff !== 0) return diff;
      return b.rating - a.rating;
    });

    res.json(artisans);
  });

  app.get('/api/artisans/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const artisan = db.getArtisanById(id);
    if (!artisan) {
      return res.status(404).json({ error: 'Artisan non trouvé' });
    }
    // Increment profile views
    db.updateArtisan(id, { profileViews: (artisan.profileViews || 0) + 1 });
    res.json(artisan);
  });

  app.post('/api/artisans', (req, res) => {
    const body = req.body;
    if (!body.name || !body.trade || !body.city) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: nom, métier, ville' });
    }

    const emojiTradeMap: Record<string, string> = {
      couturier: '👗',
      couturière: '👗',
      électricien: '⚡',
      electricien: '⚡',
      mécanicien: '🔧',
      mecanicien: '🔧',
      coiffeur: '💇🏾',
      coiffeuse: '💇🏾',
      maçon: '🧱',
      macon: '🧱',
      menuisier: '🪚',
      plombier: '🚿',
      peintre: '🎨',
      soudeur: '👨‍🏭',
    };

    const lowerTrade = body.trade.toLowerCase();
    let detectedEmoji = '🛠️';
    for (const [key, val] of Object.entries(emojiTradeMap)) {
      if (lowerTrade.includes(key)) {
        detectedEmoji = val;
        break;
      }
    }

    const newArtisan = db.createArtisan({
      name: body.name,
      trade: body.trade,
      city: body.city,
      country: body.country || 'Côte d’Ivoire',
      rating: 5.0,
      reviewsCount: 1,
      plan: (body.plan as any) || 'Free',
      emoji: body.emoji || detectedEmoji,
      services: Array.isArray(body.services) && body.services.length > 0 ? body.services : ['Prestation sur devis'],
      description: body.description || `Artisan professionnel spécialisé en ${body.trade} à ${body.city}. Travail soigné et devis rapide.`,
      phone: body.phone || '+225 00 00 00 00',
      email: body.email || `${body.name.toLowerCase().replace(/\s+/g, '.')}@artisanpro.africa`,
      lat: body.lat || 5.3484,
      lng: body.lng || -4.0180,
      verified: false,
      hourlyRate: body.hourlyRate || '10 000 FCFA',
      profileViews: 1,
      contactsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      experienceYears: body.experienceYears || 5,
      address: body.address || `${body.city}, ${body.country || 'Côte d’Ivoire'}`,
    });

    // Also register user account for this artisan
    db.createUser({
      id: `user-artisan-${newArtisan.id}`,
      name: newArtisan.name,
      email: newArtisan.email,
      role: 'artisan',
      phone: newArtisan.phone,
      city: newArtisan.city,
      country: newArtisan.country,
      artisanId: newArtisan.id,
      avatar: newArtisan.emoji,
    });

    // Create notification for admin
    db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: 'user-admin-1',
      title: 'Nouvelle inscription artisan',
      message: `${newArtisan.name} (${newArtisan.trade} - ${newArtisan.city}) vient de créer son profil. En attente de vérification.`,
      type: 'system',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'admin',
    });

    res.status(201).json(newArtisan);
  });

  app.put('/api/artisans/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const updated = db.updateArtisan(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Artisan non trouvé' });
    }
    res.json(updated);
  });

  app.delete('/api/artisans/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const deleted = db.deleteArtisan(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Artisan non trouvé' });
    }
    res.json({ success: true });
  });

  // Plans
  app.get('/api/plans', (req, res) => {
    res.json(db.getPlans());
  });

  // Authentication & Users
  app.get('/api/auth/users', (req, res) => {
    res.json(db.getUsers());
  });

  app.put(['/api/auth/users/:id', '/api/users/:id'], (req, res) => {
    const userId = req.params.id;
    const updates: Partial<User> = req.body;
    const updated = db.updateUser(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, user: updated });
  });

  app.patch(['/api/auth/users/:id', '/api/users/:id'], (req, res) => {
    const userId = req.params.id;
    const updates: Partial<User> = req.body;
    const updated = db.updateUser(userId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, user: updated });
  });

  // Publications endpoints (Serveur & persistance réelle côté serveur)
  app.get('/api/publications', (req, res) => {
    res.json(db.getPublications());
  });

  app.get('/api/publications/deleted-ids', (req, res) => {
    res.json(db.getDeletedPublicationIds());
  });

  app.post('/api/publications', (req, res) => {
    const post: SocialPost = req.body;
    if (!post || !post.id) {
      return res.status(400).json({ error: 'Données de publication invalides' });
    }
    const created = db.createPublication(post);
    res.json(created);
  });

  app.delete('/api/publications/:id', (req, res) => {
    const postId = req.params.id;
    const requestingUserId = (req.body?.userId || req.headers['x-user-id'] || req.query?.userId) as string | undefined;
    const targetPost = db.getPublicationById(postId);

    if (targetPost && requestingUserId) {
      const user = db.getUserById(requestingUserId);
      const isSuperAdm = user?.role === 'super_admin' || user?.role === 'admin';
      const isOwner =
        String(targetPost.userId) === String(requestingUserId) ||
        targetPost.userId === 'current-user' ||
        (user?.artisanId && targetPost.artisanId === user.artisanId);

      if (!isSuperAdm && !isOwner) {
        return res.status(403).json({
          error: 'Action refusée: Seul l\'auteur de la publication ou un administrateur peut supprimer ce contenu.',
        });
      }
    }

    // Effectuer la suppression réelle côté serveur
    db.deletePublication(postId);
    res.json({
      success: true,
      deletedId: postId,
      message: 'Publication supprimée avec succès côté serveur',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, role, userId } = req.body;
    let user: User | undefined;

    if (userId) {
      user = db.getUserById(userId);
    } else if (email) {
      user = db.getUserByEmail(email);
    } else if (role) {
      user = db.getUsers().find((u) => u.role === role);
    }

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides ou utilisateur introuvable.' });
    }

    let artisanData: Artisan | undefined;
    if (user.artisanId) {
      artisanData = db.getArtisanById(user.artisanId);
    }

    res.json({ user, artisan: artisanData });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, role, phone, city, country, trade, description } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nom et adresse email requis' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    let artisanId: number | undefined;
    let createdArtisan: Artisan | undefined;

    if (role === 'artisan' && trade) {
      createdArtisan = db.createArtisan({
        name,
        trade,
        city: city || 'Abidjan',
        country: country || 'Côte d’Ivoire',
        rating: 5.0,
        reviewsCount: 1,
        plan: 'Free',
        emoji: '🛠️',
        services: ['Prestation sur devis'],
        description: description || `Artisan ${trade} qualifié et disponible.`,
        phone: phone || '+225 00 00 00 00',
        email,
        lat: 5.3500,
        lng: -4.0100,
        verified: false,
        hourlyRate: '10 000 FCFA',
        profileViews: 1,
        contactsCount: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      });
      artisanId = createdArtisan.id;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: role || 'client',
      phone: phone || '+225 00 00 00 00',
      city: city || 'Abidjan',
      country: country || 'Côte d’Ivoire',
      artisanId,
      avatar: role === 'artisan' ? '🛠️' : '👤',
    };

    db.createUser(newUser);

    res.status(201).json({ user: newUser, artisan: createdArtisan });
  });

  // Services (Marketplace)
  app.get('/api/services', (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    const category = (req.query.category as string || '').toLowerCase().trim();
    const city = (req.query.city as string || '').toLowerCase().trim();

    let services = db.getServices();

    if (q) {
      services = services.filter((s) => {
        const full = `${s.title} ${s.description} ${s.artisanName} ${s.trade} ${s.city}`.toLowerCase();
        return full.includes(q);
      });
    }

    if (category && category !== 'tous') {
      services = services.filter((s) => s.category.toLowerCase() === category);
    }

    if (city && city !== 'toutes') {
      services = services.filter((s) => s.city.toLowerCase().includes(city));
    }

    res.json(services);
  });

  app.post('/api/services', (req, res) => {
    const body = req.body;
    const service: MarketplaceService = {
      id: `srv-${Date.now()}`,
      artisanId: body.artisanId,
      artisanName: body.artisanName,
      trade: body.trade,
      title: body.title,
      price: body.price,
      priceValue: body.priceValue || 15000,
      city: body.city,
      country: body.country || 'Côte d’Ivoire',
      description: body.description,
      category: body.category || 'Général',
      duration: body.duration || '24-48h',
      emoji: body.emoji || '✨',
    };
    db.createService(service);
    res.status(201).json(service);
  });

  // Messages
  app.get('/api/messages', (req, res) => {
    const artisanId = req.query.artisanId ? parseInt(req.query.artisanId as string, 10) : undefined;
    const clientId = req.query.clientId as string | undefined;
    const msgs = db.getMessages(artisanId, clientId);
    res.json(msgs);
  });

  app.post('/api/messages', (req, res) => {
    const { artisanId, clientId, text, senderId, senderName, senderRole } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message vide' });
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: `conv-${artisanId}-${clientId}`,
      senderId: senderId || clientId || 'user-client-1',
      senderName: senderName || 'Client',
      senderRole: senderRole || 'client',
      artisanId: parseInt(artisanId, 10),
      clientId: clientId || 'user-client-1',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    db.createMessage(newMsg);

    // Also increment contact count for the artisan if sent by client
    if (senderRole === 'client') {
      const art = db.getArtisanById(parseInt(artisanId, 10));
      if (art) {
        db.updateArtisan(art.id, { contactsCount: (art.contactsCount || 0) + 1 });
      }

      // Notify artisan
      db.createNotification({
        id: `notif-${Date.now()}`,
        recipientId: `user-artisan-${artisanId}`,
        title: `Nouveau message de ${senderName || 'un client'}`,
        message: text.length > 60 ? `${text.slice(0, 60)}...` : text,
        type: 'message',
        date: new Date().toISOString(),
        read: false,
        linkPage: 'messages',
      });
    }

    res.status(201).json(newMsg);
  });

  // Quotes (Devis)
  app.get('/api/quotes', (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    const artisanId = req.query.artisanId ? parseInt(req.query.artisanId as string, 10) : undefined;
    const quotes = db.getQuotes({ clientId, artisanId });
    res.json(quotes);
  });

  app.post('/api/quotes', (req, res) => {
    const { clientId, clientName, clientPhone, artisanId, artisanName, serviceTitle, description, estimatedPrice } = req.body;

    const quote: QuoteRequest = {
      id: `quote-${Date.now()}`,
      clientId: clientId || 'user-client-1',
      clientName: clientName || 'Client',
      clientPhone: clientPhone || '+225 00 00 00 00',
      artisanId: parseInt(artisanId, 10),
      artisanName: artisanName || 'Artisan',
      serviceTitle: serviceTitle || 'Demande de prestation personnalisée',
      description: description || 'Pas de détails fournis',
      status: 'en_attente',
      estimatedPrice: estimatedPrice || 'À évaluer',
      date: new Date().toISOString(),
    };

    db.createQuote(quote);

    // Notify artisan
    db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: `user-artisan-${artisanId}`,
      title: `Nouvelle demande de devis`,
      message: `${clientName || 'Un client'} demande un devis pour "${serviceTitle}".`,
      type: 'quote',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'account',
    });

    res.status(201).json(quote);
  });

  app.patch('/api/quotes/:id', (req, res) => {
    const { status } = req.body;
    const quote = db.updateQuoteStatus(req.params.id, status);
    if (!quote) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // Notify client
    db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: quote.clientId,
      title: `Mise à jour devis: ${quote.serviceTitle}`,
      message: `Votre artisan ${quote.artisanName} a marqué le devis comme : ${status.toUpperCase()}.`,
      type: 'quote',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'account',
    });

    res.json(quote);
  });

  // Free Registration Activation / Deprecated Paid Subscription
  app.post('/api/subscriptions/checkout', (req, res) => {
    const { artisanId, paymentMethod = 'Accès Gratuit' } = req.body;
    if (!artisanId) {
      return res.status(400).json({ error: 'Artisan ID requis' });
    }

    const artisan = db.getArtisanById(parseInt(artisanId, 10));
    if (!artisan) {
      return res.status(404).json({ error: 'Artisan non trouvé' });
    }

    const invoiceNumber = `FREE-${Date.now().toString().slice(-6)}`;

    // Create 0 FCFA record confirming free platform status
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      artisanId: artisan.id,
      artisanName: artisan.name,
      plan: 'Pro',
      amount: 0,
      currency: 'FCFA',
      method: paymentMethod || 'Accès Gratuit',
      status: 'reussi',
      date: new Date().toISOString(),
      invoiceNumber,
    };

    db.createTransaction(transaction);

    // Verify artisan with full access at zero cost
    db.updateArtisan(artisan.id, {
      plan: 'Pro',
      verified: true,
    });

    // Create notification
    db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: `user-artisan-${artisan.id}`,
      title: `Compte Artisan activé avec succès (100% Gratuit) !`,
      message: `Inscrit et connecté est gratuit : c'est le début ! Vous bénéficiez de la visibilité complète sans aucun frais.`,
      type: 'system',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'account',
    });

    res.json({
      success: true,
      transaction,
      artisan: db.getArtisanById(artisan.id),
      message: 'Inscription et connexion 100% gratuites ! Aucun paiement requis.',
    });
  });

  // Transactions (Restreint exclusivement aux administrateurs)
  app.get('/api/transactions', (req, res) => {
    const headerRole = (req.headers['x-user-role'] as string || '').toLowerCase();
    const queryRole = (req.query.role as string || '').toLowerCase();
    const role = headerRole || queryRole;

    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        error: 'Accès interdit. Seuls les administrateurs et super-administrateurs peuvent consulter les transactions récentes.',
      });
    }

    res.json(db.getTransactions());
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    const userId = req.query.userId as string | undefined;
    res.json(db.getNotifications(userId));
  });

  app.post('/api/notifications/read', (req, res) => {
    const { id } = req.body;
    db.markNotificationRead(id);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    const { userId } = req.body;
    db.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  // Admin endpoints
  app.get('/api/admin/stats', (req, res) => {
    res.json(db.getAdminStats());
  });

  app.post('/api/admin/artisans/:id/verify', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const artisan = db.getArtisanById(id);
    if (!artisan) {
      return res.status(404).json({ error: 'Artisan non trouvé' });
    }

    const newStatus = !artisan.verified;
    const updated = db.updateArtisan(id, { verified: newStatus });

    db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: `user-artisan-${id}`,
      title: newStatus ? 'Votre profil est désormais Vérifié !' : 'Statut de vérification mis à jour',
      message: newStatus
        ? 'Félicitations, vos documents ont été validés par l’administration Artisan Pro. Votre badge est actif.'
        : 'Votre statut de vérification a été réinitialisé par un administrateur.',
      type: 'system',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'account',
    });

    res.json(updated);
  });

  app.post('/api/admin/broadcast', (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Titre et message requis' });
    }

    const notif = db.createNotification({
      id: `notif-${Date.now()}`,
      recipientId: 'all',
      title,
      message,
      type: 'system',
      date: new Date().toISOString(),
      read: false,
      linkPage: 'home',
    });

    res.status(201).json(notif);
  });

  // ==========================================
  // Subscriptions & Payments API
  // ==========================================
  app.get('/api/subscriptions', (req, res) => {
    const { userId } = req.query;
    if (userId && typeof userId === 'string') {
      res.json(db.getUserSubscriptions(userId));
    } else {
      res.json(db.getSubscriptions());
    }
  });

  app.post('/api/subscriptions', (req, res) => {
    const { user_id, plan, price, currency = 'XOF', billing_period, status = 'pending', start_date, end_date, payment_provider, transaction_id } = req.body;
    if (!user_id || !plan || price === undefined || !billing_period) {
      return res.status(400).json({ error: 'Champs requis manquants pour la souscription' });
    }

    const sub = db.createSubscription({
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id,
      plan,
      price: Number(price),
      currency: 'XOF',
      billing_period,
      status,
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || new Date(Date.now() + (billing_period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      payment_provider,
      transaction_id,
    });

    res.status(201).json(sub);
  });

  app.patch('/api/subscriptions/:id', (req, res) => {
    const updated = db.updateSubscription(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Abonnement introuvable' });
    }
    res.json(updated);
  });

  app.get('/api/payments', (req, res) => {
    const { userId } = req.query;
    if (userId && typeof userId === 'string') {
      res.json(db.getUserPayments(userId));
    } else {
      res.json(db.getPayments());
    }
  });

  app.post('/api/payments', (req, res) => {
    const { user_id, subscription_id, amount, currency = 'XOF', payment_type, payment_method, provider, transaction_id, status = 'completed' } = req.body;
    if (!user_id || amount === undefined || !payment_type || !payment_method || !provider || !transaction_id) {
      return res.status(400).json({ error: 'Champs requis manquants pour le paiement' });
    }

    const payment = db.createPayment({
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id,
      subscription_id,
      amount: Number(amount),
      currency,
      payment_type,
      payment_method,
      provider,
      transaction_id,
      status,
    });

    res.status(201).json(payment);
  });

  // =========================================================================
  // HELPER SERVEUR: ACTIVATION OFFICIELLE ARTISAN APRÈS PAIEMENT CINETPAY CONFIRMÉ
  // Strictement côté serveur : rôle, statut abonnement, statut artisan, expiration
  // =========================================================================
  function activateArtisanSubscriptionServerSide(transactionId: string) {
    const payments = db.getPayments();
    const payment = payments.find((p) => p.transaction_id === transactionId);
    const subscriptions = db.getSubscriptions();
    const subscription = subscriptions.find((s) => s.transaction_id === transactionId);

    if (payment) {
      db.updatePayment(payment.id, { status: 'completed' });
    }

    if (subscription) {
      const durationDays = subscription.billing_period === 'yearly' ? 365 : 30;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      db.updateSubscription(subscription.id, {
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      const user = db.getUserById(subscription.user_id);
      if (user) {
        db.updateUser(user.id, {
          role: 'artisan',
          subscription_status: 'active',
          artisan_status: 'active',
          subscription_plan: subscription.plan,
          subscription_end_date: endDate.toISOString(),
        });

        // Ensure artisan profile is also activated in db.artisans
        const existingArtisans = db.getArtisans();
        const existingArtisan = existingArtisans.find(
          (a) =>
            (user.email && a.email?.toLowerCase() === user.email.toLowerCase()) ||
            (user.artisanId && a.id === user.artisanId)
        );

        const planLabel =
          subscription.plan === 'premium' ? 'Premium' : subscription.plan === 'pro' ? 'Pro' : 'Free';

        if (existingArtisan) {
          db.updateArtisan(existingArtisan.id, {
            plan: planLabel,
            verified: true,
          });
        } else {
          // Création de la fiche artisan officielle
          const newArtisan = db.createArtisan({
            name: user.name || 'Artisan Qualifié',
            trade: user.trade || 'Menuisier & Aménagement',
            city: user.city || 'Abidjan',
            country: user.country || 'Côte d’Ivoire',
            rating: 5.0,
            reviewsCount: 1,
            plan: planLabel,
            emoji: '🛠️',
            services: [user.trade || 'Prestations sur mesure'],
            description:
              user.bio || 'Artisan professionnel certifié ArtisanPro Afrique.',
            phone: user.phone || '+225 07 00 00 00',
            email: user.email || `artisan-${user.id}@artisanpro.africa`,
            lat: 5.345,
            lng: -4.024,
            verified: true,
            hourlyRate: '15 000 FCFA',
            experienceYears: 5,
            profileViews: 0,
            contactsCount: 0,
            joinedDate: new Date().toISOString(),
          });
          db.updateUser(user.id, { artisanId: newArtisan.id });
        }

        // Notification Système officielle
        db.createNotification({
          id: `notif-${Date.now()}`,
          recipientId: user.id,
          title: 'Félicitations ! Votre compte ArtisanPro est actif 🎉',
          message: `Votre abonnement ${subscription.plan.toUpperCase()} a été validé avec succès par CinetPay. Bienvenue dans votre espace ArtisanPro !`,
          type: 'payment',
          date: new Date().toISOString(),
          read: false,
          linkPage: 'account',
        });
      }
    }
  }

  // Initialisation du paiement CinetPay
  app.post('/api/cinetpay/initiate', async (req, res) => {
    try {
      const {
        userId,
        plan,
        billingPeriod,
        countryCode = 'CI',
        countryName = 'Côte d’Ivoire',
        paymentMethod = 'Orange Money',
        customerName = 'Artisan Client',
        customerPhone = '+225 0700000000',
        customerEmail = 'client@artisanpro.africa',
      } = req.body;

      if (!userId || !plan || !billingPeriod) {
        return res.status(400).json({ error: 'Champs requis manquants: userId, plan, billingPeriod' });
      }

      // Tarification officielle contrôlée côté serveur (Impossible à falsifier par le client)
      const PRICING = {
        essential: { monthly: 300, yearly: 4000 },
        pro: { monthly: 700, yearly: 8000 },
        premium: { monthly: 1000, yearly: 11000 },
      };

      const planPricing = PRICING[plan as 'essential' | 'pro' | 'premium'];
      if (!planPricing) {
        return res.status(400).json({ error: 'Plan d’abonnement invalide' });
      }

      const amount = billingPeriod === 'yearly' ? planPricing.yearly : planPricing.monthly;
      const transactionId = `CP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Enregistrement de l'abonnement en attente (status = pending)
      const sub = db.createSubscription({
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        user_id: String(userId),
        plan,
        price: amount,
        currency: 'XOF',
        billing_period: billingPeriod,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 3600 * 1000).toISOString(),
        payment_provider: 'CinetPay',
        transaction_id: transactionId,
      });

      // Enregistrement de la transaction de paiement en attente
      db.createPayment({
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        user_id: String(userId),
        subscription_id: sub.id,
        amount,
        currency: 'XOF',
        payment_type: 'subscription',
        payment_method: paymentMethod,
        provider: 'CinetPay',
        transaction_id: transactionId,
        status: 'pending',
      });

      const apiKey = process.env.CINETPAY_API_KEY;
      const siteId = process.env.CINETPAY_SITE_ID;

      // Si les clés de production ou sandbox CinetPay sont renseignées dans les variables d'environnement
      if (apiKey && siteId) {
        try {
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.get('host') || 'localhost:3000';
          const origin = `${protocol}://${host}`;

          const cinetPayPayload = {
            apikey: apiKey,
            site_id: siteId,
            transaction_id: transactionId,
            amount,
            currency: 'XOF',
            description: `Abonnement ArtisanPro ${plan.toUpperCase()} - ${billingPeriod === 'yearly' ? 'Annuel' : 'Mensuel'}`,
            notify_url: `${origin}/api/cinetpay/notify`,
            return_url: `${origin}/?page=abonnements&cinetpay_tx=${transactionId}`,
            channels: 'ALL',
            customer_id: String(userId),
            customer_name: (customerName || 'Artisan').split(' ')[0] || 'Artisan',
            customer_surname: (customerName || 'Artisan').split(' ').slice(1).join(' ') || 'Afrique',
            customer_phone_number: (customerPhone || '+22507000000').replace(/\s+/g, ''),
            customer_email: customerEmail || 'client@artisanpro.africa',
            customer_address: 'Afrique',
            customer_city: 'Abidjan',
            customer_country: (countryCode || 'CI').toUpperCase(),
            customer_state: (countryCode || 'CI').toUpperCase(),
            customer_zip_code: '00225',
          };

          const cpResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cinetPayPayload),
          });

          const cpData = await cpResponse.json();
          if (cpData.code === '201' && cpData.data?.payment_url) {
            return res.json({
              success: true,
              transaction_id: transactionId,
              payment_url: cpData.data.payment_url,
              payment_token: cpData.data.payment_token,
              amount,
              plan,
              billingPeriod,
              countryCode,
              paymentMethod,
            });
          } else {
            return res.status(400).json({
              success: false,
              error: cpData.message || cpData.description || 'Erreur CinetPay',
              transaction_id: transactionId,
            });
          }
        } catch (cpErr: any) {
          console.error('CinetPay API request failed:', cpErr);
          return res.status(502).json({
            success: false,
            error: 'Impossible de joindre la passerelle CinetPay: ' + (cpErr.message || ''),
            transaction_id: transactionId,
          });
        }
      }

      // Si pas encore de clés configurées dans l'environnement, retour de la session initialisée
      return res.json({
        success: true,
        transaction_id: transactionId,
        amount,
        plan,
        billingPeriod,
        countryCode,
        paymentMethod,
        requires_credentials: true,
        message: 'Initialisation réussie. En attente de validation CinetPay via webhook.',
        notify_url: '/api/cinetpay/notify',
      });
    } catch (err: any) {
      console.error('Initiate payment error:', err);
      res.status(500).json({ error: err.message || 'Erreur serveur' });
    }
  });

  // Webhook officiel CinetPay (IPN)
  // Un paiement n'est success que si CinetPay confirme via webhook
  app.post('/api/cinetpay/notify', async (req, res) => {
    try {
      const txId =
        req.body?.cpm_trans_id ||
        req.body?.transaction_id ||
        (req.query?.cpm_trans_id as string);

      if (!txId) {
        return res.status(400).json({ error: 'transaction_id requis' });
      }

      const apiKey = process.env.CINETPAY_API_KEY;
      const siteId = process.env.CINETPAY_SITE_ID;

      let isConfirmed = false;

      if (apiKey && siteId) {
        try {
          const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apikey: apiKey,
              site_id: siteId,
              transaction_id: txId,
            }),
          });
          const checkData = await checkRes.json();
          if (checkData?.code === '00' && checkData?.data?.status === 'ACCEPTED') {
            isConfirmed = true;
          }
        } catch (checkErr) {
          console.error('CinetPay check error:', checkErr);
        }
      } else {
        // En mode local sans clés réelles, confirmation via IPN simulé
        isConfirmed = true;
      }

      if (isConfirmed) {
        activateArtisanSubscriptionServerSide(txId);
        return res.status(200).json({
          status: 'ok',
          code: '00',
          message: 'Paiement confirmé avec succès via webhook CinetPay',
        });
      } else {
        return res.status(400).json({
          status: 'failed',
          message: 'Paiement non confirmé par CinetPay',
        });
      }
    } catch (err: any) {
      console.error('CinetPay notify webhook error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vérification de statut en polling par le client
  app.get('/api/cinetpay/check/:transactionId', async (req, res) => {
    const txId = req.params.transactionId;
    const payment = db.getPayments().find((p) => p.transaction_id === txId);
    const subscription = db.getSubscriptions().find((s) => s.transaction_id === txId);

    if (!payment || !subscription) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    if (subscription.status === 'active' && payment.status === 'completed') {
      const user = db.getUserById(subscription.user_id);
      return res.json({
        status: 'completed',
        subscription_status: 'active',
        role: user?.role || 'artisan',
        artisan_status: user?.artisan_status || 'active',
        message: 'Paiement déjà confirmé',
      });
    }

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;
    if (apiKey && siteId) {
      try {
        const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: apiKey,
            site_id: siteId,
            transaction_id: txId,
          }),
        });
        const checkData = await checkRes.json();
        if (checkData?.code === '00' && checkData?.data?.status === 'ACCEPTED') {
          activateArtisanSubscriptionServerSide(txId);
          return res.json({
            status: 'completed',
            subscription_status: 'active',
            role: 'artisan',
            artisan_status: 'active',
            message: 'Paiement confirmé avec succès par CinetPay',
          });
        }
      } catch (e) {
        console.warn('CinetPay polling error:', e);
      }
    }

    return res.json({
      status: payment.status,
      subscription_status: subscription.status,
    });
  });

  // Endpoint de simulation webhook pour démonstration ou test
  app.post('/api/cinetpay/simulate-webhook', (req, res) => {
    const { transaction_id } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ error: 'transaction_id requis' });
    }
    activateArtisanSubscriptionServerSide(transaction_id);
    const payment = db.getPayments().find((p) => p.transaction_id === transaction_id);
    const subscription = db.getSubscriptions().find((s) => s.transaction_id === transaction_id);
    const user = subscription ? db.getUserById(subscription.user_id) : null;

    res.json({
      success: true,
      message: 'Simulation webhook CinetPay exécutée avec succès',
      payment,
      subscription,
      user: user
        ? {
            id: user.id,
            role: user.role,
            subscription_status: user.subscription_status,
            artisan_status: user.artisan_status,
            subscription_plan: user.subscription_plan,
            subscription_end_date: user.subscription_end_date,
          }
        : null,
    });
  });

  // Endpoint de test / démo pour simuler l'expiration d'un abonnement côté serveur
  app.post('/api/admin/simulate-expire', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    db.updateUser(user.id, {
      subscription_status: 'expired',
      artisan_status: 'expired',
      subscription_end_date: yesterday,
    });

    const userSubs = db.getUserSubscriptions(userId);
    for (const s of userSubs) {
      if (s.status === 'active') {
        db.updateSubscription(s.id, { status: 'expired', end_date: yesterday });
      }
    }

    res.json({
      success: true,
      message: 'Abonnement marqué comme expiré côté serveur',
      user: {
        id: user.id,
        role: user.role,
        subscription_status: 'expired',
        artisan_status: 'expired',
        subscription_plan: user.subscription_plan,
        subscription_end_date: yesterday,
      },
    });
  });

  // Statut Abonnement & Expiration contrôlé strictement côté serveur
  app.get('/api/user/subscription-status/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Contrôle d'expiration strict côté serveur
    let isExpired = false;
    if (user.subscription_end_date && new Date(user.subscription_end_date).getTime() < Date.now()) {
      isExpired = true;
      db.updateUser(user.id, {
        subscription_status: 'expired',
        artisan_status: 'expired',
      });
      user.subscription_status = 'expired';
      user.artisan_status = 'expired';

      const userSubs = db.getUserSubscriptions(userId);
      for (const s of userSubs) {
        if (s.status === 'active') {
          db.updateSubscription(s.id, { status: 'expired' });
        }
      }
    }

    const subscriptions = db.getUserSubscriptions(userId);
    const payments = db.getUserPayments(userId);

    res.json({
      userId: user.id,
      role: user.role,
      subscription_status: user.subscription_status || 'none',
      artisan_status: user.artisan_status || 'inactive',
      subscription_plan: user.subscription_plan,
      subscription_end_date: user.subscription_end_date,
      isExpired,
      canAccessProFeatures: user.subscription_status === 'active',
      subscriptions,
      payments,
    });
  });

  // Synthèse Abonnements pour Tableau de bord Super Admin
  app.get('/api/admin/subscriptions-summary', (req, res) => {
    const subscriptions = db.getSubscriptions();
    const payments = db.getPayments();
    const users = db.getUsers();

    const now = Date.now();
    let totalActive = 0;
    let essentialActive = 0;
    let proActive = 0;
    let premiumActive = 0;
    let expiredCount = 0;

    for (const s of subscriptions) {
      const isPast = s.end_date && new Date(s.end_date).getTime() < now;
      if (s.status === 'expired' || isPast) {
        expiredCount++;
      } else if (s.status === 'active') {
        totalActive++;
        if (s.plan === 'essential') essentialActive++;
        else if (s.plan === 'pro') proActive++;
        else if (s.plan === 'premium') premiumActive++;
      }
    }

    let successfulPayments = 0;
    let failedPayments = 0;
    let totalRevenueFCFA = 0;
    const byPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    const byCountry: Record<string, { count: number; revenue: number }> = {};

    for (const p of payments) {
      const isSuccess = p.status === 'completed' || p.status === 'reussi';
      if (isSuccess) {
        successfulPayments++;
        totalRevenueFCFA += Number(p.amount) || 0;

        const method = p.payment_method || 'Mobile Money';
        if (!byPaymentMethod[method]) byPaymentMethod[method] = { count: 0, revenue: 0 };
        byPaymentMethod[method].count++;
        byPaymentMethod[method].revenue += Number(p.amount) || 0;

        const user = users.find((u) => u.id === p.user_id || String(u.id) === String(p.user_id));
        const country = user?.country || 'Côte d’Ivoire';
        if (!byCountry[country]) byCountry[country] = { count: 0, revenue: 0 };
        byCountry[country].count++;
        byCountry[country].revenue += Number(p.amount) || 0;
      } else if (p.status === 'failed' || p.status === 'echoue') {
        failedPayments++;
      }
    }

    res.json({
      totalActive,
      essentialActive,
      proActive,
      premiumActive,
      expiredCount,
      successfulPayments,
      failedPayments,
      totalRevenueFCFA,
      byCountry,
      byPaymentMethod,
      subscriptions,
      payments,
    });
  });

  // Vite middleware for development or static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Artisan Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
