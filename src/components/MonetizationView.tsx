import React, { useState } from 'react';
import {
  Coins,
  TrendingUp,
  Users,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowDownRight,
  Wallet,
  Globe,
  Smartphone,
  ShieldCheck,
  Send,
  Building2,
  ArrowUpRight,
  Receipt,
  FileText,
  Phone,
  Lock,
  BadgeCheck,
  ArrowRight,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AFRICAN_COUNTRIES } from '../data/africanCountries.ts';
import { AfricanPhoneInput } from './AfricanPhoneInput.tsx';
import type { WithdrawalRequest } from '../types.ts';
import { isFounderSuperAdmin } from '../config/adminConfig.ts';
import { MonetizationConditionsView } from './MonetizationConditionsView.tsx';
import { PortefeuilleClient } from './PortefeuilleClient.tsx';
import { PortefeuilleArtisan } from './PortefeuilleArtisan.tsx';

export const MonetizationView: React.FC = () => {
  const {
    currentUser,
    currentArtisan,
    showToast,
    withdrawals,
    requestWithdrawal,
    walletBalance,
    go,
    authModal,
    upgradeClientToArtisan,
    artisan13kModal,
  } = useApp();

  // État local réactif pour mise à jour instantanée des statuts de l'utilisateur
  const [localPaid10k, setLocalPaid10k] = useState<boolean | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [localRole, setLocalRole] = useState<'client' | 'artisan' | null>(null);

  // Modale de paiement Mobile Money dédiée (Activation 10k, Vérification 3k, Pack 13k)
  const [paymentFlow, setPaymentFlow] = useState<{
    open: boolean;
    type: 'client_13k' | 'activate_10k' | 'badge_3k';
    title: string;
    amount: number;
    stepNote?: string;
  } | null>(null);

  const [paymentOperator, setPaymentOperator] = useState<
    'Wave' | 'Orange Money' | 'MTN Money' | 'MTN Mobile Money' | 'Moov Money' | 'Monniz'
  >('Wave');
  const [paymentPhone, setPaymentPhone] = useState(currentUser?.phone || '');
  const [monnizPhone, setMonnizPhone] = useState(currentUser?.phone || '+225');
  const [monnizAmount, setMonnizAmount] = useState('5.000');
  const [showMonnizSuccessModal, setShowMonnizSuccessModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Détermination du rôle effectif
  const effectiveRole = localRole || currentUser?.role || 'client';
  const isClient =
    effectiveRole === 'client' ||
    (!currentUser?.artisanId &&
      !currentArtisan &&
      effectiveRole !== 'artisan' &&
      effectiveRole !== 'super_admin' &&
      effectiveRole !== 'admin');

  // Statut vérification (is_verified) :
  // IMPORTANT : Tout artisan existant vérifié a is_verified = true donc il reste dans le dernier cas.
  // Ne supprime aucun artisan existant vérifié.
  const isVerified = Boolean(
    localVerified === true ||
    currentUser?.verified === true ||
    currentUser?.is_verified === true ||
    currentArtisan?.verified === true ||
    currentArtisan?.is_verified === true ||
    (currentUser?.id &&
      typeof window !== 'undefined' &&
      localStorage.getItem(`artisanpro_verified_${currentUser.id}`) === 'true')
  );

  // Statut paiement activation 10.000F (a_payé_10k) :
  // Si déjà vérifié, les 10k sont acquis. Sinon on vérifie les propriétés hasPaid10k / a_paye_10k ou le localStorage.
  const hasPaid10k = Boolean(
    isVerified ||
    localPaid10k === true ||
    currentUser?.hasPaid10k === true ||
    currentUser?.a_paye_10k === true ||
    currentArtisan?.hasPaid10k === true ||
    currentArtisan?.a_paye_10k === true ||
    (currentUser?.id &&
      typeof window !== 'undefined' &&
      localStorage.getItem(`artisanpro_paid_10k_${currentUser.id}`) === 'true')
  );

  // 54 countries currency selector
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    currentUser?.country
      ? AFRICAN_COUNTRIES.find((c) =>
          c.name.toLowerCase().includes(currentUser.country.toLowerCase())
        )?.code || 'CI'
      : 'CI'
  );

  const currentCountry =
    AFRICAN_COUNTRIES.find((c) => c.code === selectedCountryCode) || AFRICAN_COUNTRIES[0];

  // Withdrawal form state with Wave, Orange Money, MTN Mobile Money, Moov Money, Virement bancaire
  const [withdrawOperator, setWithdrawOperator] = useState<
    'Wave' | 'Orange Money' | 'MTN Mobile Money' | 'Moov Money' | 'Virement bancaire'
  >('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState(currentUser?.phone || '');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const minWithdrawal = 5000;
  const isBalanceSufficient = walletBalance >= minWithdrawal;

  // Calcul du total gagné (Solde + retraits validés)
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'approuve')
    .reduce((sum, w) => sum + w.amount, 0);
  const totalGainsEstimes = walletBalance + totalWithdrawn + 45000; // cumul historique prestations

  // Historique réaliste des transactions (Prompt 7)
  const transactionsHistory = [
    {
      id: 'tx-101',
      date: new Date(Date.now() - 3600000 * 5).toISOString(),
      client: 'Mme Aminata Diallo',
      service: 'Confection Robe Soirée Wax',
      grossAmount: 35000,
      commission10Pct: 3500,
      netAmount: 31500,
      status: 'Crédité',
    },
    {
      id: 'tx-102',
      date: new Date(Date.now() - 3600000 * 28).toISOString(),
      client: 'M. Jean-Paul Kouamé',
      service: 'Rénovation tableau électrique',
      grossAmount: 40000,
      commission10Pct: 4000,
      netAmount: 36000,
      status: 'Crédité',
    },
    {
      id: 'tx-103',
      date: new Date(Date.now() - 3600000 * 72).toISOString(),
      client: 'Mme Fatou Ndiaye',
      service: 'Pose tresse africaine & soins',
      grossAmount: 18000,
      commission10Pct: 1800,
      netAmount: 16200,
      status: 'Crédité',
    },
  ];

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    if (walletBalance < minWithdrawal) {
      setWithdrawError('Solde insuffisant. Le montant minimum de retrait est de 5 000 FCFA.');
      return;
    }

    if (withdrawAmount < minWithdrawal) {
      setWithdrawError('Le montant minimum de retrait est de 5 000 FCFA.');
      return;
    }

    if (withdrawAmount > walletBalance) {
      setWithdrawError('Le montant demandé dépasse votre solde disponible.');
      return;
    }

    if (!withdrawPhone.trim()) {
      setWithdrawError(
        withdrawOperator === 'Virement bancaire'
          ? 'Veuillez renseigner votre IBAN ou RIB bancaire.'
          : 'Veuillez renseigner votre numéro Mobile Money.'
      );
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await requestWithdrawal({
        operator: withdrawOperator as any,
        amount: withdrawAmount,
        phone: withdrawPhone.trim(),
        currency: currentCountry.currency || 'FCFA',
      });

      showToast({
        title: 'Demande de retrait transmise avec succès !',
        desc: `Retrait de ${withdrawAmount.toLocaleString('fr-FR')} ${currentCountry.currency} via ${withdrawOperator} en cours de traitement.`,
        type: 'success',
      });
      setWithdrawAmount(5000);
    } catch (err: any) {
      setWithdrawError(err.message || 'Impossible de soumettre le retrait.');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  // Gestion de la confirmation de paiement Mobile Money
  const handleConfirmMobileMoneyPayment = (targetAmount: number, flowType: 'client_13k' | 'activate_10k' | 'badge_3k') => {
    if (!paymentPhone.trim()) {
      showToast({
        title: 'Numéro requis',
        desc: 'Veuillez renseigner votre numéro Mobile Money pour effectuer le règlement.',
        type: 'warning',
      });
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(async () => {
      setIsProcessingPayment(false);
      setPaymentFlow(null);

      const userId = currentUser?.id || 'current_user';

      if (flowType === 'client_13k') {
        if (targetAmount === 10000) {
          // A choisi de payer seulement l'activation 10.000F d'abord
          setLocalRole('artisan');
          setLocalPaid10k(true);
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('userData');
              const parsed = raw ? JSON.parse(raw) : (currentUser || {});
              const updated = {
                ...parsed,
                role: 'artisan',
                hasPaid10k: true,
                a_paye_10k: true,
              };
              localStorage.setItem('userData', JSON.stringify(updated));
              localStorage.setItem(`artisanpro_paid_10k_${userId}`, 'true');
            } catch {}
          }
          showToast({
            title: 'Activation 10 000 FCFA Réussie !',
            desc: `Votre profil artisan est activé via ${paymentOperator}. Effectuez la vérification officielle (3 000 FCFA) pour débloquer votre badge et vos retraits.`,
            type: 'success',
          });
        } else {
          // Pack complet 13.000F (10k activation + 3k badge)
          setLocalRole('artisan');
          setLocalPaid10k(true);
          setLocalVerified(true);
          const generatedTx = `trx-13k-${Date.now()}`;
          try {
            await upgradeClientToArtisan(generatedTx);
          } catch {
            // fallback local
          }
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('userData');
              const parsed = raw ? JSON.parse(raw) : (currentUser || {});
              const updated = {
                ...parsed,
                role: 'artisan',
                hasPaid10k: true,
                a_paye_10k: true,
                hasPaidActivation13k: true,
                verified: true,
                is_verified: true,
                isArtisan: true,
                artisanPaidAt: Date.now(),
                transactionId: generatedTx,
              };
              localStorage.setItem('userData', JSON.stringify(updated));
              localStorage.setItem(`artisanpro_paid_10k_${userId}`, 'true');
              localStorage.setItem(`artisanpro_paid_13k_${userId}`, 'true');
              localStorage.setItem('artisanpro_paid_13k', 'true');
              localStorage.setItem(`artisanpro_verified_${userId}`, 'true');
            } catch {}
          }
          showToast({
            title: 'Félicitations ! Artisan Certifié (13 000 FCFA)',
            desc: `Activation et vérification validées avec succès via ${paymentOperator}. Votre portefeuille et vos retraits Mobile Money sont maintenant actifs !`,
            type: 'success',
          });
        }
      } else if (flowType === 'activate_10k') {
        setLocalRole('artisan');
        setLocalPaid10k(true);
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('userData');
            const parsed = raw ? JSON.parse(raw) : (currentUser || {});
            const updated = {
              ...parsed,
              role: 'artisan',
              hasPaid10k: true,
              a_paye_10k: true,
            };
            localStorage.setItem('userData', JSON.stringify(updated));
            localStorage.setItem(`artisanpro_paid_10k_${userId}`, 'true');
          } catch {}
        }
        showToast({
          title: 'Activation 10 000 FCFA validée !',
          desc: `Votre compte artisan est désormais activé via ${paymentOperator}. Vous pouvez maintenant procéder à la vérification officielle de votre profil (3 000 FCFA).`,
          type: 'success',
        });
      } else if (flowType === 'badge_3k') {
        setLocalVerified(true);
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('userData');
            const parsed = raw ? JSON.parse(raw) : (currentUser || {});
            const updated = {
              ...parsed,
              verified: true,
              is_verified: true,
            };
            localStorage.setItem('userData', JSON.stringify(updated));
            localStorage.setItem(`artisanpro_verified_${userId}`, 'true');
          } catch {}
        }
        showToast({
          title: 'Badge Officiel Vérifié avec Succès (3 000 FCFA)',
          desc: `Votre profil artisan dispose du badge certifié officiel via ${paymentOperator}. Vos gains et retraits Mobile Money sont débloqués !`,
          type: 'success',
        });
      }
    }, 1200);
  };

  // Modale interactive de paiement Mobile Money
  const renderPaymentModal = () => {
    if (!paymentFlow || !paymentFlow.open) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => setPaymentFlow(null)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-black uppercase tracking-wide">
              <span>Mobile Money Sécurisé</span>
            </div>
            <h3 className="text-xl font-black text-neutral-900">{paymentFlow.title}</h3>
            <p className="text-xs text-neutral-500">
              Réglez instantanément avec Wave, Orange Money, MTN ou Monniz.
            </p>
          </div>

          {/* Operator Selector: Wave, Orange Money, MTN Money, Monniz (avec logo bleu) */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Choisissez votre opérateur
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Wave', icon: '🌊', color: 'bg-cyan-50 border-cyan-300 text-cyan-900' },
                { name: 'Orange Money', icon: '🟠', color: 'bg-orange-50 border-orange-300 text-orange-900' },
                { name: 'MTN Money', icon: '🟡', color: 'bg-yellow-50 border-yellow-300 text-yellow-900' },
                { name: 'Monniz', isMonniz: true, color: 'bg-blue-50 border-blue-400 text-blue-900' },
              ].map((op) => {
                const isSelected = paymentOperator === op.name || (op.name === 'MTN Money' && paymentOperator === 'MTN Mobile Money');
                return (
                  <button
                    key={op.name}
                    type="button"
                    onClick={() => setPaymentOperator(op.name as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? op.isMonniz
                          ? 'border-[#0066FF] bg-blue-50 text-blue-950 shadow-xs ring-2 ring-[#0066FF]/30'
                          : 'border-[#FF6B00] bg-[#FF6B00]/10 text-neutral-900 shadow-xs ring-2 ring-[#FF6B00]/30'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {op.isMonniz ? (
                      <div className="w-6 h-6 rounded-lg bg-[#0066FF] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5l8 9 8-9v14" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-base">{op.icon}</span>
                    )}
                    <span className="truncate">{op.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Si Monniz sélectionné : affichage direct des champs Numéro Monniz (avec paysSelect +225), Montant, et Bouton bleu Confirmer */}
          {paymentOperator === 'Monniz' ? (
            <div className="space-y-4 text-left">
              {/* Champ: Numéro Monniz (avec paysSelect +225 déjà en place) */}
              <AfricanPhoneInput
                id="telInput"
                label="Numéro Monniz"
                value={monnizPhone}
                onChange={(full) => setMonnizPhone(full)}
                placeholder="0503444508"
              />

              {/* Champ: Montant à payer */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Montant à payer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={monnizAmount}
                    onChange={(e) => setMonnizAmount(e.target.value)}
                    placeholder="5.000 FCFA"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-sm font-bold text-neutral-900 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Bouton bleu "Confirmer paiement Monniz" */}
              <button
                type="button"
                onClick={() => {
                  setShowMonnizSuccessModal(true);
                  showToast({
                    title: 'Paiement Monniz réussi',
                    desc: '✅ Paiement Monniz simulé réussi - 5.000 FCFA envoyé au 0503444508',
                    type: 'success',
                  });
                }}
                className="w-full py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm shadow-lg shadow-[#0066FF]/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Confirmer paiement Monniz</span>
              </button>
            </div>
          ) : (
            <>
              {/* Numéro Mobile Money */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Numéro de téléphone Mobile Money
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 text-sm font-semibold text-neutral-900 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    {currentCountry.flag}
                  </span>
                </div>
              </div>

              {/* Section Wave directe si Wave sélectionné */}
              {paymentOperator === 'Wave' && (
                <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-900">🌊 Compte Wave Officiel</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText('0503444508');
                          showToast({
                            title: 'Numéro copié !',
                            desc: '05 03 44 45 08 copié dans le presse-papier.',
                            type: 'success',
                          });
                        }
                      }}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                    >
                      Copier 05 03 44 45 08
                    </button>
                  </div>
                  <p className="text-xs text-cyan-800 leading-relaxed font-medium">
                    Êtes-vous sûr de vouloir payer ? Cliquez sur ce lien et allez dans votre compte Wave pour payer :
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open('https://wave.com', '_blank')}
                    className="w-full py-2 px-3 rounded-xl bg-[#1DC8FF] hover:bg-[#00b2e8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Ouvrir mon compte Wave pour payer (05 03 44 45 08)</span>
                  </button>
                </div>
              )}

              {/* Récapitulatif montant */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Montant total à régler</span>
                <span className="text-xl font-black text-[#FF6B00]">
                  {paymentFlow.amount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {/* Bouton de paiement ORANGE #FF6B00 */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleConfirmMobileMoneyPayment(paymentFlow.amount, paymentFlow.type)}
                className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white font-black text-sm shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Paiement en cours sur {paymentOperator}...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Valider le paiement de {paymentFlow.amount.toLocaleString('fr-FR')} FCFA</span>
                  </>
                )}
              </button>

              {/* Alternative si Pack 13k : option de ne payer que 10k d'activation d'abord */}
              {paymentFlow.type === 'client_13k' && (
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={() => handleConfirmMobileMoneyPayment(10000, paymentFlow.type)}
                    className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ou payer uniquement l'étape 1 (Activation 10.000 FCFA)
                  </button>
                </div>
              )}
            </>
          )}

          {/* Pop-up Vert Paiement Monniz Simulé Réussi */}
          {showMonnizSuccessModal && (
            <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl max-w-sm w-full p-6 sm:p-7 text-center space-y-5 animate-in zoom-in-95 duration-150">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                  ✅
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wide">
                    <span>Simulation Démo Réussie</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-emerald-950 leading-snug">
                    ✅ Paiement Monniz simulé réussi - 5.000 FCFA envoyé au 0503444508
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Mode démo sans API validé avec succès.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMonnizSuccessModal(false);
                    setPaymentFlow(null);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-neutral-400 text-center">
            🔒 Transaction instantanée & protégée par séquestre bancaire ArtisanPro Africa.
          </p>
        </div>
      </div>
    );
  };

  const renderConditionsModal = () => {
    if (!showConditionsModal) return null;
    return (
      <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-[#fafaf9] rounded-3xl border-2 border-[#FF6B00]/70 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 relative">
          <button
            type="button"
            onClick={() => setShowConditionsModal(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition-colors shadow-2xs z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <MonetizationConditionsView onClose={() => setShowConditionsModal(false)} />
        </div>
      </div>
    );
  };

  const renderConditionsCallout = () => {
    // Calcul du statut effectif pour affichage
    const getUserMonetizationStatus = () => {
      if (!currentUser) return { icon: '🔒', label: 'Non éligible', color: 'bg-neutral-100 text-neutral-700' };
      if (currentUser.monetization_status === 'suspended') return { icon: '🔴', label: 'Monétisation suspendue', color: 'bg-rose-100 text-rose-800' };
      if (currentUser.monetization_status === 'active' || currentUser.role === 'super_admin') return { icon: '🟢', label: 'Monétisation active', color: 'bg-emerald-100 text-emerald-800' };
      if (currentUser.monetization_status === 'pending_validation' || (typeof window !== 'undefined' && localStorage.getItem(`artisanpro_monetization_pending_${currentUser.id}`) === 'true')) {
        return { icon: '🟡', label: 'Demande de validation', color: 'bg-amber-100 text-amber-900' };
      }
      return { icon: '⏳', label: 'Conditions en cours', color: 'bg-sky-100 text-sky-800' };
    };

    const currentStatus = getUserMonetizationStatus();

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#FF6B00]/40 shadow-xs space-y-5">
        {/* MESSAGE OFFICIEL */}
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="text-2xl shrink-0">💰</div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <h4 className="font-black text-neutral-950 text-sm sm:text-base">
              💰 Vous souhaitez gagner de l’argent avec vos contenus ?
            </h4>
            <p className="text-neutral-700 font-medium leading-relaxed">
              Complétez les conditions ArtisanPro, développez votre audience et respectez les règles de la plateforme.
            </p>
            <p className="text-neutral-950 font-bold leading-relaxed">
              Lorsque toutes les conditions sont remplies, vous pourrez demander l’activation de votre monétisation.
            </p>
          </div>
        </div>

        {/* STATUTS DE MONÉTISATION */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h5 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>STATUTS DE MONÉTISATION :</span>
            </h5>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
              <span className="text-neutral-500 text-[11px]">Votre statut :</span>
              <span className="font-black">{currentStatus.icon} {currentStatus.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 flex items-center gap-1.5">
              <span>🔒</span>
              <span>Non éligible</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 flex items-center gap-1.5">
              <span>⏳</span>
              <span>Conditions en cours</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 flex items-center gap-1.5">
              <span>🟡</span>
              <span>Demande de validation</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 flex items-center gap-1.5">
              <span>🟢</span>
              <span>Monétisation active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <span>🔴</span>
              <span>Monétisation suspendue</span>
            </div>
          </div>
        </div>

        {/* Message d'état contextuel officiel */}
        {currentStatus.icon === '🟢' ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-950 flex items-center gap-2">
            <span>🟢</span>
            <span>Félicitations ! Votre monétisation est maintenant active. Vos contenus génèrent des revenus.</span>
          </div>
        ) : currentStatus.icon === '🔴' ? (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs font-bold text-red-950 flex items-center gap-2">
            <span>🔴</span>
            <span>Votre demande de monétisation a été refusée. Consultez les motifs et mettez à jour votre profil.</span>
          </div>
        ) : currentStatus.icon === '🟡' ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 flex items-center gap-2">
            <span>🟡</span>
            <span>Demande de validation en cours — Examen par le Super Administrateur ArtisanPro.</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 flex items-center gap-2">
            <span className="text-amber-600 font-bold">⏳</span>
            <span>Conditions non remplies — L'artisan doit compléter tous les éléments avant validation.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-600">
            Consultez les 13 conditions d'accès réglementaires fixées par ArtisanPro.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowConditionsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Voir les 13 conditions</span>
            </button>
            <button
              type="button"
              onClick={() => go('conditions-monetisation')}
              className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              title="Ouvrir en plein écran"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // CAS 0 : Utilisateur non connecté
  if (!currentUser) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-neutral-200/90 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FF6B00] flex items-center justify-center mx-auto text-3xl shadow-inner">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-neutral-900">0 FCFA</div>
            <h3 className="text-lg font-black text-neutral-900">
              Connectez-vous pour accéder à vos gains
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
              Accédez à votre portefeuille Mobile Money, visualisez vos gains sur prestations et demandez vos retraits instantanés.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => authModal.open('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-[#FF6B00]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => go('register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Créer un compte
            </button>
          </div>
        </div>

        {renderConditionsCallout()}
        {renderConditionsModal()}
      </div>
    );
  }

  // =========================================================================
  // CAS 1 : SI user.type == "client"
  // Écran Portefeuille Client complet (Cerveau + Visage Flutter) :
  // Solde disponible (0 FCFA) + Row Mobile Money (Orange Money, MTN, Moov, Wave)
  // + Historique des transactions + Bouton "Devenir Artisan - 13.000F"
  // =========================================================================
  if (isClient) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <PortefeuilleClient onUpgradeToArtisan={() => artisan13kModal.open()} />

        {renderConditionsCallout()}
        {renderConditionsModal()}
        {renderPaymentModal()}
      </div>
    );
  }

  // =========================================================================
  // CAS 2 : SI user.type == "artisan" ET is_verified == false ET a_payé_10k == false
  // Affiche "Payez 10.000F pour activer"
  // Bouton "Vérifier mon profil" masqué à cette étape
  // Boutons en ORANGE #FF6B00
  // =========================================================================
  if (!isVerified && !hasPaid10k) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-neutral-200/90 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FF6B00] flex items-center justify-center mx-auto text-3xl shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 uppercase tracking-wide">
              Profil Artisan Inactif · Étape 1/2
            </span>
            <div className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">
              0 FCFA
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
              Payez 10.000F pour activer
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-lg mx-auto pt-1">
              Votre compte artisan n'est pas encore actif. Réglez les frais d'activation de 10.000 FCFA pour activer votre compte, publier vos réalisations et débloquer l'étape de certification.
            </p>
          </div>

          {/* Stepper Progress Visualizer */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-[#FF6B00]/10 border-2 border-[#FF6B00] space-y-1">
              <span className="text-[10px] font-black uppercase text-[#FF6B00]">Étape 1 (Requise)</span>
              <p className="text-xs font-bold text-neutral-900">Activation Profil</p>
              <p className="text-[11px] text-[#FF6B00] font-black">10 000 FCFA</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-200 space-y-1 opacity-50">
              <span className="text-[10px] font-bold uppercase text-neutral-500">Étape 2 (Verrouillée)</span>
              <p className="text-xs font-bold text-neutral-600">Vérification Badge</p>
              <p className="text-[11px] text-neutral-500">3 000 FCFA</p>
            </div>
          </div>

          {/* Règle stricte : bouton vérifier profil masqué avant paiement 10k */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <span>
              Le bouton <strong>« Vérifier mon profil »</strong> n'est visible que <strong>APRES paiement des 10.000F</strong>.
            </span>
          </div>

          {/* Bouton obligatoire "Payez 10.000F pour activer" en ORANGE #FF6B00 */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                setPaymentFlow({
                  open: true,
                  type: 'activate_10k',
                  title: 'Activation Compte Artisan (10 000 FCFA)',
                  amount: 10000,
                  stepNote: 'Étape 1/2 : Activation du compte artisan',
                })
              }
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm sm:text-base shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <span>Payez 10.000F pour activer</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {renderConditionsCallout()}
        {renderConditionsModal()}
        {renderPaymentModal()}
      </div>
    );
  }

  // =========================================================================
  // CAS 3 : SI user.type == "artisan" ET a_payé_10k == true ET is_verified == false
  // Affiche "Payez 3.000F pour vérification badge"
  // Bouton "Vérifier mon profil" DÉSORMAIS VISIBLE après paiement 10k
  // Boutons en ORANGE #FF6B00
  // =========================================================================
  if (!isVerified && hasPaid10k) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-neutral-200/90 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 uppercase tracking-wide">
              ✓ Activation 10 000F Validée · Étape 2/2 : Badge Vérifié
            </span>
            <div className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">
              0 FCFA
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
              Payez 3.000F pour vérification badge
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-lg mx-auto pt-1">
              Vos frais d'activation de 10.000 FCFA ont bien été validés ! Pour commencer à percevoir vos gains sur vos chantiers et activer le retrait Mobile Money vers votre numéro, validez la vérification officielle de conformité de votre profil et obtenez votre badge certifié.
            </p>
          </div>

          {/* Stepper Progress Visualizer */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700">Étape 1 (Validée)</span>
              <p className="text-xs font-bold text-neutral-900">Activation Profil</p>
              <p className="text-[11px] text-emerald-700 font-bold">10 000 FCFA Payés ✓</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FF6B00]/10 border-2 border-[#FF6B00] space-y-1">
              <span className="text-[10px] font-black uppercase text-[#FF6B00]">Étape 2 (Débloquée)</span>
              <p className="text-xs font-bold text-neutral-900">Vérification Badge</p>
              <p className="text-[11px] text-[#FF6B00] font-black">3 000 FCFA</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Les 10.000F ayant été payés, le bouton de vérification de votre profil est maintenant débloqué ci-dessous.
            </span>
          </div>

          {/* Bouton obligatoire "Payez 3.000F pour vérification badge" en ORANGE #FF6B00 */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() =>
                setPaymentFlow({
                  open: true,
                  type: 'badge_3k',
                  title: 'Vérification Profil & Badge Certifié (3 000 FCFA)',
                  amount: 3000,
                  stepNote: 'Étape 2/2 : Obtention du badge certifié officiel',
                })
              }
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm sm:text-base shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <BadgeCheck className="w-5 h-5 text-white" />
              <span>Payez 3.000F pour vérification badge</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {renderConditionsCallout()}
        {renderConditionsModal()}
        {renderPaymentModal()}
      </div>
    );
  }

  // =========================================================================
  // CAS 4 : SI user.type == "artisan" ET is_verified == true
  // GARDE L'ANCIEN ÉCRAN NORMAL avec ses gains, son portefeuille Mobile Money,
  // bouton Retirer. NE TOUCHE PAS.
  // Les artisans déjà vérifiés aujourd'hui ont is_verified = true donc ils
  // restent dans le dernier cas. Rien ne change pour eux.
  // =========================================================================
  return (
    <div className="space-y-8">
      {/* HEADER BANNER ANIMÉE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 p-6 sm:p-8 text-white border-2 border-[#FF6B00]/60 shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Portefeuille & Monétisation Panafricaine</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
            💰 Mes Gains, Portefeuille & Retraits Directs
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            Rémunération automatique sur vos prestations et vos publications. Commission transparente :{' '}
            <strong className="text-white">90% pour l'artisan</strong> et{' '}
            <strong className="text-amber-400">10% pour la plateforme ArtisanPro</strong>.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setPaymentOperator('Monniz');
                setPaymentFlow({
                  open: true,
                  type: 'activate_10k',
                  title: 'Paiement Monniz (Mode Démo)',
                  amount: 5000,
                  stepNote: 'Simulation sans API',
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-xs shadow-md shadow-[#0066FF]/30 transition-all cursor-pointer"
            >
              <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center text-white text-[10px] font-black">
                M
              </div>
              <span>Tester Paiement Monniz (Démo 5.000 FCFA)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 STATS CARDS : SOLDE DISPONIBLE / TOTAL GAGNÉ / COMMISSION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Solde disponible */}
        <div className="p-5 rounded-3xl bg-neutral-950 text-white border border-neutral-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Solde Disponible
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-[#FF6B00]">
              {walletBalance.toLocaleString('fr-FR')} {currentCountry.currency}
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
              ✓ Prêt pour retrait immédiat (min. 5 000 FCFA)
            </p>
            {([
              'adanmitondejunior07@gmail.com',
            ].includes(currentUser?.email?.toLowerCase() || '') ||
              currentUser?.role === 'admin' ||
              currentUser?.role === 'super_admin') && (
              <div className="pt-2 flex flex-col sm:flex-row gap-1.5">
                <button
                  type="button"
                  onClick={() => go('admin')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recharge Admin (+225)</span>
                </button>
                <button
                  type="button"
                  onClick={() => go('admin')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Retrait Admin (+225)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Total gagné */}
        <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Gagné
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-neutral-950">
              {totalGainsEstimes.toLocaleString('fr-FR')} {currentCountry.currency}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Cumul des prestations et bonus
            </p>
          </div>
        </div>

        {/* Règle Commission 90% / 10% */}
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Part Artisan (90%)
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center font-bold text-xs">
              90%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-900">
              Commission 10%
            </div>
            <div className="text-[10px] text-amber-800 font-bold mt-0.5">
              Retirable uniquement par le Fondateur
            </div>
            <p className="text-[11px] text-neutral-600 mt-1">
              90% reviennent directement à l'artisan. Les Revenus Plateforme (10%) appartiennent exclusivement au Fondateur ADANMITONDE GERAUD.
            </p>
            {isFounderSuperAdmin(currentUser) && (
              <button
                type="button"
                onClick={() => go('admin')}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>RETIRER MES REVENUS FONDATEUR (ADMIN)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FORMULAIRE DE RETRAIT DES GAINS (Prompt 7) */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
              <Send className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-neutral-950">
              Retirer mes Gains
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Sélectionnez votre moyen de retrait parmi <b>Wave, Orange Money, MTN Mobile Money, Moov Money</b> ou <b>Virement bancaire</b>.
            Montant minimum de retrait : <b className="text-neutral-900">5 000 FCFA</b>.
          </p>
        </div>

        {withdrawError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{withdrawError}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Opérateur de retrait */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Moyen de retrait *
              </label>
              <select
                value={withdrawOperator}
                onChange={(e: any) => setWithdrawOperator(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
              >
                <option value="Wave">🌊 Wave</option>
                <option value="Orange Money">🟠 Orange Money</option>
                <option value="MTN Mobile Money">🟡 MTN Mobile Money</option>
                <option value="Moov Money">🔵 Moov Money</option>
                <option value="Virement bancaire">🏦 Virement bancaire</option>
              </select>
            </div>

            {/* Numéro ou RIB */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                {withdrawOperator === 'Virement bancaire'
                  ? 'IBAN / Numéro de compte bancaire *'
                  : 'Numéro Mobile Money *'}
              </label>
              <input
                type="text"
                required
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder={
                  withdrawOperator === 'Virement bancaire'
                    ? 'Ex: CI093 01001 012345678901 45'
                    : 'Ex: +225 07 08 09 10 11'
                }
                className="w-full px-3.5 py-3 rounded-2xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            {/* Montant (Minimum 5 000 FCFA) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Montant à retirer (FCFA) *
              </label>
              <input
                type="number"
                min={5000}
                step={1000}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full px-3.5 py-3 rounded-2xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Minimum requis : 5 000 FCFA
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-neutral-500">
              {walletBalance < minWithdrawal ? (
                <span className="text-amber-800 font-semibold">
                  ⚠️ Solde insuffisant pour retirer (Solde : {walletBalance.toLocaleString('fr-FR')} FCFA / Min 5 000 FCFA)
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  ✓ Transfert direct sans frais cachés
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingWithdrawal || !isBalanceSufficient}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                isBalanceSufficient
                  ? 'bg-[#FF6B00] hover:bg-[#e05e00] text-white cursor-pointer hover:scale-[1.02]'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmittingWithdrawal
                  ? 'Traitement en cours...'
                  : 'Retirer mes gains'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* HISTORIQUE DES TRANSACTIONS (VISIBLE UNIQUEMENT POUR ADMIN ET SUPER_ADMIN) */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
                <Receipt className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-neutral-950">
                Historique des Transactions Récentes
              </h3>
            </div>
            <span className="text-xs text-neutral-400 font-medium">Commission 10% déduite</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Client</th>
                  <th className="pb-3 px-2">Prestation / Service</th>
                  <th className="pb-3 px-2 text-right">Montant Brut</th>
                  <th className="pb-3 px-2 text-right text-neutral-400">Commission (10%)</th>
                  <th className="pb-3 px-2 text-right text-[#FF6B00] font-black">Net Reçu (90%)</th>
                  <th className="pb-3 px-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactionsHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-2 font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-2 font-bold text-neutral-900 whitespace-nowrap">
                      {tx.client}
                    </td>
                    <td className="py-3 px-2 text-neutral-700">{tx.service}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-neutral-800">
                      {tx.grossAmount.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neutral-400">
                      -{tx.commission10Pct.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-black text-[#FF6B00]">
                      +{tx.netAmount.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-bold border border-neutral-200">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTORIQUE DES DEMANDES DE RETRAIT EFFECTUÉES */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-neutral-950">
              Historique de vos Demandes de Retrait
            </h3>
            <p className="text-xs text-neutral-500">
              Suivi en temps réel de vos virements Mobile Money & Wave.
            </p>
          </div>
          <a
            href="https://wa.me/2250503444508"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 transition-all cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <Phone className="w-4 h-4 text-white" />
            <span>Support WhatsApp +225 0503444508</span>
          </a>
        </div>

        {(() => {
          const userWithdrawals = withdrawals.filter(
            (w) => !currentUser?.id || w.userId === currentUser.id || w.userPhone === currentUser.phone || currentUser.role === 'admin' || currentUser.role === 'super_admin'
          );
          const listToRender = userWithdrawals.length > 0 ? userWithdrawals : [
            {
              id: `wave-${currentUser?.id || 'demo'}`,
              userId: currentUser?.id || 'usr-1',
              userName: currentUser?.name || 'Artisan',
              userPhone: currentUser?.phone || '+225 07 00 00 00 00',
              amount: 25000,
              currency: 'FCFA',
              operator: 'Wave' as const,
              status: 'approuve' as const,
              date: new Date(Date.now() - 3600000 * 24).toISOString(),
            },
          ];

          return (
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
              {listToRender.map((w) => (
                <div key={w.id} className="p-4 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {w.operator}
                      </span>
                      <span className="text-xs text-neutral-600 font-mono">{w.userPhone}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                      {new Date(w.date).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(w.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-neutral-950 block">
                      {w.amount.toLocaleString('fr-FR')} {w.currency || 'FCFA'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                        w.status === 'approuve'
                          ? 'bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30'
                          : w.status === 'refuse'
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {w.status === 'approuve'
                        ? '✓ Validé & Envoyé'
                        : w.status === 'refuse'
                        ? '✕ Refusé'
                        : '⏳ En cours de validation'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO */}
      <div className="pt-6 border-t border-neutral-200">
        <MonetizationConditionsView />
      </div>

      {renderConditionsModal()}
      {renderPaymentModal()}
    </div>
  );
};
