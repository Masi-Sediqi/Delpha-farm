const numeric = (value) => Math.max(Number(value || 0), 0);

export function getSaleItemPurchasePrice(item, product = null) {
  return numeric(item?.purchasePrice ?? product?.purchasePrice ?? 0);
}

export function calculateSaleFinancials(items = [], productLookup = () => null) {
  const costAmount = items.reduce((sum, item) => {
    const product = productLookup(item);
    return sum + numeric(item.quantity) * getSaleItemPurchasePrice(item, product);
  }, 0);

  const revenueAmount = items.reduce((sum, item) => {
    const quantity = numeric(item.quantity);
    const salePrice = numeric(item.salePrice);
    const discount = numeric(item.discountAmount ?? item.discount);
    return sum + Math.max(quantity * salePrice - discount, 0);
  }, 0);

  const grossProfit = revenueAmount - costAmount;

  return {
    costAmount,
    revenueAmount,
    grossProfit,
    pureProfit: grossProfit,
    netProfit: grossProfit,
  };
}
