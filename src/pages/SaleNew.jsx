import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { productImageSrc } from "../utils/productImages";
import { groupNameById } from "../utils/productMasterData";
import {
  allocateProductBatchesFEFO,
  getProductStock,
  legacyProductStock,
  replaceReferenceMovements,
  stockMovementId,
} from "../utils/stock";
import "./PurchaseNew.css";
import "./SaleNew.css";

const languageKey = "afghan-power-language";
const currencies = ["AFN", "USD", "EUR", "INR"];
const num = (value) => Math.max(Number(value || 0), 0);
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const text = {
  en: {
    title: "New Sale",
    editTitle: "Edit Sale",
    subtitle: "Create a sale invoice and issue medicines from stock",
    editSubtitle: "Update the previously registered sale without creating a new record.",
    back: "Back to sales",
    customer: "Customer",
    selectCustomer: "Select customer",
    quickCustomer: "Add customer",
    customerName: "Customer name",
    customerPlaceholder: "Enter customer name",
    add: "Add",
    cancel: "Cancel",
    currency: "Currency",
    date: "Sale date (Solar Hijri)",
    paymentStatus: "Payment status",
    paidFull: "Fully paid",
    debt: "Credit / Debt",
    paidAmount: "Amount paid now",
    searchPlaceholder: "Search medicine by name, group or company...",
    searchHint: "Click the search field and choose a medicine",
    results: "Search results",
    invoiceItems: "Sale items",
    emptyTitle: "No medicine added yet",
    emptyText: "Search above and select medicines to add them to this sale.",
    qty: "Quantity",
    salePrice: "Sale price",
    purchasePrice: "Purchase price",
    addMedicine: "Add",
    total: "Total",
    discount: "Discount",
    totalBeforeDiscount: "Total before discount",
    totalDiscount: "Total discount",
    invalidDiscount: "Discount cannot be greater than the item total.",
    stock: "Current stock",
    unit: "Unit",
    remove: "Remove",
    subtotal: "Subtotal",
    grandTotal: "Grand total",
    paid: "Paid",
    remaining: "Remaining / Debt",
    save: "Save Sale",
    update: "Update Sale",
    requiredCustomer: "Please select a customer.",
    requiredItems: "Please add at least one medicine.",
    invalidPaid: "Paid amount cannot be greater than the payable total.",
    insufficientStock: "Insufficient stock for",
    outOfStock: "Out of stock",
    maxStock: "Maximum available stock",
    customerSaved: "Customer added successfully.",
    saved: "Sale saved successfully.",
    updated: "Sale updated successfully.",
    notFound: "Sale record not found.",
    nameRequired: "Enter customer name.",
  },
  fa: {
    title: "فروش جدید",
    editTitle: "ایدیت فروش",
    subtitle: "ایجاد بل فروش و کسر دواها از موجودی",
    editSubtitle: "معلومات فروش ثبت‌شده را ویرایش کنید؛ ریکارد جدید ساخته نمی‌شود.",
    back: "برگشت به فروشات",
    customer: "مشتری",
    selectCustomer: "مشتری را انتخاب کنید",
    quickCustomer: "افزودن مشتری",
    customerName: "نام مشتری",
    customerPlaceholder: "نام مشتری را وارد کنید",
    add: "اضافه",
    cancel: "لغو",
    currency: "واحد پول",
    date: "تاریخ فروش (شمسی)",
    paymentStatus: "وضعیت پرداخت",
    paidFull: "مکمل پرداخت",
    debt: "قرض",
    paidAmount: "مقدار پرداخت فعلی",
    searchPlaceholder: "جستجوی دوا با نام، گروپ یا کمپنی...",
    searchHint: "در جستجو کلیک کنید و دوا را انتخاب نمایید",
    results: "نتایج جستجو",
    invoiceItems: "اقلام فروش",
    emptyTitle: "هنوز دوایی اضافه نشده",
    emptyText: "از جستجوی بالا چندین دوا را پیدا کرده و به این فروش اضافه کنید.",
    qty: "مقدار",
    salePrice: "قیمت فروش",
    purchasePrice: "قیمت خرید",
    addMedicine: "اضافه",
    total: "جمله",
    discount: "تخفیف",
    totalBeforeDiscount: "مجموع قبل از تخفیف",
    totalDiscount: "مجموع تخفیف",
    invalidDiscount: "تخفیف نمی‌تواند بیشتر از مجموع همان جنس باشد.",
    stock: "موجودی فعلی",
    unit: "واحد",
    remove: "حذف",
    subtotal: "جمع اقلام",
    grandTotal: "مجموع نهایی",
    paid: "پرداخت",
    remaining: "باقی / طلب",
    save: "ذخیره فروش",
    update: "ذخیره تغییرات",
    requiredCustomer: "لطفاً مشتری را انتخاب کنید.",
    requiredItems: "حداقل یک دوا را اضافه کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از مجموع نهایی باشد.",
    insufficientStock: "موجودی کافی نیست برای",
    outOfStock: "موجودی تمام شده",
    maxStock: "حداکثر موجودی قابل فروش",
    customerSaved: "مشتری با موفقیت اضافه شد.",
    saved: "فروش با موفقیت ذخیره شد.",
    updated: "فروش با موفقیت ویرایش شد.",
    notFound: "ریکارد فروش پیدا نشد.",
    nameRequired: "نام مشتری را وارد کنید.",
  },
  ps: {
    title: "نوی خرڅلاو",
    editTitle: "د خرڅلاو سمون",
    subtitle: "د خرڅلاو بل جوړ کړئ او درمل له موجودۍ څخه وباسئ",
    editSubtitle: "مخکې ثبت شوی خرڅلاو سم کړئ؛ نوی ریکارډ نه جوړېږي.",
    back: "خرڅلاو ته بېرته",
    customer: "پېرودونکی",
    selectCustomer: "پېرودونکی وټاکئ",
    quickCustomer: "پېرودونکی اضافه کړئ",
    customerName: "د پېرودونکي نوم",
    customerPlaceholder: "د پېرودونکي نوم ولیکئ",
    add: "اضافه",
    cancel: "لغوه",
    currency: "اسعار",
    date: "د خرڅلاو نېټه (لمریز)",
    paymentStatus: "د ورکړې حالت",
    paidFull: "بشپړ ورکړل شوی",
    debt: "پور",
    paidAmount: "اوس ورکړل شوی مبلغ",
    searchPlaceholder: "درمل د نوم، ګروپ یا کمپنۍ له مخې ولټوئ...",
    searchHint: "د لټون په ساحه کلیک او درمل وټاکئ",
    results: "د لټون پایلې",
    invoiceItems: "د خرڅلاو توکي",
    emptyTitle: "تر اوسه درمل نه دي اضافه شوي",
    emptyText: "له پورته لټون څخه څو درمل پیدا او دې خرڅلاو ته یې اضافه کړئ.",
    qty: "مقدار",
    salePrice: "د پلور بیه",
    purchasePrice: "د پېرود بیه",
    addMedicine: "اضافه",
    total: "ټول",
    discount: "تخفیف",
    totalBeforeDiscount: "له تخفیف مخکې مجموع",
    totalDiscount: "ټول تخفیف",
    invalidDiscount: "تخفیف د هماغه توکي له مجموع څخه زیات نه شي کېدای.",
    stock: "اوسنی موجودي",
    unit: "واحد",
    remove: "حذف",
    subtotal: "د توکو مجموعه",
    grandTotal: "وروستی مجموع",
    paid: "ورکړه",
    remaining: "پاتې / پور",
    save: "خرڅلاو ذخیره کړئ",
    update: "بدلونونه ذخیره کړئ",
    requiredCustomer: "مهرباني وکړئ پېرودونکی وټاکئ.",
    requiredItems: "لږ تر لږه یو درمل اضافه کړئ.",
    invalidPaid: "ورکړل شوی مبلغ له وروستي مجموع څخه زیات نه شي کېدای.",
    insufficientStock: "کافي موجودي نشته د",
    outOfStock: "موجودي ختمه ده",
    maxStock: "د پلور اعظمي موجودي",
    customerSaved: "پېرودونکی په بریالیتوب اضافه شو.",
    saved: "خرڅلاو په بریالیتوب ذخیره شو.",
    updated: "خرڅلاو په بریالیتوب سم شو.",
    notFound: "د خرڅلاو ریکارډ ونه موندل شو.",
    nameRequired: "د پېرودونکي نوم ولیکئ.",
  },
};

