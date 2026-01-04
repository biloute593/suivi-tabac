import pkg from 'pg';
const { Client } = pkg;

const projectRef = 'azzltzrzmukvyaiyamkc';
const host = `db.${projectRef}.supabase.co`;
const port = 6543;
const user = `postgres.${projectRef}`;
const password = 'Ly3625die_Baconnette';

async function test() {
    console.log(`🔗 Testing connection to ${user}@${host}:${port}...`);
    const client = new Client({
        host,
        port,
        user,
        password,
        database: 'postgres',
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
