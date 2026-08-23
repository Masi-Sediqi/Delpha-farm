import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  PackagePlus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Purchasing.css";

const languageKey = "afghan-power-language";

const translations = {
  en: {
    title: "Purchasing",
    subtitle: "Register multi-product purchases from companies.",
    newPurchase: "New Purchase",
    purchases: "Purchase Records",
    totalBills: "Total Bills",
    totalAmount: "Total Purchase Amount",
    totalPaid: "Total Paid",
    totalRemaining: "Total Remaining",
    search: "Search bill number or company...",
    noPurchases: "No purchases have been registered yet.",
    billNo: "Bill No.", company: "Company", date: "Date", total: "Total", paid: "Paid", remaining: "Remaining", paymentType: "Payment Type", items: "Items",
    modalTitle: "Register New Purchase",
    modalHint: "Choose a company, select several products and enter purchase details.",
    selectCompany: "Select company",
    billNumber: "Bill Number",
    billPlaceholder: "Example: INV-1001",
    productsFromCompany: "Products of Selected Company",
    productSearch: "Search product...",
    chooseCompanyFirst: "Select a company first to see its products.",
    noCompanyProducts: "No products are registered for this company.",
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
    requiredCompany: "Please select a company.",
    requiredBill: "Please enter the bill number.",
    requiredProducts: "Please select at least one product.",
    invalidPaid: "Paid amount cannot be greater than the total amount.",
    saved: "Purchase saved successfully.",
    remove: "Remove",
  },
  fa: {
    title: "خریداری",
    subtitle: "خرید چندین جنس از شرکت‌ها را در یک بل ثبت کنید.",
    newPurchase: "خریداری جدید",
    purchases: "ریکاردهای خریداری",
    totalBills: "مجموع بل‌ها",
    totalAmount: "مجموع خریداری",
    totalPaid: "مجموع پرداخت",
    totalRemaining: "مجموع باقی‌مانده",
    search: "جستجوی بل نمبر یا شرکت...",
    noPurchases: "هنوز خریداری ثبت نشده است.",
    billNo: "بل نمبر", company: "شرکت", date: "تاریخ", total: "جمله مقدار", paid: "پرداخت", remaining: "باقی‌مانده", paymentType: "حالت پرداخت", items: "تعداد اقلام",
    modalTitle: "ثبت خریداری جدید",
    modalHint: "شرکت را انتخاب کنید، چند دوا را اضافه نموده و جزئیات خرید را وارد کنید.",
    selectCompany: "شرکت را انتخاب کنید",
    billNumber: "بل نمبر",
    billPlaceholder: "مثلاً INV-1001",
    productsFromCompany: "دواهای شرکت انتخاب‌شده",
    productSearch: "جستجوی دوا...",
    chooseCompanyFirst: "اول یک شرکت را انتخاب کنید تا دواهای آن نمایش داده شود.",
    noCompanyProducts: "برای این شرکت هنوز محصول ثبت نشده است.",
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
    requiredCompany: "لطفاً شرکت را انتخاب کنید.",
    requiredBill: "لطفاً بل نمبر را وارد کنید.",
    requiredProducts: "حداقل یک دوا را انتخاب کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از جمله مقدار باشد.",
    saved: "خریداری با موفقیت ذخیره شد.",
    remove: "حذف",
  },
  ps: {
    title: "پېرود",
    subtitle: "له شرکتونو څخه د څو توکو پېرود په یوه بل کې ثبت کړئ.",
    newPurchase: "نوی پېرود",
    purchases: "د پېرود ریکارډونه",
    totalBills: "ټول بلونه",
    totalAmount: "د پېرود ټول مبلغ",
    totalPaid: "ټولې ورکړې",
    totalRemaining: "پاتې مبلغ",
    search: "د بل نمبر یا شرکت لټون...",
    noPurchases: "تر اوسه پېرود نه دی ثبت شوی.",
    billNo: "بل نمبر", company: "شرکت", date: "نېټه", total: "ټول مبلغ", paid: "ورکړه", remaining: "پاتې", paymentType: "د ورکړې ډول", items: "توکي",
    modalTitle: "نوی پېرود ثبتول",
    modalHint: "شرکت وټاکئ، څو درمل اضافه کړئ او د پېرود معلومات ولیکئ.",
    selectCompany: "شرکت وټاکئ",
    billNumber: "بل نمبر",
    billPlaceholder: "لکه INV-1001",
    productsFromCompany: "د ټاکل شوي شرکت توکي",
    productSearch: "د توکي لټون...",
    chooseCompanyFirst: "لومړی شرکت وټاکئ ترڅو د هغه توکي ښکاره شي.",
    noCompanyProducts: "د دې شرکت لپاره توکي نه دي ثبت شوي.",
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
    requiredCompany: "مهرباني وکړئ شرکت وټاکئ.",
    requiredBill: "مهرباني وکړئ بل نمبر ولیکئ.",
    requiredProducts: "لږ تر لږه یو توکی وټاکئ.",
    invalidPaid: "ورکړل شوی مبلغ له ټول مبلغ څخه زیات نه شي کېدای.",
    saved: "پېرود په بریالیتوب سره ذخیره شو.",
    remove: "حذف",
  },
};

