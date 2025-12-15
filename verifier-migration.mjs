import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function verifier() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VÉRIFICATION COMPLÈTE - DONNÉES LYDIE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let allGood = true;

  try {
    // 1. Vérifier le profil
    console.log('1️⃣ Vérification PROFIL...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (userError) {
      console.log('   ❌ Erreur:', userError.message);
      allGood = false;
    } else {
      console.log(`   ✅ Pseudo: ${user.pseudo}`);
      console.log(`   ✅ Objectif: ${user.objectif_global} cigarettes/jour`);
      if (!user.objectif_global || user.objectif_global === 0) {
        console.log('   ⚠️ ATTENTION: Objectif pas défini !');
        allGood = false;
      }
    }

    // 2. Vérifier user_metadata
    console.log('\n2️⃣ Vérification SANTÉ (user_metadata)...');
    const { data: metadata, error: metaError } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (metaError) {
      if (metaError.code === 'PGRST205') {
        console.log('   ❌ Table user_metadata n\'existe pas !');
        console.log('   👉 Exécutez MIGRATION_LYDIE.sql dans Supabase Dashboard');
        allGood = false;
      } else if (metaError.code === 'PGRST116') {
        console.log('   ❌ Aucune entrée trouvée pour LYDIE !');
        console.log('   👉 Exécutez MIGRATION_LYDIE.sql dans Supabase Dashboard');
        allGood = false;
      } else {
        console.log('   ❌ Erreur:', metaError.message);
        allGood = false;
      }
    } else {
      console.log('   ✅ Entrée user_metadata existe');
      console.log(`   📅 Date naissance: ${metadata.date_naissance || 'À REMPLIR (normal)'}`);
      console.log(`   📅 Début tabagisme: ${metadata.debut_tabagisme || 'À REMPLIR (normal)'}`);
      console.log(`   🚬 Max cigarettes/jour: ${metadata.cigarettes_par_jour_max}`);
    }

    // 3. Vérifier les journées
    console.log('\n3️⃣ Vérification JOURNÉES...');
    const { count: journeesCount, error: journeesError } = await supabase
      .from('journees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    if (journeesError) {
      console.log('   ❌ Erreur:', journeesError.message);
      allGood = false;
    } else {
      console.log(`   ✅ Total: ${journeesCount} journées`);
      if (journeesCount === 0) {
        console.log('   ⚠️ Aucune journée trouvée');
        allGood = false;
      }
    }

    // 4. Vérifier les cigarettes
    console.log('\n4️⃣ Vérification CIGARETTES...');
    const { count: cigarettesCount, error: cigarettesError } = await supabase
      .from('cigarettes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    if (cigarettesError) {
      console.log('   ❌ Erreur:', cigarettesError.message);
      allGood = false;
    } else {
      console.log(`   ✅ Total: ${cigarettesCount} cigarettes`);
      if (cigarettesCount === 0) {
        console.log('   ⚠️ Aucune cigarette trouvée');
        allGood = false;
      }
    }

    // Résumé final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allGood) {
      console.log('✅ ✅ ✅ TOUT EST PARFAIT ! ✅ ✅ ✅');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎉 Toutes les données de LYDIE sont dans le cloud !\n');
      console.log('📊 Résumé:');
      console.log(`   • Profil: ✅ (pseudo: ${user.pseudo}, objectif: ${user.objectif_global})`);
      console.log(`   • Santé: ✅ (cigarettes max: ${metadata.cigarettes_par_jour_max})`);
      console.log(`   • Journées: ✅ (${journeesCount} entrées)`);
      console.log(`   • Cigarettes: ✅ (${cigarettesCount} entrées)\n`);
      console.log('🚀 Prochaines étapes:');
      console.log('   1. Lancez: npm run dev');
      console.log('   2. Connectez-vous: LYDIE / LYDIE59');
      console.log('   3. Allez dans "Santé" → Remplir les dates');
      console.log('   4. Déployez en prod: npm run build + swa deploy\n');
    } else {
      console.log('⚠️ ⚠️ ⚠️ PROBLÈMES DÉTECTÉS ⚠️ ⚠️ ⚠️');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🔧 SOLUTION:');
      console.log('   1. Ouvrez: https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new');
      console.log('   2. Copiez TOUT le contenu de: MIGRATION_LYDIE.sql');
      console.log('   3. Collez dans l\'éditeur SQL');
      console.log('   4. Cliquez sur RUN');
      console.log('   5. Re-lancez ce script: node verifier-migration.mjs\n');
    }

  } catch (error) {
    console.log('\n❌ ❌ ❌ ERREUR CRITIQUE ❌ ❌ ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    console.log('\n🆘 Contactez le support ou vérifiez:');
    console.log('   • Connexion Internet active');
    console.log('   • Supabase accessible');
    console.log('   • Service role key valide\n');
  }
}

verifier();
