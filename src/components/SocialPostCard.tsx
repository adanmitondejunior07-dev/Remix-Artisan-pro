import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Copy,
  Flag,
  UserX,
  MapPin,
  CheckCircle2,
  Send,
  Reply,
  X,
  CornerDownRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { SocialPost, PostComment } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { isExactAdminEmail, isSuperAdmin } from '../config/adminConfig.ts';
import { FeedVideoPlayer } from './FeedVideoPlayer.tsx';
import { formatWhatsAppUrl } from '../utils/socialLinks.ts';

interface SocialPostCardProps {
  post: SocialPost;
  onAuthorClick?: (post: SocialPost) => void;
  hideTopMargins?: boolean;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  onAuthorClick,
  hideTopMargins = false,
}) => {
  const {
    currentUser,
    currentArtisan,
    artisans,
    users,
    likeSocialPost,
    deleteSocialPost,
    updateSocialPost,
    addPostComment,
    paymentModal,
    showToast,
    setSelectedTrade,
    setSelectedCity,
    go,
  } = useApp();

  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [areCommentsHidden, setAreCommentsHidden] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editText, setEditText] = useState(post.content || post.texte || '');
  const [editTitle, setEditTitle] = useState(post.nom || '');

  // Author information: DYNAMIC LOOKUP from profiles linked to user_id (Règle user_id)
  const isPostByUser = Boolean(
    currentUser &&
    ((post.userId && (String(post.userId) === String(currentUser.id) || post.userId === 'current-user')) ||
     (currentUser.artisanId && post.artisanId === currentUser.artisanId))
  );

  const authorUser = post.userId
    ? (isPostByUser
        ? currentUser
        : users.find((u) => String(u.id) === String(post.userId)))
    : undefined;

  const authorArtisan = post.artisanId
    ? (currentArtisan && currentArtisan.id === post.artisanId
        ? currentArtisan
        : artisans.find((a) => a.id === post.artisanId))
    : (authorUser?.artisanId ? artisans.find((a) => a.id === authorUser.artisanId) : undefined);

  // Dynamic Author Name: retrieved from linked profile
  const authorName =
    (isPostByUser ? currentUser?.name : null) ||
    authorUser?.name ||
    authorArtisan?.name ||
    post.author ||
    post.artisanName ||
    (post as any).artisan ||
    'Utilisateur';

  // Dynamic Author Avatar
  const authorAvatarUrl =
    (isPostByUser ? (currentUser?.avatarUrl || currentUser?.photoUrl || currentUser?.avatar) : null) ||
    authorUser?.avatarUrl ||
    authorUser?.photoUrl ||
    authorUser?.avatar ||
    authorArtisan?.avatarUrl ||
    authorArtisan?.photoUrl ||
    post.artisanAvatar ||
    (post as any).authorAvatar ||
    '';

  const postMedia = post.mediaUrl || (post as any).image;
  const postText = post.content || (post as any).description || post.texte || '';
  const isVideoMedia =
    post.mediaType === 'video' ||
    (postMedia && typeof postMedia === 'string' && postMedia.startsWith('data:video'));

  // Strict verification check (NEVER a fake badge - Règle 2 & 7)
  const isActuallyVerified = Boolean(
    post.verified === true ||
    authorArtisan?.verified === true ||
    authorArtisan?.is_verified === true ||
    authorUser?.verified === true ||
    authorUser?.is_verified === true
  );

  // Ownership verification
  const isCurrentUserAdmin = isSuperAdmin(currentUser) || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isOwner = Boolean(
    !currentUser ||
    post.userId === 'current-user' ||
    isPostByUser ||
    (currentUser?.id && String(post.userId) === String(currentUser.id)) ||
    (currentArtisan?.id && (String(post.userId) === String(currentArtisan.id) || post.artisanId === currentArtisan.id)) ||
    (currentUser?.artisanId && (post.artisanId === currentUser.artisanId || String(post.userId) === String(currentUser.artisanId))) ||
    (currentUser?.name && authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  // Can modify/delete: only owner or super admin
  const canModifyOrDelete = isOwner || isCurrentUserAdmin;

  // Likes & reactions count
  const isLiked = Boolean(
    (Array.isArray(post.likedBy) && post.likedBy.includes(currentUser?.id || 'guest')) ||
    post.user_has_liked
  );
  const likesCount =
    post.likesCount !== undefined
      ? post.likesCount
      : post.likes !== undefined
      ? post.likes
      : post.likedBy
      ? post.likedBy.length
      : 0;

  // Comments count
  const commentsList: PostComment[] = post.comments || [];
  const commentsCount = commentsList.length;
  const rootComments = commentsList.filter((c) => !c.parentId);
  const getRepliesFor = (commentId: string) =>
    commentsList.filter((c) => c.parentId === commentId);

  // Shares count
  const sharesCount = post.sharesCount || 0;

  // Date formatting (readable, clean)
  const formatPostDate = (dateStr?: string) => {
    if (!dateStr) return 'Récemment';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Récemment';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} j`;
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return 'Récemment';
    }
  };

  const handleLike = () => {
    likeSocialPost(post.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Publication de ${authorName} sur ArtisanPro`,
          text: postText.slice(0, 100),
          url: `${window.location.origin}/#post-${post.id}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${window.location.origin}/#post-${post.id}`);
      showToast({
        title: 'Lien copié !',
        desc: 'Le lien de la publication a été copié dans votre presse-papier.',
        type: 'info',
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/#post-${post.id}`);
    setIsMenuOpen(false);
    showToast({
      title: 'Lien copié',
      desc: 'Le lien direct vers cette publication a été copié.',
      type: 'info',
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    const textToSend = commentText.trim();
    setCommentText('');
    const parentId = replyingTo?.id || null;
    setReplyingTo(null);

    await addPostComment(post.id, textToSend, parentId);
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    try {
      await deleteSocialPost(post.id);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de supprimer la publication.',
        type: 'warning',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() && !editTitle.trim()) {
      showToast({
        title: 'Contenu vide',
        desc: 'Veuillez saisir du texte pour votre publication.',
        type: 'warning',
      });
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateSocialPost(post.id, {
        content: editText.trim(),
        texte: editText.trim(),
        nom: editTitle.trim() || undefined,
      });
      setShowEditModal(false);
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de modifier la publication.',
        type: 'warning',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleContactWhatsApp = () => {
    const rawPhone = post.whatsapp || post.phone || authorArtisan?.whatsapp || authorArtisan?.phone || '2250700000000';
    const waUrl = formatWhatsAppUrl(
      rawPhone,
      `Bonjour ${authorName}, j'ai vu votre publication sur ArtisanPro concernant : "${(post.nom || postText).slice(0, 60)}". Est-ce disponible ?`
    );
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id={`post-${post.id}`}
      /* RÈGLE 6 : Sur téléphone largeur 92-95% (w-[92%] à w-[94%]), centré mx-auto, marges 14-16px, arrondi, espacement visible */
      /* Sur tablette/ordinateur : max-w-[620px] centré avec marges élégantes */
      className={`w-[92%] sm:w-[94%] max-w-[620px] mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-all duration-200 ${
        hideTopMargins ? 'mb-4' : 'my-3.5 sm:my-4'
      }`}
    >
      {/* 1. EN-TÊTE DE LA PUBLICATION (Règle 7) */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-neutral-100/80">
        <div
          onClick={() => onAuthorClick?.(post)}
          className={`flex items-center gap-3 min-w-0 ${
            onAuthorClick ? 'cursor-pointer group' : ''
          }`}
        >
          {/* Photo de profil ronde */}
          <div className="relative shrink-0">
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-neutral-200 shadow-2xs group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-200 flex items-center justify-center text-lg shadow-2xs font-bold text-neutral-700">
                {post.artisanEmoji || authorArtisan?.emoji || authorName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Badge de vérification réel uniquement (Règle 2 & 7) */}
            {isActuallyVerified && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                title="Compte ArtisanPro vérifié"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Nom, Métier, Date et Localisation */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-neutral-900 truncate group-hover:text-[#FF6B00] transition-colors">
                {authorName}
              </span>
              {post.isAdmin && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black text-white font-extrabold uppercase tracking-wider">
                  Admin
                </span>
              )}
              {isActuallyVerified && (
                <span className="text-emerald-600 font-bold text-xs" title="Vérifié">
                  ✓
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-neutral-500 flex-wrap">
              <span>{post.artisanTrade || authorArtisan?.trade || 'Membre'}</span>
              <span>·</span>
              <span>{formatPostDate(post.createdAt)}</span>
              {(post.city || authorArtisan?.city) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-neutral-600">
                    <MapPin className="w-2.5 h-2.5 text-neutral-400" />
                    <span>{post.city || authorArtisan?.city}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions sur la publication (Suppression rapide et Menu [...]) */}
        <div className="relative shrink-0 flex items-center gap-1">
          {/* Bouton de suppression rapide direct pour le propriétaire ou l'admin */}
          {canModifyOrDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Supprimer la publication"
              aria-label="Supprimer la publication"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            aria-label="Options de la publication"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Menu déroulant [...] */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-30 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                {/* Options pour le PROPRIÉTAIRE (Règle 10) */}
                {canModifyOrDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowEditModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-neutral-500" />
                      <span>Modifier la publication</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setAreCommentsHidden((prev) => !prev);
                        showToast({
                          title: areCommentsHidden ? 'Commentaires affichés' : 'Commentaires masqués',
                          type: 'info',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      {areCommentsHidden ? (
                        <>
                          <Eye className="w-4 h-4 text-neutral-500" />
                          <span>Afficher les commentaires</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-neutral-500" />
                          <span>Masquer les commentaires</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full px-3.5 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-neutral-500" />
                      <span>Copier le lien</span>
                    </button>

                    <div className="my-1 border-t border-neutral-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-bold cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Supprimer la publication</span>
                    </button>
                  </>
                ) : (
                  /* Options pour un AUTRE UTILISATEUR (Règle 10 : Ne PAS afficher Supprimer) */
                  <>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full px-3.5 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-neutral-500" />
                      <span>Copier le lien</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        showToast({
                          title: 'Publication signalée',
                          desc: 'Merci de votre signalement. Notre équipe de modération va examiner ce contenu.',
                          type: 'info',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Flag className="w-4 h-4 text-amber-500" />
                      <span>Signaler la publication</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        showToast({
                          title: 'Utilisateur bloqué',
                          desc: `Vous ne verrez plus les publications de ${authorName}.`,
                          type: 'info',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserX className="w-4 h-4 text-red-500" />
                      <span>Bloquer cet utilisateur</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. TEXTE DE LA PUBLICATION (Règle 7) */}
      {(postText || post.nom) && (
        <div className="px-4 py-3 text-neutral-900 text-sm leading-relaxed space-y-1">
          {post.nom && (
            <h3 className="font-bold text-base text-neutral-950">{post.nom}</h3>
          )}
          {postText && (
            <p className="whitespace-pre-line text-neutral-800">{postText}</p>
          )}
        </div>
      )}

      {/* 3. MÉDIA DE LA PUBLICATION (Photo ou Vidéo - Règle 8 : object-fit: cover, pas de déformation, vidéo contenue) */}
      {postMedia && (
        <div className="w-full bg-black/95 flex items-center justify-center overflow-hidden max-h-[560px]">
          {isVideoMedia ? (
            <div className="w-full max-h-[560px] overflow-hidden flex items-center justify-center">
              <FeedVideoPlayer
                post={{
                  ...post,
                  mediaUrl: postMedia,
                  mediaType: 'video',
                }}
              />
            </div>
          ) : (
            <img
              src={postMedia}
              alt={post.nom || postText || 'Photo de publication'}
              className="w-full h-auto max-h-[560px] object-cover block"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* 5. STATISTIQUES RÉELLES : Réactions, Commentaires, Partages (Règle 7) */}
      <div className="px-4 py-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          {likesCount > 0 && (
            <span className="flex items-center gap-1 text-neutral-700 font-semibold">
              <span className="w-4 h-4 rounded-full bg-[#FF6B00] text-white text-[10px] flex items-center justify-center font-bold">
                👍
              </span>
              <span>{likesCount}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            onClick={() => setIsCommentsOpen((prev) => !prev)}
            className="hover:underline cursor-pointer"
          >
            {commentsCount} {commentsCount > 1 ? 'commentaires' : 'commentaire'}
          </span>
          <span>·</span>
          <span>{sharesCount} {sharesCount > 1 ? 'partages' : 'partage'}</span>
        </div>
      </div>

      {/* 6. BOUTONS D'ACTION : J'aime / Réagir, Commenter, Partager (Règle 7) */}
      <div className="px-2 py-1 border-t border-neutral-100 grid grid-cols-3 gap-1 text-xs font-bold text-neutral-600">
        <button
          type="button"
          onClick={handleLike}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isLiked
              ? 'text-[#FF6B00] bg-orange-50/60 font-black'
              : 'hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              isLiked ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-neutral-500'
            }`}
          />
          <span>J’aime</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCommentsOpen((prev) => !prev)}
          className="py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-neutral-500" />
          <span>Commenter</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2.5 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-neutral-500" />
          <span>Partager</span>
        </button>
      </div>

      {/* 7. SECTION COMMENTAIRES ACCORDÉON (Règle 7) */}
      {isCommentsOpen && !areCommentsHidden && (
        <div className="p-3 sm:p-4 bg-neutral-50 border-t border-neutral-100 space-y-3">
          {/* Répondre à quelqu'un */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs text-orange-900">
              <span className="flex items-center gap-1.5">
                <Reply className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Répondre à</span>
                <span className="font-bold">@{replyingTo.authorName}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Saisie d'un nouveau commentaire */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={
                replyingTo
                  ? `Répondre à @${replyingTo.authorName}...`
                  : 'Écrire un commentaire public...'
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-[#FF6B00] bg-white text-neutral-900 placeholder:text-neutral-400 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </div>

          {/* Liste des commentaires */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rootComments.length > 0 ? (
              rootComments.map((comm) => {
                const replies = getRepliesFor(comm.id);
                const commAuthor = comm.userName || comm.authorName || 'Utilisateur';

                return (
                  <div key={comm.id} className="space-y-1.5">
                    <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">{commAuthor}</span>
                        <span className="text-[10px] text-neutral-400">
                          {formatPostDate(comm.createdAt)}
                        </span>
                      </div>
                      <p className="text-neutral-700 leading-relaxed">{comm.text}</p>
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setReplyingTo({ id: comm.id, authorName: commAuthor })}
                          className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Répondre</span>
                        </button>
                      </div>
                    </div>

                    {/* Réponses imbriquées */}
                    {replies.length > 0 && (
                      <div className="pl-4 sm:pl-6 border-l-2 border-orange-200 ml-3 space-y-1.5">
                        {replies.map((reply) => {
                          const replyAuthor = reply.userName || reply.authorName || 'Utilisateur';
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
                                <span className="text-[10px] text-neutral-400">
                                  {formatPostDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-neutral-700">{reply.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 text-center py-2 italic">
                Soyez le premier à commenter cette publication.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 8. MODALE DE CONFIRMATION DE SUPPRESSION (Règle 11 & 12) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="text-base font-black text-neutral-900">
                Supprimer cette publication ?
              </h4>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Cette publication sera définitivement supprimée. Cette action ne peut pas être annulée.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODALE DE MODIFICATION DE PUBLICATION (Règle 13) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#FF6B00]" />
                <h4 className="text-base font-black text-neutral-900">
                  Modifier la publication
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {post.nom !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Titre de l'article / réalisation
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Texte de la publication
                </label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Que souhaitez-vous partager ?"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#FF6B00] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
