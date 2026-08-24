import { countryNameById, groupNameById } from "./productMasterData";
const normalize = (value) => String(value ?? "").toLowerCase().trim();
const compact = (value) => normalize(value).replace(/[^\p{L}\p{N}]+/gu, "");

export const money = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export const includesQuery = (value, query) => {
  const text = normalize(value);
  const q = normalize(query);
  const cleanText = compact(value);
  const cleanQuery = compact(query);
  return Boolean(q) && (text.includes(q) || (cleanQuery && cleanText.includes(cleanQuery)));
};

export const flattenSearchText = (value, depth = 0) => {
  if (value == null || depth > 4) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (Array.isArray(value)) return value.map((item) => flattenSearchText(item, depth + 1)).join(" ");
  if (typeof value === "object") return Object.values(value).map((item) => flattenSearchText(item, depth + 1)).join(" ");
  return "";
};

export const recordMatchesQuery = (record, query, extraValues = []) =>
  includesQuery([flattenSearchText(record), ...extraValues].join(" "), query);

const dateOf = (record) =>
  record?.paymentDate || record?.saleDate || record?.purchaseDate || record?.date || record?.createdAt || "";

const row = ({ type, title, subtitle, path, record, details = [] }) => ({
  type,
  key: `${type}-${record?.id || record?.productId || record?.customerId || record?.supplierId || record?.invoiceNumber || record?.billNumber || title}`,
  title: title || "—",
  subtitle: subtitle || "",
  path,
  record,
  details: [`Date: ${String(dateOf(record) || "-").slice(0, 10) || "-"}`, ...details],
});

export function buildSystemSearchResults(data, query, options = {}) {
  const keyword = String(query || "").trim();
  if (keyword.length < 2) return [];

  const {
    products = [],
    productGroups = [],
    countries = [],
    manufacturers = [],
    suppliers = [],
    customers = [],
    purchases = [],
    sales = [],
    customerPayments = [],
    supplierPayments = [],
  } = data || {};

  const limit = options.limit || Infinity;
  const results = [];

  products.filter((item) => {
    const group = groupNameById(productGroups, item.groupId, item.group || "");
    const country = countryNameById(countries, item.countryId, "en", item.madeIn || "");
    return recordMatchesQuery(item, keyword, [group, country]);
  }).forEach((item) => {
    const group = groupNameById(productGroups, item.groupId, item.group || "-") || "-";
    const country = countryNameById(countries, item.countryId, "en", item.madeIn || "-") || "-";
    results.push(row({
      type: "Product",
      title: item.productName || item.name || "Product",
      subtitle: [group, country].filter(Boolean).join(" · "),
      path: `/product-detail/${item.id}`,
      record: item,
      details: [
        `Group: ${group}`,
        `Made in: ${country}`,
        `Sale price: ${money(item.salePrice || item.defaultSalePrice || 0)}`,
        `Purchase price: ${money(item.purchasePrice || item.defaultPurchasePrice || 0)}`,
      ],
    }));
  });

  manufacturers.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Manufacturer",
      title: item.manufacturerName || item.companyName || item.name || "Manufacturer",
      subtitle: item.country || item.phone || "",
      path: "/manufacturers",
      record: item,
      details: [`Country: ${item.country || "-"}`, `Phone: ${item.phone || "-"}`],
    }));
  });

  suppliers.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Supplier",
      title: item.supplierName || item.companyName || item.name || "Supplier",
      subtitle: item.contactPerson || item.phone || "",
      path: `/supplier-detail/${item.id}`,
      record: item,
      details: [`Phone: ${item.phone || item.contactNumber || "-"}`, `Currency: ${item.currency || "AFN"}`],
    }));
  });

  customers.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Customer",
      title: item.fullName || item.customerName || item.companyName || item.name || "Customer",
      subtitle: item.phone || item.email || "",
      path: `/customer-detail/${item.id}`,
      record: item,
      details: [`Phone: ${item.phone || "-"}`, `Email: ${item.email || "-"}`],
    }));
  });

  purchases.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Purchase",
      title: item.billNumber || item.invoiceNumber || "Purchase",
      subtitle: item.supplierName || "",
      path: "/purchasing",
      record: item,
      details: [`Supplier: ${item.supplierName || "-"}`, `Total: ${money(item.totalAmount || item.grandTotal || item.total || 0)} ${item.currency || "AFN"}`],
    }));
  });

  sales.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Sale",
      title: item.invoiceNumber || item.billNumber || "Sale",
      subtitle: item.customerName || "",
      path: item.id ? `/sale-detail/${item.id}` : "/sales-register",
      record: item,
      details: [`Customer: ${item.customerName || "-"}`, `Total: ${money(item.totalAmount || item.grandTotal || item.total || 0)} ${item.currency || "AFN"}`],
    }));
  });

  customerPayments.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Payment",
      title: item.reference || item.description || "Customer payment",
      subtitle: item.customerName || "Customer payment",
      path: item.customerId ? `/customer-detail/${item.customerId}` : "/customer-registry",
      record: item,
      details: [`Amount: ${money(item.amount || item.paidAmount || 0)} ${item.currency || "AFN"}`, "Account: Customer"],
    }));
  });

  supplierPayments.filter((item) => recordMatchesQuery(item, keyword)).forEach((item) => {
    results.push(row({
      type: "Payment",
      title: item.reference || item.description || "Supplier payment",
      subtitle: item.supplierName || "Supplier payment",
      path: item.supplierId ? `/supplier-detail/${item.supplierId}` : "/suppliers",
      record: item,
      details: [`Amount: ${money(item.amount || item.paidAmount || 0)} ${item.currency || "AFN"}`, "Account: Supplier"],
    }));
  });

  return results.slice(0, limit);
}
