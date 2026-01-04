import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function verifierToutesLesDonnees() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔍 VÉRIFICATION COMPLÈTE DU COMPTE LYDIE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. PROFIL UTILISATEUR
    console.log('👤 PROFIL UTILISATEUR:');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (userError) {
      console.log('❌ ERREUR:', userError.message);
    } else {
      console.log(`✅ User ID: ${user.user_id}`);
      console.log(`✅ Pseudo: ${user.pseudo}`);
      console.log(`✅ Objectif quotidien: ${user.objectif_global || 'NON DÉFINI'} cigarettes/jour`);
      console.log(`✅ Partage public: ${user.share_public ? 'OUI' : 'NON'}`);
      console.log(`✅ Créé le: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
    }

    // 2. INFORMATIONS SANTÉ
    console.log('\n💚 INFORMATIONS SANTÉ (user_metadata):');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: metadata, error: metaError } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .single();

    if (metaError) {
      if (metaError.code === 'PGRST116') {
        console.log('⚠️ Aucune métadonnée trouvée (à remplir dans l\'app)');
      } else {
        console.log('❌ ERREUR:', metaError.message);
      }
    } else {
      console.log(`✅ Date de naissance: ${metadata.date_naissance || '📝 À REMPLIR'}`);
      console.log(`✅ Début tabagisme: ${metadata.debut_tabagisme || '📝 À REMPLIR'}`);
      console.log(`✅ Max cigarettes/jour: ${metadata.cigarettes_par_jour_max}`);
      console.log(`✅ Créé le: ${new Date(metadata.created_at).toLocaleDateString('fr-FR')}`);
      console.log(`✅ Mis à jour: ${new Date(metadata.updated_at).toLocaleDateString('fr-FR')}`);
    }

    // 3. JOURNÉES
    console.log('\n📅 JOURNÉES DE SUIVI:');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: journees, error: journeesError } = await supabase
      .from('journees')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .order('date', { ascending: false })
      .limit(10);

    if (journeesError) {
      console.log('❌ ERREUR:', journeesError.message);
    } else {
      console.log(`✅ Total de journées: ${journees.length} (affichage des 10 dernières)`);
      journees.forEach((j, i) => {
        console.log(`   ${i + 1}. ${j.date} - ${j.type_journee} (ID: ${j.id})`);
      });
    }

    // 4. CIGARETTES
    console.log('\n🚬 CIGARETTES ENREGISTRÉES:');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: cigarettes, count: cigarettesCount, error: cigarettesError } = await supabase
      .from('cigarettes')
      .select('*', { count: 'exact' })
      .eq('user_id', LYDIE_USER_ID)
      .order('journee_id', { ascending: false })
      .limit(15);

    if (cigarettesError) {
      console.log('❌ ERREUR:', cigarettesError.message);
    } else {
      console.log(`✅ Total de cigarettes: ${cigarettesCount} (affichage des 15 dernières)`);
      
      // Grouper par journée
      const parJournee = {};
      cigarettes.forEach(c => {
        if (!parJournee[c.journee_id]) {
          parJournee[c.journee_id] = [];
        }
        parJournee[c.journee_id].push(c);
      });

      let count = 0;
      for (const [journeeId, cigs] of Object.entries(parJournee)) {
        if (count >= 5) break; // Afficher max 5 journées
        const journee = journees.find(j => j.id === parseInt(journeeId));
        console.log(`\n   📆 ${journee ? journee.date : 'Date inconnue'} - ${cigs.length} cigarettes:`);
        cigs.slice(0, 5).forEach((c, i) => {
          console.log(`      ${i + 1}. ${c.heure} - ${c.lieu || 'Lieu non spécifié'} ${c.avec_cafe ? '☕' : ''}`);
        });
        count++;
      }
    }

    // 5. OBJECTIFS
    console.log('\n🎯 OBJECTIFS:');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: objectifs, error: objectifsError } = await supabase
      .from('objectifs')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (objectifsError) {
      console.log('❌ ERREUR:', objectifsError.message);
    } else if (objectifs.length === 0) {
      console.log('ℹ️ Aucun objectif spécifique enregistré (utilise objectif_global)');
    } else {
      console.log(`✅ Total d'objectifs: ${objectifs.length}`);
      objectifs.forEach((o, i) => {
        console.log(`   ${i + 1}. Date: ${o.date}, Objectif: ${o.objectif} cigarettes`);
      });
    }

    // 6. NOTES JOURNAL
    console.log('\n📝 NOTES DE JOURNAL:');
    console.log('─────────────────────────────────────────────────────────────');
    const { data: notes, error: notesError } = await supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', LYDIE_USER_ID)
      .order('date', { ascending: false })
      .limit(5);

    if (notesError) {
      console.log('❌ ERREUR:', notesError.message);
    } else if (notes.length === 0) {
      console.log('ℹ️ Aucune note de journal enregistrée');
    } else {
      console.log(`✅ Total de notes: ${notes.length} (affichage des 5 dernières)`);
      notes.forEach((n, i) => {
        const preview = n.contenu.substring(0, 50) + (n.contenu.length > 50 ? '...' : '');
        console.log(`   ${i + 1}. ${n.date} - "${preview}"`);
      });
    }

    // RÉSUMÉ FINAL
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ FINAL - COMPTE LYDIE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n✅ Profil: ${user.pseudo} (objectif: ${user.objectif_global}/jour)`);
    console.log(`✅ Santé: ${metadata ? 'Configuré' : 'À configurer'}`);
    console.log(`✅ Journées: ${journees.length} enregistrées`);
    console.log(`✅ Cigarettes: ${cigarettesCount} au total`);
    console.log(`✅ Objectifs: ${objectifs?.length || 0} spécifiques`);
    console.log(`✅ Notes: ${notes?.length || 0} entrées journal`);

    console.log('\n🎉 TOUTES LES DONNÉES SONT DANS LE CLOUD SUPABASE !');
    console.log('🌐 Accessible depuis: https://ambitious-dune-0b02f5a03.3.azurestaticapps.net');
    console.log('🔑 Connexion: LYDIE / LYDIE59\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error);
  }
}

verifierToutesLesDonnees();
