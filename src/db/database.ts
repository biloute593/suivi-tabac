import { apiService } from '../services/api';
import type { Journee, Cigarette, Objectif, JournalNote } from '../types';
import { getCurrentUser } from '../utils/userContext';

/**
 * Base de données utilisant Cosmos DB via Azure Functions
 * pour la synchronisation entre tous les appareils.
 * Filtrage automatique par userId pour l'isolation des données.
 */

// Types pour les opérations d'ajout (userId sera ajouté automatiquement)
type JourneeInput = Omit<Journee, 'id' | 'userId'>;
type CigaretteInput = Omit<Cigarette, 'id' | 'userId'>;
type ObjectifInput = Omit<Objectif, 'id' | 'userId'>;
type JournalNoteInput = Omit<JournalNote, 'id' | 'userId'>;

// Helper pour filtrer par userId
function filterByCurrentUser<T extends { userId?: string }>(items: T[]): T[] {
  const user = getCurrentUser();
  if (!user) return [];
  return items.filter(item => item.userId === user.userId);
}

// Journées
const journees = {
  async toArray(): Promise<Journee[]> {
    const data = await apiService.getJournees();
    return filterByCurrentUser(data as Journee[]);
  },

  where(field: string) {
    return {
      equals: (value: any) => ({
        first: async (): Promise<Journee | null> => {
          const all = await apiService.getJournees();
          const filtered = filterByCurrentUser(all as Journee[]).filter((j: any) => j[field] === value);
          return (filtered[0] as Journee) || null;
        },
        toArray: async (): Promise<Journee[]> => {
          const all = await apiService.getJournees();
          return filterByCurrentUser(all as Journee[]).filter((j: any) => j[field] === value) as Journee[];
        }
      }),
      between: (start: string, end: string, includeStart = true, includeEnd = true) => ({
        toArray: async (): Promise<Journee[]> => {
          const all = await apiService.getJournees();
          return filterByCurrentUser(all as Journee[]).filter((j: any) => {
            const value = j[field];
            const isAfterStart = includeStart ? value >= start : value > start;
            const isBeforeEnd = includeEnd ? value <= end : value < end;
            return isAfterStart && isBeforeEnd;
          }) as Journee[];
        }
      })
    };
  },

  async add(journee: JourneeInput): Promise<number | string> {
    const user = getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');
    
    const created = await apiService.createJournee({
      userId: user.userId,
      date: journee.date,
      typeJournee: journee.typeJournee,
      objectifNombreMax: journee.objectifNombreMax,
      createdAt: journee.createdAt || new Date().toISOString()
    } as any);
    return created.id;
  },

  async get(id: string | number): Promise<Journee | undefined> {
    const all = await apiService.getJournees();
    return all.find((j: any) => j.id === String(id)) as Journee | undefined;
  },

  async update(id: string | number, data: Partial<Journee>): Promise<number> {
    await apiService.updateJournee(String(id), data as any);
    return 1;
  },

  async delete(id: string | number): Promise<void> {
    await apiService.deleteJournee(String(id));
  },

  async count(): Promise<number> {
    const all = await apiService.getJournees();
    return filterByCurrentUser(all as Journee[]).length;
  },

  async clear(): Promise<void> {
    const all = await apiService.getJournees();
    const userJournees = filterByCurrentUser(all as Journee[]);
    for (const j of userJournees) {
      if (j.id) await apiService.deleteJournee(j.id);
    }
  }
};

// Cigarettes
const cigarettes = {
  async toArray(): Promise<Cigarette[]> {
    const data = await apiService.getCigarettes();
    return filterByCurrentUser(data as Cigarette[]);
  },

  where(field: string) {
    return {
      equals: (value: any) => ({
        toArray: async (): Promise<Cigarette[]> => {
          const all = await apiService.getCigarettes();
          return filterByCurrentUser(all as Cigarette[]).filter((c: any) => c[field] === value) as Cigarette[];
        },
        sortBy: async (sortField: string): Promise<Cigarette[]> => {
          const all = await apiService.getCigarettes();
          const filtered = filterByCurrentUser(all as Cigarette[]).filter((c: any) => c[field] === value);
          return filtered.sort((a: any, b: any) => {
            if (a[sortField] < b[sortField]) return -1;
            if (a[sortField] > b[sortField]) return 1;
            return 0;
          }) as Cigarette[];
        },
        reverse: () => ({
          sortBy: async (sortField: string): Promise<Cigarette[]> => {
            const all = await apiService.getCigarettes();
            const filtered = filterByCurrentUser(all as Cigarette[]).filter((c: any) => c[field] === value);
            return filtered.sort((a: any, b: any) => {
              if (a[sortField] < b[sortField]) return 1;
              if (a[sortField] > b[sortField]) return -1;
              return 0;
            }) as Cigarette[];
          }
        }),
        count: async (): Promise<number> => {
          const all = await apiService.getCigarettes();
          return filterByCurrentUser(all as Cigarette[]).filter((c: any) => c[field] === value).length;
        }
      })
    };
  },

  orderBy(field: string) {
    return {
      toArray: async (): Promise<Cigarette[]> => {
        const all = await apiService.getCigarettes();
        return filterByCurrentUser(all as Cigarette[]).sort((a: any, b: any) => {
          if (a[field] < b[field]) return -1;
          if (a[field] > b[field]) return 1;
          return 0;
        }) as Cigarette[];
      }
    };
  },

  async add(cigarette: CigaretteInput): Promise<number | string> {
    const user = getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');
    
    const created = await apiService.createCigarette({
      userId: user.userId,
      journeeId: cigarette.journeeId,
      numero: cigarette.numero,
      heure: cigarette.heure,
      lieu: cigarette.lieu,
      type: cigarette.type,
      besoin: cigarette.besoin,
      satisfaction: cigarette.satisfaction,
      quantite: cigarette.quantite,
      situation: cigarette.situation,
      commentaire: cigarette.commentaire || '',
      kudzuPris: cigarette.kudzuPris,
      scoreCalcule: cigarette.scoreCalcule,
      createdAt: cigarette.createdAt || new Date().toISOString()
    } as any);
    return created.id;
  },

  async get(id: string | number): Promise<Cigarette | undefined> {
    const all = await apiService.getCigarettes();
    return all.find((c: any) => c.id === String(id)) as Cigarette | undefined;
  },

  async update(id: string | number, data: Partial<Cigarette>): Promise<number> {
    await apiService.updateCigarette(String(id), data as any);
    return 1;
  },

  async delete(id: string | number): Promise<void> {
    await apiService.deleteCigarette(String(id));
  },

  async count(): Promise<number> {
    const all = await apiService.getCigarettes();
    return all.length;
  },

  async clear(): Promise<void> {
    const all = await apiService.getCigarettes();
    for (const c of all) {
      await apiService.deleteCigarette(c.id);
    }
  }
};

