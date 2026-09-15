import type { OfficialChannels } from '../types.ts';

export const PERMANENT_OFFICIAL_CHANNELS: OfficialChannels = {
  whatsappChannel: 'https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c',
  facebookPage: 'https://facebook.com/artisanpro.afrique',
  instagramTiktok: 'https://instagram.com/artisanpro.afrique',
  website: 'https://artisanpro.africa',
};

/**
 * Nettoie et normalise une URL selon les règles:
 * - Trim les espaces
 * - Corrige les fautes de frappe comme 'Shttps', 'shttps', 'Shttp' en 'https://'
 * - Minuscule auto sur le protocole et le nom de domaine
 * - Accepte tout lien qui commence par https://
 */
export function cleanAndNormalizeLink(input: string): string {
  if (!input) return '';
  let val = input.trim();

  // Corrige 'Shttps://', 'shttps://', 'Shttp://' ou 'shttp://' en 'https://'
  val = val.replace(/^[sS]+https?:\/\//i, 'https://');
  val = val.replace(/^[sS]+https?:\/*/i, 'https://');

  // Si commence par http:// -> convertit en https://
  val = val.replace(/^http:\/\//i, 'https://');

  // Minuscule auto sur le protocole (ex: HTTPS:// -> https://)
  val = val.replace(/^https?:\/\//i, 'https://');

  // Si commence par https://, mettre le nom de domaine en minuscules (ex: FACEBOOK.COM -> facebook.com)
  if (val.startsWith('https://')) {
    const afterProto = val.slice(8);
    const slashIdx = afterProto.indexOf('/');
    if (slashIdx !== -1) {
      const domain = afterProto.slice(0, slashIdx).toLowerCase();
      const pathAndQuery = afterProto.slice(slashIdx);
      val = 'https://' + domain + pathAndQuery;
    } else {
      val = 'https://' + afterProto.toLowerCase();
    }
  }

  return val;
}

/**
 * Validation: accepte tout lien qui commence par https://
 * Si vide, renvoie true (car les liens vides sont masqués)
 */
export function isValidOfficialUrl(url: string): boolean {
  if (!url || url.trim() === '') return true;
  const normalized = cleanAndNormalizeLink(url);
  return normalized.startsWith('https://');
}
