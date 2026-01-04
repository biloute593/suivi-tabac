/**
 * scripts/migrate-json-to-supabase.mjs
 * Usage: node scripts/migrate-json-to-supabase.mjs
 *
 * Ce script lit le fichier `suivi-tabac-backup-2025-12-10.json` à la racine
 * et insère les données dans Supabase en utilisant SUPABASE_SERVICE_ROLE_KEY.
 * Il évite les doublons en vérifiant (user_id + date + heure + lieu).
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PSEUDO_LYDIE = process.env.PSEUDO_LYDIE || 'LYDIE';
const BACKUP_FILE = process.env.BACKUP_FILE || 'suivi-tabac-backup-2025-12-10.json';

if (!SUPA_URL || !SUPA_SERVICE_KEY) {
  console.error('Il manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans les secrets.');
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_SERVICE_KEY);

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return ('' + dateStr).slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

async function getOrCreateLydie() {
  const { data, error } = await supa
    .from('users')
    .select('id,pseudo')
    .eq('pseudo', PSEUDO_LYDIE)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: inserted, error: e2 } = await supa
    .from('users')
    .insert({ pseudo: PSEUDO_LYDIE, objectif_global: 12 })
    .select('id,pseudo')
    .single();
  if (e2) throw e2;
  return inserted;
}

async function upsertJournee(userId, date, type = 'normal', objectif = 12) {
  const { data: exists } = await supa
    .from('journees')
    .select('id,date')
    .eq('user_id', userId)
    .eq('date', date)
    .limit(1);

  if (exists && exists.length) return exists[0].id;

  const { data: ins, error } = await supa
    .from('journees')
    .insert({ user_id: userId, date, type_journee: type, objectif })
    .select('id')
    .single();
  if (error) throw error;
  return ins.id;
}

async function cigaretteExists(userId, date, heure, lieu) {
  const { data } = await supa
    .from('cigarettes')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('heure', heure)
    .eq('lieu', lieu || '')
    .limit(1);
  return data && data.length > 0;
}

async function insertCigarette(payload) {
  const { error } = await supa.from('cigarettes').insert(payload);
  return error;
}

async function run() {
  try {
    const backupPath = path.resolve(process.cwd(), BACKUP_FILE);
    if (!fs.existsSync(backupPath)) {
      console.error('Fichier de backup introuvable:', backupPath);
      process.exit(2);
    }
    const raw = fs.readFileSync(backupPath, 'utf8');
    const json = JSON.parse(raw);

    const journees = json.journees || json.days || json.journees_backup || [];
    const cigarettes = json.cigarettes || json.cigs || json.entries || [];

    console.log(`Backup chargé: ${journees.length} journées, ${cigarettes.length} cigarettes`);

    const lydie = await getOrCreateLydie();
    console.log('Utilisateur LYDIE (Supabase):', lydie.id);

    const mappedDates = new Set();
    const journeeIdByDate = {};

    for (const j of journees) {
      const date = normalizeDate(j.date || j.day || j.date_journee);
      if (!date) continue;
      if (mappedDates.has(date)) continue;
      const id = await upsertJournee(lydie.id, date, j.type || j.type_journee || 'normal', j.objectif || 12);
      mappedDates.add(date);
      journeeIdByDate[date] = id;
      console.log('Journée ok', date, id);
    }

    let inserted = 0;
    const skipped = [];

    for (const c of cigarettes) {
      const date = normalizeDate(c.date || c.day);
      if (!date) continue;
      const heure = c.heure || c.time || '00:00';
      const lieu = c.lieu || c.place || (c.location ? c.location : '');
      let journee_id = journeeIdByDate[date];
      if (!journee_id) {
        journee_id = await upsertJournee(lydie.id, date, c.type || 'normal', 12);
        journeeIdByDate[date] = journee_id;
      }
      const exists = await cigaretteExists(lydie.id, date, heure, lieu);
      if (exists) {
        skipped.push({ date, heure, lieu });
        continue;
      }
      const payload = {
        user_id: lydie.id,
        journee_id,
        date,
        heure,
        lieu,
        type: c.type || c.type_journee || 'automatique',
        besoin: c.besoin || c.need || null,
        satisfaction: c.satisfaction || c.score || null,
        quantite: c.quantite || c.quantity || 1,
        situation: c.situation || c.context || '',
        commentaire: c.commentaire || c.comment || ''
      };
      const err = await insertCigarette(payload);
      if (err) {
        console.error('Erreur insert cigarette', payload.date, payload.heure, err);
      } else {
        inserted++;
        if (inserted % 20 === 0) console.log(`${inserted} cigarettes insérées...`);
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      user: lydie.id,
      inserted,
      skippedCount: skipped.length,
      skippedSample: skipped.slice(0, 20)
    };
    fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
    console.log('Migration terminée. Report écrit dans migration-report.json');
    process.exit(0);
  } catch (err) {
    console.error('Erreur migration:', err);
    process.exit(1);
  }
}

run();
