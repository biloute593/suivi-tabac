import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Données Excel EXACTES depuis la capture (dates, heures, lieux, satisfactions, commentaires)
const excelData = [
  // 2025-12-07
  { date: '2025-12-07', numero: 1, heure: '11:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 2, heure: '12:15', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 3, heure: '13:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 4, heure: '14:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 5, heure: '16:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 6, heure: '17:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 7, heure: '19:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-07', numero: 8, heure: '20:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  // 2025-12-08
  { date: '2025-12-08', numero: 1, heure: '09:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 2, heure: '10:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 3, heure: '12:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 4, heure: '13:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 5, heure: '15:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 6, heure: '16:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 7, heure: '18:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-08', numero: 8, heure: '19:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  // 2025-12-09
  { date: '2025-12-09', numero: 1, heure: '08:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 2, heure: '10:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 3, heure: '11:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 4, heure: '13:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 5, heure: '14:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 6, heure: '16:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 7, heure: '17:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-09', numero: 8, heure: '19:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  // 2025-12-10
  { date: '2025-12-10', numero: 1, heure: '09:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 2, heure: '11:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 3, heure: '12:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 4, heure: '14:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 5, heure: '15:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 6, heure: '17:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-10', numero: 7, heure: '18:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  // 2025-12-11
  { date: '2025-12-11', numero: 1, heure: '10:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 2, heure: '11:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 3, heure: '13:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 4, heure: '14:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 5, heure: '16:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 6, heure: '17:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-11', numero: 7, heure: '19:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  // 2025-12-12
  { date: '2025-12-12', numero: 1, heure: '09:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'autre', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 2, heure: '10:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 3, heure: '12:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 4, heure: '13:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 5, heure: '15:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 6, heure: '16:30', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'pause', kudzu: 0, commentaire: '' },
  { date: '2025-12-12', numero: 7, heure: '18:00', lieu: 'maison', type: 'automatique', besoin: 5, satisfaction: 5, quantite: 'entiere', situation: 'apres_repas', kudzu: 0, commentaire: '' },
];

function calculerScore({besoin, satisfaction, type, quantite}) {
  let score = (Number(besoin||0)*2) + Number(satisfaction||0);
  const bonus = {besoin:5, plaisir:3, automatique:0}[type] ?? 0;
  score += bonus;
  const facteur = {entiere:1.0, '3/4':0.75, '1/2':0.5, '1/4':0.25, taffes:0.1}[quantite] ?? 1.0;
  score *= facteur;
  return Math.round(score);
}

async function importExcelOnly() {
  // Get LYDIE user
  const { data: users, error: uerr } = await supabase.from('users').select('*').ilike('pseudo', 'lydie');
  if (uerr) throw uerr;
  if (!users || users.length === 0) throw new Error('LYDIE not found');
  const userId = users[0].user_id;
  console.log(`👤 Utilisateur: ${userId}`);

  // DELETE all cigarettes for LYDIE
  const { error: delErr } = await supabase.from('cigarettes').delete().eq('user_id', userId);
  if (delErr) throw delErr;
  console.log('🗑️  Tous les cigarettes supprimés');

  // DELETE all journees for LYDIE
  const { error: delJErr } = await supabase.from('journees').delete().eq('user_id', userId);
  if (delJErr) throw delJErr;
  console.log('🗑️  Tous les journées supprimés');

  // Create journees from unique dates in excelData
  const dateSet = new Set(excelData.map(row => row.date));
  const journeeMap = new Map();
  
  for (const date of dateSet) {
    // Determine type_journee based on date (weekend detection)
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const typeJournee = isWeekend ? 'weekend' : 'teletravail';

    const { data: journee, error: jerr } = await supabase
      .from('journees')
      .insert({ user_id: userId, date, type_journee: typeJournee, objectif_nombre_max: 12 })
      .select()
      .single();
    if (jerr) throw jerr;
    journeeMap.set(date, journee.id);
  }
  console.log(`📅 ${journeeMap.size} journées créées`);

  // Insert cigarettes
  let inserted = 0;
  for (const row of excelData) {
    const journeeId = journeeMap.get(row.date);
    const score = calculerScore(row);

    const { error: ierr } = await supabase
      .from('cigarettes')
      .insert({
        user_id: userId,
        journee_id: journeeId,
        numero: row.numero,
        heure: row.heure,
        lieu: row.lieu,
        type: row.type,
        besoin: row.besoin,
        satisfaction: row.satisfaction,
        quantite: row.quantite,
        situation: row.situation,
        commentaire: row.commentaire || '',
        kudzu_pris: row.kudzu ? true : false,
        score_calcule: score
      });
    if (ierr) {
      console.error(`❌ Erreur ${row.date} #${row.numero}:`, ierr.message);
    } else {
      inserted++;
    }
  }
  console.log(`✅ ${inserted} cigarettes insérées`);

  // Verify final count
  const { data: final } = await supabase.from('cigarettes').select('id').eq('user_id', userId);
  console.log(`📊 Total final: ${final?.length || 0} cigarettes`);
}

importExcelOnly().catch(err => { console.error('Erreur:', err); process.exit(1); });
