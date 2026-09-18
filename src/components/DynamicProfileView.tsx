import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Users,
  Shield,
  ShieldAlert,
  Phone,
  PhoneCall,
  Video,
  Eye,
  Trash2,
  Headphones,
  CheckCircle2,
  ExternalLink,
  Copy,
  Edit3,
  Star,
  MessageCircle,
  Facebook,
  Globe,
  Lock,
  AlertTriangle,
  Send,
  Camera,
  Check,
  X,
  Clock,
  UserX,
  UserCheck,
  FileText,
  DollarSign,
  Search,
  MapPin,
  Sparkles,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import type { WithdrawalRequest } from '../types.ts';
import { isExactAdminEmail, isSuperAdmin } from '../config/adminConfig.ts';
import {
  loadAdminPermissions,
  saveAdminPermissions,
  canManageAdminPermissions,
  type SystemAdminPermissions,
} from '../utils/adminPermissionsStorage.ts';
import { BecomeArtisanModal } from './BecomeArtisanModal.tsx';

interface DynamicProfileViewProps {
  onOpenAdminDashboard?: () => void;
}

export const DynamicProfileView: React.FC<DynamicProfileViewProps> = ({
  onOpenAdminDashboard,
}) => {
  const {
    currentUser,
    currentArtisan,
    artisans,
    users,
    withdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    showToast,
    refreshData,
    go,
    authModal,
    artisan13kModal,
    logout,
    isSubscriptionExpired,
  } = useApp();

  // =========================================================
  // RÈGLE 1 - VÉRIFICATION STRICTE SÉCURITÉ ADMIN
  // =========================================================
  const isAdminEmailMatch = isExactAdminEmail(currentUser?.email);
  const isAdmin = isSuperAdmin(currentUser);

  // Navigation vers la console Admin
  const handleAccessAdminPanel = () => {
    if (!currentUser) {
      authModal.open('login');
      showToast({
        title: 'Session expirée',
        desc: 'Veuillez vous reconnecter pour accéder au panneau Admin.',
        type: 'warning',
      });
      return;
    }
    if (onOpenAdminDashboard) {
      onOpenAdminDashboard();
    } else {
      go('admin');
    }
  };

  // Rôle actif visualisé (les admins peuvent basculer entre les 3 vues pour prévisualisation)
  const [activeRole, setActiveRole] = useState<'client' | 'artisan' | 'admin'>(() => {
    if (isAdmin) return 'admin';
    if (currentUser?.role === 'artisan' || currentArtisan) return 'artisan';
    return 'client';
  });

  useEffect(() => {
    if (isAdmin) {
      setActiveRole('admin');
    } else if (currentUser?.role === 'artisan' || currentArtisan) {
      setActiveRole('artisan');
    } else {
      setActiveRole('client');
    }
  }, [isAdmin, currentUser?.role, currentArtisan]);

  // Disponibilité Artisan : En ligne / Hors ligne
  const [isAvailable, setIsAvailable] = useState<boolean>(
    currentArtisan?.isAvailable ?? true
  );

  // Liens Business de l'artisan
  const [businessLinks, setBusinessLinks] = useState({
    whatsappChannel:
      currentArtisan?.whatsappChannel ||
      currentUser?.whatsappChannel ||
      'https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c',
    facebookPage:
      currentArtisan?.facebookPage ||
      currentUser?.facebookPage ||
      'https://facebook.com/artisanpro.afrique',
  });

  const [linkErrors, setLinkErrors] = useState<{ [key: string]: string }>({});

  // Toggles de permissions administrateur persistés dans localStorage 'admin_permissions'
  const [adminPermissions, setAdminPermissions] = useState<SystemAdminPermissions>(() => loadAdminPermissions());

  useEffect(() => {
    const handlePermsChange = (e: any) => {
      if (e.detail) setAdminPermissions(e.detail);
      else setAdminPermissions(loadAdminPermissions());
    };
    window.addEventListener('admin_permissions_updated', handlePermsChange);
    return () => window.removeEventListener('admin_permissions_updated', handlePermsChange);
  }, []);

  const handleTogglePermission = (key: keyof SystemAdminPermissions) => {
    const isAllowed = canManageAdminPermissions(currentUser?.email);
    if (!isAllowed) {
      showToast({
        title: 'Accès restreint',
        desc: 'Seul le Directeur Général ou le Créateur Secours peut modifier les permissions.',
        type: 'warning',
      });
      return;
    }

    const updated = {
      ...adminPermissions,
      [key]: !adminPermissions[key],
    };
    saveAdminPermissions(updated);
    setAdminPermissions(updated);
    showToast({
      title: 'Permission sauvegardée',
      desc: `La permission "${key}" a été enregistrée dans la mémoire du système.`,
      type: 'success',
    });
  };

  // Liste locale des comptes bannis (persistée dans localStorage)
  const [bannedUserIds, setBannedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('artisan_pro_banned_users');
      return saved ? JSON.parse(saved) : ['user-mock-fraud-1'];
    } catch {
      return ['user-mock-fraud-1'];
    }
  });

  // États pour les modales
  const [showBanModal, setShowBanModal] = useState(false);
  const [banModalTab, setBanModalTab] = useState<'all' | 'banned'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedProofWithdrawal, setSelectedProofWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [showBecomeArtisanModal, setShowBecomeArtisanModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editClientName, setEditClientName] = useState(
    currentUser?.name || 'Aminata Diallo'
  );
  const [editClientCity, setEditClientCity] = useState(
    currentUser?.city || 'Abidjan, Cocody'
  );
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);
  const [showGroupMsgModal, setShowGroupMsgModal] = useState(false);
  const [groupMsgText, setGroupMsgText] = useState('');
  const [isSendingGroupMsg, setIsSendingGroupMsg] = useState(false);

  // Validation des liens HTTPS
  const validateLink = (url: string, field: 'whatsappChannel' | 'facebookPage') => {
    if (!url.trim()) {
      setLinkErrors((prev) => ({ ...prev, [field]: '' }));
      return true;
    }
    if (!url.startsWith('https://')) {
      setLinkErrors((prev) => ({
        ...prev,
        [field]: 'Le lien doit obligatoirement commencer par https://',
      }));
      return false;
    }
    setLinkErrors((prev) => ({ ...prev, [field]: '' }));
    return true;
  };

  // Coller depuis le presse-papier
  const handlePaste = async (field: 'whatsappChannel' | 'facebookPage') => {
    try {
      const text = await navigator.clipboard.readText();
      setBusinessLinks((prev) => ({ ...prev, [field]: text }));
      validateLink(text, field);
      showToast({
        title: 'Lien collé !',
        desc: text,
        type: 'success',
      });
    } catch {
      showToast({
        title: 'Presse-papier inaccessible',
        desc: 'Veuillez coller manuellement votre lien dans le champ.',
        type: 'warning',
      });
    }
  };

  // Bannir un compte
  const handleBanUser = (targetId: string, targetName: string) => {
    if (bannedUserIds.includes(targetId)) return;
    const updated = [...bannedUserIds, targetId];
    setBannedUserIds(updated);
    try {
      localStorage.setItem('artisan_pro_banned_users', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast({
      title: `Compte banni : ${targetName}`,
      desc: 'Le compte a été suspendu de la plateforme avec succès.',
      type: 'warning',
    });
  };

  // Débannir / Autoriser un compte
  const handleUnbanUser = (targetId: string, targetName: string) => {
    const updated = bannedUserIds.filter((id) => id !== targetId);
    setBannedUserIds(updated);
    try {
      localStorage.setItem('artisan_pro_banned_users', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast({
      title: `Compte réactivé : ${targetName}`,
      desc: 'Les accès et privilèges du compte ont été rétablis.',
      type: 'success',
    });
  };

  // Liste unifiée de tous les comptes utilisateurs et artisans pour la modération
  const allAccounts = [
    ...(users || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '+225 0700000000',
      role: u.role,
      city: u.city || 'Abidjan',
      isArtisan: u.role === 'artisan',
    })),
    ...(artisans || [])
      .filter((a) => !users?.some((u) => u.id === String(a.id)))
      .map((a) => ({
        id: String(a.id),
        name: a.name,
        email: `${a.name.toLowerCase().replace(/\s+/g, '.')}@artisan.ci`,
        phone: a.phone || '+225 0500000000',
        role: 'artisan' as const,
        city: a.city || 'Abidjan Marcory',
        isArtisan: true,
      })),
  ];

  const filteredAccounts = allAccounts.filter((acc) => {
    const isBanned = bannedUserIds.includes(acc.id);
    if (banModalTab === 'banned' && !isBanned) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.phone.includes(q) ||
        acc.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Liste des photos de réalisations pour le profil artisan
  const artisanRealisationPhotos = [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* =========================================================
          BARRE DE SÉLECTION DE RÔLE (VISIBLE POUR ADMIN / TEST)
          Permet de basculer instantanément pour vérifier les 3 règles
          ========================================================= */}
      {isAdmin && (
        <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-neutral-300">
              Sélecteur de Rôle (Session Admin certifiée) :
            </span>
            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md">
              {currentUser?.email || 'Administrateur'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveRole('client')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>👤 Profil Client</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('artisan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'artisan'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>👨‍🔧 Profil Artisan Pro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400'
                  : 'text-red-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>🛡️ Profil Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          RÈGLE 4 : PROFIL CLIENT
          "Encore plus simple : Photo, Nom, Ville. Rien d'autre."
          ========================================================================= */}
      {activeRole === 'client' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo Client */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-lg flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                    alt={editClientName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditClientModal(true)}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                  title="Modifier photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Infos Client : Nom + Ville */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Compte Particulier</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {editClientName}
                </h2>
                <p className="text-sm font-medium text-neutral-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span>{editClientCity}</span>
                </p>

                <div className="pt-3 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditClientModal(true)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer border border-neutral-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier mes informations</span>
                  </button>

                  <button
                    type="button"
                    id="btn-devenir-artisan-client"
                    onClick={() => setShowBecomeArtisanModal(true)}
                    className="px-5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-md shadow-orange-600/25 uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>DEVENIR ARTISAN</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RÈGLE 3 : PROFIL ARTISAN
          "Reste simple : Note 4.8/5, Abidjan Marcory Zone 4, Bio, Disponibilité
           En ligne/Hors ligne. PAS DE SECTION PERMISSIONS. PAS DE BOUTON BANNIR.
           Ajoute juste 'Mes Liens Business' : lien Chaîne WhatsApp et lien Page Facebook."
          ========================================================================= */}
      {activeRole === 'artisan' && (
        <div className="space-y-6">
          {/* BANDEAU SI ABONNEMENT EXPIRÉ */}
          {isSubscriptionExpired && (
            <div
              id="dynamic-profile-expired-banner"
              className="p-5 sm:p-6 rounded-3xl bg-red-950/40 border-2 border-red-600/70 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-white">
                      Votre abonnement a expiré
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold uppercase">
                      Suspendu
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                    Vos fonctionnalités professionnelles et votre visibilité sur la plateforme sont suspendues. Renouvelez votre abonnement pour réactiver votre compte.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-dynamic-renew-sub"
                onClick={() => go('abonnements')}
                className="px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#FF6B00]/30 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer whitespace-nowrap uppercase tracking-wider self-start sm:self-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>RENOUVELER MON ABONNEMENT</span>
              </button>
            </div>
          )}

          {/* Fiche Profil Artisan */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo Pro */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-xl flex items-center justify-center">
                  {currentUser?.avatarUrl || currentArtisan?.avatarUrl ? (
                    <img
                      src={currentUser?.avatarUrl || currentArtisan?.avatarUrl}
                      alt={currentUser?.name || currentArtisan?.name || 'Profil'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-amber-600 to-[#FF6B00] text-white flex items-center justify-center text-3xl font-black">
                      {(currentUser?.name || currentArtisan?.name || 'AP').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1 border border-neutral-900">
                  <Check className="w-3 h-3" />
                  <span>Pro Vérifié</span>
                </div>
              </div>

              {/* Informations Clés */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    Artisan Professionnel
                  </span>
                  {/* Note 4.8/5 */}
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-800 text-amber-400 text-xs font-bold border border-neutral-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentArtisan?.rating ? `${currentArtisan.rating} / 5` : '5.0 / 5'}</span>
                    <span className="text-neutral-500 font-normal">({currentArtisan?.reviewsCount || 12} avis)</span>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {currentUser?.name || currentArtisan?.name || 'Artisan Pro'}
                </h2>
                <p className="text-sm font-bold text-amber-500">
                  {currentArtisan?.trade || currentUser?.trade || 'Artisan Professionnel'}
                </p>

                {/* Localisation */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>
                      {currentArtisan?.city || currentUser?.city || 'Abidjan'}, {currentArtisan?.country || currentUser?.country || 'Côte d’Ivoire'}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const lat = currentArtisan?.lat || (currentUser as any)?.latitude;
                      const lng = currentArtisan?.lng || (currentUser as any)?.longitude;
                      const city = currentArtisan?.city || currentUser?.city || 'Abidjan';
                      const country = currentArtisan?.country || currentUser?.country || 'Côte d’Ivoire';
                      let mapUrl = '';
                      if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
                        mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      } else {
                        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city}, ${country}`)}`;
                      }
                      window.open(mapUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#FF6B00] text-[11px] font-black border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Ouvrir l'itinéraire GPS pour rejoindre l'artisan"
                  >
                    <span>📍 VOIR LA LOCALISATION</span>
                  </button>
                </div>

                {/* Bio simple */}
                <p className="text-xs text-neutral-300 max-w-xl leading-relaxed pt-1">
                  {currentArtisan?.description ||
                    currentUser?.bio ||
                    'Artisan qualifié certifié sur ArtisanPro Afrique. Prestations soignées, devis personnalisés et interventions rapides.'}
                </p>

                {/* Disponibilité : En ligne / Hors ligne */}
                <div className="pt-3 flex items-center justify-center sm:justify-start gap-3">
                  <span className="text-xs font-bold text-neutral-400">Disponibilité :</span>
                  <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvailable(true);
                        showToast({
                          title: 'Statut : En ligne 🟢',
                          desc: 'Votre profil apparaît comme immédiatement disponible aux clients.',
                          type: 'success',
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>En ligne</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvailable(false);
                        showToast({
                          title: 'Statut : Hors ligne ⚪',
                          desc: 'Votre statut indique que vous êtes temporairement indisponible.',
                          type: 'info',
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        !isAvailable
                          ? 'bg-neutral-700 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-neutral-400" />
                      <span>Hors ligne</span>
                    </button>
                  </div>
                </div>

                {/* BOUTON ADMINISTRATEUR CONDITIONNEL (Affiché UNIQUEMENT si email === ADMIN_EMAIL configuré) */}
                {isAdminEmailMatch && (
                  <div className="pt-3 flex justify-center sm:justify-start">
                    <button
                      id="btn-access-admin-panel-profile"
                      type="button"
                      onClick={handleAccessAdminPanel}
                      className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-white font-black text-xs border border-neutral-700 hover:border-red-500 shadow-xl flex items-center gap-2.5 cursor-pointer transition-all group animate-in fade-in"
                      title="Accéder au panneau d'administration"
                    >
                      <Shield className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                      <span>Accéder au panneau Admin</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Galerie de réalisations (6 photos) */}
            <div className="pt-6 border-t border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Galerie de Réalisations (6 photos) :
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {artisanRealisationPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGalleryPhoto(photo)}
                    className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 hover:border-amber-500 transition-all cursor-pointer group"
                  >
                    <img
                      src={photo}
                      alt={`Réalisation ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section "Mes Liens Business" */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visibilité Réseaux</span>
                </div>
                <h3 className="text-lg font-black text-white">Mes Liens Business</h3>
                <p className="text-xs text-neutral-400">
                  Configurez votre chaîne WhatsApp et votre page Facebook pour permettre aux clients de vous suivre.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const validWhatsapp = validateLink(
                    businessLinks.whatsappChannel,
                    'whatsappChannel'
                  );
                  const validFacebook = validateLink(
                    businessLinks.facebookPage,
                    'facebookPage'
                  );

                  if (validWhatsapp && validFacebook) {
                    showToast({
                      title: 'Liens business enregistrés avec succès !',
                      desc: 'Vos liens officiels sont désormais visibles par tous les clients.',
                      type: 'success',
                    });
                  } else {
                    showToast({
                      title: 'Vérifiez vos liens',
                      desc: 'Les adresses doivent obligatoirement commencer par https://',
                      type: 'warning',
                    });
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer"
              >
                Enregistrer mes liens
              </button>
            </div>

            {/* Inputs Liens Business */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Lien Chaîne WhatsApp avec bouton Coller */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <span>Lien Chaîne WhatsApp</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://whatsapp.com/channel/..."
                    value={businessLinks.whatsappChannel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusinessLinks((prev) => ({ ...prev, whatsappChannel: val }));
                      validateLink(val, 'whatsappChannel');
                    }}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                      linkErrors.whatsappChannel ? 'border-red-500' : 'border-neutral-700'
                    } focus:outline-none focus:border-emerald-500 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePaste('whatsappChannel')}
                    className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Coller depuis le presse-papier"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Coller</span>
                  </button>
                </div>
                {linkErrors.whatsappChannel && (
                  <p className="text-[11px] text-red-400 font-medium">
                    {linkErrors.whatsappChannel}
                  </p>
                )}
              </div>

              {/* 2. Lien Page Facebook avec bouton Coller */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Facebook className="w-3.5 h-3.5 text-blue-400" />
                  </span>
                  <span>Lien Page Facebook</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={businessLinks.facebookPage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusinessLinks((prev) => ({ ...prev, facebookPage: val }));
                      validateLink(val, 'facebookPage');
                    }}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                      linkErrors.facebookPage ? 'border-red-500' : 'border-neutral-700'
                    } focus:outline-none focus:border-blue-500 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePaste('facebookPage')}
                    className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Coller depuis le presse-papier"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Coller</span>
                  </button>
                </div>
                {linkErrors.facebookPage && (
                  <p className="text-[11px] text-red-400 font-medium">
                    {linkErrors.facebookPage}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons visiteurs générés */}
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Boutons visibles par les visiteurs de votre profil :
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                  ✓ Liens Sécurisés HTTPS
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {businessLinks.whatsappChannel && (
                  <a
                    href={businessLinks.whatsappChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>💬 Rejoindre Chaîne WhatsApp</span>
                  </a>
                )}

                {businessLinks.facebookPage && (
                  <a
                    href={businessLinks.facebookPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Facebook className="w-4 h-4 text-white" />
                    <span>👍 Voir Page Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RÈGLE 2 : PROFIL ADMIN 100% DIFFÉRENT
          "Mon profil ADMIN doit être impossible à confondre avec un artisan :
           - Fond noir avec bordure rouge
           - En haut : Grand badge rouge [ADMINISTRATEUR] + badge bleu [Vérifié]
           - Titre : 'Administrateur & Permissions' avec icône bouclier rouge
           - En dessous, bandeau : 'Section réservée exclusivement aux administrateurs certifiés'
           - Garde les 5 toggles d'autorisation mais ajoute 2 nouvelles actions réservées admin :
             - [🔴 Bannir un compte] -> ouvre une liste des utilisateurs avec bouton Bannir
             - [🟢 Autoriser / Débannir un compte] -> pour réactiver un compte banni
           - Garde le bouton orange [Ouvrir Tableau de bord Retraits Mobile Money] et TOUS les boutons
             [Approuver le retrait] / existants. NE SUPPRIME AUCUN BOUTON DE RETRAIT.
           - Ajoute une section 'Contact Support Technique' visible uniquement pour admin avec ton numéro et email."
          ========================================================================= */}
      {activeRole === 'admin' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* SÉCURITÉ : VÉRIFICATION ADMIN */}
          {!isAdmin ? (
            <div className="bg-neutral-900 border-2 border-red-500/80 rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">Accès Réservé Administrateur</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Cette console est strictement réservée à l'administrateur certifié de la plateforme.
              </p>
              <button
                type="button"
                onClick={() => setActiveRole('client')}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 cursor-pointer"
              >
                Retourner à mon profil
              </button>
            </div>
          ) : (
            /* FOND NOIR AVEC BORDURE ROUGE */
            <div className="bg-neutral-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 space-y-6 text-white">
              {/* EN-TÊTE ADMIN */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-red-500/30">
                <div className="flex items-center gap-4">
                  {/* Icône bouclier rouge */}
                  <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 border-2 border-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                    <ShieldAlert className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    {/* En haut : Grand badge rouge [ADMINISTRATEUR] + badge bleu [Vérifié] */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/40 ring-2 ring-red-400 animate-pulse">
                        ADMINISTRATEUR
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-amber-500 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-md">
                        Fondateur: ADANMITONDE GERAUD
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Vérifié</span>
                      </span>
                      <span className="text-xs text-neutral-400 font-mono hidden md:inline">
                        ID: AP-SYS-001
                      </span>
                    </div>

                    {/* Titre : "Administrateur & Permissions" */}
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <span>Administrateur & Permissions</span>
                    </h2>
                  </div>
                </div>

                {/* Bouton orange [Ouvrir Tableau de bord Retraits Mobile Money] */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAdminDashboard) {
                      onOpenAdminDashboard();
                    } else {
                      const el = document.getElementById('mobile-money-withdrawals-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Ouvrir Tableau de bord Retraits Mobile Money</span>
                </button>
              </div>

              {/* BANDEAU : "Section réservée exclusivement aux administrateurs certifiés" */}
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-200">
                <Shield className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-black text-red-400">Accès Haute Sécurité : </span>
                  <span>Section réservée exclusivement aux administrateurs certifiés de la plateforme.</span>
                </div>
              </div>

              {/* 2 NOUVELLES ACTIONS RÉSERVÉES ADMIN :
                  - [🔴 Bannir un compte]
                  - [🟢 Autoriser / Débannir un compte] */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400" />
                    <span>Actions de Modération Comptes :</span>
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {bannedUserIds.length} compte(s) banni(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bouton 1 : [🔴 Bannir un compte] */}
                  <button
                    type="button"
                    onClick={() => {
                      setBanModalTab('all');
                      setShowBanModal(true);
                    }}
                    className="p-4 rounded-2xl bg-red-950/40 hover:bg-red-950/70 border-2 border-red-500/60 hover:border-red-500 transition-all flex items-center justify-between group cursor-pointer text-left shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/30 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <UserX className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-red-400">
                          🔴 Bannir un compte
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Rechercher et suspendre un compte fraudeur
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white bg-red-600 px-3 py-1 rounded-lg">
                      Ouvrir
                    </span>
                  </button>

                  {/* Bouton 2 : [🟢 Autoriser / Débannir un compte] */}
                  <button
                    type="button"
                    onClick={() => {
                      setBanModalTab('banned');
                      setShowBanModal(true);
                    }}
                    className="p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border-2 border-emerald-500/60 hover:border-emerald-500 transition-all flex items-center justify-between group cursor-pointer text-left shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-400">
                          🟢 Autoriser / Débannir un compte
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Réactiver et lever la suspension d'un compte
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white bg-emerald-600 px-3 py-1 rounded-lg">
                      Gérer ({bannedUserIds.length})
                    </span>
                  </button>
                </div>
              </div>

              {/* LISTE DES 7 PERMISSIONS AVEC TOGGLES PERSISTÉS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Permissions & Privilèges Système :</span>
                  </h3>
                  <span className="text-[11px] text-amber-400 font-medium">
                    {canManageAdminPermissions(currentUser?.email)
                      ? '✓ Sauvegardé en mémoire'
                      : '🔒 Réservé DG & Secours'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Autoriser appel VoIP */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Autoriser appel VoIP</div>
                        <div className="text-[10px] text-neutral-400">
                          Appels vocaux sécurisés & masquage
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('voip')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.voip
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 2. Autoriser partage d'écran */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Autoriser partage d'écran
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Assistance visuelle & diagnostic en direct
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('screen_share')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.screen_share
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 3. Autoriser à voir tous les profils */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Autoriser à voir tous les profils
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Visibilité globale clients & artisans
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('view_all_profiles')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.view_all_profiles
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 4. Autoriser suppression de compte - ROUGE DANGEREUX */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/70 hover:border-red-500 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-red-400 flex items-center gap-1.5">
                          <span>Suppression de compte</span>
                          <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                            DANGEREUX
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-300">
                          Modération et sanctions sévères irréversibles
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('delete_account')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer border border-red-500/50 ${
                        adminPermissions.delete_account
                          ? 'bg-red-600 justify-end'
                          : 'bg-neutral-800 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 5. Autoriser mode support technique */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Autoriser mode support technique
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Assistance prioritaire 24h/24 et hotline directe
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('support_mode')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.support_mode
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 6. Équipe support technique */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Équipe support technique
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Accès assistance technique aux tickets
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('team_support')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.team_support
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>

                  {/* 7. Privilège Fondateur Secours */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Privilège Fondateur Secours
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Accès garanti secours pour adanmitondejunior07@gmail.com
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission('team_owner')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        adminPermissions.team_owner
                          ? 'bg-emerald-500 justify-end'
                          : 'bg-neutral-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION RETRAITS MOBILE MONEY AVEC TOUS LES BOUTONS CONSERVÉS :
                  - [Approuver le retrait]
                  - [Refuser le retrait]
                  - [Voir preuve de paiement] */}
              <div
                id="mobile-money-withdrawals-section"
                className="pt-6 border-t border-red-500/30 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-[10px] font-black uppercase border border-[#FF6B00]/30">
                        Mobile Money
                      </span>
                      <h3 className="text-sm font-black text-white">
                        Demandes de Retraits Artisans ({withdrawals?.length || 0})
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Gérez les virements Wave, Orange Money, MTN et Moov Money directement.
                    </p>
                  </div>

                  {onOpenAdminDashboard && (
                    <button
                      type="button"
                      onClick={onOpenAdminDashboard}
                      className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Voir le tableau de bord complet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tableau des retraits */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Artisan</th>
                          <th className="py-3 px-4">Opérateur & Numéro</th>
                          <th className="py-3 px-4">Montant</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {(!withdrawals || withdrawals.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-neutral-500 text-xs">
                              Aucune demande de retrait en attente pour le moment.
                            </td>
                          </tr>
                        ) : (
                          withdrawals.map((w) => {
                            const isPending = w.status === 'en_attente';
                            const isApproved = w.status === 'approuve';

                            return (
                              <tr key={w.id} className="hover:bg-neutral-800/50 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-white">
                                  {w.userName}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-neutral-200">{w.operator}</div>
                                  <div className="text-[11px] font-mono text-neutral-400">
                                    {w.userPhone}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-black text-amber-400 font-mono">
                                  {w.amount.toLocaleString()} {w.currency}
                                </td>
                                <td className="py-3.5 px-4">
                                  {isApproved ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                      <Check className="w-3 h-3" />
                                      <span>Payé</span>
                                    </span>
                                  ) : isPending ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                                      <Clock className="w-3 h-3" />
                                      <span>En attente</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                                      <X className="w-3 h-3" />
                                      <span>Refusé</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2 flex-wrap">
                                    {/* ✅ BOUTON OBLIGATOIRE : [Voir preuve de paiement] */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProofWithdrawal(w)}
                                      className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Consulter le récépissé de transfert"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Voir preuve de paiement</span>
                                    </button>

                                    {isPending && (
                                      <>
                                        {/* ✅ BOUTON OBLIGATOIRE : [Approuver le retrait] */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await approveWithdrawal(w.id);
                                            showToast({
                                              title: 'Retrait approuvé !',
                                              desc: `${w.amount.toLocaleString()} ${w.currency} envoyé à ${w.userName} via ${w.operator}. Support technique retraits : +225 0503444508`,
                                              type: 'success',
                                            });
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                                          title="Valider le paiement Mobile Money"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Approuver le retrait</span>
                                        </button>

                                        {/* ✅ BOUTON OBLIGATOIRE : [Refuser le retrait] */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await rejectWithdrawal(w.id);
                                            showToast({
                                              title: 'Demande refusée',
                                              desc: `Le montant a été restitué au solde de l'artisan.`,
                                              type: 'warning',
                                            });
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-400 text-xs font-bold border border-neutral-700 hover:border-red-500/50 transition-all flex items-center gap-1 cursor-pointer"
                                          title="Rejeter et recréditer le solde"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          <span>Refuser le retrait</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION "CONTACT SUPPORT TECHNIQUE" (VISIBLE UNIQUEMENT POUR ADMIN) */}
              <div className="pt-6 border-t border-red-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-red-400" />
                    <span>Contact Support Technique & Assistance Directe</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">
                    🟢 Hotline Active 24/7
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Numéro support technique cliquable */}
                  <a
                    href="tel:+2250503444508"
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-red-500/60 transition-all flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">
                        Téléphone Direct
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        +225 0503444508
                      </div>
                    </div>
                  </a>

                  {/* 2. Email support cliquable */}
                  <a
                    href="mailto:contactartisanproafrica@gmail.com"
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-red-500/60 transition-all flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">
                        Email Support
                      </div>
                      <div className="text-xs font-bold text-white truncate font-mono">
                        contactartisanproafrica@gmail.com
                      </div>
                    </div>
                  </a>

                  {/* 3. Bouton WhatsApp Support Direct */}
                  <a
                    href="https://wa.me/2250503444508"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-500 transition-all flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">
                        WhatsApp Hotline
                      </div>
                      <div className="text-xs font-bold text-white font-mono">+225 0503444508</div>
                    </div>
                  </a>

                  {/* 4. Bouton diffusion groupée */}
                  <button
                    type="button"
                    onClick={() => setShowGroupMsgModal(true)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-red-900/60 to-purple-900/60 border border-red-500/40 hover:border-red-400 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-red-300 font-bold uppercase">
                        Diffusion Groupée
                      </div>
                      <div className="text-xs font-bold text-white">
                        Contacter tous les artisans
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODALE 1 : BANNIR / DÉBANNIR UN COMPTE (RÉSERVÉE ADMIN)
          ========================================================= */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500/60 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Modération & Sécurité des Comptes
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Bannir ou réactiver les comptes utilisateurs et artisans
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Onglets et barre de recherche */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <button
                  type="button"
                  onClick={() => setBanModalTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    banModalTab === 'all'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Tous les comptes ({allAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBanModalTab('banned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    banModalTab === 'banned'
                      ? 'bg-red-600 text-white'
                      : 'text-red-400 hover:text-white'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Comptes Bannis ({bannedUserIds.length})</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, ville ou email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border border-neutral-700 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Liste scrollable des utilisateurs */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-xs">
                  Aucun compte trouvé correspondant à votre critère.
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isBanned = bannedUserIds.includes(acc.id);

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isBanned
                          ? 'bg-red-950/30 border-red-500/40'
                          : 'bg-neutral-800/60 border-neutral-700/80 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isBanned
                              ? 'bg-red-600/30 text-red-400'
                              : 'bg-neutral-700 text-white'
                          }`}
                        >
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{acc.name}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                acc.isArtisan
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {acc.isArtisan ? 'Artisan' : 'Client'}
                            </span>
                            {isBanned ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-600 text-white">
                                Banni
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400">
                                Actif
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span>{acc.phone}</span>
                            <span>•</span>
                            <span>{acc.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bouton d'action Bannir ou Débannir */}
                      {isBanned ? (
                        <button
                          type="button"
                          onClick={() => handleUnbanUser(acc.id, acc.name)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Autoriser / Débannir</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBanUser(acc.id, acc.name)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Bannir</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer modal */}
            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALE 2 : VOIR PREUVE DE PAIEMENT MOBILE MONEY
          ========================================================= */}
      {selectedProofWithdrawal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-700 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Preuve de Paiement Mobile Money</h3>
                  <p className="text-[11px] text-neutral-400">Réf: TRX-{selectedProofWithdrawal.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofWithdrawal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reçu certifié */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Demandeur :</span>
                <span className="text-white font-bold">{selectedProofWithdrawal.userName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Réseau / Opérateur :</span>
                <span className="text-[#FF6B00] font-bold">{selectedProofWithdrawal.operator}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Numéro Mobile Money :</span>
                <span className="text-white font-bold">{selectedProofWithdrawal.userPhone}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Montant Net :</span>
                <span className="text-emerald-400 font-black text-sm">
                  {selectedProofWithdrawal.amount.toLocaleString()} {selectedProofWithdrawal.currency}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-neutral-800">
                <span className="text-neutral-400">Date de la demande :</span>
                <span className="text-neutral-300">{selectedProofWithdrawal.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Statut Système :</span>
                <span
                  className={`font-bold uppercase ${
                    selectedProofWithdrawal.status === 'approuve'
                      ? 'text-emerald-400'
                      : selectedProofWithdrawal.status === 'en_attente'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {selectedProofWithdrawal.status === 'approuve'
                    ? 'Transfert Effectué'
                    : selectedProofWithdrawal.status === 'en_attente'
                    ? 'En attente de signature'
                    : 'Rejeté'}
                </span>
              </div>
            </div>

            {/* Assistance & Support Retrait Approuvé */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">
                    Support Retrait Approuvé
                  </div>
                  <div className="text-xs font-mono font-bold text-white">
                    +225 0503444508
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:+2250503444508"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  Appeler
                </a>
                <a
                  href="https://wa.me/2250503444508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Actions dans la modale */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProofWithdrawal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>

              {selectedProofWithdrawal.status === 'en_attente' && (
                <button
                  type="button"
                  onClick={async () => {
                    await approveWithdrawal(selectedProofWithdrawal.id);
                    setSelectedProofWithdrawal(null);
                    showToast({
                      title: 'Retrait approuvé !',
                      desc: 'Le virement a été validé. Support retraits : +225 0503444508.',
                      type: 'success',
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approuver le retrait</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALE 3 : MODIFIER PROFIL CLIENT
          ========================================================= */}
      {showEditClientModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-black text-white">✏️ Modifier profil client</h3>
              <button
                type="button"
                onClick={() => setShowEditClientModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-300">Nom complet :</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border border-neutral-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300">Ville / Quartier :</label>
                <input
                  type="text"
                  value={editClientCity}
                  onChange={(e) => setEditClientCity(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border border-neutral-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditClientModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditClientModal(false);
                  showToast({ title: 'Profil mis à jour !', type: 'success' });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALE 4 : APERÇU PHOTO RÉALISATION ARTISAN
          ========================================================= */}
      {selectedGalleryPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedGalleryPhoto(null)}
        >
          <div className="max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative">
            <img
              src={selectedGalleryPhoto}
              alt="Aperçu réalisation"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setSelectedGalleryPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          BOUTON DÉCONNEXION EN BAS DU PROFIL
          ========================================================= */}
      <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-neutral-500">
          Session connectée : <span className="font-bold text-neutral-800">{currentUser?.name || 'Utilisateur'}</span> ({currentUser?.email || currentUser?.phone})
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Voulez-vous vous déconnecter de votre compte Artisan Pro ?')) {
              logout();
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {/* =========================================================
          MODALE 5 : CONTACTER TOUS LES ARTISANS (DIFFUSION GROUPÉE)
          ========================================================= */}
      {showGroupMsgModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Contacter tous les artisans</h3>
                  <p className="text-[11px] text-neutral-400">
                    Diffusion instantanée aux {artisans.length} artisans enregistrés
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupMsgModal(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">Message à diffuser :</label>
              <textarea
                rows={4}
                value={groupMsgText}
                onChange={(e) => setGroupMsgText(e.target.value)}
                placeholder="Exemple : Chers artisans, veuillez vérifier vos liens business WhatsApp et Facebook..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border border-neutral-700 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGroupMsgModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!groupMsgText.trim() || isSendingGroupMsg}
                onClick={async () => {
                  setIsSendingGroupMsg(true);
                  try {
                    await api.sendNotification({
                      title: 'Message Officiel de la Direction',
                      message: groupMsgText.trim(),
                      type: 'system',
                      linkPage: 'messages',
                    });
                    await refreshData();
                    showToast({
                      title: 'Message groupé transmis !',
                      desc: `Les ${artisans.length} artisans ont reçu votre notification.`,
                      type: 'success',
                    });
                    setGroupMsgText('');
                    setShowGroupMsgModal(false);
                  } catch (e: any) {
                    showToast({ title: 'Erreur', desc: e.message, type: 'warning' });
                  } finally {
                    setIsSendingGroupMsg(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingGroupMsg ? 'Envoi en cours...' : 'Diffuser le message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Obligatoire : DEVENIR ARTISAN */}
      <BecomeArtisanModal
        isOpen={showBecomeArtisanModal}
        onClose={() => setShowBecomeArtisanModal(false)}
      />
    </div>
  );
};
