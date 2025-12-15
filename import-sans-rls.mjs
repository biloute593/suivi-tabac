import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

console.log('📦 IMPORT SANS RLS - Les RLS doivent être désactivés!\n');

const backup = JSON.parse(readFileSync('backup-lydie.json', 'utf-8'));

console.log(`📂 Backup: ${backup.journees?.length} journées, ${backup.cigarettes?.length} cigarettes\n`);

// Import journées
console.log('📅 Import journées...');
for (const j of backup.journees || []) {
  const { error } = await supabase.from('journees').insert({
    user_id: LYDIE_USER_ID,
    date: j.date,
    type_journee: j.typeJournee,
    objectif_nombre_max: j.objectifNombreMax,
    created_at: j.createdAt
  });
  if (error && error.code !== '23505') console.error(`  ❌ ${j.date}:`, error.message);
}

// Récupérer les journées pour mapper les IDs
const { data: journees } = await supabase.from('journees').select('id, date').eq('user_id', LYDIE_USER_ID);
const journeeMapByDate = {};
for (const j of journees || []) journeeMapByDate[j.date] = j.id;

// Créer un mapping des anciens IDs vers les dates depuis le backup
const oldIdToDate = {};
for (const j of backup.journees || []) {
  oldIdToDate[j.id] = j.date;
}

console.log(`✅ ${journees?.length || 0} journées dans Supabase`);

// Import cigarettes
console.log('\n🚬 Import cigarettes...');
let cigCount = 0;
for (const c of backup.cigarettes || []) {
  // Trouver la date de la cigarette via l'ancien journeeId
  const dateFromOldId = oldIdToDate[c.journeeId];
  if (!dateFromOldId) {
    console.error(`  ❌ Cigarette ${c.numero}: journeeId ${c.journeeId} introuvable`);
    continue;
  }
  
  // Trouver le nouveau journeeId via la date
  const newJourneeId = journeeMapByDate[dateFromOldId];
  if (!newJourneeId) {
    console.error(`  ❌ Cigarette ${c.numero}: date ${dateFromOldId} introuvable`);
    continue;
  }
  
  const { error } = await supabase.from('cigarettes').insert({
    user_id: LYDIE_USER_ID,
    journee_id: newJourneeId,
    numero: c.numero,
    heure: c.heure,
    lieu: c.lieu,
    type: c.type,
    besoin: c.besoin,
    satisfaction: c.satisfaction,
    quantite: c.quantite,
    situation: c.situation,
    commentaire: c.commentaire,
    kudzu_pris: c.kudzuPris,
    score_calcule: c.scoreCalcule,
    created_at: c.createdAt
  });
  if (!error) cigCount++;
  if (error && error.code !== '23505') console.error(`  ❌ Cig ${c.numero} date ${dateFromOldId}:`, error.message);
}

console.log(`✅ ${cigCount} cigarettes importées`);

// Import objectifs
console.log('\n🎯 Import objectifs...');
for (const o of backup.objectifs || []) {
  await supabase.from('objectifs').insert({
    user_id: LYDIE_USER_ID,
    date_debut: o.dateDebut,
    nombre_max: o.nombreMax,
    actif: o.actif,
    created_at: o.createdAt
  });
}

// Vérif finale
const { data: finalJ } = await supabase.from('journees').select('*').eq('user_id', LYDIE_USER_ID);
const { data: finalC } = await supabase.from('cigarettes').select('*').eq('user_id', LYDIE_USER_ID);

console.log(`\n✅ TOTAL LYDIE: ${finalJ?.length || 0} journées, ${finalC?.length || 0} cigarettes`);
console.log('\n⚠️  N\'OUBLIE PAS DE RE-ACTIVER LES RLS dans Supabase SQL Editor!');
