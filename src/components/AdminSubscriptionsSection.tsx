import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  Crown,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Globe,
  RefreshCw,
  Search,
  Receipt,
  RotateCcw,
  Smartphone,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useApp } from '../context/AppContext.tsx';
import type { Subscription, Payment } from '../types.ts';

interface SubscriptionsSummary {
  totalActive: number;
  essentialActive: number;
  proActive: number;
  premiumActive: number;
  expiredCount: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenueFCFA: number;
  byCountry: Record<string, { count: number; revenue: number }>;
  byPaymentMethod: Record<string, { count: number; revenue: number }>;
  subscriptions: Subscription[];
  payments: Payment[];
}

export const AdminSubscriptionsSection: React.FC = () => {
  const { showToast, checkSubscriptionStatus, currentUser } = useApp();
  const [data, setData] = useState<SubscriptionsSummary | null>(null);

  // Liste des 3 super admins fondateurs autorisés
  const superAdmins = [
    'adanmitondejunior07@gmail.com',
    'artisanpro.afrique@gmail.com',
    'contactartisanproafrica@gmail.com',
  ];
  const isSuperAdmin = superAdmins.includes(currentUser?.email?.toLowerCase() || '') || currentUser?.role === 'super_admin';
  const [loading, setLoading] = useState(true);
  const [searchTx, setSearchTx] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdowns' | 'transactions'>('overview');
  const [simulatingTxId, setSimulatingTxId] = useState<string | null>(null);
  const [expiringUserId, setExpiringUserId] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSubscriptionsSummary();
      setData(res);
    } catch (err: any) {
      console.warn('Error loading admin subscriptions summary:', err);
      showToast({
        title: 'Erreur abonnements',
        desc: 'Impossible de charger la synthèse des abonnements.',
        type: 'warning',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSimulateWebhook = async (txId: string) => {
    try {
      setSimulatingTxId(txId);
      const res = await api.simulateCinetPayWebhook(txId);
      if (res?.success) {
        showToast({
          title: 'Webhook Validé ✓',
          desc: `Transaction ${txId} confirmée et compte artisan activé côté serveur.`,
          type: 'success',
        });
        await fetchSummary();
      }
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Échec de la simulation webhook.',
        type: 'warning',
      });
    } finally {
      setSimulatingTxId(null);
    }
  };

  const handleSimulateExpire = async (userId: string) => {
    try {
      setExpiringUserId(userId);
      const res = await api.simulateExpireSubscription(userId);
      if (res?.success) {
        showToast({
          title: 'Abonnement Expiré (Test démo)',
          desc: `L'utilisateur ${userId} a maintenant un abonnement expiré côté serveur.`,
          type: 'info',
        });
        await fetchSummary();
        await checkSubscriptionStatus();
      }
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || "Impossible de marquer l'abonnement comme expiré.",
        type: 'warning',
      });
    } finally {
      setExpiringUserId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-neutral-500 space-y-3 bg-white rounded-3xl border border-neutral-200">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF6B00]" />
        <p className="text-xs font-bold text-neutral-700">Chargement des données abonnements CinetPay...</p>
      </div>
    );
  }

  const {
    totalActive = 0,
    essentialActive = 0,
    proActive = 0,
    premiumActive = 0,
    expiredCount = 0,
    successfulPayments = 0,
    failedPayments = 0,
    totalRevenueFCFA = 0,
    byCountry = {},
    byPaymentMethod = {},
    subscriptions = [],
    payments = [],
  } = data || {};

  const filteredPayments = payments.filter((p) => {
    if (!searchTx.trim()) return true;
    const q = searchTx.toLowerCase();
    return (
      (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
      (p.user_id && p.user_id.toLowerCase().includes(q)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" id="admin-subscriptions-section">
      {/* Header avec action de rafraîchissement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                Gestion des Abonnements CinetPay
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black uppercase">
                Direct Serveur
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Super Admin Fondateurs (adanmitondejunior07@gmail.com, artisanpro.afrique@gmail.com, contactartisanproafrica@gmail.com) • Validation stricte par Webhook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSummary}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS CARDS: Total Actifs, Essentiel, Pro, Premium, Expirés, Revenus */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Actifs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-bold">Total Actifs</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 tracking-tight">{totalActive}</p>
          <p className="text-[10px] text-emerald-600 font-bold">Artisans opérationnels</p>
        </div>

        {/* Essentiel Actifs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-bold">Essentiel</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 tracking-tight">{essentialActive}</p>
          <p className="text-[10px] text-neutral-400">300 FCFA/mois</p>
        </div>

        {/* Pro Actifs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-bold">Pro</span>
            <Zap className="w-3.5 h-3.5 text-[#FF6B00]" />
          </div>
          <p className="text-2xl font-black text-[#FF6B00] tracking-tight">{proActive}</p>
          <p className="text-[10px] text-neutral-400">700 FCFA/mois</p>
        </div>

        {/* Premium Actifs */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-bold">Premium</span>
            <Crown className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 tracking-tight">{premiumActive}</p>
          <p className="text-[10px] text-neutral-400">1 000 FCFA/mois</p>
        </div>

        {/* Expirés */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-bold">Expirés</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 tracking-tight">{expiredCount}</p>
          <p className="text-[10px] text-red-500 font-semibold">Accès pro bloqué</p>
        </div>

        {/* Revenus Abonnements */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-bold">Revenus Totaux</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#FF6B00]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#FF6B00] tracking-tight">
            {totalRevenueFCFA.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-400 font-semibold">FCFA collectés</p>
        </div>
      </div>

      {/* BILAN DES TRANSACTIONS CINETPAY (RÉUSSIS VS ÉCHOUÉS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Paiements Réussis (Success)</p>
              <h4 className="text-xl font-black text-neutral-900">{successfulPayments}</h4>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Confirmés Webhook
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Paiements Échoués / Annulés</p>
              <h4 className="text-xl font-black text-neutral-900">{failedPayments}</h4>
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
            Rejet CinetPay
          </span>
        </div>
      </div>

      {/* REVENTILATION PAR PAYS & PAR MOYEN DE PAIEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAR PAYS */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                Revenus Abonnements par Pays
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-bold">
              {Object.keys(byCountry).length} pays actifs
            </span>
          </div>

          <div className="space-y-2">
            {Object.keys(byCountry).length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">Aucune transaction enregistrée</p>
            ) : (
              Object.entries(byCountry).map(([country, stats]) => (
                <div
                  key={country}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs"
                >
                  <span className="font-bold text-neutral-800">{country}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-500 font-semibold">{stats.count} transaction(s)</span>
                    <span className="font-black text-[#FF6B00]">{stats.revenue.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAR MOYEN DE PAIEMENT */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                Revenus par Moyen de Paiement
              </h3>
            </div>
            <span className="text-xs text-neutral-500 font-bold">
              {Object.keys(byPaymentMethod).length} opérateurs
            </span>
          </div>

          <div className="space-y-2">
            {Object.keys(byPaymentMethod).length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">Aucune transaction enregistrée</p>
            ) : (
              Object.entries(byPaymentMethod).map(([method, stats]) => (
                <div
                  key={method}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs"
                >
                  <span className="font-bold text-neutral-800">{method}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-500 font-semibold">{stats.count} règlement(s)</span>
                    <span className="font-black text-emerald-700">{stats.revenue.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* LISTE DES TRANSACTIONS & ABONNEMENTS */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-neutral-900">
              Journal des Paiements & Abonnements CinetPay ({payments.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Contrôle et validation webhook en temps réel
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chercher référence CinetPay..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Réf Transaction</th>
                <th className="py-3 px-3">User ID</th>
                <th className="py-3 px-3">Montant</th>
                <th className="py-3 px-3">Moyen Paiement</th>
                <th className="py-3 px-3">Fournisseur</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    Aucune transaction trouvée
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isSuccess = p.status === 'completed' || p.status === 'reussi';
                  const isPending = p.status === 'pending' || p.status === 'en_cours';

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                        {p.transaction_id || p.id}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 font-mono text-[11px]">
                        {p.user_id}
                      </td>
                      <td className="py-3 px-3 font-black text-neutral-900">
                        {Number(p.amount).toLocaleString()} {p.currency}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-700">
                        {p.payment_method}
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-600">
                        {p.provider || 'CinetPay'}
                      </td>
                      <td className="py-3 px-3">
                        {isSuccess ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            ✓ Success
                          </span>
                        ) : isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            ⏳ Pending
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isPending && p.transaction_id && (
                          <button
                            type="button"
                            disabled={simulatingTxId === p.transaction_id}
                            onClick={() => handleSimulateWebhook(p.transaction_id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            {simulatingTxId === p.transaction_id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Valider Webhook</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE DES ABONNEMENTS ET GESTION DES EXPIRATIONS (TEST DÉMO) */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="text-base font-black text-neutral-900">
                Liste des Abonnements Souscrits ({subscriptions.length})
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Suivi des formules, dates d'échéance et simulation d'expiration côté serveur
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Formule</th>
                <th className="py-3 px-3">User ID</th>
                <th className="py-3 px-3">Tarif & Durée</th>
                <th className="py-3 px-3">Date Fin / Expiration</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Action Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    Aucun abonnement enregistré
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isActive = sub.status === 'active';
                  const isExpired = sub.status === 'expired' || (sub.end_date && new Date(sub.end_date).getTime() < Date.now());

                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-extrabold uppercase px-2.5 py-1 rounded-lg text-xs bg-neutral-900 text-amber-400">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-600">
                        {sub.user_id}
                      </td>
                      <td className="py-3 px-3 font-bold text-neutral-800">
                        {Number(sub.price).toLocaleString()} {sub.currency} / {sub.billing_period === 'yearly' ? 'an' : 'mois'}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 font-mono text-[11px]">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </td>
                      <td className="py-3 px-3">
                        {isActive && !isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Actif
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                            ✗ Expiré
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            ⏳ En attente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isActive && !isExpired && (
                          <button
                            type="button"
                            id={`btn-expire-${sub.user_id}`}
                            disabled={expiringUserId === sub.user_id}
                            onClick={() => handleSimulateExpire(sub.user_id)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Simule l'expiration côté serveur pour tester le bandeau de renouvellement et le blocage des fonctionnalités"
                          >
                            {expiringUserId === sub.user_id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-red-700" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            )}
                            <span>Simuler Expiration</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
