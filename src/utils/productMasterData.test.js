import test from "node:test";
import assert from "node:assert/strict";
import { isProductMasterInUse } from "./productMasterData.js";

test("country deletion is blocked by IDs and legacy translated names", () => {
 const country = { id: "af", name: "Afghanistan", fa: "افغانستان" };
 assert.equal(isProductMasterInUse("country", country, [{ countryId: "af" }]), true);
 assert.equal(isProductMasterInUse("country", country, [{ madeIn: "افغانستان" }]), true);
 assert.equal(isProductMasterInUse("country", country, [{ countryId: "other", madeIn: "India" }]), false);
});

test("company deletion is blocked even by one linked product or a legacy name", () => {
 const company = { id: 12, name: "Acme" };
 for (const product of [{ manufacturerCompanyId: "12" }, { companyId: 12 }, { manufacturerName: " ACME " }, { companyName: "Acme" }]) {
  assert.equal(isProductMasterInUse("manufacturer", company, [product]), true);
 }
 assert.equal(isProductMasterInUse("manufacturer", company, [{ manufacturerName: "Other" }]), false);
 assert.equal(isProductMasterInUse("manufacturer", company, []), false);
});
