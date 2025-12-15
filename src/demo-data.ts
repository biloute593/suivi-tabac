import { apiService } from './services/api';
import { calculerScore } from './utils/calculs';
import type { TypeJournee, LieuCigarette, TypeCigarette, QuantiteCigarette, SituationCigarette } from './types';
import excelData from './excel-data.json';

interface ExcelRow {
  date: string;
  typeJournee: string;
  numero: number;
  heure: string;
  lieu: string;
  type: string;
  besoin: number;
  satisfaction: number;
  quantite: string;
  situation: string;
  kudzu: number;
  commentaire: string;
}

/**
 * Fonction pour initialiser les données depuis le fichier Excel
 * FUSIONNE les données - n'écrase PAS les données existantes
 * Vérifie cigarette par cigarette pour combler les trous
 */
export async function initialiserDonneesExcel() {
  try {
    console.log('🔄 IMPORT EXCEL - FUSION avec Cosmos DB');
    const data = excelData as ExcelRow[];
    let cigarettesAjoutees = 0;
    let journeesCrees = 0;

    console.log(`📦 Total cigarettes dans Excel: ${data.length}`);

    // 1. Charger les journées existantes depuis Cosmos DB
    console.log('🔍 Chargement des journées existantes...');
    const existingJournees = await apiService.getJournees();
    console.log(`📅 Journées existantes dans Cosmos DB: ${existingJournees.length}`);
    
    const journeesMap = new Map<string, string>(); // date -> id
    for (const j of existingJournees) {
      journeesMap.set(j.date, j.id);
      console.log(`  ✓ ${j.date} → ${j.id}`);
    }

    // 2. Extraire TOUTES les dates uniques du fichier Excel
    const datesUniques = Array.from(new Set(data.map(r => r.date))).sort();
    console.log(`📅 Dates uniques dans Excel: ${datesUniques.length}`);
    console.log(`📋 Liste: ${datesUniques.join(', ')}`);

    // 3. Créer les journées manquantes UNE PAR UNE
    console.log('\n🏗️  CRÉATION DES JOURNÉES MANQUANTES...');
    for (const date of datesUniques) {
      if (journeesMap.has(date)) {
        console.log(`⏭️  ${date} existe déjà (ID: ${journeesMap.get(date)})`);
        continue;
      }

      // Trouver une ligne avec cette date pour obtenir le type de journée
      const exempleLigne = data.find(r => r.date === date);
      if (!exempleLigne) {
        console.error(`❌ Aucune ligne trouvée pour ${date}`);
        continue;
      }

      const typeJournee = normaliserTypeJournee(exempleLigne.typeJournee);
      console.log(`➕ Création de ${date} (type: ${typeJournee})...`);
      
      try {
        const nouvelleJournee = await apiService.createJournee({
          date,
          typeJournee,
          createdAt: new Date().toISOString()
        } as any);
        
        journeesMap.set(date, nouvelleJournee.id);
        journeesCrees++;
        console.log(`   ✅ Créée avec succès (ID: ${nouvelleJournee.id})`);
      } catch (error) {
        console.error(`   ❌ Erreur création ${date}:`, error);
      }
    }

    console.log(`\n📊 BILAN JOURNÉES:`);
    console.log(`   - Existantes: ${existingJournees.length}`);
    console.log(`   - Créées: ${journeesCrees}`);
    console.log(`   - Total dans map: ${journeesMap.size}`);

    // 4. Créer un objectif si aucun n'existe
    const objectifs = await apiService.getObjectifs();
    if (objectifs.length === 0) {
      console.log('🎯 Création d\'un objectif par défaut...');
      await apiService.createObjectif({
        dateDebut: '2025-11-01',
        nombreMax: 10,
        actif: true,
        createdAt: new Date().toISOString()
      } as any);
    }

    // 5. Charger toutes les cigarettes existantes
    console.log('\n🚬 IMPORT DES CIGARETTES...');
    const allCigarettes = await apiService.getCigarettes();
    console.log(`📦 Cigarettes existantes dans Cosmos DB: ${allCigarettes.length}`);
    const existingCigs = new Set(allCigarettes.map(c => `${c.journeeId}-${c.numero}`));

    // 6. Ajouter les cigarettes manquantes
    console.log(`🔄 Traitement de ${data.length} cigarettes Excel...`);
    for (const row of data) {
      const journeeId = journeesMap.get(row.date);
      if (!journeeId) {
        console.warn(`⚠️  Pas de journée pour ${row.date} (cigarette #${row.numero})`);
        continue;
      }

      const signature = `${journeeId}-${row.numero}`;
      
      if (!existingCigs.has(signature)) {
        const lieu = normaliserLieu(row.lieu);
        const type = normaliserTypeCigarette(row.type);
        const quantite = normaliserQuantite(row.quantite);
        const situation = normaliserSituation(row.situation);

        const score = calculerScore({
          besoin: row.besoin,
          satisfaction: row.satisfaction,
          type,
          quantite
        });

        await apiService.createCigarette({
          journeeId: journeeId,
          numero: row.numero,
          heure: row.heure,
          lieu,
          type,
          besoin: row.besoin,
          satisfaction: row.satisfaction,
          quantite,
          situation,
          commentaire: row.commentaire || '',
          kudzuPris: row.kudzu === 1,
          scoreCalcule: score,
          createdAt: new Date().toISOString()
        } as any);
        cigarettesAjoutees++;
      }
    }

    console.log(`\n✅ IMPORT TERMINÉ!`);
    console.log(`   📅 Journées créées: ${journeesCrees}`);
    console.log(`   🚬 Cigarettes ajoutées: ${cigarettesAjoutees}`);
    console.log(`   ⏭️  Cigarettes ignorées (déjà existantes): ${data.length - cigarettesAjoutees}`);
    
    return { 
      added: cigarettesAjoutees, 
      skipped: data.length - cigarettesAjoutees, 
      message: `${journeesCrees} journées et ${cigarettesAjoutees} cigarettes importées` 
    };

  } catch (error) {
    console.error('❌ Erreur import:', error);
    return { added: 0, skipped: 0, message: 'Erreur: ' + error };
  }
}

