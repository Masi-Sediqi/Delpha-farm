export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "print"];

export const PERMISSION_MODULES = [
  { key: "dashboard", actions: ["view"], labels: { en: "Dashboard", fa: "داشبورد", ps: "ډشبورد" } },
  { key: "suppliers", actions: ["view", "create", "edit", "delete", "print"], labels: { en: "Suppliers", fa: "تأمین‌کننده‌گان", ps: "عرضه کوونکي" } },
  { key: "products", actions: ["view", "create", "edit", "delete"], labels: { en: "Products", fa: "محصولات", ps: "محصولات" } },
  { key: "purchasing", actions: ["view", "print"], labels: { en: "Purchasing", fa: "خریداری", ps: "پېرود" } },
  { key: "payables", actions: ["view", "print"], labels: { en: "Payables", fa: "تادیات", ps: "تادیات" } },
  { key: "customers", actions: ["view", "create", "edit", "delete", "print"], labels: { en: "Customers", fa: "مشتریان", ps: "پېرودونکي" } },
  { key: "sales", actions: ["view", "print"], labels: { en: "Sales", fa: "فروشات", ps: "خرڅلاو" } },
  { key: "receivables", actions: ["view", "print"], labels: { en: "Receivables", fa: "طلبات", ps: "طلبات" } },
  { key: "saleReturns", actions: ["view"], labels: { en: "Sale Returns", fa: "برگشت فروش", ps: "د خرڅلاو بېرته ستنول" } },
  { key: "inventory", actions: ["view", "print"], labels: { en: "Inventory", fa: "موجودی", ps: "موجودي" } },
  { key: "expenses", actions: ["view", "print"], labels: { en: "Expenses", fa: "مصارف", ps: "مصارف" } },
  { key: "accounts", actions: [], labels: { en: "Accounts", fa: "اکونت‌ها", ps: "اکونټونه" } },
  { key: "cashJournal", actions: ["view", "print"], labels: { en: "Cash Journal", fa: "روزنامچه / نقدی", ps: "نغدي ورځپاڼه" } },
  { key: "banks", actions: ["view", "print"], labels: { en: "Banks", fa: "بانک‌ها", ps: "بانکونه" } },
  { key: "cashCount", actions: ["view", "create", "edit", "delete"], labels: { en: "Cash Count", fa: "شمارش نقدی", ps: "نغدي شمېرنه" } },
  { key: "generalJournal", actions: ["view", "create", "delete"], labels: { en: "General Journal", fa: "روزنامچه عمومی", ps: "عمومي ورځپاڼه" } },
  { key: "reports", actions: ["view", "print"], labels: { en: "Reports", fa: "گزارشات", ps: "راپورونه" } },
  { key: "trash", actions: ["view"], labels: { en: "Trash", fa: "سطل زباله", ps: "د کثافاتو ټوکرۍ" } },
  { key: "settings", actions: ["view", "edit"], labels: { en: "Settings", fa: "تنظیمات", ps: "تنظیمات" } },
];

export const createEmptyPermissions = () => PERMISSION_MODULES.reduce((result, module) => {
  result[module.key] = module.actions.reduce((actions, action) => ({ ...actions, [action]: false }), {});
  return result;
}, {});

export const createFullPermissions = () => PERMISSION_MODULES.reduce((result, module) => {
  result[module.key] = module.actions.reduce((actions, action) => ({ ...actions, [action]: true }), {});
  return result;
}, {});

export function isAdminUser(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

export function hasPermission(user, moduleKey, action = "view") {
  if (!user || String(user.status || "Active").toLowerCase() !== "active") return false;
  if (isAdminUser(user)) return true;
  const module = PERMISSION_MODULES.find(({ key }) => key === moduleKey);
  const grants = user.permissions?.[moduleKey];
  if (!module?.actions.includes(action) || !grants) return false;
  // Older accounts derived access from their existing action grants.
  if (action === "view" && !Object.hasOwn(grants, "view")) {
    return PERMISSION_ACTIONS.some((key) => grants[key] === true);
  }
  if (action === "view") return grants.view === true;
  return (!Object.hasOwn(grants, "view") || grants.view === true) && grants[action] === true;
}

export function canViewModule(user, moduleKey) {
  return hasPermission(user, moduleKey, "view");
}

export function moduleKeyForPath(pathname = "") {
  if (pathname === "/cash-journal") return "cashJournal";
  if (pathname === "/banks") return "banks";
  if (pathname === "/cash-count") return "cashCount";
  if (pathname === "/general-journal") return "generalJournal";
  if (pathname === "/" || pathname === "/search-results") return "dashboard";
  if (pathname.startsWith("/supplier")) return "suppliers";
  if (pathname.startsWith("/product")) return "products";
  if (pathname.startsWith("/purchasing")) return "purchasing";
  if (pathname.startsWith("/payables")) return "payables";
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
