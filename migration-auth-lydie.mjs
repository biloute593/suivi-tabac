import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import CryptoJS from 'crypto-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔐 MIGRATION DES DONNÉES AVEC AUTHENTIFICATION\n');
console.log('⚠️  Tu dois entrer le mot de passe de LYDIE pour migrer les données\n');

// Demander le mot de passe
import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askPassword = () => {
  return new Promise((resolve) => {
    rl.question('Mot de passe pour LYDIE: ', (password) => {
      resolve(password);
    });
  });
};

const password = await askPassword();
rl.close();

// Authentification avec Supabase
console.log('\n🔑 Connexion à Supabase...');
const passwordHash = CryptoJS.SHA256(password).toString();

const { data: userData, error: loginError } = await supabase
  .from('users')
  .select('*')
  .eq('pseudo', 'LYDIE')
  .eq('password_hash', passwordHash)
  .single();

if (loginError || !userData) {
  console.error('❌ Mot de passe incorrect ou compte LYDIE introuvable');
  process.exit(1);
}

console.log('✅ Connecté en tant que LYDIE');
console.log(`   User ID: ${userData.user_id}\n`);

// Charger le backup
const backup = JSON.parse(readFileSync('backup-lydie.json', 'utf-8'));

console.log(`📦 Backup chargé:`);
console.log(`   📅 ${backup.journees?.length || 0} journées`);
console.log(`   🚬 ${backup.cigarettes?.length || 0} cigarettes`);
console.log(`   🎯 ${backup.objectifs?.length || 0} objectifs\n`);

let journeesOK = 0, journeesSkip = 0;
let cigsOK = 0, cigsSkip = 0;
let objsOK = 0, objsSkip = 0;

// Importer les journées
if (backup.journees && backup.journees.length > 0) {
  console.log('📅 Import des journées...');
  
  for (const journee of backup.journees) {
    // Vérifier si existe déjà
    const { data: existing } = await supabase
      .from('journees')
      .select('id')
      .eq('user_id', userData.user_id)
      .eq('date', journee.date)
      .single();
    
    if (existing) {
      journeesSkip++;
      continue;
    }
    
    const { error } = await supabase.from('journees').insert({
      user_id: userData.user_id,
      date: journee.date,
      type_journee: journee.typeJournee,
      objectif_nombre_max: journee.objectifNombreMax,
      created_at: journee.createdAt
    });
    
    if (error) {
      console.error(`   ❌ ${journee.date}:`, error.message);
    } else {
      journeesOK++;
    }
  }
  console.log(`   ✅ ${journeesOK} nouvelles journées importées`);
  if (journeesSkip > 0) console.log(`   ⏭️  ${journeesSkip} journées déjà existantes ignorées`);
}

// Récupérer toutes les journées pour mapper les IDs
const { data: allJournees } = await supabase
  .from('journees')
  .select('id, date')
  .eq('user_id', userData.user_id);

const journeeMap = {};
for (const j of allJournees || []) {
  journeeMap[j.date] = j.id;
}

// Importer les cigarettes
if (backup.cigarettes && backup.cigarettes.length > 0) {
  console.log('\n🚬 Import des cigarettes...');
  
  for (const cig of backup.cigarettes) {
    // Trouver la journée correspondante
    const journeeId = journeeMap[cig.date] || cig.journeeId;
    
    if (!journeeId) {
      console.error(`   ❌ Cigarette sans journée valide (date: ${cig.date})`);
      continue;
    }
    
    // Vérifier si existe déjà
    const { data: existing } = await supabase
      .from('cigarettes')
      .select('id')
      .eq('user_id', userData.user_id)
      .eq('journee_id', journeeId)
      .eq('numero', cig.numero)
      .single();
    
    if (existing) {
      cigsSkip++;
      continue;
    }
    
    const { error } = await supabase.from('cigarettes').insert({
      user_id: userData.user_id,
      journee_id: journeeId,
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
    
    if (error) {
      // Ignorer silencieusement les erreurs de doublon
      if (error.code !== '23505') {
        console.error(`   ❌ Cigarette #${cig.numero}:`, error.message);
      }
    } else {
      cigsOK++;
    }
  }
  console.log(`   ✅ ${cigsOK} nouvelles cigarettes importées`);
  if (cigsSkip > 0) console.log(`   ⏭️  ${cigsSkip} cigarettes déjà existantes ignorées`);
}

// Importer les objectifs
if (backup.objectifs && backup.objectifs.length > 0) {
  console.log('\n🎯 Import des objectifs...');
  
  for (const obj of backup.objectifs) {
    const { data: existing } = await supabase
      .from('objectifs')
      .select('id')
      .eq('user_id', userData.user_id)
      .eq('date_debut', obj.dateDebut)
      .single();
    
    if (existing) {
      objsSkip++;
      continue;
    }
    
    const { error } = await supabase.from('objectifs').insert({
      user_id: userData.user_id,
      date_debut: obj.dateDebut,
      nombre_max: obj.nombreMax,
      actif: obj.actif,
      created_at: obj.createdAt
    });
    
    if (error) {
      console.error(`   ❌ Objectif:`, error.message);
    } else {
      objsOK++;
    }
  }
  console.log(`   ✅ ${objsOK} nouveaux objectifs importés`);
  if (objsSkip > 0) console.log(`   ⏭️  ${objsSkip} objectifs déjà existants ignorés`);
}

// Vérification finale
console.log('\n📊 Vérification finale...');
const { data: finalJournees } = await supabase
  .from('journees')
  .select('*')
  .eq('user_id', userData.user_id);

const { data: finalCigs } = await supabase
  .from('cigarettes')
  .select('*')
  .eq('user_id', userData.user_id);

console.log(`✅ Total dans Supabase pour LYDIE:`);
console.log(`   📅 ${finalJournees?.length || 0} journées`);
console.log(`   🚬 ${finalCigs?.length || 0} cigarettes`);

if (finalJournees && finalJournees.length > 0) {
  const dates = finalJournees.map(j => j.date).sort();
  console.log(`   📆 De ${dates[0]} à ${dates[dates.length - 1]}`);
}

console.log('\n🎉 MIGRATION TERMINÉE !');
