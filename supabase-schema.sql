-- Script SQL pour créer les tables Supabase (100% GRATUIT)
-- À exécuter dans l'éditeur SQL de Supabase

-- Table des utilisateurs
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  objectif_global INTEGER DEFAULT 12,
  share_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des journées
CREATE TABLE journees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type_journee TEXT NOT NULL CHECK (type_journee IN ('travail', 'teletravail', 'weekend')),
  objectif_nombre_max INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Table des cigarettes
CREATE TABLE cigarettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journee_id UUID REFERENCES journees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  heure TIME NOT NULL,
  lieu TEXT NOT NULL,
  type TEXT NOT NULL,
  besoin INTEGER NOT NULL CHECK (besoin BETWEEN 1 AND 10),
  satisfaction INTEGER NOT NULL CHECK (satisfaction BETWEEN 1 AND 10),
  quantite TEXT NOT NULL,
  situation TEXT NOT NULL,
  commentaire TEXT,
  kudzu_pris BOOLEAN DEFAULT false,
  score_calcule DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des objectifs
CREATE TABLE objectifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  nombre_max INTEGER NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des notes de journal
CREATE TABLE journal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_journees_user_date ON journees(user_id, date);
CREATE INDEX idx_cigarettes_journee ON cigarettes(journee_id);
CREATE INDEX idx_cigarettes_user ON cigarettes(user_id);
CREATE INDEX idx_objectifs_user_actif ON objectifs(user_id, actif);
CREATE INDEX idx_journal_notes_user_date ON journal_notes(user_id, date);

-- Activer Row Level Security (sécurité)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cigarettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité : chaque utilisateur ne voit que ses propres données
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own journees" ON journees FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own cigarettes" ON cigarettes FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own objectifs" ON objectifs FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own notes" ON journal_notes FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
