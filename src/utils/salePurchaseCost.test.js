import test from "node:test";
import assert from "node:assert/strict";
import { productPurchaseCostSnapshot, salePurchaseCostSnapshot, dashboardPurchaseCost } from "./salePurchaseCost.js";

test("purchase snapshot stays in original currency while dashboard cost follows settings", () => {
 const product={productUnit:"piece",purchasePrice:2,purchaseCurrency:"USD",cartonSize:36};
 const item={...productPurchaseCostSnapshot(product),quantity:36};
 const saved=JSON.stringify(item);
 assert.equal(item.purchasePrice,2); assert.equal(item.purchaseCurrency,"USD");
 assert.equal(dashboardPurchaseCost(item,"AFN",{USD:70}),140);
 assert.equal(dashboardPurchaseCost(item,"AFN",{USD:80}),160);
 assert.equal(JSON.stringify(item),saved);
 assert.equal(salePurchaseCostSnapshot(item,"AFN").purchasePrice,2);
 assert.equal(salePurchaseCostSnapshot(item,"EUR",{purchasePrice:999}).purchasePrice,2);
});

test("profit can become loss after a rate change without changing the invoice", () => {
 const item={...productPurchaseCostSnapshot({purchasePrice:2,purchaseCurrency:"USD",productUnit:"piece"}),quantity:10,salePrice:150};
 const revenue=item.quantity*item.salePrice;
 assert.equal(revenue-dashboardPurchaseCost(item,"AFN",{USD:70})*item.quantity,100);
 assert.equal(revenue-dashboardPurchaseCost(item,"AFN",{USD:80})*item.quantity,-100);
 assert.equal(item.salePrice,150); assert.equal(item.purchasePrice,2);
});

test("same-currency costs and zero costs need no exchange rate", () => {
 const item=productPurchaseCostSnapshot({purchasePrice:3,purchaseCurrency:"AFN"});
 assert.equal(dashboardPurchaseCost(item,"AFN",{}),3);
 assert.equal(dashboardPurchaseCost({...item,purchasePrice:0},"USD",{}),0);
 assert.equal(dashboardPurchaseCost(item,"USD",{}),null);
});

test("legacy package cost and currency are captured once on reopening", () => {
 const legacy={sourcePurchasePrice:72,sourcePurchaseCurrency:"USD",unitsPerUnit:36,purchasePrice:5040};
 const snapshot=salePurchaseCostSnapshot(legacy,"AFN");
 assert.equal(snapshot.purchasePrice,2); assert.equal(snapshot.purchaseCurrency,"USD");
 assert.deepEqual(salePurchaseCostSnapshot(snapshot,"EUR"),snapshot);
 const invoiceOnly=salePurchaseCostSnapshot({purchasePrice:360,unitsPerUnit:36},"AFN");
 assert.equal(invoiceOnly.purchasePrice,10); assert.equal(invoiceOnly.purchaseCurrency,"AFN");
});

test("piece metadata prevents a second division and cross-currency dashboard conversion is correct", () => {
 const item={sourcePurchasePrice:2,sourcePurchaseCurrency:"USD",sourcePurchasePriceUnit:"piece",unitsPerUnit:36};
 assert.equal(salePurchaseCostSnapshot(item,"AFN").purchasePrice,2);
 assert.equal(dashboardPurchaseCost(item,"EUR",{USD:70,EUR:80}),1.75);
 assert.equal(productPurchaseCostSnapshot({purchasePrice:72,productUnit:"carton",piecesPerUnit:36,purchaseCurrency:"usd"}).purchasePrice,2);
});
