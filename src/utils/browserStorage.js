const databaseName = "afghan-power-browser-data";
const databaseVersion = 1;
const storeName = "collections";
const localStoragePrefix = "afghan-power-collection:";

let databasePromise;

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  if (!hasIndexedDb()) {
    return Promise.resolve(null);
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "name" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

function runStore(mode, action) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        if (!database) {
          resolve(undefined);
          return;
        }

        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = action(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

function readLocalStorageCollection(name) {
  try {
    const raw = window.localStorage.getItem(`${localStoragePrefix}${name}`);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeLocalStorageCollection(name, items) {
  window.localStorage.setItem(
    `${localStoragePrefix}${name}`,
    JSON.stringify(items)
  );
}

export async function readBrowserCollection(name) {
  if (!hasIndexedDb()) {
    return readLocalStorageCollection(name);
  }

  const record = await runStore("readonly", (store) => store.get(name));
  const data = Array.isArray(record?.items) ? record.items : [];

  if (!record) {
    await writeBrowserCollection(name, data);
  }

  return data;
}

export async function writeBrowserCollection(name, items) {
  if (!Array.isArray(items)) {
    throw new Error("Collection payload must be an array.");
  }

  if (!hasIndexedDb()) {
    writeLocalStorageCollection(name, items);
    return items;
  }

  await runStore("readwrite", (store) =>
    store.put({
      name,
      items,
      updatedAt: new Date().toISOString(),
    })
  );

  return items;
}

export async function listBrowserCollectionNames() {
  if (!hasIndexedDb()) {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(localStoragePrefix))
      .map((key) => key.slice(localStoragePrefix.length));
  }

  const keys = await runStore("readonly", (store) => store.getAllKeys());
  return Array.isArray(keys) ? keys.map(String) : [];
}
