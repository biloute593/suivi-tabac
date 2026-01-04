import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function createTableAndMigrate() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 MIGRATION COMPLÈTE DES DONNÉES LYDIE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Étape 1: Créer la table user_metadata via SQL brut
    console.log('📦 Étape 1: Création de la table user_metadata...');
    
    const createTableSQL = `
      -- Créer la table user_metadata
      CREATE TABLE IF NOT EXISTS user_metadata (
        user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        date_naissance DATE,
        debut_tabagisme DATE,
        cigarettes_par_jour_max INTEGER DEFAULT 20,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Activer RLS
      ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

      -- Supprimer les policies existantes si elles existent
      DROP POLICY IF EXISTS "Allow users to view own metadata" ON user_metadata;
      DROP POLICY IF EXISTS "Allow users to insert own metadata" ON user_metadata;
      DROP POLICY IF EXISTS "Allow users to update own metadata" ON user_metadata;

      -- Créer les nouvelles policies
      CREATE POLICY "Allow users to view own metadata" ON user_metadata
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Allow users to insert own metadata" ON user_metadata
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Allow users to update own metadata" ON user_metadata
        FOR UPDATE USING (auth.uid() = user_id);
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (sqlError) {
      console.error('❌ Erreur création table:', sqlError);
      console.log('\n⚠️ SOLUTION MANUELLE REQUISE:');
      console.log('👉 Ouvrez: https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new');
      console.log('👉 Copiez-collez le SQL depuis QUICKSTART_CLOUD.md');
      console.log('👉 Cliquez sur RUN\n');
      return;
    }

    console.log('✅ Table user_metadata créée avec succès !\n');

    // Attendre un peu pour que la table soit disponible
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Étape 2: Vérifier les données actuelles de LYDIE
    console.log('📊 Étape 2: Vérification des données actuelles...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Erreur lecture profil LYDIE:', userError);
      return;
    }

    console.log(`   ✅ Pseudo: ${user.pseudo}`);
    console.log(`   ✅ Objectif: ${user.objectif_global || 'NON DÉFINI'}`);
    console.log(`   ✅ Partage public: ${user.share_public || false}\n`);

    // Étape 3: S'assurer que objectif_global est défini
    if (!user.objectif_global || user.objectif_global === 0) {
      console.log('🔧 Étape 3: Mise à jour de objectif_global...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ objectif_global: 12 })
        .eq('user_id', LYDIE_USER_ID);

      if (updateError) {
        console.error('❌ Erreur mise à jour objectif:', updateError);
      } else {
        console.log('   ✅ Objectif mis à jour: 12 cigarettes/jour\n');
      }
    } else {
      console.log(`✅ Étape 3: Objectif déjà défini: ${user.objectif_global} cigarettes/jour\n`);
    }

    // Étape 4: Créer l'entrée user_metadata pour LYDIE
    console.log('📝 Étape 4: Création des métadonnées pour LYDIE...');
    
    const { error: insertError } = await supabase
      .from('user_metadata')
      .upsert({
        user_id: LYDIE_USER_ID,
        cigarettes_par_jour_max: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error('❌ Erreur création métadonnées:', insertError);
    } else {
      console.log('   ✅ Métadonnées créées avec succès !\n');
    }

    // Étape 5: Vérifier les données de suivi
    console.log('📅 Étape 5: Vérification des données de suivi...');
    
    const { count: journeesCount } = await supabase
      .from('journees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    const { count: cigarettesCount } = await supabase
      .from('cigarettes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    console.log(`   ✅ Journées: ${journeesCount || 0}`);
    console.log(`   ✅ Cigarettes: ${cigarettesCount || 0}\n`);

    // Résumé final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRATION TERMINÉE - RÉSUMÉ COMPLET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Relire toutes les données finales
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    const { data: finalMeta } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    console.log('👤 PROFIL UTILISATEUR:');
    console.log(`   User ID: ${LYDIE_USER_ID}`);
    console.log(`   Pseudo: ${finalUser?.pseudo || 'N/A'}`);
    console.log(`   Objectif quotidien: ${finalUser?.objectif_global || 'NON DÉFINI'} cigarettes/jour`);
    console.log(`   Partage public: ${finalUser?.share_public ? 'OUI' : 'NON'}`);
    console.log(`   Créé le: ${new Date(finalUser?.created_at).toLocaleDateString('fr-FR')}\n`);

    console.log('💚 INFORMATIONS SANTÉ:');
    console.log(`   Date naissance: ${finalMeta?.date_naissance || '❌ À REMPLIR'}`);
    console.log(`   Début tabagisme: ${finalMeta?.debut_tabagisme || '❌ À REMPLIR'}`);
    console.log(`   Max cigarettes/jour: ${finalMeta?.cigarettes_par_jour_max || 20}\n`);

    console.log('📊 DONNÉES DE SUIVI:');
    console.log(`   Total journées: ${journeesCount || 0}`);
    console.log(`   Total cigarettes: ${cigarettesCount || 0}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 PROCHAINES ÉTAPES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. ✅ Table user_metadata créée');
    console.log('2. ✅ Données LYDIE migrées dans le cloud');
    console.log('3. ✅ Objectif quotidien configuré');
    console.log('4. ⏳ Lancer l\'application: npm run dev');
    console.log('5. ⏳ Remplir les infos santé dans l\'onglet "Santé"');
    console.log('6. ⏳ Déployer en production\n');

    console.log('🌐 URL Production: https://ambitious-dune-0b02f5a03.3.azurestaticapps.net');
    console.log('🔑 Identifiants: LYDIE / LYDIE59\n');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    console.log('\n⚠️ Si l\'erreur persiste, exécutez le SQL manuellement:');
    console.log('👉 https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new\n');
  }
}

createTableAndMigrate();
