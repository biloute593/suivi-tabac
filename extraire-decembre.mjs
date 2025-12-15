import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function extraireEtMigrerDecembre() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📦 EXTRACTION ET MIGRATION - DONNÉES DÉCEMBRE 2025');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

  try {
    // 1. Vérifier le compte LYDIE
    console.log('🔐 Étape 1: Vérification du compte LYDIE...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pseudo, user_id')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (userError) {
      console.log('❌ Erreur:', userError.message);
      return;
    }

    console.log('✅ Compte vérifié: LYDIE');
    console.log(`✅ User ID: ${user.user_id}\n`);

    // 2. Chercher les données de décembre dans IndexedDB ou autres comptes
    console.log('🔍 Étape 2: Recherche des données décembre 2025...');
    
    // Chercher toutes les journées de décembre dans la base
    const { data: journeesDecembre, error: journeesError } = await supabase
      .from('journees')
      .select('*')
      .gte('date', '2025-12-01')
      .lte('date', '2025-12-11')
      .neq('user_id', LYDIE_USER_ID); // Exclure celles déjà dans le compte LYDIE

    if (journeesError) {
      console.log('❌ Erreur recherche journées:', journeesError.message);
    } else {
      console.log(`📅 Trouvé: ${journeesDecembre?.length || 0} journées en décembre (autres comptes)`);
    }

    // Chercher les cigarettes de décembre
    if (journeesDecembre && journeesDecembre.length > 0) {
      console.log('\n🚬 Étape 3: Migration des cigarettes vers le compte LYDIE...');
      
      let totalMigre = 0;
      
      for (const journee of journeesDecembre) {
        // Récupérer les cigarettes de cette journée
        const { data: cigarettes, error: cigError } = await supabase
          .from('cigarettes')
          .select('*')
          .eq('journee_id', journee.id);

        if (cigError) {
          console.log(`❌ Erreur lecture cigarettes journée ${journee.date}:`, cigError.message);
          continue;
        }

        console.log(`\n   📆 ${journee.date} - ${cigarettes?.length || 0} cigarettes à migrer`);

        // Créer la journée pour LYDIE
        const { data: nouvelleJournee, error: createJourneeError } = await supabase
          .from('journees')
          .insert({
            user_id: LYDIE_USER_ID,
            date: journee.date,
            type_journee: journee.type_journee || 'travail',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createJourneeError) {
          console.log(`   ❌ Erreur création journée:`, createJourneeError.message);
          continue;
        }

        console.log(`   ✅ Journée créée (ID: ${nouvelleJournee.id})`);

        // Migrer les cigarettes
        if (cigarettes && cigarettes.length > 0) {
          const cigarettesAInserer = cigarettes.map(c => ({
            user_id: LYDIE_USER_ID,
            journee_id: nouvelleJournee.id,
            heure: c.heure,
            lieu: c.lieu,
            avec_cafe: c.avec_cafe || false,
            moment_journee: c.moment_journee || 'autre',
            created_at: new Date().toISOString()
          }));

          const { error: insertCigError } = await supabase
            .from('cigarettes')
            .insert(cigarettesAInserer);

          if (insertCigError) {
            console.log(`   ❌ Erreur insertion cigarettes:`, insertCigError.message);
          } else {
            console.log(`   ✅ ${cigarettes.length} cigarettes migrées`);
            totalMigre += cigarettes.length;
          }
        }
      }

      console.log(`\n✅ Migration terminée: ${totalMigre} cigarettes ajoutées au compte LYDIE\n`);
    } else {
      console.log('ℹ️ Aucune donnée de décembre trouvée dans d\'autres comptes\n');
      console.log('💡 Les données peuvent être dans IndexedDB (localStorage du navigateur)');
      console.log('💡 Pour les migrer, vous devez vous connecter dans l\'application');
      console.log('💡 et ajouter les cigarettes manuellement ou via l\'import Excel\n');
    }

    // 3. Vérification finale
    console.log('📊 Étape 4: Vérification finale du compte LYDIE...');
    
    const { data: journeesLydie, error: verifError } = await supabase
      .from('journees')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .gte('date', '2025-12-01')
      .lte('date', '2025-12-11');

    if (verifError) {
      console.log('❌ Erreur vérification:', verifError.message);
    } else {
      console.log(`✅ Journées décembre dans le compte LYDIE: ${journeesLydie?.length || 0}`);
      
      if (journeesLydie && journeesLydie.length > 0) {
        let totalCigarettes = 0;
        for (const journee of journeesLydie) {
          const { count } = await supabase
            .from('cigarettes')
            .select('*', { count: 'exact', head: true })
            .eq('journee_id', journee.id);
          
          totalCigarettes += count || 0;
          console.log(`   • ${journee.date}: ${count || 0} cigarettes`);
        }
        console.log(`\n✅ Total cigarettes en décembre: ${totalCigarettes}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ EXTRACTION ET MIGRATION TERMINÉES');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  }
}

extraireEtMigrerDecembre();
