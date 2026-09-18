import fs from 'fs';
import path from 'path';
import type {
  Artisan,
  Plan,
  User,
  MarketplaceService,
  Message,
  QuoteRequest,
  Transaction,
  AppNotification,
  Subscription,
  Payment,
  SocialPost,
} from '../src/types.ts';

const DB_FILE = path.join(process.cwd(), 'data', 'artisan_pro_db.json');

export interface DatabaseData {
  artisans: Artisan[];
  plans: Plan[];
  users: User[];
  services: MarketplaceService[];
  messages: Message[];
  quotes: QuoteRequest[];
  transactions: Transaction[];
  notifications: AppNotification[];
  subscriptions: Subscription[];
  payments: Payment[];
  publications?: SocialPost[];
  deletedPublicationIds?: string[];
}

const defaultPlans: Plan[] = [
  {
    name: 'Free',
    price: '0 FCFA',
    priceNumber: 0,
    desc: 'Pour commencer',
    features: [
      'Profil de base',
      'Présence dans la recherche',
      'Messagerie standard (max 5 contacts)',
      '1 service listé',
    ],
  },
  {
    name: 'Pro',
    price: '5 000 FCFA/mois',
    priceNumber: 5000,
    desc: 'Pour développer son activité',
    features: [
      'Tout le forfait Free',
      'Profil prioritaire dans les résultats',
      'Statistiques de visites et contacts',
      'Jusqu’à 8 services listés',
      'Badge Pro vérifié',
      'Devis directs illimités',
    ],
    featured: true,
  },
  {
    name: 'Premium',
    price: '10 000 FCFA/mois',
    priceNumber: 10000,
    desc: 'Pour maximiser sa visibilité',
    features: [
      'Tout le forfait Pro',
      'Mise en avant sur la page d’accueil',
      'Priorité absolue dans les résultats géolocalisés',
      'Badge Premium doré',
      'Services illimités dans la Marketplace',
      'Support commercial & assistance VIP',
    ],
  },
];

