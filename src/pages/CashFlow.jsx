import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Edit3,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
  X,
  Landmark,
  Calculator,
  FileMinus2,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import { todayDateValue } from "../utils/afghanDate";
import ShamsiDateInput from "../components/ShamsiDateInput";
import "./CashFlow.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencyCodes = ["AFN", "USD", "PKR", "EUR"];
const numeric = (value) => Number(value || 0) || 0;

const tr = {
  en: {
    title: "Cash Flow",
    subtitle: "Track cash receipts and payments by currency, based on the cash-flow structure used in the Access system.",
    newEntry: "New Cash Entry",
    banks: "Banks",
    cashCount: "Cash Count",
    expenses: "Expenses",
    cashIn: "Cash In",
    cashOut: "Cash Out",
    balance: "Cash Balance",
    transactions: "Transactions",
    search: "Search reference or description...",
    all: "All",
    receipt: "Receipt",
    payment: "Payment",
    date: "Date",
    type: "Type",
    source: "Source",
    reference: "Reference",
    description: "Description",
    amount: "Amount",
    currency: "Currency",
    actions: "Actions",
    noRows: "No cash transactions found for this filter.",
    salePayment: "Sale payment",
    customerPayment: "Customer payment",
    purchasePayment: "Purchase payment",
    supplierPayment: "Supplier payment",
    bankDeposit: "Cash deposit to bank",
    bankWithdrawal: "Cash withdrawal from bank",
    expensePayment: "Expense payment",
    manualReceipt: "Manual cash receipt",
    manualPayment: "Manual cash payment",
    newEntryTitle: "Register Cash Entry",
    editEntryTitle: "Edit Cash Entry",
    formHint: "Use this form for other cash receipts or payments. Customer and supplier payments should be registered from their ledgers.",
    entryType: "Entry Type",
    selectType: "Select type",
    entryDate: "Entry Date",
    accountReference: "Account / Reference",
    accountPlaceholder: "Example: Rent refund, owner deposit...",
    notes: "Description",
    notesPlaceholder: "Write a short description...",
    cancel: "Cancel",
    save: "Save Entry",
    update: "Update Entry",
    edit: "Edit",
    delete: "Delete",
    saved: "Cash entry saved successfully.",
    updated: "Cash entry updated successfully.",
    deleted: "Cash entry deleted.",
    required: "Please complete date, type, currency and amount.",
    deleteConfirm: "Delete this manual cash entry?",
    automatic: "Automatic",
    manual: "Manual",
    sale: "Sale",
    purchase: "Purchase",
    customer: "Customer",
    supplier: "Supplier",
  },
  fa: {
    title: "جریان نقدی",
    subtitle: "دریافت و پرداخت نقدی را به تفکیک اسعار، مطابق ساختار Cash Flow سیستم اکسس مدیریت کنید.",
    newEntry: "ثبت نقدی جدید",
    banks: "بانک‌ها",
    cashCount: "شمارش نقدی",
    expenses: "مصارف",
    cashIn: "دریافت نقدی",
    cashOut: "پرداخت نقدی",
    balance: "بیلانس نقدی",
    transactions: "تراکنش‌ها",
    search: "جستجوی مرجع یا توضیحات...",
    all: "همه",
    receipt: "دریافت",
    payment: "پرداخت",
    date: "تاریخ",
    type: "نوع",
    source: "منبع",
    reference: "مرجع",
    description: "توضیحات",
    amount: "مقدار",
    currency: "اسعار",
    actions: "عملیات",
    noRows: "برای این فیلتر هیچ تراکنش نقدی موجود نیست.",
    salePayment: "پرداخت فروش",
    customerPayment: "پرداخت مشتری",
    purchasePayment: "پرداخت خرید",
    supplierPayment: "پرداخت تأمین‌کننده",
    bankDeposit: "واریز نقدی به بانک",
    bankWithdrawal: "برداشت نقدی از بانک",
    expensePayment: "پرداخت مصرف",
    manualReceipt: "دریافت نقدی دستی",
    manualPayment: "پرداخت نقدی دستی",
    newEntryTitle: "ثبت تراکنش نقدی",
    editEntryTitle: "ویرایش تراکنش نقدی",
    formHint: "این فورم برای سایر دریافت‌ها و پرداخت‌های نقدی است. پرداخت مشتری و تأمین‌کننده را از لیجر همان شخص ثبت کنید.",
    entryType: "نوع تراکنش",
    selectType: "انتخاب نوع",
    entryDate: "تاریخ تراکنش",
    accountReference: "حساب / مرجع",
    accountPlaceholder: "مثلاً برگشت کرایه، سرمایه مالک...",
    notes: "توضیحات",
    notesPlaceholder: "توضیح کوتاه بنویسید...",
    cancel: "لغو",
    save: "ذخیره تراکنش",
    update: "ذخیره تغییرات",
    edit: "ویرایش",
    delete: "حذف",
    saved: "تراکنش نقدی با موفقیت ذخیره شد.",
    updated: "تراکنش نقدی با موفقیت ویرایش شد.",
    deleted: "تراکنش نقدی حذف شد.",
    required: "تاریخ، نوع، اسعار و مقدار را تکمیل کنید.",
    deleteConfirm: "این تراکنش نقدی دستی حذف شود؟",
    automatic: "اتوماتیک",
    manual: "دستی",
    sale: "فروش",
    purchase: "خرید",
    customer: "مشتری",
    supplier: "تأمین‌کننده",
  },
  ps: {
    title: "نغدي جریان",
    subtitle: "د Access سیسټم د Cash Flow جوړښت مطابق نغدي ترلاسه کول او تادیات د اسعارو له مخې اداره کړئ.",
    newEntry: "نوی نغدي ریکارډ",
    banks: "بانکونه",
    cashCount: "د نغدو شمېرنه",
    expenses: "مصارف",
    cashIn: "نغدي ترلاسه کول",
    cashOut: "نغدي تادیه",
    balance: "نغدي بیلانس",
    transactions: "تراکنشونه",
    search: "د مرجع یا تشریح لټون...",
    all: "ټول",
    receipt: "ترلاسه کول",
    payment: "تادیه",
    date: "نېټه",
    type: "ډول",
    source: "سرچینه",
    reference: "مرجع",
    description: "تشریح",
    amount: "مقدار",
    currency: "اسعار",
    actions: "کړنې",
    noRows: "د دې فلټر لپاره نغدي تراکنش نشته.",
    salePayment: "د خرڅلاو تادیه",
    customerPayment: "د پېرودونکي تادیه",
    purchasePayment: "د پېرود تادیه",
    supplierPayment: "د عرضه کوونکي تادیه",
    expensePayment: "د مصرف تادیه",
    manualReceipt: "لاسي نغدي ترلاسه کول",
    manualPayment: "لاسي نغدي تادیه",
    newEntryTitle: "نغدي تراکنش ثبتول",
    editEntryTitle: "نغدي تراکنش سمول",
    formHint: "دا فورم د نورو نغدي ترلاسه کولو او تادیاتو لپاره دی. د پېرودونکي او عرضه کوونکي تادیات د هغوی له لیجر څخه ثبت کړئ.",
    entryType: "د تراکنش ډول",
    selectType: "ډول وټاکئ",
    entryDate: "د تراکنش نېټه",
    accountReference: "حساب / مرجع",
    accountPlaceholder: "لکه د کرایې بېرته ورکول، د مالک پانګه...",
    notes: "تشریح",
    notesPlaceholder: "لنډه تشریح ولیکئ...",
    cancel: "لغوه",
    save: "تراکنش خوندي کړئ",
    update: "بدلونونه خوندي کړئ",
    edit: "سمول",
    delete: "حذف",
    saved: "نغدي تراکنش په بریالیتوب ثبت شو.",
    updated: "نغدي تراکنش په بریالیتوب بدل شو.",
    deleted: "نغدي تراکنش حذف شو.",
    required: "نېټه، ډول، اسعار او مقدار بشپړ کړئ.",
    deleteConfirm: "دا لاسي نغدي تراکنش حذف شي؟",
    automatic: "اتوماتیک",
    manual: "لاسي",
    sale: "خرڅلاو",
    purchase: "پېرود",
    customer: "پېرودونکی",
    supplier: "عرضه کوونکی",
  },
};

