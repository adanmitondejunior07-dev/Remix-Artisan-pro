import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Trash2, Mail, CheckCircle2, Globe, FileText, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const PrivacyPage: React.FC = () => {
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Conforme aux exigences Google Play et Apple App Store</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>PROTECTION DES DONNÉES PERSONNELLES</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Dernière mise à jour : Année 2026 • Nom légal : Artisan Pro Afrique • Fondateur : ADANMITONDE GERAUD - Tailleur Brodeur
          </p>
        </div>

        {/* Encadré officiel résumé */}
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <FileText className="w-4 h-4" />
            <span>Résumé des engagements officiels</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-neutral-800 leading-relaxed">
            ArtisanPro collecte : <strong>nom, téléphone, ville, pays, métier, photos de réalisations</strong> pour connecter artisans et clients. Données stockées de façon sécurisée. <strong>Jamais vendues</strong>. L'utilisateur peut demander suppression de son compte et de ses données à tout moment en écrivant à <a href="mailto:artisanpro.afrique@gmail.com" className="text-amber-700 font-bold underline">artisanpro.afrique@gmail.com</a>. Conforme aux exigences Google Play et Apple.
          </p>
        </div>

        {/* Sections détaillées */}
        <div className="space-y-6 text-sm text-neutral-700">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">1</span>
              <span>Données collectées</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Pour assurer le bon fonctionnement de la mise en relation entre artisans et clients en Afrique, nous collectons exclusivement les informations strictement nécessaires :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-700">
              <li><strong>Informations d'identité et profil :</strong> Nom complet, prénom, ville, pays de résidence.</li>
              <li><strong>Coordonnées professionnelles :</strong> Numéro de téléphone (vérifié par code OTP), adresse email.</li>
              <li><strong>Activité artisanale :</strong> Métier exercé, description des services, tarifs indicatifs, années d'expérience.</li>
              <li><strong>Réalisations & médias :</strong> Photos et vidéos de chantiers ou d'œuvres publiées volontairement par l'artisan.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">2</span>
              <span>Finalités du traitement</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Les données personnelles sont collectées dans l'unique objectif de :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-700">
              <li>Permettre aux clients de rechercher et contacter directement des artisans qualifiés proches de chez eux.</li>
              <li>Afficher la vitrine professionnelle de l'artisan (portfolio de réalisations, coordonnées).</li>
              <li>Vérifier l'authenticité des numéros par code OTP pour prévenir les fraudes.</li>
              <li>Assurer la sécurité de la plateforme et prévenir les faux profils ou litiges.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">3</span>
              <span>Stockage sécurisé et non-vente des données</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Vos données sont stockées sur des infrastructures sécurisées protégées par des règles d'accès strictes. <strong>Nous ne vendons, ne louons et ne commercialisons AUCUNE donnée personnelle à des tiers ou des régies publicitaires.</strong>
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Droit à la suppression de compte et des données</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Conformément aux réglementations Google Play et Apple App Store, tout utilisateur (client ou artisan) bénéficie d'un droit inconditionnel d'accès, de rectification et de suppression totale de ses données.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => go('delete-account')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Aller à la page Suppression de compte</span>
              </button>
              <a
                href="mailto:artisanpro.afrique@gmail.com?subject=Demande%20de%20suppression%20de%20compte%20et%20donn%C3%A9es"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-300 transition-colors"
              >
                <Mail className="w-4 h-4 text-neutral-500" />
                <span>Écrire à artisanpro.afrique@gmail.com</span>
              </a>
            </div>
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
