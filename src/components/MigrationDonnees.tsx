import { useState } from 'react';
import Dexie from 'dexie';
import { apiService } from '../services/api';

interface LocalJournee {
  id?: string;
  date: string;
  typeJournee: string;
  createdAt: string;
}

interface LocalCigarette {
  id?: string;
  journeeId: string;
  numero: number;
  heure: string;
  lieu: string;
  type: string;
  besoin: number;
  satisfaction: number;
  quantite: string;
  situation: string;
  commentaire: string;
  kudzuPris: boolean;
  scoreCalcule: number;
  createdAt: string;
}

export default function MigrationDonnees() {
  const [status, setStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const migrerVersCosmosDB = async () => {
    try {
      setMigrating(true);
      setStatus('🔍 Ouverture de la base locale IndexedDB...');
      addLog('Démarrage de la migration');

      // Ouvrir IndexedDB
      const db = new Dexie('suivi-tabac-db');
      db.version(1).stores({
        journees: '++id, date',
        cigarettes: '++id, journeeId, numero, heure',
        objectifs: '++id, actif'
      });

      await db.open();
      addLog('✅ Base locale ouverte');

      // Récupérer toutes les journées locales
      const journeesLocales = await db.table('journees').toArray() as LocalJournee[];
      addLog(`📅 ${journeesLocales.length} journées trouvées dans IndexedDB`);

      if (journeesLocales.length === 0) {
        setStatus('❌ Aucune donnée locale trouvée');
        setMigrating(false);
        return;
      }

      // Récupérer toutes les cigarettes locales
      const cigarettesLocales = await db.table('cigarettes').toArray() as LocalCigarette[];
      addLog(`🚬 ${cigarettesLocales.length} cigarettes trouvées dans IndexedDB`);

      setStatus(`🔄 Migration de ${journeesLocales.length} journées et ${cigarettesLocales.length} cigarettes...`);

      // Map pour stocker ancien ID -> nouvel ID
      const journeeIdMap = new Map<string, string>();

      // 1. Migrer les journées
      let journeesCreees = 0;
      for (const journee of journeesLocales) {
        try {
          addLog(`➕ Création journée ${journee.date}...`);
          const nouvelleJournee = await apiService.createJournee({
            date: journee.date,
            typeJournee: journee.typeJournee,
            createdAt: journee.createdAt || new Date().toISOString()
          } as any);
          
          journeeIdMap.set(journee.id!, nouvelleJournee.id);
          journeesCreees++;
          addLog(`✅ Journée ${journee.date} créée (ID: ${nouvelleJournee.id})`);
        } catch (error) {
          addLog(`❌ Erreur journée ${journee.date}: ${error}`);
        }
      }

      addLog(`📊 ${journeesCreees} journées migrées vers Cosmos DB`);

      // 2. Migrer les cigarettes
      let cigarettesCreees = 0;
      for (const cig of cigarettesLocales) {
        const nouveauJourneeId = journeeIdMap.get(cig.journeeId);
        
        if (!nouveauJourneeId) {
          addLog(`⚠️ Cigarette #${cig.numero} ignorée (journée non trouvée)`);
          continue;
        }

        try {
          await apiService.createCigarette({
            journeeId: nouveauJourneeId,
            numero: cig.numero,
            heure: cig.heure,
            lieu: cig.lieu,
            type: cig.type,
            besoin: cig.besoin,
            satisfaction: cig.satisfaction,
            quantite: cig.quantite,
            situation: cig.situation,
            commentaire: cig.commentaire || '',
            kudzuPris: cig.kudzuPris || false,
            scoreCalcule: cig.scoreCalcule,
            createdAt: cig.createdAt || new Date().toISOString()
          } as any);
          
          cigarettesCreees++;
          
          if (cigarettesCreees % 20 === 0) {
            addLog(`📦 ${cigarettesCreees} cigarettes migrées...`);
          }
        } catch (error) {
          addLog(`❌ Erreur cigarette #${cig.numero}: ${error}`);
        }
      }

      addLog(`📊 ${cigarettesCreees} cigarettes migrées vers Cosmos DB`);

      setStatus(`✅ MIGRATION TERMINÉE ! ${journeesCreees} journées et ${cigarettesCreees} cigarettes dans Cosmos DB`);
      addLog('🎉 MIGRATION RÉUSSIE !');
      
      db.close();
      setMigrating(false);

    } catch (error) {
      const errorMsg = `❌ ERREUR: ${error}`;
      setStatus(errorMsg);
      addLog(errorMsg);
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card-gradient mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔄</span>
            <h1 className="text-2xl font-bold text-gradient">Migration des données</h1>
          </div>
          
          <p className="text-gray-700 mb-4">
            Cette page va récupérer <strong>toutes tes données locales</strong> (stockées sur cet appareil) 
            et les transférer vers <strong>Cosmos DB</strong> pour qu'elles soient accessibles partout.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <p className="text-amber-800 font-medium">
              ⚠️ <strong>Important :</strong> Ouvre cette page sur ton <strong>téléphone</strong> où tu as saisi tes données du 22-28 novembre !
            </p>
          </div>

          <button
            onClick={migrerVersCosmosDB}
            disabled={migrating}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              migrating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105'
            }`}
          >
            {migrating ? '🔄 Migration en cours...' : '🚀 Migrer mes données vers le Cloud'}
          </button>
        </div>

        {status && (
          <div className="card bg-white mb-4">
            <h2 className="font-bold text-lg mb-2">📊 Statut</h2>
            <p className="text-gray-800">{status}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="card bg-gray-900 text-white">
            <h2 className="font-bold text-lg mb-3 text-green-400">📝 Logs détaillés</h2>
            <div className="bg-black rounded p-3 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-green-300">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
