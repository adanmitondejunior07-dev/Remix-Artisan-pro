import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  Globe,
  Lock,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import type { Transaction } from '../../types.ts';
import { AfricanPhoneInput } from '../AfricanPhoneInput.tsx';
import {
  AFRICAN_PAYMENT_COUNTRIES,
  GLOBAL_CARD_OPERATORS,
  findCountryByCode,
  formatLocalPrice,
  AfricanPaymentCountry,
  AfricanPaymentOperator,
} from '../../data/africanPaymentMethods.ts';

export const PaymentModal: React.FC = () => {
  const { paymentModal, currentArtisan, currentUser, showToast, refreshData, go } = useApp();
  const { isOpen, plan, service, customTitle, customAmount, close } = paymentModal;

  const isMarketplaceOrder = Boolean(service || customTitle);

  // Selected African country (default to Côte d'Ivoire or Bénin or current user country)
  const defaultCountryCode = currentUser?.country?.includes('Bénin')
    ? 'BJ'
    : currentUser?.country?.includes('Sénégal')
    ? 'SN'
    : currentUser?.country?.includes('Burkina')
    ? 'BF'
    : currentUser?.country?.includes('Togo')
    ? 'TG'
    : currentUser?.country?.includes('Ghana')
    ? 'GH'
    : 'CI';

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(defaultCountryCode);
  const activeCountry = findCountryByCode(selectedCountryCode);

  // Selected operator
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [phone, setPhone] = useState<string>(
    currentUser?.phone || currentArtisan?.phone || `${activeCountry.dialCode} `
  );
  const [clientName, setClientName] = useState<string>(currentUser?.name || 'Client Artisan Pro');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [monnizPhone, setMonnizPhone] = useState<string>(currentUser?.phone || '+225');
  const [monnizAmount, setMonnizAmount] = useState<string>('5.000');
  const [showMonnizSuccess, setShowMonnizSuccess] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'waiting' | 'success'>('form');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Set default operator when country changes
  useEffect(() => {
    if (activeCountry.operators.length > 0) {
      setSelectedOperatorId(activeCountry.operators[0].id);
    }
    // Update phone dial code prefix if empty or default
    if (!currentUser?.phone) {
      setPhone(`${activeCountry.dialCode} `);
    }
  }, [selectedCountryCode]);

  if (!isOpen) return null;

  // Base FCFA amount
  const planPrices: Record<string, { price: string; amount: number }> = {
    Free: { price: '0 FCFA', amount: 0 },
    Pro: { price: '5 000 FCFA', amount: 5000 },
    Premium: { price: '10 000 FCFA', amount: 10000 },
  };

  const fcfaAmount = isMarketplaceOrder
    ? service?.priceValue || customAmount || 15000
    : planPrices[plan]?.amount || 5000;

  const localPricing = formatLocalPrice(fcfaAmount, activeCountry);

  // All operators for this country + global cards
  const allAvailableOperators: AfricanPaymentOperator[] = [
    ...activeCountry.operators,
    ...GLOBAL_CARD_OPERATORS,
  ];

  const activeOperator =
    allAvailableOperators.find((op) => op.id === selectedOperatorId) || allAvailableOperators[0];

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isMarketplaceOrder && !currentArtisan) {
      showToast({
        title: 'Aucun profil artisan actif',
        desc: 'Connectez-vous en tant qu’artisan pour souscrire un abonnement.',
        type: 'warning',
      });
      return;
    }

    if (!isMarketplaceOrder && plan === 'Free') {
      setIsProcessing(true);
      try {
        await api.checkoutSubscription({
          artisanId: currentArtisan!.id,
          plan: 'Free',
          paymentMethod: 'Gratuit' as any,
        });
        await refreshData();
        showToast({ title: 'Formule 100% Gratuite activée', type: 'info' });
        close();
      } catch (err: any) {
        showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setStep('waiting');
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const txRef = `TXN-AFR-${Math.floor(100000 + Math.random() * 900000)}`;
        const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        let tx: Transaction;

        if (isMarketplaceOrder) {
          tx = {
            id: txRef,
            artisanId: service?.artisanId || 1,
            artisanName: service?.artisanName || 'Artisan Prestataire',
            plan: 'Pro', // placeholder
            amount: `${localPricing.formatted} (${fcfaAmount.toLocaleString('fr-FR')} FCFA)`,
            currency: activeCountry.currency,
            method: `${activeCountry.flag} ${activeOperator.name}`,
            status: 'reussi',
            date: new Date().toISOString(),
            invoiceNumber: invoiceNum,
            reference: `${service?.title || customTitle} · Protégé par Séquestre`,
          };
        } else {
          const res = await api.checkoutSubscription({
            artisanId: currentArtisan!.id,
            plan,
            paymentMethod: `${activeCountry.flag} ${activeOperator.name}`,
            phoneNumber: phone,
          });
          tx = res.transaction;
        }

        setCompletedTx(tx);
        setStep('success');
        showToast({
          title: 'Paiement Panafricain Réussi !',
          desc: `Transaction de ${localPricing.formatted} via ${activeOperator.name} validée avec succès.`,
          type: 'success',
        });
        await refreshData();
      } catch (err: any) {
        setStep('form');
        showToast({
          title: 'Échec de la transaction',
          desc: err.message || 'Impossible de finaliser le paiement.',
          type: 'warning',
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetAndClose = () => {
    setStep('form');
    setCompletedTx(null);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              🌍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base leading-tight">
                  {isMarketplaceOrder ? 'Paiement Marketplace Sécurisé' : 'Paiement Sécurisé Artisan Pro'}
                </h2>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  20 Pays d'Afrique
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                {isMarketplaceOrder
                  ? `Prestation : ${service?.title || customTitle}`
                  : `Abonnement : Formule ${plan}`}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {step === 'form' && (
            <form onSubmit={handlePay} className="space-y-5">
              {/* Order / Plan Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {isMarketplaceOrder ? 'Commande Marketplace' : 'Abonnement Artisan'}
                  </span>
                  <h3 className="font-black text-neutral-900 text-base leading-tight">
                    {isMarketplaceOrder ? service?.title || customTitle : `Formule ${plan}`}
                  </h3>
                  <p className="text-xs text-neutral-600">
                    {isMarketplaceOrder ? `Prestataire : ${service?.artisanName || 'Artisan certifié'}` : 'Accès illimité sans engagement'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-neutral-900">{localPricing.formatted}</div>
                  {activeCountry.currency !== 'FCFA' && (
                    <div className="text-[11px] font-semibold text-neutral-500">
                      ≈ {fcfaAmount.toLocaleString('fr-FR')} FCFA
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Séquestre garanti</span>
                  </div>
                </div>
              </div>

              {/* Country Selection: 20 AFRICAN COUNTRIES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pays de paiement (20 pays acceptés) *</span>
                  </label>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Devise : <strong>{activeCountry.currency}</strong>
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {AFRICAN_PAYMENT_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency} · {c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Les opérateurs Mobile Money locaux s’adaptent automatiquement au pays sélectionné.
                </p>
              </div>

              {/* Operators Grid for the chosen country */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Opérateurs Mobile Money & Cartes ({activeCountry.name}) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allAvailableOperators.map((op) => {
                    const isSelected = selectedOperatorId === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setSelectedOperatorId(op.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? `${op.bgLight} ${op.borderColor} ring-2 ring-amber-500/30 shadow-xs`
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{op.icon}</span>
                            <span className="font-bold text-xs text-neutral-900">{op.name}</span>
                          </div>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-500 flex items-center justify-between">
                          <span>{op.feeText}</span>
                          {op.ussdCode && <span className="font-mono text-neutral-700 font-bold">{op.ussdCode}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Input depending on operator type */}
              {activeOperator.name.toLowerCase().includes('monniz') ? (
                <div className="space-y-3.5 p-4 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs text-left">
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
              ) : activeOperator.type === 'card' ? (
                <div className="space-y-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                  <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Détails de la Carte Bancaire Panafricaine</span>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Numéro de Carte *</label>
                    <input
                      type="text"
                      required
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Date Expiration *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Code CVV *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span>Numéro de compte {activeOperator.name} *</span>
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">{activeCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={`${activeCountry.dialCode} 00 00 00 00`}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <div className="text-[11px] text-neutral-600 leading-relaxed pt-1">
                    💡 <strong>Instruction :</strong> {activeOperator.instructions}
                  </div>
                </div>
              )}

              {/* Escrow protection statement */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-2.5 text-xs text-neutral-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Paiement Protégé par Séquestre Panafricain :</strong> En cas de non-livraison ou de contestation,
                  notre Service Support intervient et bloque les fonds pour votre sécurité complète.
                </span>
              </div>

              {/* Submit button (only if not Monniz since Monniz has its own blue button) */}
              {!activeOperator.name.toLowerCase().includes('monniz') && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    Payer {localPricing.formatted} via {activeOperator.name}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </form>
          )}

          {/* Pop-up Vert Paiement Monniz Simulé Réussi dans PaymentModal */}
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
                    close();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {step === 'waiting' && (
            <div className="py-12 px-4 text-center space-y-5">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xl">
                  {activeCountry.flag}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-neutral-900">
                  Validation du paiement en cours...
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                  Veuillez consulter votre téléphone ({phone}). Une notification push de{' '}
                  <strong>{activeOperator.name}</strong> va s’afficher pour valider la transaction de{' '}
                  <strong className="text-neutral-900">{localPricing.formatted}</strong>.
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 max-w-xs mx-auto text-xs text-amber-900 font-mono">
                {activeOperator.ussdCode
                  ? `Composant : ${activeOperator.ussdCode} pour autoriser`
                  : 'Autorisation sécurisée en direct...'}
              </div>
            </div>
          )}

          {step === 'success' && completedTx && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-emerald-950">
                  Paiement Confirmé avec Succès !
                </h3>
                <p className="text-xs text-emerald-800">
                  Votre transaction a été validée et enregistrée sur le réseau bancaire et Mobile Money.
                </p>
              </div>

              {/* Pan-African Official Invoice / Receipt */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-bold text-neutral-800">REÇU OFFICIEL PANAFRICAIN</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    PAYÉ & PROTÉGÉ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-neutral-500 text-[10px]">RÉFÉRENCE TRANSACTION</div>
                    <div className="font-bold text-neutral-900">{completedTx.id}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[10px]">FACTURE N°</div>
                    <div className="font-bold text-neutral-900">{completedTx.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[10px]">PAYS & OPÉRATEUR</div>
                    <div className="font-bold text-neutral-900">
                      {activeCountry.flag} {activeCountry.name} · {activeOperator.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[10px]">MONTANT TOTAL</div>
                    <div className="font-bold text-amber-700 text-sm">{completedTx.amount}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 text-[10px] text-neutral-500 flex items-center justify-between">
                  <span>Protocole Séquestre : Garanti par Artisan Pro Afrique</span>
                  <span>{new Date().toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le reçu</span>
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
