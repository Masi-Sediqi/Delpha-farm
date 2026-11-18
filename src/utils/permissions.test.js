import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyPermissions, hasPermission, moduleKeyForPath } from "./permissions.js";

const employee = (permissions) => ({ role: "User", status: "Active", permissions });

test("an empty account has no access and view does not grant mutations or print", () => {
  assert.equal(hasPermission(employee(createEmptyPermissions()), "products"), false);
  const user = employee({ products: { view: true } });
  assert.equal(hasPermission(user, "products"), true);
  for (const action of ["create", "edit", "delete", "print"]) {
    assert.equal(hasPermission(user, "products", action), false);
  }
  assert.equal(hasPermission(user, "inventory"), false);
});

test("explicitly denying view blocks every action while legacy grants still work", () => {
  assert.equal(hasPermission(employee({ products: { view: false, edit: true } }), "products", "edit"), false);
  const legacy = employee({ products: { edit: true } });
  assert.equal(hasPermission(legacy, "products"), true);
  assert.equal(hasPermission(legacy, "products", "edit"), true);
  assert.equal(hasPermission(legacy, "products", "create"), false);
});

test("report access does not open separate financial tools", () => {
  const user = employee({ reports: { view: true, print: true } });
  for (const path of ["/banks", "/cash-count", "/cash-journal", "/general-journal"]) {
    assert.equal(hasPermission(user, moduleKeyForPath(path)), false);
  }
  assert.equal(hasPermission(user, "reports", "print"), true);
});

test("unsupported actions, nonboolean grants and inactive accounts are denied", () => {
  assert.equal(hasPermission(employee({ sales: { view: true, create: true } }), "sales", "create"), false);
  assert.equal(hasPermission(employee({ settings: { view: "true", edit: "true" } }), "settings", "edit"), false);
  assert.equal(hasPermission({ role: "Admin", status: "Inactive" }, "settings", "edit"), false);
  assert.equal(hasPermission({ role: "Admin", status: "Active" }, "accounts"), true);
});
