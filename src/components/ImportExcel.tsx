import { useState } from 'react';
import { db } from '../db/database';
import * as XLSX from 'xlsx';
import type { TypeJournee, LieuCigarette, TypeCigarette, QuantiteCigarette, SituationCigarette } from '../types';
import { calculerScore } from '../utils/calculs';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportExcel() {
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ journees: number; cigarettes: number } | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(false);
    setStats(null);

    try {
      // Lire le fichier Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      console.log('Lignes lues:', rows.length);

      // Mapper les données
      const journeesMap = new Map<string, { typeJournee: TypeJournee; id?: string }>();
      const cigarettesAImporter: any[] = [];

      for (const row of rows) {
        // Extraire les données de chaque ligne
        const date = row['Date'] || row['date'] || row['DATE'];
        const typeJournee = normaliserTypeJournee(row['Type Journée'] || row['Type'] || 'teletravail');
        const numero = Number(row['Numéro'] || row['Numero'] || row['N°'] || 1);
        const heure = normaliserHeure(row['Heure'] || row['heure'] || '12:00');
        const lieu = normaliserLieu(row['Lieu'] || row['lieu'] || 'maison');
        const type = normaliserTypeCigarette(row['Type cigarette'] || row['type'] || 'automatique');
        const besoin = Number(row['Besoin'] || row['besoin'] || 5);
        const satisfaction = Number(row['Satisfaction'] || row['satisfaction'] || 5);
        const quantite = normaliserQuantite(row['Quantité'] || row['quantite'] || 'entiere');
        const situation = normaliserSituation(row['Situation'] || row['situation'] || 'pause');
        const commentaire = row['Commentaire'] || row['commentaire'] || '';
        const kudzuPris = !!(row['Kudzu'] || row['kudzu'] || false);

        // Normaliser la date
        const dateStr = normaliserDate(date);

        // Ajouter la journée si elle n'existe pas déjà
        if (!journeesMap.has(dateStr)) {
          journeesMap.set(dateStr, { typeJournee });
        }

        // Ajouter la cigarette à importer
        cigarettesAImporter.push({
          date: dateStr,
          numero,
          heure,
          lieu,
          type,
          besoin,
          satisfaction,
          quantite,
          situation,
          commentaire,
          kudzuPris
        });
      }

      // Insérer les journées
      for (const [date, info] of journeesMap.entries()) {
        const existante = await db.journees.where('date').equals(date).first();
        if (!existante) {
          const id = await db.journees.add({
            date,
            typeJournee: info.typeJournee,
            createdAt: new Date().toISOString()
          });
          info.id = String(id);
        } else {
          info.id = String(existante.id);
        }
      }

      // Insérer les cigarettes
      let cigImportees = 0;
      for (const cig of cigarettesAImporter) {
        const journeeInfo = journeesMap.get(cig.date);
        if (!journeeInfo?.id) continue;

        const score = calculerScore({
          besoin: cig.besoin,
          satisfaction: cig.satisfaction,
          type: cig.type,
          quantite: cig.quantite
        });

        await db.cigarettes.add({
          journeeId: String(journeeInfo.id),
          numero: cig.numero,
          heure: cig.heure,
          lieu: cig.lieu,
          type: cig.type,
          besoin: cig.besoin,
          satisfaction: cig.satisfaction,
          quantite: cig.quantite,
          situation: cig.situation,
          commentaire: cig.commentaire,
          kudzuPris: cig.kudzuPris,
          scoreCalcule: score,
          createdAt: new Date().toISOString()
        });

        cigImportees++;
      }

      setStats({
        journees: journeesMap.size,
        cigarettes: cigImportees
      });
      setSuccess(true);
    } catch (err) {
      console.error('Erreur lors de l\'import:', err);
      setError('Erreur lors de l\'import. Vérifiez le format du fichier.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 Importer des données Excel</h2>

      <div className="space-y-4">
        <p className="text-gray-600">
          Importez vos données historiques depuis un fichier Excel (.xlsx). Le fichier doit contenir
          les colonnes suivantes : Date, Type Journée, Numéro, Heure, Lieu, Type cigarette, Besoin,
          Satisfaction, Quantité, Situation.
        </p>

        {/* Zone d'upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <label className="cursor-pointer">
            <span className="btn-primary inline-block">
              Sélectionner un fichier Excel
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={importing}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Fichiers acceptés : .xlsx, .xls
          </p>
        </div>

        {/* État de l'import */}
        {importing && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-900 font-medium">Import en cours...</span>
          </div>
        )}

        {success && stats && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-600 mt-0.5" size={24} />
            <div>
              <p className="text-green-900 font-semibold">Import réussi !</p>
              <p className="text-sm text-green-800 mt-1">
                {stats.journees} journée{stats.journees > 1 ? 's' : ''} et {stats.cigarettes} cigarette{stats.cigarettes > 1 ? 's' : ''} importée{stats.cigarettes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600 mt-0.5" size={24} />
            <div>
              <p className="text-red-900 font-semibold">Erreur</p>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Format attendu :</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Date : format JJ/MM/AAAA ou AAAA-MM-JJ</li>
            <li>Type Journée : travail, teletravail, ou weekend</li>
            <li>Numéro : numéro de la cigarette (1, 2, 3...)</li>
            <li>Heure : format HH:MM</li>
            <li>Lieu : maison, travail, exterieur, voiture, restaurant, chez_quelquun</li>
            <li>Type cigarette : besoin, automatique, ou plaisir</li>
            <li>Besoin : nombre de 1 à 10</li>
            <li>Satisfaction : nombre de 1 à 10</li>
            <li>Quantité : entiere, 3/4, 1/2, 1/4, ou taffes</li>
            <li>Situation : apres_repas, pause, trajet, ennui, stress, social, attente, autre</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Fonctions de normalisation
function normaliserDate(date: any): string {
  if (typeof date === 'string') {
    // Format JJ/MM/AAAA
    if (date.includes('/')) {
      const [jour, mois, annee] = date.split('/');
      return `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
    }
    // Format AAAA-MM-JJ
    if (date.includes('-')) {
      return date;
    }
  }
  // Fallback
  return new Date().toISOString().split('T')[0];
}

function normaliserHeure(heure: any): string {
  if (typeof heure === 'string') {
    // Format HH:MM
    if (heure.includes(':')) {
      const [h, m] = heure.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }
    // Format HHhMM ou HHh
    if (heure.toLowerCase().includes('h')) {
      const [h, reste] = heure.toLowerCase().split('h');
      const minutes = (reste || '00').replace(/[^0-9]/g, '');
      return `${h.trim().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    }
    // Format HHMM sans séparateur
    const digitsOnly = heure.replace(/[^0-9]/g, '');
    if (digitsOnly.length === 4) {
      return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
    }
    if (digitsOnly.length === 3) {
      return `${digitsOnly.slice(0, 1).padStart(2, '0')}:${digitsOnly.slice(1)}`;
    }
    if (digitsOnly.length <= 2 && digitsOnly.length > 0) {
      return `${digitsOnly.padStart(2, '0')}:00`;
    }
  }
  if (typeof heure === 'number') {
    const heures = Math.floor(heure);
    const minutes = Math.round((heure - heures) * 60);
    return `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return '12:00';
}

function normaliserTypeJournee(type: any): TypeJournee {
  const str = String(type).toLowerCase();
  if (str.includes('travail') && !str.includes('tele')) return 'travail';
  if (str.includes('tele')) return 'teletravail';
  if (str.includes('week')) return 'weekend';
  return 'teletravail';
}

function normaliserLieu(lieu: any): LieuCigarette {
  const str = String(lieu).toLowerCase();
  if (str.includes('maison') || str.includes('home')) return 'maison';
  if (str.includes('travail') || str.includes('bureau')) return 'travail';
  if (str.includes('ext') || str.includes('dehors')) return 'exterieur';
  if (str.includes('voiture') || str.includes('car')) return 'voiture';
  if (str.includes('restaurant') || str.includes('bar')) return 'restaurant';
  if (str.includes('quelqu')) return 'chez_quelquun';
  return 'maison';
}

function normaliserTypeCigarette(type: any): TypeCigarette {
  const str = String(type).toLowerCase().trim();
  if (str === 'b') return 'besoin';
  if (str === 'p') return 'plaisir';
  if (str === 'a') return 'automatique';
  if (str.includes('besoin') || str.includes('need')) return 'besoin';
  if (str.includes('plaisir') || str.includes('pleasure')) return 'plaisir';
  return 'automatique';
}

function normaliserQuantite(quantite: any): QuantiteCigarette {
  const str = String(quantite).toLowerCase();
  if (str.includes('3/4')) return '3/4';
  if (str.includes('1/2') || str.includes('moitié')) return '1/2';
  if (str.includes('1/4') || str.includes('quart')) return '1/4';
  if (str.includes('taff')) return 'taffes';
  return 'entiere';
}

function normaliserSituation(situation: any): SituationCigarette {
  const str = String(situation).toLowerCase();
  if (str.includes('reveil') || str.includes('réveil') || str.includes('wake')) return 'reveil';
  if (str.includes('avant_repas') || str.includes('before_meal')) return 'avant_repas';
  if (str.includes('apres_repas') || str.includes('après_repas') || str.includes('meal')) return 'apres_repas';
  if (str.includes('avant_sortie') || str.includes('before_out')) return 'avant_sortie';
  if (str.includes('film') || str.includes('movie') || str.includes('serie')) return 'film';
  if (str.includes('telephone') || str.includes('téléphone') || str.includes('phone')) return 'telephone';
  if (str.includes('voiture') || str.includes('car')) return 'voiture';
  if (str.includes('pause') || str.includes('break')) return 'pause';
  if (str.includes('trajet') || str.includes('commute')) return 'trajet';
  if (str.includes('ennui') || str.includes('bored')) return 'ennui';
  if (str.includes('stress')) return 'stress';
  if (str.includes('social')) return 'social';
  if (str.includes('attente') || str.includes('wait')) return 'attente';
  return 'autre';
}
