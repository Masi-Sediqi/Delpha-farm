import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { productImageSrc } from "../utils/productImages";
import { groupNameById } from "../utils/productMasterData";
import {
  getProductStock,
  legacyProductStock,
  replaceReferenceMovements,
  stockMovementId,
} from "../utils/stock";
import "./PurchaseNew.css";

const languageKey = "afghan-power-language";
const currencies = ["AFN", "USD", "EUR", "INR"];

const text = {
  en: {
    title: "New Purchase",
    subtitle: "Create a purchase invoice and receive medicines into stock",
    back: "Back to purchases",
    supplier: "Supplier",
    selectSupplier: "Select supplier",
    quickSupplier: "Add supplier",
    supplierName: "Supplier name",
    supplierPlaceholder: "Enter supplier name",
    add: "Add",
    cancel: "Cancel",
    currency: "Currency",
    date: "Purchase date (Solar Hijri)",
    paymentStatus: "Payment status",
    paidFull: "Fully paid",
    debt: "Credit / Debt",
    paidAmount: "Amount paid now",
    searchPlaceholder: "Search medicine by name, group or company...",
    searchHint: "Click the search field and choose a medicine",
    results: "Search results",
    invoiceItems: "Purchase items",
    emptyTitle: "No medicine added yet",
    emptyText: "Search above and select a medicine to add it to this purchase.",
    qty: "Quantity",
    unitPrice: "Purchase price",
    salePrice: "Sale price",
    addMedicine: "Add",
    total: "Total",
    stock: "Current stock",
    unit: "Unit",
    remove: "Remove",
    subtotal: "Subtotal",
    grandTotal: "Grand total",
    paid: "Paid",
    remaining: "Remaining / Debt",
    save: "Save Purchase",
    requiredSupplier: "Please select a supplier.",
    requiredItems: "Please add at least one medicine.",
    invalidPaid: "Paid amount cannot be greater than the payable total.",
    supplierSaved: "Supplier added successfully.",
    saved: "Purchase saved successfully.",
    updated: "Purchase updated successfully.",
    editTitle: "Edit Purchase",
    editSubtitle: "Update this purchase while keeping its original record number.",
    nameRequired: "Enter supplier name.",
  },
  fa: {
    title: "خریداری جدید",
    subtitle: "ایجاد بل خریداری و اضافه‌کردن دواها به موجودی",
    back: "برگشت به خریداری",
    supplier: "تأمین‌کننده",
    selectSupplier: "تأمین‌کننده را انتخاب کنید",
    quickSupplier: "افزودن تأمین‌کننده",
    supplierName: "نام تأمین‌کننده",
    supplierPlaceholder: "نام تأمین‌کننده را وارد کنید",
    add: "اضافه",
    cancel: "لغو",
    currency: "واحد پول",
    date: "تاریخ خریداری (شمسی)",
    paymentStatus: "وضعیت پرداخت",
    paidFull: "مکمل پرداخت",
    debt: "قرض",
    paidAmount: "مقدار پرداخت فعلی",
    searchPlaceholder: "جستجوی دوا با نام، گروپ یا کمپنی...",
    searchHint: "در جستجو کلیک کنید و دوا را انتخاب نمایید",
    results: "نتایج جستجو",
    invoiceItems: "اقلام خریداری",
    emptyTitle: "هنوز دوایی اضافه نشده",
    emptyText: "از جستجوی بالا دوا را پیدا کرده و به این خریداری اضافه کنید.",
    qty: "مقدار",
    unitPrice: "قیمت خرید",
    salePrice: "قیمت فروش",
    addMedicine: "اضافه",
    total: "جمله",
    stock: "موجودی فعلی",
    unit: "واحد",
    remove: "حذف",
    subtotal: "جمع اقلام",
    grandTotal: "مجموع نهایی",
    paid: "پرداخت",
    remaining: "باقی / قرض",
    save: "ذخیره خریداری",
    requiredSupplier: "لطفاً تأمین‌کننده را انتخاب کنید.",
    requiredItems: "حداقل یک دوا را اضافه کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از مجموع نهایی باشد.",
    supplierSaved: "تأمین‌کننده با موفقیت اضافه شد.",
    saved: "خریداری با موفقیت ذخیره شد.",
    updated: "خریداری با موفقیت ویرایش شد.",
    editTitle: "ایدیت خریداری",
    editSubtitle: "معلومات این خریداری را با حفظ بل نمبر اصلی ویرایش کنید.",
    nameRequired: "نام تأمین‌کننده را وارد کنید.",
  },
  ps: {
    title: "نوی پېرود",
    subtitle: "د پېرود بل جوړ کړئ او درمل موجودۍ ته اضافه کړئ",
    back: "پېرودونو ته بېرته",
    supplier: "عرضه کوونکی",
    selectSupplier: "عرضه کوونکی وټاکئ",
    quickSupplier: "عرضه کوونکی اضافه کړئ",
    supplierName: "د عرضه کوونکي نوم",
    supplierPlaceholder: "د عرضه کوونکي نوم ولیکئ",
    add: "اضافه",
    cancel: "لغوه",
    currency: "اسعار",
    date: "د پېرود نېټه (لمریز)",
    paymentStatus: "د ورکړې حالت",
    paidFull: "بشپړ ورکړل شوی",
    debt: "پور",
    paidAmount: "اوس ورکړل شوی مبلغ",
    searchPlaceholder: "درمل د نوم، ګروپ یا کمپنۍ له مخې ولټوئ...",
    searchHint: "د لټون په ساحه کلیک او درمل وټاکئ",
    results: "د لټون پایلې",
    invoiceItems: "د پېرود توکي",
    emptyTitle: "تر اوسه درمل نه دي اضافه شوي",
    emptyText: "له پورته لټون څخه درمل پیدا او دې پېرود ته یې اضافه کړئ.",
    qty: "مقدار",
    unitPrice: "د پېرود بیه",
    salePrice: "د پلور بیه",
    addMedicine: "اضافه",
    total: "ټول",
    stock: "اوسنی موجودي",
    unit: "واحد",
    remove: "حذف",
    subtotal: "د توکو مجموعه",
    grandTotal: "وروستی مجموع",
    paid: "ورکړه",
    remaining: "پاتې / پور",
    save: "پېرود ذخیره کړئ",
    requiredSupplier: "مهرباني وکړئ عرضه کوونکی وټاکئ.",
    requiredItems: "لږ تر لږه یو درمل اضافه کړئ.",
    invalidPaid: "ورکړل شوی مبلغ له وروستي مجموع څخه زیات نه شي کېدای.",
    supplierSaved: "عرضه کوونکی په بریالیتوب اضافه شو.",
    saved: "پېرود په بریالیتوب ذخیره شو.",
    updated: "پېرود په بریالیتوب سم شو.",
    editTitle: "د پېرود سمون",
    editSubtitle: "د اصلي بل نمبر په ساتلو سره د پېرود معلومات بدل کړئ.",
    nameRequired: "د عرضه کوونکي نوم ولیکئ.",
  },
};