const defaultArtisans: Artisan[] = [
  {
    id: 1,
    name: 'Awa Koné',
    trade: 'Couturière',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    rating: 4.9,
    reviewsCount: 48,
    plan: 'Premium',
    emoji: '👗',
    services: ['Robe sur mesure', 'Tenue africaine', 'Retouches'],
    description: 'Atelier de haute couture africaine et moderne. Plus de 12 ans d’expérience dans la création de robes de cérémonie, boubous brodés et ensembles contemporains.',
    phone: '+225 07 45 67 89',
    email: 'awa.kone@artisanpro.africa',
    lat: 5.3599,
    lng: -3.9870,
    verified: true,
    hourlyRate: '15 000 FCFA',
    profileViews: 1420,
    contactsCount: 128,
    joinedDate: '2024-01-15',
    experienceYears: 12,
    address: 'Cocody Cité des Arts, Abidjan',
  },
  {
    id: 2,
    name: 'Moussa Traoré',
    trade: 'Électricien',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    rating: 4.8,
    reviewsCount: 39,
    plan: 'Pro',
    emoji: '⚡',
    services: ['Installation', 'Dépannage', 'Tableau électrique'],
    description: 'Artisan électricien certifié bâtiment et industrie. Interventions d’urgence 24/7 pour pannes électriques, conformité et installations solaires.',
    phone: '+225 05 32 14 56',
    email: 'moussa.traore@artisanpro.africa',
    lat: 5.3261,
    lng: -4.0197,
    verified: true,
    hourlyRate: '10 000 FCFA',
    profileViews: 980,
    contactsCount: 84,
    joinedDate: '2024-02-10',
    experienceYears: 8,
    address: 'Plateau Rue du Commerce, Abidjan',
  },
  {
    id: 3,
    name: 'Koffi Brou',
    trade: 'Mécanicien',
    city: 'Bouaké',
    country: 'Côte d’Ivoire',
    rating: 4.7,
    reviewsCount: 26,
    plan: 'Pro',
    emoji: '🔧',
    services: ['Entretien', 'Freins', 'Diagnostic'],
    description: 'Garage automobile toutes marques. Spécialiste moteurs diesel et essence, vidanges, suspensions et diagnostics électroniques complets.',
    phone: '+225 01 23 45 67',
    email: 'koffi.brou@artisanpro.africa',
    lat: 7.6898,
    lng: -5.0300,
    verified: true,
    hourlyRate: '12 000 FCFA',
    profileViews: 650,
    contactsCount: 52,
    joinedDate: '2024-03-01',
    experienceYears: 10,
    address: 'Quartier Koko, Bouaké',
  },
  {
    id: 4,
    name: 'Fatou Diallo',
    trade: 'Coiffeuse',
    city: 'Dakar',
    country: 'Sénégal',
    rating: 4.9,
    reviewsCount: 62,
    plan: 'Premium',
    emoji: '💇🏾',
    services: ['Tresses', 'Coiffure mariage', 'Soins'],
    description: 'Salon de beauté & coiffure afro-caribéenne. Passionnée par la valorisation du cheveu naturel, tissages, nattes et chignons de mariée.',
    phone: '+221 77 123 45 67',
    email: 'fatou.diallo@artisanpro.africa',
    lat: 14.6928,
    lng: -17.4467,
    verified: true,
    hourlyRate: '8 000 FCFA',
    profileViews: 1850,
    contactsCount: 165,
    joinedDate: '2023-11-20',
    experienceYears: 7,
    address: 'Almadies, Dakar',
  },
  {
    id: 5,
    name: 'Jean N’Guessan',
    trade: 'Maçon',
    city: 'Yamoussoukro',
    country: 'Côte d’Ivoire',
    rating: 4.6,
    reviewsCount: 18,
    plan: 'Free',
    emoji: '🧱',
    services: ['Construction', 'Rénovation', 'Carrelage'],
    description: 'Maçonnerie générale, fondations solides, élévation de murs, crépissage et pose de carrelage haut de gamme pour résidences et commerces.',
    phone: '+225 07 88 99 00',
    email: 'jean.nguessan@artisanpro.africa',
    lat: 6.8276,
    lng: -5.2893,
    verified: false,
    hourlyRate: '20 000 FCFA',
    profileViews: 426,
    contactsCount: 38,
    joinedDate: '2024-04-05',
    experienceYears: 14,
    address: 'Quartier Habitat, Yamoussoukro',
  },
  {
    id: 6,
    name: 'Ibrahim Coulibaly',
    trade: 'Menuisier',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    rating: 4.8,
    reviewsCount: 34,
    plan: 'Pro',
    emoji: '🪚',
    services: ['Meubles', 'Portes', 'Cuisine'],
    description: 'Ébénisterie et menuiserie bois massif et mélaminé. Conception sur mesure de placards, dressings, meubles de salon et portes sécurisées.',
    phone: '+225 05 98 76 54',
    email: 'ibrahim.coulibaly@artisanpro.africa',
    lat: 5.3400,
    lng: -4.0800,
    verified: true,
    hourlyRate: '18 000 FCFA',
    profileViews: 820,
    contactsCount: 71,
    joinedDate: '2024-02-18',
    experienceYears: 9,
    address: 'Yopougon Niangon Sud, Abidjan',
  },
  {
    id: 7,
    name: 'Sègla Dossou',
    trade: 'Plombier',
    city: 'Cotonou',
    country: 'Bénin',
    rating: 4.9,
    reviewsCount: 31,
    plan: 'Pro',
    emoji: '🚿',
    services: ['Installation sanitaire', 'Débouchage express', 'Chauffe-eau solaire'],
    description: 'Plombier sanitaire qualifié disponible sur Cotonou et Calavi. Dépannages d’urgence, fuites d’eau et rénovation de salles de bain.',
    phone: '+229 97 11 22 33',
    email: 'segla.dossou@artisanpro.africa',
    lat: 6.3703,
    lng: 2.3912,
    verified: true,
    hourlyRate: '8 000 FCFA',
    profileViews: 710,
    contactsCount: 64,
    joinedDate: '2024-03-12',
    experienceYears: 8,
    address: 'Haie Vive, Cotonou',
  },
  {
    id: 8,
    name: 'Samuel Ebanda',
    trade: 'Électricien',
    city: 'Douala',
    country: 'Cameroun',
    rating: 4.8,
    reviewsCount: 45,
    plan: 'Premium',
    emoji: '⚡',
    services: ['Réseaux domestiques', 'Groupes électrogènes', 'Climatisation'],
    description: 'Expert en installations électriques et maintenance de climatiseurs à Douala et Yaoundé. Respect strict des normes de sécurité.',
    phone: '+237 690 12 34 56',
    email: 'samuel.ebanda@artisanpro.africa',
    lat: 4.0511,
    lng: 9.7679,
    verified: true,
    hourlyRate: '12 000 FCFA',
    profileViews: 1140,
    contactsCount: 92,
    joinedDate: '2024-01-20',
    experienceYears: 11,
    address: 'Akwa, Douala',
  },
  {
    id: 9,
    name: 'Komi Agbessi',
    trade: 'Soudeur',
    city: 'Lomé',
    country: 'Togo',
    rating: 4.7,
    reviewsCount: 22,
    plan: 'Pro',
    emoji: '👨‍🏭',
    services: ['Grilles de sécurité', 'Portails métalliques', 'Charpentes en fer'],
    description: 'Ferronnerie d’art et soudure métallique de haute résistance pour résidences, villas et hangars industriels à Lomé.',
    phone: '+228 90 12 34 56',
    email: 'komi.agbessi@artisanpro.africa',
    lat: 6.1375,
    lng: 1.2123,
    verified: true,
    hourlyRate: '7 500 FCFA',
    profileViews: 530,
    contactsCount: 44,
    joinedDate: '2024-04-01',
    experienceYears: 7,
    address: 'Hedzranawoé, Lomé',
  },
  {
    id: 10,
    name: 'Ousmane Traoré',
    trade: 'Menuisier',
    city: 'Bamako',
    country: 'Mali',
    rating: 4.9,
    reviewsCount: 29,
    plan: 'Pro',
    emoji: '🪚',
    services: ['Salons traditionnels', 'Chambres à coucher', 'Portes massives'],
    description: 'Maître artisan menuisier sur bois de teck et bois précieux. Finitions soignées et livraison ponctuelle partout à Bamako.',
    phone: '+223 76 54 32 10',
    email: 'ousmane.traore@artisanpro.africa',
    lat: 12.6392,
    lng: -8.0029,
    verified: true,
    hourlyRate: '10 000 FCFA',
    profileViews: 680,
    contactsCount: 58,
    joinedDate: '2024-02-28',
    experienceYears: 13,
    address: 'Badalabougou, Bamako',
  },
  {
    id: 11,
    name: 'Dieudonné Mukendi',
    trade: 'Peintre',
    city: 'Kinshasa',
    country: 'RD Congo',
    rating: 4.8,
    reviewsCount: 38,
    plan: 'Premium',
    emoji: '🎨',
    services: ['Peinture décorative', 'Revêtements étanches', 'Fresques modernes'],
    description: 'Entreprise de peinture et décoration intérieure/extérieure à Kinshasa (Gombe, Kintambo, Limete). Travail rapide et propre.',
    phone: '+243 81 234 5678',
    email: 'dieudonne.mukendi@artisanpro.africa',
    lat: -4.3276,
    lng: 15.3136,
    verified: true,
    hourlyRate: '15 $ / h',
    profileViews: 890,
    contactsCount: 76,
    joinedDate: '2024-01-10',
    experienceYears: 10,
    address: 'Gombe, Kinshasa',
  },
];

