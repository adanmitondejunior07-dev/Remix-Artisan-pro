import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Trash2,
  Eye,
  PlusCircle,
  Video as VideoIcon,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { getVideoBlob, deleteVideoAndThumbnail } from '../services/indexedDbService.ts';
import { PublierRealisation } from './PublierRealisation.tsx';

export interface ArtisanPostRecord {
  id: string | number;
  image?: string;
  thumbnail?: string;
  mediaType?: 'photo' | 'video';
  type?: 'photo' | 'video';
  videoKey?: string;
  tarif: string;
  description: string;
  artisan?: string;
  date?: string;
  likes?: number;
}

export interface ArtisanDashboardTableProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ArtisanDashboardTable: React.FC<ArtisanDashboardTableProps> = ({
  onClose,
  isModal = false,
}) => {
  const [posts, setPosts] = useState<ArtisanPostRecord[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [activePreviewPost, setActivePreviewPost] = useState<ArtisanPostRecord | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('');
  const [isLoadingPreviewVideo, setIsLoadingPreviewVideo] = useState<boolean>(false);

  // Charge les réalisations depuis localStorage 'artisanPosts'
  const loadPosts = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('artisanPosts');
      if (!raw) {
        setPosts([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPosts(parsed);
      } else {
        setPosts([]);
      }
    } catch (e) {
      console.warn('Erreur lecture artisanPosts:', e);
      setPosts([]);
    }
  }, []);

  // Synchronisation initiale et écoute d'événements en temps réel sans recharger la page
  useEffect(() => {
    loadPosts();

    const handleUpdate = () => {
      loadPosts();
    };

    window.addEventListener('artisanPostsUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('artisanPostsUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadPosts]);

  // Action : Supprimer une réalisation instantanément du localStorage, d'IndexedDB et du tableau
  const handleDeletePost = async (postId: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmed = window.confirm('Voulez-vous vraiment supprimer cette réalisation ?');
    if (!confirmed) return;

    // 1. Mise à jour immédiate du state local (disparaît du tableau instantanément)
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));

    // 2. Mise à jour de localStorage 'artisanPosts'
    try {
      const raw = localStorage.getItem('artisanPosts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((p: any) => String(p.id) !== String(postId));
          localStorage.setItem('artisanPosts', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('Erreur suppression artisanPosts:', e);
    }

    // 3. Mise à jour de localStorage 'allPosts' si présent
    try {
      const rawAll = localStorage.getItem('allPosts');
      if (rawAll) {
        const parsedAll = JSON.parse(rawAll);
        if (Array.isArray(parsedAll)) {
          const updatedAll = parsedAll.filter((p: any) => String(p.id) !== String(postId));
          localStorage.setItem('allPosts', JSON.stringify(updatedAll));
        }
      }
    } catch (e) {
      console.warn('Erreur suppression allPosts:', e);
    }

    // 4. Suppression du fichier vidéo/miniature dans IndexedDB
    try {
      await deleteVideoAndThumbnail(postId);
    } catch (e) {
      console.warn('Erreur suppression IndexedDB:', e);
    }

    // 5. Notification globale pour mettre à jour le fil d'actualité sans recharger la page
    window.dispatchEvent(new CustomEvent('artisanPostsUpdated'));
  };

  // Action : Voir la réalisation (modal d'aperçu avec vidéo depuis IndexedDB)
  const handleOpenPreview = async (post: ArtisanPostRecord) => {
    setActivePreviewPost(post);
    setPreviewVideoUrl('');

    const isVideo =
      post.mediaType === 'video' ||
      post.type === 'video' ||
      (post.image && post.image.startsWith('data:video'));

    if (isVideo) {
      setIsLoadingPreviewVideo(true);
      try {
        // Tente de récupérer depuis IndexedDB
        let blob = await getVideoBlob(post.videoKey || post.id);
        if (!blob) {
          blob = await getVideoBlob(`video_${post.id}`);
        }
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          setPreviewVideoUrl(objectUrl);
        } else if (post.image && (post.image.startsWith('http') || post.image.startsWith('data:video'))) {
          setPreviewVideoUrl(post.image);
        }
      } catch (err) {
        console.warn('Erreur chargement vidéo preview:', err);
      } finally {
        setIsLoadingPreviewVideo(false);
      }
    }
  };

  const handleClosePreview = () => {
    if (previewVideoUrl && previewVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewVideoUrl);
    }
    setActivePreviewPost(null);
    setPreviewVideoUrl('');
  };

  const publishedCount = posts.length;
  const countLabel =
    publishedCount === 0
      ? '0 réalisation publiée'
      : publishedCount === 1
      ? '1 réalisation publiée'
      : `${publishedCount} réalisations publiées`;

  return (
    <div className={`${isModal ? 'bg-white rounded-3xl border border-neutral-200/90 shadow-2xl overflow-hidden' : 'mt-12 mb-8 bg-white rounded-3xl border border-neutral-200/90 shadow-lg overflow-hidden'}`}>
      {/* En-tête du Tableau de Bord */}
      <div className="px-6 py-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white">
                Tableau de bord de vos réalisations
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold uppercase">
                En direct
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gérez vos publications locales synchronisées instantanément (Photos & Vidéos IndexedDB).
            </p>
          </div>
        </div>

        {/* Compteur, Bouton Nouveau & Bouton Fermer */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-neutral-200 text-xs font-bold shadow-xs">
            {countLabel}
          </div>
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#ff5500] text-white text-xs font-black shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publier maintenant</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Fermer le tableau de bord"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu du Tableau */}
      {posts.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200 text-[#FF6B00] flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-base font-black text-neutral-900">
              Aucune réalisation publiée pour le moment
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Ajoutez vos photos ou vidéos (jusqu'à 30s) avec tarif et description. Elles seront enregistrées localement et visibles immédiatement dans ce tableau et le fil d'actualité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ff5500] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publier votre première réalisation</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-black uppercase tracking-wider text-neutral-600">
                <th className="py-3.5 px-5">Photo / Vidéo</th>
                <th className="py-3.5 px-5">Tarif</th>
                <th className="py-3.5 px-5 min-w-[240px]">Description</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/70 text-xs">
              {posts.map((post) => {
                const isVideo =
                  post.mediaType === 'video' ||
                  post.type === 'video' ||
                  (post.image && post.image.startsWith('data:video'));
                const thumbnailSrc = post.thumbnail || post.image || '';

                return (
                  <tr
                    key={String(post.id)}
                    className="hover:bg-neutral-50/70 transition-colors group"
                  >
                    {/* Colonne 1 : Photo / Vidéo avec miniature et icône PLAY si vidéo */}
                    <td className="py-3.5 px-5">
                      <div
                        onClick={() => handleOpenPreview(post)}
                        className="relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-xs cursor-pointer group-hover:border-[#FF6B00] transition-colors shrink-0 flex items-center justify-center"
                      >
                        {thumbnailSrc ? (
                          <img
                            src={thumbnailSrc}
                            alt="Aperçu de la réalisation"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400">
                            {isVideo ? (
                              <VideoIcon className="w-6 h-6 text-[#FF6B00]" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-neutral-400" />
                            )}
                          </div>
                        )}

                        {/* Si c'est une vidéo : Affiche l'icône PLAY ▶️ */}
                        {isVideo && (
                          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/70 hover:bg-[#FF6B00] text-white flex items-center justify-center backdrop-blur-xs transition-colors shadow-md">
                            <Play className="w-4 h-4 fill-white translate-x-0.5" />
                          </div>
                        )}

                        {/* Badge type */}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[9px] font-black uppercase">
                          {isVideo ? 'Vidéo' : 'Photo'}
                        </span>
                      </div>
                    </td>

                    {/* Colonne 2 : Tarif */}
                    <td className="py-3.5 px-5 font-black text-neutral-950 whitespace-nowrap">
                      <span className="inline-block px-3 py-1.5 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/80 text-xs font-black shadow-2xs">
                        {post.tarif || 'Sur devis'}
                      </span>
                    </td>

                    {/* Colonne 3 : Description */}
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-neutral-800 line-clamp-2 leading-relaxed text-xs sm:text-sm">
                        {post.description || 'Création artisanale'}
                      </p>
                      <span className="text-[11px] text-neutral-600 block mt-0.5">
                        {post.date ? `Publié le ${post.date}` : 'Récemment publié'} • {post.artisan || 'Vous'}
                      </span>
                    </td>

                    {/* Colonne 4 : Actions [Voir] [Supprimer] */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(post)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="Voir la réalisation"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Voir</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
                          title="Supprimer la réalisation"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal d'aperçu [Voir] pour Photo ou Vidéo IndexedDB */}
      {activePreviewPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-neutral-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#FF6B00] text-white text-[11px] font-black uppercase">
                  {activePreviewPost.mediaType === 'video' || activePreviewPost.type === 'video'
                    ? 'Vidéo 30s'
                    : 'Photo'}
                </span>
                <h4 className="font-extrabold text-sm text-white truncate max-w-xs">
                  Aperçu de la réalisation
                </h4>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Body */}
            <div className="bg-black flex items-center justify-center min-h-[260px] max-h-[420px] overflow-hidden">
              {activePreviewPost.mediaType === 'video' || activePreviewPost.type === 'video' ? (
                previewVideoUrl ? (
                  <video
                    src={previewVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[420px] object-contain bg-black"
                  />
                ) : isLoadingPreviewVideo ? (
                  <div className="py-16 text-neutral-400 text-xs flex flex-col items-center gap-2">
                    <VideoIcon className="w-8 h-8 animate-spin text-[#FF6B00]" />
                    <span>Chargement de la vidéo depuis IndexedDB...</span>
                  </div>
                ) : (
                  <div className="py-16 text-neutral-400 text-xs flex flex-col items-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span>Fichier vidéo indisponible en mémoire</span>
                  </div>
                )
              ) : (
                <img
                  src={activePreviewPost.image}
                  alt={activePreviewPost.description}
                  className="w-full max-h-[420px] object-contain bg-neutral-950"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Details Footer */}
            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">
                  {activePreviewPost.date ? `Publié le ${activePreviewPost.date}` : 'Artisan Pro'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200 text-sm font-black">
                  {activePreviewPost.tarif}
                </span>
              </div>
              <p className="text-sm text-neutral-800 leading-relaxed font-medium">
                {activePreviewPost.description}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Publier une réalisation */}
      <PublierRealisation
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublished={() => {
          setIsPublishModalOpen(false);
          loadPosts();
        }}
      />
    </div>
  );
};
