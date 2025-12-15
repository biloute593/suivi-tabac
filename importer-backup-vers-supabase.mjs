import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

console.log('📦 Import des données de LYDIE dans Supabase...\n');

// Lire le backup
const backup = JSON.parse(readFileSync('backup-lydie.json', 'utf-8'));

console.log(`📂 Fichier backup chargé:`);
console.log(`   📅 ${backup.journees?.length || 0} journées`);
console.log(`   🚬 ${backup.cigarettes?.length || 0} cigarettes`);
console.log(`   🎯 ${backup.objectifs?.length || 0} objectifs`);
console.log(`   📖 ${backup.journalNotes?.length || 0} notes journal\n`);

// Importer les journées
if (backup.journees && backup.journees.length > 0) {
  console.log('📅 Import des journées...');
  
  for (const journee of backup.journees) {
    const { error } = await supabase.from('journees').insert({
      id: journee.id,
      user_id: LYDIE_USER_ID,
      date: journee.date,
      type_journee: journee.typeJournee,
      objectif_nombre_max: journee.objectifNombreMax,
      created_at: journee.createdAt
    });
    
    if (error) {
      console.error(`   ❌ Erreur journée ${journee.date}:`, error.message);
    }
  }
  console.log(`   ✅ ${backup.journees.length} journées importées`);
}

// Importer les cigarettes
if (backup.cigarettes && backup.cigarettes.length > 0) {
  console.log('\n🚬 Import des cigarettes...');
  
  for (const cig of backup.cigarettes) {
    const { error } = await supabase.from('cigarettes').insert({
      id: cig.id,
      user_id: LYDIE_USER_ID,
      journee_id: cig.journeeId,
      numero: cig.numero,
      heure: cig.heure,
      lieu: cig.lieu,
      type: cig.type,
      besoin: cig.besoin,
      satisfaction: cig.satisfaction,
      quantite: cig.quantite,
      situation: cig.situation,
      commentaire: cig.commentaire,
      kudzu_pris: cig.kudzuPris,
      score_calcule: cig.scoreCalcule,
      created_at: cig.createdAt
    });
    
    if (error && error.code !== '23505') { // Ignorer les doublons
      console.error(`   ❌ Erreur cigarette ${cig.id}:`, error.message);
    }
  }
  console.log(`   ✅ ${backup.cigarettes.length} cigarettes importées`);
}

// Importer les objectifs
if (backup.objectifs && backup.objectifs.length > 0) {
  console.log('\n🎯 Import des objectifs...');
  
  for (const obj of backup.objectifs) {
    const { error } = await supabase.from('objectifs').insert({
      id: obj.id,
      user_id: LYDIE_USER_ID,
      date_debut: obj.dateDebut,
      nombre_max: obj.nombreMax,
      actif: obj.actif,
      created_at: obj.createdAt
    });
    
    if (error && error.code !== '23505') {
      console.error(`   ❌ Erreur objectif:`, error.message);
    }
  }
  console.log(`   ✅ ${backup.objectifs.length} objectifs importés`);
}

// Importer les notes journal
if (backup.journalNotes && backup.journalNotes.length > 0) {
  console.log('\n📖 Import des notes journal...');
  
  for (const note of backup.journalNotes) {
    const { error } = await supabase.from('journal_notes').insert({
      id: note.id,
      user_id: LYDIE_USER_ID,
      date: note.date,
      contenu: note.contenu,
      created_at: note.createdAt,
      updated_at: note.updatedAt
    });
    
    if (error && error.code !== '23505') {
      console.error(`   ❌ Erreur note:`, error.message);
    }
  }
  console.log(`   ✅ ${backup.journalNotes.length} notes importées`);
}

console.log('\n✨ Import terminé !');
