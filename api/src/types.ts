export type TypeJournee = 'travail' | 'teletravail' | 'weekend';
export type LieuCigarette = 'maison' | 'travail' | 'exterieur' | 'voiture' | 'restaurant' | 'chez_quelquun';
export type TypeCigarette = 'besoin' | 'automatique' | 'plaisir';
export type QuantiteCigarette = 'entiere' | '3/4' | '1/2' | '1/4' | 'taffes';
export type SituationCigarette = 'apres_repas' | 'pause' | 'trajet' | 'ennui' | 'stress' | 'social' | 'attente' | 'autre';

export interface Journee {
  id: string;
  date: string;
  typeJournee: TypeJournee;
  createdAt: string;
}

export interface Cigarette {
  id: string;
  journeeId: string;
  numero: number;
  heure: string;
  lieu: LieuCigarette;
  type: TypeCigarette;
  besoin: number;
  satisfaction: number;
  quantite: QuantiteCigarette;
  situation: SituationCigarette;
  commentaire?: string;
  kudzuPris: boolean;
  scoreCalcule: number;
  createdAt: string;
}

export interface Objectif {
  id: string;
  dateDebut: string;
  nombreMax: number;
  actif: boolean;
  createdAt: string;
}
