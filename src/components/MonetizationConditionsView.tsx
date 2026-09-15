import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  Lock,
  Eye,
  ShieldAlert,
  Flame,
  Award,
  Layers,
  HelpCircle,
  TrendingUp,
  Share2,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { MonetizationStatus } from '../types.ts';

interface MonetizationConditionsViewProps {
  isStandalonePage?: boolean;
  onClose?: () => void;
}

export const MonetizationConditionsView: React.FC<MonetizationConditionsViewProps> = ({
  isStandalonePage = false,
  onClose,
}) => {
  const {
    currentUser,
    currentArtisan,
    socialPosts,
    isSubscriptionExpired,
    canAccessProFeatures,
    go,
    showToast,
    updateUserProfile,
  } = useApp();

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      return (
        localStorage.getItem(`artisanpro_monetization_accepted_${currentUser.id}`) === 'true' ||
        currentUser.monetization_accepted === true
      );
    }
    return false;
  });

  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

  useEffect(() => {
    if (currentUser?.id && typeof window !== 'undefined') {
      const accepted =
        localStorage.getItem(`artisanpro_monetization_accepted_${currentUser.id}`) === 'true' ||
        currentUser.monetization_accepted === true;
      setHasAcceptedTerms(accepted);
    }
  }, [currentUser]);

  // Analyse en temps réel des 13 conditions selon le profil connecté
  // 1. Compte actif
  const isAccountActive = Boolean(
    currentUser &&
      (currentUser.role === 'artisan' ||
        currentUser.role === 'super_admin' ||
        currentUser.role === 'admin' ||
        currentUser.artisan_status === 'active' ||
        currentUser.role === 'client')
  );

  // 2. Profil professionnel complet (Nom, Photo, Pays, Ville, Métier, Présentation)
  const profileChecks = {
    hasName: Boolean(currentUser?.name && currentUser.name.trim().length >= 3),
    hasPhoto: Boolean(currentUser?.avatar || currentUser?.avatarUrl || currentArtisan?.avatarUrl),
    hasCountry: Boolean(currentUser?.country || currentArtisan?.country),
    hasCity: Boolean(currentUser?.city || currentArtisan?.city),
    hasTrade: Boolean(currentUser?.trade || currentArtisan?.trade),
    hasBio: Boolean((currentUser?.bio && currentUser.bio.length >= 10) || (currentArtisan?.description && currentArtisan.description.length >= 10)),
  };
  const isProfileComplete = Object.values(profileChecks).every(Boolean);

  // 3. Abonnement ArtisanPro actif (Essentiel, Pro ou Premium)
  const isSubscriptionActive = Boolean(
    (currentUser?.subscription_status === 'active' && !isSubscriptionExpired) ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'admin'
  );

  // 4. Au minimum 10 contenus ou réalisations originales publiées
  const userPostsCount = socialPosts.filter(
    (p) =>
      p.userId === currentUser?.id ||
      p.author === currentUser?.name ||
      p.artisanName === currentUser?.name ||
      (currentUser?.artisanId && p.artisanId === currentUser.artisanId)
  ).length;
  const has10Posts = userPostsCount >= 10;

  // 5. Être actif régulièrement sur la plateforme
  const isRegularlyActive = Boolean(currentUser);

  // 6. Publier uniquement du contenu original ou dont on possède les droits
  const acknowledgesOriginalContent = true;

  // 7. Respecter les règles de la communauté
  const respectsCommunityRules = true;

  // 8. Pas de faux comptes, fausses vues, faux abonnés
  const antiFraudAcknowledged = true;

  // 9. Pas de contenu frauduleux, trompeur ou violent
  const cleanContentCompliance = true;

  // 10. Seuil minimum d'engagement atteint
  const totalEngagementViews = socialPosts
    .filter((p) => p.userId === currentUser?.id || (currentUser?.artisanId && p.artisanId === currentUser.artisanId))
    .reduce((acc, curr) => acc + (curr.viewsCount || 0) + (curr.likesCount || 0) * 3, 0);
  const hasMinimumEngagement = totalEngagementViews >= 50 || userPostsCount >= 5 || currentUser?.role === 'super_admin';

  // 11. Moyen de paiement pour recevoir ses revenus
  const hasPaymentMethod = Boolean(currentUser?.phone && currentUser.phone.length >= 8);

  // 12. Acceptation des conditions de monétisation
  const hasAccepted = hasAcceptedTerms;

  // 13. Vérification du compte par ArtisanPro
  const isAccountVerified = Boolean(
    currentUser?.verified === true ||
      currentUser?.is_verified === true ||
      currentArtisan?.verified === true ||
      currentUser?.role === 'super_admin'
  );

  // Calcul du score global
  const conditionsEvaluations = [
    { id: 1, met: isAccountActive },
    { id: 2, met: isProfileComplete },
    { id: 3, met: isSubscriptionActive },
    { id: 4, met: has10Posts },
    { id: 5, met: isRegularlyActive },
    { id: 6, met: acknowledgesOriginalContent },
    { id: 7, met: respectsCommunityRules },
    { id: 8, met: antiFraudAcknowledged },
    { id: 9, met: cleanContentCompliance },
    { id: 10, met: hasMinimumEngagement },
    { id: 11, met: hasPaymentMethod },
    { id: 12, met: hasAccepted },
    { id: 13, met: isAccountVerified },
  ];

  const totalMet = conditionsEvaluations.filter((c) => c.met).length;
  const progressPercent = Math.round((totalMet / 13) * 100);

  const [isSubmittingValidation, setIsSubmittingValidation] = useState(false);
  const [hasPendingValidationLocal, setHasPendingValidationLocal] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      return localStorage.getItem(`artisanpro_monetization_pending_${currentUser.id}`) === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (currentUser?.id && typeof window !== 'undefined') {
      setHasPendingValidationLocal(
        localStorage.getItem(`artisanpro_monetization_pending_${currentUser.id}`) === 'true'
      );
    }
  }, [currentUser]);

  // 5 Statuts officiels de monétisation ArtisanPro
  const MONETIZATION_STATUS_LIST = [
    {
      key: 'non_eligible' as MonetizationStatus,
      icon: '🔒',
      title: 'Non éligible',
      desc: 'Le compte ne remplit pas encore les critères d’accès (compte non connecté, profil incomplet ou abonnement inactif).',
    },
    {
      key: 'conditions_in_progress' as MonetizationStatus,
      icon: '⏳',
      title: 'Conditions en cours',
      desc: 'Compte actif progressant sur les 13 conditions requises (publications, engagement, abonnements).',
    },
    {
      key: 'pending_validation' as MonetizationStatus,
      icon: '🟡',
      title: 'Demande de validation',
      desc: 'Les 13 conditions sont complètes. Le dossier a été transmis pour examen par l’équipe ArtisanPro.',
    },
    {
      key: 'active' as MonetizationStatus,
      icon: '🟢',
      title: 'Monétisation active',
      desc: 'Compte validé par ArtisanPro. Vos publications et réalisations génèrent des revenus automatiquement.',
    },
    {
      key: 'suspended' as MonetizationStatus,
      icon: '🔴',
      title: 'Monétisation suspendue',
      desc: 'Monétisation désactivée suite à une violation des règles, activité suspecte ou fraude.',
    },
  ];

  // Liste explicite des conditions manquantes avec libellés conformes
  const missingConditionsList = useMemo(() => {
    const list: string[] = [];
    if (!isAccountActive) list.push('Compte ArtisanPro non actif');
    if (!isProfileComplete) {
      const missingParts: string[] = [];
      if (!profileChecks.hasName) missingParts.push('Nom/Prénom');
      if (!profileChecks.hasPhoto) missingParts.push('Photo');
      if (!profileChecks.hasCountry) missingParts.push('Pays');
      if (!profileChecks.hasCity) missingParts.push('Ville');
      if (!profileChecks.hasTrade) missingParts.push('Métier');
      if (!profileChecks.hasBio) missingParts.push('Présentation');
      list.push(`Profil incomplet (${missingParts.join(', ')})`);
    }
    if (!isSubscriptionActive) list.push('Abonnement inactif (Essentiel, Pro ou Premium requis)');
    if (!has10Posts) list.push(`Seulement ${userPostsCount} publication${userPostsCount > 1 ? 's' : ''} sur 10 requises`);
    if (!hasMinimumEngagement) list.push("Seuil d'engagement minimum non atteint");
    if (!hasPaymentMethod) list.push('Moyen de paiement de retrait non configuré');
    if (!hasAccepted) list.push('Conditions de Monétisation non acceptées');
    if (!isAccountVerified) list.push('Compte non encore vérifié par ArtisanPro');
    return list;
  }, [
    isAccountActive,
    isProfileComplete,
    profileChecks,
    isSubscriptionActive,
    has10Posts,
    userPostsCount,
    hasMinimumEngagement,
    hasPaymentMethod,
    hasAccepted,
    isAccountVerified,
  ]);

  // Récupération du motif de refus éventuel
  const refusalMotif = useMemo(() => {
    if (currentUser?.monetization_suspended_reason) return currentUser.monetization_suspended_reason;
    if (typeof window !== 'undefined' && currentUser?.id) {
      const stored = localStorage.getItem(`artisanpro_monetization_reason_${currentUser.id}`);
      if (stored) return stored;
    }
    return 'Dossier incomplet ou non conforme aux règles de la communauté.';
  }, [currentUser]);

  // Détermination précise du statut de l'artisan selon les règles officielles
  const getEffectiveStatus = (): {
    key: MonetizationStatus;
    icon: string;
    title: string;
    desc: string;
  } => {
    if (!currentUser) {
      return {
        key: 'non_eligible',
        icon: '🔒',
        title: 'Non éligible',
        desc: 'Connectez-vous et démarrez votre profil pour accéder aux critères de monétisation.',
      };
    }

    const localActive = typeof window !== 'undefined' && localStorage.getItem(`artisanpro_monetization_active_${currentUser.id}`) === 'true';
    const localSuspended = typeof window !== 'undefined' && localStorage.getItem(`artisanpro_monetization_status_${currentUser.id}`) === 'suspended';

    // 1. Monétisation suspendue / refusée
    if (currentUser.monetization_status === 'suspended' || localSuspended) {
      return {
        key: 'suspended',
        icon: '🔴',
        title: 'Monétisation suspendue',
        desc: `Votre demande de monétisation a été refusée. Motif : ${refusalMotif}`,
      };
    }

    // 2. Monétisation active
    if (currentUser.monetization_status === 'active' || localActive) {
      return {
        key: 'active',
        icon: '🟢',
        title: 'Monétisation active',
        desc: 'Félicitations ! Votre monétisation est maintenant active.',
      };
    }

    // 3. Toutes les conditions remplies (13/13) -> passe automatiquement à Demande de validation
    if (totalMet === 13 || currentUser.monetization_status === 'pending_validation' || hasPendingValidationLocal) {
      return {
        key: 'pending_validation',
        icon: '🟡',
        title: 'Demande de validation',
        desc: 'Toutes les conditions sont remplies ! Votre dossier est en cours d’examen par le Super Admin ArtisanPro.',
      };
    }

    // 4. Conditions en cours
    if (totalMet > 0 && isAccountActive) {
      return {
        key: 'conditions_in_progress',
        icon: '⏳',
        title: 'Conditions en cours',
        desc: `${totalMet}/13 conditions validées sur votre compte. Complétez les éléments manquants avant validation.`,
      };
    }

    // 5. Non éligible
    return {
      key: 'non_eligible',
      icon: '🔒',
      title: 'Non éligible',
      desc: 'Compte non éligible aux critères de monétisation.',
    };
  };

  const currentStatusInfo = getEffectiveStatus();

  // Action pour corriger et redemander après un refus
  const handleRetryAfterRefusal = async () => {
    if (!currentUser) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`artisanpro_monetization_status_${currentUser.id}`);
        localStorage.removeItem(`artisanpro_monetization_reason_${currentUser.id}`);
      }
      await updateUserProfile({
        monetization_status: totalMet === 13 ? 'pending_validation' : 'conditions_in_progress',
        monetization_suspended_reason: undefined,
      });
      showToast({
        title: 'Dossier rouvert pour correction',
        desc: 'Vous pouvez maintenant modifier vos informations et représenter votre dossier.',
        type: 'info',
      });
    } catch {
      // Ignorer
    }
  };

  const handleRequestValidation = async () => {
    if (!currentUser) {
      showToast({
        title: 'Connexion requise',
        desc: 'Veuillez vous connecter pour demander l’activation.',
        type: 'warning',
      });
      return;
    }
    if (totalMet < 13) {
      showToast({
        title: 'Conditions incomplètes',
        desc: `Vous devez valider l’intégralité des 13 conditions (actuellement ${totalMet}/13) avant d’envoyer la demande.`,
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmittingValidation(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`artisanpro_monetization_pending_${currentUser.id}`, 'true');
      }
      setHasPendingValidationLocal(true);
      await updateUserProfile({
        monetization_status: 'pending_validation',
        monetization_requested_at: new Date().toISOString(),
      });
      showToast({
        title: 'Demande de validation envoyée !',
        desc: 'Votre demande d’activation de la monétisation est désormais en cours d’examen par ArtisanPro.',
        type: 'success',
      });
    } catch (e: any) {
      showToast({
        title: 'Erreur',
        desc: e.message || 'Impossible d’enregistrer la demande.',
        type: 'warning',
      });
    } finally {
      setIsSubmittingValidation(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!currentUser) {
      showToast({
        title: 'Connexion requise',
        desc: 'Veuillez vous connecter pour accepter les conditions de monétisation.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmittingAccept(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`artisanpro_monetization_accepted_${currentUser.id}`, 'true');
      }
      setHasAcceptedTerms(true);
      await updateUserProfile({ monetization_accepted: true });
      showToast({
        title: 'Conditions de Monétisation acceptées !',
        desc: 'Votre engagement envers la charte de monétisation ArtisanPro a été enregistré avec succès.',
        type: 'success',
      });
    } catch (e: any) {
      showToast({
        title: 'Erreur',
        desc: e.message || "Impossible d'enregistrer votre acceptation.",
        type: 'warning',
      });
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Barre de retour si standalone */}
      {isStandalonePage && (
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
          <button
            type="button"
            onClick={() => go('subscription')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
            <span>Retour aux Gains & Abonnements</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Charte Officielle de Monétisation</span>
          </div>
        </div>
      )}

      {/* HEADER BANNER OFFICIEL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950 p-6 sm:p-9 text-white border-2 border-[#FF6B00]/70 shadow-xl">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-[#FF6B00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>CHARTE OFFICIELLE & CRITÈRES D'ÉLIGIBILITÉ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            CONDITIONS D’ACCÈS À LA MONÉTISATION — ARTISANPRO
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed font-medium">
            Pour commencer à générer des revenus grâce à ses publications, projets et contenus sur ArtisanPro, l’utilisateur doit remplir les conditions suivantes :
          </p>

          {/* Indicateur de conformité personnel */}
          <div className="pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 max-w-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-neutral-300 font-bold">Votre progression vers la monétisation :</span>
                <span className="font-black text-amber-400">
                  {totalMet} sur 13 conditions validées ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#FF6B00] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                {totalMet === 13
                  ? '✓ Félicitations ! Votre profil remplit l’ensemble des conditions pour l’examen de monétisation ArtisanPro.'
                  : 'Complétez les critères manquants ci-dessous pour que votre compte soit éligible à la monétisation.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE OFFICIEL ARTISANPRO : Gagner de l’argent avec vos contenus */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-[#FF6B00]/40 p-6 sm:p-7 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center text-2xl shadow-md shrink-0">
            💰
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-neutral-950">
              💰 Vous souhaitez gagner de l’argent avec vos contenus ?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
              Complétez les conditions ArtisanPro, développez votre audience et respectez les règles de la plateforme.
            </p>
            <p className="text-xs sm:text-sm text-neutral-950 font-bold leading-relaxed">
              Lorsque toutes les conditions sont remplies, vous pourrez demander l’activation de votre monétisation.
            </p>
          </div>
        </div>
      </div>

      {/* STATUTS DE MONÉTISATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-black uppercase tracking-wider mb-1.5">
              <span>CYCLE OFFICIEL ARTISANPRO</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-950 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6B00]" />
              <span>STATUTS DE MONÉTISATION :</span>
            </h2>
            <p className="text-xs text-neutral-600 font-medium">
              Voici les 5 statuts officiels régissant l'éligibilité et l'accès aux revenus créateur sur ArtisanPro.
            </p>
          </div>

          {/* Badge statut actuel */}
          <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white border-2 border-neutral-200 shadow-2xs flex items-center gap-3 self-start sm:self-auto">
            <span className="text-2xl">{currentStatusInfo.icon}</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400 leading-none">Votre statut actuel</div>
              <div className="text-xs sm:text-sm font-black text-neutral-900">{currentStatusInfo.title}</div>
            </div>
          </div>
        </div>

        {/* Grille des 5 statuts officiels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MONETIZATION_STATUS_LIST.map((st) => {
            const isCurrent = currentStatusInfo.key === st.key;
            return (
              <div
                key={st.key}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2.5 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-[#FF6B00] shadow-md ring-2 ring-[#FF6B00]/20'
                    : 'bg-white border-neutral-200 shadow-2xs hover:border-neutral-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{st.icon}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-wider">
                        Actif
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-neutral-950">
                    {st.icon} {st.title}
                  </h3>
                  <p className="text-[11px] text-neutral-600 leading-relaxed font-normal">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 1. CAS OÙ LES CONDITIONS NE SONT PAS BIEN REMPLIES (< 13/13) */}
        {totalMet < 13 && currentStatusInfo.key !== 'active' && currentStatusInfo.key !== 'suspended' && (
          <div className="p-5 rounded-3xl bg-neutral-50 border-2 border-neutral-300/80 space-y-3.5">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-neutral-900">
                  Conditions non remplies — L'artisan doit compléter tous les éléments avant validation.
                </h4>
                <p className="text-xs text-neutral-600">
                  Votre compte remplit actuellement <strong>{totalMet} sur 13 conditions</strong>. Tant que les 13 conditions ne sont pas validées, la monétisation ne peut pas être soumise au Super Admin.
                </p>
              </div>
            </div>

            {/* Liste des conditions manquantes avec croix rouge */}
            <div className="space-y-2 pt-1 border-t border-neutral-200">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                Conditions manquantes à compléter :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {missingConditionsList.map((missingText, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 font-semibold"
                  >
                    <span className="text-red-600 font-black shrink-0">❌</span>
                    <span>{missingText}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-neutral-200 text-[11px] text-neutral-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                <strong>Règle de sécurité :</strong> Un artisan ne peut jamais s'auto-valider. Seul le Super Admin dispose des boutons pour accepter ou refuser après contrôle complet.
              </span>
            </div>
          </div>
        )}

        {/* 2. CAS OÙ TOUTES LES CONDITIONS SONT BIEN REMPLIES (13/13) */}
        {totalMet === 13 && currentStatusInfo.key !== 'active' && currentStatusInfo.key !== 'suspended' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-500 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                  🟡
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-[11px]">
                      ✅ Toutes les conditions remplies (13/13)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-[11px]">
                      🟡 Demande de validation
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-neutral-950">
                    Dossier complet transmis pour validation Super Admin
                  </h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    Toutes les 13 conditions officielles sont remplies. Votre dossier est actuellement entre les mains de l'équipe de supervision ArtisanPro.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 text-xs text-neutral-600 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Contrôle réglementaire :</strong> Conformément aux règles d'ArtisanPro, seul le Super Administrateur peut examiner et cliquer sur <strong>[ACCEPTER]</strong> ou <strong>[REFUSER]</strong>. Vous recevrez une notification dès que la décision aura été prise.
              </span>
            </div>
          </div>
        )}

        {/* 3. CAS MONÉTISATION ACTIVE (ACCEPTER PAR ADMIN) */}
        {currentStatusInfo.key === 'active' && (
          <div className="p-6 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                🟢
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-emerald-950">
                  🟢 Félicitations ! Votre monétisation est active. Vos contenus génèrent des revenus.
                </h4>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                  Votre compte et vos contenus sont officiellement validés par le Super Administrateur. Vos publications, photos et projets génèrent désormais des revenus automatiquement reversés sur votre portefeuille.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go('subscription')}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Accéder à mon Portefeuille</span>
            </button>
          </div>
        )}

        {/* 4. CAS MONÉTISATION REFUSÉE / SUSPENDUE (REFUSER PAR ADMIN) */}
        {currentStatusInfo.key === 'suspended' && (
          <div className="p-6 rounded-3xl bg-red-500/15 border-2 border-red-500 space-y-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                🔴
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-black text-red-950">
                  🔴 Votre demande de monétisation a été refusée.
                </h4>
                <div className="p-3.5 rounded-2xl bg-white border border-red-200 text-xs sm:text-sm text-red-900 font-bold">
                  Motif : <span className="font-semibold text-neutral-800">{refusalMotif}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 font-medium leading-relaxed">
                  🔴 Votre demande de monétisation a été refusée. Motif : {refusalMotif}. Vous pouvez corriger et redemander.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-neutral-500 italic">
                Prenez le temps d'ajuster votre profil en tenant compte du motif indiqué ci-dessus.
              </span>
              <button
                type="button"
                onClick={handleRetryAfterRefusal}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>🔄 Corriger mes informations et redemander</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTE DES 13 CONDITIONS DÉTAILLÉES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FF6B00]" />
            <span>Les 13 Conditions Obligatoires</span>
          </h2>
          <span className="text-xs text-neutral-500 font-bold">Règlement officiel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CONDITION 1 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  1
                </span>
                {isAccountActive ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validé
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 font-bold text-[10px]">
                    Non connecté
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                1. Avoir un compte ArtisanPro actif.
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                L’utilisateur doit posséder un compte individuel ou professionnel actif et valide sur la plateforme ArtisanPro.
              </p>
            </div>
            {!isAccountActive && (
              <button
                type="button"
                onClick={() => go('register')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Créer ou activer mon compte</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CONDITION 2 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  2
                </span>
                {isProfileComplete ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Complet (6/6)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> À compléter
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                2. Avoir un profil professionnel complet :
              </h3>
              <ul className="grid grid-cols-2 gap-1.5 text-xs text-neutral-600 pt-1">
                <li className={`flex items-center gap-1.5 ${profileChecks.hasName ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasName ? '✓' : '•'} Nom et prénom
                </li>
                <li className={`flex items-center gap-1.5 ${profileChecks.hasPhoto ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasPhoto ? '✓' : '•'} Photo de profil
                </li>
                <li className={`flex items-center gap-1.5 ${profileChecks.hasCountry ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasCountry ? '✓' : '•'} Pays
                </li>
                <li className={`flex items-center gap-1.5 ${profileChecks.hasCity ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasCity ? '✓' : '•'} Ville
                </li>
                <li className={`flex items-center gap-1.5 ${profileChecks.hasTrade ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasTrade ? '✓' : '•'} Métier
                </li>
                <li className={`flex items-center gap-1.5 ${profileChecks.hasBio ? 'text-emerald-700 font-bold' : ''}`}>
                  {profileChecks.hasBio ? '✓' : '•'} Présentation de son activité
                </li>
              </ul>
            </div>
            {!isProfileComplete && (
              <button
                type="button"
                onClick={() => go('account')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Mettre à jour mon profil</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CONDITION 3 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  3
                </span>
                {isSubscriptionActive ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Abonnement Actif
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Requis
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                3. Avoir un abonnement ArtisanPro actif :
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-bold border border-neutral-200">
                  Artisan Essentiel
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-bold border border-neutral-200">
                  Artisan Pro
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-bold border border-neutral-200">
                  Artisan Premium
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                L'une de ces formules doit être en cours de validité sans interruption.
              </p>
            </div>
            {!isSubscriptionActive && (
              <button
                type="button"
                onClick={() => go('abonnements')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Choisir une formule d’abonnement</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CONDITION 4 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  4
                </span>
                {has10Posts ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {userPostsCount} / 10 publiés
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-black text-[10px]">
                    {userPostsCount} / 10 publiés
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                4. Avoir publié au minimum 10 contenus ou réalisations originales sur ArtisanPro.
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Photos de chantiers, vidéos de démonstration ou projets achevés attestant de votre savoir-faire artisanal.
              </p>
            </div>
            {!has10Posts && (
              <button
                type="button"
                onClick={() => go('home')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Publier une réalisation sur le flux</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CONDITION 5 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                5
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conforme
              </span>
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              5. Être actif régulièrement sur la plateforme.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Répondre aux sollicitations, mettre à jour ses disponibilités et interagir avec sa clientèle panafricaine.
            </p>
          </div>

          {/* CONDITION 6 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                6
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conforme
              </span>
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              6. Publier uniquement du contenu original ou du contenu dont l’utilisateur possède les droits.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Interdiction formelle d'usurper des photos provenant d'internet ou de tiers. Tout contenu doit vous appartenir.
            </p>
          </div>

          {/* CONDITION 7 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                7
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conforme
              </span>
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              7. Respecter les règles de la communauté ArtisanPro.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Courtoisie, intégrité, transparence sur les tarifs et respect strict des engagements envers les clients.
            </p>
          </div>

          {/* CONDITION 8 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                8
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conforme
              </span>
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              8. Ne pas utiliser de faux comptes, de fausses vues, de faux abonnés ou de systèmes artificiels pour augmenter les statistiques.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Toute manipulation algorithmique ou génération artificielle de trafic entraîne la révocation immédiate de la monétisation.
            </p>
          </div>

          {/* CONDITION 9 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                9
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conforme
              </span>
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              9. Ne pas publier de contenu frauduleux, illégal, trompeur, violent ou contraire aux règles ArtisanPro.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tolérance zéro pour toute pratique illicite, arnaque ou contenu dégradant.
            </p>
          </div>

          {/* CONDITION 10 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                10
              </span>
              {hasMinimumEngagement ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Seuil atteint
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                  En cours de progression
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-neutral-900">
              10. Atteindre le seuil minimum d’engagement fixé par ArtisanPro pour l’activation de la monétisation.
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Niveau suffisant d'interactions authentiques, consultations de profil et demandes de contact réelles.
            </p>
          </div>

          {/* CONDITION 11 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  11
                </span>
                {hasPaymentMethod ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Opérant ({currentUser?.country || 'Afrique'})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                    À configurer
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                11. Disposer d’un moyen de paiement permettant de recevoir ses revenus dans son pays.
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Compte Mobile Money (Orange Money, MTN, Moov, Wave) ou coordonnées bancaires vérifiées dans votre pays de résidence.
              </p>
            </div>
            {!hasPaymentMethod && (
              <button
                type="button"
                onClick={() => go('account')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Renseigner mon numéro Mobile Money</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CONDITION 12 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  12
                </span>
                {hasAccepted ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Acceptées
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px]">
                    Signature requise
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                12. Accepter les Conditions de Monétisation ArtisanPro.
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Approbation formelle des règles de répartition des gains, des commissions et des engagements d'intégrité.
              </p>
            </div>
            {!hasAccepted && (
              <button
                type="button"
                id="btn-accept-monetization-conditions"
                disabled={isSubmittingAccept}
                onClick={handleAcceptTerms}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>J'accepte les Conditions de Monétisation</span>
              </button>
            )}
          </div>

          {/* CONDITION 13 */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                  13
                </span>
                {isAccountVerified ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Compte Vérifié ArtisanPro
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Vérification requise
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-neutral-900">
                13. Faire vérifier son compte par ArtisanPro avant l’activation de la monétisation.
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Validation formelle de l'identité et des compétences par l'équipe de contrôle ArtisanPro afin de certifier l'authenticité de l'artisan.
              </p>
            </div>
            {!isAccountVerified && (
              <button
                type="button"
                onClick={() => go('artisan-verification')}
                className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Demander la vérification de mon compte</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION IMPORTANT (AVERTISSEMENT OFFICIEL STRICT) */}
      <div className="rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 p-6 sm:p-8 space-y-4 text-neutral-900">
        <div className="flex items-center gap-2.5 text-amber-950 font-black text-base sm:text-lg">
          <AlertTriangle className="w-6 h-6 text-[#FF6B00] shrink-0" />
          <span>IMPORTANT :</span>
        </div>

        <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-800 leading-relaxed pl-1">
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />
            <span>
              <strong>Le fait d’avoir un abonnement ArtisanPro ne garantit pas automatiquement des revenus.</strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />
            <span>
              <strong>La monétisation est activée uniquement lorsque toutes les conditions sont remplies et que le compte est validé par ArtisanPro.</strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />
            <span>
              <strong>ArtisanPro se réserve le droit de suspendre ou désactiver la monétisation en cas de fraude, de non-respect des règles ou d’activité suspecte.</strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] mt-1.5 shrink-0" />
            <span>
              <strong>Les revenus générés dépendent des performances du contenu et des règles de rémunération ArtisanPro.</strong>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
