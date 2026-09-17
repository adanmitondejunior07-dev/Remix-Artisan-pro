import React, { useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Video,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useLang } from '../LangContext.tsx';
import type { SocialPost } from '../types.ts';
import { PublierRealisation } from './PublierRealisation.tsx';
import { SocialPostCard } from './SocialPostCard.tsx';

export const SocialFeed: React.FC = () => {
  const { t: tLang } = useLang();
  const {
    socialPosts,
    createSocialPost,
    currentUser,
    currentArtisan,
    artisans,
    showToast,
    go,
    isSubscriptionExpired,
    setSelectedArtisanId,
    t: tApp,
  } = useApp();

  const t = { ...tApp, ...tLang };

  // Barre de création rapide de publications sur le fil d'actualité
  const [newTexte, setNewTexte] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const handlePublier = async () => {
    if (!newTexte.trim()) return;

    const authorName = currentUser?.name || currentArtisan?.name || 'Artisan';
    const isActuallyVerified = Boolean(
      currentUser?.verified ||
      (currentUser as any)?.is_verified ||
      currentArtisan?.verified ||
      (currentArtisan as any)?.is_verified
    );

    const newItem: Partial<SocialPost> = {
      id: `post-${Date.now()}`,
      type: 'publication',
      texte: newTexte.trim(),
      content: newTexte.trim(),
      user: authorName,
      author: authorName,
      userId: currentUser?.id ? String(currentUser.id) : undefined,
      artisanId: currentArtisan?.id || currentUser?.artisanId || undefined,
      likes: 0,
      likesCount: 0,
      likedBy: [],
      viewsCount: 1,
      comments: [],
      sharesCount: 0,
      mediaType: 'text',
      createdAt: new Date().toISOString(),
      artisanName: authorName,
      artisanTrade: currentArtisan?.trade || (currentUser?.role === 'artisan' ? 'Artisan' : 'Membre'),
      verified: isActuallyVerified,
      city: currentArtisan?.city || currentUser?.city || 'Abidjan',
      country: currentArtisan?.country || currentUser?.country || 'Côte d’Ivoire',
    };

    await createSocialPost(newItem as any);
    setNewTexte('');
    showToast({
      title: 'Publication en ligne !',
      desc: 'Visible immédiatement sur le fil d’actualité.',
      type: 'success',
    });
  };

  const handleAuthorClick = (post: SocialPost) => {
    if (post.artisanId) {
      setSelectedArtisanId(post.artisanId);
      go('profile');
    } else {
      const match = artisans.find(
        (a) =>
          a.name.trim().toLowerCase() ===
          (post.author || post.artisanName || '').trim().toLowerCase()
      );
      if (match) {
        setSelectedArtisanId(match.id);
        go('profile');
      } else {
        go('profile');
      }
    }
  };

  return (
    <div id="social-feed-container" className="feed-container w-full max-w-[620px] mx-auto px-2 sm:px-4 pb-24 scroll-mt-24">
      {/* 1. Barre de création rapide de publication (Fil d'actualité) */}
      <div className="w-[92%] sm:w-[94%] max-w-[620px] mx-auto bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-3.5 mb-3.5 mt-2">
        <div className="flex items-center gap-2.5">
          {currentUser?.avatarUrl || currentArtisan?.avatarUrl ? (
            <img
              src={currentUser?.avatarUrl || currentArtisan?.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AP'}
            </div>
          )}
          <input
            value={newTexte}
            onChange={(e) => setNewTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePublier();
              }
            }}
            placeholder={`${t.quoiDeNeuf || 'Quoi de neuf'} ? Partagez une publication...`}
            className="flex-1 p-2.5 px-3.5 bg-neutral-100 rounded-full text-xs sm:text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={handlePublier}
            disabled={!newTexte.trim()}
            className="bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-40 text-white px-3.5 py-2 rounded-full font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            {t.publier || 'Publier'}
          </button>
        </div>

        <div className="flex items-center justify-around pt-2.5 mt-2.5 border-t border-neutral-100 text-xs text-neutral-600">
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="flex-1 py-1.5 px-3 rounded-xl hover:bg-neutral-50 flex items-center justify-center gap-2 font-semibold text-neutral-700 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#FF6B00]" />
            <span>Photo</span>
          </button>
          <div className="w-px h-4 bg-neutral-200" />
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="flex-1 py-1.5 px-3 rounded-xl hover:bg-neutral-50 flex items-center justify-center gap-2 font-semibold text-neutral-700 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4 text-emerald-600" />
            <span>Vidéo</span>
          </button>
        </div>
      </div>

      {/* 2. STATUTS RÉCENTS / STORIES (Style Moderne) */}
      <div className="w-[92%] sm:w-[94%] max-w-[620px] mx-auto bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-3.5 mb-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-black tracking-wider text-neutral-500 uppercase">
            {t.Statuts || 'STATUTS RÉCENTS'}
          </span>
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.Ajouter || 'Ajouter'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {/* Story 1 : L'utilisateur actuel */}
          <div
            onClick={() => setIsCreatingPost(true)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-[#FF6B00] flex items-center justify-center bg-white group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center font-black text-sm text-neutral-700 overflow-hidden">
                {currentUser?.avatarUrl || currentArtisan?.avatarUrl ? (
                  <img
                    src={currentUser?.avatarUrl || currentArtisan?.avatarUrl}
                    alt="Vous"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{currentUser?.name?.slice(0, 2).toUpperCase() || 'AP'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xs font-black shadow-xs border-2 border-white">
                +
              </div>
            </div>
            <span className="text-[11px] font-semibold text-neutral-700 max-w-[64px] truncate text-center">
              {t.Ajouter || 'Vous'}
            </span>
          </div>

          {/* Artisans récents / statuts */}
          {artisans.slice(0, 8).map((art) => (
            <div
              key={art.id}
              onClick={() => {
                setSelectedArtisanId(art.id);
                go('profile');
              }}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold overflow-hidden">
                    {art.avatarUrl ? (
                      <img
                        src={art.avatarUrl}
                        alt={art.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{art.emoji || '🛠️'}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-neutral-700 max-w-[64px] truncate text-center">
                {art.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bouton flottant '+' pour publier */}
      <button
        type="button"
        onClick={() => {
          if (currentUser?.role === 'artisan' && isSubscriptionExpired) {
            showToast({
              title: 'Abonnement expiré',
              desc: 'Votre formule a expiré. Veuillez la renouveler pour publier une réalisation.',
              type: 'warning',
            });
            go('abonnements');
            return;
          }
          setIsCreatingPost(true);
        }}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-14 h-14 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white shadow-xl flex items-center justify-center transition-colors cursor-pointer border-2 border-white"
        aria-label="Publier un travail"
        title="Publier une création (Photo / Vidéo)"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>

      {/* 4. Flux des publications (Règle 6: Centré, responsive 92-95% mobile, max 680px desktop) */}
      <div className="w-full space-y-3.5 sm:space-y-4">
        {socialPosts.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            onAuthorClick={handleAuthorClick}
          />
        ))}
      </div>

      {/* 5. Modale pour publier une réalisation (Photo / Vidéo / Devis) */}
      <PublierRealisation
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
      />
    </div>
  );
};
