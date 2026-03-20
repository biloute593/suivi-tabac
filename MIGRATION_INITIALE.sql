-- ==========================================
-- SCRIPT DE MIGRATION INITIALE - SUIVI TABAC
-- ==========================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudo TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    objectif_global INTEGER DEFAULT 12,
    share_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colonnes additionnelles de la migration du 11/12
    date_naissance DATE,
    debut_tabagisme DATE,
    cigarettes_par_jour_max INTEGER DEFAULT 20
);

-- 2. Table des Métadonnées Utilisateur (Alternative/Extension)
CREATE TABLE IF NOT EXISTS public.user_metadata (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    date_naissance DATE,
    debut_tabagisme DATE,
    cigarettes_par_jour_max INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Journées
CREATE TABLE IF NOT EXISTS public.journees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type_journee TEXT DEFAULT 'travail',
    objectif_nombre_max INTEGER DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 4. Table des Cigarettes
CREATE TABLE IF NOT EXISTS public.cigarettes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journee_id UUID REFERENCES public.journees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    numero INTEGER,
    heure TEXT NOT NULL,
    lieu TEXT,
    type TEXT,
    besoin INTEGER DEFAULT 3,
    satisfaction INTEGER DEFAULT 3,
    quantite REAL DEFAULT 1,
    situation TEXT,
    commentaire TEXT,
    kudzu_pris BOOLEAN DEFAULT FALSE,
    score_calcule INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Objectifs
CREATE TABLE IF NOT EXISTS public.objectifs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    nombre_max INTEGER NOT NULL,
    actif INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table du Journal / Notes
CREATE TABLE IF NOT EXISTS public.journal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    contenu TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Social - Posts
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('performance', 'analyse', 'image')),
    caption TEXT,
    image_url TEXT,
    stats_data JSONB,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Social - Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 9. Social - Commentaires
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Social - Amitiés
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 11. Social - Messages privées
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cigarettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simple version: Users can only see their own data)
-- Note: Replace 'auth.uid() = user_id' with appropriate check for your app's auth logic.
-- Actually, the current app uses a custom 'users' table and session management.
-- We'll set simple policies for now, but in PRODUCTION you'd want proper Auth.

CREATE POLICY "Users access own data" ON public.users FOR ALL USING (TRUE);
CREATE POLICY "Users access own metadata" ON public.user_metadata FOR ALL USING (TRUE);
CREATE POLICY "Users access own journees" ON public.journees FOR ALL USING (TRUE);
CREATE POLICY "Users access own cigarettes" ON public.cigarettes FOR ALL USING (TRUE);
CREATE POLICY "Users access own objectifs" ON public.objectifs FOR ALL USING (TRUE);
CREATE POLICY "Users access own notes" ON public.journal_notes FOR ALL USING (TRUE);
CREATE POLICY "Public can view posts" ON public.posts FOR SELECT USING (TRUE);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can like posts" ON public.post_likes FOR ALL USING (TRUE);
CREATE POLICY "Users can comment" ON public.post_comments FOR ALL USING (TRUE);
CREATE POLICY "Users can manage friendships" ON public.friendships FOR ALL USING (TRUE);
CREATE POLICY "Users can message" ON public.messages FOR ALL USING (TRUE);

-- Fonction exec_sql (Optionnel, utile pour scripts)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
