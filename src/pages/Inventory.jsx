import PartySearchSelect from "../components/PartySearchSelect";
import { createPortal } from "react-dom";
import { afghanToGregorian, formatAfghanDate } from "../utils/afghanDate";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Layers3,
  PackageCheck,
  PackageX,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  BarChart3,
  Table2,
  SlidersHorizontal, X, Plus, Minus, PackagePlus, FileSpreadsheet,
} from "lucide-react";
import { notify } from "../utils/notify";
import { todayDateValue } from "../utils/afghanDate";
import { useJsonCollection } from "../hooks/useJsonCollection";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getProductBatchBalances,
  allocateProductBatchesFEFO,
  getProductStock,
  getProductStockTotals,
  stockNumber,
} from "../utils/stock";
import { countryNameById, groupNameById } from "../utils/productMasterData";
import "./Inventory.css";
import "./InventoryAdjustment.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    title: "Inventory",
    subtitle: "Review medicine stock, batches and stock movement history.",
    totalProducts: "Total Medicines",
    availableProducts: "In Stock",
    outOfStock: "Out of Stock",
    totalUnits: "Total Pieces",
    recordView: "Records",
    graphView: "Graph",
    mainUnit: "Main Unit",
    pieces: "Pieces",
    stockOverview: "Stock Overview",
    stockOverviewHint: "Current stock, total received and total issued for all medicines.",
    currentPieces: "Current pieces",
    receivedPieces: "Received pieces",
    issuedPieces: "Issued pieces",
    search: "Search medicine, carton size or manufacturer...",
    all: "All",
    available: "Available",
    empty: "Out of stock",
    products: "Stock",
    batches: "Batches",
    movements: "Movements",
    product: "Medicine",
    cartonSize: "Carton Size",
    manufacturer: "Manufacturer",
    currentStock: "Current Stock",
    totalIn: "Total In",
    totalOut: "Total Out",
    purchaseCurrency: "Purchase Currency",
    purchasePrice: "Purchase Price",
    salePrice: "Sale Price",
    status: "Status",
    inStock: "In Stock",
    noStock: "Out of Stock",
    view: "View",
    batchNo: "Batch No.",
    expiryDate: "Expiry Date",
    received: "Received",
    issued: "Issued",
    remaining: "Remaining",
    movementDate: "Date",
    movementType: "Movement",
    reference: "Reference",
    stockIn: "Stock In",
    stockOut: "Stock Out",
    balance: "Balance",
    noData: "No inventory records found.",
    noBatches: "No batch records found.",
    noMovements: "No stock movements found.",
    opening: "Opening",
    purchase: "Purchase",
    sale: "Sale",
    purchaseReturn: "Purchase Return",
    saleReturn: "Sale Return",
    adjustment: "Adjustment",
    inventoryReport: "Inventory Report",
    flowIn: "In",
    flowOut: "Out",
    flowBoth: "Both",
    reportDate: "Date",
    reportDetails: "Details",
    reportReady: "Excel report downloaded.",
    reportEmpty: "No inventory movements found for this medicine and direction.",
    reportError: "Could not create the Excel report.",
  },
  fa: {
    title: "موجودی",
    subtitle: "موجودی دواها، بچ‌ها و تاریخچه حرکات گدام را بررسی کنید.",
    totalProducts: "مجموع دواها",
    availableProducts: "دارای موجودی",
    outOfStock: "بدون موجودی",
    totalUnits: "مجموع دانه موجود",
    recordView: "ریکارد",
    graphView: "گراف",
    mainUnit: "واحد اصلی",
    pieces: "دانه",
    stockOverview: "نمای گرافیکی موجودی",
    stockOverviewHint: "موجودی فعلی، مجموع داخل و مجموع خارج همه محصولات.",
    currentPieces: "دانه فعلی",
    receivedPieces: "دانه داخل",
    issuedPieces: "دانه خارج",
    search: "جستجوی دوا، سایز کارتن یا شرکت سازنده...",
    all: "همه",
    available: "موجود",
    empty: "خلاص شده",
    products: "موجودی",
    batches: "بچ‌ها",
    movements: "حرکات موجودی",
    product: "نام دوا",
    cartonSize: "سایز کارتن",
    manufacturer: "شرکت سازنده",
    currentStock: "موجودی فعلی",
    totalIn: "مجموع داخل",
    totalOut: "مجموع خارج",
    purchaseCurrency: "ارز خرید",
    purchasePrice: "قیمت خرید",
    salePrice: "قیمت فروش",
    status: "حالت",
    inStock: "موجود",
    noStock: "خلاص شده",
    view: "مشاهده",
    batchNo: "شماره بچ",
    expiryDate: "تاریخ انقضا",
    received: "داخل شده",
    issued: "خارج شده",
    remaining: "باقی‌مانده",
    movementDate: "تاریخ",
    movementType: "نوع حرکت",
    reference: "مرجع",
    stockIn: "داخل",
    stockOut: "خارج",
    balance: "بیلانس",
    noData: "هیچ ریکارد موجودی پیدا نشد.",
    noBatches: "هیچ ریکارد بچ پیدا نشد.",
    noMovements: "هیچ حرکت موجودی پیدا نشد.",
    opening: "موجودی افتتاحیه",
    purchase: "خریداری",
    sale: "فروش",
    purchaseReturn: "برگشت خرید",
    saleReturn: "برگشت فروش",
    adjustment: "اصلاح موجودی",
    inventoryReport: "راپور موجودی",
    flowIn: "آمد",
    flowOut: "رفت",
    flowBoth: "هر دو",
    reportDate: "تاریخ",
    reportDetails: "تفصیلات",
    reportReady: "راپور Excel دانلود شد.",
    reportEmpty: "برای این دوا و جهت انتخاب‌شده حرکتی ثبت نشده است.",
    reportError: "ساخت راپور Excel ناموفق شد.",
  },
  ps: {
    title: "موجودي",
    subtitle: "د درملو موجودي، بچونه او د موجودۍ د حرکتونو تاریخ وګورئ.",
    totalProducts: "ټول درمل",
    availableProducts: "موجود درمل",
    outOfStock: "خلاص شوي",
    totalUnits: "ټولې موجودې دانې",
    recordView: "ریکارډ",
    graphView: "ګراف",
    mainUnit: "اصلي واحد",
    pieces: "دانې",
    stockOverview: "د موجودۍ ګراف",
    stockOverviewHint: "د ټولو محصولاتو اوسنۍ موجودي، ټول داخل او ټول خارج.",
    currentPieces: "اوسنۍ دانې",
    receivedPieces: "داخل دانې",
    issuedPieces: "خارج دانې",
    search: "د درمل، کارتن سایز یا تولیدوونکي لټون...",
    all: "ټول",
    available: "موجود",
    empty: "خلاص",
    products: "موجودي",
    batches: "بچونه",
    movements: "د موجودۍ حرکتونه",
    product: "درمل",
    cartonSize: "د کارتن سایز",
    manufacturer: "تولیدوونکی",
    currentStock: "اوسنۍ موجودي",
    totalIn: "ټول داخل",
    totalOut: "ټول خارج",
    purchaseCurrency: "د پېرود اسعار",
    purchasePrice: "د پېرود بیه",
    salePrice: "د خرڅلاو بیه",
    status: "حالت",
    inStock: "موجود",
    noStock: "خلاص",
    view: "کتل",
    batchNo: "د بچ نمبر",
    expiryDate: "د ختمېدو نېټه",
    received: "داخل شوی",
    issued: "خارج شوی",
    remaining: "پاتې",
    movementDate: "نېټه",
    movementType: "حرکت",
    reference: "مرجع",
    stockIn: "داخل",
    stockOut: "خارج",
    balance: "بیلانس",
    noData: "د موجودۍ کوم ریکارډ ونه موندل شو.",
    noBatches: "د بچ کوم ریکارډ ونه موندل شو.",
    noMovements: "د موجودۍ کوم حرکت ونه موندل شو.",
    opening: "پرانېستونکې موجودي",
    purchase: "پېرود",
    sale: "خرڅلاو",
    purchaseReturn: "د پېرود بېرته ستنول",
    saleReturn: "د خرڅلاو بېرته ستنول",
    adjustment: "د موجودۍ اصلاح",
    inventoryReport: "د موجودۍ راپور",
    flowIn: "داخل",
    flowOut: "خارج",
    flowBoth: "دواړه",
    reportDate: "نېټه",
    reportDetails: "تفصیلات",
    reportReady: "د Excel راپور ښکته شو.",
    reportEmpty: "د دې درمل او ټاکل شوي لوري لپاره د موجودۍ حرکت نشته.",
    reportError: "د Excel راپور جوړ نه شو.",
  },
};

