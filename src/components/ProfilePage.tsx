import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  ExternalLink,
  Facebook,
  MessageCircle,
  Video,
  Share2,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  formatWhatsAppUrl,
  formatFacebookUrl,
  formatTikTokUrl,
} from '../utils/socialLinks.ts';
import {
  PROFILE_BANNER_PRESETS,
  getArtisanBanner,
  ProfileBannerPreset,
} from '../data/profileBanners.ts';
import { api } from '../services/api.ts';
import type { CallRecord } from '../types.ts';

export const ProfilePage: React.FC = () => {
  const {
    selectedArtisan,
    go,
    quoteModal,
    startChatWithArtisan,
    calculateDistance,
    showToast,
    currentUser,
    currentArtisan,
    updateUserProfile,
    uploadProfilePhoto,
    uploadCoverPhoto,
    refreshData,
  } = useApp();

  // Banner customization modal state
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>('');
  const [customBannerUrl, setCustomBannerUrl] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [whatsappVal, setWhatsappVal] = useState<string>('');
  const [facebookVal, setFacebookVal] = useState<string>('');
  const [tiktokVal, setTiktokVal] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedArtisan?.id) {
      setIsLoadingCalls(true);
      api.getCallHistory(selectedArtisan.id)
        .then((calls) => setCallHistory(calls))
        .catch((err) => console.warn('Erreur chargement historique appels:', err))
        .finally(() => setIsLoadingCalls(false));
    }
  }, [selectedArtisan?.id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast({
        title: 'Fichier trop volumineux',
        desc: 'Veuillez choisir une image de moins de 8 Mo.',
        type: 'warning',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'banner') {
        setCustomBannerUrl(result);
      } else {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!selectedArtisan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-neutral-500">Aucun artisan sélectionné.</p>
        <button
          onClick={() => go('search')}
          className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl"
        >
          Retourner à la recherche
        </button>
      </div>
    );
  }

  const distance = calculateDistance(selectedArtisan.lat, selectedArtisan.lng);

  // Determine WhatsApp link (from field or fallback to phone)
  const whatsappUrl = formatWhatsAppUrl(selectedArtisan.whatsapp || selectedArtisan.phone);
  const facebookUrl = formatFacebookUrl(selectedArtisan.facebook);
  const tiktokUrl = formatTikTokUrl(selectedArtisan.tiktok);

  const bannerImage = getArtisanBanner(selectedArtisan);

  // Can the user edit this profile?
  const canEdit =
    currentUser?.role === 'artisan' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.artisanId === selectedArtisan.id;

  const openBannerModal = () => {
    setSelectedPresetUrl(selectedArtisan.bannerUrl || bannerImage);
    setCustomBannerUrl(selectedArtisan.bannerUrl || '');
    setAvatarUrl(selectedArtisan.avatarUrl || '');
    setWhatsappVal(selectedArtisan.whatsapp || selectedArtisan.phone || '');
    setFacebookVal(selectedArtisan.facebook || '');
    setTiktokVal(selectedArtisan.tiktok || '');
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalBanner = customBannerUrl.trim() || selectedPresetUrl || selectedArtisan.bannerUrl;
      const finalAvatar = avatarUrl.trim() || selectedArtisan.avatarUrl;

      // Update in API avec préservation stricte
      await api.updateArtisan(selectedArtisan.id, {
        bannerUrl: finalBanner,
        coverUrl: finalBanner,
        avatarUrl: finalAvatar,
        photoUrl: finalAvatar,
        whatsapp: whatsappVal.trim() || undefined,
        facebook: facebookVal.trim() || undefined,
        tiktok: tiktokVal.trim() || undefined,
      });

      // Update local artisan object
      if (finalBanner) selectedArtisan.bannerUrl = finalBanner;
      if (finalAvatar) selectedArtisan.avatarUrl = finalAvatar;
      selectedArtisan.whatsapp = whatsappVal.trim();
      selectedArtisan.facebook = facebookVal.trim();
      selectedArtisan.tiktok = tiktokVal.trim();

      // If current user is this artisan or artisan user, sync
      if (currentUser) {
        if (finalAvatar) {
          try {
            await uploadProfilePhoto(finalAvatar);
          } catch {}
        }
        if (finalBanner) {
          try {
            await uploadCoverPhoto(finalBanner);
          } catch {}
        }
        await updateUserProfile(
          {
            whatsapp: whatsappVal.trim(),
            facebook: facebookVal.trim(),
            tiktok: tiktokVal.trim(),
            avatarUrl: finalAvatar,
            photoUrl: finalAvatar,
            bannerUrl: finalBanner,
            coverUrl: finalBanner,
          },
          {
            bannerUrl: finalBanner,
            coverUrl: finalBanner,
            avatarUrl: finalAvatar,
            photoUrl: finalAvatar,
            whatsapp: whatsappVal.trim(),
            facebook: facebookVal.trim(),
            tiktok: tiktokVal.trim(),
          }
        );
      }

      await refreshData();
      setIsBannerModalOpen(false);
      showToast({
        title: 'Bannière & Profil enregistrés !',
        desc: 'Votre profil a été mis à jour avec succès.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible d’enregistrer la bannière',
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${selectedArtisan.name} - ${selectedArtisan.trade} sur Artisan Pro Afrique`,
        text: `Découvrez le profil et les services de ${selectedArtisan.name} à ${selectedArtisan.city}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast({
        title: 'Lien copié !',
        desc: 'Le lien du profil a été copié dans votre presse-papier.',
        type: 'info',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => go('search')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Retour aux artisans</span>
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={openBannerModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Changer la bannière & réseaux</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white px-3 py-2 rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Partager ce profil</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card with Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* PROFILE BANNER IMAGE */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-neutral-900 group">
          <img
            src={bannerImage}
            alt={`Bannière de ${selectedArtisan.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-black/20 to-transparent"></div>

          {/* Banner Top Info / Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
                {selectedArtisan.trade}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-xs text-white text-xs font-bold border border-amber-400/30">
                {selectedArtisan.city}, {selectedArtisan.country}
              </span>
            </div>

            {/* Quick edit banner button on hover */}
            {canEdit && (
              <button
                onClick={openBannerModal}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Changer bannière</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-neutral-100 -mt-16 sm:-mt-20">
            {/* Avatar overlapping banner */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative">
                {selectedArtisan.avatarUrl ? (
                  <img
                    src={selectedArtisan.avatarUrl}
                    alt={selectedArtisan.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-md bg-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-white flex items-center justify-center text-4xl sm:text-5xl shadow-md shrink-0">
                    {selectedArtisan.emoji || '👨‍🔧'}
                  </div>
                )}
                {selectedArtisan.verified && (
                  <div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                    title="Artisan vérifié"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-6 sm:pt-10">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-950">
                    {selectedArtisan.name}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Membre Vérifié
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {selectedArtisan.plan}
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-600 font-bold">{selectedArtisan.trade}</span>
                  <span>·</span>
                  <span>
                    {selectedArtisan.city}, {selectedArtisan.country}
                  </span>
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-500 pt-1 flex-wrap">
                  <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedArtisan.rating} / 5</span>
                    <span className="text-neutral-500 font-normal">({selectedArtisan.reviewsCount} avis)</span>
                  </div>
                  {selectedArtisan.verified && (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Identité vérifiée
                    </span>
                  )}
                  {distance !== null && (
                    <span className="flex items-center gap-1 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />À {distance} km
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 pt-3 md:pt-10">
              {/* Direct WhatsApp Action */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>WhatsApp Direct</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200" />
                </a>
              )}

              <button
                onClick={() => startChatWithArtisan(selectedArtisan.id)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messagerie interne</span>
              </button>

              <button
                onClick={() => quoteModal.open(selectedArtisan)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Demander un devis</span>
              </button>
            </div>
          </div>

          {/* Réseaux Sociaux & Contact Direct (WhatsApp, Facebook, TikTok) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-neutral-50 via-amber-50/20 to-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Réseaux sociaux & Contact direct de l'artisan</span>
              </h2>
              <span className="text-[11px] text-neutral-500">Joignable 7j/7 sans intermédiaire</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* WhatsApp */}
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span>WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                    En ligne
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-mono">
                  {selectedArtisan.whatsapp || selectedArtisan.phone}
                </p>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Ouvrir WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-neutral-400 italic">Non configuré</span>
                )}
              </div>

              {/* Facebook */}
              <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <span>Facebook</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    Page Pro
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-mono truncate">
                  {selectedArtisan.facebook ? `@${selectedArtisan.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, '')}` : 'Non renseigné'}
                </p>
                {facebookUrl ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Voir sur Facebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-neutral-400 italic">Non configuré</span>
                )}
              </div>

              {/* TikTok */}
              <div className="p-3.5 rounded-xl bg-white border border-neutral-300 shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <span>TikTok</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200">
                    Vidéos Réalisations
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-mono truncate">
                  {selectedArtisan.tiktok ? `@${selectedArtisan.tiktok.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, '')}` : 'Non renseigné'}
                </p>
                {tiktokUrl ? (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Voir sur TikTok</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-neutral-400 italic">Non configuré</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900">Présentation & Savoir-faire</h2>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-3xl">
              {selectedArtisan.description ||
                `${selectedArtisan.name} est un artisan passionné et certifié à ${selectedArtisan.city}, spécialisé en ${selectedArtisan.trade} avec plusieurs années d'expérience et d'excellents retours clients.`}
            </p>
          </div>

          {/* General Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Tarif horaire moyen</span>
              <span className="font-bold text-neutral-900">{selectedArtisan.hourlyRate || '10 000 FCFA'}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Expérience</span>
              <span className="font-bold text-neutral-900">{selectedArtisan.experienceYears || 5} ans d'exercice</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Délais d'intervention</span>
              <span className="font-bold text-emerald-700">Sous 24h à 48h</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Garantie & Savoir-faire</span>
              <span className="font-bold text-neutral-900">Assuré & Certifié</span>
            </div>
          </div>

          {/* Services catalogue preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">Prestations & Tarifs directs</h2>
              <span className="text-xs text-neutral-500">Sélectionnez pour commander</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: `Intervention ${selectedArtisan.trade} standard`,
                  price: selectedArtisan.hourlyRate || '15 000 FCFA',
                  duration: '1-2 jours',
                  desc: 'Diagnostic complet, fournitures de qualité et réalisation soignée.',
                },
                {
                  title: 'Entretien & Rénovation complète',
                  price: 'Sur Devis gratuit',
                  duration: '3-5 jours',
                  desc: 'Devis sur-mesure gratuit avec déplacement sur site.',
                },
              ].map((srv, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-neutral-900">{srv.title}</h3>
                    <span className="font-extrabold text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {srv.price}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">{srv.desc}</p>
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Délai : {srv.duration}</span>
                  </div>
                  <button
                    onClick={() => quoteModal.open(selectedArtisan, srv.title)}
                    className="mt-3 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors text-center cursor-pointer"
                  >
                    Demander ce service
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews preview */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">Avis clients vérifiés</h2>
              <span className="text-xs font-bold text-neutral-500">Note globale : {selectedArtisan.rating} / 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Kouamé B. (Abidjan)</span>
                  <span className="text-amber-500 font-bold">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-neutral-600 italic">
                  « Travail très soigné, ponctuel et respectueux des délais. Contact facile via WhatsApp et devis respecté. Je recommande ! »
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Mariam D. (Cocody)</span>
                  <span className="text-amber-500 font-bold">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-neutral-600 italic">
                  « Devis clair et transparent, intervention rapide dès le lendemain. Échanges fluides sur WhatsApp et photos envoyées avant livraison. »
                </p>
              </div>
            </div>
          </div>

          {/* HISTORIQUE D'APPELS VOIP (REQUIREMENT 4) */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-sky-600" />
                  <span>Historique d'appels VoIP</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  Journal des communications vocales et vidéo sécurisées
                </p>
              </div>

              {/* Security & Privacy Badges (Dark styled) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-sky-400 text-[10.5px] font-bold shadow-2xs border border-neutral-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Chiffré de bout en bout</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-emerald-400 text-[10.5px] font-bold shadow-2xs border border-neutral-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Numéros Masqués</span>
                </span>
              </div>
            </div>

            {isLoadingCalls ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Chargement de l'historique des appels...
              </div>
            ) : callHistory.length > 0 ? (
              <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
                {callHistory.map((call, cIdx) => {
                  const isVideo = call.type === 'video';
                  const isMissed = call.status === 'missed';

                  return (
                    <div
                      key={call.id || `call-${cIdx}`}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            isMissed
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : isVideo
                              ? 'bg-sky-50 text-sky-600 border border-sky-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {isVideo ? (
                            <Video className="w-5 h-5 stroke-[2.2]" />
                          ) : (
                            <Phone className="w-5 h-5 stroke-[2.2]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                              {isVideo ? 'Appel vidéo VoIP' : 'Appel vocal VoIP'}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isMissed
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isMissed ? 'Appel manqué' : 'Terminé'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              {new Date(call.timestamp).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              à{' '}
                              {new Date(call.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              Durée : {isMissed ? '00:00' : call.formattedDuration}
                            </span>
                            <span>•</span>
                            <span className="text-[10.5px] text-neutral-500 font-medium">
                              {call.clientName ? `Client : ${call.clientName}` : 'Client vérifié'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startChatWithArtisan(selectedArtisan)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        <span className="hidden sm:inline">Rappeler</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Phone className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900">Aucun appel VoIP enregistré</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Passez un appel direct sécurisé depuis la messagerie pour discuter de votre devis sans dévoiler vos numéros de téléphone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startChatWithArtisan(selectedArtisan)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Démarrer un appel VoIP dans le chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BANNER & SOCIAL CUSTOMIZATION MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    Personnaliser la Bannière & Liens Sociaux
                  </h3>
                  <p className="text-xs text-neutral-300">
                    Modifiez la bannière d’en-tête, votre photo et vos réseaux (WhatsApp, Facebook, TikTok)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-5">
              {/* Banner Presets Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choisir un modèle de bannière africaine :</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROFILE_BANNER_PRESETS.map((preset) => {
                    const isSelected =
                      selectedPresetUrl === preset.url && !customBannerUrl.trim();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetUrl(preset.url);
                          setCustomBannerUrl('');
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 text-left transition-all h-20 group cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/40'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors p-1.5 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-white leading-tight drop-shadow-xs">
                            {preset.title}
                          </span>
                          {isSelected && (
                            <span className="self-end w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Téléversement photo depuis téléphone (Pas de lien URL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Photo de bannière</span>
                    </label>
                    {customBannerUrl && (
                      <span className="text-[10px] font-bold text-emerald-600">Photo choisie ✔</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Choisir depuis mon téléphone</span>
                  </button>
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    onChange={(e) => handlePhotoUpload(e, 'banner')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Photo de profil</span>
                    </label>
                    {avatarUrl && (
                      <span className="text-[10px] font-bold text-emerald-600">Photo choisie ✔</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Choisir depuis mon téléphone</span>
                  </button>
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={(e) => handlePhotoUpload(e, 'avatar')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Social Links Form (WhatsApp, Facebook, TikTok) */}
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Liens Réseaux Sociaux (WhatsApp, Facebook, TikTok) :
                </h4>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Numéro WhatsApp Direct *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={whatsappVal}
                    onChange={(e) => setWhatsappVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Exemple : +225 07 12 34 56 78 (permet aux clients de vous écrire directement sur WhatsApp)
                  </span>
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lien ou Identifiant Page Facebook</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: atelier.kouame ou https://facebook.com/atelier.kouame"
                    value={facebookVal}
                    onChange={(e) => setFacebookVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-neutral-900" />
                    <span>Identifiant ou Lien TikTok</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: @artisan_pro ou https://tiktok.com/@artisan_pro"
                    value={tiktokVal}
                    onChange={(e) => setTiktokVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
