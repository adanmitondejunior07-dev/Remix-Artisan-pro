import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { LangProvider } from './LangContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { SearchPage } from './components/SearchPage.tsx';
import { ProfilePage } from './components/ProfilePage.tsx';
import { MapPage } from './components/MapPage.tsx';
import { MessagesPage } from './components/MessagesPage.tsx';
import { AccountPage } from './components/AccountPage.tsx';
import { RegisterArtisanPage } from './components/RegisterArtisanPage.tsx';
import { SubscriptionPage } from './components/SubscriptionPage.tsx';
import { ArtisanProSubscriptionsPage } from './components/ArtisanProSubscriptionsPage.tsx';
import { MyPaymentHistoryPage } from './components/MyPaymentHistoryPage.tsx';
import { AdminPage } from './components/AdminPage.tsx';
import { AdminLoginPage } from './components/AdminLoginPage.tsx';
import { DynamicProfileView } from './components/DynamicProfileView.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { PrivacyPage } from './components/PrivacyPage.tsx';
import { TermsPage } from './components/TermsPage.tsx';
import { DeleteAccountPage } from './components/DeleteAccountPage.tsx';
import { VerificationPage } from './components/VerificationPage.tsx';
import { ReportIssuePage } from './components/ReportIssuePage.tsx';
import { HowItWorksPage } from './components/HowItWorksPage.tsx';
import { MonetizationConditionsPage } from './components/MonetizationConditionsPage.tsx';
import { NotificationsPage } from './components/NotificationsPage.tsx';
import { PortefeuilleComplet } from './components/PortefeuilleComplet.tsx';
import { AdminPaymentsPage } from './components/AdminPaymentsPage.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { DesktopLeftSidebar } from './components/DesktopLeftSidebar.tsx';
import { AuthGate } from './components/AuthGate.tsx';
import { QuoteModal } from './components/Modals/QuoteModal.tsx';
import { PaymentModal } from './components/Modals/PaymentModal.tsx';
import { SupportModal } from './components/Modals/SupportModal.tsx';
import { AuthModal } from './components/Modals/AuthModal.tsx';
import { Artisan13kPaymentModal } from './components/Modals/Artisan13kPaymentModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { isSuperAdmin } from './config/adminConfig.ts';
import { auth } from './firebase/config.ts';

