import { useMemo } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Building2, CalendarDays, CreditCard, Mail, MapPin, Phone, ShoppingCart, UserRound, Wallet } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./CustomerDetail.css";

const rtlLanguages = new Set(["fa", "ps"]);

const labels = {
  en: {
    title: "Customer Detail", back: "Back to Customers", ledger: "Customer Ledger",
    subtitle: "Purchases, payments and running balance for this customer.", customerInfo: "Customer Information",
    phone: "Phone", email: "Email", address: "Address", customerType: "Customer Type", individual: "Individual", business: "Business",
    date: "Date", type: "Type", reference: "Reference", description: "Description", purchase: "Purchase", payment: "Payment",
    debit: "Debit / Purchase", credit: "Credit / Payment", balance: "Running Balance", finalBalance: "Final Balance",
    openingBalance: "Opening Balance", openingEntry: "Opening balance", samplePurchase1: "Medicine purchase invoice",
    samplePayment1: "Cash payment received", samplePurchase2: "Second purchase invoice", notFound: "Customer not found.",
    purchases: "Purchases", payments: "Payments", currentBalance: "Current Balance"
  },
  fa: {
    title: "جزئیات مشتری", back: "برگشت به مشتریان", ledger: "لیجر مشتری",
    subtitle: "خریداری‌ها، پرداخت‌ها و بیلانس جاری این مشتری.", customerInfo: "معلومات مشتری",
    phone: "شماره تماس", email: "ایمیل", address: "آدرس", customerType: "نوع مشتری", individual: "شخصی", business: "شرکتی",
    date: "تاریخ", type: "نوع", reference: "مرجع", description: "توضیحات", purchase: "خریداری", payment: "پرداخت",
    debit: "خرید / بدهکار", credit: "پرداخت / بستانکار", balance: "بیلانس جاری", finalBalance: "بیلانس نهایی",
    openingBalance: "بیلانس افتتاحیه", openingEntry: "بیلانس افتتاحیه", samplePurchase1: "بل خریداری دوا",
    samplePayment1: "پرداخت نقدی مشتری", samplePurchase2: "بل دوم خریداری", notFound: "مشتری پیدا نشد.",
    purchases: "مجموع خرید", payments: "مجموع پرداخت", currentBalance: "بیلانس فعلی"
  },
  ps: {
    title: "د پېرودونکي جزیات", back: "پېرودونکو ته بېرته", ledger: "د پېرودونکي لیجر",
    subtitle: "د دې پېرودونکي پېرودنې، تادیات او روان بیلانس.", customerInfo: "د پېرودونکي معلومات",
    phone: "د اړیکې شمېره", email: "برېښنالیک", address: "پته", customerType: "د پېرودونکي ډول", individual: "شخصي", business: "شرکتي",
    date: "نېټه", type: "ډول", reference: "مرجع", description: "تشریح", purchase: "پېرود", payment: "تادیه",
    debit: "پېرود / بدهکار", credit: "تادیه / بستانکار", balance: "روان بیلانس", finalBalance: "وروستی بیلانس",
    openingBalance: "افتتاحي بیلانس", openingEntry: "افتتاحي بیلانس", samplePurchase1: "د دوا پېرود بل",
    samplePayment1: "نغدي تادیه", samplePurchase2: "دوهم پېرود بل", notFound: "پېرودونکی ونه موندل شو.",
    purchases: "ټول پېرود", payments: "ټولې تادیې", currentBalance: "اوسنی بیلانس"
  }
};

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const language = localStorage.getItem("afghan-power-language") || "en";
  const t = labels[language] || labels.en;
  const isRtl = rtlLanguages.has(language);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [customers] = useJsonCollection("customerRegistry", []);
  const [sales] = useJsonCollection("salesRegister", []);

  const customer = useMemo(
    () => customers.find((item) => String(item.id) === decodeURIComponent(String(customerId || ""))),
    [customers, customerId]
  );

  const rows = useMemo(() => {
    if (!customer) return [];
    const opening = Number(customer.openingBalance || 0);
    const raw = [];
    if (opening !== 0) {
      raw.push({
        date: customer.createdAt ? String(customer.createdAt).slice(0, 10) : "—",
        type: "opening",
        ref: "OPEN",
        description: t.openingEntry,
        debit: opening > 0 ? opening : 0,
        credit: opening < 0 ? Math.abs(opening) : 0,
      });
    }

    sales
      .filter((sale) => String(sale.customerId) === String(customer.id))
      .forEach((sale) => {
        raw.push({
          date: sale.saleDate || (sale.createdAt ? String(sale.createdAt).slice(0, 10) : "—"),
          createdAt: sale.createdAt || "",
          type: "purchase",
          ref: sale.invoiceNumber || "—",
          description: sale.notes || t.samplePurchase1,
          debit: Number(sale.totalAmount || 0),
          credit: 0,
        });
        if (Number(sale.paidAmount || 0) > 0) {
          raw.push({
            date: sale.saleDate || (sale.createdAt ? String(sale.createdAt).slice(0, 10) : "—"),
            createdAt: sale.createdAt || "",
            type: "payment",
            ref: `PAY-${sale.invoiceNumber || sale.id}`,
            description: t.samplePayment1,
            debit: 0,
            credit: Number(sale.paidAmount || 0),
          });
        }
      });

    raw.sort((a, b) => {
      if (a.type === "opening" && b.type !== "opening") return -1;
      if (b.type === "opening" && a.type !== "opening") return 1;
      const aKey = `${a.date || ""}${a.createdAt || ""}`;
      const bKey = `${b.date || ""}${b.createdAt || ""}`;
      if (aKey === bKey) return a.type === "purchase" ? -1 : 1;
      return aKey.localeCompare(bKey);
    });

    let balance = 0;
    return raw.map((row) => {
      balance += Number(row.debit || 0) - Number(row.credit || 0);
      return { ...row, balance };
    });
  }, [customer, sales, t]);

  const totals = useMemo(() => {
    const purchases = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    const payments = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
    const balance = rows.length ? rows[rows.length - 1].balance : 0;
    return { purchases, payments, balance };
  }, [rows]);

  const money = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  if (!customer) {
    return (
      <div className="customer-detail-page" dir={isRtl ? "rtl" : "ltr"}>
        <button className="customer-detail-back" type="button" onClick={() => navigate("/customer-registry")}><BackIcon size={18} />{t.back}</button>
        <div className="customer-detail-empty">{t.notFound}</div>
      </div>
    );
  }

  return (
    <div className="customer-detail-page" dir={isRtl ? "rtl" : "ltr"}>
      <div className="customer-detail-topbar">
        <div>
          <button className="customer-detail-back" type="button" onClick={() => navigate("/customer-registry")}><BackIcon size={18} />{t.back}</button>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <section className="customer-detail-profile-card">
        <div className="customer-detail-avatar"><UserRound size={28} /></div>
        <div className="customer-detail-name">
          <h2>{customer.fullName}</h2>
          <span>{customer.customerType === "business" ? (customer.companyName || t.business) : t.individual}</span>
        </div>
        <div className="customer-detail-info-grid">
          <Info icon={<Phone size={17} />} label={t.phone} value={customer.phone || "—"} />
          <Info icon={<Mail size={17} />} label={t.email} value={customer.email || "—"} />
          <Info icon={<MapPin size={17} />} label={t.address} value={[customer.address, customer.city, customer.province, customer.country].filter(Boolean).join(", ") || "—"} />
          <Info icon={<Building2 size={17} />} label={t.customerType} value={customer.customerType === "business" ? t.business : t.individual} />
        </div>
      </section>

      <div className="customer-detail-stats">
        <Stat icon={<ShoppingCart size={20} />} label={t.purchases} value={money(totals.purchases)} />
        <Stat icon={<Wallet size={20} />} label={t.payments} value={money(totals.payments)} />
        <Stat icon={<CreditCard size={20} />} label={t.currentBalance} value={money(totals.balance)} danger={totals.balance > 0} />
      </div>

      <section className="customer-detail-ledger-card">
        <div className="customer-detail-section-head">
          <div><BookOpen size={21} /><div><h2>{t.ledger}</h2><p>{t.subtitle}</p></div></div>
        </div>
        <div className="customer-detail-table-wrap">
          <table className="customer-detail-table">
            <thead><tr><th>{t.date}</th><th>{t.type}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.debit}</th><th>{t.credit}</th><th>{t.balance}</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.ref}-${index}`}>
                  <td><span className="customer-detail-date"><CalendarDays size={14} />{row.date}</span></td>
                  <td><span className={`customer-detail-type ${row.type}`}>{row.type === "purchase" ? t.purchase : row.type === "payment" ? t.payment : t.openingBalance}</span></td>
                  <td><strong>{row.ref}</strong></td>
                  <td>{row.description}</td>
                  <td>{row.debit ? money(row.debit) : "—"}</td>
                  <td>{row.credit ? money(row.credit) : "—"}</td>
                  <td className={row.balance > 0 ? "customer-detail-due" : ""}>{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="customer-detail-final-balance">
          <span>{t.finalBalance}</span>
          <strong className={totals.balance > 0 ? "is-due" : ""}>{money(totals.balance)}</strong>
        </div>
      </section>
    </div>
  );
}

function Info({ icon, label, value }) {
  return <div className="customer-detail-info"><span className="customer-detail-info-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function Stat({ icon, label, value, danger }) {
  return <div className={`customer-detail-stat ${danger ? "danger" : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
