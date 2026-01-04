import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const tables = ['posts', 'post_likes', 'post_comments', 'chat_invitations'];

    console.log('🔍 Checking social tables...');

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.code === '42P01') {
                console.log(`❌ Table "${table}" does NOT exist.`);
            } else {
                console.log(`⚠️ Error checking table "${table}":`, error.message);
            }
        } else {
            console.log(`✅ Table "${table}" EXISTS.`);
        }
    }
}

checkTables();
