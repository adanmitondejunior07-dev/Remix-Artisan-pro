import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Crown,
  CreditCard,
  Shield,
  Bell,
  Lock,
  User,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Phone,
  MessageCircle,
  FileText,
  Sliders,
  ToggleLeft,
  ToggleRight,
  History,
  Trash2,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { paysAfricains, langues } from '../data/langues.ts';
import { isExactAdminEmail, isSuperAdmin } from '../config/adminConfig.ts';
import {
  loadAdminPermissions,
  saveAdminPermissions,
  canManageAdminPermissions,
  type SystemAdminPermissions,
} from '../utils/adminPermissionsStorage.ts';

type SettingsTab = 'subscription' | 'security' | 'notifications' | 'preferences' | 'admin_config';

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    currentArtisan,
    go,
    logout,
    showToast,
    isSubscriptionExpired,
    canAccessProFeatures,
    walletBalance,
    langueActuelle,
    changerLangue,
    paysSelectionne,
    choisirPays,
    t,
  } = useApp();

  const isAdmin = isSuperAdmin(currentUser);
  const isArtisan = currentUser?.role === 'artisan' || Boolean(currentUser?.artisanId);
  const isDGOrBackup = canManageAdminPermissions(currentUser?.email);

  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');

  // Push notifications & sound toggles stored in localStorage
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('artisanpro_notifs_enabled') !== 'false';
    }
    return true;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('artisanpro_sound_enabled') !== 'false';
    }
    return true;
  });

  const [callRingtoneEnabled, setCallRingtoneEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('artisanpro_ringtone_enabled') !== 'false';
    }
    return true;
  });

  // Admin permissions toggles
  const [adminPermissions, setAdminPermissions] = useState<SystemAdminPermissions>(() => loadAdminPermissions());

  useEffect(() => {
    const handlePermsChange = (e: any) => {
      if (e.detail) setAdminPermissions(e.detail);
      else setAdminPermissions(loadAdminPermissions());
    };
    window.addEventListener('admin_permissions_updated', handlePermsChange);
    return () => window.removeEventListener('admin_permissions_updated', handlePermsChange);
  }, []);

  const handleToggleAdminPerm = (key: keyof SystemAdminPermissions) => {
    if (!isDGOrBackup) {
      showToast({
        title: 'Accès restreint',
        desc: 'Seul le Directeur Général ou le Créateur Secours peut modifier les permissions du système.',
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
      title: 'Paramètre système mis à jour',
      desc: `La permission "${key}" a été ${updated[key] ? 'activée' : 'désactivée'}.`,
      type: 'success',
    });
  };

  const handleToggleNotifs = () => {
    const val = !notificationsEnabled;
    setNotificationsEnabled(val);
    localStorage.setItem('artisanpro_notifs_enabled', String(val));
    showToast({
      title: val ? 'Notifications activées' : 'Notifications en sourdine',
      desc: val ? 'Vous recevrez les alertes de nouveaux messages et devis.' : 'Les notifications push ont été désactivées.',
      type: 'info',
    });
  };

  const handleToggleSound = () => {
    const val = !soundEnabled;
    setSoundEnabled(val);
    localStorage.setItem('artisanpro_sound_enabled', String(val));
    showToast({
      title: val ? 'Sons d’alerte activés' : 'Sons d’alerte désactivés',
      desc: val ? 'Un bip retentira lors de chaque nouvelle alerte.' : 'Le mode silencieux est actif.',
      type: 'info',
    });
  };

  const handleToggleRingtone = () => {
    const val = !callRingtoneEnabled;
    setCallRingtoneEnabled(val);
    localStorage.setItem('artisanpro_ringtone_enabled', String(val));
    showToast({
      title: val ? 'Sonnerie appels VoIP activée' : 'Sonnerie appels VoIP coupée',
      desc: val ? 'Votre appareil sonnera lors des appels entrants.' : 'Les appels entrants seront discrets.',
      type: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] pb-24 md:pb-12 pt-4 sm:pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* EN-TÊTE PRINCIPAL PARAMÈTRES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center text-2xl shrink-0 shadow-inner">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  Paramètres
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {isAdmin ? 'Espace Administrateur' : isArtisan ? 'Compte Professionnel' : 'Compte Particulier'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Gérez vos abonnements, votre sécurité, vos alertes et les réglages de votre application.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => go('account')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-neutral-600" />
            <span>Voir mon Profil</span>
          </button>
        </div>

        {/* ONGLETS HORIZONTAUX DE PARAMÈTRES */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200 no-scrollbar">
          <button
            type="button"
            id="tab-settings-subscription"
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'subscription'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Abonnements & Formules</span>
          </button>

          <button
            type="button"
            id="tab-settings-security"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sécurité & Confidentialité</span>
          </button>

          <button
            type="button"
            id="tab-settings-notifications"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications & Sons</span>
          </button>

          <button
            type="button"
            id="tab-settings-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Préférences & Données</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              id="tab-settings-admin-config"
              onClick={() => setActiveTab('admin_config')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin_config'
                  ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Permissions Système (Admin)</span>
            </button>
          )}
        </div>

        {/* =========================================================================
            ONGLET 1 : ABONNEMENTS & FORMULES (BALANCÉ DANS PARAMÈTRES)
           ========================================================================= */}
        {activeTab === 'subscription' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Statut actuel de l'abonnement */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
                    isSubscriptionExpired
                      ? 'bg-red-100 text-red-600'
                      : isArtisan
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isSubscriptionExpired ? '⚠️' : isArtisan ? '👑' : '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-neutral-900">
                        Votre Statut d'Abonnement
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        isSubscriptionExpired
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isArtisan
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}>
                        {isSubscriptionExpired
                          ? 'Suspendu / Expiré'
                          : isArtisan
                          ? 'Actif · Professionnel'
                          : 'Particulier Gratuit'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {isArtisan
                        ? `Formule en cours : ${currentUser?.subscription_plan ? currentUser.subscription_plan.toUpperCase() : 'PRO'} (Mensuel)`
                        : 'Aucun abonnement payant actif pour ce profil client.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => go('abonnements')}
                    className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-orange-600/20"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Choisir une formule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => go('mon-historique')}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <History className="w-4 h-4 text-neutral-600" />
                    <span>Historique paiements</span>
                  </button>
                </div>
              </div>

              {/* Détails du plan & cartes d'information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Formule Actuelle
                  </span>
                  <div className="text-base font-black text-neutral-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FF6B00]" />
                    <span>{currentUser?.subscription_plan ? currentUser.subscription_plan.toUpperCase() : isArtisan ? 'PRO' : 'ESSENTIEL'}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 block">
                    {isArtisan ? 'Label Vérifié & Contact Direct' : 'Accès consultation public'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Fin de Période
                  </span>
                  <div className="text-base font-black text-neutral-900 font-mono">
                    {currentUser?.subscription_end_date
                      ? new Date(currentUser.subscription_end_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Permanent'}
                  </div>
                  <span className="text-[11px] text-neutral-500 block">
                    Renouvellement automatique désactivé
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Paiement Sécurisé
                  </span>
                  <div className="text-base font-black text-neutral-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Mobile Money & Wave</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 block">
                    Orange, MTN, Moov, Wave CI
                  </span>
                </div>
              </div>

              {/* Raccourci vers les 3 formules d'abonnement */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                    Formules ArtisanPro disponibles :
                  </h3>
                  <button
                    type="button"
                    onClick={() => go('abonnements')}
                    className="text-xs text-[#FF6B00] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir comparatif complet</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plan Essentiel */}
                  <div className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-amber-400 transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-sm text-neutral-900">ESSENTIEL</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold">Standard</span>
                      </div>
                      <div className="text-xl font-black text-neutral-900">300 FCFA <span className="text-xs font-normal text-neutral-500">/ mois</span></div>
                      <p className="text-xs text-neutral-500 mt-2">Visibilité dans l’annuaire & réception de devis clients.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => go('abonnements')}
                      className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Choisir Essentiel
                    </button>
                  </div>

                  {/* Plan Pro */}
                  <div className="p-5 rounded-2xl border-2 border-[#FF6B00] bg-orange-50/30 relative flex flex-col justify-between space-y-3">
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-wider">
                      Recommandé
                    </span>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-sm text-neutral-900">PRO</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 text-[#FF6B00] font-bold">Top Vente</span>
                      </div>
                      <div className="text-xl font-black text-[#FF6B00]">700 FCFA <span className="text-xs font-normal text-neutral-500">/ mois</span></div>
                      <p className="text-xs text-neutral-600 mt-2">Badge Pro Vérifié, position prioritaire et publications illimitées.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => go('abonnements')}
                      className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-colors cursor-pointer shadow-sm"
                    >
                      Choisir Pro
                    </button>
                  </div>

                  {/* Plan Premium VIP */}
                  <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-900 text-white flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-sm text-white">PREMIUM VIP</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 font-black">Élite</span>
                      </div>
                      <div className="text-xl font-black text-amber-400">1 000 FCFA <span className="text-xs font-normal text-neutral-400">/ mois</span></div>
                      <p className="text-xs text-neutral-300 mt-2">Badge Gold VIP, vitrine d’accueil et assistance prioritaire 24h/24.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => go('abonnements')}
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 text-xs font-black transition-colors cursor-pointer"
                    >
                      Choisir VIP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 2 : SÉCURITÉ & CONFIDENTIALITÉ
           ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#FF6B00]" />
                  <span>Sécurité du Compte</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Protégez vos accès et vos données personnelles sur la plateforme ArtisanPro.
                </p>
              </div>

              <div className="divide-y divide-neutral-100">
                {/* Email et identifiant */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">Adresse Email de connexion</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">{currentUser?.email || 'Non renseignée'}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 self-start sm:self-auto">
                    ✓ Authentifié
                  </span>
                </div>

                {/* Téléphone vérifié */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">Numéro de téléphone vérifié</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">{currentUser?.phone || '+225 00000000'}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 self-start sm:self-auto">
                    ✓ Chiffrement SSL
                  </span>
                </div>

                {/* Confidentialité & Données */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">Politique de Confidentialité</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Consultez comment vos données sont hébergées et chiffrées.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('privacy')}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Consulter la charte
                  </button>
                </div>

                {/* Conditions d'utilisation */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">Conditions Générales d'Utilisation (CGU)</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Règles régissant les échanges, commandes et paiements.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('terms')}
                    className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Consulter les CGU
                  </button>
                </div>

                {/* Zone dangereuse : Suppression */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/50 p-4 rounded-2xl mt-2 border border-red-100">
                  <div>
                    <div className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Supprimer définitivement mon compte</span>
                    </div>
                    <div className="text-xs text-red-600/80 mt-0.5">
                      Supprime toutes vos publications, messages et votre historique de devis.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('delete-account')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 3 : NOTIFICATIONS & SONS
           ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#FF6B00]" />
                  <span>Notifications & Alertes Sonores</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Définissez comment vous souhaitez être prévenu lors de l’arrivée de nouveaux messages ou clients.
                </p>
              </div>

              <div className="divide-y divide-neutral-100 space-y-2">
                {/* Toggle 1: Notifications push */}
                <div className="pt-3 pb-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-neutral-900">Notifications Push & Popups</div>
                    <div className="text-xs text-neutral-500">
                      Recevoir une alerte visuelle instantanée lors d'un nouveau devis ou commentaire.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNotifs}
                    className="cursor-pointer focus:outline-none"
                    aria-label="Basculer notifications push"
                  >
                    {notificationsEnabled ? (
                      <ToggleRight className="w-10 h-10 text-[#FF6B00] transition-colors" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-300 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Toggle 2: Son d'alerte */}
                <div className="pt-4 pb-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-neutral-900">Bips et Alertes Sonores</div>
                    <div className="text-xs text-neutral-500">
                      Jouer un signal sonore lors de la réception d'un message direct dans l'application.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="cursor-pointer focus:outline-none"
                    aria-label="Basculer sons d'alerte"
                  >
                    {soundEnabled ? (
                      <ToggleRight className="w-10 h-10 text-[#FF6B00] transition-colors" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-300 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Toggle 3: Sonnerie d'appel VoIP */}
                <div className="pt-4 pb-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-neutral-900">Sonnerie des Appels Entrants VoIP</div>
                    <div className="text-xs text-neutral-500">
                      Activer la sonnerie lors d'un appel audio ou visio direct passé par un client.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleRingtone}
                    className="cursor-pointer focus:outline-none"
                    aria-label="Basculer sonnerie d'appel"
                  >
                    {callRingtoneEnabled ? (
                      <ToggleRight className="w-10 h-10 text-[#FF6B00] transition-colors" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 4 : PRÉFÉRENCES & DONNÉES
           ========================================================================= */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#FF6B00]" />
                  <span>Préférences de l'Application</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Paramétrez votre langue, pays d'intervention et affichage monétaire.
                </p>
              </div>

              {/* Sélecteur de Langue & Pays Africains - Style Facebook */}
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="language-selector-facebook">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#FF6B00]" />
                      <span>🌐 {t.Langue || 'Langue'} & {t.SelectionnerPays || 'Pays'}</span>
                    </p>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF6B00] border border-orange-200">
                      {langueActuelle === 'en' ? '🇬🇧 English' : '🇫🇷 Français'} · {paysSelectionne}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      id="btn-lang-fr"
                      onClick={() => changerLangue('fr')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        langueActuelle === 'fr'
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm'
                          : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
                      }`}
                    >
                      <span>🇫🇷</span>
                      <span>Français</span>
                    </button>

                    <button
                      type="button"
                      id="btn-lang-en"
                      onClick={() => changerLangue('en')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        langueActuelle === 'en'
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm'
                          : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                    </button>

                    <div className="flex-1 min-w-[200px]">
                      <select
                        id="select-pays-africains"
                        value={paysSelectionne}
                        onChange={(e) => choisirPays(e.target.value)}
                        aria-label="Sélectionner votre pays africain"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                      >
                        {paysAfricains.map((p) => (
                          <option key={p.nom} value={p.nom}>
                            {p.drapeau} {p.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Langue d'affichage</span>
                  <div className="text-sm font-black text-neutral-900">
                    {langueActuelle === 'en' ? 'English (Pan-African)' : 'Français (Afrique de l’Ouest & Centrale)'}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {langueActuelle === 'en' ? 'English language selected' : 'Français standard optimisé pour l’Afrique'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Devise Principale</span>
                  <div className="text-sm font-black text-neutral-900">
                    {paysSelectionne === 'Nigeria'
                      ? 'Naira (₦ / NGN)'
                      : paysSelectionne === 'Ghana'
                      ? 'Ghana Cedi (GH₵ / GHS)'
                      : paysSelectionne === 'Afrique du Sud'
                      ? 'South African Rand (R / ZAR)'
                      : 'Franc CFA (FCFA / XOF)'}
                  </div>
                  <span className="text-[11px] text-neutral-400">Devise calculée selon votre pays</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Pays de Résidence</span>
                  <div className="text-sm font-black text-neutral-900">{paysSelectionne}</div>
                  <span className="text-[11px] text-neutral-400">Ville de référence : {currentUser?.city || 'Capitale économique'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Opérateurs Paiement</span>
                  <div className="text-sm font-black text-neutral-900">Wave, Orange, MTN, Moov, CinetPay</div>
                  <span className="text-[11px] text-neutral-400">Transactions instantanées sans frais cachés</span>
                </div>
              </div>

              {/* Raccourcis d'Assistance */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900">Besoin d'aide ou assistance technique ?</div>
                  <div className="text-xs text-neutral-500">Notre équipe de support est disponible 24h/24 et 7j/7.</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go('report-issue')}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Signaler un bug
                  </button>
                  <button
                    type="button"
                    onClick={() => go('how-it-works')}
                    className="px-4 py-2.5 rounded-xl bg-orange-50 text-[#FF6B00] hover:bg-orange-100 text-xs font-bold transition-colors cursor-pointer border border-orange-200"
                  >
                    Comment ça marche ?
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 5 : PERMISSIONS SYSTÈME (RÉSERVÉ AUX ADMINISTRATEURS)
           ========================================================================= */}
        {activeTab === 'admin_config' && isAdmin && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-purple-600 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-800/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/60 text-purple-400 border border-purple-700 flex items-center justify-center text-xl font-bold shrink-0">
                    🛡️
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-white">
                        Permissions Système Administrateur
                      </h2>
                      <span className="px-3 py-0.5 rounded-full bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider">
                        Console Maître
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Contrôle des fonctionnalités globales de la plateforme (persistance immédiate dans le système).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => go('admin')}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
                >
                  <Shield className="w-4 h-4" />
                  <span>Tableau de bord Admin</span>
                </button>
              </div>

              {!isDGOrBackup && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    Vous êtes en mode consultation : seul le <strong>Directeur Général</strong> (artisanproafrique@gmail.com) ou le <strong>Créateur Secours</strong> (adanmitondejunior07@gmail.com) peut basculer ces autorisations.
                  </span>
                </div>
              )}

              {/* Toggles système */}
              <div className="divide-y divide-neutral-800">
                {/* 1. VoIP */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Appels VoIP & Visio chiffrés</div>
                    <div className="text-xs text-neutral-400">Autoriser les appels directs audio et vidéo entre clients et artisans.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminPerm('voip')}
                    disabled={!isDGOrBackup}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    {adminPermissions.voip ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* 2. Partage d'écran */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Partage d'écran VoIP</div>
                    <div className="text-xs text-neutral-400">Permettre le partage d'écran lors des appels d'assistance technique.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminPerm('screen_share')}
                    disabled={!isDGOrBackup}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    {adminPermissions.screen_share ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* 3. Vue tous les profils */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Supervision globale des profils</div>
                    <div className="text-xs text-neutral-400">Permettre à l'équipe admin d'auditer les profils et les publications.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminPerm('view_all_profiles')}
                    disabled={!isDGOrBackup}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    {adminPermissions.view_all_profiles ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* 4. Suppression de compte (Danger) */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-red-400">Suppression définitive de compte</div>
                    <div className="text-xs text-neutral-400">Autoriser les utilisateurs à supprimer définitivement leurs comptes.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminPerm('delete_account')}
                    disabled={!isDGOrBackup}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    {adminPermissions.delete_account ? (
                      <ToggleRight className="w-10 h-10 text-red-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* 5. Mode assistance support */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Mode Assistance Support Technique</div>
                    <div className="text-xs text-neutral-400">Activer le support technique dédié pour contactartisanproafrica@gmail.com.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminPerm('support_mode')}
                    disabled={!isDGOrBackup}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    {adminPermissions.support_mode ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIED DE PAGE : DÉCONNEXION RAPIDE */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs text-neutral-500">
            Connecté avec le compte : <strong className="text-neutral-900">{currentUser?.name}</strong> ({currentUser?.email || currentUser?.phone})
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment vous déconnecter d’ArtisanPro ?')) {
                logout();
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Se déconnecter</span>
          </button>
        </div>

      </div>
    </div>
  );
};
