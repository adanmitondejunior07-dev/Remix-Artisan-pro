import React from 'react';
import { ArrowLeft, Search, PhoneCall, Wallet, ShieldCheck, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const HowItWorksPage: React.FC = () => {
  const { go } = useApp();

  return (
    <div className="min-h-[80vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Navigation Retour */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => go('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Guide officiel de la plateforme</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>FONCTIONNEMENT SIMPLE & TRANSPARENT</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Comment ça marche ?
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Mise en relation directe entre artisans et clients • Artisan Pro Afrique
          </p>
        </div>

        {/* Principe clé officiel */}
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-amber-800">
            Principe fondamental
          </div>
          <p className="text-sm sm:text-base font-bold text-neutral-900 leading-relaxed">
            Le client contacte l'artisan directement. ArtisanPro ne garde pas l'argent au début. Les paiements s'effectuent via les prestataires autorisés Wave, Orange Money, MTN MoMo.
          </p>
        </div>

        {/* 3 Grandes étapes */}
        <div className="space-y-6">
          {/* Étape 1 */}
          <div className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 items-start">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0">
              1
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-600" />
                <span>Rechercher et découvrir des artisans talentueux</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Parcourez les profils d'artisans classés par corps de métier (couture, broderie, mécanique, menuiserie, plomberie, maçonnerie, etc.) et par ville/pays. Consultez leurs photos de chantiers et réalisations réelles en toute transparence.
              </p>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 items-start">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0">
              2
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Prise de contact directe et devis gratuit</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Le client contacte l'artisan directement par appel téléphonique, message WhatsApp ou demande de devis instantané. Vous discutez librement du besoin, des délais et du tarif convenu d'un commun accord.
              </p>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 items-start">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0">
              3
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Paiements directs via prestataires autorisés</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                ArtisanPro ne bloque pas vos fonds et ne prélève aucune retenue dissimulée. Les paiements de vos prestations s'effectuent via les services agréés en Afrique de l'Ouest et Centrale : <strong>Wave, Orange Money, MTN MoMo, Moov Money</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Moyens de paiement acceptés */}
        <div className="p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Prestataires de paiement mobile reconnus
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Pour assurer la fluidité de vos transactions sur le continent :
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200">
              🌊 Wave Direct
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200">
              🍊 Orange Money
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200">
              💛 MTN Mobile Money
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200">
              📱 Moov Money / Flooz
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => go('search')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-black transition-all shadow-md cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Trouver un artisan maintenant</span>
          </button>
          <button
            type="button"
            onClick={() => go('register')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-neutral-700 transition-all cursor-pointer"
          >
            <span>Inscrire mon activité d'artisan</span>
          </button>
        </div>

        {/* Bloc Identité Officielle */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-600">
          <div className="space-y-1">
            <div className="font-bold text-neutral-800">Artisan Pro Afrique — Nom légal</div>
            <div>Fondateur : <strong>ADANMITONDE GERAUD</strong> - Tailleur Brodeur</div>
            <div>Site officiel : <a href="https://artisanpro.africa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">https://artisanpro.africa</a></div>
          </div>
          <div className="text-right">
            <a
              href="https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-bold"
            >
              <span>Chaîne WhatsApp Officielle</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
