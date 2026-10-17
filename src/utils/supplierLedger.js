// Display transactions in registration order, with the opening balance first.
export function compareSupplierLedgerEntries(a, b) {
  if (a.kind === "opening" && b.kind !== "opening") return -1;
  if (b.kind === "opening" && a.kind !== "opening") return 1;
  return (a.sequence - b.sequence) || (a.order - b.order) || String(a.id).localeCompare(String(b.id));
}
