/**
 * Configuration de l'application ArtisanPro Africa
 * Emails officiels et Gestion des Administrateurs Système
 */
import type { AdminRecord } from './types.ts';

// Email général et officiel de l'application (Support, Contact, Notifications, Envois automatiques)
export const OFFICIAL_APP_EMAIL = 'contactartisanproafrica@gmail.com';
export const SUPPORT_EMAIL = 'contactartisanproafrica@gmail.com';

// 1. Admin Principal & 2. Admin Secondaire & 3. Email Officiel du Fondateur
export const PRIMARY_ADMIN_EMAIL = 'contactartisanproafrica@gmail.com';
export const SECONDARY_ADMIN_EMAIL = 'adanmitondejunior07@gmail.com';
export const FOUNDER_EMAIL = 'artisanpro.afrique@gmail.com';

// Les trois super admins fondateurs officiels
export const superAdmins: string[] = [
  'adanmitondejunior07@gmail.com',
  'artisanpro.afrique@gmail.com',
  'contactartisanproafrica@gmail.com',
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
    id: 'admin-principal-1',
    name: 'Admin Principal (Direction Générale)',
    email: PRIMARY_ADMIN_EMAIL,
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
    id: 'admin-secondaire-2',
    name: 'ADANMITONDE GERAUD',
    email: SECONDARY_ADMIN_EMAIL,
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
  {
    id: 'admin-fondateur-3',
    name: 'ADANMITONDE GERAUD (Fondateur)',
    email: FOUNDER_EMAIL,
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
  const isAdan = normalized === SECONDARY_ADMIN_EMAIL || normalized.includes('adan');
  const matchedAdmin = ADMINS_TABLE.find((a) => a.email.toLowerCase() === normalized);

  return {
    id: isAdan ? 'user-admin-adan' : 'user-admin-principal',
    name: matchedAdmin?.name || (isAdan ? 'ADANMITONDE GERAUD' : 'Admin Principal ArtisanPro'),
    email: normalized,
    role: 'super_admin' as const,
    phone: '+225 0503444508',
    whatsapp: '+2250503444508',
    city: 'Abidjan',
    country: 'Côte d’Ivoire',
    joinedDate: '2023-10-01',
    bio: isAdan
      ? 'Fondateur: ADANMITONDE GERAUD - Super Administrateur.'
      : 'Super Administrateur Principal - Direction Générale de la plateforme.',
    adminPermissions: {
      allowVoip: true,
      allowScreenShare: true,
      allowViewAllProfiles: true,
      allowDeleteAccount: true,
      allowTechSupportMode: true,
    },
  };
}
