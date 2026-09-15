// Validation et formatage strict des numéros de téléphone pour la Côte d'Ivoire (+225)

export interface PhoneValidationResult {
  ok: boolean;
  value?: string;
  msg?: string;
}

/**
 * Valide et formate un numéro de téléphone.
 * - Supprime les espaces
 * - Bloque les numéros du Mali (+223)
 * - Accepte les numéros avec indicatif +225
 * - Ajoute +225 pour les numéros locaux commençant par 0 (ex: 0503444508)
 * - Refuse les autres indicatifs internationaux (+229, +33, etc.)
 */
export function formatTelephone(num: any): PhoneValidationResult {
  let tel = String(num || '').replace(/\s/g, '').trim();

  // Si commence par +223 (Mali) -> on bloque
  if (tel.startsWith('+223')) {
    return { ok: false, msg: "Numéro Mali détecté (+223). Veuillez mettre un numéro CI +225" };
  }
  // Si commence déjà par +225 -> OK
  if (tel.startsWith('+225')) {
    return { ok: true, value: tel };
  }
  // Si commence par 0 (0503, 0707, 01...) -> on ajoute +225
  if (tel.startsWith('0')) {
    return { ok: true, value: '+225' + tel.substring(1) };
  }
  // Si autre indicatif comme +229, +33 -> refusé
  if (tel.startsWith('+')) {
    return { ok: false, msg: "Seuls les numéros +225 Côte d'Ivoire sont acceptés" };
  }
  return { ok: false, msg: "Format invalide. Ex: 0503444508 ou +2250503444508" };
}

// Rendre la fonction accessible globalement sur window pour exécution directe par script ou console
if (typeof window !== 'undefined') {
  (window as any).formatTelephone = formatTelephone;
}
