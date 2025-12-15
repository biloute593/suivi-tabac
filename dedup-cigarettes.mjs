import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function keyFor(c) {
  // Define duplicate key: same user, same date (via journee), same numero and heure
  return `${c.user_id}|${c.journee_id}|${c.numero}|${c.heure}`;
}

async function dedupForUser(pseudoLike = 'lydie') {
  const { data: users, error: uerr } = await supabase.from('users').select('*').ilike('pseudo', pseudoLike);
  if (uerr) throw uerr;
  if (!users || users.length === 0) throw new Error('Utilisateur introuvable');
  const userId = users[0].user_id;

  // Fetch all cigarettes for user
  const { data: cigs, error: cerr } = await supabase
    .from('cigarettes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (cerr) throw cerr;

  console.log(`🔎 Cigarettes pour ${userId}: ${cigs.length}`);

  const map = new Map();
  const duplicates = [];

  for (const c of cigs) {
    const k = keyFor(c);
    if (!map.has(k)) {
      map.set(k, c);
    } else {
      // Treat as duplicate; keep the earliest created (already ordered asc), so mark current for delete
      duplicates.push(c);
    }
  }

  console.log(`🧹 Doublons détectés: ${duplicates.length}`);

  let deleted = 0;
  for (const d of duplicates) {
    const { error: derr } = await supabase.from('cigarettes').delete().eq('id', d.id).eq('user_id', userId);
    if (derr) {
      console.warn('Suppression échouée pour', d.id, derr.message);
    } else {
      deleted++;
    }
  }

  console.log(`✅ Supprimés: ${deleted}`);

  const { data: cigsAfter } = await supabase
    .from('cigarettes')
    .select('id')
    .eq('user_id', userId);
  console.log(`📊 Total après nettoyage: ${cigsAfter?.length || 0}`);
}

await dedupForUser().catch(err => { console.error('Erreur dédup:', err); process.exit(1); });
