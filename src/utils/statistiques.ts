import { db } from '../db/database';
import type { 
  StatistiquesJour,
  AnalyseTypeJournee,
  AnalyseLieu,
  AnalyseType,
  AnalyseHoraire,
  CigaretteASupprimer,
  TypeJournee,
  LieuCigarette,
  TypeCigarette,
  Cigarette
} from '../types';
import { calculerCigarettesEquivalentes } from './calculs';
import { format, subDays } from 'date-fns';

/**
 * Récupère les statistiques pour une journée donnée
 */
export async function getStatistiquesJour(date: string): Promise<StatistiquesJour | null> {
  const journee = await db.journees.where('date').equals(date).first();
  if (!journee) return null;
  
  const cigarettes = await db.cigarettes.where('journeeId').equals(String(journee.id!)).toArray();
  const objectif = await db.objectifs.where('actif').equals(1).first();
  
  const nombreCigarettes = cigarettes.length;
  const cigarettesEquivalentes = calculerCigarettesEquivalentes(cigarettes);
  const objectifNombre = objectif?.nombreMax || 12;
  
  return {
    date,
    typeJournee: journee.typeJournee,
    nombreCigarettes,
    cigarettesEquivalentes,
    objectif: objectifNombre,
    reussi: cigarettesEquivalentes <= objectifNombre
  };
}

/**
 * Récupère les statistiques sur plusieurs jours
 */
export async function getStatistiquesPeriode(nbJours: number = 7): Promise<StatistiquesJour[]> {
  const stats: StatistiquesJour[] = [];
  
  for (let i = nbJours - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const stat = await getStatistiquesJour(date);
    if (stat) {
      stats.push(stat);
    }
  }
  
  return stats;
}

/**
 * Analyse par type de journée
 */
export async function analyseParTypeJournee(): Promise<AnalyseTypeJournee[]> {
  const toutesJournees = await db.journees.toArray();
  const toutesLescigarettes = await db.cigarettes.toArray();
  
  const types: TypeJournee[] = ['travail', 'teletravail', 'weekend'];
  const analyses: AnalyseTypeJournee[] = [];
  
  for (const type of types) {
    const journees = toutesJournees.filter(j => j.typeJournee === type);
    
    if (journees.length === 0) {
      analyses.push({
        typeJournee: type,
        moyenneCigarettes: 0,
        evolution: 0,
        nombreJours: 0
      });
      continue;
    }
    
    // Calculer la moyenne totale
    let totalCigarettes = 0;
    for (const journee of journees) {
      const cigs = toutesLescigarettes.filter(c => String(c.journeeId) === String(journee.id));
      totalCigarettes += calculerCigarettesEquivalentes(cigs);
    }
    const moyenneTotale = totalCigarettes / journees.length;
    
    // Calculer l'évolution (dernière semaine vs semaine d'avant)
    const maintenant = new Date();
    const il7jours = subDays(maintenant, 7);
    const il14jours = subDays(maintenant, 14);
    
    const journeesSemaine1 = journees.filter(j => {
      const date = new Date(j.date);
      return date >= il7jours && date <= maintenant;
    });
    
    const journeesSemaine2 = journees.filter(j => {
      const date = new Date(j.date);
      return date >= il14jours && date < il7jours;
    });
    
    let moyenneSemaine1 = 0;
    if (journeesSemaine1.length > 0) {
      let total1 = 0;
      for (const journee of journeesSemaine1) {
        const cigs = toutesLescigarettes.filter(c => String(c.journeeId) === String(journee.id));
        total1 += calculerCigarettesEquivalentes(cigs);
      }
      moyenneSemaine1 = total1 / journeesSemaine1.length;
    }
    
    let moyenneSemaine2 = 0;
    if (journeesSemaine2.length > 0) {
      let total2 = 0;
      for (const journee of journeesSemaine2) {
        const cigs = toutesLescigarettes.filter(c => String(c.journeeId) === String(journee.id));
        total2 += calculerCigarettesEquivalentes(cigs);
      }
      moyenneSemaine2 = total2 / journeesSemaine2.length;
    }
    
    let evolution = 0;
    if (moyenneSemaine2 > 0) {
      evolution = ((moyenneSemaine1 - moyenneSemaine2) / moyenneSemaine2) * 100;
    }
    
    analyses.push({
      typeJournee: type,
      moyenneCigarettes: Math.round(moyenneTotale * 10) / 10,
      evolution: Math.round(evolution),
      nombreJours: journees.length
    });
  }
  
  return analyses;
}

/**
 * Analyse par lieu
 */
