import pkg from 'pg';
const { Client } = pkg;

const users = [
    'postgres',
    'postgres.azzltzrzmukvyaiyamkc'
];

const passwords = [
    'Ly3625die_Baconnette',
    'Ly3625die-Baconnette',
    'Ly3625die.Baconnette',
];

const projectRef = 'azzltzrzmukvyaiyamkc';
const hosts = [
    `db.${projectRef}.supabase.co`,
    'aws-0-eu-west-1.pooler.supabase.com'
];

async function tryConnections() {
    for (const host of hosts) {
        for (const user of users) {
            for (const password of passwords) {
                const port = host.includes('pooler') ? 6543 : 5432;
                console.log(`Trying ${user}@${host}:${port} with password: ${password}`);

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
                    console.log(`✅ SUCCESS!`);
                    await client.end();
                    return;
                } catch (error) {
                    console.log(`❌ Failed: ${error.message}`);
                }
            }
        }
    }
}

tryConnections();
