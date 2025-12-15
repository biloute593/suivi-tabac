import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - hardcodé temporairement pour debug
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
}

console.log('✅ Supabase initialized:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export interface DBUser {
  user_id: string;
  pseudo: string;
  password_hash: string;
  objectif_global: number;
  share_public: boolean;
  created_at: string;
}

export interface DBUserMetadata {
  user_id: string;
  date_naissance?: string;
  debut_tabagisme?: string;
  cigarettes_par_jour_max?: number;
  created_at: string;
  updated_at: string;
}

export interface DBJournee {
  id: string;
  user_id: string;
  date: string;
  type_journee: 'travail' | 'teletravail' | 'weekend';
  objectif_nombre_max?: number;
  created_at: string;
}

export interface DBCigarette {
  id: string;
  journee_id: string;
  user_id: string;
  numero: number;
  heure: string;
  lieu: string;
  type: string;
  besoin: number;
  satisfaction: number;
  quantite: string;
  situation: string;
  commentaire?: string;
  kudzu_pris: boolean;
  score_calcule: number;
  created_at: string;
}

export interface DBObjectif {
  id: string;
  user_id: string;
  date_debut: string;
  nombre_max: number;
  actif: boolean;
  created_at: string;
}

export interface DBJournalNote {
  id: string;
  user_id: string;
  date: string;
  contenu: string;
  created_at: string;
  updated_at?: string;
}
