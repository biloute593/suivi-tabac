import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function keyFor(c) {
  return `${c.user_id}|${c.journee_id}|${c.numero}|${c.heure}`;
}

async function checkDuplicates(pseudoLike = 'lydie') {
  const { data: users, error: uerr } = await supabase.from('users').select('*').ilike('pseudo', pseudoLike);
  if (uerr) throw uerr;
  if (!users || users.length === 0) throw new Error('Utilisateur introuvable');
  const userId = users[0].user_id;

  const { data: cigs, error: cerr } = await supabase
    .from('cigarettes')
    .select('id,user_id,journee_id,numero,heure')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (cerr) throw cerr;

  const seen = new Map();
  let duplicates = 0;
  for (const c of cigs) {
    const k = keyFor(c);
    if (seen.has(k)) {
      duplicates++;
    } else {
      seen.set(k, c.id);
    }
  }

  console.log(`Cigarettes totales: ${cigs.length}`);
  console.log(`Doublons restants (même journee_id/numero/heure): ${duplicates}`);
  if (duplicates > 0) {
    console.log('Exemple de doublon clé:', [...seen.keys()].find(k => {
      const count = cigs.filter(c => keyFor(c) === k).length;
      return count > 1;
    }));
  }
}

checkDuplicates().catch(err => { console.error('Erreur check:', err); process.exit(1); });
