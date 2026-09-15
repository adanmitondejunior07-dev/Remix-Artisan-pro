import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  User,
  MapPin,
  Briefcase,
  Camera,
  Image as ImageIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Upload,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AFRICAN_COUNTRIES } from '../data/africanCountries.ts';

interface BecomeArtisanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_TRADES = [
  'Menuisier',
  'Plombier',
  'Électricien',
  'Couturière / Couturier',
  'Maçon',
  'Peintre en bâtiment',
  'Mécanicien automobile',
  'Coiffeur / Coiffeuse',
  'Frigoriste & Climatisation',
  'Soudeur & Ferronnier',
  'Carreleur',
  'Autre métier',
];

const SAMPLE_REALISATIONS = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
];

export const BecomeArtisanModal: React.FC<BecomeArtisanModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, go, showToast } = useApp();

  // 1. Nom
  const [nom, setNom] = useState(currentUser?.name?.split(' ')[1] || '');
  // 2. Prénom
  const [prenom, setPrenom] = useState(currentUser?.name?.split(' ')[0] || '');
  // 3. Photo de profil
  const [photo, setPhoto] = useState(
    currentUser?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
  );
  // 4. Pays
  const [countryCode, setCountryCode] = useState('CI');
  // 5. Ville
  const [ville, setVille] = useState(currentUser?.city || 'Abidjan');
  // 6. Métier
  const [metier, setMetier] = useState('Menuisier');
  const [customMetier, setCustomMetier] = useState('');
  // 7. Description
  const [description, setDescription] = useState('');
  // 8. Expérience
  const [experience, setExperience] = useState('5 ans');
  // 9. Photos réalisations
  const [realisations, setRealisations] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  ]);
  // 10. Téléphone vérifié
  const [phone, setPhone] = useState(currentUser?.phone || '+225 07 ');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  // 11. Case à cocher Conditions + Règles plateforme
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const realisationPhotoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const country = AFRICAN_COUNTRIES.find((c) => c.code === code);
    if (country) {
      setPhone(`${country.dialCode} `);
      if (country.popularCities && country.popularCities.length > 0) {
        setVille(country.popularCities[0]);
      }
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRealisationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRealisations((prev) => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeRealisation = (index: number) => {
    setRealisations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVerifyPhone = () => {
    if (!phone.trim() || phone.length < 8) {
      setErrors((prev) => ({ ...prev, phone: 'Numéro de téléphone invalide' }));
      return;
    }
    // Simulate instant verification / OTP for phone
    setIsPhoneVerified(true);
    setShowOtpInput(false);
    showToast({
      title: 'Téléphone vérifié !',
      desc: `Le numéro ${phone} est vérifié pour votre inscription artisan.`,
      type: 'success',
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';
    if (!photo) newErrors.photo = 'La photo de profil est obligatoire.';
    if (!countryCode) newErrors.country = 'Le pays est obligatoire.';
    if (!ville.trim()) newErrors.ville = 'La ville est obligatoire.';
    const finalTrade = metier === 'Autre métier' ? customMetier.trim() : metier;
    if (!finalTrade) newErrors.metier = 'Le métier est obligatoire.';
    if (!description.trim() || description.trim().length < 15) {
      newErrors.description = 'La description est obligatoire (au moins 15 caractères).';
    }
    if (!experience.trim()) newErrors.experience = 'L’expérience est obligatoire.';
    if (realisations.length === 0) {
      newErrors.realisations = 'Au moins une photo de réalisation est obligatoire.';
    }
    if (!phone.trim() || phone.length < 8) {
      newErrors.phone = 'Le numéro de téléphone est obligatoire.';
    }
    if (!isPhoneVerified) {
      newErrors.phoneVerified = 'Veuillez vérifier votre numéro de téléphone.';
    }
    if (!acceptedTerms) {
      newErrors.terms = 'Vous devez accepter les Conditions et Règles de la plateforme.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast({
        title: 'Formulaire incomplet',
        desc: 'Veuillez remplir tous les champs obligatoires avant de valider.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    const finalTrade = metier === 'Autre métier' ? customMetier.trim() : metier;
    const selectedCountry = AFRICAN_COUNTRIES.find((c) => c.code === countryCode);

    // Enregistrement des informations du dossier artisan candidat
    // ATTENTION: RÈGLE STRICTE: Ne modifie PAS le rôle tant que le paiement n'est pas fait !
    // currentUser.role reste 'client'.
    const pendingArtisanApplication = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      fullName: `${prenom.trim()} ${nom.trim()}`,
      photo,
      country: selectedCountry?.name || 'Côte d’Ivoire',
      countryCode,
      ville: ville.trim(),
      metier: finalTrade,
      description: description.trim(),
      experience: experience.trim(),
      realisations,
      phone: phone.trim(),
      isPhoneVerified: true,
      acceptedTermsAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'pending_payment',
    };

    try {
      localStorage.setItem('pending_artisan_application', JSON.stringify(pendingArtisanApplication));
    } catch (err) {
      console.warn('LocalStorage err:', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();

      showToast({
        title: 'Dossier Artisan Validé !',
        desc: 'Votre profil a été enregistré avec succès. Choisissez maintenant votre formule d’abonnement.',
        type: 'success',
      });

      // Redirection obligatoire vers la page ABONNEMENTS ARTISANPRO
      go('abonnements');
    }, 600);
  };

  const currentCountryObj = AFRICAN_COUNTRIES.find((c) => c.code === countryCode) || AFRICAN_COUNTRIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full my-6 p-5 sm:p-8 shadow-2xl space-y-6 relative text-neutral-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-neutral-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] text-[10px] font-black uppercase tracking-wider mb-1">
              Formulaire Obligatoire
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Devenir Artisan Professionnel
            </h2>
            <p className="text-xs text-neutral-400">
              Renseignez vos informations artisanales pour rejoindre le réseau panafricain certifié.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Identité (Nom, Prénom, Photo) */}
          <div className="space-y-4 bg-neutral-950/70 p-4 sm:p-5 rounded-2xl border border-neutral-800/80">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6B00]" />
              <span>1. Identité & Photo de profil</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Kouamé"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#FF6B00] ${
                    errors.nom ? 'border-red-500' : 'border-neutral-800'
                  }`}
                />
                {errors.nom && <p className="text-[10px] text-red-400 mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex: Jean-Marc"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#FF6B00] ${
                    errors.prenom ? 'border-red-500' : 'border-neutral-800'
                  }`}
                />
                {errors.prenom && <p className="text-[10px] text-red-400 mt-1">{errors.prenom}</p>}
              </div>
            </div>

            {/* Photo de Profil */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Photo de profil professionnelle <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-800 border-2 border-neutral-700 shrink-0">
                  {photo ? (
                    <img src={photo} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer border border-neutral-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choisir une photo depuis mon appareil</span>
                  </button>
                  <p className="text-[11px] text-neutral-500">
                    Format JPG, PNG. Une photo nette de vous inspire confiance aux clients.
                  </p>
                </div>
              </div>
              {errors.photo && <p className="text-[10px] text-red-400 mt-1">{errors.photo}</p>}
            </div>
          </div>

          {/* Section 2: Localisation & Métier */}
          <div className="space-y-4 bg-neutral-950/70 p-4 sm:p-5 rounded-2xl border border-neutral-800/80">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B00]" />
              <span>2. Pays, Ville & Métier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pays */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00] cursor-pointer"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ville */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                {currentCountryObj.popularCities && currentCountryObj.popularCities.length > 0 ? (
                  <select
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00] cursor-pointer"
                  >
                    {currentCountryObj.popularCities.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value="Autre ville">Autre ville</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    placeholder="Ex: Abidjan, Bouaké..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                  />
                )}
                {errors.ville && <p className="text-[10px] text-red-400 mt-1">{errors.ville}</p>}
              </div>
            </div>

            {/* Métier */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-300">
                Métier principal <span className="text-red-500">*</span>
              </label>
              <select
                value={metier}
                onChange={(e) => setMetier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00] cursor-pointer"
              >
                {COMMON_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {metier === 'Autre métier' && (
                <input
                  type="text"
                  value={customMetier}
                  onChange={(e) => setCustomMetier(e.target.value)}
                  placeholder="Précisez votre métier exact..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00] mt-2"
                />
              )}
              {errors.metier && <p className="text-[10px] text-red-400">{errors.metier}</p>}
            </div>
          </div>

          {/* Section 3: Description & Expérience */}
          <div className="space-y-4 bg-neutral-950/70 p-4 sm:p-5 rounded-2xl border border-neutral-800/80">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              <span>3. Compétences, Expérience & Réalisations</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Années d'expérience professionnelle <span className="text-red-500">*</span>
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="1 à 2 ans">1 à 2 ans d'expérience</option>
                <option value="3 à 5 ans">3 à 5 ans d'expérience</option>
                <option value="5 à 10 ans">5 à 10 ans d'expérience</option>
                <option value="Plus de 10 ans">Plus de 10 ans d'expérience (Expert)</option>
              </select>
              {errors.experience && <p className="text-[10px] text-red-400 mt-1">{errors.experience}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Description de vos prestations & atelier <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez vos compétences, vos types de travaux, vos délais habituels et ce qui fait votre force..."
                className={`w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#FF6B00] ${
                  errors.description ? 'border-red-500' : 'border-neutral-800'
                }`}
              />
              {errors.description && <p className="text-[10px] text-red-400 mt-1">{errors.description}</p>}
            </div>

            {/* Photos Réalisations (Chantiers passés) */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Photos de vos réalisations (chantiers, créations) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {realisations.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-neutral-800 bg-neutral-900">
                    <img src={img} alt={`Réalisation ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeRealisation(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-red-400 hover:text-red-300 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <input
                  type="file"
                  ref={realisationPhotoInputRef}
                  accept="image/*"
                  onChange={handleRealisationPhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => realisationPhotoInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-neutral-700 hover:border-[#FF6B00] aspect-square flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-[#FF6B00] transition-colors cursor-pointer bg-neutral-900/40"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Ajouter</span>
                </button>
              </div>
              {errors.realisations && <p className="text-[10px] text-red-400 mt-1">{errors.realisations}</p>}
            </div>
          </div>

          {/* Section 4: Téléphone Vérifié & Conditions */}
          <div className="space-y-4 bg-neutral-950/70 p-4 sm:p-5 rounded-2xl border border-neutral-800/80">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#FF6B00]" />
              <span>4. Téléphone vérifié & Engagement</span>
            </h3>

            {/* Téléphone vérifié */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1">
                Numéro de téléphone vérifié <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                  placeholder="+225 07..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-[#FF6B00]"
                />
                <button
                  type="button"
                  onClick={handleVerifyPhone}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isPhoneVerified
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#FF6B00] hover:bg-[#e05e00] text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isPhoneVerified ? 'Numéro Vérifié' : 'Vérifier'}</span>
                </button>
              </div>
              {errors.phone && <p className="text-[10px] text-red-400 mt-1">{errors.phone}</p>}
            </div>

            {/* Case à cocher Conditions + Règles */}
            <div className="pt-2 border-t border-neutral-800/80">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded-md text-[#FF6B00] border-neutral-700 bg-neutral-900 focus:ring-[#FF6B00] cursor-pointer"
                />
                <span className="text-xs text-neutral-300 leading-relaxed">
                  J'accepte expressément les <strong className="text-white">Conditions Générales d'Utilisation</strong> et les <strong className="text-white">Règles Déontologiques de la plateforme Artisan Pro Afrique</strong> (ponctualité, tarification loyale, courtoisie envers les clients). <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.terms && <p className="text-[10px] text-red-400 mt-1 pl-7">{errors.terms}</p>}
            </div>
          </div>

          {/* Bouton de Soumission & Redirection vers Abonnements */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Valider mon dossier & Choisir mon abonnement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-neutral-500">
              Votre rôle client restera inchangé tant que le paiement de votre abonnement n'aura pas été finalisé.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
