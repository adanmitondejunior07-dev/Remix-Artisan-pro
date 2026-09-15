import React from 'react';
import { MessageCircle, Facebook, Instagram, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  PERMANENT_OFFICIAL_CHANNELS,
  cleanAndNormalizeLink,
} from '../utils/channelUtils.ts';

interface OfficialChannelsBarProps {
  variant?: 'home' | 'menu' | 'compact' | 'footer';
  className?: string;
}

export const OfficialChannelsBar: React.FC<OfficialChannelsBarProps> = ({
  variant = 'home',
  className = '',
}) => {
  const { officialChannels } = useApp();

  const links = officialChannels || PERMANENT_OFFICIAL_CHANNELS;

  const openLink = (rawUrl?: string) => {
    if (!rawUrl || !rawUrl.trim()) return;
    const cleaned = cleanAndNormalizeLink(rawUrl);
    const finalUrl =
      cleaned.startsWith('http://') || cleaned.startsWith('https://')
        ? cleaned
        : `https://${cleaned}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const hasWhatsapp = Boolean(links.whatsappChannel && links.whatsappChannel.trim() !== '');
  const hasFacebook = Boolean(links.facebookPage && links.facebookPage.trim() !== '');
  const hasInstagram = Boolean(links.instagramTiktok && links.instagramTiktok.trim() !== '');
  const hasWebsite = Boolean(links.website && links.website.trim() !== '');

  // If all 4 links are empty, render nothing
  if (!hasWhatsapp && !hasFacebook && !hasInstagram && !hasWebsite) {
    return null;
  }

  // Variant: Menu (for mobile drawer or dropdown menus)
  if (variant === 'menu') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Canaux Officiels</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {hasWhatsapp && (
            <button
              type="button"
              onClick={() => openLink(links.whatsappChannel)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              title="Rejoindre notre Chaîne WhatsApp"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">Rejoindre Chaîne WhatsApp</span>
            </button>
          )}

          {hasFacebook && (
            <button
              type="button"
              onClick={() => openLink(links.facebookPage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              title="Voir notre Page Facebook"
            >
              <Facebook className="w-4 h-4 shrink-0" />
              <span className="truncate">Voir Page Facebook</span>
            </button>
          )}

          {hasInstagram && (
            <button
              type="button"
              onClick={() => openLink(links.instagramTiktok)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              title="Instagram et TikTok"
            >
              <Instagram className="w-4 h-4 shrink-0" />
              <span className="truncate">Instagram/TikTok</span>
            </button>
          )}

          {hasWebsite && (
            <button
              type="button"
              onClick={() => openLink(links.website)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 border border-neutral-700 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              title="Visiter le Site Web officiel"
            >
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Visiter Site Web</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Variant: Compact (e.g. for dropdown inside navbar)
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {hasWhatsapp && (
          <button
            type="button"
            onClick={() => openLink(links.whatsappChannel)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2.5 shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Rejoindre Chaîne WhatsApp</span>
          </button>
        )}

        {hasFacebook && (
          <button
            type="button"
            onClick={() => openLink(links.facebookPage)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2.5 shadow-xs transition-all cursor-pointer"
          >
            <Facebook className="w-4 h-4 shrink-0" />
            <span className="truncate">Voir Page Facebook</span>
          </button>
        )}

        {hasInstagram && (
          <button
            type="button"
            onClick={() => openLink(links.instagramTiktok)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2.5 shadow-xs transition-all cursor-pointer"
          >
            <Instagram className="w-4 h-4 shrink-0" />
            <span className="truncate">Instagram/TikTok</span>
          </button>
        )}

        {hasWebsite && (
          <button
            type="button"
            onClick={() => openLink(links.website)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2.5 border border-neutral-700 shadow-xs transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Visiter Site Web</span>
          </button>
        )}
      </div>
    );
  }

  // Variant: Home (Garde les 4 boutons seulement, sans la grosse carte noire autour - Ligne de 4 boutons compacts Facebook-style)
  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {hasWhatsapp && (
          <button
            type="button"
            onClick={() => openLink(links.whatsappChannel)}
            className="px-4 py-2 rounded-xl bg-[#7AC74F] hover:bg-[#6BB343] text-neutral-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Rejoindre notre Chaîne WhatsApp officielle"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0 text-neutral-950" />
            <span>Chaîne WhatsApp</span>
          </button>
        )}

        {hasFacebook && (
          <button
            type="button"
            onClick={() => openLink(links.facebookPage)}
            className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Suivre notre Page Facebook officielle"
          >
            <Facebook className="w-3.5 h-3.5 shrink-0" />
            <span>Page Facebook</span>
          </button>
        )}

        {hasInstagram && (
          <button
            type="button"
            onClick={() => openLink(links.instagramTiktok)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] via-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Suivre notre compte Instagram et TikTok"
          >
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span>Instagram / TikTok</span>
          </button>
        )}

        {hasWebsite && (
          <button
            type="button"
            onClick={() => openLink(links.website)}
            className="px-4 py-2 rounded-xl bg-[#FFD60A] hover:bg-[#F0C800] text-neutral-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Visiter notre Site Web officiel"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
            <span>Site Web</span>
          </button>
        )}
      </div>
    </section>
  );
};
