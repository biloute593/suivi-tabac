import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - hardcodé temporairement pour debug
const supabaseUrl = 'https://gyejvnchiijounmkgqvg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWp2bmNoaWlqb3VubWtncXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODQ1MTUsImV4cCI6MjA3NTY2MDUxNX0.APUmj_HWnTj93lFpyZ-3C8fyxgkliRdckTUe3KitvLQ';

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
