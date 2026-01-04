import { useState } from 'react';
import { db } from '../db/database';
import { Download } from 'lucide-react';

export default function ExportDonnees() {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const exporterVersJSON = async () => {
    try {
      setExporting(true);
      setStatus('📦 Récupération des données...');

      // Récupérer toutes les données
      let journees = await db.journees.toArray();
      let cigarettes = await db.cigarettes.toArray();
      let objectifs = await db.objectifs.toArray();

      // Filtrer par date si renseigné
      if (dateDebut) {
        journees = journees.filter(j => j.date >= dateDebut);
        cigarettes = cigarettes.filter(c => {
          const j = journees.find(jour => jour.id === c.journeeId);
          return j && j.date >= dateDebut;
        });
      }
      if (dateFin) {
        journees = journees.filter(j => j.date <= dateFin);
        cigarettes = cigarettes.filter(c => {
          const j = journees.find(jour => jour.id === c.journeeId);
          return j && j.date <= dateFin;
        });
      }

      setStatus(`✅ ${journees.length} journées, ${cigarettes.length} cigarettes trouvées (Filtre: ${dateDebut || 'Début'} au ${dateFin || 'Fin'})`);

      // Créer l'objet à exporter
      const donnees = {
        exportDate: new Date().toISOString(),
        journees,
        cigarettes,
        objectifs
      };

      // Convertir en JSON
      const jsonString = JSON.stringify(donnees, null, 2);

      // Créer un blob et télécharger
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suivi-tabac-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('✅ Export terminé ! Fichier téléchargé.');
      setExporting(false);
    } catch (error) {
      setStatus(`❌ Erreur: ${error}`);
      setExporting(false);
    }
  };

  const exporterVersCSV = async () => {
    try {
      setExporting(true);
      setStatus('📦 Récupération des données...');

      let journees = await db.journees.toArray();
      let cigarettes = await db.cigarettes.toArray();

      // Filtrer par date
      if (dateDebut) {
        journees = journees.filter(j => j.date >= dateDebut);
        cigarettes = cigarettes.filter(c => {
          const j = journees.find(jour => jour.id === c.journeeId);
          return j && j.date >= dateDebut;
        });
      }
      if (dateFin) {
        journees = journees.filter(j => j.date <= dateFin);
        cigarettes = cigarettes.filter(c => {
          const j = journees.find(jour => jour.id === c.journeeId);
          return j && j.date <= dateFin;
        });
      }

      setStatus(`✅ ${cigarettes.length} cigarettes trouvées`);

      // Créer le CSV
      let csv = 'Date,Type Journée,Numéro,Heure,Lieu,Type,Besoin,Satisfaction,Quantité,Situation,Commentaire,Kudzu Pris,Score\n';

      for (const cig of cigarettes) {
        const journee = journees.find(j => j.id === cig.journeeId);
        csv += `${journee?.date || ''},${journee?.typeJournee || ''},${cig.numero},${cig.heure},${cig.lieu},${cig.type},${cig.besoin},${cig.satisfaction},${cig.quantite},"${cig.situation}","${cig.commentaire || ''}",${cig.kudzuPris ? 'Oui' : 'Non'},${cig.scoreCalcule}\n`;
      }

      // Télécharger
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suivi-tabac-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('✅ Export CSV terminé ! Fichier téléchargé.');
      setExporting(false);
    } catch (error) {
      setStatus(`❌ Erreur: ${error}`);
      setExporting(false);
    }
  };

  return (
    <div className="card-gradient">
      <div className="flex items-center gap-3 mb-4">
        <Download size={32} className="text-primary-600" />
        <h2 className="text-2xl font-bold text-gradient">Exporter mes données</h2>
      </div>

      <p className="text-gray-700 mb-6">
        Télécharge une copie complète de toutes tes données pour les sauvegarder ou les réimporter plus tard.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={exporterVersJSON}
          disabled={exporting}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${exporting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105'
            }`}
        >
          {exporting ? '⏳ Export en cours...' : '📥 Exporter en JSON (complet)'}
        </button>

        <button
          onClick={exporterVersCSV}
          disabled={exporting}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${exporting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:scale-105'
            }`}
        >
          {exporting ? '⏳ Export en cours...' : '📊 Exporter en CSV (Excel)'}
        </button>
      </div>

      {status && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-blue-800 font-medium">{status}</p>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
        <p className="text-amber-800 text-sm">
          ⚠️ <strong>Important :</strong> Fais cet export sur ton <strong>téléphone</strong> pour récupérer tes données du 23-28 novembre !
        </p>
      </div>
    </div>
  );
}
