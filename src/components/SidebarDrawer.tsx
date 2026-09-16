import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import type { PageName } from '../context/AppContext.tsx';
import { isSuperAdmin } from '../config/adminConfig.ts';
import { paysAfricains } from '../data/langues.ts';
import { X, Globe } from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const {
    page,
    go,
    currentUser,
    unreadNotifsCount,
    logout,
    supportModal,
    langueActuelle,
    changerLangue,
    paysSelectionne,
    choisirPays,
    t,
  } = useApp();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavigate = (targetPage: PageName) => {
    go(targetPage);
    onClose();
  };

  const isAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'admin' ||
    isSuperAdmin(currentUser);

  const initialLetter = (currentUser?.name || 'Junior Artisan').trim()[0]?.toUpperCase() || 'J';
  const displayCity = currentUser?.city || 'Abidjan';
  const notifCount = unreadNotifsCount > 0 ? unreadNotifsCount : 3;

  return (
    <>
      {/* OVERLAY BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/50 z-[290] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* SIDEBAR DRAWER */}
      <aside
        className={`fixed top-0 left-0 w-[85%] max-w-[340px] h-[100dvh] bg-white text-[#111111] z-[300] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] border-r border-[#E5E7EB] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* PROFILE HEADER */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
          <div
            onClick={() => handleNavigate('profile')}
            className="flex items-center gap-3 cursor-pointer select-none group min-w-0"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name || 'Profil'}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#FF6B00] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#FF6B00] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                {initialLetter}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-[#FF6B00] transition-colors truncate">
                {currentUser?.name || 'Junior Artisan'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-[#DBEAFE] text-[#2563EB] px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight">
                  ✅ Vérifié
                </span>
                <span className="text-xs text-[#6B7280] font-medium truncate">
                  • {displayCity}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-neutral-700 transition-colors cursor-pointer shrink-0 ml-2"
            title="Fermer le menu"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE MENU CONTENT */}
        <div className="flex-1 overflow-y-auto py-2 divide-y-0">
          {/* SECTION 1: NAVIGATION PRINCIPALE */}
          <div className="px-2 space-y-0.5">
            <button
              onClick={() => handleNavigate('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'home'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                🏠
              </div>
              <span className="truncate">Fil d'actualité</span>
            </button>

            <button
              onClick={() => handleNavigate('search')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'search'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                🔍
              </div>
              <span className="truncate">Découvrir artisans</span>
            </button>

            <button
              onClick={() => handleNavigate('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'profile'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                💼
              </div>
              <span className="truncate">Mes publications</span>
            </button>

            <button
              onClick={() => handleNavigate('messages')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'messages'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                💬
              </div>
              <span className="truncate">Messages</span>
            </button>

            <button
              onClick={() => handleNavigate('conditions-monetisation')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'conditions-monetisation'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                💰
              </div>
              <span className="truncate">Monétisation</span>
            </button>

            <button
              onClick={() => handleNavigate('portefeuille')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                page === 'portefeuille'
                  ? 'bg-orange-50 text-[#FF6B00]'
                  : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                💳
              </div>
              <span className="truncate">Portefeuille Complet</span>
            </button>
          </div>

          <div className="h-px bg-[#E5E7EB] my-2 mx-3" />

          {/* SECTION 2: PARAMÈTRES ET ACTIONS */}
          <div className="px-2">
            <div className="px-3 py-1.5 text-[11px] font-bold text-[#6B7280] tracking-wider uppercase">
              PARAMÈTRES ET ACTIONS
            </div>

            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => handleNavigate('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'notifications'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                    🔔
                  </div>
                  <span className="truncate">Notifications</span>
                </div>
                <span className="bg-[#EF4444] text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {notifCount}
                </span>
              </button>

              <button
                onClick={() => handleNavigate('market')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'market'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center text-base shrink-0">
                  🛒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-bold">Marketplace</div>
                  <div className="text-[11px] text-neutral-500 truncate">Catalogue & Commandes directes</div>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'settings'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  ⚙️
                </div>
                <span className="truncate">Paramètres et confidentialité</span>
              </button>

              <button
                onClick={() => handleNavigate('report-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'report-issue'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  🚨
                </div>
                <span className="truncate">Signaler un problème</span>
              </button>

              <button
                onClick={() => handleNavigate('delete-account')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-[#DC2626] hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer ${
                  page === 'delete-account' ? 'bg-red-50 font-bold' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center text-base shrink-0">
                  🗑️
                </div>
                <span className="truncate">Suppression de compte</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] my-2 mx-3" />

          {/* SECTION 3: ARTISANPRO */}
          <div className="px-2">
            <div className="px-3 py-1.5 text-[11px] font-bold text-[#6B7280] tracking-wider uppercase">
              ARTISANPRO
            </div>

            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => handleNavigate('artisan-verification')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'artisan-verification'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  ✅
                </div>
                <span className="truncate">Vérification Artisan</span>
              </button>

              <button
                onClick={() => handleNavigate('how-it-works')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'how-it-works'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  ❓
                </div>
                <span className="truncate">Comment ça marche ?</span>
              </button>

              <button
                onClick={() => handleNavigate('about')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'about'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  ℹ️
                </div>
                <span className="truncate">À propos d'ArtisanPro</span>
              </button>

              <button
                onClick={() => handleNavigate('privacy')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'privacy'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  📄
                </div>
                <span className="truncate">Politique de confidentialité</span>
              </button>

              <button
                onClick={() => handleNavigate('terms')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                  page === 'terms'
                    ? 'bg-orange-50 text-[#FF6B00]'
                    : 'text-neutral-800 hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-base shrink-0">
                  📋
                </div>
                <span className="truncate">Conditions d'utilisation</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: ESPACE ADMINISTRATION (SI ADMIN) */}
          {isAdmin && (
            <>
              <div className="h-px bg-[#E5E7EB] my-2 mx-3" />
              <div className="px-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-purple-600 tracking-wider uppercase">
                  ADMINISTRATION
                </div>
                <div className="space-y-0.5 mt-0.5">
                  <button
                    onClick={() => handleNavigate('admin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                      page === 'admin'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-neutral-800 hover:bg-purple-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-base shrink-0">
                      🛡️
                    </div>
                    <span className="truncate">Tableau de bord Admin</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('admin-paiements')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                      page === 'admin-paiements'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-neutral-800 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-base shrink-0">
                      💳
                    </div>
                    <span className="truncate">Supervision Paiements</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-[#E5E7EB] my-2 mx-3" />

          {/* SECTION 5: SUPPORT & ACTIONS */}
          <div className="px-2 space-y-0.5 pb-2">
            <button
              onClick={() => {
                supportModal.open();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-neutral-800 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base shrink-0">
                🎧
              </div>
              <span className="truncate">Support 24/7 & Assistance</span>
            </button>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-base shrink-0">
                🚪
              </div>
              <span className="truncate">Déconnexion</span>
            </button>
          </div>

          <div className="h-px bg-[#E5E7EB] my-2 mx-3" />

          {/* SÉLECTEUR DE LANGUE & PAYS AFRICAINS - STYLE FACEBOOK */}
          <div className="language-selector-facebook p-3 m-2 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2.5 mb-6">
            <div className="flex items-center justify-between">
              <p className="font-black text-neutral-800 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>🌐 {t.Langue || 'Langue'}</span>
              </p>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                {paysSelectionne}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="drawer-lang-fr"
                onClick={() => changerLangue('fr')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer text-center ${
                  langueActuelle === 'fr'
                    ? 'bg-[#FF6B00] text-white shadow-2xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                🇫🇷 Français
              </button>
              <button
                type="button"
                id="drawer-lang-en"
                onClick={() => changerLangue('en')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer text-center ${
                  langueActuelle === 'en'
                    ? 'bg-[#FF6B00] text-white shadow-2xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <select
              id="drawer-select-pays"
              value={paysSelectionne}
              onChange={(e) => choisirPays(e.target.value)}
              aria-label="Choisir un pays africain"
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#FF6B00] cursor-pointer"
            >
              {paysAfricains.map((p) => (
                <option key={p.nom} value={p.nom}>
                  {p.drapeau} {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </>
  );
};
