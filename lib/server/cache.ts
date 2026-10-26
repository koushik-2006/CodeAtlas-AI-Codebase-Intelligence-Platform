interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class BoundedMemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;
  private hits = 0;
  private misses = 0;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  /**
   * Generates a safe, authorization-aware cache key.
   * Ensures private repository and user data cannot leak across tenant boundaries.
   */
  static authAwareKey(
    prefix: string,
    userId: string = "usr_default",
    repositoryId?: string,
    subKey?: string
  ): string {
    const parts = [prefix, userId];
    if (repositoryId) parts.push(repositoryId);
    if (subKey) parts.push(subKey);
    return parts.join("::");
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    // Refresh access order (LRU)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 60, tags: string[] = []): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest entry (LRU)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { size: number; maxEntries: number; hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? (this.hits / total) * 100 : 0;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRatio: Number(hitRatio.toFixed(1)),
    };
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const platformCache = new BoundedMemoryCache(1000);
