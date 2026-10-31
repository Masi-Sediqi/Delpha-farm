// Central PostgreSQL-only collection transport. No IndexedDB or LocalStorage writes.
const apiRoot = import.meta.env.VITE_API_ROOT || "/api";
const collectionRevisions = new Map();

export async function readBrowserCollection(name, { updateRevision = true } = {}) {
  const response = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    credentials: "include", cache: "no-store", headers: { "Cache-Control": "no-cache" },
  });
  if (response.status === 304) throw new Error(`Unexpected cached response for ${name}.`);
  if (response.status === 404) {
    if (updateRevision) collectionRevisions.set(name, "0");
    return [];
  }
  if (!response.ok) throw new Error(`Central PostgreSQL API returned HTTP ${response.status} for ${name}.`);
  const record = await response.json();
  if (!Array.isArray(record.items)) throw new Error(`Invalid central data for ${name}.`);
  if (updateRevision && record.revision != null) collectionRevisions.set(name, String(record.revision));
  return record.items;
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
  const revision = collectionRevisions.get(name);
  if (revision == null) throw new Error(`Collection ${name} was not loaded from the server.`);

  const put = (payload, version) => fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
    method: "PUT", credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "If-Match": `"${version}"` },
    body: JSON.stringify({ items: payload }),
  });
  let payload = items;
  let version = revision;
  // A changed server revision is normal with multiple tabs/users. Rebase the
  // original user action, never overwrite another user's edit to the same ID.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await put(payload, version);
    if (response.ok) {
      const record = await response.json();
      if (record.revision != null) collectionRevisions.set(name, String(record.revision));
      return Array.isArray(record.items) ? record.items : payload;
    }
    if (response.status !== 409) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details.error || `Backend returned HTTP ${response.status} for ${name}.`);
    }
    const get = await fetch(`${apiRoot}/collections/${encodeURIComponent(name)}`, {
      cache: "no-store", credentials: "include", headers: { "Cache-Control": "no-cache" },
    });
    let latest, nextRevision;
    if (get.status === 404) { latest = []; nextRevision = "0"; }
    else if (get.ok) {
      const data = await get.json();
      latest = data.items;
      nextRevision = String(data.revision);
    } else throw new Error(`Cannot load current ${name}: HTTP ${get.status}`);
    if (!Array.isArray(latest) || !/^\d+$/.test(nextRevision)) {
      throw new Error(`Invalid server revision/data for ${name}.`);
    }
    const merged = mergeIndependentChanges(previousItems, items, latest);
    if (!merged) {
      throw new Error(`Conflict in ${name}: a record was changed elsewhere. Reload to review it before saving.`);
    }
    payload = merged;
    version = nextRevision;
  }
  throw new Error(`Repeated concurrent edits to ${name}. Close other tabs and retry.`);
}

export async function listBrowserCollectionNames() {
  const response = await fetch(`${apiRoot}/collections`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(`Central API returned HTTP ${response.status}.`);
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error("Invalid central collections response.");
  return records.map((entry) => String(entry.name));
}

// All imports must go through the central server with transactional backup.
export async function mergeBrowserCollections() {
  throw new Error("Local Access import is disabled. Import through a validated PostgreSQL server endpoint.");
}

// Write all affected financial collections in a single PostgreSQL transaction.
export async function writeAtomicFinanceBatch(changes) {
  const entries = Object.entries(changes);
  if (!entries.every(([name, items]) => Array.isArray(items) && collectionRevisions.has(name))) {
    throw new Error("Please wait until all collections have loaded from PostgreSQL.");
  }
  const response = await fetch(`${apiRoot}/collections/atomic-batch`, {
    method: "POST", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes: entries.map(([name, items]) => ({
      name, items, revision: Number(collectionRevisions.get(name)),
    })) }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error || `Atomic save failed: HTTP ${response.status}`);
  }
  const result = await response.json();
  for (const [name, record] of Object.entries(result.collections || {})) {
    collectionRevisions.set(name, String(record.revision));
    window.dispatchEvent(new CustomEvent("app-json-collection-updated", {
      detail: { name, items: record.items, internal: false },
    }));
  }
  return result;
}
