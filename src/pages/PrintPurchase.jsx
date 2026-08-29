import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import appLogo from "../assets/logo.png";
import "./PrintPurchase.css";

const languageKey = "afghan-power-language";
const n = (value) => Math.max(Number(value || 0), 0);

const labels = {
  en: {
    back: "Back",
    print: "Print",
    title: "PURCHASE INVOICE",
    invoiceNo: "Invoice No.",
    supplier: "Supplier",
    date: "Date",
    currency: "Currency",
    paymentStatus: "Payment Status",
    paid: "Fully Paid",
    debt: "Debt",
    no: "S.No.",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    totalPrice: "Total Price",
    grandTotal: "Grand Total",
    paidAmount: "Paid Amount",
    remaining: "Remaining",
    notes: "Notes",
    supplierSignature: "Supplier Signature",
    buyerSignature: "Buyer Signature",
    notFound: "Purchase record not found.",
  },
  fa: {
    back: "برگشت",
    print: "چاپ",
    title: "فاکتور خرید",
    invoiceNo: "شماره فاکتور",
    supplier: "تأمین‌کننده",
    date: "تاریخ",
    currency: "واحد پول",
    paymentStatus: "وضعیت پرداخت",
    paid: "مکمل پرداخت",
    debt: "قرض",
    no: "شماره",
    description: "شرح کالا",
    qty: "تعداد",
    unitPrice: "قیمت واحد",
    totalPrice: "قیمت کل",
    grandTotal: "مجموع کل",
    paidAmount: "پرداخت‌شده",
    remaining: "باقی‌مانده",
    notes: "ملاحظات",
    supplierSignature: "امضای تأمین‌کننده",
    buyerSignature: "امضای خریدار",
    notFound: "ریکارد خریداری پیدا نشد.",
  },
  ps: {
    back: "بېرته",
    print: "پرنټ",
    title: "د پېرود بل",
    invoiceNo: "د بل شمېره",
    supplier: "عرضه کوونکی",
    date: "نېټه",
    currency: "اسعار",
    paymentStatus: "د ورکړې حالت",
    paid: "بشپړ ورکړل شوی",
    debt: "پور",
    no: "شمېره",
    description: "د توکي شرح",
    qty: "اندازه",
    unitPrice: "د واحد بیه",
    totalPrice: "ټوله بیه",
    grandTotal: "ټول مبلغ",
    paidAmount: "ورکړل شوی",
    remaining: "پاتې",
    notes: "یادښتونه",
    supplierSignature: "د عرضه کوونکي لاسلیک",
    buyerSignature: "د اخیستونکي لاسلیک",
    notFound: "د پېرود ریکارډ ونه موندل شو.",
  },
};

