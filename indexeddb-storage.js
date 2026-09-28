/* BillSync IndexedDB storage adapter
 * Local-first, no accounts or servers required.
 * Preserves the existing window.storage Promise API and migrates existing
 * billsync:* localStorage records into IndexedDB the first time it runs.
 */
(() => {
  "use strict";

  const DB_NAME = "BillSync";
  const DB_VERSION = 1;
  const STORE_NAME = "keyValue";
  const PREFIX = "billsync:";
  const MIGRATION_KEY = "__migration_localstorage_v1__";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to open BillSync database"));
      request.onblocked = () => reject(new Error("BillSync database upgrade is blocked by another open tab"));
    });
  }

  async function withStore(mode, operation) {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result;
        try {
          result = operation(store, resolve, reject);
        } catch (error) {
          reject(error);
        }
        tx.onerror = () => reject(tx.error || new Error("BillSync database transaction failed"));
        tx.onabort = () => reject(tx.error || new Error("BillSync database transaction was aborted"));
        if (result !== undefined) tx.oncomplete = () => resolve(result);
      });
    } finally {
      db.close();
    }
  }

  function getRecord(key) {
    return withStore("readonly", (store, resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function putRecord(key, value) {
    return withStore("readwrite", (store, resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date().toISOString() });
      request.onsuccess = () => resolve({ key, value });
      request.onerror = () => reject(request.error);
    });
  }

  function deleteRecord(key) {
    return withStore("readwrite", (store, resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve({ key, deleted: true });
      request.onerror = () => reject(request.error);
    });
  }

  function listRecords(prefix) {
    return withStore("readonly", (store, resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = request.result.filter((key) => typeof key === "string" && (!prefix || key.startsWith(prefix)));
        resolve({ keys });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function migrateLocalStorageOnce() {
    const migrated = await getRecord(MIGRATION_KEY);
    if (migrated) return;

    const records = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const fullKey = localStorage.key(i);
        if (!fullKey || !fullKey.startsWith(PREFIX)) continue;
        const key = fullKey.slice(PREFIX.length);
        const value = localStorage.getItem(fullKey);
        if (value !== null) records.push({ key, value });
      }
    } catch (error) {
      // If localStorage is unavailable, IndexedDB can still be used normally.
    }

    for (const record of records) {
      const existing = await getRecord(record.key);
      if (!existing) await putRecord(record.key, record.value);
    }

    await putRecord(MIGRATION_KEY, JSON.stringify({
      completedAt: new Date().toISOString(),
      migratedKeys: records.map((record) => record.key)
    }));

    // Deliberately do not erase localStorage during the first migration.
    // It remains a rollback copy while this branch is being tested.
  }

  const ready = migrateLocalStorageOnce();

  window.storage = {
    async get(key) {
      await ready;
      const record = await getRecord(key);
      if (!record) throw new Error("not found");
      return { key, value: record.value };
    },
    async set(key, value) {
      await ready;
      return putRecord(key, value);
    },
    async delete(key) {
      await ready;
      return deleteRecord(key);
    },
    async list(prefix) {
      await ready;
      return listRecords(prefix);
    },
    ready: () => ready,
    databaseName: DB_NAME
  };
})();
