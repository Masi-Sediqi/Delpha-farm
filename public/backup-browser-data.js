/* Phase 1, read-only backup. Paste the entire script into DevTools Console on your application's origin.
   No database is deleted or modified. Keep the resulting JSON file private. */
(async () => {
  const databases = ['afghan-power-browser-data-production', 'afghan-power-browser-data'];
  const result = { format: 'apg-browser-backup-v1', exportedAt: new Date().toISOString(), origin: location.origin, databases: {}, localStorage: {} };
  async function readDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      let wasCreated = false;
      request.onupgradeneeded = () => { wasCreated = true; request.transaction.abort(); };
      request.onerror = () => wasCreated ? resolve(null) : reject(request.error);
      request.onsuccess = async () => {
        const db = request.result;
        try {
          const stores = [...db.objectStoreNames];
          const contents = {};
          for (const storeName of stores) {
            contents[storeName] = await new Promise((res, rej) => {
              const tx = db.transaction(storeName, 'readonly');
              const req = tx.objectStore(storeName).getAll();
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            });
          }
          resolve({ version: db.version, stores: contents });
        } catch (error) { reject(error); } finally { db.close(); }
      };
    });
  }
  try {
    for (const name of databases) {
      const contents = await readDatabase(name);
      if (contents) result.databases[name] = contents;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/^afghan-power-(production-)?collection:/.test(key)) {
        result.localStorage[key] = localStorage.getItem(key);
      }
    }
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `apg-browser-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const counts = Object.fromEntries(Object.entries(result.databases).map(([name, db]) => [name, Object.fromEntries(Object.entries(db.stores).map(([store, rows]) => [store, rows.length]))]));
    console.info('Read-only browser backup created:', { counts, legacyKeys: Object.keys(result.localStorage).length, bytes: blob.size });
  } catch (error) { console.error('Backup failed. No data was modified.', error); }
})();
