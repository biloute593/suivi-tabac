// Script pour nettoyer et re-migrer correctement les données
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const excelData = JSON.parse(readFileSync('./src/excel-data.json', 'utf-8'));

async function cleanAndMigrate() {
  console.log('🧹 Nettoyage de la base de données...\n');

  // 1. Supprimer tous les comptes sauf LYDIE (majuscule)
  const { data: users } = await supabase.from('users').select('user_id, pseudo');
  
  for (const user of users) {
    if (user.pseudo !== 'LYDIE') {
      console.log(`   ❌ Suppression du compte "${user.pseudo}"...`);
      await supabase.from('users').delete().eq('user_id', user.user_id);
    }
  }

  // 2. Supprimer toutes les cigarettes et journées
  console.log('\n🗑️  Suppression des anciennes données...');
  await supabase.from('cigarettes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('journees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('objectifs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('journal_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Récupérer ou créer le compte LYDIE
  console.log('\n👤 Vérification du compte LYDIE...');
  const passwordHash = CryptoJS.SHA256('LYDIE59').toString();
  
  let { data: lydieUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('pseudo', 'LYDIE')
    .single();

  if (!lydieUser) {
    console.log('   ➕ Création du compte LYDIE...');
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        pseudo: 'LYDIE',
        password_hash: passwordHash,
        objectif_global: 12,
        share_public: false
      })
      .select()
      .single();
    lydieUser = newUser;
  }

  console.log(`   ✅ User ID: ${lydieUser.user_id}\n`);

  // 4. Migrer les journées
  console.log('📅 Migration des journées...');
  const journeesMap = new Map();
  
  for (const cig of excelData) {
    const date = cig.date;
    if (!journeesMap.has(date)) {
      journeesMap.set(date, {
        user_id: lydieUser.user_id,
        date: date,
        type_journee: 'weekend',
        objectif_nombre_max: 12,
        created_at: new Date(date).toISOString()
      });
    }
  }

  const journeesToInsert = Array.from(journeesMap.values());
  const { data: insertedJournees, error: journeesError } = await supabase
    .from('journees')
    .insert(journeesToInsert)
    .select();

  if (journeesError) {
    console.error('❌ Erreur journées:', journeesError);
    process.exit(1);
  }

  console.log(`   ✅ ${insertedJournees.length} journées créées`);

  // Créer un map date -> journee_id
  const dateToJourneeId = new Map();
  for (const journee of insertedJournees) {
    dateToJourneeId.set(journee.date, journee.id);
  }

  // 5. Migrer les cigarettes
  console.log('\n🚬 Migration des cigarettes...');
  const cigarettesToInsert = excelData.map(cig => {
    const journeeId = dateToJourneeId.get(cig.date);
    
    // Convertir l'heure "11h50" en "11:50:00"
    let heure = cig.heure;
    if (heure.includes('h')) {
      const parts = heure.split('h');
      let heures = parseInt(parts[0]) || 0;
      let minutes = parseInt(parts[1]) || 0;
      
      // Gérer le cas où minutes >= 60
      if (minutes >= 60) {
        heures += Math.floor(minutes / 60);
        minutes = minutes % 60;
      }
      
      // S'assurer que les heures restent dans la plage 0-23
      heures = heures % 24;
      
      heure = `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    return {
      user_id: lydieUser.user_id,
      journee_id: journeeId,
      numero: cig.numero,
      heure: heure,
      lieu: cig.lieu,
      type: cig.type,
      besoin: cig.besoin,
      satisfaction: cig.satisfaction,
      quantite: cig.quantite,
      situation: cig.situation,
      commentaire: cig.commentaire || '',
      kudzu_pris: cig.kudzuPris || false,
      score_calcule: cig.scoreCalcule,
      created_at: new Date(cig.date).toISOString()
    };
  });

  const { data: insertedCigarettes, error: cigarettesError } = await supabase
    .from('cigarettes')
    .insert(cigarettesToInsert)
    .select();

  if (cigarettesError) {
    console.error('❌ Erreur cigarettes:', cigarettesError);
    process.exit(1);
  }

  console.log(`   ✅ ${insertedCigarettes.length} cigarettes créées\n`);

  // 6. Résumé final
  console.log('✨ Migration terminée avec succès !');
  console.log(`   📊 ${insertedJournees.length} journées créées`);
  console.log(`   🚬 ${insertedCigarettes.length} cigarettes enregistrées`);
  console.log('\n🔐 Informations de connexion:');
  console.log('   Pseudo: LYDIE');
  console.log('   Mot de passe: LYDIE59');
  console.log('   URL: https://ambitious-dune-0b02f5a03.3.azurestaticapps.net');
}

cleanAndMigrate().catch(console.error);
