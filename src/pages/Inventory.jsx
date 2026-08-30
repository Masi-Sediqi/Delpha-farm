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
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { BarPlot } from "@mui/x-charts/BarChart";
import { LineHighlightPlot, LinePlot } from "@mui/x-charts/LineChart";
import { ChartsContainer } from "@mui/x-charts/ChartsContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
import {
  getProductBatchBalances,
  getProductStock,
  getProductStockTotals,
  stockNumber,
} from "../utils/stock";
import { countryNameById, groupNameById } from "../utils/productMasterData";
import "./Inventory.css";

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
    search: "Search medicine, group or manufacturer...",
    all: "All",
    available: "Available",
    empty: "Out of stock",
    products: "Stock",
    batches: "Batches",
    movements: "Movements",
    product: "Medicine",
    group: "Group",
    manufacturer: "Manufacturer",
    currentStock: "Current Stock",
    totalIn: "Total In",
    totalOut: "Total Out",
    batchCount: "Batches",
    nearestExpiry: "Nearest Expiry",
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
    search: "جستجوی دوا، گروپ یا شرکت سازنده...",
    all: "همه",
    available: "موجود",
    empty: "خلاص شده",
    products: "موجودی",
    batches: "بچ‌ها",
    movements: "حرکات موجودی",
    product: "نام دوا",
    group: "گروپ",
    manufacturer: "شرکت سازنده",
    currentStock: "موجودی فعلی",
    totalIn: "مجموع داخل",
    totalOut: "مجموع خارج",
    batchCount: "تعداد بچ",
    nearestExpiry: "نزدیک‌ترین انقضا",
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
    search: "د درمل، ګروپ یا تولیدوونکي لټون...",
    all: "ټول",
    available: "موجود",
    empty: "خلاص",
    products: "موجودي",
    batches: "بچونه",
    movements: "د موجودۍ حرکتونه",
    product: "درمل",
    group: "ګروپ",
    manufacturer: "تولیدوونکی",
    currentStock: "اوسنۍ موجودي",
    totalIn: "ټول داخل",
    totalOut: "ټول خارج",
    batchCount: "بچونه",
    nearestExpiry: "نږدې ختمېدو نېټه",
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

