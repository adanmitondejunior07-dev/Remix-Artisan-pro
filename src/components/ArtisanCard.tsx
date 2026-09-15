import React from 'react';
import {
  Star,
  ShieldCheck,
  MapPin,
  MessageSquare,
  FileText,
  Sparkles,
  MessageCircle,
  Facebook,
  Video,
  Bell,
  Check,
} from 'lucide-react';
import type { Artisan } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatWhatsAppUrl } from '../utils/socialLinks.ts';

interface ArtisanCardProps {
  artisan: Artisan;
}

export const ArtisanCard: React.FC<ArtisanCardProps> = ({ artisan }) => {
  const {
    setSelectedArtisanId,
    go,
    calculateDistance,
    quoteModal,
    startChatWithArtisan,
    followingArtisans,
    toggleFollowArtisan,
  } = useApp();

  const distance = calculateDistance(artisan.lat, artisan.lng);
  const isSubscribed = followingArtisans.includes(artisan.id);

  const getPlanBadge = (art: Artisan) => {
    const isAbonnementActif = art.abonnement_actif || art.subscription_status === 'active';
    if (isAbonnementActif) {
      const planName = (art.abonnement || art.subscription_plan || 'PRO').toUpperCase();
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-xs">
          <Sparkles className="w-3 h-3 text-yellow-200 fill-current" />
          <span>{planName}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200 shadow-2xs">
        Artisan
      </span>
    );
  };

  const handleOpenProfile = () => {
    setSelectedArtisanId(artisan.id);
    go('profile');
  };

  return (
    <div
      className="artisan-card bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:border-[#7AC74F] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
    >

      <div className="p-5 space-y-4">
        {/* Header: Avatar, Name, Plan */}
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-3xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
            {artisan.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3
                onClick={handleOpenProfile}
                className="font-bold text-base text-neutral-900 truncate hover:text-[#FF7A00] cursor-pointer transition-colors"
              >
                {artisan.name}
              </h3>
              {getPlanBadge(artisan)}
            </div>

            <p className="text-xs text-neutral-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="font-bold text-neutral-800">{artisan.trade}</span>
              <span>·</span>
              <span className="truncate">{artisan.city}</span>
            </p>

            {/* Distance / Verified */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {artisan.verified && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-[#FF7A00] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />
                  Vérifié
                </span>
              )}
              {distance !== null && (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-500 font-medium">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  À {distance} km
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating & Rate */}
        <div className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-900 font-bold flex items-center">
              <Star className="w-3.5 h-3.5 fill-[#FFD60A] text-[#FFD60A] mr-1" />
              {artisan.rating}
            </span>
            <span className="text-neutral-400">/ 5</span>
            <span className="text-neutral-400">({artisan.reviewsCount} avis)</span>
          </div>
          <span className="font-semibold text-neutral-700">{artisan.hourlyRate}</span>
        </div>

        {/* Services Chips */}
        <div>
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Services proposés
          </div>
          <div className="flex flex-wrap gap-1.5">
            {artisan.services.slice(0, 3).map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs bg-neutral-100/80 text-neutral-700 font-medium"
              >
                {s}
              </span>
            ))}
            {artisan.services.length > 3 && (
              <span className="px-2 py-1 rounded-lg text-xs bg-neutral-100 text-neutral-500">
                +{artisan.services.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Social channels available */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100/80 text-[11px] text-neutral-500">
          <span className="font-semibold text-neutral-400">Canaux directs :</span>
          <div className="flex items-center gap-1.5">
            {(artisan.whatsapp || artisan.phone) && (
              <a
                href={formatWhatsAppUrl(artisan.whatsapp || artisan.phone) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Échanger sur WhatsApp"
                className="w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
            {artisan.facebook && (
              <span
                title="Page Facebook active"
                className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200"
              >
                <Facebook className="w-3.5 h-3.5" />
              </span>
            )}
            {artisan.tiktok && (
              <span
                title="Vidéos TikTok disponibles"
                className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center border border-neutral-300"
              >
                <Video className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 border-t border-neutral-100 mt-2 space-y-2">
        <div className="flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFollowArtisan(artisan.id);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isSubscribed
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-neutral-950 text-white hover:bg-neutral-800 shadow-2xs'
            }`}
          >
            {isSubscribed ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Abonné ✓</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>S'abonner</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startChatWithArtisan(artisan.id);
            }}
            className="px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            title="Contacter l'artisan"
          >
            <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
            <span>Message</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleOpenProfile}
          className="w-full py-2.5 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-[#212121] text-xs font-black shadow-sm transition-all text-center cursor-pointer"
        >
          Voir le profil
        </button>
      </div>
    </div>
  );
};