const num = (value) => Math.max(Number(value || 0), 0);
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function PurchaseNew() {
  const navigate = useNavigate();
  const { purchaseId } = useParams();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [purchases, setPurchases, , purchasesLoaded] = useJsonCollection("purchases");
  const [purchaseItems, setPurchaseItems, , purchaseItemsLoaded] = useJsonCollection("purchaseItems");
  const [suppliers, setSuppliers, , suppliersLoaded] = useJsonCollection("suppliers");
  const [products, setProducts, , productsLoaded] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [stockMovements, setStockMovements, , stockMovementsLoaded] = useJsonCollection("stockMovements");
  const [hydratedEditId, setHydratedEditId] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [items, setItems] = useState([]);

  const t = text[language] || text.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const isEditing = Boolean(purchaseId);

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);


  useEffect(() => {
    if (!purchaseId || String(hydratedEditId) === String(purchaseId)) return;

    // Do not hydrate the edit form until every collection used to rebuild the
    // previous invoice has finished loading. Hydrating too early with an empty
    // purchaseItems array was the reason old purchase lines disappeared.
    if (!purchasesLoaded || !purchaseItemsLoaded || !productsLoaded || !stockMovementsLoaded || !suppliersLoaded) return;

    const purchase = purchases.find((row) => String(row.id) === String(purchaseId));
    if (!purchase) return;

    const purchaseKeys = new Set([
      purchaseId,
      purchase.id,
      purchase.billNumber,
      purchase.billNo,
      purchase.invoiceNumber,
      purchase.referenceNumber,
    ].filter(Boolean).map(String));

    const belongsToPurchase = (row) => [
      row?.purchaseId,
      row?.purchase_id,
      row?.referenceId,
      row?.referenceNumber,
      row?.billNumber,
      row?.billNo,
      row?.invoiceNumber,
    ].filter(Boolean).some((value) => purchaseKeys.has(String(value)));

    const storedRows = purchaseItems.filter(belongsToPurchase);
    const embeddedRows = Array.isArray(purchase.items) ? purchase.items : [];
    const movementRows = stockMovements
      .filter((row) => {
        const isPurchaseMovement = !row.referenceType || row.referenceType === "purchase" || row.movementType === "purchase";
        return isPurchaseMovement && belongsToPurchase(row);
      })
      .map((movement, index) => ({
        ...movement,
        id: movement.id || `recovered-${purchaseId}-${index + 1}`,
        purchaseId,
        productId: movement.productId || movement.product_id,
        quantity: num(movement.quantityIn ?? movement.quantity ?? movement.qty),
        purchasePrice: num(movement.unitCost ?? movement.purchasePrice ?? movement.buyPrice),
        salePrice: num(movement.salePrice ?? movement.sellPrice),
      }));

    const sourceRows = storedRows.length ? storedRows : (embeddedRows.length ? embeddedRows : movementRows);

    setSupplierId(String(purchase.supplierId || purchase.supplier_id || ""));
    setCurrency(purchase.currency || "AFN");
    setPurchaseDate(purchase.purchaseDate || purchase.date || String(purchase.createdAt || "").slice(0, 10) || today());
    const hasDebt = Number(purchase.remainingAmount || purchase.remaining || 0) > 0 || purchase.paymentStatus === "debt" || purchase.paymentMode === "installment";
    setPaymentStatus(hasDebt ? "debt" : "paid");
    setPaidAmount(String(purchase.paidAmount ?? purchase.paid ?? ""));

    const restoredItems = sourceRows.map((row, index) => {
      const productId = row.productId || row.product_id || row.idProduct;
      const product = products.find((item) => String(item.id) === String(productId));
      return {
        ...row,
        id: row.id || `purchase-item-${purchaseId}-${index + 1}`,
        productId,
        productName: row.productName || row.name || productDisplayName(product),
        image: row.image || productImageSrc(product),
        group: row.group || groupNameById(productGroups, product?.groupId, product?.group || ""),
        unit: row.unit || product?.unit || "piece",
        quantity: num(row.quantity ?? row.quantityIn ?? row.qty),
        purchasePrice: num(row.purchasePrice ?? row.unitCost ?? row.buyPrice ?? product?.purchasePrice),
        salePrice: num(row.salePrice ?? row.sellPrice ?? product?.salePrice),
        currentStock: row.currentStock ?? (product ? getStock(product) : 0),
        batchNo: row.batchNo || row.batch || "",
        expiryDate: row.expiryDate || row.expiry || "",
      };
    }).filter((row) => row.productId);

    setItems(restoredItems);
    // Mark hydration complete only after all source collections have loaded and
    // the previous purchase has been reconstructed.
    setHydratedEditId(purchaseId);
  }, [
    purchaseId, hydratedEditId, purchases, purchaseItems, stockMovements, products, productGroups,
    purchasesLoaded, purchaseItemsLoaded, productsLoaded, stockMovementsLoaded, suppliersLoaded,
  ]);

  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ۀ/g, "ه")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();

  const productDisplayName = (product) =>
    product?.productName || product?.name || product?.title || product?.medicineName || "—";

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!searchFocused && !q) return [];

    return (Array.isArray(products) ? products : [])
      .filter((product) => product && product.status !== "inactive" && product.active !== false)
      .filter((product) => {
        if (!q) return true;

        const group = groupNameById(productGroups, product.groupId, product.group || "");
        const searchable = [
          productDisplayName(product),
          group,
          product.companyName,
          product.company,
          product.supplierName,
          product.manufacturerName,
          product.barcode,
          product.barcodeNumber,
          product.serial,
          product.serialNumber,
          product.sku,
        ]
          .map(normalizeSearchText)
          .join(" ");

        return searchable.includes(q);
      })
      .slice(0, 20);
  }, [products, productGroups, query, searchFocused]);

  const getStock = (product) => Math.max(getProductStock(stockMovements, product?.id, legacyProductStock(product)), 0);

  const addProduct = (product) => {
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
        currentStock: getStock(product),
        batchNo: "",
        expiryDate: "",
      }];
    });
    // Keep search results open after adding a medicine so the user can
    // add several products consecutively without reopening/searching again.
    setSearchFocused(true);
  };

  const updateItem = (productId, key, value) => {
    setItems((current) => current.map((row) => String(row.productId) === String(productId) ? { ...row, [key]: value } : row));
  };

  const removeItem = (productId) => setItems((current) => current.filter((row) => String(row.productId) !== String(productId)));
  const lineTotal = (row) => Math.max(num(row.quantity) * num(row.purchasePrice), 0);
  const subtotal = items.reduce((sum, row) => sum + lineTotal(row), 0);
  const grandTotal = subtotal;
  const paid = paymentStatus === "paid" ? grandTotal : Math.min(num(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentStatus === "paid") setPaidAmount(String(grandTotal || ""));
  }, [paymentStatus, grandTotal]);

  const addQuickSupplier = async () => {
    const name = quickName.trim();
    if (!name) return notify(t.nameRequired, "warning");
    const id = `SUP-${Date.now()}`;
    const now = new Date().toISOString();
    const supplier = {
      id,
      supplierName: name,
      supplierType: "",
      currency: currency.toLowerCase(),
      contactPerson: "",
      phone: "",
      address: "",
      openingBalance: 0,
      status: "active",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    const saved = await setSuppliers([supplier, ...suppliers]);
    if (!saved) return;
    setSupplierId(id);
    setQuickName("");
    setQuickOpen(false);
    notify(t.supplierSaved, "success", { silent: true });
  };

  const savePurchase = async () => {
    if (!supplierId) return notify(t.requiredSupplier, "warning");
    if (!items.length) return notify(t.requiredItems, "warning");
    if (paymentStatus === "debt" && num(paidAmount) > grandTotal) return notify(t.invalidPaid, "warning");

    const now = new Date().toISOString();
    const existingPurchase = isEditing ? purchases.find((row) => String(row.id) === String(purchaseId)) : null;
    const targetPurchaseId = existingPurchase?.id || `purchase-${Date.now()}`;
    const supplier = suppliers.find((row) => String(row.id) === String(supplierId));
    const billNumber = existingPurchase?.billNumber || `PUR-${Date.now().toString().slice(-8)}`;
    const purchase = {
      id: targetPurchaseId,
      supplierId,
      supplierName: supplier?.supplierName || "",
      billNumber,
      purchaseDate,
      currency,
      paymentMode: paymentStatus === "paid" ? "cash" : "installment",
      paymentStatus,
      paidAmount: paid,
      totalAmount: grandTotal,
      remainingAmount: remaining,
      itemCount: items.length,
      createdAt: existingPurchase?.createdAt || now,
      updatedAt: now,
    };

    const nextPurchases = isEditing ? purchases.map((row) => String(row.id) === String(targetPurchaseId) ? purchase : row) : [purchase, ...purchases];
    if (!(await setPurchases(nextPurchases))) return;

    const detailRows = items.map((row, index) => ({
      ...row,
      id: row.id || `purchase-item-${targetPurchaseId}-${index + 1}`,
      purchaseId: targetPurchaseId,
      lineTotal: lineTotal(row),
      createdAt: now,
      updatedAt: now,
    }));
    const retainedPurchaseItems = purchaseItems.filter((row) => String(row.purchaseId) !== String(targetPurchaseId));
    if (!(await setPurchaseItems([...detailRows, ...retainedPurchaseItems]))) return;

    const movements = items.map((row) => ({
      id: stockMovementId("purchase", targetPurchaseId, row.productId, `line-${row.productId}`),
      productId: row.productId,
      movementType: "purchase",
      referenceType: "purchase",
      referenceId: targetPurchaseId,
      referenceNumber: billNumber,
      quantityIn: num(row.quantity),
      quantityOut: 0,
      unitCost: num(row.purchasePrice),
      batchNo: row.batchNo || "",
      expiryDate: row.expiryDate || "",
      movementDate: purchaseDate,
      createdAt: now,
      updatedAt: now,
    }));
    if (!(await setStockMovements(replaceReferenceMovements(stockMovements, "purchase", targetPurchaseId, movements)))) return;

    const nextProducts = products.map((product) => {
      const row = items.find((item) => String(item.productId) === String(product.id));
      if (!row) return product;
      return { ...product, purchasePrice: num(row.purchasePrice), salePrice: num(row.salePrice || product.salePrice), updatedAt: now };
    });
    await setProducts(nextProducts);

    notify(isEditing ? t.updated : t.saved, "success", { silent: true });
    navigate("/purchasing");
  };

  return (
    <div className="purchase-entry-page" dir={direction}>
      <header className="purchase-entry-header">
        <div>
          <button className="purchase-back" type="button" onClick={() => navigate("/purchasing")}><ArrowLeft size={16} />{t.back}</button>
          <h1>{isEditing ? t.editTitle : t.title}</h1>
          <p>{isEditing ? t.editSubtitle : t.subtitle}</p>
        </div>
        <button className="purchase-save-top" type="button" onClick={savePurchase}><Check size={17} />{t.save}</button>
      </header>

      <div className="purchase-entry-layout">
        <main className="purchase-entry-main">
          <section className="purchase-search-card">
            <div className="purchase-search-box">
              <Search size={19} />
              <input
                value={query}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); }}
                placeholder={t.searchPlaceholder}
              />
            </div>
            {(searchFocused || query) && (
              <div className="purchase-search-results">
                <div className="purchase-search-results-head"><span>{t.results}</span><small>{results.length}</small></div>
                {results.length ? (
                  <div className="purchase-search-grid">
                    {results.map((product) => (
                      <button type="button" className="purchase-search-result" key={product.id} onClick={() => addProduct(product)}>
                        <img src={productImageSrc(product)} alt="" />
                        <span className="purchase-result-info">
                          <strong>{productDisplayName(product)}</strong>
                          <small>{groupNameById(productGroups, product.groupId, product.group || "—")} · {product.companyName || product.supplierName || product.company || "—"}</small>
                        </span>
                        <span className="purchase-result-prices">
                          <small><b>{t.unitPrice}</b><strong>{num(product.purchasePrice).toFixed(2)} {currency}</strong></small>
                          <small><b>{t.salePrice}</b><strong>{num(product.salePrice).toFixed(2)} {currency}</strong></small>
                        </span>
                        <span className="purchase-result-footer">
                          <small>{t.stock}: <b>{getStock(product)}</b></small>
                          <em><Plus size={14} />{t.addMedicine}</em>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : <div className="purchase-no-result"><PackageSearch size={24} /><span>{productsLoaded ? t.searchHint : "..."}</span></div>}
              </div>
            )}
          </section>

          <section className="purchase-items-card">
            <div className="purchase-section-title"><ShoppingCart size={18} /><h2>{t.invoiceItems}</h2><span>{items.length}</span></div>
            {!items.length ? (
              <div className="purchase-items-empty"><ImageIcon size={34} /><strong>{t.emptyTitle}</strong><p>{t.emptyText}</p></div>
            ) : (
              <div className="purchase-items-list">
                {items.map((row) => (
                  <article className="purchase-item-row" key={row.productId}>
                    <img src={row.image} alt="" />
                    <div className="purchase-item-name"><strong>{row.productName}</strong><small>{row.group || "—"} · {t.unit}: {row.unit || "—"}</small></div>
                    <label><span>{t.qty}</span><input type="number" min="0" value={row.quantity} onChange={(e) => updateItem(row.productId, "quantity", e.target.value)} /></label>
                    <label><span>{t.unitPrice}</span><input type="number" min="0" step="0.01" value={row.purchasePrice} onChange={(e) => updateItem(row.productId, "purchasePrice", e.target.value)} /></label>
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
            <div className="purchase-side-title"><Truck size={17} /><strong>{t.supplier}</strong></div>
            <div className={`purchase-select-with-add ${quickOpen ? "is-quick-entry" : ""}`}>
              {quickOpen ? (
                <>
                  <input
                    className="purchase-inline-supplier-input"
                    autoFocus
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addQuickSupplier(); if (e.key === "Escape") { setQuickOpen(false); setQuickName(""); } }}
                    placeholder={t.supplierPlaceholder}
                    aria-label={t.supplierName}
                  />
                  <button className="purchase-inline-supplier-save" type="button" onClick={addQuickSupplier} aria-label={t.add}><Check size={16} /></button>
                  <button className="purchase-inline-supplier-cancel" type="button" onClick={() => { setQuickOpen(false); setQuickName(""); }} aria-label={t.cancel}><X size={16} /></button>
                </>
              ) : (
                <>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">{t.selectSupplier}</option>
                    {suppliers.filter((row) => row.status !== "inactive").map((row) => <option value={row.id} key={row.id}>{row.supplierName}</option>)}
                  </select>
                  <button className="purchase-inline-supplier-add" type="button" onClick={() => setQuickOpen(true)} aria-label={t.quickSupplier}><Plus size={17} /></button>
                </>
              )}
            </div>
          </section>

          <section className="purchase-side-card">
            <label className="purchase-field"><span>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
            <label className="purchase-field"><span>{t.date}</span><ShamsiDateInput value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></label>
          </section>

          <section className="purchase-side-card purchase-summary-card">
            <div className="purchase-side-title"><ShoppingCart size={17} /><strong>{t.grandTotal}</strong></div>
            <div className="purchase-summary-row"><span>{t.subtotal}</span><strong>{subtotal.toFixed(2)} {currency}</strong></div>
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

          <button className="purchase-save-mobile" type="button" onClick={savePurchase}><Check size={17} />{t.save}</button>
        </aside>
      </div>
    </div>
  );
}

export default PurchaseNew;