const defaultUsers: User[] = [
  {
    id: 'user-client-1',
    name: 'Aminata Touré',
    email: 'aminata.toure@gmail.com',
    role: 'client',
    phone: '+225 07 12 34 56',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    avatar: '👩🏽',
  },
  {
    id: 'user-artisan-1',
    name: 'Awa Koné',
    email: 'awa.kone@artisanpro.africa',
    role: 'artisan',
    phone: '+225 07 45 67 89',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    artisanId: 1,
    avatar: '👗',
  },
  {
    id: 'user-artisan-2',
    name: 'Moussa Traoré',
    email: 'moussa.traore@artisanpro.africa',
    role: 'artisan',
    phone: '+225 05 32 14 56',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    artisanId: 2,
    avatar: '⚡',
  },
  {
    id: 'user-admin-principal',
    name: 'Admin Principal ArtisanPro Africa',
    email: 'contactartisanproafrica@gmail.com',
    role: 'super_admin' as const,
    phone: '+225 0503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    avatar: '🛡️',
  },
  {
    id: 'user-admin-adan',
    name: 'Adan Mitonde (Admin Secondaire)',
    email: 'adanmitondejunior07@gmail.com',
    role: 'super_admin' as const,
    phone: '+225 0503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    avatar: '🛡️',
  },
];

