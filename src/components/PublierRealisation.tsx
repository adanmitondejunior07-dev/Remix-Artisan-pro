import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Video,
  Trash2,
  CheckCircle2,
  Sparkles,
  Zap,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  checkVideoDuration,
  generateVideoThumbnail,
  compressVideoIfNeeded,
} from '../services/videoService.ts';
import { saveMediaBlob, getMediaBlob } from '../services/indexedDbService.ts';
import { useApp } from '../context/AppContext.tsx';
import { compressImageToDataUrl } from '../utils/imageCompression.ts';
import { createSupabasePublication } from '../services/supabase.ts';
import type { PublicationType } from '../types.ts';

export interface PublierRealisationProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
  targetType?: PublicationType;
}

export const PublierRealisation: React.FC<PublierRealisationProps> = ({
  isOpen,
  onClose,
  onPublished,
  targetType = 'accueil',
}) => {
  const { currentUser, currentArtisan, showToast, createSocialPost } = useApp();

  // Type de destination : accueil ou marketplace
  const [publicationType, setPublicationType] = useState<PublicationType>(targetType);

  useEffect(() => {
    if (targetType) {
      setPublicationType(targetType);
    }
  }, [targetType, isOpen]);

  // Média et contenu du formulaire
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [tarif, setTarif] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Références de fichiers et stockage Blob pour les vidéos (IndexedDB)
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const currentVideoBlobRef = useRef<Blob | File | null>(null);
  const currentThumbnailBlobRef = useRef<Blob | null>(null);
  const currentThumbnailUrlRef = useRef<string>('');

  // Synchronisation média mémoire au chargement si disponible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhoto = localStorage.getItem('lastMediaBase64');
      if (savedPhoto && savedPhoto.startsWith('data:image')) {
        setMediaUrl(savedPhoto);
        setMediaType('photo');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Choisir Photo avec compression instantanée ultra-légère (< 30ms)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset video refs
    currentVideoBlobRef.current = null;
    currentThumbnailBlobRef.current = null;
    currentThumbnailUrlRef.current = '';
    setThumbnailUrl('');

    try {
      const dataUrl = await compressImageToDataUrl(file, 1200, 1200, 0.85);
      if (dataUrl) {
        try {
          localStorage.setItem('lastMediaBase64', dataUrl);
        } catch (err) {}
        setMediaUrl(dataUrl);
        setMediaType('photo');
        return;
      }
    } catch {}

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
      setMediaType('photo');
    };
    reader.readAsDataURL(file);
  };

  // 2. Choisir Vidéo selon les directives :
  // - Vérifie durée <= 30s ("Vidéo trop longue, choisissez 30s max")
  // - URL temporaire URL.createObjectURL(file)
  // - Miniature canvas à 1s
  // - Compression 720p si > 10Mo
  // - Sauvegarde IndexedDB, PAS en base64
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus('Vérification de la durée de la vidéo...');

    try {
      // 1. Vérification durée max 30 secondes
      const durCheck = await checkVideoDuration(file);
      if (!durCheck.valid) {
        setIsProcessing(false);
        setProcessingStatus('');
        showToast({
          title: 'Vidéo trop longue',
          desc: 'Veuillez choisir une vidéo de 30 secondes maximum.',
          type: 'warning',
        });
        setErrorMessage('Vidéo trop longue, choisissez 30s max');
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }

      // 2. Compresseur si vidéo > 10Mo
      let processedFile: File | Blob = file;
      if (file.size > 10 * 1024 * 1024) {
        setProcessingStatus('Vidéo > 10Mo détectée : compression 720p...');
        const compRes = await compressVideoIfNeeded(file, (msg) => setProcessingStatus(msg));
        processedFile = compRes.file;
      }

      // 3. Création de l'URL temporaire URL.createObjectURL
      const videoURL = URL.createObjectURL(processedFile);

      // 4. Génération automatique de la miniature (thumbnail) avec canvas à 1 seconde
      setProcessingStatus('Génération de la miniature à 1 seconde...');
      const { thumbnailUrl: thumbUrl, thumbnailBlob } = await generateVideoThumbnail(processedFile);

      // 5. Mémorisation des références
      currentVideoBlobRef.current = processedFile;
      currentThumbnailBlobRef.current = thumbnailBlob;
      currentThumbnailUrlRef.current = thumbUrl;

      // 6. Sauvegarde du Blob et de la miniature dans IndexedDB (pas en base64 de 50Mo)
      await saveMediaBlob('pending_artisan_video', processedFile);
      if (thumbnailBlob) {
        await saveMediaBlob('pending_artisan_thumb', thumbnailBlob);
      }

      // Mise à jour de l'affichage
      setMediaType('video');
      setMediaUrl(videoURL);
      setThumbnailUrl(thumbUrl);
      setIsProcessing(false);
      setProcessingStatus('');
    } catch (err: any) {
      console.error('Erreur traitement vidéo:', err);
      setIsProcessing(false);
      setProcessingStatus('');
      setErrorMessage(err?.message || 'Erreur lors du traitement de la vidéo');
    }
  };

  // Suppression du média en cours
  const handleClearMedia = () => {
    localStorage.removeItem('lastMediaBase64');
    currentVideoBlobRef.current = null;
    currentThumbnailBlobRef.current = null;
    currentThumbnailUrlRef.current = '';
    setMediaUrl('');
    setThumbnailUrl('');
    setErrorMessage('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Publication 100% instantanée (sans écran noir) pour Photo ET Vidéo
  async function handlePublish(e?: React.FormEvent) {
    if (e && e.preventDefault) e.preventDefault();

    const finalTarif = (tarif || '').trim();
    const finalDesc = (description || '').trim() || 'Réalisation artisanale';

    if (publicationType === 'marketplace' && !finalTarif) {
      setErrorMessage('Le prix est obligatoire pour une publication sur la Marketplace.');
      showToast({
        title: 'Prix obligatoire',
        desc: 'Veuillez renseigner le prix de vente ou de prestation pour la Marketplace.',
        type: 'warning',
      });
      return;
    }

    const postId = Date.now();
    const authorName = currentUser?.name || currentArtisan?.name || 'Artisan';
    const authorAvatar = currentUser?.avatarUrl || currentUser?.photoUrl || currentArtisan?.avatarUrl || currentArtisan?.photoUrl || '';
    const authorTrade = currentArtisan?.trade || (currentUser?.role === 'artisan' ? 'Artisan Pro' : 'Créateur');
    const authorCity = currentArtisan?.city || currentUser?.city || 'Abidjan';
    const authorCountry = currentArtisan?.country || currentUser?.country || 'Côte d’Ivoire';
    const authorId = currentUser?.id ? String(currentUser.id) : (currentArtisan ? String(currentArtisan.id) : undefined);
    const artisanNumId = currentArtisan?.id || currentUser?.artisanId || undefined;

    // Cas Vidéo : enregistrement IndexedDB + miniature légère dans le tableau
    if (mediaType === 'video') {
      let videoBlob = currentVideoBlobRef.current;
      if (!videoBlob) {
        // Tente de récupérer depuis IndexedDB pending
        videoBlob = await getMediaBlob('pending_artisan_video');
      }

      if (!videoBlob) {
        showToast({
          title: 'Vidéo requise',
          desc: 'Veuillez choisir une vidéo à publier.',
          type: 'warning',
        });
        return;
      }

      const thumbBlob = currentThumbnailBlobRef.current;
      const thumbUrl = currentThumbnailUrlRef.current || thumbnailUrl;

      // Sauvegarde du Blob vidéo complet dans IndexedDB
      await saveMediaBlob(`video_${postId}`, videoBlob);
      if (thumbBlob) {
        await saveMediaBlob(`thumb_${postId}`, thumbBlob);
      }

      // Synchronisation Supabase (id, user_id, contenu, image, date_creation, type, prix)
      await createSupabasePublication({
        user_id: authorId || 'user',
        contenu: finalDesc,
        image: thumbUrl,
        type: publicationType,
        prix: publicationType === 'marketplace' ? finalTarif : null,
      });

      if (createSocialPost) {
        await createSocialPost({
          id: `post-${postId}`,
          author: authorName,
          role: 'ARTISAN',
          artisanId: artisanNumId,
          artisanName: authorName,
          artisanTrade: authorTrade,
          artisanAvatar: authorAvatar,
          artisanEmoji: '🛠️',
          verified: true,
          city: authorCity,
          country: authorCountry,
          content: finalDesc,
          contenu: finalDesc,
          mediaType: 'video',
          mediaUrl: thumbUrl,
          image: thumbUrl,
          type: publicationType,
          price: finalTarif,
          prix: finalTarif,
        });
      }

      const newPost = {
        id: postId,
        type: publicationType,
        mediaType: 'video' as const,
        image: thumbUrl,
        thumbnail: thumbUrl,
        videoKey: `video_${postId}`,
        hasIndexedDbVideo: true,
        tarif: finalTarif,
        prix: finalTarif,
        description: finalDesc,
        contenu: finalDesc,
        artisan: authorName,
        likes: 0,
        date: new Date().toLocaleDateString(),
        date_creation: new Date().toISOString(),
      };

      // Sauvegarde dans artisanPosts
      let posts: any[] = [];
      try {
        posts = JSON.parse(localStorage.getItem('artisanPosts') || '[]');
      } catch {
        posts = [];
      }
      posts.unshift(newPost);
      localStorage.setItem('artisanPosts', JSON.stringify(posts));

      // Synchronisation allPosts pour le fil d'actualité immédiat
      try {
        let allPosts: any[] = JSON.parse(localStorage.getItem('allPosts') || '[]');
        const socialPostFormat = {
          id: String(newPost.id),
          userId: authorId,
          author: authorName,
          role: 'ARTISAN',
          artisanId: artisanNumId,
          artisanName: authorName,
          artisanTrade: authorTrade,
          artisanEmoji: '🛠️',
          verified: true,
          city: authorCity,
          country: authorCountry,
          content: newPost.description,
          mediaType: 'video' as const,
          mediaUrl: thumbUrl,
          posterUrl: thumbUrl,
          mediaId: `video_${newPost.id}`,
          likesCount: 0,
          likedBy: [],
          viewsCount: 1,
          comments: [],
          sharesCount: 0,
          createdAt: new Date().toISOString(),
        };
        allPosts.unshift(socialPostFormat);
        localStorage.setItem('allPosts', JSON.stringify(allPosts.slice(0, 35)));
      } catch {}

      // Notification globale pour mise à jour sans rechargement de page
      window.dispatchEvent(new CustomEvent('artisanPostsUpdated', { detail: newPost }));

      showToast({
        title: 'Publication réussie !',
        desc: 'Votre vidéo est en ligne sur le fil d’actualité.',
        type: 'success',
      });

      if (onPublished) onPublished();
      onClose();
      return;
    }

    // Cas Photo :
    const photoData = mediaUrl || localStorage.getItem('lastMediaBase64');
    if (!photoData) {
      showToast({
        title: 'Photo requise',
        desc: 'Veuillez choisir une photo avant de publier.',
        type: 'warning',
      });
      return;
    }

    // Enregistrement Supabase respectant : id, user_id (uuid), contenu, image, type, prix, date_creation
    await createSupabasePublication({
      user_id: authorId || 'user',
      contenu: finalDesc,
      image: photoData,
      type: publicationType,
      prix: publicationType === 'marketplace' ? finalTarif : null,
    });

    if (createSocialPost) {
      await createSocialPost({
        id: `post-${postId}`,
        author: authorName,
        role: 'ARTISAN',
        artisanId: artisanNumId,
        artisanName: authorName,
        artisanTrade: authorTrade,
        artisanAvatar: authorAvatar,
        artisanEmoji: '🛠️',
        verified: true,
        city: authorCity,
        country: authorCountry,
        content: finalDesc,
        contenu: finalDesc,
        mediaType: 'photo',
        mediaUrl: photoData,
        image: photoData,
        type: publicationType,
        price: finalTarif,
        prix: finalTarif,
      });
    }

    const newPhotoPost = {
      id: postId,
      type: publicationType,
      mediaType: 'photo' as const,
      image: photoData,
      thumbnail: photoData,
      tarif: finalTarif,
      prix: finalTarif,
      description: finalDesc,
      contenu: finalDesc,
      artisan: authorName,
      likes: 0,
      date: new Date().toLocaleDateString(),
      date_creation: new Date().toISOString(),
    };

    let posts: any[] = [];
    try {
      posts = JSON.parse(localStorage.getItem('artisanPosts') || '[]');
    } catch {
      posts = [];
    }
    posts.unshift(newPhotoPost);
    localStorage.setItem('artisanPosts', JSON.stringify(posts));

    try {
      let allPosts: any[] = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const socialPostFormat = {
        id: String(newPhotoPost.id),
        userId: authorId,
        author: authorName,
        role: 'ARTISAN',
        artisanId: artisanNumId,
        artisanName: authorName,
        artisanTrade: authorTrade,
        artisanEmoji: '🛠️',
        verified: true,
        city: authorCity,
        country: authorCountry,
        content: newPhotoPost.description,
        mediaType: 'photo' as const,
        mediaUrl: newPhotoPost.image,
        likesCount: 0,
        likedBy: [],
        viewsCount: 1,
        comments: [],
        sharesCount: 0,
        createdAt: new Date().toISOString(),
      };
      allPosts.unshift(socialPostFormat);
      localStorage.setItem('allPosts', JSON.stringify(allPosts.slice(0, 35)));
    } catch {}

    // Notification globale sans rechargement de page
    window.dispatchEvent(new CustomEvent('artisanPostsUpdated', { detail: newPhotoPost }));

    showToast({
      title: 'Publication réussie !',
      desc: 'Votre photo est en ligne sur le fil d’actualité.',
      type: 'success',
    });

    if (onPublished) onPublished();
    onClose();
  }

  return (
    <div
      id="publier-realisation-modal"
      className="PublierRealisationOverlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="PublierRealisationBox bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Publier une réalisation
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> IndexedDB Vidéo + Photo Instantanée
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message d'erreur ou statut de compression */}
        {isProcessing && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2.5 text-amber-800 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
            <span>{processingStatus || 'Traitement de la vidéo en cours...'}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handlePublish} className="p-6 space-y-4 overflow-y-auto">
          {/* Inputs de fichiers cachés */}
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <input
            type="file"
            ref={videoInputRef}
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelect}
          />

          {/* Boutons de sélection média direct */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Photo ou Vidéo de votre réalisation (30s max)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaUrl && mediaType === 'photo'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-xs'
                    : 'border-neutral-200 hover:border-emerald-500 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-emerald-600">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Choisir Photo</span>
                <span className="text-[10px] text-neutral-500 font-medium">Instantané</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaUrl && mediaType === 'video'
                    ? 'border-[#FF6B00] bg-orange-50/80 text-[#FF6B00] shadow-xs'
                    : 'border-neutral-200 hover:border-[#FF6B00] bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-[#FF6B00]">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Choisir Vidéo</span>
                <span className="text-[10px] text-neutral-500 font-medium">30s max • IndexedDB</span>
              </button>
            </div>
          </div>

          {/* Prévisualisation directe depuis la mémoire / IndexedDB */}
          {mediaUrl ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-900 bg-neutral-950 shadow-md">
              {mediaType === 'photo' ? (
                <img
                  src={mediaUrl}
                  alt="Aperçu réalisation"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="relative w-full h-48 bg-black flex items-center justify-center">
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={thumbnailUrl}
                    className="w-full h-48 object-contain bg-black"
                  />
                </div>
              )}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearMedia}
                  className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-red-600 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Changer de fichier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Changer</span>
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {mediaType === 'video' ? 'Vidéo prête (miniature 1s créée)' : 'Photo prête'}
                </span>
                <span className="text-neutral-300 font-semibold uppercase text-[10px] bg-neutral-800 px-2 py-0.5 rounded-md">
                  {mediaType}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => photoInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-emerald-50/70 border border-dashed border-emerald-300 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
            >
              <p className="text-xs font-bold text-emerald-900">
                💡 Sélectionnez une photo ou une vidéo (30s max)
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Les vidéos sont stockées dans IndexedDB avec miniature automatique à 1 seconde sans écran noir.
              </p>
            </div>
          )}

          {/* Destination de publication : Accueil vs Marketplace */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Destination de la publication *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPublicationType('accueil')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  publicationType === 'accueil'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>🏠 Fil d’Accueil</span>
              </button>
              <button
                type="button"
                onClick={() => setPublicationType('marketplace')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  publicationType === 'marketplace'
                    ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00] shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>🛍️ Marketplace</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              {publicationType === 'marketplace'
                ? 'Visible uniquement sur la Marketplace (Prix obligatoire).'
                : 'Visible sur la page d’accueil générale.'}
            </p>
          </div>

          {/* Prix de vente ou prestation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Prix / Tarif (FCFA){' '}
              {publicationType === 'marketplace' ? (
                <span className="text-red-500 font-extrabold">(Obligatoire pour la Marketplace *)</span>
              ) : (
                <span className="text-neutral-400 font-normal">(Optionnel pour l'accueil)</span>
              )}
            </label>
            <input
              type="text"
              placeholder={publicationType === 'marketplace' ? 'Ex: 25 000 FCFA *' : 'Ex: 15 000 FCFA ou Tarif sur devis'}
              value={tarif}
              onChange={(e) => {
                setTarif(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required={publicationType === 'marketplace'}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                publicationType === 'marketplace' && !tarif.trim()
                  ? 'border-amber-400 bg-amber-50/30 focus:border-[#FF6B00]'
                  : 'border-neutral-300 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Description de votre publication (optionnel)
            </label>
            <textarea
              rows={3}
              placeholder="Décrivez votre création, détails de votre travail... (ou laissez vide pour publier directement)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Zap className="w-4 h-4 fill-white" />
              )}
              <span>Publier instantanément</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
