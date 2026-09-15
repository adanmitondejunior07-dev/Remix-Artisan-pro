/**
 * === ARTISANPRO AFRICA - PORTEFEUILLE COMPLET ===
 * 1. CERVEAU : Calcul de l'argent
 * 
 * double calculerGains(double montantVente) {
 *   double commissionPlateforme = montantVente * 0.10; // 10% pour toi
 *   double gainArtisan = montantVente * 0.90; // 90% pour artisan
 *   return gainArtisan;
 * }
 */

export interface GainsCalculationResult {
  montantVente: number;
  commissionPlateforme: number; // 10%
  gainArtisan: number; // 90%
  tauxPlateforme: number; // 0.10
  tauxArtisan: number; // 0.90
}

/**
 * Calcule le gain net de l'artisan (90% du montant de la vente)
 * Commission plateforme de 10% déduite pour ArtisanPro Africa.
 */
export function calculerGains(montantVente: number): number {
  const commissionPlateforme = montantVente * 0.10; // 10% pour toi
  const gainArtisan = montantVente * 0.90; // 90% pour artisan
  return Math.round(gainArtisan);
}

/**
 * Calcule la commission plateforme (10% pour la plateforme / Fondateur)
 */
export function calculerCommissionPlateforme(montantVente: number): number {
  return Math.round(montantVente * 0.10);
}

/**
 * Décompose en détail le montant d'une vente avec montants bruts, commission et gain net
 */
export function decomposerGains(montantVente: number): GainsCalculationResult {
  const commissionPlateforme = Math.round(montantVente * 0.10);
  const gainArtisan = Math.round(montantVente * 0.90);
  return {
    montantVente,
    commissionPlateforme,
    gainArtisan,
    tauxPlateforme: 0.10,
    tauxArtisan: 0.90,
  };
}

/**
 * Liste des opérateurs Mobile Money phares supportés en Afrique
 */
export interface MobileMoneyOperator {
  id: 'orange' | 'mtn' | 'moov' | 'wave';
  name: string;
  badgeColor: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  prefix: string;
  iconText: string;
  feesNotice: string;
}

export const MOBILE_MONEY_OPERATORS: MobileMoneyOperator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    badgeColor: 'bg-[#FF6600]',
    bgLight: 'bg-orange-50',
    textColor: 'text-[#FF6600]',
    borderColor: 'border-[#FF6600]/40',
    prefix: 'OM',
    iconText: '🟠',
    feesNotice: 'Frais 0% sur recharge',
  },
  {
    id: 'mtn',
    name: 'MTN',
    badgeColor: 'bg-[#FFCC00]',
    bgLight: 'bg-yellow-50',
    textColor: 'text-amber-800',
    borderColor: 'border-yellow-400/60',
    prefix: 'MoMo',
    iconText: '🟡',
    feesNotice: 'Instantané MTN MoMo',
  },
  {
    id: 'moov',
    name: 'Moov',
    badgeColor: 'bg-[#0055A5]',
    bgLight: 'bg-blue-50',
    textColor: 'text-[#0055A5]',
    borderColor: 'border-blue-300',
    prefix: 'Moov',
    iconText: '🔵',
    feesNotice: 'Sans frais cachés',
  },
  {
    id: 'wave',
    name: 'Wave',
    badgeColor: 'bg-[#1DC4FA]',
    bgLight: 'bg-cyan-50',
    textColor: 'text-[#0B85AD]',
    borderColor: 'border-cyan-300',
    prefix: 'Wave',
    iconText: '🌊',
    feesNotice: '1% de frais maximum',
  },
];
