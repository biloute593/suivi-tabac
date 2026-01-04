import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRpc() {
    console.log('🔍 Checking if "exec_sql" RPC exists...');

    // Attempt to call it with a harmless query
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });

    if (error) {
        console.log('❌ RPC "exec_sql" failed or does not exist:', error.message);

        console.log('🔍 Checking if fallback "sql" parameter works...');
        const { error: error2 } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
        if (error2) {
            console.log('❌ RPC "exec_sql" with "sql" param también failed:', error2.message);
        } else {
            console.log('✅ RPC "exec_sql" exists and works with "sql" parameter!');
        }
    } else {
        console.log('✅ RPC "exec_sql" exists and works with "query" parameter!');
    }
}

checkRpc();
