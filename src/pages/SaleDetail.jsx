import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Printer, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./SaleDetail.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    back: "Back to Sales",
    title: "Sale Detail",
    subtitle: "Printable sale invoice with product and payment details.",
    report: "Sale Invoice",
    invoiceNo: "Invoice No.",
    customer: "Customer",
    date: "Date",
    paymentType: "Payment Type",
    cash: "Cash",
    installment: "Installment",
    items: "Items",
    product: "Product",
    group: "Group",
    quantity: "Quantity",
    salePrice: "Sale Price",
    discount: "Discount",
    lineTotal: "Line Total",
    total: "Total",
    paid: "Paid",
    due: "Due",
    notes: "Notes",
    print: "Print",
    close: "Close",
    missing: "Sale record not found.",
    powered: "Powered by",
  },
  fa: {
    back: "برگشت به فروشات",
    title: "جزئیات فروش",
    subtitle: "بل فروش قابل چاپ همراه با اقلام و معلومات پرداخت.",
    report: "بل فروش",
    invoiceNo: "بل نمبر",
    customer: "مشتری",
    date: "تاریخ",
    paymentType: "حالت پرداخت",
    cash: "پرداخت نقدی",
    installment: "پرداخت قسطی",
    items: "اقلام",
    product: "محصول",
    group: "گروپ",
    quantity: "مقدار",
    salePrice: "قیمت فروش",
    discount: "تخفیف",
    lineTotal: "جمله",
    total: "جمله مقدار",
    paid: "پرداخت",
    due: "باقی‌مانده",
    notes: "ملاحظات",
    print: "چاپ",
    close: "بستن",
    missing: "ریکارد فروش پیدا نشد.",
    powered: "ساخته شده توسط",
  },
  ps: {
    back: "خرڅلاو ته بېرته",
    title: "د خرڅلاو جزئیات",
    subtitle: "د توکو او تادیې معلوماتو سره د چاپ وړ بل.",
    report: "د خرڅلاو بل",
    invoiceNo: "بل نمبر",
    customer: "پېرودونکی",
    date: "نېټه",
    paymentType: "د تادیې ډول",
    cash: "نغدي",
    installment: "قسطی",
    items: "توکي",
    product: "محصول",
    group: "ګروپ",
    quantity: "مقدار",
    salePrice: "د خرڅلاو بیه",
    discount: "تخفیف",
    lineTotal: "ټول",
    total: "ټول مبلغ",
    paid: "ورکړه",
    due: "پاتې",
    notes: "یادښتونه",
    print: "چاپ",
    close: "بندول",
    missing: "د خرڅلاو ریکارډ ونه موندل شو.",
    powered: "جوړ شوی د",
  },
};

const numeric = (value) => Math.max(Number(value || 0), 0);
const money = (value) => numeric(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function SaleDetail({ autoPrint = false }) {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const [sales] = useJsonCollection("salesRegister");
  const [settings] = useJsonCollection("settings");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const sale = sales.find((item) => String(item.id) === String(saleId));
  const company = settings?.[0] || {};
  const companyName = company.companyName || "Company Name";
  const companySubtitle = company.systemSubtitle || "Pharmacy & Medicine Management System";

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const totals = useMemo(() => ({
    total: numeric(sale?.totalAmount),
    paid: numeric(sale?.paidAmount),
    due: numeric(sale?.remainingAmount),
  }), [sale]);

  const print = () => navigate(`/sale-detail/${sale.id}/print`);


  if (!sale) {
    return (
      <div className="sale-detail-page" dir={direction}>
        <div className="sale-detail-empty">
          <FileText size={40} />
          <h1>{t.missing}</h1>
          <button type="button" onClick={() => navigate("/sales-register")}><ArrowLeft size={16} />{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sale-detail-page" dir={direction}>
      <div className="sale-detail-toolbar">
        <button type="button" className="sale-detail-tool secondary" onClick={() => navigate("/sales-register")}>
          <ArrowLeft size={16} />{t.back}
        </button>
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="sale-detail-toolbar-actions">
          <button type="button" className="sale-detail-tool primary" onClick={print}><Printer size={16} />{t.print}</button>
          <button type="button" className="sale-detail-tool icon" onClick={() => navigate("/sales-register")} aria-label={t.close}><X size={18} /></button>
        </div>
      </div>

      <main className="sale-detail-sheet">
        <header className="sale-detail-brand">
          <div className="sale-detail-logo">
            {company.logo ? <img src={company.logo} alt={companyName} /> : <span>{companyName.slice(0, 1)}</span>}
          </div>
          <div>
            <h2>{companyName}</h2>
            <p>{companySubtitle}</p>
          </div>
          <div className="sale-detail-brand-note">
            <strong>{t.report}</strong>
            <span>{formatDateTime(sale.saleDate || sale.createdAt)}</span>
          </div>
        </header>

        <section className="sale-detail-title">
          <span>{t.report}</span>
          <h1>{t.title}</h1>
          <p>{sale.invoiceNumber}</p>
        </section>

        <section className="sale-detail-meta">
          <article><span>{t.invoiceNo}</span><strong>{sale.invoiceNumber}</strong></article>
          <article><span>{t.customer}</span><strong>{sale.customerName || "—"}</strong></article>
          <article><span>{t.date}</span><strong>{formatDateTime(sale.saleDate || sale.createdAt)}</strong></article>
          <article><span>{t.paymentType}</span><strong>{sale.paymentMode === "installment" ? t.installment : t.cash}</strong></article>
        </section>

        <section className="sale-detail-table">
          <table>
            <thead>
              <tr><th>#</th><th>{t.product}</th><th>{t.group}</th><th>{t.quantity}</th><th>{t.salePrice}</th><th>{t.discount}</th><th>{t.lineTotal}</th></tr>
            </thead>
            <tbody>
              {(sale.items || []).map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td>{index + 1}</td>
                  <td><strong>{item.productName || "—"}</strong></td>
                  <td>{item.group || "—"}</td>
                  <td>{money(item.quantity)}</td>
                  <td>{money(item.salePrice)}</td>
                  <td>{money(item.discount)}</td>
                  <td>{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="sale-detail-bottom">
          <div className="sale-detail-notes">
            <span>{t.notes}</span>
            <p>{sale.notes || "—"}</p>
          </div>
          <div className="sale-detail-totals">
            <div><span>{t.total}</span><strong>{money(totals.total)}</strong></div>
            <div><span>{t.paid}</span><strong>{money(totals.paid)}</strong></div>
            <div><span>{t.due}</span><strong>{money(totals.due)}</strong></div>
          </div>
        </section>

        <footer className="sale-detail-footer">
          <span>{t.powered} {companyName}</span>
          <span>{sale.invoiceNumber}</span>
        </footer>
      </main>
    </div>
  );
}
