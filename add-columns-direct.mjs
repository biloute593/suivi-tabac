import pkg from 'pg';
const { Client } = pkg;

// Connexion directe à PostgreSQL via Supabase
const connectionString = 'postgresql://postgres.azzltzrzmukvyaiyamkc:Ly3625die_Baconnette@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

async function addColumns() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    console.log('📝 Ajout de la colonne date_naissance...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS date_naissance DATE;
    `);
    console.log('✅ date_naissance ajoutée\n');
    
    console.log('📝 Ajout de la colonne debut_tabagisme...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS debut_tabagisme DATE;
    `);
    console.log('✅ debut_tabagisme ajoutée\n');
    
    console.log('📝 Ajout de la colonne cigarettes_par_jour_max...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS cigarettes_par_jour_max INTEGER DEFAULT 20;
    `);
    console.log('✅ cigarettes_par_jour_max ajoutée\n');
    
    // Vérifier
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Colonnes de la table users:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

addColumns();
