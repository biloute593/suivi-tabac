import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumns() {
  console.log('🔧 Ajout des colonnes dans la table users...');
  
  // Tester si on peut accéder à la table
  const { data: testUser, error: testError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single();

  if (testError) {
    console.error('❌ Erreur:', testError);
    process.exit(1);
  }

  console.log('✅ Table users accessible');
  console.log('ℹ️  Colonnes actuelles:', Object.keys(testUser));
  
  // Vérifier si les colonnes existent déjà
  const hasNewColumns = 'date_naissance' in testUser && 
                        'debut_tabagisme' in testUser && 
                        'cigarettes_par_jour_max' in testUser;

  if (hasNewColumns) {
    console.log('✅ Les colonnes existent déjà !');
  } else {
    console.log('⚠️  Les colonnes n\'existent pas encore. Veuillez les ajouter manuellement via le dashboard Supabase:');
    console.log('   1. Allez sur https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/editor');
    console.log('   2. Sélectionnez la table "users"');
    console.log('   3. Ajoutez les colonnes:');
    console.log('      - date_naissance (type: date, nullable)');
    console.log('      - debut_tabagisme (type: date, nullable)');
    console.log('      - cigarettes_par_jour_max (type: int4, default: 20, nullable)');
  }
  
  console.log('\n📊 Mise à jour du compte LYDIE pour tester...');
  
  // Essayer de mettre à jour avec les nouvelles colonnes
  const { data: updateResult, error: updateError } = await supabase
    .from('users')
    .update({
      date_naissance: '1985-01-01',
      debut_tabagisme: '2005-01-01',
      cigarettes_par_jour_max: 20
    })
    .eq('pseudo', 'LYDIE')
    .select();

  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError);
  } else {
    console.log('✅ Compte LYDIE mis à jour avec succès !');
    console.log('   Données:', updateResult[0]);
  }
}

addColumns().catch(console.error);
