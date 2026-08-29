import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { buildSystemSearchResults } from "../utils/systemSearch";

const languageKey = "afghan-power-language";
const rtl = new Set(["fa", "ps"]);
const text = {
  en: { title: "Search Results", subtitle: "Search across the pharmacy records.", back: "Back", placeholder: "Search products, customers, suppliers, invoices...", search: "Search", matches: "Matches", sections: "Sections", record: "Record", details: "Details", type: "Type", open: "Open", no: "No matching record found." },
  fa: { title: "نتایج جستجو", subtitle: "جستجو در معلومات اصلی دواخانه.", back: "برگشت", placeholder: "جستجوی محصول، مشتری، تأمین‌کننده یا بل...", search: "جستجو", matches: "نتایج", sections: "بخش‌ها", record: "ریکارد", details: "جزئیات", type: "نوع", open: "باز کردن", no: "ریکارد مطابق پیدا نشد." },
  ps: { title: "د لټون پایلې", subtitle: "د درملتون په اصلي معلوماتو کې لټون.", back: "بېرته", placeholder: "د محصول، پېرودونکي، عرضه کوونکي یا بل لټون...", search: "لټون", matches: "پایلې", sections: "برخې", record: "ریکارډ", details: "جزیات", type: "ډول", open: "پرانیستل", no: "سم ریکارډ ونه موندل شو." },
};

const groupByType = (rows) => {
  const groups = new Map();
  rows.forEach((row) => groups.set(row.type, [...(groups.get(row.type) || []), row]));
  return Array.from(groups.entries()).map(([type, items]) => ({ type, items }));
};
const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const Highlight = ({ value, query }) => {
  const source = String(value ?? "-");
  const keyword = String(query || "").trim();
  if (!keyword) return source;
  const pieces = source.split(new RegExp(`(${escapeRegExp(keyword)})`, "ig"));
  return pieces.map((piece, index) => piece.toLowerCase() === keyword.toLowerCase() ? <mark className="search-result-highlight" key={`${piece}-${index}`}>{piece}</mark> : <span key={`${piece}-${index}`}>{piece}</span>);
};

export default function SearchResults() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const t = text[language] || text.en;

  const [products] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [countries] = useJsonCollection("countries");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [suppliers] = useJsonCollection("suppliers");
  const [customers] = useJsonCollection("customerRegistry");
  const [purchases] = useJsonCollection("purchases");
  const [sales] = useJsonCollection("salesRegister");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [supplierPayments] = useJsonCollection("supplierPayments");

  useEffect(() => { const sync = () => setLanguage(localStorage.getItem(languageKey) || "en"); window.addEventListener("app-language-updated", sync); return () => window.removeEventListener("app-language-updated", sync); }, []);

  const results = useMemo(() => buildSystemSearchResults({ products, productGroups, countries, manufacturers, suppliers, customers, purchases, sales, customerPayments, supplierPayments }, query), [products, productGroups, countries, manufacturers, suppliers, customers, purchases, sales, customerPayments, supplierPayments, query]);
  const groups = groupByType(results);

  const handleSearch = (event) => {
    event.preventDefault();
    const next = String(new FormData(event.currentTarget).get("q") || "").trim();
    if (next) setParams({ q: next });
  };

  return <div className="search-results-page" dir={rtl.has(language) ? "rtl" : "ltr"}>
    <section className="search-results-hero">
      <button type="button" onClick={() => navigate(-1)} className="search-results-back"><ArrowLeft size={16}/>{t.back}</button>
      <div className="search-results-heading"><span>{t.matches}</span><h1>{t.title}</h1><p>{t.subtitle} {query && <b>“{query}”</b>}</p></div>
      <form onSubmit={handleSearch} className="search-results-form"><Search size={17}/><input name="q" defaultValue={query} placeholder={t.placeholder}/><button type="submit">{t.search}</button></form>
    </section>
    <section className="search-results-stats"><div><span>{t.matches}</span><strong>{results.length}</strong></div><div><span>{t.sections}</span><strong>{groups.length}</strong></div></section>
    {groups.map((group) => <section className="search-results-card" key={group.type}>
      <div className="search-results-card-title"><div><h2>{group.type}</h2><p>{group.items.length}</p></div></div>
      <div className="search-results-table-wrap"><table><thead><tr><th>{t.type}</th><th>{t.record}</th><th>{t.details}</th><th>{t.open}</th></tr></thead><tbody>
        {group.items.map((item) => <tr key={item.key} className="search-result-clickable-row" role="button" tabIndex={0} onClick={() => navigate(item.path)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(item.path); }}><td><span className="search-result-type">{item.type}</span></td><td data-label={t.record}><strong><Highlight value={item.title} query={query}/></strong><small><Highlight value={item.subtitle} query={query}/></small></td><td data-label={t.details}><div className="search-result-detail-list">{item.details.map((detail) => <span key={detail}><Highlight value={detail} query={query}/></span>)}</div></td><td data-label={t.open}><button type="button" onClick={(event) => { event.stopPropagation(); navigate(item.path); }}>{t.open}</button></td></tr>)}
      </tbody></table></div>
    </section>)}
    {query.trim().length >= 2 && !results.length && <section className="search-results-empty">{t.no}</section>}
  </div>;
}
