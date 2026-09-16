import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Artisan,
  Plan,
  User,
  MarketplaceService,
  AppNotification,
  PlanType,
  SocialPost,
  PostComment,
  SocialCommunityLinks,
  OfficialChannels,
  WithdrawalRequest,
} from '../types.ts';
import { api } from '../services/api.ts';
import { firestoreService } from '../services/firestoreService.ts';
import {
  INITIAL_ARTISANS,
  INITIAL_CLIENTS,
  INITIAL_PLANS,
  INITIAL_SERVICES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData.ts';
import {
  INITIAL_POSTS,
  DEFAULT_COMMUNITY_LINKS,
  INITIAL_WITHDRAWALS,
} from '../data/socialFeedData.ts';
import {
  langues,
  paysAfricains,
  type LanguageCode,
  type LanguageTranslation,
} from '../data/langues.ts';
import {
  PERMANENT_OFFICIAL_CHANNELS,
  cleanAndNormalizeLink,
} from '../utils/channelUtils.ts';
import { isExactAdminEmail, getAdminUserByEmail } from '../config/adminConfig.ts';
import { uploadOrStoreMedia } from '../services/mediaStorage.ts';
import { storage } from '../firebase/config.ts';

export type PageName =
  | 'home'
  | 'search'
  | 'profile'
  | 'map'
  | 'market'
  | 'messages'
  | 'subscription'
  | 'abonnements'
  | 'mon-historique'
  | 'account'
  | 'register'
  | 'admin'
  | 'admin-login'
  | 'dynamic-profile'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'delete-account'
  | 'artisan-verification'
  | 'report-issue'
  | 'how-it-works'
  | 'conditions-monetisation'
  | 'portefeuille'
  | 'admin-paiements'
  | 'settings'
  | 'notifications';

interface ToastInfo {
  title: string;
  desc?: string;
  type?: 'success' | 'info' | 'warning';
}

interface ActiveOtpData {
  code: string;
  identifier: string;
  expiresAt: number;
}

interface AppContextType {
  page: PageName;
  go: (page: PageName) => void;
  currentUser: User | null;
  currentArtisan: Artisan | null;
  artisans: Artisan[];
  plans: Plan[];
  services: MarketplaceService[];
  selectedArtisanId: number | null;
  setSelectedArtisanId: (id: number | null) => void;
  selectedArtisan: Artisan | null;
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotifAsRead: (id: string) => Promise<void>;
  markAllNotifsAsRead: () => Promise<void>;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  isLocating: boolean;
  requestUserLocation: () => void;
  calculateDistance: (lat: number, lng: number) => number | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTrade: string;
  setSelectedTrade: (t: string) => void;
  selectedCity: string;
  setSelectedCity: (c: string) => void;
  toast: ToastInfo | null;
  showToast: (t: ToastInfo) => void;
  hideToast: () => void;
  // Social feed & community
  socialPosts: SocialPost[];
  createSocialPost: (data: Partial<SocialPost> & { mediaFile?: File | Blob | null }) => Promise<void>;
  deleteSocialPost: (postId: string) => Promise<void>;
  likeSocialPost: (postId: string) => Promise<void>;
  addPostComment: (postId: string, text: string, parentId?: string | null) => Promise<void>;
  communityLinks: SocialCommunityLinks;
  updateCommunityLinks: (links: Partial<SocialCommunityLinks>) => Promise<void>;
  officialChannels: OfficialChannels;
  updateOfficialChannels: (channels: Partial<OfficialChannels>) => void;
  // Wallet & Monetization
  walletBalance: number;
  creditArtisanWallet: (amount: number, description?: string) => void;
  withdrawals: WithdrawalRequest[];
  requestWithdrawal: (data: {
    operator: 'Orange Money' | 'MTN Mobile Money' | 'Moov Money' | 'Wave';
    amount: number;
    phone: string;
    currency?: string;
  }) => Promise<void>;
  updateWithdrawalStatus: (id: string, status: 'approuve' | 'refuse') => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
  // Users & Admin
  users: User[];
  deleteUser: (userId: string) => Promise<void>;
  deleteArtisan: (artisanId: number) => Promise<void>;
  // Follow artisans
  followingArtisans: number[];
  toggleFollowArtisan: (artisanId: number) => void;
  // OTP Verification
  activeOtp: ActiveOtpData | null;
  sendOtp: (identifier: string, type?: 'inscription' | 'reconnexion') => Promise<string>;
  verifyOtp: (identifier: string, code: string) => boolean;
  // Langues & Pays Africains (style Facebook)
  langueActuelle: LanguageCode;
  t: LanguageTranslation;
  changerLangue: (code: LanguageCode) => void;
  paysSelectionne: string;
  choisirPays: (nomPays: string) => void;
  // Modals
  quoteModal: {
    isOpen: boolean;
    artisan: Artisan | null;
    serviceTitle?: string;
    open: (artisan: Artisan, serviceTitle?: string) => void;
    close: () => void;
  };
  paymentModal: {
    isOpen: boolean;
    plan: PlanType;
    service?: MarketplaceService;
    customTitle?: string;
    customAmount?: number;
    open: (
      planOrConfig?:
        | PlanType
        | {
            plan?: PlanType;
            service?: MarketplaceService;
            customTitle?: string;
            customAmount?: number;
          }
    ) => void;
    close: () => void;
  };
  supportModal: {
    isOpen: boolean;
    initialTopic?: string;
    open: (topic?: string) => void;
    close: () => void;
  };
  authModal: {
    isOpen: boolean;
    initialTab: 'login' | 'register' | 'demo';
    open: (tab?: 'login' | 'register' | 'demo') => void;
    close: () => void;
  };
  artisan13kModal: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };
  refreshData: () => Promise<void>;
  switchUser: (user: User, redirect?: boolean) => Promise<void>;
  updateUserProfile: (userData: Partial<User>, artisanData?: Partial<Artisan>) => Promise<void>;
  uploadProfilePhoto: (url: string) => Promise<void>;
  uploadCoverPhoto: (url: string) => Promise<void>;
  upgradeClientToArtisan: (txId?: string, paymentOperator?: string) => Promise<void>;
  logout: () => void;
  startChatWithArtisan: (artisanOrId: number | Artisan) => void;
  isSubscriptionExpired: boolean;
  canAccessProFeatures: boolean;
  checkSubscriptionStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default coordinates: Abidjan Cocody (5.3599, -3.9870)
export const DEFAULT_COORDS = { lat: 5.3599, lng: -3.9870 };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore session synchronously from localStorage (Facebook-style persistent session)
  const initialIsLoggedIn =
    typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('artisanPro_user') || localStorage.getItem('userData');
        if (raw) {
          const parsed: User = JSON.parse(raw);
          if (isExactAdminEmail(parsed?.email)) {
            parsed.role = 'super_admin';
            if (
              !parsed.phone ||
              parsed.phone.includes('27 20 00') ||
              parsed.phone.includes('2720000000') ||
              parsed.email === 'contactartisanproafrica@gmail.com' ||
              parsed.email === 'adanmitondejunior07@gmail.com' ||
              parsed.email === 'admin@artisanpro.afrique'
            ) {
              parsed.phone = '+225 0503444508';
              parsed.whatsapp = '+2250503444508';
            }
            try {
              localStorage.setItem('artisanPro_user', JSON.stringify(parsed));
              localStorage.setItem('userData', JSON.stringify(parsed));
            } catch {}
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Error reading stored artisanPro_user / userData:', e);
      }
    }
    return null;
  });

  // Always start on home (feed of artisans), never on account/profile
  const [page, setPage] = useState<PageName>('home');
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_CLIENTS);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentArtisan, setCurrentArtisan] = useState<Artisan | null>(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState<number | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Follow artisans
  const [followingArtisans, setFollowingArtisans] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artisanpro_following');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn('Error loading following artisans:', e);
      }
    }
    return [];
  });

