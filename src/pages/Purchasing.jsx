import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Truck,
  CalendarDays,
  Check,
  CreditCard,
  Edit3,
  PackagePlus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { formatDateTime } from "../utils/afghanDate";
import { notify } from "../utils/notify";
import "./Purchasing.css";

const languageKey = "afghan-power-language";

const translations = {
  en: {
    title: "Purchasing",
    subtitle: "Register multi-product purchases from suppliers.",
    newPurchase: "New Purchase",
    purchases: "Purchase Records",
    totalBills: "Total Bills",
    totalAmount: "Total Purchase Amount",
    totalPaid: "Total Paid",
    totalRemaining: "Total Remaining",
    search: "Search bill number or supplier...",
    noPurchases: "No purchases have been registered yet.",
    billNo: "Bill No.", supplier: "Supplier", date: "Date", total: "Total", paid: "Paid", remaining: "Remaining", paymentType: "Payment Type", items: "Items",
    modalTitle: "Register New Purchase",
    editModalTitle: "Edit Purchase",
    modalHint: "Enter the bill number, choose a supplier, then add several products and complete the purchase details.",
    selectSupplier: "Select supplier",
    billNumber: "Bill Number",
    billPlaceholder: "Example: INV-1001",
    availableProducts: "Available Products",
    productSearch: "Search product...",
    chooseSupplierFirst: "Select a supplier first to add products to this purchase.",
    noProducts: "No products are registered yet.",
    selectedProducts: "Selected Products",
    clickToAdd: "Click a product to add it to this purchase.",
    noSelected: "No product selected yet.",
    group: "Group",
    cartonSize: "Carton Size",
    purchasePrice: "Purchase Price",
    cartons: "Cartons",
    quantity: "Quantity",
    bonus: "Bonus",
    discount: "Discount",
    lineTotal: "Line Total",
    salePrice: "Sale Price",
    expiryDate: "Expiry Date",
    currentStock: "Current Stock",
    summary: "Purchase Summary",
    grandTotal: "Grand Total",
    paymentMode: "Payment Mode",
    cash: "Cash",
    installment: "Installment",
    paidAmount: "Paid Amount",
    balance: "Remaining Balance",
    cancel: "Cancel",
    save: "Save Purchase",
    requiredSupplier: "Please select a supplier.",
    requiredBill: "Please enter the bill number.",
    requiredProducts: "Please select at least one product.",
    invalidPaid: "Paid amount cannot be greater than the total amount.",
    saved: "Purchase saved successfully.",
    updated: "Purchase updated successfully.",
    remove: "Remove",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    deleted: "Purchase deleted successfully.",
    confirmDelete: "Delete this purchase?",
  },
  fa: {
    title: "خریداری",
    subtitle: "خرید چندین جنس از تأمین‌کننده‌گان را در یک بل ثبت کنید.",
    newPurchase: "خریداری جدید",
    purchases: "ریکاردهای خریداری",
    totalBills: "مجموع بل‌ها",
    totalAmount: "مجموع خریداری",
    totalPaid: "مجموع پرداخت",
    totalRemaining: "مجموع باقی‌مانده",
    search: "جستجوی بل نمبر یا تأمین‌کننده...",
    noPurchases: "هنوز خریداری ثبت نشده است.",
    billNo: "بل نمبر", supplier: "تأمین‌کننده", date: "تاریخ", total: "جمله مقدار", paid: "پرداخت", remaining: "باقی‌مانده", paymentType: "حالت پرداخت", items: "تعداد اقلام",
    modalTitle: "ثبت خریداری جدید",
    editModalTitle: "ویرایش خریداری",
    modalHint: "بل نمبر را وارد کنید، تأمین‌کننده را انتخاب نموده و سپس چند دوا را به خریداری اضافه کنید.",
    selectSupplier: "تأمین‌کننده را انتخاب کنید",
    billNumber: "بل نمبر",
    billPlaceholder: "مثلاً INV-1001",
    availableProducts: "دواهای موجود",
    productSearch: "جستجوی دوا...",
    chooseSupplierFirst: "اول تأمین‌کننده را انتخاب کنید تا بتوانید دواها را به خریداری اضافه کنید.",
    noProducts: "هنوز هیچ محصولی ثبت نشده است.",
    selectedProducts: "دواهای انتخاب‌شده",
    clickToAdd: "روی هر دوا کلیک کنید تا به این خریداری اضافه شود.",
    noSelected: "هنوز هیچ دوا انتخاب نشده است.",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    purchasePrice: "قیمت خرید",
    cartons: "تعداد کارتن",
    quantity: "مقدار",
    bonus: "بونس",
    discount: "تخفیف",
    lineTotal: "جمله",
    salePrice: "قیمت فروش",
    expiryDate: "تاریخ انقضا",
    currentStock: "موجودی فعلی",
    summary: "خلاصه خریداری",
    grandTotal: "جمله مقدار",
    paymentMode: "حالت پرداخت",
    cash: "پرداخت نقدی",
    installment: "پرداخت قسطی",
    paidAmount: "مقدار پرداخت",
    balance: "باقی‌مانده",
    cancel: "لغو",
    save: "ذخیره خریداری",
    requiredSupplier: "لطفاً تأمین‌کننده را انتخاب کنید.",
    requiredBill: "لطفاً بل نمبر را وارد کنید.",
    requiredProducts: "حداقل یک دوا را انتخاب کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از جمله مقدار باشد.",
    saved: "خریداری با موفقیت ذخیره شد.",
    updated: "خریداری با موفقیت ویرایش شد.",
    remove: "حذف",
    actions: "عملیات",
    edit: "ویرایش",
    delete: "حذف",
    deleted: "خریداری با موفقیت حذف شد.",
    confirmDelete: "این خریداری حذف شود؟",
  },
  ps: {
    title: "پېرود",
    subtitle: "له عرضه کوونکو څخه د څو توکو پېرود په یوه بل کې ثبت کړئ.",
    newPurchase: "نوی پېرود",
    purchases: "د پېرود ریکارډونه",
    totalBills: "ټول بلونه",
    totalAmount: "د پېرود ټول مبلغ",
    totalPaid: "ټولې ورکړې",
    totalRemaining: "پاتې مبلغ",
    search: "د بل نمبر یا عرضه کوونکي لټون...",
    noPurchases: "تر اوسه پېرود نه دی ثبت شوی.",
    billNo: "بل نمبر", supplier: "عرضه کوونکی", date: "نېټه", total: "ټول مبلغ", paid: "ورکړه", remaining: "پاتې", paymentType: "د ورکړې ډول", items: "توکي",
    modalTitle: "نوی پېرود ثبتول",
    editModalTitle: "د پېرود سمون",
    modalHint: "بل نمبر ولیکئ، عرضه کوونکی وټاکئ او بیا څو توکي پېرود ته اضافه کړئ.",
    selectSupplier: "عرضه کوونکی وټاکئ",
    billNumber: "بل نمبر",
    billPlaceholder: "لکه INV-1001",
    availableProducts: "موجود توکي",
    productSearch: "د توکي لټون...",
    chooseSupplierFirst: "لومړی عرضه کوونکی وټاکئ ترڅو توکي پېرود ته اضافه کړئ.",
    noProducts: "تر اوسه کوم محصول نه دی ثبت شوی.",
    selectedProducts: "ټاکل شوي توکي",
    clickToAdd: "پر توکي کلیک وکړئ ترڅو دې پېرود ته اضافه شي.",
    noSelected: "تر اوسه کوم توکی نه دی ټاکل شوی.",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    purchasePrice: "د پېرود بیه",
    cartons: "کارتنونه",
    quantity: "مقدار",
    bonus: "بونس",
    discount: "تخفیف",
    lineTotal: "ټول",
    salePrice: "د خرڅلاو بیه",
    expiryDate: "د ختمېدو نېټه",
    currentStock: "اوسنی موجودي",
    summary: "د پېرود لنډیز",
    grandTotal: "ټول مبلغ",
    paymentMode: "د ورکړې ډول",
    cash: "نغدي",
    installment: "قسطی",
    paidAmount: "ورکړل شوی مبلغ",
    balance: "پاتې مبلغ",
    cancel: "لغوه",
    save: "پېرود ذخیره کول",
    requiredSupplier: "مهرباني وکړئ عرضه کوونکی وټاکئ.",
    requiredBill: "مهرباني وکړئ بل نمبر ولیکئ.",
    requiredProducts: "لږ تر لږه یو توکی وټاکئ.",
    invalidPaid: "ورکړل شوی مبلغ له ټول مبلغ څخه زیات نه شي کېدای.",
    saved: "پېرود په بریالیتوب سره ذخیره شو.",
    updated: "پېرود په بریالیتوب سم شو.",
    remove: "حذف",
    actions: "عملیات",
    edit: "سمون",
    delete: "حذف",
    deleted: "پېرود په بریالیتوب سره حذف شو.",
    confirmDelete: "دا پېرود حذف شي؟",
  },
};

