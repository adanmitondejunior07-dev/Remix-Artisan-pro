import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Translations {
  accueil: string;
  marketplace: string;
  messages: string;
  recherche: string;
  quoiDeNeuf: string;
  publierPost: string;
  vendreArticle: string;
  nomArticle: string;
  prix: string;
  publier: string;
  contacter: string;
  verif: string;
  comment: string;
  propos: string;
  sousTitre: string;
  statuts: string;
  ajouter: string;
  langue: string;
  sortir: string;
  Sortir?: string;
  artisanPro?: string;
  parametres?: string;
}

export type LangType = 'fr' | 'en';

export const traductions: Record<LangType, Translations> = {
  fr: {
    accueil: "Accueil",
    marketplace: "Marketplace",
    messages: "Messages",
    recherche: "Rechercher...",
    quoiDeNeuf: "Quoi de neuf, ",
    publierPost: "Publier un post",
    vendreArticle: "Vendre un article",
    nomArticle: "Nom de l'article",
    prix: "Votre prix",
    publier: "Publier",
    contacter: "Contacter le vendeur",
    verif: "Vérification Artisan",
    comment: "Comment ça marche?",
    propos: "À propos",
    sousTitre: "Retrouvez vos contacts WhatsApp et discutez en toute sécurité.",
    statuts: "STATUTS RÉCENTS",
    ajouter: "Ajouter",
    langue: "Langue",
    sortir: "Sortir",
    Sortir: "Sortir",
    artisanPro: "Artisan pro MS",
    parametres: "Paramètres",
  },
  en: {
    accueil: "Home",
    marketplace: "Marketplace",
    messages: "Messages",
    recherche: "Search...",
    quoiDeNeuf: "What's new, ",
    publierPost: "Create a post",
    vendreArticle: "Sell an item",
    nomArticle: "Item name",
    prix: "Your price",
    publier: "Publish",
    contacter: "Contact seller",
    verif: "Artisan Verification",
    comment: "How it works?",
    propos: "About",
    sousTitre: "Find your WhatsApp contacts and chat securely.",
    statuts: "RECENT STATUSES",
    ajouter: "Add",
    langue: "Language",
    sortir: "Exit",
    Sortir: "Exit",
    artisanPro: "Pro Artisan MS",
    parametres: "Settings",
  },
};

interface LangContextType {
  lang: LangType;
  changeLang: (newLang: LangType) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  lang: 'fr',
  changeLang: () => {},
  t: traductions.fr,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangType>(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('lang') ||
        localStorage.getItem('app_lang') ||
        localStorage.getItem('artisanpro_langue');
      if (saved === 'fr' || saved === 'en') return saved;
    }
    return 'fr';
  });

  const changeLang = (newLang: LangType) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', newLang);
      localStorage.setItem('app_lang', newLang);
      localStorage.setItem('artisanpro_langue', newLang);
    }
    setLang(newLang);
  };

  const t = traductions[lang] || traductions.fr;

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
