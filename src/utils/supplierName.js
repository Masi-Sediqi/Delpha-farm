// Keep existing supplier records intact; compare names consistently during creation/editing.
export const normalizeSupplierName = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u200c\u200d]/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase();

export const findSupplierByName = (suppliers, name, excludeId = null) => {
  const normalized = normalizeSupplierName(name);
  return normalized ? suppliers.find((supplier) =>
    String(supplier.id) !== String(excludeId) &&
    normalizeSupplierName(supplier.supplierName || supplier.name) === normalized
  ) : undefined;
};
