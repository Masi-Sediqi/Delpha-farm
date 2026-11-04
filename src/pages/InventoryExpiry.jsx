import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, FileText, Search, Printer } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getProductBatchBalances, stockNumber } from "../utils/stock";
import { countryNameById } from "../utils/productMasterData";
import "./InventoryExpiry.css";

const labels = {
  fa: { title: "تاریخ انقضا", back: "برگشت به موجودی", search: "جستجوی نام دوا، کمپنی یا نمبر بچ...", all: "همه", inStock: "موجود", consumed: "مصرف شده", range: "مدت انقضا", months: "ماه", report: "چاپ گزارش", medicine: "نام جنس دری", english: "نام جنس انگلیسی", manufacturer: "کمپنی", madeIn: "ساخت", batch: "نمبر بچ", purchase: "تاریخ خرید", expiry: "تاریخ انقضا", days: "روز باقی‌مانده", remainingMonths: "ماه باقی‌مانده", qty: "مقدار باقی‌مانده", status: "وضعیت", expired: "تاریخ گذشته", missing: "بدون تاریخ", soon: "نزدیک انقضا", healthy: "معتبر", none: "هیچ بچ مطابق جستجو پیدا نشد.", total: "تعداد ریکارد" },
  en: { title: "Expiry Dates", back: "Back to inventory", search: "Search medicine, manufacturer or batch...", all: "All", inStock: "In stock", consumed: "Consumed", range: "Expiry period", months: "months", report: "Print report", medicine: "Medicine", english: "English name", manufacturer: "Manufacturer", madeIn: "Made in", batch: "Batch", purchase: "Purchase date", expiry: "Expiry date", days: "Days remaining", remainingMonths: "Months remaining", qty: "Remaining units", status: "Status", expired: "Expired", missing: "No expiry", soon: "Expiring soon", healthy: "Valid", none: "No matching batches found.", total: "Records" },
  ps: { title: "د ختمېدو نېټې", back: "موجودۍ ته ستنېدل", search: "د درمل، کمپنۍ یا بچ لټون...", all: "ټول", inStock: "موجود", consumed: "مصرف شوي", range: "د ختمېدو موده", months: "میاشتې", report: "راپور چاپ", medicine: "د درمل نوم", english: "انګلیسي نوم", manufacturer: "تولیدوونکی", madeIn: "جوړ شوی", batch: "بچ نمبر", purchase: "د پېرود نېټه", expiry: "د ختمېدو نېټه", days: "پاتې ورځې", remainingMonths: "پاتې میاشتې", qty: "پاتې دانې", status: "حالت", expired: "تېر شوی", missing: "نېټه نشته", soon: "ژر ختمېږي", healthy: "معتبر", none: "هیڅ بچ ونه موندل شو.", total: "ریکارډونه" },
};

const midnightUtc = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
function parseDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(text || ""))) return null;
  const [year, month, day] = text.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === day ? result : null;
}
function dayDifference(expiry) {
  const date = parseDate(expiry);
  if (!date) return null;
  return Math.ceil((date.getTime() - midnightUtc(new Date())) / 86400000);
}
function expiryThreshold(months) {
  const current = new Date();
  return new Date(Date.UTC(current.getFullYear(), current.getMonth() + months, current.getDate()));
}