const defaultServices: MarketplaceService[] = [
  {
    id: 'srv-1',
    artisanId: 1,
    artisanName: 'Awa Koné',
    trade: 'Couturière',
    title: 'Robe de soirée sur mesure',
    price: '25 000 FCFA',
    priceValue: 25000,
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    description: 'Prise de mesures à domicile ou à l’atelier, sélection du tissu et confection soignée sous 5 jours ouvrés.',
    category: 'Couture',
    duration: '4-6 jours',
    emoji: '👗',
  },
  {
    id: 'srv-2',
    artisanId: 1,
    artisanName: 'Awa Koné',
    trade: 'Couturière',
    title: 'Ensemble traditionnel en Pagne Baoulé',
    price: '35 000 FCFA',
    priceValue: 35000,
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    description: 'Broderie artisanale fine, doublure satinée et finitions soignées pour vos mariages et cérémonies.',
    category: 'Couture',
    duration: '7 jours',
    emoji: '🧵',
  },
  {
    id: 'srv-3',
    artisanId: 2,
    artisanName: 'Moussa Traoré',
    trade: 'Électricien',
    title: 'Diagnostic & Rénovation de tableau électrique',
    price: '30 000 FCFA',
    priceValue: 30000,
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    description: 'Mise aux normes NF C 15-100, remplacement de disjoncteurs différentiels et test de mise à la terre.',
    category: 'Électricité',
    duration: '1 journée',
    emoji: '⚡',
  },
  {
    id: 'srv-4',
    artisanId: 2,
    artisanName: 'Moussa Traoré',
    trade: 'Électricien',
    title: 'Installation d’inverseur automatique groupe/secteur',
    price: '45 000 FCFA',
    priceValue: 45000,
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    description: 'Automatisation du basculement entre la CIE et votre groupe électrogène sans coupure brutale.',
    category: 'Électricité',
    duration: '1/2 journée',
    emoji: '🔌',
  },
  {
    id: 'srv-5',
    artisanId: 3,
    artisanName: 'Koffi Brou',
    trade: 'Mécanicien',
    title: 'Vidange intégrale & Révision 30 points',
    price: '20 000 FCFA',
    priceValue: 20000,
    city: 'Bouaké',
    country: 'Côte d’Ivoire',
    description: 'Changement huile 100% synthèse, filtres à huile/air/carburant et contrôle complet des organes de sécurité.',
    category: 'Mécanique',
    duration: '2 heures',
    emoji: '🔧',
  },
  {
    id: 'srv-6',
    artisanId: 4,
    artisanName: 'Fatou Diallo',
    trade: 'Coiffeuse',
    title: 'Tresses sénégalaises (Twists / Knotless Braids)',
    price: '15 000 FCFA',
    priceValue: 15000,
    city: 'Dakar',
    country: 'Sénégal',
    description: 'Tressage soigné sans douleur sur les racines, tenue garantie 6 semaines avec soins nourrissants offerts.',
    category: 'Coiffure',
    duration: '3-4 heures',
    emoji: '💇🏾',
  },
  {
    id: 'srv-7',
    artisanId: 5,
    artisanName: 'Jean N’Guessan',
    trade: 'Maçon',
    title: 'Pose de carrelage intérieur 60x60',
    price: '3 500 FCFA / m²',
    priceValue: 3500,
    city: 'Yamoussoukro',
    country: 'Côte d’Ivoire',
    description: 'Chape de nivellement, colle haute adhérence et joints hydrofuges impeccables.',
    category: 'Maçonnerie',
    duration: '2-3 jours',
    emoji: '🧱',
  },
  {
    id: 'srv-8',
    artisanId: 6,
    artisanName: 'Ibrahim Coulibaly',
    trade: 'Menuisier',
    title: 'Conception & Pose de placard dressing en bois',
    price: '85 000 FCFA',
    priceValue: 85000,
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    description: 'Dressing moderne 3 battants avec tiroirs à amortisseurs, étagères réglables et penderie robuste.',
    category: 'Menuiserie',
    duration: '5 jours',
    emoji: '🪚',
  },
];

const defaultMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1-user-client-1',
    senderId: 'user-client-1',
    senderName: 'Aminata Touré',
    senderRole: 'client',
    artisanId: 1,
    clientId: 'user-client-1',
    text: 'Bonjour Madame Koné, faites-vous des retouches rapides pour un mariage prévu samedi ?',
    timestamp: '2026-09-06T10:30:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1-user-client-1',
    senderId: 'user-artisan-1',
    senderName: 'Awa Koné',
    senderRole: 'artisan',
    artisanId: 1,
    clientId: 'user-client-1',
    text: 'Bonjour Aminata ! Oui tout à fait, vous pouvez passer à l’atelier à Cocody cet après-midi pour les mesures.',
    timestamp: '2026-09-06T10:45:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-2-user-client-1',
    senderId: 'user-client-1',
    senderName: 'Aminata Touré',
    senderRole: 'client',
    artisanId: 2,
    clientId: 'user-client-1',
    text: 'Bonjour Moussa, mon disjoncteur saute dès que j’allume le climatiseur.',
    timestamp: '2026-09-05T14:10:00Z',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2-user-client-1',
    senderId: 'user-artisan-2',
    senderName: 'Moussa Traoré',
    senderRole: 'artisan',
    artisanId: 2,
    clientId: 'user-client-1',
    text: 'Bonjour ! C’est probablement une surcharge ou un court-circuit au compresseur. Je peux intervenir demain à 9h.',
    timestamp: '2026-09-05T14:25:00Z',
  },
];

const defaultQuotes: QuoteRequest[] = [
  {
    id: 'quote-101',
    clientId: 'user-client-1',
    clientName: 'Aminata Touré',
    clientPhone: '+225 07 12 34 56',
    artisanId: 1,
    artisanName: 'Awa Koné',
    serviceTitle: 'Robe de mariée traditionnelle Baoulé',
    description: 'Confection complète avec tissu fourni, taille 38, finitions perles dorées pour le 25 septembre.',
    status: 'en_attente',
    estimatedPrice: '45 000 FCFA',
    date: '2026-09-06T11:00:00Z',
  },
  {
    id: 'quote-102',
    clientId: 'user-client-1',
    clientName: 'Aminata Touré',
    clientPhone: '+225 07 12 34 56',
    artisanId: 2,
    artisanName: 'Moussa Traoré',
    serviceTitle: 'Installation tableau électrique duplex',
    description: 'Câblage neuf 8 départs + parafoudre + disjoncteur différentiel.',
    status: 'accepte',
    estimatedPrice: '65 000 FCFA',
    date: '2026-09-04T09:20:00Z',
  },
];

