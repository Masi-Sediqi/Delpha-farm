// Edit the same fields shown by new-product registration. Stock and historical
// unit metadata belong to their existing records and are preserved on an edit.
const pieceSize = product => Math.max(Number(product.piecesPerUnit ?? product.unitsPerUnit ?? product.cartonSize ?? 1) || 1, 1);

export function updateProductDetails(existing, form, updatedAt) {
  return {
    ...existing,
    productName: String(form.productName || "").trim(),
    cartonSize: String(form.cartonSize || "").trim(),
    piecesPerUnit: Math.max(Number(form.cartonSize) || 1, 1),
    unitsPerUnit: Math.max(Number(form.cartonSize) || 1, 1),
    totalPieceQuantity: existing.totalPieceQuantity ?? (Math.max(Number(existing.quantity ?? existing.currentStock ?? existing.stock) || 0, 0) * pieceSize(existing)),
    countryId: form.countryId || "",
    manufacturerName: String(form.manufacturerName || "").trim(),
    unit: form.unit || "afn",
    purchaseCurrency: form.unit || "afn",
    saleCurrency: form.saleCurrency || "afn",
    purchasePrice: Math.max(Number(form.purchasePrice) || 0, 0),
    salePrice: Math.max(Number(form.salePrice) || 0, 0),
    priceUnit: "piece",
    updatedAt,
  };
}

// Preserve old opening balances in pieces before a carton-size correction.
export function preserveOpeningPieces(movements, product) {
  return movements.map(row => String(row.productId) === String(product.id)
    && row.referenceType === "opening" && row.stockUnit !== "piece" && row.quantityUnit !== "piece"
    ? { ...row, quantityIn: (Number(row.quantityIn) || 0) * pieceSize(product), quantityOut: (Number(row.quantityOut) || 0) * pieceSize(product), stockUnit: "piece", quantityUnit: "piece" }
    : row);
}
