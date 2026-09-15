import React, { useState } from 'react';
import { Trash2, ArrowLeft, AlertCircle, CheckCircle2, Mail, Shield, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const DeleteAccountPage: React.FC = () => {
  const { go, currentUser, showToast } = useApp();
  const [identifier, setIdentifier] = useState(currentUser?.phone || currentUser?.email || '');
  const [reason, setReason] = useState('Je ne souhaite plus utiliser le service');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast({
        title: 'Information requise',
        desc: 'Veuillez saisir votre numéro de téléphone ou adresse email.',
        type: 'warning',
      });
      return;
    }

    const subject = encodeURIComponent(`Demande de suppression de compte et données - ${identifier}`);
    const body = encodeURIComponent(
      `Bonjour l'équipe Artisan Pro Afrique,\n\nJe demande la suppression définitive et irréversible de mon compte utilisateur ainsi que de toutes mes données personnelles associées (profil, téléphone, photos, devis, réalisations).\n\nIdentifiant / Téléphone / Email: ${identifier}\nNom d'utilisateur: ${currentUser?.name || 'Non spécifié'}\nMotif: ${reason}\n\nConformément aux exigences de Google Play et Apple App Store, je vous remercie de confirmer la suppression.\n\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    );

    // Déclenchement de l'envoi email
    window.location.href = `mailto:artisanpro.afrique@gmail.com?subject=${subject}&body=${body}`;

    setIsSubmitted(true);
    showToast({
      title: 'Demande transmise avec succès',
      desc: 'Votre demande de suppression a été envoyée à artisanpro.afrique@gmail.com.',
      type: 'success',
    });
  };

  return (
    <div className="min-h-[80vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold border border-red-200">
          <Shield className="w-3.5 h-3.5 text-red-600" />
          <span>Procédure officielle requise Google Play & Apple</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-900 text-xs font-bold shadow-2xs">
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>GESTION DU COMPTE & DONNÉES PERSONNELLES</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Suppression de Compte
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Conformité Google Play Store et Apple App Store • Artisan Pro Afrique
          </p>
        </div>

        {/* Note d'information */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-neutral-700 space-y-1">
            <div className="font-bold text-neutral-900">Conséquences de la suppression définitive :</div>
            <p className="leading-relaxed">
              La suppression de votre compte efface l'ensemble de vos données : identité, numéro de téléphone, photos de vos réalisations, historique des devis, avis reçus et messages. Cette action est <strong>irréversible</strong>.
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-900">Demande de suppression enregistrée</h2>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                Votre demande a été adressée à notre équipe d'administration à <strong>artisanpro.afrique@gmail.com</strong>. Vos données seront définitivement purgées sous 48 heures.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => go('home')}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
              >
                Retourner à l'accueil
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDeleteRequest} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Numéro de téléphone ou Email du compte à supprimer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex: +225 0503444508 ou client@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[11px] text-neutral-500">
                Entrez le numéro ou l'email avec lequel vous avez créé votre profil Artisan ou Client.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Motif de la demande de suppression (facultatif)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                <option value="Je ne souhaite plus utiliser le service">Je ne souhaite plus utiliser le service</option>
                <option value="Changement de numéro de téléphone">Changement de numéro de téléphone</option>
                <option value="Cessation d'activité artisanale">Cessation d'activité artisanale</option>
                <option value="Protection de la vie privée">Protection de la vie privée</option>
                <option value="Autre raison">Autre raison</option>
              </select>
            </div>

            {/* Bouton obligatoire Google Play */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-black transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Demander suppression de mon compte et de mes données</span>
              </button>
            </div>
          </form>
        )}

        {/* Contact direct alternatif */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-neutral-500" />
            <span>Support de suppression direct :</span>
            <a href="mailto:artisanpro.afrique@gmail.com" className="font-bold text-neutral-800 hover:underline">
              artisanpro.afrique@gmail.com
            </a>
          </div>
          <div className="text-neutral-500">
            Délai de traitement maximal : 48h
          </div>
        </div>

        {/* Bloc Identité Officielle */}
        <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
          <div><strong>Artisan Pro Afrique</strong> • Fondateur : ADANMITONDE GERAUD - Tailleur Brodeur</div>
          <div>Site officiel : <a href="https://artisanpro.africa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">https://artisanpro.africa</a></div>
        </div>
      </div>
    </div>
  );
};
