import React from 'react';
import { ShieldCheck, PhoneCall, Zap, Heart, Headphones, Globe, Mail, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ArtisanProIcon } from './ArtisanProIcon.tsx';

export const Footer: React.FC = () => {
  const { go, supportModal, currentUser } = useApp();

  const superAdmins = [
    'adanmitondejunior07@gmail.com',
  ];

  const isAdmin =
    superAdmins.includes(currentUser?.email?.toLowerCase() || '') ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin';

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-12 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <ArtisanProIcon size={38} showText={false} />
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl text-white tracking-tight">
                    Artisan<span className="text-[#FFD60A] bg-[#212121] px-1.5 py-0.5 rounded-md ml-0.5 font-black text-base border border-neutral-700">Pro</span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#FF7A00] text-white rounded-md shadow-xs">
                    Afrique
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#FF7A00] font-bold mt-1.5">
                Trouvez. Contactez. Faites réaliser.
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              La plateforme panafricaine reliant particuliers et entreprises aux meilleurs artisans
              qualifiés, avec devis transparents et géolocalisation.
            </p>
            <div className="text-xs space-y-0.5 border-l-2 border-amber-500/60 pl-2.5 py-0.5">
              <div className="text-neutral-300 font-medium">Disponible actuellement dans 20 pays</div>
              <div className="text-amber-400 font-bold">Notre vision : 54 pays africains</div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇧🇯 Bénin</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇨🇮 Côte d’Ivoire</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇸🇳 Sénégal</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇧🇫 Burkina</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇹🇬 Togo</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px]">🇬🇭 Ghana</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">+14 pays</span>
            </div>
          </div>

          {/* Col 2: Navigation & Découverte */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-3">
              Découvrir
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => go('search')} className="hover:text-amber-400 transition-colors">
                  Trouver un artisan qualifié
                </button>
              </li>
              <li>
                <button onClick={() => go('map')} className="hover:text-amber-400 transition-colors">
                  Carte interactive & Artisans proches
                </button>
              </li>
              <li>
                <button onClick={() => go('how-it-works')} className="hover:text-amber-400 transition-colors font-medium text-amber-400">
                  Comment ça marche
                </button>
              </li>
              <li>
                <button onClick={() => go('subscription')} className="hover:text-amber-400 transition-colors">
                  Formules Free, Pro & Premium
                </button>
              </li>
              <li>
                <button onClick={() => go('about')} className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  À Propos d'Artisan Pro Afrique
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    onClick={() => go('admin')}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Console Super Admin</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Légal & Conformité (Google Play & Apple) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-3">
              Légal & Conformité
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => go('privacy')} className="hover:text-amber-400 transition-colors text-neutral-400 hover:text-white">
                  Politique de Confidentialité
                </button>
              </li>
              <li>
                <button onClick={() => go('terms')} className="hover:text-amber-400 transition-colors text-neutral-400 hover:text-white">
                  Conditions d'Utilisation
                </button>
              </li>
              <li>
                <button onClick={() => go('delete-account')} className="hover:text-red-400 transition-colors text-red-400 font-medium">
                  Suppression de Compte
                </button>
              </li>
              <li>
                <button onClick={() => go('artisan-verification')} className="hover:text-amber-400 transition-colors text-neutral-400 hover:text-white">
                  Vérification Artisan
                </button>
              </li>
              <li>
                <button onClick={() => go('report-issue')} className="hover:text-amber-400 transition-colors text-amber-400 font-medium">
                  Signaler un Problème
                </button>
              </li>
              <li>
                <button onClick={() => go('how-it-works')} className="hover:text-amber-400 transition-colors text-neutral-400 hover:text-white">
                  Comment ça marche
                </button>
              </li>
              <li>
                <button onClick={() => go('about')} className="hover:text-amber-400 transition-colors text-neutral-400 hover:text-white">
                  À Propos de nous
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Assistance & Moyens de Paiement */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-3">
              Moyens de Paiement 20 Pays
            </h4>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Paiements directs via prestataires autorisés Wave, Orange, MTN, Monniz, Moov & Cartes Visa/Mastercard.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs mb-4">
              <span className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[11px]">
                💛 MTN MoMo (BJ, CI, GH, CM)
              </span>
              <span className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[11px]">
                🌊 Wave (CI, SN, BF)
              </span>
              <span className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[11px]">
                🍊 Orange Money (CI, SN, ML, GN)
              </span>
              <span className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[11px]">
                📱 Moov & T-Money (BJ, TG, CI)
              </span>
              <span className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700 text-[11px]">
                💳 Cartes Visa / Mastercard
              </span>
            </div>
            <button
              onClick={() => supportModal.open()}
              className="text-amber-400 hover:text-amber-300 transition-colors font-bold text-xs flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Contacter le Service Support 24/7</span>
            </button>
          </div>
        </div>

        {/* Barre des Liens Légaux Google Play & App Store */}
        <div className="border-t border-neutral-800 py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-neutral-400">
          <button onClick={() => go('conditions-monetisation')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline text-amber-400 font-bold">
            Conditions de Monétisation
          </button>
          <span>•</span>
          <button onClick={() => go('privacy')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
            Politique de Confidentialité
          </button>
          <span>•</span>
          <button onClick={() => go('terms')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
            Conditions d'Utilisation
          </button>
          <span>•</span>
          <button onClick={() => go('delete-account')} className="hover:text-red-400 transition-colors underline-offset-4 hover:underline text-red-400">
            Suppression de Compte
          </button>
          <span>•</span>
          <button onClick={() => go('artisan-verification')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
            Vérification Artisan
          </button>
          <span>•</span>
          <button onClick={() => go('report-issue')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline text-amber-400">
            Signaler un Problème
          </button>
          <span>•</span>
          <button onClick={() => go('how-it-works')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
            Comment ça marche
          </button>
          <span>•</span>
          <button onClick={() => go('about')} className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline">
            À Propos
          </button>
        </div>

        {/* Ligne inférieure Footer avec copyright exact et email */}
        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3">
          <div>© 2026 Artisan Pro Afrique – Créé par ADANMITONDE GERAUD | artisanproafrique@gmail.com</div>
          <div className="flex items-center gap-2">
            <a href="https://artisanpro.africa" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
              https://artisanpro.africa
            </a>
            <span>•</span>
            <a href="https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Chaîne WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
