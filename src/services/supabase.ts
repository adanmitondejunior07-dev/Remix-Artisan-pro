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
