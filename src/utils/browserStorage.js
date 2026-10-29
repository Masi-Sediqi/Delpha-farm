import { IS_PRODUCTION } from "../config/appConfig";

const databaseName = IS_PRODUCTION
  ? "afghan-power-browser-data-production"
  : "afghan-power-browser-data";
const databaseVersion = 1;
const storeName = "collections";
const localStoragePrefix = IS_PRODUCTION
  ? "afghan-power-production-collection:"
  : "afghan-power-collection:";
const browserStorageOnly = import.meta.env.VITE_USE_BROWSER_STORAGE !== "false";
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

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked by another tab."));
  }).catch((error) => { databasePromise = null; throw error; });

  return databasePromise;
}

function runStore(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    if (!database) { resolve(undefined); return; }
    let result;
    const transaction = database.transaction(storeName, mode);
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
    try {
      const request = action(transaction.objectStore(storeName));
      request.onsuccess = () => { result = request.result; };
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  }));
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

export async function readBrowserCollection(name, { updateRevision = true } = {}) {
  const localRecord = browserStorageOnly && hasIndexedDb()
    ? await runStore("readonly", (store) => store.get(name))
    : null;
  const localData = browserStorageOnly && hasIndexedDb()
    ? (Array.isArray(localRecord?.items) ? localRecord.items : [])
    : browserStorageOnly ? readLocalStorageCollection(name) : [];

  if (browserStorageOnly) {
    // Recover earlier localStorage-only installations without replacing existing IndexedDB data.
    if (hasIndexedDb() && !localRecord) {
      const legacy = readLocalStorageCollection(name);
      if (legacy.length) {
        await writeLocalCache(name, legacy);
        return legacy;
      }
    }
    return localData;
  }

  const response = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    headers: {},
  });
  if (response.status === 304) return localData;
  if (response.status === 404) {
    // Never silently migrate local data into an empty server database.
    if (updateRevision) collectionRevisions.set(name, "0");
    return [];
  }
  if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
  const record = await response.json();
  if (updateRevision && record.revision != null) collectionRevisions.set(name, String(record.revision));
  const data = Array.isArray(record.items) ? record.items : [];
  if (browserStorageOnly) await writeLocalCache(name, data);
  return data;
}

// Record-level three-way merge. Never overwrite a server-side change to the same ID.
function mergeIndependentChanges(previous, proposed, latest) {
  const valid = (rows) => rows.every((row) => row && typeof row === "object" && row.id != null);
  if (![previous, proposed, latest].every(Array.isArray) ||
      ![previous, proposed, latest].every(valid)) return null;
  const index = (rows) => new Map(rows.map((row) => [String(row.id), row]));
  const before = index(previous), after = index(proposed), server = index(latest);
  if (before.size !== previous.length || after.size !== proposed.length || server.size !== latest.length) return null;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const keys = new Set([...before.keys(), ...after.keys()]);
  const changed = [...keys].filter((id) => !same(before.get(id), after.get(id)));
  for (const id of changed) {
    if (!same(before.get(id), server.get(id))) return null;
  }
  const result = new Map(server);
  for (const id of changed) {
    if (after.has(id)) result.set(id, after.get(id));
    else result.delete(id);
  }
  // Preserve the user's desired ordering for their modified records.
  return [...result.values()];
}

export async function writeBrowserCollection(name, items, previousItems = null) {
  if (!Array.isArray(items)) throw new Error("Collection payload must be an array.");
  if (browserStorageOnly) {
    await writeLocalCache(name, items);
    return items;
  }
  const revision = collectionRevisions.get(name);
  if (revision == null) throw new Error(`Collection ${name} was not loaded from the server.`);

  const put = (payload, version) => fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": `"${version}"` },
    body: JSON.stringify({ items: payload }),
  });
  let response = await put(items, revision);
  if (response.status === 409) {
    // Refresh the conflict snapshot without publishing or changing revisions while in flight.
    const get = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, { cache: "no-store" });
    let latest, nextRevision;
    if (get.status === 404) { latest = []; nextRevision = "0"; }
    else if (get.ok) {
      const data = await get.json();
      latest = data.items;
      nextRevision = String(data.revision);
    } else throw new Error(`Cannot load current ${name}: HTTP ${get.status}`);
    // On conflict, only merge non-overlapping record changes. Never force-overwrite.
    const merged = mergeIndependentChanges(previousItems, items, latest);
    if (!merged) {
      throw new Error(`Conflict in ${name}: the same record changed on the server. Reload to review changes.`);
    }
    response = await put(merged, nextRevision);
    if (response.status === 409) throw new Error(`Concurrent update to ${name}; please retry after reloading.`);
  }
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error || `Backend returned HTTP ${response.status} for ${name}.`);
  }
  const record = await response.json();
  if (record.revision != null) collectionRevisions.set(name, String(record.revision));
  return Array.isArray(record.items) ? record.items : items;
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

// Commit the entire Access import together, preserving unrelated existing records.
export async function mergeBrowserCollections(collections) {
  const entries = Object.entries(collections);
  if (!entries.length || entries.some(([, items]) => !Array.isArray(items))) throw new Error("Invalid Access collections.");
  const merged = await Promise.all(entries.map(async ([name, items]) => {
    const current = await readBrowserCollection(name);
    const byId = new Map(current.map((item) => [String(item.id), item]));
    for (const item of items) {
      if (item.id == null) throw new Error("Access record is missing its identifier.");
      byId.set(String(item.id), { ...byId.get(String(item.id)), ...item });
    }
    return [name, [...byId.values()]];
  }));
  const database = await openDatabase();
  if (!database) throw new Error("IndexedDB is required to safely import Access data.");
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Access import failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Access import cancelled."));
    const store = transaction.objectStore(storeName);
    for (const [name, items] of merged) store.put({ name, items, updatedAt: new Date().toISOString() });
  });
}
