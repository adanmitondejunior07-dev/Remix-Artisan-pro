import React from 'react';
import { FileText, ArrowLeft, ShieldAlert, CheckCircle2, UserX, AlertTriangle, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const TermsPage: React.FC = () => {
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
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Contrat d'utilisation & Charte de Confiance</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-bold shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>CONDITIONS GÉNÉRALES D'UTILISATION (CGU)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Conditions d'Utilisation
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Règles d'utilisation de la plateforme Artisan Pro Afrique • Fondateur : ADANMITONDE GERAUD
          </p>
        </div>

        {/* Encadré d'avertissement : Faux profils et arnaques interdits */}
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-black text-sm">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>TOLÉRANCE ZÉRO : ARNAQUES ET FAUX PROFILS STRICTEMENT INTERDITS</span>
          </div>
          <p className="text-sm font-medium text-red-900 leading-relaxed">
            Tout comportement frauduleux, tentative d'escroquerie, usurpation d'identité ou création de faux profil entraîne un <strong>bannissement immédiat et définitif</strong> du numéro de téléphone et de l'adresse IP, avec transmission éventuelle aux autorités compétentes.
          </p>
        </div>

        {/* Sections des règles */}
        <div className="space-y-6 text-sm text-neutral-700">
          {/* Règle 1 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">1</span>
              <span>Règles d'utilisation et respect mutuel</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Artisan Pro Afrique est un espace d'échange professionnel fondé sur la courtoisie, l'honnêteté et la valorisation du travail bien fait :
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-neutral-700">
              <li>Les clients et les artisans s'engagent à communiquer avec respect dans leurs échanges écrits ou téléphoniques.</li>
              <li>Tout propos injurieux, diffamatoire, discriminatoire ou haineux est rigoureusement prohibé.</li>
              <li>Les devis et engagements pris entre clients et artisans doivent être honorés de bonne foi.</li>
            </ul>
          </div>

          {/* Règle 2 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">2</span>
              <span>Authenticité des profils et photos de réalisations</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              L'artisan doit fournir des informations véridiques sur son identité, sa localisation (ville/pays) et son métier :
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-neutral-700">
              <li>Les photos et vidéos publiées doivent impérativement correspondre à des <strong>réalisations authentiques</strong> de l'artisan.</li>
              <li>L'utilisation de photos d'autrui ou trouvées sur Internet sans en être l'auteur constitue une contrefaçon passible d'exclusion.</li>
              <li>Les numéros de téléphone sont validés par code OTP afin de prévenir les doublons et les faux comptes.</li>
            </ul>
          </div>

          {/* Règle 3 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs flex items-center justify-center font-black">3</span>
              <span>Paiements et relations contractuelles</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Artisan Pro Afrique met en relation des professionnels indépendants avec des clients :
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-neutral-700">
              <li>Les prix des prestations sont fixés librement et en toute transparence entre le client et l'artisan.</li>
              <li>Les règlements s'effectuent via les moyens de paiement autorisés locaux (Wave, Orange Money, MTN MoMo, etc.).</li>
              <li>Artisan Pro Afrique ne retient pas de commission cachée lors de la prise de contact directe.</li>
            </ul>
          </div>

          {/* Règle 4 */}
          <div className="space-y-3 p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Signalement des litiges et comportements suspects</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Tout utilisateur constatant une anomalie, un faux numéro ou une tentative d'arnaque est invité à utiliser la procédure de signalement dédiée afin que l'équipe d'administration intervienne sans délai.
            </p>
            <button
              type="button"
              onClick={() => go('report-issue')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Signaler un problème ou un litige</span>
            </button>
          </div>

          {/* Règle 5 : CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO */}
          <div className="space-y-4 p-6 rounded-2xl bg-amber-500/10 border-2 border-[#FF6B00]/40">
            <h2 className="text-base sm:text-lg font-black text-neutral-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#FF6B00] text-white text-xs flex items-center justify-center font-black">5</span>
              <span>CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO</span>
            </h2>

            {/* Message officiel */}
            <div className="p-4 rounded-xl bg-white border border-amber-300 space-y-1.5 text-xs sm:text-sm">
              <div className="font-black text-neutral-950">
                💰 Vous souhaitez gagner de l’argent avec vos contenus ?
              </div>
              <p className="text-neutral-700 font-medium">
                Complétez les conditions ArtisanPro, développez votre audience et respectez les règles de la plateforme.
              </p>
              <p className="text-neutral-950 font-bold">
                Lorsque toutes les conditions sont remplies, vous pourrez demander l’activation de votre monétisation.
              </p>
            </div>

            {/* Statuts de monétisation */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-neutral-900">
                STATUTS DE MONÉTISATION :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-bold text-neutral-900 flex items-center gap-2">
                  <span>🔒</span>
                  <span>Non éligible</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-bold text-neutral-900 flex items-center gap-2">
                  <span>⏳</span>
                  <span>Conditions en cours</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-bold text-neutral-900 flex items-center gap-2">
                  <span>🟡</span>
                  <span>Demande de validation</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-bold text-neutral-900 flex items-center gap-2">
                  <span>🟢</span>
                  <span>Monétisation active</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-bold text-neutral-900 flex items-center gap-2">
                  <span>🔴</span>
                  <span>Monétisation suspendue</span>
                </div>
              </div>
            </div>

            <p className="text-neutral-700 font-medium leading-relaxed pt-1">
              Pour commencer à générer des revenus grâce à ses publications, projets et contenus sur ArtisanPro, l’utilisateur doit remplir les conditions suivantes :
            </p>
            <ol className="space-y-2 text-neutral-800 list-decimal list-inside pl-1 text-xs sm:text-sm">
              <li><strong>Avoir un compte ArtisanPro actif.</strong></li>
              <li>
                <strong>Avoir un profil professionnel complet :</strong>
                <ul className="list-disc list-inside pl-6 space-y-1 text-xs text-neutral-600 font-normal">
                  <li>Nom et prénom</li>
                  <li>Photo de profil</li>
                  <li>Pays</li>
                  <li>Ville</li>
                  <li>Métier</li>
                  <li>Présentation de son activité</li>
                </ul>
              </li>
              <li>
                <strong>Avoir un abonnement ArtisanPro actif :</strong>
                <ul className="list-disc list-inside pl-6 space-y-1 text-xs text-neutral-600 font-normal">
                  <li>Artisan Essentiel</li>
                  <li>Artisan Pro</li>
                  <li>Artisan Premium</li>
                </ul>
              </li>
              <li><strong>Avoir publié au minimum 10 contenus ou réalisations originales sur ArtisanPro.</strong></li>
              <li><strong>Être actif régulièrement sur la plateforme.</strong></li>
              <li><strong>Publier uniquement du contenu original ou du contenu dont l’utilisateur possède les droits.</strong></li>
              <li><strong>Respecter les règles de la communauté ArtisanPro.</strong></li>
              <li><strong>Ne pas utiliser de faux comptes, de fausses vues, de faux abonnés ou de systèmes artificiels pour augmenter les statistiques.</strong></li>
              <li><strong>Ne pas publier de contenu frauduleux, illégal, trompeur, violent ou contraire aux règles ArtisanPro.</strong></li>
              <li><strong>Atteindre le seuil minimum d’engagement fixé par ArtisanPro pour l’activation de la monétisation.</strong></li>
              <li><strong>Disposer d’un moyen de paiement permettant de recevoir ses revenus dans son pays.</strong></li>
              <li><strong>Accepter les Conditions de Monétisation ArtisanPro.</strong></li>
              <li><strong>Faire vérifier son compte par ArtisanPro avant l’activation de la monétisation.</strong></li>
            </ol>

            <div className="mt-4 p-4 rounded-xl bg-white border border-amber-300 space-y-2 text-xs">
              <div className="font-black text-amber-900 uppercase">IMPORTANT :</div>
              <ul className="space-y-1.5 text-neutral-800">
                <li>• <strong>Le fait d’avoir un abonnement ArtisanPro ne garantit pas automatiquement des revenus.</strong></li>
                <li>• <strong>La monétisation est activée uniquement lorsque toutes les conditions sont remplies et que le compte est validé par ArtisanPro.</strong></li>
                <li>• <strong>ArtisanPro se réserve le droit de suspendre ou désactiver la monétisation en cas de fraude, de non-respect des règles ou d’activité suspecte.</strong></li>
                <li>• <strong>Les revenus générés dépendent des performances du contenu et des règles de rémunération ArtisanPro.</strong></li>
              </ul>
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