const movementLabelKey = (type = "") => {
  if (type === "purchase") return "purchase";
  if (type === "sale") return "sale";
  if (type === "purchase-return") return "purchaseReturn";
  if (type === "sale-return") return "saleReturn";
  if (type === "opening") return "opening";
  return "adjustment";
};

const movementOrderValue = (movement) => {
  const raw = String(movement?.movementDate || movement?.createdAt || "").trim();
  const afghan = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (afghan && Number(afghan[1]) < 1700) {
    const gregorian = afghanToGregorian(afghan[1], afghan[2], afghan[3]);
    if (gregorian) return Date.parse(`${gregorian}T00:00:00Z`) || 0;
  }
  return Date.parse(raw) || 0;
};

const unitLabels = {
  en: { carton: "Carton", box: "Box", pack: "Pack", bottle: "Bottle", strip: "Strip", piece: "Piece", dozen: "Dozen", tube: "Tube", sachet: "Sachet" },
  fa: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "استریپ", piece: "دانه", dozen: "درجن", tube: "تیوب", sachet: "ساشه" },
  ps: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "سټریپ", piece: "دانه", dozen: "درجن", tube: "ټیوب", sachet: "ساشه" },
};

const productUnitInfo = (product, language = "en") => {
  const unit = product?.productUnit || "piece";
  const multiplier = Math.max(1, stockNumber(product?.piecesPerUnit || product?.cartonSize || (unit === "dozen" ? 12 : 1)));
  return { unit, multiplier, label: unitLabels[language]?.[unit] || unitLabels.en[unit] || unit };
};

const formatQuantityPair = (pieces, product, language) => {
  const value = stockNumber(pieces);
  const { multiplier, label } = productUnitInfo(product, language);
  const mainUnits = value / multiplier;
  const mainText = Number.isInteger(mainUnits) ? mainUnits.toLocaleString("en-US") : mainUnits.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return { mainText, piecesText: value.toLocaleString("en-US"), label };
};


function InventoryAreaTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const items = [
    { key: "current", label: t.currentPieces, pair: row.stockPair, color: "#94a3b8" },
    { key: "received", label: t.receivedPieces, pair: row.inPair, color: "#16a34a" },
    { key: "issued", label: t.issuedPieces, pair: row.outPair, color: "#ef4444" },
  ];

  return (
    <div className="inventory-recharts-tooltip">
      <strong>{label || row.name || "—"}</strong>
      <div className="inventory-recharts-tooltip-list">
        {items.map((item) => (
          <div key={item.key} className="inventory-recharts-tooltip-row">
            <span>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
            <b>{item.pair ? `${item.pair.mainText} ${item.pair.label} / ${item.pair.piecesText} ${t.pieces}` : "0"}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Inventory() {
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [stockMovements, setStockMovements] = useJsonCollection("stockMovements");
  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseItems] = useJsonCollection("purchaseItems");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [productGroups] = useJsonCollection("productGroups");
  const [productCountries] = useJsonCollection("countries");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("products");
  const [viewMode, setViewMode] = useState("record");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [reportMenu, setReportMenu] = useState(null);
  const [reportExporting, setReportExporting] = useState(false);
  useEffect(() => {
    if (!adjustOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    document.body.style.overflow = "hidden";
    if (root) root.inert = true;
    const dialog = document.querySelector(".inventory-adjust-dialog");
    dialog?.querySelector("button")?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const controls = [...document.querySelectorAll('.inventory-adjust-dialog button:not(:disabled), .inventory-adjust-dialog select:not(:disabled), .inventory-adjust-dialog input:not(:disabled), .inventory-adjust-dialog textarea:not(:disabled), [data-entry-picker-popup] button:not(:disabled), [data-entry-picker-popup] input')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = previousInert;
      document.removeEventListener("keydown", trapFocus);
      previousFocus?.focus?.();
    };
  }, [adjustOpen]);
  const newAdjustmentRow = () => ({ id: `${Date.now()}-${Math.random()}`, productId: "", add: "", subtract: "", details: "" });
  const [adjustRows, setAdjustRows] = useState(() => Array.from({ length: 6 }, newAdjustmentRow));
  const [adjustSaving, setAdjustSaving] = useState(false);
  const adjustNumber = useMemo(() => `ADJ${String(new Set(stockMovements.filter((item) => item.referenceType === "adjustment").map((item) => item.referenceNumber || item.referenceId)).size + 1).padStart(5, "0")}`, [stockMovements]);
  const updateAdjustmentRow = (id, patch) => setAdjustRows((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const saveAdjustment = async () => {
    const prepared = adjustRows.filter((row) => row.productId || row.add || row.subtract || row.details.trim());
    if (!prepared.length) return notify("حداقل یک جنس را برای اصلاح انتخاب کنید.", "warning");
    const productsMap = new Map(products.map((product) => [String(product.id), product]));
    const duplicateCheck = new Set();
    for (const row of prepared) {
      const plus = Number(row.add || 0), minus = Number(row.subtract || 0);
      if (!productsMap.has(String(row.productId)) || !Number.isSafeInteger(plus) || !Number.isSafeInteger(minus) || plus < 0 || minus < 0 || (plus > 0) === (minus > 0) || !row.details.trim()) return notify("برای هر ردیف، جنس، تفصیلات و فقط یک مقدار مثبت در + یا - درج کنید.", "warning");
      if (duplicateCheck.has(String(row.productId))) return notify("هر جنس را تنها یک بار در همین اصلاح ثبت کنید.", "warning");
      duplicateCheck.add(String(row.productId));
      if (minus > getProductStock(stockMovements, row.productId, 0)) return notify("مقدار خروج بیشتر از موجودی فعلی جنس است.", "warning");
      if (minus > 0 && allocateProductBatchesFEFO(stockMovements, row.productId, minus).unallocated > 0) return notify("بچ‌های موجودی برای کسر این مقدار کافی نیستند.", "warning");
    }
    const now = new Date().toISOString();
    const referenceId = `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const movements = prepared.flatMap((row, index) => {
      const plus = Number(row.add || 0), minus = Number(row.subtract || 0);
      const batches = minus > 0 ? allocateProductBatchesFEFO(stockMovements, row.productId, minus) : null;
      if (batches?.unallocated > 0) return [];
      const portions = plus > 0 ? [{ batchNo: "UNBATCHED", quantity: plus }] : batches.allocations;
      return portions.map((portion, batchIndex) => ({
        id: `stock-adjustment-${referenceId}-${index + 1}-${batchIndex + 1}`,
        productId: row.productId, referenceType: "adjustment", movementType: "adjustment",
        referenceId, referenceNumber: adjustNumber,
        quantityIn: plus > 0 ? portion.quantity : 0,
        quantityOut: minus > 0 ? portion.quantity : 0,
        movementDate: todayDateValue(), note: row.details.trim(), description: row.details.trim(),
        batchNo: portion.batchNo || "UNBATCHED", expiryDate: portion.expiryDate || "", createdAt: now, updatedAt: now,
      }));
    });
    if (!movements.length) return notify("برای اصلاح منفی موجودی، بچ‌های موجود را بررسی کنید.", "warning");
    setAdjustSaving(true);
    try {
      if (await setStockMovements([...stockMovements, ...movements])) {
        setAdjustOpen(false);
        setAdjustRows(Array.from({ length: 6 }, newAdjustmentRow));
        notify(`${movements.length} ردیف اصلاح موجودی ثبت شد.`, "success");
      }
    } finally { setAdjustSaving(false); }
  };

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    if (!reportMenu) return undefined;
    const closeOutside = (event) => {
      if (event.target.closest?.(".inventory-product-report-menu, .inventory-product-report-trigger")) return;
      setReportMenu(null);
    };
    const closeEscape = (event) => { if (event.key === "Escape") setReportMenu(null); };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeEscape);
    };
  }, [reportMenu]);

  const downloadInventoryExcel = async ({ title, subtitle, headers, rows, filename, reportSheets }) => {
    if (reportExporting) return;
    setReportExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheets = reportSheets || [{ title, subtitle, headers, rows }];
      sheets.forEach((sheetData, index) => {
        const sheetTitle = sheetData.title || title;
        const worksheet = workbook.addWorksheet(sheetTitle.replace(/[\\/*?:\[\]]/g, " ").slice(0, 31) || `Inventory ${index + 1}`, { views: [{ rightToLeft: direction === "rtl" }] });
        worksheet.addRow([sheetTitle]);
        worksheet.mergeCells(1, 1, 1, sheetData.headers.length);
        let headerRow = 2;
        if (sheetData.subtitle) {
          worksheet.addRow([sheetData.subtitle]);
          worksheet.mergeCells(2, 1, 2, sheetData.headers.length);
          worksheet.addRow([]);
          headerRow = 4;
        }
        worksheet.addRow(sheetData.headers);
        sheetData.rows.forEach((values) => worksheet.addRow(values));
        worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF08735A" } };
        if (sheetData.subtitle) worksheet.getRow(2).font = { italic: true, color: { argb: "FF475569" } };
        worksheet.getRow(headerRow).font = { bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(headerRow).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
        worksheet.columns = (sheetData.widths || sheetData.headers.map(() => 20)).map((width) => ({ width }));
        worksheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: sheetData.headers.length } };
        worksheet.views = [{ rightToLeft: direction === "rtl", state: "frozen", ySplit: headerRow }];
        (sheetData.dateColumns || []).forEach((column) => {
          worksheet.getColumn(column).numFmt = "yyyy-mm-dd";
        });
      });
      const data = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      notify(t.reportReady, "success");
    } catch (error) {
      console.error("Inventory Excel report failed", error);
      notify(t.reportError, "error");
    } finally {
      setReportExporting(false);
    }
  };

  const exportCurrentInventory = () => {
    if (!filteredRows.length) return notify(t.noData, "warning");
    return downloadInventoryExcel({
      title: t.inventoryReport,
      subtitle: t.stockOverviewHint,
      headers: [t.product, t.cartonSize, t.manufacturer, t.currentPieces, t.receivedPieces, t.issuedPieces, t.purchaseCurrency, t.purchasePrice, t.salePrice, t.status],
      rows: filteredRows.map((row) => [
        row.product.productName || "—",
        row.product.cartonSize || row.product.piecesPerUnit || "—",
        row.manufacturer,
        stockNumber(row.stock),
        stockNumber(row.totals.quantityIn),
        stockNumber(row.totals.quantityOut),
        String(row.product.purchaseCurrency || row.product.unit || "AFN").toUpperCase(),
        Number(row.product.purchasePrice || 0),
        Number(row.product.salePrice || 0),
        row.stock > 0 ? t.inStock : t.noStock,
      ]),
      filename: `inventory-report-${todayDateValue().replaceAll("/", "-")}.xlsx`,
    });
  };

  const openProductReportMenu = (event, productId) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 112;
    const left = direction === "rtl" ? rect.left : rect.right - width;
    setReportMenu({ productId, top: Math.min(rect.bottom + 4, window.innerHeight - 118), left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  };

  const exportProductMovements = (productId, flow) => {
    const product = products.find((item) => String(item.id) === String(productId));
    if (!product) return;
    let balance = 0;
    const allMovements = stockMovements
      .filter((movement) => String(movement.productId) === String(productId))
      .sort((a, b) => movementOrderValue(a) - movementOrderValue(b) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
      .map((movement) => {
        balance += stockNumber(movement.quantityIn) - stockNumber(movement.quantityOut);
        return { movement, balance };
      });
    const selected = allMovements.filter(({ movement }) => flow === "both"
      || (flow === "in" && stockNumber(movement.quantityIn) > 0)
      || (flow === "out" && stockNumber(movement.quantityOut) > 0));
    if (!selected.length) return notify(t.reportEmpty, "warning");
    const name = product.productName || "medicine";
    const safeName = name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60);
    const country = countryNameById(productCountries, product.countryId, language, product.madeIn || "—");
    const company = manufacturerName(product);
    const gregorianDate = (movement) => {
      const raw = String(movement.movementDate || movement.createdAt || "").slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`) : null;
    };
    const saleFor = (movement) => sales.find((row) => String(row.id) === String(movement.referenceId));
    const purchaseFor = (movement) => purchases.find((row) => String(row.id) === String(movement.referenceId));
    const saleItemFor = (movement, sale) => sale?.items?.find((item) => String(item.productId) === String(productId));
    const purchaseItemFor = (movement) => purchaseItems.find((item) => String(item.purchaseId) === String(movement.referenceId) && String(item.productId) === String(productId));
    const groupMovements = (rows, quantityField) => {
      const groups = new Map();
      rows.forEach(({ movement }) => {
        const key = `${movement.referenceType || ""}:${movement.referenceId || movement.referenceNumber || movement.id}`;
        const existing = groups.get(key);
        if (existing) existing.quantity += stockNumber(movement[quantityField]);
        else groups.set(key, { movement, quantity: stockNumber(movement[quantityField]) });
      });
      return [...groups.values()];
    };
    const outgoingRows = groupMovements(selected.filter(({ movement }) => stockNumber(movement.quantityOut) > 0), "quantityOut").map(({ movement, quantity }) => {
      const sale = saleFor(movement);
      const item = saleItemFor(movement, sale);
      const unitPrice = stockNumber(item?.salePrice ?? movement.unitPrice ?? product.salePrice);
      const discountPercent = stockNumber(item?.discountPercent);
      const totalPrice = item?.lineTotal != null ? stockNumber(item.lineTotal) : unitPrice * quantity * (1 - discountPercent / 100);
      const date = gregorianDate(movement);
      const account = sale?.customerName || (movement.referenceType === "adjustment" ? t.adjustment : "—");
      return [movement.referenceNumber || sale?.invoiceNumber || "—", account, date, formatAfghanDate(movement.movementDate || movement.createdAt?.slice?.(0, 10) || "—"), name, country, company, unitPrice, discountPercent, totalPrice, quantity, quantity];
    });
    const incomingRows = groupMovements(selected.filter(({ movement }) => stockNumber(movement.quantityIn) > 0), "quantityIn").map(({ movement, quantity }) => {
      const purchase = purchaseFor(movement);
      const item = purchaseItemFor(movement);
      const date = gregorianDate(movement);
      return [movement.referenceNumber || purchase?.cardNumber || purchase?.billNumber || "—", purchase?.supplierName || (movement.referenceType === "opening" ? t.opening : "—"), date, formatAfghanDate(movement.movementDate || movement.createdAt?.slice?.(0, 10) || "—"), name, country, company, stockNumber(item?.purchasePrice ?? movement.unitCost ?? product.purchasePrice), quantity, quantity];
    });
    const outReport = { title: "راپور فروش یا رفت جنس", headers: ["Invoice No", "Account Name", "Date-M", "Date-S", "Item Name Dari", "Made", "Company", "Unit Price", "Disc %", "Total Price", "Qty", "Total Out"], rows: outgoingRows, widths: [16, 32, 14, 14, 30, 16, 22, 14, 12, 16, 12, 14], dateColumns: [3] };
    const inReport = { title: "راپور خرید یا آمد جنس", headers: ["Purchase Bill No", "Account Name", "Date-M", "Date-S", "Item Name Dari", "Made", "Company", "Unit Cost", "Qty", "Total In"], rows: incomingRows, widths: [20, 32, 14, 14, 30, 16, 22, 14, 12, 14], dateColumns: [3] };
    const flowLabel = flow === "in" ? t.flowIn : flow === "out" ? t.flowOut : t.flowBoth;
    return downloadInventoryExcel({
      title: `${t.inventoryReport} · ${name}`,
      reportSheets: flow === "both" ? [outReport, inReport] : [flow === "in" ? inReport : outReport],
      filename: `inventory-movements-${safeName}-${flowLabel}-${todayDateValue().replaceAll("/", "-")}.xlsx`,
    });
  };

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const manufacturerName = (product) => {
    const id = product.manufacturerId || product.companyId;
    const row = manufacturers.find((item) => String(item.id) === String(id));
    return row?.name || row?.companyName || product.company || "—";
  };

  const groupName = (product) => groupNameById(productGroups, product.groupId, product.group || "—") || "—";

  const inventoryRows = useMemo(() => products.map((product) => {
    const stock = getProductStock(stockMovements, product.id, 0);
    const totals = getProductStockTotals(stockMovements, product.id);
    const batches = getProductBatchBalances(stockMovements, product.id).filter((batch) => stockNumber(batch.available) !== 0);
    const activeBatches = batches.filter((batch) => stockNumber(batch.available) > 0);
    const nearestExpiry = activeBatches
      .filter((batch) => batch.expiryDate)
      .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)))[0]?.expiryDate || "";
    return {
      product,
      stock,
      totals,
      batches,
      activeBatches,
      nearestExpiry,
      manufacturer: manufacturerName(product),
      group: groupName(product),
    };
  }), [products, stockMovements, manufacturers, productGroups]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryRows.filter((row) => {
      if (statusFilter === "available" && row.stock <= 0) return false;
      if (statusFilter === "empty" && row.stock > 0) return false;
      if (!q) return true;
      return `${row.product.productName || ""} ${row.group} ${row.manufacturer} ${countryNameById(productCountries, row.product.countryId, language, row.product.madeIn || "")}`.toLowerCase().includes(q);
    });
  }, [inventoryRows, search, statusFilter, productCountries, language]);

  const summary = useMemo(() => ({
    totalProducts: inventoryRows.length,
    availableProducts: inventoryRows.filter((row) => row.stock > 0).length,
    outOfStock: inventoryRows.filter((row) => row.stock <= 0).length,
    totalUnits: inventoryRows.reduce((sum, row) => sum + stockNumber(row.stock), 0),
  }), [inventoryRows]);


  const chartData = useMemo(() => filteredRows.map((row) => {
    const stockPair = formatQuantityPair(row.stock, row.product, language);
    const inPair = formatQuantityPair(row.totals.quantityIn, row.product, language);
    const outPair = formatQuantityPair(row.totals.quantityOut, row.product, language);
    return {
      id: row.product.id,
      name: row.product.productName || "—",
      current: stockNumber(row.stock),
      received: stockNumber(row.totals.quantityIn),
      issued: stockNumber(row.totals.quantityOut),
      stockPair,
      inPair,
      outPair,
    };
  }), [filteredRows, language]);

  const batchRows = useMemo(() => filteredRows.flatMap((row) => row.batches.map((batch) => ({
    ...batch,
    productId: row.product.id,
    productName: row.product.productName,
  }))), [filteredRows]);

  const movementRows = useMemo(() => {
    const productMap = new Map(products.map((product) => [String(product.id), product]));
    const q = search.trim().toLowerCase();
    return [...stockMovements]
      .sort((a, b) => String(b.movementDate || b.createdAt || "").localeCompare(String(a.movementDate || a.createdAt || "")))
      .filter((movement) => {
        const product = productMap.get(String(movement.productId));
        if (!product) return false;
        if (statusFilter === "available") {
          const stock = getProductStock(stockMovements, product.id, 0);
          if (stock <= 0) return false;
        }
        if (statusFilter === "empty") {
          const stock = getProductStock(stockMovements, product.id, 0);
          if (stock > 0) return false;
        }
        if (!q) return true;
        return `${product.productName || ""} ${movement.referenceId || ""} ${movement.batchNo || ""}`.toLowerCase().includes(q);
      })
      .map((movement) => ({ ...movement, product: productMap.get(String(movement.productId)) }));
  }, [products, stockMovements, search, statusFilter]);

  return (
    <div className="inventory-page" dir={direction}>
      <header className="inventory-header">
        <div>
          <span className="inventory-kicker"><Boxes size={16} /> {t.title}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <div className="inventory-adjust-actions">
        <button type="button" onClick={() => navigate("/products")}><Boxes size={17}/> مدیریت محصولات</button>
        <button type="button" onClick={() => navigate("/products?new=1")}><PackagePlus size={17}/> جنس جدید</button>
        <button type="button" onClick={() => setAdjustOpen(true)}><SlidersHorizontal size={17}/> اصلاح موجودی</button>
        <button className="inventory-stock-report-button" type="button" disabled={reportExporting} onClick={exportCurrentInventory}><FileSpreadsheet size={17}/>{reportExporting ? "..." : t.inventoryReport}</button>
      </div>
      {adjustOpen && createPortal(<div className="inventory-adjust-overlay"><section className="inventory-adjust-dialog" role="dialog" aria-modal="true" aria-label="اصلاح موجودی" dir="rtl">
        <header><h2>اصلاح موجودی جنس</h2><button type="button" aria-label="بستن" onClick={() => setAdjustOpen(false)}><X size={20}/></button></header>
        <div className="inventory-adjust-meta"><strong>نمبر ریکارد: {adjustNumber}</strong><span>تاریخ: {formatAfghanDate(todayDateValue())}</span></div>
        <div className="inventory-adjust-table-wrap"><table className="inventory-adjust-table"><thead><tr><th>نام جنس</th><th>موجود</th><th>افزودن +</th><th>کسر -</th><th>تفصیلات</th><th></th></tr></thead><tbody>{adjustRows.map((row) => <tr key={row.id}>
          <td><PartySearchSelect records={products} partyType="product" portal language={language} placeholder="انتخاب جنس..." value={row.productId} onChange={(id) => updateAdjustmentRow(row.id, { productId: id })}/></td>
          <td>{row.productId ? getProductStock(stockMovements, row.productId, 0).toLocaleString("en-US") : "0"}</td>
          <td><input aria-label="افزودن" type="number" lang="en" min="0" step="1" value={row.add} onChange={(event) => updateAdjustmentRow(row.id, { add: event.target.value, subtract: event.target.value ? "" : row.subtract })}/></td>
          <td><input aria-label="کسر" type="number" lang="en" min="0" step="1" value={row.subtract} onChange={(event) => updateAdjustmentRow(row.id, { subtract: event.target.value, add: event.target.value ? "" : row.add })}/></td>
          <td><textarea aria-label="تفصیلات" rows="2" maxLength={300} value={row.details} onChange={(event) => updateAdjustmentRow(row.id, { details: event.target.value })}/></td>
          <td><button type="button" aria-label="حذف ردیف" onClick={() => setAdjustRows((rows) => rows.length === 1 ? [newAdjustmentRow()] : rows.filter((item) => item.id !== row.id))}><X size={15}/></button></td>
        </tr>)}</tbody></table></div>
        <button className="inventory-adjust-add-row" type="button" onClick={() => setAdjustRows((rows) => [...rows, newAdjustmentRow()])}><Plus size={16}/> افزودن ردیف</button>
        <footer><button type="button" onClick={() => setAdjustOpen(false)}>انصراف</button><button type="button" disabled={adjustSaving} onClick={saveAdjustment}>{adjustSaving ? "در حال ثبت..." : "ثبت اصلاح موجودی"}</button></footer>
      </section></div>, document.body)}
      {reportMenu && createPortal(<div className="inventory-product-report-menu" role="menu" style={{ top: reportMenu.top, left: reportMenu.left }}>
        {[["out", t.flowOut], ["in", t.flowIn], ["both", t.flowBoth]].map(([flow, label]) => <button type="button" role="menuitem" key={flow} disabled={reportExporting} onClick={() => { const productId = reportMenu.productId; setReportMenu(null); exportProductMovements(productId, flow); }}>{label}</button>)}
      </div>, document.body)}
      <section className="inventory-stats">
        <article><span className="inventory-stat-icon"><Layers3 /></span><div><small>{t.totalProducts}</small><strong>{summary.totalProducts.toLocaleString("en-US")}</strong></div></article>
        <article><span className="inventory-stat-icon is-positive"><PackageCheck /></span><div><small>{t.availableProducts}</small><strong>{summary.availableProducts.toLocaleString("en-US")}</strong></div></article>
        <article><span className="inventory-stat-icon is-danger"><PackageX /></span><div><small>{t.outOfStock}</small><strong>{summary.outOfStock.toLocaleString("en-US")}</strong></div></article>
        <article><span className="inventory-stat-icon"><Boxes /></span><div><small>{t.totalUnits}</small><strong>{summary.totalUnits.toLocaleString("en-US")}</strong></div></article>
      </section>

      <section className="inventory-card">
        <div className="inventory-toolbar">
          <div className="inventory-tabs" role="tablist">
            <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}><Boxes size={16} />{t.products}</button>
            <button className={activeTab === "batches" ? "active" : ""} onClick={() => setActiveTab("batches")}><Layers3 size={16} />{t.batches}</button>
            <button className={activeTab === "movements" ? "active" : ""} onClick={() => setActiveTab("movements")}><ArrowDownToLine size={16} />{t.movements}</button>
          </div>
          <div className="inventory-toolbar-actions">
            {activeTab === "products" && (
              <div className="inventory-view-toggle" aria-label="Inventory view mode">
                <button className={viewMode === "record" ? "active" : ""} onClick={() => setViewMode("record")}><Table2 size={15} />{t.recordView}</button>
                <button className={viewMode === "graph" ? "active" : ""} onClick={() => setViewMode("graph")}><BarChart3 size={15} />{t.graphView}</button>
              </div>
            )}
            <div className="inventory-status-filter">
              {[["all", t.all], ["available", t.available], ["empty", t.empty]].map(([key, label]) => (
                <button key={key} className={statusFilter === key ? "active" : ""} onClick={() => setStatusFilter(key)}>{label}</button>
              ))}
            </div>
            <label className="inventory-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} /></label>
          </div>
        </div>

        {activeTab === "products" && viewMode === "record" && (
          <div className="inventory-table-wrap">
            <table>
              <thead><tr><th>{t.product}</th><th>{t.cartonSize}</th><th>{t.manufacturer}</th><th>{t.currentStock}</th><th>{t.totalIn}</th><th>{t.totalOut}</th><th>{t.purchaseCurrency}</th><th>{t.purchasePrice}</th><th>{t.salePrice}</th><th>{t.status}</th></tr></thead>
              <tbody>
                {filteredRows.length ? filteredRows.map((row) => {
                  const current = formatQuantityPair(row.stock, row.product, language);
                  const totalIn = formatQuantityPair(row.totals.quantityIn, row.product, language);
                  const totalOut = formatQuantityPair(row.totals.quantityOut, row.product, language);
                  const purchaseCurrency = String(row.product.purchaseCurrency || row.product.unit || "AFN").toUpperCase();
                  const saleCurrency = String(row.product.saleCurrency || row.product.unit || "AFN").toUpperCase();
                  return (
                    <tr key={row.product.id} className="inventory-clickable-row" onClick={() => navigate(`/product-detail/${row.product.id}`)}>
                      <td><div className="inventory-product-cell"><button type="button" className="inventory-product-report-trigger" aria-label={t.inventoryReport} title={t.inventoryReport} onClick={(event) => openProductReportMenu(event, row.product.id)}><FileSpreadsheet size={16}/></button><span className="inventory-product-mark"><Boxes size={16} /></span><div><strong>{row.product.productName || "—"}</strong><small>{row.product.description || ""}</small></div></div></td>
                      <td>{row.product.cartonSize || row.product.piecesPerUnit || "—"}</td>
                      <td className="inventory-manufacturer-cell">{row.manufacturer}</td>
                      <td><div className="inventory-qty-pair"><strong className={row.stock > 0 ? "inventory-stock-positive" : "inventory-stock-zero"}>{current.mainText} {current.label}</strong><small>{current.piecesText} {t.pieces}</small></div></td>
                      <td><div className="inventory-qty-pair"><strong>{totalIn.mainText} {totalIn.label}</strong><small>{totalIn.piecesText} {t.pieces}</small></div></td>
                      <td><div className="inventory-qty-pair"><strong>{totalOut.mainText} {totalOut.label}</strong><small>{totalOut.piecesText} {t.pieces}</small></div></td>
                      <td>{purchaseCurrency}</td>
                      <td><div className="inventory-qty-pair"><strong>{Number(row.product.purchasePrice || 0).toLocaleString("en-US")}</strong><small>{purchaseCurrency}</small></div></td>
                      <td><div className="inventory-qty-pair"><strong>{Number(row.product.salePrice || 0).toLocaleString("en-US")}</strong><small>{saleCurrency}</small></div></td>
                      <td><span className={`inventory-status ${row.stock > 0 ? "is-in" : "is-out"}`}>{row.stock > 0 ? t.inStock : t.noStock}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="10" className="inventory-empty">{t.noData}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "products" && viewMode === "graph" && (
          <div className="inventory-graph-view">
            <div className="inventory-graph-heading">
              <div><span><BarChart3 size={17} /></span><div><strong>{t.stockOverview}</strong><small>{t.stockOverviewHint}</small></div></div>
              <span className="inventory-graph-count">{filteredRows.length.toLocaleString("en-US")}</span>
            </div>
            {chartData.length ? (
              <>
                <div className="inventory-chart-card">
                  <div className="inventory-chart-scroll" style={{ minWidth: `${Math.max(780, chartData.length * 118)}px` }}>
                    <ResponsiveContainer width="100%" height={390}>
                      <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 24, bottom: chartData.length > 7 ? 64 : 38, left: 8 }}
                        className="inventory-recharts"
                      >
                        <defs>
                          <linearGradient id="inventoryAreaCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0.12} />
                          </linearGradient>
                          <linearGradient id="inventoryAreaReceived" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.04} />
                          </linearGradient>
                          <linearGradient id="inventoryAreaIssued" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.24} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="name"
                          interval={chartData.length <= 8 ? 0 : Math.max(0, Math.ceil(chartData.length / 8) - 1)}
                          tickLine={false}
                          axisLine={false}
                          height={chartData.length > 7 ? 70 : 42}
                          angle={chartData.length > 7 ? -24 : 0}
                          textAnchor={chartData.length > 7 ? "end" : "middle"}
                          tick={{ fontSize: 10, fill: "var(--text-muted, #64748b)", fontWeight: 700 }}
                          label={{
                            value: t.product,
                            position: "insideBottom",
                            offset: chartData.length > 7 ? -18 : -6,
                            style: { fill: "var(--text-color, #111827)", fontSize: 12, fontWeight: 800 },
                          }}
                        />
                        <YAxis
                          yAxisId="stock"
                          tickLine={false}
                          axisLine={false}
                          width={58}
                          tick={{ fontSize: 10, fill: "var(--text-muted, #64748b)", fontWeight: 700 }}
                          tickFormatter={(value) => Number(value || 0).toLocaleString("en-US")}
                          label={{
                            value: t.currentPieces,
                            angle: -90,
                            position: "insideLeft",
                            style: { fill: "var(--text-color, #111827)", fontSize: 12, fontWeight: 800 },
                          }}
                        />
                        <YAxis
                          yAxisId="movement"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          width={58}
                          tick={{ fontSize: 10, fill: "var(--text-muted, #64748b)", fontWeight: 700 }}
                          tickFormatter={(value) => Number(value || 0).toLocaleString("en-US")}
                          label={{
                            value: `${t.receivedPieces} / ${t.issuedPieces}`,
                            angle: 90,
                            position: "insideRight",
                            style: { fill: "var(--text-color, #111827)", fontSize: 12, fontWeight: 800 },
                          }}
                        />
                        <Tooltip content={<InventoryAreaTooltip t={t} />} />
                        <Legend
                          verticalAlign="top"
                          align={direction === "rtl" ? "right" : "left"}
                          iconType="circle"
                          iconSize={9}
                          wrapperStyle={{ fontSize: 11, fontWeight: 800, paddingBottom: 10 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="current"
                          yAxisId="stock"
                          name={t.currentPieces}
                          stroke="#94a3b8"
                          strokeWidth={2.5}
                          fill="url(#inventoryAreaCurrent)"
                          activeDot={{ r: 5 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="received"
                          yAxisId="movement"
                          name={t.receivedPieces}
                          stroke="#16a34a"
                          strokeWidth={2.5}
                          fill="url(#inventoryAreaReceived)"
                          activeDot={{ r: 5 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="issued"
                          yAxisId="movement"
                          name={t.issuedPieces}
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          fill="url(#inventoryAreaIssued)"
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="inventory-graph-products">
                  {filteredRows.map((row) => {
                    const current = formatQuantityPair(row.stock, row.product, language);
                    const totalIn = formatQuantityPair(row.totals.quantityIn, row.product, language);
                    const totalOut = formatQuantityPair(row.totals.quantityOut, row.product, language);
                    const maxValue = Math.max(stockNumber(row.totals.quantityIn), stockNumber(row.totals.quantityOut), stockNumber(row.stock), 1);
                    return (
                      <button key={row.product.id} className="inventory-graph-product-card" onClick={() => navigate(`/product-detail/${row.product.id}`)}>
                        <div className="inventory-graph-product-top"><span className="inventory-product-mark"><Boxes size={16} /></span><div><strong>{row.product.productName || "—"}</strong><small>{row.group} · {row.manufacturer}</small></div><span className={`inventory-status ${row.stock > 0 ? "is-in" : "is-out"}`}>{row.stock > 0 ? t.inStock : t.noStock}</span></div>
                        <div className="inventory-graph-main-stock"><small>{t.currentStock}</small><strong>{current.mainText} {current.label}</strong><span>{current.piecesText} {t.pieces}</span></div>
                        <div className="inventory-mini-bars">
                          <div><span><b>{t.totalIn}</b><em>{totalIn.mainText} {totalIn.label} · {totalIn.piecesText} {t.pieces}</em></span><i><u className="is-in" style={{ width: `${Math.max(3, stockNumber(row.totals.quantityIn) / maxValue * 100)}%` }} /></i></div>
                          <div><span><b>{t.totalOut}</b><em>{totalOut.mainText} {totalOut.label} · {totalOut.piecesText} {t.pieces}</em></span><i><u className="is-out" style={{ width: `${Math.max(3, stockNumber(row.totals.quantityOut) / maxValue * 100)}%` }} /></i></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : <div className="inventory-empty">{t.noData}</div>}
          </div>
        )}

        {activeTab === "batches" && (
          <div className="inventory-table-wrap">
            <table>
              <thead><tr><th>{t.product}</th><th>{t.batchNo}</th><th>{t.expiryDate}</th><th>{t.received}</th><th>{t.issued}</th><th>{t.remaining}</th><th>{t.status}</th></tr></thead>
              <tbody>
                {batchRows.length ? batchRows.map((row, index) => (
                  <tr key={`${row.productId}-${row.batchNo}-${index}`} className="inventory-clickable-row" onClick={() => navigate(`/product-detail/${row.productId}`)}>
                    <td><strong>{row.productName || "—"}</strong></td>
                    <td><span className="inventory-batch-badge">{row.batchNo || "UNBATCHED"}</span></td>
                    <td><span className="inventory-date-cell"><CalendarClock size={14} />{formatAfghanDate(row.expiryDate || "—")}</span></td>
                    <td>{stockNumber(row.quantityIn).toLocaleString("en-US")}</td>
                    <td>{stockNumber(row.quantityOut).toLocaleString("en-US")}</td>
                    <td><strong>{stockNumber(row.available).toLocaleString("en-US")}</strong></td>
                    <td><span className={`inventory-status ${stockNumber(row.available) > 0 ? "is-in" : "is-out"}`}>{stockNumber(row.available) > 0 ? t.inStock : t.noStock}</span></td>
                  </tr>
                )) : <tr><td colSpan="7" className="inventory-empty">{t.noBatches}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "movements" && (
          <div className="inventory-table-wrap">
            <table>
              <thead><tr><th>{t.movementDate}</th><th>{t.product}</th><th>{t.movementType}</th><th>{t.reference}</th><th>{t.batchNo}</th><th>{t.stockIn}</th><th>{t.stockOut}</th></tr></thead>
              <tbody>
                {movementRows.length ? movementRows.map((row) => (
                  <tr key={row.id || `${row.referenceType}-${row.referenceId}-${row.productId}-${row.batchNo || ""}`}>
                    <td>{formatAfghanDate(row.movementDate || row.createdAt?.slice?.(0, 10) || "—")}</td>
                    <td><strong>{row.product?.productName || "—"}</strong></td>
                    <td><span className={`inventory-movement-type ${stockNumber(row.quantityIn) > 0 ? "is-in" : "is-out"}`}>{stockNumber(row.quantityIn) > 0 ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}{t[movementLabelKey(row.referenceType)]}</span></td>
                    <td>{row.referenceId || "—"}</td>
                    <td>{row.batchNo || "—"}</td>
                    <td className="inventory-in-number">{stockNumber(row.quantityIn) ? stockNumber(row.quantityIn).toLocaleString("en-US") : "—"}</td>
                    <td className="inventory-out-number">{stockNumber(row.quantityOut) ? stockNumber(row.quantityOut).toLocaleString("en-US") : "—"}</td>
                  </tr>
                )) : <tr><td colSpan="7" className="inventory-empty">{t.noMovements}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
