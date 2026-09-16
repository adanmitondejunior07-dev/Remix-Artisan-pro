import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  Bell,
  User,
  Shield,
  Menu,
  X,
  CheckCheck,
  ChevronDown,
  Sparkles,
  Headphones,
  Wallet,
  Globe,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { PageName } from '../context/AppContext.tsx';
import { isSuperAdmin } from '../config/adminConfig.ts';
import { OfficialChannelsBar } from './OfficialChannelsBar.tsx';
import { ArtisanProIcon } from './ArtisanProIcon.tsx';
import { SidebarDrawer } from './SidebarDrawer.tsx';

export const Navbar: React.FC = () => {
  const {
    page,
    go,
    currentUser,
    currentArtisan,
    notifications,
    unreadNotifsCount,
    markNotifAsRead,
    markAllNotifsAsRead,
    authModal,
    supportModal,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [channelsDropdownOpen, setChannelsDropdownOpen] = useState(false);
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);

  // Expose toggleMenu globalement pour la compatibilité avec les scripts du header
  useEffect(() => {
    (window as any).toggleMenu = () => {
      setMobileMenuOpen((prev) => !prev);
    };
    return () => {
      delete (window as any).toggleMenu;
    };
  }, []);

  // Liste des 3 super admins fondateurs officiels
  const superAdmins = [
    'adanmitondejunior07@gmail.com',
    'artisanpro.afrique@gmail.com',
    'contactartisanproafrica@gmail.com',
  ];

  const isSuperAdminUser =
    superAdmins.includes(currentUser?.email?.toLowerCase() || '') ||
    currentUser?.role === 'super_admin' ||
    isSuperAdmin(currentUser);

  const isAdmin = isSuperAdminUser || currentUser?.role === 'admin';

  const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
    { label: 'Accueil', page: 'home', icon: null },
    { label: 'Trouver un artisan', page: 'search', icon: <Search className="w-3.5 h-3.5" /> },
    { label: 'Carte GPS', page: 'map', icon: <MapPin className="w-3.5 h-3.5" /> },
    { label: 'Marketplace', page: 'market', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { label: 'Messagerie', page: 'messages', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    ...(isSuperAdminUser
      ? [
          {
            label: 'Abonnements',
            page: 'abonnements' as PageName,
            icon: <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />,
          },
        ]
      : []),
    { label: 'Gains', page: 'subscription', icon: <Wallet className="w-3.5 h-3.5 text-[#FF6B00]" /> },
  ];

  const legalItems: { label: string; page: PageName; icon: string; badge?: string }[] = [
    { label: 'Conditions de Monétisation', page: 'conditions-monetisation', icon: '💰', badge: 'Artisan' },
    { label: 'Politique de Confidentialité', page: 'privacy', icon: '🔒' },
    { label: "Conditions d'Utilisation", page: 'terms', icon: '📜' },
    { label: 'Suppression de Compte', page: 'delete-account', icon: '🗑️', badge: 'Requis Play' },
    { label: 'Vérification Artisan', page: 'artisan-verification', icon: '🛡️' },
    { label: 'Signaler un Problème', page: 'report-issue', icon: '⚠️' },
    { label: 'Comment ça marche', page: 'how-it-works', icon: '💡' },
    { label: "À Propos d'Artisan Pro", page: 'about', icon: '✨' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#111',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
      }}
      className="w-full border-b border-[#2a2a2a]"
    >
      {/* MENU GAUCHE - ON GARDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#222',
            color: 'white',
            border: 'none',
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Menu"
          title="Menu de navigation"
        >
          ☰
        </button>
        <button
          onClick={() => go('home')}
          className="cursor-pointer border-none bg-transparent p-0 flex items-center gap-1.5 text-left"
        >
          <b style={{ color: 'white', fontSize: '19px' }}>
            Artisan<span style={{ color: '#FF6B00' }}>Pro</span>
          </b>
        </button>
      </div>

      {/* RECHERCHE DROITE - ON GARDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => {
            const input = document.getElementById('searchInput') || document.getElementById('search');
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              go('search');
              setTimeout(() => {
                const el = document.getElementById('searchInput') || document.getElementById('search');
                el?.focus();
              }, 100);
            }
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#222',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Rechercher"
          aria-label="Rechercher"
        >
          🔍
        </button>

        {/* ON CACHE SEULEMENT LES AUTRES BOUTONS DU HAUT SANS LES SUPPRIMER DU CODE */}
        <button
          type="button"
          onClick={() => go('messages')}
          className="header-msg w-9 h-9 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white flex items-center justify-center cursor-pointer transition-colors"
          title="Messagerie"
          aria-label="Messagerie"
        >
          💬
        </button>
        <div className="header-notif relative">
          <button
            type="button"
            onClick={() => {
              go('notifications');
              setNotifDropdownOpen(false);
              setUserDropdownOpen(false);
            }}
            className="w-9 h-9 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white flex items-center justify-center cursor-pointer transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            🔔
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs">
              {unreadNotifsCount > 0 ? (unreadNotifsCount > 9 ? '9+' : unreadNotifsCount) : '3'}
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAdmin) {
              go('admin');
            } else {
              go('account');
            }
          }}
          className="header-param w-9 h-9 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] flex items-center justify-center text-black font-bold cursor-pointer transition-colors"
          title={isAdmin ? "Administration" : "Paramètres du compte"}
          aria-label="Paramètres"
        >
          ⚙️
        </button>
        <button
          type="button"
          onClick={() => {
            if (currentUser) {
              setUserDropdownOpen(!userDropdownOpen);
              setNotifDropdownOpen(false);
            } else {
              authModal.open('login');
            }
          }}
          className="header-profil cursor-pointer focus:outline-none shrink-0"
          title={currentUser ? currentUser.name : "Connexion"}
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name || 'Profil'}
              className="w-9 h-9 rounded-full object-cover border border-[#2a2a2a]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#2a2a2a] text-neutral-200 border border-neutral-700 flex items-center justify-center text-sm font-bold">
              {currentUser?.avatar || '👤'}
            </div>
          )}
        </button>
      </div>

      {/* User Dropdown */}
      {userDropdownOpen && (
        <div className="absolute top-[58px] right-3 w-64 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#2a2a2a] py-2 z-[110] text-white">
          <div className="px-4 py-2.5 border-b border-[#2a2a2a]">
            <div className="text-xs text-neutral-400">Connecté en tant que :</div>
            <div className="font-bold text-sm text-white truncate">{currentUser?.name || 'Utilisateur'}</div>
            <div className="text-[11px] text-neutral-400 font-mono truncate">{currentUser?.email}</div>
            {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || isSuperAdminUser) && (
              <div className="mt-1 inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Fondateur: ADANMITONDE GERAUD
              </div>
            )}
          </div>

          <div className="py-1 text-xs">
            <button
              onClick={() => {
                go('account');
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-neutral-400" />
              Mon compte & Profil
            </button>

            <button
              onClick={() => {
                go('settings');
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#FF6B00]" />
              Paramètres & Abonnements
            </button>

            <button
              onClick={() => {
                go('about');
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              À Propos d'Artisan Pro
            </button>

            <button
              onClick={() => {
                go('portefeuille');
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-bold text-white flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-[#FF6B00]" />
              <span>Portefeuille Complet</span>
            </button>

            <button
              onClick={() => {
                go('subscription');
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Accès 100% Gratuit (Sans abonnement)
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  go('admin');
                  setUserDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left bg-purple-950/40 hover:bg-purple-900/40 font-bold text-purple-300 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                Tableau de bord Super Admin
              </button>
            )}

            <button
              onClick={() => {
                supportModal.open();
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-neutral-200 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-amber-400" />
              Service Support 24/7
            </button>

            <div className="border-t border-[#2a2a2a] my-1"></div>

            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Menu &gt; Légal & Conformité Store
            </div>
            {legalItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  go(item.page);
                  setUserDropdownOpen(false);
                }}
                className={`w-full px-4 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  item.page === 'delete-account'
                    ? 'text-red-400 hover:bg-red-950/30 font-semibold'
                    : 'text-neutral-300 hover:bg-[#2a2a2a]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}

            <div className="border-t border-[#2a2a2a] my-1"></div>

            <div className="px-3 py-2 border-b border-[#2a2a2a]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                Canaux Officiels
              </div>
              <OfficialChannelsBar variant="compact" />
            </div>

            <button
              onClick={() => {
                authModal.open();
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-[#2a2a2a] font-medium text-amber-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <span>🔄</span>
              Changer de profil (Démo)
            </button>

            <button
              onClick={() => {
                logout();
                setUserDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-red-950/40 font-medium text-red-400 transition-colors cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {notifDropdownOpen && (
        <div className="absolute top-[58px] right-14 w-80 sm:w-96 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#2a2a2a] py-2 z-[110] text-white">
          <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">Notifications</h4>
              {unreadNotifsCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                  {unreadNotifsCount} nouvelle{unreadNotifsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadNotifsCount > 0 && (
              <button
                onClick={markAllNotifsAsRead}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#2a2a2a]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotifAsRead(notif.id);
                    if (notif.linkPage) {
                      go(notif.linkPage as PageName);
                      setNotifDropdownOpen(false);
                    }
                  }}
                  className={`p-3.5 text-xs hover:bg-[#2a2a2a] cursor-pointer transition-colors flex items-start gap-3 ${
                    !notif.read ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{notif.title}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(notif.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* NOUVEAU MENU LATÉRAL SIDEBAR AVEC OVERLAY ET SECTIONS COMPLÈTES */}
      <SidebarDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
};
