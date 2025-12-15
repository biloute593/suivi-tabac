-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLÈTE DES DONNÉES LYDIE
-- À EXÉCUTER DANS: https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Étape 1: Créer la table user_metadata
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  date_naissance DATE,
  debut_tabagisme DATE,
  cigarettes_par_jour_max INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 2: Activer la sécurité Row Level Security
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Étape 3: Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow users to view own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Allow users to insert own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Allow users to update own metadata" ON user_metadata;

-- Étape 4: Créer les policies de sécurité
CREATE POLICY "Allow users to view own metadata" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own metadata" ON user_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own metadata" ON user_metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- Étape 5: S'assurer que l'objectif de LYDIE est défini
UPDATE users 
SET objectif_global = 12 
WHERE user_id = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03' 
  AND (objectif_global IS NULL OR objectif_global = 0);

-- Étape 6: Créer l'entrée user_metadata pour LYDIE avec valeurs par défaut
INSERT INTO user_metadata (user_id, cigarettes_par_jour_max, created_at, updated_at)
VALUES (
  '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03',
  20,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  cigarettes_par_jour_max = COALESCE(user_metadata.cigarettes_par_jour_max, 20),
  updated_at = NOW();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VÉRIFICATION: Afficher les données de LYDIE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Profil utilisateur
SELECT 
  'PROFIL' as type,
  user_id,
  pseudo,
  objectif_global,
  share_public,
  created_at
FROM users 
WHERE user_id = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

-- Métadonnées santé
SELECT 
  'SANTÉ' as type,
  user_id,
  date_naissance,
  debut_tabagisme,
  cigarettes_par_jour_max,
  created_at,
  updated_at
FROM user_metadata 
WHERE user_id = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

-- Compte des données de suivi
SELECT 
  'SUIVI' as type,
  'journees' as table_name,
  COUNT(*) as count
FROM journees 
WHERE user_id = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03'
UNION ALL
SELECT 
  'SUIVI' as type,
  'cigarettes' as table_name,
  COUNT(*) as count
FROM cigarettes 
WHERE user_id = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';
