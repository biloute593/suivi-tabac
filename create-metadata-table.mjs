import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMetadataTable() {
  console.log('🚀 Création de la table user_metadata...\n');
  
  // Créer la table via l'API REST (en insérant puis supprimant)
  // En fait, on va juste vérifier si elle existe
  
  const { data, error } = await supabase
    .from('user_metadata')
    .select('*')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('⚠️  La table user_metadata n\'existe pas.');
    console.log('\n📋 Veuillez exécuter ce SQL dans le SQL Editor de Supabase:');
    console.log('   URL: https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new\n');
    console.log('```sql');
    console.log(`-- Créer la table user_metadata
CREATE TABLE user_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  date_naissance DATE,
  debut_tabagisme DATE,
  cigarettes_par_jour_max INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres métadonnées
CREATE POLICY "Users can view their own metadata" ON user_metadata
  FOR SELECT USING (true);

-- Politique: Les utilisateurs peuvent insérer leurs propres métadonnées
CREATE POLICY "Users can insert their own metadata" ON user_metadata
  FOR INSERT WITH CHECK (true);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres métadonnées
CREATE POLICY "Users can update their own metadata" ON user_metadata
  FOR UPDATE USING (true);

-- Créer un enregistrement pour LYDIE
INSERT INTO user_metadata (user_id, date_naissance, debut_tabagisme, cigarettes_par_jour_max)
SELECT user_id, NULL, NULL, 20
FROM users
WHERE pseudo = 'LYDIE'
ON CONFLICT (user_id) DO NOTHING;
`);
    console.log('```\n');
  } else if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ La table user_metadata existe déjà !');
    console.log('📊 Nombre d\'enregistrements:', data ? 1 : 0);
  }
}

createMetadataTable();
