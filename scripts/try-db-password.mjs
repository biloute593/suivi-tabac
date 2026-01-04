import pkg from 'pg';
const { Client } = pkg;

const passwords = [
    'Ly3625die_Baconnette',
    'ly3625die_baconnette',
    'Ly3625die_Baconne',
    'LYDIE59',
    'Lydie_Baconnette'
];

const hostname = 'db.azzltzrzmukvyaiyamkc.supabase.co';
const port = 5432;
const user = 'postgres';
const database = 'postgres';

async function tryPasswords() {
    for (const pwd of passwords) {
        console.log(`🔑 Trying password: ${pwd}`);
        const client = new Client({
            host: hostname,
            port: port,
            user: user,
            password: pwd,
            database: database,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS with password: ${pwd}`);
            await client.end();
            return pwd;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    return null;
}

tryPasswords();
