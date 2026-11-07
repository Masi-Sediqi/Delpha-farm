import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, FileText, Search, Printer, FileDown, FileSpreadsheet } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getProductBatchBalances, stockNumber } from "../utils/stock";
import { countryNameById } from "../utils/productMasterData";
import "./InventoryExpiry.css";

const labels = {
  fa: { title: "تاریخ انقضا", back: "برگشت به موجودی", search: "جستجوی نام دوا، کمپنی یا نمبر بچ...", all: "همه", inStock: "موجود", consumed: "مصرف شده", range: "مدت انقضا", months: "ماه", report: "چاپ گزارش", pdf: "PDF", excel: "دانلود Excel", exportError: "ساخت فایل موفق نشد.", medicine: "نام جنس دری", english: "نام جنس انگلیسی", manufacturer: "کمپنی", madeIn: "ساخت", batch: "نمبر بچ", purchase: "تاریخ خرید", expiry: "تاریخ انقضا", days: "روز باقی‌مانده", remainingMonths: "ماه باقی‌مانده", qty: "مقدار باقی‌مانده", status: "وضعیت", expired: "تاریخ گذشته", missing: "بدون تاریخ", soon: "نزدیک انقضا", healthy: "معتبر", none: "هیچ بچ مطابق جستجو پیدا نشد.", total: "تعداد ریکارد" },
  en: { title: "Expiry Dates", back: "Back to inventory", search: "Search medicine, manufacturer or batch...", all: "All", inStock: "In stock", consumed: "Consumed", range: "Expiry period", months: "months", report: "Print report", pdf: "PDF", excel: "Export Excel", exportError: "Could not export file.", medicine: "Medicine", english: "English name", manufacturer: "Manufacturer", madeIn: "Made in", batch: "Batch", purchase: "Purchase date", expiry: "Expiry date", days: "Days remaining", remainingMonths: "Months remaining", qty: "Remaining units", status: "Status", expired: "Expired", missing: "No expiry", soon: "Expiring soon", healthy: "Valid", none: "No matching batches found.", total: "Records" },
  ps: { title: "د ختمېدو نېټې", back: "موجودۍ ته ستنېدل", search: "د درمل، کمپنۍ یا بچ لټون...", all: "ټول", inStock: "موجود", consumed: "مصرف شوي", range: "د ختمېدو موده", months: "میاشتې", report: "راپور چاپ", pdf: "PDF", excel: "Excel ته صادرول", exportError: "فایل جوړ نه شو.", medicine: "د درمل نوم", english: "انګلیسي نوم", manufacturer: "تولیدوونکی", madeIn: "جوړ شوی", batch: "بچ نمبر", purchase: "د پېرود نېټه", expiry: "د ختمېدو نېټه", days: "پاتې ورځې", remainingMonths: "پاتې میاشتې", qty: "پاتې دانې", status: "حالت", expired: "تېر شوی", missing: "نېټه نشته", soon: "ژر ختمېږي", healthy: "معتبر", none: "هیڅ بچ ونه موندل شو.", total: "ریکارډونه" },
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState("");

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

  useEffect(() => { setPage(1); }, [filter, months, query, pageSize]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const columns = [t.medicine, t.english, t.manufacturer, t.madeIn, t.batch, t.purchase, t.expiry, t.days, t.remainingMonths, t.qty, t.status];
  const exportRows = () => visibleRows.map((row) => [
    row.productName, row.englishName, row.company, row.country, row.batchNo,
    row.purchaseDate, row.expiryDate, row.days ?? "", row.days === null ? "" : +(row.days / 30.44).toFixed(1),
    row.available, t[row.status],
  ]);
  const exportExcel = async () => {
    if (exporting) return;
    setExporting("excel");
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(t.title, { views: [{ rightToLeft: language !== "en" }] });
      worksheet.addRow(columns);
      exportRows().forEach((values) => worksheet.addRow(values));
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF095D49" } };
      worksheet.columns.forEach((column) => { column.width = 22; });
      worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
      const data = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url; link.download = "delpha-expiry-report.xlsx"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) { console.error("Expiry Excel export", error); window.alert(t.exportError); }
    finally { setExporting(""); }
  };
  const exportPdf = async () => {
    if (exporting) return;
    setExporting("pdf");
    const host = document.createElement("div");
    try {
      host.className = "expiry-export-pdf";
      host.dir = language === "en" ? "ltr" : "rtl";
      const heading = document.createElement("h2"); heading.textContent = t.title; host.append(heading);
      const table = document.createElement("table");
      const header = document.createElement("tr");
      columns.forEach((name) => { const th = document.createElement("th"); th.textContent = name; header.append(th); });
      const thead = document.createElement("thead"); thead.append(header); table.append(thead);
      const tbody = document.createElement("tbody");
      exportRows().forEach((values) => {
        const tr = document.createElement("tr");
        values.forEach((value) => { const td = document.createElement("td"); td.textContent = String(value ?? ""); tr.append(td); });
        tbody.append(tr);
      });
      table.append(tbody); host.append(table); document.body.append(host);
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf().set({ margin: 8, filename: "delpha-expiry-report.pdf", image: { type: "jpeg", quality: 0.96 }, html2canvas: { scale: 1.6, backgroundColor: "#ffffff" }, jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }, pagebreak: { mode: ["css", "legacy"] } }).from(host).save();
    } catch (error) { console.error("Expiry PDF export", error); window.alert(t.exportError); }
    finally { host.remove(); setExporting(""); }
  };

  return <main className="expiry-page" dir={language === "en" ? "ltr" : "rtl"}>
    <header className="expiry-heading">
      <div><h1><CalendarDays size={25} /> {t.title}</h1><button type="button" className="expiry-back" onClick={() => navigate("/inventory")}><ArrowRight size={16}/>{t.back}</button></div>
      <div className="expiry-actions"><button type="button" className="expiry-print" onClick={() => window.print()}><Printer size={17}/>{t.report}</button><button type="button" className="expiry-export" disabled={!!exporting} onClick={exportPdf}><FileDown size={17}/>{t.pdf}</button><button type="button" className="expiry-export" disabled={!!exporting} onClick={exportExcel}><FileSpreadsheet size={17}/>{t.excel}</button></div>
    </header>
    <div className="expiry-filters">
      <div className="expiry-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search}/></div>
      <div className="expiry-filter-group">{[["inStock", t.inStock], ["consumed", t.consumed], ["all", t.all]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <label>{t.range} <select value={months} onChange={(event) => setMonths(event.target.value)}><option value="all">{t.all}</option>{[3, 6, 9, 12, 15, 18, 21, 24].map((n) => <option key={n} value={n}>{n} {t.months}</option>)}</select></label>
    </div>
    <div className="expiry-count"><FileText size={16}/> {t.total}: <strong>{visibleRows.length.toLocaleString("en-US")}</strong></div>
    <div className="expiry-table-scroll"><table className="expiry-table"><thead><tr><th>#</th><th>{t.medicine}</th><th>{t.english}</th><th>{t.manufacturer}</th><th>{t.madeIn}</th><th>{t.batch}</th><th>{t.purchase}</th><th>{t.expiry}</th><th>{t.days}</th><th>{t.remainingMonths}</th><th>{t.qty}</th><th>{t.status}</th></tr></thead><tbody>
      {pagedRows.map((row, index) => <tr key={`${row.productId}-${row.batchNo}-${index}`} onClick={() => navigate(`/product-detail/${row.productId}`)}>
        <td>{(currentPage - 1) * pageSize + index + 1}</td><td className="expiry-medicine">{row.productName}</td><td>{row.englishName || "—"}</td><td>{row.company || "—"}</td><td>{row.country || "—"}</td><td>{row.batchNo}</td><td>{row.purchaseDate || "—"}</td><td>{row.expiryDate || "—"}</td><td>{row.days ?? "—"}</td><td>{row.days === null ? "—" : (row.days / 30.44).toFixed(1)}</td><td>{row.available.toLocaleString("en-US")}</td><td><span className={`expiry-status ${row.status}`}>{t[row.status]}</span></td>
      </tr>)}
      {!visibleRows.length && <tr><td className="expiry-no-results" colSpan={12}>{t.none}</td></tr>}
    </tbody></table></div>
    <div className="expiry-pagination">
      <span>{visibleRows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visibleRows.length)} / {visibleRows.length}</span>
      <div><label>{language === "en" ? "Rows per page" : "تعداد در صفحه"} <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>{[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <button type="button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>{language === "en" ? "Previous" : "قبلی"}</button>
      <strong>{currentPage} / {totalPages}</strong>
      <button type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>{language === "en" ? "Next" : "بعدی"}</button></div>
    </div>
  </main>;
}
