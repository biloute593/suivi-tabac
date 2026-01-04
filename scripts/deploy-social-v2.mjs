import pkg from 'pg';
const { Client } = pkg;

// Utilisation du pooler (port 6543)
const connectionString = 'postgresql://postgres:Ly3625die_Baconnette@db.azzltzrzmukvyaiyamkc.supabase.co:6543/postgres';

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
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à Supabase PostgreSQL');

    console.log('📝 Exécution du script de configuration Friendships & Messages...');
    await client.query(sqlScript);
    console.log('✅ Tables friendships et messages créées/vérifiées !');

    // Vérification
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('friendships', 'messages');
    `);

    console.log('📊 Tables trouvées :');
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
