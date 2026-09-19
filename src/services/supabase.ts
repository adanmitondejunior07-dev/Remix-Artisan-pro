import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DbUser, DbPublication, DbLike, PublicationType, CriteresMonetisation } from '../types.ts';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

if (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Erreur initialisation Supabase client:', err);
  }
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(client);
};

// ============================================================
// 13 CRITÈRES OFFICIELS DE VALIDATION & MONÉTISATION ADMIN
// ============================================================
export const ADMIN_13_CRITERES = [
  {
    key: 'identite_verifiee',
    num: 1,
    title: 'Identité Vérifiée',
    desc: "Copie de la pièce d'identité conforme",
    shortDesc: "Pièce d'identité",
  },
  {
    key: 'telephone_actif',
    num: 2,
    title: 'Numéro Téléphone Actif',
    desc: 'Vérifié par SMS ou appel',
    shortDesc: 'Téléphone vérifié',
  },
  {
    key: 'localisation_precise',
    num: 3,
    title: 'Localisation Précise',
    desc: "Zone d'intervention ou atelier enregistré",
    shortDesc: 'Atelier / Zone',
  },
  {
    key: 'photo_professionnelle',
    num: 4,
    title: 'Photo de Profil Professionnelle',
    desc: "Visage net, pas d'avatar",
    shortDesc: 'Photo nette',
  },
  {
    key: 'metier_clair',
    num: 5,
    title: "Nom de l'Entreprise ou Métier Clair",
    desc: 'Ex: Plombier, Électricien',
    shortDesc: 'Métier explicite',
  },
  {
    key: 'portfolio_rempli',
    num: 6,
    title: 'Portfolio Rempli',
    desc: 'Au moins 3 photos de réalisations réelles',
    shortDesc: 'Min. 3 réalisations',
  },
  {
    key: 'tarifs_indiques',
    num: 7,
    title: 'Tarifs ou Grille Indiquée',
    desc: 'Prestations transparentes',
    shortDesc: 'Grille tarifaire',
  },
  {
    key: 'disponibilites_renseignees',
    num: 8,
    title: 'Disponibilités Renseignées',
    desc: 'Jours et heures de travail',
    shortDesc: 'Horaires & jours',
  },
  {
    key: 'casier_judiciaire',
    num: 9,
    title: 'Casier Judiciaire / Attestation',
    desc: 'Optionnel selon le pays pour la sécurité',
    shortDesc: 'Attestation / Casier',
  },
  {
    key: 'contrat_accepte',
    num: 10,
    title: "Contrat d'Utilisation Accepté",
    desc: 'Règles de bonne conduite de la plateforme',
    shortDesc: 'Charte acceptée',
  },
  {
    key: 'paiement_configure',
    num: 11,
    title: 'Configuration du Paiement',
    desc: 'Compte Mobile Money lié pour la monétisation',
    shortDesc: 'Mobile Money lié',
  },
  {
    key: 'test_reactivite',
    num: 12,
    title: 'Test de Réactivité',
    desc: "L'artisan a répondu au premier message test",
    shortDesc: 'Réponse test OK',
  },
  {
    key: 'frais_inscription',
    num: 13,
    title: "Frais d'Inscription Validés",
    desc: 'Si forfait ou abonnement de départ payé',
    shortDesc: 'Adhésion validée',
  },
] as const;

export function calculateValidationScore(criteres?: CriteresMonetisation | null): {
  score: number;
  estVerifie: boolean;
  pct: number;
} {
  if (!criteres) return { score: 0, estVerifie: false, pct: 0 };
  let count = 0;
  ADMIN_13_CRITERES.forEach((c) => {
    if (criteres[c.key as keyof CriteresMonetisation] === true) {
      count += 1;
    }
  });
  return {
    score: count,
    estVerifie: count === 13,
    pct: Math.round((count / 13) * 100),
  };
}

// ============================================================
// 1. TABLE 'users' (id, nom, telephone, role, est_verifie, score_validation, criteres_monetisation)
// ============================================================

