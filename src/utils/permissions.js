export const PERMISSION_ACTIONS = ["create", "edit", "delete", "print"];

export const PERMISSION_MODULES = [
  { key: "dashboard", labels: { en: "Dashboard", fa: "داشبورد", ps: "ډشبورد" } },
  { key: "suppliers", labels: { en: "Suppliers", fa: "تأمین‌کننده‌گان", ps: "عرضه کوونکي" } },
  { key: "products", labels: { en: "Products", fa: "محصولات", ps: "محصولات" } },
  { key: "purchasing", labels: { en: "Purchasing", fa: "خریداری", ps: "پېرود" } },
  { key: "payables", labels: { en: "Payables", fa: "تادیات", ps: "تادیات" } },
  { key: "purchaseReturns", labels: { en: "Purchase Returns", fa: "برگشت خرید", ps: "د پېرود بېرته ستنول" } },
  { key: "customers", labels: { en: "Customers", fa: "مشتریان", ps: "پېرودونکي" } },
  { key: "sales", labels: { en: "Sales", fa: "فروشات", ps: "خرڅلاو" } },
  { key: "receivables", labels: { en: "Receivables", fa: "طلبات", ps: "طلبات" } },
  { key: "saleReturns", labels: { en: "Sale Returns", fa: "برگشت فروش", ps: "د خرڅلاو بېرته ستنول" } },
  { key: "inventory", labels: { en: "Inventory", fa: "موجودی", ps: "موجودي" } },
  { key: "expenses", labels: { en: "Expenses", fa: "مصارف", ps: "مصارف" } },
  { key: "accounts", labels: { en: "Accounts", fa: "اکونت‌ها", ps: "اکونټونه" } },
  { key: "reports", labels: { en: "Reports", fa: "گزارشات", ps: "راپورونه" } },
  { key: "trash", labels: { en: "Trash", fa: "سطل زباله", ps: "د کثافاتو ټوکرۍ" } },
  { key: "settings", labels: { en: "Settings", fa: "تنظیمات", ps: "تنظیمات" } },
];

export const createEmptyPermissions = () => PERMISSION_MODULES.reduce((result, module) => {
  result[module.key] = PERMISSION_ACTIONS.reduce((actions, action) => ({ ...actions, [action]: false }), {});
  return result;
}, {});

export const createFullPermissions = () => PERMISSION_MODULES.reduce((result, module) => {
  result[module.key] = PERMISSION_ACTIONS.reduce((actions, action) => ({ ...actions, [action]: true }), {});
  return result;
}, {});

export function isAdminUser(user) {
  return Boolean(user?.isDefaultAdmin) || String(user?.role || "").toLowerCase() === "admin";
}

export function hasPermission(user, moduleKey, action = "view") {
  if (!user || String(user.status || "Active").toLowerCase() !== "active") return false;
  if (isAdminUser(user)) return true;
  const modulePermissions = user.permissions?.[moduleKey];
  if (!modulePermissions) return false;
  if (action === "view") return PERMISSION_ACTIONS.some((key) => Boolean(modulePermissions[key]));
  return Boolean(modulePermissions[action]);
}

export function canViewModule(user, moduleKey) {
  return hasPermission(user, moduleKey, "view");
}

export function moduleKeyForPath(pathname = "") {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/supplier")) return "suppliers";
  if (pathname.startsWith("/product")) return "products";
  if (pathname.startsWith("/purchasing")) return "purchasing";
  if (pathname.startsWith("/payables")) return "payables";
  if (pathname.startsWith("/purchase-returns")) return "purchaseReturns";
  if (pathname.startsWith("/customer")) return "customers";
  if (pathname.startsWith("/sales") || pathname.startsWith("/sale-detail")) return "sales";
  if (pathname.startsWith("/receivables")) return "receivables";
  if (pathname.startsWith("/sale-returns")) return "saleReturns";
  if (pathname.startsWith("/inventory")) return "inventory";
  if (pathname.startsWith("/expenses")) return "expenses";
  if (pathname.startsWith("/accounts")) return "accounts";
  if (pathname.startsWith("/trash")) return "trash";
  if (pathname.startsWith("/settings")) return "settings";
  return "reports";
}
