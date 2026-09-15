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
    email: "artisanpro.afrique@gmail.com",
    role: "DIRECTION_GENERALE",
    nom: "Admin Direction Générale",
    acces: "COMPLET - Boss",
    description: "Direction et gouvernance complète de la plateforme. Supervision générale de tous les modules.",
    defaultTab: "direction_tout"
  },
  {
    email: "contactartisanproafrica@gmail.com", 
    role: "ADMIN_RETRAITS",
    nom: "Admin Vérif Retraits",
    acces: "COMPLET + Focus Retraits",
    description: "Validation et vérification prioritaire des demandes de retraits Mobile Money des artisans.",
    defaultTab: "retraits_a_verifier"
  },
  {
    email: "adanmitondejunior07@gmail.com",
    role: "CONTROLE_CENTRAL",
    nom: "Admin Contrôle Central",
    acces: "COMPLET + Technique CinetPay",
    description: "Contrôle technique central, intégration CinetPay, monitoring des passerelles et analyse des logs.",
    defaultTab: "technique_cinetpay"
  }
];

// Fonction pour savoir quel écran montrer selon l'admin
export function getDashboard(email?: string | null): string {
  if (!email) return "Accès refusé";
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanpro.afrique@gmail.com") return "Dashboard Direction - Tout";
  if (normalized === "contactartisanproafrica@gmail.com") return "Dashboard Retraits - A vérifier";
  if (normalized === "adanmitondejunior07@gmail.com") return "Dashboard Technique - CinetPay + Logs";
  return "Accès refusé";
}

/**
 * Récupère le profil administrateur enrichi selon l'email
 */
export function getAdminAfricaProfile(email?: string | null): AdminAfricaProfile | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return admins.find((a) => a.email.toLowerCase() === normalized);
}

/**
 * Vérifie si un email correspond à l'un des 3 administrateurs officiels
 */
export function isAuthorizedAfricaAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return admins.some((a) => a.email.toLowerCase() === normalized);
}
