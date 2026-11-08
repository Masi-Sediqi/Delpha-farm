import test from "node:test";
import assert from "node:assert/strict";
import { assessSaleLoss, capturePurchaseComparisonRates, correctLossPrice } from "./saleLossWarning.js";
const base={lineId:"a",purchasePrice:120,purchaseCurrency:"AFN",quantity:1000,salePrice:100,discountAmount:0,discountPercent:0};

test("warns below purchase cost, but not at break-even or above", () => {
 assert.equal(assessSaleLoss(base,"AFN").costPerPiece,120);
 assert.equal(assessSaleLoss({...base,salePrice:120},"AFN"),null);
 assert.equal(assessSaleLoss({...base,salePrice:130},"AFN"),null);
 assert.equal(assessSaleLoss({...base,quantity:0},"AFN"),null);
});

test("discount can turn an otherwise profitable price into a loss", () => {
 const row={...base,salePrice:125,discountPercent:10,discountAmount:12500};
 const loss=assessSaleLoss(row,"AFN");
 assert.equal(loss.netPerPiece,112.5);
 const corrected={...row,...correctLossPrice(row,loss)};
 assert.equal(corrected.salePrice,133.34);
 assert.equal(corrected.discountPercent,10);
 assert.equal(assessSaleLoss(corrected,"AFN"),null);
 assert.equal(corrected.purchasePrice,120);
});

test("full-discount correction removes the discount to make break-even possible", () => {
 const row={...base,discountPercent:100,discountAmount:100000};
 const corrected={...row,...correctLossPrice(row,assessSaleLoss(row,"AFN"))};
 assert.equal(corrected.discountPercent,0); assert.equal(corrected.discountAmount,0);
 assert.equal(corrected.salePrice,120); assert.equal(assessSaleLoss(corrected,"AFN"),null);
});

test("cross-currency comparison freezes the rate without revaluing purchase price", () => {
 let rate=70;
 const row={...base,purchasePrice:2,purchaseCurrency:"USD",salePrice:130,purchaseComparisonRates:capturePurchaseComparisonRates("USD",["AFN","USD"],()=>rate)};
 rate=80;
 const before=JSON.stringify(row);
 assert.equal(assessSaleLoss(row,"AFN").costPerPiece,140);
 assert.equal(row.purchaseComparisonRates.USD,1);
 assert.equal(JSON.stringify(row),before);
 assert.equal(assessSaleLoss({...row,salePrice:140},"AFN"),null);
 assert.equal(assessSaleLoss({...row,purchaseComparisonRates:{}},"AFN").missingRate,true);
});

test("approval signature changes when the sale or its discount changes", () => {
 assert.notEqual(assessSaleLoss(base,"AFN").signature,assessSaleLoss({...base,salePrice:90},"AFN").signature);
 assert.notEqual(assessSaleLoss(base,"AFN").signature,assessSaleLoss({...base,discountAmount:100},"AFN").signature);
});

test("fixed discount correction and zero-cost goods are handled correctly", () => {
 const row={...base,quantity:2,salePrice:100,discountAmount:10,discountPercent:null};
 const corrected={...row,...correctLossPrice(row,assessSaleLoss(row,"AFN"))};
 assert.equal(corrected.salePrice,125); assert.equal(corrected.discountAmount,10);
 assert.equal(assessSaleLoss(corrected,"AFN"),null);
 assert.equal(assessSaleLoss({...base,purchasePrice:0},"AFN"),null);
});
