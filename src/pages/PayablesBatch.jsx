import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Coins,
  Search,
  Truck,
  WalletCards,
  Plus,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import ShamsiDateInput from "../components/ShamsiDateInput";
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
    title: "Pay Payables",
    editTitle: "Edit Payables Payment",
    subtitle: "Pay multiple suppliers from one fast form.",
    back: "Back to Payables",
    date: "Payment Date",
    search: "Search supplier or phone...",
    supplier: "Supplier",
    current: "Current Balance",
    owesUs: "Supplier owes us",
    settled: "Settled",
    weOwe: "We owe",
    currency: "Currency",
    amount: "Payment Amount",
    note: "Note",
    notePlaceholder: "Optional note...",
    total: "Payment Summary",
    suppliersPaid: "Suppliers Paid",
    save: "Save All Payments",
    update: "Save Changes",
    required: "Enter a payment amount for at least one supplier.",
    saved: "Payables payment saved successfully.",
    updated: "Payables payment updated successfully.",
    loading: "Preparing suppliers...",
    noSuppliers: "No suppliers found.",
    helper: "You may also pay a supplier with no payable balance. The extra payment will make the supplier owe you.",
    historyTitle:"Payables Payment Records", historySub:"Grouped supplier payments are listed here.", newPayment:"New Payables Payment", reference:"Reference", supplierCount:"Suppliers", totalPayments:"Total Payments", actions:"Actions", edit:"Edit", print:"Print", delete:"Delete", noHistory:"No payables payment records yet.", deleteTitle:"Delete this payment record?", deleteMessage:"All supplier ledger payments created by this grouped payment will also be removed.", cancel:"Cancel", confirmDelete:"Delete", deleted:"Payables payment deleted.", searchHint:"Search to add suppliers. Selected suppliers remain visible.",
  },
  fa: {
    title: "پرداخت تادیات",
    editTitle: "ایدیت پرداخت تادیات",
    subtitle: "به چندین تأمین‌کننده در یک فورم و به‌صورت سریع پرداخت کنید.",
    back: "برگشت به تادیات",
    date: "تاریخ پرداخت",
    search: "جستجوی تأمین‌کننده یا شماره تماس...",
    supplier: "تأمین‌کننده",
    current: "بیلانس فعلی",
    owesUs: "تأمین‌کننده از ما قرضدار است",
    settled: "حساب تصفیه است",
    weOwe: "ما قرضدار هستیم",
    currency: "واحد پول",
    amount: "مبلغ پرداخت",
    note: "یادداشت",
    notePlaceholder: "یادداشت اختیاری...",
    total: "خلاصه پرداخت",
    suppliersPaid: "تأمین‌کننده پرداخت‌شده",
    save: "ثبت تمام پرداخت‌ها",
    update: "ذخیره تغییرات",
    required: "برای حداقل یک تأمین‌کننده مبلغ پرداخت وارد کنید.",
    saved: "پرداخت تادیات موفقانه ثبت شد.",
    updated: "پرداخت تادیات موفقانه ویرایش شد.",
    loading: "در حال آماده‌سازی تأمین‌کننده‌ها...",
    noSuppliers: "تأمین‌کننده‌ای پیدا نشد.",
    helper: "حتی اگر تأمین‌کننده از ما طلب نداشته باشد می‌توانید پرداخت کنید؛ مبلغ اضافه باعث می‌شود تأمین‌کننده از ما قرضدار شود.",
    historyTitle:"ریکاردهای پرداخت تادیات", historySub:"پرداخت‌های گروهی تأمین‌کننده‌ها در اینجا لیست می‌شوند.", newPayment:"پرداخت تادیات", reference:"مرجع", supplierCount:"تأمین‌کننده‌ها", totalPayments:"مجموع پرداخت", actions:"عملیات", edit:"ایدیت", print:"پرنت", delete:"حذف", noHistory:"هنوز ریکارد پرداخت تادیات ثبت نشده است.", deleteTitle:"این ریکارد پرداخت حذف شود؟", deleteMessage:"تمام پرداخت‌های ساخته‌شده در لیجر تأمین‌کننده‌ها نیز حذف می‌شوند.", cancel:"لغو", confirmDelete:"حذف", deleted:"ریکارد پرداخت تادیات حذف شد.", searchHint:"برای اضافه کردن تأمین‌کننده جستجو کنید. تأمین‌کننده‌های انتخاب‌شده باقی می‌مانند.",
  },
  ps: {
    title: "د تادیاتو ورکړه",
    editTitle: "د تادیاتو د ورکړې سمون",
    subtitle: "په یوه چټک فورم کې څو عرضه کوونکو ته پیسې ورکړئ.",
    back: "تادیاتو ته بېرته",
    date: "د ورکړې نېټه",
    search: "عرضه کوونکی یا د اړیکې شمېره ولټوئ...",
    supplier: "عرضه کوونکی",
    current: "اوسنی بیلانس",
    owesUs: "عرضه کوونکی موږ ته پوروړی دی",
    settled: "حساب تصفیه دی",
    weOwe: "موږ پوروړي یو",
    currency: "اسعار",
    amount: "د ورکړې مبلغ",
    note: "یادښت",
    notePlaceholder: "اختیاري یادښت...",
    total: "د ورکړې لنډیز",
    suppliersPaid: "ورکړه شوي عرضه کوونکي",
    save: "ټولې ورکړې ثبت کړئ",
    update: "بدلونونه خوندي کړئ",
    required: "لږ تر لږه یوه عرضه کوونکي ته د ورکړې مبلغ ولیکئ.",
    saved: "د تادیاتو ورکړه په بریالیتوب ثبت شوه.",
    updated: "د تادیاتو ورکړه په بریالیتوب اصلاح شوه.",
    loading: "عرضه کوونکي چمتو کېږي...",
    noSuppliers: "هیڅ عرضه کوونکی ونه موندل شو.",
    helper: "که عرضه کوونکی له موږ څخه طلب هم ونه لري، بیا هم پیسې ورکولی شئ؛ اضافه مبلغ به هغه زموږ پوروړی کړي.",
    historyTitle:"د تادیاتو د ورکړې ریکارډونه", historySub:"ډله‌ییزې ورکړې دلته ښودل کېږي.", newPayment:"د تادیاتو ورکړه", reference:"مرجع", supplierCount:"عرضه کوونکي", totalPayments:"ټولې ورکړې", actions:"عملیات", edit:"سمون", print:"چاپ", delete:"حذف", noHistory:"تر اوسه د تادیاتو ریکارډ نشته.", deleteTitle:"دا د ورکړې ریکارډ حذف شي؟", deleteMessage:"د عرضه کوونکو په لیجر کې اړوند ټولې ورکړې هم حذف کېږي.", cancel:"لغوه", confirmDelete:"حذف", deleted:"د تادیاتو ریکارډ حذف شو.", searchHint:"د عرضه کوونکي د زیاتولو لپاره لټون وکړئ. ټاکل شوي عرضه کوونکي به ښکاره پاتې شي.",
  },
};

