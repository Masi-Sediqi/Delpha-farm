// Product prices follow the recorded price unit; older products use their main unit.
export function productPricePerPiece(product, field) {
  const price = Math.max(Number(product?.[field] || 0), 0);
  const unit = product?.priceUnit || product?.productUnit || "piece";
  if (unit === "piece") return price;
  const size = Math.max(Number(product?.piecesPerUnit ?? product?.unitsPerUnit ?? product?.quantityPerUnit ?? product?.piecesPerBox ?? product?.cartonSize ?? 1) || 1, 1);
  return price / size;
}

export function purchasePieceQuantity(row, size = 1) {
  const explicit = row.receivedQuantity ?? row.totalQuantity ?? row.quantityIn;
  if (explicit != null) return Math.max(Number(explicit) || 0, 0);
  const quantity = Math.max(Number(row.quantity ?? row.purchaseQuantity ?? row.packQuantity ?? row.qty) || 0, 0);
  return row.quantityUnit === "piece" || row.purchaseUnit === "piece" ? quantity : quantity * size;
}
