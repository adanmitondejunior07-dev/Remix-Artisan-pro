import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Info,
  Clock,
  ArrowLeft,
  CheckCircle2,
  X,
  RotateCcw,
  AlertTriangle,
  History,
  MessageCircle,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal.tsx';
import {
  COUNTRIES_CONFIG,
  AfricanCountryCode,
  isWaveCountry,
  ADMIN_PHONE_NUMBER,
  ADMIN_WHATSAPP_NUMBER,
} from '../services/paymentService.ts';

type BillingPeriod = 'monthly' | 'yearly';
type PlanKey = 'essential' | 'pro' | 'premium';

interface PlanDetail {
  key: PlanKey;
  name: string;
  badge?: string;
  isPopular?: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyDisplay: string;
  yearlyDisplay: string;
  description: string;
  features: string[];
}

const PLANS: PlanDetail[] = [
  {
    key: 'essential',
    name: 'ESSENTIEL',
    monthlyPrice: 425,
    yearlyPrice: 4700,
    monthlyDisplay: '425 FCFA',
    yearlyDisplay: '4 700 FCFA',
    description: 'La solution idéale pour démarrer et rendre vos services visibles auprès des clients locaux.',
    features: [
      'Visibilité dans l’annuaire officiel des artisans',
      'Réception directe des demandes de devis clients',
      'Messagerie instantanée & contact client',
      'Fiche profil personnalisée & géolocalisation',
      'Accès au support d’assistance standard',
    ],
  },
  {
    key: 'pro',
    name: 'PRO',
    badge: 'RECOMMANDÉ',
    isPopular: true,
    monthlyPrice: 900,
    yearlyPrice: 9200,
    monthlyDisplay: '900 FCFA',
    yearlyDisplay: '9 200 FCFA',
    description: 'Pour les professionnels voulant démultiplier leurs chantiers et obtenir le label vérifié.',
    features: [
      'Tous les avantages de la formule ESSENTIEL',
      'Badge Pro Certifié officiel sur votre profil',
      'Positionnement prioritaire dans les résultats de recherche',
      'Publication d’annonces sur la Marketplace ArtisanPro',
      'Statistiques de visites et demandes reçues',
      'Référencement élargi sur votre ville et commune',
    ],
  },
  {
    key: 'premium',
    name: 'PREMIUM',
    badge: 'VIP ÉLITE',
    monthlyPrice: 1200,
    yearlyPrice: 14325,
    monthlyDisplay: '1 200 FCFA',
    yearlyDisplay: '14 325 FCFA',
    description: 'Visibilité maximale et accompagnement d’élite pour dominer votre secteur d’activité.',
    features: [
      'Tous les avantages de la formule PRO',
      'Badge Premium Gold officiel & statut Artisan VIP',
      'Visibilité maximale en tête de liste et vitrine d’accueil',
      'Publications et réalisations illimitées sur la plateforme',
      'Accès prioritaire aux chantiers d’envergure',
      'Assistance dédiée 24h/24 & ligne directe d’accompagnement',
    ],
  },
];

