/**
 * Gestion du contexte utilisateur avec authentification via API Azure
 */

import { apiService } from '../services/api';

const STORAGE_KEY = 'suivi-tabac-current-user';

export interface CurrentUser {
  userId: string;
  pseudo: string;
  objectifGlobal: number;
  sharePublic: boolean;
}

export interface UserAccount {
  userId: string;
  pseudo: string;
  passwordHash: string;
  objectifGlobal: number;
  sharePublic: boolean;
  createdAt: string;
}

/**
 * Crée un nouveau compte utilisateur via l'API
 */
export async function createAccount(pseudo: string, password: string, objectifGlobal: number = 12): Promise<CurrentUser> {
  try {
    const userData = await apiService.register(pseudo, password, objectifGlobal);

    const currentUser: CurrentUser = {
      userId: userData.userId,
      pseudo: userData.pseudo,
      objectifGlobal: userData.objectifGlobal,
      sharePublic: userData.sharePublic
    };

    return currentUser;
  } catch (error: any) {
    throw new Error(error.message || 'Erreur lors de la création du compte');
  }
}

/**
 * Authentifie un utilisateur avec pseudo et mot de passe via l'API
 */
export async function login(pseudo: string, password: string): Promise<CurrentUser | null> {
  try {
    const userData = await apiService.login(pseudo, password);

    const currentUser: CurrentUser = {
      userId: userData.userId,
      pseudo: userData.pseudo,
      objectifGlobal: userData.objectifGlobal,
      sharePublic: userData.sharePublic
    };

    return currentUser;
  } catch (error) {
    return null;
  }
}

/**
 * Récupère l'utilisateur actuel depuis le localStorage
 */
export function getCurrentUser(): CurrentUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  // Pas de fallback automatique - chaque utilisateur doit créer son compte
  return null;
}

/**
 * Définit l'utilisateur actuel
 */
export function setCurrentUser(user: CurrentUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Déconnecte l'utilisateur actuel
 */
export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Met à jour le mot de passe d'un utilisateur (à implémenter avec l'API si nécessaire)
 */
export async function updatePassword(_userId: string, _newPassword: string): Promise<void> {
  // TODO: Implémenter avec l'API si nécessaire
  throw new Error('Fonction non implémentée');
}

/**
 * Met à jour les paramètres du profil (à implémenter avec l'API si nécessaire)
 */
export function updateUserProfile(userId: string, updates: { objectifGlobal?: number; sharePublic?: boolean }): void {
  // TODO: Implémenter avec l'API si nécessaire
  const user = getCurrentUser();
  if (user && user.userId === userId) {
    if (updates.objectifGlobal !== undefined) {
      user.objectifGlobal = updates.objectifGlobal;
    }
    if (updates.sharePublic !== undefined) {
      user.sharePublic = updates.sharePublic;
    }
    setCurrentUser(user);
  }
}

/**
 * Vérifie s'il existe des données sans userId (migration nécessaire)
 */
export function hasLegacyData(): boolean {
  // Vérifier dans localStorage s'il y a des anciennes données
  const oldProfiles = localStorage.getItem('suivi-tabac-all-profiles');
  return oldProfiles !== null;
}

/**
 * Crée le profil Lydie avec mot de passe pour les données existantes
 */
export async function createLydieProfileForLegacyData(password: string): Promise<CurrentUser> {
  // Pour la migration de Lydie, on crée juste un compte normal avec le pseudo "Lydie"
  return createAccount('Lydie', password, 12);
}

// Fonction stub pour la compatibilité
export function isPseudoTaken(_pseudo: string): boolean {
  // Cette vérification sera faite par l'API lors de l'inscription
  return false;
}
