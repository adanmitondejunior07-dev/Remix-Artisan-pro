import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { firestore as db } from '../firebase/config.ts';
import { useApp } from '../context/AppContext.tsx';
import { isSuperAdmin } from '../config/adminConfig.ts';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Sparkles,
  Phone,
  Layers,
  FileCheck,
  Building,
  Check,
  X,
} from 'lucide-react';

export const ADMIN_PHONE_NUMBER = '0503444508';

export interface PaymentItem {
  id: string; // Document ID in Firestore
  artisanId?: number | string;
  name: string;
  trade: string;
  city?: string;
  country?: string;
  pays?: string;
  phone?: string;
  email?: string;
  emoji?: string;
  photoUrl?: string;
  avatarUrl?: string;
  abonnement?: string;
  plan?: string;
  abonnement_actif?: boolean;
  statut_paiement?: 'en_attente' | 'valide' | 'refuse' | string;
  montant?: number;
  methode_paiement?: string;
  date_paiement?: any;
  date_validation?: any;
  valide_par?: string;
  date_refus?: any;
  refuse_par?: string;
  preuve_url?: string;
  reference_paiement?: string;
  telephone_admin?: string;
  updatedAt?: any;
}

export const AdminPaymentsPage: React.FC<{
  embedded?: boolean;
  onNavigateTab?: (tab: string) => void;
}> = ({ embedded = false, onNavigateTab }) => {
  const { currentUser, showToast, refreshData, artisans: localArtisans, go } = useApp();

  const [activeTab, setActiveTab] = useState<'en_attente' | 'valides'>('en_attente');
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedProofItem, setSelectedProofItem] = useState<PaymentItem | null>(null);

  // Sécurité d'accès réservée aux administrateurs
  useEffect(() => {
    if (!isSuperAdmin(currentUser)) {
      showToast({
        title: 'Accès restreint',
        desc: 'Cette page de validation des paiements est strictement réservée aux administrateurs.',
        type: 'warning',
      });
      if (!embedded) {
        go('home');
      }
    }
  }, [currentUser, embedded, go, showToast]);

  // Synchronisation en direct avec la collection "artisans" de Firestore
  useEffect(() => {
    setLoading(true);
    try {
      const artisansCol = collection(db, 'artisans');
      const unsubscribe = onSnapshot(
        artisansCol,
        (snapshot) => {
          const list: PaymentItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              artisanId: data.artisanId || data.id || docSnap.id,
              name: data.name || data.nom || 'Artisan sans nom',
              trade: data.trade || data.metier || 'Artisan',
              city: data.city || data.ville || 'Abidjan',
              country: data.country || data.pays || 'Côte d’Ivoire',
              pays: data.pays || data.country || 'Côte d’Ivoire',
              phone: data.phone || data.telephone || '+225 0500000000',
              email: data.email || '',
              emoji: data.emoji || '🔨',
              photoUrl: data.photoUrl || data.avatarUrl || data.avatar,
              avatarUrl: data.avatarUrl || data.photoUrl || data.avatar,
              abonnement: data.abonnement || data.subscription_plan || data.plan || 'Pro',
              plan: data.plan || data.abonnement || 'Pro',
              abonnement_actif: data.abonnement_actif === true || data.subscription_status === 'active',
              statut_paiement: data.statut_paiement || (data.abonnement_actif ? 'valide' : 'en_attente'),
              montant: Number(data.montant) || (data.abonnement?.toLowerCase().includes('essentiel') ? 300 : data.abonnement?.toLowerCase().includes('premium') ? 1000 : 700),
              methode_paiement: data.methode_paiement || '',
              date_paiement: data.date_paiement || data.date_demande || data.createdAt,
              date_validation: data.date_validation,
              valide_par: data.valide_par || ADMIN_PHONE_NUMBER,
              date_refus: data.date_refus,
              refuse_par: data.refuse_par,
              preuve_url: data.preuve_url || '',
              reference_paiement: data.reference_paiement || `TX-${docSnap.id.substring(0, 6).toUpperCase()}`,
              telephone_admin: data.telephone_admin || ADMIN_PHONE_NUMBER,
              updatedAt: data.updatedAt,
            });
          });

          // Si Firestore retourne peu ou pas d'éléments, compléter avec les artisans locaux ayant un abonnement
          if (list.length === 0 && localArtisans && localArtisans.length > 0) {
            localArtisans.forEach((a) => {
              list.push({
                id: String(a.id),
                artisanId: a.id,
                name: a.name,
                trade: a.trade,
                city: a.city,
                country: a.country,
                pays: a.pays || a.country,
                phone: a.phone,
                email: a.email,
                emoji: a.emoji || '🔨',
                photoUrl: a.photoUrl || a.avatarUrl,
                avatarUrl: a.avatarUrl || a.photoUrl,
                abonnement: a.abonnement || a.plan || 'Pro',
                plan: a.plan || 'Pro',
                abonnement_actif: a.abonnement_actif === true || a.subscription_status === 'active',
                statut_paiement: a.statut_paiement || (a.abonnement_actif ? 'valide' : 'en_attente'),
                montant: a.montant || 700,
                methode_paiement: a.methode_paiement || '',
                date_paiement: a.date_paiement,
                date_validation: a.date_validation,
                valide_par: a.valide_par || ADMIN_PHONE_NUMBER,
                reference_paiement: `TX-${a.id}`,
                telephone_admin: ADMIN_PHONE_NUMBER,
              });
            });
          }

          setItems(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Erreur Firestore onSnapshot artisans:', error);
          // Fallback gracieux sur les données locales
          if (localArtisans && localArtisans.length > 0) {
            const fallbackList: PaymentItem[] = localArtisans.map((a) => ({
              id: String(a.id),
              artisanId: a.id,
              name: a.name,
              trade: a.trade,
              city: a.city,
              country: a.country,
              pays: a.pays || a.country,
              phone: a.phone,
              email: a.email,
              emoji: a.emoji || '🔨',
              photoUrl: a.photoUrl || a.avatarUrl,
              avatarUrl: a.avatarUrl || a.photoUrl,
              abonnement: a.abonnement || a.plan || 'Pro',
              plan: a.plan || 'Pro',
              abonnement_actif: a.abonnement_actif === true || a.subscription_status === 'active',
              statut_paiement: a.statut_paiement || (a.abonnement_actif ? 'valide' : 'en_attente'),
              montant: a.montant || 700,
              methode_paiement: a.methode_paiement || '',
              date_paiement: a.date_paiement,
              date_validation: a.date_validation,
              valide_par: a.valide_par || ADMIN_PHONE_NUMBER,
              reference_paiement: `TX-${a.id}`,
              telephone_admin: ADMIN_PHONE_NUMBER,
            }));
            setItems(fallbackList);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Erreur chargement collection artisans:', err);
      setLoading(false);
    }
  }, [localArtisans]);

  // Détection du pays, drapeau et code standardisé
  const getCountryDetails = (countryStr?: string) => {
    const c = (countryStr || '').toUpperCase().trim();
    if (c === 'CI' || c.includes('IVOIRE') || c.includes('CÔTE')) {
      return { code: 'CI', name: 'Côte d’Ivoire', flag: '🇨🇮', isWave: true };
    }
    if (c === 'BJ' || c.includes('BENIN') || c.includes('BÉNIN')) {
      return { code: 'BJ', name: 'Bénin', flag: '🇧🇯', isWave: false };
    }
    if (c === 'TG' || c.includes('TOGO')) {
      return { code: 'TG', name: 'Togo', flag: '🇹🇬', isWave: false };
    }
    if (c === 'CM' || c.includes('CAMEROUN') || c.includes('CAMEROON')) {
      return { code: 'CM', name: 'Cameroun', flag: '🇨🇲', isWave: false };
    }
    if (c === 'SN' || c.includes('SENEGAL') || c.includes('SÉNÉGAL')) {
      return { code: 'SN', name: 'Sénégal', flag: '🇸🇳', isWave: true };
    }
    if (c === 'ML' || c.includes('MALI')) {
      return { code: 'ML', name: 'Mali', flag: '🇲🇱', isWave: true };
    }
    if (c === 'BF' || c.includes('BURKINA')) {
      return { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', isWave: true };
    }
    return { code: 'OTHER', name: countryStr || 'Autre Afrique', flag: '🌍', isWave: false };
  };

  // Libellé de méthode de paiement (Wave CI ou WhatsApp BJ/TG/CM)
  const getPaymentMethodDisplay = (item: PaymentItem) => {
    if (item.methode_paiement && item.methode_paiement.trim().length > 0) {
      const isWave = item.methode_paiement.toLowerCase().includes('wave');
      return {
        label: item.methode_paiement,
        badgeClass: isWave
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isWave,
      };
    }
    const { code, isWave } = getCountryDetails(item.pays || item.country);
    if (isWave) {
      return {
        label: `Wave ${code}`,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        isWave: true,
      };
    }
    return {
      label: `WhatsApp ${code}`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      isWave: false,
    };
  };

  // Formatage des dates
  const formatDateDisplay = (dateVal: any) => {
    if (!dateVal) return 'Récemment';
    try {
      if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // Ignorer l'erreur et retourner fallback
    }
    return 'Récemment';
  };

  // Séparation des données : "En attente" vs "Validés"
  const pendingItems = useMemo(() => {
    return items.filter((it) => {
      // abonnement_actif == false OU statut_paiement == "en_attente"
      return it.abonnement_actif === false || it.statut_paiement === 'en_attente';
    });
  }, [items]);

  const validatedItems = useMemo(() => {
    return items.filter((it) => {
      return it.abonnement_actif === true || it.statut_paiement === 'valide';
    });
  }, [items]);

  // CALCUL DES 4 CARDS DE STATS EN HAUT :
  // 1. Total en attente
  // 2. Total validé aujourd'hui
  // 3. Revenu mensuel
  // 4. Par pays (CI, BJ, TG, CM)
  const stats = useMemo(() => {
    const totalEnAttenteCount = pendingItems.length;
    const totalEnAttenteMontant = pendingItems.reduce((acc, curr) => acc + (curr.montant || 0), 0);

    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let valideAujourdhuiCount = 0;
    let valideAujourdhuiMontant = 0;
    let revenuMensuel = 0;

    validatedItems.forEach((item) => {
      const montant = item.montant || 700;
      revenuMensuel += montant;

      let itemDate: Date | null = null;
      if (item.date_validation) {
        if (typeof item.date_validation?.toDate === 'function') {
          itemDate = item.date_validation.toDate();
        } else {
          itemDate = new Date(item.date_validation);
        }
      } else if (item.date_paiement) {
        if (typeof item.date_paiement?.toDate === 'function') {
          itemDate = item.date_paiement.toDate();
        } else {
          itemDate = new Date(item.date_paiement);
        }
      }

      if (itemDate && !isNaN(itemDate.getTime())) {
        if (itemDate.toDateString() === todayStr) {
          valideAujourdhuiCount += 1;
          valideAujourdhuiMontant += montant;
        }
      } else {
        // Fallback pour les éléments récents
        valideAujourdhuiCount += 1;
        valideAujourdhuiMontant += montant;
      }
    });

    // Répartition par pays : CI, BJ, TG, CM
    const countryStats: Record<'CI' | 'BJ' | 'TG' | 'CM' | 'OTHER', { count: number; total: number }> = {
      CI: { count: 0, total: 0 },
      BJ: { count: 0, total: 0 },
      TG: { count: 0, total: 0 },
      CM: { count: 0, total: 0 },
      OTHER: { count: 0, total: 0 },
    };

    items.forEach((item) => {
      const details = getCountryDetails(item.pays || item.country);
      const code = (['CI', 'BJ', 'TG', 'CM'].includes(details.code) ? details.code : 'OTHER') as
        | 'CI'
        | 'BJ'
        | 'TG'
        | 'CM'
        | 'OTHER';
      countryStats[code].count += 1;
      countryStats[code].total += item.montant || 0;
    });

    return {
      totalEnAttenteCount,
      totalEnAttenteMontant,
      valideAujourdhuiCount,
      valideAujourdhuiMontant,
      revenuMensuel,
      countryStats,
    };
  }, [pendingItems, validatedItems, items]);

  // Filtrage de la table active par recherche et pays
  const currentList = activeTab === 'en_attente' ? pendingItems : validatedItems;
  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      // Filtre pays
      if (selectedCountryFilter !== 'all') {
        const details = getCountryDetails(item.pays || item.country);
        if (details.code !== selectedCountryFilter) {
          return false;
        }
      }
      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${item.name} ${item.trade} ${item.phone} ${item.city} ${item.pays} ${item.abonnement} ${item.reference_paiement}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [currentList, selectedCountryFilter, searchQuery]);

  // ACTION 4 : Bouton VERT "Valider PRO"
  // updateDoc(doc(db, "artisans", id), {
  //   abonnement_actif: true,
  //   statut_paiement: "valide",
  //   date_validation: serverTimestamp(),
  //   valide_par: "0503444508"
  // })
  const handleValiderPro = async (item: PaymentItem) => {
    try {
      setActionLoadingId(item.id);
      const docRef = doc(db, 'artisans', item.id);

      const updateData = {
        abonnement_actif: true,
        statut_paiement: 'valide',
        date_validation: serverTimestamp(),
        valide_par: ADMIN_PHONE_NUMBER,
        telephone_admin: ADMIN_PHONE_NUMBER,
        subscription_status: 'active',
        abonnement: item.abonnement || 'Pro',
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(docRef, updateData);
      } catch (err: any) {
        // Si le doc n'existait pas encore, le créer avec setDoc merge
        await setDoc(
          docRef,
          {
            ...item,
            ...updateData,
          },
          { merge: true }
        );
      }

      // Synchroniser également dans la collection "users" si existe
      try {
        const userDocRef = doc(db, 'users', item.id);
        await setDoc(
          userDocRef,
          {
            abonnement_actif: true,
            statut_paiement: 'valide',
            subscription_status: 'active',
            date_validation: serverTimestamp(),
            valide_par: ADMIN_PHONE_NUMBER,
          },
          { merge: true }
        );
      } catch {}

      showToast({
        title: 'Artisan Validé PRO 🟢',
        desc: `${item.name} est désormais abonné PRO actif (Validé par ${ADMIN_PHONE_NUMBER})`,
        type: 'success',
      });

      if (refreshData) {
        await refreshData();
      }
    } catch (error: any) {
      console.error('Erreur validation PRO:', error);
      showToast({
        title: 'Erreur validation',
        desc: error.message || 'Impossible de valider ce paiement.',
        type: 'warning',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION 5 : Bouton ROUGE "Refuser"
  const handleRefuser = async (item: PaymentItem) => {
    const confirmation = window.confirm(
      `Confirmez-vous le refus du paiement pour l'artisan ${item.name} ?`
    );
    if (!confirmation) return;

    try {
      setActionLoadingId(item.id);
      const docRef = doc(db, 'artisans', item.id);

      const updateData = {
        abonnement_actif: false,
        statut_paiement: 'refuse',
        date_refus: serverTimestamp(),
        refuse_par: ADMIN_PHONE_NUMBER,
        telephone_admin: ADMIN_PHONE_NUMBER,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(docRef, updateData);
      } catch {
        await setDoc(docRef, { ...item, ...updateData }, { merge: true });
      }

      showToast({
        title: 'Paiement Refusé 🔴',
        desc: `La demande de ${item.name} a été marquée comme refusée.`,
        type: 'warning',
      });

      if (refreshData) {
        await refreshData();
      }
    } catch (error: any) {
      console.error('Erreur refus paiement:', error);
      showToast({
        title: 'Erreur',
        desc: error.message || 'Impossible de refuser ce paiement.',
        type: 'warning',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION 6 : Pour les paiements WhatsApp, ouvre https://wa.me/[tel_artisan]?text=...
  const handleOpenWhatsApp = (item: PaymentItem) => {
    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      showToast({
        title: 'Numéro introuvable',
        desc: "Cet artisan n'a pas renseigné de numéro de téléphone.",
        type: 'warning',
      });
      return;
    }

    const message = `Bonjour ${item.name}, nous avons bien reçu votre demande d'abonnement ${item.abonnement || 'PRO'} (${item.montant || 700} FCFA) sur Artisan Pro Afrique. L'administrateur (${ADMIN_PHONE_NUMBER}) est à votre disposition pour finaliser la validation. ID: ${item.id}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER AVEC TITRE ET RETOUR ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Super Administration • Direction Financière</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 flex items-center gap-2">
            <span>💳 Gestion des Paiements & Abonnements</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
            Validez en 1 clic les abonnements PRO via <strong>Wave</strong> (CI, SN, ML, BF) et{' '}
            <strong>WhatsApp</strong> (BJ, TG, CM). Enregistrement direct dans Firestore avec votre
            téléphone administrateur (<strong>{ADMIN_PHONE_NUMBER}</strong>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {embedded && onNavigateTab ? (
            <button
              onClick={() => onNavigateTab('withdrawals')}
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>← Retour Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => go('admin')}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Dashboard Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              if (refreshData) refreshData();
              showToast({ title: 'Actualisation Firestore...', type: 'info' });
            }}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. EN HAUT, 4 CARDS STATS :
          1. Total en attente
          2. Total validé aujourd'hui
          3. Revenu mensuel
          4. Par pays (CI, BJ, TG, CM)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1 : Total en attente */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
              Total en attente
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950">
              {stats.totalEnAttenteCount}{' '}
              <span className="text-xs font-bold text-amber-700">demande(s)</span>
            </div>
            <div className="text-xs font-bold text-amber-800/90 mt-0.5">
              {stats.totalEnAttenteMontant.toLocaleString()} FCFA à encaisser
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
            <span>⚡ Validation requise</span>
          </div>
        </div>

        {/* CARD 2 : Total validé aujourd'hui */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Validé aujourd'hui
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950">
              {stats.valideAujourdhuiCount}{' '}
              <span className="text-xs font-bold text-emerald-700">artisan(s)</span>
            </div>
            <div className="text-xs font-bold text-emerald-800/90 mt-0.5">
              +{stats.valideAujourdhuiMontant.toLocaleString()} FCFA collectés
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span>🟢 Actifs sur le Marketplace</span>
          </div>
        </div>

        {/* CARD 3 : Revenu mensuel */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
              Revenu mensuel
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950">
              {stats.revenuMensuel.toLocaleString()}{' '}
              <span className="text-xs font-bold text-blue-700">FCFA</span>
            </div>
            <div className="text-xs font-bold text-blue-800/90 mt-0.5">
              {validatedItems.length} abonnements confirmés
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
            <span>📈 Abonnements récurrents</span>
          </div>
        </div>

        {/* CARD 4 : Par pays (CI, BJ, TG, CM) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border border-neutral-800 shadow-xs flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Par pays (CI, BJ, TG, CM)
            </span>
            <span className="text-xs font-mono text-neutral-400">🌍 Afrique</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
            <div className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1">
                <span>🇨🇮</span> <span>CI</span>
              </span>
              <span className="text-amber-300 font-mono">{stats.countryStats.CI.count}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1">
                <span>🇧🇯</span> <span>BJ</span>
              </span>
              <span className="text-emerald-300 font-mono">{stats.countryStats.BJ.count}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1">
                <span>🇹🇬</span> <span>TG</span>
              </span>
              <span className="text-sky-300 font-mono">{stats.countryStats.TG.count}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1">
                <span>🇨🇲</span> <span>CM</span>
              </span>
              <span className="text-rose-300 font-mono">{stats.countryStats.CM.count}</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 pt-1 border-t border-white/10 truncate">
            Admin assigné : <span className="text-neutral-200">{ADMIN_PHONE_NUMBER}</span>
          </div>
        </div>
      </div>

      {/* 1. TABLEAU AVEC 2 ONGLETS : "En attente" ET "Validés" */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Navigation des 2 onglets + Barre de recherche et filtres */}
        <div className="p-4 sm:p-6 border-b border-neutral-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-2xl max-w-sm">
            <button
              type="button"
              onClick={() => setActiveTab('en_attente')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'en_attente'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En attente ({pendingItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('valides')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'valides'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validés ({validatedItems.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Barre de recherche */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Rechercher nom, métier, tel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-neutral-50/50"
              />
            </div>

            {/* Sélecteur de pays avec drapeaux */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white text-neutral-800"
              >
                <option value="all">🌍 Tous les pays</option>
                <option value="CI">🇨🇮 Côte d'Ivoire (Wave)</option>
                <option value="BJ">🇧🇯 Bénin (WhatsApp)</option>
                <option value="TG">🇹🇬 Togo (WhatsApp)</option>
                <option value="CM">🇨🇲 Cameroun (WhatsApp)</option>
                <option value="SN">🇸🇳 Sénégal (Wave)</option>
                <option value="ML">🇲🇱 Mali (Wave)</option>
                <option value="BF">🇧🇫 Burkina (Wave)</option>
                <option value="OTHER">🌍 Autre pays</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. TABLEAU DES COLONNES : Photo | Nom | Métier | Pays | Plan | Montant | Méthode | Preuve | Action */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-black uppercase tracking-wider text-neutral-500">
                <th className="py-3.5 px-4">Photo</th>
                <th className="py-3.5 px-4">Nom & Contact</th>
                <th className="py-3.5 px-4">Métier</th>
                <th className="py-3.5 px-4">Pays</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Montant</th>
                <th className="py-3.5 px-4">Méthode</th>
                <th className="py-3.5 px-4">Preuve</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Chargement direct depuis Firebase Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-8 h-8 text-neutral-300" />
                      <span className="font-bold text-neutral-600">
                        {activeTab === 'en_attente'
                          ? 'Aucun paiement en attente pour le moment.'
                          : 'Aucun abonnement validé correspondant.'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Les nouvelles souscriptions Wave et WhatsApp apparaîtront ici automatiquement.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const countryDetails = getCountryDetails(item.pays || item.country);
                  const methodDetails = getPaymentMethodDisplay(item);
                  const isActionLoading = actionLoadingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50/70 transition-colors group"
                    >
                      {/* Photo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl overflow-hidden shadow-2xs">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            item.emoji || '🔨'
                          )}
                        </div>
                      </td>

                      {/* Nom */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-neutral-900 leading-snug">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{item.phone || 'Non renseigné'}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          ID: {item.id.length > 12 ? `${item.id.substring(0, 10)}...` : item.id}
                        </div>
                      </td>

                      {/* Métier */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px]">
                          {item.trade}
                        </span>
                        {item.city && (
                          <div className="text-[10px] text-neutral-400 mt-1">📍 {item.city}</div>
                        )}
                      </td>

                      {/* Pays avec drapeau */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{countryDetails.flag}</span>
                          <div>
                            <div className="font-bold text-neutral-900 text-xs">
                              {countryDetails.code}
                            </div>
                            <div className="text-[10px] text-neutral-500">{countryDetails.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-2xs">
                          {item.abonnement || item.plan || 'PRO'}
                        </span>
                      </td>

                      {/* Montant */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm font-black text-neutral-950">
                          {(item.montant || 700).toLocaleString()} FCFA
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {formatDateDisplay(item.date_paiement || item.date_validation)}
                        </div>
                      </td>

                      {/* Méthode (Wave CI ou WhatsApp BJ/TG/CM) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold inline-flex items-center gap-1 w-fit ${methodDetails.badgeClass}`}
                          >
                            {methodDetails.isWave ? (
                              <span>🌊 Wave</span>
                            ) : (
                              <span>💬 WhatsApp</span>
                            )}
                            <span>{methodDetails.label}</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Admin: {ADMIN_PHONE_NUMBER}
                          </span>
                        </div>
                      </td>

                      {/* Preuve */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedProofItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-neutral-200"
                          title="Consulter le reçu ou la référence de transaction"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Voir preuve</span>
                        </button>
                      </td>

                      {/* 4 & 5 & 6. ACTION : Bouton VERT "Valider PRO", Bouton ROUGE "Refuser", Bouton "Ouvrir WhatsApp" */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {activeTab === 'en_attente' ? (
                            <>
                              {/* 4. BOUTON VERT "Valider PRO" */}
                              <button
                                type="button"
                                id={`btn-valider-pro-${item.id}`}
                                disabled={isActionLoading}
                                onClick={() => handleValiderPro(item)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Valider immédiatement le compte PRO dans Firestore"
                              >
                                {isActionLoading ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Valider PRO</span>
                              </button>

                              {/* 5. BOUTON ROUGE "Refuser" */}
                              <button
                                type="button"
                                id={`btn-refuser-${item.id}`}
                                disabled={isActionLoading}
                                onClick={() => handleRefuser(item)}
                                className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Refuser ce paiement"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Validé PRO</span>
                            </span>
                          )}

                          {/* 6. Pour les paiements WhatsApp (et support), bouton "Ouvrir WhatsApp" */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(item)}
                            className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs transition-all cursor-pointer"
                            title={`Ouvrir WhatsApp vers ${item.phone || 'l’artisan'}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
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

      {/* MODAL PREUVE DE PAIEMENT / TRANSACTION */}
      {selectedProofItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 font-black text-neutral-900 text-base">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Preuve de Souscription</span>
              </div>
              <button
                onClick={() => setSelectedProofItem(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Artisan :</span>
                <span className="font-extrabold text-neutral-900">
                  {selectedProofItem.name}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Métier & Pays :</span>
                <span className="font-bold text-neutral-800 flex items-center gap-1">
                  <span>{getCountryDetails(selectedProofItem.pays).flag}</span>
                  <span>{selectedProofItem.trade}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Formule & Montant :</span>
                <span className="font-black text-emerald-600 text-sm">
                  {selectedProofItem.abonnement || 'PRO'} •{' '}
                  {(selectedProofItem.montant || 700).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Référence de paiement :</span>
                <span className="font-mono font-bold text-neutral-800">
                  {selectedProofItem.reference_paiement}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Méthode :</span>
                <span className="font-bold text-blue-600">
                  {getPaymentMethodDisplay(selectedProofItem).label}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <span className="text-neutral-500">Admin Référent :</span>
                <span className="font-bold text-neutral-800">
                  {selectedProofItem.telephone_admin || ADMIN_PHONE_NUMBER}
                </span>
              </div>

              {selectedProofItem.valide_par && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-medium">Validé par :</span>
                  <span className="font-bold">{selectedProofItem.valide_par}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(selectedProofItem)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Discuter sur WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProofItem(null)}
                className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
