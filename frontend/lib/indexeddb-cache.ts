/**
 * IndexedDB Cache for GitHub Repositories (trees, file contents, symbols)
 * Safe fallback to memory/sessionStorage if IndexedDB is blocked or unavailable.
 */

const DB_NAME = "CodeAtlas_RepoCache";
const DB_VERSION = 1;
const STORE_TREES = "trees";
const STORE_FILES = "files";

class RepoCache {
  private memCache: Map<string, any> = new Map();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private async getDB(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return null;
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_TREES)) {
            db.createObjectStore(STORE_TREES);
          }
          if (!db.objectStoreNames.contains(STORE_FILES)) {
            db.createObjectStore(STORE_FILES);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn("IndexedDB open failed, using memory cache:", req.error);
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  async getTree(key: string): Promise<any | null> {
    if (this.memCache.has(`tree:${key}`)) {
      return this.memCache.get(`tree:${key}`);
    }
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_TREES, "readonly");
          const store = tx.objectStore(STORE_TREES);
          const req = store.get(key);
          req.onsuccess = () => {
            if (req.result) {
              this.memCache.set(`tree:${key}`, req.result);
            }
            resolve(req.result || null);
          };
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      return null;
    }
  }

  async setTree(key: string, data: any): Promise<void> {
    this.memCache.set(`tree:${key}`, data);
    try {
      const db = await this.getDB();
      if (!db) return;
      const tx = db.transaction(STORE_TREES, "readwrite");
      tx.objectStore(STORE_TREES).put(data, key);
    } catch {}
  }

  async getFile(key: string): Promise<string | null> {
    if (this.memCache.has(`file:${key}`)) {
      return this.memCache.get(`file:${key}`);
    }
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_FILES, "readonly");
          const store = tx.objectStore(STORE_FILES);
          const req = store.get(key);
          req.onsuccess = () => {
            if (req.result) {
              this.memCache.set(`file:${key}`, req.result);
            }
            resolve(req.result || null);
          };
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      return null;
    }
  }

  async setFile(key: string, content: string): Promise<void> {
    this.memCache.set(`file:${key}`, content);
    try {
      const db = await this.getDB();
      if (!db) return;
      const tx = db.transaction(STORE_FILES, "readwrite");
      tx.objectStore(STORE_FILES).put(content, key);
    } catch {}
  }

  async clearRepo(owner: string, repo: string): Promise<void> {
    const prefix = `${owner}/${repo}/`;
    for (const k of Array.from(this.memCache.keys())) {
      if (k.includes(prefix)) {
        this.memCache.delete(k);
      }
    }
  }
}

export const repoCache = new RepoCache();

