const num = value => Math.max(Number(value) || 0, 0);
const code = value => String(value || "AFN").toUpperCase().replace("PKR", "INR");

// Freeze comparison rates with the line; never revalue its recorded purchase cost.
export function capturePurchaseComparisonRates(purchaseCurrency, currencies, convertRate) {
  return Object.fromEntries(currencies.map(target => [code(target), code(target) === code(purchaseCurrency) ? 1 : Number(convertRate(purchaseCurrency, target)) || 0]));
}
export function assessSaleLoss(row, saleCurrency) {
  const quantity = num(row.quantity), purchasePrice = num(row.purchasePrice);
  const sameCurrency = code(row.purchaseCurrency) === code(saleCurrency);
  const rate = sameCurrency ? 1 : Number(row.purchaseComparisonRates?.[code(saleCurrency)] || 0);
  if (!quantity || !purchasePrice) return null;
  if (!(rate > 0)) return { missingRate: true };
  const costPerPiece = purchasePrice * rate;
  const gross = quantity * num(row.salePrice);
  const discount = Math.min(num(row.discountAmount), gross);
  const netPerPiece = (gross - discount) / quantity;
  if (netPerPiece + 1e-8 >= costPerPiece) return null;
  return { costPerPiece, netPerPiece, signature: JSON.stringify([row.lineId,quantity,row.salePrice,discount,costPerPiece,code(saleCurrency)]) };
}
export function correctLossPrice(row, assessment) {
  const quantity = num(row.quantity);
  const percent = row.discountPercent == null ? null : Math.min(num(row.discountPercent),100);
  const clearDiscount = percent === 100;
  const required = percent == null ? assessment.costPerPiece + num(row.discountAmount) / quantity
    : assessment.costPerPiece / (clearDiscount ? 1 : 1 - percent / 100);
  const salePrice = Math.ceil(required * 100 - 1e-8) / 100;
  return { salePrice, discountPercent: clearDiscount ? 0 : row.discountPercent,
    discountAmount: percent == null ? num(row.discountAmount) : quantity * salePrice * (clearDiscount ? 0 : percent) / 100 };
}
