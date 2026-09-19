/**
 * Configuration de l'application ArtisanPro Africa
 * Administrateur Suprême Unique de l'Application
 */
import type { AdminRecord, User } from './types.ts';

// Administrateur Suprême Unique Officiel
export const SUPREME_ADMIN_EMAIL = 'adanmitondejunior07@gmail.com';
export const OFFICIAL_APP_EMAIL = 'adanmitondejunior07@gmail.com';
export const SUPPORT_EMAIL = 'adanmitondejunior07@gmail.com';

export const PRIMARY_ADMIN_EMAIL = SUPREME_ADMIN_EMAIL;
export const SECONDARY_ADMIN_EMAIL = SUPREME_ADMIN_EMAIL;
export const FOUNDER_EMAIL = SUPREME_ADMIN_EMAIL;
export const TECH_SUPPORT_ADMIN_EMAIL = SUPREME_ADMIN_EMAIL;

// Emails totalement révoqués et désactivés de tout accès administrateur
export const DEACTIVATED_ADMIN_EMAILS = [
  'artisanpro.afrique@gmail.com',
  'contactartisanproafrica@gmail.com',
  'artisanproafrique@gmail.com',
];

// L'unique Super Admin suprême officiel
export const superAdmins: string[] = [SUPREME_ADMIN_EMAIL];

// Unique email autorisé pour les revenus plateforme & administration complète
export const SUPER_ADMIN_FOUNDER_EMAILS: string[] = [SUPREME_ADMIN_EMAIL];

export const ADMIN_EMAILS: string[] = [SUPREME_ADMIN_EMAIL];

/**
 * TABLE DE L'ADMIN UNIQUE (admins table)
 * adanmitondejunior07@gmail.com possède UNIQUEMENT le rôle "ADMIN".
 * Il ne doit avoir ni le rôle d'artisan, ni le rôle de client. C'est l'administrateur direct.
 */
export const ADMINS_TABLE: AdminRecord[] = [
  {
    id: 'admin-supreme-adan',
    name: 'ADANMITONDE GERAUD',
    email: SUPREME_ADMIN_EMAIL,
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
];

/**
 * Vérifie si un email correspond à l'unique Administrateur Suprême
 */
export function isExactAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (DEACTIVATED_ADMIN_EMAILS.includes(normalized)) {
    return false;
  }
  return normalized === SUPREME_ADMIN_EMAIL.toLowerCase();
}

/**
 * Vérifie les privilèges Administrateur pour l'admin unique
 */
export function isSuperAdmin(user?: { role?: string; email?: string } | null): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  if (DEACTIVATED_ADMIN_EMAILS.includes(email)) {
    return false;
  }
  return email === SUPREME_ADMIN_EMAIL.toLowerCase();
}

/**
 * Sécurité stricte Revenus Plateforme Fondateur :
 * Visible et géré UNIQUEMENT par l'administrateur unique : adanmitondejunior07@gmail.com
 */
export function isFounderSuperAdmin(user?: { email?: string; role?: string } | null): boolean {
  if (!user || !user.email) return false;
  const normalized = user.email.toLowerCase().trim();
  if (DEACTIVATED_ADMIN_EMAILS.includes(normalized)) {
    return false;
  }
  return normalized === SUPREME_ADMIN_EMAIL.toLowerCase();
}

/**
 * Numéro de support officiel
 */
export const SUPPORT_PHONE = '+225 0503444508';
export const SUPPORT_PHONE_DISPLAY = '+225 05 03 44 45 08';
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/2250503444508';

/**
 * Récupère le profil administrateur officiel pour l'administrateur unique
 */
export function getAdminUserByEmail(email: string): User | null {
  const normalized = email.toLowerCase().trim();
  if (DEACTIVATED_ADMIN_EMAILS.includes(normalized)) {
    return null;
  }
  if (normalized === SUPREME_ADMIN_EMAIL.toLowerCase() || normalized.includes('adan')) {
    return {
      id: 'user-admin-adan',
      name: 'ADANMITONDE GERAUD',
      email: SUPREME_ADMIN_EMAIL,
      role: 'admin' as const, // Strictement rôle "ADMIN"
      phone: '+225 0503444508',
      telephone: '+2250503444508',
      city: 'Abidjan',
      country: 'Côte d’Ivoire',
      bio: 'Administrateur Suprême Unique - ArtisanPro Afrique.',
      artisanId: undefined,
    };
  }
  return null;
}
