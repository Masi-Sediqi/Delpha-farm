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
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
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
    specifications: "Product Specifications",
    productName: "Product Name",
    group: "Group",
    cartonSize: "Carton Size",
    manufacturer: "Manufacturer",
    madeIn: "Made In",
    purchasePrice: "Purchase Price",
    discount: "Discount",
    description: "Description",
    noDescription: "No description has been added.",
    inventorySummary: "Inventory Summary",
    openingOrLegacyStock: "Recorded Current Stock",
    purchasedUnits: "Purchased Units",
    soldUnits: "Sold Units",
    calculatedMovement: "Purchase − Sales",
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
    specifications: "مشخصات محصول",
    productName: "نام محصول",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    manufacturer: "کمپنی سازنده",
    madeIn: "ساخت",
    purchasePrice: "قیمت خرید",
    discount: "تخفیف",
    description: "توضیحات",
    noDescription: "برای این محصول توضیحی ثبت نشده است.",
    inventorySummary: "خلاصه موجودی",
    openingOrLegacyStock: "موجودی ثبت‌شده فعلی",
    purchasedUnits: "مقدار خریداری‌شده",
    soldUnits: "مقدار فروخته‌شده",
    calculatedMovement: "خرید منهای فروش",
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
    specifications: "د محصول مشخصات",
    productName: "د محصول نوم",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    manufacturer: "جوړوونکی شرکت",
    madeIn: "جوړ شوی په",
    purchasePrice: "د پېرود بیه",
    discount: "تخفیف",
    description: "تشریح",
    noDescription: "د دې محصول لپاره تشریح نه ده ثبت شوې.",
    inventorySummary: "د موجودۍ لنډیز",
    openingOrLegacyStock: "اوسنۍ ثبت شوې موجودي",
    purchasedUnits: "پېرودل شوی مقدار",
    soldUnits: "پلورل شوی مقدار",
    calculatedMovement: "پېرود منفي خرڅلاو",
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

const numeric = (value) => Math.max(Number(value || 0), 0);
const money = (value) => numeric(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [companies] = useJsonCollection("companies");
  const [purchases] = useJsonCollection("purchases");
  const [sales] = useJsonCollection("salesRegister");
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
      const matching = (purchase.items || []).filter((item) => String(item.productId) === String(productId));
      return matching.map((item) => ({ ...item, purchase }));
    });
  }, [purchases, productId]);

  const productSales = useMemo(() => {
    return sales.flatMap((sale) => {
      const matching = (sale.items || []).filter((item) => String(item.productId) === String(productId));
      return matching.map((item) => ({ ...item, sale }));
    });
  }, [sales, productId]);

  const totalPurchased = productPurchases.reduce(
    (sum, row) => sum + numeric(row.quantity) + numeric(row.bonus),
    0
  );
  const totalSold = productSales.reduce((sum, row) => sum + numeric(row.quantity), 0);
  const currentStock = numeric(product?.currentStock ?? product?.stock ?? product?.quantity ?? 0);
  const movementBalance = totalPurchased - totalSold;
  const latestExpiry = productPurchases
    .map((row) => row.expiryDate)
    .filter(Boolean)
    .sort()
    .at(-1) || product?.lastExpiryDate || "";

  const companyName = useMemo(() => {
    if (!product) return t.unknown;
    const company = companies.find((item) => String(item.id) === String(product.companyId));
    return company?.companyName || product.company || t.unknown;
  }, [companies, product, t.unknown]);

  const tabs = [
    { id: "overview", label: t.overview, icon: ClipboardList },
    { id: "inventory", label: t.inventory, icon: Boxes },
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
          <div className="product-detail-spec-grid">
            <div><span>{t.productName}</span><strong>{product.productName || t.unknown}</strong></div>
            <div><span>{t.group}</span><strong>{product.group || t.unknown}</strong></div>
            <div><span>{t.cartonSize}</span><strong>{product.cartonSize || t.unknown}</strong></div>
            <div><span>{t.manufacturer}</span><strong>{companyName}</strong></div>
            <div><span>{t.madeIn}</span><strong>{product.madeIn || t.unknown}</strong></div>
            <div><span>{t.purchasePrice}</span><strong>{money(product.purchasePrice)}</strong></div>
            <div><span>{t.salePrice}</span><strong>{money(product.salePrice)}</strong></div>
            <div><span>{t.discount}</span><strong>{numeric(product.discount)}%</strong></div>
          </div>
          <div className="product-detail-description">
            <span>{t.description}</span>
            <p>{product.description || t.noDescription}</p>
          </div>
        </section>
      )}

      {activeTab === "inventory" && (
        <section className="product-detail-content product-detail-card">
          <div className="product-detail-section-heading"><Boxes size={20} /><div><h2>{t.inventorySummary}</h2></div></div>
          <div className="product-detail-inventory-grid">
            <article><span>{t.openingOrLegacyStock}</span><strong>{money(currentStock)}</strong></article>
            <article><span>{t.purchasedUnits}</span><strong>{money(totalPurchased)}</strong></article>
            <article><span>{t.soldUnits}</span><strong>{money(totalSold)}</strong></article>
            <article><span>{t.calculatedMovement}</span><strong className={movementBalance < 0 ? "negative" : ""}>{money(movementBalance)}</strong></article>
            <article className="primary"><span>{t.currentAvailable}</span><strong>{money(currentStock)}</strong></article>
            <article><span>{t.lastExpiry}</span><strong>{latestExpiry || t.noExpiry}</strong></article>
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
                    <td>{formatDateTime(row.purchase?.createdAt, { fallback: t.unknown })}</td>
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
