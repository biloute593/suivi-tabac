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
  const { data: cigarettes } = await db
    .from('cigarettes')
    .select('*')
    .limit(1);
  
  if (cigarettes && cigarettes.length > 0) {
    console.log('Colonnes disponibles:');
    Object.keys(cigarettes[0]).forEach(col => {
      console.log(' -', col);
    });
  }
})();
