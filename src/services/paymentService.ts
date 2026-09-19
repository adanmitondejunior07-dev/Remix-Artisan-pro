/**
 * Service de gestion des paiements d'abonnements automatiques
 * Artisan Pro Afrique - Intégration Wave Business & WhatsApp + Firebase Firestore
 */
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/config.ts';

// Numéro WhatsApp Administrateur officiel garanti partout
export const ADMIN_PHONE_NUMBER = '0503444508';
export const ADMIN_WHATSAPP_NUMBER = '+2250503444508';
export const ADMIN_WHATSAPP_CLEAN = '2250503444508';

// Liste des pays éligibles Wave Business direct
export const WAVE_COUNTRIES = ['CI', 'SN', 'ML', 'BF'] as const;
export type WaveCountryCode = typeof WAVE_COUNTRIES[number];

// Liste des pays redirigés vers WhatsApp Admin
export const WHATSAPP_COUNTRIES = ['BJ', 'TG', 'CM', 'OTHER'] as const;
export type WhatsAppCountryCode = typeof WHATSAPP_COUNTRIES[number];

export type AfricanCountryCode = WaveCountryCode | WhatsAppCountryCode;

export interface CountryInfo {
  code: AfricanCountryCode;
  name: string;
  flag: string;
  currency: string;
  paymentMode: 'wave' | 'whatsapp';
  description: string;
}

export const COUNTRIES_CONFIG: Record<AfricanCountryCode, CountryInfo> = {
  CI: {
    code: 'CI',
    name: 'Côte d’Ivoire',
    flag: '🇨🇮',
    currency: 'FCFA',
    paymentMode: 'wave',
    description: 'Paiement instantané par Wave Business (Sans frais)',
  },
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'FCFA',
    paymentMode: 'wave',
    description: 'Paiement instantané par Wave Business Sénégal',
  },
  ML: {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    currency: 'FCFA',
    paymentMode: 'wave',
    description: 'Paiement instantané par Wave Mali',
  },
  BF: {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    currency: 'FCFA',
    paymentMode: 'wave',
    description: 'Paiement instantané par Wave Burkina Faso',
  },
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    currency: 'FCFA',
    paymentMode: 'whatsapp',
    description: 'Assistance & validation directe via WhatsApp Admin (+225 0503444508)',
  },
  TG: {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'FCFA',
    paymentMode: 'whatsapp',
    description: 'Assistance & validation directe via WhatsApp Admin (+225 0503444508)',
  },
  CM: {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'FCFA',
    paymentMode: 'whatsapp',
    description: 'Assistance & validation directe via WhatsApp Admin (+225 0503444508)',
  },
  OTHER: {
    code: 'OTHER',
    name: 'Autre pays',
    flag: '🌍',
    currency: 'FCFA',
    paymentMode: 'whatsapp',
    description: 'Règlement assisté pour toute l’Afrique via WhatsApp Admin',
  },
};

// Grille tarifaire officielle Artisan Pro Afrique (NOUVEAUX PRIX ARTISAN PRO - CORRIGÉ)
export const SUBSCRIPTION_PRICES = {
  monthly: {
    essentiel: 425,
    pro: 900,
    premium: 1200,
  },
  yearly: {
    essentiel: 4700,
    pro: 9200,
    premium: 14325,
  },
} as const;

export type PlanKey = 'essentiel' | 'pro' | 'premium';
export type BillingPeriod = 'monthly' | 'yearly';

/**
 * Récupère le montant en FCFA selon le plan et la période
 */
export function getSubscriptionAmount(plan: string, period: BillingPeriod = 'monthly'): number {
  const normalizedPlan = (plan.toLowerCase() === 'essential' ? 'essentiel' : plan.toLowerCase()) as PlanKey;
  const periodKey = period === 'yearly' ? 'yearly' : 'monthly';
  return SUBSCRIPTION_PRICES[periodKey][normalizedPlan] || (periodKey === 'yearly' ? 9200 : 900);
}

/**
 * Génère le lien officiel Wave Business selon le montant
 * Format : https://pay.wave.com/m/M_ci_eGr2SsGnyCna/c/ci/?amount=[montant]
 */
export function getWavePaymentUrl(amount: number): string {
  return `https://pay.wave.com/m/M_ci_eGr2SsGnyCna/c/ci/?amount=${amount}`;
}

/**
 * Génère le lien WhatsApp avec message automatique de souscription
 * Message demandé : "Je veux payer [plan] [montant]F [pays] ID: [userId]"
 */
export function getWhatsAppPaymentUrl(params: {
  plan: string;
  amount: number;
  pays: string;
  userId: string | number;
}): string {
  const planDisplay = params.plan.toUpperCase();
  const text = `Je veux payer ${planDisplay} ${params.amount}F ${params.pays} ID: ${params.userId}`;
  return `https://wa.me/${ADMIN_WHATSAPP_CLEAN}?text=${encodeURIComponent(text)}`;
}

/**
 * Détermine si un code pays utilise Wave Business (CI, SN, ML, BF)
 */
export function isWaveCountry(countryCode: string): boolean {
  const normalized = countryCode.toUpperCase().trim();
  return WAVE_COUNTRIES.includes(normalized as any);
}

export interface PaymentInitiationResult {
  type: 'wave' | 'whatsapp';
  url: string;
  amount: number;
  plan: string;
  pays: string;
  userId: string | number;
  message?: string;
}

/**
 * Initie la procédure de paiement selon le pays choisi :
 * - Si CI, SN, ML, BF : Wave Business
 * - Si BJ, TG, CM, OTHER : Redirection WhatsApp +2250503444508
 */
