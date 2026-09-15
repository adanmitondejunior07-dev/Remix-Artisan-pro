import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Receipt,
  Download,
  Eye,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import type { Payment, Subscription } from '../types.ts';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal.tsx';

export const MyPaymentHistoryPage: React.FC = () => {
  const { currentUser, go, showToast } = useApp();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Renewal checkout modal state
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPlanKey, setRenewPlanKey] = useState<'essential' | 'pro' | 'premium'>('pro');

  const loadHistory = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [userPayments, userSubs, userStatus] = await Promise.all([
        api.getPaymentsRecords(String(currentUser.id)),
        api.getSubscriptions(String(currentUser.id)),
        api.getUserSubscriptionStatus(String(currentUser.id)),
      ]);

      setPayments(userPayments || []);
      setSubscriptions(userSubs || []);
    } catch (err) {
      console.warn('Error fetching user history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser?.id]);

  // Expiration detection
  const isExpired =
    currentUser?.subscription_status === 'expired' ||
    currentUser?.artisan_status === 'expired' ||
    (currentUser?.subscription_end_date && new Date(currentUser.subscription_end_date).getTime() < Date.now());

  // Masking helper: e.g. "Orange Money (•••• 4408)"
  const formatMaskedPaymentMethod = (method: string, userPhone?: string) => {
    const rawPhone = userPhone || currentUser?.phone || '';
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const lastDigits = cleanDigits.length >= 4 ? cleanDigits.slice(-4) : '4408';

    if (method.toLowerCase().includes('orange')) {
      return `Orange Money (•••• ${lastDigits})`;
    }
    if (method.toLowerCase().includes('mtn')) {
      return `MTN MoMo (•••• ${lastDigits})`;
    }
    if (method.toLowerCase().includes('wave')) {
      return `Wave (•••• ${lastDigits})`;
    }
    if (method.toLowerCase().includes('moov')) {
      return `Moov Money (•••• ${lastDigits})`;
    }
    if (method.toLowerCase().includes('carte') || method.toLowerCase().includes('card')) {
      return `Carte Bancaire (•••• ${lastDigits})`;
    }
    return `${method} (•••• ${lastDigits})`;
  };

  // Date formatting: DD/MM/YYYY
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '12/09/2026';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Find linked subscription name
  const getSubscriptionLabel = (payment: Payment) => {
    if (payment.subscription_id) {
      const sub = subscriptions.find((s) => s.id === payment.subscription_id);
      if (sub) {
        const planName =
          sub.plan === 'premium' ? 'Artisan Premium' : sub.plan === 'pro' ? 'Artisan Pro' : 'Artisan Essentiel';
        const period = sub.billing_period === 'yearly' ? 'Annuel' : 'Mensuel';
        return `${planName} (${period})`;
      }
    }
    return 'Abonnement Artisan Pro';
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'completed' && p.status !== 'completed' && p.status !== 'reussi') return false;
    if (filter === 'pending' && p.status !== 'pending' && p.status !== 'en_cours') return false;
    if (filter === 'failed' && p.status !== 'failed' && p.status !== 'echoue') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const method = (p.payment_method || '').toLowerCase();
      const tx = (p.transaction_id || '').toLowerCase();
      const sub = getSubscriptionLabel(p).toLowerCase();
      return method.includes(q) || tx.includes(q) || sub.includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <button
              type="button"
              onClick={() => go('abonnements')}
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux formules d'abonnements</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  Mon Historique
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Suivi transparent de vos paiements CinetPay et renouvellements d'abonnements
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go('abonnements')}
              className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Voir les formules</span>
            </button>
          </div>
        </div>

        {/* ALERTE STRICTE SI ABONNEMENT EXPIRÉ */}
        {isExpired && (
          <div
            id="alert-subscription-expired"
            className="rounded-3xl p-5 sm:p-6 bg-red-950/40 border-2 border-red-600/60 shadow-xl space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Votre abonnement a expiré</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider font-bold">
                      Suspendu
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                    Vous conservez l'accès à votre compte, mais vos fonctionnalités professionnelles (label Pro, réception de devis prioritaires, affichage en tête d'annuaire) sont temporairement bloquées.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-renew-subscription-expired"
                onClick={() => {
                  setRenewPlanKey(currentUser?.subscription_plan || 'pro');
                  setRenewModalOpen(true);
                }}
                className="self-start sm:self-center px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RENOUVELER MON ABONNEMENT</span>
              </button>
            </div>
          </div>
        )}

        {/* STATUT ACTUEL DU COMPTE */}
        {!isExpired && currentUser?.subscription_status === 'active' && (
          <div className="rounded-2xl p-4 sm:p-5 bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-white text-sm">
                  Abonnement {currentUser.subscription_plan ? currentUser.subscription_plan.toUpperCase() : 'PRO'} Actif ✓
                </p>
                <p className="text-neutral-400 text-[11px]">
                  {currentUser.subscription_end_date
                    ? `Actif jusqu'au ${formatDate(currentUser.subscription_end_date)}`
                    : 'Abonnement officiel validé'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => go('abonnements')}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Changer de formule (Surclassement)
            </button>
          </div>
        )}

        {/* Filtres & Recherche */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tous ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Réussis
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              En attente
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#FF6B00]"
            />
          </div>
        </div>

        {/* LISTE DES PAIEMENTS : Date, abonnement, montant, devise, moyen paiement masqué, statut */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <Clock className="w-6 h-6 animate-spin mx-auto text-[#FF6B00]" />
              <p className="text-xs">Chargement de votre historique officiel...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <Receipt className="w-12 h-12 text-neutral-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Aucun paiement enregistré pour l'instant</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Vos transactions CinetPay et quittances d'abonnements apparaîtront automatiquement ici dès votre première souscription.
                </p>
              </div>
              <button
                type="button"
                onClick={() => go('abonnements')}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Souscrire à une formule</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPayments.map((p) => {
                const isSuccess = p.status === 'completed' || p.status === 'reussi';
                const isPending = p.status === 'pending' || p.status === 'en_cours';
                const isFailed = p.status === 'failed' || p.status === 'echoue';
                const subLabel = getSubscriptionLabel(p);
                const maskedMethod = formatMaskedPaymentMethod(p.payment_method);

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-neutral-900/90 border border-neutral-800/90 hover:border-neutral-700 p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isPending ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-white">
                            {formatDate(p.id)}
                          </span>
                          <span className="text-xs text-neutral-500">•</span>
                          <span className="text-xs font-bold text-[#FF6B00]">
                            {subLabel}
                          </span>
                          <span className="text-xs text-neutral-500">•</span>
                          <span className="text-xs font-mono text-neutral-300">
                            {maskedMethod}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-mono">
                          Réf : {p.transaction_id || p.id} • Fournisseur : {p.provider || 'CinetPay'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-neutral-800/80 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-white tracking-tight">
                          {Number(p.amount).toLocaleString()} {p.currency || 'FCFA'}
                        </div>
                        <div className="text-[11px]">
                          {isSuccess ? (
                            <span className="font-bold text-emerald-400 flex items-center gap-1 sm:justify-end">
                              <span>✓ Réussi</span>
                            </span>
                          ) : isPending ? (
                            <span className="font-bold text-amber-400 flex items-center gap-1 sm:justify-end">
                              <span>⏳ En attente CinetPay</span>
                            </span>
                          ) : (
                            <span className="font-bold text-red-400 flex items-center gap-1 sm:justify-end">
                              <span>✗ Échoué</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Télécharger / Voir Reçu */}
                      <button
                        type="button"
                        onClick={() => {
                          showToast({
                            title: 'Reçu officiel CinetPay',
                            desc: `Réf: ${p.transaction_id || p.id} - ${Number(p.amount).toLocaleString()} FCFA validé.`,
                            type: 'info',
                          });
                        }}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Détails du reçu"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de renouvellement / paiement */}
      {renewModalOpen && (
        <SubscriptionCheckoutModal
          isOpen={renewModalOpen}
          onClose={() => {
            setRenewModalOpen(false);
            loadHistory();
          }}
          planKey={renewPlanKey}
          planName={renewPlanKey.toUpperCase()}
          billingPeriod="monthly"
          price={renewPlanKey === 'premium' ? 1000 : renewPlanKey === 'pro' ? 700 : 300}
          onSuccess={() => {
            loadHistory();
          }}
        />
      )}
    </div>
  );
};
