import { useState } from 'react';
import Dexie from 'dexie';

export default function RecuperationIndexedDB() {
  const [donnees, setDonnees] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const lireIndexedDB = async () => {
    try {
      setLoading(true);
      setStatus('🔍 Recherche de la base IndexedDB...');

      // Ouvrir IndexedDB
      const db = new Dexie('suivi-tabac-db');
      db.version(1).stores({
        journees: '++id, date',
        cigarettes: '++id, journeeId, numero, heure',
        objectifs: '++id, actif'
      });

      await db.open();
      setStatus('✅ Base trouvée ! Lecture des données...');

      // Lire toutes les données
      const journees = await db.table('journees').toArray();
      const cigarettes = await db.table('cigarettes').toArray();
      const objectifs = await db.table('objectifs').toArray();

      const data = {
        exportDate: new Date().toISOString(),
        journees,
        cigarettes,
        objectifs
      };

      setDonnees(data);
      setStatus(`✅ TROUVÉ ! ${journees.length} journées, ${cigarettes.length} cigarettes`);
      setLoading(false);

      db.close();
    } catch (error) {
      setStatus(`❌ Erreur: ${error}`);
      setLoading(false);
    }
  };

  const telechargerJSON = () => {
    if (!donnees) return;

    const jsonString = JSON.stringify(donnees, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recuperation-indexeddb-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copierJSON = () => {
    if (!donnees) return;
    const jsonString = JSON.stringify(donnees, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert('✅ Données copiées dans le presse-papier !');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-gradient mb-6">
          <h1 className="text-3xl font-bold text-gradient mb-4">🔍 Récupération IndexedDB</h1>
          
          <p className="text-gray-700 mb-4">
            Cette page va chercher tes données dans le stockage local de ton navigateur (IndexedDB).
          </p>

          <button
            onClick={lireIndexedDB}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg transition-all mb-4 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105'
            }`}
          >
            {loading ? '🔄 Recherche...' : '🔍 Chercher mes données locales'}
          </button>

          {status && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded mb-4">
              <p className="text-blue-800 font-medium">{status}</p>
            </div>
          )}
        </div>

        {donnees && (
          <>
            <div className="card bg-white mb-4">
              <h2 className="text-xl font-bold mb-4">📊 Résumé</h2>
              <div className="space-y-2 text-lg">
                <p>📅 <strong>{donnees.journees.length}</strong> journées trouvées</p>
                <p>🚬 <strong>{donnees.cigarettes.length}</strong> cigarettes trouvées</p>
                <p>🎯 <strong>{donnees.objectifs.length}</strong> objectifs trouvés</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={telechargerJSON}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  📥 Télécharger JSON
                </button>
                <button
                  onClick={copierJSON}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  📋 Copier JSON
                </button>
              </div>
            </div>

            <div className="card bg-gray-900 text-white">
              <h2 className="text-xl font-bold mb-4 text-green-400">📝 Aperçu des journées</h2>
              <div className="bg-black rounded p-4 font-mono text-xs overflow-auto max-h-96">
                {donnees.journees.map((j: any, i: number) => {
                  const cigCount = donnees.cigarettes.filter((c: any) => c.journeeId === j.id).length;
                  return (
                    <div key={i} className="text-green-300 mb-1">
                      {j.date} - {j.typeJournee} - {cigCount} cigarettes
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card bg-gray-900 text-white mt-4">
              <h2 className="text-xl font-bold mb-4 text-green-400">💾 Données complètes (JSON)</h2>
              <div className="bg-black rounded p-4 font-mono text-xs overflow-auto max-h-96">
                <pre className="text-green-300">{JSON.stringify(donnees, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
