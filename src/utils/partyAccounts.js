const num = value => Number(value || 0) || 0;
export const accountCurrency = value => String(value || "AFN").trim().toUpperCase().replace("PKR", "INR");

// Derive account balances from source records; never copy journal lines into payments.
export function partyAccountRows({ type, parties = [], invoices = [], returns = [], payments = [], journal = [] }) {
  const idKey = type === "customer" ? "customerId" : "supplierId";
  return parties.flatMap(party => {
    const id = String(party.id);
    const ownInvoices = invoices.filter(row => String(row[idKey]) === id);
    const buckets = new Map();
    const defaultCurrency = accountCurrency(party.currency || party.currencyCode);
    const ensure = currency => {
      const code = accountCurrency(currency || defaultCurrency);
      if (!buckets.has(code)) buckets.set(code, { party, currency: code, invoices: [], total: 0, paid: 0, returned: 0, opening: 0 });
      return buckets.get(code);
    };
    if (num(party.openingBalance)) ensure(defaultCurrency).opening = num(party.openingBalance);
    ownInvoices.forEach(row => {
      const bucket = ensure(row.currency);
      bucket.invoices.push(row);
      bucket.total += num(row.totalAmount);
      bucket.paid += num(row.paidAmount);
    });
    returns.filter(row => String(row[idKey]) === id).forEach(row => {
      const invoice = ownInvoices.find(item => String(item.id) === String(row.saleId || row.purchaseId));
      ensure(row.currency || invoice?.currency).returned += num(row.totalAmount);
    });
    payments.filter(row => String(row[idKey]) === id).forEach(row => { ensure(row.currency).paid += num(row.amount); });
    journal.filter(row => row.partyType === type && String(row.partyId) === id).forEach(row => {
      const reducesDebt = type === "customer" ? row.direction === "in" : row.direction === "out";
      ensure(row.currency).paid += (reducesDebt ? 1 : -1) * num(row.amount);
    });
    if (!buckets.size) ensure(defaultCurrency);
    return [...buckets.values()].map(bucket => ({ ...bucket,
      balance: bucket.opening + bucket.total - bucket.paid - bucket.returned,
      focusInvoice: bucket.invoices.find(row => num(row.remainingAmount ?? (num(row.totalAmount) - num(row.paidAmount))) > 0) || bucket.invoices.at(-1) || null,
    }));
  });
}
