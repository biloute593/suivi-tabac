import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4NDIzMSwiZXhwIjoyMDgxMDYwMjMxfQ.AkDzKwItjEy8mlEZuWhtvFnoXzm4bx-7PmhLVVGthW8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log('Checking friendships...');
    const { error: fError } = await supabase.from('friendships').select('*').limit(1);
    if (fError) console.log('Friendships Error:', fError.message);
    else console.log('Friendships table EXISTS.');

    console.log('Checking private_messages...');
    const { error: mError } = await supabase.from('private_messages').select('*').limit(1);
    if (mError) console.log('Private Messages Error:', mError.message);
    else console.log('Private Messages table EXISTS.');

    console.log('Checking messages...');
    const { error: msgError } = await supabase.from('messages').select('*').limit(1);
    if (msgError) console.log('Messages (simple) Error:', msgError.message);
    else console.log('Messages (simple) table EXISTS.');
}

check();
