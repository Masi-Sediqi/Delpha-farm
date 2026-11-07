import { accountReportRows, printAccountStatement, downloadAccountExcel, downloadAccountPDF } from "../utils/accountStatementExport";
import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Printer, ReceiptText, Search, UserRound, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Payables.css";

const languageKey = "afghan-power-language";
const num = (value) => Number(value || 0);
const money = (value) => Math.max(Number(value || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const normalizeCurrency = (value) => {
  const code = String(value || "AFN").toUpperCase();
  if (code.includes("USD")) return "USD";
  if (code.includes("EUR")) return "EUR";
  if (code.includes("PKR") || code.includes("PAK")) return "PKR";
  if (code.includes("INR")) return "INR";
  return "AFN";
};

const tr = {
  en: {
    title: "Receivables",
    subtitle: "Customers who still owe money for medicines or goods sold to them.",
    customers: "Customer accounts",
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
    subtitle: "مشتریانی که از فروش دوا یا اجناس هنوز برای ما بدهکار هستند.",
    customers: "حساب‌های مشتریان",
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
    subtitle: "هغه پېرودونکي چې د پلورل شوو درملو یا توکو پیسې یې لا بشپړې نه دي ورکړې.",
    customers: "د پېرودونکو حسابونه",
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
  const [customerPayments] = useJsonCollection("customerPayments");
  const [journalCash] = useJsonCollection("partyCashTransactions");
  const [search, setSearch] = useState("");
  const [selectedCurrency,setSelectedCurrency]=useState("ALL");
  const [selectedCategory,setSelectedCategory]=useState("ALL");
  const [showAll,setShowAll]=useState(true);
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

  const rows = useMemo(() => customers.flatMap((customer) => {
    const id = String(customer.id);
    const customerSales = sales.filter((sale) => String(sale.customerId) === id);
    const returns = saleReturns.filter((row) => String(row.customerId) === id);
    const payments = customerPayments.filter((row) => String(row.customerId) === id);
    const journal = journalCash.filter((item) => item.partyType === 'customer' && String(item.partyId) === id);
    const baseCurrency = normalizeCurrency(customer.currency);
    const currencies = new Set([baseCurrency]);
    [...customerSales,...returns,...payments,...journal].forEach(row=>currencies.add(normalizeCurrency(row.currency || baseCurrency)));
    return [...currencies].map(currency=>{
      const inUnit = (row) => normalizeCurrency(row.currency || baseCurrency) === currency;
      const cs = customerSales.filter(inUnit), cr = returns.filter(inUnit), cp = payments.filter(inUnit), cj=journal.filter(inUnit);
      const totalSold = cs.reduce((sum, sale) => sum + Math.max(num(sale.totalAmount), 0), 0);
      const paidAtSale = cs.reduce((sum, sale) => sum + Math.max(num(sale.paidAmount), 0), 0);
      const laterPaid = cp.reduce((sum, payment) => sum + Math.max(num(payment.amount), 0), 0);
      const returned = cr.reduce((sum, ret) => sum + Math.max(num(ret.totalAmount), 0), 0);
      const received = cj.filter(item=>item.direction==='in').reduce((sum,item)=>sum+Math.max(num(item.amount),0),0);
      const paidOut = cj.filter(item=>item.direction==='out').reduce((sum,item)=>sum+Math.max(num(item.amount),0),0);
      const opening = currency===baseCurrency ? num(customer.openingBalance) : 0;
      const debit = totalSold + paidOut + Math.max(opening,0);
      const credit = paidAtSale + laterPaid + received + returned + Math.max(-opening,0);
      const balance = Math.max(debit-credit,0);
      const unpaid = cs.filter(sale=>num(sale.remainingAmount ?? (num(sale.totalAmount)-num(sale.paidAmount)))>0.0001);
      return {customer, invoiceCount:cs.length, totalSold, totalPaid:paidAtSale+laterPaid+received, balance, currency, focusSale:unpaid[0]||cs[cs.length-1]||null};
    });
  }), [customers, sales, saleReturns, customerPayments, journalCash]);

  const totalsByCurrency=rows.reduce((acc,row)=>{
    const current=acc[row.currency]||(acc[row.currency]={sales:0,paid:0,balance:0});
    current.sales+=row.totalSold;current.paid+=row.totalPaid;current.balance+=row.balance;
    return acc;
  },{});
  const totalText=field=>Object.entries(totalsByCurrency).filter(([,value])=>value[field]>0).map(([currency,value])=>`${currency} ${money(value[field])}`).join(' · ')||'0';

  const categories = [...new Set(rows.map(({customer})=>String(customer.categoryName||customer.category||customer.customerType||'').trim()).filter(Boolean))].sort();
  const currencyOptions = [...new Set(rows.map(row=>row.currency))].sort();
  const filteredRows = rows.filter(({ customer, currency, balance }) => {
    const q = search.trim().toLowerCase();
    const category = String(customer.categoryName || customer.category || customer.customerType || '').trim();
    return (showAll || balance > 0.000001) && (selectedCurrency==='ALL'||currency===selectedCurrency) && (selectedCategory==='ALL'||category===selectedCategory) && (!q || `${customer.fullName||''} ${customer.companyName||''} ${customer.phone||''} ${customer.id||''} ${category}`.toLowerCase().includes(q));
  });

  const reportTitle = language==='en'?'Customer receivables':language==='ps'?'طلبات - د پېرودونکو حسابونه':'طلبات (صورت حساب)';
  const reportRows = (list)=>accountReportRows(list, 'customer');
  const reportAction = async (action, list) => {try {const data=reportRows(list);const name=`receivables-${new Date().toISOString().slice(0,10)}`;if(action==='excel') await downloadAccountExcel(data,name);else if(action==='pdf') await downloadAccountPDF(data,reportTitle,name);else printAccountStatement(data,reportTitle)}catch(error){console.error(error);notify(language==='en'?'Export failed':'خروجی آماده نشد. لطفاً دوباره تلاش کنید.','error')}};
  const openCustomerLedger = (row, openPayment = false) => {
    navigate(`/customer-detail/${row.customer.id}`, { state: { openPayment } });
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
        <article className="payables-stat-card"><span>{t.customers}</span><strong>{rows.length}</strong><span className="payables-stat-icon"><UserRound size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalSales}</span><strong>{totalText("sales")}</strong><span className="payables-stat-icon"><ReceiptText size={17} /></span></article>
        <article className="payables-stat-card"><span>{t.totalPaid}</span><strong>{totalText("paid")}</strong><span className="payables-stat-icon"><CircleDollarSign size={17} /></span></article>
        <article className="payables-stat-card is-due"><span>{t.totalDue}</span><strong>{totalText("balance")}</strong><span className="payables-stat-icon"><WalletCards size={17} /></span></article>
      </section>

      <section className="payables-card">
        <div className="payables-toolbar">
          <label className="payables-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></label>
          <label className="account-filter-label">{t.currency}<select value={selectedCurrency} onChange={e=>setSelectedCurrency(e.target.value)}><option value="ALL">{language==='en'?'All currencies':'همه اسعار'}</option>{currencyOptions.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
          <label className="account-filter-label">{language==='en'?'Category':'کتگوری'}<select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}><option value="ALL">{language==='en'?'All categories':'همه کتگوری‌ها'}</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
          <label className="account-filter-toggle"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>{language==='en'?'Show settled':'نمایش حساب صفر'}</label>
          <button type="button" className="account-report-btn" onClick={()=>void reportAction('print',filteredRows)}><Printer size={15}/>{t.print}</button>
          <button type="button" className="account-report-btn" onClick={()=>void reportAction('pdf',filteredRows)}>PDF</button>
          <button type="button" className="account-report-btn" onClick={()=>void reportAction('excel',filteredRows)}>Excel</button>
        </div>
        <div className="payables-table-wrap">
          <table className="payables-table">
            <thead><tr><th>{t.customer}</th><th>{t.phone}</th><th>{t.invoices}</th><th>{t.sold}</th><th>{t.paid}</th><th>{t.balance}</th><th>{t.currency}</th><th>{language==='en'?'Account / Print / PDF / Excel':'نمایش / چاپ / PDF / Excel'}</th></tr></thead>
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
                    <td><span className="payables-balance-pill">{money(balance)}</span></td>
                    <td><span className="payables-currency-pill">{currency}</span></td>
                    <td className="payables-actions-cell" onClick={(event) => event.stopPropagation()}>
                      <div className="account-report-actions"><button type="button" onClick={()=>openCustomerLedger(row)} title={language==='en'?'View account':'نمایش حساب'}>نمایش</button><button type="button" onClick={()=>void reportAction('print',[row])} title={t.print}><Printer size={15}/></button><button type="button" onClick={()=>void reportAction('pdf',[row])} title="PDF">PDF</button><button type="button" onClick={()=>void reportAction('excel',[row])} title="Excel">XLS</button></div>
                    </td>
                  </tr>
                );
              })}
              {!filteredRows.length && <tr><td colSpan="8" className="payables-empty"><WalletCards size={30} /><strong>{t.noData}</strong><span>{t.settled}</span></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="account-statement-footer"><span>{language==='en'?'Accounts':'تعداد حساب‌ها'}: <strong>{filteredRows.length}</strong></span><span>{language==='en'?'Outstanding by currency':'مجموع باقی‌مانده به تفکیک اسعار'}: <strong>{Object.entries(filteredRows.reduce((acc,row)=>(acc[row.currency]=(acc[row.currency]||0)+row.balance,acc),{})).map(([cur,total])=>`${cur} ${money(total)}`).join(' · ')||'0'}</strong></span></footer>
    </div>
  );
}
