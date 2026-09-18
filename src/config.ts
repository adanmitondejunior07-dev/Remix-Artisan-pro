/**
 * Configuration de l'application ArtisanPro Africa
 * Emails officiels et Gestion des Administrateurs Système
 */
import type { AdminRecord } from './types.ts';

// Email général et officiel de l'application (Support, Contact, Notifications, Envois automatiques)
export const OFFICIAL_APP_EMAIL = 'contactartisanproafrica@gmail.com';
export const SUPPORT_EMAIL = 'contactartisanproafrica@gmail.com';

// 1. Admin Principal (DG) & 2. Admin Secondaire (Créateur) & 3. Support Technique
export const PRIMARY_ADMIN_EMAIL = 'artisanproafrique@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'adanmitondejunior07@gmail.com';
export const FOUNDER_EMAIL = 'adanmitondejunior07@gmail.com';
export const TECH_SUPPORT_ADMIN_EMAIL = 'contactartisanproafrica@gmail.com';

// Les trois super admins fondateurs officiels
export const superAdmins: string[] = [
  'artisanproafrique@gmail.com',
  'artisanpro.afrique@gmail.com',
  'contactartisanproafrica@gmail.com',
  'adanmitondejunior07@gmail.com',
];

// Les trois emails officiels SUPER ADMINISTRATION autorisés à retirer les Revenus Plateforme Fondateur
export const SUPER_ADMIN_FOUNDER_EMAILS: string[] = superAdmins;

// Emails administrateurs autorisés depuis les variables d'environnement
const envAdminEmails =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_EMAILS
    ? (import.meta.env.VITE_ADMIN_EMAILS as string).split(',').map((e) => e.trim().toLowerCase())
    : [];

export const ADMIN_EMAILS: string[] = Array.from(
  new Set([
    'artisanproafrique@gmail.com',
    'artisanpro.afrique@gmail.com',
    PRIMARY_ADMIN_EMAIL,
    SECONDARY_ADMIN_EMAIL,
    FOUNDER_EMAIL,
    ...SUPER_ADMIN_FOUNDER_EMAILS,
    // Rétrocompatibilité interne
    'admin@artisanpro.afrique',
    ...envAdminEmails,
  ])
);

/**
 * TABLE DES ADMINS (admins table)
 * Contient les 2 administrateurs avec rôle super_admin et droits complets :
 * - Voir le tableau de bord
 * - Gérer les utilisateurs
 * - Gérer les commandes et devis
 * - Supprimer / bloquer
 * - Finances et retraits
 */
export const ADMINS_TABLE: AdminRecord[] = [
  {
    id: 'admin-dg-1',
    name: 'DG DIRECTEUR GÉNÉRAL PRINCIPAL',
    email: PRIMARY_ADMIN_EMAIL, // artisanproafrique@gmail.com
    role: 'super_admin',
    isPrimary: true,
    phone: '+225 0503444508',
    whatsapp: '+2250503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    joinedDate: '2023-10-01',
    permissions: [
      'dashboard',
      'users_view',
      'users_delete',
      'users_block',
      'orders_view',
      'orders_manage',
      'withdrawals_manage',
      'financials',
      'broadcast',
    ],
  },
  {
    id: 'admin-support-2',
    name: 'SUPPORT TECHNIQUE & CLIENT',
    email: OFFICIAL_APP_EMAIL, // contactartisanproafrica@gmail.com
    role: 'super_admin',
    isPrimary: false,
    phone: '+225 0503444508',
    whatsapp: '+2250503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    joinedDate: '2023-10-01',
    permissions: [
      'dashboard',
      'users_view',
      'orders_view',
      'withdrawals_manage',
      'broadcast',
    ],
  },
  {
    id: 'admin-createur-3',
    name: 'ADANMITONDE GERAUD (Créateur Secours)',
    email: SECONDARY_ADMIN_EMAIL, // adanmitondejunior07@gmail.com
    role: 'super_admin',
    isPrimary: false,
    phone: '+225 0503444508',
    whatsapp: '+2250503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    joinedDate: '2023-10-01',
    permissions: [
      'dashboard',
      'users_view',
      'users_delete',
      'users_block',
      'orders_view',
      'orders_manage',
      'withdrawals_manage',
      'financials',
      'broadcast',
    ],
  },
];

