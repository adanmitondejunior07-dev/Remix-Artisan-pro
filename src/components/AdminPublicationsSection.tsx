import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Video,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { SocialPost } from '../types.ts';

export const AdminPublicationsSection: React.FC = () => {
  const {
    socialPosts,
    deleteSocialPost,
    updateSocialPost,
    artisans,
    users,
    viewProfile,
    showToast,
    refreshData,
  } = useApp();

  // Filtres principaux
  const [selectedPreset, setSelectedPreset] = useState<
    'all' | 'artisans' | 'recent' | 'flagged'
  >('artisans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtisanFilter, setSelectedArtisanFilter] = useState('all');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'photo' | 'video'; title: string } | null>(null);

  // Extraire les options dynamiques de filtres depuis les données réelles
  const availableArtisans = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    socialPosts.forEach((p) => {
      const name = p.author || p.artisanName || p.user;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ id: name, name });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [socialPosts]);

  const availableTrades = useMemo(() => {
    const set = new Set<string>();
    socialPosts.forEach((p) => {
      if (p.artisanTrade) set.add(p.artisanTrade);
    });
    artisans.forEach((a) => {
      if (a.trade) set.add(a.trade);
    });
    return Array.from(set).sort();
  }, [socialPosts, artisans]);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    socialPosts.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    artisans.forEach((a) => {
      if (a.country) set.add(a.country);
    });
    return Array.from(set).sort();
  }, [socialPosts, artisans]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    socialPosts.forEach((p) => {
      if (p.city) set.add(p.city);
    });
    artisans.forEach((a) => {
      if (a.city) set.add(a.city);
    });
    return Array.from(set).sort();
  }, [socialPosts, artisans]);

  // Filtrage combiné et complet des publications
  const filteredPosts = useMemo(() => {
    return socialPosts.filter((post) => {
      const authorName = post.author || post.artisanName || post.user || '';
      const textContent = post.content || post.texte || '';
      const trade = post.artisanTrade || '';
      const country = post.country || '';
      const city = post.city || '';
      const status = post.status || (post.visibility === 'private' ? 'hidden' : 'published');

      // 1. Filtre par Preset rapide
      if (selectedPreset === 'artisans') {
        // Uniquement les comptes artisans ou publications avec artisanId / trade
        const isArtisanPost =
          Boolean(post.artisanId) ||
          post.role?.toLowerCase() === 'artisan' ||
          post.userRole?.toLowerCase() === 'artisan' ||
          artisans.some((a) => a.id === post.artisanId || a.name.toLowerCase() === authorName.toLowerCase()) ||
          users.some((u) => u.id === post.userId && u.role === 'artisan');
        if (!isArtisanPost) return false;
      } else if (selectedPreset === 'recent') {
        const postDate = new Date(post.createdAt).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (isNaN(postDate) || postDate < sevenDaysAgo) return false;
      } else if (selectedPreset === 'flagged') {
        const isFlagged = post.flagged || post.status === 'flagged' || post.status === 'moderated';
        if (!isFlagged) return false;
      }

      // 2. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          authorName.toLowerCase().includes(q) ||
          textContent.toLowerCase().includes(q) ||
          trade.toLowerCase().includes(q) ||
          city.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 3. Filtre par Artisan
      if (selectedArtisanFilter !== 'all') {
        if (authorName.toLowerCase() !== selectedArtisanFilter.toLowerCase()) return false;
      }

      // 4. Filtre par Métier
      if (selectedTradeFilter !== 'all') {
        if (trade.toLowerCase() !== selectedTradeFilter.toLowerCase()) return false;
      }

      // 5. Filtre par Pays
      if (selectedCountryFilter !== 'all') {
        if (country.toLowerCase() !== selectedCountryFilter.toLowerCase()) return false;
      }

      // 6. Filtre par Ville
      if (selectedCityFilter !== 'all') {
        if (city.toLowerCase() !== selectedCityFilter.toLowerCase()) return false;
      }

      // 7. Filtre par Statut
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'published' && status !== 'published') return false;
        if (selectedStatusFilter === 'hidden' && status !== 'hidden' && post.visibility !== 'private') return false;
        if (selectedStatusFilter === 'flagged' && !post.flagged && status !== 'flagged') return false;
      }

      // 8. Filtre par Date
      if (selectedDateFilter !== 'all') {
        const postDate = new Date(post.createdAt).getTime();
        const now = Date.now();
        if (selectedDateFilter === 'today') {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          if (postDate < oneDayAgo) return false;
        } else if (selectedDateFilter === 'week') {
          const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (postDate < weekAgo) return false;
        } else if (selectedDateFilter === 'month') {
          const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (postDate < monthAgo) return false;
        }
      }

      return true;
    });
  }, [
    socialPosts,
    selectedPreset,
    searchQuery,
    selectedArtisanFilter,
    selectedTradeFilter,
    selectedCountryFilter,
    selectedCityFilter,
    selectedStatusFilter,
    selectedDateFilter,
    artisans,
    users,
  ]);

  // Actions d'administration
  const handleToggleStatus = async (post: SocialPost) => {
    const newStatus = post.status === 'hidden' ? 'published' : 'hidden';
    const newVisibility = newStatus === 'hidden' ? 'private' : 'public';
    try {
      await updateSocialPost(post.id, {
        status: newStatus,
        visibility: newVisibility,
      });
      showToast({
        title: newStatus === 'hidden' ? 'Publication masquée' : 'Publication rétablie',
        desc: `Statut mis à jour pour "${post.author || 'Artisan'}".`,
        type: 'info',
      });
    } catch {
      showToast({
        title: 'Erreur',
        desc: 'Impossible de mettre à jour le statut.',
        type: 'warning',
      });
    }
  };

  const handleDeletePost = async (post: SocialPost) => {
    const author = post.author || post.artisanName || 'cet artisan';
    if (confirm(`Confirmer la suppression définitive de la publication de ${author} ?`)) {
      await deleteSocialPost(post.id);
    }
  };

  const formatDateReadable = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'Date inconnue';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00]">
              Espace Super Admin
            </span>
            <span className="text-xs font-bold text-neutral-400">
              {filteredPosts.length} publication{filteredPosts.length > 1 ? 's' : ''} trouvée{filteredPosts.length > 1 ? 's' : ''}
            </span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 mt-1">
            PUBLICATIONS DES ARTISANS
          </h2>
          <p className="text-xs text-neutral-500 max-w-2xl">
            Surveillance, modération et accès exhaustif à l'ensemble des publications créées par les Artisans de la plateforme.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await refreshData();
            showToast({ title: 'Données actualisées', type: 'info' });
          }}
          className="self-start lg:self-auto px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Actualiser le flux</span>
        </button>
      </div>

      {/* 1. Boutons Presets Rapides */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedPreset('artisans')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedPreset === 'artisans'
              ? 'bg-[#FF6B00] text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Publications des artisans
        </button>

        <button
          type="button"
          onClick={() => setSelectedPreset('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedPreset === 'all'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Toutes les publications
        </button>

        <button
          type="button"
          onClick={() => setSelectedPreset('recent')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedPreset === 'recent'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Publications récentes (7j)
        </button>

        <button
          type="button"
          onClick={() => setSelectedPreset('flagged')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedPreset === 'flagged'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Publications signalées
        </button>
      </div>

      {/* 2. Barre de filtres complets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-neutral-50/70 p-3.5 rounded-2xl border border-neutral-200/80 text-xs">
        {/* Recherche texte */}
        <div className="relative lg:col-span-2">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par texte, auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        {/* Filtrer par Artisan */}
        <div>
          <select
            value={selectedArtisanFilter}
            onChange={(e) => setSelectedArtisanFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous les artisans</option>
            {availableArtisans.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrer par Métier */}
        <div>
          <select
            value={selectedTradeFilter}
            onChange={(e) => setSelectedTradeFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous les métiers</option>
            {availableTrades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrer par Pays */}
        <div>
          <select
            value={selectedCountryFilter}
            onChange={(e) => setSelectedCountryFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous les pays</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrer par Ville */}
        <div>
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Toutes les villes</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrer par Statut */}
        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Tous statuts</option>
            <option value="published">Publique</option>
            <option value="hidden">Masquée / Modérée</option>
            <option value="flagged">Signalée</option>
          </select>
        </div>

        {/* Filtrer par Date */}
        <div>
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
          </select>
        </div>
      </div>

      {/* 3. Table des publications */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-700">
          <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-400 border-y border-neutral-200">
            <tr>
              <th className="py-3 px-3">Média</th>
              <th className="py-3 px-3">Artisan & Métier</th>
              <th className="py-3 px-4">Localisation</th>
              <th className="py-3 px-4 max-w-xs">Contenu</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3 text-center">Interactions</th>
              <th className="py-3 px-3">Statut</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const authorName = post.author || post.artisanName || post.user || 'Artisan';
                const postMedia = post.mediaUrl || (post as any).image;
                const isVideo =
                  post.mediaType === 'video' ||
                  (postMedia && typeof postMedia === 'string' && postMedia.startsWith('data:video'));
                const isHidden = post.status === 'hidden' || post.visibility === 'private';
                const isFlagged = post.flagged || post.status === 'flagged';
                const matchedArtisan = artisans.find(
                  (a) => a.id === post.artisanId || a.name.toLowerCase() === authorName.toLowerCase()
                );

                return (
                  <tr key={post.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Colonne Média */}
                    <td className="py-3 px-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 group">
                        {postMedia ? (
                          isVideo ? (
                            <div
                              onClick={() =>
                                setPreviewMedia({
                                  url: postMedia,
                                  type: 'video',
                                  title: post.content || 'Vidéo de réalisation',
                                })
                              }
                              className="w-full h-full flex items-center justify-center bg-black cursor-pointer"
                            >
                              <Video className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <img
                              src={postMedia}
                              alt="Média"
                              onClick={() =>
                                setPreviewMedia({
                                  url: postMedia,
                                  type: 'photo',
                                  title: post.content || 'Photo de réalisation',
                                })
                              }
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        {isVideo && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] text-white font-bold">
                            VID
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Colonne Artisan & Métier */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200">
                          {post.artisanAvatar || matchedArtisan?.avatarUrl ? (
                            <img
                              src={post.artisanAvatar || matchedArtisan?.avatarUrl}
                              alt={authorName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-neutral-700 bg-orange-100">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              viewProfile({
                                artisanId: post.artisanId,
                                userId: post.userId,
                                author: authorName,
                                name: authorName,
                              })
                            }
                            className="font-bold text-neutral-900 hover:text-[#FF6B00] text-left block truncate max-w-[140px] cursor-pointer"
                            title="Consulter le profil de l'artisan"
                          >
                            {authorName}
                          </button>
                          <span className="text-[11px] text-neutral-500 block truncate max-w-[140px]">
                            {post.artisanTrade || matchedArtisan?.trade || 'Artisan'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Localisation */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                        <span className="font-semibold">
                          {post.city || matchedArtisan?.city || 'Abidjan'}, {post.country || matchedArtisan?.country || 'Côte d’Ivoire'}
                        </span>
                      </div>
                    </td>

                    {/* Colonne Contenu */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="line-clamp-2 text-xs text-neutral-800 font-medium leading-relaxed">
                        {post.content || post.texte || 'Sans description texte.'}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                        ID: {post.id} · user_id: {post.userId || 'N/A'}
                      </span>
                    </td>

                    {/* Colonne Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-neutral-500 font-mono">
                      {formatDateReadable(post.createdAt)}
                    </td>

                    {/* Colonne Interactions */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-2.5 text-[11px] font-semibold text-neutral-600 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200/60">
                        <span className="flex items-center gap-0.5" title="Likes">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          <span>{post.likesCount ?? post.likes ?? 0}</span>
                        </span>
                        <span className="flex items-center gap-0.5" title="Commentaires">
                          <MessageCircle className="w-3 h-3 text-blue-500" />
                          <span>{post.comments?.length || 0}</span>
                        </span>
                        <span className="flex items-center gap-0.5" title="Partages">
                          <Share2 className="w-3 h-3 text-emerald-500" />
                          <span>{post.sharesCount || 0}</span>
                        </span>
                      </div>
                    </td>

                    {/* Colonne Statut */}
                    <td className="py-3 px-3">
                      {isFlagged ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Signalée
                        </span>
                      ) : isHidden ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                          <EyeOff className="w-3 h-3" />
                          Masquée
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Publique
                        </span>
                      )}
                    </td>

                    {/* Colonne Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            isHidden
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                          title={isHidden ? 'Rendre publique' : 'Masquer la publication'}
                        >
                          {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400">
                  <div className="space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-neutral-300" />
                    <p className="text-sm font-semibold text-neutral-600">
                      Aucune publication ne correspond à ces critères.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreset('all');
                        setSearchQuery('');
                        setSelectedArtisanFilter('all');
                        setSelectedTradeFilter('all');
                        setSelectedCountryFilter('all');
                        setSelectedCityFilter('all');
                        setSelectedStatusFilter('all');
                        setSelectedDateFilter('all');
                      }}
                      className="text-xs text-[#FF6B00] font-bold hover:underline cursor-pointer"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale d'aperçu plein écran média */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="bg-neutral-900 rounded-2xl max-w-2xl w-full p-4 border border-neutral-800 text-white space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold truncate">{previewMedia.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="text-neutral-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} controls autoPlay className="max-h-[65vh] w-full" />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-[65vh] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