export async function getSupabaseUsers(): Promise<DbUser[]> {
  if (!client) {
    // Fallback serveur /api/users
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        return (users || []).map((u: any) => ({
          id: String(u.id),
          nom: u.nom || u.name || 'Utilisateur',
          telephone: u.telephone || u.phone || '',
          role: u.role === 'admin' || u.role === 'super_admin' ? 'admin' : u.role === 'artisan' ? 'artisan' : 'client',
          est_verifie: Boolean(u.est_verifie || u.verified || u.is_verified || (u.score_validation === 13)),
          score_validation: typeof u.score_validation === 'number' ? u.score_validation : (u.verified ? 13 : 0),
          criteres_monetisation: u.criteres_monetisation || {},
          prenom: u.prenom || (u.name ? u.name.split(' ')[0] : 'Membre'),
          photo_profil: u.photo_profil || u.avatarUrl || u.avatar || '',
          localisation: u.localisation || [u.city, u.country].filter(Boolean).join(', ') || 'Abidjan',
          email: u.email || '',
        }));
      }
    } catch {}
    return [];
  }

  try {
    // 1. Tenter la table 'users' avec le schéma officiel
    const { data, error } = await client
      .from('users')
      .select('id, nom, telephone, role, est_verifie, score_validation, criteres_monetisation')
      .order('id', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as DbUser[];
    }

    // 2. Si table 'profiles' existe, mapper vers DbUser
    const { data: profiles, error: pError } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!pError && Array.isArray(profiles) && profiles.length > 0) {
      return profiles.map((p: any) => ({
        id: String(p.id),
        nom: p.nom || p.full_name || 'Utilisateur',
        telephone: p.telephone || p.phone || '',
        role: p.role === 'admin' || p.role === 'super_admin' ? 'admin' : p.role === 'artisan' ? 'artisan' : 'client',
        est_verifie: Boolean(p.est_verifie || p.verified || (p.score_validation === 13)),
        score_validation: typeof p.score_validation === 'number' ? p.score_validation : 0,
        criteres_monetisation: p.criteres_monetisation || {},
        prenom: p.prenom || (p.full_name ? p.full_name.split(' ')[0] : 'Membre'),
        photo_profil: p.photo_profil || p.avatar_url || '',
        localisation: p.localisation || p.city || 'Abidjan',
        email: p.email || '',
      }));
    }
  } catch (err) {
    console.warn('Erreur getSupabaseUsers:', err);
  }

  return [];
}

// ============================================================
// SESSION SUPABASE & FIX DU NOM DE PROFIL
// Utilise la session active pour charger le profil et éviter que le nom saute
// ============================================================

export async function getSupabaseSession() {
  if (!client) return null;
  try {
    if (client.auth && typeof client.auth.getSession === 'function') {
      const { data } = await client.auth.getSession();
      return data?.session || null;
    }
    if (client.auth && typeof (client.auth as any).session === 'function') {
      return (client.auth as any).session();
    }
  } catch (err) {
    console.warn('Erreur getSupabaseSession:', err);
  }
  return null;
}

export async function getSupabaseUserProfile(userId: string): Promise<DbUser | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('users')
      .select('id, nom, telephone, role, est_verifie, score_validation, criteres_monetisation')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as DbUser;
    }
  } catch (err) {
    console.warn('Erreur getSupabaseUserProfile:', err);
  }
  return null;
}

/**
 * Mise à jour des 13 critères de monétisation pour un artisan
 * L'artisan obtient le statut "Vérifié & Monétisé" UNIQUEMENT lorsque les 13 conditions sont validées à true
 */
