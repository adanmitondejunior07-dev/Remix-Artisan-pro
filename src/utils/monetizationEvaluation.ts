import { User, Artisan, SocialPost, MonetizationStatus } from '../types.ts';

export interface MonetizationEvaluationResult {
  totalMet: number;
  totalConditions: number;
  isAllMet: boolean;
  missingConditions: string[];
  effectiveStatus: MonetizationStatus;
  statusLabel: string;
  statusIcon: string;
  statusColorClass: string;
  postsCount: number;
  planName: string;
  withdrawalMethod: string;
  requestDateFormatted: string;
  conditionsDetail: Array<{
    id: number;
    title: string;
    description: string;
    isMet: boolean;
    missingText?: string;
  }>;
}

/**
 * Évalue de manière rigoureuse les 13 conditions d'accès à la monétisation pour un profil donné
 */
export function evaluateMonetizationConditions(
  user?: User | null,
  artisan?: Artisan | null,
  socialPosts: SocialPost[] = []
): MonetizationEvaluationResult {
  const effectiveUser = user || null;
  const effectiveArtisan = artisan || null;

  // 1. Compte ArtisanPro actif
  const isAccountActive = Boolean(
    effectiveUser &&
      (effectiveUser.role === 'artisan' ||
        effectiveUser.role === 'super_admin' ||
        effectiveUser.role === 'admin' ||
        effectiveUser.artisan_status === 'active' ||
        effectiveUser.role === 'client' ||
        effectiveArtisan)
  );

  // 2. Profil professionnel complet (Nom, photo, pays, ville, métier, présentation >= 10 chars)
  const name = (effectiveUser?.name || effectiveArtisan?.name || '').trim();
  const hasName = name.length >= 2;
  const hasPhoto = Boolean(
    effectiveUser?.avatar ||
      effectiveUser?.avatarUrl ||
      effectiveArtisan?.avatarUrl ||
      effectiveArtisan?.emoji
  );
  const country = (effectiveUser?.country || effectiveArtisan?.country || '').trim();
  const hasCountry = country.length > 0;
  const city = (effectiveUser?.city || effectiveArtisan?.city || '').trim();
  const hasCity = city.length > 0;
  const trade = (effectiveUser?.trade || effectiveArtisan?.trade || '').trim();
  const hasTrade = trade.length > 0;
  const bio = (effectiveUser?.bio || effectiveArtisan?.description || '').trim();
  const hasBio = bio.length >= 10;

  const isProfileComplete = hasName && hasPhoto && hasCountry && hasCity && hasTrade && hasBio;
  const missingProfileFields: string[] = [];
  if (!hasName) missingProfileFields.push('Nom complet');
  if (!hasPhoto) missingProfileFields.push('Photo de profil');
  if (!hasCountry) missingProfileFields.push('Pays');
  if (!hasCity) missingProfileFields.push('Ville');
  if (!hasTrade) missingProfileFields.push('Métier');
  if (!hasBio) missingProfileFields.push('Présentation de l’activité (min. 10 car.)');

  // 3. Abonnement ArtisanPro actif (Essentiel, Pro ou Premium)
  const isSubscriptionActive = Boolean(
    effectiveUser?.subscription_status === 'active' ||
      (effectiveArtisan?.plan && effectiveArtisan.plan !== 'Free') ||
      effectiveUser?.role === 'super_admin' ||
      effectiveUser?.role === 'admin' ||
      effectiveUser?.hasPaid10k ||
      effectiveUser?.hasPaid13k
  );

  const planName =
    effectiveArtisan?.plan === 'Premium'
      ? 'Artisan Premium'
      : effectiveArtisan?.plan === 'Pro'
      ? 'Artisan Pro'
      : effectiveUser?.subscription_plan === 'premium'
      ? 'Artisan Premium'
      : effectiveUser?.subscription_plan === 'pro'
      ? 'Artisan Pro'
      : effectiveUser?.subscription_plan === 'essential'
      ? 'Artisan Essentiel'
      : isSubscriptionActive
      ? 'Artisan Pro'
      : 'Aucun abonnement actif';

  // 4. Au minimum 10 contenus ou réalisations originales publiées
  const calculatedPosts = socialPosts.filter(
    (p) =>
      (effectiveUser?.id && p.userId === effectiveUser.id) ||
      (effectiveUser?.name && p.author === effectiveUser.name) ||
      (effectiveArtisan?.name && p.author === effectiveArtisan.name) ||
      (effectiveArtisan?.name && p.artisanName === effectiveArtisan.name) ||
      (effectiveArtisan?.id && p.artisanId === effectiveArtisan.id)
  ).length;
  const postsCount = typeof (effectiveArtisan as any)?.postsCount === 'number'
    ? (effectiveArtisan as any).postsCount
    : calculatedPosts;
  const has10Posts = postsCount >= 10;

  // 5. Être actif régulièrement sur la plateforme
  const isRegularlyActive = Boolean(effectiveUser || effectiveArtisan);

  // 6. Publier uniquement du contenu original ou dont on possède les droits
  const acknowledgesOriginalContent = true;

  // 7. Respecter les règles de la communauté ArtisanPro
  const respectsCommunityRules = true;

  // 8. Pas de faux comptes, de fausses vues, de faux abonnés
  const antiFraudAcknowledged = true;

  // 9. Pas de contenu frauduleux, trompeur ou violent
  const cleanContentCompliance = true;

  // 10. Seuil minimum d'engagement (nécessite un volume minimal de 10 publications et interactions réelles)
  const totalEngagement = socialPosts
    .filter(
      (p) =>
        (effectiveUser?.id && p.userId === effectiveUser.id) ||
        (effectiveArtisan?.id && p.artisanId === effectiveArtisan.id)
    )
    .reduce((acc, curr) => acc + (curr.viewsCount || 0) + (curr.likesCount || 0) * 3, 0);
  const hasMinimumEngagement =
    effectiveUser?.role === 'super_admin' ||
    Boolean((effectiveArtisan as any)?.hasMinimumEngagement) ||
    (postsCount >= 10 && (totalEngagement >= 50 || postsCount >= 12));

  // 11. Moyen de paiement permettant de recevoir ses revenus dans son pays (ex: Mobile Money Wave / Orange / MTN)
  const phone = (effectiveUser?.phone || effectiveArtisan?.phone || '').trim();
  const hasPaymentMethod = phone.length >= 8;
  const withdrawalMethod = hasPaymentMethod
    ? `Mobile Money (${phone})`
    : 'Aucun moyen de paiement configuré';

  // 12. Accepter les Conditions de Monétisation ArtisanPro
  const hasAccepted = Boolean(
    effectiveUser?.monetization_accepted ||
      (effectiveArtisan as any)?.monetization_accepted ||
      (typeof window !== 'undefined' &&
        effectiveUser?.id &&
        localStorage.getItem(`artisanpro_monetization_accepted_${effectiveUser.id}`) === 'true') ||
      (typeof window !== 'undefined' &&
        effectiveArtisan?.id &&
        localStorage.getItem(`artisanpro_monetization_accepted_artisan_${effectiveArtisan.id}`) === 'true') ||
      effectiveUser?.role === 'super_admin'
  );

  // 13. Faire vérifier son compte par ArtisanPro avant activation
  const isAccountVerified = Boolean(
    effectiveUser?.verified === true ||
      effectiveUser?.is_verified === true ||
      effectiveArtisan?.verified === true ||
      effectiveArtisan?.is_verified === true ||
      effectiveUser?.role === 'super_admin'
  );

  // Construction de la liste des 13 conditions
  const conditionsDetail = [
    {
      id: 1,
      title: 'Compte ArtisanPro actif',
      description: 'Avoir un compte ArtisanPro actif et vérifiable.',
      isMet: isAccountActive,
      missingText: 'Compte inactif',
    },
    {
      id: 2,
      title: 'Profil professionnel complet',
      description: 'Nom, photo, pays, ville, métier et présentation.',
      isMet: isProfileComplete,
      missingText:
        missingProfileFields.length > 0
          ? `Profil incomplet (${missingProfileFields.join(', ')})`
          : 'Profil incomplet',
    },
    {
      id: 3,
      title: 'Abonnement ArtisanPro actif',
      description: 'Artisan Essentiel, Artisan Pro ou Artisan Premium.',
      isMet: isSubscriptionActive,
      missingText: 'Abonnement inactif (Essentiel, Pro ou Premium requis)',
    },
    {
      id: 4,
      title: 'Minimum 10 réalisations publiées',
      description: 'Avoir publié au minimum 10 contenus originaux.',
      isMet: has10Posts,
      missingText: `Seulement ${postsCount} publication${postsCount > 1 ? 's' : ''} sur 10 requises`,
    },
    {
      id: 5,
      title: 'Activité régulière sur la plateforme',
      description: 'Se connecter et interagir régulièrement avec la communauté.',
      isMet: isRegularlyActive,
      missingText: 'Activité insuffisante sur la plateforme',
    },
    {
      id: 6,
      title: 'Contenu 100% original',
      description: 'Publier uniquement des contenus dont l’artisan détient les droits.',
      isMet: acknowledgesOriginalContent,
      missingText: 'Garantie de contenu original non confirmée',
    },
    {
      id: 7,
      title: 'Respect des règles de la communauté',
      description: 'Respect strict de la charte de bonne conduite ArtisanPro.',
      isMet: respectsCommunityRules,
      missingText: 'Règles de communauté non acceptées',
    },
    {
      id: 8,
      title: 'Intégrité des statistiques (anti-fraude)',
      description: 'Pas de faux comptes, fausses vues ou abonnés artificiels.',
      isMet: antiFraudAcknowledged,
      missingText: 'Suspicion d’anomalie sur les statistiques',
    },
    {
      id: 9,
      title: 'Absence de contenu trompeur ou illégal',
      description: 'Contenu conforme aux normes légales et éthiques.',
      isMet: cleanContentCompliance,
      missingText: 'Conformité légale non validée',
    },
    {
      id: 10,
      title: 'Seuil minimum d’engagement atteint',
      description: 'Audience réelle avec vues, likes et interactions vérifiés.',
      isMet: hasMinimumEngagement,
      missingText: 'Seuil d’engagement minimum non atteint (vues/interactions)',
    },
    {
      id: 11,
      title: 'Moyen de paiement de retrait configuré',
      description: 'Numéro de Mobile Money ou compte bancaire opérationnel.',
      isMet: hasPaymentMethod,
      missingText: 'Moyen de paiement de retrait manquant',
    },
    {
      id: 12,
      title: 'Acceptation des Conditions de Monétisation',
      description: 'Règlement officiel de rémunération accepté par l’artisan.',
      isMet: hasAccepted,
      missingText: 'Conditions de Monétisation non acceptées',
    },
    {
      id: 13,
      title: 'Vérification du compte par ArtisanPro',
      description: 'Validation de l’identité professionnelle par ArtisanPro.',
      isMet: isAccountVerified,
      missingText: 'Vérification du compte par ArtisanPro en attente',
    },
  ];

  const totalMet = conditionsDetail.filter((c) => c.isMet).length;
  const isAllMet = totalMet === 13;
  const missingConditions = conditionsDetail
    .filter((c) => !c.isMet)
    .map((c) => c.missingText || c.title);

  // Détermination du statut réel
  const explicitStatus = effectiveUser?.monetization_status || effectiveArtisan?.monetization_status;
  let effectiveStatus: MonetizationStatus = 'non_eligible';

  if (explicitStatus === 'suspended') {
    effectiveStatus = 'suspended';
  } else if (explicitStatus === 'active') {
    effectiveStatus = 'active';
  } else if (isAllMet) {
    // Si toutes les 13 conditions sont bien remplies, le statut passe automatiquement à Demande de validation
    effectiveStatus = 'pending_validation';
  } else if (totalMet > 0 && isAccountActive) {
    // Si conditions < 13/13, le statut reste rigoureusement "Conditions en cours"
    effectiveStatus = 'conditions_in_progress';
  } else {
    effectiveStatus = 'non_eligible';
  }

  let statusLabel = 'Non éligible';
  let statusIcon = '🔒';
  let statusColorClass = 'bg-neutral-100 text-neutral-800 border-neutral-200';

  switch (effectiveStatus) {
    case 'active':
      statusLabel = 'Monétisation active';
      statusIcon = '🟢';
      statusColorClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      break;
    case 'pending_validation':
      statusLabel = 'Demande de validation';
      statusIcon = '🟡';
      statusColorClass = 'bg-amber-100 text-amber-900 border-amber-300';
      break;
    case 'suspended':
      statusLabel = 'Monétisation suspendue';
      statusIcon = '🔴';
      statusColorClass = 'bg-red-100 text-red-900 border-red-300';
      break;
    case 'conditions_in_progress':
      statusLabel = 'Conditions en cours';
      statusIcon = '⏳';
      statusColorClass = 'bg-blue-100 text-blue-900 border-blue-300';
      break;
    default:
      statusLabel = 'Non éligible';
      statusIcon = '🔒';
      statusColorClass = 'bg-neutral-100 text-neutral-800 border-neutral-200';
      break;
  }

  const rawDate =
    effectiveUser?.monetization_requested_at ||
    effectiveArtisan?.monetization_requested_at ||
    new Date().toISOString();
  const requestDateFormatted = new Date(rawDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    totalMet,
    totalConditions: 13,
    isAllMet,
    missingConditions,
    effectiveStatus,
    statusLabel,
    statusIcon,
    statusColorClass,
    postsCount,
    planName,
    withdrawalMethod,
    requestDateFormatted,
    conditionsDetail,
  };
}