const defaultTransactions: Transaction[] = [
  {
    id: 'tx-2024-001',
    artisanId: 1,
    artisanName: 'Awa Koné',
    plan: 'Premium',
    amount: 10000,
    currency: 'FCFA',
    method: 'Wave',
    status: 'reussi',
    date: '2026-09-01T08:15:00Z',
    invoiceNumber: 'INV-2026-09-001',
  },
  {
    id: 'tx-2024-002',
    artisanId: 2,
    artisanName: 'Moussa Traoré',
    plan: 'Pro',
    amount: 5000,
    currency: 'FCFA',
    method: 'Orange Money',
    status: 'reussi',
    date: '2026-09-02T14:40:00Z',
    invoiceNumber: 'INV-2026-09-002',
  },
  {
    id: 'tx-2024-003',
    artisanId: 4,
    artisanName: 'Fatou Diallo',
    plan: 'Premium',
    amount: 10000,
    currency: 'FCFA',
    method: 'Wave',
    status: 'reussi',
    date: '2026-09-03T11:20:00Z',
    invoiceNumber: 'INV-2026-09-003',
  },
  {
    id: 'tx-2024-004',
    artisanId: 6,
    artisanName: 'Ibrahim Coulibaly',
    plan: 'Pro',
    amount: 5000,
    currency: 'FCFA',
    method: 'MTN MoMo',
    status: 'reussi',
    date: '2026-09-04T16:05:00Z',
    invoiceNumber: 'INV-2026-09-004',
  },
];

const defaultNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    recipientId: 'all',
    title: 'Bienvenue sur Artisan Pro !',
    message: 'Découvrez les artisans vérifiés près de chez vous ou boostez votre activité artisanale.',
    type: 'system',
    date: '2026-09-01T08:00:00Z',
    read: false,
    linkPage: 'home',
  },
  {
    id: 'notif-2',
    recipientId: 'user-client-1',
    title: 'Devis accepté par Moussa Traoré',
    message: 'Votre demande d’installation de tableau électrique a été validée pour 65 000 FCFA.',
    type: 'quote',
    date: '2026-09-04T10:00:00Z',
    read: false,
    linkPage: 'messages',
  },
  {
    id: 'notif-3',
    recipientId: 'user-artisan-1',
    title: 'Abonnement Premium actif !',
    message: 'Votre compte bénéficie de la visibilité maximale et du badge Premium doré.',
    type: 'payment',
    date: '2026-09-01T08:16:00Z',
    read: true,
    linkPage: 'subscription',
  },
];

class DatabaseStore {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const existingArtisans: Artisan[] = parsed.artisans || [];
        // Ensure default African sample artisans exist
        defaultArtisans.forEach((def) => {
          if (!existingArtisans.some((a) => a.id === def.id)) {
            existingArtisans.push(def);
          }
        });

