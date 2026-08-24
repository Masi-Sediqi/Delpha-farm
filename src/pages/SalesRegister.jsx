import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CreditCard,
  Edit3,
  FileText,
  PackageCheck,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { formatDateTime } from "../utils/afghanDate";
import { notify } from "../utils/notify";
import "./SalesRegister.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    title: "Sales",
    subtitle: "Create multi-product sales and post them directly to customer accounts.",
    newSale: "New Sale",
    salesRecords: "Sales Records",
    totalInvoices: "Total Invoices",
    totalSales: "Total Sales",
    totalPaid: "Total Paid",
    totalDue: "Total Due",
    search: "Search invoice or customer...",
    noSales: "No sales have been registered yet.",
    invoiceNo: "Invoice No.", customer: "Customer", date: "Date", items: "Items", total: "Total", paid: "Paid", due: "Due", paymentType: "Payment Type",
    modalTitle: "Register New Sale",
    modalHint: "Choose a customer, add several products and complete the payment details.",
    selectCustomer: "Select customer",
    invoiceNumber: "Invoice Number",
    invoicePlaceholder: "Example: SAL-1001",
    saleDate: "Sale Date",
    availableProducts: "Available Products",
    productSearch: "Search product...",
    clickToAdd: "Click a product to add it to this invoice.",
    noProducts: "No products are available.",
    selectedProducts: "Selected Products",
    noSelected: "No product selected yet.",
    group: "Group",
    cartonSize: "Carton Size",
    currentStock: "Current Stock",
    cartons: "Cartons",
    quantity: "Quantity",
    salePrice: "Sale Price",
    discount: "Discount",
    lineTotal: "Line Total",
    remove: "Remove",
    summary: "Sale Summary",
    grandTotal: "Grand Total",
    paymentMode: "Payment Mode",
    cash: "Cash",
    installment: "Installment",
    paidAmount: "Paid Amount",
    remaining: "Remaining",
    notes: "Notes",
    notesPlaceholder: "Optional sale notes...",
    cancel: "Cancel",
    save: "Save Sale",
    requiredCustomer: "Please select a customer.",
    requiredInvoice: "Please enter an invoice number.",
    requiredProducts: "Please select at least one product.",
    invalidQuantity: "Quantity must be greater than zero.",
    insufficientStock: "Insufficient stock for",
    invalidPaid: "Paid amount cannot be greater than the total amount.",
    saved: "Sale saved successfully.",
    actions: "Actions",
    edit: "Edit",
    editModalTitle: "Edit Sale",
    updated: "Sale updated successfully.",
    delete: "Delete",
    deleted: "Sale deleted successfully.",
    confirmDelete: "Delete this sale?",
    dailyTitle: "Daily Sales",
    dailyHint: "Sales registered on this date.",
    viewDay: "View day sales",
    print: "Print",
    dailyReport: "Daily Sales Report",
    invoices: "Invoices",
    products: "Products",
    invoiceDetail: "Sale Invoice Detail",
    invoiceHint: "Products and payment details for this sale.",
    clickRecord: "View sale detail",
  },
  fa: {
    title: "فروشات",
    subtitle: "فروش چندین دوا را ثبت کنید و مستقیماً در حساب مشتری درج نمایید.",
    newSale: "فروش جدید",
    salesRecords: "ریکاردهای فروشات",
    totalInvoices: "مجموع بل‌ها",
    totalSales: "مجموع فروشات",
    totalPaid: "مجموع پرداخت",
    totalDue: "مجموع باقی‌مانده",
    search: "جستجوی بل یا مشتری...",
    noSales: "هنوز فروش ثبت نشده است.",
    invoiceNo: "بل نمبر", customer: "مشتری", date: "تاریخ", items: "اقلام", total: "جمله", paid: "پرداخت", due: "باقی‌مانده", paymentType: "حالت پرداخت",
    modalTitle: "ثبت فروش جدید",
    modalHint: "مشتری را انتخاب کنید، چند دوا را اضافه نموده و معلومات پرداخت را تکمیل کنید.",
    selectCustomer: "مشتری را انتخاب کنید",
    invoiceNumber: "بل نمبر",
    invoicePlaceholder: "مثلاً SAL-1001",
    saleDate: "تاریخ فروش",
    availableProducts: "محصولات موجود",
    productSearch: "جستجوی دوا...",
    clickToAdd: "روی هر دوا کلیک کنید تا به این بل اضافه شود.",
    noProducts: "هیچ محصولی موجود نیست.",
    selectedProducts: "دواهای انتخاب‌شده",
    noSelected: "هنوز هیچ دوا انتخاب نشده است.",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    currentStock: "موجودی فعلی",
    cartons: "تعداد کارتن",
    quantity: "مقدار",
    salePrice: "قیمت فروش",
    discount: "تخفیف",
    lineTotal: "جمله",
    remove: "حذف",
    summary: "خلاصه فروش",
    grandTotal: "جمله مقدار",
    paymentMode: "حالت پرداخت",
    cash: "پرداخت نقدی",
    installment: "پرداخت قسطی",
    paidAmount: "مقدار پرداخت",
    remaining: "باقی‌مانده",
    notes: "ملاحظات",
    notesPlaceholder: "ملاحظات فروش در صورت نیاز...",
    cancel: "لغو",
    save: "ذخیره فروش",
    requiredCustomer: "لطفاً مشتری را انتخاب کنید.",
    requiredInvoice: "لطفاً بل نمبر را وارد کنید.",
    requiredProducts: "حداقل یک دوا را انتخاب کنید.",
    invalidQuantity: "مقدار فروش باید بیشتر از صفر باشد.",
    insufficientStock: "موجودی کافی نیست برای",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از جمله باشد.",
    saved: "فروش با موفقیت ذخیره شد.",
    actions: "عملیات",
    edit: "ویرایش",
    editModalTitle: "ویرایش فروش",
    updated: "فروش با موفقیت ویرایش شد.",
    delete: "حذف",
    deleted: "فروش با موفقیت حذف شد.",
    confirmDelete: "این فروش حذف شود؟",
    dailyTitle: "فروشات روزانه",
    dailyHint: "فروش‌های ثبت‌شده در این تاریخ.",
    viewDay: "دیدن فروشات همین روز",
    print: "چاپ",
    dailyReport: "راپور فروشات روزانه",
    invoices: "بل‌ها",
    products: "محصولات",
    invoiceDetail: "جزئیات بل فروش",
    invoiceHint: "اقلام و معلومات پرداخت این فروش.",
    clickRecord: "دیدن جزئیات فروش",
  },
  ps: {
    title: "خرڅلاو",
    subtitle: "د څو توکو خرڅلاو ثبت کړئ او مستقیم یې د پېرودونکي حساب ته ولېږئ.",
    newSale: "نوی خرڅلاو",
    salesRecords: "د خرڅلاو ریکارډونه",
    totalInvoices: "ټول بلونه",
    totalSales: "ټول خرڅلاو",
    totalPaid: "ټولې تادیې",
    totalDue: "ټول پاتې",
    search: "د بل یا پېرودونکي لټون...",
    noSales: "تر اوسه خرڅلاو نه دی ثبت شوی.",
    invoiceNo: "بل نمبر", customer: "پېرودونکی", date: "نېټه", items: "توکي", total: "ټول", paid: "تادیه", due: "پاتې", paymentType: "د تادیې ډول",
    modalTitle: "نوی خرڅلاو ثبتول",
    modalHint: "پېرودونکی وټاکئ، څو توکي اضافه کړئ او د تادیې معلومات بشپړ کړئ.",
    selectCustomer: "پېرودونکی وټاکئ",
    invoiceNumber: "بل نمبر",
    invoicePlaceholder: "لکه SAL-1001",
    saleDate: "د خرڅلاو نېټه",
    availableProducts: "موجود توکي",
    productSearch: "د توکي لټون...",
    clickToAdd: "پر توکي کلیک وکړئ ترڅو بل ته اضافه شي.",
    noProducts: "هیڅ محصول موجود نه دی.",
    selectedProducts: "ټاکل شوي توکي",
    noSelected: "تر اوسه کوم توکی نه دی ټاکل شوی.",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    currentStock: "اوسنی موجودي",
    cartons: "کارتنونه",
    quantity: "مقدار",
    salePrice: "د خرڅلاو بیه",
    discount: "تخفیف",
    lineTotal: "ټول",
    remove: "حذف",
    summary: "د خرڅلاو لنډیز",
    grandTotal: "ټول مبلغ",
    paymentMode: "د تادیې ډول",
    cash: "نغدي",
    installment: "قسطی",
    paidAmount: "ورکړل شوی مبلغ",
    remaining: "پاتې مبلغ",
    notes: "یادښتونه",
    notesPlaceholder: "د خرڅلاو اختیاري یادښتونه...",
    cancel: "لغوه",
    save: "خرڅلاو ثبت کړئ",
    requiredCustomer: "مهرباني وکړئ پېرودونکی وټاکئ.",
    requiredInvoice: "مهرباني وکړئ بل نمبر ولیکئ.",
    requiredProducts: "لږ تر لږه یو توکی وټاکئ.",
    invalidQuantity: "مقدار باید له صفر څخه زیات وي.",
    insufficientStock: "کافي موجودي نشته د",
    invalidPaid: "ورکړل شوی مبلغ له ټول مبلغ څخه زیات نه شي کېدای.",
    saved: "خرڅلاو په بریالیتوب ثبت شو.",
    actions: "عملیات",
    edit: "سمون",
    editModalTitle: "د خرڅلاو سمون",
    updated: "خرڅلاو په بریالیتوب سم شو.",
    delete: "حذف",
    deleted: "خرڅلاو په بریالیتوب سره حذف شو.",
    confirmDelete: "دا خرڅلاو حذف شي؟",
    dailyTitle: "ورځنی خرڅلاو",
    dailyHint: "په دې نېټه ثبت شوي خرڅلاو.",
    viewDay: "د همدې ورځې خرڅلاو وګورئ",
    print: "چاپ",
    dailyReport: "د ورځني خرڅلاو راپور",
    invoices: "بلونه",
    products: "محصولات",
    invoiceDetail: "د خرڅلاو بل جزئیات",
    invoiceHint: "د دې خرڅلاو توکي او د تادیې معلومات.",
    clickRecord: "د خرڅلاو جزئیات وګورئ",
  },
};

