export const stockNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

export function legacyProductStock(product) {
  if (!product) return 0;
  if (product.currentStock !== undefined && product.currentStock !== null && product.currentStock !== "") {
    return stockNumber(product.currentStock);
  }
  if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
    return stockNumber(product.stock);
  }
  if (product.quantity !== undefined && product.quantity !== null && product.quantity !== "") {
    return stockNumber(product.quantity);
  }
  return 0;
}

export function hasLegacyStock(product) {
  if (!product) return false;
  return ["currentStock", "stock", "quantity"].some((key) => (
    product[key] !== undefined && product[key] !== null && product[key] !== ""
  ));
}

export function movementQuantity(movement) {
  return stockNumber(movement?.quantityIn) - stockNumber(movement?.quantityOut);
}

export function productMovements(movements, productId) {
  return (Array.isArray(movements) ? movements : []).filter(
    (movement) => String(movement.productId) === String(productId)
  );
}

export function getProductStock(movements, productId, fallback = 0) {
  const rows = productMovements(movements, productId);
  if (!rows.length) return stockNumber(fallback);
  return rows.reduce((sum, movement) => sum + movementQuantity(movement), 0);
}

export function getProductStockTotals(movements, productId) {
  return productMovements(movements, productId).reduce(
    (totals, movement) => {
      totals.quantityIn += stockNumber(movement.quantityIn);
      totals.quantityOut += stockNumber(movement.quantityOut);
      if (movement.referenceType === "purchase") totals.purchased += stockNumber(movement.quantityIn);
      if (movement.referenceType === "sale") totals.sold += stockNumber(movement.quantityOut);
      if (movement.referenceType === "opening") {
        totals.opening += stockNumber(movement.quantityIn) - stockNumber(movement.quantityOut);
      }
      return totals;
    },
    { quantityIn: 0, quantityOut: 0, purchased: 0, sold: 0, opening: 0 }
  );
}

export function stockMovementId(referenceType, referenceId, productId, suffix = "") {
  const extra = suffix ? `-${String(suffix).replace(/[^a-zA-Z0-9_-]+/g, "-")}` : "";
  return `stock-${referenceType}-${referenceId}-${productId}${extra}`;
}

export function getProductBatchBalances(movements, productId) {
  const batches = new Map();
  productMovements(movements, productId).forEach((movement) => {
    const batchNo = String(movement.batchNo || "").trim() || "UNBATCHED";
    const key = batchNo.toLowerCase();
    const current = batches.get(key) || {
      batchNo,
      expiryDate: movement.expiryDate || "",
      quantityIn: 0,
      quantityOut: 0,
      available: 0,
      lastMovementDate: "",
    };
    current.quantityIn += stockNumber(movement.quantityIn);
    current.quantityOut += stockNumber(movement.quantityOut);
    current.available = current.quantityIn - current.quantityOut;
    if (movement.expiryDate && (!current.expiryDate || movement.expiryDate < current.expiryDate)) {
      current.expiryDate = movement.expiryDate;
    }
    if (movement.movementDate && movement.movementDate > current.lastMovementDate) {
      current.lastMovementDate = movement.movementDate;
    }
    batches.set(key, current);
  });
  return [...batches.values()].sort((a, b) => {
    const ax = a.expiryDate || "9999-12-31";
    const bx = b.expiryDate || "9999-12-31";
    return ax.localeCompare(bx) || a.batchNo.localeCompare(b.batchNo);
  });
}

export function allocateProductBatchesFEFO(movements, productId, quantity, excludedReferenceId = null) {
  const source = excludedReferenceId == null
    ? movements
    : (Array.isArray(movements) ? movements : []).filter((movement) => !(
        movement.referenceType === "sale" && String(movement.referenceId) === String(excludedReferenceId)
      ));
  let remaining = stockNumber(quantity);
  const allocations = [];
  for (const batch of getProductBatchBalances(source, productId)) {
    const available = Math.max(stockNumber(batch.available), 0);
    if (!available || remaining <= 0) continue;
    const used = Math.min(available, remaining);
    allocations.push({ batchNo: batch.batchNo, expiryDate: batch.expiryDate || "", quantity: used });
    remaining -= used;
  }
  return { allocations, unallocated: Math.max(remaining, 0) };
}

export function replaceReferenceMovements(movements, referenceType, referenceId, nextRows) {
  const retained = (Array.isArray(movements) ? movements : []).filter(
    (movement) => !(
      movement.referenceType === referenceType &&
      String(movement.referenceId) === String(referenceId)
    )
  );
  return [...nextRows, ...retained];
}
