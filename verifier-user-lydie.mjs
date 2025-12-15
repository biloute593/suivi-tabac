import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Vérification du compte LYDIE dans Supabase...\n');

// Vérifier l'utilisateur LYDIE
const { data: users, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('pseudo', 'LYDIE');

if (userError) {
  console.error('❌ Erreur:', userError.message);
} else if (!users || users.length === 0) {
  console.log('❌ PROBLÈME: Aucun compte LYDIE trouvé dans Supabase!');
  console.log('\n📝 SOLUTION: Tu dois te reconnecter avec LYDIE dans l\'app');
  console.log('   Ou créer le compte LYDIE si pas encore fait.');
} else {
  const lydie = users[0];
  console.log('✅ Compte LYDIE trouvé!');
  console.log(`   User ID: ${lydie.user_id}`);
  console.log(`   Pseudo: ${lydie.pseudo}`);
  console.log(`   Objectif: ${lydie.objectif_global}`);
  console.log(`   Partage public: ${lydie.share_public}`);
  
  // Compter les données
  const { data: journees } = await supabase
    .from('journees')
    .select('*')
    .eq('user_id', lydie.user_id);
  
  const { data: cigarettes } = await supabase
    .from('cigarettes')
    .select('*')
    .eq('user_id', lydie.user_id);
  
  console.log(`\n📊 Données de LYDIE:`);
  console.log(`   📅 Journées: ${journees?.length || 0}`);
  console.log(`   🚬 Cigarettes: ${cigarettes?.length || 0}`);
  
  if (journees && journees.length > 0) {
    const dates = journees.map(j => j.date).sort();
    console.log(`   📆 Première date: ${dates[0]}`);
    console.log(`   📆 Dernière date: ${dates[dates.length - 1]}`);
  }
}
