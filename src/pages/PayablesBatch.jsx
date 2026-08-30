import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { notify } from "../utils/notify";
import "./PayablesBatch.css";

const languageKey = "afghan-power-language";
const num = (value) => Number(value || 0) || 0;
const today = () => new Date().toISOString().slice(0, 10);

const translations = {
  en: {
    title: "Pay Payables",
    editTitle: "Edit Payables Payment",
    subtitle: "Search suppliers, add them to the payment list, enter amounts, and save.",
    back: "Back to Payables",
    date: "Payment Date",
    supplierPayments: "Supplier Payments",
    search: "Search supplier by name, phone or contact person...",
    searchHint: "Search and select suppliers to add them below.",
    supplier: "Supplier",
    balance: "Current Balance",
    amount: "Payment Amount",
    total: "Total Payment",
    save: "Save Payments",
    update: "Save Changes",
    noSelected: "No supplier added yet. Search below to add one.",
    noResult: "No supplier found.",
    add: "Add",
    remove: "Remove",
    required: "Add at least one supplier and enter a payment amount.",
    saved: "Payables payment saved successfully.",
    updated: "Payables payment updated successfully.",
    weOwe: "We owe supplier",
    supplierOwes: "Supplier owes us",
    settled: "Settled",
  },
  fa: {
    title: "پرداخت تادیات",
    editTitle: "ویرایش پرداخت تادیات",
    subtitle: "تأمین‌کننده‌ها را جستجو و اضافه کنید، مبلغ پرداخت را وارد نموده و ثبت کنید.",
    back: "برگشت به تادیات",
    date: "تاریخ پرداخت",
    supplierPayments: "پرداخت تأمین‌کننده‌ها",
    search: "جستجوی تأمین‌کننده با نام، شماره تماس یا شخص مسئول...",
    searchHint: "تأمین‌کننده را جستجو و انتخاب کنید تا به لیست پرداخت اضافه شود.",
    supplier: "تأمین‌کننده",
    balance: "بیلانس فعلی",
    amount: "مبلغ پرداخت",
    total: "مجموع پرداخت",
    save: "ثبت پرداخت‌ها",
    update: "ذخیره تغییرات",
    noSelected: "هنوز تأمین‌کننده‌ای اضافه نشده است؛ از جستجوی پایین اضافه کنید.",
    noResult: "تأمین‌کننده‌ای پیدا نشد.",
    add: "اضافه",
    remove: "حذف",
    required: "حداقل یک تأمین‌کننده اضافه کرده و مبلغ پرداخت را وارد کنید.",
    saved: "پرداخت تادیات موفقانه ثبت شد.",
    updated: "پرداخت تادیات موفقانه ویرایش شد.",
    weOwe: "ما قرضدار هستیم",
    supplierOwes: "تأمین‌کننده از ما قرضدار است",
    settled: "حساب تصفیه است",
  },
  ps: {
    title: "د تادیاتو ورکړه",
    editTitle: "د تادیاتو د ورکړې سمون",
    subtitle: "عرضه کوونکي ولټوئ او ورزیات یې کړئ، د ورکړې مبلغ ولیکئ او ثبت یې کړئ.",
    back: "تادیاتو ته بېرته",
    date: "د ورکړې نېټه",
    supplierPayments: "د عرضه کوونکو ورکړې",
    search: "عرضه کوونکی د نوم، تلیفون یا مسئول کس له مخې ولټوئ...",
    searchHint: "عرضه کوونکی ولټوئ او وټاکئ څو د ورکړې لیست ته اضافه شي.",
    supplier: "عرضه کوونکی",
    balance: "اوسنی بیلانس",
    amount: "د ورکړې مبلغ",
    total: "ټوله ورکړه",
    save: "ورکړې ثبت کړئ",
    update: "بدلونونه خوندي کړئ",
    noSelected: "تر اوسه عرضه کوونکی نه دی اضافه شوی؛ له لټون څخه یې اضافه کړئ.",
    noResult: "هیڅ عرضه کوونکی ونه موندل شو.",
    add: "اضافه",
    remove: "حذف",
    required: "لږ تر لږه یو عرضه کوونکی اضافه او د ورکړې مبلغ ولیکئ.",
    saved: "د تادیاتو ورکړه په بریالیتوب ثبت شوه.",
    updated: "د تادیاتو ورکړه په بریالیتوب اصلاح شوه.",
    weOwe: "موږ پوروړي یو",
    supplierOwes: "عرضه کوونکی موږ ته پوروړی دی",
    settled: "حساب تصفیه دی",
  },
};

function supplierName(supplier) {
  return supplier?.supplierName || supplier?.name || supplier?.companyName || "—";
}

