import { useAccountStatementFilters } from "../hooks/useAccountStatementFilters";
import AccountStatementTools from "../components/AccountStatementTools";
import { partyAccountRows } from "../utils/partyAccounts";
import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, CreditCard, ReceiptText, Search, UserRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./Payables.css";

const languageKey = "afghan-power-language";
const tr = {
  en: {
    title: "Receivables",
    subtitle: "Customer accounts linked to sales, collections and cash journal entries.",
    customers: "Customers with balance",
    totalSales: "Total sales",
    totalPaid: "Total received",
    totalDue: "Total receivable",
    totalCustomerCredit: "Total owed to customers",
    search: "Search customer, phone or company...",
    customer: "Customer",
    balance: "Receivable",
    balanceSide: "Balance status",
    ourReceivable: "Our receivable",
    customerReceivable: "Customer receivable",
    currency: "Currency",
    noData: "No customer balances",
    settled: "No customer receivables or credits to display.",
  },
  fa: {
    title: "طلبات",
    subtitle: "حساب مشتریان، فروشات، دریافت‌ها و گردش روزنامچه",
    customers: "مشتریان بدهکار",
    totalSales: "مجموع فروش",
    totalPaid: "مجموع دریافت‌شده",
    totalDue: "مجموع طلب",
    totalCustomerCredit: "مجموع طلب مشتریان از ما",
    search: "جستجوی مشتری، شماره تماس یا کمپنی...",
    customer: "مشتری",
    balance: "باقی طلب",
    balanceSide: "حالت طلب",
    ourReceivable: "طلب ما",
    customerReceivable: "طلب مشتری",
    currency: "واحد پول",
    noData: "هیچ بیلانس مشتری موجود نیست",
    settled: "طلب مشتری یا طلب ما از مشتری برای نمایش وجود ندارد.",
  },
  ps: {
    title: "طلبات",
    subtitle: "د پېرودونکو حسابونه، خرڅلاو، ترلاسه شوې پیسې او د نغدي روزنامچې راکړه ورکړه.",
    customers: "پور لرونکي پېرودونکي",
    totalSales: "ټول خرڅلاو",
    totalPaid: "ترلاسه شوې پیسې",
    totalDue: "ټول طلب",
    totalCustomerCredit: "پېرودونکو ته ټول پور",
    search: "د پېرودونکي، تلیفون یا شرکت لټون...",
    customer: "پېرودونکی",
    balance: "پاتې طلب",
    balanceSide: "د طلب حالت",
    ourReceivable: "زموږ طلب",
    customerReceivable: "د پېرودونکي طلب",
    currency: "اسعار",
    noData: "د پېرودونکو بیلانس نشته",
    settled: "د پېرودونکي یا زموږ د طلب د ښودلو لپاره څه نشته.",
  },
};

export default function Receivables() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [partyCashTransactions] = useJsonCollection("partyCashTransactions");
  const [search, setSearch] = useState("");
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

  const rows = useMemo(() => partyAccountRows({type:"customer",parties:customers,invoices:sales,returns:saleReturns,payments:customerPayments,journal:partyCashTransactions}).filter(row=>Math.abs(Number(row.balance || 0))>0.000001).map(row=>({customer:row.party,invoiceCount:row.invoices.length,totalSold:row.total,totalPaid:row.paid,balance:row.balance,currency:row.currency,focusSale:row.focusInvoice})), [customers,sales,saleReturns,customerPayments,partyCashTransactions]);
  const totalText = field => [...new Set(rows.map(row=>row.currency))].map(code=>`${rows.filter(row=>row.currency===code).reduce((sum,row)=>sum+(field==="balance"?Math.max(row[field],0):field==="customerCredit"?Math.max(-row.balance,0):row[field]),0).toLocaleString("en-US",{maximumFractionDigits:2})} ${code}`).join(" · ") || "—";

  const accountFilters = useAccountStatementFilters(rows, "customer");
  const filteredRows = rows.filter(accountFilters.filter).filter(({ customer }) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${customer.fullName || ""} ${customer.companyName || ""} ${customer.phone || ""}`.toLowerCase().includes(q);
  });

  const openCustomerLedger = (row, openPayment = false) => {
    navigate(`/customer-detail/${row.customer.id}`, { state: { openPayment, paymentCurrency: row.currency } });
  };

  return (
    <div className="payables-page" dir={direction}>
      <header className="payables-header">
        <div>
          <div className="payables-title-line"><WalletCards size={24} /><h1>{t.title}</h1></div>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <section className="payables-stats receivables-stats">
        <article className="payables-stat-card"><span>{t.customers}</span><strong>{rows.length}</strong><span className="payables-stat-icon"><UserRound size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalSales}</span><strong>{totalText("totalSold")}</strong><span className="payables-stat-icon"><ReceiptText size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalPaid}</span><strong>{totalText("totalPaid")}</strong><span className="payables-stat-icon"><CircleDollarSign size={17} /></span></article>
        <article className="payables-stat-card is-due"><span>{t.totalDue}</span><strong>{totalText("balance")}</strong><span className="payables-stat-icon"><WalletCards size={17} /></span></article>
        <article className="payables-stat-card is-customer-credit"><span>{t.totalCustomerCredit}</span><strong>{totalText("customerCredit")}</strong><span className="payables-stat-icon"><CreditCard size={17} /></span></article>
      </section>

      <section className="payables-card">
        <div className="payables-toolbar">
          <label className="payables-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></label>
          <AccountStatementTools filters={accountFilters} rows={filteredRows} type="customer"/>
        </div>
        <div className="payables-table-wrap">
          <table className="payables-table">
            <thead><tr><th>{t.customer}</th><th>{t.balanceSide}</th><th>{t.balance}</th><th>{t.currency}</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => {
                const { customer, balance, currency } = row;
                const name = customer.fullName || customer.companyName || "—";
                return (
                  <tr key={`${customer.id}-${currency}`} className="payables-clickable-row" onClick={() => openCustomerLedger(row)}>
                    <td><div className="payables-supplier-cell"><span className="payables-supplier-icon"><UserRound size={15} /></span><div><strong>{name}</strong>{customer.companyName && customer.companyName !== name && <small>{customer.companyName}</small>}<small className="payables-phone">{customer.phone || "—"}</small></div></div></td>
                    <td><span className={`receivables-state-pill ${balance > 0 ? "is-ours" : "is-customer"}`}>{balance > 0 ? t.ourReceivable : t.customerReceivable}</span></td>
                    <td><span className={`payables-balance-pill ${balance < 0 ? "is-customer-credit" : ""}`}>{Math.abs(Number(balance)).toLocaleString("en-US",{maximumFractionDigits:2})}</span></td>
                    <td><span className="payables-currency-pill">{currency}</span></td>
                  </tr>
                );
              })}
              {!filteredRows.length && <tr><td colSpan="4" className="payables-empty"><WalletCards size={30} /><strong>{t.noData}</strong><span>{t.settled}</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
