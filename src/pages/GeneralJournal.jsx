import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  FilePlus2,
  Layers3,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./GeneralJournal.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencies = ["AFN", "USD", "PKR", "EUR"];

const tr = {
  en: {
    title: "General Journal",
    subtitle: "Review double-entry accounting records generated from sales, purchases, payments, returns and expenses.",
    newEntry: "New Journal Entry",
    journal: "Journal Entries",
    ledgers: "Ledgers",
    date: "Date",
    reference: "Reference",
    source: "Source",
    currency: "Currency",
    account: "Account",
    debit: "Debit",
    credit: "Credit",
    description: "Description",
    search: "Search account, reference or description...",
    allSources: "All Sources",
    allCurrencies: "All Currencies",
    totalDebit: "Total Debit",
    totalCredit: "Total Credit",
    difference: "Difference",
    balanced: "Balanced",
    unbalanced: "Unbalanced",
    noEntries: "No journal entries found.",
    ledgerAccount: "Ledger Account",
    balance: "Balance",
    debitBalance: "Debit balance",
    creditBalance: "Credit balance",
    manual: "Manual Journal",
    manualHint: "Record a balanced debit and credit entry.",
    debitAccount: "Debit Account",
    creditAccount: "Credit Account",
    amount: "Amount",
    refPlaceholder: "Example: JV-1001",
    accountPlaceholder: "Account name",
    descriptionPlaceholder: "Optional journal description...",
    cancel: "Cancel",
    save: "Save Entry",
    required: "Please complete date, accounts, currency and amount.",
    sameAccount: "Debit and credit accounts must be different.",
    saved: "Journal entry saved successfully.",
    deleteConfirm: "Delete this manual journal entry?",
    automatic: "Automatic",
    manualSource: "Manual",
    sale: "Sale",
    customerPayment: "Customer Payment",
    purchase: "Purchase",
    supplierPayment: "Supplier Payment",
    saleReturn: "Sale Return",
    purchaseReturn: "Purchase Return",
    expense: "Expense",
    cash: "Cash",
    bankDeposit: "Bank deposit",
    bankWithdrawal: "Bank withdrawal",
    bankAccount: "Bank",
    customer: "Customer",
    supplier: "Supplier",
    salesAccount: "Sales",
    inventory: "Inventory",
    salesReturnAccount: "Sales Returns",
    expenseAccount: "Expense",
  },
  fa: {
    title: "ژورنال عمومی",
    subtitle: "ثبت‌های بدهکار و بستانکار ایجادشده از فروش، خرید، پرداخت‌ها، برگشت‌ها و مصارف را بررسی کنید.",
    newEntry: "ثبت سند ژورنال",
    journal: "ثبت‌های ژورنال",
    ledgers: "لیجرها",
    date: "تاریخ",
    reference: "مرجع",
    source: "منبع",
    currency: "اسعار",
    account: "حساب",
    debit: "بدهکار",
    credit: "بستانکار",
    description: "توضیحات",
    search: "جستجوی حساب، مرجع یا توضیحات...",
    allSources: "تمام منابع",
    allCurrencies: "تمام اسعار",
    totalDebit: "مجموع بدهکار",
    totalCredit: "مجموع بستانکار",
    difference: "تفاوت",
    balanced: "متوازن",
    unbalanced: "نامتوازن",
    noEntries: "هیچ ثبت ژورنال پیدا نشد.",
    ledgerAccount: "حساب لیجر",
    balance: "بیلانس",
    debitBalance: "بیلانس بدهکار",
    creditBalance: "بیلانس بستانکار",
    manual: "ژورنال دستی",
    manualHint: "یک ثبت متوازن بدهکار و بستانکار ایجاد کنید.",
    debitAccount: "حساب بدهکار",
    creditAccount: "حساب بستانکار",
    amount: "مقدار",
    refPlaceholder: "مثلاً JV-1001",
    accountPlaceholder: "نام حساب",
    descriptionPlaceholder: "توضیحات اختیاری سند...",
    cancel: "لغو",
    save: "ذخیره سند",
    required: "لطفاً تاریخ، حساب‌ها، اسعار و مقدار را تکمیل کنید.",
    sameAccount: "حساب بدهکار و بستانکار باید متفاوت باشند.",
    saved: "سند ژورنال با موفقیت ذخیره شد.",
    deleteConfirm: "این سند ژورنال دستی حذف شود؟",
    automatic: "اتوماتیک",
    manualSource: "دستی",
    sale: "فروش",
    customerPayment: "پرداخت مشتری",
    purchase: "خرید",
    supplierPayment: "پرداخت تأمین‌کننده",
    saleReturn: "برگشت فروش",
    purchaseReturn: "برگشت خرید",
    expense: "مصرف",
    cash: "نقد",
    bankDeposit: "واریز بانک",
    bankWithdrawal: "برداشت بانک",
    bankAccount: "بانک",
    customer: "مشتری",
    supplier: "تأمین‌کننده",
    salesAccount: "فروشات",
    inventory: "موجودی",
    salesReturnAccount: "برگشت فروش",
    expenseAccount: "مصرف",
  },
  ps: {
    title: "عمومي ژورنال",
    subtitle: "د خرڅلاو، پېرود، تادیاتو، بېرته ستنولو او مصارفو څخه جوړ شوي Debit/Credit ثبتونه وګورئ.",
    newEntry: "نوی ژورنال سند",
    journal: "د ژورنال ثبتونه",
    ledgers: "لیجرونه",
    date: "نېټه",
    reference: "مرجع",
    source: "سرچینه",
    currency: "اسعار",
    account: "حساب",
    debit: "Debit",
    credit: "Credit",
    description: "تشریح",
    search: "د حساب، مرجع یا تشریح لټون...",
    allSources: "ټولې سرچینې",
    allCurrencies: "ټول اسعار",
    totalDebit: "ټول Debit",
    totalCredit: "ټول Credit",
    difference: "توپیر",
    balanced: "متوازن",
    unbalanced: "نامتوازن",
    noEntries: "د ژورنال ثبت ونه موندل شو.",
    ledgerAccount: "د لیجر حساب",
    balance: "بیلانس",
    debitBalance: "Debit بیلانس",
    creditBalance: "Credit بیلانس",
    manual: "لاسي ژورنال",
    manualHint: "یو متوازن Debit او Credit سند ثبت کړئ.",
    debitAccount: "Debit حساب",
    creditAccount: "Credit حساب",
    amount: "مقدار",
    refPlaceholder: "لکه JV-1001",
    accountPlaceholder: "د حساب نوم",
    descriptionPlaceholder: "اختیاري تشریح...",
    cancel: "لغوه",
    save: "سند ثبت کړئ",
    required: "مهرباني وکړئ نېټه، حسابونه، اسعار او مقدار بشپړ کړئ.",
    sameAccount: "Debit او Credit حسابونه باید جلا وي.",
    saved: "ژورنال سند په بریالیتوب ثبت شو.",
    deleteConfirm: "دا لاسي ژورنال سند حذف شي؟",
    automatic: "اتومات",
    manualSource: "لاسي",
    sale: "خرڅلاو",
    customerPayment: "د پېرودونکي تادیه",
    purchase: "پېرود",
    supplierPayment: "عرضه کوونکي ته تادیه",
    saleReturn: "د خرڅلاو بېرته ستنول",
    purchaseReturn: "د پېرود بېرته ستنول",
    expense: "مصرف",
    cash: "نغدي",
    bankDeposit: "بانک ته جمع",
    bankWithdrawal: "له بانک څخه ایستل",
    bankAccount: "بانک",
    customer: "پېرودونکی",
    supplier: "عرضه کوونکی",
    salesAccount: "خرڅلاو",
    inventory: "موجودي",
    salesReturnAccount: "د خرڅلاو بېرته ستنول",
    expenseAccount: "مصرف",
  },
};