export default function Inventory() {
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [stockMovements] = useJsonCollection("stockMovements");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [productGroups] = useJsonCollection("productGroups");
  const [productCountries] = useJsonCollection("countries");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("products");
  const [viewMode, setViewMode] = useState("record");

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

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

  const chartSeries = useMemo(() => [
    {
      type: "bar",
      yAxisId: "stock",
      label: t.currentPieces,
      color: "#d9dee8",
      data: chartData.map((row) => row.current),
      highlightScope: { highlight: "item" },
      valueFormatter: (value, { dataIndex }) => {
        const pair = chartData[dataIndex]?.stockPair;
        return pair ? `${pair.mainText} ${pair.label} / ${pair.piecesText} ${t.pieces}` : Number(value || 0).toLocaleString("en-US");
      },
    },
    {
      type: "line",
      yAxisId: "movement",
      label: t.issuedPieces,
      color: "#ef4444",
      data: chartData.map((row) => row.issued),
      highlightScope: { highlight: "item" },
      showMark: true,
      valueFormatter: (value, { dataIndex }) => {
        const pair = chartData[dataIndex]?.outPair;
        return pair ? `${pair.mainText} ${pair.label} / ${pair.piecesText} ${t.pieces}` : Number(value || 0).toLocaleString("en-US");
      },
    },
    {
      type: "line",
      yAxisId: "movement",
      label: t.receivedPieces,
      color: "#16a34a",
      data: chartData.map((row) => row.received),
      highlightScope: { highlight: "item" },
      showMark: true,
      valueFormatter: (value, { dataIndex }) => {
        const pair = chartData[dataIndex]?.inPair;
        return pair ? `${pair.mainText} ${pair.label} / ${pair.piecesText} ${t.pieces}` : Number(value || 0).toLocaleString("en-US");
      },
    },
  ], [chartData, t.currentPieces, t.issuedPieces, t.receivedPieces, t.pieces]);

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
              <thead><tr><th>{t.product}</th><th>{t.group}</th><th>{t.manufacturer}</th><th>{t.currentStock}</th><th>{t.totalIn}</th><th>{t.totalOut}</th><th>{t.batchCount}</th><th>{t.nearestExpiry}</th><th>{t.status}</th></tr></thead>
              <tbody>
                {filteredRows.length ? filteredRows.map((row) => {
                  const current = formatQuantityPair(row.stock, row.product, language);
                  const totalIn = formatQuantityPair(row.totals.quantityIn, row.product, language);
                  const totalOut = formatQuantityPair(row.totals.quantityOut, row.product, language);
                  return (
                    <tr key={row.product.id} className="inventory-clickable-row" onClick={() => navigate(`/product-detail/${row.product.id}`)}>
                      <td><div className="inventory-product-cell"><span className="inventory-product-mark"><Boxes size={16} /></span><div><strong>{row.product.productName || "—"}</strong><small>{row.product.description || ""}</small></div></div></td>
                      <td>{row.group}</td>
                      <td>{row.manufacturer}</td>
                      <td><div className="inventory-qty-pair"><strong className={row.stock > 0 ? "inventory-stock-positive" : "inventory-stock-zero"}>{current.mainText} {current.label}</strong><small>{current.piecesText} {t.pieces}</small></div></td>
                      <td><div className="inventory-qty-pair"><strong>{totalIn.mainText} {totalIn.label}</strong><small>{totalIn.piecesText} {t.pieces}</small></div></td>
                      <td><div className="inventory-qty-pair"><strong>{totalOut.mainText} {totalOut.label}</strong><small>{totalOut.piecesText} {t.pieces}</small></div></td>
                      <td>{row.activeBatches.length.toLocaleString("en-US")}</td>
                      <td>{row.nearestExpiry || "—"}</td>
                      <td><span className={`inventory-status ${row.stock > 0 ? "is-in" : "is-out"}`}>{row.stock > 0 ? t.inStock : t.noStock}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="9" className="inventory-empty">{t.noData}</td></tr>}
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
                    <ChartsContainer
                      className="inventory-mui-chart"
                      series={chartSeries}
                      height={390}
                      margin={{ top: 34, right: 62, bottom: chartData.length > 7 ? 78 : 54, left: 66 }}
                      xAxis={[{
                        id: "product",
                        scaleType: "band",
                        data: chartData.map((row) => row.name),
                        height: chartData.length > 7 ? 78 : 54,
                        valueFormatter: (value, context) => context.location === "tick"
                          ? String(value || "—")
                          : `${t.product}: ${value || "—"}`,
                      }]}
                      yAxis={[
                        {
                          id: "stock",
                          scaleType: "linear",
                          position: "left",
                          width: 56,
                          valueFormatter: (value) => Number(value || 0).toLocaleString("en-US"),
                        },
                        {
                          id: "movement",
                          scaleType: "linear",
                          position: "right",
                          width: 56,
                          valueFormatter: (value) => Number(value || 0).toLocaleString("en-US"),
                        },
                      ]}
                    >
                      <ChartsAxisHighlight x="line" />
                      <ChartsGrid horizontal />
                      <BarPlot borderRadius={6} />
                      <LinePlot />
                      <LineHighlightPlot />
                      <ChartsXAxis
                        label={t.product}
                        axisId="product"
                        tickInterval={(_, index) => chartData.length <= 8 || index % Math.ceil(chartData.length / 8) === 0}
                        tickLabelStyle={{
                          fontSize: 10,
                          angle: chartData.length > 7 ? -24 : 0,
                          textAnchor: chartData.length > 7 ? "end" : "middle",
                        }}
                      />
                      <ChartsYAxis
                        label={t.currentPieces}
                        axisId="stock"
                        tickLabelStyle={{ fontSize: 10 }}
                      />
                      <ChartsYAxis
                        label={`${t.receivedPieces} / ${t.issuedPieces}`}
                        axisId="movement"
                        tickLabelStyle={{ fontSize: 10 }}
                      />
                      <ChartsTooltip trigger="axis" />
                    </ChartsContainer>
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
                    <td><span className="inventory-date-cell"><CalendarClock size={14} />{row.expiryDate || "—"}</span></td>
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
                    <td>{row.movementDate || row.createdAt?.slice?.(0, 10) || "—"}</td>
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
