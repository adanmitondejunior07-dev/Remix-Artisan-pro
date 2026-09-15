import React, { useState } from 'react';
import {
  X,
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { formatWhatsAppUrl } from '../../utils/socialLinks.ts';

export const SupportModal: React.FC = () => {
  const { supportModal, currentUser, currentArtisan, showToast } = useApp();
  const { isOpen, close, initialTopic } = supportModal;

  const [tab, setTab] = useState<'ticket' | 'whatsapp' | 'call' | 'faq'>('whatsapp');

  // Form state
  const [topic, setTopic] = useState<string>(initialTopic || 'Paiement Mobile Money');
  const [name, setName] = useState<string>(currentUser?.name || currentArtisan?.name || '');
  const [phone, setPhone] = useState<string>(currentUser?.phone || currentArtisan?.phone || '+225 ');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [message, setMessage] = useState<string>('');
  const [urgency, setUrgency] = useState<'normale' | 'urgente'>('normale');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketCreated, setTicketCreated] = useState<{ id: string; date: string } | null>(null);

  if (!isOpen) return null;

  const officialSupportPhone = '+2250503444508';
  const displayPhone = '+225 05 03 44 45 08';
  const supportEmail = 'contactartisanproafrica@gmail.com';

  const defaultWhatsappMessage = `Bonjour le Service Support Artisan Pro Afrique !%0AJe vous contacte concernant : ${encodeURIComponent(
    topic
  )}.%0AUtilisateur : ${encodeURIComponent(name || 'Client/Artisan')}%0ATéléphone : ${encodeURIComponent(phone)}%0AMon message : ${encodeURIComponent(
    message || 'J’ai besoin d’une assistance sur la plateforme.'
  )}`;

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast({ title: 'Veuillez saisir votre message', type: 'warning' });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const ticketId = `SUPP-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTicket = {
        id: ticketId,
        date: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setTicketCreated(newTicket);
      setIsSubmitting(false);
      showToast({
        title: 'Ticket de support enregistré !',
        desc: `Référence ${ticketId}. Un conseiller vous répondra sous 30 min.`,
        type: 'success',
      });
    }, 1000);
  };

  const handleReset = () => {
    setTicketCreated(null);
    setMessage('');
    close();
  };

  const faqItems = [
    {
      q: 'Quels sont les pays et moyens de paiement acceptés pour le Marketplace ?',
      a: 'Nous acceptons les paiements Mobile Money et Cartes bancaires dans plus de 20 pays africains : Bénin (MTN MoMo, Moov, Celtiis), Côte d’Ivoire (Wave, Orange, MTN, Moov), Sénégal (Wave, Orange, Free), Burkina Faso (Orange, Moov), Togo (T-Money, Moov), Ghana (MTN, Telecel), Cameroun, Mali, Guinée, RDC, Kenya, etc. ainsi que les cartes Visa et Mastercard.',
    },
    {
      q: 'Comment contacter directement un artisan via WhatsApp ?',
      a: 'Sur le profil de chaque artisan et sur les fiches du catalogue, un bouton vert "WhatsApp Direct" vous permet d’ouvrir la conversation instantanément sur WhatsApp avec ses coordonnées directes.',
    },
    {
      q: 'Mes paiements sur la plateforme sont-ils sécurisés ?',
      a: 'Oui, tous les règlements sont protégés par le compte séquestre garanti d’Artisan Pro Afrique. Les fonds ne sont débloqués à l’artisan qu’après validation de la prestation ou selon les étapes du devis convenues.',
    },
    {
      q: 'Comment personnaliser ma bannière et ma photo de profil ?',
      a: 'Rendez-vous dans "Mon Compte", onglet "Mon Profil". Vous pouvez choisir parmi nos bannières artistiques africaines en 1 clic ou coller le lien de votre propre photo d’atelier.',
    },
    {
      q: 'Je suis artisan, comment faire certifier mon compte ?',
      a: 'Vous pouvez envoyer une copie de votre pièce d’identité ou registre de commerce directement à notre équipe support via WhatsApp pour obtenir le badge "Artisan Vérifié" sous 24h.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base leading-tight">Service Support & Assistance</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  En ligne 7j/7
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Support client panafricain pour artisans et clients (Bénin, Côte d’Ivoire, Sénégal, Togo, Ghana...)
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTab('whatsapp')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              tab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Direct (Réponse instantanée)</span>
          </button>

          <button
            onClick={() => setTab('ticket')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              tab === 'ticket'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Créer un Ticket / Réclamation</span>
          </button>

          <button
            onClick={() => setTab('call')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              tab === 'call'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Ligne Téléphonique</span>
          </button>

          <button
            onClick={() => setTab('faq')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              tab === 'faq'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Questions Fréquentes</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: WHATSAPP DIRECT */}
          {tab === 'whatsapp' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-neutral-900 text-base">Assistance WhatsApp Officielle</h3>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Conseillers disponibles en direct 7j/7 de 07h00 à 23h00 GMT.
                    </p>
                    <div className="text-xs font-bold text-emerald-800 mt-1">{displayPhone}</div>
                  </div>
                </div>

                <a
                  href={formatWhatsAppUrl(officialSupportPhone, defaultWhatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Démarrer sur WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Topics preview */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Sélectionnez le motif de votre contact :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    {
                      label: 'Paiement Mobile Money (20 pays)',
                      desc: 'Problème de validation, push USSD, remboursement ou reçu.',
                    },
                    {
                      label: 'Artisan & Suivi de devis',
                      desc: 'Mise en relation, retard de chantier ou réclamation qualité.',
                    },
                    {
                      label: 'Inscription & Vérification de compte',
                      desc: 'Certification badge vérifié, activation formule Pro/Premium.',
                    },
                    {
                      label: 'Assistance technique & Marketplace',
                      desc: 'Aide pour commander ou publier une prestation en ligne.',
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTopic(item.label)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        topic === item.label
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 font-semibold'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-neutral-900">{item.label}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message preview */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Détail rapide (optionnel) :
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: J'ai effectué un paiement Wave au Sénégal et je souhaite vérifier la confirmation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Guaranteed support pledge */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong className="text-neutral-900">Garantie Sécurité & Protection :</strong> Chaque dossier est suivi
                  par un superviseur dédié pour garantir la bonne fin des travaux et la sécurité de vos fonds.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: TICKET / RECLAMATION */}
          {tab === 'ticket' && (
            <div>
              {ticketCreated ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-emerald-950">Ticket créé avec succès !</h3>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto">
                      Votre demande a été assignée en priorité à notre équipe d’assistance panafricaine.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 inline-block text-left text-xs space-y-1">
                    <div>
                      <span className="text-neutral-500">Numéro de référence : </span>
                      <span className="font-mono font-bold text-neutral-900">{ticketCreated.id}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Date d’enregistrement : </span>
                      <span className="font-medium text-neutral-800">{ticketCreated.date}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Délai estimé : </span>
                      <span className="font-semibold text-emerald-700">Moins de 30 minutes</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setTicketCreated(null)}
                      className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                    >
                      Nouveau ticket
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Votre Nom & Prénom *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Kouamé Jean"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Numéro de téléphone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Adresse Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre.email@domaine.com"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Priorité</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUrgency('normale')}
                          className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                            urgency === 'normale'
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 text-neutral-600'
                          }`}
                        >
                          Normale
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgency('urgente')}
                          className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                            urgency === 'urgente'
                              ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600'
                              : 'border-neutral-200 text-neutral-600'
                          }`}
                        >
                          Urgente 🚨
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-neutral-700 mb-1">Motif de la demande</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="Paiement Mobile Money (Bénin, Côte d'Ivoire, Sénégal, Togo...)">
                        Paiement Mobile Money (20 pays africains)
                      </option>
                      <option value="Problème avec un devis ou artisan">Problème avec un devis ou un artisan</option>
                      <option value="Vérification et certification compte pro">
                        Vérification et certification compte artisan
                      </option>
                      <option value="Question sur le Marketplace">Commande ou service sur le Marketplace</option>
                      <option value="Autre demande">Autre question ou partenariat</option>
                    </select>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-neutral-700 mb-1">Description détaillée *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Expliquez précisément votre situation afin que notre équipe puisse agir rapidement..."
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="px-4 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      {isSubmitting ? (
                        <span>Envoi en cours...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer le ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: APPELS TELEPHONIQUES */}
          {tab === 'call' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-sm">Lignes Directes d'Assistance Afrique</h3>
                    <p className="text-xs text-neutral-600">
                      Nos équipes locales répondent à vos appels du lundi au dimanche.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Siège & Direction (Côte d’Ivoire)</div>
                    <a href={`tel:${officialSupportPhone}`} className="font-bold text-neutral-900 text-sm hover:text-blue-600 flex items-center gap-1.5">
                      <span>🇨🇮</span> {displayPhone}
                    </a>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>07h30 - 22h00 GMT</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Ligne Urgences Litiges & Chantiers</div>
                    <a href={`tel:${officialSupportPhone}`} className="font-bold text-neutral-900 text-sm hover:text-blue-600 flex items-center gap-1.5">
                      <span>📞</span> {displayPhone}
                    </a>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>Permanence 24h/24</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-neutral-900">{supportEmail}</div>
                      <div className="text-[11px] text-neutral-500">Pour tout contrat, justificatif ou devis officiel</div>
                    </div>
                  </div>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors"
                  >
                    Écrire
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ */}
          {tab === 'faq' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-500 font-medium">
                Réponses directes aux interrogations les plus fréquentes sur Artisan Pro Afrique :
              </div>
              <div className="space-y-2.5">
                {faqItems.map((item, idx) => (
                  <details
                    key={idx}
                    className="group rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-xs [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-bold text-neutral-900 gap-2">
                      <span>{item.q}</span>
                      <span className="transition group-open:rotate-180 shrink-0 text-neutral-400">▼</span>
                    </summary>
                    <p className="mt-2 text-neutral-600 leading-relaxed pt-2 border-t border-neutral-200/60">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Support réactif 20+ pays d'Afrique</span>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
