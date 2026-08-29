import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  Calculator,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import { todayDateValue } from "../utils/afghanDate";
import ShamsiDateInput from "../components/ShamsiDateInput";
import "./CashCount.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencyCodes = ["AFN", "USD", "PKR", "EUR"];
const numeric = (value) => Math.max(Number(value || 0), 0);

const denominations = {
  AFN: [1000, 500, 100, 50, 20, 10, 5, 2, 1],
  USD: [100, 50, 20, 10, 5, 1],
  PKR: [5000, 1000, 500, 100, 50, 20, 10],
  EUR: [500, 200, 100, 50, 20, 10, 5],
};

const tr = {
  en: {
    title: "Cash Count",
    subtitle: "Count physical cash by denomination and reconcile it with the system cash balance, based on the Cash Count module in Access.",
    newCount: "New Cash Count",
    currency: "Currency",
    systemBalance: "System Balance",
    physicalCash: "Physical Cash",
    difference: "Difference",
    lastCount: "Last Count",
    noCount: "No count yet",
    history: "Cash Count History",
    search: "Search date, currency or notes...",
    date: "Date",
    countedBy: "Counted By",
    status: "Status",
    actions: "Actions",
    balanced: "Balanced",
    shortage: "Shortage",
    surplus: "Surplus",
    noHistory: "No cash counts have been recorded yet.",
    formTitle: "Record Cash Count",
    editTitle: "Edit Cash Count",
    formHint: "Enter the number of notes/coins physically available. This reconciliation does not change Cash Flow automatically.",
    denomination: "Denomination",
    count: "Count",
    total: "Total",
    notes: "Notes",
    notesPlaceholder: "Optional reconciliation notes...",
    save: "Save Count",
    update: "Update Count",
    cancel: "Cancel",
    saved: "Cash count saved successfully.",
    updated: "Cash count updated successfully.",
    deleted: "Cash count deleted.",
    deleteConfirm: "Delete this cash count record?",
    required: "Please select a date and currency.",
    physicalHint: "Counted physical total",
    systemHint: "Calculated from Cash Flow",
    differenceHint: "Physical cash minus system balance",
    edit: "Edit",
    delete: "Delete",
  },
  fa: {
    title: "شمارش نقدی",
    subtitle: "پول نقد موجود را بر اساس نوت‌ها بشمارید و مطابق بخش Cash Count سیستم اکسس با بیلانس سیستم تطبیق کنید.",
    newCount: "شمارش نقدی جدید",
    currency: "اسعار",
    systemBalance: "بیلانس سیستم",
    physicalCash: "نقد فزیکی",
    difference: "تفاوت",
    lastCount: "آخرین شمارش",
    noCount: "هنوز شمارش نشده",
    history: "تاریخچه شمارش نقدی",
    search: "جستجوی تاریخ، اسعار یا ملاحظات...",
    date: "تاریخ",
    countedBy: "شمارش توسط",
    status: "حالت",
    actions: "عملیات",
    balanced: "مطابق",
    shortage: "کسری",
    surplus: "اضافی",
    noHistory: "هنوز شمارش نقدی ثبت نشده است.",
    formTitle: "ثبت شمارش نقدی",
    editTitle: "ویرایش شمارش نقدی",
    formHint: "تعداد نوت‌ها/سکه‌های موجود را وارد کنید. این تطبیق Cash Flow را به‌صورت خودکار تغییر نمی‌دهد.",
    denomination: "ارزش نوت",
    count: "تعداد",
    total: "جمله",
    notes: "ملاحظات",
    notesPlaceholder: "ملاحظات اختیاری تطبیق نقدی...",
    save: "ذخیره شمارش",
    update: "آپدیت شمارش",
    cancel: "لغو",
    saved: "شمارش نقدی با موفقیت ثبت شد.",
    updated: "شمارش نقدی با موفقیت ویرایش شد.",
    deleted: "ریکارد شمارش نقدی حذف شد.",
    deleteConfirm: "این ریکارد شمارش نقدی حذف شود؟",
    required: "تاریخ و اسعار را انتخاب کنید.",
    physicalHint: "مجموع نقد فزیکی شمارش‌شده",
    systemHint: "محاسبه‌شده از جریان نقدی",
    differenceHint: "نقد فزیکی منهای بیلانس سیستم",
    edit: "ویرایش",
    delete: "حذف",
  },
  ps: {
    title: "د نغدو شمېرنه",
    subtitle: "فزیکي نغدې د نوټونو له مخې وشمېرئ او د Access د Cash Count برخې مطابق یې د سیسټم له بیلانس سره پرتله کړئ.",
    newCount: "نوې نغدي شمېرنه",
    currency: "اسعار",
    systemBalance: "د سیسټم بیلانس",
    physicalCash: "فزیکي نغدې",
    difference: "توپیر",
    lastCount: "وروستۍ شمېرنه",
    noCount: "تر اوسه نه دي شمېرل شوي",
    history: "د نغدو شمېرنې تاریخچه",
    search: "د نېټې، اسعارو یا یادښت لټون...",
    date: "نېټه",
    countedBy: "شمېرونکی",
    status: "حالت",
    actions: "عملیات",
    balanced: "برابر",
    shortage: "کمښت",
    surplus: "اضافي",
    noHistory: "تر اوسه د نغدو شمېرنه نه ده ثبت شوې.",
    formTitle: "د نغدو شمېرنه ثبتول",
    editTitle: "د نغدو شمېرنه سمول",
    formHint: "د موجودو نوټونو/سکو شمېر ولیکئ. دا تطبیق Cash Flow په اوتومات ډول نه بدلوي.",
    denomination: "د نوټ ارزښت",
    count: "شمېر",
    total: "ټول",
    notes: "یادښتونه",
    notesPlaceholder: "د نغدو د تطبیق اختیاري یادښت...",
    save: "شمېرنه ثبت کړئ",
    update: "شمېرنه اپډېټ کړئ",
    cancel: "لغوه",
    saved: "د نغدو شمېرنه ثبت شوه.",
    updated: "د نغدو شمېرنه اپډېټ شوه.",
    deleted: "د نغدو شمېرنې ریکارډ حذف شو.",
    deleteConfirm: "دا د نغدو شمېرنې ریکارډ حذف شي؟",
    required: "نېټه او اسعار وټاکئ.",
    physicalHint: "ټولې فزیکي شمېرل شوې نغدې",
    systemHint: "له نغدي جریان څخه محاسبه شوی",
    differenceHint: "فزیکي نغدې منفي د سیسټم بیلانس",
    edit: "سمول",
    delete: "حذف",
  },
};

