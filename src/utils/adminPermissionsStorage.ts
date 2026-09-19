/**
 * Gestionnaire des permissions administrateur avec persistance localStorage 'admin_permissions'.
 * Toggles gérés :
 * - voip: true
 * - screen_share: false
 * - view_all_profiles: true
 * - delete_account: false (DANGEREUX - ROUGE)
 * - support_mode: true
 * - team_support: true
 * - team_owner: true
 * 
 * Seuls artisanproafrique@gmail.com et adanmitondejunior07@gmail.com peuvent modifier les toggles.
 * Le toggle ne doit JAMAIS se réactiver tout seul : il reste dans l'état sauvegardé.
 */

export interface SystemAdminPermissions {
  voip: boolean;
  screen_share: boolean;
  view_all_profiles: boolean;
  delete_account: boolean;
  support_mode: boolean;
  team_support: boolean;
  team_owner: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: SystemAdminPermissions = {
  voip: true,
  screen_share: false,
  view_all_profiles: true,
  delete_account: false,
  support_mode: true,
  team_support: true,
  team_owner: true,
};

const STORAGE_KEY = 'admin_permissions';

/**
 * Emails autorisés à modifier les permissions et la gestion d'équipe
 */
export const DG_AND_BACKUP_EMAILS = [
  'adanmitondejunior07@gmail.com',
];

/**
 * Vérifie si l'utilisateur courant a le droit d'éditer les permissions
 */
export function canManageAdminPermissions(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DG_AND_BACKUP_EMAILS.some((e) => e.toLowerCase() === normalized);
}

/**
 * Charge les permissions depuis localStorage ('admin_permissions').
 * Si aucune sauvegarde n'existe, initialise avec DEFAULT_ADMIN_PERMISSIONS et sauvegarde.
 */
export function loadAdminPermissions(): SystemAdminPermissions {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PERMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialise proprement dans localStorage pour que ce soit garanti
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_PERMISSIONS));
      return { ...DEFAULT_ADMIN_PERMISSIONS };
    }
    const parsed = JSON.parse(raw);
    return {
      voip: typeof parsed.voip === 'boolean' ? parsed.voip : DEFAULT_ADMIN_PERMISSIONS.voip,
      screen_share: typeof parsed.screen_share === 'boolean' ? parsed.screen_share : DEFAULT_ADMIN_PERMISSIONS.screen_share,
      view_all_profiles: typeof parsed.view_all_profiles === 'boolean' ? parsed.view_all_profiles : DEFAULT_ADMIN_PERMISSIONS.view_all_profiles,
      delete_account: typeof parsed.delete_account === 'boolean' ? parsed.delete_account : DEFAULT_ADMIN_PERMISSIONS.delete_account,
      support_mode: typeof parsed.support_mode === 'boolean' ? parsed.support_mode : DEFAULT_ADMIN_PERMISSIONS.support_mode,
      team_support: typeof parsed.team_support === 'boolean' ? parsed.team_support : DEFAULT_ADMIN_PERMISSIONS.team_support,
      team_owner: typeof parsed.team_owner === 'boolean' ? parsed.team_owner : DEFAULT_ADMIN_PERMISSIONS.team_owner,
    };
  } catch (err) {
    console.warn('Erreur lecture admin_permissions:', err);
    return { ...DEFAULT_ADMIN_PERMISSIONS };
  }
}

/**
 * Sauvegarde immédiatement les permissions dans localStorage 'admin_permissions'
 */
export function saveAdminPermissions(perms: SystemAdminPermissions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
    // Déclenche un événement custom pour synchroniser tous les composants en temps réel
    window.dispatchEvent(new CustomEvent('admin_permissions_updated', { detail: perms }));
  } catch (err) {
    console.warn('Erreur sauvegarde admin_permissions:', err);
  }
}

/**
 * Bascule une permission spécifique et sauvegarde immédiatement
 */
export function toggleAdminPermission(
  key: keyof SystemAdminPermissions,
  currentUserEmail?: string | null
): { success: boolean; updated: SystemAdminPermissions; message?: string } {
  if (!canManageAdminPermissions(currentUserEmail)) {
    return {
      success: false,
      updated: loadAdminPermissions(),
      message: 'Seul le Directeur Général ou le Créateur Secours peut modifier cette permission.',
    };
  }

  const current = loadAdminPermissions();
  const updated = {
    ...current,
    [key]: !current[key],
  };
  saveAdminPermissions(updated);
  return { success: true, updated };
}