function supplierCurrency(supplier) {
  const code = String(supplier?.currency || supplier?.currencyCode || "AFN").toUpperCase();
  if (code.includes("USD")) return "USD";
  if (code.includes("EUR")) return "EUR";
  if (code.includes("INR")) return "INR";
  return "AFN";
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

  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [editLoaded, setEditLoaded] = useState(!isEdit);
  const amountRefs = useRef(new Map());

  const t = translations[language] || translations.fa;
  const dir = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "fa");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !batchesLoaded || editLoaded) return;
    const batch = batches.find((row) => String(row.id) === String(batchId));
    if (!batch) {
      notify("Payment batch not found.", "error");
      navigate("/payables", { replace: true });
      return;
    }

    const ids = [];
    const nextAmounts = {};
    (Array.isArray(batch.payments) ? batch.payments : []).forEach((row) => {
      const id = String(row.supplierId || "");
      if (!id) return;
      ids.push(id);
      nextAmounts[id] = row.amount ?? "";
    });
    setSelectedIds(ids);
    setAmounts(nextAmounts);
    if (batch.date) setDate(batch.date);
    setEditLoaded(true);
  }, [isEdit, batchesLoaded, editLoaded, batches, batchId, navigate]);

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
      const paidLater = supplierPayments
        .filter((row) => String(row.supplierId) === id && (!isEdit || String(row.batchId || "") !== String(batchId)))
        .reduce((sum, row) => sum + num(row.amount), 0);

      map.set(id, num(supplier.openingBalance) + totalPurchased - paidAtPurchase - returned - paidLater);
    });
    return map;
  }, [suppliers, purchases, purchaseReturns, supplierPayments, isEdit, batchId]);

  const selectedSuppliers = useMemo(
    () => selectedIds
      .map((id) => suppliers.find((supplier) => String(supplier.id) === String(id)))
      .filter(Boolean),
    [selectedIds, suppliers]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(selectedIds.map(String));
    return suppliers
      .filter((supplier) => !selected.has(String(supplier.id)))
      .filter((supplier) =>
        [supplier.supplierName, supplier.name, supplier.companyName, supplier.contactPerson, supplier.phone, supplier.phoneNumber]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [suppliers, selectedIds, search]);

  const paymentRows = useMemo(
    () => selectedSuppliers
      .map((supplier) => ({
        supplier,
        amount: Math.max(num(amounts[String(supplier.id)]), 0),
      }))
      .filter((row) => row.amount > 0),
    [selectedSuppliers, amounts]
  );

  const totalByCurrency = useMemo(() => {
    const totals = {};
    paymentRows.forEach(({ supplier, amount }) => {
      const currency = supplierCurrency(supplier);
      totals[currency] = (totals[currency] || 0) + amount;
    });
    return totals;
  }, [paymentRows]);

  const totalText = Object.entries(totalByCurrency)
    .map(([currency, value]) => `${num(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`)
    .join(" · ") || "0 AFN";

  const addSupplier = (supplier) => {
    const id = String(supplier.id);
    if (!selectedIds.includes(id)) setSelectedIds((prev) => [...prev, id]);
    setSearch("");
    window.setTimeout(() => {
      amountRefs.current.get(id)?.focus();
    }, 0);
  };

  const removeSupplier = (supplierId) => {
    const id = String(supplierId);
    setSelectedIds((prev) => prev.filter((value) => String(value) !== id));
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const save = async () => {
    if (!paymentRows.length) {
      notify(t.required, "warning");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const batchIdValue = isEdit ? String(batchId) : `SPB-${Date.now()}`;
      const oldBatch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
      const reference = oldBatch?.reference || `PB-${String(Date.now()).slice(-8)}`;

      const newPayments = paymentRows.map(({ supplier, amount }, index) => {
        const oldPayment = oldBatch?.payments?.find((row) => String(row.supplierId) === String(supplier.id));
        const paymentId = oldPayment?.paymentId || oldPayment?.id || `SPAY-${Date.now()}-${index}`;
        return {
          id: paymentId,
          paymentId,
          supplierId: supplier.id,
          supplierName: supplierName(supplier),
          amount,
          currency: supplierCurrency(supplier),
        };
      });

      const batchRecord = {
        id: batchIdValue,
        reference,
        date: date || today(),
        payments: newPayments,
        supplierCount: newPayments.length,
        totals: totalByCurrency,
        createdAt: oldBatch?.createdAt || now,
        updatedAt: now,
      };

      const otherPayments = supplierPayments.filter((row) => String(row.batchId || "") !== batchIdValue);
      const ledgerPayments = newPayments.map((row) => ({
        id: row.paymentId,
        supplierId: row.supplierId,
        supplierName: row.supplierName,
        date: batchRecord.date,
        amount: row.amount,
        currency: row.currency,
        description: language === "fa" ? "پرداخت تادیات" : language === "ps" ? "د تادیاتو ورکړه" : "Payables payment",
        reference,
        batchId: batchIdValue,
        createdAt: oldBatch?.createdAt || now,
        updatedAt: now,
      }));

      const paymentsSaved = await setSupplierPayments([...ledgerPayments, ...otherPayments]);
      if (!paymentsSaved) return;

      const nextBatches = isEdit
        ? batches.map((row) => (String(row.id) === batchIdValue ? batchRecord : row))
        : [batchRecord, ...batches];
      const batchSaved = await setBatches(nextBatches);
      if (!batchSaved) {
        await setSupplierPayments(supplierPayments);
        return;
      }

      notify(isEdit ? t.updated : t.saved, "success");
      navigate("/payables", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (!suppliersLoaded || !batchesLoaded || !editLoaded) {
    return (
      <div className="payables-batch-page" dir={dir}>
        <div className="payables-batch-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="payables-batch-page" dir={dir}>
      <div className="payables-batch-topbar">
        <button type="button" className="payables-batch-back" onClick={() => navigate("/payables")}>
          <ArrowLeft size={16} />
          {t.back}
        </button>
      </div>

      <header className="payables-batch-header">
        <div className="payables-batch-heading-icon"><BadgeDollarSign size={22} /></div>
        <div>
          <h1>{isEdit ? t.editTitle : t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <section className="payables-payment-card">
        <div className="payables-payment-card-head">
          <div className="payables-payment-title"><Truck size={17} /><strong>{t.supplierPayments}</strong></div>
          <label className="payables-payment-date">
            <span><CalendarDays size={14} />{t.date}</span>
            <ShamsiDateInput value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        <div className="payables-payment-rows">
          {selectedSuppliers.map((supplier) => {
            const id = String(supplier.id);
            const balance = num(balanceMap.get(id));
            const paymentAmount = Math.max(num(amounts[id]), 0);
            const remainingBalance = balance - paymentAmount;
            const state = remainingBalance > 0 ? "owe" : remainingBalance < 0 ? "receivable" : "settled";
            const stateText = state === "owe" ? t.weOwe : state === "receivable" ? t.supplierOwes : t.settled;
            return (
              <article className="payables-payment-row" key={id}>
                <div className="payables-payment-supplier">
                  <span className="payables-payment-avatar"><Truck size={16} /></span>
                  <div>
                    <strong>{supplierName(supplier)}</strong>
                    <small>{supplier.phone || supplier.phoneNumber || supplier.contactPerson || "—"}</small>
                  </div>
                </div>

                <div className={`payables-payment-balance ${state}`}>
                  <span>{t.balance}</span>
                  <strong>{Math.abs(remainingBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {supplierCurrency(supplier)}</strong>
                  <small>{stateText}</small>
                </div>

                <label className="payables-payment-amount">
                  <span>{t.amount}</span>
                  <div className="payables-payment-amount-input">
                    <input
                      ref={(node) => {
                        if (node) amountRefs.current.set(id, node);
                        else amountRefs.current.delete(id);
                      }}
                      type="number"
                      min="0"
                      step="0.01"
                      value={amounts[id] ?? ""}
                      onChange={(event) => setAmounts((prev) => ({ ...prev, [id]: event.target.value }))}
                      placeholder="0.00"
                    />
                    <b>{supplierCurrency(supplier)}</b>
                  </div>
                </label>

                <button type="button" className="payables-payment-remove" onClick={() => removeSupplier(id)} title={t.remove}>
                  <Trash2 size={15} />
                </button>
              </article>
            );
          })}

          {!selectedSuppliers.length && <div className="payables-payment-empty">{t.noSelected}</div>}
        </div>

        <div className="payables-payment-search-area">
          <label className="payables-payment-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults.length) {
                  event.preventDefault();
                  addSupplier(searchResults[0]);
                }
              }}
              placeholder={t.search}
            />
          </label>

          {search.trim() && (
            <div className="payables-payment-search-results">
              {searchResults.map((supplier) => (
                <button type="button" key={supplier.id} onClick={() => addSupplier(supplier)}>
                  <span className="result-icon"><Truck size={15} /></span>
                  <span className="result-main">
                    <strong>{supplierName(supplier)}</strong>
                    <small>{supplier.phone || supplier.phoneNumber || supplier.contactPerson || "—"}</small>
                  </span>
                  <span className="result-balance">
                    {Math.abs(num(balanceMap.get(String(supplier.id)))).toLocaleString(undefined, { maximumFractionDigits: 2 })} {supplierCurrency(supplier)}
                  </span>
                  <span className="result-add"><Plus size={14} />{t.add}</span>
                </button>
              ))}
              {!searchResults.length && <div className="payables-payment-no-result">{t.noResult}</div>}
            </div>
          )}
          <small className="payables-payment-search-hint">{t.searchHint}</small>
        </div>
      </section>

      <section className="payables-payment-footer-card">
        <div className="payables-payment-total">
          <span>{t.total}</span>
          <strong>{totalText}</strong>
        </div>
        <button type="button" className="payables-batch-save final" disabled={saving || !paymentRows.length} onClick={save}>
          <CheckCircle2 size={17} />
          {isEdit ? t.update : t.save}
        </button>
      </section>
    </div>
  );
}
