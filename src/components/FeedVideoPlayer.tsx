import React, { useState, useRef } from 'react';
import { Play, Loader2, Video as VideoIcon, RefreshCw } from 'lucide-react';
import type { SocialPost } from '../types.ts';
import { getVideoBlob } from '../services/indexedDbService.ts';
import { resolveMediaUrl } from '../services/mediaStorage.ts';

interface FeedVideoPlayerProps {
  post: SocialPost;
}

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({ post }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Détermine la meilleure miniature disponible
  const thumbnail =
    post.posterUrl ||
    (post as any).thumbnail ||
    (post.mediaUrl && !post.mediaUrl.startsWith('data:video') ? post.mediaUrl : '') ||
    '';

  // Clic sur PLAY ▶️ : Récupère la vidéo depuis IndexedDB et démarre la lecture sans écran noir
  const handlePlayClick = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying && resolvedUrl) {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
      return;
    }

    setIsLoadingVideo(true);
    setErrorMessage('');

    try {
      // 1. Cherche dans IndexedDB par mediaId ou postId
      let blob = await getVideoBlob(post.mediaId || post.id);
      if (!blob && post.id) {
        blob = await getVideoBlob(`video_${post.id}`);
      }
      if (!blob && (post as any).videoKey) {
        blob = await getVideoBlob((post as any).videoKey);
      }

      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        setResolvedUrl(objectUrl);
        setIsPlaying(true);
        setIsLoadingVideo(false);
        return;
      }

      // 2. Si pas trouvé dans IndexedDB, tente via URL directe ou storage
      if (post.mediaUrl && (post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('data:video') || post.mediaUrl.startsWith('blob:'))) {
        const res = await resolveMediaUrl(post.mediaUrl, post.mediaId, post.id);
        if (res && res.url && !res.isExpired) {
          setResolvedUrl(res.url);
          setIsPlaying(true);
          setIsLoadingVideo(false);
          return;
        }
      }

      // 3. Si aucun fichier vidéo n'a pu être extrait
      setIsLoadingVideo(false);
      setErrorMessage("La vidéo n'est pas encore téléchargée sur cet appareil.");
    } catch (err: any) {
      console.warn('Erreur lecture vidéo IndexedDB:', err);
      setIsLoadingVideo(false);
      setErrorMessage('Impossible de charger le fichier vidéo local.');
    }
  };

  return (
    <div className="relative bg-neutral-950 w-full overflow-hidden max-h-[480px] flex items-center justify-center select-none group">
      {/* 1. Mode LECTURE : Si la vidéo est lancée et URL prête */}
      {isPlaying && resolvedUrl ? (
        <video
          ref={videoRef}
          src={resolvedUrl}
          autoPlay
          controls
          playsInline
          poster={thumbnail}
          className="w-full max-h-[480px] bg-black object-contain"
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setErrorMessage('Erreur de lecture du format vidéo.');
            setIsPlaying(false);
          }}
        />
      ) : (
        /* 2. Mode MINIATURE (THUMBNAIL) avec bouton PLAY ▶️ central */
        <div
          onClick={handlePlayClick}
          className="relative w-full h-64 sm:h-80 md:h-96 cursor-pointer bg-neutral-900 flex items-center justify-center overflow-hidden"
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={post.content || 'Miniature vidéo de la réalisation'}
              className="w-full h-full object-cover filter brightness-95"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <VideoIcon className="w-12 h-12 text-[#FF6B00]/70" />
              <span className="text-xs font-semibold">Vidéo de la réalisation</span>
            </div>
          )}

          {/* Voile sombre pour faire ressortir le bouton PLAY */}
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />

          {/* Badge Vidéo 30s */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
            <VideoIcon className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Vidéo • 30s max</span>
          </div>

          {/* Bouton PLAY ▶️ au centre */}
          <button
            type="button"
            onClick={handlePlayClick}
            disabled={isLoadingVideo}
            className="absolute inset-0 m-auto w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#FF6B00] hover:bg-[#ff5500] text-white flex items-center justify-center shadow-2xl transition-colors cursor-pointer border-2 border-white/30"
            aria-label="Lire la vidéo"
          >
            {isLoadingVideo ? (
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            ) : (
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Message d'erreur éventuel */}
          {errorMessage && (
            <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-black/85 text-amber-300 text-xs font-semibold flex items-center justify-between border border-amber-500/30">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={handlePlayClick}
                className="px-2 py-1 rounded bg-[#FF6B00] text-white text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Réessayer</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
