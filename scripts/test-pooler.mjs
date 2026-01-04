import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Ly3625die_Baconnette@db.azzltzrzmukvyaiyamkc.supabase.co:6543/postgres';

async function test() {
    console.log('🔗 Testing connection to pooler...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.end();
    } catch (error) {
        console.log('❌ Failed:', error.message);
    }
}

test();