export default function InventoryExpiry() {
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [movements] = useJsonCollection("stockMovements");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [manufacturerCompanies] = useJsonCollection("manufacturerCompanies");
  const [countries] = useJsonCollection("countries");
  const language = localStorage.getItem("afghan-power-language") || "fa";
  const t = labels[language] || labels.fa;
  const [filter, setFilter] = useState("inStock");
  const [months, setMonths] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const purchases = new Map();
    for (const movement of movements) {
      if (movement.referenceType !== "purchase" && movement.referenceType !== "opening") continue;
      if (stockNumber(movement.quantityIn) <= 0) continue;
      const key = `${movement.productId}::${String(movement.batchNo || "UNBATCHED").toLowerCase()}`;
      const date = movement.movementDate || String(movement.createdAt || "").slice(0, 10);
      if (date && (!purchases.has(key) || date < purchases.get(key))) purchases.set(key, date);
    }
    return products.flatMap((product) => {
      const manufacturer = manufacturerCompanies.find((item) => String(item.id) === String(product.manufacturerId)) || manufacturers.find((item) => String(item.id) === String(product.manufacturerId || product.companyId));
      const company = product.manufacturerName || manufacturer?.name || manufacturer?.companyName || product.company || "";
      return getProductBatchBalances(movements, product.id).map((batch) => {
        const days = dayDifference(batch.expiryDate);
        const available = stockNumber(batch.available);
        const status = days === null ? "missing" : days < 0 ? "expired" : days <= 90 ? "soon" : "healthy";
        return {
          productId: product.id, productName: product.productName || product.name || "", englishName: product.productNameEn || "", company,
          country: countryNameById(countries, product.countryId, language, product.madeIn || "") || "",
          batchNo: batch.batchNo, expiryDate: batch.expiryDate || "", purchaseDate: purchases.get(`${product.id}::${String(batch.batchNo || "UNBATCHED").toLowerCase()}`) || "",
          available, days, status,
        };
      });
    });
  }, [products, movements, manufacturers, manufacturerCompanies, countries, language]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    if (filter === "inStock" && row.available <= 0) return false;
    if (filter === "consumed" && row.available > 0) return false;
    if (months !== "all") {
      const parsed = parseDate(row.expiryDate);
      if (!parsed || parsed > expiryThreshold(Number(months))) return false;
    }
    const value = query.trim().toLocaleLowerCase();
    if (value && !`${row.productName} ${row.englishName} ${row.company} ${row.country} ${row.batchNo}`.toLocaleLowerCase().includes(value)) return false;
    return true;
  }).sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999") || a.productName.localeCompare(b.productName)), [rows, filter, months, query]);

  return <main className="expiry-page" dir={language === "en" ? "ltr" : "rtl"}>
    <header className="expiry-heading">
      <div><h1><CalendarDays size={25} /> {t.title}</h1><button type="button" className="expiry-back" onClick={() => navigate("/inventory")}><ArrowRight size={16}/>{t.back}</button></div>
      <button type="button" className="expiry-print" onClick={() => window.print()}><Printer size={17}/>{t.report}</button>
    </header>
    <div className="expiry-filters">
      <div className="expiry-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search}/></div>
      <div className="expiry-filter-group">{[["inStock", t.inStock], ["consumed", t.consumed], ["all", t.all]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <label>{t.range} <select value={months} onChange={(event) => setMonths(event.target.value)}><option value="all">{t.all}</option>{[3, 6, 9, 12, 15, 18, 21, 24].map((n) => <option key={n} value={n}>{n} {t.months}</option>)}</select></label>
    </div>
    <div className="expiry-count"><FileText size={16}/> {t.total}: <strong>{visibleRows.length.toLocaleString("en-US")}</strong></div>
    <div className="expiry-table-scroll"><table className="expiry-table"><thead><tr><th>#</th><th>{t.medicine}</th><th>{t.english}</th><th>{t.manufacturer}</th><th>{t.madeIn}</th><th>{t.batch}</th><th>{t.purchase}</th><th>{t.expiry}</th><th>{t.days}</th><th>{t.remainingMonths}</th><th>{t.qty}</th><th>{t.status}</th></tr></thead><tbody>
      {visibleRows.map((row, index) => <tr key={`${row.productId}-${row.batchNo}-${index}`} onClick={() => navigate(`/product-detail/${row.productId}`)}>
        <td>{index + 1}</td><td className="expiry-medicine">{row.productName}</td><td>{row.englishName || "—"}</td><td>{row.company || "—"}</td><td>{row.country || "—"}</td><td>{row.batchNo}</td><td>{row.purchaseDate || "—"}</td><td>{row.expiryDate || "—"}</td><td>{row.days ?? "—"}</td><td>{row.days === null ? "—" : (row.days / 30.44).toFixed(1)}</td><td>{row.available.toLocaleString("en-US")}</td><td><span className={`expiry-status ${row.status}`}>{t[row.status]}</span></td>
      </tr>)}
      {!visibleRows.length && <tr><td className="expiry-no-results" colSpan={12}>{t.none}</td></tr>}
    </tbody></table></div>
  </main>;
}
