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
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShoppingCart,
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
import "./CustomerDetail.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    back: "Back to Customers",
    title: "Customer Detail",
    subtitle: "Customer profile, sales, payments and running balance.",
    payment: "Payment",
    totalSales: "Total Sales",
    totalPayments: "Total Payments",
    currentBalance: "Current Balance",
    transactions: "Customer Ledger",
    customerInfo: "Customer Information",
    customerType: "Customer Type",
    individual: "Individual",
    business: "Business",
    company: "Company",
    phone: "Phone Number",
    altPhone: "Alternate Phone",
    email: "Email",
    address: "Address",
    openingBalance: "Opening Balance",
    creditLimit: "Credit Limit",
    notes: "Notes",
    date: "Date",
    reference: "Reference",
    description: "Description",
    debit: "Sale / Debit",
    credit: "Payment / Credit",
    balance: "Running Balance",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    sale: "Sale",
    salePayment: "Payment at Sale",
    saleReturn: "Sale Return",
    manualPayment: "Payment",
    opening: "Opening Balance",
    noTransactions: "No sales or payments have been recorded for this customer yet.",
    customerOwes: "This customer owes you",
    youOweCustomer: "You owe this customer",
    settled: "Account is settled",
    paymentTitle: "Register Customer Payment",
    paymentHint: "Record a payment received from this customer. It will immediately appear in the customer ledger.",
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
    customerMissing: "Customer not found.",
  },
  fa: {
    back: "برگشت به مشتریان",
    title: "جزئیات مشتری",
    subtitle: "پروفایل، فروشات، پرداخت‌ها و بیلانس جاری مشتری.",
    payment: "پرداخت",
    totalSales: "مجموع فروشات",
    totalPayments: "مجموع پرداخت",
    currentBalance: "بیلانس فعلی",
    transactions: "لیجر مشتری",
    customerInfo: "معلومات مشتری",
    customerType: "نوع مشتری",
    individual: "شخصی",
    business: "شرکتی",
    company: "شرکت",
    phone: "شماره تماس",
    altPhone: "شماره دوم",
    email: "ایمیل",
    address: "آدرس",
    openingBalance: "بیلانس افتتاحیه",
    creditLimit: "حد اعتبار",
    notes: "ملاحظات",
    date: "تاریخ",
    reference: "مرجع",
    description: "توضیحات",
    debit: "فروش / بدهکار",
    credit: "پرداخت / بستانکار",
    balance: "بیلانس جاری",
    actions: "عملیات",
    edit: "ویرایش",
    delete: "حذف",
    sale: "فروش",
    salePayment: "پرداخت هنگام فروش",
    saleReturn: "برگشت فروش",
    manualPayment: "پرداخت",
    opening: "بیلانس افتتاحیه",
    noTransactions: "برای این مشتری هنوز فروش یا پرداختی ثبت نشده است.",
    customerOwes: "این مشتری به ما قرضدار است",
    youOweCustomer: "ما به این مشتری قرضدار استیم",
    settled: "حساب تصفیه است",
    paymentTitle: "ثبت پرداخت مشتری",
    paymentHint: "پرداخت دریافت‌شده از این مشتری را ثبت کنید؛ ریکارد فوراً در لیجر نمایش داده می‌شود.",
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
    customerMissing: "مشتری پیدا نشد.",
  },
  ps: {
    back: "پېرودونکو ته بېرته",
    title: "د پېرودونکي جزئیات",
    subtitle: "د پېرودونکي پروفایل، خرڅلاو، تادیات او روان بیلانس.",
    payment: "تادیه",
    totalSales: "ټول خرڅلاو",
    totalPayments: "ټولې تادیې",
    currentBalance: "اوسنی بیلانس",
    transactions: "د پېرودونکي لیجر",
    customerInfo: "د پېرودونکي معلومات",
    customerType: "د پېرودونکي ډول",
    individual: "شخصي",
    business: "شرکتي",
    company: "شرکت",
    phone: "د اړیکې شمېره",
    altPhone: "دوهمه شمېره",
    email: "برېښنالیک",
    address: "پته",
    openingBalance: "افتتاحي بیلانس",
    creditLimit: "د اعتبار حد",
    notes: "یادښتونه",
    date: "نېټه",
    reference: "مرجع",
    description: "تشریح",
    debit: "خرڅلاو / بدهکار",
    credit: "تادیه / بستانکار",
    balance: "روان بیلانس",
    actions: "عملیات",
    edit: "سمون",
    delete: "حذف",
    sale: "خرڅلاو",
    salePayment: "د خرڅلاو پر مهال تادیه",
    saleReturn: "د خرڅلاو بېرته ستنول",
    manualPayment: "تادیه",
    opening: "افتتاحي بیلانس",
    noTransactions: "د دې پېرودونکي لپاره تر اوسه خرڅلاو یا تادیه نه ده ثبت شوې.",
    customerOwes: "دا پېرودونکی موږ ته پوروړی دی",
    youOweCustomer: "موږ دې پېرودونکي ته پوروړي یو",
    settled: "حساب تصفیه دی",
    paymentTitle: "د پېرودونکي تادیه ثبتول",
    paymentHint: "له پېرودونکي ترلاسه شوې تادیه ثبت کړئ؛ ریکارډ به سمدستي په لیجر کې ښکاره شي.",
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
    customerMissing: "پېرودونکی ونه موندل شو.",
  },
};

