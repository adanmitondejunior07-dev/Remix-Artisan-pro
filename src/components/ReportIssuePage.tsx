import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, ShieldAlert, Send, CheckCircle2, MessageSquare, Mail, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { supabase, isSupabaseConfigured } from '../services/supabase.ts';

export const ReportIssuePage: React.FC = () => {
  const { go, showToast } = useApp();
  const [issueType, setIssueType] = useState<'fake_profile' | 'scam' | 'dispute' | 'inappropriate'>('fake_profile');
  const [targetContact, setTargetContact] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast({
        title: 'Description obligatoire',
        desc: 'Veuillez décrire brièvement le problème rencontré.',
        type: 'warning',
      });
      return;
    }

    const typeLabels = {
      fake_profile: 'Faux profil / Photos volées',
      scam: 'Tentative d’arnaque / Escroquerie',
      dispute: 'Litige sur une prestation',
      inappropriate: 'Comportement suspect ou inapproprié',
    };

    const subject = encodeURIComponent(`[SIGNALEMENT URGENT] ${typeLabels[issueType]} - ${targetContact}`);
    const body = encodeURIComponent(
      `Bonjour le service Modération Artisan Pro Afrique,\n\nJe signale un incident urgent sur la plateforme :\n\n- Motif : ${typeLabels[issueType]}\n- Profil ou Numéro signalé : ${targetContact || 'Non spécifié'}\n- Mes coordonnées : ${reporterContact || 'Anonyme'}\n- Description des faits :\n${description}\n\nMerci d’intervenir rapidement.\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    );

    window.location.href = `mailto:artisanpro.afrique@gmail.com?subject=${subject}&body=${body}`;

    // Sauvegarde dans Supabase si configuré
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('reports')
        .insert({
          type: issueType,
          description: `${description} | Cible: ${targetContact || 'N/A'} | Émetteur: ${reporterContact || 'Anonyme'}`,
          created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase reports insert error:', error);
        });
    }

    setIsSubmitted(true);
    showToast({
      title: 'Signalement transmis',
      desc: 'Nos administrateurs examinent le dossier en priorité.',
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
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Service d'Alerte et Protection Utilisateur</span>
        </div>
      </div>

      {/* Carte Principale */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* En-tête */}
        <div className="space-y-3 pb-6 border-b border-neutral-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>MODÉRATION & SÉCURITÉ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Signaler un Problème
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Signalez un faux profil, une tentative d'arnaque ou un litige • Traitement sous 24h
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-900">Signalement reçu avec succès</h2>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                Merci de contribuer à la sécurité de la communauté Artisan Pro Afrique. L'équipe modération va enquêter et suspendre le compte si une infraction est avérée.
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de problème */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-800">
                Nature du problème constaté <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIssueType('fake_profile')}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    issueType === 'fake_profile'
                      ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  🎭 Faux Profil / Usurpation
                </button>
                <button
                  type="button"
                  onClick={() => setIssueType('scam')}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    issueType === 'scam'
                      ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  ⚠️ Tentative d'Arnaque / Escroquerie
                </button>
                <button
                  type="button"
                  onClick={() => setIssueType('dispute')}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    issueType === 'dispute'
                      ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  ⚖️ Litige sur une Prestation
                </button>
                <button
                  type="button"
                  onClick={() => setIssueType('inappropriate')}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    issueType === 'inappropriate'
                      ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  🚫 Contenu ou Propos Inapproprié
                </button>
              </div>
            </div>

            {/* Profil / Numéro visé */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Nom ou Numéro de l'artisan / utilisateur visé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={targetContact}
                onChange={(e) => setTargetContact(e.target.value)}
                placeholder="Ex: Kouamé Plomberie / +225 07..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Coordonnées du signalant */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Vos coordonnées de contact (Téléphone ou Email)
              </label>
              <input
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="Ex: votre_email@gmail.com ou +225..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="text-[11px] text-neutral-500">
                Vos informations restent strictement confidentielles et ne sont jamais partagées avec la personne signalée.
              </p>
            </div>

            {/* Description des faits */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                Explication détaillée des faits <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez précisément ce qui s'est passé (date, montant éventuel, échanges, numéro de transaction)..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              ></textarea>
            </div>

            {/* Boutons d'action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-black transition-all shadow-md cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Envoyer le signalement d'urgence</span>
              </button>

              <a
                href="https://whatsapp.com/channel/0029Vb8wnie5q08by1TETz2c"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chaîne WhatsApp Officielle</span>
              </a>
            </div>
          </form>
        )}

        {/* Bloc Identité Officielle */}
        <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
          <div><strong>Artisan Pro Afrique</strong> • Fondateur : ADANMITONDE GERAUD - Tailleur Brodeur</div>
          <div>Contact Modération : <a href="mailto:artisanpro.afrique@gmail.com" className="text-amber-600 hover:underline">artisanpro.afrique@gmail.com</a></div>
        </div>
      </div>
    </div>
  );
};
