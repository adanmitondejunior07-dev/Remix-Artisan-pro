// === 3 ADMIN - ARTISANPRO AFRIQUE ===
// On ne supprime rien, on ajoute seulement

export interface AdminAfricaProfile {
  email: string;
  role: 'DIRECTION_GENERALE' | 'ADMIN_RETRAITS' | 'CONTROLE_CENTRAL' | string;
  nom: string;
  acces: string;
  description?: string;
  defaultTab?: string;
}

export const admins: AdminAfricaProfile[] = [
  {
    email: "artisanproafrique@gmail.com",
    role: "DIRECTION_GENERALE",
    nom: "DG DIRECTEUR GÉNÉRAL PRINCIPAL",
    acces: "CONTRÔLE TOTAL - Patron Suprême",
    description: "Direction et gouvernance complète de l'application. Peut TOUT voir, TOUT gérer, TOUT activer/désactiver. Patron suprême de l'app.",
    defaultTab: "direction_tout"
  },
  {
    email: "contactartisanproafrica@gmail.com", 
    role: "SUPPORT_TECHNIQUE",
    nom: "SUPPORT TECHNIQUE & CLIENT",
    acces: "SUPPORT CLIENT STRICT",
    description: "Peut seulement voir messages et aider clients. Ne voit pas mots de passe, ne peut pas supprimer compte.",
    defaultTab: "retraits_a_verifier"
  },
  {
    email: "adanmitondejunior07@gmail.com",
    role: "CONTROLE_TOTAL_SECOURS",
    nom: "Créateur / Contrôle Total Secours",
    acces: "CONTRÔLE TOTAL SECOURS",
    description: "Créateur / Contrôle Total Secours. Clé de secours si le DG perd l'accès à son compte.",
    defaultTab: "technique_cinetpay"
  }
];

// Fonction pour savoir quel écran montrer selon l'admin
export function getDashboard(email?: string | null): string {
  if (!email) return "Accès refusé";
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanproafrique@gmail.com" || normalized === "artisanpro.afrique@gmail.com") return "Dashboard Direction Générale - Tout";
  if (normalized === "contactartisanproafrica@gmail.com") return "Dashboard Support Technique";
  if (normalized === "adanmitondejunior07@gmail.com") return "Dashboard Créateur / Contrôle Total Secours";
  return "Accès refusé";
}

/**
 * Récupère le profil administrateur enrichi selon l'email
 */
export function getAdminAfricaProfile(email?: string | null): AdminAfricaProfile | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanpro.afrique@gmail.com") {
    return admins.find((a) => a.email === "artisanproafrique@gmail.com");
  }
  return admins.find((a) => a.email.toLowerCase() === normalized);
}

/**
 * Vérifie si un email correspond à l'un des 3 administrateurs officiels
 */
export function isAuthorizedAfricaAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanpro.afrique@gmail.com") return true;
  return admins.some((a) => a.email.toLowerCase() === normalized);
}
