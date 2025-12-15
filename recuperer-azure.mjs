import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function recupererDepuisAzure() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 RECHERCHE DES DONNÉES DÉCEMBRE DANS TOUS LES COMPTES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Lister TOUS les utilisateurs
    console.log('👥 Étape 1: Liste de tous les utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, pseudo, created_at');

    if (usersError) {
      console.log('❌ Erreur:', usersError.message);
      return;
    }

    console.log(`✅ Trouvé ${users.length} utilisateurs :`);
    users.forEach(u => {
      console.log(`   - ${u.pseudo} (${u.user_id})`);
    });

    // 2. Chercher les journées de décembre pour CHAQUE utilisateur
    console.log('\n📅 Étape 2: Recherche journées décembre pour chaque compte...\n');
    
    let journeesATranferer = [];

    for (const user of users) {
      // Ignorer le compte LYDIE lui-même
      if (user.user_id === LYDIE_USER_ID) continue;

      const { data: journees, error: journeesError } = await supabase
        .from('journees')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('date', '2025-12-01')
        .lte('date', '2025-12-11');

      if (journeesError) {
        console.log(`   ❌ Erreur pour ${user.pseudo}:`, journeesError.message);
        continue;
      }

      if (journees && journees.length > 0) {
        console.log(`   ✅ ${user.pseudo}: ${journees.length} journées en décembre`);
        
        // Récupérer les cigarettes pour ces journées
        for (const journee of journees) {
          const { data: cigarettes, error: cigError } = await supabase
            .from('cigarettes')
            .select('*')
            .eq('journee_id', journee.id);

          if (!cigError && cigarettes) {
            journeesATranferer.push({
              journee: journee,
              cigarettes: cigarettes,
              sourceUser: user.pseudo
            });
            console.log(`      • ${journee.date}: ${cigarettes.length} cigarettes`);
          }
        }
      }
    }

    if (journeesATranferer.length === 0) {
      console.log('\n⚠️ Aucune donnée de décembre trouvée dans aucun compte');
      console.log('💡 Vérifiez si les données sont bien dans Supabase');
      console.log('💡 URL: https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/editor\n');
      return;
    }

    // 3. Transférer vers le compte LYDIE
    console.log(`\n🔄 Étape 3: Transfert vers le compte LYDIE...`);
    console.log(`   Total à transférer: ${journeesATranferer.length} journées\n`);

    let totalCigarettes = 0;

    for (const item of journeesATranferer) {
      console.log(`   📆 ${item.journee.date} (de ${item.sourceUser})`);

      // Vérifier si la journée existe déjà pour LYDIE
      const { data: existante } = await supabase
        .from('journees')
        .select('id')
        .eq('user_id', LYDIE_USER_ID)
        .eq('date', item.journee.date)
        .single();

      let journeeId;

      if (existante) {
        console.log(`      ℹ️ Journée existe déjà (ID: ${existante.id})`);
        journeeId = existante.id;
      } else {
        // Créer la journée pour LYDIE
        const { data: nouvelleJournee, error: createError } = await supabase
          .from('journees')
          .insert({
            user_id: LYDIE_USER_ID,
            date: item.journee.date,
            type_journee: item.journee.type_journee || 'travail',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.log(`      ❌ Erreur création:`, createError.message);
          continue;
        }

        journeeId = nouvelleJournee.id;
        console.log(`      ✅ Journée créée (ID: ${journeeId})`);
      }

      // Transférer les cigarettes
      if (item.cigarettes.length > 0) {
        const cigarettesAInserer = item.cigarettes.map(c => ({
          user_id: LYDIE_USER_ID,
          journee_id: journeeId,
          heure: c.heure,
          lieu: c.lieu || 'non spécifié',
          avec_cafe: c.avec_cafe || false,
          moment_journee: c.moment_journee || 'autre',
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('cigarettes')
          .insert(cigarettesAInserer);

        if (insertError) {
          console.log(`      ❌ Erreur cigarettes:`, insertError.message);
        } else {
          console.log(`      ✅ ${item.cigarettes.length} cigarettes transférées`);
          totalCigarettes += item.cigarettes.length;
        }
      }
    }

    console.log(`\n✅ TRANSFERT TERMINÉ: ${totalCigarettes} cigarettes ajoutées au compte LYDIE\n`);

    // 4. Vérification finale
    console.log('📊 Étape 4: Vérification finale...');
    
    const { data: journeesLydie } = await supabase
      .from('journees')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .gte('date', '2025-12-01')
      .lte('date', '2025-12-11')
      .order('date');

    if (journeesLydie && journeesLydie.length > 0) {
      console.log(`✅ ${journeesLydie.length} journées en décembre pour LYDIE :`);
      
      for (const journee of journeesLydie) {
        const { count } = await supabase
          .from('cigarettes')
          .select('*', { count: 'exact', head: true })
          .eq('journee_id', journee.id);
        
        console.log(`   • ${journee.date}: ${count || 0} cigarettes`);
      }

      const { count: totalDecembre } = await supabase
        .from('cigarettes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', LYDIE_USER_ID)
        .in('journee_id', journeesLydie.map(j => j.id));

      console.log(`\n✅ TOTAL DÉCEMBRE: ${totalDecembre} cigarettes`);
    } else {
      console.log('⚠️ Aucune journée trouvée pour LYDIE en décembre');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ RÉCUPÉRATION DEPUIS AZURE TERMINÉE');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  }
}

recupererDepuisAzure();
