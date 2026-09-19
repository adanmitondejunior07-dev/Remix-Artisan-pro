import React, { useState } from 'react';
import {
  Search,
  MapPin,
  ShieldCheck,
  Zap,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  PlusCircle,
  ShoppingBag,
  Layers,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ArtisanCard } from './ArtisanCard.tsx';
import { SocialFeed } from './SocialFeed.tsx';
import { ArtisanDashboardTable } from './ArtisanDashboardTable.tsx';
import { PublierRealisation } from './PublierRealisation.tsx';
import { OfficialChannelsBar } from './OfficialChannelsBar.tsx';

export const HomePage: React.FC = () => {
  const {
    artisans,
    services,
    searchQuery,
    setSearchQuery,
    setSelectedTrade,
    go,
    requestUserLocation,
    userLocation,
    setSelectedArtisanId,
    authModal,
    currentUser,
  } = useApp();

  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState<boolean>(false);

  const getTradeCountLabel = (tradeLabel: string) => {
    const matchingCount = artisans.filter(
      (a) => a.trade && a.trade.toLowerCase().includes(tradeLabel.toLowerCase())
    ).length;
    if (matchingCount > 0) {
      return `${matchingCount} artisan${matchingCount > 1 ? 's' : ''} inscrit${matchingCount > 1 ? 's' : ''}`;
    }
    return 'Des artisans qualifiés près de vous';
  };

  const popularTrades = [
    { label: 'Couturier', emoji: '👗' },
    { label: 'Mécanicien', emoji: '🔧' },
    { label: 'Coiffeur', emoji: '💇🏾' },
    { label: 'Maçon', emoji: '🧱' },
    { label: 'Électricien', emoji: '⚡' },
    { label: 'Menuisier', emoji: '🪚' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    go('search');
  };

  const handleTradeClick = (tradeName: string) => {
    setSelectedTrade(tradeName);
    setSearchQuery('');
    go('search');
  };

  // 4 recommended artisans (from MVP slice 0,4)
  const recommendedArtisans = artisans.slice(0, 4);

  return (
    <div className="space-y-12 pb-16">
      {/* Section Inscription / Connexion en HAUT de la plateforme (affichée uniquement si non connecté) */}
      {!currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 p-6 sm:p-10 text-white shadow-xl shadow-amber-500/15 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 border border-amber-400/40">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/60 text-amber-100 text-xs font-bold uppercase tracking-wider border border-amber-300/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>INSCRIPTION GRATUITE • SANS ABONNEMENT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-white">
                Vous êtes artisan ou client ?
              </h2>
              <p className="text-xs sm:text-sm text-amber-50 leading-relaxed max-w-xl">
                Rejoignez <b>Artisan Pro Afrique 100% gratuitement</b> ! C'est le lancement de la plateforme : profitez d'une visibilité totale, recevez des demandes de devis et discutez en direct avec vos clients via la messagerie et WhatsApp.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-amber-100 pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Inscription 100% Gratuite</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Messagerie en direct & Devis illimités</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Liens WhatsApp, Facebook & TikTok</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={() => go('register')}
                className="px-6 py-3.5 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-[#212121] font-black text-sm shadow-md shadow-[#7AC74F]/30 transition-all text-center hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>S'inscrire gratuitement</span>
                <ArrowRight className="w-4 h-4 text-[#212121]" />
              </button>
              <button
                onClick={() => authModal.open('login')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm shadow-md transition-all text-center hover:scale-[1.02] cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#7AC74F]/10 via-[#FF7A00]/5 to-transparent pt-8 pb-16 sm:pt-14 sm:pb-20 border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge Important en Orange Vif #FF7A00 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-black shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
            <span>N°1 de la mise en relation d'artisans en Afrique</span>
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-950 tracking-tight leading-[1.15]">
              Votre artisan professionnel est à <span className="text-[#FF7A00]">quelques clics</span>.
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Trouvez facilement un artisan selon son métier, sa ville et son pays. Contactez-le directement et demandez un devis.
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl border border-neutral-200 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
              <input
                id="searchInput"
                type="text"
                placeholder="Ex. couturier, mécanicien, coiffeuse, Abidjan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  requestUserLocation();
                  go('map');
                }}
                className="px-3.5 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="Autour de moi"
              >
                <MapPin className="w-4 h-4 text-[#FF7A00]" />
                <span className="hidden md:inline">Près de moi</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-[#212121] font-black text-sm shadow-md shadow-[#7AC74F]/30 transition-all hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                Rechercher
              </button>
            </div>
          </form>

          {/* Quick trust metrics */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs font-semibold text-neutral-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Profils vérifiés & avis réels</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>⚡ Demandez rapidement votre devis</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 border border-neutral-200/90 shadow-2xs text-left">
              <span className="font-bold text-neutral-800 flex items-center gap-1">
                <span>💳</span>
                <span>Paiement sécurisé bientôt disponible</span>
              </span>
              <span className="hidden sm:inline text-neutral-300">•</span>
              <span className="text-[11px] text-neutral-500 font-normal">Wave • Orange Money • MTN Money • Monniz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fil d'actualité Marketplace & Artisans (Publications, Photos, Prix, Ville) */}
      <section className="w-full max-w-7xl mx-auto px-0 md:px-4">
        <div className="mb-6 text-center max-w-xl mx-auto space-y-1.5 px-4 md:px-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <span>🔥 Fil d'actualité Marketplace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950">
            Publications des artisans en direct
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Découvrez leurs réalisations, tarifs et villes. Contactez-les directement en 1 clic.
          </p>
        </div>

        <SocialFeed feedType="accueil" />
      </section>

      {/* Métiers populaires */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Catégories d'expertise</span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900">Métiers populaires</h2>
          </div>
          <button
            onClick={() => go('search')}
            className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Voir tous les métiers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {popularTrades.map((t) => (
            <div
              key={t.label}
              onClick={() => handleTradeClick(t.label)}
              className="bg-white rounded-2xl p-4 border border-neutral-200/80 hover:border-amber-400 hover:shadow-md transition-all text-center group cursor-pointer flex flex-col items-center justify-between"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                {t.emoji}
              </div>
              <h3 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition-colors">
                {t.label}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">{getTradeCountLabel(t.label)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTradeClick(t.label);
                }}
                className="mt-3 w-full py-1.5 rounded-lg bg-neutral-100 group-hover:bg-amber-500 group-hover:text-white text-neutral-700 text-xs font-semibold transition-colors"
              >
                Trouver
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Artisans recommandés */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Les mieux notés</span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900">Artisans recommandés</h2>
          </div>
          <button
            onClick={() => go('search')}
            className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Explorer la liste</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendedArtisans.map((artisan) => (
            <ArtisanCard key={artisan.id} artisan={artisan} />
          ))}
        </div>
      </section>

      {/* 2. Marketplace : Garde seulement le bouton vert "Ouvrir la Marketplace" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 text-center">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsMarketplaceModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#7AC74F] hover:bg-[#6BB343] text-neutral-950 font-black text-sm sm:text-base shadow-md transition-all inline-flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5 text-neutral-950" />
            <span>Ouvrir la Marketplace</span>
          </button>
        </div>

        {/* Modal Marketplace complète (garde tout le code et services intacts) */}
        {isMarketplaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-neutral-900 text-white p-6 sm:p-10 border border-neutral-800 shadow-2xl space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7AC74F]/20 flex items-center justify-center text-[#7AC74F]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7AC74F]">Services à prix fixe</span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Marketplace Artisan Pro</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMarketplaceModalOpen(false);
                      go('market');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-neutral-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Voir la page complète →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMarketplaceModalOpen(false)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
                Commandez des prestations prêtes à l’emploi ou demandez un devis immédiat à nos artisans réputés.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {services.slice(0, 6).map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex flex-col justify-between hover:border-[#7AC74F]/50 transition-all cursor-pointer"
                    onClick={() => {
                      setIsMarketplaceModalOpen(false);
                      setSelectedArtisanId(srv.artisanId);
                      go('profile');
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#7AC74F]/20 text-[#7AC74F] font-semibold">
                          {srv.trade}
                        </span>
                        <span className="text-lg">{srv.emoji}</span>
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{srv.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2">{srv.description}</p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-neutral-700/60 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-neutral-400">À partir de</div>
                        <div className="font-black text-[#FFD60A] text-sm">{srv.price}</div>
                      </div>
                      <span className="text-[11px] text-neutral-400">Par {srv.artisanName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Canaux Officiels & Liens Professionnels (Visible par tous les visiteurs) */}
      <OfficialChannelsBar variant="home" />
    </div>
  );
};
