import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeDollarSign,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  PackageCheck,
  Layers3,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import { getProductBatchBalances, getProductStock, getProductStockTotals, legacyProductStock } from "../utils/stock";
import { countryNameById, groupNameById } from "../utils/productMasterData";
import "./ProductDetail.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    back: "Back to Products",
    productDetails: "Product Details",
    subtitle: "Review product information, inventory, purchases and sales in one place.",
    currentStock: "Current Stock",
    totalPurchased: "Total Purchased",
    totalSold: "Total Sold",
    salePrice: "Sale Price",
    overview: "Overview",
    inventory: "Inventory",
    purchases: "Purchases",
    sales: "Sales",
    batches: "Batches",
    batchInventory: "Batch & Expiry Inventory",
    batchNo: "Batch No.",
    expiryDate: "Expiry Date",
    availableQty: "Available Qty",
    receivedQty: "Received",
    issuedQty: "Issued",
    noBatches: "No batch inventory is available for this product yet.",
    specifications: "Product Specifications",
    productName: "Product Name",
    group: "Group",
    cartonSize: "Carton Size",
    productUnit: "Unit",
    productForm: "Product Form",
    unitCarton: "Carton", unitBox: "Box", unitPack: "Pack", unitBottle: "Bottle", unitStrip: "Strip", unitPiece: "Piece", unitDozen: "Dozen", unitTube: "Tube", unitSachet: "Sachet",
    manufacturer: "Manufacturer",
    madeIn: "Made In",
    purchasePrice: "Purchase Price",
    discount: "Discount",
    description: "Description",
    noDescription: "No description has been added.",
    inventorySummary: "Inventory Summary",
    openingOrLegacyStock: "Opening / Adjustment Stock",
    purchasedUnits: "Purchased Units",
    soldUnits: "Sold Units",
    calculatedMovement: "Net Stock Movement",
    currentAvailable: "Current Available",
    lastExpiry: "Latest Expiry Date",
    noExpiry: "No expiry date recorded",
    purchaseHistory: "Purchase History",
    salesHistory: "Sales History",
    billNo: "Bill No.",
    supplier: "Supplier",
    date: "Date",
    quantity: "Quantity",
    bonus: "Bonus",
    unitPrice: "Unit Price",
    lineTotal: "Line Total",
    invoiceNo: "Invoice No.",
    customer: "Customer",
    noPurchases: "No purchase record exists for this product yet.",
    noSales: "No sales record exists for this product yet.",
    productNotFound: "Product not found",
    productNotFoundHint: "This product may have been deleted or the link is no longer valid.",
    unknown: "—",
  },
  fa: {
    back: "برگشت به محصولات",
    productDetails: "جزئیات محصول",
    subtitle: "مشخصات، موجودی، خریدها و فروش‌های این محصول را در یک صفحه بررسی کنید.",
    currentStock: "موجودی فعلی",
    totalPurchased: "مجموع خرید",
    totalSold: "مجموع فروش",
    salePrice: "قیمت فروش",
    overview: "مشخصات",
    inventory: "موجودی",
    purchases: "خریدها",
    sales: "فروش‌ها",
    batches: "بچ‌ها",
    batchInventory: "موجودی بر اساس بچ و تاریخ انقضا",
    batchNo: "شماره بچ",
    expiryDate: "تاریخ انقضا",
    availableQty: "موجودی بچ",
    receivedQty: "ورودی",
    issuedQty: "خروجی",
    noBatches: "هنوز موجودی بچ برای این محصول ثبت نشده است.",
    specifications: "مشخصات محصول",
    productName: "نام محصول",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    productUnit: "واحد",
    productForm: "حالت محصول",
    unitCarton: "کارتن", unitBox: "بکس", unitPack: "بسته", unitBottle: "بوتل", unitStrip: "ورق", unitPiece: "عدد", unitDozen: "درجن", unitTube: "تیوب", unitSachet: "پاکت",
    manufacturer: "کمپنی سازنده",
    madeIn: "ساخت",
    purchasePrice: "قیمت خرید",
    discount: "تخفیف",
    description: "توضیحات",
    noDescription: "برای این محصول توضیحی ثبت نشده است.",
    inventorySummary: "خلاصه موجودی",
    openingOrLegacyStock: "موجودی افتتاحیه / تعدیل",
    purchasedUnits: "مقدار خریداری‌شده",
    soldUnits: "مقدار فروخته‌شده",
    calculatedMovement: "حرکت خالص موجودی",
    currentAvailable: "موجودی قابل دسترس",
    lastExpiry: "آخرین تاریخ انقضا",
    noExpiry: "تاریخ انقضا ثبت نشده است",
    purchaseHistory: "تاریخچه خرید",
    salesHistory: "تاریخچه فروش",
    billNo: "بل نمبر",
    supplier: "تأمین‌کننده",
    date: "تاریخ",
    quantity: "مقدار",
    bonus: "بونس",
    unitPrice: "قیمت واحد",
    lineTotal: "جمله",
    invoiceNo: "بل فروش",
    customer: "مشتری",
    noPurchases: "هنوز برای این محصول خریدی ثبت نشده است.",
    noSales: "هنوز برای این محصول فروشی ثبت نشده است.",
    productNotFound: "محصول پیدا نشد",
    productNotFoundHint: "ممکن است محصول حذف شده باشد یا لینک دیگر معتبر نباشد.",
    unknown: "—",
  },
  ps: {
    back: "محصولاتو ته ستنېدل",
    productDetails: "د محصول جزئیات",
    subtitle: "د محصول معلومات، موجودي، پېرودونه او خرڅلاو په یوه پاڼه کې وګورئ.",
    currentStock: "اوسنۍ موجودي",
    totalPurchased: "ټول پېرود",
    totalSold: "ټول خرڅلاو",
    salePrice: "د خرڅلاو بیه",
    overview: "معلومات",
    inventory: "موجودي",
    purchases: "پېرودونه",
    sales: "خرڅلاو",
    batches: "بچونه",
    batchInventory: "د بچ او ختمېدو نېټې موجودي",
    batchNo: "د بچ نمبر",
    expiryDate: "د ختمېدو نېټه",
    availableQty: "د بچ موجودي",
    receivedQty: "داخل",
    issuedQty: "وتلی",
    noBatches: "تر اوسه د دې توکي لپاره د بچ موجودي نشته.",
    specifications: "د محصول مشخصات",
    productName: "د محصول نوم",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    productUnit: "واحد",
    productForm: "د محصول بڼه",
    unitCarton: "کارتن", unitBox: "بکس", unitPack: "بسته", unitBottle: "بوتل", unitStrip: "پټه", unitPiece: "عدد", unitDozen: "درجن", unitTube: "ټیوب", unitSachet: "پاکټ",
    manufacturer: "جوړوونکی شرکت",
    madeIn: "جوړ شوی په",
    purchasePrice: "د پېرود بیه",
    discount: "تخفیف",
    description: "تشریح",
    noDescription: "د دې محصول لپاره تشریح نه ده ثبت شوې.",
    inventorySummary: "د موجودۍ لنډیز",
    openingOrLegacyStock: "افتتاحیه / تعدیل موجودي",
    purchasedUnits: "پېرودل شوی مقدار",
    soldUnits: "پلورل شوی مقدار",
    calculatedMovement: "د موجودۍ خالص حرکت",
    currentAvailable: "اوسنۍ موجودي",
    lastExpiry: "وروستۍ د ختمېدو نېټه",
    noExpiry: "د ختمېدو نېټه نه ده ثبت شوې",
    purchaseHistory: "د پېرود تاریخچه",
    salesHistory: "د خرڅلاو تاریخچه",
    billNo: "بل نمبر",
    supplier: "عرضه کوونکی",
    date: "نېټه",
    quantity: "مقدار",
    bonus: "بونس",
    unitPrice: "د واحد بیه",
    lineTotal: "ټول",
    invoiceNo: "د خرڅلاو بل",
    customer: "پېرودونکی",
    noPurchases: "د دې محصول لپاره تر اوسه پېرود نه دی ثبت شوی.",
    noSales: "د دې محصول لپاره تر اوسه خرڅلاو نه دی ثبت شوی.",
    productNotFound: "محصول ونه موندل شو",
    productNotFoundHint: "کېدای شي محصول حذف شوی وي یا لینک نور اعتبار ونه لري.",
    unknown: "—",
  },
};

