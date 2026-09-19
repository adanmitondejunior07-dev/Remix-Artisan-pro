export interface CriteresMonetisation {
  identite_verifiee?: boolean; // 1. Identité Vérifiée (Copie de la pièce d'identité conforme)
  telephone_actif?: boolean; // 2. Numéro Téléphone Actif (Vérifié par SMS ou appel)
  localisation_precise?: boolean; // 3. Localisation Précise (Zone d'intervention ou atelier enregistré)
  photo_professionnelle?: boolean; // 4. Photo de Profil Professionnelle (Visage net, pas d'avatar)
  metier_clair?: boolean; // 5. Nom de l'Entreprise ou Métier Clair (Ex: Plombier, Électricien)
  portfolio_rempli?: boolean; // 6. Portfolio Rempli (Au moins 3 photos de réalisations réelles)
  tarifs_indiques?: boolean; // 7. Tarifs ou Grille Indiquée (Prestations transparentes)
  disponibilites_renseignees?: boolean; // 8. Disponibilités Renseignées (Jours et heures de travail)
  casier_judiciaire?: boolean; // 9. Casier Judiciaire / Attestation (Optionnel selon le pays pour la sécurité)
  contrat_accepte?: boolean; // 10. Contrat d'Utilisation Accepté (Règles de bonne conduite de la plateforme)
  paiement_configure?: boolean; // 11. Configuration du Paiement (Compte Mobile Money lié pour la monétisation)
  test_reactivite?: boolean; // 12. Test de Réactivité (L'artisan a répondu au premier message test)
  frais_inscription?: boolean; // 13. Frais d'Inscription Validés (Si forfait ou abonnement de départ payé)
  [key: string]: boolean | undefined;
}

export type PlanType = 'Free' | 'Pro' | 'Premium';
export type UserRole = 'client' | 'artisan' | 'admin' | 'super_admin';

export interface Artisan {
  id: number;
  name: string;
  nom?: string;
  trade: string;
  city: string;
  country: string;
  rating: number;
  reviewsCount: number;
  plan: PlanType;
  emoji: string;
  services: string[];
  description: string;
  phone: string;
  telephone?: string;
  email: string;
  lat: number;
  lng: number;
  verified: boolean;
  is_verified?: boolean;
  est_verifie?: boolean;
  score_validation?: number; // 0 à 13
  criteres_monetisation?: CriteresMonetisation;
  hasPaid10k?: boolean;
  a_paye_10k?: boolean;
  hasPaidActivation13k?: boolean;
  hasPaid13k?: boolean;
  isArtisan?: boolean;
  artisanPaidAt?: number;
  transactionId?: string;
  hourlyRate: string;
  profileViews: number;
  contactsCount: number;
  joinedDate: string;
  experienceYears?: number;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  tiktok?: string;
  instagram?: string;
  website?: string;
  whatsappChannel?: string;
  facebookPage?: string;
  isAvailable?: boolean;
  bannerUrl?: string;
  coverUrl?: string;
  avatarUrl?: string;
  photoUrl?: string;
  callHistory?: CallRecord[];
  monetization_status?: MonetizationStatus;
  monetization_requested_at?: string;
  monetization_approved_at?: string;
  monetization_suspended_reason?: string;
  monetization_rejected_reason?: string;
  monetization_accepted?: boolean;
  monetization_accepted_at?: string;
  postsCount?: number;
  hasMinimumEngagement?: boolean;
  abonnement?: string;
  abonnement_actif?: boolean;
  subscription_status?: string;
  subscription_plan?: string;
  date_paiement?: any;
  montant?: number;
  pays?: string;
  telephone_admin?: string;
  statut_paiement?: 'en_attente' | 'valide' | 'refuse' | string;
  date_validation?: any;
  valide_par?: string;
  date_refus?: any;
  refuse_par?: string;
  methode_paiement?: string;
  preuve_url?: string;
  reference_paiement?: string;
}

export interface CallRecord {
  id: string;
  artisanId: number;
  clientId: string;
  clientName: string;
  type: 'audio' | 'video';
  durationSeconds: number;
  formattedDuration: string;
  status: 'completed' | 'missed' | 'declined';
  timestamp: string;
  subtext?: string;
}

export interface Plan {
  name: PlanType;
  price: string;
  priceNumber: number;
  desc: string;
  features: string[];
  featured?: boolean;
}

