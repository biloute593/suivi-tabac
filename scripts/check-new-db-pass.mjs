import pkg from 'pg';
const { Client } = pkg;

const passwords = [
    'Ly3625die_Baconnette',
    'ly3625die_baconnette',
    'Ly3625die_Baconne',
    'LYDIE59',
    'Lydie_Baconnette',
    'LYDIE59!',
    'Lydie59!',
    'Ly3625die_Baconnette59',
    'ly3625die59'
];

const hostname = 'db.gyejvnchiijounmkgqvg.supabase.co';
const port = 5432;
const user = 'postgres';
const database = 'postgres';

async function tryPasswords() {
    console.log(`🔍 Checking passwords for ${hostname}...`);
    for (const pwd of passwords) {
        console.log(`🔑 Trying password: ${pwd}`);
        const client = new Client({
            host: hostname,
            port: port,
            user: user,
            password: pwd,
            database: database,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS with password: ${pwd}`);
            await client.end();
            process.exit(0);
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
    console.log('❌ None of the known passwords worked for the new project.');
    process.exit(1);
}

tryPasswords();
