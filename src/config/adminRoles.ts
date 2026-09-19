// === ADMINISTRATEUR UNIQUE - ARTISANPRO AFRIQUE ===
// Un seul et unique Administrateur Suprême : adanmitondejunior07@gmail.com

export interface AdminAfricaProfile {
  email: string;
  role: 'ADMIN' | 'ADMINISTRATEUR_SUPREME' | string;
  nom: string;
  acces: string;
  description?: string;
  defaultTab?: string;
}

export const admins: AdminAfricaProfile[] = [
  {
    email: "adanmitondejunior07@gmail.com",
    role: "ADMIN",
    nom: "ADANMITONDE GERAUD",
    acces: "ADMINISTRATEUR SUPRÊME - Contrôle Total",
    description: "Administrateur suprême de l'application. Gère tout l'envers du décor. Rôle strictement ADMIN.",
    defaultTab: "artisans"
  }
];

// Fonction pour savoir quel écran montrer selon l'admin
export function getDashboard(email?: string | null): string {
  if (!email) return "Accès refusé";
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanproafrique@gmail.com" || normalized === "artisanpro.afrique@gmail.com" || normalized === "contactartisanproafrica@gmail.com") {
    return "Accès refusé - Compte révoqué";
  }
  if (normalized === "adanmitondejunior07@gmail.com") return "Tableau de Bord Administrateur Suprême";
  return "Accès refusé";
}

/**
 * Récupère le profil administrateur enrichi selon l'email
 */
export function getAdminAfricaProfile(email?: string | null): AdminAfricaProfile | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanpro.afrique@gmail.com" || normalized === "artisanproafrique@gmail.com" || normalized === "contactartisanproafrica@gmail.com") {
    return undefined;
  }
  return admins.find((a) => a.email.toLowerCase() === normalized);
}

/**
 * Vérifie si un email correspond à l'unique administrateur officiel
 */
export function isAuthorizedAfricaAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === "artisanpro.afrique@gmail.com" || normalized === "artisanproafrique@gmail.com" || normalized === "contactartisanproafrica@gmail.com") {
    return false;
  }
  return normalized === "adanmitondejunior07@gmail.com";
}
