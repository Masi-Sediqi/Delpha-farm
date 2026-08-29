import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  MoreHorizontal,
  Printer,
  ReceiptText,
  Search,
  Truck,
  WalletCards,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./Payables.css";

const languageKey = "afghan-power-language";
const numeric = (value) => Number(value || 0) || 0;

const translations = {
  en: {
    title: "Payables",
    subtitle: "Suppliers with unpaid purchase balances are listed here.",
    search: "Search supplier, phone or currency...",
    suppliersDue: "Suppliers Due",
    totalPurchases: "Total Purchases",
    totalPaid: "Total Paid",
    outstanding: "Outstanding",
    supplier: "Supplier",
    phone: "Phone",
    purchases: "Purchases",
    purchased: "Purchased",
    paid: "Paid",
    balance: "Balance Due",
    currency: "Currency",
    actions: "Actions",
    details: "Details",
    menu: "Actions",
    pay: "Payment",
    makePaid: "Make as Paid",
    print: "Print",
    bill: "Bill",
    paidSuccess: "Supplier balance marked as paid.",
    makePaidTitle: "Mark supplier balance as paid?",
    makePaidMessage: "This will record a payment for the full outstanding balance.",
    confirm: "Confirm",
    cancel: "Cancel",
    noData: "No unpaid supplier balances were found.",
    settled: "All supplier accounts are currently settled.",
  },
  fa: {
    title: "تادیات",
    subtitle: "تأمین‌کننده‌هایی که پول خریداری‌های شان هنوز مکمل پرداخت نشده در اینجا نمایش داده می‌شوند.",
    search: "جستجوی تأمین‌کننده، شماره تماس یا ارز...",
    suppliersDue: "تأمین‌کننده بدهکار",
    totalPurchases: "مجموع خریداری",
    totalPaid: "مجموع پرداخت",
    outstanding: "مجموع باقی‌مانده",
    supplier: "تأمین‌کننده",
    phone: "شماره تماس",
    purchases: "تعداد خریداری",
    purchased: "مجموع خرید",
    paid: "پرداخت‌شده",
    balance: "باقی / قابل پرداخت",
    currency: "واحد پول",
    actions: "عملیات",
    details: "معلومات",
    menu: "عملیات",
    pay: "پرداخت",
    makePaid: "پرداخت مکمل",
    print: "چاپ",
    bill: "بل",
    paidSuccess: "حساب تأمین‌کننده مکمل پرداخت شد.",
    makePaidTitle: "حساب تأمین‌کننده مکمل پرداخت شود؟",
    makePaidMessage: "به اندازه تمام باقی‌مانده یک پرداخت جدید ثبت می‌شود.",
    confirm: "تأیید",
    cancel: "لغو",
    noData: "هیچ حساب پرداخت‌نشده‌ای برای تأمین‌کننده‌ها وجود ندارد.",
    settled: "فعلاً حساب تمام تأمین‌کننده‌ها تصفیه است.",
  },
  ps: {
    title: "تادیات",
    subtitle: "هغه عرضه کوونکي چې د پېرود پیسې یې لا بشپړې نه دي ورکړل شوې دلته ښودل کېږي.",
    search: "عرضه کوونکی، د اړیکې شمېره یا اسعار ولټوئ...",
    suppliersDue: "پاتې عرضه کوونکي",
    totalPurchases: "ټول پېرود",
    totalPaid: "ټولې ورکړې",
    outstanding: "ټولې پاتې پیسې",
    supplier: "عرضه کوونکی",
    phone: "د اړیکې شمېره",
    purchases: "د پېرود شمېر",
    purchased: "د پېرود مجموعه",
    paid: "ورکړل شوي",
    balance: "پاتې / ورکول کېدونکي",
    currency: "اسعار",
    actions: "عملیات",
    details: "معلومات",
    menu: "عملیات",
    pay: "تادیه",
    makePaid: "بشپړ تادیه",
    print: "چاپ",
    bill: "بل",
    paidSuccess: "د عرضه کوونکي حساب بشپړ تادیه شو.",
    makePaidTitle: "د عرضه کوونکي حساب بشپړ تادیه شي؟",
    makePaidMessage: "د ټول پاتې مبلغ په اندازه نوې تادیه ثبتېږي.",
    confirm: "تایید",
    cancel: "لغوه",
    noData: "د عرضه کوونکو لپاره هېڅ پاتې حساب نشته.",
    settled: "اوس مهال د ټولو عرضه کوونکو حسابونه تصفیه دي.",
  },
};

