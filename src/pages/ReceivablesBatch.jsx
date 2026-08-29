import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Coins,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatAfghanDate } from "../utils/afghanDate";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./PayablesBatch.css";

const languageKey = "afghan-power-language";
const num = (value) => Number(value || 0) || 0;
const currencies = ["AFN", "USD", "EUR", "INR"];
const today = () => new Date().toISOString().slice(0, 10);

const tr = {
  en: {
    title: "Collect Receivables",
    editTitle: "Edit Receivables Collection",
    subtitle: "Collect balances from multiple customers in one clean form.",
    back: "Back to Receivables",
    date: "Collection Date",
    search: "Search customer, phone or company...",
    customer: "Customer",
    current: "Current Balance",
    customerOwes: "Customer owes us",
    weOweCustomer: "We owe customer",
    settled: "Settled",
    currency: "Currency",
    amount: "Received Amount",
    note: "Note",
    notePlaceholder: "Optional note...",
    total: "Collection Summary",
    customersPaid: "Customers",
    save: "Save All Collections",
    update: "Save Changes",
    required: "Enter a received amount for at least one customer.",
    saved: "Receivables collection saved successfully.",
    updated: "Receivables collection updated successfully.",
    loading: "Preparing customers...",
    noCustomers: "No customers found.",
    helper: "You may also receive from a customer with no balance. The extra amount will become customer credit.",
    historyTitle: "Receivables Collection Records",
    historySub: "Grouped customer collections are listed here.",
    newPayment: "New Receivables",
    reference: "Reference",
    customerCount: "Customers",
    totalPayments: "Total Received",
    actions: "Actions",
    edit: "Edit",
    print: "Print",
    delete: "Delete",
    noHistory: "No receivables collection records yet.",
    deleteTitle: "Delete this collection record?",
    deleteMessage: "All customer ledger receipts created by this grouped collection will also be removed.",
    cancel: "Cancel",
    confirmDelete: "Delete",
    deleted: "Receivables collection deleted.",
    searchHint: "Search to add customers. Selected customers remain visible.",
  },
  fa: {
    title: "ثبت طلبات",
    editTitle: "ایدیت ثبت طلبات",
    subtitle: "دریافت پول از چندین مشتری را در یک فورم منظم ثبت کنید.",
    back: "برگشت به طلبات",
    date: "تاریخ دریافت",
    search: "جستجوی مشتری، شماره تماس یا کمپنی...",
    customer: "مشتری",
    current: "بیلانس فعلی",
    customerOwes: "مشتری از ما قرضدار است",
    weOweCustomer: "ما به مشتری قرضدار استیم",
    settled: "حساب تصفیه است",
    currency: "واحد پول",
    amount: "مبلغ دریافت",
    note: "یادداشت",
    notePlaceholder: "یادداشت اختیاری...",
    total: "خلاصه دریافت",
    customersPaid: "مشتری دریافت‌شده",
    save: "ثبت تمام دریافت‌ها",
    update: "ذخیره تغییرات",
    required: "برای حداقل یک مشتری مبلغ دریافت وارد کنید.",
    saved: "ثبت طلبات موفقانه ذخیره شد.",
    updated: "ثبت طلبات موفقانه ویرایش شد.",
    loading: "در حال آماده‌سازی مشتریان...",
    noCustomers: "مشتری پیدا نشد.",
    helper: "حتی اگر مشتری قرض نداشته باشد می‌توانید دریافت ثبت کنید؛ مبلغ اضافه به اعتبار مشتری تبدیل می‌شود.",
    historyTitle: "ریکاردهای ثبت طلبات",
    historySub: "دریافت‌های گروهی مشتریان در اینجا لیست می‌شوند.",
    newPayment: "طلبات جدید",
    reference: "مرجع",
    customerCount: "مشتریان",
    totalPayments: "مجموع دریافت",
    actions: "عملیات",
    edit: "ایدیت",
    print: "پرنت",
    delete: "حذف",
    noHistory: "هنوز ریکارد ثبت طلبات وجود ندارد.",
    deleteTitle: "این ریکارد طلبات حذف شود؟",
    deleteMessage: "تمام دریافت‌های ساخته‌شده در لیجر مشتریان نیز حذف می‌شوند.",
    cancel: "لغو",
    confirmDelete: "حذف",
    deleted: "ریکارد ثبت طلبات حذف شد.",
    searchHint: "برای اضافه کردن مشتری جستجو کنید. مشتریان انتخاب‌شده باقی می‌مانند.",
  },
  ps: {
    title: "د طلباتو ثبت",
    editTitle: "د طلباتو د ثبت سمون",
    subtitle: "له څو پېرودونکو څخه ترلاسه شوې پیسې په یوه منظم فورم کې ثبت کړئ.",
    back: "طلباتو ته بېرته",
    date: "د ترلاسه کولو نېټه",
    search: "پېرودونکی، تلیفون یا شرکت ولټوئ...",
    customer: "پېرودونکی",
    current: "اوسنی بیلانس",
    customerOwes: "پېرودونکی موږ ته پوروړی دی",
    weOweCustomer: "موږ پېرودونکي ته پوروړي یو",
    settled: "حساب تصفیه دی",
    currency: "اسعار",
    amount: "ترلاسه شوی مبلغ",
    note: "یادښت",
    notePlaceholder: "اختیاري یادښت...",
    total: "د ترلاسه کولو لنډیز",
    customersPaid: "پېرودونکي",
    save: "ټولې ترلاسه شوې پیسې ثبت کړئ",
    update: "بدلونونه خوندي کړئ",
    required: "لږ تر لږه د یوه پېرودونکي لپاره مبلغ ولیکئ.",
    saved: "د طلباتو ثبت په بریالیتوب خوندي شو.",
    updated: "د طلباتو ثبت په بریالیتوب اصلاح شو.",
    loading: "پېرودونکي چمتو کېږي...",
    noCustomers: "هیڅ پېرودونکی ونه موندل شو.",
    helper: "که پېرودونکی پور هم ونه لري، ترلاسه کول ثبتولی شئ؛ اضافه مبلغ د پېرودونکي اعتبار ګرځي.",
    historyTitle: "د طلباتو د ثبت ریکارډونه",
    historySub: "ډله‌ییز ترلاسه کول دلته ښودل کېږي.",
    newPayment: "نوي طلبات",
    reference: "مرجع",
    customerCount: "پېرودونکي",
    totalPayments: "ټول ترلاسه شوي",
    actions: "عملیات",
    edit: "سمون",
    print: "چاپ",
    delete: "حذف",
    noHistory: "تر اوسه د طلباتو ریکارډ نشته.",
    deleteTitle: "دا د طلباتو ریکارډ حذف شي؟",
    deleteMessage: "د پېرودونکو په لیجر کې اړوند ټول ترلاسه کول هم حذف کېږي.",
    cancel: "لغوه",
    confirmDelete: "حذف",
    deleted: "د طلباتو ریکارډ حذف شو.",
    searchHint: "د پېرودونکي د زیاتولو لپاره لټون وکړئ. ټاکل شوي پېرودونکي به ښکاره پاتې شي.",
  },
};