const productUnitLabelKeys = {
  carton: "unitCarton", box: "unitBox", pack: "unitPack", bottle: "unitBottle", strip: "unitStrip",
  piece: "unitPiece", dozen: "unitDozen", tube: "unitTube", sachet: "unitSachet",
};
const unitsWithoutSize = new Set(["bottle", "piece", "dozen", "tube", "sachet"]);
const productFormLabels = {
  en: { tablet: "Tablet", capsule: "Capsule", syrup: "Syrup", suspension: "Suspension", injection: "Injection", ampoule: "Ampoule", vial: "Vial", cream: "Cream", ointment: "Ointment", gel: "Gel", drops: "Drops", "eye-drops": "Eye Drops", "ear-drops": "Ear Drops", "nasal-spray": "Nasal Spray", inhaler: "Inhaler", powder: "Powder", sachet: "Sachet", suppository: "Suppository", lozenge: "Lozenge", solution: "Solution", lotion: "Lotion", soap: "Medicated Soap", shampoo: "Medicated Shampoo", "oral-solution": "Oral Solution" },
  fa: { tablet: "تابلیت", capsule: "کپسول", syrup: "شربت", suspension: "سوسپانسیون", injection: "آمپول / تزریقی", ampoule: "امپول", vial: "ویال", cream: "کریم", ointment: "مرهم", gel: "ژل", drops: "قطره", "eye-drops": "قطره چشم", "ear-drops": "قطره گوش", "nasal-spray": "اسپری بینی", inhaler: "انهیلر", powder: "پودر", sachet: "ساشه", suppository: "شیاف", lozenge: "قرص مکیدنی", solution: "محلول", lotion: "لوشن", soap: "صابون طبی", shampoo: "شامپوی طبی", "oral-solution": "محلول خوراکی" },
  ps: { tablet: "ټابلیټ", capsule: "کپسول", syrup: "شربت", suspension: "سسپنشن", injection: "پیچکاري", ampoule: "امپول", vial: "ویال", cream: "کریم", ointment: "مرهم", gel: "جېل", drops: "څاڅکي", "eye-drops": "د سترګو څاڅکي", "ear-drops": "د غوږ څاڅکي", "nasal-spray": "د پوزې سپرې", inhaler: "انهیلر", powder: "پوډر", sachet: "ساشه", suppository: "شیاف", lozenge: "مکیدونکی ټابلیټ", solution: "محلول", lotion: "لوشن", soap: "طبي صابون", shampoo: "طبي شامپو", "oral-solution": "خوراکي محلول" },
};
const numeric = (value) => Math.max(Number(value || 0), 0);
const money = (value) => numeric(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [productGroups] = useJsonCollection("productGroups");
  const [productCountries] = useJsonCollection("countries");
  const [customProductForms] = useJsonCollection("productForms");
  const [legacyCompanies] = useJsonCollection("companies");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseItems] = useJsonCollection("purchaseItems");
  const [sales] = useJsonCollection("salesRegister");
  const [stockMovements] = useJsonCollection("stockMovements");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [activeTab, setActiveTab] = useState("overview");

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

  const product = products.find((item) => String(item.id) === String(productId));

  const productPurchases = useMemo(() => {
    return purchases.flatMap((purchase) => {
      const detailRows = purchaseItems.filter((item) => String(item.purchaseId) === String(purchase.id));
      const sourceRows = detailRows.length ? detailRows : (Array.isArray(purchase.items) ? purchase.items : []);
      const matching = sourceRows.filter((item) => String(item.productId) === String(productId));
      return matching.map((item) => ({ ...item, purchase }));
    });
  }, [purchases, purchaseItems, productId]);

  const productSales = useMemo(() => {
    return sales.flatMap((sale) => {
      const matching = (sale.items || []).filter((item) => String(item.productId) === String(productId));
      return matching.map((item) => ({ ...item, sale }));
    });
  }, [sales, productId]);

  const movementTotals = getProductStockTotals(stockMovements, productId);
  const totalPurchased = movementTotals.purchased || productPurchases.reduce(
    (sum, row) => sum + numeric(row.quantity) + numeric(row.bonus),
    0
  );
  const totalSold = movementTotals.sold || productSales.reduce((sum, row) => sum + numeric(row.quantity), 0);
  const currentStock = Math.max(getProductStock(stockMovements, productId, legacyProductStock(product)), 0);
  const batchBalances = getProductBatchBalances(stockMovements, productId).filter((batch) => Math.abs(numeric(batch.available)) > 0.000001);
  const movementBalance = movementTotals.quantityIn - movementTotals.quantityOut;
  const latestExpiry = productPurchases
    .map((row) => row.expiryDate)
    .filter(Boolean)
    .sort()
    .at(-1) || product?.lastExpiryDate || "";

  const companyName = useMemo(() => {
    if (!product) return t.unknown;
    const manufacturerId = product.manufacturerId || product.companyId;
    const source = manufacturers.length ? manufacturers : legacyCompanies;
    const manufacturer = source.find((item) => String(item.id) === String(manufacturerId));
    return manufacturer?.manufacturerName || manufacturer?.companyName || product.company || t.unknown;
  }, [manufacturers, legacyCompanies, product, t.unknown]);

  const selectedUnit = product?.productUnit || "piece";
  const unitLabel = t[productUnitLabelKeys[selectedUnit]] || product?.productUnit || t.unitPiece;
  const sizeLabel = language === "en" ? `${unitLabel} Size` : language === "ps" ? `د ${unitLabel} سایز` : `سایز ${unitLabel}`;
  const resolvedProductForm = (() => {
    const value = String(product?.productForm || "");
    if (!value) return t.unknown;
    if (value.startsWith("custom:")) {
      const customId = value.slice(7);
      const row = customProductForms.find((item) => String(item.id) === customId);
      return row?.name || row?.label || t.unknown;
    }
    return productFormLabels[language]?.[value] || productFormLabels.en[value] || value;
  })();

  const tabs = [
    { id: "overview", label: t.overview, icon: ClipboardList },
    { id: "inventory", label: t.inventory, icon: Boxes },
    { id: "batches", label: t.batches, icon: Layers3, count: batchBalances.length },
    { id: "purchases", label: t.purchases, icon: ShoppingCart, count: productPurchases.length },
    { id: "sales", label: t.sales, icon: ShoppingBag, count: productSales.length },
  ];

  if (!product) {
    return (
      <div className="product-detail-page" dir={direction}>
        <div className="product-detail-not-found">
          <Package size={44} />
          <h1>{t.productNotFound}</h1>
          <p>{t.productNotFoundHint}</p>
          <button type="button" onClick={() => navigate("/products")}>{t.back}</button>
        </div>
      </div>
    );
  }

  const BackIcon = direction === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <div className="product-detail-page" dir={direction}>
      <div className="product-detail-hero product-detail-card">
        <div className="product-detail-hero-main">
          <button type="button" className="product-detail-back" onClick={() => navigate("/products")}>
            <BackIcon size={17} />
            <span>{t.back}</span>
          </button>
          <div className="product-detail-title-row">
            <div className="product-detail-icon"><PackageCheck size={28} /></div>
            <div>
              <span className="product-detail-eyebrow">{t.productDetails}</span>
              <h1>{product.productName}</h1>
              <p>{t.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="product-detail-stock-badge">
          <span>{t.currentStock}</span>
          <strong>{money(currentStock)}</strong>
        </div>
      </div>

      <section className="product-detail-stats">
        <article className="product-detail-card"><div className="product-detail-stat-icon stock"><Boxes size={20} /></div><div><span>{t.currentStock}</span><strong>{money(currentStock)}</strong></div></article>
        <article className="product-detail-card"><div className="product-detail-stat-icon purchase"><TrendingUp size={20} /></div><div><span>{t.totalPurchased}</span><strong>{money(totalPurchased)}</strong></div></article>
        <article className="product-detail-card"><div className="product-detail-stat-icon sale"><TrendingDown size={20} /></div><div><span>{t.totalSold}</span><strong>{money(totalSold)}</strong></div></article>
        <article className="product-detail-card"><div className="product-detail-stat-icon price"><BadgeDollarSign size={20} /></div><div><span>{t.salePrice}</span><strong>{money(product.salePrice)}</strong></div></article>
      </section>

      <div className="product-detail-tabs product-detail-card" role="tablist" aria-label={t.productDetails}>
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
            {typeof count === "number" && <b>{count}</b>}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><ClipboardList size={20} /><div><h2>{t.specifications}</h2></div></div>
          <div className="product-detail-spec-table-wrap">
            <table className="product-detail-spec-table">
              <tbody>
                <tr><th>{t.productName}</th><td>{product.productName || t.unknown}</td></tr>
                <tr><th>{t.group}</th><td>{groupNameById(productGroups, product.groupId, product.group || t.unknown) || t.unknown}</td></tr>
                <tr><th>{t.productUnit}</th><td>{unitLabel}</td></tr>
                {!unitsWithoutSize.has(selectedUnit) && <tr><th>{sizeLabel}</th><td>{product.cartonSize || product.piecesPerUnit || t.unknown}</td></tr>}
                <tr><th>{t.productForm}</th><td>{resolvedProductForm}</td></tr>
                <tr><th>{t.manufacturer}</th><td>{companyName}</td></tr>
                <tr><th>{t.madeIn}</th><td>{countryNameById(productCountries, product.countryId, language, product.madeIn || t.unknown) || t.unknown}</td></tr>
                <tr><th>{t.purchasePrice}</th><td>{money(product.purchasePrice)}</td></tr>
                <tr><th>{t.salePrice}</th><td>{money(product.salePrice)}</td></tr>
                <tr><th>{t.discount}</th><td>{numeric(product.discount)}%</td></tr>
                <tr className="product-detail-spec-description-row">
                  <th>{t.description}</th>
                  <td>{product.description || t.noDescription}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "inventory" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><Boxes size={20} /><div><h2>{t.inventorySummary}</h2></div></div>
          <div className="product-detail-inventory-grid">
            <article><span>{t.openingOrLegacyStock}</span><strong>{money(movementTotals.opening)}</strong></article>
            <article><span>{t.purchasedUnits}</span><strong>{money(totalPurchased)}</strong></article>
            <article><span>{t.soldUnits}</span><strong>{money(totalSold)}</strong></article>
            <article><span>{t.calculatedMovement}</span><strong className={movementBalance < 0 ? "negative" : ""}>{money(movementBalance)}</strong></article>
            <article className="primary"><span>{t.currentAvailable}</span><strong>{money(currentStock)}</strong></article>
            <article><span>{t.lastExpiry}</span><strong>{latestExpiry || t.noExpiry}</strong></article>
          </div>
        </section>
      )}

      {activeTab === "batches" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><Layers3 size={20} /><div><h2>{t.batchInventory}</h2></div></div>
          <div className="product-detail-table-wrap">
            <table>
              <thead><tr><th>{t.batchNo}</th><th>{t.expiryDate}</th><th>{t.receivedQty}</th><th>{t.issuedQty}</th><th>{t.availableQty}</th></tr></thead>
              <tbody>
                {batchBalances.map((batch) => (
                  <tr key={batch.batchNo}>
                    <td><strong>{batch.batchNo}</strong></td>
                    <td>{batch.expiryDate ? formatDateTime(batch.expiryDate, { fallback: t.noExpiry }) : t.noExpiry}</td>
                    <td>{money(batch.quantityIn)}</td>
                    <td>{money(batch.quantityOut)}</td>
                    <td><strong className={batch.available < 0 ? "negative" : ""}>{money(batch.available)}</strong></td>
                  </tr>
                ))}
                {!batchBalances.length && <tr><td colSpan="5" className="product-detail-empty">{t.noBatches}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "purchases" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><ShoppingCart size={20} /><div><h2>{t.purchaseHistory}</h2></div></div>
          <div className="product-detail-table-wrap">
            <table>
              <thead><tr><th>{t.billNo}</th><th>{t.supplier}</th><th>{t.date}</th><th>{t.quantity}</th><th>{t.bonus}</th><th>{t.unitPrice}</th><th>{t.lineTotal}</th></tr></thead>
              <tbody>
                {productPurchases.map((row, index) => (
                  <tr key={`${row.purchase?.id || index}-${index}`}>
                    <td><strong>{row.purchase?.billNumber || t.unknown}</strong></td>
                    <td>{row.purchase?.supplierName || row.purchase?.companyName || t.unknown}</td>
                    <td>{formatDateTime(row.purchase?.purchaseDate || row.purchase?.createdAt, { fallback: t.unknown })}</td>
                    <td>{money(row.quantity)}</td>
                    <td>{money(row.bonus)}</td>
                    <td>{money(row.purchasePrice)}</td>
                    <td>{money(row.lineTotal ?? (numeric(row.purchasePrice) * numeric(row.quantity) - numeric(row.discount)))}</td>
                  </tr>
                ))}
                {!productPurchases.length && <tr><td colSpan="7" className="product-detail-empty">{t.noPurchases}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "sales" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><ShoppingBag size={20} /><div><h2>{t.salesHistory}</h2></div></div>
          <div className="product-detail-table-wrap">
            <table>
              <thead><tr><th>{t.invoiceNo}</th><th>{t.customer}</th><th>{t.date}</th><th>{t.quantity}</th><th>{t.unitPrice}</th><th>{t.discount}</th><th>{t.lineTotal}</th></tr></thead>
              <tbody>
                {productSales.map((row, index) => (
                  <tr key={`${row.sale?.id || index}-${index}`}>
                    <td><strong>{row.sale?.invoiceNumber || t.unknown}</strong></td>
                    <td>{row.sale?.customerName || t.unknown}</td>
                    <td>{formatDateTime(row.sale?.saleDate || row.sale?.createdAt, { fallback: t.unknown })}</td>
                    <td>{money(row.quantity)}</td>
                    <td>{money(row.salePrice)}</td>
                    <td>{money(row.discount)}</td>
                    <td>{money(row.lineTotal ?? (numeric(row.salePrice) * numeric(row.quantity) - numeric(row.discount)))}</td>
                  </tr>
                ))}
                {!productSales.length && <tr><td colSpan="7" className="product-detail-empty">{t.noSales}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
