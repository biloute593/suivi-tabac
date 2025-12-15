import { format } from 'date-fns';

const API_URL = 'https://suivi-tabac-func-free.azurewebsites.net/api';
const KEEP_DATE = '2025-12-01';

async function fetchJSON(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Erreur requête ${path}: ${res.status}`);
  }
  return res.json();
}

async function deleteResource(path) {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Suppression échouée ${path}: ${res.status}`);
  }
}

async function run() {
  console.log('📥 Récupération des journées et cigarettes...');
  const [journees, cigarettes] = await Promise.all([
    fetchJSON('/journees'),
    fetchJSON('/cigarettes')
  ]);

  const journeesToKeep = journees.filter((j) => j.date >= KEEP_DATE);
  const keepIds = new Set(journeesToKeep.map((j) => j.id));
  const journeesToDelete = journees.filter((j) => j.date < KEEP_DATE);

  const cigsToDelete = cigarettes.filter((c) => !keepIds.has(c.journeeId));

  console.log(`🗓️  ${journeesToDelete.length} journées à supprimer (avant ${KEEP_DATE}).`);
  console.log(`🚬 ${cigsToDelete.length} cigarettes associées seront supprimées.`);

  for (const cig of cigsToDelete) {
    await deleteResource(`/cigarettes/${cig.id}`);
    console.log(`  ➖ Cigarette ${cig.id} supprimée.`);
  }

  for (const journee of journeesToDelete) {
    await deleteResource(`/journees/${journee.id}`);
    console.log(`  🗑️ Journée ${journee.date} (${journee.id}) supprimée.`);
  }

  console.log('✅ Nettoyage terminé. Il ne reste que les données à partir du', format(new Date(KEEP_DATE), 'dd MMMM yyyy'));
}

run().catch((err) => {
  console.error('❌ Erreur pendant le nettoyage:', err);
  process.exit(1);
});
