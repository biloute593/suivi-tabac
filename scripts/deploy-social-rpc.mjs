import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deploySocialSchema() {
    console.log('🚀 DÉPLOIEMENT DU SCHÉMA SOCIAL VIA RPC...');

    const sqlScript = readFileSync('deploy_social_schema.sql', 'utf-8');

    // Split the script into parts if needed, but exec_sql should handle it if it's one block.
    // However, the migration script splitted by semicolon.
    // Let's try to run it in blocks to avoid timeouts or issues.
    const commands = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const [index, command] of commands.entries()) {
        console.log(`📝 Exécution de la commande ${index + 1}/${commands.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });

        if (error) {
            console.error(`   ❌ Erreur: ${error.message}`);
            console.error(`   SQL: ${command.substring(0, 100)}...`);
        } else {
            console.log(`   ✅ Succès`);
        }
    }

    console.log('\n✨ Déploiement social terminé !');
}

deploySocialSchema().catch(console.error);
