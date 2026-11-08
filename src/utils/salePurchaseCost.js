import { productPricePerPiece } from "./piecePricing.js";
const amount = value => Math.max(Number(value) || 0, 0);
const currency = value => String(value || "AFN").trim().toUpperCase().replace("PKR", "INR");

// Capture purchase cost in its original currency. Settings rates never enter a sale snapshot.
export function productPurchaseCostSnapshot(product) {
  return costFields(productPricePerPiece(product, "purchasePrice"), currency(product.purchaseCurrency || product.unit));
}
function costFields(price, code) {
  return { purchasePrice: price, purchaseCurrency: code, purchasePriceUnit: "piece",
    sourcePurchasePrice: price, sourcePurchaseCurrency: code, sourcePurchasePriceUnit: "piece", costSnapshotVersion: 1 };
}
export function salePurchaseCostSnapshot(item, invoiceCurrency = "AFN", product = null) {
  if (item.costSnapshotVersion === 1) return costFields(amount(item.purchasePrice), currency(item.purchaseCurrency));
  if (item.sourcePurchasePrice != null && item.sourcePurchaseCurrency) {
    const unit = item.sourcePurchasePriceUnit || product?.priceUnit || product?.productUnit || "package";
    const size = unit === "piece" ? 1 : Math.max(Number(item.cartonUnitsPerUnit || item.unitsPerUnit || item.cartonSize) || 1, 1);
    return costFields(amount(item.sourcePurchasePrice) / size, currency(item.sourcePurchaseCurrency));
  }
  if (item.purchasePrice != null || item.costPrice != null) {
    const unit = item.purchasePriceUnit || item.sourcePurchasePriceUnit || "package";
    const size = unit === "piece" ? 1 : Math.max(Number(item.unitsPerUnit || item.cartonSize) || 1, 1);
    return costFields(amount(item.purchasePrice ?? item.costPrice) / size, currency(item.purchaseCurrency || invoiceCurrency));
  }
  return product ? productPurchaseCostSnapshot(product) : costFields(0, currency(invoiceCurrency));
}

// Only dashboard profit/loss translates a captured cost using current settings.
export function dashboardPurchaseCost(item, invoiceCurrency, exchangeRates = {}) {
  const snapshot = salePurchaseCostSnapshot(item, invoiceCurrency);
  const from = currency(snapshot.purchaseCurrency), to = currency(invoiceCurrency);
  if (from === to || snapshot.purchasePrice === 0) return snapshot.purchasePrice;
  const rate = code => code === "AFN" ? 1 : Number(exchangeRates[code] || 0);
  const fromRate = rate(from), toRate = rate(to);
  return fromRate > 0 && toRate > 0 ? snapshot.purchasePrice * fromRate / toRate : null;
}
