import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import {
  launchCinetPay13kCheckout,
  CINETPAY_13K_DESCRIPTION,
} from '../../services/cinetpay.ts';
import { formatTelephone } from '../../utils/phoneUtils.ts';
import { AfricanPhoneInput } from '../AfricanPhoneInput.tsx';

interface Artisan13kPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Artisan13kPaymentModal: React.FC<Artisan13kPaymentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, upgradeClientToArtisan, showToast } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'cinetpay' | 'wave' | 'monniz'>('cinetpay');
  const [waveNumber, setWaveNumber] = useState(currentUser?.phone || '');
  const [waveTxId, setWaveTxId] = useState('');
  const [monnizPhone, setMonnizPhone] = useState(currentUser?.phone || '+225');
  const [monnizAmount, setMonnizAmount] = useState('5.000');
  const [showMonnizSuccess, setShowMonnizSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const clientEmail = currentUser?.email || 'votre email';
  const customDescription = `Activation ArtisanPro Africa - Paiement 13.000F (10k activation + 3k badge vérifié) pour devenir artisan - pour ${clientEmail}`;

  // 1. Paiement CinetPay Seamless officiel (Mode PRODUCTION)
  const handleCinetPay = async () => {
    setIsProcessing(true);
    try {
      await launchCinetPay13kCheckout({
        amount: 13000,
        currency: 'XOF',
        description: customDescription,
        customerName: currentUser?.name || 'Artisan Pro',
        customerEmail: currentUser?.email || 'artisan@artisanpro.africa',
        customerPhone: waveNumber || currentUser?.phone || '0503444508',
        customerCity: currentUser?.city || 'Abidjan',
        customerCountry: 'CI',
        onSuccess: async (txId) => {
          setIsProcessing(false);
          onClose();
          await upgradeClientToArtisan(txId, 'CinetPay (Production)');
        },
        onError: (err) => {
          setIsProcessing(false);
          showToast({
            title: 'Échec du paiement',
            desc: err.message || 'Le paiement n’a pas pu aboutir. Essayez par Wave direct.',
            type: 'warning',
          });
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      // Fallback vers l'onglet Wave en cas de blocage de script tiers
      setPaymentMethod('wave');
      showToast({
        title: 'Passerelle Mobile Money',
        desc: 'Vous pouvez également finaliser votre paiement directement via Wave au +225 0503444508.',
        type: 'info',
      });
    }
  };

  // 2. Envoi de preuve sur WhatsApp
  const handleSendWhatsApp = () => {
    const msg = `Salut ArtisanPro, j'ai payé 13.000F pour devenir artisan. Mon numéro Wave: ${waveNumber || currentUser?.phone || ''}, ID Wave: ${waveTxId || 'En cours'}, Email: ${currentUser?.email || ''}`;
    window.open(`https://wa.me/2250503444508?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 3. Validation Wave et activation instantanée
  const handleValidateWave = async () => {
    const checkTel = formatTelephone(waveNumber);
    if (!checkTel.ok) {
      alert(checkTel.msg || 'Format de téléphone incorrect');
      showToast({
        title: 'Numéro invalide',
        desc: checkTel.msg || 'Format de téléphone incorrect',
        type: 'warning',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const generatedTxId = waveTxId.trim() || `WAVE-${Date.now()}`;
      onClose();
      await upgradeClientToArtisan(generatedTxId, 'Wave');
    } catch (e: any) {
      showToast({
        title: 'Erreur',
        desc: e.message || 'Impossible de finaliser l’activation.',
        type: 'warning',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 text-white flex items-center justify-between relative border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Devenir Artisan Payant
              </h2>
              <p className="text-[11px] text-amber-300 font-medium">
                Paiement unique · 10 000F activation + 3 000F badge vérifié
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Tarification & Objet du paiement */}
          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Montant Total Requis
              </span>
              <span className="text-2xl font-black text-[#FF6B00]">
                13 000 FCFA
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-neutral-700">
              <div className="flex items-center justify-between">
                <span>• Frais d'activation plateforme</span>
                <span className="font-bold">10 000 FCFA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Badge vérifié officiel de conformité</span>
                <span className="font-bold">3 000 FCFA</span>
              </div>
              <div className="pt-2 text-[11px] text-neutral-500 italic">
                Objet : {customDescription}
              </div>
            </div>
          </div>

          {/* Sélecteur de méthode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Choisissez votre méthode de paiement :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cinetpay')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'cinetpay'
                    ? 'border-[#FF6B00] bg-orange-50/50 shadow-sm ring-2 ring-[#FF6B00]/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="font-extrabold text-xs text-neutral-900 flex items-center justify-between">
                  <span>CinetPay Direct</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    PROD
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Orange, MTN, Wave
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'wave'
                    ? 'border-[#FF6B00] bg-orange-50/50 shadow-sm ring-2 ring-[#FF6B00]/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="font-extrabold text-xs text-neutral-900 flex items-center justify-between">
                  <span>Wave CI</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                    Direct
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  0503444508
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('monniz')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'monniz'
                    ? 'border-[#0066FF] bg-blue-50/80 shadow-sm ring-2 ring-[#0066FF]/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="font-extrabold text-xs text-neutral-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#0066FF] text-white font-black text-[10px] flex items-center justify-center">
                      M
                    </span>
                    <span>Monniz</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    Démo
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Simulation sans API
                </div>
              </button>
            </div>
          </div>

          {/* Détails Monniz */}
          {paymentMethod === 'monniz' && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#0066FF] text-white flex items-center justify-center font-black text-xs">
                  M
                </div>
                <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                  Paiement Monniz Démo (Sans API)
                </span>
              </div>

              {/* Champ: Numéro Monniz (avec paysSelect +225 déjà en place) */}
              <AfricanPhoneInput
                id="telInput"
                label="Numéro Monniz"
                value={monnizPhone}
                onChange={(full) => setMonnizPhone(full)}
                placeholder="0503444508"
              />

              {/* Champ: Montant à payer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Montant à payer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={monnizAmount}
                    onChange={(e) => setMonnizAmount(e.target.value)}
                    placeholder="5.000 FCFA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900 focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-xs"
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
                  setShowMonnizSuccess(true);
                  showToast({
                    title: 'Paiement Monniz réussi',
                    desc: '✅ Paiement Monniz simulé réussi - 5.000 FCFA envoyé au 0503444508',
                    type: 'success',
                  });
                }}
                className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black shadow-md shadow-[#0066FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Confirmer paiement Monniz</span>
              </button>
            </div>
          )}

          {/* Pop-up Vert Paiement Monniz Simulé Réussi dans Artisan13kPaymentModal */}
          {showMonnizSuccess && (
            <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-150">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
                  ✅
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wide">
                    <span>Simulation Démo Réussie</span>
                  </div>
                  <h4 className="text-base font-black text-emerald-950 leading-snug">
                    ✅ Paiement Monniz simulé réussi - 5.000 FCFA envoyé au 0503444508
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Mode démo sans API validé avec succès.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMonnizSuccess(false);
                    onClose();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* Détails CinetPay */}
          {paymentMethod === 'cinetpay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Guichet Panafricain Sécurisé CinetPay</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Valable dans toute l'Afrique de l'Ouest (Côte d'Ivoire, Bénin, Sénégal, Mali, Togo, Burkina). Paiement instantané par Mobile Money (Orange, MTN, Moov, Wave) et Cartes bancaires.
                </p>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCinetPay}
                style={{ backgroundColor: '#FF6B00' }}
                className="w-full py-4 px-6 rounded-2xl text-white font-black text-sm shadow-lg shadow-[#FF6B00]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Lancement du paiement CinetPay...</span>
                ) : (
                  <>
                    <span>Payer 13.000 FCFA avec CinetPay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Détails Wave Direct */}
          {paymentMethod === 'wave' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-950 space-y-2">
                <div className="font-black text-sm text-cyan-900">
                  Numéro Wave Récepteur : <span className="font-mono text-base text-[#FF6B00]">05 03 44 45 08</span>
                </div>
                <p className="text-[11px] text-cyan-800">
                  Ouvrez votre application Wave et effectuez un transfert de <strong>13 000 FCFA</strong> vers le <strong>05 03 44 45 08</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <AfricanPhoneInput
                    id="telInput"
                    label="Numéro de téléphone (Afrique)"
                    value={waveNumber}
                    onChange={(fullNumber) => setWaveNumber(fullNumber)}
                    placeholder="0503444508"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 -mt-2 mb-2 block">
                    Format CI (+225) : 0503444508 ou +2250503444508
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    ID de transaction Wave (reçu Wave) :
                  </label>
                  <input
                    type="text"
                    value={waveTxId}
                    onChange={(e) => setWaveTxId(e.target.value)}
                    placeholder="Ex: TX-984321..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer preuve WhatsApp (+225 0503444508)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleValidateWave}
                  style={{ backgroundColor: '#FF6B00' }}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-black text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider mon paiement (13.000F)</span>
                </button>
              </div>
            </div>
          )}

          {/* Engagement de conversion sans perte de compte */}
          <div className="p-3 bg-neutral-100 rounded-xl text-[11px] text-neutral-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Votre compte actuel (<strong>{clientEmail}</strong>) est conservé et transformé directement en compte artisan vérifié sans créer de doublon.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
