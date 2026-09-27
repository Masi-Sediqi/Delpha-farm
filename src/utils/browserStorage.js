import { IS_PRODUCTION } from "../config/appConfig";

const databaseName = IS_PRODUCTION
  ? "afghan-power-browser-data-production"
  : "afghan-power-browser-data";
const databaseVersion = 1;
const storeName = "collections";
const localStoragePrefix = IS_PRODUCTION
  ? "afghan-power-production-collection:"
  : "afghan-power-collection:";
const browserStorageOnly = import.meta.env.VITE_USE_BROWSER_STORAGE === "true";
const apiRoot = import.meta.env.VITE_API_ROOT || (
  typeof window !== "undefined" && window.location.protocol.startsWith("http")
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : "http://127.0.0.1:5000/api"
);

let databasePromise;
const collectionRevisions = new Map();

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
  const localRecord = hasIndexedDb()
    ? await runStore("readonly", (store) => store.get(name))
    : null;
  const localData = hasIndexedDb()
    ? (Array.isArray(localRecord?.items) ? localRecord.items : [])
    : readLocalStorageCollection(name);

  if (browserStorageOnly) return localData;

  const knownRevision = collectionRevisions.get(name);
  const response = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    headers: knownRevision ? { "If-None-Match": `"${knownRevision}"` } : {},
  });
  if (response.status === 304) return localData;
  if (response.status === 404) {
    if (!localData.length) return [];
    return writeBrowserCollection(name, localData);
  }
  if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
  const record = await response.json();
  if (record.revision != null) collectionRevisions.set(name, String(record.revision));
  const data = Array.isArray(record.items) ? record.items : [];
  await writeLocalCache(name, data);
  return data;
}

export async function writeBrowserCollection(name, items) {
  if (!Array.isArray(items)) {
    throw new Error("Collection payload must be an array.");
  }

  if (browserStorageOnly) {
    await writeLocalCache(name, items);
    return items;
  }

  const response = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
  const record = await response.json();
  if (record.revision != null) collectionRevisions.set(name, String(record.revision));
  const savedItems = Array.isArray(record.items) ? record.items : items;
  await writeLocalCache(name, savedItems);
  return savedItems;
}

async function writeLocalCache(name, items) {
  if (!hasIndexedDb()) {
    writeLocalStorageCollection(name, items);
    return;
  }
  await runStore("readwrite", (store) => store.put({
    name,
    items,
    updatedAt: new Date().toISOString(),
  }));
}

export async function listBrowserCollectionNames() {
  if (!browserStorageOnly) {
    const response = await fetch(`${apiRoot}/collections`);
    if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
    const collections = await response.json();
    return Array.isArray(collections) ? collections.map((item) => String(item.name)) : [];
  }
  if (!hasIndexedDb()) {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(localStoragePrefix))
      .map((key) => key.slice(localStoragePrefix.length));
  }

  const keys = await runStore("readonly", (store) => store.getAllKeys());
  return Array.isArray(keys) ? keys.map(String) : [];
}
