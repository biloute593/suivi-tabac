import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

console.log('📦 IMPORT CSV DU 1-10 DÉCEMBRE\n');

// Lire le CSV
const csvContent = readFileSync('../suivi-tabac-export-2025-12-10.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  delimiter: ','
});

console.log(`📂 Fichier CSV chargé: ${records.length} lignes\n`);

// Grouper par date pour créer les journées
const journeesMap = new Map();
for (const record of records) {
  const date = record.Date;
  if (!journeesMap.has(date)) {
    journeesMap.set(date, {
      date,
      typeJournee: record['Type Journée'],
      cigarettes: []
    });
  }
  journeesMap.get(date).cigarettes.push(record);
}

console.log(`📅 ${journeesMap.size} journées trouvées\n`);

// Supprimer d'abord les anciennes données 1-10 décembre
console.log('🗑️  Suppression des anciennes données 1-10 décembre...');
const { error: delJError } = await supabase
  .from('journees')
  .delete()
  .eq('user_id', LYDIE_USER_ID)
  .gte('date', '2025-12-01')
  .lte('date', '2025-12-10');

if (delJError) console.error('Erreur suppression journées:', delJError);

const { error: delCError } = await supabase
  .from('cigarettes')
  .delete()
  .eq('user_id', LYDIE_USER_ID);

if (delCError) console.error('Erreur suppression cigarettes:', delCError);

console.log('✅ Anciennes données supprimées\n');

// Importer les journées
console.log('📅 Import des journées...');
let journeesOK = 0;

for (const [date, journeeData] of journeesMap) {
  const { data, error } = await supabase.from('journees').insert({
    user_id: LYDIE_USER_ID,
    date: date,
    type_journee: journeeData.typeJournee,
    objectif_nombre_max: 12,
    created_at: new Date(date + 'T08:00:00Z').toISOString()
  }).select().single();
  
  if (error) {
    console.error(`  ❌ ${date}:`, error.message);
  } else {
    journeesOK++;
    // Stocker le nouveau ID
    journeeData.newId = data.id;
  }
}

console.log(`✅ ${journeesOK} journées importées\n`);

// Importer les cigarettes
console.log('🚬 Import des cigarettes...');
let cigsOK = 0;

for (const [date, journeeData] of journeesMap) {
  if (!journeeData.newId) continue;
  
  for (const cig of journeeData.cigarettes) {
    const { error } = await supabase.from('cigarettes').insert({
      user_id: LYDIE_USER_ID,
      journee_id: journeeData.newId,
      numero: parseInt(cig['Numéro']),
      heure: cig.Heure,
      lieu: cig.Lieu,
      type: cig.Type,
      besoin: parseInt(cig.Besoin),
      satisfaction: parseInt(cig.Satisfaction),
      quantite: cig['Quantité'],
      situation: cig.Situation,
      commentaire: cig.Commentaire || '',
      kudzu_pris: cig['Kudzu Pris'] === 'Oui',
      score_calcule: parseInt(cig.Score),
      created_at: new Date(date + 'T' + cig.Heure + ':00Z').toISOString()
    });
    
    if (error) {
      console.error(`  ❌ ${date} cig ${cig['Numéro']}:`, error.message);
    } else {
      cigsOK++;
    }
  }
}

console.log(`✅ ${cigsOK} cigarettes importées\n`);

// Vérification finale
const { data: finalJ } = await supabase.from('journees').select('*').eq('user_id', LYDIE_USER_ID);
const { data: finalC } = await supabase.from('cigarettes').select('*').eq('user_id', LYDIE_USER_ID);

console.log(`\n📊 TOTAL FINAL LYDIE:`);
console.log(`   📅 ${finalJ?.length || 0} journées`);
console.log(`   🚬 ${finalC?.length || 0} cigarettes`);

if (finalJ && finalJ.length > 0) {
  const dates = finalJ.map(j => j.date).sort();
  console.log(`   📆 De ${dates[0]} à ${dates[dates.length - 1]}`);
}

console.log('\n✅ IMPORT CSV TERMINÉ !');
