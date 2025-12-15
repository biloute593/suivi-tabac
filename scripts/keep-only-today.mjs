import { format } from 'date-fns';

const API_URL = 'https://suivi-tabac-func-free.azurewebsites.net/api';
const TODAY = format(new Date(), 'yyyy-MM-dd');

async function fetchJSON(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Erreur requête ${path}: ${res.status}`);
  return res.json();
}

async function deleteResource(path) {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Suppression échouée ${path}: ${res.status}`);
}

async function run() {
  console.log(`📥 Récupération des données... (conservation uniquement du ${TODAY})`);
  const [journees, cigarettes] = await Promise.all([
    fetchJSON('/journees'),
    fetchJSON('/cigarettes')
  ]);

  const keepJournees = journees.filter((j) => j.date === TODAY);
  const keepIds = new Set(keepJournees.map((j) => j.id));
  const journeesToDelete = journees.filter((j) => j.date !== TODAY);
  const cigarettesToDelete = cigarettes.filter((c) => !keepIds.has(c.journeeId));

  console.log(`🗓️  ${journeesToDelete.length} journées hors ${TODAY} seront supprimées.`);
  console.log(`🚬 ${cigarettesToDelete.length} cigarettes associées seront supprimées.`);

  for (const cig of cigarettesToDelete) {
    await deleteResource(`/cigarettes/${cig.id}`);
    console.log(`  ➖ Cigarette ${cig.id} supprimée.`);
  }

  for (const journee of journeesToDelete) {
    await deleteResource(`/journees/${journee.id}`);
    console.log(`  🗑️ Journée ${journee.date} (${journee.id}) supprimée.`);
  }

  console.log(`✅ Terminé : seules les données du ${TODAY} sont conservées.`);
}

run().catch((err) => {
  console.error('❌ Erreur pendant le nettoyage:', err);
  process.exit(1);
});
