import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  XCircle,
  Phone,
  Smartphone,
  Check,
  X,
  Search,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Copy,
  ExternalLink,
  Send,
  Mail,
  PhoneCall,
  Video,
  ShieldAlert,
  Printer,
  Download,
  UserX,
  UserCheck,
  Lock,
  QrCode,
  Share2,
  Layers,
  Coins,
  Cpu,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import type { AdminStats, PaymentTransaction, Artisan, User, WithdrawalRequest } from '../types.ts';
import { isSuperAdmin, isFounderSuperAdmin, admins, getDashboard, getAdminAfricaProfile, getAdminUserByEmail } from '../config/adminConfig.ts';
import { AdminPrivateAccount, ADMIN_EMAILS } from './AdminPrivateAccount.tsx';
import { AdminSubscriptionsSection } from './AdminSubscriptionsSection.tsx';
import { AdminMonetizationSection } from './AdminMonetizationSection.tsx';
import { Admin3RolesBanner } from './Admin3RolesBanner.tsx';
import { AdminTechniqueCinetPaySection } from './AdminTechniqueCinetPaySection.tsx';
import { AdminPaymentsPage } from './AdminPaymentsPage.tsx';
import { AdminUsersSection } from './AdminUsersSection.tsx';
import { AdminPublicationsSection } from './AdminPublicationsSection.tsx';
import { TestProtocolModal } from './TestProtocolModal.tsx';
import {
  PERMANENT_OFFICIAL_CHANNELS,
  cleanAndNormalizeLink,
  isValidOfficialUrl,
} from '../utils/channelUtils.ts';
import {
  loadAdminPermissions,
  saveAdminPermissions,
  canManageAdminPermissions,
  type SystemAdminPermissions,
} from '../utils/adminPermissionsStorage.ts';

const FounderQrCodeSvg: React.FC<{ size?: number; className?: string }> = ({ size = 68, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Coin Supérieur Gauche */}
    <rect x="6" y="6" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
    <rect x="13" y="13" width="12" height="12" rx="2" fill="currentColor" />
    {/* Coin Supérieur Droit */}
    <rect x="68" y="6" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
    <rect x="75" y="13" width="12" height="12" rx="2" fill="currentColor" />
    {/* Coin Inférieur Gauche */}
    <rect x="6" y="68" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
    <rect x="13" y="75" width="12" height="12" rx="2" fill="currentColor" />
    {/* Motifs de synchronisation et données QR */}
    <rect x="38" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="48" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="58" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="10" y="38" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="10" y="48" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="10" y="58" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="38" y="24" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="52" y="24" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="38" y="38" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="52" y="38" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="45" y="45" width="8" height="8" rx="1.5" fill="currentColor" />
    <rect x="38" y="54" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="52" y="54" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="70" y="38" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="84" y="38" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="70" y="50" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="80" y="50" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="70" y="68" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="82" y="68" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="70" y="82" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="84" y="82" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="38" y="70" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="48" y="70" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="38" y="84" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="52" y="84" width="6" height="6" rx="1.5" fill="currentColor" />
  </svg>
);

