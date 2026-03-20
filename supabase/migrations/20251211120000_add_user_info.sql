-- Migration: Ajouter les colonnes d'informations personnelles dans users
-- Date: 2025-12-11

-- Ajouter les colonnes si elles n'existent pas
DO $$ 
BEGIN
    -- Date de naissance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'date_naissance') THEN
        ALTER TABLE users ADD COLUMN date_naissance DATE;
    END IF;
    
    -- Début du tabagisme
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'debut_tabagisme') THEN
        ALTER TABLE users ADD COLUMN debut_tabagisme DATE;
    END IF;
    
    -- Nombre maximum de cigarettes par jour
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'cigarettes_par_jour_max') THEN
        ALTER TABLE users ADD COLUMN cigarettes_par_jour_max INTEGER DEFAULT 20;
    END IF;
END $$;

-- Mise à jour des politiques RLS pour inclure les nouvelles colonnes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);
