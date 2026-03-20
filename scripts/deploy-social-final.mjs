import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

// Utilisation du pooler (port 6543) pour gyejvnchiijounmkgqvg
const connectionString = 'postgresql://postgres:Ly3625die_Baconnette@db.gyejvnchiijounmkgqvg.supabase.co:6543/postgres';

const sqlScript = fs.readFileSync('social_schema_final.sql', 'utf8');

async function deploy() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connecté à Supabase PostgreSQL\n');

        console.log('📝 Exécution du script de configuration sociale finale...');
        await client.query(sqlScript);
        console.log('✅ Schéma social déployé avec succès !\n');

        // Vérification
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('posts', 'post_likes', 'post_comments', 'friendships', 'messages');
        `);

        console.log('📊 Tables créées/vérifiées :');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Erreur de déploiement:', error.message);
    } finally {
        await client.end();
    }
}

deploy();
