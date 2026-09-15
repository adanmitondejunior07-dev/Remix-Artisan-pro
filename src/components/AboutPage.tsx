import React from 'react';
import { Sparkles, ArrowLeft, Heart, Shield, Globe, Award, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const AboutPage: React.FC = () => {
  const { go } = useApp();

  return (
    <div className="min-h-[80vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Navigation Retour */}
      <div>
        <button
          type="button"
          onClick={() => go('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>

      {/* Carte Principale À Propos */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>PRÉSENTATION OFFICIELLE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            À PROPOS DE ARTISAN PRO AFRIQUE
          </h1>
        </div>

        {/* Bloc Texte 1 : Création & Fondateur */}
        <div className="p-6 sm:p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-3xl font-black shrink-0 shadow-md shadow-amber-500/20">
            🧵
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Origine & Fondateur
            </div>
            <p className="text-base sm:text-lg font-bold text-neutral-900 leading-relaxed">
              Artisan Pro Afrique est une plateforme créée et fondée par ADANMITONDE GERAUD, Tailleur Brodeur.
            </p>
          </div>
        </div>

        {/* Bloc Texte 2 : Vision Panafricaine */}
        <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Vision Panafricaine</span>
          </div>
          <p className="text-base sm:text-lg font-medium text-neutral-200 leading-relaxed">
            Vision: valoriser les artisans africains et connecter les talents aux opportunités dans les 54 pays africains, ouverture progressive pays par pays.
          </p>
        </div>

        {/* Points clés de la vision */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              🛠️
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Métiers & Savoir-faire</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Mettre en lumière l'excellence des artisans locaux : couture, broderie, mécanique, menuiserie, électricité et plus.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              🤝
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Mise en Relation Directe</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Connecter les clients aux artisans qualifiés avec devis transparents et messagerie instantanée.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              🌍
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Impact Panafricain</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Une communauté active présente dans plus de 20 pays africains pour dynamiser l'artisanat.
            </p>
          </div>
        </div>

        {/* Signature du Fondateur & Liens Officiels */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-neutral-700">ADANMITONDE GERAUD</span>
            <span>—</span>
            <span className="text-neutral-500">Tailleur Brodeur | Fondateur</span>
            <span>•</span>
            <a href="https://artisanpro.africa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-bold">
              https://artisanpro.africa
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline font-bold"
            >
              Chaîne WhatsApp Officielle
            </a>
            <span className="font-mono text-neutral-400">
              © 2026 Artisan Pro Afrique
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
