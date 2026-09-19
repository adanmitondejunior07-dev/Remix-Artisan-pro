import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Trash2,
  Check,
  X,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Sliders,
  Filter,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  ADMIN_13_CRITERES,
  calculateValidationScore,
  updateSupabaseUserMonetisation,
} from '../services/supabase.ts';
import type { Artisan, User, CriteresMonetisation } from '../types.ts';

interface AdminArtisansValidationTableProps {
  onRefresh?: () => void;
}

export const AdminArtisansValidationTable: React.FC<AdminArtisansValidationTableProps> = ({
  onRefresh,
}) => {
  const {
    artisans,
    users,
    deleteArtisan,
    viewProfile,
    showToast,
    refreshData,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedArtisanForModal, setSelectedArtisanForModal] = useState<{
    artisan: Artisan;
    linkedUser?: User;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Mémorisation combinée artisan + user lié + statut 13 critères
  const artisansWithCriteria = useMemo(() => {
    return artisans.map((artisan) => {
      const linkedUser = users.find(
        (u) =>
          (artisan.email && u.email && u.email.toLowerCase() === artisan.email.toLowerCase()) ||
          (artisan.phone && u.phone && u.phone.replace(/\s+/g, '') === artisan.phone.replace(/\s+/g, '')) ||
          (u.artisanId && u.artisanId === artisan.id)
      );

      // Récupérer les critères existants ou générer selon le statut actuel
      const existingCriteria: CriteresMonetisation = {
        identite_verifiee: Boolean(artisan.criteres_monetisation?.identite_verifiee ?? (artisan.verified || linkedUser?.est_verifie)),
        telephone_actif: Boolean(artisan.criteres_monetisation?.telephone_actif ?? (artisan.phone?.length >= 8)),
        localisation_precise: Boolean(artisan.criteres_monetisation?.localisation_precise ?? (artisan.city && artisan.country)),
        photo_professionnelle: Boolean(artisan.criteres_monetisation?.photo_professionnelle ?? (artisan.avatarUrl || linkedUser?.avatarUrl)),
        metier_clair: Boolean(artisan.criteres_monetisation?.metier_clair ?? (artisan.trade?.length >= 3)),
        portfolio_rempli: Boolean(artisan.criteres_monetisation?.portfolio_rempli ?? (artisan.verified || (artisan.services && artisan.services.length >= 2))),
        tarifs_indiques: Boolean(artisan.criteres_monetisation?.tarifs_indiques ?? Boolean(artisan.verified)),
        disponibilites_renseignees: Boolean(artisan.criteres_monetisation?.disponibilites_renseignees ?? true),
        casier_judiciaire: Boolean(artisan.criteres_monetisation?.casier_judiciaire ?? Boolean(artisan.verified)),
        contrat_accepte: Boolean(artisan.criteres_monetisation?.contrat_accepte ?? true),
        paiement_configure: Boolean(artisan.criteres_monetisation?.paiement_configure ?? (artisan.phone?.length >= 8)),
        test_reactivite: Boolean(artisan.criteres_monetisation?.test_reactivite ?? Boolean(artisan.verified)),
        frais_inscription: Boolean(artisan.criteres_monetisation?.frais_inscription ?? (artisan.hasPaid10k || artisan.hasPaidActivation13k || artisan.plan !== 'Free')),
        ...(artisan.criteres_monetisation || {}),
        ...(linkedUser?.criteres_monetisation || {}),
      };

      const { score, estVerifie, pct } = calculateValidationScore(existingCriteria);

      return {
        artisan,
        linkedUser,
        criteria: existingCriteria,
        score,
        estVerifie: estVerifie || Boolean(artisan.verified && score === 13),
        pct,
      };
    });
  }, [artisans, users]);

  // Filtrage liste
  const filteredList = useMemo(() => {
    return artisansWithCriteria.filter(({ artisan, score, estVerifie }) => {
      // Filtre statut
      if (filterMode === 'verified' && !estVerifie) return false;
      if (filterMode === 'pending' && estVerifie) return false;

      // Recherche
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = (artisan.name || artisan.nom || '').toLowerCase().includes(q);
      const matchTrade = (artisan.trade || '').toLowerCase().includes(q);
      const matchCity = (artisan.city || '').toLowerCase().includes(q);
      const matchPhone = (artisan.phone || artisan.telephone || '').toLowerCase().includes(q);
      const matchId = String(artisan.id).includes(q);

      return matchName || matchTrade || matchCity || matchPhone || matchId;
    });
  }, [artisansWithCriteria, filterMode, searchQuery]);

  // Statistiques globales
  const stats = useMemo(() => {
    const total = artisansWithCriteria.length;
    const verifiedCount = artisansWithCriteria.filter((item) => item.estVerifie).length;
    const pendingCount = total - verifiedCount;
    return { total, verifiedCount, pendingCount };
  }, [artisansWithCriteria]);

  // Action : Basculer un critère unique
  const handleToggleSingleCriterion = async (
    targetArtisan: Artisan,
    targetUser: User | undefined,
    criterionKey: string,
    currentCriteria: CriteresMonetisation
  ) => {
    const updatedCriteria: CriteresMonetisation = {
      ...currentCriteria,
      [criterionKey]: !currentCriteria[criterionKey as keyof CriteresMonetisation],
    };

    const { score, estVerifie } = calculateValidationScore(updatedCriteria);

    try {
      setIsSaving(true);
      await api.updateArtisanMonetisation(
        targetArtisan.id,
        targetUser?.id,
        updatedCriteria,
        score,
        estVerifie
      );

      if (targetUser?.id) {
        await updateSupabaseUserMonetisation(targetUser.id, updatedCriteria, score, estVerifie);
      }

      await refreshData();
      if (onRefresh) onRefresh();

      // Mettre à jour le modal ouvert s'il s'agit de cet artisan
      if (selectedArtisanForModal?.artisan.id === targetArtisan.id) {
        setSelectedArtisanForModal({
          artisan: {
            ...targetArtisan,
            criteres_monetisation: updatedCriteria,
            score_validation: score,
            est_verifie: estVerifie,
            verified: estVerifie,
          },
          linkedUser: targetUser ? {
            ...targetUser,
            criteres_monetisation: updatedCriteria,
            score_validation: score,
            est_verifie: estVerifie,
          } : undefined,
        });
      }

      if (estVerifie) {
        showToast({
          title: '🟢 Artisan Vérifié & Monétisé !',
          desc: `Toutes les 13 conditions sont remplies pour ${targetArtisan.name}. Badge officiel et monétisation débloqués.`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Critère mis à jour',
          desc: `${targetArtisan.name} : ${score}/13 conditions validées.`,
          type: 'info',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de mettre à jour le critère',
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Action rapide : Valider tous les 13 critères (Certifier & Monétiser)
  const handleValidateAll13 = async (targetArtisan: Artisan, targetUser?: User) => {
    const allValid: CriteresMonetisation = {
      identite_verifiee: true,
      telephone_actif: true,
      localisation_precise: true,
      photo_professionnelle: true,
      metier_clair: true,
      portfolio_rempli: true,
      tarifs_indiques: true,
      disponibilites_renseignees: true,
      casier_judiciaire: true,
      contrat_accepte: true,
      paiement_configure: true,
      test_reactivite: true,
      frais_inscription: true,
    };

    try {
      setIsSaving(true);
      await api.updateArtisanMonetisation(
        targetArtisan.id,
        targetUser?.id,
        allValid,
        13,
        true
      );

      if (targetUser?.id) {
        await updateSupabaseUserMonetisation(targetUser.id, allValid, 13, true);
      }

      await refreshData();
      if (onRefresh) onRefresh();

      if (selectedArtisanForModal?.artisan.id === targetArtisan.id) {
        setSelectedArtisanForModal({
          artisan: {
            ...targetArtisan,
            criteres_monetisation: allValid,
            score_validation: 13,
            est_verifie: true,
            verified: true,
          },
          linkedUser: targetUser ? {
            ...targetUser,
            criteres_monetisation: allValid,
            score_validation: 13,
            est_verifie: true,
          } : undefined,
        });
      }

      showToast({
        title: '🟢 13/13 Validé avec Succès !',
        desc: `${targetArtisan.name} est désormais certifié "Vérifié & Monétisé".`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de certifier cet artisan',
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Action rapide : Réinitialiser à 0/13
  const handleResetAllCriteria = async (targetArtisan: Artisan, targetUser?: User) => {
    const resetCriteria: CriteresMonetisation = {
      identite_verifiee: false,
      telephone_actif: false,
      localisation_precise: false,
      photo_professionnelle: false,
      metier_clair: false,
      portfolio_rempli: false,
      tarifs_indiques: false,
      disponibilites_renseignees: false,
      casier_judiciaire: false,
      contrat_accepte: false,
      paiement_configure: false,
      test_reactivite: false,
      frais_inscription: false,
    };

    try {
      setIsSaving(true);
      await api.updateArtisanMonetisation(
        targetArtisan.id,
        targetUser?.id,
        resetCriteria,
        0,
        false
      );

      if (targetUser?.id) {
        await updateSupabaseUserMonetisation(targetUser.id, resetCriteria, 0, false);
      }

      await refreshData();
      if (onRefresh) onRefresh();

      if (selectedArtisanForModal?.artisan.id === targetArtisan.id) {
        setSelectedArtisanForModal({
          artisan: {
            ...targetArtisan,
            criteres_monetisation: resetCriteria,
            score_validation: 0,
            est_verifie: false,
            verified: false,
          },
          linkedUser: targetUser ? {
            ...targetUser,
            criteres_monetisation: resetCriteria,
            score_validation: 0,
            est_verifie: false,
          } : undefined,
        });
      }

      showToast({
        title: 'Critères réinitialisés',
        desc: `Statut vérifié & monétisé retiré pour ${targetArtisan.name}.`,
        type: 'info',
      });
    } catch (err: any) {
      showToast({
        title: 'Erreur',
        desc: err.message || 'Impossible de réinitialiser les critères',
        type: 'warning',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* En-tête et Directives */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 flex items-center gap-2">
                Tableau de Bord Admin : Validation des 13 Critères
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 font-bold">
                  {stats.total} artisans
                </span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Règle stricte de monétisation : L'artisan obtient le statut <strong>"Vérifié & Monétisé"</strong> uniquement lorsque les <strong>13 conditions</strong> sont validées à true par l'administrateur.
              </p>
            </div>
          </div>
        </div>

        {/* Compteurs de Synthèse */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Vérifiés & Monétisés (13/13) :</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black">
              {stats.verifiedCount}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>En attente (&lt;13/13) :</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-neutral-950 font-black">
              {stats.pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Vérifiés & Monétisés ({stats.verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'pending'
                ? 'bg-amber-500 text-neutral-950 font-black'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            En cours / En attente ({stats.pendingCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, métier, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-[#FF6B00] bg-neutral-50/50"
          />
        </div>
      </div>

      {/* TABLEAU PRINCIPAL DES ARTISANS ET LEURS 13 CRITÈRES */}
      <div className="overflow-x-auto border border-neutral-200 rounded-2xl">
        <table className="w-full text-left text-xs text-neutral-700">
          <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-400 border-b border-neutral-200">
            <tr>
              <th className="py-3.5 px-3.5">Artisan</th>
              <th className="py-3.5 px-3.5">Métier & Zone</th>
              <th className="py-3.5 px-3.5">Téléphone</th>
              <th className="py-3.5 px-3.5">Score 13 Critères</th>
              <th className="py-3.5 px-3.5">Statut Monétisation</th>
              <th className="py-3.5 px-3.5 text-right">Actions de Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredList.length > 0 ? (
              filteredList.map(({ artisan, linkedUser, criteria, score, estVerifie, pct }) => {
                const avatar = artisan.avatarUrl || linkedUser?.avatarUrl || (artisan as any).photoUrl;

                return (
                  <tr
                    key={artisan.id}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      estVerifie ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    {/* Artisan */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0 flex items-center justify-center font-bold text-sm">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={artisan.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>{artisan.emoji || '👤'}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => viewProfile({ artisanId: artisan.id, name: artisan.name })}
                              className="hover:text-[#FF6B00] hover:underline cursor-pointer text-left"
                            >
                              {artisan.name}
                            </button>
                            {estVerifie && (
                              <span title="Vérifié & Monétisé">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            ID: {artisan.id} {linkedUser ? `• User: ${linkedUser.id.substring(0, 8)}...` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Métier & Zone */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-800">{artisan.trade}</div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
                        <span>{artisan.city || 'Abidjan'}, {artisan.country || 'Côte d’Ivoire'}</span>
                      </div>
                    </td>

                    {/* Téléphone */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-mono text-neutral-800 font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{artisan.phone || 'Non renseigné'}</span>
                        {artisan.phone && (
                          <a
                            href={`https://wa.me/${artisan.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 ml-1"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Score 13 Critères */}
                    <td className="py-3 px-3.5">
                      <div className="space-y-1.5 w-36">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-neutral-900 font-mono">
                            {score} / 13
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              estVerifie ? 'text-emerald-700' : 'text-neutral-500'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                          <div
                            className={`h-full transition-all duration-300 ${
                              estVerifie
                                ? 'bg-emerald-500'
                                : score >= 8
                                ? 'bg-amber-500'
                                : 'bg-neutral-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Statut Monétisation */}
                    <td className="py-3 px-3.5">
                      {estVerifie ? (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Vérifié & Monétisé</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>En attente ({13 - score} manquant{13 - score > 1 ? 's' : ''})</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Bouton pour ouvrir le gestionnaire des 13 cases à cocher */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedArtisanForModal({
                              artisan,
                              linkedUser,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-[#FF6B00] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="Ouvrir la liste des 13 conditions"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>13 Critères</span>
                        </button>

                        {/* Raccourci Tout Valider 13/13 */}
                        {!estVerifie && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleValidateAll13(artisan, linkedUser)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Valider immédiatement les 13 critères"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Certifier</span>
                          </button>
                        )}

                        {/* Raccourci Réinitialiser */}
                        {estVerifie && (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleResetAllCriteria(artisan, linkedUser)}
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Réinitialiser les 13 critères"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => viewProfile({ artisanId: artisan.id, name: artisan.name })}
                          className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                          title="Voir profil public"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Supprimer définitivement l'artisan ${artisan.name} ?`)) {
                              await deleteArtisan(artisan.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                          title="Supprimer l'artisan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">
                  Aucun artisan ne correspond aux filtres de recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL / DRAWER INTERACTIF DES 13 CASES À COCHER          */}
      {/* ========================================================= */}
      {selectedArtisanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0 flex items-center justify-center text-xl font-bold">
                  {selectedArtisanForModal.artisan.avatarUrl ? (
                    <img
                      src={selectedArtisanForModal.artisan.avatarUrl}
                      alt={selectedArtisanForModal.artisan.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{selectedArtisanForModal.artisan.emoji || '👤'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-neutral-900">
                      Validation & Certification : {selectedArtisanForModal.artisan.name}
                    </h3>
                    {selectedArtisanForModal.artisan.verified && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Vérifié & Monétisé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {selectedArtisanForModal.artisan.trade} • {selectedArtisanForModal.artisan.city} • Tél : {selectedArtisanForModal.artisan.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArtisanForModal(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barre de Progression Modal */}
            {(() => {
              const currentScore = calculateValidationScore(selectedArtisanForModal.artisan.criteres_monetisation);
              return (
                <div className="px-6 py-3.5 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-neutral-900 flex items-center gap-2">
                      <span>Progression :</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white border border-neutral-300 font-mono text-[#FF6B00]">
                        {currentScore.score} / 13
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({currentScore.pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleValidateAll13(
                          selectedArtisanForModal.artisan,
                          selectedArtisanForModal.linkedUser
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tout valider (13/13)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleResetAllCriteria(
                          selectedArtisanForModal.artisan,
                          selectedArtisanForModal.linkedUser
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tout décocher</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Corps défilable des 13 conditions */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-neutral-500 mb-2">
                Cochez ou décochez les conditions vérifiées. Chaque case sauvegardera instantanément la mise à jour dans la base de données.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ADMIN_13_CRITERES.map((c) => {
                  const currentObj = selectedArtisanForModal.artisan.criteres_monetisation || {};
                  const isChecked = Boolean(currentObj[c.key as keyof CriteresMonetisation]);

                  return (
                    <div
                      key={c.key}
                      onClick={() =>
                        handleToggleSingleCriterion(
                          selectedArtisanForModal.artisan,
                          selectedArtisanForModal.linkedUser,
                          c.key,
                          currentObj
                        )
                      }
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 hover:bg-emerald-50'
                          : 'bg-neutral-50/50 border-neutral-200 text-neutral-700 hover:bg-neutral-100/60'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-neutral-300 bg-white hover:border-[#FF6B00]" />
                        )}
                      </div>

                      {/* Description du critère */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-[#FF6B00] font-black">
                              #{c.num}
                            </span>
                            <span>{c.title}</span>
                          </span>
                          {isChecked ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-200 text-emerald-900">
                              Validé
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-200 text-neutral-600">
                              À vérifier
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {c.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="text-xs text-neutral-500">
                {selectedArtisanForModal.artisan.verified ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Statut actuel : Vérifié & Monétisé (13/13)
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Statut actuel : En attente de validation complète
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedArtisanForModal(null)}
                className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