function SaleNew() {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const isEditMode = Boolean(saleId);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [sales, setSales] = useJsonCollection("salesRegister");
  const [customers, setCustomers] = useJsonCollection("customerRegistry");
  const [products] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [stockMovements, setStockMovements] = useJsonCollection("stockMovements");

  const [customerId, setCustomerId] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [saleDate, setSaleDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [items, setItems] = useState([]);
  const [editInitialized, setEditInitialized] = useState(false);

  const t = text[language] || text.en;
  const direction = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const normalizeSearchText = (value) => String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

  const productDisplayName = (product) => product?.productName || product?.name || product?.title || product?.medicineName || "—";
  const editingSale = isEditMode ? sales.find((row) => String(row.id) === String(saleId)) : null;
  const effectiveStockMovements = useMemo(
    () => (isEditMode && editingSale ? replaceReferenceMovements(stockMovements, "sale", editingSale.id, []) : stockMovements),
    [isEditMode, editingSale, stockMovements]
  );
  const getStock = (product) => Math.max(getProductStock(effectiveStockMovements, product?.id, legacyProductStock(product)), 0);

  useEffect(() => {
    if (!isEditMode || editInitialized || !editingSale) return;
    setCustomerId(editingSale.customerId || "");
    setCurrency(editingSale.currency || "AFN");
    setSaleDate(editingSale.saleDate || today());
    const debt = num(editingSale.remainingAmount) > 0 || editingSale.paymentStatus === "debt" || editingSale.paymentMode === "installment";
    setPaymentStatus(debt ? "debt" : "paid");
    setPaidAmount(String(editingSale.paidAmount ?? ""));
    setItems((editingSale.items || []).map((item) => {
      const product = products.find((row) => String(row.id) === String(item.productId));
      return {
        productId: item.productId,
        productName: item.productName || productDisplayName(product),
        image: item.image || productImageSrc(product),
        group: item.group || groupNameById(productGroups, product?.groupId, product?.group || ""),
        unit: item.unit || product?.unit || "piece",
        quantity: num(item.quantity),
        purchasePrice: num(item.purchasePrice ?? product?.purchasePrice),
        salePrice: num(item.salePrice ?? product?.salePrice),
        discountAmount: num(item.discountAmount ?? item.discount),
        currentStock: product ? getStock(product) : num(item.quantity),
      };
    }));
    setEditInitialized(true);
  }, [isEditMode, editInitialized, editingSale, products, productGroups, effectiveStockMovements]);

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!searchFocused && !q) return [];
    return (Array.isArray(products) ? products : [])
      .filter((product) => product && product.status !== "inactive" && product.active !== false)
      .filter((product) => {
        if (!q) return true;
        const group = groupNameById(productGroups, product.groupId, product.group || "");
        const searchable = [
          productDisplayName(product), group, product.companyName, product.company,
          product.manufacturerName, product.barcode, product.barcodeNumber,
          product.serial, product.serialNumber, product.sku,
        ].map(normalizeSearchText).join(" ");
        return searchable.includes(q);
      })
      .slice(0, 20);
  }, [products, productGroups, query, searchFocused, effectiveStockMovements]);

  const addProduct = (product) => {
    const stock = getStock(product);
    if (stock <= 0) return;
    setItems((current) => {
      if (current.some((row) => String(row.productId) === String(product.id))) return current;
      return [...current, {
        productId: product.id,
        productName: productDisplayName(product),
        image: productImageSrc(product),
        group: groupNameById(productGroups, product.groupId, product.group || ""),
        unit: product.unit || "piece",
        quantity: 1,
        purchasePrice: num(product.purchasePrice),
        salePrice: num(product.salePrice),
        discountAmount: 0,
        currentStock: stock,
      }];
    });
    setSearchFocused(true);
  };

  const updateItem = (productId, key, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      if (key === "quantity") {
        const raw = Number(value);
        if (!Number.isFinite(raw)) return { ...row, quantity: "" };
        const clamped = Math.min(Math.max(raw, 0), num(row.currentStock));
        const nextGross = clamped * num(row.salePrice);
        return { ...row, quantity: clamped, discountAmount: Math.min(num(row.discountAmount), nextGross) };
      }
      if (key === "salePrice") {
        const price = Math.max(Number(value || 0), 0);
        const nextGross = num(row.quantity) * price;
        return { ...row, salePrice: value, discountAmount: Math.min(num(row.discountAmount), nextGross) };
      }
      if (key === "discountAmount") {
        const gross = num(row.quantity) * num(row.salePrice);
        const discount = Math.min(Math.max(Number(value || 0), 0), gross);
        return { ...row, discountAmount: discount };
      }
      return { ...row, [key]: value };
    }));
  };
  const removeItem = (productId) => setItems((current) => current.filter((row) => String(row.productId) !== String(productId)));
  const lineGross = (row) => Math.max(num(row.quantity) * num(row.salePrice), 0);
  const lineDiscount = (row) => Math.min(num(row.discountAmount), lineGross(row));
  const lineTotal = (row) => Math.max(lineGross(row) - lineDiscount(row), 0);
  const subtotal = items.reduce((sum, row) => sum + lineGross(row), 0);
  const totalDiscount = items.reduce((sum, row) => sum + lineDiscount(row), 0);
  const grandTotal = Math.max(subtotal - totalDiscount, 0);
  const paid = paymentStatus === "paid" ? grandTotal : Math.min(num(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentStatus === "paid") setPaidAmount(String(grandTotal || ""));
  }, [paymentStatus, grandTotal]);

  const addQuickCustomer = async () => {
    const name = quickName.trim();
    if (!name) return notify(t.nameRequired, "warning");
    const id = `CUS-${Date.now()}`;
    const now = new Date().toISOString();
    const customer = {
      id,
      fullName: name,
      companyName: "",
      currency,
      phone: "",
      address: "",
      openingBalance: 0,
      status: "active",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    const saved = await setCustomers([customer, ...customers]);
    if (!saved) return;
    setCustomerId(id);
    setQuickName("");
    setQuickOpen(false);
    notify(t.customerSaved, "success");
  };

  const saveSale = async () => {
    if (isEditMode && !editingSale) return notify(t.notFound, "warning");
    if (!customerId) return notify(t.requiredCustomer, "warning");
    if (!items.length) return notify(t.requiredItems, "warning");
    if (paymentStatus === "debt" && num(paidAmount) > grandTotal) return notify(t.invalidPaid, "warning");

    const allocationByProduct = new Map();
    for (const item of items) {
      if (num(item.discountAmount) > lineGross(item)) {
        return notify(`${t.invalidDiscount} ${item.productName}.`, "warning");
      }
      if (num(item.quantity) <= 0 || num(item.quantity) > num(item.currentStock)) {
        return notify(`${t.insufficientStock} ${item.productName}.`, "warning");
      }
      const allocation = allocateProductBatchesFEFO(effectiveStockMovements, item.productId, num(item.quantity));
      if (allocation.unallocated > 0) return notify(`${t.insufficientStock} ${item.productName}.`, "warning");
      allocationByProduct.set(String(item.productId), allocation.allocations);
    }

    const now = new Date().toISOString();
    const recordId = isEditMode ? editingSale.id : `sale-${Date.now()}`;
    const invoiceNumber = isEditMode ? (editingSale.invoiceNumber || `SAL-${Date.now().toString().slice(-8)}`) : `SAL-${Date.now().toString().slice(-8)}`;
    const customer = customers.find((row) => String(row.id) === String(customerId));
    const sale = {
      id: recordId,
      customerId,
      customerName: customer?.fullName || customer?.companyName || "",
      invoiceNumber,
      saleDate,
      currency,
      paymentMode: paymentStatus === "paid" ? "cash" : "installment",
      paymentStatus,
      subtotalAmount: subtotal,
      discountAmount: totalDiscount,
      totalAmount: grandTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      itemCount: items.length,
      items: items.map((row) => ({
        ...row,
        lineGross: lineGross(row),
        discountAmount: lineDiscount(row),
        lineTotal: lineTotal(row),
        batchAllocations: allocationByProduct.get(String(row.productId)) || [],
      })),
      createdAt: isEditMode ? (editingSale?.createdAt || now) : now,
      updatedAt: now,
    };

    const nextSales = isEditMode
      ? sales.map((row) => String(row.id) === String(recordId) ? sale : row)
      : [sale, ...sales];
    if (!(await setSales(nextSales))) return;

    const saleMovements = items.flatMap((row) => {
      const allocations = allocationByProduct.get(String(row.productId)) || [];
      return allocations.map((allocation, index) => ({
        id: stockMovementId("sale", recordId, row.productId, `${allocation.batchNo || "UNBATCHED"}-${index + 1}`),
        productId: row.productId,
        movementType: "sale",
        referenceType: "sale",
        referenceId: recordId,
        referenceNumber: invoiceNumber,
        quantityIn: 0,
        quantityOut: num(allocation.quantity),
        unitPrice: num(row.salePrice),
        batchNo: allocation.batchNo || "UNBATCHED",
        expiryDate: allocation.expiryDate || "",
        movementDate: saleDate,
        createdAt: now,
        updatedAt: now,
      }));
    });

    if (!(await setStockMovements(replaceReferenceMovements(stockMovements, "sale", recordId, saleMovements)))) return;
    notify(isEditMode ? t.updated : t.saved, "success");
    navigate("/sales-register");
  };

  return (
    <div className="purchase-entry-page" dir={direction}>
      <header className="purchase-entry-header">
        <div>
          <button className="purchase-back" type="button" onClick={() => navigate("/sales-register")}><ArrowLeft size={16} />{t.back}</button>
          <h1>{isEditMode ? t.editTitle : t.title}</h1>
          <p>{isEditMode ? t.editSubtitle : t.subtitle}</p>
        </div>
        <button className="purchase-save-top" type="button" onClick={saveSale}><Check size={17} />{isEditMode ? t.update : t.save}</button>
      </header>

      <div className="purchase-entry-layout">
        <main className="purchase-entry-main">
          <section className="purchase-search-card">
            <div className="purchase-search-box">
              <Search size={19} />
              <input value={query} onFocus={() => setSearchFocused(true)} onChange={(e) => { setQuery(e.target.value); setSearchFocused(true); }} placeholder={t.searchPlaceholder} />
            </div>
            {(searchFocused || query) && (
              <div className="purchase-search-results">
                <div className="purchase-search-results-head"><span>{t.results}</span><small>{results.length}</small></div>
                {results.length ? (
                  <div className="purchase-search-grid">
                    {results.map((product) => {
                      const stock = getStock(product);
                      const unavailable = stock <= 0;
                      return (
                        <button
                          type="button"
                          className={`purchase-search-result sale-search-result ${unavailable ? "is-out-of-stock" : ""}`}
                          key={product.id}
                          onClick={() => addProduct(product)}
                          disabled={unavailable}
                          aria-disabled={unavailable}
                        >
                          <img src={productImageSrc(product)} alt="" />
                          <span className="purchase-result-info"><strong>{productDisplayName(product)}</strong><small>{groupNameById(productGroups, product.groupId, product.group || "—")} · {product.companyName || product.company || "—"}</small></span>
                          <span className="purchase-result-prices">
                            <small><b>{t.purchasePrice}</b><strong>{num(product.purchasePrice).toFixed(2)} {currency}</strong></small>
                            <small><b>{t.salePrice}</b><strong>{num(product.salePrice).toFixed(2)} {currency}</strong></small>
                          </span>
                          <span className="purchase-result-footer">
                            <small>{t.stock}: <b>{stock}</b></small>
                            {unavailable ? <em className="sale-out-of-stock-label">{t.outOfStock}</em> : <em><Plus size={14} />{t.addMedicine}</em>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : <div className="purchase-no-result"><PackageSearch size={24} /><span>{t.searchHint}</span></div>}
              </div>
            )}
          </section>

          <section className="purchase-items-card">
            <div className="purchase-section-title"><ShoppingBag size={18} /><h2>{t.invoiceItems}</h2><span>{items.length}</span></div>
            {!items.length ? (
              <div className="purchase-items-empty"><ImageIcon size={34} /><strong>{t.emptyTitle}</strong><p>{t.emptyText}</p></div>
            ) : (
              <div className="purchase-items-list">
                {items.map((row) => (
                  <article className="purchase-item-row sale-entry-item-row" key={row.productId}>
                    <img src={row.image} alt="" />
                    <div className="purchase-item-name"><strong>{row.productName}</strong><small>{row.group || "—"} · {t.unit}: {row.unit || "—"}</small></div>
                    <label><span>{t.qty}</span><input type="number" min="0" max={row.currentStock} value={row.quantity} title={`${t.maxStock}: ${row.currentStock}`} onChange={(e) => updateItem(row.productId, "quantity", e.target.value)} /><small className="sale-stock-limit">{t.maxStock}: {row.currentStock}</small></label>
                    <label><span>{t.salePrice}</span><input type="number" min="0" step="0.01" value={row.salePrice} onChange={(e) => updateItem(row.productId, "salePrice", e.target.value)} /></label>
                    <label><span>{t.discount}</span><input type="number" min="0" max={lineGross(row)} step="0.01" value={row.discountAmount ?? 0} onChange={(e) => updateItem(row.productId, "discountAmount", e.target.value)} /></label>
                    <div className="purchase-line-total"><span>{t.total}</span><strong>{lineTotal(row).toFixed(2)} {currency}</strong></div>
                    <button className="purchase-remove" type="button" title={t.remove} onClick={() => removeItem(row.productId)}><Trash2 size={16} /></button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="purchase-entry-sidebar">
          <section className="purchase-side-card">
            <div className="purchase-side-title"><UserRound size={17} /><strong>{t.customer}</strong></div>
            <div className={`purchase-select-with-add ${quickOpen ? "is-quick-entry" : ""}`}>
              {quickOpen ? (
                <>
                  <input className="purchase-inline-supplier-input" autoFocus value={quickName} onChange={(e) => setQuickName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addQuickCustomer(); if (e.key === "Escape") { setQuickOpen(false); setQuickName(""); } }} placeholder={t.customerPlaceholder} aria-label={t.customerName} />
                  <button className="purchase-inline-supplier-save" type="button" onClick={addQuickCustomer} aria-label={t.add}><Check size={16} /></button>
                  <button className="purchase-inline-supplier-cancel" type="button" onClick={() => { setQuickOpen(false); setQuickName(""); }} aria-label={t.cancel}>×</button>
                </>
              ) : (
                <>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">{t.selectCustomer}</option>
                    {customers.filter((row) => row.status !== "inactive").map((row) => <option value={row.id} key={row.id}>{row.fullName || row.companyName || "—"}</option>)}
                  </select>
                  <button className="purchase-inline-supplier-add" type="button" onClick={() => setQuickOpen(true)} aria-label={t.quickCustomer}><Plus size={17} /></button>
                </>
              )}
            </div>
          </section>

          <section className="purchase-side-card">
            <label className="purchase-field"><span>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
            <label className="purchase-field"><span>{t.date}</span><ShamsiDateInput value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></label>
          </section>

          <section className="purchase-side-card purchase-summary-card">
            <div className="purchase-side-title"><ShoppingBag size={17} /><strong>{t.grandTotal}</strong></div>
            <div className="purchase-summary-row"><span>{t.totalBeforeDiscount}</span><strong>{subtotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row sale-discount-summary"><span>{t.totalDiscount}</span><strong>- {totalDiscount.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row purchase-summary-grand"><span>{t.grandTotal}</span><strong>{grandTotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row"><span>{t.paid}</span><strong>{paid.toFixed(2)} {currency}</strong></div>
            <div className={`purchase-summary-row ${remaining > 0 ? "has-debt" : ""}`}><span>{t.remaining}</span><strong>{remaining.toFixed(2)} {currency}</strong></div>
          </section>

          <section className="purchase-side-card">
            <div className="purchase-side-title"><WalletCards size={17} /><strong>{t.paymentStatus}</strong></div>
            <div className="purchase-payment-options">
              <button type="button" className={paymentStatus === "paid" ? "active" : ""} onClick={() => setPaymentStatus("paid")}>{t.paidFull}</button>
              <button type="button" className={paymentStatus === "debt" ? "active" : ""} onClick={() => setPaymentStatus("debt")}>{t.debt}</button>
            </div>
            {paymentStatus === "debt" && <label className="purchase-field"><span>{t.paidAmount}</span><input type="number" min="0" max={grandTotal} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>}
            <div className="purchase-payment-record"><span>{t.paid}</span><strong>{paymentStatus === "paid" ? t.paidFull : `${paid.toFixed(2)} ${currency}`}</strong></div>
          </section>

          <button className="purchase-save-mobile" type="button" onClick={saveSale}><Check size={17} />{isEditMode ? t.update : t.save}</button>
        </aside>
      </div>
    </div>
  );
}

export default SaleNew;
