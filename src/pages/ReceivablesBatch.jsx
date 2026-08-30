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
  UserRound,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./PayablesBatch.css";

const languageKey = "afghan-power-language";
const num = (value) => Number(value || 0) || 0;
const today = () => new Date().toISOString().slice(0, 10);

const translations = {
  en: {
    title: "Collect Receivables",
    editTitle: "Edit Receivables Collection",
    subtitle: "Search customers, add them, enter the amount received and save.",
    back: "Back to Receivables",
    date: "Collection Date",
    customerPayments: "Customer Collections",
    search: "Search customer by name, phone or company...",
    searchHint: "Search and select a customer to add them to the collection list.",
    customer: "Customer",
    balance: "Current Balance",
    amount: "Received Amount",
    total: "Total Received",
    save: "Save Collections",
    update: "Save Changes",
    noSelected: "No customer has been added yet; add one using the search below.",
    noResult: "No customer found.",
    add: "Add",
    remove: "Remove",
    required: "Add at least one customer and enter a received amount.",
    saved: "Receivables collection saved successfully.",
    updated: "Receivables collection updated successfully.",
    customerOwes: "Customer owes us",
    weOwe: "Customer credit",
    settled: "Settled",
  },
  fa: {
    title: "ثبت طلبات",
    editTitle: "ویرایش ثبت طلبات",
    subtitle: "مشتری را جستجو و اضافه کنید، مبلغ دریافت را وارد نموده و ثبت کنید.",
    back: "برگشت به طلبات",
    date: "تاریخ دریافت",
    customerPayments: "دریافت از مشتریان",
    search: "جستجوی مشتری با نام، شماره تماس یا کمپنی...",
    searchHint: "مشتری را جستجو و انتخاب کنید تا به لیست دریافت اضافه شود.",
    customer: "مشتری",
    balance: "بیلانس فعلی",
    amount: "مبلغ دریافت",
    total: "مجموع دریافت",
    save: "ثبت دریافت‌ها",
    update: "ذخیره تغییرات",
    noSelected: "هنوز مشتری اضافه نشده است؛ از جستجوی پایین اضافه کنید.",
    noResult: "مشتری پیدا نشد.",
    add: "اضافه",
    remove: "حذف",
    required: "حداقل یک مشتری اضافه کرده و مبلغ دریافت را وارد کنید.",
    saved: "ثبت طلبات موفقانه انجام شد.",
    updated: "ثبت طلبات موفقانه ویرایش شد.",
    customerOwes: "مشتری قرضدار است",
    weOwe: "اعتبار مشتری",
    settled: "حساب تصفیه است",
  },
  ps: {
    title: "د طلباتو ثبت",
    editTitle: "د طلباتو د ثبت سمون",
    subtitle: "پېرودونکی ولټوئ او ورزیات یې کړئ، ترلاسه شوی مبلغ ولیکئ او ثبت یې کړئ.",
    back: "طلباتو ته بېرته",
    date: "د ترلاسه کولو نېټه",
    customerPayments: "له پېرودونکو ترلاسه کول",
    search: "پېرودونکی د نوم، تلیفون یا شرکت له مخې ولټوئ...",
    searchHint: "پېرودونکی ولټوئ او وټاکئ څو د ترلاسه کولو لیست ته اضافه شي.",
    customer: "پېرودونکی",
    balance: "اوسنی بیلانس",
    amount: "ترلاسه شوی مبلغ",
    total: "ټول ترلاسه شوي",
    save: "ترلاسه شوې پیسې ثبت کړئ",
    update: "بدلونونه خوندي کړئ",
    noSelected: "تر اوسه پېرودونکی نه دی اضافه شوی؛ له لټون څخه یې اضافه کړئ.",
    noResult: "هیڅ پېرودونکی ونه موندل شو.",
    add: "اضافه",
    remove: "حذف",
    required: "لږ تر لږه یو پېرودونکی اضافه او مبلغ ولیکئ.",
    saved: "د طلباتو ثبت په بریالیتوب ترسره شو.",
    updated: "د طلباتو ثبت په بریالیتوب اصلاح شو.",
    customerOwes: "پېرودونکی پوروړی دی",
    weOwe: "د پېرودونکي اعتبار",
    settled: "حساب تصفیه دی",
  },
};

