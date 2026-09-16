import React, { useState, useMemo } from 'react';
import { Search, MapPin, Filter, X, Sparkles, SlidersHorizontal, ShieldCheck, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ArtisanCard } from './ArtisanCard.tsx';
import { AFRICAN_COUNTRIES } from '../data/africanCountries.ts';

export const SearchPage: React.FC = () => {
  const {
    artisans,
    searchQuery,
    setSearchQuery,
    selectedTrade,
    setSelectedTrade,
    selectedCity,
    setSelectedCity,
    calculateDistance,
    userLocation,
    requestUserLocation,
    go,
    t,
  } = useApp();

  const [selectedCountry, setSelectedCountry] = useState<string>('Tous les pays');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);

  const trades = [
    'Tous les métiers',
    'Couturière',
    'Électricien',
    'Mécanicien',
    'Coiffeuse',
    'Maçon',
    'Menuisier',
    'Plombier',
    'Peintre',
    'Soudeur',
  ];

  // Dynamic available countries from registered artisans + all 54 African countries
  const availableCountries = useMemo(() => {
    const fromArtisans = Array.from(new Set(artisans.map((a) => a.country).filter(Boolean)));
    const all = ['Tous les pays', ...fromArtisans];
    AFRICAN_COUNTRIES.forEach((c) => {
      if (!all.includes(c.name)) all.push(c.name);
    });
    return all;
  }, [artisans]);

  // Dynamic cities based on selected country
  const availableCities = useMemo(() => {
    const list = ['Toutes les villes'];
    const matchingArtisans = selectedCountry === 'Tous les pays'
      ? artisans
      : artisans.filter((a) => a.country.toLowerCase() === selectedCountry.toLowerCase());

    matchingArtisans.forEach((a) => {
      if (a.city && !list.includes(a.city)) list.push(a.city);
    });

    if (selectedCountry !== 'Tous les pays') {
      const countryObj = AFRICAN_COUNTRIES.find((c) => c.name.toLowerCase() === selectedCountry.toLowerCase());
      if (countryObj) {
        countryObj.popularCities.forEach((city) => {
          if (!list.includes(city)) list.push(city);
        });
      }
    }
    return list;
  }, [artisans, selectedCountry]);

  const filteredArtisans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return artisans
      .filter((a) => {
        // Text match
        if (q) {
          const haystack = `${a.name} ${a.trade} ${a.city} ${a.country} ${a.services.join(' ')} ${a.description}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        // Country match
        if (selectedCountry && selectedCountry !== 'Tous les pays') {
          if (a.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
        }

        // Trade match
        if (selectedTrade && selectedTrade !== 'Tous' && selectedTrade !== 'Tous les métiers') {
          if (!a.trade.toLowerCase().includes(selectedTrade.toLowerCase())) return false;
        }

        // City match
        if (selectedCity && selectedCity !== 'Toutes les villes') {
          if (!a.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
        }

        // Verified filter
        if (verifiedOnly && !a.verified) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortByDistance && userLocation) {
          const distA = calculateDistance(a.lat, a.lng) ?? 9999;
          const distB = calculateDistance(b.lat, b.lng) ?? 9999;
          return distA - distB;
        }

        // Artisans PRO avec abonnement_actif = true en premier
        const aActive = (a.abonnement_actif || a.subscription_status === 'active') ? 1 : 0;
        const bActive = (b.abonnement_actif || b.subscription_status === 'active') ? 1 : 0;
        if (bActive !== aActive) {
          return bActive - aActive;
        }

        return b.rating - a.rating;
      });
  }, [
    artisans,
    searchQuery,
    selectedCountry,
    selectedTrade,
    selectedCity,
    verifiedOnly,
    sortByDistance,
    userLocation,
    calculateDistance,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('Tous les pays');
    setSelectedTrade('Tous les métiers');
    setSelectedCity('Toutes les villes');
    setVerifiedOnly(false);
    setSortByDistance(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF7A00]">
          <Search className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>Annuaire Professionnel</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950">Trouver un artisan</h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Filtrez par métier, localisation ou disponibilité pour contacter immédiatement l'artisan qui répond à votre besoin.
        </p>
      </div>

      {/* Main Search & Filters Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Search input row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-3" />
            <input
              id="searchInput"
              type="text"
              placeholder={t.Recherche || "Rechercher un artisan..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick GPS distance trigger */}
          <button
            onClick={() => {
              if (!userLocation) {
                requestUserLocation();
              }
              setSortByDistance(!sortByDistance);
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              sortByDistance
                ? 'bg-[#7AC74F] text-[#212121] border-[#7AC74F] shadow-sm'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#FF7A00]" />
            <span>{sortByDistance ? 'Trié par distance' : 'Trier par proximité'}</span>
          </button>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
          {/* Country Selector (Pan-African) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-amber-600" /> Pays :
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity('Toutes les villes');
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium focus:outline-none focus:border-amber-500 bg-white max-w-[170px]"
            >
              {availableCountries.map((c) => {
                const countryObj = AFRICAN_COUNTRIES.find((item) => item.name === c);
                return (
                  <option key={c} value={c}>
                    {countryObj ? `${countryObj.flag} ${c}` : c}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Trade Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Métier :</span>
            <select
              value={selectedTrade || 'Tous les métiers'}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium focus:outline-none focus:border-amber-500 bg-white"
            >
              {trades.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Ville :</span>
            <select
              value={selectedCity || 'Toutes les villes'}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium focus:outline-none focus:border-amber-500 bg-white max-w-[160px]"
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Verified toggle */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vérifiés uniquement</span>
          </label>

          {(searchQuery || selectedCountry !== 'Tous les pays' || (selectedTrade && selectedTrade !== 'Tous les métiers') || (selectedCity && selectedCity !== 'Toutes les villes') || verifiedOnly) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          <span className="font-bold text-neutral-900">{filteredArtisans.length}</span> artisan{filteredArtisans.length > 1 ? 's' : ''} disponible{filteredArtisans.length > 1 ? 's' : ''}
        </p>

        <button
          onClick={() => go('map')}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Afficher sur la carte</span>
        </button>
      </div>

      {/* Results Grid (#results) */}
      <div id="results" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArtisans.length > 0 ? (
          filteredArtisans.map((artisan) => (
            <ArtisanCard key={artisan.id} artisan={artisan} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center space-y-4 bg-white rounded-2xl border border-neutral-200 p-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              🔎
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Aucun artisan trouvé</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Aucun artisan ne correspond à vos critères de recherche. Essayez d'élargir la ville ou de réinitialiser vos filtres.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