function supplierCurrency(supplier) {
  const raw = String(supplier?.currency || supplier?.currencyCode || "AFN").toUpperCase();
  return currencies.find((code) => raw.includes(code)) || "AFN";
}

export default function PayablesBatch() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const isEdit = Boolean(batchId);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");
  const [suppliers, , , suppliersLoaded] = useJsonCollection("suppliers");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [supplierPayments, setSupplierPayments] = useJsonCollection("supplierPayments");
  const [batches, setBatches, , batchesLoaded] = useJsonCollection("supplierPaymentBatches");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState({});
  const [selectedSupplierIds, setSelectedSupplierIds] = useState(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(isEdit);
  const searchRef = useRef(null);
  const supplierRefs = useRef(new Map());
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
    suppliers.forEach((supplier) => {
      const id = String(supplier.id);
      const totalPurchased = purchases
        .filter((row) => String(row.supplierId) === id)
        .reduce((sum, row) => sum + num(row.totalAmount), 0);
      const paidAtPurchase = purchases
        .filter((row) => String(row.supplierId) === id)
        .reduce((sum, row) => sum + num(row.paidAmount), 0);
      const returned = purchaseReturns
        .filter((row) => String(row.supplierId) === id)
        .reduce((sum, row) => sum + num(row.totalAmount), 0);
      const laterPaid = supplierPayments
        .filter((row) => String(row.supplierId) === id && (!isEdit || String(row.batchId || "") !== String(batchId)))
        .reduce((sum, row) => sum + num(row.amount), 0);
      map.set(id, num(supplier.openingBalance) + totalPurchased - paidAtPurchase - returned - laterPaid);
    });
    return map;
  }, [suppliers, purchases, purchaseReturns, supplierPayments, isEdit, batchId]);

  useEffect(() => {
    if (!suppliersLoaded || !batchesLoaded || hydrated) return;
    const batch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
    if (isEdit && !batch) {
      notify("Payment batch not found.", "error");
      navigate("/payables", { replace: true });
      return;
    }
    const initial = {};
    suppliers.forEach((supplier) => {
      const old = batch?.payments?.find((row) => String(row.supplierId) === String(supplier.id));
      initial[String(supplier.id)] = {
        amount: old?.amount ?? "",
        currency: old?.currency || supplierCurrency(supplier),
        note: old?.note || old?.description || "",
      };
    });
    setEntries(initial);
    if (batch?.payments?.length) {
      setSelectedSupplierIds(new Set(batch.payments.map((row) => String(row.supplierId))));
    }
    if (batch?.date) setDate(batch.date);
    setHydrated(true);
  }, [suppliersLoaded, batchesLoaded, hydrated, isEdit, batches, batchId, suppliers, navigate]);

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers.filter((supplier) => selectedSupplierIds.has(String(supplier.id)));
    return suppliers.filter((supplier) => selectedSupplierIds.has(String(supplier.id)) ||
      [supplier.supplierName, supplier.name, supplier.contactPerson, supplier.phone, supplier.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [suppliers, search, selectedSupplierIds]);

  const activePayments = useMemo(() => suppliers
    .filter((supplier) => selectedSupplierIds.has(String(supplier.id)))
    .map((supplier) => {
      const entry = entries[String(supplier.id)] || {};
      const amount = Math.max(num(entry.amount), 0);
      if (!amount) return null;
      return {
        supplierId: supplier.id,
        supplierName: supplier.supplierName || supplier.name || "",
        phone: supplier.phone || supplier.phoneNumber || "",
        amount,
        currency: entry.currency || supplierCurrency(supplier),
        note: String(entry.note || "").trim(),
        previousBalance: num(balanceMap.get(String(supplier.id))),
      };
    })
    .filter(Boolean), [suppliers, entries, balanceMap, selectedSupplierIds]);

  const totals = useMemo(() => {
    const result = {};
    activePayments.forEach((row) => { result[row.currency] = (result[row.currency] || 0) + row.amount; });
    return result;
  }, [activePayments]);

  const setEntry = (supplierId, patch) => {
    const id = String(supplierId);
    setEntries((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const toggleSupplierSelection = (supplierId) => {
    const id = String(supplierId);
    setSelectedSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusSupplier = (index) => {
    if (!filteredSuppliers.length) return;
    const nextIndex = Math.max(0, Math.min(index, filteredSuppliers.length - 1));
    supplierRefs.current.get(String(filteredSuppliers[nextIndex].id))?.focus();
  };

  const focusSupplierAmount = (supplierId) => {
    window.setTimeout(() => {
      const input = amountRefs.current.get(String(supplierId));
      input?.focus();
      input?.select?.();
    }, 0);
  };

  const activateSupplier = (supplierId) => {
    const id = String(supplierId);
    const wasSelected = selectedSupplierIds.has(id);
    toggleSupplierSelection(id);
    if (!wasSelected) {
      setSearch("");
      focusSupplierAmount(id);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusSupplier(0);
    } else if (event.key === "Enter" && filteredSuppliers.length) {
      event.preventDefault();
      activateSupplier(filteredSuppliers[0].id);
    }
  };

  const handleSupplierKeyDown = (event, index, supplierId) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      focusSupplier(index + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusSupplier(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusSupplier(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusSupplier(filteredSuppliers.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateSupplier(supplierId);
    }
  };

  const handleLastFieldKeyDown = (event, index) => {
    if (event.key === "Tab" && !event.shiftKey && index === filteredSuppliers.length - 1) {
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
      const id = isEdit ? String(batchId) : `SPB-${Date.now()}`;
      const oldBatch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
      const paymentRows = activePayments.map((row, index) => ({
        id: isEdit
          ? (oldBatch?.payments?.find((old) => String(old.supplierId) === String(row.supplierId))?.paymentId || `SPAY-${Date.now()}-${index}`)
          : `SPAY-${Date.now()}-${index}`,
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        amount: row.amount,
        currency: row.currency,
        note: row.note,
      }));
      const batch = {
        id,
        reference: oldBatch?.reference || `PB-${String(Date.now()).slice(-8)}`,
        date: date || today(),
        payments: paymentRows.map((row) => ({ ...row, paymentId: row.id })),
        supplierCount: paymentRows.length,
        totals,
        createdAt: oldBatch?.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      };
      const basePayments = supplierPayments.filter((row) => String(row.batchId || "") !== id);
      const nextPayments = paymentRows.map((row) => ({
        id: row.id,
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        date: batch.date,
        amount: row.amount,
        currency: row.currency,
        description: row.note || (language === "fa" ? "پرداخت تادیات" : language === "ps" ? "د تادیاتو ورکړه" : "Payables payment"),
        reference: batch.reference,
        batchId: id,
        createdAt: oldBatch?.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
      }));
      const paymentsSaved = await setSupplierPayments([...nextPayments, ...basePayments]);
      if (!paymentsSaved) return;
      const batchesSaved = await setBatches(isEdit
        ? batches.map((row) => String(row.id) === id ? batch : row)
        : [batch, ...batches]);
      if (!batchesSaved) {
        await setSupplierPayments(supplierPayments);
        return;
      }
      notify(isEdit ? t.updated : t.saved, "success");
      if (isEdit) navigate("/payables/payments/new", { replace: true });
      else { setSearch(""); setEntries({}); setSelectedSupplierIds(new Set()); setFormOpen(false); }
    } finally {
      setSaving(false);
    }
  };

  const totalsText = (batchTotals) => Object.entries(batchTotals || {}).filter(([,value]) => num(value)>0).map(([code,value]) => `${code} ${num(value).toLocaleString(undefined,{maximumFractionDigits:2})}`).join(" · ") || "—";

  const deleteBatch = async (batch) => {
    const ok = await confirmAction({title:t.deleteTitle,message:t.deleteMessage,confirmText:t.confirmDelete,cancelText:t.cancel});
    if (!ok) return;
    const id=String(batch.id);
    const oldPayments=supplierPayments;
    if (!(await setSupplierPayments(supplierPayments.filter((row)=>String(row.batchId||"")!==id)))) return;
    if (!(await setBatches(batches.filter((row)=>String(row.id)!==id)))) { await setSupplierPayments(oldPayments); return; }
    notify(t.deleted,"success");
  };

  if (!suppliersLoaded || !batchesLoaded || !hydrated) {
    return <div className="payables-batch-page" dir={dir}><div className="payables-batch-loading">{t.loading}</div></div>;
  }

  if (!formOpen && !isEdit) {
    return <div className="payables-batch-page" dir={dir}>
      <div className="payables-batch-topbar">
        <button type="button" className="payables-batch-back" onClick={()=>navigate("/payables")}><ArrowLeft size={16}/>{t.back}</button>
        <button type="button" className="payables-batch-save" onClick={()=>setFormOpen(true)}><Plus size={16}/>{t.newPayment}</button>
      </div>
      <header className="payables-batch-header"><div className="payables-batch-heading-icon"><BadgeDollarSign size={23}/></div><div><h1>{t.historyTitle}</h1><p>{t.historySub}</p></div></header>
      <section className="payables-batch-history-card">
        <div className="payables-batch-history-wrap"><table><thead><tr><th>{t.reference}</th><th>{t.date}</th><th>{t.supplierCount}</th><th>{t.totalPayments}</th><th>{t.actions}</th></tr></thead><tbody>
          {batches.map((batch)=><tr key={batch.id}><td><strong>{batch.reference||batch.id}</strong></td><td>{batch.date?formatAfghanDate(batch.date):"—"}</td><td>{batch.payments?.length||batch.supplierCount||0}</td><td>{totalsText(batch.totals)}</td><td><div className="payables-batch-row-actions"><button title={t.edit} onClick={()=>navigate(`/payables/payments/${batch.id}/edit`)}><Pencil size={13}/></button><button title={t.print} onClick={()=>navigate(`/payables/payments/${batch.id}/print`)}><Printer size={13}/></button><button className="danger" title={t.delete} onClick={()=>deleteBatch(batch)}><Trash2 size={13}/></button></div></td></tr>)}
          {!batches.length&&<tr><td colSpan="5" className="payables-batch-history-empty">{t.noHistory}</td></tr>}
        </tbody></table></div>
      </section>
    </div>;
  }

  return (
    <div className="payables-batch-page" dir={dir}>
      <div className="payables-batch-topbar">
        <button type="button" className="payables-batch-back" onClick={() => isEdit ? navigate("/payables/payments/new") : setFormOpen(false)}><ArrowLeft size={16}/>{t.back}</button>
        <button type="button" className="payables-batch-save top" onClick={save} disabled={saving}><CheckCircle2 size={16}/>{isEdit ? t.update : t.save}</button>
      </div>

      <header className="payables-batch-header">
        <div className="payables-batch-heading-icon"><BadgeDollarSign size={23}/></div>
        <div><h1>{isEdit ? t.editTitle : t.title}</h1><p>{t.subtitle}</p></div>
      </header>

      <div className="payables-batch-layout">
        <aside className="payables-batch-sidebar">
          <section className="payables-batch-side-card">
            <div className="payables-batch-side-title"><CalendarDays size={17}/><strong>{t.date}</strong></div>
            <ShamsiDateInput value={date} onChange={(e)=>setDate(e.target.value)} />
          </section>
          <section className="payables-batch-side-card">
            <div className="payables-batch-side-title"><WalletCards size={17}/><strong>{t.total}</strong></div>
            <div className="payables-batch-summary-row"><span>{t.suppliersPaid}</span><b>{activePayments.length}</b></div>
            {Object.entries(totals).map(([code, value]) => <div className="payables-batch-summary-row" key={code}><span>{code}</span><b>{value.toLocaleString(undefined,{maximumFractionDigits:2})}</b></div>)}
            {!activePayments.length && <div className="payables-batch-zero">—</div>}
          </section>
          <p className="payables-batch-helper">{t.helper}</p>
          <button type="button" className="payables-batch-save" onClick={save} disabled={saving}><CheckCircle2 size={16}/>{isEdit ? t.update : t.save}</button>
        </aside>

        <main className="payables-batch-main">
          <label className="payables-batch-search"><Search size={17}/><input ref={searchRef} value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={t.search}/></label><p className="payables-batch-search-hint">{t.searchHint}</p>
          <div className="payables-batch-list">
            {filteredSuppliers.map((supplier, index) => {
              const id = String(supplier.id);
              const entry = entries[id] || {};
              const balance = num(balanceMap.get(id));
              const state = balance > 0.0001 ? "owe" : balance < -0.0001 ? "receivable" : "settled";
              const label = state === "owe" ? t.weOwe : state === "receivable" ? t.owesUs : t.settled;
              const name = supplier.supplierName || supplier.name || "—";
              const isSelected = selectedSupplierIds.has(id);
              return <article
                className={`payables-batch-supplier ${isSelected ? "is-selected" : ""} ${num(entry.amount)>0 ? "has-payment" : ""}`}
                key={id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                ref={(node) => {
                  if (node) supplierRefs.current.set(id, node);
                  else supplierRefs.current.delete(id);
                }}
                onClick={() => activateSupplier(id)}
                onKeyDown={(e) => handleSupplierKeyDown(e, index, id)}
              >
                <div className="payables-batch-supplier-info">
                  <span className={`payables-batch-selection-check ${isSelected ? "active" : ""}`} aria-hidden="true">{isSelected ? "✓" : ""}</span>
                  <span className="payables-batch-avatar"><Truck size={17}/></span>
                  <div><strong>{name}</strong><small>{supplier.phone || supplier.phoneNumber || supplier.contactPerson || "—"}</small></div>
                </div>
                <div className={`payables-batch-balance ${state}`}><span>{t.current}</span><strong>{Math.abs(balance).toLocaleString(undefined,{maximumFractionDigits:2})} {supplierCurrency(supplier)}</strong><small>{label}</small></div>
                <label className="payables-batch-field" onClick={(e)=>e.stopPropagation()}><span>{t.currency}</span><div className="payables-batch-select-wrap"><Coins size={14}/><select value={entry.currency || supplierCurrency(supplier)} onChange={(e)=>setEntry(id,{currency:e.target.value})}>{currencies.map(code=><option key={code} value={code}>{code}</option>)}</select></div></label>
                <label className="payables-batch-field" onClick={(e)=>e.stopPropagation()}><span>{t.amount}</span><input ref={(node) => { if (node) amountRefs.current.set(id, node); else amountRefs.current.delete(id); }} type="number" min="0" step="0.01" value={entry.amount ?? ""} onChange={(e)=>setEntry(id,{amount:e.target.value})} placeholder="0.00"/></label>
                <label className="payables-batch-field note" onClick={(e)=>e.stopPropagation()}><span>{t.note}</span><input value={entry.note || ""} onChange={(e)=>setEntry(id,{note:e.target.value})} onKeyDown={(e)=>handleLastFieldKeyDown(e, index)} placeholder={t.notePlaceholder}/></label>
              </article>;
            })}
            {!filteredSuppliers.length && <div className="payables-batch-empty">{search.trim()?t.noSuppliers:t.searchHint}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