function customerName(customer) {
  return customer?.fullName || customer?.customerName || customer?.companyName || customer?.name || "—";
}

function customerCurrency(customer) {
  const code = String(customer?.currency || customer?.currencyCode || "AFN").toUpperCase();
  if (code.includes("USD")) return "USD";
  if (code.includes("EUR")) return "EUR";
  if (code.includes("INR")) return "INR";
  return "AFN";
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
      notify("Receivables collection not found.", "error");
      navigate("/receivables", { replace: true });
      return;
    }

    const ids = [];
    const nextAmounts = {};
    (Array.isArray(batch.payments) ? batch.payments : []).forEach((row) => {
      const id = String(row.customerId || "");
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
    customers.forEach((customer) => {
      const id = String(customer.id);
      const totalSold = sales
        .filter((row) => String(row.customerId) === id)
        .reduce((sum, row) => sum + num(row.totalAmount), 0);
      const paidAtSale = sales
        .filter((row) => String(row.customerId) === id)
        .reduce((sum, row) => sum + num(row.paidAmount), 0);
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

  const selectedCustomers = useMemo(
    () => selectedIds
      .map((id) => customers.find((customer) => String(customer.id) === String(id)))
      .filter(Boolean),
    [selectedIds, customers]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(selectedIds.map(String));
    return customers
      .filter((customer) => !selected.has(String(customer.id)))
      .filter((customer) =>
        [customer.fullName, customer.customerName, customer.companyName, customer.name, customer.phone, customer.phoneNumber, customer.alternatePhone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [customers, selectedIds, search]);

  const collectionRows = useMemo(
    () => selectedCustomers
      .map((customer) => ({
        customer,
        amount: Math.max(num(amounts[String(customer.id)]), 0),
      }))
      .filter((row) => row.amount > 0),
    [selectedCustomers, amounts]
  );

  const totalByCurrency = useMemo(() => {
    const totals = {};
    collectionRows.forEach(({ customer, amount }) => {
      const currency = customerCurrency(customer);
      totals[currency] = (totals[currency] || 0) + amount;
    });
    return totals;
  }, [collectionRows]);

  const totalText = Object.entries(totalByCurrency)
    .map(([currency, value]) => `${num(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`)
    .join(" · ") || "0 AFN";

  const addCustomer = (customer) => {
    const id = String(customer.id);
    if (!selectedIds.includes(id)) setSelectedIds((prev) => [...prev, id]);
    setSearch("");
    window.setTimeout(() => {
      amountRefs.current.get(id)?.focus();
    }, 0);
  };

  const removeCustomer = (customerId) => {
    const id = String(customerId);
    setSelectedIds((prev) => prev.filter((value) => String(value) !== id));
    setAmounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const save = async () => {
    if (!collectionRows.length) {
      notify(t.required, "warning");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const batchIdValue = isEdit ? String(batchId) : `CPB-${Date.now()}`;
      const oldBatch = isEdit ? batches.find((row) => String(row.id) === String(batchId)) : null;
      const reference = oldBatch?.reference || `RB-${String(Date.now()).slice(-8)}`;

      const newPayments = collectionRows.map(({ customer, amount }, index) => {
        const oldPayment = oldBatch?.payments?.find((row) => String(row.customerId) === String(customer.id));
        const paymentId = oldPayment?.paymentId || oldPayment?.id || `CPAY-${Date.now()}-${index}`;
        return {
          id: paymentId,
          paymentId,
          customerId: customer.id,
          customerName: customerName(customer),
          amount,
          currency: customerCurrency(customer),
          note: oldPayment?.note || "",
        };
      });

      const batchRecord = {
        id: batchIdValue,
        reference,
        date: date || today(),
        payments: newPayments,
        customerCount: newPayments.length,
        totals: totalByCurrency,
        createdAt: oldBatch?.createdAt || now,
        updatedAt: now,
      };

      const otherPayments = customerPayments.filter((row) => String(row.batchId || "") !== batchIdValue);
      const ledgerPayments = newPayments.map((row) => ({
        id: row.paymentId,
        customerId: row.customerId,
        customerName: row.customerName,
        date: batchRecord.date,
        amount: row.amount,
        currency: row.currency,
        description: language === "fa" ? "دریافت طلبات" : language === "ps" ? "د طلباتو ترلاسه کول" : "Receivables collection",
        reference,
        batchId: batchIdValue,
        createdAt: oldBatch?.createdAt || now,
        updatedAt: now,
      }));

      const paymentsSaved = await setCustomerPayments([...ledgerPayments, ...otherPayments]);
      if (!paymentsSaved) return;

      const nextBatches = isEdit
        ? batches.map((row) => (String(row.id) === batchIdValue ? batchRecord : row))
        : [batchRecord, ...batches];
      const batchSaved = await setBatches(nextBatches);
      if (!batchSaved) {
        await setCustomerPayments(customerPayments);
        return;
      }

      notify(isEdit ? t.updated : t.saved, "success");
      navigate("/receivables", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (!customersLoaded || !batchesLoaded || !editLoaded) {
    return (
      <div className="payables-batch-page" dir={dir}>
        <div className="payables-batch-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="payables-batch-page" dir={dir}>
      <div className="payables-batch-topbar">
        <button type="button" className="payables-batch-back" onClick={() => navigate("/receivables")}>
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
          <div className="payables-payment-title"><UserRound size={17} /><strong>{t.customerPayments}</strong></div>
          <label className="payables-payment-date">
            <span><CalendarDays size={14} />{t.date}</span>
            <ShamsiDateInput value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        <div className="payables-payment-rows">
          {selectedCustomers.map((customer) => {
            const id = String(customer.id);
            const balance = num(balanceMap.get(id));
            const receivedAmount = Math.max(num(amounts[id]), 0);
            const remainingBalance = balance - receivedAmount;
            const state = remainingBalance > 0 ? "owe" : remainingBalance < 0 ? "receivable" : "settled";
            const stateText = state === "owe" ? t.customerOwes : state === "receivable" ? t.weOwe : t.settled;
            return (
              <article className="payables-payment-row" key={id}>
                <div className="payables-payment-supplier">
                  <span className="payables-payment-avatar"><UserRound size={16} /></span>
                  <div>
                    <strong>{customerName(customer)}</strong>
                    <small>{customer.phone || customer.phoneNumber || customer.alternatePhone || customer.companyName || "—"}</small>
                  </div>
                </div>

                <div className={`payables-payment-balance ${state}`}>
                  <span>{t.balance}</span>
                  <strong>{Math.abs(remainingBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} {customerCurrency(customer)}</strong>
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
                    <b>{customerCurrency(customer)}</b>
                  </div>
                </label>

                <button type="button" className="payables-payment-remove" onClick={() => removeCustomer(id)} title={t.remove}>
                  <Trash2 size={15} />
                </button>
              </article>
            );
          })}

          {!selectedCustomers.length && <div className="payables-payment-empty">{t.noSelected}</div>}
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
                  addCustomer(searchResults[0]);
                }
              }}
              placeholder={t.search}
            />
          </label>

          {search.trim() && (
            <div className="payables-payment-search-results">
              {searchResults.map((customer) => (
                <button type="button" key={customer.id} onClick={() => addCustomer(customer)}>
                  <span className="result-icon"><UserRound size={15} /></span>
                  <span className="result-main">
                    <strong>{customerName(customer)}</strong>
                    <small>{customer.phone || customer.phoneNumber || customer.alternatePhone || customer.companyName || "—"}</small>
                  </span>
                  <span className="result-balance">
                    {Math.abs(num(balanceMap.get(String(customer.id)))).toLocaleString(undefined, { maximumFractionDigits: 2 })} {customerCurrency(customer)}
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
        <button type="button" className="payables-batch-save final" disabled={saving || !collectionRows.length} onClick={save}>
          <CheckCircle2 size={17} />
          {isEdit ? t.update : t.save}
        </button>
      </section>
    </div>
  );
}