/**
 * Vérifie si un email appartient à la liste confidentielle des administrateurs
 */
export function isExactAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(normalized);
}

/**
 * Vérifie les privilèges Super Administrateur
 */
export function isSuperAdmin(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase().trim();
  if (email && superAdmins.includes(email)) return true;
  if (user.role === 'super_admin') return true;
  return isExactAdminEmail(user.email);
}

/**
 * Sécurité stricte Revenus Plateforme Fondateur :
 * Visible et retirable UNIQUEMENT pour les 3 emails de la SUPER ADMINISTRATION :
 * - adanmitondejunior07@gmail.com
 * - artisanpro.afrique@gmail.com
 * - contactartisanproafrica@gmail.com
 * Les artisans ou autres rôles ne peuvent en aucun cas voir ni retirer ce montant.
 */
export function isFounderSuperAdmin(user?: { email?: string; role?: string } | null): boolean {
  if (!user || !user.email) return false;
  const normalized = user.email.toLowerCase().trim();
  return SUPER_ADMIN_FOUNDER_EMAILS.includes(normalized);
}

/**
 * Numéro de support technique officiel & support retraits approuvés
 */
export const SUPPORT_PHONE = '+225 0503444508';
export const SUPPORT_PHONE_DISPLAY = '+225 05 03 44 45 08';
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/2250503444508';

/**
 * Génère ou récupère le profil utilisateur officiel Super Administrateur
 */
export function getAdminUserByEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  const matchedAdmin = ADMINS_TABLE.find((a) => a.email.toLowerCase() === normalized);

  if (normalized === 'adanmitondejunior07@gmail.com' || normalized.includes('adan')) {
    return {
      id: 'user-admin-adan',
      name: matchedAdmin?.name || 'ADANMITONDE GERAUD (Créateur Secours)',
      email: 'adanmitondejunior07@gmail.com',
      role: 'super_admin' as const,
      phone: '+225 0503444508',
      whatsapp: '+2250503444508',
      city: 'Abidjan',
      country: 'Côte d’Ivoire',
      joinedDate: '2023-10-01',
      bio: 'Créateur / Contrôle Total Secours: ADANMITONDE GERAUD.',
      adminPermissions: {
        allowVoip: true,
        allowScreenShare: true,
        allowViewAllProfiles: true,
        allowDeleteAccount: true,
        allowTechSupportMode: true,
      },
    };
  }

  if (normalized === 'contactartisanproafrica@gmail.com') {
    return {
      id: 'user-admin-support',
      name: matchedAdmin?.name || 'SUPPORT TECHNIQUE & CLIENT',
      email: 'contactartisanproafrica@gmail.com',
      role: 'super_admin' as const,
      phone: '+225 0503444508',
      whatsapp: '+2250503444508',
      city: 'Abidjan',
      country: 'Côte d’Ivoire',
      joinedDate: '2023-10-01',
      bio: 'Support Technique & Client ArtisanPro Africa.',
      adminPermissions: {
        allowVoip: true,
        allowScreenShare: true,
        allowViewAllProfiles: true,
        allowDeleteAccount: false,
        allowTechSupportMode: true,
      },
    };
  }

  // Default: DG Directeur Général Principal
  return {
    id: 'user-admin-dg',
    name: matchedAdmin?.name || 'DG DIRECTEUR GÉNÉRAL PRINCIPAL',
    email: 'artisanproafrique@gmail.com',
    role: 'super_admin' as const,
    phone: '+225 0503444508',
    whatsapp: '+2250503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    joinedDate: '2023-10-01',
    bio: 'Direction Générale et Supervision Globale de la plateforme ArtisanPro Africa.',
    adminPermissions: {
      allowVoip: true,
      allowScreenShare: true,
      allowViewAllProfiles: true,
      allowDeleteAccount: true,
      allowTechSupportMode: true,
    },
  };
}