const numeric = (value) => Math.max(Number(value || 0), 0);
const getStock = (product) => numeric(product?.currentStock ?? product?.stock ?? product?.quantity ?? 0);

function Purchasing() {
  const [purchases, setPurchases] = useJsonCollection("purchases");
  const [suppliers] = useJsonCollection("suppliers");
  const [products, setProducts] = useJsonCollection("products");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [supplierId, setSupplierId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");

  const t = translations[language] || translations.en;
  const direction = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("purchasing-modal-open", showModal);
    return () => document.body.classList.remove("purchasing-modal-open");
  }, [showModal]);

  const supplierName = (id) => suppliers.find((item) => String(item.id) === String(id))?.supplierName || "—";

  const availableProducts = useMemo(() => {
    if (!supplierId) return [];
    const q = productSearch.trim().toLowerCase();
    return products.filter((item) => {
      if (!q) return true;
      return `${item.productName || ""} ${item.group || ""} ${item.companyName || ""}`.toLowerCase().includes(q);
    });
  }, [products, supplierId, productSearch]);

  const addProduct = (product) => {
    if (selectedItems.some((item) => String(item.productId) === String(product.id))) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.productName || "",
        group: product.group || "",
        cartonSize: product.cartonSize || "",
        purchasePrice: numeric(product.purchasePrice),
        cartons: 1,
        quantity: 1,
        bonus: 0,
        discount: numeric(product.discount),
        salePrice: numeric(product.salePrice),
        expiryDate: "",
        currentStock: getStock(product),
      },
    ]);
  };

  const updateItem = (productId, field, value) => {
    setSelectedItems((prev) => prev.map((item) => (
      String(item.productId) === String(productId) ? { ...item, [field]: value } : item
    )));
  };

  const removeItem = (productId) => {
    setSelectedItems((prev) => prev.filter((item) => String(item.productId) !== String(productId)));
  };

  const lineTotal = (item) => Math.max(numeric(item.purchasePrice) * numeric(item.quantity) - numeric(item.discount), 0);
  const grandTotal = selectedItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const paid = Math.min(numeric(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentMode === "cash" && showModal) setPaidAmount(grandTotal ? String(grandTotal) : "");
  }, [paymentMode, grandTotal, showModal]);

  const openModal = () => {
    setEditingPurchaseId(null);
    setSupplierId("");
    setBillNumber("");
    setSelectedItems([]);
    setPaymentMode("cash");
    setPaidAmount("");
    setProductSearch("");
    setShowModal(true);
  };

  const openEdit = (purchase) => {
    setEditingPurchaseId(purchase.id);
    setSupplierId(purchase.supplierId || "");
    setBillNumber(purchase.billNumber || "");
    setSelectedItems((purchase.items || []).map((item) => {
      const product = products.find((productItem) => String(productItem.id) === String(item.productId));
      const purchasedQuantity = numeric(item.quantity) + numeric(item.bonus);
      return {
        productId: item.productId,
        productName: item.productName || "",
        group: item.group || "",
        cartonSize: item.cartonSize || "",
        purchasePrice: numeric(item.purchasePrice),
        cartons: item.cartons || 1,
        quantity: item.quantity || 1,
        bonus: item.bonus || 0,
        discount: numeric(item.discount),
        salePrice: numeric(item.salePrice),
        expiryDate: item.expiryDate || "",
        currentStock: Math.max(getStock(product) - purchasedQuantity, 0),
      };
    }));
    setPaymentMode(purchase.paymentMode || "cash");
    setPaidAmount(String(purchase.paidAmount ?? ""));
    setProductSearch("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPurchaseId(null);
  };

  const savePurchase = async (event) => {
    event.preventDefault();
    if (!supplierId) return notify(t.requiredSupplier, "error");
    if (!billNumber.trim()) return notify(t.requiredBill, "error");
    if (!selectedItems.length) return notify(t.requiredProducts, "error");
    if (numeric(paidAmount) > grandTotal) return notify(t.invalidPaid, "error");

    const now = new Date().toISOString();
    const previousPurchase = editingPurchaseId
      ? purchases.find((item) => String(item.id) === String(editingPurchaseId))
      : null;
    const purchase = {
      id: editingPurchaseId || `purchase-${Date.now()}`,
      supplierId,
      supplierName: supplierName(supplierId),
      billNumber: billNumber.trim(),
      paymentMode,
      paidAmount: paid,
      totalAmount: grandTotal,
      remainingAmount: remaining,
      items: selectedItems.map((item) => ({ ...item, lineTotal: lineTotal(item) })),
      createdAt: previousPurchase?.createdAt || now,
      updatedAt: now,
    };

    const savedPurchase = await setPurchases(editingPurchaseId
      ? purchases.map((item) => (String(item.id) === String(editingPurchaseId) ? purchase : item))
      : [purchase, ...purchases]
    );
    if (!savedPurchase) return;

    const nextProducts = products.map((product) => {
      const item = selectedItems.find((row) => String(row.productId) === String(product.id));
      const previousItem = previousPurchase?.items?.find((row) => String(row.productId) === String(product.id));
      if (!item && !previousItem) return product;
      const previousQuantity = numeric(previousItem?.quantity) + numeric(previousItem?.bonus);
      const nextQuantity = numeric(item?.quantity) + numeric(item?.bonus);
      const nextStock = getStock(product) - previousQuantity + nextQuantity;
      return {
        ...product,
        ...(item ? {
          purchasePrice: numeric(item.purchasePrice),
          salePrice: numeric(item.salePrice),
          lastExpiryDate: item.expiryDate || product.lastExpiryDate || "",
        } : {}),
        currentStock: Math.max(nextStock, 0),
        updatedAt: now,
      };
    });
    await setProducts(nextProducts);

    notify(editingPurchaseId ? t.updated : t.saved, "success");
    closeModal();
  };

  const deletePurchase = async (purchase) => {
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: purchase.billNumber || purchase.supplierName || purchase.companyName || t.confirmDelete,
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;

    const saved = await setPurchases(purchases.filter((item) => String(item.id) !== String(purchase.id)));
    if (!saved) return;

    const nextProducts = products.map((product) => {
      const purchasedItem = purchase.items?.find((item) => String(item.productId) === String(product.id));
      if (!purchasedItem) return product;

      const purchasedQuantity = numeric(purchasedItem.quantity) + numeric(purchasedItem.bonus);
      return {
        ...product,
        currentStock: Math.max(getStock(product) - purchasedQuantity, 0),
        updatedAt: new Date().toISOString(),
      };
    });

    await setProducts(nextProducts);
    notify(t.deleted, "success");
  };

  const filteredPurchases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((item) => `${item.billNumber || ""} ${item.supplierName || supplierName(item.supplierId) || item.companyName || ""}`.toLowerCase().includes(q));
  }, [purchases, search, suppliers]);

  const totals = purchases.reduce((acc, item) => {
    acc.amount += numeric(item.totalAmount);
    acc.paid += numeric(item.paidAmount);
    acc.remaining += numeric(item.remainingAmount);
    return acc;
  }, { amount: 0, paid: 0, remaining: 0 });

  return (
    <div className="purchasing-page" dir={direction}>
      <div className="purchasing-page-header">
        <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <button type="button" className="purchasing-primary-btn" onClick={openModal}><PackagePlus size={18} />{t.newPurchase}</button>
      </div>

      <div className="purchasing-stats">
        <div><span>{t.totalBills}</span><strong>{purchases.length}</strong></div>
        <div><span>{t.totalAmount}</span><strong>{totals.amount.toFixed(2)}</strong></div>
        <div><span>{t.totalPaid}</span><strong>{totals.paid.toFixed(2)}</strong></div>
        <div><span>{t.totalRemaining}</span><strong>{totals.remaining.toFixed(2)}</strong></div>
      </div>

      <section className="purchasing-history-card">
        <div className="purchasing-card-title"><h2>{t.purchases}</h2><div className="purchasing-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div></div>
        <div className="purchasing-table-wrap">
          <table>
            <thead><tr><th>{t.billNo}</th><th>{t.supplier}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.paymentType}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredPurchases.map((item) => (
                <tr key={item.id}><td>{item.billNumber}</td><td>{item.supplierName || supplierName(item.supplierId) || item.companyName || "—"}</td><td>{item.items?.length || 0}</td><td>{numeric(item.totalAmount).toFixed(2)}</td><td>{numeric(item.paidAmount).toFixed(2)}</td><td>{numeric(item.remainingAmount).toFixed(2)}</td><td>{item.paymentMode === "installment" ? t.installment : t.cash}</td><td>{formatDateTime(item.createdAt)}</td><td><div className="purchasing-row-actions"><button type="button" className="edit" onClick={() => openEdit(item)} title={t.edit} aria-label={t.edit}><Edit3 size={15} /></button><button type="button" className="delete" onClick={() => deletePurchase(item)} title={t.delete} aria-label={t.delete}><Trash2 size={15} /></button></div></td></tr>
              ))}
              {!filteredPurchases.length && <tr><td colSpan="9" className="purchasing-empty">{t.noPurchases}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && createPortal((
        <div className="purchasing-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <form className="purchasing-modal" onSubmit={savePurchase} onClick={(event) => event.stopPropagation()}>
            <header className="purchasing-modal-header">
              <div><h2><ShoppingCart size={22} />{editingPurchaseId ? t.editModalTitle : t.modalTitle}</h2><p>{t.modalHint}</p></div>
              <button type="button" className="purchasing-icon-btn" onClick={closeModal}><X size={20} /></button>
            </header>

            <div className="purchasing-modal-body">
              <div className="purchasing-top-fields">
                <label><span>{t.billNumber}</span><input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder={t.billPlaceholder} /></label>
                <label><span><Truck size={15} />{t.supplier}</span><select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setSelectedItems([]); }}><option value="">{t.selectSupplier}</option>{suppliers.filter((supplier) => supplier.status !== "inactive").map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.supplierName}</option>)}</select></label>
              </div>

              <div className="purchasing-picker-section">
                <div className="purchasing-section-heading"><div><h3>{t.availableProducts}</h3><p>{t.clickToAdd}</p></div>{supplierId && <div className="purchasing-product-search"><Search size={16} /><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={t.productSearch} /></div>}</div>
                {!supplierId ? <div className="purchasing-picker-empty">{t.chooseSupplierFirst}</div> : !availableProducts.length ? <div className="purchasing-picker-empty">{t.noProducts}</div> : <div className="purchasing-product-picker">{availableProducts.map((product) => { const active = selectedItems.some((item) => String(item.productId) === String(product.id)); return <button type="button" key={product.id} className={`purchasing-product-chip ${active ? "is-selected" : ""}`} onClick={() => addProduct(product)}><span>{product.productName}</span><small>{product.group || "—"}</small>{active && <Check size={16} />}</button>; })}</div>}
              </div>

              <div className="purchasing-selected-section">
                <div className="purchasing-section-heading"><div><h3>{t.selectedProducts}</h3><p>{selectedItems.length} {t.items}</p></div></div>
                {!selectedItems.length ? <div className="purchasing-picker-empty">{t.noSelected}</div> : <div className="purchasing-item-frames">{selectedItems.map((item, index) => (
                  <article className="purchasing-item-frame" key={item.productId}>
                    <div className="purchasing-item-frame-head"><div className="purchasing-item-number">{index + 1}</div><div><h4>{item.productName}</h4><span>{t.currentStock}: <b>{item.currentStock}</b></span></div><button type="button" onClick={() => removeItem(item.productId)} title={t.remove}><Trash2 size={17} /></button></div>
                    <div className="purchasing-item-grid">
                      <label><span>{t.group}</span><input value={item.group} readOnly /></label>
                      <label><span>{t.cartonSize}</span><input value={item.cartonSize} readOnly /></label>
                      <label><span>{t.purchasePrice}</span><input type="number" min="0" step="0.01" value={item.purchasePrice} onChange={(e) => updateItem(item.productId, "purchasePrice", e.target.value)} /></label>
                      <label><span>{t.cartons}</span><input type="number" min="0" step="1" value={item.cartons} onChange={(e) => updateItem(item.productId, "cartons", e.target.value)} /></label>
                      <label><span>{t.quantity}</span><input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateItem(item.productId, "quantity", e.target.value)} /></label>
                      <label><span>{t.bonus}</span><input type="number" min="0" step="1" value={item.bonus} onChange={(e) => updateItem(item.productId, "bonus", e.target.value)} /></label>
                      <label><span>{t.discount}</span><input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateItem(item.productId, "discount", e.target.value)} /></label>
                      <label><span>{t.lineTotal}</span><input value={lineTotal(item).toFixed(2)} readOnly /></label>
                      <label><span>{t.salePrice}</span><input type="number" min="0" step="0.01" value={item.salePrice} onChange={(e) => updateItem(item.productId, "salePrice", e.target.value)} /></label>
                      <label><span><CalendarDays size={14} />{t.expiryDate}</span><ShamsiDateInput value={item.expiryDate} onChange={(e) => updateItem(item.productId, "expiryDate", e.target.value)} /></label>
                      <label className="purchasing-stock-field"><span>{t.currentStock}</span><input value={item.currentStock} readOnly /></label>
                    </div>
                  </article>
                ))}</div>}
              </div>

              <div className="purchasing-summary">
                <div className="purchasing-summary-main"><span>{t.summary}</span><strong>{t.grandTotal}: {grandTotal.toFixed(2)}</strong></div>
                <div className="purchasing-payment-modes">
                  <button type="button" className={paymentMode === "cash" ? "active" : ""} onClick={() => setPaymentMode("cash")}><CreditCard size={16} />{t.cash}</button>
                  <button type="button" className={paymentMode === "installment" ? "active" : ""} onClick={() => setPaymentMode("installment")}><CreditCard size={16} />{t.installment}</button>
                </div>
                <label><span>{t.paidAmount}</span><input type="number" min="0" max={grandTotal} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>
                <div className="purchasing-balance-box"><span>{t.balance}</span><strong>{remaining.toFixed(2)}</strong></div>
              </div>
            </div>

            <footer className="purchasing-modal-footer"><button type="button" className="purchasing-secondary-btn" onClick={closeModal}>{t.cancel}</button><button className="purchasing-primary-btn" type="submit"><Check size={17} />{t.save}</button></footer>
          </form>
        </div>
      ), document.body)}
    </div>
  );
}

export default Purchasing;
