import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Recherche de TOUTES les données dans Supabase...\n');

// Compter toutes les données
const { data: allJournees } = await supabase
  .from('journees')
  .select('user_id, date, type_journee');

const { data: allCigs } = await supabase
  .from('cigarettes')
  .select('user_id, journee_id');

console.log(`📊 Total dans Supabase:`);
console.log(`   📅 Journées: ${allJournees?.length || 0}`);
console.log(`   🚬 Cigarettes: ${allCigs?.length || 0}`);

if (allJournees && allJournees.length > 0) {
  // Grouper par user_id
  const byUser = {};
  for (const j of allJournees) {
    if (!byUser[j.user_id]) byUser[j.user_id] = [];
    byUser[j.user_id].push(j);
  }
  
  console.log(`\n👥 Données par utilisateur:`);
  for (const [userId, journees] of Object.entries(byUser)) {
    const userCigs = allCigs?.filter(c => {
      const journeeIds = journees.map(j => j.id);
      return journees.some(j => allJournees.find(aj => aj.user_id === userId));
    });
    console.log(`\n   User ID: ${userId}`);
    console.log(`   📅 ${journees.length} journées`);
    console.log(`   📆 Dates: ${journees[0].date} → ${journees[journees.length-1].date}`);
  }
  
  // Compter les cigarettes par user
  console.log(`\n🚬 Cigarettes par user:`);
  const cigsByUser = {};
  for (const c of allCigs || []) {
    if (!cigsByUser[c.user_id]) cigsByUser[c.user_id] = 0;
    cigsByUser[c.user_id]++;
  }
  for (const [userId, count] of Object.entries(cigsByUser)) {
    console.log(`   ${userId}: ${count} cigarettes`);
  }
}