const AppContent: React.FC = () => {
  const { page, go, toast, hideToast, currentUser, artisan13kModal, showToast } = useApp();

  // AUTH GATE GLOBAL OBLIGATOIRE (Comme Facebook)
  // const user = localStorage.getItem('artisanPro_user') || firebase.auth().currentUser
  const storedUserRaw =
    typeof window !== 'undefined'
      ? localStorage.getItem('artisanPro_user') || localStorage.getItem('userData')
      : null;
  const user = currentUser || (storedUserRaw ? JSON.parse(storedUserRaw) : null) || auth.currentUser;

  // Détection du chemin dans l'URL
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname.toLowerCase());
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Si non connecté : BLOQUE TOUT et redirige vers /login avec le message d'avertissement
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      // Si la personne tente d'accéder à /marketplace, /profil, /artisan ou toute autre page protégée
      if (pathname !== '/login' && pathname !== '/register') {
        showToast({
          title: 'Accès réservé aux membres',
          desc: 'Inscrivez-vous ou connectez-vous pour voir Artisan Pro',
          type: 'warning',
        });
        try {
          window.history.replaceState(null, '', '/login');
          setCurrentPath('/login');
        } catch {}
      }
    }
  }, [user, showToast]);

  // Si connecté et que l'URL est encore /login ou /register, nettoyer vers l'accueil
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname === '/login' || pathname === '/register') {
        try {
          window.history.replaceState(null, '', '/');
        } catch {}
      } else if ((pathname === '/admin' || window.location.hash === '#admin') && page !== 'admin') {
        go('admin');
      } else if (pathname === '/admin/paiements' && page !== 'admin-paiements') {
        go('admin-paiements');
      }
    }
  }, [user, page, go]);

  // Si l'utilisateur n'est pas connecté, afficher UNIQUEMENT le portail Facebook-style (/login ou /register)
  if (!user) {
    const isRegister = currentPath.includes('register');
    return (
      <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#f0f2f5]">
        <AuthGate initialMode={isRegister ? 'register' : 'login'} />
        {/* Affichage des notifications toast globales sur l'écran de connexion */}
        {toast && (
          <div className="fixed bottom-5 right-4 sm:right-5 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
            <div
              className={`max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
                toast.type === 'success'
                  ? 'bg-neutral-950 text-white border-neutral-800'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-neutral-900 border-neutral-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : toast.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-[#FF6B00]" />
                ) : (
                  <Info className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="font-bold text-xs">{toast.title}</div>
                {toast.desc && <div className="text-[11px] opacity-80 leading-relaxed">{toast.desc}</div>}
              </div>
              <button
                onClick={hideToast}
                className="p-1 rounded-lg hover:opacity-70 transition-opacity shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderActivePage = () => {
    switch (page) {
      case 'search':
        return <SearchPage />;
      case 'profile':
        return <ProfilePage />;
      case 'map':
        return <MapPage />;
      case 'messages':
        return <MessagesPage />;
      case 'account':
        return <AccountPage />;
      case 'register':
        return <RegisterArtisanPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'abonnements':
        return <ArtisanProSubscriptionsPage />;
      case 'mon-historique':
        return <MyPaymentHistoryPage />;
      case 'admin': {
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || isSuperAdmin(currentUser);
        if (!isAdmin) {
          go('search');
          return <SearchPage />;
        }
        return <AdminPage />;
      }
      case 'admin-paiements': {
        const canAccessAdminPayments = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || isSuperAdmin(currentUser);
        if (!canAccessAdminPayments) {
          go('search');
          return <SearchPage />;
        }
        return <AdminPaymentsPage />;
      }
      case 'admin-login':
        return <AdminLoginPage />;
      case 'dynamic-profile':
        return <ProfilePage />;
      case 'about':
        return <AboutPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'terms':
        return <TermsPage />;
      case 'delete-account':
        return <DeleteAccountPage />;
      case 'artisan-verification':
        return <VerificationPage />;
      case 'report-issue':
        return <ReportIssuePage />;
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'conditions-monetisation':
        return <MonetizationConditionsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'portefeuille':
        return (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PortefeuilleComplet />
          </div>
        );
      default:
        return <SearchPage />;
    }
  };

  const isMessagesPage = page === 'messages';

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-screen flex flex-col bg-[#fafaf9] text-neutral-900 font-sans selection:bg-[#FF6B00] selection:text-white ${isMessagesPage ? 'p-0 m-0 overflow-hidden h-[100dvh]' : 'pb-16 md:pb-0'}`}>
      {/* Top Navigation - hidden on full-screen Messages */}
      {!isMessagesPage && <Navbar />}

      {/* Main Content Area - feed visible under header */}
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${!isMessagesPage ? 'pt-[66px]' : ''} ${isMessagesPage ? 'h-full overflow-hidden' : ''}`}>
        <div className="flex w-full min-h-full">
          {!isMessagesPage && <DesktopLeftSidebar />}
          <div className="flex-1 min-w-0">
            {renderActivePage()}
          </div>
        </div>
      </main>

      {/* WhatsApp-Style Bottom Navigation Bar (hidden on full-screen Messages) */}
      {!isMessagesPage && <BottomNav />}

      {/* Bottom Footer - hidden on full-screen Messages */}
      {!isMessagesPage && <Footer />}

      {/* Global Modals */}
      <QuoteModal />
      <PaymentModal />
      <SupportModal />
      <AuthModal />
      <Artisan13kPaymentModal isOpen={artisan13kModal.isOpen} onClose={artisan13kModal.close} />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-5 right-4 sm:right-5 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div
            className={`max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-neutral-950 text-white border-neutral-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-neutral-900 border-neutral-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-[#FF6B00]" />
              ) : (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-xs">{toast.title}</div>
              {toast.desc && <div className="text-[11px] opacity-80 leading-relaxed">{toast.desc}</div>}
            </div>
            <button
              onClick={hideToast}
              className="p-1 rounded-lg hover:opacity-70 transition-opacity shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}