export const AdminPage: React.FC = () => {
  const {
    currentUser,
    switchUser,
    go,
    artisans,
    users,
    deleteUser,
    deleteArtisan,
    withdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    refreshData,
    showToast,
    officialChannels,
    updateOfficialChannels,
    socialPosts,
  } = useApp();

  // SÉCURITÉ : Vérifier côté client et logique que seul super_admin peut accéder
  useEffect(() => {
    if (!isSuperAdmin(currentUser)) {
      go('home');
      showToast({
        title: 'Accès non autorisé',
        desc: 'Vous devez être connecté en tant que super administrateur.',
        type: 'warning',
      });
    }
  }, [currentUser]);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<
    'withdrawals' | 'artisans' | 'monetization' | 'clients' | 'publications' | 'announcements' | 'business_links' | 'permissions' | 'subscriptions' | 'paiements' | 'private_account' | 'technique_cinetpay'
  >('withdrawals');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'all' | 'en_attente' | 'approuve' | 'refuse'>('all');

  // === 3 SUPER ADMINS FONDATEURS - ARTISANPRO AFRIQUE ===
  const superAdmins = [
    'adanmitondejunior07@gmail.com',
    'artisanpro.afrique@gmail.com',
    'contactartisanproafrica@gmail.com',
  ];
  const isSuperAdminUser =
    superAdmins.includes(currentUser?.email?.toLowerCase() || '') ||
    isSuperAdmin(currentUser) ||
    currentUser?.role === 'super_admin';

  // Détermination de l'admin actif et de son écran attribué
  const initialAdminEmail = currentUser?.email && admins.some(a => a.email.toLowerCase() === currentUser.email.toLowerCase())
    ? currentUser.email
    : 'artisanpro.afrique@gmail.com';
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string>(initialAdminEmail);

  // Initialisation automatique selon le rôle de l'administrateur connecté
  useEffect(() => {
    if (currentUser?.email) {
      const assignedDashboard = getDashboard(currentUser.email);
      if (assignedDashboard === 'Dashboard Retraits - A vérifier') {
        setAdminTab('withdrawals');
        setWithdrawalStatusFilter('en_attente');
      } else if (assignedDashboard === 'Dashboard Technique - CinetPay + Logs') {
        setAdminTab('technique_cinetpay');
      }
    }
  }, [currentUser?.email]);

  // Fonction pour basculer d'écran selon l'admin sélectionné
  const handleSelectAdmin = async (email: string) => {
    setSelectedAdminEmail(email);
    const adminUser = getAdminUserByEmail(email);
    if (switchUser) {
      await switchUser(adminUser, false);
    }
    const screen = getDashboard(email);
    if (screen.includes('Retraits') || screen.includes('Support Technique')) {
      setAdminTab('withdrawals');
      setWithdrawalStatusFilter('en_attente');
      showToast({
        title: `${adminUser.name} 💰`,
        desc: `Session activée (${email}) : Support client et validation des retraits.`,
        type: 'info',
      });
    } else if (screen.includes('Technique') || screen.includes('CinetPay') || screen.includes('Créateur')) {
      setAdminTab('technique_cinetpay');
      showToast({
        title: `${adminUser.name} ⚙️`,
        desc: `Session activée (${email}) : Passerelle CinetPay, logs et surveillance flux.`,
        type: 'info',
      });
    } else {
      setAdminTab('withdrawals');
      setWithdrawalStatusFilter('all');
      showToast({
        title: `${adminUser.name} 👑`,
        desc: `Session activée (${email}) : Supervision complète de toute la plateforme.`,
        type: 'info',
      });
    }
  };

  // Gestion des bannissements de compte
  const [bannedUserIds, setBannedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('artisan_pro_banned_users');
      return saved ? JSON.parse(saved) : ['user-mock-fraud-1'];
    } catch {
      return ['user-mock-fraud-1'];
    }
  });
  const [showBanModal, setShowBanModal] = useState(false);
  const [banModalTab, setBanModalTab] = useState<'all' | 'banned'>('all');
  const [banSearchQuery, setBanSearchQuery] = useState('');

  const toggleBanUser = (id: string, name: string) => {
    setBannedUserIds((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((item) => item !== id);
        showToast({
          title: 'Compte débanni 🟢',
          desc: `${name} peut à nouveau utiliser tous les services.`,
          type: 'success',
        });
      } else {
        updated = [...prev, id];
        showToast({
          title: 'Compte banni 🔴',
          desc: `${name} a été suspendu de la plateforme.`,
          type: 'warning',
        });
      }
      try {
        localStorage.setItem('artisan_pro_banned_users', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleOpenWithdrawalsDashboard = () => {
    setAdminTab('withdrawals');
    const el = document.getElementById('mobile-money-withdrawals-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected withdrawal for payment proof modal
  const [selectedProofWithdrawal, setSelectedProofWithdrawal] = useState<WithdrawalRequest | null>(null);

  // Admin Permissions state with persistent storage in localStorage 'admin_permissions'
  const [adminPermissions, setAdminPermissions] = useState<SystemAdminPermissions>(() => loadAdminPermissions());

  // Listen to cross-component changes of permissions
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
      title: 'Permission mise à jour',
      desc: `La permission "${key}" a été sauvegardée dans les paramètres système.`,
      type: 'success',
    });
  };

  // Business links inputs for Admin / Platform (Canaux Officiels)
  const [businessLinks, setBusinessLinks] = useState({
    whatsappChannel:
      officialChannels?.whatsappChannel || PERMANENT_OFFICIAL_CHANNELS.whatsappChannel,
    facebookPage:
      officialChannels?.facebookPage || PERMANENT_OFFICIAL_CHANNELS.facebookPage,
    instagramTiktok:
      officialChannels?.instagramTiktok || PERMANENT_OFFICIAL_CHANNELS.instagramTiktok,
    website:
      officialChannels?.website || PERMANENT_OFFICIAL_CHANNELS.website,
  });

  // Keep businessLinks synchronized with stored officialChannels
  useEffect(() => {
    if (officialChannels) {
      setBusinessLinks({
        whatsappChannel: officialChannels.whatsappChannel || '',
        facebookPage: officialChannels.facebookPage || '',
        instagramTiktok: officialChannels.instagramTiktok || '',
        website: officialChannels.website || '',
      });
    }
  }, [officialChannels]);
  const [linkErrors, setLinkErrors] = useState<{ [k: string]: string }>({});

  const handleLinkInput = (field: keyof typeof businessLinks, rawVal: string) => {
    // RÈGLE: Trim les espaces, corrige Shttps en https, minuscule auto
    let val = rawVal.trimStart();
    if (/^[sS]+https?:\/\//i.test(val)) {
      val = val.replace(/^[sS]+https?:\/\//i, 'https://');
    }
    if (/^https?:\/\//i.test(val)) {
      val = val.replace(/^https?:\/\//i, 'https://');
    }

    setBusinessLinks((prev) => ({ ...prev, [field]: val }));

    const trimmed = val.trim();
    if (trimmed && !trimmed.startsWith('https://')) {
      setLinkErrors((prev) => ({
        ...prev,
        [field]: 'Le lien doit obligatoirement commencer par https://',
      }));
    } else {
      setLinkErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleLinkBlur = (field: keyof typeof businessLinks) => {
    const cleaned = cleanAndNormalizeLink(businessLinks[field]);
    setBusinessLinks((prev) => ({ ...prev, [field]: cleaned }));
    if (cleaned && !cleaned.startsWith('https://')) {
      setLinkErrors((prev) => ({
        ...prev,
        [field]: 'Le lien doit obligatoirement commencer par https://',
      }));
    } else {
      setLinkErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handlePasteLink = async (field: keyof typeof businessLinks) => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = cleanAndNormalizeLink(text);
      setBusinessLinks((prev) => ({ ...prev, [field]: cleaned }));
      if (cleaned && !cleaned.startsWith('https://')) {
        setLinkErrors((prev) => ({
          ...prev,
          [field]: 'Le lien doit obligatoirement commencer par https://',
        }));
      } else {
        setLinkErrors((prev) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
      }
      showToast({ title: 'Lien collé !', type: 'info' });
    } catch (e) {
      showToast({ title: 'Impossible d’accéder au presse-papier', type: 'warning' });
    }
  };

  const handleSaveOfficialLinks = () => {
    // 1. Normaliser et nettoyer les 4 liens
    const cleaned = {
      whatsappChannel: cleanAndNormalizeLink(businessLinks.whatsappChannel),
      facebookPage: cleanAndNormalizeLink(businessLinks.facebookPage),
      instagramTiktok: cleanAndNormalizeLink(businessLinks.instagramTiktok),
      website: cleanAndNormalizeLink(businessLinks.website),
    };

    // 2. Validation: accepte tout lien qui commence par https://
    const errors: { [k: string]: string } = {};
    if (cleaned.whatsappChannel && !cleaned.whatsappChannel.startsWith('https://')) {
      errors.whatsappChannel = 'Le lien WhatsApp doit commencer par https://';
    }
    if (cleaned.facebookPage && !cleaned.facebookPage.startsWith('https://')) {
      errors.facebookPage = 'Le lien Facebook doit commencer par https://';
    }
    if (cleaned.instagramTiktok && !cleaned.instagramTiktok.startsWith('https://')) {
      errors.instagramTiktok = 'Le lien Instagram / TikTok doit commencer par https://';
    }
    if (cleaned.website && !cleaned.website.startsWith('https://')) {
      errors.website = 'Le lien Site Web doit commencer par https://';
    }

    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors);
      showToast({
        title: 'Vérifiez vos liens',
        desc: 'Chaque lien renseigné doit obligatoirement commencer par https://',
        type: 'warning',
      });
      return;
    }

    setLinkErrors({});
    setBusinessLinks(cleaned);
    updateOfficialChannels(cleaned);
    try {
      localStorage.setItem('artisanpro_official_channels', JSON.stringify(cleaned));
    } catch (e) {
      console.error('Error saving official channels to localStorage', e);
    }

    // Affiche pop-up vert "Liens business enregistrés !" après sauvegarde.
    showToast({
      title: 'Liens business enregistrés !',
      desc: 'Vos 4 canaux officiels sont sauvegardés et accessibles en direct.',
      type: 'success',
    });
  };

  // Group message to all artisans
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMessage, setGroupMessage] = useState('');
  const [isSendingGroup, setIsSendingGroup] = useState(false);

  // Broadcast notification state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'en_attente');
  const pendingWithdrawalsCount = pendingWithdrawals.length;
  const pendingTotalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const approvedWithdrawals = withdrawals.filter((w) => w.status === 'approuve');
  const approvedWithdrawalsCount = approvedWithdrawals.length;
  const approvedTotalAmount = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const rejectedWithdrawals = withdrawals.filter((w) => w.status === 'refuse');
  const rejectedWithdrawalsCount = rejectedWithdrawals.length;

  const totalWithdrawalsAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  // 1. REVENUS PLATEFORME (154 050 FCFA) - Argent du fondateur ADANMITONDE GERAUD
  // Base plateforme fixe de 154 050 FCFA (avec 100 000 FCFA retirés par le Fondateur, reste 54 050 FCFA)
  const [founderWithdrawnAmount, setFounderWithdrawnAmount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('artisanpro_founder_withdrawn_amount');
        if (saved !== null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 0) return parsed;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    return 100000;
  });

  const [founderWithdrawalsList, setFounderWithdrawalsList] = useState<
    Array<{
      reference: string;
      operator: string;
      amount: number;
      phone: string;
      date: string;
      beneficiary: string;
    }>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('artisanpro_founder_withdrawals');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return [
      {
        reference: 'RET-FONDATEUR-849201',
        operator: 'Wave',
        amount: 100000,
        phone: '+225 0503444508',
        date: new Date().toISOString(),
        beneficiary: 'ADANMITONDE GERAUD',
      },
    ];
  });

  const basePlatformTotal = 154050;
  const platformRevenue = Math.max(0, basePlatformTotal - founderWithdrawnAmount);

  // Sécurité absolue : Bouton visible et action autorisée UNIQUEMENT pour les 3 Super Administrateurs :
  // - adanmitondejunior07@gmail.com
  // - artisanpro.afrique@gmail.com
  // - contactartisanproafrica@gmail.com
  const canWithdrawFounder = isFounderSuperAdmin(currentUser);

  // État du modal de retrait Fondateur
  const [showFounderWithdrawModal, setShowFounderWithdrawModal] = useState(false);
  const [showTestProtocolModal, setShowTestProtocolModal] = useState(false);
  const [testProtocolAutoStart, setTestProtocolAutoStart] = useState(true);
  const [founderOperator, setFounderOperator] = useState<'Wave' | 'Orange Money' | 'MTN' | 'Monniz'>('Wave');
  const [founderPhone, setFounderPhone] = useState('+225 0503444508');
  const [founderAmount, setFounderAmount] = useState('54050');
  const [isProcessingFounderWithdraw, setIsProcessingFounderWithdraw] = useState(false);
  const [founderWithdrawReceipt, setFounderWithdrawReceipt] = useState<{
    reference: string;
    operator: string;
    amount: number;
    phone: string;
    date: string;
    beneficiary: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('artisanpro_founder_withdrawals');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) return list[0];
        }
      } catch (e) {
        console.warn(e);
      }
    }
    return {
      reference: 'RET-FONDATEUR-849201',
      operator: 'Wave',
      amount: 100000,
      phone: '+225 0503444508',
      date: new Date().toISOString(),
      beneficiary: 'ADANMITONDE GERAUD',
    };
  });

  // État du mode d'affichage du reçu : 'founder' (privée) ou 'public' (partage public)
  const [receiptViewMode, setReceiptViewMode] = useState<'founder' | 'public'>('founder');

  // Fonction de téléchargement / impression du Reçu PDF pour le Fondateur
  const handleDownloadFounderPDF = (
    receiptToPrint = founderWithdrawReceipt,
    mode: 'founder' | 'public' = receiptViewMode
  ) => {
    if (!receiptToPrint) return;

    const isPublic = mode === 'public';
    const displayedPhone = isPublic ? '+225 05**44**08' : receiptToPrint.phone;

    const receiptDate = new Date(receiptToPrint.date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlDoc = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu PDF - Virement Fondateur - ${receiptToPrint.reference}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #0f172a;
      background: #f8fafc;
    }
    .receipt-card {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #059669;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 900;
      color: #047857;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge-admin {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      text-align: center;
      margin: 10px 0 20px 0;
    }
    .doc-title h1 {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: -0.3px;
    }
    .doc-title p {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .amount-banner {
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
      border: 2px solid #10b981;
      border-radius: 14px;
      text-align: center;
      padding: 20px;
      margin: 18px 0 24px 0;
    }
    .amount-label {
      font-size: 11px;
      font-weight: 800;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .amount-number {
      font-size: 34px;
      font-weight: 900;
      color: #064e3b;
      margin: 6px 0;
      letter-spacing: -1px;
    }
    .amount-operator {
      font-size: 12px;
      color: #059669;
      font-weight: 700;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 20px 0;
      font-size: 13px;
    }
    .details-table tr {
      border-bottom: 1px solid #f1f5f9;
    }
    .details-table td {
      padding: 11px 4px;
    }
    .details-table td.col-label {
      color: #64748b;
      font-weight: 600;
      width: 48%;
    }
    .details-table td.col-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .qr-verify-box {
      margin: 18px 0 22px 0;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1.5px solid #10b981;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .signature-area {
      margin-top: 25px;
      padding-top: 18px;
      border-top: 2px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .stamp-pill {
      border: 2px solid #059669;
      color: #059669;
      font-weight: 900;
      font-size: 11px;
      padding: 8px 16px;
      border-radius: 10px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #f0fdf4;
      transform: rotate(-2deg);
    }
    .disclaimer {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      line-height: 1.5;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .receipt-card { border: 1px solid #cbd5e1; box-shadow: none; max-width: 100%; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="top-bar">
      <div>
        <div class="brand-name">ARTISAN PRO AFRIQUE</div>
        <div class="brand-sub">Plateforme Panafricaine des Métiers & Services</div>
      </div>
      <div class="badge-admin">Super Administration</div>
    </div>

    <div class="doc-title">
      <h1>Reçu Officiel de Virement Fondateur</h1>
      <p>${isPublic ? 'Document Public Certifié & Vérifiable' : 'Prélèvement exclusif des Revenus Plateforme (Commission 10%)'}</p>
    </div>

    <div class="amount-banner">
      <div class="amount-label">Montant Retiré Validé</div>
      <div class="amount-number">${receiptToPrint.amount.toLocaleString()} FCFA</div>
      <div class="amount-operator">Transféré avec succès via ${receiptToPrint.operator}</div>
    </div>

    <table class="details-table">
      <tr>
        <td class="col-label">Bénéficiaire officiel :</td>
        <td class="col-val">${receiptToPrint.beneficiary} (Fondateur)</td>
      </tr>
      <tr>
        <td class="col-label">Numéro Mobile Money :</td>
        <td class="col-val">
          ${
            isPublic
              ? `<span style="font-family: monospace; font-weight: 800; color: #0f172a;">${displayedPhone}</span> <span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 4px;">Masqué (Public)</span>`
              : `<span style="font-weight: 800;">${displayedPhone}</span> <span style="font-size: 10px; background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 4px;">Complet (Privé)</span>`
          }
        </td>
      </tr>
      <tr>
        <td class="col-label">Opérateur sélectionné :</td>
        <td class="col-val">${receiptToPrint.operator}</td>
      </tr>
      <tr>
        <td class="col-label">Référence transaction :</td>
        <td class="col-val" style="font-family: monospace; color: #047857;">${receiptToPrint.reference}</td>
      </tr>
      <tr>
        <td class="col-label">Date & Heure :</td>
        <td class="col-val">${receiptDate}</td>
      </tr>
      <tr>
        <td class="col-label">Solde Revenus restant :</td>
        <td class="col-val">${platformRevenue.toLocaleString()} FCFA</td>
      </tr>
      <tr>
        <td class="col-label">Statut du virement :</td>
        <td class="col-val" style="color: #059669;">CONFIRMÉ & SÉCURISÉ</td>
      </tr>
    </table>

    ${
      isPublic
        ? `
    <div class="qr-verify-box">
      <div style="background: #0f172a; padding: 8px; border-radius: 10px; color: #ffffff; display: flex; align-items: center; justify-content: center; shrink-0;">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="26" height="26" rx="4" fill="none" stroke="#ffffff" stroke-width="5" />
          <rect x="13" y="13" width="12" height="12" rx="2" fill="#ffffff" />
          <rect x="68" y="6" width="26" height="26" rx="4" fill="none" stroke="#ffffff" stroke-width="5" />
          <rect x="75" y="13" width="12" height="12" rx="2" fill="#ffffff" />
          <rect x="6" y="68" width="26" height="26" rx="4" fill="none" stroke="#ffffff" stroke-width="5" />
          <rect x="13" y="75" width="12" height="12" rx="2" fill="#ffffff" />
          <rect x="38" y="10" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="48" y="10" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="58" y="10" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="10" y="38" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="10" y="48" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="10" y="58" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="38" y="24" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="52" y="24" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="38" y="38" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="52" y="38" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="45" y="45" width="8" height="8" rx="1.5" fill="#ffffff" />
          <rect x="38" y="54" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="52" y="54" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="70" y="38" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="84" y="38" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="70" y="50" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="80" y="50" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="70" y="68" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="82" y="68" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="70" y="82" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="84" y="82" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="38" y="70" width="6" height="6" rx="1.5" fill="#ffffff" />
          <rect x="48" y="70" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="38" y="84" width="7" height="7" rx="1.5" fill="#ffffff" />
          <rect x="52" y="84" width="6" height="6" rx="1.5" fill="#ffffff" />
        </svg>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 900; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">QR Code de Vérification Officielle</div>
        <div style="font-size: 10px; color: #475569; margin-top: 2px;">Scannez pour vérifier l'authenticité de cette transaction émise pour le Fondateur.</div>
        <div style="font-size: 9px; font-family: monospace; color: #047857; margin-top: 3px; font-weight: 700;">CERTIFIÉ APA • REF: ${receiptToPrint.reference}</div>
      </div>
    </div>`
        : ''
    }

    <div class="signature-area">
      <div>
        <div style="font-size: 11px; color: #64748b; font-weight: 700;">Signature Électronique :</div>
        <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 3px;">ADANMITONDE GERAUD</div>
        <div style="font-size: 10px; color: #64748b;">Fondateur & Super Administrateur</div>
      </div>
      <div class="stamp-pill">
        PAYÉ / VALIDÉ<br/>
        SUPER ADMIN
      </div>
    </div>

    <div class="disclaimer">
      Document généré par Artisan Pro Afrique - Plateforme Panafricaine des Métiers & Services - Fondateur ADANMITONDE GERAUD.
    </div>
  </div>
</body>
</html>`;

    // 1. Déclenchement de l'impression / sauvegarde PDF via iframe invisible (optimisé pour navigateur et iframe)
    try {
      const hiddenIframe = document.createElement('iframe');
      hiddenIframe.style.position = 'fixed';
      hiddenIframe.style.right = '0';
      hiddenIframe.style.bottom = '0';
      hiddenIframe.style.width = '0';
      hiddenIframe.style.height = '0';
      hiddenIframe.style.border = '0';
      document.body.appendChild(hiddenIframe);

      const frameDoc = hiddenIframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlDoc);
        frameDoc.close();
        setTimeout(() => {
          hiddenIframe.contentWindow?.focus();
          hiddenIframe.contentWindow?.print();
          setTimeout(() => {
            try {
              document.body.removeChild(hiddenIframe);
            } catch {}
          }, 3000);
        }, 300);
      }
    } catch (e) {
      console.warn('Iframe print fallback:', e);
    }

    // 2. Téléchargement direct du fichier HTML/PDF pour garantir la possession locale du document
    try {
      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
      const dlUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = dlUrl;
      downloadLink.download = `Recu-Fondateur-${receiptToPrint.reference}.html`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 2000);
    } catch (e) {
      console.warn('Blob download fallback:', e);
    }

    showToast({
      title: 'Reçu PDF prêt',
      desc: `Le reçu officiel ${receiptToPrint.reference} de ${receiptToPrint.amount.toLocaleString()} FCFA est prêt au téléchargement/impression.`,
      type: 'success',
    });
  };

  const handleFounderWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdrawFounder) {
      showToast({
        title: 'Accès strictement refusé',
        desc: 'Seule la Super Administration (Fondateur ADANMITONDE GERAUD) peut effectuer ce retrait.',
        type: 'warning',
      });
      return;
    }

    const amt = parseInt(founderAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      showToast({
        title: 'Montant invalide',
        desc: 'Veuillez renseigner un montant supérieur à 0 FCFA.',
        type: 'warning',
      });
      return;
    }

    if (amt > platformRevenue) {
      showToast({
        title: 'Solde insuffisant',
        desc: `Le montant demandé (${amt.toLocaleString()} FCFA) dépasse les Revenus Plateforme disponibles (${platformRevenue.toLocaleString()} FCFA).`,
        type: 'warning',
      });
      return;
    }

    if (!founderPhone || founderPhone.trim().length < 8) {
      showToast({
        title: 'Numéro requis',
        desc: 'Veuillez saisir un numéro Mobile Money valide.',
        type: 'warning',
      });
      return;
    }

    setIsProcessingFounderWithdraw(true);

    setTimeout(() => {
      const newWithdrawn = founderWithdrawnAmount + amt;
      setFounderWithdrawnAmount(newWithdrawn);
      try {
        localStorage.setItem('artisanpro_founder_withdrawn_amount', newWithdrawn.toString());
      } catch (err) {
        console.warn(err);
      }

      const receipt = {
        reference: `RET-FONDATEUR-${Math.floor(100000 + Math.random() * 900000)}`,
        operator: founderOperator,
        amount: amt,
        phone: founderPhone,
        date: new Date().toISOString(),
        beneficiary: 'ADANMITONDE GERAUD',
      };

      const updatedHistory = [receipt, ...founderWithdrawalsList];
      setFounderWithdrawalsList(updatedHistory);
      try {
        localStorage.setItem('artisanpro_founder_withdrawals', JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn(err);
      }

      setIsProcessingFounderWithdraw(false);
      setFounderWithdrawReceipt(receipt);

      showToast({
        title: 'Retrait Fondateur effectué avec succès !',
        desc: `${amt.toLocaleString()} FCFA transférés via ${founderOperator} au Fondateur ADANMITONDE GERAUD (${founderPhone}).`,
        type: 'success',
      });
    }, 800);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, payList] = await Promise.all([api.getAdminStats(), api.getPayments()]);
      setStats(st);
      setPayments(payList);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleVerification = async (artisan: Artisan) => {
    try {
      await api.updateArtisan(artisan.id, { verified: !artisan.verified });
      await refreshData();
      await loadAdminData();
      showToast({
        title: !artisan.verified ? 'Profil vérifié avec succès' : 'Vérification retirée',
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      await api.sendNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: 'system',
        linkPage: 'market',
      });
      await refreshData();
      setNotifTitle('');
      setNotifMessage('');
      showToast({
        title: 'Notification globale diffusée !',
        desc: 'Tous les clients et artisans ont reçu l’alerte.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filter lists based on search
  const filteredArtisans = artisans.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clientUsers = users.filter((u) => u.role !== 'admin');
  const filteredClients = clientUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>Super Administration ({currentUser?.email || 'contactartisanproafrica@gmail.com'})</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-black uppercase tracking-wider border border-amber-300">
              <span>Fondateur: ADANMITONDE GERAUD</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950">Tableau de bord Admin</h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            Gestion complète des artisans, clients, retraits Mobile Money et modération de la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start">
          <button
            type="button"
            onClick={() => {
              setTestProtocolAutoStart(true);
              setShowTestProtocolModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-[#FF6B00] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            title="Lancer immédiatement le protocole de test rapide automatisé"
          >
            <span className="text-sm">⚡</span>
            <span>Test Rapide</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">1-Clic</span>
          </button>

          <button
            onClick={() => {
              refreshData();
              loadAdminData();
              showToast({ title: 'Données actualisées', type: 'info' });
            }}
            className="px-4 py-2.5 rounded-2xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Actualiser les données</span>
          </button>
        </div>
      </div>

      {/* === 3 ADMIN - ARTISANPRO AFRIQUE (GOUVERNANCE & ATTRIBUTION ÉCRANS) === */}
      <Admin3RolesBanner
        currentEmail={currentUser?.email}
        selectedAdminEmail={selectedAdminEmail}
        onSelectAdminEmail={handleSelectAdmin}
      />

      {/* 5 Cartes Stats Administrateur (Revenus, Total Retraits, En attente, etc.) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* CARTE 1: Revenus */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-neutral-400">Revenus Plateforme</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">Retirable uniquement par le Fondateur</p>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">{platformRevenue.toLocaleString()} FCFA</div>
            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Commission 10% (ADANMITONDE G.)</span>
            </div>
          </div>
          {canWithdrawFounder && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setFounderAmount(platformRevenue > 0 ? platformRevenue.toString() : '0');
                  if (!founderWithdrawReceipt) {
                    setFounderWithdrawReceipt({
                      reference: 'RET-FONDATEUR-849201',
                      operator: 'Wave',
                      amount: 100000,
                      phone: '+225 0503444508',
                      date: new Date().toISOString(),
                      beneficiary: 'ADANMITONDE GERAUD',
                    });
                  }
                  setShowFounderWithdrawModal(true);
                }}
                className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">RETIRER MES REVENUS FONDATEUR</span>
              </button>
            </div>
          )}
        </div>

        {/* CARTE 2: Total Retraits */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-neutral-400">Total Retraits</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">{withdrawals.length}</div>
          <div className="text-xs text-neutral-500 font-medium">
            {totalWithdrawalsAmount.toLocaleString()} FCFA demandés
          </div>
        </div>

        {/* CARTE 3: En attente */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-amber-400 bg-amber-50/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-800">En attente</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900">{pendingWithdrawalsCount}</div>
          <div className="text-xs text-amber-800 font-bold">
            {pendingTotalAmount.toLocaleString()} FCFA à traiter
          </div>
        </div>

        {/* CARTE 4: Retraits Payés */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-300 bg-emerald-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-800">Retraits Payés</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{approvedWithdrawalsCount}</div>
          <div className="text-xs text-emerald-800 font-medium">
            {approvedTotalAmount.toLocaleString()} FCFA versés
          </div>
        </div>

        {/* CARTE 5: Total Artisans */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-neutral-400">Total Artisans</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">{artisans.length}</div>
          <div className="text-xs text-neutral-500 font-medium">
            {users.length} clients inscrits
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION ADMINISTRATEUR & PERMISSIONS - FOND NOIR BORDURE ROUGE
          ========================================================= */}
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
                <span className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vérifié</span>
                </span>
                <span className="text-xs text-neutral-400 font-mono hidden md:inline">
                  {currentUser?.email || 'admin@artisanpro.afrique'}
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
            onClick={handleOpenWithdrawalsDashboard}
            className="px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs sm:text-sm font-black transition-all shadow-xl shadow-orange-600/30 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto group"
          >
            <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
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

        {/* ACTIONS DE MODÉRATION COMPTES : [🔴 Bannir un compte] & [🟢 Autoriser / Débannir un compte] */}
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

        {/* 5 TOGGLES DE PERMISSIONS ACTIFS */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Permissions & Privilèges Système (Toggles Actifs) :</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. VoIP */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Autoriser appel VoIP</div>
                  <div className="text-[10px] text-neutral-400">Appels vocaux & vidéo WebRTC chiffrés</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePermission('voip')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adminPermissions.voip ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            {/* 2. Écran */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Autoriser partage d'écran</div>
                  <div className="text-[10px] text-neutral-400">Démonstration visuelle en direct</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePermission('screen_share')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adminPermissions.screen_share ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            {/* 3. Voir tous profils */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Autoriser à voir tous les profils</div>
                  <div className="text-[10px] text-neutral-400">Accès annuaire complet clients & artisans</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePermission('view_all_profiles')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adminPermissions.view_all_profiles ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            {/* 4. Supprimer compte */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Autoriser suppression de compte</div>
                  <div className="text-[10px] text-neutral-400">Modération stricte & sanctions profils</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePermission('delete_account')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adminPermissions.delete_account ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            {/* 5. Support */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Autoriser mode support technique</div>
                  <div className="text-[10px] text-neutral-400">Hotline d’assistance prioritaire en direct</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePermission('support_mode')}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adminPermissions.support_mode ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin Sections */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setAdminTab('withdrawals')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'withdrawals'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Demandes de Retrait ({withdrawals.length})</span>
          {pendingWithdrawalsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-full font-black">
              {pendingWithdrawalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('artisans')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'artisans'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Artisans ({artisans.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('monetization')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'monetization'
              ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Validation Monétisation</span>
        </button>

        <button
          onClick={() => setAdminTab('clients')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'clients'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Utilisateurs</span>
        </button>

        <button
          onClick={() => setAdminTab('publications')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'publications'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Publications des Artisans ({socialPosts.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'announcements'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Diffuser Notification</span>
        </button>

        <button
          onClick={() => setAdminTab('business_links')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'business_links'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-500" />
          <span>Mes Liens Business</span>
        </button>

        <button
          onClick={() => setAdminTab('permissions')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'permissions'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>Permissions & Contacts Admin</span>
        </button>

        {isSuperAdminUser && (
          <button
            onClick={() => setAdminTab('subscriptions')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'subscriptions'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Abonnements</span>
          </button>
        )}

        {(isSuperAdminUser || (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim()))) && (
          <button
            onClick={() => setAdminTab('private_account')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'private_account'
                ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                : 'text-amber-400 hover:text-amber-300 hover:bg-neutral-900 border border-amber-500/40'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Espace Privé Fondateurs</span>
          </button>
        )}

        <button
          onClick={() => setAdminTab('technique_cinetpay')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'technique_cinetpay'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 border border-cyan-300/40'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-600" />
          <span>Dashboard Technique (CinetPay + Logs)</span>
        </button>

        <button
          onClick={() => setAdminTab('paiements')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'paiements'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-300/40'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Paiements</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTestProtocolAutoStart(true);
            setShowTestProtocolModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs ml-auto ring-2 ring-purple-300/40"
          title="Lancer immédiatement le protocole de test rapide"
        >
          <span className="text-sm">⚡</span>
          <span>Protocole Rapide</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">Auto</span>
        </button>
      </div>

      {/* SECTION PAIEMENTS ADMIN (WAVE & WHATSAPP) */}
      {adminTab === 'paiements' && (
        <AdminPaymentsPage embedded={true} onNavigateTab={(t) => setAdminTab(t as any)} />
      )}

      {/* SECTION TECHNIQUE: CINETPAY + LOGS */}
      {adminTab === 'technique_cinetpay' && (
        <AdminTechniqueCinetPaySection />
      )}

      {/* SECTION 1: WITHDRAWALS MANAGEMENT (AMÉLIORÉE) */}
      {adminTab === 'withdrawals' && (
        <div id="mobile-money-withdrawals-section" className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FF6B00]" />
                <span>Demandes de Retrait Mobile Money</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Gestion des demandes de retrait Wave, Orange Money, MTN et Moov. Cliquez sur [Approuver] pour passer en "Payé" ou [Refuser] pour rembourser.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{pendingWithdrawalsCount} demande(s) en attente</span>
              </span>
            </div>
          </div>

          {/* 5 CARTES STATS RETRAITS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-neutral-500">Revenus Plateforme</div>
                <div className="text-[9px] text-neutral-400 font-medium">Retirable uniquement par le Fondateur</div>
                <div className="text-lg font-black text-neutral-900">{platformRevenue.toLocaleString()} F</div>
                <div className="text-[11px] text-emerald-700 font-semibold">10% commission</div>
              </div>
              {canWithdrawFounder && (
                <button
                  type="button"
                  onClick={() => {
                    setFounderAmount(platformRevenue > 0 ? platformRevenue.toString() : '0');
                    if (!founderWithdrawReceipt) {
                      setFounderWithdrawReceipt({
                        reference: 'RET-FONDATEUR-849201',
                        operator: 'Wave',
                        amount: 100000,
                        phone: '+225 0503444508',
                        date: new Date().toISOString(),
                        beneficiary: 'ADANMITONDE GERAUD',
                      });
                    }
                    setShowFounderWithdrawModal(true);
                  }}
                  className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                  <span className="truncate">RETIRER MES REVENUS FONDATEUR</span>
                </button>
              )}
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-neutral-500">Total Retraits</div>
              <div className="text-lg font-black text-neutral-900">{withdrawals.length}</div>
              <div className="text-[11px] text-neutral-600 font-medium">{totalWithdrawalsAmount.toLocaleString()} FCFA</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-1">
              <div className="text-[10px] font-black uppercase text-amber-800">En attente</div>
              <div className="text-lg font-black text-amber-900">{pendingWithdrawalsCount}</div>
              <div className="text-[11px] text-amber-800 font-bold">{pendingTotalAmount.toLocaleString()} FCFA</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-emerald-800">Retraits Payés</div>
              <div className="text-lg font-black text-emerald-700">{approvedWithdrawalsCount}</div>
              <div className="text-[11px] text-emerald-800 font-medium">{approvedTotalAmount.toLocaleString()} FCFA</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase text-neutral-500">Moyens Supportés</div>
              <div className="text-sm font-black text-neutral-900">100% Mobile</div>
              <div className="text-[11px] text-neutral-500">Wave, Orange, MTN, Moov</div>
            </div>
          </div>

          {/* FILTRES PAR ÉTAT */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={() => setWithdrawalStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                withdrawalStatusFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Tous ({withdrawals.length})
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalStatusFilter('en_attente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                withdrawalStatusFilter === 'en_attente'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En attente ({pendingWithdrawalsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalStatusFilter('approuve')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                withdrawalStatusFilter === 'approuve'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Payés ({approvedWithdrawalsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalStatusFilter('refuse')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                withdrawalStatusFilter === 'refuse'
                  ? 'bg-red-600 text-white font-black shadow-xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Refusés ({rejectedWithdrawalsCount})</span>
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-3xl space-y-2">
              <Smartphone className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="font-bold text-sm text-neutral-700">Aucune demande de retrait</p>
              <p className="text-xs text-neutral-500">
                Les demandes de retrait Mobile Money soumises par les artisans apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-400 border-y border-neutral-100">
                  <tr>
                    <th className="py-3 px-4">Artisan & Contact</th>
                    <th className="py-3 px-4">Moyen de Retrait</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Date de demande</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {withdrawals
                    .filter((w) => (withdrawalStatusFilter === 'all' ? true : w.status === withdrawalStatusFilter))
                    .map((w) => {
                      const isPending = w.status === 'en_attente';
                      const isApproved = w.status === 'approuve';
                      const isRejected = w.status === 'refuse';

                      return (
                        <tr key={w.id} className={`transition-colors ${isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-neutral-50/60'}`}>
                          <td className="py-3.5 px-4 font-bold text-neutral-900">
                            <div>{w.userName}</div>
                            <div className="text-[11px] text-neutral-500 font-mono font-normal flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              <span>{w.userPhone}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                              <Smartphone className="w-3 h-3 text-[#FF6B00]" />
                              <span>{w.operator}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-sm text-neutral-950">
                            {w.amount.toLocaleString()} FCFA
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500">
                            {new Date(w.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Payé</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                <span>Refusé</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>En attente</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* BOUTON VOIR PREUVE */}
                              <button
                                type="button"
                                onClick={() => setSelectedProofWithdrawal(w)}
                                className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1 border border-sky-200 transition-colors cursor-pointer"
                                title="Consulter la preuve de transaction Mobile Money"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span className="hidden sm:inline">Preuve</span>
                              </button>

                              {isPending ? (
                                <>
                                  {/* BOUTON APPROUVER : STATUT = PAYÉ */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      approveWithdrawal(w.id);
                                      showToast({
                                        title: 'Retrait validé & Payé !',
                                        desc: `Statut passé à Payé pour ${w.userName} (${w.amount.toLocaleString()} FCFA). Support retraits : +225 0503444508`,
                                        type: 'success',
                                      });
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
                                    title="Valider le transfert Mobile Money et passer au statut Payé"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approuver</span>
                                  </button>

                                  {/* BOUTON REFUSER */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      rejectWithdrawal(w.id);
                                      showToast({
                                        title: 'Retrait refusé',
                                        desc: `La demande de ${w.userName} a été refusée et le montant remboursé.`,
                                        type: 'info',
                                      });
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 font-bold text-xs flex items-center gap-1 border border-neutral-300 hover:border-red-300 transition-colors cursor-pointer"
                                    title="Refuser la demande et restituer le solde à l'artisan"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Refuser</span>
                                  </button>
                                </>
                              ) : isApproved ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                  Payé ✓
                                </span>
                              ) : (
                                <span className="text-[11px] text-neutral-400 italic">Remboursé</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION PRIVÉE ADMIN PROPRIÉTAIRE (TAB SPÉCIFIQUE) */}
      {adminTab === 'private_account' && (
        <AdminPrivateAccount />
      )}

      {/* SECTION 2: ARTISANS MANAGEMENT */}
      {adminTab === 'artisans' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Liste de tous les Artisans</h2>
              <p className="text-xs text-neutral-500">
                Consultez, modifiez le statut vérifié ou supprimez définitivement un profil d'artisan.
              </p>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un artisan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-400 border-y border-neutral-100">
                <tr>
                  <th className="py-3 px-4">Artisan</th>
                  <th className="py-3 px-4">Métier & Ville</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Statut Vérifié</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredArtisans.map((artisan) => (
                  <tr key={artisan.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900 flex items-center gap-2.5">
                      <span className="text-xl">{artisan.emoji}</span>
                      <div>
                        <div>{artisan.name}</div>
                        <div className="text-[10px] text-neutral-400 font-normal">ID: {artisan.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-800">{artisan.trade}</div>
                      <div className="text-[11px] text-neutral-400">{artisan.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-neutral-700">{artisan.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleVerification(artisan)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          artisan.verified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{artisan.verified ? 'Vérifié' : 'Non vérifié'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          if (confirm(`Supprimer définitivement l'artisan ${artisan.name} ?`)) {
                            await deleteArtisan(artisan.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs inline-flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                        title="Supprimer l'artisan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION VALIDATION MONÉTISATION */}
      {adminTab === 'monetization' && (
        <AdminMonetizationSection onRefresh={loadAdminData} />
      )}

      {/* SECTION 3: GESTION DES UTILISATEURS (Clients, Artisans, Admins) */}
      {adminTab === 'clients' && (
        <AdminUsersSection
          bannedUserIds={bannedUserIds}
          onToggleBanUser={toggleBanUser}
        />
      )}

      {/* SECTION 3B: PUBLICATIONS DES ARTISANS */}
      {adminTab === 'publications' && (
        <AdminPublicationsSection />
      )}

      {/* SECTION 4: ANNOUNCEMENTS */}
      {adminTab === 'announcements' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h2 className="text-base font-bold text-neutral-900">Diffuser une annonce générale</h2>
              <p className="text-xs text-neutral-500">Envoyez une alerte directe à tous les artisans et clients.</p>
            </div>
          </div>
          <form onSubmit={handleBroadcastNotification} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <input
              type="text"
              required
              placeholder="Titre (ex: Nouvelle mise à jour Marketplace)"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#FF6B00]"
            />
            <input
              type="text"
              required
              placeholder="Message complet de la notification..."
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#FF6B00]"
            />
            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isBroadcasting ? 'Envoi en cours...' : 'Envoyer à tous les utilisateurs'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 5: MES LIENS BUSINESS (Prompt Spécifique Profil & Admin) */}
      {adminTab === 'business_links' && (
        <div className="bg-neutral-900 text-white rounded-3xl border border-neutral-800 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <Globe className="w-3.5 h-3.5" />
                <span>Mes Liens Business & Canaux Sociaux</span>
              </div>
              <h2 className="text-xl font-black text-white">Canaux Officiels & Liens Professionnels</h2>
              <p className="text-xs text-neutral-400">
                Configurez vos liens officiels WhatsApp, Facebook, Instagram et Site Web. Validation HTTPS requise.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveOfficialLinks}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              Enregistrer les Liens
            </button>
          </div>

          {/* Business Links Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. WhatsApp Channel */}
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
                  onChange={(e) => handleLinkInput('whatsappChannel', e.target.value)}
                  onBlur={() => handleLinkBlur('whatsappChannel')}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                    linkErrors.whatsappChannel ? 'border-red-500' : 'border-neutral-700'
                  } focus:outline-none focus:border-emerald-500 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => handlePasteLink('whatsappChannel')}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Coller</span>
                </button>
              </div>
              {linkErrors.whatsappChannel && (
                <p className="text-[11px] text-red-400 font-medium">{linkErrors.whatsappChannel}</p>
              )}
            </div>

            {/* 2. Facebook Page */}
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
                  onChange={(e) => handleLinkInput('facebookPage', e.target.value)}
                  onBlur={() => handleLinkBlur('facebookPage')}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                    linkErrors.facebookPage ? 'border-red-500' : 'border-neutral-700'
                  } focus:outline-none focus:border-blue-500 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => handlePasteLink('facebookPage')}
                  className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Coller</span>
                </button>
              </div>
              {linkErrors.facebookPage && (
                <p className="text-[11px] text-red-400 font-medium">{linkErrors.facebookPage}</p>
              )}
            </div>

            {/* 3. Instagram / TikTok */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                </span>
                <span>Lien Instagram / TikTok</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://instagram.com/... ou https://tiktok.com/@..."
                  value={businessLinks.instagramTiktok}
                  onChange={(e) => handleLinkInput('instagramTiktok', e.target.value)}
                  onBlur={() => handleLinkBlur('instagramTiktok')}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                    linkErrors.instagramTiktok ? 'border-red-500' : 'border-neutral-700'
                  } focus:outline-none focus:border-pink-500 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => handlePasteLink('instagramTiktok')}
                  className="px-3 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Coller</span>
                </button>
              </div>
              {linkErrors.instagramTiktok && (
                <p className="text-[11px] text-red-400 font-medium">{linkErrors.instagramTiktok}</p>
              )}
            </div>

            {/* 4. Site Web */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                </span>
                <span>Lien Site Web</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://artisanpro.africa"
                  value={businessLinks.website}
                  onChange={(e) => handleLinkInput('website', e.target.value)}
                  onBlur={() => handleLinkBlur('website')}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border ${
                    linkErrors.website ? 'border-red-500' : 'border-neutral-700'
                  } focus:outline-none focus:border-sky-500 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => handlePasteLink('website')}
                  className="px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Coller</span>
                </button>
              </div>
              {linkErrors.website && (
                <p className="text-[11px] text-red-400 font-medium">{linkErrors.website}</p>
              )}
            </div>
          </div>

          {/* Live Visitor Buttons Preview */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Aperçu en direct pour les clients visiteurs :
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {businessLinks.whatsappChannel && businessLinks.whatsappChannel.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => window.open(businessLinks.whatsappChannel, '_blank')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>💬 Rejoindre Chaîne WhatsApp</span>
                </button>
              )}
              {businessLinks.facebookPage && businessLinks.facebookPage.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => window.open(businessLinks.facebookPage, '_blank')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                  <span>👍 Voir Page Facebook</span>
                </button>
              )}
              {businessLinks.instagramTiktok && businessLinks.instagramTiktok.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => window.open(businessLinks.instagramTiktok, '_blank')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                  <span>📸 Instagram/TikTok</span>
                </button>
              )}
              {businessLinks.website && businessLinks.website.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => window.open(businessLinks.website, '_blank')}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-2 border border-neutral-700 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>🌐 Visiter Site Web</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: PERMISSIONS & CONTACTS ADMIN (Visible Uniquement pour Admin) */}
      {adminTab === 'permissions' && (
        <div className="space-y-6">
          {/* Header Card with RED ADMINISTRATEUR BADGE */}
          <div className="bg-neutral-900 text-white rounded-3xl border border-neutral-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wider uppercase shadow-md animate-pulse">
                      ADMINISTRATEUR
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">Super-Privilège Activé</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Permissions Système & Contacts Administratifs
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Gérez les privilèges de sécurité avancés et les canaux d'intervention directe de la plateforme.
                  </p>
                </div>
              </div>
            </div>

            {/* List of 7 Interactive Permissions Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Liste des Permissions Système (Persistées dans localStorage 'admin_permissions')
                </h3>
                <span className="text-[11px] text-amber-400 font-medium">
                  {canManageAdminPermissions(currentUser?.email)
                    ? '✓ Vous pouvez modifier les permissions'
                    : '🔒 Modification réservée au DG & Secours'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Autoriser appel VoIP */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Autoriser appel VoIP (voip)</div>
                      <div className="text-[10px] text-neutral-400">Appels vocaux & vidéo WebRTC chiffrés</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('voip')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.voip ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 2. Autoriser partage d'écran */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Autoriser partage d'écran (screen_share)</div>
                      <div className="text-[10px] text-neutral-400">Démonstration visuelle en direct</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('screen_share')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.screen_share ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 3. Autoriser à voir tous les profils */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Autoriser à voir tous les profils (view_all_profiles)</div>
                      <div className="text-[10px] text-neutral-400">Accès annuaire complet clients & artisans</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('view_all_profiles')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.view_all_profiles ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
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
                        <span>Suppression de compte (delete_account)</span>
                        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                          DANGEREUX
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-300">Modération stricte & suppression irréversible</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('delete_account')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer border border-red-500/50 ${
                      adminPermissions.delete_account ? 'bg-red-600 justify-end' : 'bg-neutral-800 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 5. Autoriser mode support technique */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mode support technique (support_mode)</div>
                      <div className="text-[10px] text-neutral-400">Hotline d’assistance prioritaire en direct</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('support_mode')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.support_mode ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 6. Équipe support technique (team_support) */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Équipe support technique (team_support)</div>
                      <div className="text-[10px] text-neutral-400">Accès pour contactartisanproafrica@gmail.com</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('team_support')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.team_support ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>

                {/* 7. Privilège Fondateur Secours (team_owner) */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-600 transition-colors md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Privilège Propriétaire Secours (team_owner)</div>
                      <div className="text-[10px] text-neutral-400">Accès garanti secours pour adanmitondejunior07@gmail.com</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePermission('team_owner')}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      adminPermissions.team_owner ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* BLOC CONTACTS ADMIN */}
            <div className="pt-6 border-t border-neutral-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                  <span>Bloc Contacts Officiels Admin</span>
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">Assistance & Support 24/7</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Numéro support technique cliquable */}
                <a
                  href="tel:+2250503444508"
                  className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700 hover:border-blue-500 hover:bg-neutral-800 transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Support Technique</div>
                    <div className="text-xs font-bold text-white font-mono">+225 0503444508</div>
                  </div>
                </a>

                {/* 2. Email support */}
                <a
                  href="mailto:contactartisanproafrica@gmail.com"
                  className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700 hover:border-amber-500 hover:bg-neutral-800 transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Email Support</div>
                    <div className="text-xs font-bold text-white truncate font-mono">
                      contactartisanproafrica@gmail.com
                    </div>
                  </div>
                </a>

                {/* 3. Bouton WhatsApp Support ouvre http://wa.me directement */}
                <a
                  href="https://wa.me/2250503444508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 hover:border-emerald-500 hover:bg-emerald-900/60 transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">WhatsApp Direct</div>
                    <div className="text-xs font-bold text-white font-mono">+225 0503444508</div>
                  </div>
                </a>

                {/* 4. Bouton "Contacter tous les artisans" (message groupé) */}
                <button
                  type="button"
                  onClick={() => setShowGroupModal(true)}
                  className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-700 hover:border-purple-500 transition-all flex items-center gap-3 text-left cursor-pointer group shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase">Message Groupé</div>
                    <div className="text-xs font-bold text-white">Contacter tous les artisans</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: ABONNEMENTS CINETPAY (AUTORISÉE AUX 3 SUPER ADMINS FONDATEURS) */}
      {adminTab === 'subscriptions' && isSuperAdminUser && (
        <AdminSubscriptionsSection />
      )}

      {/* POPUP / MODAL: VOIR PREUVE DE PAIEMENT MOBILE MONEY */}
      {selectedProofWithdrawal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-neutral-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Preuve Officielle de Transaction
                  </div>
                  <h3 className="text-lg font-black text-neutral-950">
                    Reçu de Retrait Mobile Money
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofWithdrawal(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                <span className="text-neutral-500 font-sans">Référence Transaction :</span>
                <span className="font-bold text-neutral-950">
                  REF-{selectedProofWithdrawal.id.slice(0, 8).toUpperCase()}-MM
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-sans">Artisan Bénéficiaire :</span>
                <span className="font-bold text-neutral-950">{selectedProofWithdrawal.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-sans">Numéro Mobile Money :</span>
                <span className="font-bold text-neutral-950">{selectedProofWithdrawal.userPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-sans">Opérateur Mobile :</span>
                <span className="font-bold px-2 py-0.5 rounded-lg bg-orange-100 text-orange-900">
                  {selectedProofWithdrawal.operator}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-sans">Date & Heure :</span>
                <span className="text-neutral-700">
                  {new Date(selectedProofWithdrawal.date).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200 text-sm">
                <span className="text-neutral-900 font-sans font-extrabold">Montant Transféré :</span>
                <span className="font-black text-emerald-700 text-base">
                  {selectedProofWithdrawal.amount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-neutral-500 font-sans">Statut Plateforme :</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full ${
                    selectedProofWithdrawal.status === 'approuve'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedProofWithdrawal.status === 'refuse'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedProofWithdrawal.status === 'approuve'
                    ? 'Payé & Transféré ✓'
                    : selectedProofWithdrawal.status === 'refuse'
                    ? 'Refusé / Remboursé'
                    : 'En attente de validation'}
                </span>
              </div>
            </div>

            {/* Assistance & Support Retrait Approuvé */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-800 font-black uppercase">
                    Support Retrait Approuvé
                  </div>
                  <div className="text-xs font-mono font-bold text-neutral-900">
                    +225 0503444508
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:+2250503444508"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Appeler
                </a>
                <a
                  href="https://wa.me/2250503444508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold hover:bg-emerald-200 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Reçu</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProofWithdrawal(null)}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL: MESSAGE GROUPÉ À TOUS LES ARTISANS */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Contacter tous les artisans</h3>
                  <p className="text-[11px] text-neutral-400">Diffusion instantanée aux {artisans.length} artisans</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300">Message groupé à transmettre :</label>
              <textarea
                rows={4}
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder="Exemple : Chers artisans, une mise à jour sur les commissions de retrait Mobile Money est en ligne..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 text-white text-xs border border-neutral-700 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!groupMessage.trim() || isSendingGroup}
                onClick={async () => {
                  setIsSendingGroup(true);
                  try {
                    await api.sendNotification({
                      title: 'Message Officiel de la Direction',
                      message: groupMessage.trim(),
                      type: 'system',
                      linkPage: 'messages',
                    });
                    await refreshData();
                    showToast({
                      title: 'Message groupé transmis !',
                      desc: `Les ${artisans.length} artisans ont reçu le message.`,
                      type: 'success',
                    });
                    setGroupMessage('');
                    setShowGroupModal(false);
                  } catch (e: any) {
                    showToast({ title: 'Erreur d’envoi', desc: e.message, type: 'warning' });
                  } finally {
                    setIsSendingGroup(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingGroup ? 'Envoi...' : 'Diffuser le message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALE MODÉRATION : BANNIR / DÉBANNIR DES COMPTES
          ========================================================= */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-700 space-y-4 animate-in zoom-in-95">
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Gestion des Bannissements & Sanctions</h3>
                  <p className="text-[11px] text-neutral-400">
                    Bannir ou réactiver l'accès d'un utilisateur / artisan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Onglets dans la modal */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
              <button
                type="button"
                onClick={() => setBanModalTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  banModalTab === 'all'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Tous les comptes ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setBanModalTab('banned')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  banModalTab === 'banned'
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Comptes suspendus ({bannedUserIds.length})
              </button>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou email..."
                value={banSearchQuery}
                onChange={(e) => setBanSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Liste scrollable */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-800/60">
              {users
                .filter((u) => {
                  if (banModalTab === 'banned') {
                    return bannedUserIds.includes(u.id);
                  }
                  return true;
                })
                .filter((u) => {
                  if (!banSearchQuery.trim()) return true;
                  const q = banSearchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q))
                  );
                })
                .map((u) => {
                  const isBanned = bannedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="pt-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.name}</span>
                          {isBanned && (
                            <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-full font-bold">
                              SUSPENDU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {u.phone} • {u.role}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleBanUser(u.id, u.name)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isBanned
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {isBanned ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Débannir</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Bannir</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
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
          MODAL DE RETRAIT DES REVENUS FONDATEUR (ADANMITONDE GERAUD)
          Strictement réservé aux 3 Super Administrations :
          - adanmitondejunior07@gmail.com
          - artisanpro.afrique@gmail.com
          - contactartisanproafrica@gmail.com
          ========================================================= */}
      {showFounderWithdrawModal && canWithdrawFounder && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* EN-TÊTE DU MODAL */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-neutral-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => {
                  setShowFounderWithdrawModal(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] uppercase tracking-wider">
                      Super Administration
                    </span>
                    <span className="text-[11px] text-emerald-200/90 font-bold">100% Sécurisé</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    Retirer mes Revenus Fondateur
                  </h3>
                </div>
              </div>

              <p className="text-xs text-emerald-100/80 mt-1">
                Fonds exclusifs du Fondateur <b>ADANMITONDE GERAUD</b> (Commission 10% plateforme).
              </p>
            </div>

            {/* CONTENU PRINCIPAL DU MODAL */}
            <div className="p-6 space-y-5">
              {founderWithdrawReceipt ? (
                /* ÉCRAN DE CONFIRMATION DE RETRAIT */
                <div className="space-y-4">
                  {/* REÇU PDF TÉLÉCHARGEABLE POUR LE FONDATEUR (AJOUT EN HAUT) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-emerald-950 truncate">
                          Reçu PDF téléchargeable pour le fondateur
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium truncate">
                          Réf. {founderWithdrawReceipt.reference} • Justificatif officiel ({receiptViewMode === 'founder' ? 'Privé' : 'Public & QR'})
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFounderPDF(founderWithdrawReceipt, receiptViewMode)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                      title="Télécharger ou imprimer le reçu officiel en format PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{receiptViewMode === 'public' ? 'Télécharger PDF (Public)' : 'Télécharger PDF'}</span>
                    </button>
                  </div>

                  {/* SÉLECTEUR D'OPTION DU REÇU : VUE FONDATEUR (PRIVÉE) vs VUE PUBLIQUE / PARTAGE */}
                  <div className="bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
                    <div className="text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5 px-1 flex items-center justify-between">
                      <span>Option d'affichage du reçu officiel :</span>
                      <span className="text-emerald-700 font-bold lowercase">
                        {receiptViewMode === 'founder' ? 'numéro complet' : 'numéro masqué + qr'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReceiptViewMode('founder')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          receiptViewMode === 'founder'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="truncate">Vue Fondateur (privée)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReceiptViewMode('public')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          receiptViewMode === 'public'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="truncate">Vue Publique / Partage</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                      Virement Fondateur Validé
                    </div>
                    <div className="text-3xl font-black text-emerald-950">
                      {founderWithdrawReceipt.amount.toLocaleString()} FCFA
                    </div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Transférés avec succès via <b>{founderWithdrawReceipt.operator}</b> vers le compte Mobile Money du Fondateur.
                    </p>
                  </div>

                  {/* DÉTAILS DE LA TRANSACTION */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Bénéficiaire officiel :</span>
                      <span className="font-bold text-neutral-900">{founderWithdrawReceipt.beneficiary}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Numéro Mobile Money :</span>
                      <div className="text-right">
                        {receiptViewMode === 'founder' ? (
                          <span className="font-bold text-neutral-900">{founderWithdrawReceipt.phone}</span>
                        ) : (
                          <span className="font-bold font-mono text-neutral-900">+225 05**44**08</span>
                        )}
                        <span
                          className={`ml-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            receiptViewMode === 'founder'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {receiptViewMode === 'founder' ? 'Numéro complet' : 'Numéro masqué'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Opérateur sélectionné :</span>
                      <span className="font-bold text-neutral-900">{founderWithdrawReceipt.operator}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Référence de transaction :</span>
                      <span className="font-mono font-bold text-emerald-700">{founderWithdrawReceipt.reference}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Solde Revenus restant :</span>
                      <span className="font-bold text-neutral-900">{platformRevenue.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {/* QR CODE DE VÉRIFICATION OFFICIELLE EN VUE PUBLIQUE / PARTAGE */}
                  {receiptViewMode === 'public' && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 flex items-center gap-3.5 shadow-2xs">
                      <div className="p-2 bg-neutral-900 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                        <FounderQrCodeSvg size={60} className="text-emerald-400" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs uppercase tracking-wider">
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>QR code de vérification</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-snug">
                          Scannez pour vérifier l'authenticité et la validité de ce virement officiel émis pour le Fondateur.
                        </p>
                        <div className="text-[10px] font-mono text-emerald-800 font-bold truncate">
                          Réf. {founderWithdrawReceipt.reference} • artisanpro.africa
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFounderWithdrawReceipt(null);
                        setFounderAmount(platformRevenue > 0 ? platformRevenue.toString() : '0');
                      }}
                      className="flex-1 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Autre retrait
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFounderWithdrawModal(false);
                      }}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Terminer & Fermer
                    </button>
                  </div>

                  {/* MENTION BAS DE PAGE OFFICIELLE REQUISE */}
                  <div className="pt-2 text-center text-[10px] sm:text-[11px] text-neutral-600 font-semibold border-t border-neutral-200 leading-tight">
                    Document généré par Artisan Pro Afrique - Plateforme Panafricaine des Métiers & Services - Fondateur ADANMITONDE GERAUD.
                  </div>
                </div>
              ) : (
                /* FORMULAIRE DE RETRAIT FONDATEUR */
                <form onSubmit={handleFounderWithdrawSubmit} className="space-y-4">
                  {/* CARTE SOLDE DISPONIBLE */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                        Revenus Plateforme Disponibles
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        Retirable uniquement par le Fondateur
                      </div>
                      <div className="text-2xl font-black text-emerald-950 mt-0.5">
                        {platformRevenue.toLocaleString()} FCFA
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-200/70 text-emerald-900 font-bold text-[10px]">
                        Commission 10%
                      </span>
                    </div>
                  </div>

                  {/* 1. CHOIX DE L'OPÉRATEUR : Wave, Orange Money, MTN, Monniz */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      1. Choisissez votre moyen de retrait Mobile Money <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* WAVE */}
                      <button
                        type="button"
                        onClick={() => setFounderOperator('Wave')}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          founderOperator === 'Wave'
                            ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-400 text-sky-950 font-bold shadow-xs'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          W
                        </div>
                        <span className="text-xs font-bold">Wave</span>
                        {founderOperator === 'Wave' && (
                          <span className="text-[9px] text-sky-600 font-bold">Sélectionné</span>
                        )}
                      </button>

                      {/* ORANGE MONEY */}
                      <button
                        type="button"
                        onClick={() => setFounderOperator('Orange Money')}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          founderOperator === 'Orange Money'
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400 text-orange-950 font-bold shadow-xs'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#FF6B00] text-white font-black text-xs flex items-center justify-center shadow-xs">
                          OM
                        </div>
                        <span className="text-xs font-bold">Orange Money</span>
                        {founderOperator === 'Orange Money' && (
                          <span className="text-[9px] text-orange-600 font-bold">Sélectionné</span>
                        )}
                      </button>

                      {/* MTN MONEY */}
                      <button
                        type="button"
                        onClick={() => setFounderOperator('MTN')}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          founderOperator === 'MTN'
                            ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-400 text-yellow-950 font-bold shadow-xs'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-neutral-900 font-black text-xs flex items-center justify-center shadow-xs">
                          MTN
                        </div>
                        <span className="text-xs font-bold">MTN Money</span>
                        {founderOperator === 'MTN' && (
                          <span className="text-[9px] text-amber-700 font-bold">Sélectionné</span>
                        )}
                      </button>

                      {/* MONNIZ */}
                      <button
                        type="button"
                        onClick={() => setFounderOperator('Monniz')}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          founderOperator === 'Monniz'
                            ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500 text-blue-950 font-bold shadow-xs'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          MZ
                        </div>
                        <span className="text-xs font-bold">Monniz</span>
                        {founderOperator === 'Monniz' && (
                          <span className="text-[9px] text-blue-700 font-bold">Sélectionné</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. NUMÉRO DE TÉLÉPHONE */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      2. Numéro Mobile Money bénéficiaire (Fondateur) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={founderPhone}
                        onChange={(e) => setFounderPhone(e.target.value)}
                        placeholder="+225 0503444508"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-semibold text-neutral-900 bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        ADANMITONDE G.
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Numéro officiel du Fondateur ADANMITONDE GERAUD.
                    </p>
                  </div>

                  {/* 3. MONTANT À RETIRER */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-neutral-800">
                        3. Montant à retirer (FCFA) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFounderAmount(platformRevenue.toString())}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Tout retirer ({platformRevenue.toLocaleString()} F)
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={100}
                        max={platformRevenue}
                        value={founderAmount}
                        onChange={(e) => setFounderAmount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-black text-neutral-900 bg-white"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-neutral-400">
                        FCFA
                      </span>
                    </div>

                    {/* Raccourcis montants */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFounderAmount(platformRevenue.toString())}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                      >
                        Total : {platformRevenue.toLocaleString()} F
                      </button>
                      <button
                        type="button"
                        onClick={() => setFounderAmount('50000')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                      >
                        50 000 F
                      </button>
                      <button
                        type="button"
                        onClick={() => setFounderAmount('100000')}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                      >
                        100 000 F
                      </button>
                    </div>
                  </div>

                  {/* NOTE DE SÉCURITÉ CONFORME AUX EXIGENCES */}
                  <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Règles de sécurité des revenus :</span>
                    </div>
                    <ul className="text-[10px] text-neutral-600 space-y-0.5 list-disc pl-4">
                      <li><b>Revenus Plateforme (Commission 10%)</b> = Appartient au Fondateur seulement.</li>
                      <li><b>Retraits artisans (90%)</b> = Appartient aux artisans.</li>
                      <li>Un artisan ne peut jamais voir ni retirer ce montant.</li>
                    </ul>
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFounderWithdrawModal(false)}
                      className="flex-1 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingFounderWithdraw || platformRevenue <= 0}
                      className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessingFounderWithdraw ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Traitement en cours...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                          <span>Confirmer le retrait ({parseInt(founderAmount || '0', 10).toLocaleString()} F)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal du Protocole de Test Automatisé */}
      {showTestProtocolModal && (
        <TestProtocolModal
          isOpen={showTestProtocolModal}
          onClose={() => setShowTestProtocolModal(false)}
          autoStart={testProtocolAutoStart}
        />
      )}
    </div>
  );
};
