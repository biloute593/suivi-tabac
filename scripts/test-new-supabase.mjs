import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyejvnchiijounmkgqvg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWp2bmNoaWlqb3VubWtncXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODQ1MTUsImV4cCI6MjA3NTY2MDUxNX0.APUmj_HWnTj93lFpyZ-3C8fyxgkliRdckTUe3KitvLQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing connection to new project...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
        console.log('Connection failed or table doesn\'t exist yet (expected if new project)');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        if (error.code === 'PGRST204' || error.message.includes('not found')) {
            console.log('✅ Connection is OK, but schema is missing. We can proceed.');
        }
    } else {
        console.log('✅ Connection successful and table exists.');
    }
}

testConnection();
