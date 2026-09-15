import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Star, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { Artisan } from '../types.ts';
import L from 'leaflet';

export const MapPage: React.FC = () => {
  const {
    artisans,
    userLocation,
    locationError,
    isLocating,
    requestUserLocation,
    calculateDistance,
    setSelectedArtisanId,
    go,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [activeArtisan, setActiveArtisan] = useState<Artisan | null>(null);
  const [maxRadius, setMaxRadius] = useState<number>(100); // km

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around Abidjan
      const centerLat = userLocation?.lat ?? 5.3484;
      const centerLng = userLocation?.lng ?? -4.0180;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add User location pin if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">📍</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Votre position</b><br>Rayon de recherche actif`);
      markersRef.current.push(userMarker);
    }

    // Add Artisan pins
    artisans.forEach((artisan) => {
      const isPremium = artisan.plan === 'Premium';
      const bgColor = isPremium ? '#FF7A00' : '#212121';

      const artisanIcon = L.divIcon({
        className: 'custom-artisan-marker',
        html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 12px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer;">
          ${artisan.emoji}
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([artisan.lat, artisan.lng], { icon: artisanIcon })
        .addTo(map)
        .on('click', () => {
          setActiveArtisan(artisan);
        });

      markersRef.current.push(marker);
    });

    // Center map around user or first artisan
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 11);
    }

    return () => {
      // Keep map alive across standard re-renders
    };
  }, [userLocation, artisans]);

  // Nearby sorted artisans
  const nearbyArtisans = artisans
    .map((a) => ({
      ...a,
      dist: calculateDistance(a.lat, a.lng) ?? 9999,
    }))
    .sort((a, b) => a.dist - b.dist);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header (Preserving MVP prompt text) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF7A00]">
          <Navigation className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>Géolocalisation en temps réel</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950">
          🗺️ Artisans autour de vous
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
          La géolocalisation du navigateur est utilisée uniquement lorsque vous l’autorisez.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={requestUserLocation}
            disabled={isLocating}
            className="px-5 py-2.5 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-[#212121] font-black text-xs shadow-md shadow-[#7AC74F]/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#212121]" />
            <span>{isLocating ? 'Détection GPS en cours...' : '📍 Utiliser ma position'}</span>
          </button>

          {userLocation && (
            <button
              onClick={() => {
                if (mapInstanceRef.current && userLocation) {
                  mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Centrer sur moi</span>
            </button>
          )}
        </div>
      </div>

      {/* #location container as requested in prompt */}
      <div id="location">
        {userLocation ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                <b>Position détectée :</b> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} (Abidjan & région)
              </span>
            </div>
            <span className="font-semibold text-[11px] text-emerald-700">GPS Actif</span>
          </div>
        ) : locationError ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
            <span>⚠️</span>
            <span>{locationError}</span>
          </div>
        ) : (
          <div className="p-3.5 bg-neutral-100 rounded-xl text-xs text-neutral-500 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-400" />
            <span>Cliquez sur « Utiliser ma position » pour calculer la distance exacte de chaque artisan.</span>
          </div>
        )}
      </div>

      {/* Map Layout: Interactive Map + Side list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden relative flex flex-col h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Active Artisan Overlay if selected */}
          {activeArtisan && (
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl shrink-0">
                  {activeArtisan.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-neutral-900 truncate">{activeArtisan.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00] border border-[#FF7A00]/30 font-black uppercase">
                      {activeArtisan.plan}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 truncate">
                    {activeArtisan.trade} · {activeArtisan.city}
                  </p>
                  <div className="text-[11px] text-neutral-900 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#FFD60A] text-[#FFD60A]" />
                    <span>{activeArtisan.rating}/5</span>
                    <span className="text-neutral-400">· {activeArtisan.hourlyRate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedArtisanId(activeArtisan.id);
                    go('profile');
                  }}
                  className="px-4 py-2 bg-[#7AC74F] hover:bg-[#6BB343] text-[#212121] rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Profil</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Artisans List */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs flex flex-col h-[520px]">
          <div className="border-b border-neutral-100 pb-3 mb-3">
            <h3 className="font-bold text-sm text-neutral-900">Artisans les plus proches</h3>
            <p className="text-xs text-neutral-500">Classés par distance kilométrique calculée</p>
          </div>

          <div className="overflow-y-auto divide-y divide-neutral-100 flex-1 pr-1 space-y-1">
            {nearbyArtisans.map((artisan) => (
              <div
                key={artisan.id}
                onClick={() => {
                  setActiveArtisan(artisan);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([artisan.lat, artisan.lng], 14, { animate: true });
                  }
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs hover:bg-neutral-50 ${
                  activeArtisan?.id === artisan.id ? 'bg-amber-50/70 border border-amber-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-xl shrink-0">
                    {artisan.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900">{artisan.name}</span>
                      {artisan.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <div className="text-neutral-500">{artisan.trade} · {artisan.city}</div>
                    <div className="text-[11px] text-amber-600 font-semibold">⭐ {artisan.rating}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-neutral-700 text-xs">
                    {artisan.dist < 999 ? `${artisan.dist} km` : '—'}
                  </span>
                  <div className="text-[10px] text-neutral-400">de vous</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
