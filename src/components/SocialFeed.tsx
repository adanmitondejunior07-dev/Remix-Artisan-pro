import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Plus,
  CheckCircle2,
  MapPin,
  X,
  MessageSquare,
  Bell,
  Check,
  ShieldCheck,
  CornerDownRight,
  Reply,
  MoreVertical,
  Pencil,
  Trash2,
  ShoppingCart,
  Image as ImageIcon,
  Video,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { SocialPost, PostComment } from '../types.ts';
import { PublierRealisation } from './PublierRealisation.tsx';
import { FeedVideoPlayer } from './FeedVideoPlayer.tsx';
import { isExactAdminEmail } from '../config/adminConfig.ts';
import { firestoreService } from '../services/firestoreService.ts';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';

export const SocialFeed: React.FC = () => {
  const {
    socialPosts,
    likeSocialPost,
    addPostComment,
    deleteSocialPost,
    createSocialPost,
    currentUser,
    currentArtisan,
    showToast,
    followingArtisans,
    toggleFollowArtisan,
    go,
    isSubscriptionExpired,
    paymentModal,
    quoteModal,
  } = useApp();

  // Create post modal state
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Menu 3 points ouvert (par postId)
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // Comment input per post
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<{
    postId: string;
    commentId: string;
    userName: string;
  } | null>(null);

  const handleLike = (postId: string) => {
    likeSocialPost(postId);
  };

  const handleShare = (post: SocialPost) => {
    const author = post.author || post.artisanName;
    const text = `Découvrez la réalisation de ${author} (${post.artisanTrade}) sur ArtisanPro : ${post.content}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${author} - ArtisanPro`,
          text: text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      showToast({
        title: 'Lien copié !',
        desc: 'Partagez cette réalisation sur vos réseaux.',
        type: 'success',
      });
    }
  };

  // WhatsApp Contact direct
  const handleContactWhatsApp = (post: SocialPost) => {
    const rawPhone = post.whatsapp || post.phone || '2250503444508';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `225${cleanPhone}` : cleanPhone;
    const targetName = post.author || post.artisanName || 'Artisan';
    const snippet = post.content ? `"${post.content.slice(0, 50)}..."` : 'votre publication';
    const msg = encodeURIComponent(
      `Bonjour ${targetName}, j'ai vu votre publication ${snippet} sur ArtisanPro. Je souhaite échanger avec vous.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  const handleInitiateReply = (postId: string, commentId: string, authorName: string) => {
    setActiveCommentPostId(postId);
    setReplyingTo({
      postId,
      commentId,
      userName: authorName,
    });
  };

  const handleSendComment = (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    const parentId = replyingTo?.postId === postId ? replyingTo.commentId : null;
    addPostComment(postId, text, parentId);
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
    setReplyingTo(null);
  };

  // FONCTION SUPPRIMER - IMMÉDIATE SANS DÉLAI : DISPARITION INSTANTANÉE
  const supprimerPublication = async (id: string) => {
    // Disparition immédiate et suppression du DOM sans aucun lag
    const elem = document.getElementById('post-' + id);
    if (elem) {
      elem.style.display = 'none';
      elem.remove();
    }

    // Suppression instantanée dans le contexte global React
    try {
      deleteSocialPost(id);
    } catch (err) {
      console.warn('Erreur deleteSocialPost:', err);
    }

    // Supabase delete en arrière-plan
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('publications')
          .delete()
          .eq('id', id);
      } catch (err: any) {
        console.warn('Erreur Supabase suppression:', err);
      }
    }

    showToast({
      title: 'Publication supprimée',
      desc: 'La publication a disparu immédiatement de votre fil.',
      type: 'success',
    });
  };

  React.useEffect(() => {
    (window as any).supprimerPublication = supprimerPublication;
    return () => {
      delete (window as any).supprimerPublication;
    };
  }, [deleteSocialPost]);

  const handleDeletePost = async (post: SocialPost) => {
    setOpenMenuPostId(null);
    await supprimerPublication(post.id);
  };

  const handleEditPost = async (post: SocialPost) => {
    setOpenMenuPostId(null);
    const updatedContent = window.prompt(
      'Modifier la description de la publication :',
      post.content
    );
    if (updatedContent === null) return;

    const updatedPrice = window.prompt('Modifier le tarif :', post.price || 'Tarif sur devis');
    if (updatedPrice === null) return;

    try {
      const updatedPost: SocialPost = {
        ...post,
        content: updatedContent.trim() || post.content,
        price: updatedPrice.trim() || post.price,
      };
      await firestoreService.savePublication(updatedPost);
      await createSocialPost(updatedPost);
      showToast({
        title: 'Publication modifiée',
        desc: 'Les modifications ont été enregistrées avec succès.',
        type: 'success',
      });
    } catch (err: any) {
      alert('Erreur lors de la modification : ' + (err?.message || err));
    }
  };

  return (
    <div id="social-feed-container" className="feed-container w-full max-w-[680px] mx-auto px-0 md:px-4 scroll-mt-24">
      {/* Modern Social Feed Top Publisher Box (Style réseau social moderne ArtisanPro) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-3.5 sm:p-4 mb-4">
        <div className="flex items-center gap-3">
          {currentUser?.avatarUrl || currentArtisan?.avatarUrl ? (
            <img
              src={currentUser?.avatarUrl || currentArtisan?.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AP'}
            </div>
          )}
          <div
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
            className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200/70 text-neutral-500 text-xs sm:text-sm font-medium cursor-pointer transition-colors flex items-center justify-between"
          >
            <span>Partagez une réalisation, un tarif ou une actualité...</span>
            <Sparkles className="w-4 h-4 text-[#FF6B00] shrink-0 ml-2" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 text-xs text-neutral-600">
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="flex-1 py-1.5 px-2 rounded-xl hover:bg-neutral-100 flex items-center justify-center gap-2 font-bold text-neutral-700 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#FF6B00]" />
            <span>Photo</span>
          </button>
          <div className="w-px h-5 bg-neutral-200"></div>
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="flex-1 py-1.5 px-2 rounded-xl hover:bg-neutral-100 flex items-center justify-center gap-2 font-bold text-neutral-700 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4 text-emerald-600" />
            <span>Vidéo (30s max)</span>
          </button>
          <div className="w-px h-5 bg-neutral-200"></div>
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="flex-1 py-1.5 px-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Publier</span>
          </button>
        </div>
      </div>

      {/* Floating '+' Button */}
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

      {/* Publications Stream (No filter by role - Everyone sees everything) */}
      <div className="w-full">
        {socialPosts.map((post) => {
          const isLiked = post.likedBy?.includes(currentUser?.id || 'guest');
          const isCommentsOpen = activeCommentPostId === post.id;
          const authorName = post.author || post.artisanName || (post as any).artisan || 'Vous';
          const postPrice = post.price || (post as any).tarif;
          const postMedia = post.mediaUrl || (post as any).image;
          const postText = post.content || (post as any).description || '';
          const isVideoMedia = post.mediaType === 'video' || (postMedia && typeof postMedia === 'string' && postMedia.startsWith('data:video'));
          const isAdmin = post.isAdmin || post.role === 'ADMIN';
          const isPub = post.isPub || postPrice?.trim().toLowerCase() === 'pub';

          const isCurrentUserAdmin =
            currentUser?.role === 'admin' ||
            currentUser?.role === 'super_admin' ||
            Boolean((currentUser as any)?.isAdmin) ||
            Boolean(currentArtisan && (currentArtisan.plan as string) === 'Admin') ||
            Boolean(currentUser?.email && isExactAdminEmail(currentUser.email));

          const isOwner =
            Boolean(currentUser?.id && post.userId === currentUser.id) ||
            Boolean((currentUser as any)?.uid && post.userId === (currentUser as any).uid) ||
            Boolean(currentArtisan?.id && post.userId === String(currentArtisan.id)) ||
            Boolean(currentArtisan?.id && post.artisanId === currentArtisan.id);

          const canManagePost = isCurrentUserAdmin || isOwner;

          // All comments belonging to this post
          const commentsList: PostComment[] = post.comments || [];
          const rootComments = commentsList.filter((c) => !c.parentId);
          const getRepliesFor = (commentId: string) =>
            commentsList.filter((c) => c.parentId === commentId);

          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className="post-card"
            >
              {/* CARTE PUBLICATION AVEC EN-TÊTE ET BOUTON SUPPRIMER */}
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {post.artisanAvatar ? (
                    <img
                      src={post.artisanAvatar}
                      alt={authorName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {isAdmin ? '🛡️' : (post.artisanEmoji || '✨')}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <b className="text-neutral-900 font-bold text-sm leading-tight">{authorName}</b>
                      {isAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF6B00] text-white font-extrabold uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                      {post.verified && (
                        <span className="text-emerald-600 text-xs font-bold" title="Vérifié">✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'gray' }}>
                      {post.artisanTrade || 'Artisan'}{post.city ? ` • ${post.city}` : ''}
                    </div>
                  </div>
                </div>

                {/* BOUTON SUPPRIMER POUR TOUS LES UTILISATEURS */}
                <div className="flex items-center gap-2">
                  {postPrice && !isPub && (
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-orange-50 text-[#FF6B00] text-xs font-bold border border-orange-200">
                      {postPrice}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => supprimerPublication(post.id)}
                    className="h-8 px-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold border border-red-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="Supprimer la publication"
                    aria-label="Supprimer la publication"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                </div>
              </div>

              {/* MEDIA */}
              {postMedia && (
                <div className="w-full bg-black flex items-center justify-center overflow-hidden">
                  {isVideoMedia ? (
                    <FeedVideoPlayer post={{ ...post, mediaUrl: postMedia, mediaType: 'video' }} />
                  ) : (
                    <img
                      src={postMedia}
                      alt={postText || 'Réalisation'}
                      style={{ width: '100%', maxHeight: '560px', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              )}

              {/* BARRE D'ACTIONS: ❤️ 💬 ↗️ + WHATSAPP */}
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="border-b border-neutral-100">
                <div className="flex items-center gap-4 text-sm font-semibold text-neutral-700">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500 text-neutral-600'
                    }`}
                    title="J'aime"
                  >
                    <span>{isLiked ? '❤️' : '🤍'}</span>
                    <span className="text-xs">{post.likesCount || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCommentPostId((prev) => (prev === post.id ? null : post.id))}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-[#FF6B00] text-neutral-600 transition-colors"
                    title="Commentaires"
                  >
                    <span>💬</span>
                    <span className="text-xs">{commentsList.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 text-neutral-600 transition-colors"
                    title="Partager"
                  >
                    <span>↗️</span>
                    <span className="text-xs hidden sm:inline">Partager</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const numericPrice = parseInt((postPrice || '0').replace(/\D/g, ''), 10) || 15000;
                      paymentModal.open({
                        customTitle: `Commande: ${postText?.slice(0, 50) || authorName}`,
                        customAmount: numericPrice,
                        service: {
                          id: `srv-${post.id}`,
                          artisanId: post.artisanId || 1,
                          artisanName: authorName,
                          trade: post.artisanTrade || 'Artisan',
                          title: postText?.slice(0, 50) || `Article de ${authorName}`,
                          price: postPrice || `${numericPrice} FCFA`,
                          priceValue: numericPrice,
                          city: post.city || 'Abidjan',
                          country: post.country || 'Côte d’Ivoire',
                          description: postText || '',
                          category: 'Marketplace',
                          duration: 'Livraison 24h-48h',
                          emoji: '🛍️',
                        },
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                    title="Commander directement cet article / prestation"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Commander</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleContactWhatsApp(post)}
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                    title="Discuter directement sur WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* DESCRIPTION DE LA PUBLICATION */}
              {postText && (
                <div style={{ padding: '12px 14px 14px' }} className="text-neutral-800 text-sm leading-relaxed whitespace-pre-line">
                  {postText}
                </div>
              )}

              {/* ACCORDÉON COMMENTAIRES */}
              {isCommentsOpen && (
                <div className="p-3 sm:p-4 bg-neutral-50 border-t border-neutral-200 space-y-3">
                  {/* Bannière de réponse */}
                  {replyingTo && replyingTo.postId === post.id && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-800">
                      <span className="flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>Répondre à</span>
                        <span className="font-bold text-[#FF7A00]">@{replyingTo.userName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                        title="Annuler la réponse"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Zone de saisie commentaire */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        replyingTo && replyingTo.postId === post.id
                          ? `Répondre à @${replyingTo.userName}...`
                          : 'Écrire un commentaire...'
                      }
                      value={commentText[post.id] || ''}
                      onChange={(e) =>
                        setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendComment(post.id);
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#FF6B00] bg-white text-neutral-900 placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendComment(post.id)}
                      disabled={!commentText[post.id]?.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </div>

                  {/* Liste des commentaires */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {rootComments.length > 0 ? (
                      rootComments.map((comm) => {
                        const replies = getRepliesFor(comm.id);
                        const commAuthor = comm.userName || comm.authorName || 'Utilisateur';

                        return (
                          <div key={comm.id} className="space-y-1.5">
                            <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-neutral-900">
                                  {commAuthor}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  {new Date(comm.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-neutral-700 leading-relaxed">{comm.text}</p>
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInitiateReply(post.id, comm.id, commAuthor)
                                  }
                                  className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Reply className="w-3 h-3" />
                                  <span>Répondre</span>
                                </button>
                              </div>
                            </div>

                            {/* Réponses imbriquées */}
                            {replies.length > 0 && (
                              <div className="pl-4 sm:pl-6 border-l-2 border-orange-300 ml-3 space-y-1.5">
                                {replies.map((reply) => {
                                  const replyAuthor =
                                    reply.userName || reply.authorName || 'Utilisateur';

                                  return (
                                    <div
                                      key={reply.id}
                                      className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 font-bold text-neutral-900">
                                          <CornerDownRight className="w-3 h-3 text-[#FF6B00]" />
                                          <span>{replyAuthor}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-500">
                                          {new Date(reply.createdAt).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-neutral-700 leading-relaxed pl-4">
                                        {reply.text}
                                      </p>
                                      <div className="pl-4 pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleInitiateReply(post.id, comm.id, replyAuthor)
                                          }
                                          className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          <Reply className="w-3 h-3" />
                                          <span>Répondre</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-neutral-500 italic text-center py-2">
                        Soyez le premier à commenter cette publication.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE POST MODAL SÉCURISÉ (PublierRealisation) */}
      <PublierRealisation
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
      />
    </div>
  );
};
