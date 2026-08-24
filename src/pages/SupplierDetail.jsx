import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  Edit3,
  FileText,
  MapPin,
  Phone,
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
    totalPurchases: "Total Purchases",
    totalPayments: "Total Payments",
    currentBalance: "Current Balance",
    transactions: "Ledger Transactions",
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
    totalPurchases: "مجموع خریداری",
    totalPayments: "مجموع پرداخت",
    currentBalance: "بیلانس فعلی",
    transactions: "لیجر تأمین‌کننده",
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
    totalPurchases: "ټول پېرودونه",
    totalPayments: "ټولې تادیې",
    currentBalance: "اوسنی بیلانس",
    transactions: "د عرضه کوونکي لیجر",
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

const currencyLabels = { afn: "AFN", usd: "USD", pkr: "PKR", eur: "EUR" };
const numeric = (value) => Number(value || 0) || 0;
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
  const [suppliers] = useJsonCollection("suppliers");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [payments, setPayments] = useJsonCollection("supplierPayments");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [showPayment, setShowPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ date: today(), amount: "", description: "" });

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const supplier = suppliers.find((item) => String(item.id) === String(supplierId));
  const currencyCode = currencyLabels[String(supplier?.currency || "afn").toLowerCase()] || String(supplier?.currency || "AFN").toUpperCase();

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
    document.body.classList.toggle("supplier-payment-modal-open", showPayment);
    document.body.classList.toggle("app-modal-open", showPayment);
    return () => {
      document.body.classList.remove("supplier-payment-modal-open");
      document.body.classList.remove("app-modal-open");
    };
  }, [showPayment]);

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
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        order: new Date(supplier?.createdAt || 0).getTime() || 0,
      });
    }

    supplierPurchases.forEach((purchase) => {
      const purchaseDate = purchase.purchaseDate || purchase.date || purchase.createdAt || "";
      const order = new Date(purchaseDate || 0).getTime() || 0;
      entries.push({
        id: `purchase-${purchase.id}`,
        date: purchaseDate,
        reference: purchase.billNumber || purchase.id,
        description: t.purchase,
        kind: "purchase",
        sourceId: purchase.id,
        debit: numeric(purchase.totalAmount),
        credit: 0,
        order,
      });
      if (numeric(purchase.paidAmount) > 0) {
        entries.push({
          id: `purchase-payment-${purchase.id}`,
          date: purchaseDate,
          reference: purchase.billNumber || purchase.id,
          description: t.purchasePayment,
          kind: "purchase-payment",
          sourceId: purchase.id,
          debit: 0,
          credit: numeric(purchase.paidAmount),
          order: order + 1,
        });
      }
    });


    supplierReturns.forEach((item) => {
      const returnDate = item.returnDate || item.date || item.createdAt || "";
      const order = new Date(returnDate || 0).getTime() || 0;
      entries.push({
        id: `purchase-return-${item.id}`,
        date: returnDate,
        reference: item.returnNo || item.id,
        description: item.notes || t.purchaseReturn,
        kind: "purchase-return",
        sourceId: item.id,
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
        debit: 0,
        credit: numeric(payment.amount),
        order,
      });
    });

    entries.sort((a, b) => (a.order - b.order) || String(a.id).localeCompare(String(b.id)));
    let running = 0;
    return entries.map((entry) => {
      running += numeric(entry.debit) - numeric(entry.credit);
      return { ...entry, balance: running };
    });
  }, [supplier, supplierId, supplierPurchases, supplierReturns, supplierPayments, t.opening, t.purchase, t.purchasePayment, t.purchaseReturn, t.manualPayment]);

  const totalPurchases = supplierPurchases.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
  const purchasePayments = supplierPurchases.reduce((sum, item) => sum + numeric(item.paidAmount), 0);
  const manualPayments = supplierPayments.reduce((sum, item) => sum + numeric(item.amount), 0);
  const totalPayments = purchasePayments + manualPayments;
  const currentBalance = ledger.length ? numeric(ledger[ledger.length - 1].balance) : numeric(supplier?.openingBalance);

  const openPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentForm({ date: today(), amount: "", description: "" });
    setShowPayment(true);
  };

  const closePaymentModal = () => {
    setShowPayment(false);
    setEditingPaymentId(null);
    setPaymentForm({ date: today(), amount: "", description: "" });
  };

  const editLedgerEntry = (entry) => {
    if (entry.kind === "manual-payment") {
      const payment = payments.find((item) => String(item.id) === String(entry.sourceId));
      if (!payment) return;
      setEditingPaymentId(payment.id);
      setPaymentForm({
        date: normalizeDate(payment.date || payment.createdAt),
        amount: String(payment.amount ?? ""),
        description: payment.description || "",
      });
      setShowPayment(true);
      return;
    }
    if (entry.sourceId) navigate("/purchasing", { state: { editPurchaseId: entry.sourceId } });
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

  if (!supplier) {
    return (
      <div className="supplier-detail-page supplier-detail-missing" dir={direction}>
        <Building2 size={38} />
        <h2>{t.supplierMissing}</h2>
        <button type="button" onClick={() => navigate("/suppliers")}><ArrowLeft size={17} />{t.back}</button>
      </div>
    );
  }

  const balanceState = currentBalance > 0 ? "owe" : currentBalance < 0 ? "receivable" : "settled";
  const balanceLabel = currentBalance > 0 ? t.youOwe : currentBalance < 0 ? t.supplierOwes : t.settled;

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
        <button type="button" className="supplier-detail-payment-btn" onClick={openPaymentModal}><Wallet size={18} />{t.payment}</button>
      </div>

      <div className="supplier-detail-stat-grid">
        <article className="supplier-detail-stat"><span className="icon purchase"><ReceiptText size={19} /></span><div><small>{t.totalPurchases}</small><strong>{totalPurchases.toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
        <article className="supplier-detail-stat"><span className="icon payment"><Wallet size={19} /></span><div><small>{t.totalPayments}</small><strong>{totalPayments.toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
        <article className={`supplier-detail-stat balance ${balanceState}`}><span className="icon"><BadgeDollarSign size={19} /></span><div><small>{t.currentBalance}</small><strong>{Math.abs(currentBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
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
          <div className="supplier-detail-section-head ledger"><ReceiptText size={18} /><div><h2>{t.transactions}</h2><p>{ledger.length} {t.transactions.toLowerCase()}</p></div></div>
          <div className="supplier-detail-ledger-wrap">
            <table>
              <thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.debit}</th><th>{t.credit}</th><th>{t.balance}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {ledger.length ? ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.date)}</td>
                    <td><span className="supplier-ledger-reference">{entry.reference || "—"}</span></td>
                    <td><span className={`supplier-ledger-description ${entry.kind || ""}`}>{entry.description}</span></td>
                    <td className="supplier-ledger-debit">{entry.debit ? entry.debit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</td>
                    <td className="supplier-ledger-credit">{entry.credit ? entry.credit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</td>
                    <td className={entry.balance > 0 ? "supplier-ledger-balance owe" : entry.balance < 0 ? "supplier-ledger-balance receivable" : "supplier-ledger-balance"}>{Math.abs(entry.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>
                      <div className="supplier-ledger-actions">
                        {entry.kind !== "opening" && (
                          <button type="button" className="edit" onClick={() => editLedgerEntry(entry)} aria-label={t.edit} title={t.edit}><Edit3 size={14} /></button>
                        )}
                        {entry.kind === "manual-payment" && (
                          <button type="button" className="delete" onClick={() => deleteLedgerEntry(entry)} aria-label={t.delete} title={t.delete}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="supplier-ledger-empty">{t.noTransactions}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className={`supplier-detail-result ${balanceState}`}>
            <div><span>{balanceLabel}</span><small>{t.currentBalance}</small></div>
            <strong>{Math.abs(currentBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong>
          </div>
        </section>
      </div>

      {showPayment && createPortal(paymentModal, document.body)}
    </div>
  );
}
