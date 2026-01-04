import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuration Supabase
const SUPABASE_URL = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importerDecembreVersSupabase() {
  console.log('📂 Lecture du fichier de données...');
  
  const donnees = JSON.parse(readFileSync('donnees-decembre-azure.json', 'utf-8'));
  
  console.log(`\n📊 Fichier chargé:`);
  console.log(`   - ${donnees.metadata.total_journees} journées`);
  console.log(`   - ${donnees.metadata.total_cigarettes} cigarettes`);
  console.log(`   - ${donnees.metadata.total_objectifs} objectifs`);
  console.log(`   - ${donnees.metadata.total_notes} notes de journal`);

  let successJournees = 0;
  let successCigarettes = 0;
  let successObjectifs = 0;
  let successNotes = 0;

  // 1. Importer les journées
  if (donnees.journees.length > 0) {
    console.log('\n📅 Import des journées vers Supabase...');
    
    for (const journeeAzure of donnees.journees) {
      // Déterminer le type de journée
      let typeJournee = journeeAzure.type || journeeAzure.type_journee;
      
      if (!typeJournee) {
        const date = new Date(journeeAzure.date);
        const dayOfWeek = date.getDay();
        typeJournee = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'travail';
      }
      
      const journeeSupabase = {
        id: journeeAzure.id,
        user_id: LYDIE_USER_ID,
        date: journeeAzure.date,
        type_journee: typeJournee,
        objectif_nombre_max: journeeAzure.objectif_nombre_max || null,
        created_at: journeeAzure.created_at || new Date(journeeAzure.date).toISOString()
      };

      const { error } = await supabase
        .from('journees')
        .upsert(journeeSupabase, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`   ❌ Journée ${journeeAzure.date}: ${error.message}`);
      } else {
        successJournees++;
        console.log(`   ✅ Journée ${journeeAzure.date} (${typeJournee})`);
      }
    }
  }

  // 2. Importer les cigarettes
  if (donnees.cigarettes.length > 0) {
    console.log('\n🚬 Import des cigarettes vers Supabase...');
    
    for (const cigaretteAzure of donnees.cigarettes) {
      const cigaretteSupabase = {
        id: cigaretteAzure.id,
        user_id: LYDIE_USER_ID,
        journee_id: cigaretteAzure.journee_id,
        numero: cigaretteAzure.numero,
        heure: cigaretteAzure.heure,
        lieu: cigaretteAzure.lieu,
        type: cigaretteAzure.type,
        besoin: cigaretteAzure.besoin,
        satisfaction: cigaretteAzure.satisfaction,
        quantite: cigaretteAzure.quantite,
        situation: cigaretteAzure.situation,
        commentaire: cigaretteAzure.commentaire || null,
        kudzu_pris: cigaretteAzure.kudzu_pris || false,
        score_calcule: cigaretteAzure.score_calcule || null,
        created_at: cigaretteAzure.created_at || new Date(`${cigaretteAzure.date}T${cigaretteAzure.heure}`).toISOString()
      };

      const { error } = await supabase
        .from('cigarettes')
        .upsert(cigaretteSupabase, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`   ❌ Cigarette ${cigaretteAzure.id}: ${error.message}`);
      } else {
        successCigarettes++;
        console.log(`   ✅ Cigarette #${cigaretteAzure.numero} - ${cigaretteAzure.heure}`);
      }
    }
  }

  // 3. Importer les objectifs
  if (donnees.objectifs.length > 0) {
    console.log('\n🎯 Import des objectifs vers Supabase...');
    
    for (const objectifAzure of donnees.objectifs) {
      const objectifSupabase = {
        id: objectifAzure.id,
        user_id: LYDIE_USER_ID,
        date: objectifAzure.date,
        objectif_nombre_max: objectifAzure.objectif_nombre_max,
        created_at: objectifAzure.created_at || new Date(objectifAzure.date).toISOString()
      };

      const { error } = await supabase
        .from('objectifs')
        .upsert(objectifSupabase, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`   ❌ Objectif ${objectifAzure.date}: ${error.message}`);
      } else {
        successObjectifs++;
        console.log(`   ✅ Objectif ${objectifAzure.date}: ${objectifAzure.objectif_nombre_max} cigarettes max`);
      }
    }
  }

  // 4. Importer les notes de journal
  if (donnees.journal_notes.length > 0) {
    console.log('\n📝 Import des notes de journal vers Supabase...');
    
    for (const noteAzure of donnees.journal_notes) {
      const noteSupabase = {
        id: noteAzure.id,
        user_id: LYDIE_USER_ID,
        date: noteAzure.date,
        note: noteAzure.note,
        created_at: noteAzure.created_at || new Date(noteAzure.date).toISOString()
      };

      const { error } = await supabase
        .from('journal_notes')
        .upsert(noteSupabase, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`   ❌ Note ${noteAzure.date}: ${error.message}`);
      } else {
        successNotes++;
        console.log(`   ✅ Note ${noteAzure.date}`);
      }
    }
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORT TERMINÉ !');
  console.log('='.repeat(60));
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ Journées: ${successJournees}/${donnees.metadata.total_journees}`);
  console.log(`   ✅ Cigarettes: ${successCigarettes}/${donnees.metadata.total_cigarettes}`);
  console.log(`   ✅ Objectifs: ${successObjectifs}/${donnees.metadata.total_objectifs}`);
  console.log(`   ✅ Notes: ${successNotes}/${donnees.metadata.total_notes}`);
  console.log(`\n💡 Exécutez maintenant: node compter-toutes-donnees.mjs\n`);
}

importerDecembreVersSupabase().catch(console.error);
