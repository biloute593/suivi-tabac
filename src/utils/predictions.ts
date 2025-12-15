// Analyse prédictive et détection de patterns
import type { Cigarette } from '../types';
import { getHours, getDay, differenceInMinutes } from 'date-fns';

export interface RiskPeriod {
  heure: number;
  jour: number;
  risque: number; // 0-100
  raison: string;
}

export interface Prediction {
  prochaineCigaretteProbable: Date | null;
  confiance: number; // 0-100
  momentsARisque: RiskPeriod[];
  recommandations: string[];
}

/**
 * Analyse les patterns de consommation et prédit les moments à risque
 */
export function analyserPatterns(cigarettes: Cigarette[]): Prediction {
  if (cigarettes.length < 10) {
    return {
      prochaineCigaretteProbable: null,
      confiance: 0,
      momentsARisque: [],
      recommandations: ['Enregistre plus de données pour des prédictions précises']
    };
  }

  // Analyser les intervalles entre cigarettes
  const intervalles: number[] = [];
  const cigarettesTri = [...cigarettes].sort((a, b) => 
    new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
  );

  for (let i = 1; i < cigarettesTri.length; i++) {
    const prev = new Date(cigarettesTri[i - 1].createdAt || '');
    const curr = new Date(cigarettesTri[i].createdAt || '');
    const diff = differenceInMinutes(curr, prev);
    if (diff > 0 && diff < 600) { // Ignorer les intervalles > 10h
      intervalles.push(diff);
    }
  }

  // Calculer l'intervalle moyen
  const intervalleMoyen = intervalles.length > 0
    ? intervalles.reduce((a, b) => a + b, 0) / intervalles.length
    : 120;

  // Prédire la prochaine cigarette
  const derniereCig = cigarettesTri[cigarettesTri.length - 1];
  const derniereDate = new Date(derniereCig.createdAt || '');
  const prochaineCigaretteProbable = new Date(derniereDate.getTime() + intervalleMoyen * 60000);

  // Analyser les moments à risque par heure et jour
  const heatmap: Record<string, number> = {};
  
  cigarettes.forEach(cig => {
    const date = new Date(cig.createdAt || '');
    const heure = getHours(date);
    const jour = getDay(date);
    const key = `${jour}-${heure}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  // Identifier les moments à risque (top 10)
  const momentsARisque: RiskPeriod[] = Object.entries(heatmap)
    .map(([key, count]) => {
      const [jour, heure] = key.split('-').map(Number);
      const risque = Math.min((count / cigarettes.length) * 1000, 100);
      return {
        jour,
        heure,
        risque,
        raison: getRaisonRisque(heure, count)
      };
    })
    .sort((a, b) => b.risque - a.risque)
    .slice(0, 10);

  // Générer des recommandations
  const recommandations = genererRecommandations(momentsARisque, cigarettes);

  // Calculer la confiance basée sur la quantité de données
  const confiance = Math.min((cigarettes.length / 100) * 100, 95);

  return {
    prochaineCigaretteProbable,
    confiance,
    momentsARisque,
    recommandations
  };
}

function getRaisonRisque(heure: number, count: number): string {
  if (heure >= 6 && heure < 9) return `Réveil - ${count} fois`;
  if (heure >= 9 && heure < 12) return `Matinée - ${count} fois`;
  if (heure >= 12 && heure < 14) return `Après repas - ${count} fois`;
  if (heure >= 14 && heure < 17) return `Après-midi - ${count} fois`;
  if (heure >= 17 && heure < 20) return `Fin de journée - ${count} fois`;
  if (heure >= 20 && heure < 23) return `Soirée - ${count} fois`;
  return `Nuit - ${count} fois`;
}

function genererRecommandations(momentsARisque: RiskPeriod[], cigarettes: Cigarette[]): string[] {
  const recs: string[] = [];

  // Recommandations basées sur les moments à risque
  const topRisque = momentsARisque[0];
  if (topRisque) {
    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    recs.push(`⚠️ ${joursNoms[topRisque.jour]} vers ${topRisque.heure}h est ton moment le plus critique`);
  }

  // Recommandations basées sur les situations
  const situations = cigarettes.reduce((acc, cig) => {
    acc[cig.situation] = (acc[cig.situation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSituation = Object.entries(situations).sort((a, b) => b[1] - a[1])[0];
  if (topSituation && topSituation[1] > cigarettes.length * 0.3) {
    recs.push(`💡 Évite les situations "${topSituation[0]}" - représentent ${Math.round(topSituation[1] / cigarettes.length * 100)}% de ta consommation`);
  }

  // Recommandations basées sur les lieux
  const lieux = cigarettes.reduce((acc, cig) => {
    acc[cig.lieu] = (acc[cig.lieu] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLieu = Object.entries(lieux).sort((a, b) => b[1] - a[1])[0];
  if (topLieu && topLieu[1] > cigarettes.length * 0.4) {
    recs.push(`🏠 Le lieu "${topLieu[0]}" est ton environnement le plus tentant`);
  }

  // Recommandations générales
  if (cigarettes.length > 50) {
    recs.push('✅ Continue à enregistrer - tes patterns deviennent plus clairs');
  }

  return recs.slice(0, 5);
}

/**
 * Calcule le score de dépendance basé sur les patterns
 */
export function calculerScoreDependance(cigarettes: Cigarette[]): {
  score: number;
  niveau: 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
  facteurs: string[];
} {
  if (cigarettes.length === 0) {
    return { score: 0, niveau: 'Faible', facteurs: [] };
  }

  let score = 0;
  const facteurs: string[] = [];

  // Facteur 1: Nombre quotidien moyen
  const joursUniques = new Set(cigarettes.map(c => c.journeeId)).size;
  const moyenneJour = cigarettes.length / Math.max(joursUniques, 1);
  
  if (moyenneJour > 20) {
    score += 30;
    facteurs.push('Plus de 20 cigarettes/jour');
  } else if (moyenneJour > 15) {
    score += 20;
    facteurs.push('15-20 cigarettes/jour');
  } else if (moyenneJour > 10) {
    score += 15;
    facteurs.push('10-15 cigarettes/jour');
  }

  // Facteur 2: Cigarettes matinales (forte dépendance)
  const cigarettesMatinales = cigarettes.filter(c => {
    const heure = parseInt(c.heure.split(':')[0]);
    return heure >= 6 && heure < 9;
  });
  
  if (cigarettesMatinales.length > cigarettes.length * 0.2) {
    score += 25;
    facteurs.push('Beaucoup de cigarettes matinales');
  }

  // Facteur 3: Régularité (intervalles courts)
  const cigarettesTri = [...cigarettes].sort((a, b) => 
    new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
  );
  
  let intervallesCourts = 0;
  for (let i = 1; i < cigarettesTri.length; i++) {
    const diff = differenceInMinutes(
      new Date(cigarettesTri[i].createdAt || ''),
      new Date(cigarettesTri[i - 1].createdAt || '')
    );
    if (diff < 30) intervallesCourts++;
  }
  
  if (intervallesCourts > cigarettes.length * 0.3) {
    score += 25;
    facteurs.push('Intervalles courts entre cigarettes');
  }

  // Facteur 4: Score évitabilité bas
  const scoreMoyen = cigarettes.reduce((sum, c) => sum + c.scoreCalcule, 0) / cigarettes.length;
  if (scoreMoyen < 10) {
    score += 20;
    facteurs.push('Beaucoup de cigarettes inévitables');
  }

  // Déterminer le niveau
  let niveau: 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
  if (score < 30) niveau = 'Faible';
  else if (score < 50) niveau = 'Modéré';
  else if (score < 75) niveau = 'Élevé';
  else niveau = 'Très élevé';

  return { score: Math.min(score, 100), niveau, facteurs };
}
