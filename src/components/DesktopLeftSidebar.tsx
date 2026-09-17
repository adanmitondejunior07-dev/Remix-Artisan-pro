import React from 'react';
import { User } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useLang } from '../LangContext.tsx';
import { paysAfricains } from '../data/langues.ts';

export const DesktopLeftSidebar: React.FC = () => {
  const { page, go, currentUser, paysSelectionne, changerLangue } = useApp();
  const { t, lang, changeLang } = useLang();

  const currentPaysObj =
    paysAfricains.find((p) => p.nom.toLowerCase().includes((paysSelectionne || '').toLowerCase())) ||
    paysAfricains[0];

  return (
    <aside className="w-64 bg-white p-4 border-r border-neutral-200 hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-66px)] sticky top-[66px]">
      <div>
        <h2 className="font-bold text-xl mb-6 text-neutral-900 tracking-tight">ArtisanPro</h2>
        <nav className="space-y-1">
          <div
            onClick={() => go('home')}
            className={`p-3 rounded-lg cursor-pointer transition-colors font-semibold text-sm ${
              page === 'home' ? 'bg-orange-100 text-orange-600' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t.accueil}
          </div>
          {currentUser && (
            <div
              onClick={() => go('profile')}
              className={`p-3 rounded-lg cursor-pointer transition-colors font-semibold text-sm flex items-center gap-2.5 ${
                page === 'profile' ? 'bg-orange-100 text-orange-600 font-bold' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <User className="w-4 h-4 text-[#FF6B00]" />
              <span>Mon Profil</span>
            </div>
          )}
          <div
            onClick={() => go('market')}
            className={`p-3 rounded-lg cursor-pointer transition-colors font-semibold text-sm ${
              page === 'market' ? 'bg-orange-100 text-orange-600' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t.marketplace} 🛒
          </div>
          <div
            onClick={() => {
              sessionStorage.setItem('open_market_modal', '1');
              go('market');
              setTimeout(() => {
                (window as any).openMarketModal?.();
              }, 120);
            }}
            className="p-3 rounded-lg cursor-pointer transition-colors font-bold text-sm bg-orange-50 text-[#FF6B00] hover:bg-orange-100 flex items-center justify-between border border-orange-200"
          >
            <span className="flex items-center gap-2">
              <span>🏷️</span>
              <span>Vendre un article</span>
            </span>
            <span className="text-[10px] bg-[#FF6B00] text-white font-extrabold px-1.5 py-0.5 rounded">
              Photo
            </span>
          </div>
          <div
            onClick={() => go('artisan-verification')}
            className={`p-3 rounded-lg cursor-pointer transition-colors font-medium text-sm ${
              page === 'artisan-verification' ? 'bg-orange-100 text-orange-600' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t.verif}
          </div>
          <div
            onClick={() => go('how-it-works')}
            className={`p-3 rounded-lg cursor-pointer transition-colors font-medium text-sm ${
              page === 'how-it-works' ? 'bg-orange-100 text-orange-600' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t.comment}
          </div>
          <div
            onClick={() => go('about')}
            className={`p-3 rounded-lg cursor-pointer transition-colors font-medium text-sm ${
              page === 'about' ? 'bg-orange-100 text-orange-600' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {t.propos}
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-neutral-800">
          <span>{currentPaysObj?.drapeau || '🇨🇮'}</span>
          <span>{currentPaysObj?.nom || paysSelectionne || 'Côte d’Ivoire'}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              changeLang('fr');
              changerLangue('fr');
            }}
            className={`mr-2 p-1 border rounded text-xs font-bold transition-colors cursor-pointer px-3 ${
              lang === 'fr' ? 'bg-black text-white border-black' : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => {
              changeLang('en');
              changerLangue('en');
            }}
            className={`p-1 border rounded text-xs font-bold transition-colors cursor-pointer px-3 ${
              lang === 'en' ? 'bg-black text-white border-black' : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </aside>
  );
};
