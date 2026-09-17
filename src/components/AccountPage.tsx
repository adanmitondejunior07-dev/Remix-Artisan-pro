import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  FileText,
  MessageSquare,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Send,
  ArrowRight,
  ExternalLink,
  Facebook,
  MessageCircle,
  Video,
  Save,
  ShieldCheck,
  Briefcase,
  Layers,
  Settings,
  Camera,
  Image as ImageIcon,
  Check,
  Upload,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Trash2,
  ShoppingBag,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { formatTelephone } from '../utils/phoneUtils.ts';
import { AfricanPhoneInput } from './AfricanPhoneInput.tsx';
import { firestoreService } from '../services/firestoreService.ts';
import type { Quote, User, Artisan, MarketplaceService, CallRecord } from '../types.ts';
import {
  formatWhatsAppUrl,
  formatFacebookUrl,
  formatTikTokUrl,
} from '../utils/socialLinks.ts';
import {
  PROFILE_BANNER_PRESETS,
  PROFILE_AVATAR_PRESETS,
  getArtisanBanner,
} from '../data/profileBanners.ts';
import { MonetizationView } from './MonetizationView.tsx';
import { AdminPage } from './AdminPage.tsx';
import { ProfilePage } from './ProfilePage.tsx';
import { compressImageToDataUrl } from '../utils/imageCompression.ts';
import { BecomeArtisanModal } from './BecomeArtisanModal.tsx';
import { Wallet, Shield } from 'lucide-react';
import { isExactAdminEmail, isSuperAdmin } from '../config/adminConfig.ts';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    currentArtisan,
    services,
    logout,
    paymentModal,
    authModal,
    go,
    showToast,
    refreshData,
    updateUserProfile,
    uploadProfilePhoto,
    uploadCoverPhoto,
    artisan13kModal,
    walletBalance,
    isSubscriptionExpired,
    canAccessProFeatures,
  } = useApp();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const isAdminEmailMatch = isExactAdminEmail(currentUser?.email);
  const isAdmin = isSuperAdmin(currentUser);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'dynamic_profile' | 'quotes' | 'advantages' | 'gains' | 'admin'>(
    isAdmin ? 'admin' : 'dynamic_profile'
  );
  const [showBecomeArtisanModal, setShowBecomeArtisanModal] = useState(false);
  const [quoteAnswerPrice, setQuoteAnswerPrice] = useState<{ [id: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  useEffect(() => {
    if (currentArtisan?.id) {
      api.getCallHistory(currentArtisan.id)
        .then((calls) => setCallHistory(calls))
        .catch((err) => console.warn('Erreur chargement appels compte:', err));
    }
  }, [currentArtisan?.id]);

  // Filter articles and services belonging to the current user or artisan
  const userServices = services.filter((s) => {
    if (currentArtisan && s.artisanId === currentArtisan.id) return true;
    if (currentUser?.name && s.artisanName?.toLowerCase() === currentUser?.name?.toLowerCase()) return true;
    return false;
  });

  // Modal for publishing a new article or service
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: currentArtisan?.trade || 'Couture',
    price: '',
    duration: '',
    description: '',
    emoji: '✨',
  });

  // File input refs for uploading photos directly from device / phone gallery
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States initialized from currentUser and currentArtisan
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || 'Abidjan',
    country: currentUser?.country || 'Côte d’Ivoire',
    whatsapp: currentUser?.whatsapp || currentArtisan?.whatsapp || '',
    facebook: currentUser?.facebook || currentArtisan?.facebook || '',
    tiktok: currentUser?.tiktok || currentArtisan?.tiktok || '',
    bio: currentUser?.bio || currentArtisan?.description || '',
    bannerUrl: currentUser?.bannerUrl || currentArtisan?.bannerUrl || '',
    avatarUrl: currentUser?.avatarUrl || currentArtisan?.avatarUrl || '',
    // Artisan specific fields
    trade: currentArtisan?.trade || '',
    hourlyRate: currentArtisan?.hourlyRate || '10 000 FCFA',
    experienceYears: currentArtisan?.experienceYears || 5,
    address: currentArtisan?.address || '',
  });

  // Sync form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        city: currentUser.city || 'Abidjan',
        country: currentUser.country || 'Côte d’Ivoire',
        whatsapp: currentUser.whatsapp || currentArtisan?.whatsapp || '',
        facebook: currentUser.facebook || currentArtisan?.facebook || '',
        tiktok: currentUser.tiktok || currentArtisan?.tiktok || '',
        bio: currentUser.bio || currentArtisan?.description || '',
        bannerUrl: currentUser.bannerUrl || currentArtisan?.bannerUrl || '',
        avatarUrl: currentUser.avatarUrl || currentArtisan?.avatarUrl || '',
        trade: currentArtisan?.trade || '',
        hourlyRate: currentArtisan?.hourlyRate || '10 000 FCFA',
        experienceYears: currentArtisan?.experienceYears || 5,
        address: currentArtisan?.address || '',
      });
    }
  }, [currentUser, currentArtisan]);

  const loadQuotes = async () => {
    try {
      const qList = await api.getQuotes();
      setQuotes(qList);
    } catch (err) {
      console.error('Error loading quotes:', err);
    }
  };

  useEffect(() => {
    loadQuotes();
    const unsub = firestoreService.onDevisChange((liveDevis) => {
      if (liveDevis) setQuotes(liveDevis);
    });
    return () => unsub();
  }, []);

  const handleUpdateQuoteStatus = async (quoteId: string, status: 'accepted' | 'rejected') => {
    const proposedPrice = quoteAnswerPrice[quoteId];
    try {
      await api.updateQuote(quoteId, {
        status,
        proposedPrice: proposedPrice ? `${proposedPrice} FCFA` : undefined,
      });
      await loadQuotes();
      showToast({
        title: status === 'accepted' ? 'Devis accepté et chiffré' : 'Devis décliné',
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'banner' | 'avatar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result =
        type === 'banner'
          ? await compressImageToDataUrl(file, 1200, 600, 0.85)
          : await compressImageToDataUrl(file, 512, 512, 0.85);

      if (!result) return;

      if (type === 'banner') {
        setFormData((prev) => ({ ...prev, bannerUrl: result }));
        try {
          await uploadCoverPhoto(result);
        } catch (err) {
          console.warn('Erreur sauvegarde directe bannière:', err);
        }
      } else {
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
        try {
          await uploadProfilePhoto(result);
        } catch (err) {
          console.warn('Erreur sauvegarde directe photo profil:', err);
        }
      }
    } catch (err) {
      console.warn('Erreur compression image:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (formData.phone) {
      const checkTel = formatTelephone(formData.phone);
      if (!checkTel.ok) {
        alert(checkTel.msg);
        showToast({ title: 'Numéro invalide', desc: checkTel.msg || 'Format de téléphone incorrect', type: 'warning' });
        return;
      }
      formData.phone = checkTel.value || formData.phone;
    }

    setIsSaving(true);
    try {
      // Préservation stricte : si l'un n'a pas changé, on conserve l'existant sans écraser
      const preservedBanner = formData.bannerUrl || currentUser.bannerUrl || currentArtisan?.bannerUrl;
      const preservedAvatar = formData.avatarUrl || currentUser.avatarUrl || currentArtisan?.avatarUrl;

      const userUpdates: Partial<User> = {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
        whatsapp: formData.whatsapp,
        facebook: formData.facebook,
        tiktok: formData.tiktok,
        bio: formData.bio,
        bannerUrl: preservedBanner,
        coverUrl: preservedBanner,
        avatarUrl: preservedAvatar,
        photoUrl: preservedAvatar,
      };

      const artisanUpdates: Partial<Artisan> | undefined = currentUser.artisanId
        ? {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            country: formData.country,
            whatsapp: formData.whatsapp,
            facebook: formData.facebook,
            tiktok: formData.tiktok,
            description: formData.bio || currentArtisan?.description || '',
            trade: formData.trade || currentArtisan?.trade || 'Artisan',
            hourlyRate: formData.hourlyRate,
            experienceYears: Number(formData.experienceYears) || 5,
            address: formData.address,
            bannerUrl: preservedBanner,
            coverUrl: preservedBanner,
            avatarUrl: preservedAvatar,
            photoUrl: preservedAvatar,
          }
        : undefined;

      await updateUserProfile(userUpdates, artisanUpdates);
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible d’enregistrer le profil',
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter quotes relevant to current user
  const relevantQuotes = quotes.filter((q) => {
    if (currentUser?.role === 'artisan' && currentUser.artisanId) {
      return q.artisanId === currentUser.artisanId;
    }
    return true; // As client, show user quotes
  });

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title.trim()) {
      showToast({ title: 'Titre requis', desc: 'Veuillez renseigner le nom de l’article.', type: 'warning' });
      return;
    }

    setIsSubmittingArticle(true);
    try {
      const priceNum = parseInt(newArticle.price.replace(/\D/g, ''), 10) || 0;
      const formattedPrice = newArticle.price.trim()
        ? (newArticle.price.includes('FCFA') ? newArticle.price : `${newArticle.price} FCFA`)
        : 'Sur devis';

      await api.createService({
        artisanId: currentArtisan?.id || 1,
        artisanName: currentUser?.name || 'Artisan Pro',
        trade: currentArtisan?.trade || newArticle.category,
        title: newArticle.title.trim(),
        price: formattedPrice,
        priceValue: priceNum,
        city: currentUser?.city || 'Abidjan',
        country: currentUser?.country || 'Côte d’Ivoire',
        description: newArticle.description.trim() || 'Article ou prestation artisanale de haute qualité.',
        category: newArticle.category,
        duration: newArticle.duration,
        emoji: newArticle.emoji || '✨',
      });

      await refreshData();
      setShowAddArticleModal(false);
      setNewArticle({
        title: '',
        category: currentArtisan?.trade || 'Couture',
        price: '',
        duration: '',
        description: '',
        emoji: '✨',
      });
      showToast({
        title: 'Article publié !',
        desc: 'Votre article est maintenant en ligne sur la Marketplace.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible d’ajouter l’article.',
        type: 'warning',
      });
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
          👤
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-neutral-950">Espace Utilisateur</h1>
          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Vous n'êtes pas encore connecté. Rejoignez Artisan Pro Afrique 100% gratuitement pour gérer vos coordonnées, ajouter vos liens WhatsApp, Facebook et TikTok, et recevoir des devis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => authModal.open('login')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-xs transition-all shadow-sm"
          >
            Se connecter
          </button>
          <button
            onClick={() => authModal.open('register')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-sm"
          >
            S'inscrire gratuitement
          </button>
        </div>
      </div>
    );
  }

  // Previews for test buttons
  const previewWa = formatWhatsAppUrl(formData.whatsapp || formData.phone);
  const previewFb = formatFacebookUrl(formData.facebook);
  const previewTt = formatTikTokUrl(formData.tiktok);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Espace Membre</div>
          <h1 className="text-3xl font-black text-neutral-950">Mon profil & Mon compte</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => authModal.open('demo')}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <span>🔄</span>
            <span>Changer de compte test (Démo)</span>
          </button>
          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Supprime la session et déconnecte l'utilisateur"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Account Overview Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs space-y-6 overflow-hidden">
        {/* BANNER HEADER */}
        <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-neutral-900 group">
          <img
            src={
              formData.bannerUrl ||
              currentUser.bannerUrl ||
              (currentUser.role === 'artisan'
                ? getArtisanBanner(currentArtisan || undefined)
                : PROFILE_BANNER_PRESETS[0].url)
            }
            alt="Bannière de profil"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                const el = document.getElementById('banner-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Changer la bannière</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-0 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100 -mt-12 sm:-mt-16">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group/avatar">
                {formData.avatarUrl || currentUser.avatarUrl ? (
                  <img
                    src={formData.avatarUrl || currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center text-3xl font-black shrink-0 border-4 border-white shadow-md">
                    {currentUser.avatar || (currentUser.role === 'artisan' ? currentArtisan?.emoji || '👨‍🔧' : '👤')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    const el = document.getElementById('avatar-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title="Changer la photo de profil"
                  className="absolute bottom-0 right-0 p-1.5 rounded-xl bg-neutral-900/90 text-white hover:bg-amber-500 transition-colors shadow-sm border border-white cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 pt-6 sm:pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-xl sm:text-2xl text-neutral-950">{currentUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 uppercase border border-amber-200">
                    {currentUser.role === 'admin' || currentUser.role === 'super_admin'
                      ? 'Super Admin'
                      : currentUser.role === 'artisan'
                      ? `Artisan ${currentArtisan?.trade || 'Pro'}`
                      : 'Client'}
                  </span>
                  {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-neutral-950 uppercase border border-amber-600">
                      Fondateur: ADANMITONDE GERAUD
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Compte Actif
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono">{currentUser.email}</p>
                <div className="flex items-center gap-3 text-xs text-neutral-600 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    {currentUser.city}, {currentUser.country}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {currentUser.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Social Links Badges Overview */}
            <div className="flex flex-col gap-2 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 min-w-56 pt-2 md:pt-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Réseaux associés :
                </span>
                <button
                  type="button"
                  id="btn-account-goto-settings"
                  onClick={() => go('settings')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 text-[#FF6B00] hover:bg-orange-100 font-bold text-xs border border-orange-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Paramètres</span>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* WhatsApp Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                    currentUser.whatsapp || currentArtisan?.whatsapp
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </span>

                {/* Facebook Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                    currentUser.facebook || currentArtisan?.facebook
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </span>

                {/* TikTok Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                    currentUser.tiktok || currentArtisan?.tiktok
                      ? 'bg-neutral-900 text-white border-neutral-800'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </span>
              </div>
            </div>
          </div>

        {/* Super Admin Quick Banner */}
        {currentUser?.role === 'super_admin' && (
          <div className="bg-purple-950 text-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-purple-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-800 text-purple-200 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base flex items-center gap-2 flex-wrap">
                  <span>Espace Super Administrateur</span>
                  <span className="text-[10px] bg-purple-800/80 border border-purple-700 px-2 py-0.5 rounded-full font-mono text-purple-200">
                    Console Sécurisée
                  </span>
                </div>
                <div className="text-xs text-purple-300 mt-0.5">
                  Gérez les retraits Mobile Money en attente, les artisans et les clients de la plateforme.
                </div>
              </div>
            </div>
            {currentUser?.role === 'super_admin' && (
              <button
                id="btn-access-admin-panel-account"
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    authModal.open('login');
                    showToast({
                      title: 'Session expirée',
                      desc: 'Veuillez vous reconnecter pour accéder au panneau Admin.',
                      type: 'warning',
                    });
                    return;
                  }
                  go('admin');
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-white font-black text-xs sm:text-sm border border-neutral-700 hover:border-red-500 transition-all flex items-center gap-2.5 shadow-lg cursor-pointer whitespace-nowrap self-start sm:self-auto group"
              >
                <Shield className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                <span>Accéder au panneau Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs transition-all self-start sm:self-auto cursor-pointer shadow-xs whitespace-nowrap"
            >
              Accéder au Tableau de bord Admin
            </button>
          </div>
        )}

        {/* Section Statut : Compte Artisan Actif OU Expiré OU Client Devenir Artisan */}
        {currentUser?.role === 'artisan' ? (
          isSubscriptionExpired ? (
            <div id="banner-artisan-subscription-expired" className="bg-red-950/40 border-2 border-red-600/70 p-5 sm:p-6 rounded-3xl text-white space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base sm:text-lg text-white">
                        Votre abonnement a expiré
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                        Suspendu
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                      Vos fonctionnalités professionnelles (publication d'articles, visibilité prioritaire, réception directe de devis) sont suspendues jusqu'au renouvellement de votre formule.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    id="btn-account-renew-sub"
                    onClick={() => go('abonnements')}
                    className="px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#FF6B00]/30 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer whitespace-nowrap uppercase tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>RENOUVELER MON ABONNEMENT</span>
                  </button>
                </div>
              </div>

              {/* Statut & Accès restreints */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-red-900/50 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block font-medium">Formule précédente</span>
                  <span className="text-sm font-black text-amber-400 uppercase">
                    {currentUser.subscription_plan || 'Pro'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block font-medium">Solde conservé</span>
                  <span className="text-sm font-black text-white font-mono">
                    {walletBalance.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-neutral-400 block font-medium">Statut Visibilité</span>
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Suspendu (Renouvellement requis)</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 text-white p-5 sm:p-6 rounded-3xl border border-amber-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base sm:text-lg text-white">
                        COMPTE ARTISAN ACTIF - Vérifié
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        ✓ Formule {currentUser.subscription_plan ? currentUser.subscription_plan.toUpperCase() : 'PRO'} Active
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      {currentUser.name} · <span className="font-mono text-amber-300">{currentUser.phone || '+225 05 03 44 45 08'}</span> · <span className="text-neutral-400">{currentUser.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => go('abonnements')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gérer Formule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gains')}
                    className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Retirer / Recharger</span>
                  </button>
                </div>
              </div>

              {/* Barre Solde & Commandes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block font-medium">Solde Disponible</span>
                  <span className="text-lg font-black text-[#FF6B00] font-mono">
                    {walletBalance.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-neutral-400 block font-medium">Commandes / Chantiers</span>
                  <span className="text-lg font-black text-white font-mono">
                    {relevantQuotes.length} chantiers
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-neutral-400 block font-medium">Statut Visibilité</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>En ligne & Vérifié ({currentUser.country || "Côte d'Ivoire"})</span>
                  </span>
                </div>
              </div>
            </div>
          )
        ) : currentUser?.role === 'client' ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black shadow-md shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-neutral-900">
                    Vous êtes actuellement Client
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                    Client
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-1 max-w-xl leading-relaxed">
                  Vous n'avez pas de gains en tant que client. Activez votre compte artisan pour 13.000 FCFA (10.000F activation + 3.000F badge) pour recevoir des demandes de devis et encaisser vos revenus.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-account-devenir-artisan"
              onClick={() => setShowBecomeArtisanModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#FF6B00]/30 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>DEVENIR ARTISAN</span>
            </button>
          </div>
        ) : null}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mes Articles & Services ({userServices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dynamic_profile')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dynamic_profile'
                ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-600/30 ring-2 ring-[#FF6B00]'
                : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-800 border border-neutral-700'
            }`}
          >
            <UserIcon className="w-4 h-4 text-[#FF6B00]" />
            <span>Mon Profil (Nouveau)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Mon Profil & Réseaux Sociaux</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'quotes'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mes Devis ({relevantQuotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advantages')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'advantages'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Avantages Lancement Gratuit</span>
          </button>

          <button
            onClick={() => setActiveTab('gains')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'gains'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Mes Gains & Portefeuille</span>
          </button>

          <button
            type="button"
            id="tab-btn-marketplace"
            onClick={() => go('market')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap bg-orange-50 text-[#FF6B00] hover:bg-orange-100 border border-orange-200 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#FF6B00]" />
            <span>Marketplace (Public & Commandes)</span>
          </button>

          <button
            type="button"
            id="tab-btn-parametres"
            onClick={() => go('settings')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap bg-orange-50 text-[#FF6B00] hover:bg-orange-100 border border-orange-200 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#FF6B00]" />
            <span>Paramètres & Abonnements</span>
          </button>

          <button
            type="button"
            id="tab-btn-mon-historique"
            onClick={() => go('mon-historique')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors whitespace-nowrap text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
          >
            <History className="w-4 h-4 text-neutral-500" />
            <span>Mon Historique Paiements</span>
          </button>

          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Tableau de bord Admin</span>
            </button>
          )}
        </div>

        {/* TAB 0: MES ARTICLES & SERVICES (MARKETPLACE) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white uppercase">
                    Boutique & Marketplace
                  </span>
                  <span className="text-xs text-amber-900 font-semibold">100% Gratuit sans commission</span>
                </div>
                <h3 className="text-xl font-black text-neutral-950 mt-1">
                  Mes Articles & Prestations en ligne
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 max-w-xl">
                  Ajoutez vos créations, tissus, pièces artisanales ou services pour recevoir des commandes directes par appel ou WhatsApp.
                </p>
              </div>

              <button
                type="button"
                id="btn-account-publish-article"
                onClick={() => {
                  if (isSubscriptionExpired) {
                    showToast({
                      title: 'Abonnement expiré',
                      desc: 'Votre formule a expiré. Veuillez la renouveler pour continuer à publier des articles.',
                      type: 'warning',
                    });
                    go('abonnements');
                    return;
                  }
                  setShowAddArticleModal(true);
                }}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-transform hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Publier un article</span>
              </button>
            </div>

            {userServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-3xl">{srv.emoji || '✨'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          En ligne
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-950 text-sm line-clamp-1">{srv.title}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{srv.description}</p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">
                          Prix
                        </span>
                        <span className="text-sm font-black text-neutral-900">{srv.price}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => go('market')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-900 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                  📦
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-neutral-900">Aucun article publié pour le moment</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Vous n'avez pas encore d'article ou de prestation dans la Marketplace. Publiez votre premier article en 1 clic !
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddArticleModal(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publier mon 1er article</span>
                </button>
              </div>
            )}

            {/* HISTORIQUE D'APPELS VOIP REÇUS & ÉMIS */}
            <div className="pt-6 border-t border-neutral-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-neutral-950 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-sky-600" />
                    <span>Historique de vos Appels VoIP</span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Appels clients directs passés via l'application · Numéros masqués
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-sky-400 text-[11px] font-bold border border-neutral-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Chiffré de bout en bout</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-emerald-400 text-[11px] font-bold border border-neutral-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Numéros Masqués</span>
                  </span>
                </div>
              </div>

              {callHistory.length > 0 ? (
                <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
                  {callHistory.map((call, cIdx) => {
                    const isVideo = call.type === 'video';
                    const isMissed = call.status === 'missed';

                    return (
                      <div
                        key={call.id || `call-${cIdx}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isMissed
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : isVideo
                                ? 'bg-sky-50 text-sky-600 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            {isVideo ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <Phone className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-neutral-900">
                                {isVideo ? 'Appel vidéo VoIP' : 'Appel vocal VoIP'}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isMissed
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {isMissed ? 'Appel manqué' : 'Terminé'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 mt-1 flex-wrap font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-400" />
                                {new Date(call.timestamp).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}{' '}
                                {new Date(call.timestamp).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span>•</span>
                              <span className="font-mono">
                                Durée : {isMissed ? '00:00' : call.formattedDuration}
                              </span>
                              <span>•</span>
                              <span>
                                {call.clientName ? `Client : ${call.clientName}` : 'Client anonyme'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => go('messages')}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-neutral-600" />
                          <span className="hidden sm:inline">Ouvrir Chat</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                    <Phone className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-800">
                    Aucun appel VoIP reçu pour le moment
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                    Dès qu'un client clique sur l'icône téléphone ou caméra dans votre conversation, l'appel sécurisé s'affiche ici en temps réel.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB DYNAMIQUE: NOUVEAU PROFIL ARTISANPRO MODERNE (Réseau Social) */}
        {activeTab === 'dynamic_profile' && (
          <div className="pt-2">
            <ProfilePage />
          </div>
        )}

        {/* TAB 1: FORMULAIRE DE PROFIL & RÉSEAUX SOCIAUX ("Sur bon forme") */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 pt-2">
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Personnalisez votre profil, bannière et réseaux sociaux !</span>
                <p className="text-amber-800/90 mt-0.5">
                  Choisissez une bannière professionnelle adaptée à votre métier et renseignez vos identifiants WhatsApp, Facebook et TikTok pour être joignable dans toute l'Afrique.
                </p>
              </div>
            </div>

            {/* SECTION BANNIÈRE DE PROFIL - Compact: Bouton Téléverser + Grille des 8 thèmes */}
            <div id="banner-section" className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF7A00]" />
                    <span>BANNIÈRE DE PROFIL (8 THÈMES AU CHOIX)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Sélectionnez un style prédéfini ou téléversez une photo depuis votre appareil.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56E00] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Téléverser une photo</span>
                  </button>
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    onChange={(e) => handleImageUpload(e, 'banner')}
                    accept="image/*"
                    className="hidden"
                  />
                  {formData.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, bannerUrl: '' })}
                      className="text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                    >
                      Bannière par défaut
                    </button>
                  )}
                </div>
              </div>

              {/* Grille des 8 thèmes prédéfinis */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROFILE_BANNER_PRESETS.map((preset) => {
                  const isSelected = formData.bannerUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={async () => {
                        setFormData((prev) => ({ ...prev, bannerUrl: preset.url }));
                        try {
                          await uploadCoverPhoto(preset.url);
                        } catch (err) {
                          console.warn('Erreur mise a jour preset banniere:', err);
                        }
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer h-24 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-400 shadow-md'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white truncate drop-shadow-xs">
                          {preset.title}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Photo de profil / Logo rapide */}
              <div id="avatar-section" className="pt-2 border-t border-neutral-200/80">
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Photo de profil / Logo</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                          className="text-[10px] text-red-600 hover:text-red-800 font-bold underline"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="w-full sm:w-auto py-2 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Téléverser ma photo de profil</span>
                    </button>
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                      accept="image/*"
                      className="hidden"
                    />
                    {/* Avatars prédéfinis */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Ou modèle :</span>
                      {PROFILE_AVATAR_PRESETS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={async () => {
                            setFormData((prev) => ({ ...prev, avatarUrl: av.url }));
                            try {
                              await uploadProfilePhoto(av.url);
                            } catch (err) {
                              console.warn('Erreur mise a jour preset avatar:', err);
                            }
                          }}
                          className={`w-7 h-7 rounded-lg overflow-hidden border transition-transform hover:scale-110 cursor-pointer ${
                            formData.avatarUrl === av.url ? 'border-amber-500 ring-1 ring-amber-400' : 'border-neutral-200'
                          }`}
                          title={av.label}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne 1: Coordonnées de base */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-amber-600" />
                  <span>Informations Générales</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nom complet ou Nom d'atelier <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                    placeholder="Ex. Yao Kouassi Couture"
                  />
                </div>

                <div>
                  <AfricanPhoneInput
                    id="telInput"
                    label="Numéro de téléphone (Afrique)"
                    value={formData.phone}
                    onChange={(fullNumber) => setFormData({ ...formData, phone: fullNumber })}
                    placeholder="0503444508"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 -mt-2 mb-2 block">
                    Format Côte d'Ivoire : 0503444508 ou +2250503444508
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="Abidjan"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="Côte d'Ivoire"
                    />
                  </div>
                </div>

                {currentUser.role === 'artisan' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Corps de métier
                        </label>
                        <input
                          type="text"
                          value={formData.trade}
                          onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                          placeholder="Couturier, Électricien..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Tarif indicatif
                        </label>
                        <input
                          type="text"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                          placeholder="10 000 FCFA"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Adresse ou Quartier d'exercice
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white"
                        placeholder="Ex. Cocody Angré 8ème Tranche"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Présentation / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-amber-500 focus:outline-none bg-white leading-relaxed"
                    placeholder="Décrivez brièvement vos prestations, savoir-faire ou attentes..."
                  />
                </div>
              </div>

              {/* Colonne 2: Réseaux Sociaux (WhatsApp, Facebook, TikTok) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Liens Réseaux Sociaux & Contact Direct</span>
                </h3>

                {/* WhatsApp */}
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Numéro ou Lien WhatsApp</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      Recommandé
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-sm focus:border-emerald-500 focus:outline-none bg-white font-mono"
                    placeholder="+225 07 48 12 34 56 ou https://wa.me/2250748123456"
                  />
                  <div className="flex items-center justify-between text-[11px] text-emerald-800">
                    <span>Ouvre une discussion directe avec vos clients</span>
                    {previewWa && (
                      <a
                        href={previewWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                      >
                        Tester le lien <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Facebook */}
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span>Lien ou Page Facebook</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/60 px-2 py-0.5 rounded-md">
                      Visibilité
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="https://facebook.com/monatelier ou nom_de_page"
                  />
                  <div className="flex items-center justify-between text-[11px] text-blue-800">
                    <span>Lien vers votre profil ou page professionnelle</span>
                    {previewFb && (
                      <a
                        href={previewFb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline flex items-center gap-1 text-blue-700 hover:text-blue-900"
                      >
                        Tester le lien <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* TikTok */}
                <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-neutral-800" />
                      <span>Lien ou Pseudo TikTok</span>
                    </label>
                    <span className="text-[10px] text-neutral-800 font-semibold bg-neutral-200 px-2 py-0.5 rounded-md">
                      Vidéos & Reels
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-400 text-sm focus:border-neutral-800 focus:outline-none bg-white"
                    placeholder="@monatelier ou https://tiktok.com/@monatelier"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-700">
                    <span>Partagez vos vidéos de réalisations et chantiers</span>
                    {previewTt && (
                      <a
                        href={previewTt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline flex items-center gap-1 text-neutral-900 hover:text-black"
                      >
                        Tester le lien <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer mon profil et mes liens'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: DEMANDES DE DEVIS */}
        {activeTab === 'quotes' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">
                {currentUser?.role === 'artisan' ? 'Demandes de devis reçues' : 'Mes demandes de devis'}
              </h3>
              <span className="text-xs font-semibold text-neutral-500">
                {relevantQuotes.length} demande{relevantQuotes.length > 1 ? 's' : ''}
              </span>
            </div>

            {relevantQuotes.length > 0 ? (
              <div className="space-y-4">
                {relevantQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs hover:border-amber-400 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-neutral-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-neutral-900">{q.artisan}</span>
                          <span className="text-neutral-400">·</span>
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            {q.service}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          Demandé par : <b>{q.clientName}</b> ({q.clientPhone} · {q.clientCity})
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {q.status === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Accepté ({q.proposedPrice || 'Chiffré'})
                          </span>
                        ) : q.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Décliné
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            En attente de réponse
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description requested */}
                    <div className="text-xs text-neutral-700 bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 leading-relaxed">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                        Détails de la demande :
                      </div>
                      <p>{q.desc}</p>
                    </div>

                    {/* Date & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Créé le {new Date(q.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {/* Artisan action buttons */}
                      {currentUser?.role === 'artisan' && q.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Prix en FCFA"
                            value={quoteAnswerPrice[q.id] || ''}
                            onChange={(e) =>
                              setQuoteAnswerPrice({ ...quoteAnswerPrice, [q.id]: e.target.value })
                            }
                            className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs w-28"
                          />
                          <button
                            onClick={() => handleUpdateQuoteStatus(q.id, 'accepted')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                          >
                            Valider devis
                          </button>
                          <button
                            onClick={() => handleUpdateQuoteStatus(q.id, 'rejected')}
                            className="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
                          >
                            Décliner
                          </button>
                        </div>
                      )}

                      {/* Client action buttons */}
                      {currentUser?.role !== 'artisan' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => go('messages')}
                            className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-50 rounded-xl font-bold text-neutral-700"
                          >
                            💬 Discuter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-xl">
                  📋
                </div>
                <h4 className="font-bold text-neutral-900 text-sm">Aucun devis pour le moment</h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {currentUser?.role === 'artisan'
                    ? 'Vos demandes de clients s’afficheront ici dès qu’ils solliciteront vos services.'
                    : 'Parcourez nos artisans pour envoyer vos premières demandes de devis.'}
                </p>
                <button
                  onClick={() => go('search')}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Rechercher un artisan
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVANTAGES LANCEMENT GRATUIT */}
        {activeTab === 'advantages' && (
          <div className="space-y-6 pt-2">
            <div className="rounded-2xl bg-neutral-900 text-white p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-neutral-950 uppercase">
                  Lancement 100% Gratuit
                </span>
                <span className="text-xs text-neutral-400">Sans abonnement • Zéro commission</span>
              </div>
              <h3 className="text-2xl font-black">
                Profitez de la liberté totale sur Artisan Pro Afrique
              </h3>
              <p className="text-sm text-neutral-300 max-w-xl leading-relaxed">
                Durant la phase de lancement, tous les artisans et clients bénéficient d’un accès illimité aux devis, à la messagerie en direct et au partage libre de leurs coordonnées (Téléphone, WhatsApp, Facebook, TikTok).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-1.5">
                  <div className="text-amber-400 font-bold text-sm">✓ Contact direct</div>
                  <p className="text-xs text-neutral-400">Échangez sans intermédiaire via WhatsApp ou appel.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-1.5">
                  <div className="text-amber-400 font-bold text-sm">✓ Visibilité maximale</div>
                  <p className="text-xs text-neutral-400">Votre profil est indexé sur la carte et le moteur de recherche.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-1.5">
                  <div className="text-amber-400 font-bold text-sm">✓ Devis illimités</div>
                  <p className="text-xs text-neutral-400">Répondez à toutes les demandes sans limitation de quota.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MES GAINS & PORTEFEUILLE (PROMPT N°7) */}
        {activeTab === 'gains' && (
          <div className="pt-2">
            <MonetizationView />
          </div>
        )}

        {/* TAB 5: TABLEAU DE BORD ADMIN */}
        {activeTab === 'admin' && (
          <div className="pt-2">
            <AdminPage />
          </div>
        )}
        {/* MODAL PUBLIER UN NOUVEL ARTICLE */}
        {showAddArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowAddArticleModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
                  🛍️
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900">Publier un article ou service</h3>
                  <p className="text-xs text-neutral-500">Visible immédiatement sur la Marketplace</p>
                </div>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Nom de l’article ou prestation *
                  </label>
                  <input
                    type="text"
                    required
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Ex: Robe de soirée en Pagne Bazin brodé"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Catégorie
                    </label>
                    <select
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="Couture">Couture & Mode</option>
                      <option value="Électricité">Électricité</option>
                      <option value="Plomberie">Plomberie</option>
                      <option value="Menuiserie">Menuiserie & Bois</option>
                      <option value="Mécanique">Mécanique Auto</option>
                      <option value="Coiffure">Coiffure & Beauté</option>
                      <option value="Artisanat d'art">Artisanat d'art</option>
                      <option value="Général">Autre prestation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Prix (FCFA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newArticle.price}
                      onChange={(e) => setNewArticle({ ...newArticle, price: e.target.value })}
                      placeholder="Écrivez votre prix (ex: 25 000 FCFA)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Délai de réalisation
                    </label>
                    <input
                      type="text"
                      value={newArticle.duration}
                      onChange={(e) => setNewArticle({ ...newArticle, duration: e.target.value })}
                      placeholder="Ex: 24h - 48h"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Icône / Émoji
                    </label>
                    <select
                      value={newArticle.emoji}
                      onChange={(e) => setNewArticle({ ...newArticle, emoji: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="🧵">🧵 Couture / Pagne</option>
                      <option value="⚡">⚡ Électricité</option>
                      <option value="🔧">🔧 Plomberie</option>
                      <option value="🪑">🪑 Meubles / Bois</option>
                      <option value="🚗">🚗 Auto / Moteur</option>
                      <option value="✂️">✂️ Coiffure</option>
                      <option value="🎨">🎨 Art & Déco</option>
                      <option value="✨">✨ Magie / Qualité</option>
                      <option value="📦">📦 Pièce / Produit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Description de l'article ou du service
                  </label>
                  <textarea
                    rows={3}
                    value={newArticle.description}
                    onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                    placeholder="Précisez les finitions, matières utilisées, conditions de livraison..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddArticleModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingArticle}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingArticle ? 'Publication...' : 'Publier l’article'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>

        {/* Bouton de déconnexion en bas du profil */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            Session active : <strong className="text-neutral-800">{currentUser.name}</strong> ({currentUser.email || currentUser.phone})
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                logout();
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Modal Formulaire Obligatoire : DEVENIR ARTISAN */}
      <BecomeArtisanModal
        isOpen={showBecomeArtisanModal}
        onClose={() => setShowBecomeArtisanModal(false)}
      />
    </div>
  );
};
