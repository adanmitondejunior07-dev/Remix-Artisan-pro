import React, { useState } from 'react';
import {
  Wallet,
  Users,
  Briefcase,
  Sparkles,
  Calculator,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { PortefeuilleClient } from './PortefeuilleClient.tsx';
import { PortefeuilleArtisan } from './PortefeuilleArtisan.tsx';
import { calculerGains, decomposerGains } from '../utils/walletCalculations.ts';

interface PortefeuilleCompletProps {
  initialMode?: 'client' | 'artisan';
}

export const PortefeuilleComplet: React.FC<PortefeuilleCompletProps> = ({
  initialMode,
}) => {
  const { currentUser, go } = useApp();

  // Détermine le mode par défaut selon le rôle du compte connecté
  const defaultMode =
    initialMode ||
    (currentUser?.role === 'artisan' || (currentUser as any)?.isArtisan ? 'artisan' : 'client');

  const [activeTab, setActiveTab] = useState<'client' | 'artisan'>(defaultMode);

  return (
    <div id="artisanpro-portefeuille-complet" className="max-w-4xl mx-auto space-y-6">
      {/* HEADER BANNER : Cerveau + Visage ensemble */}
      <div className="rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 p-6 sm:p-8 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" />
            <span>ArtisanPro Africa • Portefeuille Complet</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Portefeuille Panafricain (Cerveau + Visage)
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            Architecture unifiée avec calcul automatique des gains (<strong>90% pour l'artisan</strong>, <strong>10% commission plateforme</strong>), gestion des recharges Mobile Money (Orange, MTN, Moov, Wave) et retraits directs.
          </p>

          {/* SÉLECTEUR D'ÉCRAN : PORTEFEUILLE CLIENT / PORTEFEUILLE ARTISAN */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-700 shadow-inner">
              <button
                type="button"
                id="tab-portefeuille-client"
                onClick={() => setActiveTab('client')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'client'
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Portefeuille Client</span>
              </button>

              <button
                type="button"
                id="tab-portefeuille-artisan"
                onClick={() => setActiveTab('artisan')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'artisan'
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Portefeuille Artisan</span>
              </button>
            </div>

            <div className="text-[11px] text-neutral-400 hidden sm:flex items-center gap-1.5 pl-2">
              <span>Mode actif :</span>
              <strong className="text-white">
                {activeTab === 'client' ? 'Écran Client' : 'Écran Artisan'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* AFFICHAGE DU VISAGE SÉLECTIONNÉ */}
      {activeTab === 'client' ? (
        <PortefeuilleClient onUpgradeToArtisan={() => setActiveTab('artisan')} />
      ) : (
        <PortefeuilleArtisan />
      )}
    </div>
  );
};
