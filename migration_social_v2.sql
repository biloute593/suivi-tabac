-- 1. Table dey Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id)
);

-- 2. Table des Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Friendships
DROP POLICY IF EXISTS "Voir ses propres amities" ON public.friendships;
CREATE POLICY "Voir ses propres amities" ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Creer demande ami" ON public.friendships;
CREATE POLICY "Creer demande ami" ON public.friendships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "MAJ amities" ON public.friendships;
CREATE POLICY "MAJ amities" ON public.friendships FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policies for Messages
DROP POLICY IF EXISTS "Voir ses messages" ON public.messages;
CREATE POLICY "Voir ses messages" ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Envoyer message" ON public.messages;
CREATE POLICY "Envoyer message" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "MAJ messages" ON public.messages;
CREATE POLICY "MAJ messages" ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);
