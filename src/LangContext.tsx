import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Translations {
  messages: string;
  sousTitre: string;
  recherche: string;
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
    messages: "Messages",
    sousTitre: "Retrouvez vos contacts WhatsApp et discutez en toute sécurité.",
    recherche: "Rechercher un artisan, un service ou un message",
    statuts: "STATUTS RÉCENTS",
    ajouter: "Ajouter",
    langue: "Langue",
    sortir: "Sortir",
    Sortir: "Sortir",
    artisanPro: "Artisan pro MS",
    parametres: "Paramètres",
  },
  en: {
    messages: "Messages",
    sousTitre: "Find your WhatsApp contacts and chat securely.",
    recherche: "Search for a craftsman, a service or a message",
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
