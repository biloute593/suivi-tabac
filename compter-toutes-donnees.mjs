import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compterToutesLesDonnees() {
  console.log('\n📊 COMPTAGE COMPLET DES DONNÉES DE LYDIE\n');

  // Compter toutes les journées
  const { count: totalJournees, error: errorJournees } = await supabase
    .from('journees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  if (errorJournees) {
    console.error('❌ Erreur lors du comptage des journées:', errorJournees.message);
  } else {
    console.log(`✅ Total de journées: ${totalJournees}`);
  }

  // Compter les journées de décembre
  const { count: journeesDecembre, error: errorDec } = await supabase
    .from('journees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID)
    .gte('date', '2025-12-01')
    .lte('date', '2025-12-11');

  if (errorDec) {
    console.error('❌ Erreur décembre:', errorDec.message);
  } else {
    console.log(`   📅 Décembre (1-11): ${journeesDecembre} journées`);
  }

  // Compter les journées de novembre
  const { count: journeesNovembre, error: errorNov } = await supabase
    .from('journees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID)
    .gte('date', '2025-11-01')
    .lte('date', '2025-11-30');

  if (errorNov) {
    console.error('❌ Erreur novembre:', errorNov.message);
  } else {
    console.log(`   📅 Novembre: ${journeesNovembre} journées`);
  }

  // Récupérer toutes les journées pour voir les dates
  const { data: toutesJournees, error: errorAll } = await supabase
    .from('journees')
    .select('date, type_journee')
    .eq('user_id', LYDIE_USER_ID)
    .order('date', { ascending: true });

  if (errorAll) {
    console.error('❌ Erreur:', errorAll.message);
  } else {
    console.log(`\n📋 Liste complète de toutes les journées (${toutesJournees.length} total):`);
    toutesJournees.forEach((j, index) => {
      console.log(`   ${index + 1}. ${j.date} - ${j.type_journee}`);
    });
  }

  // Compter toutes les cigarettes
  const { count: totalCigarettes, error: errorCig } = await supabase
    .from('cigarettes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  if (errorCig) {
    console.error('❌ Erreur cigarettes:', errorCig.message);
  } else {
    console.log(`\n🚬 Total de cigarettes: ${totalCigarettes}`);
  }

  console.log('\n✨ Vérification terminée !\n');
}

compterToutesLesDonnees().catch(console.error);
