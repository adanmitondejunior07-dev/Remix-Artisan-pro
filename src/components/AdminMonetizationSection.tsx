import React, { useState, useMemo } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  UserCheck,
  FileText,
  Smartphone,
  Layers,
  MapPin,
  Briefcase,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Artisan, User, MonetizationStatus } from '../types.ts';
import { evaluateMonetizationConditions } from '../utils/monetizationEvaluation.ts';

interface AdminMonetizationSectionProps {
  onRefresh?: () => void;
}

export const AdminMonetizationSection: React.FC<AdminMonetizationSectionProps> = ({ onRefresh }) => {
  const {
    artisans,
    users,
    socialPosts,
    showToast,
    refreshData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | MonetizationStatus>('all');
  const [expandedArtisanId, setExpandedArtisanId] = useState<number | null>(null);

  // Modal de refus avec motif obligatoire
  const [rejectingTarget, setRejectingTarget] = useState<{
    artisan?: Artisan;
    linkedUser?: User;
    artisanName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mémorisation de l'évaluation pour chaque artisan
  const evaluatedList = useMemo(() => {
    // Si aucun artisan enregistré ou très peu, s'assurer d'inclure des artisans représentatifs
    return artisans.map((artisan) => {
      // Trouver l'utilisateur lié si possible
      const linkedUser = users.find(
        (u) =>
          (artisan.email && u.email?.toLowerCase() === artisan.email.toLowerCase()) ||
          (artisan.phone && u.phone && u.phone.replace(/\s+/g, '') === artisan.phone.replace(/\s+/g, '')) ||
          (u.artisanId && u.artisanId === artisan.id)
      );

      const evaluation = evaluateMonetizationConditions(linkedUser, artisan, socialPosts);

      return {
        artisan,
        linkedUser,
        evaluation,
      };
    });
  }, [artisans, users, socialPosts]);

  // Filtrage
  const filteredList = useMemo(() => {
    return evaluatedList.filter(({ artisan, linkedUser, evaluation }) => {
      // Filtre statut
      if (filterStatus !== 'all' && evaluation.effectiveStatus !== filterStatus) {
        return false;
      }

      // Recherche texte
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = artisan.name.toLowerCase().includes(q);
      const matchTrade = artisan.trade.toLowerCase().includes(q);
      const matchCity = artisan.city.toLowerCase().includes(q);
      const matchPhone = (artisan.phone || '').toLowerCase().includes(q);
      const matchEmail = (artisan.email || '').toLowerCase().includes(q);

      return matchName || matchTrade || matchCity || matchPhone || matchEmail;
    });
  }, [evaluatedList, filterStatus, searchQuery]);

  // Compteurs
  const counts = useMemo(() => {
    return {
      all: evaluatedList.length,
      pending: evaluatedList.filter((i) => i.evaluation.effectiveStatus === 'pending_validation').length,
      active: evaluatedList.filter((i) => i.evaluation.effectiveStatus === 'active').length,
      suspended: evaluatedList.filter((i) => i.evaluation.effectiveStatus === 'suspended').length,
      in_progress: evaluatedList.filter((i) => i.evaluation.effectiveStatus === 'conditions_in_progress').length,
      non_eligible: evaluatedList.filter((i) => i.evaluation.effectiveStatus === 'non_eligible').length,
    };
  }, [evaluatedList]);

  // ACTION : ACCEPTER LA MONÉTISATION
  const handleAcceptMonetization = async (artisan: Artisan, linkedUser?: User) => {
    try {
      setIsProcessing(true);
      const now = new Date().toISOString();

      // 1. Mettre à jour l'artisan
      await api.updateArtisan(artisan.id, {
        monetization_status: 'active',
        monetization_approved_at: now,
        monetization_suspended_reason: undefined,
      });

      // 2. Mettre à jour l'utilisateur lié si trouvé
      if (linkedUser) {
        await api.updateUser(linkedUser.id, {
          monetization_status: 'active',
          monetization_approved_at: now,
          monetization_suspended_reason: undefined,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`artisanpro_monetization_pending_${linkedUser.id}`);
          localStorage.setItem(`artisanpro_monetization_active_${linkedUser.id}`, 'true');
        }
      }

      // Stocker localement pour mise à jour synchrone de la démo
      if (typeof window !== 'undefined') {
        localStorage.setItem(`artisanpro_monetization_status_artisan_${artisan.id}`, 'active');
      }

      await refreshData();
      if (onRefresh) onRefresh();

      showToast({
        title: '🟢 Monétisation active',
        desc: `🟢 Félicitations ! Votre monétisation est active. Vos contenus génèrent des revenus.`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible d’activer la monétisation',
        type: 'warning',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ACTION : CONFIRMER LE REFUS DE LA MONÉTISATION (AVEC MOTIF OBLIGATOIRE)
  const handleConfirmReject = async () => {
    if (!rejectingTarget) return;
    if (!rejectReason.trim()) {
      showToast({
        title: 'Motif obligatoire',
        desc: 'Vous devez obligatoirement préciser le motif du refus.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsProcessing(true);
      const { artisan, linkedUser } = rejectingTarget;
      const now = new Date().toISOString();

      if (artisan) {
        await api.updateArtisan(artisan.id, {
          monetization_status: 'suspended',
          monetization_suspended_reason: rejectReason.trim(),
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`artisanpro_monetization_status_artisan_${artisan.id}`, 'suspended');
          localStorage.setItem(`artisanpro_monetization_reason_artisan_${artisan.id}`, rejectReason.trim());
        }
      }

      if (linkedUser) {
        await api.updateUser(linkedUser.id, {
          monetization_status: 'suspended',
          monetization_suspended_reason: rejectReason.trim(),
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`artisanpro_monetization_pending_${linkedUser.id}`);
          localStorage.setItem(`artisanpro_monetization_status_${linkedUser.id}`, 'suspended');
          localStorage.setItem(`artisanpro_monetization_reason_${linkedUser.id}`, rejectReason.trim());
        }
      }

      await refreshData();
      if (onRefresh) onRefresh();

      showToast({
        title: '🔴 Demande refusée',
        desc: `🔴 Votre demande de monétisation a été refusée. Motif : ${rejectReason.trim()}. Vous pouvez corriger et redemander.`,
        type: 'warning',
      });

      setRejectingTarget(null);
      setRejectReason('');
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de refuser la monétisation',
        type: 'warning',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00]">
              <Coins className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900">
              Système de Validation de Monétisation
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Règle stricte ArtisanPro : Un artisan ne peut jamais s'auto-valider. Seul le Super Admin peut approuver ou refuser après contrôle complet des 13 conditions.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher un artisan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-[#FF6B00] bg-neutral-50/50"
          />
        </div>
      </div>

      {/* Barre de filtres de statut */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'all'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <span>Tous</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('pending_validation')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'pending_validation'
              ? 'bg-amber-500 text-neutral-950 shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span>🟡 Demandes de validation</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-950">
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'active'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span>🟢 Monétisation active</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-200 text-emerald-950">
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('conditions_in_progress')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'conditions_in_progress'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <span>⏳ Conditions en cours</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-200 text-blue-950">
            {counts.in_progress}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('suspended')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'suspended'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
          }`}
        >
          <span>🔴 Monétisation suspendue</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-200 text-red-950">
            {counts.suspended}
          </span>
        </button>
      </div>

      {/* Rappel des 2 règles clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-700 space-y-1">
          <div className="font-black text-neutral-900 flex items-center gap-1.5">
            <span className="text-red-600 font-bold">1. Conditions non remplies :</span>
          </div>
          <p className="text-neutral-600">
            Aucun bouton Accepter/Refuser n'apparaît. La liste des croix rouges est affichée avec le message officiel d'attente de complétion.
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
          <div className="font-black text-amber-900 flex items-center gap-1.5">
            <span className="text-amber-700 font-bold">2. Toutes conditions remplies (13/13) :</span>
          </div>
          <p className="text-amber-800">
            Affichage obligatoire des 2 boutons : <strong>[✅ ACCEPTER LA MONÉTISATION]</strong> et <strong>[❌ REFUSER LA MONÉTISATION]</strong> avec motif requis.
          </p>
        </div>
      </div>

      {/* Liste des Artisans évalués */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-200 rounded-3xl p-8 space-y-2">
          <Coins className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-sm font-bold text-neutral-700">Aucun artisan trouvé avec ce filtre</p>
          <p className="text-xs text-neutral-400">Essayez un autre mot-clé ou modifiez le filtre sélectionné.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map(({ artisan, linkedUser, evaluation }) => {
            const isExpanded = expandedArtisanId === artisan.id;
            const isEligibleForValidation = evaluation.isAllMet || evaluation.effectiveStatus === 'pending_validation';
            const isMonetizationActive = evaluation.effectiveStatus === 'active';
            const isMonetizationSuspended = evaluation.effectiveStatus === 'suspended';
            const suspendedReason =
              artisan.monetization_suspended_reason ||
              linkedUser?.monetization_suspended_reason ||
              (typeof window !== 'undefined'
                ? localStorage.getItem(`artisanpro_monetization_reason_artisan_${artisan.id}`)
                : null);

            return (
              <div
                key={artisan.id}
                className={`rounded-3xl border transition-all ${
                  isEligibleForValidation && !isMonetizationActive
                    ? 'border-2 border-amber-500 bg-amber-50/20 shadow-md'
                    : isMonetizationActive
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : isMonetizationSuspended
                    ? 'border-red-300 bg-red-50/10'
                    : 'border-neutral-200 bg-white'
                } p-5 sm:p-6 space-y-4`}
              >
                {/* En-tête de la carte de validation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Photo / Emoji */}
                    <div className="relative shrink-0">
                      {artisan.avatarUrl ? (
                        <img
                          src={artisan.avatarUrl}
                          alt={artisan.name}
                          className="w-13 h-13 rounded-2xl object-cover border border-neutral-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-2xl shadow-xs">
                          {artisan.emoji || '🛠️'}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-sm">
                        {evaluation.statusIcon}
                      </span>
                    </div>

                    {/* Données d'identité */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-neutral-900">
                          {artisan.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${evaluation.statusColorClass}`}
                        >
                          <span>{evaluation.statusIcon}</span>
                          <span>{evaluation.statusLabel}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span>{artisan.trade}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {artisan.city}, {artisan.country || 'Côte d’Ivoire'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-neutral-500">
                          <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{artisan.phone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour afficher/masquer le détail des 13 conditions */}
                  <button
                    type="button"
                    onClick={() => setExpandedArtisanId(isExpanded ? null : artisan.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>
                      {evaluation.totalMet}/13 conditions
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>
                </div>

                {/* Résumé des données clés demandées */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 text-xs">
                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Nombre de contenus</div>
                    <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>{evaluation.postsCount} publication{evaluation.postsCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Type d'abonnement</div>
                    <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{evaluation.planName}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Moyen de retrait</div>
                    <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span className="truncate">{evaluation.withdrawalMethod}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">Date de demande</div>
                    <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{evaluation.requestDateFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* 1. CAS OÙ LES CONDITIONS NE SONT PAS REMPLIES (< 13/13 et non actif) */}
                {evaluation.totalMet < 13 && !isMonetizationActive && !isMonetizationSuspended && (
                  <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-red-50/80 border-2 border-red-400">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-red-950">
                      <span className="text-base">⛔</span>
                      <span>⛔ Conditions non remplies — L'artisan doit compléter tous les éléments avant validation.</span>
                    </div>

                    {/* Liste des conditions manquantes avec une croix rouge */}
                    <div className="space-y-1.5 pl-1 pt-1">
                      <div className="text-[11px] font-bold text-red-900 uppercase tracking-wide">
                        Éléments manquants ({evaluation.missingConditions.length}) :
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-800">
                        {evaluation.missingConditions.map((missingText, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-red-900 font-bold bg-white px-3 py-2 rounded-xl border border-red-200 shadow-2xs">
                            <span className="text-red-600 font-black shrink-0">❌</span>
                            <span>{missingText}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-red-200 text-[11px] text-red-800 font-medium">
                      Règle de sécurité : Les boutons d'acceptation et de refus sont masqués tant que le dossier n'est pas intégralement complet (13/13).
                    </div>
                  </div>
                )}

                {/* CAS MONÉTISATION SUSPENDUE AVEC MOTIF DU REFUS */}
                {isMonetizationSuspended && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2 text-xs">
                    <div className="font-black text-red-900 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>🔴 Monétisation suspendue / refusée</span>
                    </div>
                    {suspendedReason && (
                      <div className="p-3 rounded-xl bg-white border border-red-200 text-red-950 font-medium">
                        <strong>Motif de refus notifié :</strong> {suspendedReason}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-neutral-500 text-[11px]">
                        L'artisan a la possibilité de corriger et de redemander plus tard.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAcceptMonetization(artisan, linkedUser)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Réactiver la monétisation
                      </button>
                    </div>
                  </div>
                )}

                {/* CAS MONÉTISATION ACTIVE */}
                {isMonetizationActive && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-black text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>🟢 Monétisation active</span>
                      </div>
                      <p className="text-emerald-800">
                        Ce compte génère des revenus sur ses réalisations et publications.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingTarget({ artisan, linkedUser, artisanName: artisan.name });
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs border border-red-200 cursor-pointer self-start sm:self-auto"
                    >
                      Suspendre en cas d'infraction
                    </button>
                  </div>
                )}

                {/* 2. CAS OÙ TOUTES LES CONDITIONS SONT BIEN REMPLIES (13/13) */}
                {evaluation.totalMet === 13 && !isMonetizationActive && !isMonetizationSuspended && (
                  <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-emerald-50/20 border-2 border-emerald-400 shadow-xs">
                    {/* Message vert obligatoire */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-black text-xs sm:text-sm flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>✅ Toutes conditions remplies (13/13) : Affichage obligatoire des 2 boutons : [✅ ACCEPTER LA MONÉTISATION] et [❌ REFUSER LA MONÉTISATION] avec motif requis.</span>
                    </div>

                    {/* Fiche complète : Nombre de contenus, Type abonnement, Moyen de retrait, Date de demande */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase">Nombre de contenus</div>
                        <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span>{evaluation.postsCount} publications</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase">Type d'abonnement</div>
                        <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{evaluation.planName}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase">Moyen de retrait</div>
                        <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                          <span className="truncate">{evaluation.withdrawalMethod}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase">Date de demande</div>
                        <div className="font-black text-neutral-900 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{evaluation.requestDateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* LES DEUX BOUTONS OBLIGATOIRES */}
                    <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                      {/* BOUTON 1 : ACCEPTER LA MONÉTISATION en limeGreen #7AC74F */}
                      <button
                        type="button"
                        onClick={() => handleAcceptMonetization(artisan, linkedUser)}
                        disabled={isProcessing}
                        className="px-6 py-3 rounded-2xl bg-[#7AC74F] hover:bg-[#6BB343] active:bg-[#5FA33A] text-[#212121] font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#212121]" />
                        <span>[✅ ACCEPTER LA MONÉTISATION]</span>
                      </button>

                      {/* BOUTON 2 : REFUSER LA MONÉTISATION */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingTarget({ artisan, linkedUser, artisanName: artisan.name });
                          setRejectReason('');
                        }}
                        disabled={isProcessing}
                        className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs sm:text-sm border border-red-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                        <span>[❌ REFUSER LA MONÉTISATION]</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ACCORDÉON DES 13 CONDITIONS DÉTAILLÉES */}
                {isExpanded && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                    <div className="font-bold text-neutral-800 mb-2">
                      Détail des 13 conditions pour {artisan.name} :
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {evaluation.conditionsDetail.map((c) => (
                        <div
                          key={c.id}
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            c.isMet
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                              : 'bg-red-50/50 border-red-200 text-red-950'
                          }`}
                        >
                          <span className="text-sm shrink-0">
                            {c.isMet ? '✅' : '❌'}
                          </span>
                          <div className="space-y-0.5">
                            <div className="font-bold text-[11px]">
                              {c.id}. {c.title}
                            </div>
                            <div className="text-[10px] text-neutral-600">
                              {c.description}
                            </div>
                            {!c.isMet && c.missingText && (
                              <div className="text-[10px] font-bold text-red-700">
                                ❌ {c.missingText}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL OBLIGATOIRE DE MOTIF DU REFUS */}
      {rejectingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black text-base">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Refuser la Monétisation</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingTarget(null)}
                className="p-1 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-700">
              <p>
                Vous êtes sur le point de refuser la demande de monétisation de :
              </p>
              <div className="p-2.5 rounded-xl bg-neutral-100 font-black text-neutral-900 text-sm">
                {rejectingTarget.artisanName}
              </div>
              <p className="font-semibold text-red-700">
                L'indication du motif est obligatoire. Ce motif sera affiché directement à l'artisan pour lui permettre de corriger son dossier.
              </p>
            </div>

            {/* Suggestions rapides de motifs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-500">
                Motifs fréquents :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Contenus non originaux ou images tierces',
                  'Profil incomplet ou informations erronées',
                  'Inactivité prolongée sur la plateforme',
                  'Activité suspecte ou statistiques artificielles',
                  'Moyen de paiement de retrait invalide',
                ].map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(m)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de texte motif */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-800">
                Motif du refus (obligatoire) :
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez à l'artisan ce qui bloque ou ce qu'il doit corriger..."
                className="w-full p-3 rounded-2xl border border-neutral-300 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Boutons d'action du modal */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingTarget(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmer le Refus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
