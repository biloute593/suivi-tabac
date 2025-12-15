import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Lire le fichier .env.local manuellement
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const db = createClient(supabaseUrl, supabaseKey);

async function addCigarettes() {
  try {
    // Récupérer la journée du 10
    const { data: journee, error: journeeError } = await db
      .from('journees')
      .select('id, date')
      .eq('date', '2025-12-10')
      .single();
    
    if (journeeError) {
      console.error('❌ Erreur journée:', journeeError);
      return;
    }

    console.log('📅 Journée trouvée:', journee.id);
    
    // Récupérer les cigarettes existantes du 10
    const { data: existing, error: fetchError } = await db
      .from('cigarettes')
      .select('*')
      .eq('journee_id', journee.id)
      .order('heure', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Erreur fetch:', fetchError);
      return;
    }

    console.log(`📊 ${existing.length} cigarettes existantes du 10 décembre`);
    
    // Extraire les patterns
    const heures = existing.map(c => c.heure);
    const lieux = existing.map(c => c.lieu).filter(Boolean);
    const types = existing.map(c => c.type).filter(Boolean);
    const besoins = existing.map(c => c.besoin).filter(Boolean);
    const situations = existing.map(c => c.situation).filter(Boolean);
    
    console.log('Heures existantes:', heures.join(', '));
    console.log('Lieux utilisés:', [...new Set(lieux)].join(', '));
    console.log('Types utilisés:', [...new Set(types)].join(', '));
    console.log('Besoins utilisés:', [...new Set(besoins)].join(', '));
    console.log('Situations utilisées:', [...new Set(situations)].join(', '));
    
    // Créer 7 nouvelles cigarettes aléatoires
    const nouvelles = [];
    const heuresExistantes = new Set(heures);
    
    while (nouvelles.length < 7) {
      const heure = String(Math.floor(Math.random() * 16) + 7).padStart(2, '0'); // 7h-22h
      const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const heureComplete = heure + ':' + minute;
      
      if (!heuresExistantes.has(heureComplete)) {
        heuresExistantes.add(heureComplete);
        
        const lieu = lieux[Math.floor(Math.random() * lieux.length)] || 'Bureau';
        const type = types[Math.floor(Math.random() * types.length)] || 'Cigarette';
        const besoin = besoins[Math.floor(Math.random() * besoins.length)] || 'Habitude';
        const situation = situations[Math.floor(Math.random() * situations.length)] || 'Quotidien';
        const satisfaction = Math.floor(Math.random() * 10) + 1; // 1-10
        const quantite = 1; // Une cigarette à la fois
        
        nouvelles.push({
          journee_id: journee.id,
          numero: existing.length + nouvelles.length + 1,
          heure: heureComplete,
          lieu,
          type,
          besoin,
          situation,
          satisfaction,
          quantite,
          commentaire: '',
          kudzu_pris: false
        });
      }
    }
    
    console.log('\n✨ Nouvelles cigarettes à ajouter:');
    nouvelles.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.heure} - ${c.lieu} (type: ${c.type}, besoin: ${c.besoin})`);
    });
    
    // Insérer
    const { error: insertError } = await db.from('cigarettes').insert(nouvelles);
    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
    } else {
      console.log('\n✅ 7 cigarettes ajoutées avec succès');
    }
    
    // Vérifier le total
    const { data: final } = await db
      .from('cigarettes')
      .select('*')
      .eq('journee_id', journee.id);
    
    console.log(`📈 Total cigarettes du 10 décembre: ${final.length}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addCigarettes();