export async function analyseParLieu(): Promise<AnalyseLieu[]> {
  const cigarettes = await db.cigarettes.toArray();
  
  if (cigarettes.length === 0) return [];
  
  const lieux: LieuCigarette[] = ['maison', 'travail', 'exterieur', 'voiture', 'restaurant', 'chez_quelquun'];
  const analyses: AnalyseLieu[] = [];
  
  for (const lieu of lieux) {
    const cigsLieu = cigarettes.filter(c => c.lieu === lieu);
    
    if (cigsLieu.length === 0) continue;
    
    const scoreMoyen = cigsLieu.reduce((sum, c) => sum + c.scoreCalcule, 0) / cigsLieu.length;
    const pourcentage = (cigsLieu.length / cigarettes.length) * 100;
    
    analyses.push({
      lieu,
      nombre: cigsLieu.length,
      pourcentage: Math.round(pourcentage),
      scoreMoyen: Math.round(scoreMoyen)
    });
  }
  
  // Trier par nombre décroissant
  return analyses.sort((a, b) => b.nombre - a.nombre);
}

/**
 * Analyse par type de cigarette
 */
export async function analyseParType(): Promise<AnalyseType[]> {
  const cigarettes = await db.cigarettes.toArray();
  
  if (cigarettes.length === 0) return [];
  
  const types: TypeCigarette[] = ['besoin', 'automatique', 'plaisir'];
  const analyses: AnalyseType[] = [];
  
  for (const type of types) {
    const cigsType = cigarettes.filter(c => c.type === type);
    
    if (cigsType.length === 0) continue;
    
    const scoreMoyen = cigsType.reduce((sum, c) => sum + c.scoreCalcule, 0) / cigsType.length;
    const pourcentage = (cigsType.length / cigarettes.length) * 100;
    
    analyses.push({
      type,
      nombre: cigsType.length,
      pourcentage: Math.round(pourcentage),
      scoreMoyen: Math.round(scoreMoyen)
    });
  }
  
  return analyses;
}

/**
 * Analyse par tranche horaire
 */
export async function analyseParHoraire(): Promise<AnalyseHoraire[]> {
  const cigarettes = await db.cigarettes.toArray();
  
  const tranches = [
    '06h-08h', '08h-10h', '10h-12h', '12h-14h',
    '14h-16h', '16h-18h', '18h-20h', '20h-22h', '22h-00h'
  ];
  
  const analyses: AnalyseHoraire[] = [];
  
  for (const tranche of tranches) {
    const [debut] = tranche.split('-');
    const heureDebut = parseInt(debut);
    const heureFin = heureDebut + 2;
    
    const cigsTranche = cigarettes.filter(c => {
      const [h] = c.heure.split(':').map(Number);
      return h >= heureDebut && h < heureFin;
    });
    
    analyses.push({
      tranche,
      nombre: cigsTranche.length,
      cigarettes: cigsTranche
    });
  }
  
  return analyses;
}

/**
 * Identifie les cigarettes à supprimer en priorité
 */
export async function getCigarettesASupprimer(limite: number = 10): Promise<CigaretteASupprimer[]> {
  const cigarettesTriees = await db.cigarettes
    .orderBy('scoreCalcule')
    .toArray();
  
  // Limiter manuellement à 100
  const cigarettesLimitees = cigarettesTriees.slice(0, 100);
  
  // Grouper par contexte similaire (lieu + situation + heure approximative)
  const groupes = new Map<string, Cigarette[]>();
  
  for (const cig of cigarettesLimitees) {
    const heureArrondie = cig.heure.split(':')[0] + 'h';
    const contexte = `${cig.lieu}-${cig.situation}-${heureArrondie}`;
    
    if (!groupes.has(contexte)) {
      groupes.set(contexte, []);
    }
    groupes.get(contexte)!.push(cig);
  }
  
  // Créer les recommandations
  const recommandations: CigaretteASupprimer[] = [];
  
  for (const [, cigs] of groupes.entries()) {
    if (cigs.length === 0) continue;
    
    const cigRepresentative = cigs[0];
    
    // Génerer une suggestion
    let suggestion = '';
    if (cigRepresentative.type === 'automatique') {
      suggestion = 'Essayez de remplacer par une activité (marche, eau, respiration)';
    } else if (cigRepresentative.situation === 'ennui') {
      suggestion = 'Trouvez une activité pour occuper ce moment';
    } else if (cigRepresentative.situation === 'stress') {
      suggestion = 'Essayez des techniques de relaxation (respiration, méditation)';
    } else if (cigRepresentative.situation === 'trajet') {
      suggestion = 'Écoutez un podcast ou de la musique pendant le trajet';
    } else {
      suggestion = 'Retardez de 15 minutes cette cigarette';
    }
    
    recommandations.push({
      cigarette: cigRepresentative,
      frequence: cigs.length,
      contexte: `${cigRepresentative.lieu} - ${cigRepresentative.situation} vers ${cigRepresentative.heure}`,
      suggestion
    });
  }
  
  // Trier par score croissant et fréquence décroissante
  return recommandations
    .sort((a, b) => {
      const scoreDiff = a.cigarette.scoreCalcule - b.cigarette.scoreCalcule;
      if (scoreDiff !== 0) return scoreDiff;
      return b.frequence - a.frequence;
    })
    .slice(0, limite);
}
