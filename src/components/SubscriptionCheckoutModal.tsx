import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Lock,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/config.ts';
import {
  isWaveCountry,
  getWavePaymentUrl,
  getWhatsAppPaymentUrl,
  updateArtisanSubscriptionInFirestore,
  ADMIN_PHONE_NUMBER,
  ADMIN_WHATSAPP_NUMBER,
  COUNTRIES_CONFIG,
  AfricanCountryCode,
  getSubscriptionAmount,
} from '../services/paymentService.ts';

export interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planKey: 'essential' | 'pro' | 'premium';
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
  price: number;
  initialCountry?: string;
  onSuccess?: () => void;
}

export const SubscriptionCheckoutModal: React.FC<CheckoutProps> = ({
  isOpen,
  onClose,
  planKey,
  planName,
  billingPeriod,
  price,
  initialCountry = 'CI',
  onSuccess,
}) => {
  const { currentUser, currentArtisan, refreshData, showToast } = useApp();

  // Country selection: default to initialCountry or user country
  const [selectedCountryCode, setSelectedCountryCode] = useState<AfricanCountryCode>(() => {
    const code = initialCountry.toUpperCase();
    if (code in COUNTRIES_CONFIG) return code as AfricanCountryCode;
    return 'CI';
  });

  const [customUserId, setCustomUserId] = useState<string>(
    currentUser?.id ? String(currentUser.id) : currentArtisan?.id ? String(currentArtisan.id) : 'artisan_ci'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'form' | 'wave_confirm' | 'success'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize country when initialCountry prop changes
  useEffect(() => {
    if (initialCountry && initialCountry.toUpperCase() in COUNTRIES_CONFIG) {
      setSelectedCountryCode(initialCountry.toUpperCase() as AfricanCountryCode);
    }
  }, [initialCountry]);

  if (!isOpen) return null;

  const currentCountry = COUNTRIES_CONFIG[selectedCountryCode] || COUNTRIES_CONFIG.CI;
  const isWave = isWaveCountry(selectedCountryCode);

  // Exact amount calculated based on plan and billing period
  const finalAmount = getSubscriptionAmount(planKey, billingPeriod) || price;
  const effectiveUserId = currentUser?.id ? String(currentUser.id) : customUserId || '1';

  // Wave payment URL
  const waveUrl = getWavePaymentUrl(finalAmount);

  // WhatsApp payment URL with the exact requested message:
  // "Je veux payer [plan] [montant]F [pays] ID: [userId]"
  const whatsappUrl = getWhatsAppPaymentUrl({
    plan: planName,
    amount: finalAmount,
    pays: currentCountry.name,
    userId: effectiveUserId,
  });

  // Action lorsque l'artisan clique sur Payer
  const handleInitiatePayment = async () => {
    setErrorMessage(null);

    // Enregistrement de la demande en attente dans Firestore collection artisans
    try {
      const artisanDocRef = doc(firestore, 'artisans', effectiveUserId);
      await setDoc(
        artisanDocRef,
        {
          abonnement: planName,
          abonnement_actif: false,
          statut_paiement: 'en_attente',
          montant: finalAmount,
          pays: currentCountry.name,
          methode_paiement: isWave ? 'Wave CI' : `WhatsApp ${selectedCountryCode}`,
          telephone_admin: ADMIN_PHONE_NUMBER,
          date_paiement: serverTimestamp(),
          name: currentUser?.name || currentArtisan?.name || 'Artisan',
          phone: currentUser?.phone || currentArtisan?.phone || '',
          trade: currentArtisan?.trade || 'Artisan',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Notice: enregistrement en attente Firestore non-bloquant:', e);
    }

    if (isWave) {
      // Ouvre le lien Wave Business dans un nouvel onglet
      window.open(waveUrl, '_blank', 'noopener,noreferrer');
      setStep('wave_confirm');
    } else {
      // Redirige vers WhatsApp Admin +2250503444508
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      showToast({
        title: 'Redirection WhatsApp',
        desc: `Message transmis au support admin (${ADMIN_PHONE_NUMBER})`,
        type: 'info',
      });
    }
  };

  // Validation automatique sur Firebase Firestore après paiement Wave
  const handleConfirmWavePayment = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // doc(db, "artisans", userId) => {
      //   abonnement: plan,
      //   abonnement_actif: true,
      //   date_paiement: serverTimestamp(),
      //   montant: amount,
      //   pays: pays,
      //   telephone_admin: "0503444508"
      // }
      const res = await updateArtisanSubscriptionInFirestore({
        userId: effectiveUserId,
        plan: planKey,
        amount: finalAmount,
        pays: currentCountry.name,
        artisanName: currentUser?.name || currentArtisan?.name,
        artisanTrade: currentArtisan?.trade,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      await refreshData();

      setStep('success');
      showToast({
        title: 'Abonnement Activé !',
        desc: `Votre abonnement ${planName.toUpperCase()} est actif sur Firebase Firestore.`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erreur validation Wave:', err);
      setErrorMessage(err?.message || 'Erreur lors de la mise à jour Firebase Firestore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-6 relative my-auto text-neutral-100">
        {/* Bouton Fermer */}
        <button
          type="button"
          id="btn-close-checkout-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ÉTAPE 1 : CHOIX DU PAYS & PRÉSENTATION DU MODE DE PAIEMENT */}
        {step === 'form' && (
          <>
            <div>
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-[#FF6B00] uppercase mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Abonnement Officiel ArtisanPro Afrique</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Finaliser votre formule {planName}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Paiements sécurisés Wave Business & Assistance WhatsApp Directe
              </p>
            </div>

            {/* Récapitulatif Formule & Montant */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Formule choisie :</span>
                <span className="font-black text-white px-2.5 py-1 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] uppercase">
                  {planName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Période de facturation :</span>
                <span className="font-bold text-neutral-200">
                  {billingPeriod === 'monthly' ? 'Mensuel (30 jours)' : 'Annuel (365 jours)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-medium">Montant officiel :</span>
                <span className="text-xl font-black text-[#FF6B00] tracking-tight">
                  {finalAmount.toLocaleString()} FCFA
                </span>
              </div>

              {/* ID de l'artisan */}
              <div className="pt-2 border-t border-neutral-800/80">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                  Identifiant Artisan (Firebase ID) :
                </label>
                <input
                  type="text"
                  value={effectiveUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-hidden focus:border-[#FF6B00]"
                  placeholder="ID Artisan ou Utilisateur"
                />
              </div>

              {/* Sélecteur de Pays */}
              <div className="pt-2 border-t border-neutral-800/80">
                <label className="block text-[11px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Votre pays (Sélecteur avec drapeaux) :
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(COUNTRIES_CONFIG) as AfricanCountryCode[]).map((code) => {
                    const c = COUNTRIES_CONFIG[code];
                    const isSelected = selectedCountryCode === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedCountryCode(code)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-white shadow-xs'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="text-[10px] font-black">{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mode de paiement automatique configuré selon le pays */}
            <div className="space-y-3">
              {isWave ? (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wide">
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Wave Business Instantané ({currentCountry.flag} {currentCountry.name})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      0 FCFA de frais
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Cliquez ci-dessous pour ouvrir votre application ou lien Wave sécurisé.
                    Votre abonnement est automatiquement synchronisé dans Firebase Firestore.
                  </p>
                  <div className="text-[11px] text-cyan-300/80 font-mono break-all pt-1">
                    Lien direct Wave : {waveUrl}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wide">
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Administrateur Officiel ({currentCountry.flag} {currentCountry.name})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {ADMIN_PHONE_NUMBER}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Pour {currentCountry.name}, le règlement s'effectue avec l'assistance directe de l'administrateur
                    au <strong>{ADMIN_PHONE_NUMBER}</strong> ({ADMIN_WHATSAPP_NUMBER}).
                  </p>
                  <div className="p-2 rounded-xl bg-black/40 border border-neutral-800 text-[11px] text-neutral-300 font-mono">
                    Message pré-rempli : "Je veux payer {planName} {finalAmount}F {currentCountry.name} ID: {effectiveUserId}"
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bouton d'action principal */}
            <div className="pt-2">
              {isWave ? (
                <button
                  type="button"
                  id="btn-pay-wave"
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>PAYER {finalAmount.toLocaleString()} FCFA AVEC WAVE BUSINESS</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-pay-whatsapp"
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>CONTINUER SUR WHATSAPP ({ADMIN_PHONE_NUMBER})</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* ÉTAPE 2 : CONFIRMATION PAIEMENT WAVE & SYNCHRONISATION FIREBASE */}
        {step === 'wave_confirm' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg">
              <Zap className="w-7 h-7 fill-current" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white">
                Paiement Wave en cours
              </h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                La page sécurisée Wave Business a été ouverte dans votre navigateur pour régler{' '}
                <strong>{finalAmount.toLocaleString()} FCFA</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-left text-xs space-y-2">
              <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                Détails de mise à jour Firebase Firestore :
              </div>
              <div className="font-mono text-[11px] text-cyan-300 bg-black/60 p-2.5 rounded-xl border border-neutral-800 space-y-1">
                <div>doc(db, "artisans", "{effectiveUserId}") =&gt; &#123;</div>
                <div className="pl-4">abonnement: "{planKey}",</div>
                <div className="pl-4">abonnement_actif: true,</div>
                <div className="pl-4">date_paiement: serverTimestamp(),</div>
                <div className="pl-4">montant: {finalAmount},</div>
                <div className="pl-4">pays: "{currentCountry.name}",</div>
                <div className="pl-4">telephone_admin: "{ADMIN_PHONE_NUMBER}"</div>
                <div>&#125;</div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="btn-confirm-wave-firebase"
                onClick={handleConfirmWavePayment}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SYNCHRONISATION FIREBASE EN COURS...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>J'AI PAYÉ VIA WAVE • ACTIVER MON COMPTE MAINTENANT</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.open(waveUrl, '_blank', 'noopener,noreferrer')}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Rouvrir le lien Wave Business</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer pt-1"
              >
                Changer de pays ou de formule
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : SUCCÈS & ACTIVATION FIRESTORE CONFIRMÉE */}
        {step === 'success' && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                Félicitations !
              </h3>
              <p className="text-sm text-neutral-300 max-w-sm mx-auto">
                Votre abonnement <strong>{planName.toUpperCase()}</strong> est actif sur{' '}
                <strong>Firebase Firestore</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/30 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Statut abonnement : abonnement_actif = true</span>
              </div>
              <p className="text-neutral-400">
                Vous apparaissez désormais en tête de liste dans le <strong>Marketplace ArtisanPro</strong>.
              </p>
              <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                Numéro d'assistance administrative : <strong>{ADMIN_PHONE_NUMBER}</strong>
              </div>
            </div>

            <button
              type="button"
              id="btn-finish-subscription"
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#FF6B00]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ACCÉDER À MON ESPACE ARTISAN PRO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pied de page informatif de confiance */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Sécurisé Firebase & Wave</span>
          </span>
          <span>Admin WhatsApp : {ADMIN_PHONE_NUMBER}</span>
        </div>
      </div>
    </div>
  );
};
