const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const key = (row) => row && typeof row === "object" && row.id != null ? `id:${row.id}` : `value:${JSON.stringify(row)}`;
const index = (rows) => new Map((rows || []).map(row => [key(row), row]));

export function deletedRecordChanges(changes) {
  // Legacy purchase trash already owns the purchase and all its dependent records.
  const legacy = changes.find(change => change.name === "trashPurchases");
  const oldTrash = index(legacy?.before || []);
  const snapshots = (legacy?.after || []).filter(row => !oldTrash.has(key(row)));
  const covered = (name, row) => snapshots.some(snapshot =>
    (name === "purchases" && equal(snapshot.purchase, row)) ||
    (name === "purchaseItems" && (snapshot.items || []).some(item => equal(item, row))) ||
    (name === "stockMovements" && (snapshot.movements || []).some(item => equal(item, row))));
  const deltas = changes.filter(change => !change.name.startsWith("trash")).map(({ name, before = [], after = [] }) => {
    const old = index(before), next = index(after);
    return { name, removed: [...old].filter(([id]) => !next.has(id)).map(([, row]) => row).filter(row => !covered(name, row)),
      added: [...next].filter(([id]) => !old.has(id)).map(([, row]) => row),
      updated: [...old].filter(([id, row]) => next.has(id) && !equal(row, next.get(id))).map(([id, row]) => ({ before: row, after: next.get(id) })) };
  });
  return deltas.some(delta => delta.removed.length) ? deltas.filter(delta => delta.removed.length || delta.added.length || delta.updated.length) : [];
}

export function restoreDeletedChanges(deltas, collections) {
  const restored = {};
  for (const delta of deltas) {
    const rows = index(collections[delta.name] || []);
    for (const row of delta.removed) {
      if (rows.has(key(row))) throw new Error(`Restore conflict in ${delta.name}: record already exists.`);
      rows.set(key(row), row);
    }
    for (const change of delta.updated || []) {
      if (!equal(rows.get(key(change.after)), change.after)) throw new Error(`Restore conflict in ${delta.name}: a related record has changed.`);
      rows.set(key(change.before), change.before);
    }
    for (const row of delta.added || []) {
      if (!equal(rows.get(key(row)), row)) throw new Error(`Restore conflict in ${delta.name}: a related record has changed.`);
      rows.delete(key(row));
    }
    restored[delta.name] = [...rows.values()];
  }
  return restored;
}

export function trashSummary(record) {
  const changes = record.payload;
  const removed = changes.flatMap(change => change.removed);
  const first = removed[0] || {};
  return { id: record.id, deletedAt: record.deletedAt || record.deleted_at,
    collections: changes.map(change => change.name), count: removed.length,
    recordName: first.productName || first.fullName || first.full_name || first.supplierName || first.name || first.returnNo || first.invoiceNumber || first.billNumber || first.reference || first.description || String(first.id || changes[0]?.name || "Record") };
}
