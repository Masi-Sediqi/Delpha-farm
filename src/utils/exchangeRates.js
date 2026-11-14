export const exchangeCurrencies = ["AFN", "USD", "EUR", "INR"];
export const normalizeExchangeCurrency = (value) => String(value || "AFN").trim().toUpperCase().replace("PKR", "INR");
export function exchangeRate(rates, from, to) {
  const source = normalizeExchangeCurrency(from), target = normalizeExchangeCurrency(to);
  if (source === target) return 1;
  const quote = (code) => code === "AFN" ? 1 : Number(rates[code] || 0);
  const a = quote(source), b = quote(target);
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 ? a / b : 0;
}

// All quotes share one AFN base so inverse and cross rates stay consistent.
export function updateExchangePair(rates, from, to, value) {
  const source = normalizeExchangeCurrency(from), target = normalizeExchangeCurrency(to);
  const rate = Number(value);
  if (source === target || !Number.isFinite(rate) || rate <= 0) throw new Error("invalid-rate");
  if (source === "AFN") return { ...rates, [target]: 1 / rate };
  const targetQuote = target === "AFN" ? 1 : Number(rates[target]);
  if (targetQuote > 0) return { ...rates, [source]: rate * targetQuote };
  const sourceQuote = Number(rates[source]);
  if (sourceQuote > 0) return { ...rates, [target]: sourceQuote / rate };
  throw new Error("missing-base-rate");
}