// Helper to load offline artisanPosts saved directly in localStorage
function loadLocalArtisanPosts(): SocialPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('artisanPosts');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: any) => {
      const isVideo =
        p.mediaType === 'video' ||
        p.type === 'video' ||
        (p.image && typeof p.image === 'string' && p.image.startsWith('data:video'));

      return {
        id: String(p.id),
        userId: 'artisan_local',
        author: p.artisan || 'Vous',
        role: 'ARTISAN' as const,
        artisanId: 1,
        artisanName: p.artisan || 'Vous',
        artisanTrade: 'Artisan Pro',
        artisanEmoji: '🛠️',
        verified: true,
        city: 'Abidjan',
        country: 'Côte d’Ivoire',
        content: p.description || '',
        mediaType: isVideo ? ('video' as const) : ('photo' as const),
        mediaUrl: p.thumbnail || p.image || p.mediaUrl || '',
        posterUrl: p.thumbnail || p.image || '',
        mediaId: p.videoKey || `video_${p.id}`,
        price: p.tarif ? (String(p.tarif).includes('FCFA') ? String(p.tarif) : `${p.tarif} FCFA`) : '20 000 FCFA',
        likesCount: p.likes || 0,
        likedBy: [],
        viewsCount: 1,
        comments: [],
        sharesCount: 0,
        createdAt: p.date ? new Date().toISOString() : new Date().toISOString(),
      };
    });
  } catch (e) {
    console.warn('Error reading artisanPosts:', e);
    return [];
  }
}

  // Social feed & community links
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    const localArtisans = loadLocalArtisanPosts();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('allPosts') || localStorage.getItem('artisanpro_social_posts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const seen = new Set(localArtisans.map((p) => p.id));
            const filtered = parsed.filter((p) => !seen.has(p.id));
            return [...localArtisans, ...filtered];
          }
        }
      } catch (e) {
        console.warn('Error loading social posts:', e);
      }
    }
    if (localArtisans.length > 0) {
      return [...localArtisans, ...INITIAL_POSTS];
    }
    return INITIAL_POSTS;
  });

  // Synchronisation dynamique sans rechargement de page
  useEffect(() => {
    const handleArtisanPostsUpdate = () => {
      const localArtisans = loadLocalArtisanPosts();
      setSocialPosts((prev) => {
        const nonLocal = prev.filter((p) => p.userId !== 'artisan_local');
        return [...localArtisans, ...nonLocal];
      });
    };

    window.addEventListener('artisanPostsUpdated', handleArtisanPostsUpdate);
    return () => {
      window.removeEventListener('artisanPostsUpdated', handleArtisanPostsUpdate);
    };
  }, []);

  const [communityLinks, setCommunityLinks] = useState<SocialCommunityLinks>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artisanpro_community_links');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn('Error loading community links:', e);
      }
    }
    return DEFAULT_COMMUNITY_LINKS;
  });

  // Official Channels (Canaux Officiels & Liens Professionnels de la Plateforme)
  const [officialChannels, setOfficialChannels] = useState<OfficialChannels>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artisanpro_official_channels');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Si contient l'ancien canal de test ou l'ancien nom de page, migrer vers les 4 liens officiels
          const whatsapp =
            parsed.whatsappChannel && !parsed.whatsappChannel.includes('0029Vb3artisanpro')
              ? cleanAndNormalizeLink(parsed.whatsappChannel)
              : PERMANENT_OFFICIAL_CHANNELS.whatsappChannel;
          const facebook =
            parsed.facebookPage && parsed.facebookPage !== 'https://facebook.com/artisanproafrique'
              ? cleanAndNormalizeLink(parsed.facebookPage)
              : PERMANENT_OFFICIAL_CHANNELS.facebookPage;
          const instagram =
            parsed.instagramTiktok
              ? cleanAndNormalizeLink(parsed.instagramTiktok)
              : PERMANENT_OFFICIAL_CHANNELS.instagramTiktok;
          const website =
            parsed.website
              ? cleanAndNormalizeLink(parsed.website)
              : PERMANENT_OFFICIAL_CHANNELS.website;

          const migrated: OfficialChannels = {
            whatsappChannel: whatsapp,
            facebookPage: facebook,
            instagramTiktok: instagram,
            website,
          };
          localStorage.setItem('artisanpro_official_channels', JSON.stringify(migrated));
          return migrated;
        } else {
          localStorage.setItem('artisanpro_official_channels', JSON.stringify(PERMANENT_OFFICIAL_CHANNELS));
        }
      } catch (e) {
        console.warn('Error loading official channels:', e);
      }
    }
    return PERMANENT_OFFICIAL_CHANNELS;
  });

  const updateOfficialChannels = useCallback((channels: Partial<OfficialChannels>) => {
    setOfficialChannels((prev) => {
      const updated: OfficialChannels = {
        whatsappChannel:
          channels.whatsappChannel !== undefined
            ? cleanAndNormalizeLink(channels.whatsappChannel)
            : prev.whatsappChannel,
        facebookPage:
          channels.facebookPage !== undefined
            ? cleanAndNormalizeLink(channels.facebookPage)
            : prev.facebookPage,
        instagramTiktok:
          channels.instagramTiktok !== undefined
            ? cleanAndNormalizeLink(channels.instagramTiktok)
            : prev.instagramTiktok,
        website:
          channels.website !== undefined
            ? cleanAndNormalizeLink(channels.website)
            : prev.website,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('artisanpro_official_channels', JSON.stringify(updated));
        window.dispatchEvent(new Event('artisanpro_official_channels_updated'));
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleSyncChannels = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('artisanpro_official_channels');
          if (stored) {
            setOfficialChannels(JSON.parse(stored));
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleSyncChannels);
    window.addEventListener('artisanpro_official_channels_updated', handleSyncChannels);
    return () => {
      window.removeEventListener('storage', handleSyncChannels);
      window.removeEventListener('artisanpro_official_channels_updated', handleSyncChannels);
    };
  }, []);

  // Wallet & Withdrawals: Nouveau solde initial = 0 FCFA (augmente seulement quand un client paie)
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artisanpro_wallet_balance');
        if (stored !== null && stored !== undefined) return Number(stored);
      } catch (e) {
        console.warn('Error loading wallet balance:', e);
      }
    }
    return 0; // Default: 0 FCFA
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artisanpro_withdrawals');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
        }
      } catch (e) {
        console.warn('Error loading withdrawals:', e);
      }
    }
    return INITIAL_WITHDRAWALS;
  });

  // OTP State (Prompt 1: 5 minutes expiry)
  const [activeOtp, setActiveOtp] = useState<ActiveOtpData | null>(null);

  // Langue & Pays africains (style Facebook)
  const [langueActuelle, setLangueActuelle] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('app_lang') ||
        localStorage.getItem('langue') ||
        localStorage.getItem('artisanpro_langue');
      if (saved && (saved === 'fr' || saved === 'en')) return saved as LanguageCode;
    }
    return 'fr';
  });

  const [paysSelectionne, setPaysSelectionne] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('artisanpro_pays');
      if (saved) return saved;
    }
    return "Côte d'Ivoire";
  });

  const changerLangue = useCallback((code: LanguageCode) => {
    setLangueActuelle(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', code);
      localStorage.setItem('langue', code);
      localStorage.setItem('artisanpro_langue', code);
    }
  }, []);

  const choisirPays = useCallback((nomPays: string) => {
    setPaysSelectionne(nomPays);
    if (typeof window !== 'undefined') {
      localStorage.setItem('artisanpro_pays', nomPays);
    }
    // Si le pays sélectionné correspond à un pays avec langue par défaut (ex: Nigeria, Ghana -> en)
    const trouve = paysAfricains.find((p) => p.nom.toLowerCase() === nomPays.toLowerCase());
    if (trouve && trouve.langue && (trouve.langue === 'fr' || trouve.langue === 'en')) {
      const langCode = trouve.langue as LanguageCode;
      setLangueActuelle(langCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_lang', langCode);
        localStorage.setItem('langue', langCode);
        localStorage.setItem('artisanpro_langue', langCode);
      }
    }
  }, []);

  const t = langues[langueActuelle] || langues.fr;

  // Toast
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Modals
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [quoteTargetArtisan, setQuoteTargetArtisan] = useState<Artisan | null>(null);
  const [quoteServiceTitle, setQuoteServiceTitle] = useState<string | undefined>(undefined);

  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentPlan, setPaymentPlan] = useState<PlanType>('Pro');
  const [paymentService, setPaymentService] = useState<MarketplaceService | undefined>(undefined);
  const [paymentCustomTitle, setPaymentCustomTitle] = useState<string | undefined>(undefined);
  const [paymentCustomAmount, setPaymentCustomAmount] = useState<number | undefined>(undefined);

  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [supportTopic, setSupportTopic] = useState<string | undefined>(undefined);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'demo'>('login');
  const [artisan13kModalOpen, setArtisan13kModalOpen] = useState<boolean>(false);

  const showToast = useCallback((t: ToastInfo) => {
    setToast(t);
    setTimeout(() => {
      setToast((prev) => (prev?.title === t.title ? null : prev));
    }, 4500);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const go = useCallback((targetPage: PageName) => {
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [artList, planList, srvList, notifList, userList] = await Promise.all([
        api.getArtisans().catch(() => INITIAL_ARTISANS),
        api.getPlans().catch(() => INITIAL_PLANS),
        api.getServices().catch(() => INITIAL_SERVICES),
        api.getNotifications(currentUser?.id).catch(() => INITIAL_NOTIFICATIONS),
        api.getUsers().catch(() => INITIAL_CLIENTS),
      ]);

      const resolvedArtisans = artList && artList.length > 0 ? artList : INITIAL_ARTISANS;
      const resolvedPlans = planList && planList.length > 0 ? planList : INITIAL_PLANS;
      const resolvedServices = srvList && srvList.length > 0 ? srvList : INITIAL_SERVICES;
      const resolvedNotifs = notifList && notifList.length > 0 ? notifList : INITIAL_NOTIFICATIONS;
      const resolvedUsers = userList && userList.length > 0 ? userList : INITIAL_CLIENTS;

      setArtisans(resolvedArtisans);
      setUsers(resolvedUsers);
      setPlans(resolvedPlans);
      setServices(resolvedServices);
      setNotifications(resolvedNotifs);

      // Facebook-style persistent session restoration
      const isLogged =
        typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
      const savedUserId =
        typeof window !== 'undefined' ? localStorage.getItem('artisanpro_user_id') : null;
      const savedEmail =
        typeof window !== 'undefined' ? localStorage.getItem('email') : null;

      if (isLogged) {
        let userToSet: User | null = null;
        if (resolvedUsers.length > 0) {
          userToSet =
            resolvedUsers.find(
              (u) =>
                u.id === savedUserId ||
                (savedEmail && u.email?.toLowerCase() === savedEmail.toLowerCase())
            ) || null;
        }
        if (!userToSet) {
          try {
            const raw = localStorage.getItem('userData');
            if (raw) userToSet = JSON.parse(raw);
          } catch {}
        }
        if (userToSet) {
          setCurrentUser(userToSet);
          localStorage.setItem('userData', JSON.stringify(userToSet));
          if (userToSet.artisanId) {
            const art = resolvedArtisans.find((a) => a.id === userToSet!.artisanId) || null;
            setCurrentArtisan(art);
          }
        }
      } else if (currentUser?.artisanId) {
        const art = resolvedArtisans.find((a) => a.id === currentUser.artisanId) || null;
        setCurrentArtisan(art);
      }
    } catch (err) {
      console.warn('Silent fallback on initial data fetch:', err);
      setArtisans((prev) => (prev.length > 0 ? prev : INITIAL_ARTISANS));
      setPlans((prev) => (prev.length > 0 ? prev : INITIAL_PLANS));
      setServices((prev) => (prev.length > 0 ? prev : INITIAL_SERVICES));
      setNotifications((prev) => (prev.length > 0 ? prev : INITIAL_NOTIFICATIONS));
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
    // Subscribe to live Firestore updates for artisans
    const unsubscribeArtisans = firestoreService.onArtisansChange((liveArtisans) => {
      if (liveArtisans && liveArtisans.length > 0) {
        setArtisans(liveArtisans);
      }
    });

    // Subscribe to global live Firestore updates for publications (Fil d'actualité partagé)
    const unsubscribePubs = firestoreService.onPublicationsChange((livePosts) => {
      if (livePosts && livePosts.length > 0) {
        const localArtisans = loadLocalArtisanPosts();
        const sorted = livePosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const seen = new Set(localArtisans.map((p) => p.id));
        const filtered = sorted.filter((p) => !seen.has(p.id));
        const combined = [...localArtisans, ...filtered];
        setSocialPosts(combined);
        if (typeof window !== 'undefined') {
          try {
            const safe = combined.slice(0, 40).map((p) =>
              p.mediaUrl && p.mediaUrl.length > 150000 ? { ...p, mediaUrl: '' } : p
            );
            localStorage.setItem('allPosts', JSON.stringify(safe));
            localStorage.setItem('artisanpro_social_posts', JSON.stringify(safe));
          } catch {}
        }
      }
    });

    return () => {
      unsubscribeArtisans();
      unsubscribePubs();
    };
  }, [refreshData]);

  // Subscription expiration detection (server-authoritative)
  const isSubscriptionExpired = Boolean(
    currentUser &&
      currentUser.role === 'artisan' &&
      (currentUser.subscription_status === 'expired' ||
        currentUser.artisan_status === 'expired' ||
        (currentUser.subscription_end_date &&
          new Date(currentUser.subscription_end_date).getTime() < Date.now()))
  );

  const canAccessProFeatures = Boolean(
    currentUser &&
      (currentUser.role === 'admin' ||
        currentUser.role === 'super_admin' ||
        (currentUser.role === 'artisan' &&
          currentUser.subscription_status === 'active' &&
          !isSubscriptionExpired))
  );

  const checkSubscriptionStatus = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const statusData = await api.getUserSubscriptionStatus(currentUser.id);
      if (statusData && (statusData.subscription_status || statusData.isExpired !== undefined)) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          if (
            prev.subscription_status !== statusData.subscription_status ||
            prev.artisan_status !== statusData.artisan_status ||
            prev.subscription_plan !== statusData.subscription_plan ||
            prev.subscription_end_date !== statusData.subscription_end_date
          ) {
            const updated: User = {
              ...prev,
              role: statusData.role || prev.role,
              subscription_status: statusData.subscription_status,
              artisan_status: statusData.artisan_status,
              subscription_plan: statusData.subscription_plan,
              subscription_end_date: statusData.subscription_end_date,
            };
            try {
              localStorage.setItem('userData', JSON.stringify(updated));
              localStorage.setItem('artisanPro_user', JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Subscription check error:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      checkSubscriptionStatus();
    }
  }, [currentUser?.id, page, checkSubscriptionStatus]);

  // Request browser GPS position
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n’est pas prise en charge par votre navigateur.');
      showToast({
        title: 'Géolocalisation indisponible',
        desc: 'Votre navigateur ne supporte pas l’API Geolocation.',
        type: 'warning',
      });
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);
        showToast({
          title: 'Position détectée avec succès',
          desc: `Coordonnées : ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          type: 'success',
        });
      },
      (err) => {
        setIsLocating(false);
        // Fallback gracefully to Abidjan Plateau
        setUserLocation(DEFAULT_COORDS);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Autorisation refusée. Utilisation de la position par défaut (Abidjan).'
            : 'Impossible d’obtenir votre position exacte. Position centrée sur Abidjan.';
        setLocationError(msg);
        showToast({
          title: 'Position par défaut activée',
          desc: 'Position centrée sur Abidjan pour calculer les distances.',
          type: 'info',
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [showToast]);

  // Haversine formula
  const calculateDistance = useCallback(
    (lat: number, lng: number): number | null => {
      const origin = userLocation || DEFAULT_COORDS;
      if (!origin) return null;

      const R = 6371; // km
      const dLat = ((lat - origin.lat) * Math.PI) / 180;
      const dLon = ((lng - origin.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origin.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    },
    [userLocation]
  );

  const startChatWithArtisan = useCallback(
    (artisanOrId: number | Artisan) => {
      const id = typeof artisanOrId === 'number' ? artisanOrId : artisanOrId?.id;
      if (id) setSelectedArtisanId(id);
      go('messages');
    },
    [go]
  );

  const markNotifAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAllNotifsAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead(currentUser?.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const switchUser = useCallback(
    async (user: User, shouldRedirect: boolean = true) => {
      // Sécurité : Les emails administrateur officiel reçoivent TOUJOURS le rôle super_admin, jamais client
      const effectiveUser: User = isExactAdminEmail(user.email)
        ? { ...user, role: 'super_admin' }
        : user;

      setCurrentUser(effectiveUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('email', effectiveUser.email || '');
        localStorage.setItem('artisanPro_user', JSON.stringify(effectiveUser));
        localStorage.setItem('userData', JSON.stringify(effectiveUser));
        localStorage.setItem('artisanpro_user_id', effectiveUser.id);
      }
      if (effectiveUser.artisanId) {
        const art = artisans.find((a) => a.id === effectiveUser.artisanId) || null;
        setCurrentArtisan(art);
      } else {
        setCurrentArtisan(null);
      }
      showToast({
        title: `Connecté en tant que ${effectiveUser.name}`,
        desc: `Rôle : ${effectiveUser.role.toUpperCase()}`,
        type: 'info',
      });
      // Refresh notifications for this user
      const notifs = await api.getNotifications(effectiveUser.id);
      setNotifications(notifs);

      // Redirection automatique vers Accueil (feed des artisans)
      if (shouldRedirect) {
        go('home');
      }
    },
    [artisans, go, showToast]
  );

  const uploadProfilePhoto = useCallback(
    async (photoUrl: string) => {
      if (!currentUser) return;
      try {
        await api.uploadProfilePhoto(currentUser.id, photoUrl);
        if (currentUser.artisanId) {
          await api.uploadProfilePhoto(currentUser.artisanId, photoUrl);
        }
        setCurrentUser((prev) => (prev ? { ...prev, avatarUrl: photoUrl, photoUrl: photoUrl, avatar: photoUrl } : prev));
        if (currentUser.artisanId) {
          setCurrentArtisan((prev) => (prev ? { ...prev, avatarUrl: photoUrl, photoUrl: photoUrl } : prev));
          setArtisans((prev) =>
            prev.map((a) => (a.id === currentUser.artisanId ? { ...a, avatarUrl: photoUrl, photoUrl: photoUrl } : a))
          );
        }
        showToast({
          title: 'Photo de profil mise à jour !',
          desc: 'Votre photo a été enregistrée. Votre bannière reste inchangée.',
          type: 'success',
        });
      } catch (err: any) {
        showToast({
          title: 'Erreur',
          desc: 'Impossible de mettre à jour la photo de profil.',
          type: 'warning',
        });
      }
    },
    [currentUser, showToast]
  );

  const uploadCoverPhoto = useCallback(
    async (coverUrl: string) => {
      if (!currentUser) return;
      try {
        await api.uploadCoverPhoto(currentUser.id, coverUrl);
        if (currentUser.artisanId) {
          await api.uploadCoverPhoto(currentUser.artisanId, coverUrl);
        }
        setCurrentUser((prev) => (prev ? { ...prev, bannerUrl: coverUrl, coverUrl: coverUrl } : prev));
        if (currentUser.artisanId) {
          setCurrentArtisan((prev) => (prev ? { ...prev, bannerUrl: coverUrl, coverUrl: coverUrl } : prev));
          setArtisans((prev) =>
            prev.map((a) => (a.id === currentUser.artisanId ? { ...a, bannerUrl: coverUrl, coverUrl: coverUrl } : a))
          );
        }
        showToast({
          title: 'Bannière mise à jour !',
          desc: 'Votre bannière a été enregistrée. Votre photo de profil reste inchangée.',
          type: 'success',
        });
      } catch (err: any) {
        showToast({
          title: 'Erreur',
          desc: 'Impossible de mettre à jour la bannière.',
          type: 'warning',
        });
      }
    },
    [currentUser, showToast]
  );

  const updateUserProfile = useCallback(
    async (userData: Partial<User>, artisanData?: Partial<Artisan>) => {
      if (!currentUser) return;
      try {
        const updatedUser = await api.updateUser(currentUser.id, userData);
        setCurrentUser(updatedUser);

        if (currentUser.artisanId) {
          const mergedArtisan: Partial<Artisan> = {
            ...(artisanData || {}),
            ...(userData.avatarUrl ? { avatarUrl: userData.avatarUrl, photoUrl: userData.avatarUrl } : {}),
            ...(userData.bannerUrl ? { bannerUrl: userData.bannerUrl, coverUrl: userData.bannerUrl } : {}),
            ...(userData.name ? { name: userData.name } : {}),
            ...(userData.phone ? { phone: userData.phone } : {}),
            ...(userData.city ? { city: userData.city } : {}),
            ...(userData.country ? { country: userData.country } : {}),
          };
          const updatedArt = await api.updateArtisan(currentUser.artisanId, mergedArtisan);
          setCurrentArtisan(updatedArt);
          setArtisans((prev) =>
            prev.map((a) => (a.id === currentUser.artisanId ? updatedArt : a))
          );
        }
        showToast({
          title: 'Profil mis à jour !',
          desc: 'Vos coordonnées et médias ont été enregistrés avec succès.',
          type: 'success',
        });
      } catch (err: any) {
        showToast({
          title: 'Erreur',
          desc: err.message || 'Impossible de mettre à jour le profil',
          type: 'warning',
        });
      }
    },
    [currentUser, showToast]
  );

  // Conversion instantanée CLIENT -> ARTISAN après paiement 13.000 FCFA
  // Conserve le même compte (même ID, même email, même numéro), ne crée PAS de nouveau user
  const upgradeClientToArtisan = useCallback(
    async (txId?: string, _paymentOperator: string = 'Wave / CinetPay') => {
      if (!currentUser) return;
      const finalTxId = txId || `TXN-ARTISAN-${Date.now()}`;
      const now = Date.now();

      // 1. Récupérer ou initialiser le profil artisan associé
      let artId = currentUser.artisanId;
      let existingArtisan = artId ? artisans.find((a) => a.id === artId) : null;

      if (!existingArtisan) {
        existingArtisan =
          artisans.find(
            (a) => a.email && a.email.toLowerCase() === currentUser.email?.toLowerCase()
          ) || null;
        if (existingArtisan) {
          artId = existingArtisan.id;
        }
      }

      if (!existingArtisan) {
        try {
          const createdArt = await api.createArtisan({
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone || '0503444508',
            city: currentUser.city || 'Abidjan',
            country: currentUser.country || 'Côte d’Ivoire',
            trade: currentUser.trade || 'Artisan Polyvalent',
            rating: 5.0,
            reviewsCount: 1,
            plan: 'Pro',
            emoji: '🛠️',
            services: ['Prestations & Chantiers'],
            description: currentUser.bio || 'Artisan professionnel vérifié. Disponible pour tous travaux.',
            lat: 5.3484,
            lng: -4.0180,
            verified: true,
            is_verified: true,
            hasPaid10k: true,
            a_paye_10k: true,
            hasPaidActivation13k: true,
            hourlyRate: '10 000 FCFA',
          });
          existingArtisan = createdArt;
          artId = createdArt.id;
        } catch (e) {
          console.warn('Fallback local artisan creation:', e);
          const fallbackArt: Artisan = {
            id: Date.now(),
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone || '0503444508',
            city: currentUser.city || 'Abidjan',
            country: currentUser.country || 'Côte d’Ivoire',
            trade: currentUser.trade || 'Artisan Polyvalent',
            rating: 5.0,
            reviewsCount: 1,
            plan: 'Pro',
            emoji: '🛠️',
            services: ['Prestations & Chantiers'],
            description: currentUser.bio || 'Artisan professionnel vérifié.',
            lat: 5.3484,
            lng: -4.0180,
            verified: true,
            is_verified: true,
            hasPaid10k: true,
            a_paye_10k: true,
            hasPaidActivation13k: true,
            hourlyRate: '10 000 FCFA',
            profileViews: 1,
            contactsCount: 0,
            joinedDate: new Date().toISOString().split('T')[0],
          };
          existingArtisan = fallbackArt;
          artId = fallbackArt.id;
        }
      } else {
        try {
          await api.updateArtisan(existingArtisan.id, {
            verified: true,
            is_verified: true,
            hasPaid10k: true,
            a_paye_10k: true,
            hasPaidActivation13k: true,
          });
        } catch {}
        existingArtisan = {
          ...existingArtisan,
          verified: true,
          is_verified: true,
          hasPaid10k: true,
          a_paye_10k: true,
          hasPaidActivation13k: true,
        };
      }

      // 2. Préparer les données de mise à jour du compte utilisateur existant
      const userUpdates: Partial<User> = {
        role: 'artisan',
        isArtisan: true,
        artisanPaidAt: now,
        transactionId: finalTxId,
        hasPaid13k: true,
        hasPaidActivation13k: true,
        hasPaid10k: true,
        a_paye_10k: true,
        verified: true,
        is_verified: true,
        artisanId: artId,
      };

      const updatedUser: User = {
        ...currentUser,
        ...userUpdates,
      };

      // 3. Persistance dans la base Firestore via updateUser
      try {
        await api.updateUser(currentUser.id, userUpdates);
      } catch (e) {
        console.warn('Fallback updateUser error:', e);
      }

      // 4. Mise à jour de l'état React et du stockage local
      setCurrentUser(updatedUser);
      setCurrentArtisan(existingArtisan);
      if (existingArtisan) {
        setArtisans((prev) => {
          const found = prev.some((a) => a.id === existingArtisan!.id);
          if (found) return prev.map((a) => (a.id === existingArtisan!.id ? existingArtisan! : a));
          return [existingArtisan!, ...prev];
        });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        localStorage.setItem('user_role', 'artisan');
        localStorage.setItem('hasPaid13k', 'true');
        localStorage.setItem('artisanpro_paid_13k', 'true');
        localStorage.setItem(`artisanpro_paid_13k_${currentUser.id}`, 'true');
        localStorage.setItem(`artisanpro_verified_${currentUser.id}`, 'true');
        localStorage.setItem('email', updatedUser.email);
      }

      // 5. Message de succès obligatoire demandé :
      // "Bienvenue Artisan ! Tu es maintenant artisan vérifié, tu peux recevoir des commandes."
      showToast({
        title: 'Bienvenue Artisan !',
        desc: 'Tu es maintenant artisan vérifié, tu peux recevoir des commandes.',
        type: 'success',
      });

      // 6. Redirection directe vers le tableau de bord / profil artisan
      go('account');
    },
    [currentUser, artisans, go, showToast]
  );

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('email');
      localStorage.removeItem('artisanPro_user');
      localStorage.removeItem('userData');
      localStorage.removeItem('artisanpro_user_id');
      try {
        window.history.replaceState(null, '', '/login');
      } catch {}
    }
    setCurrentUser(null);
    setCurrentArtisan(null);
    showToast({
      title: 'Déconnexion effectuée',
      desc: 'Inscrivez-vous ou connectez-vous pour voir Artisan Pro',
      type: 'info',
    });
    setPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showToast]);

  // Prompt 1: OTP Generation & Verification (5 min expiry)
  const sendOtp = useCallback(
    async (identifier: string, _type: 'inscription' | 'reconnexion' = 'inscription'): Promise<string> => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
      const otpData = { code, identifier, expiresAt };
      setActiveOtp(otpData);

      // Notification visible immédiate
      showToast({
        title: `📲 Code de validation : ${code}`,
        desc: `Code envoyé à ${identifier} (Expire dans 5 minutes)`,
        type: 'success',
      });
      return code;
    },
    [showToast]
  );

  const verifyOtp = useCallback(
    (_identifier: string, code: string): boolean => {
      if (!activeOtp) return false;
      const isExpired = Date.now() > activeOtp.expiresAt;
      if (isExpired) {
        showToast({
          title: 'Code expiré',
          desc: 'Le code à 6 chiffres a expiré (délai de 5 minutes). Veuillez en renvoyer un nouveau.',
          type: 'warning',
        });
        return false;
      }
      return activeOtp.code.trim() === code.trim();
    },
    [activeOtp, showToast]
  );

  // Prompt 4: Social Community Links
  const updateCommunityLinks = useCallback(
    async (links: Partial<SocialCommunityLinks>) => {
      setCommunityLinks((prev) => {
        const updated = { ...prev, ...links };
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_community_links', JSON.stringify(updated));
        }
        return updated;
      });
      showToast({
        title: 'Réseaux sociaux enregistrés',
        desc: 'Les liens WhatsApp et Facebook ont été mis à jour avec succès.',
        type: 'success',
      });
    },
    [showToast]
  );

  // Publications & Social Feed (Global sync)
  const createSocialPost = useCallback(
    async (data: Partial<SocialPost> & { mediaFile?: File | Blob | null }) => {
      const postId = data.id || `post-${Date.now()}`;
      const isAdminUser =
        currentUser?.role === 'admin' ||
        currentUser?.role === 'super_admin' ||
        (currentArtisan?.plan as string) === 'Admin' ||
        (currentUser?.email && isExactAdminEmail(currentUser.email));

      // Règle 2: Quand ADMIN publie -> author: "ADMIN ArtisanPro", role: "ADMIN", isAdmin: true
      // Règle 2: Quand ARTISAN publie -> author: user.nom, role: "ARTISAN"
      const author = isAdminUser
        ? 'ADMIN ArtisanPro'
        : (currentUser?.name || currentArtisan?.name || 'Artisan Qualifié');
      const role = isAdminUser ? 'ADMIN' : 'ARTISAN';
      const isAdmin = Boolean(isAdminUser);

      // Détection publicité
      const isPub = Boolean(
        data.isPub ||
        (data.price && data.price.trim().toLowerCase() === 'pub') ||
        (data.price && data.price.toLowerCase().includes('pub')) ||
        (data.content && data.content.toLowerCase().includes('#pub'))
      );

      // Gestion du média (IndexedDB & Cloud)
      let finalMediaUrl = data.mediaUrl || '';
      let mediaId = data.mediaId || `media_${postId}`;

      if (data.mediaFile) {
        try {
          const stored = await uploadOrStoreMedia(data.mediaFile, mediaId);
          finalMediaUrl = stored.mediaUrl;
          mediaId = stored.mediaId;
        } catch (mediaErr) {
          console.warn('Erreur stockage média:', mediaErr);
        }
      }

      const postUserId =
        data.userId ||
        currentUser?.id ||
        (currentArtisan ? String(currentArtisan.id) : `user_${Date.now()}`);

      const newPost: SocialPost = {
        id: postId,
        userId: postUserId,
        storagePath: data.storagePath,
        author,
        role,
        isAdmin,
        isPub,
        artisanId: isAdmin ? 0 : (currentArtisan?.id || (currentUser?.artisanId ?? 1)),
        artisanName: author,
        artisanTrade: isAdmin
          ? 'Plateforme Officielle'
          : (currentArtisan?.trade || currentUser?.trade || 'Artisanat & Métiers'),
        artisanEmoji: isAdmin ? '🛡️' : (currentArtisan?.emoji || '✨'),
        artisanAvatar: isAdmin ? undefined : (currentArtisan?.avatarUrl || currentUser?.avatarUrl),
        verified: true,
        city: currentArtisan?.city || currentUser?.city || 'Abidjan',
        country: currentArtisan?.country || currentUser?.country || 'Côte d’Ivoire',
        content: data.content || '',
        mediaType: data.mediaType || 'photo',
        mediaUrl: finalMediaUrl,
        mediaId,
        posterUrl: data.posterUrl,
        price: data.price || 'Tarif sur devis',
        priceValue: data.priceValue || 15000,
        likesCount: 0,
        likedBy: [],
        viewsCount: 1,
        comments: [],
        sharesCount: 0,
        createdAt: data.createdAt || new Date().toISOString(),
        phone: currentArtisan?.phone || currentUser?.phone,
        whatsapp: currentArtisan?.whatsapp || currentUser?.whatsapp,
      };

      // 1. Mise à jour de l'état local partagé allPosts (tri chronologique descendant)
      setSocialPosts((prev) => {
        const withoutOld = prev.filter((p) => p.id !== postId);
        const updated = [newPost, ...withoutOld].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (typeof window !== 'undefined') {
          try {
            const safeToStore = updated.slice(0, 40).map((post) => {
              if (post.mediaUrl && post.mediaUrl.length > 150000) {
                return {
                  ...post,
                  mediaUrl: '',
                };
              }
              return post;
            });
            localStorage.setItem('allPosts', JSON.stringify(safeToStore));
            localStorage.setItem('artisanpro_social_posts', JSON.stringify(safeToStore));
          } catch (storageErr) {
            console.warn('Sauvegarde locale ignorée:', storageErr);
          }
        }
        return updated;
      });

      // 2. Persistance globale dans Firestore collection("publications")
      try {
        await firestoreService.savePublication(newPost);
      } catch (e) {
        console.warn('Firestore savePublication fallback:', e);
      }

      showToast({
        title: 'Publication en ligne !',
        desc: 'Visible par tous les utilisateurs sur le fil d’actualité.',
        type: 'success',
      });
    },
    [currentArtisan, currentUser, showToast]
  );

  const deleteSocialPost = useCallback(
    async (postId: string) => {
      const targetPost = socialPosts.find((p) => p.id === postId);

      // Si média stocké dans Firebase Storage, suppression
      if (targetPost?.storagePath) {
        try {
          const { ref, deleteObject } = await import('firebase/storage');
          const fileRef = ref(storage, targetPost.storagePath);
          await deleteObject(fileRef).catch((err) => {
            console.warn('deleteObject storage warning:', err);
          });
        } catch (e) {
          console.warn('Erreur suppression Storage:', e);
        }
      }

      // Supprimer du document Firestore collection "publications"
      try {
        await firestoreService.deletePublication(postId);
      } catch (e) {
        console.warn('Erreur deletePublication firestore:', e);
      }

      // Retirer du feed instantanément sans refresh
      setSocialPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== postId);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('allPosts', JSON.stringify(filtered.slice(0, 40)));
            localStorage.setItem('artisanpro_social_posts', JSON.stringify(filtered.slice(0, 40)));

            // Synchroniser avec artisanPosts
            const rawArtisan = localStorage.getItem('artisanPosts');
            if (rawArtisan) {
              const parsed = JSON.parse(rawArtisan);
              if (Array.isArray(parsed)) {
                const updated = parsed.filter((p: any) => String(p.id) !== String(postId));
                localStorage.setItem('artisanPosts', JSON.stringify(updated));
              }
            }
          } catch {}
        }
        return filtered;
      });

      // Suppression dans IndexedDB si existant
      try {
        const { deleteVideoAndThumbnail } = await import('../services/indexedDbService.ts');
        await deleteVideoAndThumbnail(postId);
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('artisanPostsUpdated'));
      }

      showToast({
        title: 'Publication supprimée',
        desc: 'La publication a été définitivement supprimée du fil.',
        type: 'success',
      });
    },
    [socialPosts, showToast]
  );

  const likeSocialPost = useCallback(
    async (postId: string) => {
      const currentUserId = currentUser?.id || 'guest';
      let targetPostToSync: SocialPost | null = null;

      setSocialPosts((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== postId) return p;
          const alreadyLiked = p.likedBy.includes(currentUserId);
          const newLikesCount = alreadyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1;
          const newLikedBy = alreadyLiked
            ? p.likedBy.filter((id) => id !== currentUserId)
            : [...p.likedBy, currentUserId];

          const postUpdated: SocialPost = {
            ...p,
            likesCount: newLikesCount,
            likedBy: newLikedBy,
          };
          targetPostToSync = postUpdated;
          return postUpdated;
        });

        if (typeof window !== 'undefined') {
          try {
            const safe = updated.slice(0, 40).map((p) =>
              p.mediaUrl && p.mediaUrl.length > 150000 ? { ...p, mediaUrl: '' } : p
            );
            localStorage.setItem('allPosts', JSON.stringify(safe));
            localStorage.setItem('artisanpro_social_posts', JSON.stringify(safe));
          } catch {}
        }
        return updated;
      });

      if (targetPostToSync) {
        firestoreService.savePublication(targetPostToSync).catch(() => {});
      }
    },
    [currentUser]
  );

  const addPostComment = useCallback(
    async (postId: string, text: string, parentId: string | null = null) => {
      if (!text.trim()) return;

      const currentUserId = currentUser?.id || 'guest';
      const currentUserName = currentUser?.name || 'Utilisateur ArtisanPro';
      const currentUserRole = currentUser?.role || 'client';

      const newComment: PostComment = {
        id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        postId,
        userId: currentUserId,
        userName: currentUserName,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: currentUserRole,
        userAvatar: currentUser?.avatarUrl,
        text: text.trim(),
        parentId: parentId || null,
        replies: [],
        createdAt: new Date().toISOString(),
      };

      let targetPostToUpdate: SocialPost | undefined;

      setSocialPosts((prev) => {
        const updated = prev.map((p) => {
          if (p.id === postId) {
            const commentsList = p.comments || [];
            const postWithComment: SocialPost = {
              ...p,
              comments: [...commentsList, newComment],
            };
            targetPostToUpdate = postWithComment;
            return postWithComment;
          }
          return p;
        });

        if (typeof window !== 'undefined') {
          try {
            const safe = updated.slice(0, 40).map((p) =>
              p.mediaUrl && p.mediaUrl.length > 150000 ? { ...p, mediaUrl: '' } : p
            );
            localStorage.setItem('allPosts', JSON.stringify(safe));
            localStorage.setItem('artisanpro_social_posts', JSON.stringify(safe));
          } catch {}
        }
        return updated;
      });

      // Persistance dans Firestore collection("commentaires")
      try {
        await firestoreService.saveComment(newComment);
        if (targetPostToUpdate) {
          await firestoreService.savePublication(targetPostToUpdate);
        }
      } catch (err) {
        console.warn('Firestore saveComment error:', err);
      }

      showToast({
        title: 'Commentaire publié',
        desc: parentId ? 'Votre réponse a été ajoutée.' : 'Votre commentaire est en ligne.',
        type: 'success',
      });
    },
    [currentUser, showToast]
  );

  // Prompt 7: Wallet & Retraits
  const requestWithdrawal = useCallback(
    async (data: {
      operator: 'Orange Money' | 'MTN Mobile Money' | 'Moov Money' | 'Wave';
      amount: number;
      phone: string;
      currency?: string;
    }) => {
      if (data.amount < 5000) {
        throw new Error('Retrait minimum : 5 000 FCFA requis.');
      }
      if (data.amount > 30000) {
        throw new Error('Retrait maximum : 30 000 FCFA par demande.');
      }
      if (walletBalance < data.amount) {
        throw new Error('Solde insuffisant dans votre portefeuille.');
      }

      const newReq: WithdrawalRequest = {
        id: `wd-${Date.now()}`,
        userId: currentUser?.id || 'artisan-user',
        userName: currentUser?.name || 'Artisan Partenaire',
        userPhone: data.phone,
        operator: data.operator,
        amount: data.amount,
        currency: data.currency || 'FCFA',
        date: new Date().toISOString(),
        status: 'en_attente',
      };

      setWithdrawals((prev) => {
        const updated = [newReq, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_withdrawals', JSON.stringify(updated));
        }
        return updated;
      });

      setWalletBalance((prev) => {
        const updated = Math.max(0, prev - data.amount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_wallet_balance', updated.toString());
        }
        return updated;
      });
    },
    [currentUser, walletBalance]
  );

  const updateWithdrawalStatus = useCallback(
    async (id: string, status: 'approuve' | 'refuse') => {
      setWithdrawals((prev) => {
        const updated = prev.map((w) => (w.id === id ? { ...w, status } : w));
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_withdrawals', JSON.stringify(updated));
        }
        return updated;
      });
      showToast({
        title: status === 'approuve' ? 'Retrait validé & Payé !' : 'Demande de retrait refusée',
        desc: `La demande a été mise à jour (${status === 'approuve' ? 'Payé' : 'Refusé'}).`,
        type: status === 'approuve' ? 'success' : 'info',
      });
    },
    [showToast]
  );

  const approveWithdrawal = useCallback(
    async (id: string) => {
      setWithdrawals((prev) => {
        const updated = prev.map((w) => (w.id === id ? { ...w, status: 'approuve' as const } : w));
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_withdrawals', JSON.stringify(updated));
        }
        return updated;
      });
      showToast({
        title: 'Retrait validé & Payé !',
        desc: 'Le retrait Mobile Money a été approuvé. Support de suivi retraits : +225 0503444508.',
        type: 'success',
      });
    },
    [showToast]
  );

  const rejectWithdrawal = useCallback(
    async (id: string) => {
      setWithdrawals((prev) => {
        const target = prev.find((w) => w.id === id);
        if (target && target.status !== 'refuse') {
          // Re-credit wallet
          setWalletBalance((b) => {
            const refunded = b + target.amount;
            if (typeof window !== 'undefined') {
              localStorage.setItem('artisanpro_wallet_balance', refunded.toString());
            }
            return refunded;
          });
        }
        const updated = prev.map((w) => (w.id === id ? { ...w, status: 'refuse' as const } : w));
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_withdrawals', JSON.stringify(updated));
        }
        return updated;
      });
      showToast({
        title: 'Demande de retrait refusée',
        desc: 'Le montant a été recrédité sur le portefeuille de l’artisan.',
        type: 'info',
      });
    },
    [showToast]
  );

  const creditArtisanWallet = useCallback(
    (amount: number, description?: string) => {
      setWalletBalance((prev) => {
        const updated = prev + amount;
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_wallet_balance', updated.toString());
        }
        return updated;
      });
      showToast({
        title: 'Solde crédité !',
        desc: description || `Votre portefeuille a été crédité de ${amount.toLocaleString('fr-FR')} FCFA.`,
        type: 'success',
      });
    },
    [showToast]
  );

  const toggleFollowArtisan = useCallback(
    (artisanId: number) => {
      setFollowingArtisans((prev) => {
        const isFollowing = prev.includes(artisanId);
        const updated = isFollowing ? prev.filter((id) => id !== artisanId) : [...prev, artisanId];
        if (typeof window !== 'undefined') {
          localStorage.setItem('artisanpro_following', JSON.stringify(updated));
        }
        showToast({
          title: isFollowing ? 'Désabonné' : 'Abonnement réussi !',
          desc: isFollowing
            ? 'Vous ne suivez plus cet artisan.'
            : 'Vous suivez désormais cet artisan. Vous serez alerté de ses nouvelles réalisations.',
          type: isFollowing ? 'info' : 'success',
        });
        return updated;
      });
    },
    [showToast]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      try {
        await api.deleteUser(userId);
      } catch (err) {
        console.warn('Error deleting user:', err);
      }
      showToast({
        title: 'Utilisateur supprimé',
        desc: 'Le compte a été retiré de la plateforme avec succès.',
        type: 'info',
      });
    },
    [showToast]
  );

  const deleteArtisan = useCallback(
    async (artisanId: number) => {
      setArtisans((prev) => prev.filter((a) => a.id !== artisanId));
      try {
        await api.deleteArtisan(artisanId);
      } catch (err) {
        console.warn('Error deleting artisan:', err);
      }
      showToast({
        title: 'Artisan supprimé',
        desc: 'Le profil artisan a été supprimé de la plateforme.',
        type: 'info',
      });
    },
    [showToast]
  );

  const selectedArtisan = selectedArtisanId
    ? artisans.find((a) => a.id === selectedArtisanId) || null
    : null;

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        page,
        go,
        currentUser,
        currentArtisan,
        artisans,
        plans,
        services,
        selectedArtisanId,
        setSelectedArtisanId,
        selectedArtisan,
        notifications,
        unreadNotifsCount,
        markNotifAsRead,
        markAllNotifsAsRead,
        userLocation,
        locationError,
        isLocating,
        requestUserLocation,
        calculateDistance,
        searchQuery,
        setSearchQuery,
        selectedTrade,
        setSelectedTrade,
        selectedCity,
        setSelectedCity,
        toast,
        showToast,
        hideToast,
        socialPosts,
        createSocialPost,
        deleteSocialPost,
        likeSocialPost,
        addPostComment,
        communityLinks,
        updateCommunityLinks,
        officialChannels,
        updateOfficialChannels,
        walletBalance,
        creditArtisanWallet,
        withdrawals,
        requestWithdrawal,
        updateWithdrawalStatus,
        approveWithdrawal,
        rejectWithdrawal,
        users,
        deleteUser,
        deleteArtisan,
        followingArtisans,
        toggleFollowArtisan,
        activeOtp,
        sendOtp,
        verifyOtp,
        langueActuelle,
        t,
        changerLangue,
        paysSelectionne,
        choisirPays,
        quoteModal: {
          isOpen: quoteModalOpen,
          artisan: quoteTargetArtisan,
          serviceTitle: quoteServiceTitle,
          open: (artisan, sTitle) => {
            setQuoteTargetArtisan(artisan);
            setQuoteServiceTitle(sTitle);
            setQuoteModalOpen(true);
          },
          close: () => setQuoteModalOpen(false),
        },
        paymentModal: {
          isOpen: paymentModalOpen,
          plan: paymentPlan,
          service: paymentService,
          customTitle: paymentCustomTitle,
          customAmount: paymentCustomAmount,
          open: (planOrConfig) => {
            if (typeof planOrConfig === 'string') {
              setPaymentPlan(planOrConfig);
              setPaymentService(undefined);
              setPaymentCustomTitle(undefined);
              setPaymentCustomAmount(undefined);
            } else if (planOrConfig && typeof planOrConfig === 'object') {
              if (planOrConfig.plan) setPaymentPlan(planOrConfig.plan);
              setPaymentService(planOrConfig.service);
              setPaymentCustomTitle(planOrConfig.customTitle);
              setPaymentCustomAmount(planOrConfig.customAmount);
            }
            setPaymentModalOpen(true);
          },
          close: () => {
            setPaymentModalOpen(false);
            setPaymentService(undefined);
            setPaymentCustomTitle(undefined);
            setPaymentCustomAmount(undefined);
          },
        },
        supportModal: {
          isOpen: supportModalOpen,
          initialTopic: supportTopic,
          open: (topic) => {
            setSupportTopic(topic);
            setSupportModalOpen(true);
          },
          close: () => {
            setSupportModalOpen(false);
            setSupportTopic(undefined);
          },
        },
        authModal: {
          isOpen: authModalOpen,
          initialTab: authModalTab,
          open: (tab = 'login') => {
            setAuthModalTab(tab === 'register' ? 'register' : 'login');
            setAuthModalOpen(true);
          },
          close: () => setAuthModalOpen(false),
        },
        artisan13kModal: {
          isOpen: artisan13kModalOpen,
          open: () => setArtisan13kModalOpen(true),
          close: () => setArtisan13kModalOpen(false),
        },
        refreshData,
        switchUser,
        updateUserProfile,
        uploadProfilePhoto,
        uploadCoverPhoto,
        upgradeClientToArtisan,
        logout,
        startChatWithArtisan,
        isSubscriptionExpired,
        canAccessProFeatures,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
