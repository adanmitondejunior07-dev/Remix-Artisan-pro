export interface ProfileBannerPreset {
  id: string;
  title: string;
  category: string;
  url: string;
  previewColor: string;
  description: string;
}

export const PROFILE_BANNER_PRESETS: ProfileBannerPreset[] = [
  {
    id: 'couture_african',
    title: 'Atelier Couture & Pagnes Africains',
    category: 'Couture',
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-amber-700 via-orange-600 to-amber-900',
    description: 'Tissus wax, motifs colorés et atelier de haute couture africaine.',
  },
  {
    id: 'wood_carpentry',
    title: 'Menuiserie & Ébénisterie d’Art',
    category: 'Menuiserie',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-stone-800 via-amber-900 to-amber-950',
    description: 'Atelier de travail du bois massif, teck et iroko.',
  },
  {
    id: 'solar_tech',
    title: 'Énergie Solaire & Électricité Bâtiment',
    category: 'Électricité',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-blue-900 via-sky-700 to-amber-600',
    description: 'Panneaux solaires photovoltaïques et réseaux électriques haute performance.',
  },
  {
    id: 'mechanic_auto',
    title: 'Garage & Diagnostic Automobile Pro',
    category: 'Mécanique',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-neutral-900 via-neutral-800 to-amber-600',
    description: 'Outillage professionnel, moteurs modernes et mécanique de précision.',
  },
  {
    id: 'btp_construction',
    title: 'Génie Civil, Maçonnerie & BTP Moderne',
    category: 'Maçonnerie',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-amber-900 via-stone-800 to-neutral-900',
    description: 'Chantiers de construction, gros œuvre et finitions architecturales.',
  },
  {
    id: 'beauty_salon',
    title: 'Salon de Coiffure & Soins Esthétiques',
    category: 'Coiffure',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-rose-900 via-amber-800 to-neutral-900',
    description: 'Ambiance chaleureuse pour tresses, locks, barbier et soins capillaires.',
  },
  {
    id: 'plumbing_pro',
    title: 'Plomberie Sanitaire & Tuyauterie',
    category: 'Plomberie',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-sky-900 via-cyan-800 to-neutral-900',
    description: 'Installation sanitaire, robinetterie cuivre et raccords d’eau.',
  },
  {
    id: 'gold_african_pattern',
    title: 'Prestige Africain & Teintes Dorées',
    category: 'Général',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    previewColor: 'from-amber-600 via-yellow-600 to-neutral-950',
    description: 'Textures abstraites luxueuses aux couleurs chaudes de l’Afrique.',
  },
];

export const DEFAULT_BANNER = PROFILE_BANNER_PRESETS[0].url;

export interface ProfileAvatarPreset {
  id: string;
  label: string;
  url: string;
  category: string;
}

export const PROFILE_AVATAR_PRESETS: ProfileAvatarPreset[] = [
  {
    id: 'artisan_male_1',
    label: 'Artisan Atelier',
    category: 'Artisan',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'artisan_female_1',
    label: 'Artisane Créatrice',
    category: 'Artisane',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'artisan_electrician',
    label: 'Technicien Pro',
    category: 'Technique',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'artisan_designer',
    label: 'Styliste & Mode',
    category: 'Design',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'artisan_builder',
    label: 'Bâtiment & Maçon',
    category: 'BTP',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'artisan_beauty',
    label: 'Coiffure & Esthétique',
    category: 'Beauté',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  },
];

export function getArtisanBanner(artisan?: { trade?: string; bannerUrl?: string }): string {
  if (artisan?.bannerUrl && artisan.bannerUrl.trim().length > 0) {
    return artisan.bannerUrl;
  }
  const tradeLower = (artisan?.trade || '').toLowerCase();
  const matched = PROFILE_BANNER_PRESETS.find((p) =>
    tradeLower.includes(p.category.toLowerCase())
  );
  return matched ? matched.url : DEFAULT_BANNER;
}
