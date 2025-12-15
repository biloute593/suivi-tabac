// Script de migration des données de Lydie vers Supabase
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import { readFileSync } from 'fs';

const excelData = JSON.parse(readFileSync('./src/excel-data.json', 'utf-8'));

// Configuration Supabase (utiliser service_role pour bypasser RLS durant la migration)
const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateData() {
  console.log('🚀 Début de la migration des données de Lydie...\n');

  // 1. Créer le compte de Lydie
  console.log('1️⃣ Création du compte Lydie...');
  const pseudo = 'LYDIE';
  const password = 'LYDIE59';
  const passwordHash = CryptoJS.SHA256(password).toString();

  let { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      pseudo: pseudo,
      password_hash: passwordHash,
      objectif_global: 12,
      share_public: false
    })
    .select()
    .single();

  if (userError) {
    if (userError.code === '23505') {
      console.log('   ⚠️  Le compte existe déjà, récupération...');
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('pseudo', pseudo)
        .eq('password_hash', passwordHash)
        .single();
      
      if (!existingUser) {
        console.error('   ❌ Erreur: Le pseudo existe mais le mot de passe ne correspond pas');
        process.exit(1);
      }
      
      user = existingUser;
    } else {
      console.error('   ❌ Erreur création compte:', userError);
      process.exit(1);
    }
  }

  console.log(`   ✅ Compte créé/trouvé: ${user.pseudo} (ID: ${user.user_id})\n`);

  const userId = user.user_id;

  // 2. Grouper les données par date pour créer les journées
  console.log('2️⃣ Création des journées...');
  const journeesMap = new Map();
  
  for (const entry of excelData) {
    if (!journeesMap.has(entry.date)) {
      journeesMap.set(entry.date, {
        date: entry.date,
        type_journee: entry.typeJournee,
        cigarettes: []
      });
    }
    journeesMap.get(entry.date).cigarettes.push(entry);
  }

  console.log(`   📅 ${journeesMap.size} journées à créer\n`);

  // 3. Insérer les journées et cigarettes
  let totalCigarettes = 0;
  let journeesCreated = 0;

  for (const [date, journeeData] of journeesMap) {
    // Créer la journée
    const { data: journee, error: journeeError } = await supabase
      .from('journees')
      .insert({
        user_id: userId,
        date: date,
        type_journee: journeeData.type_journee,
        objectif_nombre_max: null
      })
      .select()
      .single();

    if (journeeError) {
      console.error(`   ❌ Erreur journée ${date}:`, journeeError);
      continue;
    }

    journeesCreated++;

    // Créer les cigarettes de cette journée
    const cigarettesToInsert = journeeData.cigarettes.map(c => {
      // Convertir "11h50" en "11:50:00"
      let heure = c.heure;
      if (heure.includes('h')) {
        const [h, m] = heure.split('h');
        heure = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}:00`;
      }
      
      return {
        user_id: userId,
        journee_id: journee.id,
        numero: c.numero,
        heure: heure,
        lieu: c.lieu,
        type: c.type,
        besoin: c.besoin,
        satisfaction: c.satisfaction,
        quantite: c.quantite,
        situation: c.situation,
        commentaire: c.commentaire || '',
        kudzu_pris: c.kudzu === 1,
        score_calcule: (c.besoin + c.satisfaction) / 2
      };
    });

    const { error: cigarettesError } = await supabase
      .from('cigarettes')
      .insert(cigarettesToInsert);

    if (cigarettesError) {
      console.error(`   ❌ Erreur cigarettes ${date}:`, cigarettesError);
    } else {
      totalCigarettes += cigarettesToInsert.length;
      console.log(`   ✅ ${date}: ${cigarettesToInsert.length} cigarettes`);
    }
  }

  console.log('\n✨ Migration terminée !');
  console.log(`   📊 ${journeesCreated} journées créées`);
  console.log(`   🚬 ${totalCigarettes} cigarettes enregistrées`);
  console.log('\n🔐 Informations de connexion:');
  console.log(`   Pseudo: ${pseudo}`);
  console.log(`   Mot de passe: ${password}`);
  console.log(`   URL: https://ambitious-dune-0b02f5a03.3.azurestaticapps.net`);
}

migrateData().catch(console.error);