function customerCurrency(customer) {
  const raw = String(customer?.currency || customer?.currencyCode || "AFN").toUpperCase();
  return currencies.find((code) => raw.includes(code)) || "AFN";
}

function customerName(customer) {
  return customer?.fullName || customer?.customerName || customer?.companyName || customer?.name || "";
}

export default function ReceivablesBatch() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const isEdit = Boolean(batchId);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");
  const [customers, , , customersLoaded] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [customerPayments, setCustomerPayments] = useJsonCollection("customerPayments");
  const [batches, setBatches, , batchesLoaded] = useJsonCollection("customerPaymentBatches");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState({});
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(isEdit);
  const searchRef = useRef(null);
  const customerRefs = useRef(new Map());
  const amountRefs = useRef(new Map());
  const t = tr[language] || tr.fa;
  const dir = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "fa");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const balanceMap = useMemo(() => {
    const map = new Map();
    customers.forEach((customer) => {
      const id = String(customer.id);
      const customerSales = sales.filter((row) => String(row.customerId) === id);
      const totalSold = customerSales.reduce((sum, row) => sum + num(row.totalAmount), 0);
      const paidAtSale = customerSales.reduce((sum, row) => sum + num(row.paidAmount), 0);
      const returned = saleReturns
        .filter((row) => String(row.customerId) === id)
        .reduce((sum, row) => sum + num(row.totalAmount), 0);
      const paidLater = customerPayments
        .filter((row) => String(row.customerId) === id && (!isEdit || String(row.batchId || "") !== String(batchId)))
        .reduce((sum, row) => sum + num(row.amount), 0);
      map.set(id, num(customer.openingBalance) + totalSold - paidAtSale - returned - paidLater);
    });
    return map;
  }, [customers, sales, saleReturns, customerPayments, isEdit, batchId]);

  useEffect(() => {
    if (!customersLoaded || !batchesLoaded || hydrated) return;
    const batch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
    if (isEdit && !batch) {
      notify("Receivables collection not found.", "error");
      navigate("/receivables", { replace: true });
      return;
    }
    const initial = {};
    customers.forEach((customer) => {
      const old = batch?.payments?.find((row) => String(row.customerId) === String(customer.id));
      initial[String(customer.id)] = {
        amount: old?.amount ?? "",
        currency: old?.currency || customerCurrency(customer),
        note: old?.note || old?.description || "",
      };
    });
    setEntries(initial);
    if (batch?.payments?.length) {
      setSelectedCustomerIds(new Set(batch.payments.map((row) => String(row.customerId))));
    }
    if (batch?.date) setDate(batch.date);
    setHydrated(true);
  }, [customersLoaded, batchesLoaded, hydrated, isEdit, batches, batchId, customers, navigate]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.filter((customer) => selectedCustomerIds.has(String(customer.id)));
    return customers.filter((customer) => selectedCustomerIds.has(String(customer.id)) ||
      [customer.fullName, customer.customerName, customer.companyName, customer.phone, customer.alternatePhone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [customers, search, selectedCustomerIds]);

  const activePayments = useMemo(() => customers
    .filter((customer) => selectedCustomerIds.has(String(customer.id)))
    .map((customer) => {
      const entry = entries[String(customer.id)] || {};
      const amount = Math.max(num(entry.amount), 0);
      if (!amount) return null;
      return {
        customerId: customer.id,
        customerName: customerName(customer),
        phone: customer.phone || customer.alternatePhone || "",
        amount,
        currency: entry.currency || customerCurrency(customer),
        note: String(entry.note || "").trim(),
        previousBalance: num(balanceMap.get(String(customer.id))),
      };
    })
    .filter(Boolean), [customers, entries, balanceMap, selectedCustomerIds]);

  const totals = useMemo(() => {
    const result = {};
    activePayments.forEach((row) => { result[row.currency] = (result[row.currency] || 0) + row.amount; });
    return result;
  }, [activePayments]);

  const setEntry = (customerId, patch) => {
    const id = String(customerId);
    setEntries((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const toggleCustomerSelection = (customerId) => {
    const id = String(customerId);
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusCustomer = (index) => {
    if (!filteredCustomers.length) return;
    const nextIndex = Math.max(0, Math.min(index, filteredCustomers.length - 1));
    customerRefs.current.get(String(filteredCustomers[nextIndex].id))?.focus();
  };

  const focusCustomerAmount = (customerId) => {
    window.setTimeout(() => {
      const input = amountRefs.current.get(String(customerId));
      input?.focus();
      input?.select?.();
    }, 0);
  };

  const activateCustomer = (customerId) => {
    const id = String(customerId);
    const wasSelected = selectedCustomerIds.has(id);
    toggleCustomerSelection(id);
    if (!wasSelected) {
      setSearch("");
      focusCustomerAmount(id);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusCustomer(0);
    } else if (event.key === "Enter" && filteredCustomers.length) {
      event.preventDefault();
      activateCustomer(filteredCustomers[0].id);
    }
  };

  const handleCustomerKeyDown = (event, index, customerId) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusCustomer(index + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusCustomer(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusCustomer(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusCustomer(filteredCustomers.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateCustomer(customerId);
    }
  };

  const handleLastFieldKeyDown = (event, index) => {
    if (event.key === "Tab" && !event.shiftKey && index === filteredCustomers.length - 1) {
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select?.();
    }
  };

  const save = async () => {
    if (!activePayments.length) {
      notify(t.required, "warning");
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const id = isEdit ? String(batchId) : `CPB-${Date.now()}`;
      const oldBatch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
      const paymentRows = activePayments.map((row, index) => ({
        id: isEdit
          ? (oldBatch?.payments?.find((old) => String(old.customerId) === String(row.customerId))?.paymentId || `CPAY-${Date.now()}-${index}`)
          : `CPAY-${Date.now()}-${index}`,
        customerId: row.customerId,
        customerName: row.customerName,
        amount: row.amount,
        currency: row.currency,
        note: row.note,
      }));
      const batch = {
        id,
        reference: oldBatch?.reference || `RB-${String(Date.now()).slice(-8)}`,
        date: date || today(),
        payments: paymentRows.map((row) => ({ ...row, paymentId: row.id })),
        customerCount: paymentRows.length,
        totals,
        createdAt: oldBatch?.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      };
      const basePayments = customerPayments.filter((row) => String(row.batchId || "") !== id);
      const nextPayments = paymentRows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        customerName: row.customerName,
        date: batch.date,
        amount: row.amount,
        currency: row.currency,
        description: row.note || (language === "fa" ? "ثبت طلبات" : language === "ps" ? "د طلباتو ثبت" : "Receivables collection"),
        reference: batch.reference,
        batchId: id,
        createdAt: oldBatch?.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      }));
      const paymentsSaved = await setCustomerPayments([...nextPayments, ...basePayments]);
      if (!paymentsSaved) return;
      const batchesSaved = await setBatches(isEdit
        ? batches.map((row) => String(row.id) === id ? batch : row)
        : [batch, ...batches]);
      if (!batchesSaved) {
        await setCustomerPayments(customerPayments);
        return;
      }
      notify(isEdit ? t.updated : t.saved, "success", { silent: true });
      if (isEdit) navigate("/receivables/payments/new", { replace: true });
      else {
        setSearch("");
        setEntries({});
        setSelectedCustomerIds(new Set());
        setFormOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const totalsText = (batchTotals) => Object.entries(batchTotals || {})
    .filter(([, value]) => num(value) > 0)
    .map(([code, value]) => `${code} ${num(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
    .join(" · ") || "—";

  const deleteBatch = async (batch) => {
    const ok = await confirmAction({
      title: t.deleteTitle,
      message: t.deleteMessage,
      confirmText: t.confirmDelete,
      cancelText: t.cancel,
    });
    if (!ok) return;
    const id = String(batch.id);
    const oldPayments = customerPayments;
    if (!(await setCustomerPayments(customerPayments.filter((row) => String(row.batchId || "") !== id)))) return;
    if (!(await setBatches(batches.filter((row) => String(row.id) !== id)))) {
      await setCustomerPayments(oldPayments);
      return;
    }
    notify(t.deleted, "success");
  };

  if (!customersLoaded || !batchesLoaded || !hydrated) {
    return <div className="payables-batch-page" dir={dir}><div className="payables-batch-loading">{t.loading}</div></div>;
  }

  if (!formOpen && !isEdit) {
    return (
      <div className="payables-batch-page" dir={dir}>
        <div className="payables-batch-topbar">
          <button type="button" className="payables-batch-back" onClick={() => navigate("/receivables")}><ArrowLeft size={16} />{t.back}</button>
          <button type="button" className="payables-batch-save" onClick={() => setFormOpen(true)}><Plus size={16} />{t.newPayment}</button>
        </div>
        <header className="payables-batch-header"><div className="payables-batch-heading-icon"><BadgeDollarSign size={23} /></div><div><h1>{t.historyTitle}</h1><p>{t.historySub}</p></div></header>
        <section className="payables-batch-history-card">
          <div className="payables-batch-history-wrap">
            <table>
              <thead><tr><th>{t.reference}</th><th>{t.date}</th><th>{t.customerCount}</th><th>{t.totalPayments}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td><strong>{batch.reference || batch.id}</strong></td>
                    <td>{batch.date ? formatAfghanDate(batch.date) : "—"}</td>
                    <td>{batch.payments?.length || batch.customerCount || 0}</td>
                    <td>{totalsText(batch.totals)}</td>
                    <td><div className="payables-batch-row-actions"><button type="button" title={t.edit} onClick={() => navigate(`/receivables/payments/${batch.id}/edit`)}><Pencil size={13} /></button><button type="button" title={t.print} onClick={() => navigate(`/receivables/payments/${batch.id}/print`)}><Printer size={13} /></button><button type="button" className="danger" title={t.delete} onClick={() => deleteBatch(batch)}><Trash2 size={13} /></button></div></td>
                  </tr>
                ))}
                {!batches.length && <tr><td colSpan="5" className="payables-batch-history-empty">{t.noHistory}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="payables-batch-page" dir={dir}>
      <div className="payables-batch-topbar">
        <button type="button" className="payables-batch-back" onClick={() => isEdit ? navigate("/receivables/payments/new") : setFormOpen(false)}><ArrowLeft size={16} />{t.back}</button>
        <button type="button" className="payables-batch-save top" onClick={save} disabled={saving}><CheckCircle2 size={16} />{isEdit ? t.update : t.save}</button>
      </div>

      <header className="payables-batch-header">
        <div className="payables-batch-heading-icon"><BadgeDollarSign size={23} /></div>
        <div><h1>{isEdit ? t.editTitle : t.title}</h1><p>{t.subtitle}</p></div>
      </header>

      <div className="payables-batch-layout">
        <aside className="payables-batch-sidebar">
          <section className="payables-batch-side-card">
            <div className="payables-batch-side-title"><CalendarDays size={17} /><strong>{t.date}</strong></div>
            <ShamsiDateInput value={date} onChange={(event) => setDate(event.target.value)} />
          </section>
          <section className="payables-batch-side-card">
            <div className="payables-batch-side-title"><WalletCards size={17} /><strong>{t.total}</strong></div>
            <div className="payables-batch-summary-row"><span>{t.customersPaid}</span><b>{activePayments.length}</b></div>
            {Object.entries(totals).map(([code, value]) => <div className="payables-batch-summary-row" key={code}><span>{code}</span><b>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></div>)}
            {!activePayments.length && <div className="payables-batch-zero">—</div>}
          </section>
          <p className="payables-batch-helper">{t.helper}</p>
          <button type="button" className="payables-batch-save" onClick={save} disabled={saving}><CheckCircle2 size={16} />{isEdit ? t.update : t.save}</button>
        </aside>

        <main className="payables-batch-main">
          <label className="payables-batch-search"><Search size={17} /><input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder={t.search} /></label>
          <p className="payables-batch-search-hint">{t.searchHint}</p>
          <div className="payables-batch-list">
            {filteredCustomers.map((customer, index) => {
              const id = String(customer.id);
              const entry = entries[id] || {};
              const balance = num(balanceMap.get(id));
              const state = balance > 0.0001 ? "receivable" : balance < -0.0001 ? "owe" : "settled";
              const label = state === "receivable" ? t.customerOwes : state === "owe" ? t.weOweCustomer : t.settled;
              const name = customerName(customer) || "—";
              const isSelected = selectedCustomerIds.has(id);
              return (
                <article
                  className={`payables-batch-supplier ${isSelected ? "is-selected" : ""} ${num(entry.amount) > 0 ? "has-payment" : ""}`}
                  key={id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  ref={(node) => {
                    if (node) customerRefs.current.set(id, node);
                    else customerRefs.current.delete(id);
                  }}
                  onClick={() => activateCustomer(id)}
                  onKeyDown={(event) => handleCustomerKeyDown(event, index, id)}
                >
                  <div className="payables-batch-supplier-info">
                    <span className={`payables-batch-selection-check ${isSelected ? "active" : ""}`} aria-hidden="true">{isSelected ? "✓" : ""}</span>
                    <span className="payables-batch-avatar"><UserRound size={17} /></span>
                    <div><strong>{name}</strong><small>{customer.phone || customer.alternatePhone || customer.companyName || "—"}</small></div>
                  </div>
                  <div className={`payables-batch-balance ${state}`}><span>{t.current}</span><strong>{Math.abs(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {customerCurrency(customer)}</strong><small>{label}</small></div>
                  <label className="payables-batch-field" onClick={(event) => event.stopPropagation()}><span>{t.currency}</span><div className="payables-batch-select-wrap"><Coins size={14} /><select value={entry.currency || customerCurrency(customer)} onChange={(event) => setEntry(id, { currency: event.target.value })}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></div></label>
                  <label className="payables-batch-field" onClick={(event) => event.stopPropagation()}><span>{t.amount}</span><input ref={(node) => { if (node) amountRefs.current.set(id, node); else amountRefs.current.delete(id); }} type="number" min="0" step="0.01" value={entry.amount ?? ""} onChange={(event) => setEntry(id, { amount: event.target.value })} placeholder="0.00" /></label>
                  <label className="payables-batch-field note" onClick={(event) => event.stopPropagation()}><span>{t.note}</span><input value={entry.note || ""} onChange={(event) => setEntry(id, { note: event.target.value })} onKeyDown={(event) => handleLastFieldKeyDown(event, index)} placeholder={t.notePlaceholder} /></label>
                </article>
              );
            })}
            {!filteredCustomers.length && <div className="payables-batch-empty">{search.trim() ? t.noCustomers : t.searchHint}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
