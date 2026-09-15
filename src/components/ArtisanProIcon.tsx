import React from 'react';

interface ArtisanProIconProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'badge';
  darkBg?: boolean;
}

/**
 * 🌟 NOUVELLE ICÔNE OFFICIELLE ARTISANPRO AFRIQUE
 * Couleurs officielles :
 * - Vert citron  : #7AC74F (Fond badge & contours dynamiques)
 * - Orange vif    : #FF7A00 (Carte d'Afrique, marteau, badges)
 * - Jaune soleil  : #FFD60A (Aiguille de couture, étoiles, "Pro")
 * - Motifs africains géométriques intégrés (chevrons, losanges)
 */
export const ArtisanProIcon: React.FC<ArtisanProIconProps> = ({
  size = 40,
  className = '',
  showText = false,
  variant = 'icon',
  darkBg = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* SVG ICONE EMBLEME */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        role="img"
        aria-label="ArtisanPro Afrique Logo"
      >
        <defs>
          {/* Dégradé Vert Citron pour le badge */}
          <linearGradient id="limeGradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8EE061" />
            <stop offset="100%" stopColor="#7AC74F" />
          </linearGradient>

          {/* Dégradé Orange Vif pour l'Afrique et le Marteau */}
          <linearGradient id="orangeGradient" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF9326" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>

          {/* Dégradé Jaune Soleil pour l'Aiguille et Étoile */}
          <linearGradient id="yellowGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF066" />
            <stop offset="100%" stopColor="#FFD60A" />
          </linearGradient>

          {/* Ombre portée subtile */}
          <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#212121" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. FOND : BADGE VERT CITRON (#7AC74F) */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="26"
          fill="url(#limeGradient)"
          stroke="#5FA837"
          strokeWidth="2.5"
          filter="url(#softShadow)"
        />

        {/* 2. MOTIFS GÉOMÉTRIQUES AFRICAINS (Chevrons & Losanges décoratifs sur les bords) */}
        <g stroke="#212121" strokeWidth="1.2" opacity="0.35" fill="none">
          {/* Motifs coins supérieurs */}
          <path d="M16 16 L22 22 L28 16" />
          <path d="M92 16 L98 22 L104 16" />
          {/* Losanges latéraux traditionnels */}
          <polygon points="12,60 16,56 20,60 16,64" fill="#FFD60A" opacity="0.6" />
          <polygon points="100,60 104,56 108,60 104,64" fill="#FFD60A" opacity="0.6" />
          {/* Chevrons inférieurs */}
          <path d="M16 104 L22 98 L28 104" />
          <path d="M92 104 L98 98 L104 104" />
        </g>

        {/* 3. CARTE DU CONTINENT AFRICAIN : ORANGE VIF (#FF7A00) */}
        {/* Tracé stylisé et fidèle de l'Afrique */}
        <path
          d="M48 24
             C56 24, 66 26, 73 31
             C77 34, 82 39, 83 45
             C84 49, 81 52, 79 55
             C77 58, 77 62, 75 66
             C73 70, 69 77, 66 82
             C63 88, 59 94, 57 96
             C55 94, 53 88, 51 83
             C48 76, 45 73, 42 69
             C39 65, 34 62, 33 57
             C31 51, 33 46, 36 43
             C39 40, 42 37, 43 33
             C44 28, 45 24, 48 24 Z"
          fill="url(#orangeGradient)"
          stroke="#D96300"
          strokeWidth="1.5"
          filter="url(#softShadow)"
        />

        {/* 4. LE MARTEAU D'ARTISAN : ORANGE VIF (#FF7A00) & NOIR (#212121) */}
        {/* Manche du marteau */}
        <g transform="rotate(-28 60 60)">
          {/* Manche */}
          <rect
            x="56.5"
            y="32"
            width="7"
            height="56"
            rx="3.5"
            fill="#212121"
            stroke="#FFD60A"
            strokeWidth="1"
          />
          {/* Tête de marteau en Orange Vif */}
          <rect
            x="44"
            y="26"
            width="32"
            height="13"
            rx="3"
            fill="#FF7A00"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          {/* Griffe / Arrière du marteau */}
          <path
            d="M44 28 C38 30, 36 34, 38 38 L44 38 Z"
            fill="#D96300"
          />
        </g>

        {/* 5. L'AIGUILLE DE COUTURE : JAUNE SOLEIL (#FFD60A) */}
        <g transform="rotate(32 60 60)">
          {/* Corps de l'aiguille fuselée */}
          <path
            d="M58.5 22 
               L61.5 22
               L61 88
               C60.5 92, 59.5 92, 59 88
               Z"
            fill="url(#yellowGradient)"
            stroke="#212121"
            strokeWidth="1"
          />
          {/* Chas de l'aiguille (œil) */}
          <ellipse cx="60" cy="28" rx="1.2" ry="4" fill="#212121" />
          {/* Fil de couture stylisé qui passe dans le chas */}
          <path
            d="M60 28 C64 24, 70 26, 72 30 C74 34, 70 38, 76 42"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 6. ÉTOILES / ÉTINCELLES DU SAVOIR-FAIRE : JAUNE SOLEIL (#FFD60A) */}
        {/* Étoile principale en haut à droite */}
        <path
          d="M86 28 L88 34 L94 36 L88 38 L86 44 L84 38 L78 36 L84 34 Z"
          fill="#FFD60A"
          stroke="#212121"
          strokeWidth="0.8"
        />
        {/* Petite étoile scintillante */}
        <circle cx="28" cy="80" r="2.5" fill="#FFD60A" stroke="#212121" strokeWidth="0.6" />
        <circle cx="92" cy="74" r="2" fill="#FFFFFF" />
      </svg>

      {/* TEXTE / TYPOGRAPHIE OFFICIELLE */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-lg sm:text-xl leading-none ${
                darkBg ? 'text-white' : 'text-[#212121]'
              }`}
            >
              Artisan
              {/* Le mot "Pro" en Jaune Soleil (#FFD60A) ou Orange */}
              <span className="text-[#FFD60A] drop-shadow-xs bg-[#212121] px-1.5 py-0.5 rounded-md ml-0.5 font-black">
                Pro
              </span>
            </span>

            {/* Badge "Afrique" en Orange Vif (#FF7A00) */}
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#FF7A00] text-white rounded-md shadow-xs">
              Afrique
            </span>
          </div>

          <span
            className={`text-[10px] font-bold tracking-wide mt-0.5 ${
              darkBg ? 'text-neutral-300' : 'text-neutral-600'
            }`}
          >
            Le Réseau d'Artisans d'Excellence
          </span>
        </div>
      )}
    </div>
  );
};

export default ArtisanProIcon;