const normalizeCurrency = (value, fallback = "AFN") => {
  const code = String(value || fallback).toUpperCase();
  return currencyCodes.includes(code) ? code : fallback;
};

const makeBreakdown = (currency, existing = []) => {
  const current = new Map((existing || []).map((item) => [Number(item.value), Number(item.count || 0)]));
  return (denominations[currency] || []).map((value) => ({ value, count: current.get(value) || 0 }));
};

export default function CashCount() {
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
  const [settings] = useJsonCollection("settings");
  const [bankAccounts] = useJsonCollection("bankAccounts");
  const [bankTransactions] = useJsonCollection("bankTransactions");
  const [manualEntries] = useJsonCollection("cashTransactions");
  const [counts, setCounts] = useJsonCollection("cashCounts");
  const [accounts] = useJsonCollection("accounts");

  const [activeCurrency, setActiveCurrency] = useState("AFN");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ date: todayDateValue(), currency: "AFN", notes: "", breakdown: makeBreakdown("AFN") });

  const currentSettings = settings[0] || {};
  const defaultCurrency = normalizeCurrency(currentSettings.currency || "AFN");
  const decimalsMap = currentSettings.currencyDecimals || {};

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
    document.body.classList.toggle("cash-count-modal-open", showModal);
    return () => document.body.classList.remove("cash-count-modal-open");
  }, [showModal]);

  const customerMap = useMemo(() => new Map(customers.map((item) => [String(item.id), item])), [customers]);
  const supplierMap = useMemo(() => new Map(suppliers.map((item) => [String(item.id), item])), [suppliers]);
  const bankMap = useMemo(() => new Map(bankAccounts.map((item) => [String(item.id), item])), [bankAccounts]);

  const cashRows = useMemo(() => {
    const rows = [];
    sales.forEach((sale) => {
      const amount = numeric(sale.paidAmount);
      if (!amount) return;
      const customer = customerMap.get(String(sale.customerId));
      rows.push({ direction: "in", currency: normalizeCurrency(sale.currency || customer?.currency, defaultCurrency), amount });
    });
    customerPayments.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount) return;
      const customer = customerMap.get(String(item.customerId));
      rows.push({ direction: "in", currency: normalizeCurrency(item.currency || customer?.currency, defaultCurrency), amount });
    });
    purchases.forEach((purchase) => {
      const amount = numeric(purchase.paidAmount);
      if (!amount) return;
      const supplier = supplierMap.get(String(purchase.supplierId));
      rows.push({ direction: "out", currency: normalizeCurrency(purchase.currency || supplier?.currency, defaultCurrency), amount });
    });
    supplierPayments.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount) return;
      const supplier = supplierMap.get(String(item.supplierId));
      rows.push({ direction: "out", currency: normalizeCurrency(item.currency || supplier?.currency, defaultCurrency), amount });
    });
    expenses.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount || item.paymentMethod === "credit") return;
      rows.push({ direction: "out", currency: normalizeCurrency(item.currency, defaultCurrency), amount });
    });
    bankTransactions.forEach((item) => {
      const bank = bankMap.get(String(item.bankId));
      const amount = numeric(item.amount);
      if (!bank || !amount) return;
      rows.push({ direction: item.type === "deposit" ? "out" : "in", currency: normalizeCurrency(item.currency || bank.currency, defaultCurrency), amount });
    });
    manualEntries.forEach((item) => {
      const amount = numeric(item.amount);
      if (!amount) return;
      rows.push({ direction: item.direction === "out" ? "out" : "in", currency: normalizeCurrency(item.currency, defaultCurrency), amount });
    });
    return rows;
  }, [sales, purchases, customerPayments, supplierPayments, expenses, bankTransactions, manualEntries, customerMap, supplierMap, bankMap, defaultCurrency]);

  const systemBalanceFor = (currency) => cashRows
    .filter((row) => row.currency === currency)
    .reduce((sum, row) => sum + (row.direction === "in" ? numeric(row.amount) : -numeric(row.amount)), 0);

  const money = (value, currency) => {
    const digits = Math.max(0, Math.min(6, Number(decimalsMap?.[currency] ?? 2)));
    return `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
  };

  const physicalTotal = useMemo(() => form.breakdown.reduce((sum, item) => sum + numeric(item.value) * numeric(item.count), 0), [form.breakdown]);
  const formSystemBalance = systemBalanceFor(form.currency);
  const formDifference = physicalTotal - formSystemBalance;

  const latestByCurrency = useMemo(() => {
    const map = new Map();
    [...counts]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .forEach((item) => {
        if (!map.has(item.currency)) map.set(item.currency, item);
      });
    return map;
  }, [counts]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...counts]
      .filter((item) => activeCurrency === "ALL" || item.currency === activeCurrency)
      .filter((item) => !q || `${item.date || ""} ${item.currency || ""} ${item.notes || ""} ${item.countedBy || ""}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [counts, activeCurrency, query]);

  const statusFor = (difference) => {
    const value = Number(difference || 0);
    if (Math.abs(value) < 0.000001) return { key: "balanced", label: t.balanced };
    return value < 0 ? { key: "shortage", label: t.shortage } : { key: "surplus", label: t.surplus };
  };

  const openCreate = (currency = activeCurrency === "ALL" ? "AFN" : activeCurrency) => {
    setEditingId(null);
    setForm({ date: todayDateValue(), currency, notes: "", breakdown: makeBreakdown(currency) });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      date: item.date || todayDateValue(),
      currency: item.currency || "AFN",
      notes: item.notes || "",
      breakdown: makeBreakdown(item.currency || "AFN", item.breakdown || []),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const changeCurrency = (currency) => {
    setForm((current) => ({ ...current, currency, breakdown: makeBreakdown(currency) }));
  };

  const updateCount = (value, count) => {
    setForm((current) => ({
      ...current,
      breakdown: current.breakdown.map((item) => item.value === value ? { ...item, count: Math.max(0, Number(count || 0)) } : item),
    }));
  };

  const saveCount = async (event) => {
    event.preventDefault();
    if (!form.date || !form.currency) return notify(t.required, "warning");
    const now = new Date().toISOString();
    const systemBalance = systemBalanceFor(form.currency);
    const total = form.breakdown.reduce((sum, item) => sum + numeric(item.value) * numeric(item.count), 0);
    const sessionId = localStorage.getItem("isp-system-session") || localStorage.getItem("apg-production-isp-system-session") || localStorage.getItem("apg-demo-isp-system-session");
    const account = accounts.find((item) => String(item.id) === String(sessionId));
    const record = {
      date: form.date,
      currency: form.currency,
      breakdown: form.breakdown.map((item) => ({ value: Number(item.value), count: Number(item.count || 0), total: Number(item.value) * Number(item.count || 0) })),
      physicalTotal: total,
      systemBalance,
      difference: total - systemBalance,
      notes: form.notes.trim(),
      countedBy: account?.fullName || account?.email || "—",
      updatedAt: now,
    };
    if (editingId) {
      await setCounts(counts.map((item) => item.id === editingId ? { ...item, ...record } : item));
      notify(t.updated, "success", { silent: true });
    } else {
      await setCounts([{ id: `cash-count-${Date.now()}`, ...record, createdAt: now }, ...counts]);
      notify(t.saved, "success", { silent: true });
    }
    setActiveCurrency(form.currency);
    closeModal();
  };

  const removeCount = async (item) => {
    if (!(await confirmAction(t.deleteConfirm))) return;
    await setCounts(counts.filter((row) => row.id !== item.id));
    notify(t.deleted, "success");
  };

  return (
    <div className="cash-count-page" dir={direction}>
      <header className="cash-count-header">
        <div><span className="cash-count-kicker"><Banknote size={15} /> Cash Control</span><h1>{t.title}</h1><p>{t.subtitle}</p></div>
        <button type="button" className="cash-count-primary" onClick={() => openCreate()}><Plus size={18} />{t.newCount}</button>
      </header>

      <section className="cash-count-currency-grid">
        {currencyCodes.map((currency) => {
          const latest = latestByCurrency.get(currency);
          const system = systemBalanceFor(currency);
          const diff = latest ? Number(latest.difference || 0) : 0;
          const status = statusFor(diff);
          return (
            <button type="button" className={`cash-count-currency-card ${activeCurrency === currency ? "active" : ""}`} key={currency} onClick={() => setActiveCurrency(currency)}>
              <div className="cash-count-currency-head"><span>{currency}</span><Wallet size={18} /></div>
              <div className="cash-count-metric"><small>{t.systemBalance}</small><strong>{money(system, currency)}</strong></div>
              <div className="cash-count-card-bottom">
                <span><small>{t.lastCount}</small><b>{latest ? money(latest.physicalTotal, currency) : t.noCount}</b></span>
                <span className={`cash-count-status ${status.key}`}>{latest ? status.label : "—"}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="cash-count-panel">
        <div className="cash-count-panel-head">
          <div><h2>{t.history}</h2><p>{activeCurrency === "ALL" ? t.currency : `${activeCurrency} · ${money(systemBalanceFor(activeCurrency), activeCurrency)}`}</p></div>
          <div className="cash-count-tools">
            <div className="cash-count-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></div>
            <select value={activeCurrency} onChange={(event) => setActiveCurrency(event.target.value)}><option value="ALL">All</option>{currencyCodes.map((code) => <option key={code}>{code}</option>)}</select>
          </div>
        </div>
        <div className="cash-count-table-wrap">
          <table>
            <thead><tr><th>{t.date}</th><th>{t.currency}</th><th>{t.systemBalance}</th><th>{t.physicalCash}</th><th>{t.difference}</th><th>{t.status}</th><th>{t.countedBy}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {!visibleRows.length ? <tr><td colSpan="8" className="cash-count-empty">{t.noHistory}</td></tr> : visibleRows.map((item) => {
                const status = statusFor(item.difference);
                return <tr key={item.id}>
                  <td>{item.date || "—"}</td><td><b>{item.currency}</b></td><td>{money(item.systemBalance, item.currency)}</td><td>{money(item.physicalTotal, item.currency)}</td>
                  <td className={`cash-count-difference ${status.key}`}>{Number(item.difference || 0) > 0 ? "+" : ""}{money(item.difference, item.currency)}</td>
                  <td><span className={`cash-count-status ${status.key}`}>{status.label}</span></td><td>{item.countedBy || "—"}</td>
                  <td><div className="cash-count-actions"><button onClick={() => openEdit(item)} title={t.edit}><Edit3 size={15} /></button><button className="danger" onClick={() => removeCount(item)} title={t.delete}><Trash2 size={15} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && createPortal(
        <div className="cash-count-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form className="cash-count-modal" onSubmit={saveCount}>
            <header className="cash-count-modal-head"><div><h2><Calculator size={20} />{editingId ? t.editTitle : t.formTitle}</h2><p>{t.formHint}</p></div><button type="button" onClick={closeModal}><X size={19} /></button></header>
            <div className="cash-count-modal-body">
              <div className="cash-count-form-top">
                <label><span>{t.date}</span><ShamsiDateInput value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} /></label>
                <label><span>{t.currency}</span><select value={form.currency} onChange={(event) => changeCurrency(event.target.value)}>{currencyCodes.map((code) => <option key={code}>{code}</option>)}</select></label>
              </div>

              <div className="cash-count-reconcile-grid">
                <div><small>{t.systemBalance}</small><strong>{money(formSystemBalance, form.currency)}</strong><span>{t.systemHint}</span></div>
                <div><small>{t.physicalCash}</small><strong>{money(physicalTotal, form.currency)}</strong><span>{t.physicalHint}</span></div>
                <div className={statusFor(formDifference).key}><small>{t.difference}</small><strong>{formDifference > 0 ? "+" : ""}{money(formDifference, form.currency)}</strong><span>{t.differenceHint}</span></div>
              </div>

              <div className="cash-count-denominations">
                <div className="cash-count-denomination-head"><span>{t.denomination}</span><span>{t.count}</span><span>{t.total}</span></div>
                {form.breakdown.map((item) => <div className="cash-count-denomination-row" key={item.value}>
                  <strong>{item.value.toLocaleString()} {form.currency}</strong>
                  <input type="number" min="0" step="1" value={item.count || ""} onChange={(event) => updateCount(item.value, event.target.value)} placeholder="0" />
                  <b>{money(item.value * numeric(item.count), form.currency)}</b>
                </div>)}
              </div>

              <label className="cash-count-notes"><span>{t.notes}</span><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder={t.notesPlaceholder} /></label>
            </div>
            <footer className="cash-count-modal-footer"><button type="button" className="cash-count-secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className="cash-count-primary"><CheckCircle2 size={17} />{editingId ? t.update : t.save}</button></footer>
          </form>
        </div>, document.body)}
    </div>
  );
}
