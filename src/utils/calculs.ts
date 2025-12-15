import type { Cigarette, QuantiteCigarette, TypeCigarette } from '../types';

/**
 * Calcule le score de pertinence d'une cigarette selon la formule :
 * Score = (Besoin × 2) + Satisfaction + Bonus Type
 * Score final = Score × Facteur quantité
 */
export function calculerScore(cigarette: {
  besoin: number;
  satisfaction: number;
  type: TypeCigarette;
  quantite: QuantiteCigarette;
}): number {
  // Score de base : (Besoin × 2) + Satisfaction
  let score = (cigarette.besoin * 2) + cigarette.satisfaction;
  
  // Bonus selon le type
  const bonusType: Record<TypeCigarette, number> = {
    besoin: 5,
    plaisir: 3,
    automatique: 0
  };
  
  score += bonusType[cigarette.type];
  
  // Facteur de quantité
  const facteursQuantite: Record<QuantiteCigarette, number> = {
    entiere: 1.0,
    '3/4': 0.75,
    '1/2': 0.5,
    '1/4': 0.25,
    taffes: 0.1
  };
  
  score *= facteursQuantite[cigarette.quantite];
  
  return Math.round(score);
}

/**
 * Obtient la catégorie d'une cigarette selon son score
 */
export function getCategorieScore(score: number): {
  label: string;
  emoji: string;
  color: string;
  priority: number;
} {
  if (score <= 10) {
    return {
      label: 'À supprimer EN PRIORITÉ',
      emoji: '🔴',
      color: 'red',
      priority: 5
    };
  } else if (score <= 15) {
    return {
      label: 'À supprimer bientôt',
      emoji: '🟠',
      color: 'orange',
      priority: 4
    };
  } else if (score <= 20) {
    return {
      label: 'Cigarettes moyennes',
      emoji: '🟡',
      color: 'yellow',
      priority: 3
    };
  } else if (score <= 25) {
    return {
      label: 'Cigarettes importantes',
      emoji: '🟢',
      color: 'green',
      priority: 2
    };
  } else {
    return {
      label: 'Cigarettes à garder (pour l\'instant)',
      emoji: '💚',
      color: 'emerald',
      priority: 1
    };
  }
}

/**
 * Calcule les cigarettes équivalentes selon la quantité fumée
 */
export function calculerCigarettesEquivalentes(cigarettes: Cigarette[]): number {
  const facteursQuantite: Record<QuantiteCigarette, number> = {
    entiere: 1.0,
    '3/4': 0.75,
    '1/2': 0.5,
    '1/4': 0.25,
    taffes: 0.1
  };
  
  return cigarettes.reduce((total, cig) => {
    return total + facteursQuantite[cig.quantite];
  }, 0);
}

/**
 * Détecte les cigarettes trop rapprochées (< 1h d'intervalle)
 */
export function detecterCigarettesRapprochees(
  cigarettes: Cigarette[],
  seuilMinutes: number = 60
): Array<{
  cig1: Cigarette;
  cig2: Cigarette;
  intervalle: number;
}> {
  const rapprochees: Array<{
    cig1: Cigarette;
    cig2: Cigarette;
    intervalle: number;
  }> = [];
  
  // Trier les cigarettes par heure
  const cigarettesSorted = [...cigarettes].sort((a, b) => {
    return a.heure.localeCompare(b.heure);
  });
  
  for (let i = 1; i < cigarettesSorted.length; i++) {
    const [h1, m1] = cigarettesSorted[i - 1].heure.split(':').map(Number);
    const [h2, m2] = cigarettesSorted[i].heure.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    const diff = minutes2 - minutes1;
    
    if (diff < seuilMinutes && diff > 0) {
      rapprochees.push({
        cig1: cigarettesSorted[i - 1],
        cig2: cigarettesSorted[i],
        intervalle: diff
      });
    }
  }
  
  return rapprochees;
}

/**
 * Calcule le temps écoulé depuis la dernière cigarette
 */
export function tempsDerniereClope(derniereHeure: string): string {
  // Parser l'heure au format "XXhYY" ou "XX:YY"
  const heureParts = derniereHeure.replace('h', ':').split(':');
  const h = parseInt(heureParts[0]) || 0;
  const m = parseInt(heureParts[1]) || 0;
  
  // Vérifier que les valeurs sont valides
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return 'Heure invalide';
  }
  
  const derniere = new Date();
  derniere.setHours(h, m, 0, 0);
  
  const maintenant = new Date();
  const diff = maintenant.getTime() - derniere.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 0) {
    return `Prévue à ${derniereHeure}`;
  } else if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `Il y a ${heures}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
}

/**
 * Formate une durée en minutes en format lisible
 */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${heures}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
}
