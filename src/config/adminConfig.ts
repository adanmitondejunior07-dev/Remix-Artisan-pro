/**
 * Configuration de l'administrateur système ArtisanPro Afrique
 */
import {
  superAdmins,
  ADMIN_EMAILS,
  isExactAdminEmail,
  isSuperAdmin,
  isFounderSuperAdmin,
  SUPER_ADMIN_FOUNDER_EMAILS,
  getAdminUserByEmail,
  ADMINS_TABLE,
  PRIMARY_ADMIN_EMAIL,
  SECONDARY_ADMIN_EMAIL,
  FOUNDER_EMAIL,
  OFFICIAL_APP_EMAIL,
  SUPPORT_EMAIL,
} from '../config.ts';

export {
  superAdmins,
  ADMIN_EMAILS,
  isExactAdminEmail,
  isSuperAdmin,
  isFounderSuperAdmin,
  SUPER_ADMIN_FOUNDER_EMAILS,
  getAdminUserByEmail,
  ADMINS_TABLE,
  PRIMARY_ADMIN_EMAIL,
  SECONDARY_ADMIN_EMAIL,
  FOUNDER_EMAIL,
  OFFICIAL_APP_EMAIL,
  SUPPORT_EMAIL,
};

export const PRIMARY_ADMIN_EMAILS = [PRIMARY_ADMIN_EMAIL, SECONDARY_ADMIN_EMAIL];
export const AUTHORIZED_ADMIN_EMAILS = ADMIN_EMAILS;

// === 3 ADMIN - ARTISANPRO AFRIQUE (Export unifié) ===
export {
  admins,
  getDashboard,
  getAdminAfricaProfile,
  isAuthorizedAfricaAdmin,
} from './adminRoles.ts';
export type { AdminAfricaProfile } from './adminRoles.ts';
