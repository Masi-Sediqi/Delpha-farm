import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./PrintPayablesBatch.css";

const languageKey = "afghan-power-language";
const tr = {
  en: {
    title: "Receivables Collection Report",
    back: "Back",
    print: "Print",
    ref: "Reference",
    date: "Date",
    customer: "Customer",
    currency: "Currency",
    amount: "Amount",
    note: "Note",
    total: "Total",
    count: "Customers",
    missing: "Receivables collection not found.",
  },
  fa: {
    title: "راپور ثبت طلبات",
    back: "برگشت",
    print: "پرنت",
    ref: "مرجع",
    date: "تاریخ",
    customer: "مشتری",
    currency: "واحد پول",
    amount: "مبلغ",
    note: "یادداشت",
    total: "مجموع",
    count: "تعداد مشتریان",
    missing: "ریکارد ثبت طلبات پیدا نشد.",
  },
  ps: {
    title: "د طلباتو د ثبت راپور",
    back: "بېرته",
    print: "پرنټ",
    ref: "مرجع",
    date: "نېټه",
    customer: "پېرودونکی",
    currency: "اسعار",
    amount: "مبلغ",
    note: "یادښت",
    total: "ټول",
    count: "د پېرودونکو شمېر",
    missing: "د طلباتو د ثبت ریکارډ ونه موندل شو.",
  },
};

export default function PrintReceivablesBatch() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batches] = useJsonCollection("customerPaymentBatches");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "fa");
    window.addEventListener("app-language-updated", sync);
    return () => window.removeEventListener("app-language-updated", sync);
  }, []);

  const t = tr[language] || tr.fa;
  const dir = language === "en" ? "ltr" : "rtl";
  const batch = batches.find((row) => String(row.id) === String(batchId));

  if (!batch) return <div className="pb-print-missing">{t.missing}</div>;

  const totals = batch.totals || {};

  return (
    <div className="pb-print-page" dir={dir}>
      <div className="pb-print-toolbar">
        <button type="button" onClick={() => navigate("/receivables")}><ArrowLeft size={16} />{t.back}</button>
        <button type="button" className="primary" onClick={() => window.print()}><Printer size={16} />{t.print}</button>
      </div>
      <article className="pb-print-paper">
        <header>
          <div className="brand"><strong>APG</strong><span>Pharmacy & Medicine Management System</span></div>
          <div className="heading"><h1>{t.title}</h1><p>{t.ref}: <b>{batch.reference}</b> &nbsp; • &nbsp; {t.date}: <b>{batch.date}</b></p></div>
        </header>
        <div className="pb-print-meta">
          <div><span>{t.count}</span><b>{batch.payments?.length || 0}</b></div>
          {Object.entries(totals).map(([code, value]) => <div key={code}><span>{t.total} {code}</span><b>{Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></div>)}
        </div>
        <table>
          <thead><tr><th>#</th><th>{t.customer}</th><th>{t.currency}</th><th>{t.amount}</th><th>{t.note}</th></tr></thead>
          <tbody>
            {(batch.payments || []).map((row, index) => (
              <tr key={row.paymentId || row.id || index}>
                <td>{index + 1}</td>
                <td>{row.customerName || "—"}</td>
                <td>{row.currency || "AFN"}</td>
                <td>{Number(row.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td>{row.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer><span>____________________</span><span>____________________</span></footer>
      </article>
    </div>
  );
}
