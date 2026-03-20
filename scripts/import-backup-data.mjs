import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://gyejvnchiijounmkgqvg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWp2bmNoaWlqb3VubWtncXZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA4NDUxNSwiZXhwIjoyMDc1NjYwNTE1fQ.4Ih3dcH3dQ7HtPUhLlaVfQAizqAeeIoiaeK95VS2gKg';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LYDIE_USER_ID = '74f681f0-78e5-49f1-92c6-ee4d1e8cbf03';

async function importData() {
    console.log('🚀 Lancement de l\'importation des données...');

    try {
        const backupData = JSON.parse(fs.readFileSync('backup-lydie.json', 'utf8'));

        // 1. Créer l'utilisateur LYDIE si nécessaire
        console.log('👤 Création/Vérification de l\'utilisateur LYDIE...');
        const { error: userError } = await supabase.from('users').upsert({
            user_id: LYDIE_USER_ID,
            pseudo: 'LYDIE',
            password_hash: '5977112c3f81e3a6a9b40722144c4e8b835de338307d0843183577770f1a9420', // Hash pour LYDIE59 (à vérifier)
            objectif_global: 12,
            created_at: new Date().toISOString()
        });

        if (userError) throw new Error(`Erreur lors de la création de l'utilisateur: ${userError.message}`);
        console.log('✅ Utilisateur OK');

        // 2. Importer les journées
        console.log(`📅 Importation de ${backupData.journees.length} journées...`);
        const journees = backupData.journees.map(j => ({
            id: j.id,
            user_id: LYDIE_USER_ID,
            date: j.date,
            type_journee: j.typeJournee,
            objectif_nombre_max: j.objectifNombreMax,
            created_at: j.createdAt
        }));

        const { error: jError } = await supabase.from('journees').upsert(journees);
        if (jError) throw new Error(`Erreur journées: ${jError.message}`);
        console.log('✅ Journées OK');

        // 3. Importer les cigarettes
        console.log(`🚬 Importation de ${backupData.cigarettes.length} cigarettes...`);
        const cigarettes = backupData.cigarettes.map(c => ({
            id: c.id,
            journee_id: c.journeeId,
            user_id: LYDIE_USER_ID,
            numero: c.numero,
            heure: c.heure,
            lieu: c.lieu,
            type: c.type,
            besoin: c.besoin,
            satisfaction: c.satisfaction,
            quantite: c.quantite === 'entiere' ? 1 : 0.5,
            situation: c.situation,
            commentaire: c.commentaire,
            kudzu_pris: c.kudzuPris,
            score_calcule: c.scoreCalcule,
            created_at: c.createdAt
        }));

        // Importer par lots de 100 pour éviter les erreurs de taille de requête
        for (let i = 0; i < cigarettes.length; i += 100) {
            const batch = cigarettes.slice(i, i + 100);
            const { error: cError } = await supabase.from('cigarettes').upsert(batch);
            if (cError) throw new Error(`Erreur cigarettes lot ${i}: ${cError.message}`);
        }
        console.log('✅ Cigarettes OK');

        // 4. Importer les objectifs
        if (backupData.objectifs && backupData.objectifs.length > 0) {
            console.log(`🎯 Importation de ${backupData.objectifs.length} objectifs...`);
            const objectifs = backupData.objectifs.map(o => ({
                id: o.id,
                user_id: LYDIE_USER_ID,
                date_debut: o.dateDebut,
                nombre_max: o.nombreMax,
                actif: o.actif ? 1 : 0,
                created_at: o.createdAt
            }));
            const { error: oError } = await supabase.from('objectifs').upsert(objectifs);
            if (oError) throw new Error(`Erreur objectifs: ${oError.message}`);
            console.log('✅ Objectifs OK');
        }

        console.log('\n✨ MIGRATION DES DONNÉES RÉUSSIE !');

    } catch (error) {
        console.error('\n❌ ÉCHEC DE LA MIGRATION:');
        console.error(error.message);
        console.log('\nVérifiez que vous avez bien exécuté MIGRATION_INITIALE.sql sur le dashboard Supabase.');
    }
}

importData();
