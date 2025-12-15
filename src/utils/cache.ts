// Système de cache pour les données fréquemment accédées

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

class DataCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL = 60000; // 1 minute

  constructor() {
    this.cache = new Map();
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Vérifier si le cache est expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const dataCache = new DataCache();

// Helpers pour les clés de cache
export const CacheKeys = {
  journee: (date: string) => `journee:${date}`,
  cigarettes: (journeeId: string) => `cigarettes:${journeeId}`,
  objectif: () => 'objectif:current',
  analyses: (periode: string) => `analyses:${periode}`,
  stats: (date: string) => `stats:${date}`
};
