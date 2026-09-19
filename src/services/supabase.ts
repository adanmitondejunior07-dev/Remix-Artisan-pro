import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DbUser, DbPublication, DbLike, PublicationType } from '../types.ts';

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
// 1. TABLE 'users' (id, nom, prenom, role, telephone, photo_profil, localisation)
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
          nom: u.nom || (u.name ? u.name.split(' ').slice(1).join(' ') : 'Utilisateur'),
          prenom: u.prenom || (u.name ? u.name.split(' ')[0] : 'Membre'),
          role: u.role === 'admin' || u.role === 'super_admin' ? 'admin' : u.role === 'artisan' ? 'artisan' : 'client',
          telephone: u.telephone || u.phone || '',
          photo_profil: u.photo_profil || u.avatarUrl || u.avatar || '',
          localisation: u.localisation || [u.city, u.country].filter(Boolean).join(', ') || 'Abidjan',
        }));
      }
    } catch {}
    return [];
  }

  try {
    // 1. Tenter la table 'users'
    const { data, error } = await client
      .from('users')
      .select('id, nom, prenom, role, telephone, photo_profil, localisation')
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
        nom: p.nom || (p.full_name ? p.full_name.split(' ').slice(1).join(' ') : 'Utilisateur'),
        prenom: p.prenom || (p.full_name ? p.full_name.split(' ')[0] : 'Membre'),
        role: p.role === 'admin' || p.role === 'super_admin' ? 'admin' : p.role === 'artisan' ? 'artisan' : 'client',
        telephone: p.telephone || p.phone || '',
        photo_profil: p.photo_profil || p.avatar_url || '',
        localisation: p.localisation || p.city || 'Abidjan',
      }));
    }
  } catch (err) {
    console.warn('Erreur getSupabaseUsers:', err);
  }

  return [];
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