const numeric = (value) => Number(value || 0) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const normalizeDate = (value) => {
  if (!value) return today();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [payments, setPayments] = useJsonCollection("customerPayments");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [showPayment, setShowPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ date: today(), amount: "", description: "" });

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const customer = customers.find((item) => String(item.id) === String(customerId));
  const currencyCode = String(customer?.currency || "AFN").toUpperCase();

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
    document.body.classList.toggle("customer-payment-modal-open", showPayment);
    document.body.classList.toggle("app-modal-open", showPayment);
    return () => {
      document.body.classList.remove("customer-payment-modal-open");
      document.body.classList.remove("app-modal-open");
    };
  }, [showPayment]);

  const customerSales = useMemo(
    () => sales.filter((item) => String(item.customerId) === String(customerId)),
    [sales, customerId]
  );
  const customerReturns = useMemo(
    () => saleReturns.filter((item) => String(item.customerId) === String(customerId)),
    [saleReturns, customerId]
  );
  const customerPayments = useMemo(
    () => payments.filter((item) => String(item.customerId) === String(customerId)),
    [payments, customerId]
  );

  const ledger = useMemo(() => {
    const entries = [];
    const openingBalance = numeric(customer?.openingBalance);
    if (openingBalance !== 0) {
      entries.push({
        id: `opening-${customerId}`,
        date: customer?.createdAt || "",
        reference: "OPENING",
        description: t.opening,
        kind: "opening",
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        order: new Date(customer?.createdAt || 0).getTime() || 0,
      });
    }

    customerSales.forEach((sale) => {
      const saleDate = sale.saleDate || sale.date || sale.createdAt || "";
      const order = new Date(saleDate || 0).getTime() || 0;
      entries.push({
        id: `sale-${sale.id}`,
        date: saleDate,
        reference: sale.invoiceNumber || sale.id,
        description: sale.notes || t.sale,
        kind: "sale",
        sourceId: sale.id,
        debit: numeric(sale.totalAmount),
        credit: 0,
        order,
      });
      if (numeric(sale.paidAmount) > 0) {
        entries.push({
          id: `sale-payment-${sale.id}`,
          date: saleDate,
          reference: sale.invoiceNumber || sale.id,
          description: t.salePayment,
          kind: "sale-payment",
          sourceId: sale.id,
          debit: 0,
          credit: numeric(sale.paidAmount),
          order: order + 1,
        });
      }
    });


    customerReturns.forEach((item) => {
      const returnDate = item.returnDate || item.date || item.createdAt || "";
      const order = new Date(returnDate || 0).getTime() || 0;
      entries.push({
        id: `sale-return-${item.id}`,
        date: returnDate,
        reference: item.returnNo || item.id,
        description: item.notes || t.saleReturn,
        kind: "sale-return",
        sourceId: item.id,
        debit: 0,
        credit: numeric(item.totalAmount),
        order: order + 2,
      });
    });

    customerPayments.forEach((payment) => {
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
  }, [customer, customerId, customerSales, customerReturns, customerPayments, t.opening, t.sale, t.salePayment, t.saleReturn, t.manualPayment]);

  const totalSales = customerSales.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
  const salePayments = customerSales.reduce((sum, item) => sum + numeric(item.paidAmount), 0);
  const manualPayments = customerPayments.reduce((sum, item) => sum + numeric(item.amount), 0);
  const totalPayments = salePayments + manualPayments;
  const currentBalance = ledger.length ? numeric(ledger[ledger.length - 1].balance) : numeric(customer?.openingBalance);

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
    if (entry.sourceId && entry.kind === "sale") navigate("/sales", { state: { editSaleId: entry.sourceId } });
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
      id: editingPaymentId || `CPAY-${Date.now()}`,
      customerId,
      customerName: customer?.fullName || customer?.companyName || "",
      date: paymentForm.date || today(),
      amount,
      description: paymentForm.description.trim(),
      reference: previousPayment?.reference || `PAY-${String(Date.now()).slice(-7)}`,
      createdAt: previousPayment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await setPayments(
      editingPaymentId
        ? payments.map((item) => (String(item.id) === String(editingPaymentId) ? record : item))
        : [record, ...payments]
    );
    if (saved) {
      notify(editingPaymentId ? t.updated : t.saved, "success", { silent: true });
      closePaymentModal();
    }
  };

  if (!customer) {
    return (
      <div className="customer-detail-page customer-detail-missing" dir={direction}>
        <UserRound size={38} />
        <h2>{t.customerMissing}</h2>
        <button type="button" onClick={() => navigate("/customer-registry")}><ArrowLeft size={17} />{t.back}</button>
      </div>
    );
  }

  const balanceState = currentBalance > 0 ? "receivable" : currentBalance < 0 ? "owe" : "settled";
  const balanceLabel = currentBalance > 0 ? t.customerOwes : currentBalance < 0 ? t.youOweCustomer : t.settled;
  const customerName = customer.fullName || customer.companyName || "—";
  const customerTypeLabel = customer.customerType === "business" ? t.business : t.individual;
  const fullAddress = [customer.address, customer.city, customer.province, customer.country].filter(Boolean).join(", ") || "—";

  const paymentModal = showPayment ? (
    <div className="customer-payment-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closePaymentModal()}>
      <section className="customer-payment-modal" role="dialog" aria-modal="true" aria-labelledby="customer-payment-title" dir={direction}>
        <div className="customer-payment-modal-header">
          <div>
            <div className="customer-payment-title-line"><Wallet size={22} /><h2 id="customer-payment-title">{t.paymentTitle}</h2></div>
            <p>{t.paymentHint}</p>
          </div>
          <button type="button" onClick={closePaymentModal} aria-label={t.cancel}><X size={19} /></button>
        </div>
        <form className="customer-payment-form" onSubmit={savePayment}>
          <div className="customer-payment-card">
            <div className="customer-payment-grid">
              <label>
                <span><CalendarDays size={15} />{t.paymentDate}</span>
                <ShamsiDateInput value={paymentForm.date} onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))} />
              </label>
              <label>
                <span><BadgeDollarSign size={15} />{t.amount}</span>
                <input autoFocus type="number" min="0" step="any" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} />
              </label>
              <label className="customer-payment-full">
                <span><FileText size={15} />{t.paymentDescription}</span>
                <textarea rows="4" value={paymentForm.description} placeholder={t.descriptionPlaceholder} onChange={(e) => setPaymentForm((prev) => ({ ...prev, description: e.target.value }))} />
              </label>
            </div>
          </div>
          <div className="customer-payment-actions">
            <button type="button" className="secondary" onClick={closePaymentModal}>{t.cancel}</button>
            <button type="submit" className="primary">{t.savePayment}</button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  return (
    <div className="customer-detail-page" dir={direction}>
      <div className="customer-detail-hero">
        <div className="customer-detail-hero-main">
          <button type="button" className="customer-detail-back" onClick={() => navigate("/customer-registry")}><ArrowLeft size={16} />{t.back}</button>
          <div className="customer-detail-profile">
            <span className="customer-detail-avatar"><UserRound size={28} /></span>
            <div>
              <span className="customer-detail-kicker">{t.title}</span>
              <h1>{customerName}</h1>
              <p>{t.subtitle}</p>
            </div>
          </div>
        </div>
        <button type="button" className="customer-detail-payment-btn" onClick={openPaymentModal}><Wallet size={18} />{t.payment}</button>
      </div>

      <div className="customer-detail-stat-grid">
        <article className="customer-detail-stat"><span className="icon sale"><ShoppingCart size={19} /></span><div><small>{t.totalSales}</small><strong>{totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
        <article className="customer-detail-stat"><span className="icon payment"><Wallet size={19} /></span><div><small>{t.totalPayments}</small><strong>{totalPayments.toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
        <article className={`customer-detail-stat balance ${balanceState}`}><span className="icon"><BadgeDollarSign size={19} /></span><div><small>{t.currentBalance}</small><strong>{Math.abs(currentBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong></div></article>
      </div>

      <div className="customer-detail-layout">
        <aside className="customer-detail-info-card">
          <div className="customer-detail-section-head"><UserRound size={18} /><div><h2>{t.customerInfo}</h2><p>{customerName}</p></div></div>
          <div className="customer-detail-info-list">
            <div><span><Building2 size={15} />{t.customerType}</span><strong>{customerTypeLabel}</strong></div>
            <div><span><Phone size={15} />{t.phone}</span><strong dir="ltr">{customer.phone || "—"}</strong></div>
            <div><span><Phone size={15} />{t.altPhone}</span><strong dir="ltr">{customer.alternatePhone || customer.phone2 || "—"}</strong></div>
            <div><span><Mail size={15} />{t.email}</span><strong>{customer.email || "—"}</strong></div>
            {customer.customerType === "business" && <div><span><Building2 size={15} />{t.company}</span><strong>{customer.companyName || "—"}</strong></div>}
            <div><span><MapPin size={15} />{t.address}</span><strong>{fullAddress}</strong></div>
            <div><span><Wallet size={15} />{t.openingBalance}</span><strong>{numeric(customer.openingBalance).toLocaleString()} {currencyCode}</strong></div>
            <div><span><BadgeDollarSign size={15} />{t.creditLimit}</span><strong>{numeric(customer.creditLimit).toLocaleString()} {currencyCode}</strong></div>
            <div className="notes"><span><FileText size={15} />{t.notes}</span><strong>{customer.notes || "—"}</strong></div>
          </div>
        </aside>

        <section className="customer-detail-ledger-card">
          <div className="customer-detail-section-head ledger"><ReceiptText size={18} /><div><h2>{t.transactions}</h2><p>{ledger.length} {t.transactions}</p></div></div>
          <div className="customer-detail-ledger-wrap">
            <table>
              <thead><tr><th>{t.date}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.debit}</th><th>{t.credit}</th><th>{t.balance}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {ledger.length ? ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.date)}</td>
                    <td><span className="customer-ledger-reference">{entry.reference || "—"}</span></td>
                    <td><span className={`customer-ledger-description ${entry.kind || ""}`}>{entry.description}</span></td>
                    <td className="customer-ledger-debit">{entry.debit ? entry.debit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</td>
                    <td className="customer-ledger-credit">{entry.credit ? entry.credit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</td>
                    <td className={entry.balance > 0 ? "customer-ledger-balance receivable" : entry.balance < 0 ? "customer-ledger-balance owe" : "customer-ledger-balance"}>{Math.abs(entry.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>
                      <div className="customer-ledger-actions">
                        {entry.kind === "manual-payment" && <button type="button" className="edit" onClick={() => editLedgerEntry(entry)} aria-label={t.edit} title={t.edit}><Edit3 size={14} /></button>}
                        {entry.kind === "manual-payment" && <button type="button" className="delete" onClick={() => deleteLedgerEntry(entry)} aria-label={t.delete} title={t.delete}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="customer-ledger-empty">{t.noTransactions}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className={`customer-detail-result ${balanceState}`}>
            <div><span>{balanceLabel}</span><small>{t.currentBalance}</small></div>
            <strong>{Math.abs(currentBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} <em>{currencyCode}</em></strong>
          </div>
        </section>
      </div>

      {showPayment && createPortal(paymentModal, document.body)}
    </div>
  );
}
