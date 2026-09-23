import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  Edit3,
  FileText,
  Lock,
  MapPin,
  Phone,
  Printer,
  ReceiptText,
  Trash2,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { formatDateTime } from "../utils/afghanDate";
import { notify } from "../utils/notify";
import "./SupplierDetail.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    back: "Back to Suppliers",
    title: "Supplier Detail",
    subtitle: "Supplier profile, purchases, payments and running balance.",
    payment: "Payment",
    print: "Print",
    ledgerPrintTitle: "Supplier Ledger",
    paymentReceipt: "Payment Receipt",
    amountPaid: "Amount Paid",
    supplierLabel: "Supplier",
    totalPurchases: "Total Purchases",
    totalPayments: "Total Payments",
    currentBalance: "Current Balance",
    transactions: "Ledger Transactions",
    tabLedger: "Ledger",
    tabPurchases: "Purchases",
    tabPayments: "Payments",
    tabProfit: "Profit",
    tabActivity: "Activity",
    returnsTotal: "Purchase Returns",
    netPurchases: "Net Purchases",
    outstanding: "Outstanding",
    profitInfo: "Financial summary based on supplier purchase, return and payment records.",
    noPurchases: "No purchases recorded for this supplier.",
    noPayments: "No payments recorded for this supplier.",
    noActivity: "No activity recorded for this supplier.",
    supplierInfo: "Supplier Information",
    type: "Type",
    currency: "Currency",
    contact: "Contact Person",
    phone: "Phone Number",
    address: "Address",
    openingBalance: "Opening Balance",
    ledgerPage: "Payment Ledger Page",
    notes: "Notes",
    date: "Date",
    reference: "Reference",
    description: "Description",
    debit: "Purchase / Debit",
    credit: "Payment / Credit",
    balance: "Running Balance",
    actions: "Actions",
    items: "Items",
    purchaseTotal: "Purchase Total",
    paidAtPurchase: "Paid",
    remainingDebt: "Remaining",
    edit: "Edit",
    delete: "Delete",
    purchase: "Purchase",
    purchasePayment: "Payment at Purchase",
    purchaseReturn: "Purchase Return",
    manualPayment: "Payment",
    opening: "Opening Balance",
    noTransactions: "No purchases or payments have been recorded for this supplier yet.",
    youOwe: "You owe this supplier",
    supplierOwes: "This supplier owes you",
    settled: "Account is settled",
    paymentTitle: "Register Supplier Payment",
    paymentHint: "Record a payment made to this supplier. It will immediately appear in the supplier ledger.",
    paymentDate: "Payment Date",
    amount: "Amount",
    unit: "Unit",
    afn: "Afghani (AFN)",
    usd: "US Dollar (USD)",
    inr: "Indian Rupee (INR)",
    eur: "Euro (EUR)",
    paymentDescription: "Description",
    descriptionPlaceholder: "Example: Cash payment against previous invoices",
    cancel: "Cancel",
    savePayment: "Save Payment",
    requiredAmount: "Please enter an amount greater than zero.",
    saved: "Payment saved successfully.",
    updated: "Payment updated successfully.",
    deleted: "Payment deleted successfully.",
    confirmDelete: "Delete this payment record?",
    supplierMissing: "Supplier not found.",
  },
  fa: {
    back: "برگشت به تأمین‌کننده‌گان",
    title: "جزئیات تأمین‌کننده",
    subtitle: "پروفایل، خریداری‌ها، پرداخت‌ها و بیلانس جاری تأمین‌کننده.",
    payment: "پرداخت",
    print: "پرنت",
    ledgerPrintTitle: "لیجر تأمین‌کننده",
    paymentReceipt: "رسید پرداخت",
    amountPaid: "مقدار پرداخت",
    supplierLabel: "تأمین‌کننده",
    totalPurchases: "مجموع خریداری",
    totalPayments: "مجموع پرداخت",
    currentBalance: "بیلانس فعلی",
    transactions: "لیجر تأمین‌کننده",
    tabLedger: "لیجر",
    tabPurchases: "خریداری ها",
    tabPayments: "پرداخت ها",
    tabProfit: "سود",
    tabActivity: "فعالیت",
    returnsTotal: "مجموع برگشت خرید",
    netPurchases: "خرید خالص",
    outstanding: "باقیمانده",
    profitInfo: "خلاصه مالی براساس خریداری، برگشت خرید و پرداخت های ثبت شده این تأمین‌کننده.",
    noPurchases: "برای این تأمین‌کننده خریداری ثبت نشده است.",
    noPayments: "برای این تأمین‌کننده پرداخت ثبت نشده است.",
    noActivity: "برای این تأمین‌کننده فعالیتی ثبت نشده است.",
    supplierInfo: "معلومات تأمین‌کننده",
    type: "نوع",
    currency: "نوع اسعار",
    contact: "شخص ارتباطی",
    phone: "شماره تماس",
    address: "آدرس",
    openingBalance: "بیلانس افتتاحیه",
    ledgerPage: "صفحه کتاب تأدیات",
    notes: "ملاحظات",
    date: "تاریخ",
    reference: "مرجع",
    description: "توضیحات",
    debit: "خریداری / بدهکار",
    credit: "پرداخت / بستانکار",
    balance: "بیلانس جاری",
    actions: "عملیات",
    items: "تعداد اقلام",
    purchaseTotal: "مجموع خرید",
    paidAtPurchase: "پرداخت‌شده",
    remainingDebt: "باقی / قرض",
    edit: "ویرایش",
    delete: "حذف",
    purchase: "خریداری",
    purchasePayment: "پرداخت هنگام خرید",
    purchaseReturn: "برگشت خرید",
    manualPayment: "پرداخت",
    opening: "بیلانس افتتاحیه",
    noTransactions: "برای این تأمین‌کننده هنوز خریداری یا پرداختی ثبت نشده است.",
    youOwe: "ما به این تأمین‌کننده قرضدار استیم",
    supplierOwes: "این تأمین‌کننده به ما قرضدار است",
    settled: "حساب تصفیه است",
    paymentTitle: "ثبت پرداخت تأمین‌کننده",
    paymentHint: "پرداخت انجام‌شده به این تأمین‌کننده را ثبت کنید؛ ریکارد فوراً در لیجر نمایش داده می‌شود.",
    paymentDate: "تاریخ پرداخت",
    amount: "مقدار",
    unit: "واحد",
    afn: "افغانی (AFN)",
    usd: "دالر (USD)",
    inr: "کلدار هندی (INR)",
    eur: "یورو (EUR)",
    paymentDescription: "توضیحات",
    descriptionPlaceholder: "مثلاً پرداخت نقدی بابت بل‌های قبلی",
    cancel: "لغو",
    savePayment: "ذخیره پرداخت",
    requiredAmount: "لطفاً مقدار بیشتر از صفر وارد کنید.",
    saved: "پرداخت با موفقیت ذخیره شد.",
    updated: "پرداخت با موفقیت ویرایش شد.",
    deleted: "پرداخت با موفقیت حذف شد.",
    confirmDelete: "این ریکارد پرداخت حذف شود؟",
    supplierMissing: "تأمین‌کننده پیدا نشد.",
  },
  ps: {
    back: "عرضه کوونکو ته بېرته",
    title: "د عرضه کوونکي جزئیات",
    subtitle: "د عرضه کوونکي پروفایل، پېرودونه، تادیات او روان بیلانس.",
    payment: "تادیه",
    print: "پرنټ",
    ledgerPrintTitle: "د عرضه کوونکي لیجر",
    paymentReceipt: "د تادیې رسید",
    amountPaid: "ورکړل شوی مبلغ",
    supplierLabel: "عرضه کوونکی",
    totalPurchases: "ټول پېرودونه",
    totalPayments: "ټولې تادیې",
    currentBalance: "اوسنی بیلانس",
    transactions: "د عرضه کوونکي لیجر",
    tabLedger: "لیجر",
    tabPurchases: "پېرودونه",
    tabPayments: "تادیات",
    tabProfit: "ګټه",
    tabActivity: "فعالیت",
    returnsTotal: "د پېرود بېرته ستنولو ټول",
    netPurchases: "خالص پېرود",
    outstanding: "پاتې",
    profitInfo: "د دې عرضه کوونکي د ثبت شوو پېرودونو، بېرته ستنولو او تادیاتو پر بنسټ مالي لنډیز.",
    noPurchases: "د دې عرضه کوونکي لپاره پېرود نه دی ثبت شوی.",
    noPayments: "د دې عرضه کوونکي لپاره تادیه نه ده ثبت شوې.",
    noActivity: "د دې عرضه کوونکي لپاره فعالیت نه دی ثبت شوی.",
    supplierInfo: "د عرضه کوونکي معلومات",
    type: "ډول",
    currency: "اسعار",
    contact: "د اړیکې کس",
    phone: "د اړیکې شمېره",
    address: "پته",
    openingBalance: "افتتاحي بیلانس",
    ledgerPage: "د تادیاتو کتاب پاڼه",
    notes: "یادښتونه",
    date: "نېټه",
    reference: "مرجع",
    description: "تشریح",
    debit: "پېرود / بدهکار",
    credit: "تادیه / بستانکار",
    balance: "روان بیلانس",
    actions: "عملیات",
    items: "د توکو شمېر",
    purchaseTotal: "د پېرود ټول",
    paidAtPurchase: "ورکړل شوي",
    remainingDebt: "پاتې / پور",
    edit: "سمون",
    delete: "حذف",
    purchase: "پېرود",
    purchasePayment: "د پېرود پر مهال تادیه",
    purchaseReturn: "د پېرود بېرته ستنول",
    manualPayment: "تادیه",
    opening: "افتتاحي بیلانس",
    noTransactions: "د دې عرضه کوونکي لپاره تر اوسه پېرود یا تادیه نه ده ثبت شوې.",
    youOwe: "موږ دې عرضه کوونکي ته پوروړي یو",
    supplierOwes: "دا عرضه کوونکی موږ ته پوروړی دی",
    settled: "حساب تصفیه دی",
    paymentTitle: "عرضه کوونکي ته تادیه ثبتول",
    paymentHint: "عرضه کوونکي ته شوې تادیه ثبت کړئ؛ ریکارډ به سمدستي په لیجر کې ښکاره شي.",
    paymentDate: "د تادیې نېټه",
    amount: "مبلغ",
    unit: "واحد",
    afn: "افغانۍ (AFN)",
    usd: "ډالر (USD)",
    inr: "هندي کلدارې (INR)",
    eur: "یورو (EUR)",
    paymentDescription: "تشریح",
    descriptionPlaceholder: "لکه د پخوانیو بلونو نغدي تادیه",
    cancel: "لغوه",
    savePayment: "تادیه ذخیره کول",
    requiredAmount: "مهرباني وکړئ له صفر څخه زیات مبلغ ولیکئ.",
    saved: "تادیه په بریالیتوب ذخیره شوه.",
    updated: "تادیه په بریالیتوب بدله شوه.",
    deleted: "تادیه په بریالیتوب حذف شوه.",
    confirmDelete: "دا د تادیې ریکارډ حذف شي؟",
    supplierMissing: "عرضه کوونکی ونه موندل شو.",
  },
};

