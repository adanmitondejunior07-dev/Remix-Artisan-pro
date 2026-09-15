import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { formatTelephone } from '../../utils/phoneUtils.ts';
import { AfricanPhoneInput } from '../AfricanPhoneInput.tsx';

export const QuoteModal: React.FC = () => {
  const { quoteModal, currentUser, showToast, refreshData, go } = useApp();
  const { isOpen, artisan, serviceTitle, close } = quoteModal;

  const [title, setTitle] = useState(serviceTitle || '');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '+225 ');
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync title if serviceTitle changes
  React.useEffect(() => {
    if (serviceTitle) setTitle(serviceTitle);
  }, [serviceTitle]);

  if (!isOpen || !artisan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    const checkTel = formatTelephone(phone);
    if (!checkTel.ok) {
      alert(checkTel.msg || 'Format de téléphone incorrect');
      showToast({
        title: 'Numéro invalide',
        desc: checkTel.msg || 'Format de téléphone incorrect',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createQuote({
        clientId: currentUser?.id || 'user-client-1',
        clientName,
        clientPhone: checkTel.value || phone,
        artisanId: artisan.id,
        artisanName: artisan.name,
        serviceTitle: title,
        description: description || 'Prestation standard demandée',
        estimatedPrice: artisan.hourlyRate || 'À évaluer',
      });

      setSubmitted(true);
      showToast({
        title: 'Demande de devis transmise !',
        desc: `${artisan.name} a été notifié et vous répondra rapidement.`,
        type: 'success',
      });
      await refreshData();
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible d’envoyer la demande',
        type: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setDescription('');
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              {artisan.emoji}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Demander un devis</h2>
              <p className="text-xs text-amber-100 font-medium">
                À destination de <span className="font-semibold text-white">{artisan.name}</span> ({artisan.trade})
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Demande envoyée avec succès !</h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto">
                Votre artisan <b>{artisan.name}</b> a reçu une notification immédiate. Vous pouvez suivre l'état de votre devis dans votre espace client ou échanger via la messagerie.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleResetAndClose();
                    go('messages');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  Ouvrir la messagerie
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-sm transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p>
                  Devis gratuit et sans engagement. ⚡ Demandez rapidement votre devis à {artisan.name}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Prestation souhaitée *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robe sur mesure, Dépannage compteur..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Votre Nom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Votre nom complet"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <AfricanPhoneInput
                  id="telInput"
                  label="Numéro de téléphone (Afrique)"
                  value={phone}
                  onChange={(fullNumber) => setPhone(fullNumber)}
                  placeholder="0503444508"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Description détaillée du besoin
                </label>
                <textarea
                  rows={3}
                  placeholder="Précisez les dimensions, matériaux, lieu d'intervention ou date souhaitée..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Envoi en cours...'
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Envoyer ma demande
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
