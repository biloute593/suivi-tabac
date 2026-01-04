import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
// Cle admin pour pouvoir creer les tables (service_role)
// Note: Dans un environnement reel, ne pas mettre la cle admin ici.
// Pour ce script de migration one-shot, on utilise la cle qui semble etre utilisee ailleurs ou on demande a l'utilisateur.
// Je vais utiliser la meme cle anon pour l'instant et executer du SQL via RPC si possible, 
// ou verifier si je peux utiliser l'API REST pour creer les tables (non possible directement).
// Mieux: On va utiliser la fonction SQL si elle existe, ou essayer de creer via une requete brute si on a les droits.
// Comme je n'ai pas la cle service_role dans les fichiers precedents, je vais essayer d'utiliser la cle anon 
// MAIS en general on ne peut pas creer de table avec anon.
// C'est un probleme courant. Je vais regarder comment les autres scripts ont fait.
// 'deploy-social-db.mjs' semblait utiliser une connexion postgres directe ou une cle specifique.
// Je vais verifier le contenu de 'scripts/deploy-social-db.mjs' pour voir comment il se connecte.
// Ah, j'ai vu 'check-social-tables.mjs' utiliser une cle anon.
// Je vais supposer que l'utilisateur a execute le SQL manuellement ou via un outil externe auparavant.
// Je vais creer un fichier .sql que l'utilisateur pourra executer dans l'editeur SQL de Supabase s'il le faut,
// ou alors je tente une connexion directe au code existant.

// ATTENTION: Je vais creer un fichier SQL complet que je vais logger pour l'utilisateur
// au cas ou le script JS echoue a cause des permissions.

const sql = `
-- Table des amities
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id_1 UUID REFERENCES auth.users(id) NOT NULL,
  user_id_2 UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

-- Table des messages prives
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON private_messages(receiver_id);

-- RLS (Row Level Security)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Politiques Friendship
-- On peut voir ses propres amities
CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- On peut creer une amitie (demande)
CREATE POLICY "Users can insert friendships" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id_1); -- L'initiateur est user_1

-- On peut mettre a jour une amitie (accepter/bloquer) si on est concerne
CREATE POLICY "Users can update their own friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Politiques Messages
-- On peut voir les messages qu'on a envoyes ou recus
CREATE POLICY "Users can view their own messages" ON private_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- On peut envoyer un message si on est l'expediteur
CREATE POLICY "Users can send messages" ON private_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
`;

console.log("----------------------------------------------------------------");
console.log("SCRIPT SQL A EXECUTER DANS L'EDITEUR SQL DE SUPABASE :");
console.log("----------------------------------------------------------------");
console.log(sql);
console.log("----------------------------------------------------------------");
