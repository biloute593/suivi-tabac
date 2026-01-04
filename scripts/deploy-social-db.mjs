import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

// Utilisation du pooler (port 6543) car le port 5432 est souvent bloqué
const connectionString = 'postgresql://postgres:Ly3625die_Baconnette@db.azzltzrzmukvyaiyamkc.supabase.co:6543/postgres';

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

-- Politiques de sécurité (Exemple simple)
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
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connecté à Supabase PostgreSQL\n');

        console.log('📝 Exécution du script de configuration sociale...');
        await client.query(sqlScript);
        console.log('✅ Schéma social déployé avec succès !\n');

        // Vérification
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('posts', 'post_likes', 'post_comments', 'chat_invitations');
    `);

        console.log('📊 Tables créées :');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Erreur de déploiement:', error.message);
    } finally {
        await client.end();
    }
}

deploy();