export async function updateSupabaseUserMonetisation(
  userId: string,
  criteres: CriteresMonetisation,
  score: number,
  estVerifie: boolean
) {
  // 1. Sauvegarde Express synchrone
  try {
    await fetch(`/api/users/${userId}/monetisation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criteres_monetisation: criteres,
        score_validation: score,
        est_verifie: estVerifie,
        verified: estVerifie,
        is_verified: estVerifie,
      }),
    });
  } catch (e) {
    console.warn('Server fallback update monetisation:', e);
  }

  // 2. Sauvegarde Supabase
  if (client) {
    try {
      const { error } = await client
        .from('users')
        .update({
          criteres_monetisation: criteres,
          score_validation: score,
          est_verifie: estVerifie,
        })
        .eq('id', userId);
      if (error) {
        console.warn('Erreur Supabase update users monetisation:', error.message);
      }
    } catch (err) {
      console.warn('Exception updateSupabaseUserMonetisation:', err);
    }
  }
}

// ============================================================
// 2. TABLE 'publications'
// Colonnes : id, user_id, contenu, image, date_creation, type ('accueil' | 'marketplace'), prix
// ============================================================

export async function createSupabasePublication(params: {
  user_id: string;
  contenu: string;
  image?: string | null;
  type: PublicationType;
  prix?: string | number | null;
}) {
  const payload = {
    user_id: params.user_id,
    contenu: params.contenu.trim(),
    image: params.image || null,
    type: params.type === 'marketplace' ? 'marketplace' : 'accueil',
    prix: params.type === 'marketplace' ? params.prix || null : null,
    date_creation: new Date().toISOString(),
  };

  if (!client) {
    // Enregistrement via API serveur Express
    try {
      await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `pub-${Date.now()}`,
          userId: params.user_id,
          user_id: params.user_id,
          content: params.contenu,
          contenu: params.contenu,
          image: params.image,
          mediaUrl: params.image,
          type: payload.type,
          prix: payload.prix,
          createdAt: payload.date_creation,
        }),
      });
    } catch {}
    return payload;
  }

  try {
    const { data, error } = await client
      .from('publications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Erreur Supabase insert publications:', error.message);
      // Tentative fallback avec colonnes alternatives si schema legacy
      try {
        await client.from('publications').insert({
          user_id: params.user_id,
          content: params.contenu,
          image_url: params.image,
          type: payload.type,
          price: payload.prix,
        });
      } catch {}
    }
    return data || payload;
  } catch (err) {
    console.warn('Exception createSupabasePublication:', err);
    return payload;
  }
}

export async function getSupabasePublications(filterType?: PublicationType) {
  if (!client) {
    try {
      const url = filterType ? `/api/publications?type=${filterType}` : '/api/publications';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }

  try {
    let query = client.from('publications').select('*').order('date_creation', { ascending: false });
    if (filterType) {
      query = query.eq('type', filterType);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Erreur Supabase select publications:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Exception getSupabasePublications:', err);
    return [];
  }
}

// ============================================================
// 3. TABLE 'likes' : id, user_id, publication_id
// Système de likes persistant (Ajoute ou supprime la ligne en DB)
// ============================================================

export async function toggleSupabaseLike(publicationId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  // 1. Appel serveur Express synchrone
  try {
    const serverRes = await fetch('/api/likes/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicationId, userId }),
    });
    if (serverRes.ok) {
      const result = await serverRes.json();
      return result;
    }
  } catch (e) {
    console.warn('Toggle like serveur warning:', e);
  }

  // 2. Si client Supabase configuré
  if (client) {
    try {
      // Vérifier si la ligne existe déjà
      const { data: existingLike } = await client
        .from('likes')
        .select('id')
        .eq('publication_id', publicationId)
        .eq('user_id', userId)
        .maybeSingle();

      let liked = false;
      if (existingLike) {
        // Un-like: Supprime la ligne
        await client.from('likes').delete().eq('id', existingLike.id);
        liked = false;
      } else {
        // Like: Ajoute la ligne
        await client.from('likes').insert({
          publication_id: publicationId,
          user_id: userId,
        });
        liked = true;
      }

      // Récupérer le décompte réel
      const { count } = await client
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publication_id', publicationId);

      return { liked, count: count || 0 };
    } catch (err) {
      console.warn('Exception toggleSupabaseLike:', err);
    }
  }

  return { liked: true, count: 1 };
}

/**
 * Purge des faux utilisateurs et comptes de démonstration
 * Protège impérativement le compte authentique de l'utilisateur connecté
 */
export async function purgeSupabaseDemoUsers(protectedEmail: string = 'adanmitondejunior07@gmail.com') {
  if (!client) return;
  try {
    await client
      .from('profiles')
      .delete()
      .or(`email.ilike.%demo%,email.ilike.%test%,full_name.eq.YAO KOUASSI,full_name.eq.Yao Kouassi`)
      .neq('email', protectedEmail);
  } catch (err) {
    console.warn('Info purgeSupabaseDemoUsers:', err);
  }
}
