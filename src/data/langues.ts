// langues.ts - Système de langues & pays africains
export interface LanguageTranslation {
  name: string;
  flag: string;
  code: string;
  Messages: string;
  Recherche: string;
  Statuts: string;
  Ajouter: string;
  Parametres: string;
  Profil: string;
  Abonnements: string;
  Publier: string;
  Accueil: string;
  Connexion: string;
  Deconnexion: string;
  MotDePasseOublie: string;
  Reinitialiser: string;
  CodeVerification: string;
  NouveauMotDePasse: string;
  ConfirmerMotDePasse: string;
  SelectionnerPays: string;
  Langue: string;
}

export type LanguageCode = 'fr' | 'en';

export const langues: Record<LanguageCode, LanguageTranslation> = {
  fr: {
    name: "Français (France)",
    flag: "🇫🇷",
    code: "fr",
    Messages: "Messages",
    Recherche: "Rechercher un artisan...",
    Statuts: "STATUTS RÉCENTS",
    Ajouter: "Ajouter",
    Parametres: "Paramètres",
    Profil: "Profil",
    Abonnements: "Abonnements",
    Publier: "Publier une réalisation",
    Accueil: "Fil d'actualité",
    Connexion: "Connexion",
    Deconnexion: "Déconnexion",
    MotDePasseOublie: "Mot de passe oublié ?",
    Reinitialiser: "Réinitialiser",
    CodeVerification: "Code de vérification",
    NouveauMotDePasse: "Nouveau mot de passe",
    ConfirmerMotDePasse: "Confirmer le mot de passe",
    SelectionnerPays: "Sélectionner un pays",
    Langue: "Langue",
  },
  en: {
    name: "English",
    flag: "🇬🇧",
    code: "en",
    Messages: "Messages",
    Recherche: "Search for a craftsman...",
    Statuts: "RECENT STATUSES",
    Ajouter: "Add",
    Parametres: "Settings",
    Profil: "Profile",
    Abonnements: "Subscriptions",
    Publier: "Share a project",
    Accueil: "News Feed",
    Connexion: "Sign In",
    Deconnexion: "Sign Out",
    MotDePasseOublie: "Forgot password?",
    Reinitialiser: "Reset",
    CodeVerification: "Verification code",
    NouveauMotDePasse: "New password",
    ConfirmerMotDePasse: "Confirm password",
    SelectionnerPays: "Select country",
    Langue: "Language",
  }
};

// Liste pays africains comme Facebook
export const paysAfricains = [
  { nom: "Bénin", drapeau: "🇧🇯", langue: "fr" },
  { nom: "Côte d'Ivoire", drapeau: "🇨🇮", langue: "fr" },
  { nom: "Sénégal", drapeau: "🇸🇳", langue: "fr" },
  { nom: "Togo", drapeau: "🇹🇬", langue: "fr" },
  { nom: "Cameroun", drapeau: "🇨🇲", langue: "fr" },
  { nom: "Mali", drapeau: "🇲🇱", langue: "fr" },
  { nom: "Nigeria", drapeau: "🇳🇬", langue: "en" },
  { nom: "Ghana", drapeau: "🇬🇭", langue: "en" },
  { nom: "Afrique du Sud", drapeau: "🇿🇦", langue: "en" },
];
