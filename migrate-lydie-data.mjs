import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function migrateData() {
  console.log('🔍 Vérification des données actuelles de LYDIE...\n');

  try {
    // 1. Vérifier le profil actuel dans users
    console.log('📊 Profil actuel dans la table users:');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pseudo, objectif_global, share_public')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (userError) {
      console.error('❌ Erreur lecture profil:', userError);
      return;
    }

    console.log(`   Pseudo: ${user.pseudo}`);
    console.log(`   Objectif global: ${user.objectif_global || 'NON DÉFINI'}`);
    console.log(`   Partage public: ${user.share_public || false}\n`);

    // 2. Vérifier si user_metadata existe
    console.log('🗄️ Vérification table user_metadata...');
    const { data: metadata, error: metaError } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (metaError && metaError.code !== 'PGRST116') {
      console.error('❌ Erreur lecture métadonnées:', metaError.message);
      if (metaError.code === 'PGRST205') {
        console.log('\n⚠️ La table user_metadata n\'existe pas encore !');
        console.log('👉 Exécutez le SQL depuis QUICKSTART_CLOUD.md dans Supabase Dashboard');
        return;
      }
      return;
    }

    if (metaError && metaError.code === 'PGRST116') {
      console.log('   ℹ️ Aucune métadonnée trouvée pour LYDIE\n');
    } else {
      console.log('   ✅ Métadonnées existantes:');
      console.log(`      Date naissance: ${metadata.date_naissance || 'NON DÉFINI'}`);
      console.log(`      Début tabagisme: ${metadata.debut_tabagisme || 'NON DÉFINI'}`);
      console.log(`      Cigarettes max/jour: ${metadata.cigarettes_par_jour_max || 'NON DÉFINI'}\n`);
    }

    // 3. Vérifier les journées et cigarettes
    console.log('📅 Vérification des données de suivi:');
    const { count: journeesCount } = await supabase
      .from('journees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    const { count: cigarettesCount } = await supabase
      .from('cigarettes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', LYDIE_USER_ID);

    console.log(`   Journées: ${journeesCount || 0}`);
    console.log(`   Cigarettes: ${cigarettesCount || 0}\n`);

    // 4. Proposer la migration si données manquantes
    if (!user.objectif_global || user.objectif_global === 0) {
      console.log('⚠️ ATTENTION: objectif_global n\'est pas défini !');
      console.log('   Valeur par défaut recommandée: 12 cigarettes/jour\n');
      
      console.log('🔧 Mise à jour de l\'objectif_global à 12...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ objectif_global: 12 })
        .eq('user_id', LYDIE_USER_ID);

      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError);
      } else {
        console.log('✅ Objectif_global mis à jour avec succès !\n');
      }
    }

    // 5. Créer ou mettre à jour user_metadata avec valeurs par défaut si vide
    if (metaError && metaError.code === 'PGRST116') {
      console.log('🔧 Création de l\'entrée user_metadata avec valeurs par défaut...');
      const { error: insertError } = await supabase
        .from('user_metadata')
        .insert({
          user_id: LYDIE_USER_ID,
          cigarettes_par_jour_max: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Erreur création métadonnées:', insertError);
      } else {
        console.log('✅ Métadonnées créées avec succès !\n');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ RÉSUMÉ FINAL - Profil LYDIE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Relire les données finales
    const { data: finalUser } = await supabase
      .from('users')
      .select('pseudo, objectif_global')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    const { data: finalMeta } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    console.log(`\n👤 Profil:`);
    console.log(`   - Pseudo: ${finalUser?.pseudo || 'N/A'}`);
    console.log(`   - Objectif: ${finalUser?.objectif_global || 'NON DÉFINI'} cigarettes/jour`);
    
    console.log(`\n💚 Santé:`);
    console.log(`   - Date naissance: ${finalMeta?.date_naissance || 'À REMPLIR dans l\'app'}`);
    console.log(`   - Début tabagisme: ${finalMeta?.debut_tabagisme || 'À REMPLIR dans l\'app'}`);
    console.log(`   - Max cigarettes/jour: ${finalMeta?.cigarettes_par_jour_max || 'NON DÉFINI'}`);
    
    console.log(`\n📊 Données de suivi:`);
    console.log(`   - Journées: ${journeesCount || 0}`);
    console.log(`   - Cigarettes: ${cigarettesCount || 0}`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!finalMeta?.date_naissance && !finalMeta?.debut_tabagisme) {
      console.log('ℹ️ Les informations santé sont vides.');
      console.log('   LYDIE peut les remplir dans l\'application:');
      console.log('   1. Se connecter avec LYDIE / LYDIE59');
      console.log('   2. Aller dans l\'onglet "Santé"');
      console.log('   3. Cliquer sur "Modifier" dans la section infos personnelles');
      console.log('   4. Remplir les dates et sauvegarder\n');
    }

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

migrateData();
