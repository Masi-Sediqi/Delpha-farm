import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  FileText,
  Landmark,
  FileSpreadsheet,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getProductStock } from "../utils/stock";
import { groupNameById } from "../utils/productMasterData";
import ShamsiDateInput from "../components/ShamsiDateInput";
import "./Reports.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const numeric = (value) => Number(value || 0) || 0;
const dateOnly = (value) => String(value || "").slice(0, 10);
const money = (value) => numeric(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

const translations = {
  en: {
    title: "Reports",
    subtitle: "Simple, useful reports for daily pharmacy management.",
    sales: "Sales Report",
    salesHint: "Invoices, customers, totals, payments and remaining balances.",
    purchases: "Purchase Report",
    purchasesHint: "Supplier purchases, paid amounts and outstanding balances.",
    inventory: "Inventory Report",
    inventoryHint: "Current medicine stock calculated from stock movements.",
    accounts: "Receivables & Payables",
    accountsHint: "See what customers owe you and what you owe suppliers.",
    cash: "Cash Flow",
    cashHint: "Review cash receipts, payments and balances by currency.",
    journal: "General Journal",
    journalHint: "Open the accounting journal and ledger summaries.",
    open: "Open",
    reportWorkspace: "Report Workspace",
    allDates: "All dates",
    from: "From",
    to: "To",
    search: "Search this report...",
    reset: "Reset",
    export: "Export Excel",
    print: "Print",
    reportTitle: "Report",
    dateRange: "Date range",
    generatedOn: "Generated on",
    records: "records",
    total: "Total",
    paid: "Paid",
    remaining: "Remaining",
    invoice: "Invoice",
    bill: "Bill No.",
    customer: "Customer",
    supplier: "Supplier",
    items: "Items",
    date: "Date",
    paymentType: "Payment Type",
    cashPayment: "Cash",
    installment: "Installment",
    product: "Product",
    group: "Group",
    manufacturer: "Manufacturer",
    currentStock: "Current Stock",
    status: "Status",
    inStock: "In stock",
    outOfStock: "Out of stock",
    noRows: "No records match the current filters.",
    summarySales: "Sales in range",
    summaryPurchases: "Purchases in range",
    summaryStock: "Units currently in stock",
    summaryProducts: "Products",
  },
  fa: {
    title: "گزارشات",
    subtitle: "گزارش‌های ساده و کاربردی برای مدیریت روزانه دواخانه.",
    sales: "گزارش فروشات",
    salesHint: "بل‌ها، مشتریان، جمله، پرداخت و باقی‌مانده فروشات.",
    purchases: "گزارش خریداری",
    purchasesHint: "خریدهای تأمین‌کننده‌گان، پرداخت و باقی‌مانده.",
    inventory: "گزارش موجودی",
    inventoryHint: "موجودی فعلی دواها بر اساس حرکات واقعی گدام.",
    accounts: "طلبات و پرداختنی‌ها",
    accountsHint: "ببینید مشتریان چقدر بدهکارند و ما به تأمین‌کننده‌گان چقدر بدهکاریم.",
    cash: "جریان نقدی",
    cashHint: "دریافت، پرداخت و بیلانس نقدی را به تفکیک اسعار ببینید.",
    journal: "ژورنال عمومی",
    journalHint: "ژورنال حسابداری و خلاصه لیجرها را باز کنید.",
    open: "باز کردن",
    reportWorkspace: "محیط گزارش",
    allDates: "تمام تاریخ‌ها",
    from: "از تاریخ",
    to: "تا تاریخ",
    search: "جستجو در گزارش...",
    reset: "پاک کردن فلتر",
    export: "خروجی Excel",
    print: "پرنت",
    reportTitle: "گزارش",
    dateRange: "بازه تاریخ",
    generatedOn: "تاریخ تهیه",
    records: "ریکارد",
    total: "جمله",
    paid: "پرداخت",
    remaining: "باقی‌مانده",
    invoice: "بل فروش",
    bill: "بل نمبر",
    customer: "مشتری",
    supplier: "تأمین‌کننده",
    items: "اقلام",
    date: "تاریخ",
    paymentType: "نوع پرداخت",
    cashPayment: "نقدی",
    installment: "قسطی",
    product: "دوا / محصول",
    group: "گروپ",
    manufacturer: "شرکت سازنده",
    currentStock: "موجودی فعلی",
    status: "وضعیت",
    inStock: "موجود",
    outOfStock: "خلاص شده",
    noRows: "برای فلتر فعلی هیچ ریکاردی وجود ندارد.",
    summarySales: "فروش در بازه",
    summaryPurchases: "خرید در بازه",
    summaryStock: "مجموع واحد موجود",
    summaryProducts: "تعداد محصولات",
  },
  ps: {
    title: "راپورونه",
    subtitle: "د درملتون د ورځني مدیریت لپاره ساده او ګټور راپورونه.",
    sales: "د خرڅلاو راپور",
    salesHint: "بلونه، پېرودونکي، ټول مبلغ، تادیه او پاتې پیسې.",
    purchases: "د پېرود راپور",
    purchasesHint: "د عرضه کوونکو پېرودونه، تادیه او پاتې پورونه.",
    inventory: "د موجودۍ راپور",
    inventoryHint: "د ګدام د حقیقي حرکتونو له مخې د درملو اوسنی موجودي.",
    accounts: "ترلاسه کېدونکي او ورکول کېدونکي",
    accountsHint: "وګورئ پېرودونکي څومره پوروړي دي او موږ عرضه کوونکو ته څومره پوروړي یو.",
    cash: "نغدي جریان",
    cashHint: "نغدي ترلاسه کول، تادیات او بیلانس د اسعارو له مخې وګورئ.",
    journal: "عمومي ژورنال",
    journalHint: "د حسابدارۍ ژورنال او د لیجرونو لنډیز پرانیزئ.",
    open: "پرانستل",
    reportWorkspace: "د راپور ساحه",
    allDates: "ټولې نېټې",
    from: "له نېټې",
    to: "تر نېټې",
    search: "په راپور کې لټون...",
    reset: "فلټر پاکول",
    export: "Excel صادرول",
    print: "پرنټ",
    reportTitle: "راپور",
    dateRange: "د نېټې موده",
    generatedOn: "د جوړېدو نېټه",
    records: "ریکارډونه",
    total: "ټول",
    paid: "تادیه",
    remaining: "پاتې",
    invoice: "د خرڅلاو بل",
    bill: "بل نمبر",
    customer: "پېرودونکی",
    supplier: "عرضه کوونکی",
    items: "توکي",
    date: "نېټه",
    paymentType: "د تادیې ډول",
    cashPayment: "نغدي",
    installment: "قسطی",
    product: "درمل / محصول",
    group: "ګروپ",
    manufacturer: "جوړوونکی شرکت",
    currentStock: "اوسنۍ موجودي",
    status: "حالت",
    inStock: "موجود",
    outOfStock: "خلاص",
    noRows: "د اوسني فلټر لپاره ریکارډ نشته.",
    summarySales: "په موده کې خرڅلاو",
    summaryPurchases: "په موده کې پېرود",
    summaryStock: "ټول موجود واحدونه",
    summaryProducts: "محصولات",
  },
};

function inRange(value, from, to) {
  const date = dateOnly(value);
  if (from && (!date || date < from)) return false;
  if (to && (!date || date > to)) return false;
  return true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function exportExcel(filename, title, columns, rows, summary, direction = "ltr") {
  const tableHead = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const tableBody = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;direction:${direction};}
    h2{margin:0 0 12px;} .summary{margin:0 0 14px;font-weight:700;}
    table{border-collapse:collapse;width:100%;} th,td{border:1px solid #bfc7d1;padding:7px 9px;text-align:${direction === "rtl" ? "right" : "left"};}
    th{background:#eef2f6;font-weight:700;}
  </style></head><body><h2>${escapeHtml(title)}</h2><div class="summary">${escapeHtml(summary.primaryLabel)}: ${escapeHtml(summary.primary)} &nbsp;&nbsp; ${escapeHtml(summary.secondaryLabel)}: ${escapeHtml(summary.secondary)}</div><table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table></body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printReport({ companyName, subtitle, title, columns, rows, summary, fromDate, toDate, direction, labels }) {
  const popup = window.open("", "_blank", "width=1100,height=820");
  if (!popup) return;
  const tableHead = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const tableBody = rows.length
    ? rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${columns.length}" class="empty">—</td></tr>`;
  const rangeText = fromDate || toDate ? `${fromDate || "—"}  —  ${toDate || "—"}` : "—";
  popup.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page{size:A4 landscape;margin:12mm;} *{box-sizing:border-box;} body{margin:0;color:#111827;font-family:Arial,Tahoma,sans-serif;direction:${direction};font-size:11px;}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111827;padding-bottom:10px;margin-bottom:12px;gap:20px;}
    .brand h1{font-size:19px;margin:0 0 3px}.brand p{margin:0;color:#6b7280;font-size:10px}.report{text-align:${direction === "rtl" ? "left" : "right"};}.report h2{margin:0 0 4px;font-size:16px}.report p{margin:2px 0;color:#4b5563;}
    .summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}.summary div{border:1px solid #d1d5db;padding:8px 10px;border-radius:6px;background:#f9fafb}.summary small{display:block;color:#6b7280;margin-bottom:3px}.summary strong{font-size:14px}
    table{width:100%;border-collapse:collapse;} th,td{border:1px solid #cbd5e1;padding:6px 7px;text-align:${direction === "rtl" ? "right" : "left"};white-space:nowrap;} th{background:#e5e7eb;font-weight:700;font-size:10px}.empty{text-align:center;color:#6b7280;padding:24px}.foot{margin-top:10px;padding-top:8px;border-top:1px solid #d1d5db;color:#6b7280;font-size:9px;display:flex;justify-content:space-between;}
  </style></head><body>
    <div class="head"><div class="brand"><h1>${escapeHtml(companyName)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="report"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(labels.dateRange)}: ${escapeHtml(rangeText)}</p><p>${escapeHtml(labels.generatedOn)}: ${escapeHtml(new Date().toLocaleString())}</p></div></div>
    <div class="summary"><div><small>${escapeHtml(summary.primaryLabel)}</small><strong>${escapeHtml(summary.primary)}</strong></div><div><small>${escapeHtml(summary.secondaryLabel)}</small><strong>${escapeHtml(summary.secondary)}</strong></div></div>
    <table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>
    <div class="foot"><span>${escapeHtml(companyName)}</span><span>${escapeHtml(title)}</span></div>
    <script>window.onload=()=>{window.print();};<\/script>
  </body></html>`);
  popup.document.close();
}

export default function Reports() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [active, setActive] = useState("sales");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [products] = useJsonCollection("products");
  const [stockMovements] = useJsonCollection("stockMovements");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [productGroups] = useJsonCollection("productGroups");
  const [settings] = useJsonCollection("settings");

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const currentSettings = settings[0] || {};
  const companyName = currentSettings.companyName || "APG";
  const companySubtitle = currentSettings.subTitle || currentSettings.subtitle || "Pharmacy & Medicine Management System";

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const manufacturerName = (product) => {
    const id = product?.manufacturerId || product?.companyId;
    const manufacturer = manufacturers.find((item) => String(item.id) === String(id));
    return manufacturer?.manufacturerName || manufacturer?.name || manufacturer?.companyName || product?.manufacturerName || product?.companyName || "—";
  };

  const salesRows = useMemo(() => sales
    .filter((row) => inRange(row.saleDate || row.createdAt, fromDate, toDate))
    .map((row) => ({
      invoice: row.invoiceNumber || "—",
      customer: row.customerName || "—",
      items: row.items?.length || 0,
      total: money(row.totalAmount),
      paid: money(row.paidAmount),
      remaining: money(row.remainingAmount),
      paymentType: row.paymentMode === "installment" ? t.installment : t.cashPayment,
      date: dateOnly(row.saleDate || row.createdAt),
      _raw: row,
    })), [sales, fromDate, toDate, t]);

  const purchaseRows = useMemo(() => purchases
    .filter((row) => inRange(row.purchaseDate || row.createdAt, fromDate, toDate))
    .map((row) => ({
      bill: row.billNumber || "—",
      supplier: row.supplierName || "—",
      items: row.itemCount || row.items?.length || 0,
      total: money(row.totalAmount),
      paid: money(row.paidAmount),
      remaining: money(row.remainingAmount),
      paymentType: row.paymentMode === "installment" ? t.installment : t.cashPayment,
      date: dateOnly(row.purchaseDate || row.createdAt),
      _raw: row,
    })), [purchases, fromDate, toDate, t]);

  const inventoryRows = useMemo(() => products.map((product) => {
    const stock = getProductStock(stockMovements, product.id, 0);
    return {
      product: product.productName || product.name || "—",
      group: groupNameById(productGroups, product.groupId, product.groupName || product.group || "—") || "—",
      manufacturer: manufacturerName(product),
      currentStock: money(stock),
      status: stock > 0 ? t.inStock : t.outOfStock,
      _stock: stock,
      _raw: product,
    };
  }), [products, stockMovements, manufacturers, productGroups, t]);

  const activeRows = active === "sales" ? salesRows : active === "purchases" ? purchaseRows : inventoryRows;
  const q = search.trim().toLowerCase();
  const filteredRows = activeRows.filter((row) => !q || Object.entries(row)
    .filter(([key]) => !key.startsWith("_"))
    .some(([, value]) => String(value ?? "").toLowerCase().includes(q)));

  const columns = active === "sales" ? [
    { key: "invoice", label: t.invoice }, { key: "customer", label: t.customer }, { key: "items", label: t.items },
    { key: "total", label: t.total }, { key: "paid", label: t.paid }, { key: "remaining", label: t.remaining },
    { key: "paymentType", label: t.paymentType }, { key: "date", label: t.date },
  ] : active === "purchases" ? [
    { key: "bill", label: t.bill }, { key: "supplier", label: t.supplier }, { key: "items", label: t.items },
    { key: "total", label: t.total }, { key: "paid", label: t.paid }, { key: "remaining", label: t.remaining },
    { key: "paymentType", label: t.paymentType }, { key: "date", label: t.date },
  ] : [
    { key: "product", label: t.product }, { key: "group", label: t.group }, { key: "manufacturer", label: t.manufacturer },
    { key: "currentStock", label: t.currentStock }, { key: "status", label: t.status },
  ];

  const summary = useMemo(() => {
    if (active === "sales") {
      const raw = sales.filter((row) => inRange(row.saleDate || row.createdAt, fromDate, toDate));
      return { primary: money(raw.reduce((sum, row) => sum + numeric(row.totalAmount), 0)), secondary: raw.length, primaryLabel: t.summarySales, secondaryLabel: t.records };
    }
    if (active === "purchases") {
      const raw = purchases.filter((row) => inRange(row.purchaseDate || row.createdAt, fromDate, toDate));
      return { primary: money(raw.reduce((sum, row) => sum + numeric(row.totalAmount), 0)), secondary: raw.length, primaryLabel: t.summaryPurchases, secondaryLabel: t.records };
    }
    return {
      primary: money(inventoryRows.reduce((sum, row) => sum + numeric(row._stock), 0)),
      secondary: products.length,
      primaryLabel: t.summaryStock,
      secondaryLabel: t.summaryProducts,
    };
  }, [active, sales, purchases, inventoryRows, products.length, fromDate, toDate, t]);

  const reportCards = [
    { key: "sales", icon: TrendingUp, title: t.sales, hint: t.salesHint, onClick: () => setActive("sales") },
    { key: "purchases", icon: ShoppingCart, title: t.purchases, hint: t.purchasesHint, onClick: () => setActive("purchases") },
    { key: "inventory", icon: Boxes, title: t.inventory, hint: t.inventoryHint, onClick: () => setActive("inventory") },
    { key: "accounts", icon: ReceiptText, title: t.accounts, hint: t.accountsHint, onClick: () => navigate("/receivables-payables") },
    { key: "cash", icon: Wallet, title: t.cash, hint: t.cashHint, onClick: () => navigate("/cash-flow") },
    { key: "journal", icon: Landmark, title: t.journal, hint: t.journalHint, onClick: () => navigate("/general-journal") },
  ];

  const activeTitle = active === "sales" ? t.sales : active === "purchases" ? t.purchases : t.inventory;
  const resetFilters = () => { setFromDate(""); setToDate(""); setSearch(""); };
  const handlePrint = () => printReport({
    companyName,
    subtitle: companySubtitle,
    title: activeTitle,
    columns,
    rows: filteredRows,
    summary,
    fromDate,
    toDate,
    direction,
    labels: t,
  });
  const handleExcel = () => exportExcel(`${active}-report.xls`, activeTitle, columns, filteredRows, summary, direction);

  return (
    <div className="ph-reports" dir={direction}>
      <div className="ph-reports-head">
        <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      </div>

      <section className="ph-report-launcher">
        {reportCards.map(({ key, icon: Icon, title, hint, onClick }) => (
          <button key={key} type="button" className={`ph-report-card ${active === key ? "active" : ""}`} onClick={onClick}>
            <span className="ph-report-card-icon"><Icon size={20} /></span>
            <div><strong>{title}</strong><p>{hint}</p></div>
            <ArrowRight className="ph-report-card-arrow" size={17} />
          </button>
        ))}
      </section>

      <section className="ph-report-workspace">
        <div className="ph-report-workspace-head">
          <div>
            <span><BarChart3 size={15} />{t.reportWorkspace}</span>
            <h2>{activeTitle}</h2>
          </div>
          <div className="ph-report-actions">
            <button type="button" className="ph-report-action ph-report-print" onClick={handlePrint}>
              <Printer size={16} />{t.print}
            </button>
            <button type="button" className="ph-report-action ph-report-excel" onClick={handleExcel}>
              <FileSpreadsheet size={16} />{t.export}
            </button>
          </div>
        </div>

        <div className="ph-report-summary">
          <div><small>{summary.primaryLabel}</small><strong>{summary.primary}</strong></div>
          <div><small>{summary.secondaryLabel}</small><strong>{summary.secondary}</strong></div>
        </div>

        <div className="ph-report-filters">
          {active !== "inventory" && <>
            <label><span>{t.from}</span><ShamsiDateInput value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label><span>{t.to}</span><ShamsiDateInput value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
          </>}
          <label className="ph-report-search"><span>{t.search}</span><div><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} /></div></label>
          <button type="button" className="ph-report-reset" onClick={resetFilters}>{t.reset}</button>
        </div>

        <div className="ph-report-table-wrap">
          <table>
            <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row._raw?.id || index} onClick={() => {
                  if (active === "sales" && row._raw?.id) navigate(`/sale-detail/${row._raw.id}`);
                  if (active === "inventory" && row._raw?.id) navigate(`/product-detail/${row._raw.id}`);
                }} className={active !== "purchases" ? "clickable" : ""}>
                  {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
                </tr>
              ))}
              {!filteredRows.length && <tr><td colSpan={columns.length} className="ph-report-empty"><FileText size={22} /><span>{t.noRows}</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
