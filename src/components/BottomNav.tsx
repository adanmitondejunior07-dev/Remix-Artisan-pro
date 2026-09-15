import React from 'react';
import {
  Home,
  Hammer,
  MessageSquare,
  Wallet,
  User,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const BottomNav: React.FC = () => {
  const { page, go, currentUser, unreadNotifsCount, artisan13kModal } = useApp();

  // La barre de navigation inférieure est strictement réservée aux utilisateurs connectés
  if (!currentUser) {
    return null;
  }

  const superAdmins = [
    'adanmitondejunior07@gmail.com',
    'artisanpro.afrique@gmail.com',
    'contactartisanproafrica@gmail.com',
  ];

  const isAdmin =
    superAdmins.includes(currentUser?.email?.toLowerCase() || '') ||
    currentUser?.email === 'admin@artisanpro.afrique' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin';
  const isArtisan =
    currentUser?.role === 'artisan' ||
    currentUser?.isArtisan === true ||
    Boolean(currentUser?.artisanId);
  const isClient = currentUser?.role === 'client' || (!currentUser && !isAdmin);

  const isHomeActive = page === 'home';
  const isArtisansActive = page === 'search' || page === 'map';
  const isMessagesActive = page === 'messages';
  const isGainsActive = page === 'subscription';
  const isAdminActive = page === 'admin';
  const isRegisterActive = page === 'register';
  const isProfileActive = page === 'account' || page === 'profile';

  return (
    <nav
      aria-label="Barre de navigation mobile style WhatsApp"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-neutral-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 py-1.5 md:hidden"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* 1. Accueil (icône maison) */}
        <button
          type="button"
          onClick={() => go('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] cursor-pointer ${
            isHomeActive
              ? 'text-[#FF7A00] font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <Home
              className={`w-5 h-5 transition-transform ${
                isHomeActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
              }`}
            />
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">Accueil</span>
          {isHomeActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
          )}
        </button>

        {/* 2. Artisans (icône marteau en Orange vif #FF7A00) */}
        <button
          type="button"
          onClick={() => go('search')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] cursor-pointer ${
            isArtisansActive
              ? 'text-[#FF7A00] font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <Hammer
              className={`w-5 h-5 transition-transform ${
                isArtisansActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
              }`}
            />
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">Artisans</span>
          {isArtisansActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
          )}
        </button>

        {/* 3. Messages (icône bulle de discussion) */}
        <button
          type="button"
          onClick={() => go('messages')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] relative cursor-pointer ${
            isMessagesActive
              ? 'text-[#FF7A00] font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <MessageSquare
              className={`w-5 h-5 transition-transform ${
                isMessagesActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
              }`}
            />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-red-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">Messages</span>
          {isMessagesActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
          )}
        </button>

        {/* 4. Rôle-dépendant : Admin -> "Admin", Client -> "Devenir Artisan", Artisan -> "Gains" */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => go('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] ${
              isAdminActive
                ? 'text-purple-700 font-bold'
                : 'text-neutral-500 hover:text-purple-700'
            }`}
          >
            <div className="relative">
              <Shield
                className={`w-5 h-5 transition-transform ${
                  isAdminActive ? 'scale-110 text-purple-700' : 'text-neutral-500'
                }`}
              />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Admin</span>
            {isAdminActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-700 mt-0.5 animate-in fade-in" />
            )}
          </button>
        ) : isArtisan ? (
          /* Si role=ARTISAN : "Devenir Artisan" est supprimé et remplacé par "Profil" artisan */
          <button
            type="button"
            onClick={() => go('account')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 min-w-[60px] cursor-pointer ${
              isProfileActive
                ? 'text-[#FF7A00] font-bold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="relative">
              <User
                className={`w-5 h-5 transition-transform ${
                  isProfileActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
                }`}
              />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none font-bold">Profil</span>
            {isProfileActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
            )}
          </button>
        ) : (
          /* Si role=CLIENT : Onglet "Devenir Artisan" qui ouvre le paiement direct 13k si connecté */
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                artisan13kModal.open();
              } else {
                go('register');
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] cursor-pointer ${
              isRegisterActive
                ? 'text-[#FF7A00] font-bold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="relative">
              <Briefcase
                className={`w-5 h-5 transition-transform ${
                  isRegisterActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
                }`}
              />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none text-center font-bold">Devenir Artisan</span>
            {isRegisterActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
            )}
          </button>
        )}

        {/* 5. Profil (visible pour Admin et Client ; pour Artisan, déjà affiché en remplacement de Devenir Artisan) */}
        {!isArtisan && (
          <button
            type="button"
            onClick={() => go('account')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[56px] cursor-pointer ${
              isProfileActive
                ? 'text-[#FF7A00] font-bold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <div className="relative">
              <User
                className={`w-5 h-5 transition-transform ${
                  isProfileActive ? 'scale-110 text-[#FF7A00]' : 'text-neutral-500'
                }`}
              />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Profil</span>
            {isProfileActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] mt-0.5 animate-in fade-in" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
};
