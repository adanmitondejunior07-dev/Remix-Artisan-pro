import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

/**
 * Crée une publication selon la structure stricte :
 * Table: publications
 * Colonnes : id, user_id (uuid), content, image_url, created_at
 * AUCUN author_name ni username (colonnes supprimées)
 */
export async function createSupabasePost(content: string, imageUrl?: string) {
  if (!client) return null;
  try {
    const { data: authData, error: authErr } = await client.auth.getUser();
    if (authErr || !authData?.user) {
      console.warn('Supabase createPost: aucun utilisateur authentifié');
      return null;
    }

    const payload: { user_id: string; content: string; image_url?: string | null; created_at: string } = {
      user_id: authData.user.id, // ✅ Vrai ID utilisateur (auth.users)
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    if (imageUrl) {
      payload.image_url = imageUrl;
    }

    const { data, error } = await client
      .from('publications')
      .insert(payload)
      .select(`
        *,
        profiles:user_id ( full_name, avatar_url )
      `)
      .single();

    if (error) {
      console.warn('Erreur Supabase insert publications:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Exception createSupabasePost:', err);
    return null;
  }
}

/**
 * Récupère les publications avec jointure relationnelle sur le profil utilisateur
 * Requête: profiles:user_id ( full_name, avatar_url )
 */
export async function getSupabasePostsWithProfiles() {
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('publications')
      .select(`
        *,
        profiles:user_id ( full_name, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erreur Supabase select publications:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Exception getSupabasePostsWithProfiles:', err);
    return [];
  }
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
