import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sqlScript = `
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

-- 4. Table des Invitations de Chat
CREATE TABLE IF NOT EXISTS public.chat_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_invitations ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
DROP POLICY IF EXISTS "Tout le monde peut voir les posts" ON public.posts;
CREATE POLICY "Tout le monde peut voir les posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres posts" ON public.posts;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres posts" ON public.posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tout le monde peut voir les likes" ON public.post_likes;
CREATE POLICY "Tout le monde peut voir les likes" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent liker" ON public.post_likes;
CREATE POLICY "Les utilisateurs peuvent liker" ON public.post_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tout le monde peut voir les commentaires" ON public.post_comments;
CREATE POLICY "Tout le monde peut voir les commentaires" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Les utilisateurs peuvent commenter" ON public.post_comments;
CREATE POLICY "Les utilisateurs peuvent commenter" ON public.post_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Voir ses propres invitations" ON public.chat_invitations;
CREATE POLICY "Voir ses propres invitations" ON public.chat_invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Envoyer des invitations" ON public.chat_invitations;
CREATE POLICY "Envoyer des invitations" ON public.chat_invitations FOR INSERT WITH CHECK (true);
`;

async function deploy() {
    console.log('🚀 Tentative de déploiement via RPC exec_sql...');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query: sqlScript });

        if (error) {
            // Ressayer avec 'sql' au lieu de 'query' (dépend de comment la fonction a été nommée)
            console.log('⚠️ Échec avec "query", tentative avec "sql"...');
            const { data: data2, error: error2 } = await supabase.rpc('exec_sql', { sql: sqlScript });

            if (error2) {
                throw error2;
            }
            console.log('✅ Déploiement réussi (via paramètre "sql") !');
        } else {
            console.log('✅ Déploiement réussi (via paramètre "query") !');
        }
    } catch (error) {
        console.error('❌ Erreur:', error.message || error);
        console.log('\nIl semble que la fonction RPC exec_sql ne soit pas disponible ou que les permissions soient insuffisantes.');
    }
}

deploy();