// Objectifs
const objectifs = {
  async toArray(): Promise<Objectif[]> {
    const data = await apiService.getObjectifs();
    return filterByCurrentUser(data as Objectif[]);
  },

  where(field: string) {
    return {
      equals: (value: any) => ({
        first: async (): Promise<Objectif | null> => {
          const all = await apiService.getObjectifs();
          const filtered = filterByCurrentUser(all as Objectif[]).filter((o: any) => o[field] === value || (field === 'actif' && o[field] === (value === 1)));
          return (filtered[0] as Objectif) || null;
        }
      })
    };
  },

  async add(objectif: ObjectifInput): Promise<number | string> {
    const user = getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');
    
    const created = await apiService.createObjectif({
      userId: user.userId,
      dateDebut: objectif.dateDebut,
      nombreMax: objectif.nombreMax,
      actif: objectif.actif,
      createdAt: objectif.createdAt || new Date().toISOString()
    } as any);
    return created.id;
  },

  async get(id: string | number): Promise<Objectif | undefined> {
    const all = await apiService.getObjectifs();
    return filterByCurrentUser(all as Objectif[]).find((o: any) => o.id === String(id)) as Objectif | undefined;
  },

  async update(id: string | number, data: Partial<Objectif>): Promise<number> {
    await apiService.updateObjectif(String(id), data as any);
    return 1;
  },

  async count(): Promise<number> {
    const all = await apiService.getObjectifs();
    return filterByCurrentUser(all as Objectif[]).length;
  },

  async clear(): Promise<void> {
    const all = await apiService.getObjectifs();
    const userObjectifs = filterByCurrentUser(all as Objectif[]);
    for (const o of userObjectifs) {
      if (o.id) await apiService.updateObjectif(o.id, { actif: false } as any);
    }
  }
};

// Journal notes
const journalNotes = {
  async toArray(): Promise<JournalNote[]> {
    const data = await apiService.getJournalNotes();
    return filterByCurrentUser(data as JournalNote[]);
  },

  where(field: string) {
    return {
      equals: (value: any) => ({
        first: async (): Promise<JournalNote | null> => {
          const all = await apiService.getJournalNotes();
          const filtered = filterByCurrentUser(all as JournalNote[]).filter((n: any) => n[field] === value);
          return (filtered[0] as JournalNote) || null;
        },
        toArray: async (): Promise<JournalNote[]> => {
          const all = await apiService.getJournalNotes();
          return filterByCurrentUser(all as JournalNote[]).filter((n: any) => n[field] === value) as JournalNote[];
        }
      })
    };
  },

  async add(note: JournalNoteInput): Promise<number | string> {
    const user = getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');
    
    const created = await apiService.createJournalNote({
      userId: user.userId,
      date: note.date,
      contenu: note.contenu,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString()
    } as any);
    return created.id;
  },

  async get(id: string | number): Promise<JournalNote | undefined> {
    const all = await apiService.getJournalNotes();
    return filterByCurrentUser(all as JournalNote[]).find((n: any) => n.id === String(id)) as JournalNote | undefined;
  },

  async update(id: string | number, data: Partial<JournalNote>): Promise<number> {
    await apiService.updateJournalNote(String(id), data as any);
    return 1;
  },

  async delete(id: string | number): Promise<void> {
    await apiService.deleteJournalNote(String(id));
  },

  async count(): Promise<number> {
    const all = await apiService.getJournalNotes();
    return filterByCurrentUser(all as JournalNote[]).length;
  },

  async clear(): Promise<void> {
    const all = await apiService.getJournalNotes();
    const userNotes = filterByCurrentUser(all as JournalNote[]);
    for (const n of userNotes) {
      if (n.id) await apiService.deleteJournalNote(n.id);
    }
  }
};

export const db = {
  journees,
  cigarettes,
  objectifs,
  journalNotes
};

export class SuiviTabacDB {
  journees = journees;
  cigarettes = cigarettes;
  objectifs = objectifs;
  journalNotes = journalNotes;
}