const blankEntry = {
  date: todayDateValue(),
  direction: "in",
  currency: "AFN",
  amount: "",
  reference: "",
  description: "",
};

function normalizeCurrency(value, fallback = "AFN") {
  const code = String(value || fallback).trim().toUpperCase();
  if (code === "AFS") return "AFN";
  if (code === "RS") return "PKR";
  if (code === "INR") return "PKR";
  return currencyCodes.includes(code) ? code : fallback;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export default function CashFlow() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const t = tr[language] || tr.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [customers] = useJsonCollection("customerRegistry");
  const [suppliers] = useJsonCollection("suppliers");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [supplierPayments] = useJsonCollection("supplierPayments");
  const [expenses] = useJsonCollection("expenses");
  const [expenseAccounts] = useJsonCollection("expenseAccounts");
  const [expenseReasons] = useJsonCollection("expenseReasons");
  const [settings] = useJsonCollection("settings");
  const [bankAccounts] = useJsonCollection("bankAccounts");
  const [bankTransactions] = useJsonCollection("bankTransactions");
  const [manualEntries, setManualEntries] = useJsonCollection("cashTransactions");

  const [activeCurrency, setActiveCurrency] = useState("AFN");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankEntry);

  const currentSettings = settings[0] || {};
  const defaultCurrency = normalizeCurrency(currentSettings.currency || "AFN");
  const currencyDecimals = currentSettings.currencyDecimals || {};

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
    document.body.classList.toggle("cash-flow-modal-open", showModal);
    return () => document.body.classList.remove("cash-flow-modal-open");
  }, [showModal]);

  const customerMap = useMemo(() => new Map(customers.map((item) => [String(item.id), item])), [customers]);
  const supplierMap = useMemo(() => new Map(suppliers.map((item) => [String(item.id), item])), [suppliers]);

  const allRows = useMemo(() => {
    const rows = [];

    sales.forEach((sale) => {
      const amount = numeric(sale.paidAmount);
      if (amount <= 0) return;
      const customer = customerMap.get(String(sale.customerId));
      rows.push({
        id: `sale-${sale.id}`,
        date: sale.saleDate || sale.createdAt,
        direction: "in",
        currency: normalizeCurrency(sale.currency || customer?.currency, defaultCurrency),
        amount,
        source: "sale",
        sourceLabel: t.salePayment,
        reference: sale.invoiceNumber || sale.invoiceNo || `SAL-${sale.id}`,
        description: customer?.fullName || customer?.companyName || sale.customerName || t.customer,
        automatic: true,
      });
    });

    customerPayments.forEach((payment) => {
      const customer = customerMap.get(String(payment.customerId));
      const amount = numeric(payment.amount);
      if (amount <= 0) return;
      rows.push({
        id: `customer-payment-${payment.id}`,
        date: payment.date || payment.createdAt,
        direction: "in",
        currency: normalizeCurrency(payment.currency || customer?.currency, defaultCurrency),
        amount,
        source: "customer",
        sourceLabel: t.customerPayment,
        reference: payment.reference || customer?.fullName || customer?.companyName || t.customer,
        description: payment.description || payment.notes || "—",
        automatic: true,
      });
    });

    purchases.forEach((purchase) => {
      const amount = numeric(purchase.paidAmount);
      if (amount <= 0) return;
      const supplier = supplierMap.get(String(purchase.supplierId));
      rows.push({
        id: `purchase-${purchase.id}`,
        date: purchase.purchaseDate || purchase.createdAt,
        direction: "out",
        currency: normalizeCurrency(purchase.currency || supplier?.currency, defaultCurrency),
        amount,
        source: "purchase",
        sourceLabel: t.purchasePayment,
        reference: purchase.billNumber || `PUR-${purchase.id}`,
        description: supplier?.supplierName || purchase.supplierName || t.supplier,
        automatic: true,
      });
    });

    supplierPayments.forEach((payment) => {
      const supplier = supplierMap.get(String(payment.supplierId));
      const amount = numeric(payment.amount);
      if (amount <= 0) return;
      rows.push({
        id: `supplier-payment-${payment.id}`,
        date: payment.date || payment.createdAt,
        direction: "out",
        currency: normalizeCurrency(payment.currency || supplier?.currency, defaultCurrency),
        amount,
        source: "supplier",
        sourceLabel: t.supplierPayment,
        reference: payment.reference || supplier?.supplierName || t.supplier,
        description: payment.description || payment.notes || "—",
        automatic: true,
      });
    });

    const expenseAccountMap = new Map(expenseAccounts.map((item) => [String(item.id), item]));
    const expenseReasonMap = new Map(expenseReasons.map((item) => [String(item.id), item]));
    expenses.forEach((expense) => {
      const amount = numeric(expense.amount);
      if (amount <= 0 || expense.paymentMethod === "credit") return;
      const account = expenseAccountMap.get(String(expense.accountId));
      const reason = expenseReasonMap.get(String(expense.reasonId));
      rows.push({
        id: `expense-${expense.id}`,
        date: expense.date || expense.createdAt,
        direction: "out",
        currency: normalizeCurrency(expense.currency, defaultCurrency),
        amount,
        source: "expense",
        sourceLabel: t.expensePayment,
        reference: expense.reference || account?.name || t.expensePayment,
        description: [reason?.name, expense.description].filter(Boolean).join(" — ") || account?.name || "—",
        automatic: true,
      });
    });


    const bankMap = new Map(bankAccounts.map((item) => [String(item.id), item]));
    bankTransactions.forEach((item) => {
      const bank = bankMap.get(String(item.bankId));
      const amount = numeric(item.amount);
      if (!bank || amount <= 0) return;
      const deposit = item.type === "deposit";
      rows.push({
        id: `bank-${item.id}`,
        date: item.date || item.createdAt,
        direction: deposit ? "out" : "in",
        currency: normalizeCurrency(item.currency || bank.currency, defaultCurrency),
        amount,
        source: "bank",
        sourceLabel: deposit ? t.bankDeposit : t.bankWithdrawal,
        reference: item.reference || bank.bankName || bank.accountName || "Bank",
        description: item.description || `${bank.bankName || ""} ${bank.accountName || ""}`.trim(),
        automatic: true,
      });
    });

    manualEntries.forEach((entry) => {
      rows.push({
        ...entry,
        id: `manual-${entry.id}`,
        direction: entry.direction === "out" ? "out" : "in",
        currency: normalizeCurrency(entry.currency, defaultCurrency),
        amount: numeric(entry.amount),
        source: "manual",
        sourceLabel: entry.direction === "out" ? t.manualPayment : t.manualReceipt,
        automatic: false,
        originalId: entry.id,
      });
    });

    return rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.id).localeCompare(String(a.id)));
  }, [sales, purchases, customerPayments, supplierPayments, expenses, expenseAccounts, expenseReasons, bankAccounts, bankTransactions, manualEntries, customerMap, supplierMap, defaultCurrency, t]);

  const currencyRows = useMemo(() => allRows.filter((row) => row.currency === activeCurrency), [allRows, activeCurrency]);
  const summary = useMemo(() => currencyRows.reduce((acc, row) => {
    if (row.direction === "in") acc.cashIn += numeric(row.amount);
    else acc.cashOut += numeric(row.amount);
    return acc;
  }, { cashIn: 0, cashOut: 0 }), [currencyRows]);
  const balance = summary.cashIn - summary.cashOut;

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return currencyRows.filter((row) => {
      if (typeFilter !== "all" && row.direction !== typeFilter) return false;
      if (!q) return true;
      return [row.reference, row.description, row.sourceLabel, row.amount]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [currencyRows, typeFilter, query]);

  const decimals = Math.max(0, Math.min(6, Number(currencyDecimals?.[activeCurrency] ?? 2)));
  const money = (value, currency = activeCurrency) => {
    const digits = Math.max(0, Math.min(6, Number(currencyDecimals?.[currency] ?? 2)));
    return `${numeric(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...blankEntry, date: todayDateValue(), currency: activeCurrency });
    setShowModal(true);
  };

  const openEdit = (row) => {
    if (row.automatic) return;
    const entry = manualEntries.find((item) => String(item.id) === String(row.originalId));
    if (!entry) return;
    setEditingId(entry.id);
    setForm({ ...blankEntry, ...entry, amount: String(entry.amount ?? "") });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(blankEntry);
  };

  const saveEntry = (event) => {
    event.preventDefault();
    if (!form.date || !form.direction || !form.currency || numeric(form.amount) <= 0) {
      notify(t.required, "warning");
      return;
    }
    const now = new Date().toISOString();
    const payload = {
      date: form.date,
      direction: form.direction,
      currency: normalizeCurrency(form.currency, activeCurrency),
      amount: numeric(form.amount),
      reference: String(form.reference || "").trim(),
      description: String(form.description || "").trim(),
      source: "manual",
      updatedAt: now,
    };
    if (editingId) {
      setManualEntries((current) => current.map((item) => String(item.id) === String(editingId) ? { ...item, ...payload } : item));
      notify(t.updated, "success");
    } else {
      setManualEntries((current) => [{ id: `cash-${Date.now()}`, ...payload, createdAt: now }, ...current]);
      notify(t.saved, "success");
    }
    setActiveCurrency(payload.currency);
    closeModal();
  };

  const deleteEntry = async (row) => {
    if (row.automatic) return;
    const ok = await confirmAction({ title: t.delete, message: t.deleteConfirm, confirmText: t.delete, cancelText: t.cancel, tone: "danger" });
    if (!ok) return;
    setManualEntries((current) => current.filter((item) => String(item.id) !== String(row.originalId)));
    notify(t.deleted, "success");
  };

  return (
    <div className="cash-flow-page" dir={direction}>
      <header className="cash-flow-header">
        <div>
          <span className="cash-flow-kicker"><Wallet size={16} /> {t.title}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="cash-flow-header-actions">
          <button type="button" className="cash-flow-tool" onClick={() => navigate("/banks")}><Landmark size={17} />{t.banks}</button>
          <button type="button" className="cash-flow-tool" onClick={() => navigate("/cash-count")}><Calculator size={17} />{t.cashCount}</button>
          <button type="button" className="cash-flow-tool" onClick={() => navigate("/expenses")}><FileMinus2 size={17} />{t.expenses}</button>
          <button type="button" className="cash-flow-primary" onClick={openCreate}><Plus size={18} />{t.newEntry}</button>
        </div>
      </header>

      <div className="cash-flow-currency-tabs" role="tablist" aria-label={t.currency}>
        {currencyCodes.map((code) => (
          <button type="button" key={code} className={activeCurrency === code ? "active" : ""} onClick={() => setActiveCurrency(code)}>
            <Banknote size={17} /><span>{code}</span>
          </button>
        ))}
      </div>

      <section className="cash-flow-stats">
        <article><span className="cash-flow-stat-icon in"><ArrowDownLeft size={20} /></span><div><small>{t.cashIn}</small><strong>{summary.cashIn.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} <em>{activeCurrency}</em></strong></div></article>
        <article><span className="cash-flow-stat-icon out"><ArrowUpRight size={20} /></span><div><small>{t.cashOut}</small><strong>{summary.cashOut.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} <em>{activeCurrency}</em></strong></div></article>
        <article className={balance < 0 ? "negative" : "positive"}><span className="cash-flow-stat-icon balance"><Wallet size={20} /></span><div><small>{t.balance}</small><strong>{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} <em>{activeCurrency}</em></strong></div></article>
      </section>

      <section className="cash-flow-card">
        <div className="cash-flow-card-head">
          <div><h2>{t.transactions}</h2><p>{filteredRows.length} {t.transactions.toLowerCase()}</p></div>
          <div className="cash-flow-tools">
            <div className="cash-flow-filter-buttons">
              <button type="button" className={typeFilter === "all" ? "active" : ""} onClick={() => setTypeFilter("all")}>{t.all}</button>
              <button type="button" className={typeFilter === "in" ? "active" : ""} onClick={() => setTypeFilter("in")}><ArrowDownLeft size={14} />{t.receipt}</button>
              <button type="button" className={typeFilter === "out" ? "active" : ""} onClick={() => setTypeFilter("out")}><ArrowUpRight size={14} />{t.payment}</button>
            </div>
            <label className="cash-flow-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
          </div>
        </div>

        <div className="cash-flow-table-wrap">
          <table>
            <thead><tr><th>{t.date}</th><th>{t.type}</th><th>{t.source}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredRows.length === 0 ? <tr><td colSpan="7" className="cash-flow-empty">{t.noRows}</td></tr> : filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date)}</td>
                  <td><span className={`cash-flow-direction ${row.direction}`}>{row.direction === "in" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}{row.direction === "in" ? t.receipt : t.payment}</span></td>
                  <td><span className={`cash-flow-source ${row.automatic ? "automatic" : "manual"}`}>{row.automatic ? t.automatic : t.manual}<small>{row.sourceLabel}</small></span></td>
                  <td>{row.reference || "—"}</td>
                  <td className="cash-flow-description">{row.description || "—"}</td>
                  <td className={row.direction === "in" ? "cash-flow-money in" : "cash-flow-money out"}>{row.direction === "in" ? "+" : "−"}{money(row.amount, row.currency)}</td>
                  <td>
                    {row.automatic ? <span className="cash-flow-locked">—</span> : <div className="cash-flow-row-actions">
                      <button type="button" onClick={() => openEdit(row)} title={t.edit}><Edit3 size={15} /></button>
                      <button type="button" className="danger" onClick={() => deleteEntry(row)} title={t.delete}><Trash2 size={15} /></button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && createPortal(
        <div className="cash-flow-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <section className="cash-flow-modal" role="dialog" aria-modal="true" aria-labelledby="cash-flow-modal-title" dir={direction}>
            <header className="cash-flow-modal-head">
              <div><span className="cash-flow-modal-icon"><ReceiptText size={19} /></span><div><h2 id="cash-flow-modal-title">{editingId ? t.editEntryTitle : t.newEntryTitle}</h2><p>{t.formHint}</p></div></div>
              <button type="button" className="cash-flow-close" onClick={closeModal}><X size={19} /></button>
            </header>
            <form onSubmit={saveEntry}>
              <div className="cash-flow-modal-body">
                <label><span><CalendarDays size={15} />{t.entryDate}</span><ShamsiDateInput value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label>
                <label><span>{t.entryType}</span><select value={form.direction} onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value }))}><option value="in">{t.receipt}</option><option value="out">{t.payment}</option></select></label>
                <label><span>{t.currency}</span><select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>{currencyCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
                <label><span>{t.amount}</span><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} autoFocus /></label>
                <label className="cash-flow-span-2"><span>{t.accountReference}</span><input value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder={t.accountPlaceholder} /></label>
                <label className="cash-flow-span-2"><span>{t.notes}</span><textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={t.notesPlaceholder} /></label>
              </div>
              <footer className="cash-flow-modal-footer"><button type="button" className="cash-flow-secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className="cash-flow-primary">{editingId ? t.update : t.save}</button></footer>
            </form>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
