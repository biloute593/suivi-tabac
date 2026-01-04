import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Supabase config (same as verifier script)
const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helpers
function sha256(str) {
  // Lightweight SHA-256 via web crypto if available, fallback to manual lib not available here
  // We'll rely on database existing user; only create if missing without password handling.
  return null;
}

function normalizeDate(input) {
  if (!input) return new Date().toISOString().split('T')[0];
  const s = String(input);
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (s.includes('-')) return s;
  return new Date().toISOString().split('T')[0];
}

function normalizeHeure(input) {
  if (!input) return '12:00';
  const s = String(input).toLowerCase();
  if (s.includes(':')) {
    const [h, m] = s.split(':');
    const mm = String(m || '00').replace(/[^0-9]/g, '');
    const minutes = Math.min(59, Math.max(0, parseInt(mm || '0')));
    return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  if (s.includes('h')) {
    const [h, rest] = s.split('h');
    const minutes = (rest || '00').replace(/[^0-9]/g, '');
    const m = Math.min(59, Math.max(0, parseInt(minutes || '0')));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const digits = s.replace(/[^0-9]/g, '');
  if (digits.length === 4) return `${digits.slice(0,2)}:${digits.slice(2)}`;
  if (digits.length === 3) return `${digits.slice(0,1).padStart(2,'0')}:${digits.slice(1)}`;
  if (digits.length <= 2 && digits.length > 0) return `${digits.padStart(2,'0')}:00`;
  return '12:00';
}

function normalizeTypeJournee(t) {
  const s = String(t||'').toLowerCase();
  if (s.includes('repos')) return 'repos';
  if (s.includes('week')) return 'weekend';
  if (s.includes('tele')) return 'teletravail';
  if (s.includes('travail')) return 'travail';
  return 'teletravail';
}

function normalizeLieu(l) {
  const s = String(l||'').toLowerCase();
  if (s.includes('maison')||s.includes('home')) return 'maison';
  if (s.includes('travail')||s.includes('bureau')) return 'travail';
  if (s.includes('ext')||s.includes('dehors')) return 'exterieur';
  if (s.includes('voiture')||s.includes('car')) return 'voiture';
  if (s.includes('restaurant')||s.includes('bar')) return 'restaurant';
  if (s.includes('quelqu')) return 'chez_quelquun';
  return 'maison';
}

function normalizeTypeCigarette(t) {
  const s = String(t||'').toLowerCase().trim();
  if (s === 'b') return 'besoin';
  if (s === 'p') return 'plaisir';
  if (s === 'a') return 'automatique';
  if (s.includes('besoin')) return 'besoin';
  if (s.includes('plaisir')) return 'plaisir';
  return 'automatique';
}

function normalizeQuantite(q) {
  const s = String(q||'').toLowerCase();
  if (s.includes('3/4')) return '3/4';
  if (s.includes('1/2')||s.includes('moiti')) return '1/2';
  if (s.includes('1/4')||s.includes('quart')) return '1/4';
  if (s.includes('taff')) return 'taffes';
  return 'entiere';
}

function normalizeSituation(sit) {
  const s = String(sit||'').toLowerCase();
  if (s.includes('apres')||s.includes('après')||s.includes('meal')) return 'apres_repas';
  if (s.includes('avant_repas')) return 'avant_repas';
  if (s.includes('pause')||s.includes('break')) return 'pause';
  if (s.includes('trajet')||s.includes('commute')) return 'trajet';
  if (s.includes('ennui')||s.includes('bored')) return 'ennui';
  if (s.includes('stress')) return 'stress';
  if (s.includes('social')) return 'social';
  if (s.includes('attente')||s.includes('wait')) return 'attente';
  if (s.includes('reveil')||s.includes('réveil')) return 'reveil';
  if (s.includes('avant_sortie')) return 'avant_sortie';
  if (s.includes('film')||s.includes('movie')) return 'film';
  if (s.includes('telephone')) return 'telephone';
  if (s.includes('voiture')) return 'voiture';
  return 'autre';
}

function calculerScore({besoin, satisfaction, type, quantite}) {
  let score = (Number(besoin||0)*2) + Number(satisfaction||0);
  const bonus = {besoin:5, plaisir:3, automatique:0}[type] ?? 0;
  score += bonus;
  const facteur = {entiere:1.0, '3/4':0.75, '1/2':0.5, '1/4':0.25, taffes:0.1}[quantite] ?? 1.0;
  score *= facteur;
  return Math.round(score);
}

async function getOrCreateUserId() {
  // Try LYDIE then Lydie (case-insensitive)
  let { data: users, error } = await supabase.from('users').select('*').ilike('pseudo', 'lydie');
  if (error) throw error;
  if (users && users.length > 0) return users[0].user_id;
  // Create minimal user record if missing
  const { data: created, error: err2 } = await supabase
    .from('users')
    .insert({ pseudo: 'LYDIE', password_hash: null, objectif_global: 12, share_public: false })
    .select()
    .single();
  if (err2) throw err2;
  return created.user_id;
}

async function getOrCreateJourneeId(userId, date, typeJournee) {
  const { data: existing, error } = await supabase
    .from('journees')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  if (!error && existing) return existing.id;
  const { data: created, error: err2 } = await supabase
    .from('journees')
    .insert({ user_id: userId, date, type_journee: typeJournee, objectif_nombre_max: 12 })
    .select()
    .single();
  if (err2) throw err2;
  return created.id;
}

async function cigaretteExists(userId, journeeId, numero, heure) {
  const { data, error } = await supabase
    .from('cigarettes')
    .select('id')
    .eq('user_id', userId)
    .eq('journee_id', journeeId)
    .eq('numero', numero)
    .eq('heure', heure);
  if (error) return false;
  return (data && data.length > 0);
}

async function importFromJson() {
  const filePath = path.join(process.cwd(), 'src', 'excel-data.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = JSON.parse(raw);
  console.log(`📄 Fichier chargé: ${rows.length} lignes`);

  const userId = await getOrCreateUserId();
  console.log(`👤 Utilisateur cible: ${userId}`);

  let journeesCreees = new Set();
  let cigsInserees = 0;

  for (const row of rows) {
    const date = normalizeDate(row.date);
    const typeJournee = normalizeTypeJournee(row.typeJournee || row.type);
    const numero = Number(row.numero || row['Numéro'] || 1);
    const heure = normalizeHeure(row.heure);
    const lieu = normalizeLieu(row.lieu);
    const type = normalizeTypeCigarette(row.type || row['Type cigarette']);
    const besoin = Number(row.besoin ?? 5);
    const satisfaction = Number(row.satisfaction ?? 5);
    const quantite = normalizeQuantite(row.quantite);
    const situation = normalizeSituation(row.situation);
    const commentaire = String(row.commentaire || '');
    const kudzuPris = Boolean(row.kudzu || row.Kudzu || 0);

    const journeeId = await getOrCreateJourneeId(userId, date, typeJournee);

    // Skip duplicates
    if (await cigaretteExists(userId, journeeId, numero, normalizeHeure(row.heure))) {
      continue;
    }

    const score = calculerScore({ besoin, satisfaction, type, quantite });

    const { error: errInsert } = await supabase
      .from('cigarettes')
      .insert({
        user_id: userId,
        journee_id: journeeId,
        numero,
        heure,
        lieu,
        type,
        besoin,
        satisfaction,
        quantite,
        situation,
        commentaire,
        kudzu_pris: kudzuPris,
        score_calcule: score
      });
    if (errInsert) {
      console.error(`❌ Erreur insertion ${date} #${numero} ${heure}:`, errInsert.message);
    } else {
      cigsInserees++;
      journeesCreees.add(date);
    }
  }

  console.log(`\n✅ Import terminé: ${journeesCreees.size} journées, ${cigsInserees} cigarettes insérées.`);
}

importFromJson().catch(err => {
  console.error('Erreur critique import:', err);
  process.exit(1);
});
