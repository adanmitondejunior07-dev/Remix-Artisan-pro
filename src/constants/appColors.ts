/**
 * =========================================================
 * 🎨 COULEURS OFFICIELLES ARTISANPRO AFRIQUE
 * =========================================================
 * - limeGreen = #7AC74F : Vert citron (Fond des boutons principaux, action, vitalité)
 * - orange    = #FF7A00 : Orange vif (Carte Afrique, marteau, badges importants)
 * - yellow    = #FFD60A : Jaune soleil (Aiguille, étoiles, mot "Pro", accents lumineux)
 * - white     = #FFFFFF : Blanc pur
 * - black     = #212121 : Noir doux haute lisibilité
 * =========================================================
 */

export const AppColors = {
  // Les 3 Couleurs Primordiales
  limeGreen: '#7AC74F',      // Vert citron
  limeGreenLight: '#98D775',
  limeGreenDark: '#5FA837',
  limeGreenHover: '#6BB343',

  orange: '#FF7A00',         // Orange vif
  orangeLight: '#FFA143',
  orangeDark: '#E06200',
  orangeHover: '#E56D00',

  yellow: '#FFD60A',         // Jaune soleil
  yellowLight: '#FFE347',
  yellowDark: '#D4B100',
  yellowHover: '#E6C009',

  // Neutres Fondamentaux
  white: '#FFFFFF',
  black: '#212121',
  neutralDark: '#121212',
  neutralGray: '#757575',
  neutralLight: '#FAFAF9',

  // Éléments spécifiques
  africaMap: '#FF7A00',
  hammer: '#FF7A00',
  badgeImportant: '#FF7A00',
  needle: '#FFD60A',
  stars: '#FFD60A',
  proText: '#FFD60A',
} as const;

export const AppTheme = {
  primaryColor: AppColors.limeGreen,
  secondaryColor: AppColors.orange,
  accentColor: AppColors.yellow,
  backgroundColor: AppColors.white,
  textColor: AppColors.black,
};

export default AppColors;
