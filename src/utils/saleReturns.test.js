import test from "node:test";
import assert from "node:assert/strict";
import { saleReturnLines, returnPieces, returnAmount, buildSaleReturn } from "./saleReturns.js";
import { partyAccountRows } from "./partyAccounts.js";

const sale = { id: "s", customerId: "c", currency: "USD", totalAmount: 21600, paidAmount: 21600,
 items: [{ lineId: "one", productId: "p", productName: "Medicine", quantity: 2400, cartonSize: 24,
 salePrice: 10, discountAmount: 2400, lineTotal: 21600,
 batchAllocations: [{ batchNo: "A", expiryDate: "2028-01-01", quantity: 2400 }] }] };
const makeReturn = (mode = "account", previous = []) => {
 const rows = saleReturnLines(sale, previous);
 rows[0].returnQty = 50;
 return buildSaleReturn({ sale, rows, id: "r", returnNo: "SR1", date: "2026-11-14", now: "2026-11-14T00:00:00Z", refundMode: mode });
};
test("50 of 100 cartons return as 1200 pieces at the original discounted invoice price", () => {
 const rows = saleReturnLines(sale); rows[0].returnQty = 50;
 assert.equal(returnPieces(rows[0]), 1200);
 assert.equal(returnAmount(rows[0]), 10800);
 const result = makeReturn();
 assert.equal(result.header.currency, "USD"); assert.equal(result.header.totalAmount, 10800);
 assert.equal(result.movements[0].quantityIn, 1200);
 assert.equal(result.movements[0].batchNo, "A"); assert.equal(result.refund, null);
});
test("account credit becomes customer payable; cash refund and later payout settle it without double counting", () => {
 const accountReturn = makeReturn(), cashReturn = makeReturn("cash");
 const balance = (result, journal = []) => partyAccountRows({ type: "customer", parties: [{ id: "c" }], invoices: [sale], returns: [result.header], journal })[0].balance;
 assert.equal(balance(accountReturn), -10800);
 assert.equal(balance(cashReturn, [cashReturn.refund]), 0);
 assert.equal(balance(accountReturn, [{ partyType: "customer", partyId: "c", currency: "USD", direction: "out", amount: 10800 }]), 0);
 const partiallyPaid = { ...sale, paidAmount: 5000 };
 assert.equal(partyAccountRows({ type: "customer", parties: [{ id: "c" }], invoices: [partiallyPaid], returns: [accountReturn.header] })[0].balance, 5800);
});
test("cumulative returns cannot exceed the original sold quantity", () => {
 const first = makeReturn();
 const rows = saleReturnLines(sale, first.items);
 assert.equal(rows[0].remainingPieces, 1200);
 rows[0].returnQty = 51;
 assert.throws(() => buildSaleReturn({ sale, rows, id: "r2" }), /بیشتر/);
});
test("duplicate product lines retain their own price and returnable batches", () => {
 const repeated = { ...sale, items: [sale.items[0], { ...sale.items[0], lineId: "two", salePrice: 20, lineTotal: 48000 }] };
 const previous = [{ saleId: "s", saleLineId: "one", productId: "p", batchNo: "A", quantity: 2400 }];
 const rows = saleReturnLines(repeated, previous);
 assert.equal(rows[0].remainingPieces, 0); assert.equal(rows[1].remainingPieces, 2400);
 assert.equal(rows[1].netPricePerPiece, 20);
});
