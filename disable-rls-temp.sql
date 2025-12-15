-- Script SQL à exécuter dans Supabase SQL Editor
-- pour permettre l'import des données de LYDIE

-- 1. DÉSACTIVER TEMPORAIREMENT LES RLS sur les tables nécessaires
ALTER TABLE journees DISABLE ROW LEVEL SECURITY;
ALTER TABLE cigarettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_notes DISABLE ROW LEVEL SECURITY;

-- Note: Après l'import, tu devras RE-ACTIVER les RLS avec:
-- ALTER TABLE journees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cigarettes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;
