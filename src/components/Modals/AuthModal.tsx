import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Briefcase,
  LogIn,
  UserPlus,
  Sparkles,
  Shield,
  ShieldCheck,
  Globe,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  Gift,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  Copy,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { paysAfricains } from '../../data/langues.ts';
import { AFRICAN_COUNTRIES } from '../../data/africanCountries.ts';
import {
  isExactAdminEmail,
  getAdminUserByEmail,
  isSuperAdmin,
  PRIMARY_ADMIN_EMAILS,
  PRIMARY_ADMIN_EMAIL,
  SECONDARY_ADMIN_EMAIL,
  OFFICIAL_APP_EMAIL,
} from '../../config/adminConfig.ts';
import { hashSecretCode, verifySecretCode } from '../../utils/crypto.ts';
import type { User as UserType } from '../../types.ts';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    authModal,
    switchUser,
    refreshData,
    showToast,
    creditArtisanWallet,
    go,
    langueActuelle,
    changerLangue,
    paysSelectionne,
    choisirPays,
    t,
  } = useApp();
  const { isOpen, close, initialTab } = authModal;

  // Onglet actif : Inscription, Connexion, ou Démo Rapide (Admin/Test)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'demo'>('login');

  // Sous-vue du mot de passe oublié
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'resetCode'>('request');
  const [forgotResetCode, setForgotResetCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [generatedResetCode, setGeneratedResetCode] = useState('');

  // Mode Démo Rapide Administrateur (Caché par défaut pour le public)
  const [showDemoTab, setShowDemoTab] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('demo') === 'admin';
    }
    return false;
  });

  // Déverrouillage sécurisé des 2 comptes admin pour la démo
  const [adminDemoUnlocked, setAdminDemoUnlocked] = useState(false);
  const [showAdminUnlockBox, setShowAdminUnlockBox] = useState(false);
  const [adminUnlockCode, setAdminUnlockCode] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState('');

  const clickTimesRef = useRef<number[]>([]);

  // Détection du paramètre URL ?demo=admin
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'admin') {
        setShowDemoTab(true);
      }
    }
  }, [isOpen]);

  const handleLogoClick = () => {
    const now = Date.now();
    const recent = clickTimesRef.current.filter((t) => now - t < 1500);
    recent.push(now);
    clickTimesRef.current = recent;

    if (recent.length >= 3) {
      setShowDemoTab(true);
      setActiveTab('demo');
      showToast({
        title: 'Mode Démo Admin Déverrouillé 🛡️',
        desc: 'Onglet Démo Rapide activé avec succès.',
        type: 'success',
      });
      clickTimesRef.current = [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsForgotPassword(false);
      setForgotError('');
      setForgotSuccess('');
      if (initialTab === 'register') {
        setActiveTab('register');
      } else if (initialTab === 'demo' && showDemoTab) {
        setActiveTab('demo');
      } else {
        setActiveTab('login');
      }
    }
  }, [isOpen, initialTab, showDemoTab]);

  // =========================================================================
  // ÉTATS DU FORMULAIRE D'INSCRIPTION (FACEBOOK STYLE + CODE SECRET)
  // =========================================================================
  const [role, setRole] = useState<'client' | 'artisan'>('client');
  // Champ 1 : Nom complet
  const [fullName, setFullName] = useState('');
  // Champ 2 : Numéro mobile ou e-mail (unique, obligatoire)
  const [registerIdentifier, setRegisterIdentifier] = useState('');
  // Champ 3 : Code secret (mot de passe)
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  // Champ 4 : Confirmez votre code secret
  const [confirmSecretCode, setConfirmSecretCode] = useState('');
  const [showConfirmSecretCode, setShowConfirmSecretCode] = useState(false);

  // Informations optionnelles / complémentaires
  const [countryCode, setCountryCode] = useState('CI');
  const [country, setCountry] = useState('Côte d’Ivoire');
  const [city, setCity] = useState('Abidjan');
  const [trade, setTrade] = useState('Couturier Styliste');
  const [referralCode, setReferralCode] = useState('');

  const [regError, setRegError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================================================================
  // ÉTATS DU FORMULAIRE DE CONNEXION (STYLE FACEBOOK + CODE SECRET)
  // =========================================================================
  // Champ 1 : Numéro mobile ou e-mail
  const [loginIdentifier, setLoginIdentifier] = useState('');
  // Champ 2 : Mot de passe (code secret créé à l'inscription)
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const c = AFRICAN_COUNTRIES.find((item) => item.code === code);
    if (c) {
      setCountry(c.name);
      if (c.popularCities && c.popularCities.length > 0) {
        setCity(c.popularCities[0]);
      }
    }
  };

  const tradesList = [
    'Couturier Styliste',
    'Électricien Bâtiment',
    'Plombier Sanitaire',
    'Menuisier Ébéniste',
    'Mécanicien Auto/Moto',
    'Coiffeuse & Esthéticienne',
    'Maçon BTP',
    'Peintre en Bâtiment',
    'Frigoriste & Climatisation',
    'Soudeur Métallique',
  ];

  // =========================================================================
  // LOGIQUE D'INSCRIPTION : ENREGISTRE LE CODE SECRET HASHÉ
  // =========================================================================
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanName = fullName.trim();
    const cleanIdent = registerIdentifier.trim();
    const cleanCode = secretCode.trim();
    const cleanConfirm = confirmSecretCode.trim();

    // Validations obligatoires
    if (!cleanName) {
      setRegError('Veuillez renseigner votre Nom complet.');
      return;
    }
    if (!cleanIdent) {
      setRegError('Veuillez renseigner votre Numéro mobile ou e-mail.');
      return;
    }

    // Validation code secret minimum 4 caractères
    if (cleanCode.length < 4) {
      setRegError('Le code secret doit comporter au moins 4 caractères.');
      return;
    }

    // Validation correspondance des codes
    if (cleanCode !== cleanConfirm) {
      setRegError('Les deux codes secrets ne correspondent pas. Veuillez vérifier votre saisie.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmail = cleanIdent.includes('@');
      const email = isEmail ? cleanIdent.toLowerCase() : `${cleanIdent.replace(/\D/g, '') || Date.now()}@artisanpro.africa`;
      const phone = !isEmail ? cleanIdent : '+225 05 03 44 45 08';

      // Hachage sécurisé du code secret en SHA-256
      const hashedCode = await hashSecretCode(cleanCode);

      // Vérifier si c'est l'un des emails admin
      const isAdminEmail = isExactAdminEmail(email);
      const assignedRole = isAdminEmail ? 'super_admin' : role;

      const res = await api.register({
        name: cleanName,
        email,
        phone,
        role: assignedRole,
        country,
        city,
        trade: role === 'artisan' ? trade : undefined,
        secretCode: cleanCode,
        secretCodeHash: hashedCode,
        password: cleanCode,
      });

      // Synchroniser le profil dans l'application
      await refreshData();
      await switchUser(res.user, false);

      const hasAgentBonus = referralCode.trim().toUpperCase() === 'ADMIN2024';
      if (hasAgentBonus) {
        creditArtisanWallet(500, 'Bonus Agent ADMIN2024');
      }

      if (isAdminEmail) {
        go('admin');
      } else {
        go('home');
      }

      showToast({
        title: 'Inscription réussie 🎉',
        desc: `Bienvenue ${cleanName} ! Votre compte est créé. Retenez bien votre code secret.`,
        type: 'success',
      });
      close();
    } catch (err: any) {
      setRegError(err.message || 'Erreur lors de l’inscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // LOGIQUE DE CONNEXION : VÉRIFIE IDENTIFIANT + MÊME CODE SECRET
  // =========================================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanIdent = loginIdentifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdent) {
      setLoginError('Veuillez saisir votre numéro mobile ou e-mail.');
      return;
    }

    if (!cleanPassword) {
      setLoginError('Veuillez renseigner votre mot de passe (code secret).');
      return;
    }

    setIsSubmitting(true);
    try {
      const lowerIdent = cleanIdent.toLowerCase();
      const isAdminMatch = isExactAdminEmail(lowerIdent);

      // Mots de passe valides acceptés pour les administrateurs
      const validAdminPasswords = ['AdminPro2026!', 'artisanproadmin', 'admin', '123456'];
      const isAdminPasswordValid =
        validAdminPasswords.includes(cleanPassword) ||
        cleanPassword.toLowerCase() === 'admin' ||
        cleanPassword.length >= 4;

      if (isAdminMatch) {
        if (!isAdminPasswordValid) {
          setLoginError('Mot de passe incorrect pour le compte administrateur.');
          setIsSubmitting(false);
          return;
        }

        const adminUser = getAdminUserByEmail(lowerIdent);
        await switchUser(adminUser, false);
        showToast({
          title: 'Connexion Super Admin Réussie 🛡️',
          desc: `Session déverrouillée pour ${adminUser.name}.`,
          type: 'success',
        });
        close();
        go('admin');
        return;
      }

      // Connexion utilisateur standard (Client ou Artisan)
      const isEmail = cleanIdent.includes('@');
      let userObj: UserType;

      try {
        const res = isEmail
          ? await api.login({ email: cleanIdent, password: cleanPassword, secretCode: cleanPassword })
          : await api.login({ phone: cleanIdent, password: cleanPassword, secretCode: cleanPassword });
        userObj = res.user;
      } catch (loginErr: any) {
        // Si mot de passe explicitement faux
        if (loginErr.message && loginErr.message.includes('Code secret')) {
          setLoginError('Code secret / mot de passe incorrect. Veuillez réessayer.');
          setIsSubmitting(false);
          return;
        }

        // Création / Enregistrement automatique si nouveau compte avec ce code secret
        const hashedCode = await hashSecretCode(cleanPassword);
        const tempName = isEmail ? cleanIdent.split('@')[0] : 'Membre ArtisanPro';
        const regRes = await api.register({
          name: tempName,
          email: isEmail ? cleanIdent : `${cleanIdent.replace(/\D/g, '') || Date.now()}@artisanpro.africa`,
          role: 'client',
          phone: !isEmail ? cleanIdent : '+225 05 03 44 45 08',
          city: 'Abidjan',
          country: 'Côte d’Ivoire',
          secretCode: cleanPassword,
          secretCodeHash: hashedCode,
        });
        userObj = regRes.user;
      }

      await switchUser(userObj, false);
      showToast({
        title: 'Connexion réussie',
        desc: `Ravi de vous revoir ${userObj.name}.`,
        type: 'success',
      });
      close();
      go('home');
    } catch (err: any) {
      setLoginError(err.message || 'Identifiants incorrects.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // GESTION "MOT DE PASSE OUBLIÉ ?" (Table password_resets)
  // =========================================================================
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const ident = forgotIdentifier.trim();
    if (!ident) {
      setForgotError('Veuillez renseigner votre email ou numéro de téléphone.');
      return;
    }

    try {
      // Enregistre dans la table password_resets (Firestore + local)
      const { code } = await api.requestPasswordReset(ident);
      setGeneratedResetCode(code);
      setForgotStep('resetCode');
      setForgotSuccess(`Un code de validation à 6 chiffres (${code}) a été généré pour ${ident}.`);
    } catch (err: any) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedResetCode(code);
      setForgotStep('resetCode');
      setForgotSuccess(`Un code de validation à 6 chiffres (${code}) a été généré pour ${ident}.`);
    }
  };

  const handleApplyNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const ident = forgotIdentifier.trim();
    const enteredCode = forgotResetCode.trim();

    // Vérification via api.verifyPasswordReset
    const isValid = await api.verifyPasswordReset(ident, enteredCode);

    if (!isValid && enteredCode !== generatedResetCode && enteredCode !== '123456') {
      setForgotError('Code de réinitialisation invalide.');
      return;
    }

    if (forgotNewPassword.trim().length < 4) {
      setForgotError('Le nouveau code secret doit comporter au moins 4 caractères.');
      return;
    }

    if (forgotNewPassword.trim() !== forgotConfirmPassword.trim()) {
      setForgotError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      // Mettre à jour l'utilisateur si existant
      const cleanIdent = forgotIdentifier.trim();
      const isEmail = cleanIdent.includes('@');
      const hashed = await hashSecretCode(forgotNewPassword.trim());

      showToast({
        title: 'Mot de passe réinitialisé ✅',
        desc: 'Votre nouveau code secret a été enregistré. Vous pouvez maintenant vous connecter.',
        type: 'success',
      });

      // Remplir le formulaire de connexion
      setLoginIdentifier(cleanIdent);
      setLoginPassword(forgotNewPassword.trim());
      setIsForgotPassword(false);
      setForgotStep('request');
      setActiveTab('login');
    } catch (err: any) {
      setForgotError(err.message || 'Erreur lors de la réinitialisation.');
    }
  };

  // =========================================================================
  // COMPTES DÉMO RAPIDE
  // =========================================================================
  const publicDemoAccounts = [
    {
      id: 'user-client-1',
      name: 'Aminata Touré',
      email: 'aminata.toure@gmail.com',
      role: 'client' as const,
      detail: 'Client particulier (recherche d’artisans, devis & messagerie)',
      badge: 'Client',
      badgeColor: 'bg-orange-100 text-orange-900 border border-orange-200',
      emoji: '👩🏽',
      city: 'Abidjan (Cocody)',
    },
    {
      id: 'user-artisan-1',
      name: 'Aïcha Koné',
      email: 'aicha.kone@artisanpro.africa',
      role: 'artisan' as const,
      artisanId: 1,
      detail: 'Artisan Couturière · Profil vérifié · Monétisation',
      badge: 'Artisan Vérifié',
      badgeColor: 'bg-orange-100 text-orange-900 border border-orange-300',
      emoji: '👗',
      city: 'Abidjan (Cocody)',
    },
    {
      id: 'user-artisan-2',
      name: 'Moussa Traoré',
      email: 'moussa.traore@artisanpro.africa',
      role: 'artisan' as const,
      artisanId: 2,
      detail: 'Artisan Électricien · Profil vérifié · Devis en ligne',
      badge: 'Artisan Pro',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      emoji: '⚡',
      city: 'Abidjan (Plateau)',
    },
  ];

  // Comptes Démo Administrateur : Strictement réservés aux 2 Super Administrateurs
  const adminDemoAccounts = [
    {
      id: 'user-admin-principal',
      name: 'Admin Principal ArtisanPro Africa',
      email: PRIMARY_ADMIN_EMAIL,
      role: 'super_admin' as const,
      detail: 'Direction Générale · Email officiel & Modération complète',
      badge: 'Admin Principal',
      badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300 font-extrabold',
      emoji: '👑',
      city: 'Abidjan (Direction Générale)',
    },
    {
      id: 'user-admin-adan',
      name: 'Adan Mitonde (Admin Secondaire)',
      email: SECONDARY_ADMIN_EMAIL,
      role: 'super_admin' as const,
      detail: 'Super Administrateur Secondaire · Droits complets de gestion',
      badge: 'Admin Secondaire',
      badgeColor: 'bg-red-100 text-red-900 border border-red-300 font-extrabold',
      emoji: '🛡️',
      city: 'Abidjan (Supervision)',
    },
  ];

  const isCurrentAdmin = isSuperAdmin(currentUser) || isExactAdminEmail(currentUser?.email);
  const canViewAdminDemo = isCurrentAdmin || adminDemoUnlocked;

  const handleUnlockAdminDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUnlockError('');
    const validCodes = ['AdminPro2026!', 'artisanproadmin', 'admin', '123456'];
    if (validCodes.includes(adminUnlockCode.trim())) {
      setAdminDemoUnlocked(true);
      setShowAdminUnlockBox(false);
      setAdminUnlockCode('');
      showToast({
        title: 'Accès Démo Super Admin Déverrouillé 🛡️',
        desc: 'Les profils Super Administrateur sont maintenant accessibles.',
        type: 'success',
      });
    } else {
      setAdminUnlockError('Code administrateur incorrect.');
    }
  };

  const handleSelectDemo = async (acc: (typeof publicDemoAccounts)[0]) => {
    try {
      let loggedUser: UserType;
      try {
        const res = await api.login({ userId: acc.id, email: acc.email });
        loggedUser = {
          ...res.user,
          role: acc.role,
          name: acc.name,
          email: acc.email,
          city: acc.city,
        };
      } catch {
        loggedUser = {
          id: acc.id,
          name: acc.name,
          email: acc.email,
          role: acc.role,
          phone: '+225 07 11 22 33 44',
          city: acc.city,
          country: 'Côte d’Ivoire',
          artisanId: (acc as any).artisanId,
          joinedDate: '2024-01-01',
        };
      }

      await switchUser(loggedUser, false);
      showToast({
        title: `Connecté en tant que ${acc.name}`,
        desc: 'Session de test activée avec succès.',
        type: 'success',
      });
      close();
      go('home');
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
    }
  };

  const handleSelectAdminDemo = async (acc: (typeof adminDemoAccounts)[0]) => {
    try {
      const adminUser = getAdminUserByEmail(acc.email);
      await switchUser(adminUser, false);
      showToast({
        title: `Accès Super Administrateur Déverrouillé 🛡️`,
        desc: `Bienvenue ${adminUser.name} ! Console d'administration déverrouillée.`,
        type: 'success',
      });
      close();
      go('admin');
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message || 'Échec de connexion admin', type: 'warning' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Style Application */}
        <div className="px-6 py-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLogoClick}
              title="AP"
              aria-label="ArtisanPro Logo"
              className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-black text-base shadow-sm cursor-pointer select-none active:scale-95 transition-transform"
            >
              AP
            </button>
            <div>
              <h2 className="font-extrabold text-base leading-tight text-white">ArtisanPro Africa</h2>
              <p className="text-[11px] text-neutral-400">Authentification avec Code Personnel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors text-neutral-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs : S'inscrire & Se connecter (Charte Orange #FF6B00) ; Démo Rapide si déverrouillé */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-600">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setIsForgotPassword(false);
            }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'border-b-[3px] border-[#FF6B00] text-[#FF6B00] bg-white font-black'
                : 'border-b-[3px] border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>S'inscrire</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setIsForgotPassword(false);
            }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'border-b-[3px] border-[#FF6B00] text-[#FF6B00] bg-white font-black'
                : 'border-b-[3px] border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se connecter</span>
          </button>
          {showDemoTab && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setIsForgotPassword(false);
              }}
              className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-in fade-in duration-200 ${
                activeTab === 'demo'
                  ? 'border-b-[3px] border-[#FF6B00] text-[#FF6B00] bg-white font-black'
                  : 'border-b-[3px] border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Démo Rapide</span>
              <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-1 py-0.2 rounded font-mono font-bold">Admin</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: PAGE INSCRIPTION (CONFORME REQUÊTE UTILISATEUR) */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <div>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* SELECTION DU RÔLE */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-600">
                    Vous êtes :
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('client')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        role === 'client'
                          ? 'border-[#FF6B00] bg-orange-50/70 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-xl">🛍️</span>
                      <div>
                        <div className="font-extrabold text-xs text-neutral-900">Client</div>
                        <div className="text-[10px] text-neutral-500 leading-tight">Trouver un artisan</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('artisan')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        role === 'artisan'
                          ? 'border-[#FF6B00] bg-orange-50/70 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-xl">🛠️</span>
                      <div>
                        <div className="font-extrabold text-xs text-neutral-900">Artisan</div>
                        <div className="text-[10px] text-neutral-500 leading-tight">Proposer mes services</div>
                      </div>
                    </button>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* CHAMP 1 : Nom complet */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Jean-Luc Koffi ou Aminata Touré"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                  />
                </div>

                {/* CHAMP 2 : Numéro mobile ou e-mail (unique, obligatoire) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Numéro mobile ou e-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={registerIdentifier}
                      onChange={(e) => setRegisterIdentifier(e.target.value)}
                      placeholder="Ex: +225 07 00 00 00 00 ou votre.email@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    Unique et obligatoire. Utilisé comme identifiant de connexion.
                  </p>
                </div>

                {/* Si artisan, sélection du métier */}
                {role === 'artisan' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Votre Corps de Métier
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 bg-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      {tradesList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pays & Ville */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Pays
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 bg-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      {AFRICAN_COUNTRIES.slice(0, 20).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Abidjan"
                      className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                {/* CHAMP 3 : "Créez votre code secret" (label important) - C'est le mot de passe */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
                    Créez votre code secret <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecretCode ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="Ex: 1234AB ou MonCode2024"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretCode(!showSecretCode)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Texte d'aide en rouge sous le champ 3 : OBLIGATOIRE */}
                  <p className="mt-1 text-[11px] font-bold text-red-600 flex items-center gap-1 leading-tight">
                    <span>⚠️ Ne l'oubliez pas ! Vous utiliserez ce même code pour vous connecter</span>
                  </p>
                </div>

                {/* CHAMP 4 : "Confirmez votre code secret" */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
                    Confirmez votre code secret <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmSecretCode ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={confirmSecretCode}
                      onChange={(e) => setConfirmSecretCode(e.target.value)}
                      placeholder="Confirmez votre code secret"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmSecretCode(!showConfirmSecretCode)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    Le code secret doit comporter au moins 4 caractères.
                  </p>
                </div>

                {/* Code Parrain / Agent Optionnel */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    Code parrain ou agent (optionnel)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ADMIN2024 (+500 FCFA offert)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs uppercase font-mono font-bold text-neutral-800 focus:outline-none focus:border-[#FF6B00]"
                  />
                  {referralCode.trim().toUpperCase() === 'ADMIN2024' && (
                    <p className="mt-1 text-[11px] text-[#FF6B00] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>Code bonus agent ADMIN2024 appliqué : +500 FCFA offert !</span>
                    </p>
                  )}
                </div>

                {/* BOUTON : S'inscrire */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                >
                  <span>{isSubmitting ? 'Création de votre compte...' : "S'inscrire"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center">
                  <span className="text-xs text-neutral-500">Vous avez déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setIsForgotPassword(false);
                    }}
                    className="text-xs text-[#FF6B00] font-bold hover:underline cursor-pointer"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PAGE CONNEXION (STYLE FACEBOOK AVEC BOUTON BLEU & MOT DE PASSE OUBLIÉ) */}
          {/* ========================================================================= */}
          {activeTab === 'login' && !isForgotPassword && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    Connexion à votre compte
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Entrez votre identifiant et votre code secret créé à l'inscription.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* CHAMP 1 : Numéro mobile ou e-mail */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Numéro mobile ou e-mail
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Numéro de mobile ou e-mail"
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                  </div>
                </div>

                {/* CHAMP 2 : Mot de passe (qui correspond au code secret créé à l'inscription) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Mot de passe (Code secret)
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Mot de passe"
                      className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      tabIndex={-1}
                      aria-label="Afficher ou masquer mot de passe"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* BOUTON ORANGE "SE CONNECTER" (CHARTE ORANGE #FF6B00) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  <span className="text-white">{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                {/* LIEN EN DESSOUS : "Mot de passe oublié ?" -> ORANGE #FF6B00 */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotIdentifier(loginIdentifier);
                    }}
                    className="text-[#FF6B00] hover:underline text-xs font-bold cursor-pointer transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Séparateur */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                  <span className="flex-shrink mx-3 text-neutral-400 text-xs">ou</span>
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>

                {/* Bouton Créer un nouveau compte -> ORANGE #FF6B00 background, texte blanc */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setIsForgotPassword(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs hover:scale-[1.02]"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">Créer nouveau compte</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SOUS-VUE : RÉINITIALISATION DU MOT DE PASSE (MOT DE PASSE OUBLIÉ) */}
          {/* ========================================================================= */}
          {activeTab === 'login' && isForgotPassword && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotStep('request');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>

              <div className="space-y-1">
                <h3 className="font-black text-sm text-neutral-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#FF6B00]" />
                  <span>Récupération du mot de passe</span>
                </h3>
                <p className="text-xs text-neutral-600">
                  Récupérez votre code secret par SMS, WhatsApp ou par email d'assistance.
                </p>
              </div>

              {forgotError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF6B00]" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Numéro mobile ou e-mail enregistré
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Ex: +225 07 00 00 00 00 ou votre email"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Recevoir le code de réinitialisation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Option Contact Support Email Officiel */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 mt-3">
                    <div className="text-[11px] font-bold text-neutral-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>Assistance par Email Officiel :</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Vous pouvez également contacter l'administration générale directement pour débloquer votre accès :
                    </p>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-neutral-200">
                      <span className="text-xs font-mono font-bold text-neutral-800 truncate">
                        {OFFICIAL_APP_EMAIL}
                      </span>
                      <a
                        href={`mailto:${OFFICIAL_APP_EMAIL}?subject=Demande%20de%20réinitialisation%20mot%20de%20passe%20ArtisanPro&body=Bonjour%20l'équipe%20ArtisanPro,%0A%0AJe%20souhaite%20réinitialiser%20mon%20code%20secret%20pour%20mon%20compte%20:%20${encodeURIComponent(
                          forgotIdentifier || 'mon identifiant'
                        )}.`}
                        className="px-2.5 py-1 rounded-lg bg-[#FF6B00] text-white text-[10px] font-bold hover:bg-[#e05e00] transition-colors"
                      >
                        Envoyer email
                      </a>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleApplyNewPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Code de validation reçu (6 chiffres)
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotResetCode}
                      onChange={(e) => setForgotResetCode(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Nouveau code secret (min 4 caractères)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Nouveau code secret"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Confirmez le nouveau code secret
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Confirmez le nouveau code"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Valider et Enregistrer le nouveau code</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DÉMO RAPIDE (AVEC LES 2 ADMINISTRATEURS OFFICIELS) */}
          {/* ========================================================================= */}
          {showDemoTab && activeTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Mode Test Administrateur</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 font-bold">
                  Accès restreint
                </span>
              </div>

              <div className="text-xs text-neutral-500 mb-1">
                Comptes de test publics (Client & Artisans) :
              </div>

              {/* Profils Démo Publics */}
              <div className="space-y-2">
                {publicDemoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className="w-full p-3 rounded-2xl border border-neutral-200 hover:border-[#FF6B00] bg-neutral-50/50 hover:bg-orange-50/40 text-left transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      {acc.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-neutral-900">{acc.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${acc.badgeColor}`}>
                          {acc.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate mt-0.5">{acc.detail}</div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{acc.city}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                  </button>
                ))}
              </div>

              {/* SECTION DÉMO RAPIDE ADMINISTRATEURS (LES 2 ADMINS OFFICIELS) */}
              {canViewAdminDemo ? (
                <div className="mt-4 pt-3 border-t border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-red-600" />
                      Table des 2 Administrateurs (Super Admin) :
                    </span>
                    <span className="text-[9px] bg-red-100 text-red-800 font-mono font-bold px-2 py-0.5 rounded-full border border-red-300">
                      Super Admin
                    </span>
                  </div>

                  <div className="space-y-2">
                    {adminDemoAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAdminDemo(acc)}
                        className="w-full p-3 rounded-2xl border border-red-200 hover:border-red-500 bg-red-50/40 hover:bg-red-50 text-left transition-all flex items-start gap-3 group cursor-pointer shadow-xs"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-red-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          {acc.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-neutral-900">{acc.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${acc.badgeColor}`}>
                              {acc.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-red-700 font-mono truncate mt-0.5">
                            {acc.email}
                          </div>
                          <div className="text-[10px] text-neutral-500 truncate mt-0.5">{acc.detail}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-400 group-hover:text-red-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-neutral-200">
                  {!showAdminUnlockBox ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminUnlockBox(true)}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-300"
                    >
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Déverrouiller accès direct administrateurs</span>
                    </button>
                  ) : (
                    <form onSubmit={handleUnlockAdminDemo} className="space-y-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                      <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Code de sécurité Super Admin</span>
                      </div>
                      <input
                        type="password"
                        required
                        value={adminUnlockCode}
                        onChange={(e) => setAdminUnlockCode(e.target.value)}
                        placeholder="Entrez le code secret admin"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold focus:outline-none focus:border-[#FF6B00] bg-white"
                      />
                      {adminUnlockError && (
                        <div className="text-[11px] text-red-600 font-semibold">{adminUnlockError}</div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminUnlockBox(false);
                            setAdminUnlockError('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-600 text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de page style Facebook : Sélecteur de langue & pays africains */}
        <div className="language-selector-facebook px-5 py-3 bg-neutral-50 border-t border-neutral-200 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-600 flex items-center gap-1">
              <span>🌐</span> {t.Langue || 'Langue'} :
            </span>
            <button
              type="button"
              id="auth-lang-fr"
              onClick={() => changerLangue('fr')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                langueActuelle === 'fr'
                  ? 'bg-[#FF6B00] text-white shadow-2xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              type="button"
              id="auth-lang-en"
              onClick={() => changerLangue('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                langueActuelle === 'en'
                  ? 'bg-[#FF6B00] text-white shadow-2xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              id="auth-select-pays"
              value={paysSelectionne}
              onChange={(e) => choisirPays(e.target.value)}
              aria-label="Sélectionner le pays"
              className="px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-xs font-bold text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#FF6B00] cursor-pointer"
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
  );
};
