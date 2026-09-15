import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { MOBILE_MONEY_OPERATORS, MobileMoneyOperator } from '../utils/walletCalculations.ts';

export interface ClientTransaction {
  id: string;
  type: 'recharge' | 'paiement_artisan' | 'caution';
  title: string;
  amount: number;
  currency: string;
  operator: 'Orange Money' | 'MTN' | 'Moov' | 'Wave' | string;
  date: string;
  status: 'succes' | 'en_attente' | 'echoue';
  artisanName?: string;
  reference?: string;
}

interface PortefeuilleClientProps {
  onUpgradeToArtisan?: () => void;
}

export const PortefeuilleClient: React.FC<PortefeuilleClientProps> = ({ onUpgradeToArtisan }) => {
  const { currentUser, showToast, artisan13kModal } = useApp();

  // Solde client persistant dans localStorage
  const [clientBalance, setClientBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`artisanpro_client_balance_${currentUser?.id || 'default'}`);
        if (stored !== null) return Number(stored);
      } catch (e) {
        console.warn('Error loading client balance:', e);
      }
    }
    return 0; // Défaut : 0 FCFA selon la maquette Flutter
  });

  // Historique des transactions client
  const [transactions, setTransactions] = useState<ClientTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`artisanpro_client_txs_${currentUser?.id || 'default'}`);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.warn('Error loading client txs:', e);
      }
    }
    return [
      {
        id: 'tx-cl-demo-1',
        type: 'recharge',
        title: 'Recharge Mobile Money',
        amount: 25000,
        currency: 'FCFA',
        operator: 'Wave',
        date: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: 'succes',
        reference: 'WAV-849204',
      },
      {
        id: 'tx-cl-demo-2',
        type: 'paiement_artisan',
        title: 'Acompte Travaux Menuiserie',
        amount: 25000,
        currency: 'FCFA',
        operator: 'Orange Money',
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'succes',
        artisanName: 'Kouassi Yao',
        reference: 'OM-390192',
      },
    ];
  });

  // Modal recharge rapide pour Orange Money, MTN, Moov, Wave
  const [activeOperator, setActiveOperator] = useState<MobileMoneyOperator | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState<number>(10000);
  const [rechargePhone, setRechargePhone] = useState<string>(currentUser?.phone || '+225 0700000000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sauvegarde du solde
  const saveClientBalance = (newBalance: number) => {
    setClientBalance(newBalance);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`artisanpro_client_balance_${currentUser?.id || 'default'}`, newBalance.toString());
    }
  };

  // Sauvegarde des transactions
  const saveTransactions = (newTxs: ClientTransaction[]) => {
    setTransactions(newTxs);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`artisanpro_client_txs_${currentUser?.id || 'default'}`, JSON.stringify(newTxs));
    }
  };

  // Gestion du clic sur un des 4 boutons d'opérateur
  const handleSelectOperator = (operator: MobileMoneyOperator) => {
    setActiveOperator(operator);
  };

  // Confirmation de la recharge Mobile Money
  const handleConfirmRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOperator) return;

    if (rechargeAmount < 1000) {
      showToast({
        title: 'Montant trop faible',
        desc: 'Le montant minimum de recharge est de 1 000 FCFA.',
        type: 'warning',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newTx: ClientTransaction = {
        id: `tx-cl-${Date.now()}`,
        type: 'recharge',
        title: `Recharge ${activeOperator.name}`,
        amount: rechargeAmount,
        currency: 'FCFA',
        operator: activeOperator.name,
        date: new Date().toISOString(),
        status: 'succes',
        reference: `${activeOperator.prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      const updatedBalance = clientBalance + rechargeAmount;
      saveClientBalance(updatedBalance);
      saveTransactions([newTx, ...transactions]);

      setIsProcessing(false);
      setActiveOperator(null);

      showToast({
        title: 'Recharge réussie !',
        desc: `Votre solde a été crédité de ${rechargeAmount.toLocaleString('fr-FR')} FCFA via ${activeOperator.name}.`,
        type: 'success',
      });
    }, 900);
  };

  return (
    <div id="ecran-portefeuille-client" className="space-y-6 max-w-2xl mx-auto">
      {/* 2. VISAGE : Écran Portefeuille Client - Structure Exacte Flutter */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200/90 shadow-sm space-y-6">
        {/* Badge & Titre de section */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#FF6B00] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-neutral-900">
                Portefeuille Client
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Paiements sécurisés & Dépôts Mobile Money
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
            Compte Client
          </span>
        </div>

        {/* Cœur du Widget Flutter : Text("Solde disponible") + Text("0 FCFA", 32px bold) */}
        <div className="text-center py-4 px-4 rounded-3xl bg-gradient-to-b from-neutral-50 to-amber-50/30 border border-neutral-200/80 space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 block">
            Solde disponible
          </span>
          <div className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight">
            {clientBalance.toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Utilisez ce solde pour régler les prestations, acomptes et commandes d'artisans certifiés.
          </p>
        </div>

        {/* Row Flutter : Les 4 ElevatedButton (Orange Money, MTN, Moov, Wave) */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 text-center sm:text-left">
            Recharger avec votre opérateur Mobile Money :
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* ElevatedButton 1 : Orange Money */}
            <button
              type="button"
              id="btn-portefeuille-client-orange-money"
              onClick={() => handleSelectOperator(MOBILE_MONEY_OPERATORS[0])}
              className="py-3.5 px-3 rounded-2xl bg-white hover:bg-orange-50 active:bg-orange-100 border-2 border-orange-400 text-neutral-900 font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🟠</span>
              <span className="text-orange-950 font-black">Orange Money</span>
              <span className="text-[10px] text-orange-600 font-semibold">Recharger</span>
            </button>

            {/* ElevatedButton 2 : MTN */}
            <button
              type="button"
              id="btn-portefeuille-client-mtn"
              onClick={() => handleSelectOperator(MOBILE_MONEY_OPERATORS[1])}
              className="py-3.5 px-3 rounded-2xl bg-white hover:bg-yellow-50 active:bg-yellow-100 border-2 border-yellow-400 text-neutral-900 font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🟡</span>
              <span className="text-amber-950 font-black">MTN</span>
              <span className="text-[10px] text-amber-700 font-semibold">Recharger</span>
            </button>

            {/* ElevatedButton 3 : Moov */}
            <button
              type="button"
              id="btn-portefeuille-client-moov"
              onClick={() => handleSelectOperator(MOBILE_MONEY_OPERATORS[2])}
              className="py-3.5 px-3 rounded-2xl bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-blue-400 text-neutral-900 font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🔵</span>
              <span className="text-blue-950 font-black">Moov</span>
              <span className="text-[10px] text-blue-600 font-semibold">Recharger</span>
            </button>

            {/* ElevatedButton 4 : Wave */}
            <button
              type="button"
              id="btn-portefeuille-client-wave"
              onClick={() => handleSelectOperator(MOBILE_MONEY_OPERATORS[3])}
              className="py-3.5 px-3 rounded-2xl bg-white hover:bg-cyan-50 active:bg-cyan-100 border-2 border-cyan-400 text-neutral-900 font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🌊</span>
              <span className="text-cyan-950 font-black">Wave</span>
              <span className="text-[10px] text-cyan-700 font-semibold">Recharger</span>
            </button>
          </div>
        </div>

        {/* Text("Historique des transactions") Flutter */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <h3 className="text-sm sm:text-base font-black text-neutral-900">
              Historique des transactions
            </h3>
            <span className="text-[11px] text-neutral-500 font-semibold">
              {transactions.length} opération{transactions.length > 1 ? 's' : ''}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-500 space-y-2">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-medium">Aucune transaction enregistrée pour le moment.</p>
              <p className="text-[11px] text-neutral-400">
                Cliquez sur un opérateur ci-dessus pour effectuer votre première recharge.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                        tx.type === 'recharge'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {tx.type === 'recharge' ? '↓' : '↑'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="font-semibold text-neutral-700">{tx.operator}</span>
                        <span>•</span>
                        <span>
                          {new Date(tx.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {tx.reference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-neutral-400">{tx.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-black font-mono ${
                        tx.type === 'recharge' ? 'text-emerald-600' : 'text-neutral-900'
                      }`}
                    >
                      {tx.type === 'recharge' ? '+' : '-'}
                      {tx.amount.toLocaleString('fr-FR')} {tx.currency}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      ✓ Réussi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloc Passerelle : Devenir Artisan - 13.000F */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                Vous souhaitez gagner de l'argent avec vos compétences ?
              </h4>
              <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                Les gains et retraits Mobile Money sont débloqués pour les artisans certifiés. Passez en mode artisan pour recevoir des commandes et encaisser 90% du montant de vos prestations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onUpgradeToArtisan) {
                onUpgradeToArtisan();
              } else {
                artisan13kModal.open();
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#cc5500] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Devenir Artisan - 13.000F</span>
            <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded font-normal">
              (10k activation + 3k badge)
            </span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* MODAL INTERACTIVE DE RECHARGE MOBILE MONEY */}
      {activeOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-neutral-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeOperator.iconText}</span>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    Recharge via {activeOperator.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">{activeOperator.feesNotice}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveOperator(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRecharge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Numéro de téléphone {activeOperator.name}
                </label>
                <input
                  type="tel"
                  required
                  value={rechargePhone}
                  onChange={(e) => setRechargePhone(e.target.value)}
                  placeholder="Ex: +225 07 08 09 10 11"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Montant à recharger (FCFA)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Raccourcis de montants */}
              <div className="grid grid-cols-4 gap-1.5">
                {[2000, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      rechargeAmount === amt
                        ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {amt.toLocaleString('fr-FR')} F
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement 100% sécurisé direct vers votre portefeuille client.</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveOperator(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer la recharge</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