const numeric = (value) => Math.max(Number(value || 0), 0);
const getStock = (product) => numeric(product?.currentStock ?? product?.stock ?? product?.quantity ?? 0);
const today = () => new Date().toISOString().slice(0, 10);

export default function SalesRegister() {
  const [sales, setSales] = useJsonCollection("salesRegister");
  const navigate = useNavigate();
  const [customers] = useJsonCollection("customerRegistry");
  const [products, setProducts] = useJsonCollection("products");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [dailyDate, setDailyDate] = useState("");
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");

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

  useEffect(() => {
    document.body.classList.toggle("sales-register-modal-open", showModal || Boolean(dailyDate));
    return () => document.body.classList.remove("sales-register-modal-open");
  }, [showModal, dailyDate]);

  const customerName = (id) => {
    const customer = customers.find((item) => String(item.id) === String(id));
    return customer?.fullName || customer?.companyName || "—";
  };

  const availableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (getStock(product) <= 0) return false;
      if (!q) return true;
      return `${product.productName || ""} ${product.group || ""} ${product.companyName || ""}`.toLowerCase().includes(q);
    });
  }, [products, productSearch]);

  const openModal = () => {
    setEditingSaleId(null);
    setCustomerId("");
    setInvoiceNumber(`SAL-${String(Date.now()).slice(-7)}`);
    setSaleDate(today());
    setSelectedItems([]);
    setPaymentMode("cash");
    setPaidAmount("");
    setNotes("");
    setProductSearch("");
    setShowModal(true);
  };

  const openEdit = (sale) => {
    setEditingSaleId(sale.id);
    setCustomerId(sale.customerId || "");
    setInvoiceNumber(sale.invoiceNumber || "");
    setSaleDate(sale.saleDate || today());
    setSelectedItems((sale.items || []).map((item) => ({
      productId: item.productId,
      productName: item.productName || "",
      group: item.group || "",
      cartonSize: item.cartonSize || "",
      currentStock: getStock(products.find((product) => String(product.id) === String(item.productId))) + numeric(item.quantity),
      cartons: item.cartons || 0,
      quantity: item.quantity || 1,
      salePrice: numeric(item.salePrice),
      discount: numeric(item.discount),
    })));
    setPaymentMode(sale.paymentMode || "cash");
    setPaidAmount(String(sale.paidAmount ?? ""));
    setNotes(sale.notes || "");
    setProductSearch("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSaleId(null);
  };

  const addProduct = (product) => {
    if (selectedItems.some((item) => String(item.productId) === String(product.id))) return;
    setSelectedItems((current) => [
      ...current,
      {
        productId: product.id,
        productName: product.productName || "",
        group: product.group || "",
        cartonSize: product.cartonSize || "",
        currentStock: getStock(product),
        cartons: 0,
        quantity: 1,
        salePrice: numeric(product.salePrice),
        discount: 0,
      },
    ]);
  };

  const updateItem = (productId, field, value) => {
    setSelectedItems((current) => current.map((item) => (
      String(item.productId) === String(productId) ? { ...item, [field]: value } : item
    )));
  };

  const removeItem = (productId) => {
    setSelectedItems((current) => current.filter((item) => String(item.productId) !== String(productId)));
  };

  const lineTotal = (item) => Math.max(numeric(item.quantity) * numeric(item.salePrice) - numeric(item.discount), 0);
  const grandTotal = selectedItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const paid = Math.min(numeric(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (showModal && paymentMode === "cash") setPaidAmount(grandTotal ? String(grandTotal) : "");
  }, [grandTotal, paymentMode, showModal]);

  const saveSale = async (event) => {
    event.preventDefault();
    if (!customerId) return notify(t.requiredCustomer, "warning");
    if (!invoiceNumber.trim()) return notify(t.requiredInvoice, "warning");
    if (!selectedItems.length) return notify(t.requiredProducts, "warning");

    for (const item of selectedItems) {
      if (numeric(item.quantity) <= 0) return notify(t.invalidQuantity, "warning");
      const previousSale = editingSaleId ? sales.find((sale) => String(sale.id) === String(editingSaleId)) : null;
      const previousItem = previousSale?.items?.find((saleItem) => String(saleItem.productId) === String(item.productId));
      const product = products.find((productItem) => String(productItem.id) === String(item.productId));
      const availableStock = getStock(product) + numeric(previousItem?.quantity);
      if (numeric(item.quantity) > availableStock) {
        return notify(`${t.insufficientStock} ${item.productName}.`, "warning");
      }
    }
    if (numeric(paidAmount) > grandTotal) return notify(t.invalidPaid, "warning");

    const now = new Date().toISOString();
    const sale = {
      id: editingSaleId || `sale-${Date.now()}`,
      customerId,
      customerName: customerName(customerId),
      invoiceNumber: invoiceNumber.trim(),
      saleDate,
      paymentMode,
      totalAmount: grandTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      notes: notes.trim(),
      items: selectedItems.map((item) => ({ ...item, lineTotal: lineTotal(item) })),
      createdAt: editingSaleId ? sales.find((item) => String(item.id) === String(editingSaleId))?.createdAt || now : now,
      updatedAt: now,
    };

    const saved = await setSales(editingSaleId
      ? sales.map((item) => (String(item.id) === String(editingSaleId) ? sale : item))
      : [sale, ...sales]
    );
    if (!saved) return;

    const previousSale = editingSaleId ? sales.find((item) => String(item.id) === String(editingSaleId)) : null;
    const nextProducts = products.map((product) => {
      const soldItem = selectedItems.find((item) => String(item.productId) === String(product.id));
      const previousItem = previousSale?.items?.find((item) => String(item.productId) === String(product.id));
      if (!soldItem && !previousItem) return product;
      const nextStock = getStock(product) + numeric(previousItem?.quantity) - numeric(soldItem?.quantity);
      return {
        ...product,
        currentStock: Math.max(nextStock, 0),
        updatedAt: now,
      };
    });
    await setProducts(nextProducts);

    notify(editingSaleId ? t.updated : t.saved, "success");
    closeModal();
  };

  const deleteSale = async (sale) => {
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: sale.invoiceNumber || sale.customerName || t.confirmDelete,
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;

    const saved = await setSales(sales.filter((item) => String(item.id) !== String(sale.id)));
    if (!saved) return;

    const nextProducts = products.map((product) => {
      const soldItem = sale.items?.find((item) => String(item.productId) === String(product.id));
      if (!soldItem) return product;

      return {
        ...product,
        currentStock: getStock(product) + numeric(soldItem.quantity),
        updatedAt: new Date().toISOString(),
      };
    });

    await setProducts(nextProducts);
    notify(t.deleted, "success");
  };

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => `${sale.invoiceNumber || ""} ${sale.customerName || customerName(sale.customerId)}`.toLowerCase().includes(q));
  }, [sales, search, customers]);

  const saleDay = (sale) => String(sale.saleDate || sale.createdAt || "").slice(0, 10);
  const dailySales = useMemo(
    () => sales.filter((sale) => dailyDate && saleDay(sale) === dailyDate),
    [sales, dailyDate]
  );
  const dailyTotals = dailySales.reduce((acc, sale) => {
    acc.invoices += 1;
    acc.items += sale.items?.length || 0;
    acc.total += numeric(sale.totalAmount);
    acc.paid += numeric(sale.paidAmount);
    acc.due += numeric(sale.remainingAmount);
    return acc;
  }, { invoices: 0, items: 0, total: 0, paid: 0, due: 0 });

  const totals = sales.reduce((acc, sale) => {
    acc.sales += numeric(sale.totalAmount);
    acc.paid += numeric(sale.paidAmount);
    acc.due += numeric(sale.remainingAmount);
    return acc;
  }, { sales: 0, paid: 0, due: 0 });

  const money = (value) => numeric(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const printDailySales = () => {
    const title = `${t.dailyReport} - ${formatDateTime(dailyDate)}`;
    const directionAttr = direction;
    const rows = dailySales.map((sale) => `
      <tr>
        <td>${sale.invoiceNumber || "—"}</td>
        <td>${sale.customerName || customerName(sale.customerId)}</td>
        <td>${sale.items?.length || 0}</td>
        <td>${money(sale.totalAmount)}</td>
        <td>${money(sale.paidAmount)}</td>
        <td>${money(sale.remainingAmount)}</td>
        <td>${sale.paymentMode === "installment" ? t.installment : t.cash}</td>
      </tr>
    `).join("");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!doctype html>
      <html dir="${directionAttr}">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 14mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #fff; }
            .sheet { min-height: 100vh; display: grid; gap: 16px; align-content: start; }
            header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 2px solid #111827; padding-bottom: 12px; }
            h1 { margin: 0; font-size: 22px; }
            p { margin: 4px 0 0; color: #475569; font-size: 12px; }
            .date { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 14px; font-weight: 800; white-space: nowrap; }
            .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
            .summary div { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
            .summary span { display: block; color: #64748b; font-size: 10px; }
            .summary strong { display: block; margin-top: 4px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: start; }
            th { background: #f8fafc; color: #334155; font-size: 10px; text-transform: uppercase; }
            tfoot td { font-weight: 900; background: #f9fafb; }
            @media print { .sheet { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header>
              <div><h1>${t.dailyReport}</h1><p>${t.dailyHint}</p></div>
              <div class="date">${formatDateTime(dailyDate)}</div>
            </header>
            <section class="summary">
              <div><span>${t.invoices}</span><strong>${dailyTotals.invoices}</strong></div>
              <div><span>${t.items}</span><strong>${dailyTotals.items}</strong></div>
              <div><span>${t.total}</span><strong>${money(dailyTotals.total)}</strong></div>
              <div><span>${t.paid}</span><strong>${money(dailyTotals.paid)}</strong></div>
              <div><span>${t.due}</span><strong>${money(dailyTotals.due)}</strong></div>
            </section>
            <table>
              <thead><tr><th>${t.invoiceNo}</th><th>${t.customer}</th><th>${t.items}</th><th>${t.total}</th><th>${t.paid}</th><th>${t.due}</th><th>${t.paymentType}</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="7">${t.noSales}</td></tr>`}</tbody>
            </table>
          </main>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  return (
    <div className="sales-register-page" dir={direction}>
      <div className="sales-register-header">
        <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <button type="button" className="sales-register-primary" onClick={openModal}><ShoppingBag size={18} />{t.newSale}</button>
      </div>

      <div className="sales-register-stats">
        <div><FileText size={20} /><span>{t.totalInvoices}</span><strong>{sales.length}</strong></div>
        <div><ShoppingBag size={20} /><span>{t.totalSales}</span><strong>{money(totals.sales)}</strong></div>
        <div><Wallet size={20} /><span>{t.totalPaid}</span><strong>{money(totals.paid)}</strong></div>
        <div className="due"><CreditCard size={20} /><span>{t.totalDue}</span><strong>{money(totals.due)}</strong></div>
      </div>

      <section className="sales-register-card">
        <div className="sales-register-card-head">
          <h2>{t.salesRecords}</h2>
          <div className="sales-register-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div>
        </div>
        <div className="sales-register-table-wrap">
          <table>
            <thead><tr><th>{t.invoiceNo}</th><th>{t.customer}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.due}</th><th>{t.paymentType}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="sales-register-clickable-row" onClick={() => navigate(`/sale-detail/${sale.id}`)} title={t.clickRecord}>
                  <td><strong>{sale.invoiceNumber}</strong></td>
                  <td>{sale.customerName || customerName(sale.customerId)}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td>{money(sale.totalAmount)}</td>
                  <td>{money(sale.paidAmount)}</td>
                  <td className={numeric(sale.remainingAmount) > 0 ? "sales-register-due" : ""}>{money(sale.remainingAmount)}</td>
                  <td>{sale.paymentMode === "installment" ? t.installment : t.cash}</td>
                  <td>
                    <button type="button" className="sales-register-date-link" onClick={() => setDailyDate(saleDay(sale))} title={t.viewDay}>
                      {formatDateTime(sale.saleDate || sale.createdAt)}
                    </button>
                  </td>
                  <td>
                    <div className="sales-register-row-actions">
                      <button type="button" className="edit" onClick={(event) => { event.stopPropagation(); openEdit(sale); }} title={t.edit} aria-label={t.edit}><Edit3 size={15} /></button>
                      <button type="button" className="delete" onClick={(event) => { event.stopPropagation(); deleteSale(sale); }} title={t.delete} aria-label={t.delete}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredSales.length && <tr><td colSpan="9" className="sales-register-empty">{t.noSales}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {dailyDate && createPortal(
        <div className="sales-daily-overlay" role="presentation" onClick={(e) => e.currentTarget === e.target && setDailyDate("")}>
          <section className="sales-daily-modal" role="dialog" aria-modal="true" aria-labelledby="sales-daily-title" dir={direction}>
            <header className="sales-daily-head">
              <div>
                <h2 id="sales-daily-title"><FileText size={22} />{t.dailyTitle}</h2>
                <p>{t.dailyHint} <strong>{formatDateTime(dailyDate)}</strong></p>
              </div>
              <div className="sales-daily-actions">
                <button type="button" onClick={printDailySales}><Printer size={16} />{t.print}</button>
                <button type="button" className="icon" onClick={() => setDailyDate("")} aria-label={t.cancel}><X size={19} /></button>
              </div>
            </header>
            <div className="sales-daily-summary">
              <article><span>{t.invoices}</span><strong>{dailyTotals.invoices}</strong></article>
              <article><span>{t.items}</span><strong>{dailyTotals.items}</strong></article>
              <article><span>{t.total}</span><strong>{money(dailyTotals.total)}</strong></article>
              <article><span>{t.paid}</span><strong>{money(dailyTotals.paid)}</strong></article>
              <article className={dailyTotals.due > 0 ? "due" : ""}><span>{t.due}</span><strong>{money(dailyTotals.due)}</strong></article>
            </div>
            <div className="sales-daily-table-wrap">
              <table>
                <thead><tr><th>{t.invoiceNo}</th><th>{t.customer}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.due}</th><th>{t.paymentType}</th></tr></thead>
                <tbody>
                  {dailySales.map((sale) => (
                    <tr key={sale.id}>
                      <td><strong>{sale.invoiceNumber}</strong></td>
                      <td>{sale.customerName || customerName(sale.customerId)}</td>
                      <td>{sale.items?.length || 0}</td>
                      <td>{money(sale.totalAmount)}</td>
                      <td>{money(sale.paidAmount)}</td>
                      <td className={numeric(sale.remainingAmount) > 0 ? "sales-register-due" : ""}>{money(sale.remainingAmount)}</td>
                      <td>{sale.paymentMode === "installment" ? t.installment : t.cash}</td>
                    </tr>
                  ))}
                  {!dailySales.length && <tr><td colSpan="7" className="sales-register-empty">{t.noSales}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>,
        document.body
      )}

      {showModal && createPortal(
        <div className="sales-register-overlay" role="presentation" onClick={(e) => e.currentTarget === e.target && closeModal()}>
          <form
            className="sales-register-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-register-modal-title"
            dir={direction}
            onSubmit={saveSale}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sales-register-modal-head">
              <div><h2 id="sales-register-modal-title"><ShoppingBag size={22} />{editingSaleId ? t.editModalTitle : t.modalTitle}</h2><p>{t.modalHint}</p></div>
              <button type="button" className="sales-register-icon" onClick={closeModal}><X size={20} /></button>
            </header>

            <div className="sales-register-modal-body">
              <div className="sales-register-top-grid">
                <label><span><UserRound size={15} />{t.customer}</span><select value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">{t.selectCustomer}</option>{customers.filter((c) => c.status !== "inactive").map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName || customer.companyName}</option>)}</select></label>
                <label><span>{t.invoiceNumber}</span><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder={t.invoicePlaceholder} /></label>
                <label><span>{t.saleDate}</span><ShamsiDateInput value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></label>
              </div>

              <section className="sales-register-picker-section">
                <div className="sales-register-section-head">
                  <div><h3>{t.availableProducts}</h3><p>{t.clickToAdd}</p></div>
                  <div className="sales-register-product-search"><Search size={16} /><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={t.productSearch} /></div>
                </div>
                {!availableProducts.length ? <div className="sales-register-picker-empty">{t.noProducts}</div> : (
                  <div className="sales-register-product-picker">
                    {availableProducts.map((product) => {
                      const active = selectedItems.some((item) => String(item.productId) === String(product.id));
                      return <button type="button" key={product.id} className={active ? "is-selected" : ""} onClick={() => addProduct(product)}><span>{product.productName}</span><small>{product.group || "—"} · {t.currentStock}: {getStock(product)}</small>{active && <Check size={15} />}</button>;
                    })}
                  </div>
                )}
              </section>

              <section className="sales-register-selected-section">
                <div className="sales-register-section-head"><div><h3>{t.selectedProducts}</h3><p>{selectedItems.length} {t.items}</p></div></div>
                {!selectedItems.length ? <div className="sales-register-picker-empty">{t.noSelected}</div> : (
                  <div className="sales-register-item-frames">
                    {selectedItems.map((item, index) => (
                      <article className="sales-register-item-frame" key={item.productId}>
                        <div className="sales-register-item-head">
                          <div className="sales-register-item-no">{index + 1}</div>
                          <div><h4>{item.productName}</h4><span>{t.currentStock}: <b>{item.currentStock}</b></span></div>
                          <button type="button" onClick={() => removeItem(item.productId)} title={t.remove}><Trash2 size={17} /></button>
                        </div>
                        <div className="sales-register-item-grid">
                          <label><span>{t.group}</span><input value={item.group} readOnly /></label>
                          <label><span>{t.cartonSize}</span><input value={item.cartonSize} readOnly /></label>
                          <label><span>{t.currentStock}</span><input value={item.currentStock} readOnly /></label>
                          <label><span>{t.cartons}</span><input type="number" min="0" step="1" value={item.cartons} onChange={(e) => updateItem(item.productId, "cartons", e.target.value)} /></label>
                          <label><span>{t.quantity}</span><input type="number" min="1" max={item.currentStock} step="1" value={item.quantity} onChange={(e) => updateItem(item.productId, "quantity", e.target.value)} /></label>
                          <label><span>{t.salePrice}</span><input type="number" min="0" step="0.01" value={item.salePrice} onChange={(e) => updateItem(item.productId, "salePrice", e.target.value)} /></label>
                          <label><span>{t.discount}</span><input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateItem(item.productId, "discount", e.target.value)} /></label>
                          <label className="sales-register-line-total"><span>{t.lineTotal}</span><input value={lineTotal(item).toFixed(2)} readOnly /></label>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="sales-register-summary">
                <div className="sales-register-summary-total"><span>{t.summary}</span><strong>{t.grandTotal}: {money(grandTotal)}</strong></div>
                <div className="sales-register-payment-modes">
                  <button type="button" className={paymentMode === "cash" ? "active" : ""} onClick={() => setPaymentMode("cash")}><Wallet size={16} />{t.cash}</button>
                  <button type="button" className={paymentMode === "installment" ? "active" : ""} onClick={() => setPaymentMode("installment")}><CreditCard size={16} />{t.installment}</button>
                </div>
                <label><span>{t.paidAmount}</span><input type="number" min="0" max={grandTotal} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>
                <div className="sales-register-balance"><span>{t.remaining}</span><strong>{money(remaining)}</strong></div>
                <label className="sales-register-notes"><span>{t.notes}</span><textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} /></label>
              </section>
            </div>

            <footer className="sales-register-modal-footer">
              <button type="button" className="sales-register-secondary" onClick={closeModal}>{t.cancel}</button>
              <button type="submit" className="sales-register-primary"><PackageCheck size={17} />{t.save}</button>
            </footer>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
