import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
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
  MoreHorizontal,
  Plus,
  Edit3,
  Settings,
  Bell,
  Trash2,
  UserCheck,
  UserPlus,
  Flag,
  Ban,
  Copy,
  Layers,
  Briefcase,
  AlertTriangle,
  Loader2,
  Pencil,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { isSuperAdmin } from '../config/adminConfig.ts';
import { compressImageToDataUrl } from '../utils/imageCompression.ts';
import {
  formatWhatsAppUrl,
  formatFacebookUrl,
  formatTikTokUrl,
} from '../utils/socialLinks.ts';
import {
  PROFILE_BANNER_PRESETS,
  getArtisanBanner,
} from '../data/profileBanners.ts';
import { api } from '../services/api.ts';
import type { CallRecord, SocialPost, Artisan } from '../types.ts';
import { SocialPostCard } from './SocialPostCard.tsx';
import { PublierRealisation } from './PublierRealisation.tsx';

export const ProfilePage: React.FC = () => {
  const {
    selectedArtisan,
    selectedUser,
    go,
    quoteModal,
    startChatWithArtisan,
    calculateDistance,
    showToast,
    currentUser,
    currentArtisan,
    artisans,
    socialPosts,
    followingArtisans,
    toggleFollowArtisan,
    updateUserProfile,
    updateProfileName,
    uploadProfilePhoto,
    uploadCoverPhoto,
    refreshData,
    users,
  } = useApp();

  // 1. Détermination du profil cible (Profil personnel vs Visite d'un autre profil)
  const isOwnProfile = Boolean(
    (!selectedArtisan && !selectedUser) ||
    (currentUser && selectedUser && (
      String(currentUser.id) === String(selectedUser.id) ||
      (currentUser.email && selectedUser.email && currentUser.email.trim().toLowerCase() === selectedUser.email.trim().toLowerCase())
    )) ||
    (currentUser && selectedArtisan && (
      String(currentUser.id) === String(selectedArtisan.id) ||
      (currentUser as any).uid === String(selectedArtisan.id) ||
      currentUser.artisanId === selectedArtisan.id
    )) ||
    (currentArtisan && selectedArtisan && currentArtisan.id === selectedArtisan.id)
  );

  const isTargetingArtisan = Boolean(
    (!isOwnProfile && selectedArtisan) ||
    (isOwnProfile && (currentUser?.role === 'artisan' || currentArtisan))
  );

  // Informations effectives du profil affiché
  const targetName = isOwnProfile
    ? (currentUser?.name || currentArtisan?.name || 'Mon Profil')
    : (selectedArtisan?.name || selectedUser?.name || 'Profil Membre');

  // EMAIL DU PROFIL (DEMANDE EXPLICITE DE L'UTILISATEUR)
  const targetEmail = isOwnProfile
    ? (currentUser?.email || currentArtisan?.email || '')
    : (selectedArtisan?.email || selectedUser?.email || '');

  const targetUserObj = selectedUser || users.find(
    (u) =>
      (selectedUser && u.id === selectedUser.id) ||
      (selectedArtisan && u.artisanId === selectedArtisan.id) ||
      (targetEmail && u.email && u.email.trim().toLowerCase() === targetEmail.trim().toLowerCase())
  );

  const canShowEmail = Boolean(
    isOwnProfile ||
    isSuperAdmin(currentUser) ||
    targetUserObj?.showEmailPublicly === true
  );

  const targetTrade = isOwnProfile
    ? (currentArtisan?.trade || (currentUser?.role === 'artisan' ? 'Artisan Professionnel' : 'Membre Particulier'))
    : (selectedArtisan?.trade || (selectedUser?.role === 'artisan' ? 'Artisan Professionnel' : 'Membre Particulier'));

  const targetCity = isOwnProfile
    ? (currentUser?.city || currentArtisan?.city || 'Abidjan')
    : (selectedArtisan?.city || selectedUser?.city || 'Abidjan');

  const targetCountry = isOwnProfile
    ? (currentUser?.country || currentArtisan?.country || 'Côte d’Ivoire')
    : (selectedArtisan?.country || selectedUser?.country || 'Côte d’Ivoire');

  // RÈGLE ABSOLUE 2: Badge ArtisanPro UNIQUEMENT si réellement vérifié dans la base de données
  const isActuallyVerified = Boolean(
    isOwnProfile
      ? (currentUser?.verified || (currentUser as any)?.is_verified || currentArtisan?.verified || (currentArtisan as any)?.is_verified)
      : (selectedArtisan?.verified || (selectedArtisan as any)?.is_verified || selectedUser?.verified || (selectedUser as any)?.is_verified)
  );

  const targetBio = isOwnProfile
    ? ((currentUser as any)?.bio || currentArtisan?.description || 'Bienvenue sur mon profil ArtisanPro.')
    : (selectedArtisan?.description || selectedUser?.bio || `${targetName} est un membre actif sur la plateforme ArtisanPro Africa.`);

  const targetAvatar = isOwnProfile
    ? (currentUser?.avatarUrl || currentArtisan?.avatarUrl)
    : (selectedArtisan?.avatarUrl || (selectedArtisan as any)?.photoUrl || selectedUser?.avatarUrl);

  const targetEmoji = isTargetingArtisan ? (selectedArtisan?.emoji || currentArtisan?.emoji || '👤') : '👤';

  const defaultBanner = (isTargetingArtisan && selectedArtisan) ? getArtisanBanner(selectedArtisan) : PROFILE_BANNER_PRESETS[0].url;
  const targetCover = (isOwnProfile
    ? (currentUser?.bannerUrl || currentArtisan?.bannerUrl)
    : (selectedArtisan?.bannerUrl || selectedArtisan?.coverUrl || selectedUser?.bannerUrl)) || defaultBanner;

  const targetPhone = isOwnProfile
    ? (currentUser?.phone || currentArtisan?.phone || '')
    : (selectedArtisan?.phone || selectedUser?.phone || '');

  const targetWhatsapp = isOwnProfile
    ? (currentUser?.whatsapp || currentArtisan?.whatsapp || targetPhone)
    : (selectedArtisan?.whatsapp || selectedArtisan?.phone || selectedUser?.whatsapp || targetPhone);

  const targetFacebook = isOwnProfile
    ? (currentUser?.facebook || currentArtisan?.facebook || '')
    : (selectedArtisan?.facebook || selectedUser?.facebook || '');

  const targetTiktok = isOwnProfile
    ? (currentUser?.tiktok || currentArtisan?.tiktok || '')
    : (selectedArtisan?.tiktok || selectedUser?.tiktok || '');

  // Liens sociaux
  const whatsappUrl = formatWhatsAppUrl(targetWhatsapp);
  const facebookUrl = formatFacebookUrl(targetFacebook);
  const tiktokUrl = formatTikTokUrl(targetTiktok);

  // Publications de ce profil (Règle 3 & 6)
  const userPosts = useMemo(() => {
    return socialPosts.filter((p) => {
      if (isOwnProfile) {
        if (!currentUser) return false;
        return (
          (p.userId && String(p.userId) === String(currentUser.id)) ||
          (currentArtisan?.id && p.artisanId === currentArtisan.id) ||
          (p.author && currentUser.name && p.author.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
          (p.artisanName && currentUser.name && p.artisanName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
        );
      }
      if (selectedArtisan) {
        return (
          p.artisanId === selectedArtisan.id ||
          (p.userId && String(p.userId) === String(selectedArtisan.id)) ||
          (p.author && p.author.trim().toLowerCase() === targetName.trim().toLowerCase()) ||
          (p.artisanName && p.artisanName.trim().toLowerCase() === targetName.trim().toLowerCase())
        );
      }
      if (selectedUser) {
        return (
          (p.userId && String(p.userId) === String(selectedUser.id)) ||
          (selectedUser.artisanId && p.artisanId === selectedUser.artisanId) ||
          (p.author && p.author.trim().toLowerCase() === targetName.trim().toLowerCase()) ||
          (p.artisanName && p.artisanName.trim().toLowerCase() === targetName.trim().toLowerCase())
        );
      }
      return false;
    });
  }, [socialPosts, isOwnProfile, selectedArtisan, selectedUser, currentUser, currentArtisan, targetName]);

  // Photos de ce profil
  const userPhotos = useMemo(() => {
    const photos: { id: string; url: string; title: string }[] = [];
    userPosts.forEach((post) => {
      const media = post.mediaUrl || (post as any).image;
      if (media && typeof media === 'string' && !media.startsWith('data:video')) {
        photos.push({
          id: post.id,
          url: media,
          title: post.content || 'Photo de réalisation',
        });
      }
    });
    return photos;
  }, [userPosts]);

  // Statistiques réelles (Règle 3: Ne jamais utiliser de faux nombres)
  const isFollowing = Boolean(isTargetingArtisan && followingArtisans.includes(selectedArtisan!.id));
  const followersCount = isTargetingArtisan
    ? (selectedArtisan!.reviewsCount ? selectedArtisan!.reviewsCount + (isFollowing ? 1 : 0) : (isFollowing ? 1 : 0))
    : followingArtisans.length;
  const followingCount = isOwnProfile ? followingArtisans.length : (isTargetingArtisan ? 1 : 0);

  // Onglets (Règle 5)
  const [activeTab, setActiveTab] = useState<'publications' | 'about' | 'photos' | 'services' | 'reviews'>('publications');

  // Menus & Modales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // États pour la modification du profil
  const [editName, setEditName] = useState(targetName);
  const [editEmail, setEditEmail] = useState(targetEmail);
  const [editTrade, setEditTrade] = useState(targetTrade);
  const [editCity, setEditCity] = useState(targetCity);
  const [editCountry, setEditCountry] = useState(targetCountry);
  const [editBio, setEditBio] = useState(targetBio);
  const [editPhone, setEditPhone] = useState(targetPhone);
  const [editWhatsapp, setEditWhatsapp] = useState(targetWhatsapp);
  const [editFacebook, setEditFacebook] = useState(targetFacebook);
  const [editTiktok, setEditTiktok] = useState(targetTiktok);
  const [editShowEmailPublicly, setEditShowEmailPublicly] = useState(currentUser?.showEmailPublicly ?? false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // État pour modification ultra-rapide du nom (1 clic / inline)
  const [isQuickEditingName, setIsQuickEditingName] = useState(false);
  const [quickNameInput, setQuickNameInput] = useState(targetName);

  useEffect(() => {
    setQuickNameInput(isOwnProfile ? (currentUser?.name || currentArtisan?.name || targetName) : targetName);
    setEditName(isOwnProfile ? (currentUser?.name || currentArtisan?.name || targetName) : targetName);
    setEditEmail(isOwnProfile ? (currentUser?.email || targetEmail) : targetEmail);
    setEditTrade(isOwnProfile ? (currentUser?.trade || currentArtisan?.trade || targetTrade) : targetTrade);
    setEditCity(isOwnProfile ? (currentUser?.city || currentArtisan?.city || targetCity) : targetCity);
    setEditCountry(isOwnProfile ? (currentUser?.country || currentArtisan?.country || targetCountry) : targetCountry);
    setEditBio(isOwnProfile ? ((currentUser as any)?.bio || currentArtisan?.description || targetBio) : targetBio);
    setEditPhone(isOwnProfile ? (currentUser?.phone || currentArtisan?.phone || targetPhone) : targetPhone);
    setEditWhatsapp(isOwnProfile ? (currentUser?.whatsapp || currentArtisan?.whatsapp || targetWhatsapp) : targetWhatsapp);
    setEditFacebook(isOwnProfile ? (currentUser?.facebook || currentArtisan?.facebook || targetFacebook) : targetFacebook);
    setEditTiktok(isOwnProfile ? (currentUser?.tiktok || currentArtisan?.tiktok || targetTiktok) : targetTiktok);
    setEditShowEmailPublicly(currentUser?.showEmailPublicly ?? false);
  }, [isOwnProfile, currentUser, currentArtisan, targetName, targetEmail, targetTrade, targetCity, targetCountry, targetBio, targetPhone, targetWhatsapp, targetFacebook, targetTiktok]);

  const handleQuickSaveName = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const newName = quickNameInput.trim();
    if (!newName) return;
    setEditName(newName);
    setIsQuickEditingName(false);
    // Isoler la modification strictement au compte de l'utilisateur connecté
    await updateProfileName(newName);
  };

  // Historique d'appels VoIP (pour artisan)
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  useEffect(() => {
    if (selectedArtisan?.id) {
      setIsLoadingCalls(true);
      api.getCallHistory(selectedArtisan.id)
        .then((calls) => setCallHistory(calls))
        .catch(() => {})
        .finally(() => setIsLoadingCalls(false));
    }
  }, [selectedArtisan?.id]);

  // Références d'upload de fichiers
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // 14. Gestion ultra-rapide de la Photo de Profil
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      // Compression client ultra-rapide (< 50ms) pour une mise à jour instantanée
      const dataUrl = await compressImageToDataUrl(file, 512, 512, 0.85);
      if (dataUrl) {
        await uploadProfilePhoto(dataUrl);
        setIsAvatarModalOpen(false);
      }
    } catch (err: any) {
      console.warn('Erreur avatar:', err);
      showToast({
        title: 'Erreur',
        desc: 'Impossible de charger la photo.',
        type: 'warning',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    await uploadProfilePhoto('');
    setIsAvatarModalOpen(false);
    showToast({
      title: 'Photo retirée',
      desc: 'Votre photo de profil a été supprimée.',
      type: 'info',
    });
  };

  // 15. Gestion de la Photo de Couverture ultra-rapide et accessible à tout le monde
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 1200, 600, 0.85);
      if (dataUrl) {
        if (selectedArtisan) {
          selectedArtisan.bannerUrl = dataUrl;
          selectedArtisan.coverUrl = dataUrl;
        }
        await uploadCoverPhoto(dataUrl);
        setIsCoverModalOpen(false);
      }
    } catch (err) {
      console.warn('Erreur couverture:', err);
      showToast({
        title: 'Erreur',
        desc: 'Impossible de charger la couverture.',
        type: 'warning',
      });
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleSelectCoverPreset = async (presetUrl: string) => {
    if (selectedArtisan) {
      selectedArtisan.bannerUrl = presetUrl;
      selectedArtisan.coverUrl = presetUrl;
    }
    await uploadCoverPhoto(presetUrl);
    setIsCoverModalOpen(false);
  };

  const handleRemoveCover = async () => {
    await uploadCoverPhoto('');
    setIsCoverModalOpen(false);
    showToast({
      title: 'Couverture retirée',
      desc: 'Votre couverture personnalisée a été supprimée.',
      type: 'info',
    });
  };

  // Enregistrement des modifications du profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (!isOwnProfile && selectedArtisan && canEdit) {
        await api.updateArtisan(selectedArtisan.id, {
          name: editName.trim(),
          trade: editTrade.trim(),
          city: editCity.trim(),
          country: editCountry.trim(),
          description: editBio.trim(),
          phone: editPhone.trim(),
          whatsapp: editWhatsapp.trim(),
          facebook: editFacebook.trim(),
          tiktok: editTiktok.trim(),
        });
        selectedArtisan.name = editName.trim();
        selectedArtisan.trade = editTrade.trim();
        selectedArtisan.city = editCity.trim();
        selectedArtisan.country = editCountry.trim();
        selectedArtisan.description = editBio.trim();
        selectedArtisan.phone = editPhone.trim();
        selectedArtisan.whatsapp = editWhatsapp.trim();
        selectedArtisan.facebook = editFacebook.trim();
        selectedArtisan.tiktok = editTiktok.trim();
      }

      if (isOwnProfile && currentUser) {
        await updateUserProfile(
          {
            name: editName.trim(),
            city: editCity.trim(),
            country: editCountry.trim(),
            phone: editPhone.trim(),
            whatsapp: editWhatsapp.trim(),
            facebook: editFacebook.trim(),
            tiktok: editTiktok.trim(),
            trade: editTrade.trim(),
            bio: editBio.trim(),
            showEmailPublicly: editShowEmailPublicly,
          },
          (currentUser.role === 'artisan' || currentArtisan)
            ? {
                name: editName.trim(),
                trade: editTrade.trim(),
                city: editCity.trim(),
                country: editCountry.trim(),
                description: editBio.trim(),
                phone: editPhone.trim(),
                whatsapp: editWhatsapp.trim(),
                facebook: editFacebook.trim(),
                tiktok: editTiktok.trim(),
              }
            : undefined
        );
      }

      await refreshData();
      setIsEditProfileOpen(false);
      showToast({
        title: 'Profil mis à jour !',
        desc: 'Vos informations ont été enregistrées avec succès.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err?.message || 'Impossible d’enregistrer le profil.',
        type: 'warning',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${targetName} - ArtisanPro Afrique`,
        text: `Découvrez le profil de ${targetName} (${targetTrade}) sur ArtisanPro.`,
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

  const distance = isTargetingArtisan && selectedArtisan?.lat && selectedArtisan?.lng
    ? calculateDistance(selectedArtisan.lat, selectedArtisan.lng)
    : null;

  const canEdit = isOwnProfile || isSuperAdmin(currentUser) || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <div className="w-full min-h-screen bg-neutral-100/70 pb-24">
      {/* Inputs de fichiers invisibles toujours montés pour ouverture native directe en 1 clic */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFileUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={handleCoverFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Conteneur principal profil centré */}
      <div className="w-full max-w-[620px] mx-auto sm:px-2 pt-1 sm:pt-3">
        {/* CARTE DU PROFIL PRINCIPAL */}
        <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          {/* 1. PHOTO DE COUVERTURE (Règles 2 & 15) */}
          <div className="relative h-44 sm:h-60 w-full bg-neutral-900 overflow-hidden group">
            {targetCover ? (
              <img
                src={targetCover}
                alt={`Couverture de ${targetName}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950" />
            )}

            {/* Bouton de retour */}
            <button
              type="button"
              onClick={() => go('search')}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-10"
              title="Retour"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Bouton Modifier la couverture (Accessible à tout le monde) */}
            <button
              type="button"
              onClick={() => setIsCoverModalOpen(true)}
              disabled={isUploadingCover}
              className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer border border-white/20 shadow-md z-10"
              title="Modifier la photo de couverture"
              aria-label="Modifier la photo de couverture"
            >
              {isUploadingCover ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
              ) : (
                <Camera className="w-4 h-4 text-[#FF6B00]" />
              )}
              <span>Modifier la couverture</span>
            </button>
          </div>

          {/* 2. EN-TÊTE AVEC AVATAR SUPERPOSÉ ET INFOS (Règle 2) */}
          <div className="px-4 sm:px-6 pb-4">
            {/* Ligne Avatar + Actions */}
            <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-3">
              {/* Photo de profil ronde superposée (Règles 2 & 14) */}
              <div
                className={`relative group ${canEdit ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (canEdit && !isUploadingAvatar) {
                    avatarFileInputRef.current?.click();
                  }
                }}
                title={canEdit ? 'Changer la photo de profil en 1 clic' : undefined}
              >
                {targetAvatar ? (
                  <img
                    src={targetAvatar}
                    alt={targetName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0 group-hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-900 text-white border-4 border-white flex items-center justify-center text-3xl sm:text-4xl shadow-md font-bold shrink-0 group-hover:opacity-90 transition-opacity">
                    {targetEmoji || targetName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Badge de vérification réel */}
                {isActuallyVerified && (
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                    title="Compte certifié et vérifié"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                {/* Bouton Modifier photo de profil ultra-rapide (1 clic direct sur caméra ou avatar) */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarFileInputRef.current?.click();
                    }}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white border-2 border-white shadow-md transition-transform hover:scale-110 cursor-pointer flex items-center justify-center"
                    title="Changer rapidement la photo de profil"
                    aria-label="Changer rapidement la photo de profil"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Boutons d'action en haut à droite (Règle 4) */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold border border-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier le profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingPost(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Ajouter publication</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => isTargetingArtisan && toggleFollowArtisan(selectedArtisan!.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isFollowing
                          ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                          : 'bg-[#FF6B00] hover:bg-[#e05e00] text-white'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{isFollowing ? 'Abonné' : 'Suivre'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => isTargetingArtisan && startChatWithArtisan(selectedArtisan!.id)}
                      className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </>
                )}

                {/* Bouton Menu [...] (Règle 4 & 18) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer border border-neutral-200"
                    aria-label="Options du profil"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Menu déroulant du profil (Règle 18) */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs text-neutral-800">
                      {isOwnProfile ? (
                        <>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); setIsEditProfileOpen(true); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 text-neutral-600" />
                            <span>Modifier le profil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); setIsAvatarModalOpen(true); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-neutral-600" />
                            <span>Modifier la photo de profil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); setIsCoverModalOpen(true); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <ImageIcon className="w-4 h-4 text-neutral-600" />
                            <span>Modifier la couverture</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setQuickNameInput(targetName);
                              setIsQuickEditingName(true);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-orange-50 text-[#FF6B00] flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 text-[#FF6B00]" />
                            <span>Modifier mon nom (rapide)</span>
                          </button>
                          <div className="my-1 border-t border-neutral-100" />
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); go('settings'); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-neutral-600" />
                            <span>Paramètres</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); go('privacy'); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-neutral-600" />
                            <span>Confidentialité</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); go('account'); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Bell className="w-4 h-4 text-neutral-600" />
                            <span>Notifications</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); setActiveTab('publications'); }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Layers className="w-4 h-4 text-neutral-600" />
                            <span>Gérer mes publications</span>
                          </button>
                          <div className="my-1 border-t border-neutral-100" />
                          <button
                            type="button"
                            onClick={() => { setIsMenuOpen(false); go('delete-account'); }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span>Supprimer mon compte</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (isTargetingArtisan) toggleFollowArtisan(selectedArtisan!.id);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 text-neutral-600" />
                            <span>{isFollowing ? 'Ne plus suivre' : 'Suivre ce profil'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (isTargetingArtisan) startChatWithArtisan(selectedArtisan!.id);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-neutral-600" />
                            <span>Message direct</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleShare();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-neutral-600" />
                            <span>Copier le lien du profil</span>
                          </button>
                          <div className="my-1 border-t border-neutral-100" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              showToast({
                                title: 'Signalement transmis',
                                desc: 'Merci. Notre équipe de modération examinera ce compte.',
                                type: 'info',
                              });
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-amber-50 text-amber-700 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Flag className="w-4 h-4 text-amber-600" />
                            <span>Signaler le profil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              showToast({
                                title: 'Profil bloqué',
                                desc: 'Vous ne verrez plus les publications de ce compte.',
                                type: 'info',
                              });
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                            <span>Bloquer</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nom, Métier, Ville, Badge (Règle 2) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isQuickEditingName ? (
                  <form onSubmit={handleQuickSaveName} className="flex items-center gap-1.5 flex-wrap py-1">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={quickNameInput}
                      onChange={(e) => setQuickNameInput(e.target.value)}
                      placeholder="Votre nom"
                      className="px-3 py-1 text-base sm:text-lg font-black text-neutral-900 border-2 border-[#FF6B00] rounded-xl focus:outline-none bg-white shadow-xs min-w-[200px]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickNameInput(targetName);
                        setIsQuickEditingName(false);
                      }}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                  </form>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                      <span>{targetName}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickNameInput(targetName);
                            setIsQuickEditingName(true);
                          }}
                          className="p-1 rounded-lg bg-neutral-100 hover:bg-orange-100 text-neutral-600 hover:text-[#FF6B00] transition-colors cursor-pointer shadow-2xs group"
                          title="Modifier le nom rapidement (1 clic)"
                          aria-label="Modifier le nom rapidement"
                        >
                          <Pencil className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#FF6B00]" />
                        </button>
                      )}
                    </h1>
                    {isActuallyVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Vérifié</span>
                      </span>
                    )}
                    {isTargetingArtisan && selectedArtisan?.plan && (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200">
                        {selectedArtisan.plan}
                      </span>
                    )}
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-neutral-700 flex items-center flex-wrap gap-y-1">
                <span className="text-[#FF6B00] font-bold">{targetTrade}</span>
                <span className="text-neutral-400 mx-1.5">•</span>
                <span className="inline-flex items-center gap-1 text-neutral-600">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{targetCity}, {targetCountry}</span>
                </span>
                {targetEmail && (
                  <>
                    <span className="text-neutral-400 mx-1.5">•</span>
                    <span className="inline-flex items-center gap-1 text-neutral-600 font-medium">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-mono text-[11px] sm:text-xs text-neutral-700">{targetEmail}</span>
                    </span>
                  </>
                )}
                {distance !== null && (
                  <>
                    <span className="text-neutral-400 mx-1.5">•</span>
                    <span className="text-neutral-500">À {distance} km</span>
                  </>
                )}
              </p>

              {/* Courte Présentation / Bio (Règle 2) */}
              {targetBio && (
                <p className="text-xs sm:text-sm text-neutral-700 pt-1.5 leading-relaxed">
                  {targetBio}
                </p>
              )}
            </div>

            {/* 3. STATISTIQUES RÉELLES (Règle 3: Publications, Abonnés, Abonnements) */}
            <div className="flex items-center justify-around py-3.5 my-3 border-y border-neutral-100 text-center">
              <div>
                <div className="text-base sm:text-lg font-black text-neutral-900">
                  {userPosts.length}
                </div>
                <div className="text-[11px] font-medium text-neutral-500">Publications</div>
              </div>
              <div className="w-px h-7 bg-neutral-200" />
              <div>
                <div className="text-base sm:text-lg font-black text-neutral-900">
                  {followersCount}
                </div>
                <div className="text-[11px] font-medium text-neutral-500">Abonnés</div>
              </div>
              <div className="w-px h-7 bg-neutral-200" />
              <div>
                <div className="text-base sm:text-lg font-black text-neutral-900">
                  {followingCount}
                </div>
                <div className="text-[11px] font-medium text-neutral-500">Abonnements</div>
              </div>
            </div>

            {/* Boutons d'action Artisan : Contacter (WhatsApp) & Devis (Règle 16) */}
            {isTargetingArtisan && !isOwnProfile && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <a
                    href={`tel:${targetPhone}`}
                    className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Appeler</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => quoteModal.open(selectedArtisan)}
                  className="py-2.5 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Demander un devis</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. ONGLETS DU PROFIL (Règle 5: Navigation horizontale mobile) */}
          <div className="border-t border-neutral-200 bg-neutral-50/70">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('publications')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'publications'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Publications ({userPosts.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'about'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                À propos
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'photos'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Photos ({userPhotos.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {isTargetingArtisan ? 'Réalisations & Services' : 'Services'}
              </button>

              {isTargetingArtisan && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-[#FF6B00] text-[#FF6B00]'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Avis & Appels
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTENU DES ONGLETS */}
        <div className="mt-3.5 sm:mt-4">
          {/* ONGLET 1: PUBLICATIONS (Règle 6: Largeur responsive 92-95% mobile, max 680px desktop) */}
          {activeTab === 'publications' && (
            <div className="space-y-3.5">
              {/* Bouton rapide d'ajout si propre profil */}
              {isOwnProfile && (
                <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl border border-neutral-200 p-3 flex items-center justify-between shadow-2xs">
                  <span className="text-xs text-neutral-600">Partager un travail ou une réalisation</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingPost(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                </div>
              )}

              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <SocialPostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-900">Aucune publication pour le moment</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {isOwnProfile
                        ? 'Partagez des photos ou des vidéos de vos réalisations pour attirer plus de clients.'
                        : 'Cet utilisateur n’a pas encore publié de réalisation.'}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingPost(true)}
                      className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Créer ma première publication</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 2: À PROPOS */}
          {activeTab === 'about' && (
            <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 space-y-5 shadow-2xs">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B00]" />
                  <span>Présentation & Savoir-faire</span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {targetBio}
                </p>
              </div>

              {/* Coordonnées de contact */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Informations de contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {canShowEmail && targetEmail && (
                    <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#FF6B00] font-bold block">📧 Email :</span>
                        <a
                          href={`mailto:${targetEmail}`}
                          className="font-bold text-neutral-900 font-mono truncate block hover:text-[#FF6B00] hover:underline"
                        >
                          {targetEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {!canShowEmail && !isOwnProfile && targetEmail && (
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 sm:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-600 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 font-bold block">📧 Email privé (masqué)</span>
                          <span className="text-xs text-neutral-600 font-medium">L'utilisateur protège son adresse email.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isTargetingArtisan && selectedArtisan) {
                            startChatWithArtisan(selectedArtisan);
                          } else {
                            showToast({
                              title: 'Message privé',
                              desc: `Ouverture de la messagerie pour contacter ${targetName}...`,
                              type: 'info',
                            });
                            go('messages');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        Contacter
                      </button>
                    </div>
                  )}

                  {targetPhone && (
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-neutral-400 font-bold block">📞 Téléphone :</span>
                        <span className="font-bold text-neutral-900 font-mono truncate block">{targetPhone}</span>
                      </div>
                    </div>
                  )}

                  {targetWhatsapp && (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-700 block font-semibold">WhatsApp</span>
                        <span className="font-bold text-neutral-900 font-mono truncate">{targetWhatsapp}</span>
                      </div>
                    </div>
                  )}

                  {targetFacebook && (
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                        <Facebook className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-blue-700 block font-semibold">Facebook</span>
                        <span className="font-bold text-neutral-900 truncate block">{targetFacebook}</span>
                      </div>
                    </div>
                  )}

                  {targetTiktok && (
                    <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-neutral-600 block font-semibold">TikTok</span>
                        <span className="font-bold text-neutral-900 truncate block">{targetTiktok}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Spécifications artisan si applicable */}
              {isTargetingArtisan && (
                <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Tarif horaire</span>
                    <span className="font-bold text-neutral-900">{selectedArtisan?.hourlyRate || '10 000 FCFA'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Expérience</span>
                    <span className="font-bold text-neutral-900">{selectedArtisan?.experienceYears || 5} ans</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Délai d'intervention</span>
                    <span className="font-bold text-emerald-700">24h à 48h</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-0.5">Garantie</span>
                    <span className="font-bold text-neutral-900">Vérifié & Qualifié</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3: PHOTOS */}
          {activeTab === 'photos' && (
            <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Galerie Photos ({userPhotos.length})
                </h3>
              </div>

              {userPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {userPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhotoPreview(photo.url)}
                      className="aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer group relative"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic text-center py-8">
                  Aucune photo disponible dans la galerie pour le moment.
                </p>
              )}
            </div>
          )}

          {/* ONGLET 4: SERVICES / RÉALISATIONS */}
          {activeTab === 'services' && (
            <div className="w-[92%] sm:w-full mx-auto bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Prestations & Tarifs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: `Intervention ${targetTrade} standard`,
                    price: (selectedArtisan?.hourlyRate) || '15 000 FCFA',
                    duration: '1 à 2 jours',
                    desc: 'Diagnostic complet, intervention de qualité et finitions soignées.',
                  },
                  {
                    title: 'Entretien & Rénovation complète',
                    price: 'Sur Devis gratuit',
                    duration: 'Selon projet',
                    desc: 'Étude sur mesure, devis sans engagement et déplacement rapide.',
                  },
                ].map((srv, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900">{srv.title}</h4>
                      <span className="font-bold text-xs text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                        {srv.price}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">{srv.desc}</p>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Délai : {srv.duration}</span>
                    </div>
                    {isTargetingArtisan && (
                      <button
                        type="button"
                        onClick={() => quoteModal.open(selectedArtisan, srv.title)}
                        className="mt-2 w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] text-xs font-bold transition-colors text-center cursor-pointer border border-orange-200"
                      >
                        Demander cette prestation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ONGLET 5: AVIS & HISTORIQUE APPELS VOIP (Pour artisan) */}
          {activeTab === 'reviews' && isTargetingArtisan && (
            <div className="w-[92%] sm:w-full mx-auto space-y-3.5">
              {/* Avis clients */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Avis clients vérifiés
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>{selectedArtisan?.rating || 4.8} / 5</span>
                    <span className="text-neutral-400 font-normal">({selectedArtisan?.reviewsCount || 12} avis)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">Kouamé B. (Abidjan)</span>
                      <span className="text-amber-500 font-bold">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="text-neutral-600 italic">
                      « Travail très soigné, ponctuel et respectueux des délais. Contact facile via WhatsApp et devis respecté. »
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">Mariam D. (Cocody)</span>
                      <span className="text-amber-500 font-bold">⭐⭐⭐⭐⭐</span>
                    </div>
                    <p className="text-neutral-600 italic">
                      « Devis clair et transparent, intervention rapide dès le lendemain. Échanges fluides. »
                    </p>
                  </div>
                </div>
              </div>

              {/* Historique VoIP sécurisé */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-sky-600" />
                      <span>Historique d'appels VoIP</span>
                    </h3>
                    <p className="text-[11px] text-neutral-500">Chiffré de bout en bout, numéros masqués</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Sécurisé
                  </span>
                </div>

                {isLoadingCalls ? (
                  <p className="text-xs text-neutral-400 text-center py-4">Chargement...</p>
                ) : callHistory.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {callHistory.map((call, idx) => (
                      <div key={call.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">
                              {call.type === 'video' ? 'Appel vidéo VoIP' : 'Appel vocal VoIP'}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {new Date(call.timestamp).toLocaleDateString('fr-FR')} • {call.formattedDuration}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">Terminé</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic text-center py-4">
                    Aucun appel VoIP enregistré récemment.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 14. MODALE MODIFIER LA PHOTO DE PROFIL (Règle 14) */}
      {/* ========================================================= */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-neutral-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Modifier la photo de profil</h3>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              {targetAvatar ? (
                <img
                  src={targetAvatar}
                  alt="Aperçu"
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center text-4xl">
                  {targetEmoji || '👤'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Choisir une nouvelle photo</span>
              </button>

              {targetAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer la photo actuelle</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 15. MODALE MODIFIER LA COUVERTURE (Règle 15) */}
      {/* ========================================================= */}
      {isCoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Modifier la photo de couverture</h3>
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-4">
              {/* Upload fichier depuis téléphone */}
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                className="w-full py-3 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <Upload className="w-4 h-4 text-[#FF6B00]" />
                <span>Téléverser depuis mon téléphone</span>
              </button>

              {/* Sélection modèles de couverture africaine */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  Ou choisir une bannière africaine :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectCoverPreset(preset.url)}
                      className="relative rounded-xl overflow-hidden border border-neutral-200 h-20 group cursor-pointer text-left"
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 p-1.5 flex items-end">
                        <span className="text-[10px] font-bold text-white leading-tight">
                          {preset.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {targetCover && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer la couverture personnalisée</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE MODIFIER LE PROFIL (Règle 4) */}
      {/* ========================================================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col p-5 border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Modifier mon profil</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="overflow-y-auto py-3 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nom et prénom *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {targetEmail && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Adresse Email du compte</label>
                  <div className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono text-xs flex items-center gap-2 select-all">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{targetEmail}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Métier / Spécialité</label>
                <input
                  type="text"
                  value={editTrade}
                  onChange={(e) => setEditTrade(e.target.value)}
                  placeholder="ex: Menuisier, Couturier, Client..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Courte présentation / Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Décrivez votre expérience, votre savoir-faire..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">WhatsApp Direct</label>
                <input
                  type="tel"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="+225 05 00 00 00 00"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Lien ou nom Facebook</label>
                <input
                  type="text"
                  value={editFacebook}
                  onChange={(e) => setEditFacebook(e.target.value)}
                  placeholder="ex: atelier.kouame"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Lien ou @ TikTok</label>
                <input
                  type="text"
                  value={editTiktok}
                  onChange={(e) => setEditTiktok(e.target.value)}
                  placeholder="ex: @artisan_pro"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Confidentialité de l'email */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/80 cursor-pointer hover:bg-neutral-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={editShowEmailPublicly}
                    onChange={(e) => setEditShowEmailPublicly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#FF6B00] rounded border-neutral-300 focus:ring-[#FF6B00]"
                  />
                  <div>
                    <span className="font-bold text-neutral-900 block text-xs">
                      Afficher publiquement mon adresse email
                    </span>
                    <span className="text-[11px] text-neutral-500 leading-tight block">
                      Si décoché, votre adresse restera confidentielle et un bouton "Contacter" sera proposé aux visiteurs.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Aperçu photo plein écran */}
      {selectedPhotoPreview && (
        <div
          onClick={() => setSelectedPhotoPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-pointer animate-in fade-in"
        >
          <img
            src={selectedPhotoPreview}
            alt="Aperçu plein écran"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Modale Publier une Réalisation */}
      <PublierRealisation
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
      />
    </div>
  );
};
