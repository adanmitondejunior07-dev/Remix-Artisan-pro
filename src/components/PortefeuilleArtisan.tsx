import React, { useState } from 'react';
import {
  Wallet,
  Send,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  HelpCircle,
  Sparkles,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { calculerGains, calculerCommissionPlateforme, decomposerGains } from '../utils/walletCalculations.ts';

interface PortefeuilleArtisanProps {
  solde?: number;
  onOpenWithdrawalModal?: () => void;
}

export const PortefeuilleArtisan: React.FC<PortefeuilleArtisanProps> = ({
  solde: propSolde,
  onOpenWithdrawalModal,
}) => {
  const {
    currentUser,
    walletBalance,
    requestWithdrawal,
    withdrawals,
    showToast,
  } = useApp();

  // 1. CERVEAU : Calcul de l'argent avec calculerGains()
  // Si un solde brut est fourni en props, on l'utilise, sinon le solde du portefeuille ou 150000 FCFA de démonstration
  const soldeActuel = propSolde !== undefined ? propSolde : (walletBalance > 0 ? walletBalance : 150000);
  
  // double gain = calculerGains(solde);
  const gain = calculerGains(soldeActuel);
  const commission = calculerCommissionPlateforme(soldeActuel);

  // État pour le formulaire de retrait intégré
  const [showWithdrawForm, setShowWithdrawForm] = useState<boolean>(false);
  const [withdrawOperator, setWithdrawOperator] = useState<string>('Wave');
  const [withdrawPhone, setWithdrawPhone] = useState<string>(currentUser?.phone || '+225 0700000000');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>('');

  // Simulateur interactif de gains (pour tester n'importe quel montant de prestation)
  const [simulatedVente, setSimulatedVente] = useState<number>(50000);
  const simulatedBreakdown = decomposerGains(simulatedVente);

  // Historique des prestations de l'artisan
  const prestationsExemples = [
    {
      id: 'prest-1',
      client: 'Mme Bamba Awa',
      service: 'Rénovation Salon & Pose Placards',
      date: '2026-09-11',
      montantBrut: 100000,
    },
    {
      id: 'prest-2',
      client: 'M. Touré Ibrahim',
      service: 'Installation Électrique Complète',
      date: '2026-09-08',
      montantBrut: 50000,
    },
  ];

  // Soumission du retrait
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    if (withdrawAmount < 5000) {
      setWithdrawError('Le montant minimum de retrait est de 5 000 FCFA.');
      return;
    }

    if (gain < withdrawAmount && walletBalance < withdrawAmount) {
      setWithdrawError('Gains insuffisants pour effectuer ce retrait.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal({
        operator: (withdrawOperator === 'MTN Mobile Money' ? 'MTN Mobile Money' : withdrawOperator === 'Moov Money' ? 'Moov Money' : withdrawOperator === 'Orange Money' ? 'Orange Money' : 'Wave') as any,
        amount: withdrawAmount,
        phone: withdrawPhone,
      });

      showToast({
        title: 'Demande de retrait enregistrée !',
        desc: `Votre demande de ${withdrawAmount.toLocaleString('fr-FR')} FCFA via ${withdrawOperator} est en cours de traitement.`,
        type: 'success',
      });

      setShowWithdrawForm(false);
    } catch (err: any) {
      setWithdrawError(err.message || 'Erreur lors de la demande de retrait');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="ecran-portefeuille-artisan" className="space-y-6 max-w-2xl mx-auto">
      {/* 3. VISAGE : Écran Portefeuille Artisan - Structure Exacte Flutter */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-neutral-200/90 shadow-sm space-y-6">
        {/* En-tête avec rôle */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-neutral-900">
                Portefeuille Artisan
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                Rémunération transparente : 90% pour vous, 10% pour la plateforme
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
            Artisan Partenaire
          </span>
        </div>

        {/* Cœur du Widget Flutter : Text("Gains disponibles") + Text("$gain FCFA") */}
        <div className="text-center py-6 px-4 rounded-3xl bg-neutral-950 text-white border-2 border-neutral-800 shadow-xl relative overflow-hidden space-y-3">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 block">
              Gains disponibles
            </span>
            <div className="text-4xl sm:text-5xl font-black text-[#FF6B00] tracking-tight">
              {gain.toLocaleString('fr-FR')} FCFA
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-300">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ✓ 90% net garanti
              </span>
              <span>•</span>
              <span className="text-neutral-400">
                Chiffre d'affaires brut : {soldeActuel.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* ElevatedButton Flutter : Text("Retirer") avec limeGreen #7AC74F */}
          <div className="relative z-10 pt-2">
            <button
              type="button"
              id="btn-portefeuille-artisan-retirer"
              onClick={() => {
                if (onOpenWithdrawalModal) {
                  onOpenWithdrawalModal();
                } else {
                  setShowWithdrawForm((prev) => !prev);
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#7AC74F] hover:bg-[#6BB343] active:bg-[#5FA33A] text-[#212121] font-black text-sm sm:text-base shadow-lg shadow-[#7AC74F]/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#212121]" />
              <span>Retirer</span>
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded-md font-bold text-neutral-900">
                (Dès 5 000 FCFA)
              </span>
            </button>
          </div>
        </div>

        {/* Formulaire de Retrait déroulant lors du clic sur "Retirer" */}
        {showWithdrawForm && (
          <div className="p-5 rounded-2xl bg-neutral-50 border-2 border-[#FF6B00]/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FF6B00]" />
                <span>Demande de retrait Mobile Money</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowWithdrawForm(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 font-bold"
              >
                Fermer
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Moyen de retrait
                  </label>
                  <select
                    value={withdrawOperator}
                    onChange={(e) => setWithdrawOperator(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 bg-white"
                  >
                    <option value="Wave">🌊 Wave (1%)</option>
                    <option value="Orange Money">🟠 Orange Money</option>
                    <option value="MTN Mobile Money">🟡 MTN Mobile Money</option>
                    <option value="Moov Money">🔵 Moov Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Numéro de retrait
                  </label>
                  <input
                    type="tel"
                    required
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="Ex: +225 07 08 09 10 11"
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Montant (Min. 5 000 F)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    step={1000}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Traitement...' : 'Confirmer le retrait immédiat'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Text("Détails des gains") Flutter */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="text-sm sm:text-base font-black text-neutral-900">
                Détails des gains
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Règle 90% Artisan / 10% Plateforme
            </span>
          </div>

          {/* Grille 3 blocs : Montant Brut, Commission Plateforme 10%, Gain Net 90% */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Montant Brut */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Ventes Brutes (100%)
              </span>
              <div className="text-xl font-black text-neutral-900">
                {soldeActuel.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-[10px] text-neutral-500">
                Total des prestations facturées
              </p>
            </div>

            {/* Commission 10% */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Commission Plateforme (10%)
              </span>
              <div className="text-xl font-black text-amber-900">
                -{commission.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-[10px] text-amber-800">
                Frais de service & hébergement
              </p>
            </div>

            {/* Gain Net 90% */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                Votre Gain Net (90%)
              </span>
              <div className="text-xl font-black text-emerald-900">
                +{gain.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-[10px] text-emerald-700 font-semibold">
                Directement retirable sur Mobile Money
              </p>
            </div>
          </div>

          {/* Tableau détaillé des prestations récentes avec la formule 90/10 appliquée */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center justify-between">
              <span>Prestations & Décomposition des gains</span>
              <span>Net à percevoir</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {prestationsExemples.map((p) => {
                const b = decomposerGains(p.montantBrut);
                return (
                  <div key={p.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-neutral-900">
                        {p.service}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Client : <span className="font-semibold text-neutral-700">{p.client}</span> • {p.date}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Brut : {b.montantVente.toLocaleString('fr-FR')} F | Commission 10% : -{b.commissionPlateforme.toLocaleString('fr-FR')} F
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                        +{b.gainArtisan.toLocaleString('fr-FR')} FCFA
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        ✓ 90% Net
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIMULATEUR INTERACTIF DU CERVEAU : calculerGains(montantVente) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 text-white border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Simulateur de gains en direct
                </span>
              </div>
              <span className="text-[10px] text-[#FF6B00] font-mono font-bold">
                calculerGains(montant)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span>Montant d'une vente / chantier :</span>
                <span className="font-bold text-white font-mono">
                  {simulatedVente.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={simulatedVente}
                onChange={(e) => setSimulatedVente(Number(e.target.value))}
                className="w-full accent-[#FF6B00] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>10 000 F</span>
                <span>250 000 F</span>
                <span>500 000 F</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="text-[10px] text-neutral-400">Commission (10%)</div>
                <div className="font-mono font-bold text-amber-400 mt-0.5">
                  {simulatedBreakdown.commissionPlateforme.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
                <div className="text-[10px] text-emerald-400">Gain Artisan (90%)</div>
                <div className="font-mono font-black text-emerald-300 mt-0.5">
                  {simulatedBreakdown.gainArtisan.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
