
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration Hardcodée depuis supabaseClient.ts
const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
    let output = '--- VÉRIFICATION DES DONNÉES SUPABASE ---\n';

    // 1. Vérifier les Users
    const { data: users, error: userError } = await supabase.from('users').select('user_id, pseudo, created_at');
    if (userError) output += `Erreur Users: ${userError.message}\n`;
    else {
        output += `\n✅ USERS (${users.length}):\n`;
        users.forEach(u => output += ` - [${u.pseudo}] (ID: ${u.user_id}) - Créé le: ${new Date(u.created_at).toLocaleString()}\n`);
    }

    // 2. Vérifier les Journées
    const { count: countJournees, error: journeeError } = await supabase.from('journees').select('*', { count: 'exact', head: true });
    if (journeeError) output += `Erreur Journees: ${journeeError.message}\n`;
    else output += `\n✅ TOTAL JOURNÉES: ${countJournees}\n`;

    // 3. Vérifier les Cigarettes
    const { count: countCigarettes, error: cigError } = await supabase.from('cigarettes').select('*', { count: 'exact', head: true });
    if (cigError) output += `Erreur Cigarettes: ${cigError.message}\n`;
    else output += `\n✅ TOTAL CIGARETTES: ${countCigarettes}\n`;

    // 4. Vérifier les Objectifs
    const { count: countObjectifs, error: objError } = await supabase.from('objectifs').select('*', { count: 'exact', head: true });
    if (objError) output += `Erreur Objectifs: ${objError.message}\n`;
    else output += `\n✅ TOTAL OBJECTIFS: ${countObjectifs}\n`;

    // 5. Check metadata
    const { data: metadata, error: metaError } = await supabase.from('user_metadata').select('*');
    if (metaError) output += `Erreur Metadata: ${metaError.message}\n`;
    else output += `\n✅ USER METADATA (${metadata.length} entrées found)\n`;

    output += '\n--- FIN DE LA VÉRIFICATION ---';
    fs.writeFileSync('verification-result.txt', output);
    console.log('Verification done, results written to verification-result.txt');
}

verifyData();
