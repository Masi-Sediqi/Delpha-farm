import test from "node:test";
import assert from "node:assert/strict";
import { includesQuery, buildSystemSearchResults, searchResultNavigation } from "./systemSearch.js";

test("search matches Dari/Arabic spelling and Persian invoice numbers", () => {
 assert.equal(includesQuery("کمپنی", "كمپني"), true);
 assert.equal(includesQuery("SAL-123", "۱۲۳"), true);
 assert.equal(includesQuery("Customer ٤٥", "45"), true);
 assert.equal(includesQuery("Company", ""), false);
});
test("results open their matching section with an exact record highlight target", () => {
 const data = { products: [{ id: "p", productName: "Match" }], suppliers: [{ id: "s", supplierName: "Match" }], customers: [{ id: "c", fullName: "Match" }],
 purchases: [{ id: "buy", billNumber: "Match" }], sales: [{ id: "sell", invoiceNumber: "Match" }], customerPayments: [{ id: "pay", reference: "Match", customerId: "c" }] };
 const results = buildSystemSearchResults(data, "Match");
 assert.deepEqual(results.map(row => row.path), ["/products", "/suppliers", "/customer-registry", "/purchasing", "/sales-register", "/customer-detail/c"]);
 for (const result of results) {
  const target = searchResultNavigation(result).state.searchTarget;
  assert.equal(target.id, result.record.id);
  assert.equal(target.kind, result.type === "Payment" ? "customer-payment" : result.type.toLowerCase());
 }
 assert.equal(buildSystemSearchResults(data, "M").length, 6);
});
