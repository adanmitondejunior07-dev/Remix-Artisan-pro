import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Phone,
  CheckCircle2,
  Eye,
  EyeOff,
  Coins,
  ArrowDownRight,
  Smartphone,
  Copy,
  History,
  AlertCircle,
  Check,
  UserCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { auth, firestore } from '../firebase/config.ts';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

// Unique Email Administrateur Suprême STRICTEMENT autorisé
export const ADMIN_EMAILS = [
  'adanmitondejunior07@gmail.com',
];

export interface AdminTransaction {
  id: string;
  type: string;
  montant: number;
  numero: string;
  operateur: string;
  par: string;
  date: any;
  solde_apres?: number;
}

export const AdminPrivateAccount: React.FC = () => {
  const { currentUser, showToast, go } = useApp();

  // 1. Validation STRICTE des 3 emails ADMIN : bloque l'accès et redirige vers /
  const userEmail = currentUser?.email?.toLowerCase().trim() || '';
  const isAuthorizedAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  useEffect(() => {
    if (!isAuthorizedAdmin) {
      showToast({
        title: 'Accès Refusé',
        desc: 'Cet espace privé est strictement réservé aux 3 administrateurs fondateurs.',
        type: 'warning',
      });
      // Redirection immédiate vers /
      go('home');
      try {
        window.history.pushState({}, '', '/');
      } catch {}
    }
  }, [isAuthorizedAdmin, go, showToast]);

  // États du Solde et de la Config Firestore (admin_config/boss)
  const [solde, setSolde] = useState<number>(0);
  const [telephonePrive, setTelephonePrive] = useState<string>('0503444508');
  const [derniereRechargeDate, setDerniereRechargeDate] = useState<any>(null);
  const [derniereRechargePar, setDerniereRechargePar] = useState<string>('');
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);

  // Formulaire de Recharge : INPUT libre
  const [montant, setMontant] = useState<number | string>(10000);
  const [selectedOperator, setSelectedOperator] = useState<'Wave' | 'MTN' | 'Orange' | 'Moov'>('Wave');
  const [montantError, setMontantError] = useState<string>('');
  const [isRecharging, setIsRecharging] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Téléphone masqué / visible
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  // Historique des recharges en temps réel depuis transactions_admin
  const [rechargeHistory, setRechargeHistory] = useState<AdminTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  // 5. Écoute en temps réel de Firestore admin_config/boss (PAS de .env, pour ne plus jamais reset)
  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    const bossDocRef = doc(firestore, 'admin_config', 'boss');
    const unsubscribe = onSnapshot(
      bossDocRef,
      (docSnap) => {
        setIsConfigLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSolde(typeof data.solde === 'number' ? data.solde : 0);
          setTelephonePrive(data.telephone_prive || '0503444508');
          setDerniereRechargeDate(data.derniere_recharge || null);
          setDerniereRechargePar(data.recharge_par || '');
        } else {
          // Initialisation du document Firestore avec solde: 0 et telephone_prive: "0503444508"
          setDoc(
            bossDocRef,
            {
              solde: 0,
              telephone_prive: '0503444508',
              admins_autorises: ADMIN_EMAILS,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((e) => console.warn('Erreur initialisation admin_config/boss:', e));
          setSolde(0);
          setTelephonePrive('0503444508');
        }
      },
      (error) => {
        setIsConfigLoading(false);
        console.warn('Erreur écoute admin_config/boss:', error);
      }
    );

    return () => unsubscribe();
  }, [isAuthorizedAdmin]);

  // 4. Écoute en temps réel de l'historique des recharges depuis la collection "transactions_admin"
  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    const txCollectionRef = collection(firestore, 'transactions_admin');
    const unsubscribe = onSnapshot(
      txCollectionRef,
      (snapshot) => {
        setIsHistoryLoading(false);
        const list: AdminTransaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.type === 'recharge' || data.type === 'recharge_auto') {
            list.push({
              id: docSnap.id,
              type: data.type || 'recharge_auto',
              montant: Number(data.montant) || 0,
              numero: data.numero || '0503444508',
              operateur: data.operateur || 'Wave',
              par: data.par || '',
              date: data.date,
              solde_apres: data.solde_apres,
            });
          }
        });

        // Tri décroissant par date
        list.sort((a, b) => {
          const timeA = a.date?.toMillis ? a.date.toMillis() : new Date(a.date || 0).getTime();
          const timeB = b.date?.toMillis ? b.date.toMillis() : new Date(b.date || 0).getTime();
          return timeB - timeA;
        });

        setRechargeHistory(list);
      },
      (err) => {
        setIsHistoryLoading(false);
        console.warn('Erreur écoute transactions_admin:', err);
      }
    );

    return () => unsubscribe();
  }, [isAuthorizedAdmin]);

  // Validation dynamique du montant saisi
  const handleMontantChange = (valStr: string) => {
    setMontant(valStr);
    const val = Number(valStr);
    if (!valStr || isNaN(val) || val < 1000 || val > 100000) {
      setMontantError('1000 à 100000 FCFA');
    } else {
      setMontantError('');
    }
  };

  // 3. Soumission INSTANTANÉE de la RECHARGE (sans blocage)
  const handleRecharge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const montantNum = Number(montant);

    if (montantNum < 1000 || montantNum > 100000) {
      setMontantError('1000 à 100000 FCFA');
      showToast({
        title: 'Montant non autorisé',
        desc: '1000 à 100000 FCFA',
        type: 'warning',
      });
      return;
    }

    setMontantError('');
    setIsRecharging(false); // IMPORTANT enleve le blocage

    try {
      const bossRef = doc(firestore, 'admin_config', 'boss');
      const currentUserEmail =
        auth.currentUser?.email || currentUser?.email || userEmail || 'adanmitondejunior07@gmail.com';

      await setDoc(
        bossRef,
        {
          telephone_prive: '0503444508',
          solde: increment(Number(montantNum)),
          derniere_recharge: serverTimestamp(),
          email: 'adanmitondejunior07@gmail.com',
          recharge_par: currentUserEmail,
          admins_autorises: ADMIN_EMAILS,
        },
        { merge: true }
      );

      const soldeApres = solde + montantNum;

      await addDoc(collection(firestore, 'transactions_admin'), {
        type: 'recharge_auto',
        montant: Number(montantNum),
        numero: telephonePrive || '0503444508',
        operateur: selectedOperator,
        par: currentUserEmail,
        date: serverTimestamp(),
        solde_apres: soldeApres,
      });

      showToast({
        title: 'Recharge Effectuée !',
        desc: `+${montantNum} FCFA crédité auto`,
        type: 'success',
      });
      setSuccessMessage(`+${montantNum.toLocaleString('fr-FR')} FCFA crédité auto`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (e: any) {
      console.log(e);
      showToast({
        title: 'Erreur',
        desc: e?.message || 'Erreur lors de la recharge',
        type: 'warning',
      });
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(telephonePrive);
    setCopiedPhone(true);
    showToast({
      title: 'Numéro privé copié !',
      desc: `${telephonePrive} copié dans le presse-papier.`,
      type: 'info',
    });
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  // Si l'utilisateur n'est pas autorisé, on ne rend rien pendant la redirection
  if (!isAuthorizedAdmin) {
    return (
      <div className="p-8 text-center bg-neutral-950 border border-red-500/40 rounded-3xl text-white space-y-3">
        <Lock className="w-8 h-8 text-red-400 mx-auto animate-pulse" />
        <p className="text-sm font-bold text-red-400">Accès Refusé. Redirection en cours...</p>
      </div>
    );
  }

  // Formatage de la date de la dernière recharge
  const formatDate = (rawDate: any) => {
    if (!rawDate) return 'Aucune recharge récente';
    try {
      const d = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date non disponible';
    }
  };

  return (
    <div
      id="admin-private-account-section"
      className="bg-neutral-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/30 space-y-6 text-white"
    >
      {/* =========================================================
          1. EN-TÊTE ESPACE PRIVÉ FONDATEURS
          ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border-2 border-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-md">
                Espace Privé Fondateurs
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider">
                Fondateur : ADANMITONDE GERAUD
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{userEmail}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Compte Propriétaire Boss & Recharges</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/60 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Accès Certifié aux 3 Admins</span>
          </span>
        </div>
      </div>

      {/* =========================================================
          2. CARTE SOLDE FIRESTORE EN DIRECT + TÉLÉPHONE CONFIDENTIEL
          ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARTE 1 : Solde persistant Firestore admin_config/boss */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/40 border-2 border-emerald-500/50 space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Solde Persistant Firestore (admin_config/boss)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Ne reset plus
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                {isConfigLoading ? 'Chargement...' : `${solde.toLocaleString('fr-FR')} FCFA`}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Solde stocké directement dans Firestore <code className="text-emerald-300">admin_config/boss</code>. Accessible et partagé en direct entre les 3 administrateurs.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Dernière recharge : {formatDate(derniereRechargeDate)}</span>
            </span>
            {derniereRechargePar && (
              <span className="px-2 py-0.5 rounded-lg bg-neutral-800 text-amber-300 font-mono text-[11px] truncate max-w-[200px]" title={derniereRechargePar}>
                par {derniereRechargePar.split('@')[0]}
              </span>
            )}
          </div>
        </div>

        {/* CARTE 2 : Ligne Téléphonique Privée */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ligne Téléphonique Privée
                  </h3>
                  <p className="text-[10px] text-neutral-400">Numéro d'administration confidentiel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {showPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPhone ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>

            <div className="p-3.5 mt-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase font-bold text-neutral-500">Numéro Destinataire</div>
                <div className="text-lg font-mono font-black text-amber-400">
                  {showPhone ? telephonePrive : '•••• ••••••••'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copier le numéro"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPhone ? 'Copié !' : 'Copier'}</span>
                </button>
                <a
                  href={`tel:${telephonePrive.replace(/\s+/g, '')}`}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 text-xs font-black flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Appeler</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-400">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Connecté en tant que : <b className="text-white font-mono">{userEmail}</b>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. FORMULAIRE DE RECHARGE AVEC INPUT LIBRE (1000 - 100000 FCFA)
          ========================================================= */}
      <div className="p-6 rounded-2xl bg-neutral-900 border-2 border-amber-500/60 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Recharger le Portefeuille Fondateurs</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  Input Libre
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Créditez le solde partagé. Montant autorisé : de <b>1 000</b> à <b>100 000 FCFA</b>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-800 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-neutral-400">Solde Actuel :</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {solde.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleRecharge} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Choix Opérateur (Wave, MTN, Orange, Moov) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Opérateur Mobile Money</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Wave', 'MTN', 'Orange', 'Moov'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setSelectedOperator(op)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedOperator === op
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-black'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{op === 'Wave' ? '🌊' : op === 'MTN' ? '🟡' : op === 'Orange' ? '🟠' : '🔵'}</span>
                    <span>{op}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Numéro créditeur / cible fixé à 0503444508 */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Numéro Destinataire</span>
              </label>
              <input
                type="text"
                readOnly
                value={telephonePrive}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs font-mono font-bold text-amber-400 focus:outline-none cursor-not-allowed"
                title="Numéro d'administration officiel"
              />
              <span className="text-[10px] text-neutral-500 block mt-1">
                Enregistré sur la ligne propriétaire officielle
              </span>
            </div>

            {/* 3. INPUT LIBRE MONTANT (min=1000, max=100000, step=1000, defaut=10000) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Montant Libre (FCFA)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">1 000 - 100 000 F</span>
              </label>
              <input
                type="number"
                required
                min="1000"
                max="100000"
                step="1000"
                value={montant}
                onChange={(e) => handleMontantChange(e.target.value)}
                placeholder="10000"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border text-xs font-mono font-bold text-white focus:outline-none ${
                  montantError
                    ? 'border-red-500 focus:border-red-400 ring-1 ring-red-500/50'
                    : 'border-neutral-700 focus:border-amber-500'
                }`}
              />

              {/* Message d'erreur obligatoire si <1000 ou >100000 */}
              {montantError ? (
                <div className="flex items-center gap-1.5 mt-1 text-red-400 text-[11px] font-bold animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{montantError}</span>
                </div>
              ) : (
                <span className="text-[10px] text-neutral-500 block mt-1">
                  Par défaut 10 000 FCFA (Pas de 1 000 FCFA)
                </span>
              )}
            </div>
          </div>

          {/* Bouton d'action RECHARGER */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800">
            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>
                Opération enregistrée au nom de <b>{userEmail}</b>
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[3]" />
              <span>
                {`RECHARGER + ${Number(montant || 0).toLocaleString('fr-FR')} FCFA`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================
          4. HISTORIQUE DES RECHARGES PARMI LES 3 ADMINS
          ========================================================= */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Historique des Recharges</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                  {rechargeHistory.length} transaction(s)
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Suivi transparent des approvisionnements réalisés par les 3 administrateurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Synchronisé en direct avec Firestore</span>
          </div>
        </div>

        {isHistoryLoading ? (
          <div className="py-8 text-center text-xs text-neutral-400 animate-pulse">
            Chargement de l'historique des recharges...
          </div>
        ) : rechargeHistory.length === 0 ? (
          <div className="py-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80 p-6 space-y-2">
            <Coins className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-bold text-neutral-400">Aucune recharge enregistrée pour le moment.</p>
            <p className="text-[11px] text-neutral-500">
              Effectuez votre premier versement ci-dessus pour alimenter le solde.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-[10px] font-bold uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Opérateur</th>
                  <th className="py-2.5 px-3">Numéro</th>
                  <th className="py-2.5 px-3">Montant</th>
                  <th className="py-2.5 px-3">Solde après</th>
                  <th className="py-2.5 px-3 text-right">Rechargé par (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 font-mono">
                {rechargeHistory.map((tx) => {
                  const isCurrentAdmin = tx.par.toLowerCase().trim() === userEmail;
                  const operatorBadgeColor =
                    tx.operateur === 'Wave'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : tx.operateur === 'MTN'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : tx.operateur === 'Orange'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3 text-neutral-400 font-sans text-[11px]">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase ${operatorBadgeColor}`}>
                          {tx.operateur}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-300 font-bold text-xs">
                        {tx.numero}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-400 text-sm">
                        +{tx.montant.toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-3 px-3 text-neutral-300 text-xs">
                        {tx.solde_apres !== undefined ? `${tx.solde_apres.toLocaleString('fr-FR')} F` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                              isCurrentAdmin
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                            }`}
                          >
                            <UserCheck className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-mono text-[11px] truncate max-w-[200px]" title={tx.par}>
                              {tx.par}
                            </span>
                            {isCurrentAdmin && (
                              <span className="text-[9px] px-1 rounded bg-amber-500 text-neutral-950 font-black">
                                Vous
                              </span>
                            )}
                          </span>
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

      {/* =========================================================
          5. CARTE DES 3 COMPTES ADMINISTRATEURS AUTORISÉS
          ========================================================= */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-neutral-300">Les 3 Administrateurs Fondateurs autorisés :</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ADMIN_EMAILS.map((email) => {
            const isActive = email === userEmail;
            return (
              <span
                key={email}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                <span>{email}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPrivateAccount;
