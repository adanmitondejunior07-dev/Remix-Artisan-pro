import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Tag,
  Clock,
  MapPin,
  FileText,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Globe,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Camera,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { AFRICAN_PAYMENT_COUNTRIES } from '../data/africanPaymentMethods.ts';
import { SocialFeed } from './SocialFeed.tsx';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';

export const MarketplacePage: React.FC = () => {
  const {
    services,
    artisans,
    setSelectedArtisanId,
    go,
    quoteModal,
    paymentModal,
    supportModal,
    currentUser,
    currentArtisan,
    refreshData,
    showToast,
    isSubscriptionExpired,
  } = useApp();

  const [activeMarketTab, setActiveMarketTab] = useState<'feed' | 'catalog'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Toutes');
  const [showCountriesList, setShowCountriesList] = useState<boolean>(false);

  // New service modal for artisans
  const [isAddingService, setIsAddingService] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Couture');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState('2-3 jours');

  // Modal spécifique "Publier un article - Marketplace"
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [mpTitre, setMpTitre] = useState('');
  const [mpPrix, setMpPrix] = useState('');
  const [mpPhoto, setMpPhoto] = useState('');
  const [mpDesc, setMpDesc] = useState('');
  const [mpPublishing, setMpPublishing] = useState(false);

  // Upload direct de photo sans copier de lien
  const mpFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleMpPhotoDirectSelect = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: 'Fichier trop lourd', desc: 'Max 10 Mo.', type: 'warning' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        setMpPhoto(reader.result);
        showToast({ title: 'Photo chargée !', desc: 'Votre photo est prête à être publiée directement.', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Permet d'ouvrir le modal depuis les menus (Sidebar, Drawer, boutons globaux)
  useEffect(() => {
    (window as any).openMarketModal = () => {
      setIsMarketModalOpen(true);
    };

    if (sessionStorage.getItem('open_market_modal') === '1') {
      sessionStorage.removeItem('open_market_modal');
      setIsMarketModalOpen(true);
    }

    return () => {
      delete (window as any).openMarketModal;
    };
  }, []);

  const categories = ['Tous', 'Couture', 'Électricité', 'Mécanique', 'Coiffure', 'Maçonnerie', 'Menuiserie'];
  const cities = ['Toutes', 'Abidjan', 'Bouaké', 'Yamoussoukro', 'Dakar'];

  const filteredServices = useMemo(() => {
    const list = services.filter((s) => {
      if (selectedCategory !== 'Tous' && s.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedCity !== 'Toutes' && !s.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      if (marketSearch.trim()) {
        const q = marketSearch.toLowerCase();
        const haystack = `${s.title} ${s.description} ${s.artisanName} ${s.trade} ${s.city}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Prioritize services from artisans with abonnement_actif = true
    return list.sort((a, b) => {
      const artA = artisans.find((art) => art.id === a.artisanId);
      const artB = artisans.find((art) => art.id === b.artisanId);
      const aActive = (artA?.abonnement_actif || artA?.subscription_status === 'active') ? 1 : 0;
      const bActive = (artB?.abonnement_actif || artB?.subscription_status === 'active') ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return (artB?.rating || 0) - (artA?.rating || 0);
    });
  }, [services, artisans, selectedCategory, selectedCity, marketSearch]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArtisan) return;

    try {
      await api.createService({
        artisanId: currentArtisan.id,
        artisanName: currentArtisan.name,
        trade: currentArtisan.trade,
        title: newTitle,
        price: newPrice.includes('FCFA') ? newPrice : `${newPrice} FCFA`,
        priceValue: parseInt(newPrice.replace(/\D/g, ''), 10) || 15000,
        city: currentArtisan.city,
        country: currentArtisan.country,
        description: newDesc,
        category: newCategory,
        duration: newDuration,
        emoji: currentArtisan.emoji,
      });

      await refreshData();
      setIsAddingService(false);
      setNewTitle('');
      setNewPrice('');
      setNewDesc('');
      showToast({ title: 'Service publié avec succès !', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message, type: 'warning' });
    }
  };

  const doPublishMarket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!mpTitre.trim()) {
      showToast({ title: 'Champ requis', desc: 'Veuillez saisir un titre.', type: 'warning' });
      return;
    }
    if (!mpPrix.trim()) {
      showToast({ title: 'Champ requis', desc: 'Veuillez renseigner un prix.', type: 'warning' });
      return;
    }
    if (!mpPhoto) {
      showToast({
        title: 'Photo obligatoire',
        desc: 'Veuillez ajouter une photo de votre article avant de publier sur la Marketplace.',
        type: 'warning',
      });
      return;
    }

    setMpPublishing(true);
    try {
      const priceNum = parseInt(mpPrix.replace(/\D/g, ''), 10) || 0;
      const formattedPrice = mpPrix.includes('FCFA') ? mpPrix : `${mpPrix} FCFA`;

      // 1. Sauvegarder dans le backend central
      await api.createService({
        artisanId: currentArtisan ? currentArtisan.id : 1,
        artisanName: currentArtisan ? currentArtisan.name : (currentUser?.name || 'Artisan'),
        trade: currentArtisan ? currentArtisan.trade : 'Artisanat',
        title: mpTitre,
        price: formattedPrice,
        priceValue: priceNum,
        city: currentArtisan ? currentArtisan.city : 'Abidjan',
        country: currentArtisan ? currentArtisan.country : "Côte d'Ivoire",
        description: mpDesc,
        category: 'Tous',
        duration: 'Sur devis',
        emoji: '🛍️',
      });

      // 2. Publier aussi dans le fil social public (comme Facebook, visible par tous les utilisateurs avec option commander)
      try {
        const publicMarketPostId = `mp-${Date.now()}`;
        const authorName = currentArtisan ? currentArtisan.name : (currentUser?.name || 'Artisan Pro');
        const authorTrade = currentArtisan ? currentArtisan.trade : 'Artisanat & Vente';

        const publicSocialPost = {
          id: publicMarketPostId,
          userId: currentUser?.id || 'artisan_local',
          author: authorName,
          role: 'ARTISAN',
          artisanId: currentArtisan ? currentArtisan.id : 1,
          artisanName: authorName,
          artisanTrade: authorTrade,
          artisanEmoji: '🛍️',
          verified: true,
          city: currentArtisan ? currentArtisan.city : 'Abidjan',
          country: currentArtisan ? currentArtisan.country : "Côte d’Ivoire",
          content: `🛒 NOUVEL ARTICLE MARKETPLACE : ${mpTitre}\n💰 Tarif : ${formattedPrice}\n${mpDesc ? `\n📝 Description : ${mpDesc}` : ''}\n\n👉 Contactez ou commandez directement !`,
          mediaType: mpPhoto ? ('photo' as const) : undefined,
          mediaUrl: mpPhoto || undefined,
          price: formattedPrice,
          likesCount: 1,
          likedBy: [],
          viewsCount: 1,
          comments: [],
          sharesCount: 0,
          createdAt: new Date().toISOString(),
        };

        // Sauvegarder dans artisanPosts et allPosts pour affichage public instantané
        let storedPosts: any[] = [];
        try {
          storedPosts = JSON.parse(localStorage.getItem('artisanPosts') || '[]');
        } catch {
          storedPosts = [];
        }
        storedPosts.unshift(publicSocialPost);
        localStorage.setItem('artisanPosts', JSON.stringify(storedPosts));

        let storedAllPosts: any[] = [];
        try {
          storedAllPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
        } catch {
          storedAllPosts = [];
        }
        storedAllPosts.unshift(publicSocialPost);
        localStorage.setItem('allPosts', JSON.stringify(storedAllPosts.slice(0, 40)));

        // Notifier le flux d'actualité pour mise à jour sans rechargement
        window.dispatchEvent(new CustomEvent('artisanPostsUpdated', { detail: publicSocialPost }));
      } catch (postSyncErr) {
        console.warn('Erreur synchronisation fil public marketplace:', postSyncErr);
      }

      // 3. Si Supabase est configuré, persister aussi dans la table marketplace
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('marketplace').insert([
            {
              titre: mpTitre,
              prix: priceNum,
              photo: mpPhoto || null,
              description: mpDesc,
              artisan_nom: currentArtisan ? currentArtisan.name : (currentUser?.name || 'Artisan'),
              user_id: currentUser?.id || null,
            },
          ]);
        } catch (supaErr) {
          console.warn('Supabase marketplace sync optional:', supaErr);
        }
      }

      await refreshData();
      setIsMarketModalOpen(false);
      setMpTitre('');
      setMpPrix('');
      setMpPhoto('');
      setMpDesc('');
      showToast({ title: 'Article publié !', desc: 'Votre article a été publié sur la Marketplace.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Erreur', desc: err.message || 'Impossible de publier l’article.', type: 'warning' });
    } finally {
      setMpPublishing(false);
    }
  };

  // Exposer les fonctions globales pour la compatibilité HTML inline si nécessaire
  React.useEffect(() => {
    (window as any).openMarketModal = () => setIsMarketModalOpen(true);
    (window as any).closeMarketModal = () => setIsMarketModalOpen(false);
    (window as any).doPublishMarket = doPublishMarket;

    return () => {
      delete (window as any).openMarketModal;
      delete (window as any).closeMarketModal;
      delete (window as any).doPublishMarket;
    };
  }, [mpTitre, mpPrix, mpPhoto, mpDesc, currentArtisan, currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header (Preserving MVP text) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Catalogue de prestations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-950">🛒 Marketplace</h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl">
            Services proposés par les artisans qualifiés avec tarifs transparents et devis direct.
          </p>
        </div>

        {currentUser?.role === 'artisan' && (
          <button
            type="button"
            id="btn-market-publish-service"
            onClick={() => {
              if (isSubscriptionExpired) {
                showToast({
                  title: 'Abonnement expiré',
                  desc: 'Votre formule a expiré. Veuillez renouveler votre abonnement pour publier des services.',
                  type: 'warning',
                });
                go('abonnements');
                return;
              }
              setIsAddingService(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publier un service</span>
          </button>
        )}
      </div>

      {/* BANDEAU SI ABONNEMENT EXPIRÉ POUR L'ARTISAN */}
      {currentUser?.role === 'artisan' && isSubscriptionExpired && (
        <div
          id="marketplace-artisan-expired-banner"
          className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border-2 border-red-600/70 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Votre abonnement a expiré
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white uppercase font-bold">
                  Suspendu
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                La publication de nouveaux services est suspendue. Renouvelez votre formule pour reprendre vos activités.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-market-renew-sub"
            onClick={() => go('abonnements')}
            className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RENOUVELER MON ABONNEMENT</span>
          </button>
        </div>
      )}

      {/* PAN-AFRICAN PAYMENT SHOWCASE BANNER (20 PAYS AFRICAINS) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950 text-white border border-amber-500/20 shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xl shrink-0">
              🌍
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  Moyen de paiement pour toute l'Afrique disponible sur Marketplace
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  20 Pays Acceptés · 100% Sécurisé
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-2xl leading-relaxed">
                Réglez vos prestations en toute confiance avec les opérateurs locaux : <strong>Bénin</strong> (MTN MoMo, Moov, Celtiis), <strong>Côte d'Ivoire</strong> (Wave, Orange, MTN, Moov), <strong>Sénégal</strong> (Wave, Orange, Free), <strong>Burkina Faso</strong>, <strong>Togo</strong> (T-Money), <strong>Ghana</strong> (MTN, Telecel), <strong>Cameroun</strong>, <strong>Mali</strong>, <strong>Guinée</strong>... et Cartes Visa/Mastercard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCountriesList(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Consulter les 20 pays</span>
            </button>
            <button
              onClick={() => supportModal.open('Paiement Marketplace 20 pays')}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>Support Paiement</span>
            </button>
          </div>
        </div>

        {/* Quick flags ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-neutral-300 scrollbar-none border-t border-white/10 pt-2.5">
          <span className="font-semibold text-neutral-400 text-[11px] whitespace-nowrap">Pays actifs :</span>
          {AFRICAN_PAYMENT_COUNTRIES.map((c) => (
            <span
              key={c.code}
              title={`${c.name} (${c.currency})`}
              className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium whitespace-nowrap hover:bg-white/15 cursor-pointer transition-colors"
              onClick={() => setShowCountriesList(true)}
            >
              {c.flag} {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* BOUTON PUBLIER MARKETPLACE */}
      <div id="marketPublishBar" style={{ width: '92%', maxWidth: '720px', margin: '12px auto', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role === 'artisan' && isSubscriptionExpired) {
              showToast({
                title: 'Abonnement expiré',
                desc: 'Votre formule a expiré. Veuillez renouveler votre abonnement pour publier des articles.',
                type: 'warning',
              });
              go('abonnements');
              return;
            }
            setIsMarketModalOpen(true);
          }}
          style={{
            flex: 1,
            background: '#FF6B00',
            color: 'white',
            padding: '14px',
            border: 'none',
            borderRadius: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '15px',
            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>➕</span>
          <span>Publier un article - Marketplace</span>
        </button>
      </div>

      {/* Switch: Fil d'actualité vs Catalogue des prestations */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveMarketTab('feed')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMarketTab === 'feed'
              ? 'bg-[#FF6B00] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span>🔥</span>
          <span>Fil d'actualité Artisans</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMarketTab('catalog')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMarketTab === 'catalog'
              ? 'bg-neutral-950 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span>📋</span>
          <span>Catalogue Prestations</span>
        </button>
      </div>

      {activeMarketTab === 'feed' ? (
        <div id="marketplace-feed-container">
          <SocialFeed />
        </div>
      ) : (
        <>
          {/* Categories & Filter Bar */}
          <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & City Filter */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher une prestation, un mot-clé..."
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-neutral-500 font-medium">Ville :</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-amber-500 bg-white"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((srv) => {
            const artisan = artisans.find((a) => a.id === srv.artisanId);
            return (
              <div
                key={srv.id}
                className="marketplace-card bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                      {srv.trade}
                    </span>
                    <span className="text-xl">{srv.emoji}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-neutral-900 leading-snug">{srv.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{srv.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {srv.duration}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {srv.city}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-semibold">Tarif indicatif</div>
                      <div className="text-lg font-black text-amber-600">{srv.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-400">Artisan</div>
                      <div className="text-xs font-bold text-neutral-800">{srv.artisanName}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        paymentModal.open({
                          service: srv,
                          customTitle: srv.title,
                          customAmount: srv.priceValue,
                        });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Commander & Payer (20 pays)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (artisan) {
                            quoteModal.open(artisan, srv.title);
                          }
                        }}
                        className="px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Devis gratuit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArtisanId(srv.artisanId);
                          go('profile');
                        }}
                        className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors text-center"
                      >
                        Voir profil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-2xl border border-neutral-200">
            <div className="text-3xl">🛒</div>
            <h3 className="font-bold text-base text-neutral-900">Aucun service trouvé</h3>
            <p className="text-xs text-neutral-500">Modifiez la catégorie ou la ville sélectionnée.</p>
          </div>
        )}
      </div>
    </>
  )}

      {/* Add service modal for artisan */}
      {isAddingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-neutral-200">
            <h3 className="font-bold text-base text-neutral-900">Ajouter une prestation au Marketplace</h3>
            <form onSubmit={handleAddService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Titre de la prestation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réfection complète de siège en cuir"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Prix (FCFA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="25 000 FCFA"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Délai estimé</label>
                  <input
                    type="text"
                    placeholder="2-3 jours"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white"
                >
                  <option value="Couture">Couture</option>
                  <option value="Électricité">Électricité</option>
                  <option value="Mécanique">Mécanique</option>
                  <option value="Coiffure">Coiffure</option>
                  <option value="Maçonnerie">Maçonnerie</option>
                  <option value="Menuiserie">Menuiserie</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Détails des fournitures incluses, garanties..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingService(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 20 African Countries and Operators Information Modal */}
      {showCountriesList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-neutral-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Moyens de Paiement Disponibles dans 20 Pays Africains
                  </h3>
                  <p className="text-xs text-neutral-300">
                    Artisan Pro Afrique supporte les devises et opérateurs Mobile Money locaux.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCountriesList(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AFRICAN_PAYMENT_COUNTRIES.map((country) => (
                  <div
                    key={country.code}
                    className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{country.flag}</span>
                        <span className="font-bold text-xs text-neutral-900">{country.name}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {country.currency}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-neutral-200/60">
                      {country.operators.map((op) => (
                        <div key={op.id} className="text-[11px] text-neutral-700 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span>{op.icon}</span>
                            <span>{op.name}</span>
                          </span>
                          {op.ussdCode && (
                            <span className="text-[10px] font-mono text-neutral-400">{op.ussdCode}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* International cards badge */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Cartes Bancaires Internationales & UEMOA :</span>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Visa, Mastercard et Cartes GIM-UEMOA valables et protégées par séquestre bancaire dans les 20 pays.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCountriesList(false);
                    supportModal.open('Question sur les moyens de paiement 20 pays');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shrink-0 text-[11px]"
                >
                  Contacter Support
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-100 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setShowCountriesList(false)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLIER SUR MARKETPLACE */}
      <div
        id="marketModal"
        style={{
          display: isMarketModalOpen ? 'flex' : 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsMarketModalOpen(false);
        }}
      >
        <div style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
            <div>
              <b style={{ fontSize: '18px', color: '#111' }}>Vendre un article 🏷️</b>
              <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>Mettre en vente sur la Marketplace</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMarketModalOpen(false)}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={doPublishMarket} style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
              Nom de l'article <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="mp_titre"
              value={mpTitre}
              onChange={(e) => setMpTitre(e.target.value)}
              placeholder="Ex: Robe Bazin brodée, Fauteuil en rotin..."
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '10px', marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px' }}
            />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
              Prix de vente en FCFA <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="mp_prix"
              type="number"
              value={mpPrix}
              onChange={(e) => setMpPrix(e.target.value)}
              placeholder="Ex: 25000"
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '10px', marginBottom: '10px', boxSizing: 'border-box', fontSize: '14px' }}
            />

            {/* SELECTION DIRECTE DE PHOTO (OBLIGATOIRE) */}
            <div style={{ margin: '8px 0 12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Photo de l'article <span style={{ color: '#ef4444' }}>*</span>
                </span>
                <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>
                  Obligatoire
                </span>
              </div>

              <div style={{ padding: '12px', border: mpPhoto ? '2px solid #22c55e' : '2px dashed #cbd5e1', borderRadius: '12px', background: '#F8FAFC' }}>
                <input
                  ref={mpFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleMpPhotoDirectSelect(e.target.files[0]);
                    }
                  }}
                />
                {mpPhoto ? (
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <img
                      src={mpPhoto}
                      alt="Aperçu article"
                      style={{ maxHeight: '160px', maxWidth: '100%', margin: '0 auto', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => mpFileInputRef.current?.click()}
                        style={{ padding: '5px 12px', fontSize: '12px', background: '#E2E8F0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        📷 Remplacer la photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMpPhoto('')}
                        style={{ padding: '5px 12px', fontSize: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✕ Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => mpFileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: '#334155',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <Camera className="w-6 h-6 text-[#FF6B00]" />
                    <span style={{ fontWeight: 700 }}>Prendre ou choisir une photo</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Format JPEG, PNG, WebP (obligatoire)</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="mp_desc"
              value={mpDesc}
              onChange={(e) => setMpDesc(e.target.value)}
              placeholder="Description détaillée de l'article ou de la prestation"
              rows={3}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', margin: '8px 0', boxSizing: 'border-box', resize: 'vertical' }}
            />

            <button
              type="submit"
              disabled={mpPublishing}
              style={{
                width: '100%',
                background: '#FF6B00',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                marginTop: '10px',
                cursor: mpPublishing ? 'not-allowed' : 'pointer',
                opacity: mpPublishing ? 0.7 : 1,
              }}
            >
              {mpPublishing ? 'Publication en cours...' : 'Publier maintenant'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
