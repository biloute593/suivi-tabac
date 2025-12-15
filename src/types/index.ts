// Types pour l'application de suivi du tabagisme

export type TypeJournee = 'travail' | 'teletravail' | 'weekend' | 'repos';

export type LieuCigarette = 'maison' | 'travail' | 'exterieur' | 'voiture' | 'restaurant' | 'chez_quelquun';

export type TypeCigarette = 'besoin' | 'automatique' | 'plaisir';

export type QuantiteCigarette = 'entiere' | '3/4' | '1/2' | '1/4' | 'taffes';

export type SituationCigarette = 
  | 'apres_repas'
  | 'pause'
  | 'trajet'
  | 'ennui'
  | 'stress'
  | 'social'
  | 'attente'
  | 'reveil'
  | 'avant_repas'
  | 'avant_sortie'
  | 'film'
  | 'telephone'
  | 'voiture'
  | 'autre';

export interface UserProfile {
  id?: string;
  userId: string; // Identifiant unique de l'utilisateur
  nom: string;
  dateInscription: string;
  objectifGlobal: number; // Objectif quotidien par défaut
  sharePublic: boolean; // Partage sur mur public
  createdAt: string;
}

export interface Journee {
  id?: string;
  userId: string; // Identifiant de l'utilisateur
  date: string; // Format ISO: YYYY-MM-DD
  typeJournee: TypeJournee;
  objectifNombreMax?: number; // Objectif du jour (figé à la création)
  createdAt: string;
}

export interface Cigarette {
  id?: string;
  userId: string; // Identifiant de l'utilisateur
  journeeId: string;
  numero: number;
  heure: string; // Format HH:mm
  lieu: LieuCigarette;
  type: TypeCigarette;
  besoin: number; // 1-10
  satisfaction: number; // 1-10
  quantite: QuantiteCigarette;
  situation: SituationCigarette;
  commentaire?: string;
  kudzuPris: boolean;
  scoreCalcule: number;
  createdAt: string;
}

export interface Objectif {
  id?: string;
  userId: string; // Identifiant de l'utilisateur
  dateDebut: string; // Format ISO: YYYY-MM-DD
  nombreMax: number;
  actif: boolean;
  createdAt: string;
}

export interface JournalNote {
  id?: string;
  userId: string; // Identifiant de l'utilisateur
  date: string; // Format ISO: YYYY-MM-DD
  contenu: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StatistiquesJour {
  date: string;
  typeJournee: TypeJournee;
  nombreCigarettes: number;
  cigarettesEquivalentes: number;
  objectif: number;
  reussi: boolean;
}

export interface AnalyseTypeJournee {
  typeJournee: TypeJournee;
  moyenneCigarettes: number;
  evolution: number; // Pourcentage
  nombreJours: number;
}

export interface AnalyseLieu {
  lieu: LieuCigarette;
  nombre: number;
  pourcentage: number;
  scoreMoyen: number;
}

export interface AnalyseType {
  type: TypeCigarette;
  nombre: number;
  pourcentage: number;
  scoreMoyen: number;
}

export interface AnalyseHoraire {
  tranche: string; // "06h-08h"
  nombre: number;
  cigarettes: Cigarette[];
}

export interface CigaretteASupprimer {
  cigarette: Cigarette;
  frequence: number; // Nombre de répétitions
  contexte: string;
  suggestion: string;
}

export interface Recommandation {
  titre: string;
  description: string;
  cigarettesVisees: CigaretteASupprimer[];
  impactEstime: string;
  actionSuggere: string;
}

export const LIEUX_LABELS: Record<LieuCigarette, string> = {
  maison: '🏠 À la maison',
  travail: '🏢 Au travail',
  exterieur: '🚶 En extérieur',
  voiture: '🚗 En voiture',
  restaurant: '🍽️ Restaurant/bar',
  chez_quelquun: '👥 Chez quelqu\'un'
};

export const TYPES_LABELS: Record<TypeCigarette, string> = {
  besoin: '🔴 Besoin',
  automatique: '⚪ Automatique',
  plaisir: '💚 Plaisir'
};

export const QUANTITES_LABELS: Record<QuantiteCigarette, string> = {
  entiere: 'Entière',
  '3/4': '3/4',
  '1/2': '1/2',
  '1/4': '1/4',
  taffes: 'Quelques taffes'
};

export const SITUATIONS_LABELS: Record<SituationCigarette, string> = {
  apres_repas: 'Après repas',
  attente: 'Attente',
  autre: 'Autre',
  avant_repas: 'Avant repas',
  avant_sortie: 'Avant sortie',
  ennui: 'Ennui',
  film: 'Film/Série',
  pause: 'Pause',
  reveil: 'Réveil',
  social: 'Social',
  stress: 'Stress',
  telephone: 'Téléphone',
  trajet: 'Trajet',
  voiture: 'Voiture'
};

export const TYPE_JOURNEE_LABELS: Record<TypeJournee, string> = {
  travail: '🏢 Travail',
  teletravail: '🏠 Télétravail',
  weekend: '🎉 Week-end',
  repos: '🌙 Repos'
};
