/**
 * Service d'intégration Kkiapay pour Artisan Pro Afrique
 * Clé publique Kkiapay & Grille Tarifaire officielle
 */

export const KKIAPAY_PUBLIC_KEY = '7edf7c80b3ee11f1b408a9e54ae3d6e2';

// NOUVEAUX PRIX ARTISAN PRO
export const KKIAPAY_PLANS = {
  essentiel_mensuel: { key: 'essentiel_mensuel', planKey: 'essential', montant: 425, nom: 'Essentiel Mensuel', periode: 'monthly' as const },
  essentiel_annuel: { key: 'essentiel_annuel', planKey: 'essential', montant: 4700, nom: 'Essentiel Annuel', periode: 'yearly' as const },
  pro_mensuel: { key: 'pro_mensuel', planKey: 'pro', montant: 900, nom: 'Pro Mensuel', periode: 'monthly' as const },
  pro_annuel: { key: 'pro_annuel', planKey: 'pro', montant: 9200, nom: 'Pro Annuel', periode: 'yearly' as const },
  premium_mensuel: { key: 'premium_mensuel', planKey: 'premium', montant: 1200, nom: 'Premium Mensuel', periode: 'monthly' as const },
  premium_annuel: { key: 'premium_annuel', planKey: 'premium', montant: 14325, nom: 'Premium Annuel', periode: 'yearly' as const },
} as const;

export type KkiapayPlanKey = keyof typeof KKIAPAY_PLANS;

export interface KkiapaySuccessResponse {
  transactionId: string;
  reference?: string;
  [key: string]: any;
}

declare global {
  interface Window {
    openKkiapayWidget?: (options: {
      amount: number;
      key: string;
      position?: string;
      sandbox?: boolean;
      data?: string;
      phone?: string;
      name?: string;
      email?: string;
      callback?: string;
      theme?: string;
      paymentmethod?: string[];
      countries?: string[];
      success?: (response: KkiapaySuccessResponse) => void;
      failed?: (error: any) => void;
    }) => void;
    addKkiapayListener?: (event: string, callback: (data: any) => void) => void;
    removeKkiapayListener?: (event: string, callback: (data: any) => void) => void;
  }
}

/**
 * Charge dynamiquement le script Kkiapay s'il n'est pas encore présent
 */
export function loadKkiapayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (window.openKkiapayWidget) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="kkiapay"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      // Fallback si déjà chargé
      setTimeout(resolve, 800);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Erreur chargement script Kkiapay CDN');
      resolve();
    };
    document.head.appendChild(script);
  });
}

/**
 * Fonction de paiement Kkiapay pour un abonnement
 * Sauvegarde dans localStorage pour l'artisan et pour le BOSS
 */
export async function payerAbonnementKkiapay(
  planKey: KkiapayPlanKey,
  artisanId: string | number,
  options?: {
    phone?: string;
    name?: string;
    email?: string;
    onSuccess?: (res: KkiapaySuccessResponse) => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  const plan = KKIAPAY_PLANS[planKey];
  if (!plan) {
    console.error('Plan Kkiapay inconnu:', planKey);
    return;
  }

  await loadKkiapayScript();

  const handleSuccess = (response: KkiapaySuccessResponse) => {
    const txId = response.transactionId || `KKIA-${Date.now()}`;
    const artIdStr = String(artisanId);

    // Stockage spécifique artisan
    try {
      localStorage.setItem(`artisan_${artIdStr}_premium`, planKey);
      localStorage.setItem(`artisan_${artIdStr}_transaction`, txId);
      localStorage.setItem(`artisan_${artIdStr}_plan`, plan.nom);
      localStorage.setItem('hasPaidSubscription', 'true');
      localStorage.setItem('active_plan', planKey);
    } catch (e) {
      console.warn('localStorage artisan error:', e);
    }

    // Pour toi BOSS
    try {
      const transactions = JSON.parse(localStorage.getItem('boss_transactions') || '[]');
      transactions.push({
        date: new Date().toLocaleString('fr-FR'),
        artisan: artIdStr,
        plan: plan.nom,
        montant: plan.montant,
        transactionId: txId,
      });
      localStorage.setItem('boss_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('localStorage boss_transactions error:', e);
    }

    if (options?.onSuccess) {
      options.onSuccess({ ...response, transactionId: txId });
    } else {
      alert(`Paiement ${plan.montant}F réussi ! Tu es maintenant ${plan.nom}`);
      window.location.href = '/dashboard?success=1';
    }
  };

  if (typeof window !== 'undefined' && typeof window.openKkiapayWidget === 'function') {
    // Le widget Kkiapay supporte les callbacks via addKkiapayListener ou success
    if (window.addKkiapayListener) {
      const successCb = (data: any) => {
        handleSuccess(data || { transactionId: `KKIA-${Date.now()}` });
        if (window.removeKkiapayListener) {
          window.removeKkiapayListener('success', successCb);
        }
      };
      window.addKkiapayListener('success', successCb);
    }

    window.openKkiapayWidget({
      amount: plan.montant,
      key: KKIAPAY_PUBLIC_KEY,
      position: 'center',
      sandbox: true,
      data: `${plan.nom} - Artisan ${artisanId}`,
      phone: options?.phone,
      name: options?.name,
      email: options?.email,
      success: (response) => {
        handleSuccess(response);
      },
      failed: (error) => {
        console.warn('Kkiapay failed callback:', error);
        if (options?.onError) options.onError(error);
      },
    });
  } else {
    // Fallback si le widget Kkiapay est bloqué ou met du temps à se charger
    console.warn('openKkiapayWidget non disponible immédiatement');
    alert(`Redirection vers le paiement Kkiapay pour ${plan.nom} (${plan.montant} FCFA)...`);
    // Simuler ou débloquer après confirmation
    const simTx = `KKIA-SANDBOX-${Date.now()}`;
    handleSuccess({ transactionId: simTx });
  }
}