export default function PrintPurchase() {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(
    () => localStorage.getItem(languageKey) || "fa"
  );

  const [purchases] = useJsonCollection("purchases");
  const [purchaseItems] = useJsonCollection("purchaseItems");
  const [settings] = useJsonCollection("settings");
  const [suppliers] = useJsonCollection("suppliers");

  const t = labels[language] || labels.fa;
  const dir = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const syncLanguage = () =>
      setLanguage(localStorage.getItem(languageKey) || "fa");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const purchase = useMemo(
    () => purchases.find((item) => String(item.id) === String(purchaseId)),
    [purchases, purchaseId]
  );

  const items = useMemo(() => {
    const linked = purchaseItems.filter(
      (item) => String(item.purchaseId) === String(purchaseId)
    );
    if (linked.length) return linked;
    return Array.isArray(purchase?.items) ? purchase.items : [];
  }, [purchaseItems, purchase, purchaseId]);

  const company = settings[0] || {};
  const systemName = company.companyName || "APG";
  const logo = company.logo || appLogo;

  const supplierName = useMemo(() => {
    if (!purchase) return "—";
    if (purchase.supplierName) return purchase.supplierName;
    return (
      suppliers.find((s) => String(s.id) === String(purchase.supplierId))
        ?.supplierName || "—"
    );
  }, [purchase, suppliers]);

  if (!purchase) {
    return (
      <div className="print-purchase-page" dir={dir}>
        <div className="print-purchase-not-found">{t.notFound}</div>
      </div>
    );
  }

  const currency = purchase.currency || "AFN";
  const totalAmount = n(
    purchase.totalAmount ||
      items.reduce(
        (sum, item) =>
          sum + n(item.lineTotal ?? n(item.quantity) * n(item.purchasePrice)),
        0
      )
  );
  const paidAmount = n(purchase.paidAmount);
  const remainingAmount = Math.max(
    n(purchase.remainingAmount || totalAmount - paidAmount),
    0
  );
  const minimumRows = 15;
  const blankRows = Math.max(minimumRows - items.length, 0);

  return (
    <div className="print-purchase-page" dir={dir}>
      <div className="print-purchase-toolbar no-print">
        <button type="button" className="print-toolbar-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
          {t.back}
        </button>
        <button type="button" className="print-toolbar-print" onClick={() => window.print()}>
          <Printer size={17} />
          {t.print}
        </button>
      </div>

      <main className="purchase-paper">
        <header className="purchase-paper-header">
          <div className="purchase-system-name">
            <strong>{systemName}</strong>
            {company.systemSubtitle ? <span>{company.systemSubtitle}</span> : null}
          </div>

          <h1>{t.title}</h1>

          <div className="purchase-system-logo">
            {logo ? (
              <img src={logo} alt={`${systemName} logo`} />
            ) : (
              <div className="purchase-logo-placeholder">{systemName.slice(0, 2)}</div>
            )}
          </div>
        </header>

        <section className="purchase-invoice-meta">
          <div>
            <span>{t.invoiceNo}</span>
            <strong>{purchase.billNumber || purchase.id || "—"}</strong>
          </div>
          <div>
            <span>{t.supplier}</span>
            <strong>{supplierName}</strong>
          </div>
          <div>
            <span>{t.date}</span>
            <strong>{purchase.purchaseDate || purchase.createdAt || "—"}</strong>
          </div>
          <div>
            <span>{t.currency}</span>
            <strong>{currency}</strong>
          </div>
          <div>
            <span>{t.paymentStatus}</span>
            <strong>{remainingAmount > 0 ? t.debt : t.paid}</strong>
          </div>
        </section>

        <section className="purchase-paper-table-wrap">
          <table className="purchase-paper-table">
            <thead>
              <tr>
                <th className="serial-column">{t.no}</th>
                <th className="description-column">{t.description}</th>
                <th>{t.qty}</th>
                <th>{t.unitPrice}</th>
                <th>{t.totalPrice}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const quantity = n(item.quantity);
                const unitPrice = n(item.purchasePrice);
                const lineTotal = n(item.lineTotal || quantity * unitPrice);
                return (
                  <tr key={item.id || `${item.productId}-${index}`}>
                    <td>{index + 1}</td>
                    <td className="item-description">
                      <strong>{item.productName || item.name || "—"}</strong>
                      {item.group ? <small>{item.group}</small> : null}
                    </td>
                    <td>{quantity}</td>
                    <td>{unitPrice.toFixed(2)}</td>
                    <td>{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}

              {Array.from({ length: blankRows }).map((_, index) => (
                <tr className="blank-row" key={`blank-${index}`}>
                  <td>{items.length + index + 1}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="purchase-paper-totals">
          <div>
            <span>{t.grandTotal}</span>
            <strong>{totalAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>{t.paidAmount}</span>
            <strong>{paidAmount.toFixed(2)} {currency}</strong>
          </div>
          <div>
            <span>{t.remaining}</span>
            <strong>{remainingAmount.toFixed(2)} {currency}</strong>
          </div>
        </section>

        <section className="purchase-paper-notes">
          <strong>{t.notes}</strong>
          <p>{purchase.notes || ""}</p>
        </section>

        <footer className="purchase-paper-signatures">
          <div>
            <span>{t.supplierSignature}</span>
            <div className="signature-line"></div>
          </div>
          <div>
            <span>{t.buyerSignature}</span>
            <div className="signature-line"></div>
          </div>
        </footer>
      </main>
    </div>
  );
}
