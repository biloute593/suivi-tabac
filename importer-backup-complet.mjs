import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuration Supabase
const SUPABASE_URL = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importerBackupComplet() {
  console.log('📂 Lecture du fichier de backup...\n');
  
  const backup = JSON.parse(readFileSync('backup-lydie.json', 'utf-8'));
  
  console.log(`📊 Backup du ${backup.exportDate}`);
  console.log(`   - ${backup.journees?.length || 0} journées`);
  console.log(`   - ${backup.cigarettes?.length || 0} cigarettes`);
  console.log(`   - ${backup.objectifs?.length || 0} objectifs`);
  console.log(`   - ${backup.journal?.length || 0} notes de journal\n`);

  let stats = {
    journees: { success: 0, errors: 0 },
    cigarettes: { success: 0, errors: 0 },
    objectifs: { success: 0, errors: 0 },
    journal: { success: 0, errors: 0 }
  };

  // 1. Importer les journées
  if (backup.journees?.length > 0) {
    console.log('📅 Import des journées...');
    
    for (const journee of backup.journees) {
      const journeeSupabase = {
        id: journee.id,
        user_id: LYDIE_USER_ID,
        date: journee.date,
        type_journee: journee.typeJournee || 'travail',
        objectif_nombre_max: journee.objectifNombreMax || null,
        created_at: journee.createdAt || new Date(journee.date).toISOString()
      };

      const { error } = await supabase
        .from('journees')
        .upsert(journeeSupabase, { onConflict: 'id' });

      if (error) {
        console.error(`   ❌ ${journee.date}: ${error.message}`);
        stats.journees.errors++;
      } else {
        stats.journees.success++;
        console.log(`   ✅ ${journee.date} (${journeeSupabase.type_journee})`);
      }
    }
  }

  // 2. Importer les cigarettes
  if (backup.cigarettes?.length > 0) {
    console.log('\n🚬 Import des cigarettes...');
    
    for (const cigarette of backup.cigarettes) {
      const cigaretteSupabase = {
        id: cigarette.id,
        user_id: LYDIE_USER_ID,
        journee_id: cigarette.journeeId,
        numero: cigarette.numero,
        heure: cigarette.heure,
        lieu: cigarette.lieu,
        type: cigarette.type,
        besoin: cigarette.besoin,
        satisfaction: cigarette.satisfaction,
        quantite: cigarette.quantite,
        situation: cigarette.situation,
        commentaire: cigarette.commentaire || null,
        kudzu_pris: cigarette.kudzuPris || false,
        score_calcule: cigarette.scoreCalcule || null,
        created_at: cigarette.createdAt || new Date().toISOString()
      };

      const { error } = await supabase
        .from('cigarettes')
        .upsert(cigaretteSupabase, { onConflict: 'id' });

      if (error) {
        console.error(`   ❌ Cigarette ${cigarette.id}: ${error.message}`);
        stats.cigarettes.errors++;
      } else {
        stats.cigarettes.success++;
        if (stats.cigarettes.success % 50 === 0) {
          console.log(`   ✅ ${stats.cigarettes.success} cigarettes importées...`);
        }
      }
    }
    console.log(`   ✅ Total: ${stats.cigarettes.success} cigarettes importées`);
  }

  // 3. Importer les objectifs
  if (backup.objectifs?.length > 0) {
    console.log('\n🎯 Import des objectifs...');
    
    for (const objectif of backup.objectifs) {
      const objectifSupabase = {
        id: objectif.id,
        user_id: LYDIE_USER_ID,
        date: objectif.date,
        objectif_nombre_max: objectif.objectifNombreMax,
        created_at: objectif.createdAt || new Date(objectif.date).toISOString()
      };

      const { error } = await supabase
        .from('objectifs')
        .upsert(objectifSupabase, { onConflict: 'id' });

      if (error) {
        console.error(`   ❌ ${objectif.date}: ${error.message}`);
        stats.objectifs.errors++;
      } else {
        stats.objectifs.success++;
        console.log(`   ✅ ${objectif.date}: ${objectif.objectifNombreMax} max`);
      }
    }
  }

  // 4. Importer les notes de journal
  if (backup.journal?.length > 0) {
    console.log('\n📝 Import des notes de journal...');
    
    for (const note of backup.journal) {
      const noteSupabase = {
        id: note.id,
        user_id: LYDIE_USER_ID,
        date: note.date,
        note: note.note,
        created_at: note.createdAt || new Date(note.date).toISOString()
      };

      const { error } = await supabase
        .from('journal_notes')
        .upsert(noteSupabase, { onConflict: 'id' });

      if (error) {
        console.error(`   ❌ ${note.date}: ${error.message}`);
        stats.journal.errors++;
      } else {
        stats.journal.success++;
        console.log(`   ✅ ${note.date}`);
      }
    }
  }

  // Vérification finale
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VÉRIFICATION FINALE DANS SUPABASE');
  console.log('='.repeat(70));

  const { count: totalJournees } = await supabase
    .from('journees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  const { count: totalCigarettes } = await supabase
    .from('cigarettes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  const { count: totalObjectifs } = await supabase
    .from('objectifs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  const { count: totalNotes } = await supabase
    .from('journal_notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', LYDIE_USER_ID);

  console.log('\n📊 RÉSUMÉ DE L\'IMPORT:\n');
  console.log(`📅 Journées:`);
  console.log(`   ✅ Importées: ${stats.journees.success}`);
  console.log(`   ❌ Erreurs: ${stats.journees.errors}`);
  console.log(`   💾 Total dans Supabase: ${totalJournees}\n`);

  console.log(`🚬 Cigarettes:`);
  console.log(`   ✅ Importées: ${stats.cigarettes.success}`);
  console.log(`   ❌ Erreurs: ${stats.cigarettes.errors}`);
  console.log(`   💾 Total dans Supabase: ${totalCigarettes}\n`);

  console.log(`🎯 Objectifs:`);
  console.log(`   ✅ Importés: ${stats.objectifs.success}`);
  console.log(`   ❌ Erreurs: ${stats.objectifs.errors}`);
  console.log(`   💾 Total dans Supabase: ${totalObjectifs}\n`);

  console.log(`📝 Notes de journal:`);
  console.log(`   ✅ Importées: ${stats.journal.success}`);
  console.log(`   ❌ Erreurs: ${stats.journal.errors}`);
  console.log(`   💾 Total dans Supabase: ${totalNotes}\n`);

  console.log('='.repeat(70));
  console.log('🎉 IMPORT TERMINÉ !');
  console.log('='.repeat(70));
  console.log('\n💡 Toutes les données sont maintenant dans le compte LYDIE\n');
}

importerBackupComplet().catch(console.error);