export type MonetizationStatus =
  | 'non_eligible'
  | 'conditions_in_progress'
  | 'pending_validation'
  | 'active'
  | 'suspended';

export interface User {
  id: string;
  name: string;
  nom?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  phone: string;
  telephone?: string;
  city: string;
  country: string;
  est_verifie?: boolean;
  score_validation?: number; // 0 à 13
  criteres_monetisation?: CriteresMonetisation;
  latitude?: number;
  longitude?: number;
  location_authorized?: boolean;
  showLocationPublicly?: boolean;
  showEmailPublicly?: boolean;
  account_status?: 'active' | 'suspended' | 'pending';
  artisanId?: number;
  avatar?: string;
  avatarUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  coverUrl?: string;
  subscription_status?: 'none' | 'pending' | 'active' | 'expired';
  artisan_status?: 'inactive' | 'pending' | 'active' | 'expired';
  subscription_plan?: 'essential' | 'pro' | 'premium';
  subscription_end_date?: string;
  joinedDate?: string;
  whatsapp?: string;
  facebook?: string;
  tiktok?: string;
  instagram?: string;
  website?: string;
  whatsappChannel?: string;
  facebookPage?: string;
  isAvailable?: boolean;
  bio?: string;
  trade?: string;
  rating?: number;
  reviewsCount?: number;
  verified?: boolean;
  is_verified?: boolean;
  hasPaid10k?: boolean;
  a_paye_10k?: boolean;
  hasPaidActivation13k?: boolean;
  hasPaid13k?: boolean;
  isArtisan?: boolean;
  artisanPaidAt?: number;
  transactionId?: string;
  secretCodeHash?: string;
  password?: string;
  galleryPhotos?: string[];
  monetization_accepted?: boolean;
  monetization_accepted_at?: string;
  monetization_status?: MonetizationStatus;
  monetization_requested_at?: string;
  monetization_approved_at?: string;
  monetization_suspended_reason?: string;
  monetization_rejected_reason?: string;
  adminPermissions?: {
    allowVoip: boolean;
    allowScreenShare: boolean;
    allowViewAllProfiles: boolean;
    allowDeleteAccount: boolean;
    allowTechSupportMode: boolean;
  };
  abonnement?: string;
  abonnement_actif?: boolean;
  date_paiement?: any;
  montant?: number;
  pays?: string;
  telephone_admin?: string;
  statut_paiement?: 'en_attente' | 'valide' | 'refuse' | string;
  date_validation?: any;
  valide_par?: string;
  date_refus?: any;
  refuse_par?: string;
  methode_paiement?: string;
  preuve_url?: string;
  reference_paiement?: string;
}

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  role: 'super_admin';
  isPrimary: boolean;
  phone: string;
  whatsapp: string;
  city: string;
  country: string;
  joinedDate: string;
  permissions: string[];
}

export interface MarketplaceService {
  id: string;
  artisanId: number;
  artisanName: string;
  trade: string;
  title: string;
  price: string;
  priceValue: number;
  city: string;
  country: string;
  description: string;
  category: string;
  duration: string;
  emoji: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'artisan';
  artisanId: number;
  clientId: string;
  text: string;
  timestamp: string;
  mine?: boolean;
  read?: boolean;
  callInfo?: {
    type: 'audio' | 'video';
    durationSeconds: number;
    formattedDuration?: string;
    status: 'completed' | 'missed' | 'declined';
    subtext?: string;
  };
}

export interface Conversation {
  id: string;
  artisanId: number;
  artisanName: string;
  artisanTrade: string;
  artisanEmoji: string;
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export interface QuoteRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientCity?: string;
  artisanId: number;
  artisanName: string;
  serviceTitle: string;
  description: string;
  status: 'en_attente' | 'en_cours' | 'accepte' | 'refuse' | 'termine' | 'pending' | 'accepted' | 'rejected';
  estimatedPrice?: string;
  proposedPrice?: string;
  date: string;
  createdAt?: string;
  artisan?: string;
  service?: string;
  desc?: string;
}

export type Quote = QuoteRequest;

export interface Transaction {
  id: string;
  artisanId: number;
  artisanName: string;
  plan: PlanType;
  amount: number | string;
  currency: string;
  method: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov' | 'Carte' | string;
  status: 'reussi' | 'en_cours' | 'echoue' | string;
  date: string;
  invoiceNumber: string;
  reference?: string;
}

