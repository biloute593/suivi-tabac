
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration
const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSpecificDate() {
    const targetDate = '2025-12-16';
    let output = `--- VÉRIFICATION DU ${targetDate} ---\n`;

    // 1. Cigarettes du 16/12
    // Note: created_at includes time, so we look for matches or journee info
    const { data: cigarettes, error: cigError } = await supabase
        .from('cigarettes')
        .select('*, journees(date)')
        .order('created_at');

    if (cigError) output += `Erreur Cigarettes: ${cigError.message}\n`;
    else {
        const cigs16 = cigarettes.filter(c => {
            // Check date in journee relationship OR created_at
            const dateJ = c.journees?.date;
            const dateC = c.created_at.split('T')[0];
            return dateJ === targetDate || dateC === targetDate;
        });
        output += `\n🚬 CIGARETTES LE ${targetDate} : ${cigs16.length}\n`;
        cigs16.forEach(c => output += `  - ${c.heure} (${c.type})\n`);
    }

    // 2. Journal du 16/12
    const { data: notes, error: noteError } = await supabase
        .from('journal_notes')
        .select('*');

    if (noteError) output += `Erreur Journal: ${noteError.message}\n`;
    else {
        const notes16 = notes.filter(n => n.date === targetDate || n.created_at.startsWith(targetDate));
        output += `\nxh JOURNAL LE ${targetDate} : ${notes16.length}\n`;
        notes16.forEach(n => output += `  - ${n.contenu}\n`);
    }

    fs.writeFileSync('check-missing-data.txt', output);
    console.log('Verification done.');
}

checkSpecificDate();