const numeric = (value) => Math.max(Number(value || 0), 0);
const getStock = (product) => numeric(product?.currentStock ?? product?.stock ?? product?.quantity ?? 0);

function Purchasing() {
  const [purchases, setPurchases] = useJsonCollection("purchases");
  const [companies] = useJsonCollection("companies");
  const [products, setProducts] = useJsonCollection("products");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState("");
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

  const companyName = (id) => companies.find((item) => String(item.id) === String(id))?.companyName || "—";

  const companyProducts = useMemo(() => {
    if (!companyId) return [];
    const q = productSearch.trim().toLowerCase();
    return products.filter((item) => {
      if (String(item.companyId) !== String(companyId)) return false;
      if (!q) return true;
      return `${item.productName || ""} ${item.group || ""}`.toLowerCase().includes(q);
    });
  }, [products, companyId, productSearch]);

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
    setCompanyId("");
    setBillNumber("");
    setSelectedItems([]);
    setPaymentMode("cash");
    setPaidAmount("");
    setProductSearch("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const savePurchase = async (event) => {
    event.preventDefault();
    if (!companyId) return notify(t.requiredCompany, "error");
    if (!billNumber.trim()) return notify(t.requiredBill, "error");
    if (!selectedItems.length) return notify(t.requiredProducts, "error");
    if (numeric(paidAmount) > grandTotal) return notify(t.invalidPaid, "error");

    const now = new Date().toISOString();
    const purchase = {
      id: `purchase-${Date.now()}`,
      companyId,
      companyName: companyName(companyId),
      billNumber: billNumber.trim(),
      paymentMode,
      paidAmount: paid,
      totalAmount: grandTotal,
      remainingAmount: remaining,
      items: selectedItems.map((item) => ({ ...item, lineTotal: lineTotal(item) })),
      createdAt: now,
    };

    const savedPurchase = await setPurchases([purchase, ...purchases]);
    if (!savedPurchase) return;

    const nextProducts = products.map((product) => {
      const item = selectedItems.find((row) => String(row.productId) === String(product.id));
      if (!item) return product;
      return {
        ...product,
        purchasePrice: numeric(item.purchasePrice),
        salePrice: numeric(item.salePrice),
        currentStock: getStock(product) + numeric(item.quantity) + numeric(item.bonus),
        lastExpiryDate: item.expiryDate || product.lastExpiryDate || "",
        updatedAt: now,
      };
    });
    await setProducts(nextProducts);

    notify(t.saved, "success");
    closeModal();
  };

  const filteredPurchases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((item) => `${item.billNumber || ""} ${item.companyName || companyName(item.companyId)}`.toLowerCase().includes(q));
  }, [purchases, search, companies]);

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
            <thead><tr><th>{t.billNo}</th><th>{t.company}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.paymentType}</th><th>{t.date}</th></tr></thead>
            <tbody>
              {filteredPurchases.map((item) => (
                <tr key={item.id}><td>{item.billNumber}</td><td>{item.companyName || companyName(item.companyId)}</td><td>{item.items?.length || 0}</td><td>{numeric(item.totalAmount).toFixed(2)}</td><td>{numeric(item.paidAmount).toFixed(2)}</td><td>{numeric(item.remainingAmount).toFixed(2)}</td><td>{item.paymentMode === "installment" ? t.installment : t.cash}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td></tr>
              ))}
              {!filteredPurchases.length && <tr><td colSpan="8" className="purchasing-empty">{t.noPurchases}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="purchasing-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <form className="purchasing-modal" onSubmit={savePurchase}>
            <header className="purchasing-modal-header">
              <div><h2><ShoppingCart size={22} />{t.modalTitle}</h2><p>{t.modalHint}</p></div>
              <button type="button" className="purchasing-icon-btn" onClick={closeModal}><X size={20} /></button>
            </header>

            <div className="purchasing-modal-body">
              <div className="purchasing-top-fields">
                <label><span><Building2 size={15} />{t.company}</span><select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setSelectedItems([]); }}><option value="">{t.selectCompany}</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.companyName}</option>)}</select></label>
                <label><span>{t.billNumber}</span><input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder={t.billPlaceholder} /></label>
              </div>

              <div className="purchasing-picker-section">
                <div className="purchasing-section-heading"><div><h3>{t.productsFromCompany}</h3><p>{t.clickToAdd}</p></div>{companyId && <div className="purchasing-product-search"><Search size={16} /><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={t.productSearch} /></div>}</div>
                {!companyId ? <div className="purchasing-picker-empty">{t.chooseCompanyFirst}</div> : !companyProducts.length ? <div className="purchasing-picker-empty">{t.noCompanyProducts}</div> : <div className="purchasing-product-picker">{companyProducts.map((product) => { const active = selectedItems.some((item) => String(item.productId) === String(product.id)); return <button type="button" key={product.id} className={`purchasing-product-chip ${active ? "is-selected" : ""}`} onClick={() => addProduct(product)}><span>{product.productName}</span><small>{product.group || "—"}</small>{active && <Check size={16} />}</button>; })}</div>}
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
                      <label><span><CalendarDays size={14} />{t.expiryDate}</span><input type="date" value={item.expiryDate} onChange={(e) => updateItem(item.productId, "expiryDate", e.target.value)} /></label>
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
      )}
    </div>
  );
}

export default Purchasing;