export const ArtisanProSubscriptionsPage: React.FC = () => {
  const { currentUser, go, showToast } = useApp();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Sélecteur de pays avec drapeaux (CI, SN, ML, BF, BJ, TG, CM, OTHER)
  const [selectedCountry, setSelectedCountry] = useState<AfricanCountryCode>(() => {
    if (currentUser?.country) {
      const c = currentUser.country.toLowerCase();
      if (c.includes('ivoire') || c.includes('ivory')) return 'CI';
      if (c.includes('sénégal') || c.includes('senegal')) return 'SN';
      if (c.includes('mali')) return 'ML';
      if (c.includes('burkina')) return 'BF';
      if (c.includes('bénin') || c.includes('benin')) return 'BJ';
      if (c.includes('togo')) return 'TG';
      if (c.includes('cameroun') || c.includes('cameroon')) return 'CM';
    }
    return 'CI';
  });

  // Liste des 3 super admins fondateurs autorisés
  const superAdmins = [
    'adanmitondejunior07@gmail.com',
    'artisanpro.afrique@gmail.com',
    'contactartisanproafrica@gmail.com',
  ];
  const isSuperAdmin =
    superAdmins.includes(currentUser?.email?.toLowerCase() || '') ||
    currentUser?.role === 'super_admin';

  // Expiration detection
  const isExpired =
    currentUser?.subscription_status === 'expired' ||
    currentUser?.artisan_status === 'expired';
  const currentPlan = currentUser?.subscription_plan;
  const isActiveArtisan = currentUser?.subscription_status === 'active';

  const handleChoosePlan = async (plan: PlanDetail) => {
    setSelectedPlan(plan);
    setShowModal(true);

    // Save pending subscription in database if user is logged in
    if (currentUser?.id) {
      try {
        setIsRegistering(true);
        const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        await api.createSubscription({
          user_id: String(currentUser.id),
          plan: plan.key,
          price,
          currency: 'XOF',
          billing_period: billingPeriod,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Subscription registered locally:', err);
      } finally {
        setIsRegistering(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <button
              type="button"
              onClick={() => go('home')}
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'accueil</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  Abonnements ArtisanPro
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Formules transparentes adaptées à chaque étape de votre croissance artisanale en Afrique
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions: Mon Historique & Gains */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isSuperAdmin && (
              <button
                type="button"
                id="btn-nav-admin-sub"
                onClick={() => go('admin')}
                className="px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white text-xs font-black shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                title="Accéder au Tableau de Bord Super Admin CinetPay"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gestion Admin CinetPay</span>
              </button>
            )}
            <button
              type="button"
              id="btn-nav-history"
              onClick={() => go('mon-historique')}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold border border-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Mon Historique</span>
            </button>
            <button
              type="button"
              onClick={() => go('subscription')}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold border border-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Gains & Retraits</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
            </button>
          </div>
        </div>

        {/* ALERTE SI ABONNEMENT EXPIRÉ */}
        {isExpired && (
          <div
            id="banner-subscription-expired"
            className="rounded-3xl p-5 sm:p-6 bg-red-950/40 border-2 border-red-600/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Votre abonnement a expiré</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider font-bold">
                    Suspendu
                  </span>
                </h3>
                <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
                  L'accès à votre compte est conservé, mais vos privilèges professionnels sont temporairement bloqués. Renouvelez votre abonnement pour reprendre vos activités.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-renew-artisan-banner"
              onClick={() => {
                const p = PLANS.find((pl) => pl.key === (currentPlan || 'pro')) || PLANS[1];
                handleChoosePlan(p);
              }}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RENOUVELER MON ABONNEMENT</span>
            </button>
          </div>
        )}

        {/* Sélecteur de pays avec drapeaux (CI, SN, ML, BF, BJ, TG, CM, OTHER) */}
        <div className="rounded-3xl p-5 sm:p-6 bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>🌍</span>
                <span>SÉLECTEUR DE PAYS & MODE DE PAIEMENT</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Choisissez votre pays de résidence pour afficher le moyen de paiement automatique adapté
              </p>
            </div>
            <div className="text-xs font-bold text-neutral-300 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 self-start sm:self-auto flex items-center gap-1.5">
              <span>Admin WhatsApp :</span>
              <span className="text-[#FF6B00] font-black">{ADMIN_PHONE_NUMBER}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {(Object.keys(COUNTRIES_CONFIG) as AfricanCountryCode[]).map((code) => {
              const country = COUNTRIES_CONFIG[code];
              const isSelected = selectedCountry === code;
              const isWave = country.paymentMode === 'wave';
              return (
                <button
                  key={code}
                  type="button"
                  id={`country-select-${code.toLowerCase()}`}
                  onClick={() => setSelectedCountry(code)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? isWave
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40'
                        : 'bg-emerald-950/40 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                      : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <span className="text-2xl leading-none">{country.flag}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black tracking-wide">{country.code}</span>
                    <span className="text-[10px] text-neutral-400 truncate max-w-[80px]">
                      {country.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isWave
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isWave ? 'Wave' : 'WhatsApp'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bandeau d'explication dynamique du mode de paiement */}
          {isWaveCountry(selectedCountry) ? (
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs text-cyan-200">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌊</span>
                <div>
                  <div className="font-black text-cyan-300 uppercase tracking-wide">
                    Paiement Wave Business instantané ({COUNTRIES_CONFIG[selectedCountry].flag} {COUNTRIES_CONFIG[selectedCountry].name})
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    Moyens de paiement officiels Kkiapay, Wave & Mobile Money (425F, 900F, 1200F / mois ou 4700F, 9200F, 14325F / an).
                    Synchronisation automatique de votre abonnement et validation instantanée.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-[11px] font-bold shrink-0 hidden sm:inline-block">
                Wave Direct
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💬</span>
                <div>
                  <div className="font-black text-emerald-300 uppercase tracking-wide">
                    Redirection WhatsApp Administrateur ({COUNTRIES_CONFIG[selectedCountry].flag} {COUNTRIES_CONFIG[selectedCountry].name})
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    Pour {COUNTRIES_CONFIG[selectedCountry].name}, redirection directe sur WhatsApp au{' '}
                    <strong>{ADMIN_PHONE_NUMBER}</strong> ({ADMIN_WHATSAPP_NUMBER}) avec message officiel pré-rempli.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold shrink-0 hidden sm:inline-block">
                WhatsApp Admin
              </span>
            </div>
          )}
        </div>

        {/* Sélecteur de période de facturation [MENSUEL] [ANNUEL] */}
        <div className="flex flex-col items-center justify-center space-y-3 pt-2">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-inner">
            <button
              type="button"
              id="btn-billing-monthly"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              MENSUEL
            </button>
            <button
              type="button"
              id="btn-billing-yearly"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>ANNUEL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Économie
              </span>
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            {billingPeriod === 'yearly'
              ? 'Tarif préférentiel facturé en une seule fois par an'
              : 'Facturation mensuelle sans engagement de longue durée'}
          </p>
        </div>

        {/* 3 Cartes de formule */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {PLANS.map((plan) => {
            const isPro = plan.key === 'pro';
            const priceDisplay = billingPeriod === 'monthly' ? plan.monthlyDisplay : plan.yearlyDisplay;
            const periodSuffix = billingPeriod === 'monthly' ? '/ mois' : '/ an';

            const isCurrentActivePlan = !isExpired && isActiveArtisan && currentPlan === plan.key;
            const canUpgrade =
              !isExpired &&
              isActiveArtisan &&
              ((currentPlan === 'essential' && (plan.key === 'pro' || plan.key === 'premium')) ||
                (currentPlan === 'pro' && plan.key === 'premium'));

            return (
              <div
                key={plan.key}
                id={`card-plan-${plan.key}`}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                  isCurrentActivePlan
                    ? 'bg-neutral-900 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10'
                    : isPro
                    ? 'bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-[#FF6B00] shadow-2xl shadow-[#FF6B00]/10 scale-[1.02]'
                    : 'bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Badge Recommandé ou Actuel */}
                {isCurrentActivePlan ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Formule Actuelle</span>
                  </div>
                ) : plan.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF6B00] text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-amber-300/40">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{plan.badge}</span>
                  </div>
                ) : null}

                <div className="space-y-5">
                  {/* Plan Name & Icon */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {plan.description}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        plan.key === 'premium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isPro
                          ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {plan.key === 'premium' ? (
                        <Crown className="w-5 h-5" />
                      ) : isPro ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="py-2 border-y border-neutral-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {priceDisplay}
                      </span>
                      <span className="text-xs font-semibold text-neutral-400">
                        {periodSuffix}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {billingPeriod === 'monthly'
                        ? `Option annuelle disponible à ${plan.yearlyDisplay}/an`
                        : `Équivalent à environ ${Math.round(plan.yearlyPrice / 12)} FCFA/mois`}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Inclus dans cette formule :
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bouton de choix & Surclassement */}
                <div className="pt-6 mt-6 border-t border-neutral-800/80">
                  {isCurrentActivePlan ? (
                    <div className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>VOTRE FORMULE ACTUELLE</span>
                    </div>
                  ) : canUpgrade ? (
                    <button
                      type="button"
                      id={`btn-upgrade-${plan.key}`}
                      onClick={() => handleChoosePlan(plan)}
                      className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-[#e05e00] hover:to-amber-600 text-white shadow-lg shadow-[#FF6B00]/25 hover:scale-[1.02]"
                    >
                      <span>SURCLASSER EN {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      id={`btn-choose-${plan.key}`}
                      onClick={() => handleChoosePlan(plan)}
                      className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-[#FF6B00] hover:from-amber-600 hover:to-[#e05e00] text-white shadow-lg shadow-amber-500/25 hover:scale-[1.02]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>CHOISIR CETTE FORMULE ({priceDisplay})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note informative de sécurité & devises */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-neutral-400">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="font-bold text-neutral-200">
              Paiements Automatiques Wave & WhatsApp direct • Monnaie : Franc CFA (XOF)
            </p>
            <p>
              Côte d'Ivoire, Sénégal, Mali, Burkina Faso : règlements sécurisés Wave Business avec activation instantanée sur Firebase Firestore.
              Bénin, Togo, Cameroun & Autres : validation directe avec l'administrateur au {ADMIN_PHONE_NUMBER}.
            </p>
          </div>
        </div>

        {/* Encadré Officiel : CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO */}
        <div className="rounded-3xl bg-neutral-900/90 border-2 border-amber-500/50 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>RÈGLEMENT & CONDITIONS D'ÉLIGIBILITÉ</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO
              </h3>
            </div>
            <button
              type="button"
              onClick={() => go('conditions-monetisation')}
              className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Consulter les 13 conditions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Message officiel */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs sm:text-sm">
            <div className="font-black text-amber-300">
              💰 Vous souhaitez gagner de l’argent avec vos contenus ?
            </div>
            <p className="text-neutral-300 font-medium">
              Complétez les conditions ArtisanPro, développez votre audience et respectez les règles de la plateforme.
            </p>
            <p className="text-white font-bold">
              Lorsque toutes les conditions sont remplies, vous pourrez demander l’activation de votre monétisation.
            </p>
          </div>

          {/* Statuts de monétisation */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              STATUTS DE MONÉTISATION :
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 font-bold text-neutral-200 flex items-center gap-2">
                <span>🔒</span>
                <span>Non éligible</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 font-bold text-neutral-200 flex items-center gap-2">
                <span>⏳</span>
                <span>Conditions en cours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 font-bold text-neutral-200 flex items-center gap-2">
                <span>🟡</span>
                <span>Demande de validation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 font-bold text-neutral-200 flex items-center gap-2">
                <span>🟢</span>
                <span>Monétisation active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 font-bold text-neutral-200 flex items-center gap-2 col-span-2 sm:col-span-1">
                <span>🔴</span>
                <span>Monétisation suspendue</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-neutral-300 leading-relaxed pt-1">
            <p className="font-medium text-neutral-200">
              Pour commencer à générer des revenus grâce à ses publications, projets et contenus sur ArtisanPro, l’utilisateur doit remplir l’ensemble des 13 conditions réglementaires.
            </p>

            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2 text-xs">
              <div className="font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>IMPORTANT :</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6B00] font-bold">•</span>
                  <span><strong>Le fait d’avoir un abonnement ArtisanPro ne garantit pas automatiquement des revenus.</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6B00] font-bold">•</span>
                  <span>La monétisation est activée uniquement lorsque toutes les conditions sont remplies et que le compte est validé par ArtisanPro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6B00] font-bold">•</span>
                  <span>ArtisanPro se réserve le droit de suspendre ou désactiver la monétisation en cas de fraude, de non-respect des règles ou d’activité suspecte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6B00] font-bold">•</span>
                  <span>Les revenus générés dépendent des performances du contenu et des règles de rémunération ArtisanPro.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal CinetPay : Page 'Votre abonnement' avec moyens de paiement dynamiques */}
      {showModal && selectedPlan && (
        <SubscriptionCheckoutModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          planKey={selectedPlan.key}
          planName={selectedPlan.name}
          billingPeriod={billingPeriod}
          price={billingPeriod === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice}
          initialCountry={selectedCountry}
          onSuccess={() => {
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};
