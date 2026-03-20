import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const connectionString = 'postgresql://postgres:Ly3625die_Baconnette@db.gyejvnchiijounmkgqvg.supabase.co:5432/postgres';

async function run() {
    console.log('🚀 CLI SQL Executor - Starting...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to remote database');

        const sql = fs.readFileSync('social_schema_final.sql', 'utf8');
        console.log('📝 Running SQL schema...');
        await client.query(sql);
        console.log('✅ SQL schema applied successfully!');

    } catch (err) {
        console.error('❌ Error executing SQL:', err.message);
        if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
            console.log('\n⚠️ Database connection blocked (port 5432).');
            console.log('It seems your environment restricts direct Postgres access.');
        }
    } finally {
        await client.end();
    }
}

run();
