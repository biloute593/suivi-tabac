import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const db = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data: users, error } = await db.from('users').select('*').limit(1);
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  console.log('👥 Utilisateurs trouvés:');
  users.forEach(u => {
    console.log(' - Colonnes:', Object.keys(u));
    console.log('   Data:', u);
  });
  
  const lydieUser = users.find(u => u.pseudo === 'LYDIE');
  if (lydieUser) {
    const { data: journees } = await db.from('journees').select('*').eq('user_id', lydieUser.user_id);
    const { data: cigarettes } = await db.from('cigarettes').select('*').eq('user_id', lydieUser.user_id);
    const { data: journal } = await db.from('journal_notes').select('*').eq('user_id', lydieUser.user_id);
    
    console.log('\n📊 Données de LYDIE:');
    console.log(' - Journées:', journees.length);
    console.log(' - Cigarettes:', cigarettes.length);
    console.log(' - Notes journal:', journal.length);
  } else {
    console.log('\n❌ Profil LYDIE non trouvé');
  }
})();
