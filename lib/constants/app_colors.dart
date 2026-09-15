import 'package:flutter/material.dart';

/// =========================================================
/// 🎨 COULEURS OFFICIELLES ARTISANPRO AFRIQUE
/// =========================================================
/// - limeGreen = Color(0xFF7AC74F) : Vert citron (Boutons principaux, action, dynamisme)
/// - orange    = Color(0xFFFF7A00) : Orange vif (Carte Afrique, marteau, badges importants)
/// - yellow    = Color(0xFFFFD60A) : Jaune soleil (Aiguille, étoiles, Pro, accents dorés)
/// - white     = Color(0xFFFFFFFF) : Blanc pur
/// - black     = Color(0xFF212121) : Noir profond doux (typographies & contrastes)
/// =========================================================

class AppColors {
  AppColors._();

  // Les 3 Couleurs Signature
  static const Color limeGreen = Color(0xFF7AC74F); // Vert citron
  static const Color limeGreenLight = Color(0xFF98D775);
  static const Color limeGreenDark = Color(0xFF5FA837);

  static const Color orange = Color(0xFFFF7A00); // Orange vif
  static const Color orangeLight = Color(0xFFFF9E3D);
  static const Color orangeDark = Color(0xFFD96300);

  static const Color yellow = Color(0xFFFFD60A); // Jaune soleil
  static const Color yellowLight = Color(0xFFFFE147);
  static const Color yellowDark = Color(0xFFD4B100);

  // Neutres Fondamentaux
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF212121);
  static const Color neutralDark = Color(0xFF171717);
  static const Color neutralGray = Color(0xFF757575);
  static const Color neutralLight = Color(0xFFF5F5F5);

  // Éléments fonctionnels
  static const Color primaryButtonBg = limeGreen;
  static const Color primaryButtonTextWhite = white;
  static const Color primaryButtonTextBlack = black;

  static const Color africaMap = orange;
  static const Color hammerTool = orange;
  static const Color importantBadge = orange;

  static const Color needleTool = yellow;
  static const Color starRating = yellow;
  static const Color proBadgeText = yellow;

  /// Thème officiel ArtisanPro Afrique
  static ThemeData get themeData {
    return ThemeData(
      primaryColor: limeGreen,
      scaffoldBackgroundColor: white,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: limeGreen,
        onPrimary: black,
        secondary: orange,
        onSecondary: white,
        tertiary: yellow,
        onTertiary: black,
        error: Color(0xFFD32F2F),
        onError: white,
        surface: white,
        onSurface: black,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: limeGreen,
          foregroundColor: black,
          textStyle: const TextStyle(fontWeight: FontWeight.w900),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: white,
        foregroundColor: black,
        elevation: 0,
      ),
    );
  }
}