function normaliserTypeJournee(type: string): TypeJournee {
  const str = type.toLowerCase();
  if (str.includes('travail') && !str.includes('tele')) return 'travail';
  if (str.includes('tele')) return 'teletravail';
  return 'weekend';
}

function normaliserLieu(lieu: string): LieuCigarette {
  const mapping: Record<string, LieuCigarette> = {
    'maison': 'maison',
    'travail': 'travail',
    'exterieur': 'exterieur',
    'voiture': 'voiture',
    'restaurant': 'restaurant',
    'chez_quelquun': 'chez_quelquun'
  };
  return mapping[lieu] || 'maison';
}

function normaliserTypeCigarette(type: string): TypeCigarette {
  const mapping: Record<string, TypeCigarette> = {
    'besoin': 'besoin',
    'plaisir': 'plaisir',
    'automatique': 'automatique'
  };
  return mapping[type] || 'automatique';
}

function normaliserQuantite(quantite: string): QuantiteCigarette {
  const mapping: Record<string, QuantiteCigarette> = {
    'entiere': 'entiere',
    '3/4': '3/4',
    '1/2': '1/2',
    '1/4': '1/4',
    'taffes': 'taffes'
  };
  return mapping[quantite] || 'entiere';
}

function normaliserSituation(situation: string): SituationCigarette {
  const mapping: Record<string, SituationCigarette> = {
    'reveil': 'reveil',
    'avant_repas': 'avant_repas',
    'apres_repas': 'apres_repas',
    'avant_sortie': 'avant_sortie',
    'film': 'film',
    'telephone': 'telephone',
    'voiture': 'voiture',
    'pause': 'pause',
    'trajet': 'trajet',
    'ennui': 'ennui',
    'stress': 'stress',
    'social': 'social',
    'attente': 'attente',
    'autre': 'autre'
  };
  return mapping[situation] || 'autre';
}

// Export par défaut
export default initialiserDonneesExcel;
