import { useEffect, useMemo, useState } from "react";
import { ChevronRight, CircleDollarSign, ReceiptText, Search, UserRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./Payables.css";

const languageKey = "afghan-power-language";
const num = (value) => Number(value || 0);
const money = (value) => Math.max(Number(value || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const normalizeCurrency = (value) => {
  const code = String(value || "AFN").toUpperCase();
  if (code.includes("USD")) return "USD";
  if (code.includes("EUR")) return "EUR";
  if (code.includes("INR")) return "INR";
  return "AFN";
};

const tr = {
  en: {
    title: "Receivables",
    subtitle: "Customers who still owe money for medicines or goods sold to them.",
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
    details: "Details",
    noData: "No outstanding receivables",
    settled: "All customer balances are currently settled.",
  },
  fa: {
    title: "طلبات",
    subtitle: "مشتریانی که از فروش دوا یا اجناس هنوز برای ما بدهکار هستند.",
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
    details: "معلومات",
    noData: "هیچ طلب باقی‌مانده نیست",
    settled: "در حال حاضر حساب تمام مشتریان تصفیه است.",
  },
  ps: {
    title: "طلبات",
    subtitle: "هغه پېرودونکي چې د پلورل شوو درملو یا توکو پیسې یې لا بشپړې نه دي ورکړې.",
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
    details: "معلومات",
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
  const [customerPayments] = useJsonCollection("customerPayments");
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

  const rows = useMemo(() => customers.map((customer) => {
    const id = String(customer.id);
    const customerSales = sales.filter((sale) => String(sale.customerId) === id);
    const returns = saleReturns.filter((row) => String(row.customerId) === id);
    const payments = customerPayments.filter((row) => String(row.customerId) === id);
    const totalSold = customerSales.reduce((sum, sale) => sum + Math.max(num(sale.totalAmount), 0), 0);
    const paidAtSale = customerSales.reduce((sum, sale) => sum + Math.max(num(sale.paidAmount), 0), 0);
    const laterPaid = payments.reduce((sum, payment) => sum + Math.max(num(payment.amount), 0), 0);
    const returned = returns.reduce((sum, row) => sum + Math.max(num(row.totalAmount), 0), 0);
    const openingDebit = Math.max(num(customer.openingBalance), 0);
    const openingCredit = Math.max(-num(customer.openingBalance), 0);
    const totalPaid = paidAtSale + laterPaid + returned + openingCredit;
    const balance = Math.max(openingDebit + totalSold - totalPaid, 0);
    return {
      customer,
      invoiceCount: customerSales.length,
      totalSold,
      totalPaid: paidAtSale + laterPaid,
      balance,
      currency: normalizeCurrency(customer.currency || customerSales[0]?.currency),
    };
  }).filter((row) => row.balance > 0.000001), [customers, sales, saleReturns, customerPayments]);

  const totals = rows.reduce((acc, row) => {
    acc.sales += row.totalSold;
    acc.paid += row.totalPaid;
    acc.balance += row.balance;
    return acc;
  }, { sales: 0, paid: 0, balance: 0 });

  const filteredRows = rows.filter(({ customer }) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${customer.fullName || ""} ${customer.companyName || ""} ${customer.phone || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="payables-page" dir={direction}>
      <header className="payables-header">
        <div>
          <div className="payables-title-line"><WalletCards size={24} /><h1>{t.title}</h1></div>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <section className="payables-stats">
        <article className="payables-stat-card"><span>{t.customers}</span><strong>{rows.length}</strong><span className="payables-stat-icon"><UserRound size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalSales}</span><strong>{money(totals.sales)}</strong><span className="payables-stat-icon"><ReceiptText size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalPaid}</span><strong>{money(totals.paid)}</strong><span className="payables-stat-icon"><CircleDollarSign size={17} /></span></article>
        <article className="payables-stat-card is-due"><span>{t.totalDue}</span><strong>{money(totals.balance)}</strong><span className="payables-stat-icon"><WalletCards size={17} /></span></article>
      </section>

      <section className="payables-card">
        <div className="payables-toolbar">
          <label className="payables-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></label>
        </div>
        <div className="payables-table-wrap">
          <table className="payables-table">
            <thead><tr><th>{t.customer}</th><th>{t.phone}</th><th>{t.invoices}</th><th>{t.sold}</th><th>{t.paid}</th><th>{t.balance}</th><th>{t.currency}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredRows.map(({ customer, invoiceCount, totalSold, totalPaid, balance, currency }) => {
                const name = customer.fullName || customer.companyName || "—";
                return (
                  <tr key={customer.id}>
                    <td><div className="payables-supplier-cell"><span className="payables-supplier-icon"><UserRound size={15} /></span><div><strong>{name}</strong><small>{customer.companyName && customer.companyName !== name ? customer.companyName : ""}</small></div></div></td>
                    <td className="payables-phone">{customer.phone || "—"}</td>
                    <td>{invoiceCount}</td>
                    <td>{money(totalSold)}</td>
                    <td>{money(totalPaid)}</td>
                    <td><span className="payables-balance-pill">{money(balance)}</span></td>
                    <td><span className="payables-currency-pill">{currency}</span></td>
                    <td><button type="button" className="payables-detail-btn" onClick={() => navigate(`/customer-detail/${customer.id}`)} title={t.details}><span>{t.details}</span><ChevronRight size={14} /></button></td>
                  </tr>
                );
              })}
              {!filteredRows.length && <tr><td colSpan="8" className="payables-empty"><WalletCards size={30} /><strong>{t.noData}</strong><span>{t.settled}</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