const supplierTypeLabels = {
  en: { wholesale: "Wholesale", retail: "Retail", pharmacy: "Pharmacy", drugstore: "Drugstore", company: "Company", representative: "Representative", pharmacist: "Pharmacist", inventory: "Inventory", unknown: "Unknown", dostHajiZaman: "Dost Haji Zaman", dostHajiSharif: "Dost Haji Sharif" },
  fa: { wholesale: "عمده", retail: "پرچون", pharmacy: "فارمیسی", drugstore: "درملتون", company: "شرکت", representative: "نماینده", pharmacist: "فارمسست", inventory: "موجودی", unknown: "مجهول", dostHajiZaman: "دوست حاجی زمان", dostHajiSharif: "دوست حاجی شریف" },
  ps: { wholesale: "عمده", retail: "پرچون", pharmacy: "فارمسي", drugstore: "درملتون", company: "شرکت", representative: "استازی", pharmacist: "فارمسست", inventory: "موجودي", unknown: "نامعلوم", dostHajiZaman: "د حاجي زمان دوست", dostHajiSharif: "د حاجي شریف دوست" },
};

const currencyLabels = { afn: "AFN", usd: "USD", inr: "INR", pkr: "PKR", eur: "EUR" };
const paymentCurrencyOptions = ["afn", "usd", "inr", "eur"];
const numeric = (value) => Number(value || 0) || 0;
const normalizeCurrency = (value, fallback = "AFN") => {
  const raw = String(value || fallback).trim().toUpperCase();
  if (raw.includes("USD")) return "USD";
  if (raw.includes("EUR")) return "EUR";
  if (raw.includes("INR") || raw.includes("PKR")) return "INR";
  return "AFN";
};
const addCurrencyAmount = (target, currency, amount) => {
  const code = normalizeCurrency(currency);
  target[code] = (target[code] || 0) + numeric(amount);
  return target;
};
const formatCurrencyMap = (map, { absolute = false } = {}) => {
  const order = ["AFN", "USD", "INR", "EUR"];
  const rows = order
    .filter((code) => Math.abs(numeric(map?.[code])) > 0.000001)
    .map((code) => {
      const value = absolute ? Math.abs(numeric(map[code])) : numeric(map[code]);
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}`;
    });
  return rows.join(" · ") || "0 AFN";
};
const today = () => new Date().toISOString().slice(0, 10);
const normalizeDate = (value) => {
  if (!value) return today();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export default function SupplierDetail() {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [suppliers] = useJsonCollection("suppliers");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseItems] = useJsonCollection("purchaseItems");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [payments, setPayments] = useJsonCollection("supplierPayments");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [showPayment, setShowPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ date: today(), amount: "", currency: "afn", description: "" });
  const [printMode, setPrintMode] = useState(null);
  const [activeTab, setActiveTab] = useState("ledger");

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const supplier = suppliers.find((item) => String(item.id) === String(supplierId));
  const currencyCode = normalizeCurrency(currencyLabels[String(supplier?.currency || "afn").toLowerCase()] || supplier?.currency || "AFN");

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
    const params = new URLSearchParams(location.search);
    const highlightPurchaseId = location.state?.highlightPurchaseId || params.get("highlightPurchase");
    if (location.state?.openPayment) {
      setEditingPaymentId(null);
      setPaymentForm({ date: today(), amount: "", currency: String(location.state?.paymentCurrency || supplier?.currency || "afn").toLowerCase().replace("pkr", "inr"), description: "" });
      setShowPayment(true);
    }
    if (!highlightPurchaseId) return undefined;
    const timer = window.setTimeout(() => {
      const row = document.getElementById(`supplier-ledger-purchase-${highlightPurchaseId}`);
      if (!row) return;
      row.classList.add("supplier-ledger-highlight");
      row.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(() => row.classList.remove("supplier-ledger-highlight"), 5000);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [location.search, location.state]);

  useEffect(() => {
    document.body.classList.toggle("supplier-payment-modal-open", showPayment);
    document.body.classList.toggle("app-modal-open", showPayment);
    return () => {
      document.body.classList.remove("supplier-payment-modal-open");
      document.body.classList.remove("app-modal-open");
    };
  }, [showPayment]);

  useEffect(() => {
    if (!printMode) return undefined;
    const timer = window.setTimeout(() => window.print(), 80);
    const clearPrintMode = () => setPrintMode(null);
    window.addEventListener("afterprint", clearPrintMode, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clearPrintMode);
    };
  }, [printMode]);

  const supplierPurchases = useMemo(
    () => purchases.filter((item) => String(item.supplierId) === String(supplierId)),
    [purchases, supplierId]
  );
  const supplierReturns = useMemo(
    () => purchaseReturns.filter((item) => String(item.supplierId) === String(supplierId)),
    [purchaseReturns, supplierId]
  );
  const supplierPayments = useMemo(
    () => payments.filter((item) => String(item.supplierId) === String(supplierId)),
    [payments, supplierId]
  );

  const ledger = useMemo(() => {
    const entries = [];
    const openingBalance = numeric(supplier?.openingBalance);
    if (openingBalance !== 0) {
      entries.push({
        id: `opening-${supplierId}`,
        date: supplier?.createdAt || "",
        reference: "OPENING",
        description: t.opening,
        kind: "opening",
        currency: currencyCode,
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        order: new Date(supplier?.createdAt || 0).getTime() || 0,
      });
    }

    supplierPurchases.forEach((purchase) => {
      const purchaseDate = purchase.purchaseDate || purchase.date || purchase.createdAt || "";
      const order = new Date(purchaseDate || 0).getTime() || 0;
      const purchaseTotal = numeric(purchase.totalAmount);
      const paidAtPurchase = numeric(purchase.paidAmount ?? purchase.paid);
      const storedItemCount = numeric(purchase.itemCount);
      const derivedItemCount = purchaseItems.filter((item) =>
        String(item.purchaseId || item.referenceId || "") === String(purchase.id)
      ).length;
      const itemCount = storedItemCount || derivedItemCount || (Array.isArray(purchase.items) ? purchase.items.length : 0);

      entries.push({
        id: `purchase-${purchase.id}`,
        date: purchaseDate,
        reference: purchase.billNumber || purchase.id,
        description: t.purchase,
        kind: "purchase",
        sourceId: purchase.id,
        currency: normalizeCurrency(purchase.currency || supplier?.currency || currencyCode),
        itemCount,
        purchaseTotal,
        paidAtPurchase,
        remainingAmount: Math.max(numeric(purchase.remainingAmount ?? (purchaseTotal - paidAtPurchase)), 0),
        debit: purchaseTotal,
        credit: paidAtPurchase,
        order,
      });
    });


    supplierReturns.forEach((item) => {
      const returnDate = item.returnDate || item.date || item.createdAt || "";
      const order = new Date(returnDate || 0).getTime() || 0;
      const linkedPurchase = supplierPurchases.find((purchase) => String(purchase.id) === String(item.purchaseId));
      entries.push({
        id: `purchase-return-${item.id}`,
        date: returnDate,
        reference: item.returnNo || item.id,
        description: item.notes || t.purchaseReturn,
        kind: "purchase-return",
        sourceId: item.id,
        currency: normalizeCurrency(item.currency || linkedPurchase?.currency || supplier?.currency || currencyCode),
        debit: 0,
        credit: numeric(item.totalAmount),
        order: order + 2,
      });
    });

    supplierPayments.forEach((payment) => {
      const order = new Date(payment.date || payment.createdAt || 0).getTime() || 0;
      entries.push({
        id: `payment-${payment.id}`,
        date: payment.date || payment.createdAt || "",
        reference: payment.reference || `PAY-${String(payment.id).slice(-6)}`,
        description: payment.description || t.manualPayment,
        kind: "manual-payment",
        sourceId: payment.id,
        currency: normalizeCurrency(payment.currency || supplier?.currency || currencyCode),
        debit: 0,
        credit: numeric(payment.amount),
        order,
      });
    });

    entries.sort((a, b) => (a.order - b.order) || String(a.id).localeCompare(String(b.id)));
    const runningByCurrency = {};
    return entries.map((entry) => {
      const code = normalizeCurrency(entry.currency || supplier?.currency || currencyCode);
      runningByCurrency[code] = numeric(runningByCurrency[code]) + numeric(entry.debit) - numeric(entry.credit);
      return { ...entry, currency: code, balance: runningByCurrency[code] };
    });
  }, [supplier, supplierId, supplierPurchases, purchaseItems, supplierReturns, supplierPayments, currencyCode, t.opening, t.purchase, t.purchasePayment, t.purchaseReturn, t.manualPayment]);

  const totalPurchasesByCurrency = useMemo(() => {
    const totals = {};
    supplierPurchases.forEach((item) => addCurrencyAmount(totals, item.currency || supplier?.currency || currencyCode, item.totalAmount));
    return totals;
  }, [supplierPurchases, supplier, currencyCode]);
  const purchasePaymentsByCurrency = useMemo(() => {
    const totals = {};
    supplierPurchases.forEach((item) => addCurrencyAmount(totals, item.currency || supplier?.currency || currencyCode, item.paidAmount));
    return totals;
  }, [supplierPurchases, supplier, currencyCode]);
  const manualPaymentsByCurrency = useMemo(() => {
    const totals = {};
    supplierPayments.forEach((item) => addCurrencyAmount(totals, item.currency || supplier?.currency || currencyCode, item.amount));
    return totals;
  }, [supplierPayments, supplier, currencyCode]);
  const totalPaymentsByCurrency = useMemo(() => {
    const totals = { ...purchasePaymentsByCurrency };
    Object.entries(manualPaymentsByCurrency).forEach(([code, amount]) => addCurrencyAmount(totals, code, amount));
    return totals;
  }, [purchasePaymentsByCurrency, manualPaymentsByCurrency]);
  const totalReturnsByCurrency = useMemo(() => {
    const totals = {};
    supplierReturns.forEach((item) => {
      const linkedPurchase = supplierPurchases.find((purchase) => String(purchase.id) === String(item.purchaseId));
      addCurrencyAmount(totals, item.currency || linkedPurchase?.currency || supplier?.currency || currencyCode, item.totalAmount);
    });
    return totals;
  }, [supplierReturns, supplierPurchases, supplier, currencyCode]);
  const currentBalances = useMemo(() => {
    const balances = {};
    ledger.forEach((entry) => { balances[entry.currency] = numeric(entry.balance); });
    if (!ledger.length && numeric(supplier?.openingBalance) !== 0) balances[currencyCode] = numeric(supplier.openingBalance);
    return balances;
  }, [ledger, supplier, currencyCode]);
  const netPurchasesByCurrency = useMemo(() => {
    const totals = {};
    const codes = new Set([...Object.keys(totalPurchasesByCurrency), ...Object.keys(totalReturnsByCurrency)]);
    codes.forEach((code) => { totals[code] = numeric(totalPurchasesByCurrency[code]) - numeric(totalReturnsByCurrency[code]); });
    return totals;
  }, [totalPurchasesByCurrency, totalReturnsByCurrency]);
  const preferredPaymentCurrency = Object.entries(currentBalances).find(([, value]) => numeric(value) > 0.000001)?.[0] || currencyCode;
  const purchaseRows = ledger.filter((entry) => entry.kind === "purchase");
  const paymentRows = ledger.filter((entry) => entry.kind === "manual-payment");
  const activityRows = [...ledger].filter((entry) => entry.kind !== "opening").sort((a, b) => (b.order - a.order) || String(b.id).localeCompare(String(a.id)));


  const openPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentForm({ date: today(), amount: "", currency: String(preferredPaymentCurrency).toLowerCase().replace("pkr", "inr"), description: "" });
    setShowPayment(true);
  };

  const closePaymentModal = () => {
    setShowPayment(false);
    setEditingPaymentId(null);
    setPaymentForm({ date: today(), amount: "", currency: String(supplier?.currency || "afn").toLowerCase().replace("pkr", "inr"), description: "" });
  };

  const editLedgerEntry = (entry) => {
    if (entry.kind === "manual-payment") {
      const payment = payments.find((item) => String(item.id) === String(entry.sourceId));
      if (!payment) return;
      setEditingPaymentId(payment.id);
      setPaymentForm({
        date: normalizeDate(payment.date || payment.createdAt),
        amount: String(payment.amount ?? ""),
        currency: String(payment.currency || supplier?.currency || "afn").toLowerCase().replace("pkr", "inr"),
        description: payment.description || "",
      });
      setShowPayment(true);
      return;
    }
    if (entry.sourceId) navigate("/purchasing", { state: { highlightPurchaseId: entry.sourceId } });
  };

  const deleteLedgerEntry = async (entry) => {
    if (entry.kind !== "manual-payment") return;
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: entry.reference || entry.description || t.confirmDelete,
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const saved = await setPayments(payments.filter((item) => String(item.id) !== String(entry.sourceId)));
    if (saved) notify(t.deleted, "success");
  };

  const savePayment = async (event) => {
    event.preventDefault();
    const amount = numeric(paymentForm.amount);
    if (amount <= 0) {
      notify(t.requiredAmount, "warning");
      return;
    }
    const previousPayment = editingPaymentId
      ? payments.find((item) => String(item.id) === String(editingPaymentId))
      : null;
    const record = {
      id: editingPaymentId || `SPAY-${Date.now()}`,
      supplierId,
      supplierName: supplier?.supplierName || "",
      date: paymentForm.date || today(),
      amount,
      currency: normalizeCurrency(paymentForm.currency || supplier?.currency || "AFN"),
      description: paymentForm.description.trim(),
      reference: previousPayment?.reference || `PAY-${String(Date.now()).slice(-7)}`,
      createdAt: previousPayment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await setPayments(editingPaymentId
      ? payments.map((item) => (String(item.id) === String(editingPaymentId) ? record : item))
      : [record, ...payments]
    );
    if (saved) {
      notify(editingPaymentId ? t.updated : t.saved, "success");
      closePaymentModal();
    }
  };

  const printLedger = () => setPrintMode({ type: "ledger" });
  const printPayment = (entry) => {
    const payment = payments.find((item) => String(item.id) === String(entry.sourceId));
    if (!payment) return;
    setPrintMode({ type: "payment", payment, entry });
  };

  if (!supplier) {
    return (
      <div className="supplier-detail-page supplier-detail-missing" dir={direction}>
        <Building2 size={38} />
        <h2>{t.supplierMissing}</h2>
        <button type="button" onClick={() => navigate("/suppliers")}><ArrowLeft size={17} />{t.back}</button>
      </div>
    );
  }

  const positiveBalances = Object.values(currentBalances).filter((value) => numeric(value) > 0.000001);
  const negativeBalances = Object.values(currentBalances).filter((value) => numeric(value) < -0.000001);
  const balanceState = positiveBalances.length ? "owe" : negativeBalances.length ? "receivable" : "settled";
  const balanceLabel = positiveBalances.length && !negativeBalances.length ? t.youOwe : negativeBalances.length && !positiveBalances.length ? t.supplierOwes : t.currentBalance;

  const paymentModal = showPayment ? (
    <div className="supplier-payment-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closePaymentModal()}>
      <section className="supplier-payment-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-payment-title" dir={direction}>
        <div className="supplier-payment-modal-header">
          <div>
            <div className="supplier-payment-title-line"><Wallet size={22} /><h2 id="supplier-payment-title">{t.paymentTitle}</h2></div>
            <p>{t.paymentHint}</p>
          </div>
          <button type="button" onClick={closePaymentModal} aria-label={t.cancel}><X size={19} /></button>
        </div>
        <form className="supplier-payment-form" onSubmit={savePayment}>
          <div className="supplier-payment-card">
            <div className="supplier-payment-grid">
              <label>
                <span><CalendarDays size={15} />{t.paymentDate}</span>
                <ShamsiDateInput value={paymentForm.date} onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))} />
              </label>
              <label>
                <span><BadgeDollarSign size={15} />{t.amount}</span>
                <input autoFocus type="number" min="0" step="any" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </label>
              <label>
                <span><Wallet size={15} />{t.unit}</span>
                <select value={paymentForm.currency} onChange={(e) => setPaymentForm((prev) => ({ ...prev, currency: e.target.value }))}>
                  {paymentCurrencyOptions.map((code) => <option key={code} value={code}>{t[code]}</option>)}
                </select>
              </label>
              <label className="supplier-payment-full">
                <span><FileText size={15} />{t.paymentDescription}</span>
                <textarea rows="4" value={paymentForm.description} placeholder={t.descriptionPlaceholder} onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))} />
              </label>
            </div>
          </div>
          <div className="supplier-payment-actions">
            <button type="button" className="secondary" onClick={closePaymentModal}>{t.cancel}</button>
            <button type="submit" className="primary">{t.savePayment}</button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  return (
    <div className="supplier-detail-page" dir={direction}>
      <div className="supplier-detail-hero">
        <div className="supplier-detail-hero-main">
          <button type="button" className="supplier-detail-back" onClick={() => navigate("/suppliers")}><ArrowLeft size={16} />{t.back}</button>
          <div className="supplier-detail-profile">
            <span className="supplier-detail-avatar"><Truck size={28} /></span>
            <div>
              <span className="supplier-detail-kicker">{t.title}</span>
              <h1>{supplier.supplierName}</h1>
              <p>{t.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="supplier-detail-hero-actions">
          <button type="button" className="supplier-detail-print-btn" onClick={printLedger}><Printer size={17} />{t.print}</button>
          <button type="button" className="supplier-detail-payment-btn" onClick={openPaymentModal}><Wallet size={18} />{t.payment}</button>
        </div>
      </div>

      <div className="supplier-detail-stat-grid">
        <article className="supplier-detail-stat"><span className="icon purchase"><ReceiptText size={19} /></span><div><small>{t.totalPurchases}</small><strong>{formatCurrencyMap(totalPurchasesByCurrency)}</strong></div></article>
        <article className="supplier-detail-stat"><span className="icon payment"><Wallet size={19} /></span><div><small>{t.totalPayments}</small><strong>{formatCurrencyMap(totalPaymentsByCurrency)}</strong></div></article>
        <article className={`supplier-detail-stat balance ${balanceState}`}><span className="icon"><BadgeDollarSign size={19} /></span><div><small>{t.currentBalance}</small><strong>{formatCurrencyMap(currentBalances, { absolute: true })}</strong></div></article>
      </div>

      <div className="supplier-detail-layout">
        <aside className="supplier-detail-info-card">
          <div className="supplier-detail-section-head"><Building2 size={18} /><div><h2>{t.supplierInfo}</h2><p>{supplier.supplierName}</p></div></div>
          <div className="supplier-detail-info-list">
            <div><span><Truck size={15} />{t.type}</span><strong>{supplierTypeLabels[language]?.[supplier.supplierType] || supplier.supplierType || "—"}</strong></div>
            <div><span><BadgeDollarSign size={15} />{t.currency}</span><strong>{currencyCode}</strong></div>
            <div><span><UserRound size={15} />{t.contact}</span><strong>{supplier.contactPerson || "—"}</strong></div>
            <div><span><Phone size={15} />{t.phone}</span><strong dir="ltr">{supplier.phone || "—"}</strong></div>
            <div><span><MapPin size={15} />{t.address}</span><strong>{supplier.address || "—"}</strong></div>
            <div><span><Wallet size={15} />{t.openingBalance}</span><strong>{numeric(supplier.openingBalance).toLocaleString()} {currencyCode}</strong></div>
            <div><span><FileText size={15} />{t.ledgerPage}</span><strong>{supplier.ledgerPage || "—"}</strong></div>
            <div className="notes"><span><FileText size={15} />{t.notes}</span><strong>{supplier.notes || "—"}</strong></div>
          </div>
        </aside>

        <section className="supplier-detail-ledger-card">
          <div className="supplier-detail-tabs" role="tablist" aria-label={t.transactions}>
            {[
              ["ledger", t.tabLedger],
              ["purchases", t.tabPurchases],
              ["payments", t.tabPayments],
              ["profit", t.tabProfit],
              ["activity", t.tabActivity],
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={activeTab === key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>

          {activeTab === "ledger" && (
            <>
              <div className="supplier-detail-section-head ledger"><ReceiptText size={18} /><div><h2>{t.transactions}</h2><p>{ledger.length} {t.transactions.toLowerCase()}</p></div></div>
              <div className="supplier-detail-ledger-wrap">
                <table>
                  <thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.items}</th><th>{t.purchaseTotal}</th><th>{t.paidAtPurchase}</th><th>{t.remainingDebt}</th><th>{t.balance}</th><th>{t.actions}</th></tr></thead>
                  <tbody>
                    {ledger.length ? ledger.map((entry) => {
                      const isPurchase = entry.kind === "purchase";
                      const remainingValue = isPurchase ? numeric(entry.remainingAmount) : 0;
                      return (
                        <tr key={entry.id} id={entry.kind === "purchase" ? `supplier-ledger-purchase-${entry.sourceId}` : undefined}>
                          <td>{formatDateTime(entry.date)}</td><td><span className="supplier-ledger-reference">{entry.reference || "—"}</span></td>
                          <td><span className={`supplier-ledger-description ${entry.kind || ""} ${entry.kind === "purchase" ? "is-purchase-badge" : entry.kind === "manual-payment" ? "is-payment-badge" : ""}`}>{entry.description}</span></td>
                          <td className="supplier-ledger-items">{isPurchase ? (entry.itemCount || 0) : "—"}</td>
                          <td className="supplier-ledger-debit">{isPurchase ? `${numeric(entry.purchaseTotal).toLocaleString(undefined,{maximumFractionDigits:2})} ${entry.currency}` : (entry.debit ? `${entry.debit.toLocaleString(undefined,{maximumFractionDigits:2})} ${entry.currency}` : "—")}</td>
                          <td className="supplier-ledger-credit">{isPurchase ? `${numeric(entry.paidAtPurchase).toLocaleString(undefined,{maximumFractionDigits:2})} ${entry.currency}` : (entry.credit ? `${entry.credit.toLocaleString(undefined,{maximumFractionDigits:2})} ${entry.currency}` : "—")}</td>
                          <td className={remainingValue > 0 ? "supplier-ledger-remaining owe" : "supplier-ledger-remaining"}>{isPurchase ? `${remainingValue.toLocaleString(undefined,{maximumFractionDigits:2})} ${entry.currency}` : "—"}</td>
                          <td className={entry.balance > 0 ? "supplier-ledger-balance owe" : entry.balance < 0 ? "supplier-ledger-balance receivable" : "supplier-ledger-balance"}>{Math.abs(entry.balance).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency}</td>
                          <td><div className="supplier-ledger-actions">
                            {entry.kind === "manual-payment" && <button type="button" className="print" onClick={() => printPayment(entry)} aria-label={t.print} title={t.print}><Printer size={13} strokeWidth={2} /></button>}
                            {entry.kind === "purchase" && <button type="button" className="locked-purchase" onClick={() => editLedgerEntry(entry)} aria-label={t.purchase} title={t.purchase}><Lock size={13} strokeWidth={2} /></button>}
                            {entry.kind === "manual-payment" && <button type="button" className="edit" onClick={() => editLedgerEntry(entry)} aria-label={t.edit} title={t.edit}><Edit3 size={15} strokeWidth={2} /></button>}
                            {entry.kind === "manual-payment" && <button type="button" className="delete" onClick={() => deleteLedgerEntry(entry)} aria-label={t.delete} title={t.delete}><Trash2 size={13} strokeWidth={2} /></button>}
                          </div></td>
                        </tr>
                      );
                    }) : <tr><td colSpan="9" className="supplier-ledger-empty">{t.noTransactions}</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className={`supplier-detail-result ${balanceState}`}><div><span>{balanceLabel}</span><small>{t.currentBalance}</small></div><strong>{formatCurrencyMap(currentBalances, { absolute: true })}</strong></div>
            </>
          )}

          {activeTab === "purchases" && (
            <div className="supplier-tab-panel">
              <div className="supplier-detail-section-head ledger"><ReceiptText size={18} /><div><h2>{t.tabPurchases}</h2><p>{purchaseRows.length}</p></div></div>
              <div className="supplier-detail-ledger-wrap"><table><thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.items}</th><th>{t.purchaseTotal}</th><th>{t.paidAtPurchase}</th><th>{t.remainingDebt}</th></tr></thead><tbody>
                {purchaseRows.length ? purchaseRows.map((entry) => <tr key={`purchase-tab-${entry.id}`}><td>{formatDateTime(entry.date)}</td><td><span className="supplier-ledger-reference">{entry.reference || "—"}</span></td><td className="supplier-ledger-items">{entry.itemCount || 0}</td><td>{numeric(entry.purchaseTotal).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency}</td><td>{numeric(entry.paidAtPurchase).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency}</td><td className={numeric(entry.remainingAmount)>0?"supplier-ledger-remaining owe":"supplier-ledger-remaining"}>{numeric(entry.remainingAmount).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency}</td></tr>) : <tr><td colSpan="6" className="supplier-ledger-empty">{t.noPurchases}</td></tr>}
              </tbody></table></div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="supplier-tab-panel">
              <div className="supplier-detail-section-head ledger"><Wallet size={18} /><div><h2>{t.tabPayments}</h2><p>{paymentRows.length}</p></div></div>
              <div className="supplier-detail-ledger-wrap"><table><thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.amountPaid}</th><th>{t.actions}</th></tr></thead><tbody>
                {paymentRows.length ? paymentRows.map((entry) => <tr key={`payment-tab-${entry.id}`}><td>{formatDateTime(entry.date)}</td><td><span className="supplier-ledger-reference">{entry.reference || "—"}</span></td><td>{entry.description}</td><td className="supplier-ledger-credit">{numeric(entry.credit).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency || currencyCode}</td><td><div className="supplier-ledger-actions"><button type="button" className="print" onClick={() => printPayment(entry)} aria-label={t.print}><Printer size={13}/></button><button type="button" className="edit" onClick={() => editLedgerEntry(entry)} aria-label={t.edit}><Edit3 size={14}/></button><button type="button" className="delete" onClick={() => deleteLedgerEntry(entry)} aria-label={t.delete}><Trash2 size={13}/></button></div></td></tr>) : <tr><td colSpan="5" className="supplier-ledger-empty">{t.noPayments}</td></tr>}
              </tbody></table></div>
            </div>
          )}

          {activeTab === "profit" && (
            <div className="supplier-tab-panel supplier-profit-panel">
              <div className="supplier-detail-section-head ledger"><BadgeDollarSign size={18} /><div><h2>{t.tabProfit}</h2><p>{t.profitInfo}</p></div></div>
              <div className="supplier-profit-grid">
                <article><span>{t.totalPurchases}</span><strong>{formatCurrencyMap(totalPurchasesByCurrency)}</strong></article>
                <article><span>{t.returnsTotal}</span><strong>{formatCurrencyMap(totalReturnsByCurrency)}</strong></article>
                <article><span>{t.netPurchases}</span><strong>{formatCurrencyMap(netPurchasesByCurrency)}</strong></article>
                <article><span>{t.totalPayments}</span><strong>{formatCurrencyMap(totalPaymentsByCurrency)}</strong></article>
                <article className="wide"><span>{t.outstanding}</span><strong>{formatCurrencyMap(currentBalances, { absolute: true })}</strong></article>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="supplier-tab-panel">
              <div className="supplier-detail-section-head ledger"><FileText size={18} /><div><h2>{t.tabActivity}</h2><p>{activityRows.length}</p></div></div>
              <div className="supplier-activity-list">
                {activityRows.length ? activityRows.map((entry) => <div className="supplier-activity-item" key={`activity-${entry.id}`}><span className={`supplier-activity-dot ${entry.kind}`}></span><div><strong>{entry.description}</strong><small>{formatDateTime(entry.date)} · {entry.reference || "—"}</small></div><b>{entry.kind === "purchase" ? numeric(entry.purchaseTotal).toLocaleString(undefined,{maximumFractionDigits:2}) : numeric(entry.credit || entry.debit).toLocaleString(undefined,{maximumFractionDigits:2})} {entry.currency || currencyCode}</b></div>) : <div className="supplier-ledger-empty">{t.noActivity}</div>}
              </div>
            </div>
          )}
        </section>
      </div>

      {printMode && (
        <section className="supplier-print-sheet" aria-hidden="true">
          {printMode.type === "ledger" ? (
            <>
              <div className="supplier-print-head">
                <div><small>{t.supplierLabel}</small><h1>{supplier.supplierName}</h1></div>
                <div className="supplier-print-title"><Printer size={24}/><h2>{t.ledgerPrintTitle}</h2></div>
              </div>
              <div className="supplier-print-meta">
                <span>{t.phone}: <b dir="ltr">{supplier.phone || "—"}</b></span>
                <span>{t.currency}: <b>{currencyCode}</b></span>
                <span>{t.currentBalance}: <b>{formatCurrencyMap(currentBalances, { absolute: true })}</b></span>
              </div>
              <table className="supplier-print-table">
                <thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.purchaseTotal}</th><th>{t.paidAtPurchase}</th><th>{t.remainingDebt}</th><th>{t.balance}</th></tr></thead>
                <tbody>{ledger.map((entry)=><tr key={`print-${entry.id}`}><td>{formatDateTime(entry.date)}</td><td>{entry.reference||"—"}</td><td>{entry.description}</td><td>{entry.kind==="purchase"?`${numeric(entry.purchaseTotal).toLocaleString()} ${entry.currency}`:entry.debit?`${entry.debit.toLocaleString()} ${entry.currency}`:"—"}</td><td>{entry.kind==="purchase"?`${numeric(entry.paidAtPurchase).toLocaleString()} ${entry.currency}`:entry.credit?`${entry.credit.toLocaleString()} ${entry.currency}`:"—"}</td><td>{entry.kind==="purchase"?`${numeric(entry.remainingAmount).toLocaleString()} ${entry.currency}`:"—"}</td><td>{Math.abs(entry.balance).toLocaleString()} {entry.currency}</td></tr>)}</tbody>
              </table>
              <div className="supplier-print-total"><span>{balanceLabel}</span><strong>{formatCurrencyMap(currentBalances, { absolute: true })}</strong></div>
            </>
          ) : (
            <>
              <div className="supplier-print-head">
                <div><small>{t.supplierLabel}</small><h1>{supplier.supplierName}</h1></div>
                <div className="supplier-print-title"><Printer size={24}/><h2>{t.paymentReceipt}</h2></div>
              </div>
              <div className="supplier-payment-receipt-grid">
                <div><span>{t.reference}</span><strong>{printMode.entry?.reference || printMode.payment?.reference || "—"}</strong></div>
                <div><span>{t.paymentDate}</span><strong>{formatDateTime(printMode.payment?.date || printMode.payment?.createdAt)}</strong></div>
                <div><span>{t.amountPaid}</span><strong>{numeric(printMode.payment?.amount).toLocaleString(undefined,{maximumFractionDigits:2})} {String(printMode.payment?.currency || currencyCode).toUpperCase()}</strong></div>
                <div><span>{t.paymentDescription}</span><strong>{printMode.payment?.description || t.manualPayment}</strong></div>
              </div>
              <div className="supplier-payment-receipt-signatures"><span>{t.supplierLabel}: ____________________</span><span>{t.payment}: ____________________</span></div>
            </>
          )}
        </section>
      )}
      {showPayment && createPortal(paymentModal, document.body)}
    </div>
  );
}
