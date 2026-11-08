import { partyAccountRows } from "../utils/partyAccounts";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CircleDollarSign, CreditCard, MoreHorizontal, Printer, ReceiptText, Search, UserRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./Payables.css";

const languageKey = "afghan-power-language";
const money = (value) => Math.max(Number(value || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const tr = {
  en: {
    title: "Receivables",
    subtitle: "Customer accounts linked to sales, collections and cash journal entries.",
    customers: "Customers with balance",
    totalSales: "Total sales",
    totalPaid: "Total received",
    totalDue: "Total receivable",
    search: "Search customer, phone or company...",
    customer: "Customer",
    phone: "Phone",
    invoices: "Sales",
    sold: "Total sold",
    paid: "Received",
    balance: "Receivable",
    currency: "Currency",
    actions: "Actions",
    menu: "Actions",
    registerReceivables: "Collect Receivables",
    receive: "Receive",
    markReceived: "Mark as Received",
    print: "Print",
    bill: "Bill",
    receivedSuccess: "Customer balance marked as received.",
    markReceivedTitle: "Mark customer balance as received?",
    markReceivedMessage: "This will record a receipt for the full outstanding balance.",
    confirm: "Confirm",
    cancel: "Cancel",
    noData: "No outstanding receivables",
    settled: "All customer balances are currently settled.",
  },
  fa: {
    title: "طلبات",
    subtitle: "حساب مشتریان، فروشات، دریافت‌ها و گردش روزنامچه",
    customers: "مشتریان بدهکار",
    totalSales: "مجموع فروش",
    totalPaid: "مجموع دریافت‌شده",
    totalDue: "مجموع طلب",
    search: "جستجوی مشتری، شماره تماس یا کمپنی...",
    customer: "مشتری",
    phone: "شماره تماس",
    invoices: "تعداد فروش",
    sold: "مجموع فروش",
    paid: "دریافت‌شده",
    balance: "باقی طلب",
    currency: "واحد پول",
    actions: "عملیات",
    menu: "عملیات",
    registerReceivables: "ثبت طلبات",
    receive: "دریافت",
    markReceived: "دریافت مکمل",
    print: "پرنت",
    bill: "بل",
    receivedSuccess: "حساب مشتری مکمل دریافت شد.",
    markReceivedTitle: "حساب مشتری مکمل دریافت شود؟",
    markReceivedMessage: "به اندازه تمام باقی‌مانده یک دریافت جدید ثبت می‌شود.",
    confirm: "تأیید",
    cancel: "لغو",
    noData: "هیچ طلب باقی‌مانده نیست",
    settled: "در حال حاضر حساب تمام مشتریان تصفیه است.",
  },
  ps: {
    title: "طلبات",
    subtitle: "د پېرودونکو حسابونه، خرڅلاو، ترلاسه شوې پیسې او د نغدي روزنامچې راکړه ورکړه.",
    customers: "پور لرونکي پېرودونکي",
    totalSales: "ټول خرڅلاو",
    totalPaid: "ترلاسه شوې پیسې",
    totalDue: "ټول طلب",
    search: "د پېرودونکي، تلیفون یا شرکت لټون...",
    customer: "پېرودونکی",
    phone: "تلیفون",
    invoices: "خرڅلاو",
    sold: "ټول خرڅلاو",
    paid: "ترلاسه شوي",
    balance: "پاتې طلب",
    currency: "اسعار",
    actions: "کړنې",
    menu: "عملیات",
    registerReceivables: "د طلباتو ثبت",
    receive: "ترلاسه کول",
    markReceived: "بشپړ ترلاسه کول",
    print: "چاپ",
    bill: "بل",
    receivedSuccess: "د پېرودونکي حساب بشپړ ترلاسه شو.",
    markReceivedTitle: "د پېرودونکي حساب بشپړ ترلاسه شي؟",
    markReceivedMessage: "د ټول پاتې مبلغ په اندازه نوی ترلاسه کول ثبتېږي.",
    confirm: "تایید",
    cancel: "لغوه",
    noData: "هیڅ پاتې طلب نشته",
    settled: "اوس د ټولو پېرودونکو حسابونه تصفیه دي.",
  },
};

export default function Receivables() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [customerPayments, setCustomerPayments] = useJsonCollection("customerPayments");
  const [partyCashTransactions] = useJsonCollection("partyCashTransactions");
  const [search, setSearch] = useState("");
  const [actionMenu, setActionMenu] = useState(null);
  const t = tr[language] || tr.en;
  const direction = language === "en" ? "ltr" : "rtl";

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
    if (!actionMenu) return undefined;
    const close = () => setActionMenu(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [actionMenu]);

  const rows = useMemo(() => partyAccountRows({type:"customer",parties:customers,invoices:sales,returns:saleReturns,payments:customerPayments,journal:partyCashTransactions}).map(row=>({customer:row.party,invoiceCount:row.invoices.length,totalSold:row.total,totalPaid:row.paid,balance:row.balance,currency:row.currency,focusSale:row.focusInvoice})), [customers,sales,saleReturns,customerPayments,partyCashTransactions]);
  const totalText = field => [...new Set(rows.map(row=>row.currency))].map(code=>`${rows.filter(row=>row.currency===code).reduce((sum,row)=>sum+(field==="balance"?Math.max(row[field],0):row[field]),0).toLocaleString(undefined,{maximumFractionDigits:2})} ${code}`).join(" · ") || "—";

  const filteredRows = rows.filter(({ customer }) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${customer.fullName || ""} ${customer.companyName || ""} ${customer.phone || ""}`.toLowerCase().includes(q);
  });

  const openCustomerLedger = (row, openPayment = false) => {
    navigate(`/customer-detail/${row.customer.id}`, { state: { openPayment, paymentCurrency: row.currency } });
  };

  const openMenu = (event, payload) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 150;
    const height = 156;
    const gap = 5;
    const below = window.innerHeight - rect.bottom > height + 12;
    const top = below ? rect.bottom + gap : Math.max(8, rect.top - height - gap);
    let left = direction === "rtl" ? rect.right - width : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setActionMenu({ payload, top, left });
  };

  const markAsReceived = async (row) => {
    if (row.balance <= 0) return;
    const ok = await confirmAction({
      title: t.markReceivedTitle,
      message: t.markReceivedMessage,
      confirmText: t.confirm,
      cancelText: t.cancel,
    });
    if (!ok) return;
    const now = new Date();
    const record = {
      id: `CPAY-${Date.now()}`,
      customerId: row.customer.id,
      customerName: row.customer.fullName || row.customer.companyName || "",
      date: now.toISOString().slice(0, 10),
      amount: row.balance,
      currency: row.currency,
      description: t.markReceived,
      reference: `REC-${String(Date.now()).slice(-7)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    if (await setCustomerPayments([record, ...customerPayments])) notify(t.receivedSuccess, "success");
  };

  return (
    <div className="payables-page" dir={direction}>
      <header className="payables-header">
        <div>
          <div className="payables-title-line"><WalletCards size={24} /><h1>{t.title}</h1></div>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <section className="payables-stats">
        <article className="payables-stat-card"><span>{t.customers}</span><strong>{rows.filter(row=>row.balance>0).length}</strong><span className="payables-stat-icon"><UserRound size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalSales}</span><strong>{totalText("totalSold")}</strong><span className="payables-stat-icon"><ReceiptText size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalPaid}</span><strong>{totalText("totalPaid")}</strong><span className="payables-stat-icon"><CircleDollarSign size={17} /></span></article>
        <article className="payables-stat-card is-due"><span>{t.totalDue}</span><strong>{totalText("balance")}</strong><span className="payables-stat-icon"><WalletCards size={17} /></span></article>
      </section>

      <section className="payables-card">
        <div className="payables-toolbar">
          <label className="payables-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></label>
        </div>
        <div className="payables-table-wrap">
          <table className="payables-table">
            <thead><tr><th>{t.customer}</th><th>{t.phone}</th><th>{t.invoices}</th><th>{t.sold}</th><th>{t.paid}</th><th>{t.balance}</th><th>{t.currency}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => {
                const { customer, invoiceCount, totalSold, totalPaid, balance, currency } = row;
                const name = customer.fullName || customer.companyName || "—";
                return (
                  <tr key={`${customer.id}-${currency}`} className="payables-clickable-row" onClick={() => openCustomerLedger(row)}>
                    <td><div className="payables-supplier-cell"><span className="payables-supplier-icon"><UserRound size={15} /></span><div><strong>{name}</strong><small>{customer.companyName && customer.companyName !== name ? customer.companyName : ""}</small></div></div></td>
                    <td className="payables-phone">{customer.phone || "—"}</td>
                    <td>{invoiceCount}</td>
                    <td>{money(totalSold)}</td>
                    <td>{money(totalPaid)}</td>
                    <td><span className="payables-balance-pill">{Number(balance).toLocaleString(undefined,{maximumFractionDigits:2})}</span></td>
                    <td><span className="payables-currency-pill">{currency}</span></td>
                    <td className="payables-actions-cell" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="payables-action-trigger" onClick={(event) => openMenu(event, row)} aria-label={t.menu} title={t.menu}><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                );
              })}
              {!filteredRows.length && <tr><td colSpan="8" className="payables-empty"><WalletCards size={30} /><strong>{t.noData}</strong><span>{t.settled}</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {actionMenu && createPortal(
        <div className="payables-action-popover" style={{ top: actionMenu.top, left: actionMenu.left }}>
          <button type="button" onClick={() => { const row = actionMenu.payload; setActionMenu(null); openCustomerLedger(row, true); }}><CreditCard size={14} /><span>{t.receive}</span></button>
          <button type="button" disabled={actionMenu.payload.balance<=0} onClick={() => { const row = actionMenu.payload; setActionMenu(null); markAsReceived(row); }}><WalletCards size={14} /><span>{t.markReceived}</span></button>
          <button type="button" disabled={!actionMenu.payload.focusSale} onClick={() => { const sale = actionMenu.payload.focusSale; setActionMenu(null); if (sale) navigate(`/sale-detail/${sale.id}/print`); }}><Printer size={14} /><span>{t.print}</span></button>
          <button type="button" disabled={!actionMenu.payload.focusSale} onClick={() => { const sale = actionMenu.payload.focusSale; setActionMenu(null); if (sale) navigate(`/sale-detail/${sale.id}`); }}><ReceiptText size={14} /><span>{t.bill}</span></button>
        </div>,
        document.body
      )}
    </div>
  );
}
