const number = (value) => Math.max(Number(value) || 0, 0);
export const returnPieces = (row) => number(row.returnQty) * (row.returnUnit === "carton" ? row.cartonSize : 1);
export const returnAmount = (row) => returnPieces(row) * row.netPricePerPiece;

// Restore returnable quantities per invoice line and original batch, including old returns.
export function saleReturnLines(sale, previousItems = []) {
  if (!sale) return [];
  const previous = previousItems.filter((row) => String(row.saleId) === String(sale.id));
  const legacy = new Map();
  previous.filter((row) => !row.saleLineId).forEach((row) => {
    const key = `${row.productId}:${row.batchNo || "UNBATCHED"}`;
    legacy.set(key, (legacy.get(key) || 0) + number(row.quantity));
  });
  return (sale.items || []).map((item, index) => {
    const saleLineId = String(item.lineId || item.id || `line-${index}`);
    const quantity = number(item.quantity);
    const cartonSize = Math.max(number(item.cartonUnitsPerUnit || item.cartonSize || item.unitsPerUnit), 1);
    const gross = quantity * number(item.salePrice);
    const netTotal = item.lineTotal != null ? number(item.lineTotal) : Math.max(gross - number(item.discountAmount ?? item.discount), 0);
    const allocations = item.batchAllocations?.length ? item.batchAllocations : [{ batchNo: item.batchNo || "UNBATCHED", expiryDate: item.expiryDate || "", quantity }];
    const availableAllocations = allocations.map((batch) => {
      const batchNo = batch.batchNo || "UNBATCHED";
      const exact = previous.filter((row) => String(row.saleLineId) === saleLineId && (row.batchNo || "UNBATCHED") === batchNo).reduce((sum, row) => sum + number(row.quantity), 0);
      const key = `${item.productId}:${batchNo}`;
      const old = Math.min(legacy.get(key) || 0, Math.max(number(batch.quantity) - exact, 0));
      legacy.set(key, (legacy.get(key) || 0) - old);
      return { ...batch, batchNo, quantity: Math.max(number(batch.quantity) - exact - old, 0) };
    });
    const remainingPieces = Math.min(quantity, availableAllocations.reduce((sum, batch) => sum + batch.quantity, 0));
    return { ...item, saleLineId, cartonSize, quantity, remainingPieces, alreadyReturned: quantity - remainingPieces,
      netPricePerPiece: quantity ? netTotal / quantity : 0, availableAllocations, returnQty: "", returnUnit: cartonSize > 1 ? "carton" : "piece" };
  });
}

export function buildSaleReturn({ sale, rows, id, returnNo, date, notes = "", refundMode = "account", now }) {
  const selected = rows.filter((row) => returnPieces(row) > 0);
  if (!selected.length) throw new Error("حداقل یک مقدار برگشت وارد کنید.");
  if (!["account", "cash"].includes(refundMode)) throw new Error("نوع تصفیه را انتخاب کنید.");
  const items = [], movements = [];
  selected.forEach((row, index) => {
    let remaining = returnPieces(row);
    if (remaining > row.remainingPieces + 1e-8) throw new Error(`مقدار برگشت بیشتر از فروش است: ${row.productName}`);
    row.availableAllocations.forEach((batch, batchIndex) => {
      const quantity = Math.min(remaining, batch.quantity);
      if (quantity <= 0) return;
      const itemId = `${id}-${index}-${batchIndex}`;
      items.push({ id: `item-${itemId}`, saleReturnId: id, saleId: sale.id, saleLineId: row.saleLineId,
        productId: row.productId, productName: row.productName, batchNo: batch.batchNo, expiryDate: batch.expiryDate || "",
        quantity, quantityUnit: "piece", salePrice: row.netPricePerPiece, lineTotal: quantity * row.netPricePerPiece, createdAt: now });
      movements.push({ id: `movement-${itemId}`, productId: row.productId, referenceType: "sale-return", movementType: "sale-return", referenceId: id,
        referenceNumber: returnNo, quantityIn: quantity, quantityOut: 0, stockUnit: "piece", quantityUnit: "piece", unitPrice: row.netPricePerPiece,
        batchNo: batch.batchNo, expiryDate: batch.expiryDate || "", movementDate: date, createdAt: now, updatedAt: now });
      remaining -= quantity;
    });
    if (remaining > 1e-8) throw new Error("مقدار برگشت با بچ‌های فروش مطابقت ندارد.");
  });
  const totalAmount = Number(items.reduce((sum, row) => sum + row.lineTotal, 0).toFixed(6));
  const currency = String(sale.currency || "AFN").toUpperCase().replace("PKR", "INR");
  const header = { id, customerId: sale.customerId, saleId: sale.id, returnNo, returnDate: date, currency, totalAmount,
    refundMode, refundAmount: refundMode === "cash" ? totalAmount : 0, notes, itemCount: selected.length, createdAt: now };
  const refund = refundMode === "cash" && totalAmount > 0 ? { id: `refund-${id}`, partyType: "customer", partyId: sale.customerId,
    partyName: sale.customerName || "", direction: "out", amount: totalAmount, currency, date, reference: returnNo, saleReturnId: id,
    description: `پرداخت نقدی برگشت فروش ${returnNo}`, createdAt: now, updatedAt: now } : null;
  return { header, items, movements, refund };
}
