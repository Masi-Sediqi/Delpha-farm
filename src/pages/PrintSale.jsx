import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import appLogo from "../assets/logo.png";
import "./PrintSale.css";

const languageKey = "afghan-power-language";
const n = (value) => Math.max(Number(value || 0), 0);
const money = (value) => n(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const labels = {
  en: {
    back: "Back to sales", print: "Print", title: "SALES INVOICE", invoiceNo: "Invoice No.", customer: "Customer",
    date: "Date", currency: "Currency", paymentStatus: "Payment Status", paid: "Fully Paid", debt: "Debt",
    no: "S.No.", description: "Description", qty: "Qty", unitPrice: "Unit Price", discount: "Discount",
    totalPrice: "Total Price", subtotal: "Subtotal", totalDiscount: "Discount", grandTotal: "Grand Total",
    paidAmount: "Paid Amount", remaining: "Remaining / Due", notes: "Notes", sellerSignature: "Seller Signature",
    customerSignature: "Customer Signature", notFound: "Sale record not found.", system: "System",
  },
  fa: {
    back: "برگشت به فروشات", print: "چاپ", title: "فاکتور فروش", invoiceNo: "شماره فاکتور", customer: "مشتری",
    date: "تاریخ", currency: "واحد پول", paymentStatus: "وضعیت پرداخت", paid: "مکمل پرداخت", debt: "قرض",
    no: "شماره", description: "شرح کالا", qty: "تعداد", unitPrice: "قیمت واحد", discount: "تخفیف",
    totalPrice: "قیمت کل", subtotal: "جمع قبل از تخفیف", totalDiscount: "مجموع تخفیف", grandTotal: "مجموع نهایی",
    paidAmount: "پرداخت‌شده", remaining: "باقی / طلب", notes: "ملاحظات", sellerSignature: "امضای فروشنده",
    customerSignature: "امضای خریدار", notFound: "ریکارد فروش پیدا نشد.", system: "سیستم",
  },
  ps: {
    back: "خرڅلاو ته بېرته", print: "چاپ", title: "د خرڅلاو بل", invoiceNo: "د بل شمېره", customer: "پېرودونکی",
    date: "نېټه", currency: "اسعار", paymentStatus: "د ورکړې حالت", paid: "بشپړ ورکړل شوی", debt: "پور",
    no: "شمېره", description: "د توکي شرح", qty: "اندازه", unitPrice: "د واحد بیه", discount: "تخفیف",
    totalPrice: "ټوله بیه", subtotal: "له تخفیف مخکې ټول", totalDiscount: "ټول تخفیف", grandTotal: "وروستی مجموع",
    paidAmount: "ورکړل شوی", remaining: "پاتې / طلب", notes: "یادښتونه", sellerSignature: "د پلورونکي لاسلیک",
    customerSignature: "د پېرودونکي لاسلیک", notFound: "د خرڅلاو ریکارډ ونه موندل شو.", system: "سیسټم",
  },
};

export default function PrintSale() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");
  const [sales] = useJsonCollection("salesRegister");
  const [settings] = useJsonCollection("settings");
  const [customers] = useJsonCollection("customers");

  const t = labels[language] || labels.fa;
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

  const sale = useMemo(() => sales.find((item) => String(item.id) === String(saleId)), [sales, saleId]);
  const company = settings?.[0] || {};
  const systemName = company.companyName || "APG";
  const systemSubtitle = company.systemSubtitle || "Pharmacy & Medicine Management System";
  const logo = company.logo || appLogo;

  const customerName = useMemo(() => {
    if (!sale) return "—";
    if (sale.customerName) return sale.customerName;
    const customer = customers.find((item) => String(item.id) === String(sale.customerId));
    return customer?.fullName || customer?.companyName || "—";
  }, [sale, customers]);

  if (!sale) {
    return <div className="print-sale-page" dir={dir}><div className="print-sale-not-found">{t.notFound}</div></div>;
  }

  const items = Array.isArray(sale.items) ? sale.items : [];
  const currency = sale.currency || "AFN";
  const subtotal = n(sale.subtotalAmount || items.reduce((sum, item) => sum + n(item.lineGross ?? n(item.quantity) * n(item.salePrice)), 0));
  const discount = n(sale.discountAmount || items.reduce((sum, item) => sum + n(item.discountAmount ?? item.discount), 0));
  const total = n(sale.totalAmount || Math.max(subtotal - discount, 0));
  const paid = n(sale.paidAmount);
  const remaining = n(sale.remainingAmount || Math.max(total - paid, 0));
  const minimumRows = 15;
  const blankRows = Math.max(minimumRows - items.length, 0);

  return (
    <div className="print-sale-page" dir={dir}>
      <div className="print-sale-toolbar no-print">
        <button type="button" className="print-sale-back" onClick={() => navigate(-1)}><ArrowLeft size={16} />{t.back}</button>
        <button type="button" className="print-sale-button" onClick={() => window.print()}><Printer size={16} />{t.print}</button>
      </div>

      <main className="sale-paper">
        <header className="sale-paper-header">
          <div className="sale-system-name">
            <strong>{systemName}</strong>
            <span>{systemSubtitle}</span>
          </div>
          <h1>{t.title}</h1>
          <div className="sale-system-logo">
            {logo ? <img src={logo} alt={systemName} /> : <span>{systemName.slice(0, 2)}</span>}
          </div>
        </header>

        <section className="sale-invoice-meta">
          <div><span>{t.invoiceNo}</span><strong>{sale.invoiceNumber || sale.id || "—"}</strong></div>
          <div><span>{t.customer}</span><strong>{customerName}</strong></div>
          <div><span>{t.date}</span><strong>{sale.saleDate || sale.createdAt || "—"}</strong></div>
          <div><span>{t.currency}</span><strong>{currency}</strong></div>
          <div><span>{t.paymentStatus}</span><strong>{remaining > 0 ? t.debt : t.paid}</strong></div>
        </section>

        <section className="sale-paper-table-wrap">
          <table className="sale-paper-table">
            <thead>
              <tr>
                <th className="serial-column">{t.no}</th>
                <th className="description-column">{t.description}</th>
                <th>{t.qty}</th>
                <th>{t.unitPrice}</th>
                <th>{t.discount}</th>
                <th>{t.totalPrice}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const quantity = n(item.quantity);
                const unitPrice = n(item.salePrice);
                const lineDiscount = n(item.discountAmount ?? item.discount);
                const lineGross = n(item.lineGross ?? quantity * unitPrice);
                const lineTotal = n(item.lineTotal ?? Math.max(lineGross - lineDiscount, 0));
                return (
                  <tr key={item.id || `${item.productId}-${index}`}>
                    <td>{index + 1}</td>
                    <td className="item-description"><strong>{item.productName || item.name || "—"}</strong>{item.group ? <small>{item.group}</small> : null}</td>
                    <td>{money(quantity)}</td>
                    <td>{money(unitPrice)}</td>
                    <td>{money(lineDiscount)}</td>
                    <td>{money(lineTotal)}</td>
                  </tr>
                );
              })}
              {Array.from({ length: blankRows }).map((_, index) => (
                <tr className="blank-row" key={`blank-${index}`}>
                  <td>{items.length + index + 1}</td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="sale-paper-bottom">
          <div className="sale-paper-notes"><strong>{t.notes}</strong><p>{sale.notes || ""}</p></div>
          <div className="sale-paper-totals">
            <div><span>{t.subtotal}</span><strong>{money(subtotal)} {currency}</strong></div>
            <div><span>{t.totalDiscount}</span><strong>{money(discount)} {currency}</strong></div>
            <div className="grand"><span>{t.grandTotal}</span><strong>{money(total)} {currency}</strong></div>
            <div><span>{t.paidAmount}</span><strong>{money(paid)} {currency}</strong></div>
            <div className={remaining > 0 ? "due" : ""}><span>{t.remaining}</span><strong>{money(remaining)} {currency}</strong></div>
          </div>
        </section>

        <footer className="sale-paper-signatures">
          <div><span>{t.sellerSignature}</span><i /></div>
          <div><span>{t.customerSignature}</span><i /></div>
        </footer>
      </main>
    </div>
  );
}
