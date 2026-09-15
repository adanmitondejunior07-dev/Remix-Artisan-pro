import React from 'react';
import { CheckCircle2, ArrowLeft, ShieldCheck, Smartphone, MapPin, Wrench, FileCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const VerificationPage: React.FC = () => {
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Charte de Transparence & Contrôle</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>PROCESSUS DE CONTRÔLE ET CONFIANCE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Vérification Artisan
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Directives de conformité et sécurité • Artisan Pro Afrique • Fondateur : ADANMITONDE GERAUD
          </p>
        </div>

        {/* Encadré d'éthique : Ne jamais promettre certifié sans preuve */}
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>ENGAGEMENT D'HONNÊTETÉ : AUCUNE FAUSSE CERTIFICATION</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-neutral-800 leading-relaxed">
            Sur Artisan Pro Afrique, <strong>nous ne promettons jamais qu'un artisan est "certifié" sans preuve formelle</strong>. La transparence est notre priorité absolue. Nous distinguons clairement un compte inscrit vérifié par téléphone, d'un profil ayant reçu un badge "Vérifié" après contrôle approfondi.
          </p>
        </div>

        {/* Les 4 Piliers de la Vérification */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-neutral-900">
            Les étapes du processus de vérification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pilier 1 : Profil & Identité */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">1. Profil & Identité</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                L'artisan renseigne son nom officiel, sa photo de profil réelle et une description authentique de son activité sans exagération.
              </p>
            </div>

            {/* Pilier 2 : Métier & Spécialité */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">2. Métier & Réalisations</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sélection du corps de métier (couture, broderie, électricité, plomberie, menuiserie, etc.) et publication de photos authentiques de ses travaux.
              </p>
            </div>

            {/* Pilier 3 : Ville & Pays */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">3. Ville & Pays de Résidence</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Localisation géographique précise permettant aux clients locaux de le solliciter et évitant les profils fictifs délocalisés.
              </p>
            </div>

            {/* Pilier 4 : Téléphone vérifié par OTP */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">4. Téléphone vérifié par OTP</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Chaque numéro de contact est vérifié par un code OTP à usage unique envoyé par SMS ou WhatsApp, garantissant que la ligne est bien active et joignable.
              </p>
            </div>
          </div>

          {/* Attribution manuelle du Badge Vérifié */}
          <div className="p-6 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Badge "Vérifié"</span>
              </span>
              <span className="text-xs text-neutral-400 font-mono">Attribué uniquement après vérification manuelle</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Le badge bleu "Vérifié" ne peut être acheté. Il est décerné manuellement par les administrateurs après examen des documents d'exercice, validation des réalisations réelles et contrôle de conformité. Tout abus ou plainte justifiée entraîne le retrait immédiat du badge.
            </p>
          </div>
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