        return {
          artisans: existingArtisans.length ? existingArtisans : defaultArtisans,
          plans: parsed.plans || defaultPlans,
          users: parsed.users || defaultUsers,
          services: parsed.services || defaultServices,
          messages: parsed.messages || defaultMessages,
          quotes: parsed.quotes || defaultQuotes,
          transactions: parsed.transactions || defaultTransactions,
          notifications: parsed.notifications || defaultNotifications,
          subscriptions: parsed.subscriptions || [],
          payments: parsed.payments || [],
        };
      }
    } catch (err) {
      console.warn('Failed to read db file, initializing with defaults:', err);
    }

    const initial: DatabaseData = {
      artisans: defaultArtisans,
      plans: defaultPlans,
      users: defaultUsers,
      services: defaultServices,
      messages: defaultMessages,
      quotes: defaultQuotes,
      transactions: defaultTransactions,
      notifications: defaultNotifications,
      subscriptions: [],
      payments: [],
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseData): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // Artisans
  getArtisans(): Artisan[] {
    return this.data.artisans;
  }

  getArtisanById(id: number): Artisan | undefined {
    return this.data.artisans.find((a) => a.id === id);
  }

  createArtisan(payload: Omit<Artisan, 'id'>): Artisan {
    const maxId = this.data.artisans.reduce((max, a) => Math.max(max, a.id), 0);
    const newArtisan: Artisan = {
      ...payload,
      id: maxId + 1,
    };
    this.data.artisans.push(newArtisan);
    this.persist();
    return newArtisan;
  }

  updateArtisan(id: number, updates: Partial<Artisan>): Artisan | null {
    const idx = this.data.artisans.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.artisans[idx] = { ...this.data.artisans[idx], ...updates };
    this.persist();
    return this.data.artisans[idx];
  }

  deleteArtisan(id: number): boolean {
    const initialLen = this.data.artisans.length;
    this.data.artisans = this.data.artisans.filter((a) => a.id !== id);
    if (this.data.artisans.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Plans
  getPlans(): Plan[] {
    return this.data.plans;
  }

  // Users & Auth
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id || String(u.id) === String(id));
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  // Services
  getServices(): MarketplaceService[] {
    return this.data.services;
  }

  createService(service: MarketplaceService): MarketplaceService {
    this.data.services.push(service);
    this.persist();
    return service;
  }

  // Messages
  getMessages(artisanId?: number, clientId?: string): Message[] {
    if (artisanId && clientId) {
      return this.data.messages.filter(
        (m) => m.artisanId === artisanId && m.clientId === clientId
      );
    }
    if (artisanId) {
      return this.data.messages.filter((m) => m.artisanId === artisanId);
    }
    if (clientId) {
      return this.data.messages.filter((m) => m.clientId === clientId);
    }
    return this.data.messages;
  }

  createMessage(msg: Message): Message {
    this.data.messages.push(msg);
    this.persist();
    return msg;
  }

  // Quotes
  getQuotes(filter?: { clientId?: string; artisanId?: number }): QuoteRequest[] {
    return this.data.quotes.filter((q) => {
      if (filter?.clientId && q.clientId !== filter.clientId) return false;
      if (filter?.artisanId && q.artisanId !== filter.artisanId) return false;
      return true;
    });
  }

  createQuote(quote: QuoteRequest): QuoteRequest {
    this.data.quotes.push(quote);
    this.persist();
    return quote;
  }

  updateQuoteStatus(id: string, status: QuoteRequest['status']): QuoteRequest | null {
    const quote = this.data.quotes.find((q) => q.id === id);
    if (!quote) return null;
    quote.status = status;
    this.persist();
    return quote;
  }

  // Transactions
  getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  createTransaction(tx: Transaction): Transaction {
    this.data.transactions.unshift(tx);
    this.persist();
    return tx;
  }

  // Notifications
  getNotifications(userId?: string): AppNotification[] {
    return this.data.notifications.filter(
      (n) => n.recipientId === 'all' || (userId && n.recipientId === userId)
    );
  }

  createNotification(notif: AppNotification): AppNotification {
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId?: string): void {
    this.data.notifications.forEach((n) => {
      if (n.recipientId === 'all' || (userId && n.recipientId === userId)) {
        n.read = true;
      }
    });
    this.persist();
  }

  // Admin summary
  getAdminStats() {
    const totalArtisans = this.data.artisans.length;
    const proCount = this.data.artisans.filter((a) => a.plan === 'Pro').length;
    const premiumCount = this.data.artisans.filter((a) => a.plan === 'Premium').length;
    const freeCount = this.data.artisans.filter((a) => a.plan === 'Free').length;
    const pendingVerifications = this.data.artisans.filter((a) => !a.verified).length;

    // Monthly revenue calculation
    const totalMonthlyRevenueFCFA =
      proCount * 5000 + premiumCount * 10000 + 2340000; // includes baseline volume

    return {
      totalArtisans,
      proCount,
      premiumCount,
      freeCount,
      totalMonthlyRevenueFCFA,
      pendingVerifications,
      totalQuotes: this.data.quotes.length,
      totalMessages: this.data.messages.length,
    };
  }

  // ==========================================
  // TABLE: Subscriptions
  // ==========================================
  getSubscriptions(): Subscription[] {
    return [...(this.data.subscriptions || [])];
  }

  getSubscriptionById(id: string): Subscription | undefined {
    return (this.data.subscriptions || []).find((s) => s.id === id);
  }

  getUserSubscriptions(userId: string): Subscription[] {
    return (this.data.subscriptions || []).filter((s) => s.user_id === userId);
  }

  createSubscription(sub: Subscription): Subscription {
    if (!this.data.subscriptions) {
      this.data.subscriptions = [];
    }
    this.data.subscriptions.push(sub);
    this.persist();
    return sub;
  }

  updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
    if (!this.data.subscriptions) return null;
    const index = this.data.subscriptions.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.data.subscriptions[index] = { ...this.data.subscriptions[index], ...updates };
    this.persist();
    return this.data.subscriptions[index];
  }

  // ==========================================
  // TABLE: Payments
  // ==========================================
  getPayments(): Payment[] {
    return [...(this.data.payments || [])];
  }

  getPaymentById(id: string): Payment | undefined {
    return (this.data.payments || []).find((p) => p.id === id);
  }

  getUserPayments(userId: string): Payment[] {
    return (this.data.payments || []).filter((p) => p.user_id === userId);
  }

  createPayment(payment: Payment): Payment {
    if (!this.data.payments) {
      this.data.payments = [];
    }
    this.data.payments.push(payment);
    this.persist();
    return payment;
  }

  updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    if (!this.data.payments) return null;
    const index = this.data.payments.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.payments[index] = { ...this.data.payments[index], ...updates };
    this.persist();
    return this.data.payments[index];
  }

  // ==========================================
  // TABLE: Publications (Fil d'actualité & Social)
  // ==========================================
  getPublications(): SocialPost[] {
    const deleted = new Set(this.data.deletedPublicationIds || []);
    return (this.data.publications || []).filter((p) => !deleted.has(String(p.id)));
  }

  getPublicationById(id: string): SocialPost | undefined {
    const deleted = new Set(this.data.deletedPublicationIds || []);
    if (deleted.has(String(id))) return undefined;
    return (this.data.publications || []).find((p) => String(p.id) === String(id));
  }

  createPublication(post: SocialPost): SocialPost {
    if (!this.data.publications) this.data.publications = [];
    if (!this.data.deletedPublicationIds) this.data.deletedPublicationIds = [];
    // Ensure it's removed from deleted list if re-created
    this.data.deletedPublicationIds = this.data.deletedPublicationIds.filter((d) => d !== String(post.id));
    const idx = this.data.publications.findIndex((p) => String(p.id) === String(post.id));
    if (idx >= 0) {
      this.data.publications[idx] = post;
    } else {
      this.data.publications.unshift(post);
    }
    this.persist();
    return post;
  }

  deletePublication(id: string): boolean {
    if (!this.data.deletedPublicationIds) {
      this.data.deletedPublicationIds = [];
    }
    const strId = String(id);
    if (!this.data.deletedPublicationIds.includes(strId)) {
      this.data.deletedPublicationIds.push(strId);
    }
    if (this.data.publications) {
      this.data.publications = this.data.publications.filter((p) => String(p.id) !== strId);
    }
    this.persist();
    return true;
  }

  getDeletedPublicationIds(): string[] {
    return [...(this.data.deletedPublicationIds || [])];
  }
}

export const db = new DatabaseStore();