function currencyCode(supplier) {
  const raw = String(supplier?.currency || supplier?.currencyCode || "AFN").toUpperCase();
  if (raw.includes("USD")) return "USD";
  if (raw.includes("EUR")) return "EUR";
  if (raw.includes("INR")) return "INR";
  return "AFN";
}

export default function Payables() {
  const navigate = useNavigate();
  const [suppliers] = useJsonCollection("suppliers");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [supplierPayments, setSupplierPayments] = useJsonCollection("supplierPayments");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");
  const [search, setSearch] = useState("");
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "fa");
    window.addEventListener("storage", syncLanguage);
    window.addEventListener("languagechange", syncLanguage);
    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("languagechange", syncLanguage);
    };
  }, []);


  useEffect(() => {
    if (!actionMenu) return undefined;
    const close = () => setActionMenu(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [actionMenu]);
  const t = translations[language] || translations.fa;

  const rows = useMemo(() => {
    return suppliers
      .map((supplier) => {
        const supplierId = String(supplier.id);
        const supplierPurchases = purchases.filter((item) => String(item.supplierId) === supplierId);
        const supplierReturns = purchaseReturns.filter((item) => String(item.supplierId) === supplierId);
        const manualPayments = supplierPayments.filter((item) => String(item.supplierId) === supplierId);

        const totalPurchased = supplierPurchases.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
        const paidAtPurchase = supplierPurchases.reduce((sum, item) => sum + numeric(item.paidAmount), 0);
        const paidLater = manualPayments.reduce((sum, item) => sum + numeric(item.amount), 0);
        const returned = supplierReturns.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
        const opening = numeric(supplier.openingBalance);
        const totalPaid = paidAtPurchase + paidLater + returned + Math.max(-opening, 0);
        const balance = Math.max(totalPurchased + Math.max(opening, 0) - paidAtPurchase - paidLater - returned, 0);

        const unpaidPurchases = supplierPurchases
          .map((purchase) => ({
            ...purchase,
            calculatedRemaining: Math.max(numeric(purchase.remainingAmount ?? (numeric(purchase.totalAmount) - numeric(purchase.paidAmount))), 0),
          }))
          .filter((purchase) => purchase.calculatedRemaining > 0.0001)
          .sort((a, b) => new Date(a.purchaseDate || a.createdAt || 0) - new Date(b.purchaseDate || b.createdAt || 0));
        const focusPurchase = unpaidPurchases[0] || supplierPurchases[supplierPurchases.length - 1] || null;

        return {
          supplier,
          purchaseCount: supplierPurchases.length,
          totalPurchased,
          totalPaid,
          balance,
          currency: currencyCode(supplier),
          focusPurchase,
        };
      })
      .filter((item) => item.balance > 0.0001)
      .sort((a, b) => b.balance - a.balance);
  }, [suppliers, purchases, purchaseReturns, supplierPayments]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ supplier, currency }) =>
      [supplier.name, supplier.supplierName, supplier.contactPerson, supplier.phone, supplier.phoneNumber, currency]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalsByCurrency = useMemo(() => {
    const result = {};
    rows.forEach((row) => {
      const code = row.currency;
      if (!result[code]) result[code] = { purchased: 0, paid: 0, balance: 0 };
      result[code].purchased += row.totalPurchased;
      result[code].paid += row.totalPaid;
      result[code].balance += row.balance;
    });
    return result;
  }, [rows]);

  const totalText = (field) =>
    Object.entries(totalsByCurrency)
      .filter(([, values]) => values[field] > 0)
      .map(([code, values]) => `${code} ${values[field].toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
      .join(" · ") || "—";


  const openSupplierLedger = (row, openPayment = false) => {
    const purchaseId = row.focusPurchase?.id || "";
    navigate(`/supplier-detail/${row.supplier.id}?highlightPurchase=${encodeURIComponent(purchaseId)}`, {
      state: { openPayment, highlightPurchaseId: purchaseId },
    });
  };

  const openActions = (event, row) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 150;
    const height = 156;
    const gap = 5;
    const below = window.innerHeight - rect.bottom > height + 12;
    const top = below ? rect.bottom + gap : Math.max(8, rect.top - height - gap);
    let left = rect.left;
    if (document.documentElement.dir === "rtl" || language !== "en") left = rect.right - width;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setActionMenu({ row, top, left });
  };

  const makeAsPaid = async (row) => {
    const ok = await confirmAction({
      title: t.makePaidTitle,
      message: t.makePaidMessage,
      confirmText: t.confirm,
      cancelText: t.cancel,
    });
    if (!ok) return;
    const now = new Date();
    const record = {
      id: `SPAY-${Date.now()}`,
      supplierId: row.supplier.id,
      supplierName: row.supplier.name || row.supplier.supplierName || "",
      date: now.toISOString().slice(0, 10),
      amount: row.balance,
      description: t.makePaid,
      reference: `PAY-${String(Date.now()).slice(-7)}`,
      createdAt: now.toISOString(),
    };
    const saved = await setSupplierPayments([record, ...supplierPayments]);
    if (saved) notify(t.paidSuccess, "success");
  };

  return (
    <section className="payables-page">
      <div className="payables-header">
        <div>
          <div className="payables-title-line">
            <BadgeDollarSign size={24} strokeWidth={1.9} />
            <h1>{t.title}</h1>
          </div>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="payables-stats">
        <article className="payables-stat-card">
          <div className="payables-stat-icon"><Truck size={19} /></div>
          <span>{t.suppliersDue}</span>
          <strong>{rows.length}</strong>
        </article>
        <article className="payables-stat-card">
          <div className="payables-stat-icon"><Building2 size={19} /></div>
          <span>{t.totalPurchases}</span>
          <strong>{totalText("purchased")}</strong>
        </article>
        <article className="payables-stat-card">
          <div className="payables-stat-icon"><CreditCard size={19} /></div>
          <span>{t.totalPaid}</span>
          <strong>{totalText("paid")}</strong>
        </article>
        <article className="payables-stat-card is-due">
          <div className="payables-stat-icon"><WalletCards size={19} /></div>
          <span>{t.outstanding}</span>
          <strong>{totalText("balance")}</strong>
        </article>
      </div>

      <div className="payables-card">
        <div className="payables-toolbar">
          <label className="payables-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
          </label>
        </div>

        <div className="payables-table-wrap">
          <table className="payables-table">
            <thead>
              <tr>
                <th>{t.supplier}</th>
                <th>{t.phone}</th>
                <th>{t.purchases}</th>
                <th>{t.purchased}</th>
                <th>{t.paid}</th>
                <th>{t.balance}</th>
                <th>{t.currency}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const { supplier, purchaseCount, totalPurchased, totalPaid, balance, currency } = row;
                const supplierName = supplier.name || supplier.supplierName || "—";
                const phone = supplier.phone || supplier.phoneNumber || "—";
                return (
                  <tr key={supplier.id} className="payables-clickable-row" onClick={() => openSupplierLedger(row)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openSupplierLedger(row); }}>
                    <td>
                      <div className="payables-supplier-cell">
                        <span className="payables-supplier-icon"><Truck size={15} /></span>
                        <div>
                          <strong>{supplierName}</strong>
                          <small>{supplier.contactPerson || ""}</small>
                        </div>
                      </div>
                    </td>
                    <td className="payables-phone">{phone}</td>
                    <td>{purchaseCount}</td>
                    <td>{totalPurchased.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td><span className="payables-balance-pill">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></td>
                    <td><span className="payables-currency-pill">{currency}</span></td>
                    <td className="payables-actions-cell" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="payables-action-trigger"
                        onClick={(event) => openActions(event, row)}
                        title={t.menu}
                        aria-label={`${t.menu} ${supplierName}`}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filteredRows.length && (
                <tr>
                  <td colSpan="8" className="payables-empty">
                    <WalletCards size={30} />
                    <strong>{t.noData}</strong>
                    <span>{t.settled}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionMenu && createPortal(
        <div className="payables-action-popover" style={{ top: actionMenu.top, left: actionMenu.left }} role="menu">
          <button type="button" role="menuitem" onClick={() => { const row = actionMenu.row; setActionMenu(null); openSupplierLedger(row, true); }}><CreditCard size={14} /><span>{t.pay}</span></button>
          <button type="button" role="menuitem" onClick={() => { const row = actionMenu.row; setActionMenu(null); makeAsPaid(row); }}><WalletCards size={14} /><span>{t.makePaid}</span></button>
          <button type="button" role="menuitem" onClick={() => { const purchase = actionMenu.row.focusPurchase; setActionMenu(null); if (purchase) navigate(`/purchasing/${purchase.id}/print`); }} disabled={!actionMenu.row.focusPurchase}><Printer size={14} /><span>{t.print}</span></button>
          <button type="button" role="menuitem" onClick={() => { const purchase = actionMenu.row.focusPurchase; setActionMenu(null); if (purchase) navigate(`/purchasing/${purchase.id}`); }} disabled={!actionMenu.row.focusPurchase}><ReceiptText size={14} /><span>{t.bill}</span></button>
        </div>,
        document.body
      )}
    </section>
  );
}
