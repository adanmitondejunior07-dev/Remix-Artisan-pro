// Gestionnaire de la base de données locale 'artisans_afrique' dans localStorage
import { AFRICAN_PHONE_COUNTRIES } from '../components/AfricanPhoneInput.tsx';

export interface ArtisanAfrique {
  id: string;
  nom: string;
  name: string;
  telephone: string;
  phone: string;
  pays: string;
  country: string;
  metier: string;
  trade: string;
  ville: string;
  city: string;
  mot_de_passe: string;
  password?: string;
  email?: string;
  role: 'artisan' | 'client';
  dateInscription: string;
  verified: boolean;
  is_verified: boolean;
  [key: string]: any;
}

/**
 * Récupère tous les artisans enregistrés dans la liste 'artisans_afrique'
 */
export function getArtisansAfrique(): ArtisanAfrique[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('artisans_afrique');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erreur lecture localStorage artisans_afrique:', err);
    return [];
  }
}

/**
 * Enregistre un artisan dans la liste 'artisans_afrique' (fonctionne comme une vraie BDD)
 */
export function saveArtisanAfrique(data: {
  nom: string;
  telephone: string;
  pays: string;
  metier: string;
  ville: string;
  mot_de_passe: string;
  email?: string;
  role?: 'artisan' | 'client';
}): ArtisanAfrique {
  const currentList = getArtisansAfrique();
  const id = `artisan-afr-${Date.now()}`;

  // Nettoyage et normalisation
  const cleanNom = data.nom.trim();
  const cleanTel = data.telephone.replace(/\s/g, '').trim();
  const cleanPays = data.pays.trim() || 'Côte d’Ivoire';
  const cleanMetier = data.metier.trim() || 'Artisan';
  const cleanVille = data.ville.trim() || 'Abidjan';
  const cleanPassword = data.mot_de_passe.trim();
  const cleanEmail =
    data.email?.trim() ||
    `${cleanNom.toLowerCase().replace(/[^a-z0-9]/g, '.')}@artisanpro.afrique`;

  const record: ArtisanAfrique = {
    id,
    nom: cleanNom,
    name: cleanNom,
    telephone: cleanTel,
    phone: cleanTel,
    pays: cleanPays,
    country: cleanPays,
    metier: cleanMetier,
    trade: cleanMetier,
    ville: cleanVille,
    city: cleanVille,
    mot_de_passe: cleanPassword,
    password: cleanPassword,
    email: cleanEmail,
    role: data.role || 'artisan',
    dateInscription: new Date().toISOString(),
    verified: true,
    is_verified: true,
    rating: 5.0,
    reviewsCount: 1,
    services: ['Prestations soignées', 'Interventions rapides'],
    hourlyRate: '10 000 FCFA / h',
  };

  // Si un artisan avec ce numéro ou un numéro équivalent existe déjà, le mettre à jour
  const cleanDigits = cleanTel.replace(/\D/g, '');
  const existingIndex = currentList.findIndex((item) => {
    const itemTel = (item.telephone || item.phone || '').replace(/\s/g, '');
    const itemDigits = itemTel.replace(/\D/g, '');
    if (itemTel === cleanTel) return true;
    if (cleanDigits.length >= 8 && (itemDigits === cleanDigits || itemDigits.endsWith(cleanDigits) || cleanDigits.endsWith(itemDigits))) {
      return true;
    }
    return false;
  });

  if (existingIndex >= 0) {
    currentList[existingIndex] = {
      ...currentList[existingIndex],
      ...record,
      id: currentList[existingIndex].id,
    };
  } else {
    currentList.push(record);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('artisans_afrique', JSON.stringify(currentList));
    } catch (e) {
      console.error('Erreur sauvegarde artisans_afrique:', e);
    }
  }

  return record;
}

/**
 * Recherche si un identifiant (numéro complet, partiel ou email) existe dans 'artisans_afrique'
 */
export function findArtisanAfrique(identifier: string): ArtisanAfrique | null {
  if (!identifier) return null;
  const list = getArtisansAfrique();
  const cleanIdent = identifier.replace(/\s/g, '').trim();
  const cleanDigits = cleanIdent.replace(/\D/g, '');
  const lowerIdent = cleanIdent.toLowerCase();

  for (const item of list) {
    const itemTel = (item.telephone || item.phone || '').replace(/\s/g, '').trim();
    const itemDigits = itemTel.replace(/\D/g, '');
    const itemEmail = (item.email || '').trim().toLowerCase();

    // Correspondance exacte sur le numéro complet (ex: +2250503444508)
    if (itemTel === cleanIdent || itemTel === `+${cleanIdent}`) {
      return item;
    }

    // Correspondance sur les chiffres significatifs (ex: 0503444508)
    if (cleanDigits.length >= 8) {
      if (itemDigits === cleanDigits || itemDigits.endsWith(cleanDigits) || cleanDigits.endsWith(itemDigits)) {
        return item;
      }
    }

    // Correspondance sur l'email
    if (itemEmail && itemEmail === lowerIdent) {
      return item;
    }
  }

  return null;
}

/**
 * Récupère le pays à partir de l'indicatif téléphonique
 */
export function getCountryNameFromDialCode(dialCode: string): string {
  const clean = dialCode.trim();
  const found = AFRICAN_PHONE_COUNTRIES.find((c) => c.code === clean);
  return found?.name || 'Côte d’Ivoire';
}