export type PaymentTransaction = Transaction;

export interface AppNotification {
  id: string;
  recipientId: string; // 'all' or specific user/artisan id
  title: string;
  message: string;
  type: 'message' | 'quote' | 'payment' | 'system';
  date: string;
  read: boolean;
  linkPage?: string;
}

export interface AdminStats {
  totalArtisans: number;
  proCount: number;
  premiumCount: number;
  freeCount: number;
  totalMonthlyRevenueFCFA: number;
  totalRevenue?: number;
  platformRevenue?: number;
  totalUsers?: number;
  pendingVerifications: number;
  totalQuotes: number;
  totalMessages: number;
  planBreakdown?: {
    free: number;
    pro: number;
    premium: number;
  };
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  authorId?: string;
  authorName?: string;
  authorRole?: 'client' | 'artisan' | 'admin' | string;
  userAvatar?: string;
  text: string;
  parentId?: string | null;
  replies?: PostComment[];
  createdAt: string;
}

export type PublicationType = 'accueil' | 'marketplace';

export interface DbUser {
  id: string;
  nom: string;
  telephone?: string;
  role: 'admin' | 'artisan' | 'client';
  est_verifie?: boolean;
  score_validation?: number; // Entier 0 à 13
  criteres_monetisation?: CriteresMonetisation;
  // Propriétés de compatibilité
  prenom?: string;
  photo_profil?: string;
  localisation?: string;
  email?: string;
}

export interface DbPublication {
  id: string;
  user_id: string;
  contenu: string;
  image?: string | null;
  date_creation: string;
  type: PublicationType;
  prix?: string | number | null;
  // Champs dérivés ou joints
  user?: DbUser;
  likes_count?: number;
  user_has_liked?: boolean;
}

export interface DbLike {
  id: string;
  user_id: string;
  publication_id: string;
}

export interface SocialPost {
  id: string;
  userId?: string;
  user_id?: string;
  author?: string;
  user?: string;
  role?: 'ADMIN' | 'ARTISAN' | 'CLIENT' | string;
  isAdmin?: boolean;
  isPub?: boolean;
  type?: 'accueil' | 'marketplace' | 'publication' | 'article' | string;
  nom?: string;
  prix?: string | number;
  devise?: string;
  texte?: string;
  contenu?: string;
  image?: string;
  date_creation?: string;
  likes?: number;
  artisanId?: number;
  artisanName?: string;
  artisanTrade?: string;
  artisanEmoji?: string;
  artisanAvatar?: string;
  verified?: boolean;
  city?: string;
  country?: string;
  content: string;
  mediaType?: 'photo' | 'video' | 'text';
  mediaUrl?: string;
  mediaId?: string;
  storagePath?: string;
  posterUrl?: string;
  price?: string;
  priceValue?: number;
  likesCount?: number;
  likedBy?: string[];
  user_has_liked?: boolean;
  viewsCount?: number;
  comments?: PostComment[];
  sharesCount?: number;
  createdAt: string;
  phone?: string;
  whatsapp?: string;
  visibility?: 'public' | 'private' | 'hidden';
  status?: 'published' | 'hidden' | 'flagged' | 'moderated';
  userRole?: string;
  flagged?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  operator: 'Orange Money' | 'MTN Mobile Money' | 'Moov Money' | 'Wave';
  amount: number;
  currency: string;
  date: string;
  status: 'en_attente' | 'approuve' | 'refuse';
}

export interface SocialCommunityLinks {
  whatsappGroup: string;
  facebookPage: string;
}

export interface OfficialChannels {
  whatsappChannel: string;
  facebookPage: string;
  instagramTiktok: string;
  website: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'essential' | 'pro' | 'premium';
  price: number;
  currency: 'XOF';
  billing_period: 'monthly' | 'yearly';
  status: 'pending' | 'active' | 'expired';
  start_date: string;
  end_date: string;
  payment_provider?: string;
  transaction_id?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_type: 'subscription' | 'service_payment';
  payment_method: string;
  provider: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | string;
}

export interface PasswordReset {
  id?: string | number;
  email?: string;
  phone?: string;
  code: string;
  created_at?: string;
}
