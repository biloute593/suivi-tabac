-- Ajouter les colonnes manquantes dans la table users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS date_naissance DATE,
  ADD COLUMN IF NOT EXISTS debut_tabagisme DATE,
  ADD COLUMN IF NOT EXISTS cigarettes_par_jour_max INTEGER DEFAULT 20;

-- Mise à jour des commentaires
COMMENT ON COLUMN users.date_naissance IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN users.debut_tabagisme IS 'Date de début du tabagisme';
COMMENT ON COLUMN users.cigarettes_par_jour_max IS 'Nombre maximum de cigarettes par jour (historique)';
