-- 1. Table des Publications (Mur Public)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('performance', 'analyse', 'image')),
    caption TEXT,
    image_url TEXT,
    stats_data JSONB,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table des Likes (Mégots)
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. Table des Commentaires
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table des Amitiés (Friendships)
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 5. Table des Messages Privés
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
DROP POLICY IF EXISTS "Tout le monde peut voir les posts" ON public.posts;
CREATE POLICY "Tout le monde peut voir les posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres posts" ON public.posts;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tout le monde peut voir les likes" ON public.post_likes;
CREATE POLICY "Tout le monde peut voir les likes" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent liker" ON public.post_likes;
CREATE POLICY "Les utilisateurs peuvent liker" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tout le monde peut voir les commentaires" ON public.post_comments;
CREATE POLICY "Tout le monde peut voir les commentaires" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent commenter" ON public.post_comments;
CREATE POLICY "Les utilisateurs peuvent commenter" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Voir ses propres amitiés" ON public.friendships;
CREATE POLICY "Voir ses propres amitiés" ON public.friendships FOR SELECT USING (true); -- Simplifié pour le prototype
DROP POLICY IF EXISTS "Gérer ses amitiés" ON public.friendships;
CREATE POLICY "Gérer ses amitiés" ON public.friendships FOR ALL USING (true); -- Simplifié

DROP POLICY IF EXISTS "Voir ses propres messages" ON public.messages;
CREATE POLICY "Voir ses propres messages" ON public.messages FOR SELECT USING (true); -- Simplifié
DROP POLICY IF EXISTS "Envoyer des messages" ON public.messages;
CREATE POLICY "Envoyer des messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
