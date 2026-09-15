import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  UserPlus,
  LogIn,
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight,
  Wallet,
  Coins,
  TrendingUp,
  Smartphone,
  Send,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { MonetizationView } from './MonetizationView.tsx';

export const SubscriptionPage: React.FC = () => {
  const { authModal, go, currentUser } = useApp();

  const isConnected = !!currentUser;

  // SI CONNECTÉ : MonetizationView applique la logique stricte selon le type d'utilisateur :
  // 1. Client : 0 FCFA + "Vous n'avez pas de gains en tant que client" + Bouton "Devenir Artisan - 13.000F" (10k + 3k)
  // 2. Artisan non activé (a_paye_10k == false) : "Payez 10.000F pour activer" (bouton vérifier profil masqué)
  // 3. Artisan activé (a_paye_10k == true, non vérifié) : "Payez 3.000F pour vérification badge"
  // 4. Artisan vérifié (is_verified == true) : Écran normal complet avec solde et retraits Mobile Money
  if (isConnected) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <MonetizationView />
      </div>
    );
  }

  // SI NON CONNECTÉ : Explication détaillée des gains + Gros bouton "S'inscrire"
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner Notice */}
      <div className="rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 p-6 sm:p-10 text-white shadow-xl border border-amber-500/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" />
            <span>Rémunération & Retraits Mobile Money</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Gagnez de l'argent et encaissez directement par Mobile Money
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Sur <b>Artisan Pro Afrique</b>, chaque artisan est rémunéré en toute sécurité sur ses prestations.
            Zéro abonnement, inscription 100% gratuite, et retraits rapides dès 5 000 FCFA sur Wave, Orange Money, MTN et Moov.
          </p>

          {/* Action buttons: S'inscrire + Se connecter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              onClick={() => go('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>S'inscrire</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => authModal.open('login')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all text-center"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Earnings */}
      <div className="space-y-4">
        <div className="text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Transparence totale</span>
          <h2 className="text-2xl font-black text-neutral-900">
            Comment fonctionnent vos gains ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl">
              1
            </div>
            <h3 className="font-bold text-sm text-neutral-900">Commandes & Devis</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Recevez des demandes de devis et des commandes de clients situés dans votre ville ou région.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
              90%
            </div>
            <h3 className="font-bold text-sm text-neutral-900">90% Reversés</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Vous gardez 90% du montant de votre travail. La commission de 10% sert à faire tourner la plateforme.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xl">
              5000F
            </div>
            <h3 className="font-bold text-sm text-neutral-900">Retrait min. 5 000 FCFA</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Dès 5 000 FCFA disponibles, demandez votre virement immédiat en 1 clic.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xl">
              📲
            </div>
            <h3 className="font-bold text-sm text-neutral-900">Mobile Money</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Compatibilité complète Wave, Orange Money, MTN MoMo, Moov Money et RIB bancaire.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action card */}
      <div className="bg-amber-50 rounded-3xl border border-amber-200 p-8 text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-neutral-950">
          Prêt à commencer à recevoir des chantiers ?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          L'inscription ne prend que 2 minutes et est 100% gratuite. Remplissez vos spécialités et commencez à développer votre activité.
        </p>
        <div className="pt-2">
          <button
            onClick={() => go('register')}
            className="px-8 py-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-900 text-white font-black text-xs shadow-md transition-all hover:scale-[1.02] inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>S'inscrire maintenant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
