/**
 * CinetPay Seamless SDK Helper for West & Central Africa
 * Strictly configured in PRODUCTION mode for ArtisanPro Africa.
 */

declare global {
  interface Window {
    CinetPay?: {
      setConfig: (config: {
        apikey: string;
        site_id: string | number;
        notify_url?: string;
        mode: 'PRODUCTION' | 'TEST';
      }) => void;
      getCheckout: (data: {
        transaction_id: string;
        amount: number;
        currency: string;
        channels: string;
        description: string;
        customer_name?: string;
        customer_surname?: string;
        customer_email?: string;
        customer_phone_number?: string;
        customer_address?: string;
        customer_city?: string;
        customer_country?: string;
        customer_state?: string;
        customer_zip_code?: string;
      }) => void;
      waitResponse: (callback: (data: any) => void) => void;
      onError: (callback: (data: any) => void) => void;
    };
  }
}

export interface CinetPayCheckoutOptions {
  amount?: number;
  currency?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCity?: string;
  customerCountry?: string;
  onSuccess?: (transactionId: string, data: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

// Clés CinetPay officielles (Mode PRODUCTION)
export const CINETPAY_CONFIG = {
  apikey: '18607147716584285b037e9.63852026',
  site_id: '105881472',
  mode: 'PRODUCTION' as const, // STRICTEMENT PRODUCTION
  notify_url: typeof window !== 'undefined' ? `${window.location.origin}/api/payments/notify` : '',
};

export const CINETPAY_13K_DESCRIPTION =
  'Activation ArtisanPro Africa - Paiement 13.000F (10k activation + 3k badge vérifié) pour devenir artisan';

export function launchCinetPay13kCheckout(options: CinetPayCheckoutOptions): Promise<{ transactionId: string; data?: any }> {
  return new Promise((resolve, reject) => {
    const amount = options.amount || 13000;
    const currency = options.currency || 'XOF';
    const description = options.description || CINETPAY_13K_DESCRIPTION;
    const txId = `CP-ARTISAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (typeof window === 'undefined') {
      reject(new Error('Window not defined'));
      return;
    }

    if (!window.CinetPay) {
      console.warn('CinetPay SDK script not loaded yet or blocked.');
      // Return a simulated success or prompt direct Wave fallback
      reject(new Error('SDK CinetPay non chargé. Veuillez utiliser le virement direct Wave.'));
      return;
    }

    try {
      // Configuration en mode PRODUCTION
      window.CinetPay.setConfig({
        apikey: CINETPAY_CONFIG.apikey,
        site_id: CINETPAY_CONFIG.site_id,
        notify_url: CINETPAY_CONFIG.notify_url,
        mode: 'PRODUCTION', // Enlève le mode TEST, mets mode: "PRODUCTION"
      });

      // Lancement du checkout avec les paramètres obligatoires
      window.CinetPay.getCheckout({
        transaction_id: txId,
        amount: amount,
        currency: currency,
        channels: 'ALL',
        description: description,
        customer_name: options.customerName || 'Artisan',
        customer_surname: '',
        customer_email: options.customerEmail || 'artisan@artisanpro.africa',
        customer_phone_number: options.customerPhone || '0503444508',
        customer_address: options.customerCity || 'Abidjan',
        customer_city: options.customerCity || 'Abidjan',
        customer_country: options.customerCountry || 'CI',
      });

      window.CinetPay.waitResponse((data: any) => {
        if (data.status === 'ACCEPTED' || data.status === 'SUCCESS') {
          if (options.onSuccess) options.onSuccess(data.operator_id || txId, data);
          resolve({ transactionId: data.operator_id || txId, data });
        } else if (data.status === 'REFUSED') {
          const err = new Error('Paiement CinetPay refusé par l’opérateur');
          if (options.onError) options.onError(err);
          reject(err);
        }
      });

      window.CinetPay.onError((err: any) => {
        console.error('CinetPay error:', err);
        if (options.onError) options.onError(err);
        reject(err);
      });
    } catch (e: any) {
      console.error('Exception during CinetPay launch:', e);
      if (options.onError) options.onError(e);
      reject(e);
    }
  });
}
