import { useEffect, useState } from 'react';
import { Upload, Download, Target, CalendarDays, CheckCircle2, AlertCircle, ShieldAlert, History, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../db/database';
import type { Journee, Objectif, Cigarette } from '../types';
import ImportExcel from './ImportExcel';
import ExportDonnees from './ExportDonnees';

const BACKUP_STORAGE_KEY = 'suivi_tabac_last_backup';

type BackupPayload = {
  savedAt: string;
  journees: Journee[];
  cigarettes: Cigarette[];
  objectifs: Objectif[];
};

function lireSauvegardeLocale(): BackupPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackupPayload;
  } catch (error) {
    console.error('Impossible de lire la sauvegarde locale', error);
    return null;
  }
}

export default function Parametres() {
  const [showImport, setShowImport] = useState(false);
  const [activeObjectif, setActiveObjectif] = useState<Objectif | null>(null);
  const [defaultValue, setDefaultValue] = useState(12);
  const [savingDefault, setSavingDefault] = useState(false);
  const [defaultMessage, setDefaultMessage] = useState<string | null>(null);
  const [prixCigarette, setPrixCigarette] = useState(0.50);
  const [savingPrix, setSavingPrix] = useState(false);
  const [prixMessage, setPrixMessage] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journeeCible, setJourneeCible] = useState<Journee | null>(null);
  const [dailyValue, setDailyValue] = useState(12);
  const [savingDaily, setSavingDaily] = useState(false);
  const [dailyMessage, setDailyMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<BackupPayload | null>(null);

  useEffect(() => {
    chargerParametres();
  }, []);

  useEffect(() => {
    chargerObjectifJour(selectedDate, activeObjectif?.nombreMax || defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeObjectif?.nombreMax, defaultValue]);

  useEffect(() => {
    setLastBackup(lireSauvegardeLocale());
  }, []);

  async function chargerParametres() {
    try {
      const objectifActif = await db.objectifs.where('actif').equals(1).first();
      const valeur = objectifActif?.nombreMax || 12;
      setActiveObjectif(objectifActif);
      setDefaultValue(valeur);
      
      // Charger le prix de la cigarette depuis localStorage
      const prixSauvegarde = localStorage.getItem('prixCigarette');
      if (prixSauvegarde) {
        setPrixCigarette(parseFloat(prixSauvegarde));
      }
      
      await chargerObjectifJour(selectedDate, valeur);
    } catch (error) {
      console.error('Erreur chargement paramètres', error);
    }
  }

  async function chargerObjectifJour(date: string, fallback: number) {
    try {
      const journee = await db.journees.where('date').equals(date).first();
      setJourneeCible(journee);
      setDailyValue(journee?.objectifNombreMax || fallback);
    } catch (error) {
      console.error('Erreur chargement objectif jour', error);
      setJourneeCible(null);
      setDailyValue(fallback);
    }
  }

  function afficherMessage(type: 'default' | 'daily', message: string) {
    if (type === 'default') {
      setDefaultMessage(message);
      setTimeout(() => setDefaultMessage(null), 4000);
    } else {
      setDailyMessage(message);
      setTimeout(() => setDailyMessage(null), 4000);
    }
  }

  async function handleSaveDefault() {
    try {
      setSavingDefault(true);
      if (activeObjectif?.id) {
        await db.objectifs.update(activeObjectif.id, {
          nombreMax: defaultValue,
          dateDebut: new Date().toISOString().split('T')[0]
        });
        setActiveObjectif({ ...activeObjectif, nombreMax: defaultValue });
      } else {
        const id = await db.objectifs.add({
          dateDebut: new Date().toISOString().split('T')[0],
          nombreMax: defaultValue,
          actif: true,
          createdAt: new Date().toISOString()
        });
        const user = await import('../utils/userContext').then(m => m.getCurrentUser());
        setActiveObjectif({
          id: String(id),
          userId: user?.userId || '',
          dateDebut: new Date().toISOString().split('T')[0],
          nombreMax: defaultValue,
          actif: true,
          createdAt: new Date().toISOString()
        });
      }
      afficherMessage('default', 'Nouvel objectif par défaut appliqué.');
      await chargerObjectifJour(selectedDate, defaultValue);
    } catch (error) {
      console.error('Erreur sauvegarde objectif par défaut', error);
      afficherMessage('default', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSavingDefault(false);
    }
  }

  async function handleSaveDaily() {
    if (!journeeCible) {
      afficherMessage('daily', 'Sélectionne d’abord la journée sur le Dashboard.');
      return;
    }

    try {
      setSavingDaily(true);
      await db.journees.update(journeeCible.id!, {
        objectifNombreMax: dailyValue
      });
      setJourneeCible({ ...journeeCible, objectifNombreMax: dailyValue });
      afficherMessage('daily', 'Objectif mis à jour uniquement pour cette journée.');
    } catch (error) {
      console.error('Erreur sauvegarde objectif quotidien', error);
      afficherMessage('daily', 'Erreur pendant la sauvegarde.');
    } finally {
      setSavingDaily(false);
    }
  }

  async function handleFullReset() {
    if (resetting) return;
    if (typeof window !== 'undefined' && !window.confirm('⚠️ Cette action supprime toutes les journées, cigarettes et objectifs. Continuer ?')) {
      return;
    }

    try {
      setResetting(true);
      setResetMessage(null);
      setRestoreMessage(null);

      const [journees, cigarettes, objectifs] = await Promise.all([
        db.journees.toArray(),
        db.cigarettes.toArray(),
        db.objectifs.toArray()
      ]);

      const backup: BackupPayload = {
        savedAt: new Date().toISOString(),
        journees,
        cigarettes,
        objectifs
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
      }
      setLastBackup(backup);

      await db.cigarettes.clear();
      await db.journees.clear();
      await db.objectifs.clear();

      await chargerParametres();

      setResetMessage(`✅ ${journees.length} journées et ${cigarettes.length} cigarettes supprimées. Sauvegarde créée (${format(new Date(backup.savedAt), 'dd/MM/yyyy HH:mm')}).`);
    } catch (error) {
      console.error('Erreur suppression totale', error);
      setResetMessage('❌ Impossible de tout effacer. Réessaie dans un instant.');
    } finally {
      setResetting(false);
    }
  }

  async function handleRestoreBackup() {
    if (restoring) return;
    const backup = lireSauvegardeLocale();
    if (!backup) {
      setRestoreMessage('❌ Aucune sauvegarde locale disponible. Lance d’abord une suppression pour en créer une.');
      return;
    }
    setLastBackup(backup);

    if (typeof window !== 'undefined' && !window.confirm('Cette opération remplace les données actuelles par la dernière sauvegarde. Continuer ?')) {
      return;
    }

    try {
      setRestoring(true);
      setRestoreMessage(null);

      await db.cigarettes.clear();
      await db.journees.clear();
      await db.objectifs.clear();

      const idMap: Record<string, string> = {};
      for (const journee of backup.journees) {
        const newId = await db.journees.add({
          date: journee.date,
          typeJournee: journee.typeJournee,
          objectifNombreMax: journee.objectifNombreMax,
          createdAt: journee.createdAt || new Date().toISOString()
        });
        if (journee.id) {
          idMap[String(journee.id)] = String(newId);
        }
      }

      for (const cigarette of backup.cigarettes) {
        const mappedJourneeId = cigarette.journeeId ? idMap[String(cigarette.journeeId)] : undefined;
        if (!mappedJourneeId) continue;
        await db.cigarettes.add({
          journeeId: mappedJourneeId,
          numero: cigarette.numero,
          heure: cigarette.heure,
          lieu: cigarette.lieu,
          type: cigarette.type,
          besoin: cigarette.besoin,
          satisfaction: cigarette.satisfaction,
          quantite: cigarette.quantite,
          situation: cigarette.situation,
          commentaire: cigarette.commentaire,
          kudzuPris: cigarette.kudzuPris,
          scoreCalcule: cigarette.scoreCalcule,
          createdAt: cigarette.createdAt || new Date().toISOString()
        });
      }

      for (const objectif of backup.objectifs) {
        await db.objectifs.add({
          dateDebut: objectif.dateDebut,
          nombreMax: objectif.nombreMax,
          actif: objectif.actif,
          createdAt: objectif.createdAt || new Date().toISOString()
        });
      }

      await chargerParametres();
      setRestoreMessage(`✅ Sauvegarde du ${format(new Date(backup.savedAt), 'dd/MM/yyyy HH:mm')} restaurée.`);
    } catch (error) {
      console.error('Erreur restauration sauvegarde', error);
      setRestoreMessage('❌ Erreur pendant la restauration. Aucun changement appliqué.');
    } finally {
      setRestoring(false);
    }
  }

  if (showImport) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowImport(false)}
          className="btn-secondary"
        >
          ← Retour aux paramètres
        </button>
        <ImportExcel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">⚙️ Paramètres</h2>

      {/* Gestion des objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prix de la cigarette */}
        <div className="card border border-orange-100 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-2xl">
              <DollarSign className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix de la cigarette</p>
              <h3 className="text-lg font-bold text-gray-900">Pour calculer les dépenses</h3>
            </div>
          </div>
          <label className="text-sm font-medium text-gray-700">Prix par cigarette (€)</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min={0}
              max={2}
              step={0.01}
              value={prixCigarette}
              onChange={(e) => setPrixCigarette(parseFloat(e.target.value))}
              className="input-field text-2xl font-bold text-center"
            />
            <button
              onClick={async () => {
                setSavingPrix(true);
                try {
                  localStorage.setItem('prixCigarette', prixCigarette.toString());
                  setPrixMessage('✅ Prix sauvegardé');
                  setTimeout(() => setPrixMessage(null), 3000);
                } catch (error) {
                  setPrixMessage('❌ Erreur de sauvegarde');
                } finally {
                  setSavingPrix(false);
                }
              }}
              disabled={savingPrix}
              className="btn-primary flex items-center gap-2"
            >
              {savingPrix ? 'Sauvegarde...' : 'Appliquer'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Le coût total sera affiché dans la section Analyses
          </p>
          {prixMessage && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${prixMessage.includes('Erreur') ? 'text-red-700' : 'text-green-700'} bg-gray-50 border rounded-lg px-3 py-2`}>
              {prixMessage.includes('Erreur') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{prixMessage}</span>
            </div>
          )}
        </div>

        {/* Objectif par défaut */}
        <div className="card border border-primary-100 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 rounded-2xl">
              <Target className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Objectif par défaut</p>
              <h3 className="text-lg font-bold text-gray-900">Pour chaque nouvelle journée</h3>
            </div>
          </div>
          <label className="text-sm font-medium text-gray-700">Nombre maximal de cigarettes</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min={1}
              max={40}
              value={defaultValue}
              onChange={(e) => setDefaultValue(Number(e.target.value))}
              className="input-field text-2xl font-bold text-center"
            />
            <button
              onClick={handleSaveDefault}
              disabled={savingDefault}
              className="btn-primary flex items-center gap-2"
            >
              {savingDefault ? 'Sauvegarde...' : 'Appliquer'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Les nouvelles journées utiliseront cette limite. Les journées déjà enregistrées gardent leur valeur.
          </p>
          {defaultMessage && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${defaultMessage.includes('Impossible') ? 'text-red-700' : 'text-green-700'} bg-gray-50 border rounded-lg px-3 py-2`}>
              {defaultMessage.includes('Impossible') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{defaultMessage}</span>
            </div>
          )}
        </div>

        {/* Objectif d'une journée */}
        <div className="card border border-indigo-100 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <CalendarDays className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Objectif ponctuel</p>
              <h3 className="text-lg font-bold text-gray-900">Modifier un jour précis</h3>
            </div>
          </div>
          <label className="text-sm font-medium text-gray-700">Date concernée</label>
          <input
            type="date"
            value={selectedDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field mt-1"
          />
          <label className="text-sm font-medium text-gray-700 mt-4">Objectif pour cette journée</label>
          <input
            type="number"
            min={1}
            max={40}
            value={dailyValue}
            onChange={(e) => setDailyValue(Number(e.target.value))}
            className="input-field mt-1 text-2xl font-bold text-center"
          />
          <p className="text-xs text-gray-500 mt-2">
            {journeeCible
              ? 'Seule la journée sélectionnée est mise à jour. Les autres restent inchangées.'
              : 'Crée d’abord la journée sur le Dashboard (type de journée) pour pouvoir fixer un objectif.'}
          </p>
          <button
            onClick={handleSaveDaily}
            className="btn-secondary w-full mt-3"
            disabled={savingDaily}
          >
            {savingDaily ? 'Mise à jour...' : 'Appliquer à cette journée'}
          </button>
          {dailyMessage && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${dailyMessage.includes('Erreur') || dailyMessage.includes('Sélectionne') ? 'text-red-700' : 'text-green-700'} bg-gray-50 border rounded-lg px-3 py-2`}>
              {dailyMessage.includes('Erreur') || dailyMessage.includes('Sélectionne') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{dailyMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Import / Export */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📁 Import / Export de fichiers</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="py-6 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <Upload size={32} />
            <span className="text-lg">Importer</span>
            <span className="text-xs opacity-80">Fichier Excel</span>
          </button>
          <div className="py-6 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl flex flex-col items-center justify-center gap-3 shadow-lg">
            <Download size={32} />
            <span className="text-lg">Exporter</span>
            <span className="text-xs opacity-80">Fichier JSON</span>
          </div>
        </div>
        <div className="mt-4">
          <ExportDonnees />
        </div>
      </div>

      {/* Réinitialisation / restauration */}
      <div className="card border border-rose-100 bg-rose-50/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-200 rounded-2xl">
            <ShieldAlert className="text-rose-700" />
          </div>
          <div>
            <p className="text-sm text-rose-700 font-semibold">Gestion des données</p>
            <h3 className="text-lg font-bold text-gray-900">Effacer ou restaurer tout</h3>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Un sauvegarde locale est créée automatiquement juste avant l'effacement. Tu peux ensuite la restaurer si tu changes d'avis ou en cas de problème.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleFullReset}
            disabled={resetting}
            className={`w-full py-4 px-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              resetting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:scale-105'
            }`}
          >
            {resetting ? '⏳ Suppression en cours...' : '🧨 Effacer toutes mes données'}
          </button>

          {resetMessage && (
            <div className={`p-3 rounded-xl text-sm ${resetMessage.startsWith('❌') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {resetMessage}
            </div>
          )}

          <button
            onClick={handleRestoreBackup}
            disabled={!lastBackup || restoring}
            className={`w-full py-4 px-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              !lastBackup || restoring
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105'
            }`}
          >
            {restoring
              ? '⏳ Restauration...'
              : lastBackup
              ? '♻️ Restaurer ma dernière sauvegarde'
              : '♻️ Restaurer (aucune sauvegarde disponible)'}
          </button>

          {restoreMessage && (
            <div className={`p-3 rounded-xl text-sm ${restoreMessage.startsWith('❌') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {restoreMessage}
            </div>
          )}

          <div className="bg-white/70 border border-rose-100 rounded-xl p-3 flex items-start gap-3">
            <History className="text-rose-500 mt-1" size={18} />
            <div className="text-sm text-gray-600">
              {lastBackup ? (
                <p>
                  Dernière sauvegarde : <strong>{format(new Date(lastBackup.savedAt), 'dd/MM/yyyy HH:mm')}</strong> • {lastBackup.journees.length} journées / {lastBackup.cigarettes.length} cigarettes.
                </p>
              ) : (
                <p>Aucune sauvegarde locale pour l'instant. Elle sera créée automatiquement quand tu effaces toutes tes données.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
