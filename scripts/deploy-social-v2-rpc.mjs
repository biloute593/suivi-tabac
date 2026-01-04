import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
// Using the service role key found in deploy-via-rpc.mjs
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sqlScript = `
-- 1. Table des Amitiés (Friendships)
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id)
);

-- 2. Table des Messages Privés
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (RLS)

-- Friendships:
-- Voir ses propres amitiés (demandeur ou receveur)
DROP POLICY IF EXISTS "Voir ses propres amities" ON public.friendships;
CREATE POLICY "Voir ses propres amities" ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Créer une demande d'ami (soi-même comme user_id)
DROP POLICY IF EXISTS "Creer demande ami" ON public.friendships;
CREATE POLICY "Creer demande ami" ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Mettre à jour (accepter/refuser) si on est concerné
DROP POLICY IF EXISTS "MAJ amities" ON public.friendships;
CREATE POLICY "MAJ amities" ON public.friendships FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Messages:
-- Voir les messages où on est expéditeur ou destinataire
DROP POLICY IF EXISTS "Voir ses messages" ON public.messages;
CREATE POLICY "Voir ses messages" ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Envoyer un message (en tant qu'expéditeur)
DROP POLICY IF EXISTS "Envoyer message" ON public.messages;
CREATE POLICY "Envoyer message" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Mettre à jour (marquer comme lu) si on est destinataire
DROP POLICY IF EXISTS "MAJ messages" ON public.messages;
CREATE POLICY "MAJ messages" ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);
`;

async function deploy() {
    console.log('🚀 Tentative de déploiement via RPC exec_sql...');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query: sqlScript });

        if (error) {
            console.log('⚠️ Échec avec "query", tentative avec "sql"...');
            // Some implementations use 'sql' param instead of 'query'
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
        console.log('\nSi exec_sql n\'existe pas, vous devrez exécuter le SQL manuellement dans le dashboard Supabase.');
    }
}

deploy();
