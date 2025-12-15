import { createClient } from '@supabase/supabase-js';
import Dexie from 'dexie';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

// Simuler l'ouverture d'IndexedDB
const db = new Dexie('suivi-tabac-db');
db.version(1).stores({
  journees: '++id, date, typeJournee',
  cigarettes: '++id, journeeId, heure, lieu, avecCafe, momentJournee'
});

async function migrerDepuisIndexedDB() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📦 MIGRATION DEPUIS INDEXEDDB → SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await db.open();
    
    // Récupérer les journées de décembre
    const journees = await db.journees
      .where('date')
      .between('2025-12-01', '2025-12-11', true, true)
      .toArray();

    console.log(`📅 Trouvé ${journees.length} journées en décembre dans IndexedDB\n`);

    if (journees.length === 0) {
      console.log('ℹ️ Aucune donnée trouvée dans IndexedDB local');
      console.log('💡 Les données peuvent être sur un autre appareil ou navigateur\n');
      return;
    }

    let totalMigre = 0;

    for (const journee of journees) {
      console.log(`\n📆 Migration: ${journee.date} (${journee.typeJournee})`);

      // Créer la journée dans Supabase
      const { data: nouvelleJournee, error: journeeError } = await supabase
        .from('journees')
        .insert({
          user_id: LYDIE_USER_ID,
          date: journee.date,
          type_journee: journee.typeJournee || 'travail',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (journeeError) {
        console.log(`   ❌ Erreur:`, journeeError.message);
        continue;
      }

      console.log(`   ✅ Journée créée (ID Supabase: ${nouvelleJournee.id})`);

      // Récupérer et migrer les cigarettes
      const cigarettes = await db.cigarettes
        .where('journeeId')
        .equals(journee.id)
        .toArray();

      if (cigarettes.length > 0) {
        const cigarettesAInserer = cigarettes.map(c => ({
          user_id: LYDIE_USER_ID,
          journee_id: nouvelleJournee.id,
          heure: c.heure,
          lieu: c.lieu || '',
          avec_cafe: c.avecCafe || false,
          moment_journee: c.momentJournee || 'autre',
          created_at: new Date().toISOString()
        }));

        const { error: cigError } = await supabase
          .from('cigarettes')
          .insert(cigarettesAInserer);

        if (cigError) {
          console.log(`   ❌ Erreur cigarettes:`, cigError.message);
        } else {
          console.log(`   ✅ ${cigarettes.length} cigarettes migrées`);
          totalMigre += cigarettes.length;
        }
      }
    }

    console.log(`\n✅ MIGRATION TERMINÉE: ${totalMigre} cigarettes ajoutées\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️ Ce script doit être exécuté dans le navigateur (console DevTools)');
    console.log('💡 Ouvrez l\'application et collez ce code dans la console F12\n');
  } finally {
    db.close();
  }
}

migrerDepuisIndexedDB();
