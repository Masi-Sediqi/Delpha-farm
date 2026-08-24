import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  Search,
  TrendingDown,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./ReceivablesPayables.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencies = ["AFN", "USD", "PKR", "EUR"];
const numeric = (value) => Number(value || 0) || 0;
const normalizeCurrency = (value, fallback = "AFN") => {
  const code = String(value || fallback).trim().toUpperCase();
  if (code === "AFGHANI" || code === "AFN") return "AFN";
  if (code === "DOLLAR" || code === "USD") return "USD";
  if (code === "PAKISTANI" || code === "PAKISTANI RUPEE" || code === "PKR") return "PKR";
  if (code === "EURO" || code === "EUR") return "EUR";
  return fallback;
};

const translations = {
  en: {
    title: "Receivables & Payables",
    subtitle: "A live summary of customer receivables and supplier payables based on the actual ledgers.",
    receivable: "Accounts Receivable",
    payable: "Accounts Payable",
    net: "Net Position",
    customersDue: "Customers Owe Us",
    suppliersDue: "We Owe Suppliers",
    positiveNet: "Net receivable",
    negativeNet: "Net payable",
    settled: "Balanced",
    customerAccounts: "Customer Receivables",
    supplierAccounts: "Supplier Payables",
    searchCustomer: "Search customers...",
    searchSupplier: "Search suppliers...",
    customer: "Customer",
    supplier: "Supplier",
    phone: "Phone",
    balance: "Balance",
    status: "Status",
    details: "Details",
    owesUs: "Owes us",
    weOwe: "We owe",
    creditBalance: "Credit balance",
    supplierCredit: "Supplier owes us",
    noCustomerBalances: "No open customer balances in this currency.",
    noSupplierBalances: "No open supplier balances in this currency.",
    openAccounts: "Open accounts",
  },
  fa: {
    title: "حسابات دریافتنی و پرداختنی",
    subtitle: "خلاصه زنده طلب‌های مشتریان و بدهی‌های تأمین‌کننده‌گان بر اساس لیجرهای واقعی.",
    receivable: "حسابات دریافتنی",
    payable: "حسابات پرداختنی",
    net: "وضعیت خالص",
    customersDue: "طلب ما از مشتریان",
    suppliersDue: "بدهی ما به تأمین‌کننده‌گان",
    positiveNet: "طلب خالص",
    negativeNet: "بدهی خالص",
    settled: "متوازن",
    customerAccounts: "طلب‌های مشتریان",
    supplierAccounts: "بدهی‌های تأمین‌کننده‌گان",
    searchCustomer: "جستجوی مشتری...",
    searchSupplier: "جستجوی تأمین‌کننده...",
    customer: "مشتری",
    supplier: "تأمین‌کننده",
    phone: "شماره تماس",
    balance: "بیلانس",
    status: "وضعیت",
    details: "جزئیات",
    owesUs: "به ما بدهکار است",
    weOwe: "ما بدهکار استیم",
    creditBalance: "ما به مشتری بدهکار استیم",
    supplierCredit: "تأمین‌کننده به ما بدهکار است",
    noCustomerBalances: "در این اسعار هیچ بیلانس باز مشتری وجود ندارد.",
    noSupplierBalances: "در این اسعار هیچ بیلانس باز تأمین‌کننده وجود ندارد.",
    openAccounts: "حساب باز",
  },
  ps: {
    title: "د ترلاسه کېدونکو او ورکول کېدونکو حسابونه",
    subtitle: "د حقیقي لیجرونو پر بنسټ د پېرودونکو طلبونه او عرضه کوونکو ته زموږ پورونه.",
    receivable: "ترلاسه کېدونکي حسابونه",
    payable: "ورکول کېدونکي حسابونه",
    net: "خالص وضعیت",
    customersDue: "له پېرودونکو زموږ طلب",
    suppliersDue: "عرضه کوونکو ته زموږ پور",
    positiveNet: "خالص طلب",
    negativeNet: "خالص پور",
    settled: "متوازن",
    customerAccounts: "د پېرودونکو طلبونه",
    supplierAccounts: "عرضه کوونکو ته پورونه",
    searchCustomer: "پېرودونکی ولټوئ...",
    searchSupplier: "عرضه کوونکی ولټوئ...",
    customer: "پېرودونکی",
    supplier: "عرضه کوونکی",
    phone: "د اړیکې شمېره",
    balance: "بیلانس",
    status: "حالت",
    details: "جزئیات",
    owesUs: "موږ ته پوروړی دی",
    weOwe: "موږ پوروړي یو",
    creditBalance: "موږ پېرودونکي ته پوروړي یو",
    supplierCredit: "عرضه کوونکی موږ ته پوروړی دی",
    noCustomerBalances: "په دې اسعارو کې د پېرودونکو خلاص بیلانس نشته.",
    noSupplierBalances: "په دې اسعارو کې د عرضه کوونکو خلاص بیلانس نشته.",
    openAccounts: "خلاص حسابونه",
  },
};

