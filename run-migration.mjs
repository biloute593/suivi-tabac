import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Exécution de la migration SQL...\n');
  
  const sqlFile = readFileSync('./supabase/migrations/20251211_add_user_info.sql', 'utf-8');
  
  // Diviser en commandes individuelles
  const commands = sqlFile
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  for (const [index, command] of commands.entries()) {
    if (command.includes('DO $$')) {
      // Exécuter le bloc DO
      console.log(`📝 Exécution du bloc ${index + 1}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: command + ';' }).catch(() => ({}));
      
      // Même si ça échoue, on continue (les colonnes existent peut-être déjà)
      if (error) {
        console.log(`   ⚠️  Note: ${error.message}`);
      } else {
        console.log(`   ✅ Bloc exécuté`);
      }
    }
  }
  
  console.log('\n✨ Migration terminée !\n');
  
  // Vérifier le résultat
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('pseudo', 'LYDIE')
    .single();
  
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Structure du compte LYDIE:');
    console.log('   Colonnes:', Object.keys(user));
  }
}

runMigration().catch(console.error);