export function initiateSubscriptionPayment(params: {
  plan: string;
  billingPeriod: BillingPeriod;
  countryCode: string;
  userId: string | number;
}): PaymentInitiationResult {
  const amount = getSubscriptionAmount(params.plan, params.billingPeriod);
  const countryConfig = COUNTRIES_CONFIG[params.countryCode.toUpperCase() as AfricanCountryCode] || COUNTRIES_CONFIG.OTHER;
  const paysName = countryConfig.name;

  if (isWaveCountry(params.countryCode)) {
    const waveUrl = getWavePaymentUrl(amount);
    return {
      type: 'wave',
      url: waveUrl,
      amount,
      plan: params.plan,
      pays: paysName,
      userId: params.userId,
    };
  }

  const whatsappUrl = getWhatsAppPaymentUrl({
    plan: params.plan,
    amount,
    pays: paysName,
    userId: params.userId,
  });

  return {
    type: 'whatsapp',
    url: whatsappUrl,
    amount,
    plan: params.plan,
    pays: paysName,
    userId: params.userId,
    message: `Je veux payer ${params.plan.toUpperCase()} ${amount}F ${paysName} ID: ${params.userId}`,
  };
}

/**
 * Met à jour Firebase Firestore lorsque l'artisan paie via Wave :
 * doc(db, "artisans", userId) => {
 *   abonnement: plan,
 *   abonnement_actif: true,
 *   date_paiement: serverTimestamp(),
 *   montant: amount,
 *   pays: pays,
 *   telephone_admin: "0503444508"
 * }
 */
export async function updateArtisanSubscriptionInFirestore(params: {
  userId: string | number;
  plan: string;
  amount: number;
  pays: string;
  artisanName?: string;
  artisanTrade?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const userDocId = String(params.userId);
    const normalizedPlan = (params.plan.toLowerCase() === 'essential' ? 'essentiel' : params.plan.toLowerCase());
    const capitalizedPlan = normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1);

    // 1. Mise à jour requise du document artisans
    const artisanDocRef = doc(firestore, 'artisans', userDocId);
    const artisanData: Record<string, any> = {
      abonnement: normalizedPlan,
      abonnement_actif: true,
      date_paiement: serverTimestamp(),
      montant: params.amount,
      pays: params.pays,
      telephone_admin: ADMIN_PHONE_NUMBER,
      // Enrichissements pour compatibilité affichage
      plan: capitalizedPlan,
      subscription_status: 'active',
      subscription_plan: normalizedPlan,
      isArtisan: true,
      verified: true,
      is_verified: true,
      updatedAt: new Date().toISOString(),
    };

    if (params.artisanName) artisanData.name = params.artisanName;
    if (params.artisanTrade) artisanData.trade = params.artisanTrade;

    await setDoc(artisanDocRef, artisanData, { merge: true });

    // 2. Mise à jour synchronisée du document users
    try {
      const userDocRef = doc(firestore, 'users', userDocId);
      await setDoc(
        userDocRef,
        {
          abonnement: normalizedPlan,
          abonnement_actif: true,
          subscription_status: 'active',
          subscription_plan: normalizedPlan,
          artisan_status: 'active',
          montant: params.amount,
          pays: params.pays,
          telephone_admin: ADMIN_PHONE_NUMBER,
          date_paiement: serverTimestamp(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Notice: Synchronisation collection users non bloquante:', e);
    }

    // 3. Enregistrement dans l'historique des abonnements
    try {
      const subDocRef = doc(firestore, 'subscriptions', `wave_${userDocId}_${Date.now()}`);
      await setDoc(subDocRef, {
        id: subDocRef.id,
        user_id: userDocId,
        plan: normalizedPlan,
        price: params.amount,
        currency: 'XOF',
        billing_period: params.amount >= 4000 ? 'yearly' : 'monthly',
        status: 'active',
        payment_provider: 'Wave Business',
        pays: params.pays,
        telephone_admin: ADMIN_PHONE_NUMBER,
        date_paiement: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Notice: Enregistrement historique abonnement non bloquant:', e);
    }

    // 4. Synchronisation locale immédiate dans localStorage
    if (typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem('userData');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          u.abonnement = normalizedPlan;
          u.abonnement_actif = true;
          u.subscription_status = 'active';
          u.subscription_plan = normalizedPlan;
          u.artisan_status = 'active';
          u.telephone_admin = ADMIN_PHONE_NUMBER;
          u.montant = params.amount;
          u.pays = params.pays;
          localStorage.setItem('userData', JSON.stringify(u));
        }

        // Mettre à jour aussi dans la liste locale des artisans
        const rawArtisans = localStorage.getItem('artisans_afrique');
        if (rawArtisans) {
          const list = JSON.parse(rawArtisans);
          if (Array.isArray(list)) {
            const updated = list.map((a: any) => {
              if (String(a.id) === userDocId || String(a.userId) === userDocId) {
                return {
                  ...a,
                  abonnement: normalizedPlan,
                  abonnement_actif: true,
                  telephone_admin: ADMIN_PHONE_NUMBER,
                  montant: params.amount,
                  pays: params.pays,
                };
              }
              return a;
            });
            localStorage.setItem('artisans_afrique', JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.warn('Sync local storage:', err);
      }
    }

    return {
      success: true,
      message: `Abonnement ${capitalizedPlan} activé avec succès sur Firebase Firestore.`,
    };
  } catch (error: any) {
    console.error('Erreur mise à jour Firebase Firestore:', error);
    return {
      success: false,
      message: error?.message || 'Erreur lors de la mise à jour Firestore',
    };
  }
}