const numeric = (value) => Math.max(Number(value || 0), 0);
const normalizeCurrency = (value) => currencies.includes(String(value || "").toUpperCase()) ? String(value).toUpperCase() : "AFN";
const today = () => new Date().toISOString().slice(0, 10);

function line(id, journalId, date, reference, source, currency, account, debit, credit, description, automatic = true) {
  return { id, journalId, date: date || today(), reference: reference || "—", source, currency: normalizeCurrency(currency), account: account || "—", debit: numeric(debit), credit: numeric(credit), description: description || "", automatic };
}

export default function GeneralJournal() {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [customers] = useJsonCollection("customerRegistry");
  const [suppliers] = useJsonCollection("suppliers");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [supplierPayments] = useJsonCollection("supplierPayments");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [expenses] = useJsonCollection("expenses");
  const [expenseAccounts] = useJsonCollection("expenseAccounts");
  const [manualCash] = useJsonCollection("cashTransactions");
  const [bankAccounts] = useJsonCollection("bankAccounts");
  const [bankTransactions] = useJsonCollection("bankTransactions");
  const [manualEntries, setManualEntries] = useJsonCollection("journalEntries");

  const [activeTab, setActiveTab] = useState("journal");
  const [query, setQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: today(), reference: "", currency: "AFN", debitAccount: "", creditAccount: "", amount: "", description: "" });

  const t = tr[language] || tr.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

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
    document.body.classList.toggle("general-journal-modal-open", showModal);
    return () => document.body.classList.remove("general-journal-modal-open");
  }, [showModal]);

  const customerName = (id) => {
    const item = customers.find((row) => String(row.id) === String(id));
    return item?.fullName || item?.companyName || `${t.customer} ${id || ""}`.trim();
  };
  const supplierName = (id) => {
    const item = suppliers.find((row) => String(row.id) === String(id));
    return item?.supplierName || item?.name || `${t.supplier} ${id || ""}`.trim();
  };
  const expenseAccountName = (id) => expenseAccounts.find((row) => String(row.id) === String(id))?.name || t.expenseAccount;

  const automaticLines = useMemo(() => {
    const rows = [];

    sales.forEach((sale) => {
      const amount = numeric(sale.grandTotal ?? sale.totalAmount ?? sale.total);
      const paid = numeric(sale.paidAmount ?? sale.paid);
      const currency = normalizeCurrency(sale.currency || "AFN");
      const date = sale.saleDate || sale.date || String(sale.createdAt || "").slice(0, 10);
      const ref = sale.invoiceNumber || sale.invoiceNo || sale.id;
      const customer = `${t.customer}: ${customerName(sale.customerId)}`;
      if (amount) {
        rows.push(line(`sale-dr-${sale.id}`, sale.id, date, ref, "sale", currency, customer, amount, 0, t.sale));
        rows.push(line(`sale-cr-${sale.id}`, sale.id, date, ref, "sale", currency, t.salesAccount, 0, amount, t.sale));
      }
      if (paid) {
        rows.push(line(`sale-pay-dr-${sale.id}`, `${sale.id}-payment`, date, ref, "customer-payment", currency, t.cash, paid, 0, t.customerPayment));
        rows.push(line(`sale-pay-cr-${sale.id}`, `${sale.id}-payment`, date, ref, "customer-payment", currency, customer, 0, paid, t.customerPayment));
      }
    });

    customerPayments.forEach((payment) => {
      const amount = numeric(payment.amount);
      if (!amount) return;
      const currency = normalizeCurrency(payment.currency || "AFN");
      const customer = `${t.customer}: ${customerName(payment.customerId)}`;
      const ref = payment.reference || payment.paymentNo || payment.id;
      const date = payment.paymentDate || payment.date || String(payment.createdAt || "").slice(0, 10);
      rows.push(line(`cp-dr-${payment.id}`, payment.id, date, ref, "customer-payment", currency, t.cash, amount, 0, payment.description || t.customerPayment));
      rows.push(line(`cp-cr-${payment.id}`, payment.id, date, ref, "customer-payment", currency, customer, 0, amount, payment.description || t.customerPayment));
    });

    purchases.forEach((purchase) => {
      const amount = numeric(purchase.totalAmount ?? purchase.total);
      const paid = numeric(purchase.paidAmount ?? purchase.paid);
      const currency = normalizeCurrency(purchase.currency || "AFN");
      const date = purchase.purchaseDate || purchase.date || String(purchase.createdAt || "").slice(0, 10);
      const ref = purchase.billNumber || purchase.billNo || purchase.id;
      const supplier = `${t.supplier}: ${supplierName(purchase.supplierId)}`;
      if (amount) {
        rows.push(line(`pur-dr-${purchase.id}`, purchase.id, date, ref, "purchase", currency, t.inventory, amount, 0, t.purchase));
        rows.push(line(`pur-cr-${purchase.id}`, purchase.id, date, ref, "purchase", currency, supplier, 0, amount, t.purchase));
      }
      if (paid) {
        rows.push(line(`pur-pay-dr-${purchase.id}`, `${purchase.id}-payment`, date, ref, "supplier-payment", currency, supplier, paid, 0, t.supplierPayment));
        rows.push(line(`pur-pay-cr-${purchase.id}`, `${purchase.id}-payment`, date, ref, "supplier-payment", currency, t.cash, 0, paid, t.supplierPayment));
      }
    });

    supplierPayments.forEach((payment) => {
      const amount = numeric(payment.amount);
      if (!amount) return;
      const currency = normalizeCurrency(payment.currency || "AFN");
      const supplier = `${t.supplier}: ${supplierName(payment.supplierId)}`;
      const ref = payment.reference || payment.paymentNo || payment.id;
      const date = payment.paymentDate || payment.date || String(payment.createdAt || "").slice(0, 10);
      rows.push(line(`sp-dr-${payment.id}`, payment.id, date, ref, "supplier-payment", currency, supplier, amount, 0, payment.description || t.supplierPayment));
      rows.push(line(`sp-cr-${payment.id}`, payment.id, date, ref, "supplier-payment", currency, t.cash, 0, amount, payment.description || t.supplierPayment));
    });

    saleReturns.forEach((item) => {
      const amount = numeric(item.totalAmount);
      if (!amount) return;
      const currency = normalizeCurrency(item.currency || sales.find((sale) => String(sale.id) === String(item.saleId))?.currency || "AFN");
      const customer = `${t.customer}: ${customerName(item.customerId)}`;
      const date = item.returnDate || String(item.createdAt || "").slice(0, 10);
      const ref = item.returnNo || item.id;
      rows.push(line(`sr-dr-${item.id}`, item.id, date, ref, "sale-return", currency, t.salesReturnAccount, amount, 0, t.saleReturn));
      rows.push(line(`sr-cr-${item.id}`, item.id, date, ref, "sale-return", currency, customer, 0, amount, t.saleReturn));
    });

    purchaseReturns.forEach((item) => {
      const amount = numeric(item.totalAmount);
      if (!amount) return;
      const currency = normalizeCurrency(item.currency || purchases.find((purchase) => String(purchase.id) === String(item.purchaseId))?.currency || "AFN");
      const supplier = `${t.supplier}: ${supplierName(item.supplierId)}`;
      const date = item.returnDate || String(item.createdAt || "").slice(0, 10);
      const ref = item.returnNo || item.id;
      rows.push(line(`pr-dr-${item.id}`, item.id, date, ref, "purchase-return", currency, supplier, amount, 0, t.purchaseReturn));
      rows.push(line(`pr-cr-${item.id}`, item.id, date, ref, "purchase-return", currency, t.inventory, 0, amount, t.purchaseReturn));
    });

    expenses.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount) return;
      const currency = normalizeCurrency(item.currency || "AFN");
      const date = item.date || String(item.createdAt || "").slice(0, 10);
      const ref = item.reference || item.id;
      const account = `${t.expense}: ${expenseAccountName(item.accountId)}`;
      rows.push(line(`exp-dr-${item.id}`, item.id, date, ref, "expense", currency, account, amount, 0, item.description || t.expense));
      rows.push(line(`exp-cr-${item.id}`, item.id, date, ref, "expense", currency, t.cash, 0, amount, item.description || t.expense));
    });


    const bankMap = new Map(bankAccounts.map((item) => [String(item.id), item]));
    bankTransactions.forEach((item) => {
      const amount = numeric(item.amount);
      const bank = bankMap.get(String(item.bankId));
      if (!bank || !amount) return;
      const currency = normalizeCurrency(item.currency || bank.currency || "AFN");
      const date = item.date || String(item.createdAt || "").slice(0, 10);
      const ref = item.reference || item.id;
      const bankAccount = `${t.bankAccount}: ${bank.bankName || ""} ${bank.accountName || ""}`.trim();
      const deposit = item.type === "deposit";
      if (deposit) {
        rows.push(line(`bank-dr-${item.id}`, item.id, date, ref, "bank-deposit", currency, bankAccount, amount, 0, item.description || t.bankDeposit));
        rows.push(line(`bank-cr-${item.id}`, item.id, date, ref, "bank-deposit", currency, t.cash, 0, amount, item.description || t.bankDeposit));
      } else {
        rows.push(line(`bank-dr-${item.id}`, item.id, date, ref, "bank-withdrawal", currency, t.cash, amount, 0, item.description || t.bankWithdrawal));
        rows.push(line(`bank-cr-${item.id}`, item.id, date, ref, "bank-withdrawal", currency, bankAccount, 0, amount, item.description || t.bankWithdrawal));
      }
    });

    manualCash.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount) return;
      const currency = normalizeCurrency(item.currency || "AFN");
      const date = item.date || String(item.createdAt || "").slice(0, 10);
      const ref = item.reference || item.id;
      const counterpart = item.account || item.accountName || item.description || "Cash Counterpart";
      const type = String(item.type || item.entryType || "in").toLowerCase();
      const cashIn = ["in", "income", "receipt", "cash-in"].includes(type);
      if (cashIn) {
        rows.push(line(`cash-dr-${item.id}`, item.id, date, ref, "cash", currency, t.cash, amount, 0, item.description || counterpart));
        rows.push(line(`cash-cr-${item.id}`, item.id, date, ref, "cash", currency, counterpart, 0, amount, item.description || counterpart));
      } else {
        rows.push(line(`cash-dr-${item.id}`, item.id, date, ref, "cash", currency, counterpart, amount, 0, item.description || counterpart));
        rows.push(line(`cash-cr-${item.id}`, item.id, date, ref, "cash", currency, t.cash, 0, amount, item.description || counterpart));
      }
    });

    return rows;
  }, [sales, purchases, customers, suppliers, customerPayments, supplierPayments, saleReturns, purchaseReturns, expenses, expenseAccounts, bankAccounts, bankTransactions, manualCash, t]);

  const manualLines = useMemo(() => manualEntries.flatMap((entry) => {
    const amount = numeric(entry.amount);
    return [
      line(`manual-dr-${entry.id}`, entry.id, entry.date, entry.reference, "manual", entry.currency, entry.debitAccount, amount, 0, entry.description, false),
      line(`manual-cr-${entry.id}`, entry.id, entry.date, entry.reference, "manual", entry.currency, entry.creditAccount, 0, amount, entry.description, false),
    ];
  }), [manualEntries]);

  const allLines = useMemo(() => [...automaticLines, ...manualLines].sort((a, b) => `${b.date}-${b.journalId}`.localeCompare(`${a.date}-${a.journalId}`)), [automaticLines, manualLines]);
  const sources = useMemo(() => [...new Set(allLines.map((row) => row.source))].sort(), [allLines]);

  const filteredLines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allLines.filter((row) => {
      if (currencyFilter !== "ALL" && row.currency !== currencyFilter) return false;
      if (sourceFilter !== "ALL" && row.source !== sourceFilter) return false;
      if (!q) return true;
      return `${row.account} ${row.reference} ${row.description} ${row.source}`.toLowerCase().includes(q);
    });
  }, [allLines, query, currencyFilter, sourceFilter]);

  const totals = useMemo(() => filteredLines.reduce((acc, row) => ({ debit: acc.debit + numeric(row.debit), credit: acc.credit + numeric(row.credit) }), { debit: 0, credit: 0 }), [filteredLines]);
  const difference = Math.abs(totals.debit - totals.credit);

  const ledgers = useMemo(() => {
    const map = new Map();
    filteredLines.forEach((row) => {
      const key = `${row.currency}::${row.account}`;
      const current = map.get(key) || { account: row.account, currency: row.currency, debit: 0, credit: 0 };
      current.debit += numeric(row.debit);
      current.credit += numeric(row.credit);
      map.set(key, current);
    });
    return [...map.values()].map((row) => ({ ...row, balance: row.debit - row.credit })).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [filteredLines]);

  const openModal = () => {
    setForm({ date: today(), reference: `JV-${String(Date.now()).slice(-7)}`, currency: currencyFilter !== "ALL" ? currencyFilter : "AFN", debitAccount: "", creditAccount: "", amount: "", description: "" });
    setShowModal(true);
  };

  const saveManual = async (event) => {
    event.preventDefault();
    const amount = numeric(form.amount);
    if (!form.date || !form.debitAccount.trim() || !form.creditAccount.trim() || !form.currency || !amount) return notify(t.required, "warning");
    if (form.debitAccount.trim().toLowerCase() === form.creditAccount.trim().toLowerCase()) return notify(t.sameAccount, "warning");
    const now = new Date().toISOString();
    const entry = { id: `journal-${Date.now()}`, date: form.date, reference: form.reference.trim() || `JV-${String(Date.now()).slice(-7)}`, currency: normalizeCurrency(form.currency), debitAccount: form.debitAccount.trim(), creditAccount: form.creditAccount.trim(), amount, description: form.description.trim(), createdAt: now, updatedAt: now };
    const ok = await setManualEntries([entry, ...manualEntries]);
    if (ok) {
      notify(t.saved, "success");
      setShowModal(false);
    }
  };

  const deleteManual = async (journalId) => {
    if (!window.confirm(t.deleteConfirm)) return;
    await setManualEntries(manualEntries.filter((entry) => String(entry.id) !== String(journalId)));
  };

  const sourceLabel = (source) => ({
    sale: t.sale,
    "customer-payment": t.customerPayment,
    purchase: t.purchase,
    "supplier-payment": t.supplierPayment,
    "sale-return": t.saleReturn,
    "purchase-return": t.purchaseReturn,
    expense: t.expense,
    cash: t.cash,
    "bank-deposit": t.bankDeposit,
    "bank-withdrawal": t.bankWithdrawal,
    manual: t.manualSource,
  }[source] || source);

  return (
    <div className="general-journal-page" dir={direction}>
      <div className="general-journal-head">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="general-journal-primary" onClick={openModal}><FilePlus2 size={17} />{t.newEntry}</button>
      </div>

      <div className="general-journal-stats">
        <div><span>{t.totalDebit}</span><strong>{totals.debit.toFixed(2)}</strong></div>
        <div><span>{t.totalCredit}</span><strong>{totals.credit.toFixed(2)}</strong></div>
        <div className={difference < 0.000001 ? "is-balanced" : "is-unbalanced"}><span>{t.difference}</span><strong>{difference.toFixed(2)}</strong><small>{difference < 0.000001 ? t.balanced : t.unbalanced}</small></div>
      </div>

      <section className="general-journal-card">
        <div className="general-journal-toolbar">
          <div className="general-journal-tabs">
            <button className={activeTab === "journal" ? "active" : ""} onClick={() => setActiveTab("journal")}><BookOpen size={16} />{t.journal}</button>
            <button className={activeTab === "ledgers" ? "active" : ""} onClick={() => setActiveTab("ledgers")}><Layers3 size={16} />{t.ledgers}</button>
          </div>
          <div className="general-journal-filters">
            <div className="general-journal-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /></div>
            <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}><option value="ALL">{t.allCurrencies}</option>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="ALL">{t.allSources}</option>{sources.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}</select>
          </div>
        </div>

        {activeTab === "journal" ? (
          <div className="general-journal-table-wrap">
            <table>
              <thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.source}</th><th>{t.currency}</th><th>{t.account}</th><th>{t.debit}</th><th>{t.credit}</th><th>{t.description}</th><th /></tr></thead>
              <tbody>
                {filteredLines.length ? filteredLines.map((row) => <tr key={row.id}>
                  <td>{row.date || "—"}</td><td>{row.reference}</td><td><span className={`general-journal-source source-${row.source}`}>{sourceLabel(row.source)}</span></td><td>{row.currency}</td><td className="general-journal-account">{row.account}</td><td className="journal-debit">{row.debit ? row.debit.toFixed(2) : "—"}</td><td className="journal-credit">{row.credit ? row.credit.toFixed(2) : "—"}</td><td>{row.description || "—"}</td><td>{!row.automatic && <button className="general-journal-delete" onClick={() => deleteManual(row.journalId)} title="Delete"><Trash2 size={15} /></button>}</td>
                </tr>) : <tr><td colSpan="9" className="general-journal-empty">{t.noEntries}</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="general-journal-table-wrap">
            <table>
              <thead><tr><th>{t.ledgerAccount}</th><th>{t.currency}</th><th>{t.debit}</th><th>{t.credit}</th><th>{t.balance}</th></tr></thead>
              <tbody>
                {ledgers.length ? ledgers.map((row) => <tr key={`${row.currency}-${row.account}`}><td className="general-journal-account">{row.account}</td><td>{row.currency}</td><td className="journal-debit">{row.debit.toFixed(2)}</td><td className="journal-credit">{row.credit.toFixed(2)}</td><td><strong className={row.balance >= 0 ? "ledger-debit-balance" : "ledger-credit-balance"}>{Math.abs(row.balance).toFixed(2)} <small>{row.balance >= 0 ? t.debitBalance : t.creditBalance}</small></strong></td></tr>) : <tr><td colSpan="5" className="general-journal-empty">{t.noEntries}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && createPortal(
        <div className="general-journal-overlay" onMouseDown={() => setShowModal(false)}>
          <form className="general-journal-modal" onSubmit={saveManual} onMouseDown={(e) => e.stopPropagation()}>
            <div className="general-journal-modal-head"><div><h2><FilePlus2 size={19} />{t.manual}</h2><p>{t.manualHint}</p></div><button type="button" onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <div className="general-journal-modal-body">
              <div className="general-journal-form-grid">
                <label><span>{t.date}</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
                <label><span>{t.reference}</span><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder={t.refPlaceholder} /></label>
                <label><span>{t.currency}</span><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{currencies.map((code) => <option key={code}>{code}</option>)}</select></label>
                <label><span>{t.amount}</span><input type="number" min="0" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
                <label><span>{t.debitAccount}</span><input value={form.debitAccount} onChange={(e) => setForm({ ...form, debitAccount: e.target.value })} placeholder={t.accountPlaceholder} required /></label>
                <label><span>{t.creditAccount}</span><input value={form.creditAccount} onChange={(e) => setForm({ ...form, creditAccount: e.target.value })} placeholder={t.accountPlaceholder} required /></label>
                <label className="general-journal-wide"><span>{t.description}</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t.descriptionPlaceholder} /></label>
              </div>
            </div>
            <div className="general-journal-modal-footer"><button type="button" className="general-journal-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button><button className="general-journal-primary"><Check size={17} />{t.save}</button></div>
          </form>
        </div>, document.body
      )}
    </div>
  );
}
