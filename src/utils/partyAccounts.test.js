import test from "node:test";
import assert from "node:assert/strict";
import { partyAccountRows } from "./partyAccounts.js";

test("payables show only outstanding supplier balances after purchases and settlement", () => {
 const input = {
  type: "supplier",
  parties: [{ id: "partial" }, { id: "paid" }, { id: "unused" }],
  invoices: [
   { supplierId: "partial", totalAmount: 1000, paidAmount: 400 },
   { supplierId: "paid", totalAmount: 500, paidAmount: 500 },
  ],
 };
 const outstanding = () => partyAccountRows(input).filter(row => row.balance > 0);
 assert.deepEqual(outstanding().map(row => [row.party.id, row.balance]), [["partial", 600]]);
 input.payments = [{ supplierId: "partial", amount: 600 }];
 assert.equal(outstanding().length, 0);
});

test("a partially paid sale is immediately receivable and settles through the journal without duplicate debt", () => {
 const input = {
  type: "customer",
  parties: [{ id: "customer", fullName: "Customer", currency: "AFN" }],
  invoices: [{ id: "sale", customerId: "customer", currency: "AFN", totalAmount: 1000, paidAmount: 300, remainingAmount: 700 }],
 };
 let row = partyAccountRows(input)[0];
 assert.equal(row.balance, 700);
 assert.equal(row.paid, 300);
 assert.equal(row.focusInvoice.id, "sale");
 input.journal = [{ partyType: "customer", partyId: "customer", currency: "AFN", direction: "in", amount: 700 }];
 row = partyAccountRows(input)[0];
 assert.equal(row.balance, 0);
 assert.equal(partyAccountRows(input).filter(item => item.balance > 0 && item.invoices.length > 0).length, 0);
});

test("purchase, supplier payment, return and journal share one supplier balance", () => {
 const rows = partyAccountRows({type:"supplier",parties:[{id:"s",openingBalance:100}],invoices:[{id:"p",supplierId:"s",totalAmount:1000,paidAmount:200}],payments:[{supplierId:"s",amount:100}],returns:[{supplierId:"s",purchaseId:"p",totalAmount:50}],journal:[{partyType:"supplier",partyId:"s",direction:"out",amount:300},{partyType:"supplier",partyId:"s",direction:"in",amount:20},{partyType:"customer",partyId:"s",direction:"in",amount:9999}]});
 assert.equal(rows.length,1); assert.equal(rows[0].balance,470); assert.equal(rows[0].focusInvoice.id,"p");
});

test("customer receipts reduce receivables and withdrawals increase them", () => {
 const input={type:"customer",parties:[{id:1}],invoices:[{id:"sale",customerId:"1",totalAmount:500,paidAmount:100}],payments:[{customerId:1,amount:50}],journal:[{partyType:"customer",partyId:1,direction:"in",amount:200},{partyType:"customer",partyId:1,direction:"out",amount:20}]};
 assert.equal(partyAccountRows(input)[0].balance,170);
 input.journal.push({partyType:"customer",partyId:1,direction:"in",amount:170});
 assert.equal(partyAccountRows(input)[0].balance,0);
 assert.equal(partyAccountRows(input).length,1);
});

test("currencies remain separate, including PKR/INR journal aliases", () => {
 const rows=partyAccountRows({type:"customer",parties:[{id:"c",currency:"AFN",openingBalance:10}],invoices:[{customerId:"c",currency:"USD",totalAmount:100},{customerId:"c",currency:"INR",totalAmount:500}],journal:[{partyType:"customer",partyId:"c",direction:"in",currency:"USD",amount:20},{partyType:"customer",partyId:"c",direction:"in",currency:"PKR",amount:100}]});
 assert.deepEqual(Object.fromEntries(rows.map(row=>[row.currency,row.balance])),{AFN:10,USD:80,INR:400});
});

test("settled, unused and prepaid accounts remain visible", () => {
 const rows=partyAccountRows({type:"supplier",parties:[{id:"unused"},{id:"settled"},{id:"credit"}],invoices:[{supplierId:"settled",totalAmount:50,paidAmount:50}],payments:[{supplierId:"credit",amount:30}]});
 assert.deepEqual(rows.map(row=>row.balance),[0,0,-30]);
});

test("same names do not merge different accounts and no empty currency bucket is added", () => {
 const rows=partyAccountRows({type:"customer",parties:[{id:"a",fullName:"Same"},{id:"b",fullName:"Same"}],invoices:[{customerId:"a",currency:"USD",totalAmount:10},{customerId:"b",currency:"USD",totalAmount:20}]});
 assert.equal(rows.length,2); assert.deepEqual(rows.map(row=>row.balance),[10,20]);
});
