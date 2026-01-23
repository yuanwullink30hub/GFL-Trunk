/**
 * Storage utilities for localStorage and sessionStorage
 * Provides JSON serialization, TTL support, and error handling
 */

/**
 * Safe localStorage wrapper with JSON support
 */
export const localStorageManager = {
  /**
   * Set item with optional TTL
   * @param {string} key - Storage key
   * @param {any} value - Value to store (auto-serializes objects)
   * @param {number} ttl - Time to live in milliseconds (optional)
   * @returns {boolean} Success
   */
  setItem: (key, value, ttl = null) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
      return false;
    }
  },

  /**
   * Get item with TTL check
   * @param {string} key - Storage key
   * @returns {any} Stored value or null
   */
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check if expired
      if (parsed.ttl && Date.now() > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },

  /**
   * Remove item
   * @param {string} key - Storage key
   * @returns {boolean} Success
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
      return false;
    }
  },

  /**
   * Clear all storage
   * @returns {boolean} Success
   */
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('localStorage.clear failed:', e);
      return false;
    }
  },

  /**
   * Get all keys
   * @returns {Array<string>} Keys
   */
  keys: () => {
    try {
      return Object.keys(localStorage);
    } catch (e) {
      console.warn('localStorage.keys failed:', e);
      return [];
    }
  },

  /**
   * Get storage size
   * @returns {number} Bytes used
   */
  getSize: () => {
    try {
      let size = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
      return size;
    } catch (e) {
      console.warn('localStorage.getSize failed:', e);
      return 0;
    }
  }
};

/**
 * Safe sessionStorage wrapper with JSON support
 */
export const sessionStorageManager = {
  /**
   * Set item
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} Success
   */
  setItem: (key, value) => {
    try {
      const item = {
        value,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
      return false;
    }
  },

  /**
   * Get item
   * @param {string} key - Storage key
   * @returns {any} Stored value or null
   */
  getItem: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      return parsed.value;
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
      return null;
    }
  },

  /**
   * Remove item
   * @param {string} key - Storage key
   * @returns {boolean} Success
   */
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('sessionStorage.removeItem failed:', e);
      return false;
    }
  },

  /**
   * Clear all storage
   * @returns {boolean} Success
   */
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.warn('sessionStorage.clear failed:', e);
      return false;
    }
  }
};

/**
 * In-memory storage (survives page refresh like session storage)
 */
export const memoryStorage = (() => {
  const storage = new Map();

  return {
    setItem: (key, value, ttl = null) => {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null
      };
      storage.set(key, item);
      return true;
    },

    getItem: (key) => {
      const item = storage.get(key);
      if (!item) return null;

      // Check TTL
      if (item.ttl && Date.now() > item.ttl) {
        storage.delete(key);
        return null;
      }

      return item.value;
    },

    removeItem: (key) => {
      storage.delete(key);
      return true;
    },

    clear: () => {
      storage.clear();
      return true;
    },

    keys: () => Array.from(storage.keys()),

    size: () => storage.size
  };
})();

/**
 * IndexedDB wrapper for larger storage needs
 */
export const indexedDBManager = {
  /**
   * Open database
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @returns {Promise<IDBObjectStore>}
   */
  openStore: (dbName, storeName) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readwrite');
        resolve(tx.objectStore(storeName));
      };
    });
  },

  /**
   * Add/update item
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @param {string} key - Item key
   * @param {any} value - Item value
   * @returns {Promise<void>}
   */
  setItem: async (dbName, storeName, key, value) => {
    const store = await indexedDBManager.openStore(dbName, storeName);
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  /**
   * Get item
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @param {string} key - Item key
   * @returns {Promise<any>}
   */
  getItem: async (dbName, storeName, key) => {
    const store = await indexedDBManager.openStore(dbName, storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }
};