function amount(value, currency) {
  return `${Math.abs(numeric(value)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

export default function ReceivablesPayables() {
  const navigate = useNavigate();
  const [customers] = useJsonCollection("customerRegistry");
  const [suppliers] = useJsonCollection("suppliers");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [purchases] = useJsonCollection("purchases");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [supplierPayments] = useJsonCollection("supplierPayments");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [currency, setCurrency] = useState("AFN");
  const [customerSearch, setCustomerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const customerBalances = useMemo(() => customers.map((customer) => {
    const id = String(customer.id);
    const customerSales = sales.filter((item) => String(item.customerId) === id);
    const returns = saleReturns.filter((item) => String(item.customerId) === id);
    const payments = customerPayments.filter((item) => String(item.customerId) === id);
    const debit = Math.max(numeric(customer.openingBalance), 0)
      + customerSales.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
    const credit = Math.max(-numeric(customer.openingBalance), 0)
      + customerSales.reduce((sum, item) => sum + numeric(item.paidAmount), 0)
      + returns.reduce((sum, item) => sum + numeric(item.totalAmount), 0)
      + payments.reduce((sum, item) => sum + numeric(item.amount), 0);
    return {
      ...customer,
      balance: debit - credit,
      currency: normalizeCurrency(customer.currency, "AFN"),
    };
  }), [customers, sales, saleReturns, customerPayments]);

  const supplierBalances = useMemo(() => suppliers.map((supplier) => {
    const id = String(supplier.id);
    const supplierPurchases = purchases.filter((item) => String(item.supplierId) === id);
    const returns = purchaseReturns.filter((item) => String(item.supplierId) === id);
    const payments = supplierPayments.filter((item) => String(item.supplierId) === id);
    const debit = Math.max(numeric(supplier.openingBalance), 0)
      + supplierPurchases.reduce((sum, item) => sum + numeric(item.totalAmount), 0);
    const credit = Math.max(-numeric(supplier.openingBalance), 0)
      + supplierPurchases.reduce((sum, item) => sum + numeric(item.paidAmount), 0)
      + returns.reduce((sum, item) => sum + numeric(item.totalAmount), 0)
      + payments.reduce((sum, item) => sum + numeric(item.amount), 0);
    return {
      ...supplier,
      balance: debit - credit,
      currency: normalizeCurrency(supplier.currency, "AFN"),
    };
  }), [suppliers, purchases, purchaseReturns, supplierPayments]);

  const currencyCustomers = useMemo(
    () => customerBalances.filter((item) => item.currency === currency && Math.abs(item.balance) > 0.000001),
    [customerBalances, currency]
  );
  const currencySuppliers = useMemo(
    () => supplierBalances.filter((item) => item.currency === currency && Math.abs(item.balance) > 0.000001),
    [supplierBalances, currency]
  );

  const receivable = currencyCustomers.reduce((sum, item) => sum + Math.max(item.balance, 0), 0)
    + currencySuppliers.reduce((sum, item) => sum + Math.max(-item.balance, 0), 0);
  const payable = currencySuppliers.reduce((sum, item) => sum + Math.max(item.balance, 0), 0)
    + currencyCustomers.reduce((sum, item) => sum + Math.max(-item.balance, 0), 0);
  const net = receivable - payable;

  const filteredCustomers = currencyCustomers.filter((item) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return `${item.fullName || ""} ${item.companyName || ""} ${item.phone || ""} ${item.email || ""}`.toLowerCase().includes(q);
  });
  const filteredSuppliers = currencySuppliers.filter((item) => {
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return true;
    return `${item.supplierName || ""} ${item.contactPerson || ""} ${item.phone || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="arp-page" dir={direction}>
      <header className="arp-hero">
        <div>
          <span className="arp-kicker"><WalletCards size={16} />{t.openAccounts}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="arp-currency-tabs" role="tablist" aria-label="Currency">
          {currencies.map((code) => (
            <button key={code} type="button" className={currency === code ? "active" : ""} onClick={() => setCurrency(code)}>{code}</button>
          ))}
        </div>
      </header>

      <section className="arp-stats">
        <article className="arp-stat receivable">
          <span className="arp-stat-icon"><TrendingUp size={22} /></span>
          <div><small>{t.receivable}</small><strong>{amount(receivable, currency)}</strong><p>{t.customersDue}</p></div>
        </article>
        <article className="arp-stat payable">
          <span className="arp-stat-icon"><TrendingDown size={22} /></span>
          <div><small>{t.payable}</small><strong>{amount(payable, currency)}</strong><p>{t.suppliersDue}</p></div>
        </article>
        <article className={`arp-stat net ${net > 0 ? "positive" : net < 0 ? "negative" : "settled"}`}>
          <span className="arp-stat-icon"><CircleDollarSign size={22} /></span>
          <div><small>{t.net}</small><strong>{amount(net, currency)}</strong><p>{net > 0 ? t.positiveNet : net < 0 ? t.negativeNet : t.settled}</p></div>
        </article>
      </section>

      <div className="arp-grid">
        <section className="arp-card">
          <div className="arp-card-head">
            <div className="arp-card-title"><UserRound size={19} /><div><h2>{t.customerAccounts}</h2><p>{currencyCustomers.length} {t.openAccounts}</p></div></div>
            <label className="arp-search"><Search size={16} /><input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder={t.searchCustomer} /></label>
          </div>
          <div className="arp-table-wrap">
            <table>
              <thead><tr><th>{t.customer}</th><th>{t.phone}</th><th>{t.balance}</th><th>{t.status}</th><th></th></tr></thead>
              <tbody>
                {filteredCustomers.length ? filteredCustomers.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/customer-detail/${item.id}`)}>
                    <td><div className="arp-entity"><span><UserRound size={16} /></span><div><strong>{item.fullName || item.companyName || "—"}</strong><small>{item.email || "—"}</small></div></div></td>
                    <td dir="ltr">{item.phone || "—"}</td>
                    <td className={item.balance > 0 ? "amount receivable" : "amount credit"}>{amount(item.balance, currency)}</td>
                    <td><span className={`arp-status ${item.balance > 0 ? "receivable" : "credit"}`}>{item.balance > 0 ? t.owesUs : t.creditBalance}</span></td>
                    <td><button type="button" className="arp-row-btn" onClick={(e) => { e.stopPropagation(); navigate(`/customer-detail/${item.id}`); }} title={t.details}><ArrowRight size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="5" className="arp-empty">{t.noCustomerBalances}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="arp-card">
          <div className="arp-card-head">
            <div className="arp-card-title"><Building2 size={19} /><div><h2>{t.supplierAccounts}</h2><p>{currencySuppliers.length} {t.openAccounts}</p></div></div>
            <label className="arp-search"><Search size={16} /><input value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder={t.searchSupplier} /></label>
          </div>
          <div className="arp-table-wrap">
            <table>
              <thead><tr><th>{t.supplier}</th><th>{t.phone}</th><th>{t.balance}</th><th>{t.status}</th><th></th></tr></thead>
              <tbody>
                {filteredSuppliers.length ? filteredSuppliers.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/supplier-detail/${item.id}`)}>
                    <td><div className="arp-entity supplier"><span><Building2 size={16} /></span><div><strong>{item.supplierName || "—"}</strong><small>{item.contactPerson || "—"}</small></div></div></td>
                    <td dir="ltr">{item.phone || "—"}</td>
                    <td className={item.balance > 0 ? "amount payable" : "amount receivable"}>{amount(item.balance, currency)}</td>
                    <td><span className={`arp-status ${item.balance > 0 ? "payable" : "receivable"}`}>{item.balance > 0 ? t.weOwe : t.supplierCredit}</span></td>
                    <td><button type="button" className="arp-row-btn" onClick={(e) => { e.stopPropagation(); navigate(`/supplier-detail/${item.id}`); }} title={t.details}><ArrowRight size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="5" className="arp-empty">{t.noSupplierBalances}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
