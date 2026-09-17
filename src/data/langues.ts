// langues.ts - Système de langues & pays africains
import frJson from '../lang/fr.json';
import enJson from '../lang/en.json';

export interface LanguageTranslation {
  name: string;
  flag: string;
  code: string;
  accueil: string;
  Accueil: string;
  marketplace: string;
  messages: string;
  Messages: string;
  recherche: string;
  Recherche: string;
  quoiDeNeuf: string;
  publierPost: string;
  vendreArticle: string;
  nomArticle: string;
  prix: string;
  publier: string;
  Publier: string;
  contacter: string;
  verif: string;
  comment: string;
  propos: string;
  sousTitre: string;
  SousTitre: string;
  statuts: string;
  Statuts: string;
  ajouter: string;
  Ajouter: string;
  artisanPro: string;
  parametres: string;
  Parametres: string;
  langue: string;
  Langue: string;
  profil?: string;
  Profil: string;
  abonnements?: string;
  Abonnements: string;
  connexion?: string;
  Connexion: string;
  deconnexion?: string;
  Deconnexion: string;
  motDePasseOublie?: string;
  MotDePasseOublie: string;
  reinitialiser?: string;
  Reinitialiser: string;
  codeVerification?: string;
  CodeVerification: string;
  nouveauMotDePasse?: string;
  NouveauMotDePasse: string;
  confirmerMotDePasse?: string;
  ConfirmerMotDePasse: string;
  selectionnerPays?: string;
  SelectionnerPays: string;
  sortir: string;
  Sortir: string;
}

export type LanguageCode = 'fr' | 'en';

export const langs = {
  fr: frJson,
  en: enJson,
};

export const langues: Record<LanguageCode, LanguageTranslation> = {
  fr: {
    ...frJson,
    name: "Français (France)",
    flag: "🇫🇷",
    code: "fr",
    Accueil: frJson.accueil,
    Messages: frJson.messages,
    SousTitre: frJson.sousTitre,
    Recherche: frJson.recherche,
    Statuts: frJson.statuts,
    Ajouter: frJson.ajouter,
    Parametres: frJson.parametres,
    Langue: frJson.langue,
    Publier: frJson.publier,
    Profil: "Profil",
    Abonnements: "Abonnements",
    Connexion: "Connexion",
    Deconnexion: "Déconnexion",
    MotDePasseOublie: "Mot de passe oublié ?",
    Reinitialiser: "Réinitialiser",
    CodeVerification: "Code de vérification",
    NouveauMotDePasse: "Nouveau mot de passe",
    ConfirmerMotDePasse: "Confirmer le mot de passe",
    SelectionnerPays: "Sélectionner un pays",
    Sortir: frJson.sortir,
    sortir: frJson.sortir,
  },
  en: {
    ...enJson,
    name: "English",
    flag: "🇬🇧",
    code: "en",
    Accueil: enJson.accueil,
    Messages: enJson.messages,
    SousTitre: enJson.sousTitre,
    Recherche: enJson.recherche,
    Statuts: enJson.statuts,
    Ajouter: enJson.ajouter,
    Parametres: enJson.parametres,
    Langue: enJson.langue,
    Publier: enJson.publier,
    Profil: "Profile",
    Abonnements: "Subscriptions",
    Connexion: "Sign In",
    Deconnexion: "Sign Out",
    MotDePasseOublie: "Forgot password?",
    Reinitialiser: "Reset",
    CodeVerification: "Verification code",
    NouveauMotDePasse: "New password",
    ConfirmerMotDePasse: "Confirm password",
    SelectionnerPays: "Select country",
    Sortir: enJson.sortir,
    sortir: enJson.sortir,
  },
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
