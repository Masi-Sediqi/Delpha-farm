import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Box,
  CheckCheck,
  ChevronDown,
  Clock3,
  Globe2,
  LogOut,
  PackageX,
  Search,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getProductBatchBalances, getProductStock } from "../utils/stock";
import { buildSystemSearchResults } from "../utils/systemSearch";

const NOTIFICATION_STATE_KEY = "medicine-notification-state";
const LANGUAGE_STATE_KEY = "afghan-power-language";
const languages = [
  { key: "fa", label: "دری", short: "DRI", direction: "rtl" },
  { key: "ps", label: "پشتو", short: "PS", direction: "rtl" },
  { key: "en", label: "English", short: "ENG", direction: "ltr" },
];

const labels = {
  en: {
    currency: "Currency", search: "Search products, customers, suppliers, invoices...", language: "Language",
    notifications: "Smart alerts", none: "No alerts right now.", systemSearch: "System Search", all: "All",
    openFull: "Open all results", expired: "Expired batches", expiring: "Expiring within 60 days",
    low: "Low stock", out: "Out of stock", expiredTitle: "Expired batch", expiringTitle: "Expiry warning",
    lowTitle: "Low stock warning", outTitle: "Out of stock", read: "Read", unread: "New", settings: "Settings",
    logout: "Logout", noResult: "No matching record found.",
    types: { Product: "Product", Manufacturer: "Manufacturer", Supplier: "Supplier", Customer: "Customer", Purchase: "Purchase", Sale: "Sale", Payment: "Payment" },
  },
  fa: {
    currency: "واحد پول", search: "جستجوی محصول، مشتری، تأمین‌کننده یا بل...", language: "زبان",
    notifications: "هشدارهای هوشمند", none: "فعلاً هشداری وجود ندارد.", systemSearch: "جستجوی سیستم", all: "همه",
    openFull: "تمام نتایج", expired: "بچ‌های منقضی‌شده", expiring: "انقضا در ۶۰ روز آینده",
    low: "موجودی کم", out: "محصولات خلاص‌شده", expiredTitle: "بچ منقضی شده", expiringTitle: "هشدار تاریخ انقضا",
    lowTitle: "هشدار موجودی کم", outTitle: "موجودی خلاص شده", read: "خوانده‌شده", unread: "جدید", settings: "تنظیمات",
    logout: "خروج", noResult: "ریکارد مطابق پیدا نشد.",
    types: { Product: "محصول", Manufacturer: "شرکت سازنده", Supplier: "تأمین‌کننده", Customer: "مشتری", Purchase: "خریداری", Sale: "فروش", Payment: "پرداخت" },
  },
  ps: {
    currency: "د پیسو واحد", search: "د محصول، پېرودونکي، عرضه کوونکي یا بل لټون...", language: "ژبه",
    notifications: "هوښیار خبرتیاوې", none: "اوس کومه خبرتیا نشته.", systemSearch: "د سیستم لټون", all: "ټول",
    openFull: "ټولې پایلې", expired: "ختم شوي بچونه", expiring: "په ۶۰ ورځو کې ختمېدونکي",
    low: "کمه موجودي", out: "خلاص شوي محصولات", expiredTitle: "بچ ختم شوی", expiringTitle: "د ختمېدو خبرتیا",
    lowTitle: "د کمې موجودۍ خبرتیا", outTitle: "موجودي خلاصه ده", read: "لوستل شوی", unread: "نوی", settings: "تنظیمات",
    logout: "وتل", noResult: "سم ریکارډ ونه موندل شو.",
    types: { Product: "محصول", Manufacturer: "جوړوونکی شرکت", Supplier: "عرضه کوونکی", Customer: "پېرودونکی", Purchase: "پېرود", Sale: "خرڅلاو", Payment: "تادیه" },
  },
};

const readState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_STATE_KEY) || "{}");
    return { readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [], clearedIds: Array.isArray(parsed.clearedIds) ? parsed.clearedIds : [] };
  } catch {
    return { readIds: [], clearedIds: [] };
  }
};

const dateOnly = (value) => String(value || "").slice(0, 10);
const daysUntil = (value) => {
  if (!value) return Infinity;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(`${dateOnly(value)}T00:00:00`);
  return Number.isNaN(target.getTime()) ? Infinity : Math.ceil((target - now) / 86400000);
};

function HeaderActions({ currentUser, onLogout, compact = false }) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_STATE_KEY) || "en");
  const [notificationState, setNotificationState] = useState(readState);
  const [settings, setSettings] = useJsonCollection("settings");
  const [products] = useJsonCollection("products");
  const [stockMovements] = useJsonCollection("stockMovements");
  const currentSettings = settings[0] || {};
  const currency = currentSettings.currency || "AFN";
  const t = labels[language] || labels.en;

  const notificationGroups = useMemo(() => {
    const expired = [], expiring = [], low = [], out = [];
    const defaultLow = Math.max(Number(currentSettings.lowStockThreshold || 10), 0);

    products.forEach((product) => {
      const name = product.productName || product.name || "Product";
      const stock = getProductStock(stockMovements, product.id, 0);
      const threshold = Math.max(Number(product.lowStockThreshold ?? product.alertQuantity ?? product.reorderLevel ?? defaultLow), 0);
      const path = `/product-detail/${product.id}`;

      if (stock <= 0) {
        out.push({ id: `stock-out:${product.id}`, title: t.outTitle, description: name, path, icon: PackageX });
      } else if (threshold > 0 && stock <= threshold) {
        low.push({ id: `stock-low:${product.id}:${stock}:${threshold}`, title: t.lowTitle, description: `${name} · ${stock}`, path, icon: Box });
      }

      getProductBatchBalances(stockMovements, product.id)
        .filter((batch) => Number(batch.available || 0) > 0 && batch.expiryDate)
        .forEach((batch) => {
          const days = daysUntil(batch.expiryDate);
          const description = `${name} · ${batch.batchNo || "Batch"} · ${batch.expiryDate}`;
          if (days < 0) expired.push({ id: `expired:${product.id}:${batch.batchNo}:${batch.expiryDate}`, title: t.expiredTitle, description, path, icon: AlertTriangle });
          else if (days <= 60) expiring.push({ id: `expiring:${product.id}:${batch.batchNo}:${batch.expiryDate}`, title: t.expiringTitle, description, path, icon: Clock3 });
        });
    });

    return [
      { key: "expired", title: t.expired, icon: AlertTriangle, items: expired },
      { key: "expiring", title: t.expiring, icon: Clock3, items: expiring },
      { key: "low", title: t.low, icon: Box, items: low },
      { key: "out", title: t.out, icon: PackageX, items: out },
    ].filter((group) => group.items.length);
  }, [products, stockMovements, currentSettings.lowStockThreshold, t]);

  const cleared = new Set(notificationState.clearedIds);
  const read = new Set(notificationState.readIds);
  const visibleGroups = notificationGroups.map((group) => ({ ...group, items: group.items.filter((item) => !cleared.has(item.id)) })).filter((group) => group.items.length);
  const visibleItems = visibleGroups.flatMap((group) => group.items.map((item) => ({ ...item, groupTitle: group.title })));
  const alertCount = visibleItems.filter((item) => !read.has(item.id)).length;

  const persist = (next) => { setNotificationState(next); localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(next)); };
  const markAllRead = () => persist({ ...notificationState, readIds: [...new Set([...notificationState.readIds, ...visibleItems.map((item) => item.id)])] });
  const clearAll = () => persist({ ...notificationState, clearedIds: [...new Set([...notificationState.clearedIds, ...visibleItems.map((item) => item.id)])] });
  const remove = (id) => persist({ ...notificationState, clearedIds: [...new Set([...notificationState.clearedIds, id])] });
  const openAlert = (item) => { persist({ ...notificationState, readIds: [...new Set([...notificationState.readIds, item.id])] }); setOpenMenu(null); navigate(item.path); };

  const selectLanguage = (key) => {
    const selected = languages.find((item) => item.key === key) || languages[2];
    localStorage.setItem(LANGUAGE_STATE_KEY, selected.key);
    document.documentElement.lang = selected.key;
    document.documentElement.dir = selected.direction;
    document.body.dir = selected.direction;
    document.body.dataset.language = selected.key;
    document.body.dataset.direction = selected.direction;
    setLanguage(selected.key);
    setOpenMenu(null);
    window.dispatchEvent(new Event("app-language-updated"));
  };
  const activeLanguage = languages.find((item) => item.key === language) || languages[2];
  const changeCurrency = async (event) => {
    const nextCurrency = event.target.value;
    const saved = await setSettings([{ ...currentSettings, currency: nextCurrency, updatedAt: new Date().toISOString() }]);
    if (saved) window.dispatchEvent(new Event("company-settings-updated"));
  };

  if (compact) {
    return <div className="header-menu mobile-brand-actions">
      <button type="button" className="profile-btn mobile-actions-toggle" onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}>
        <User size={17}/>{alertCount > 0 && <span className="alert-count">{alertCount}</span>}<ChevronDown size={14}/>
      </button>
      {openMenu === "mobile" && <div className="dropdown mobile-actions-dropdown">
        <strong>{currentUser?.fullName || currentUser?.email || "User"}</strong><p>{currentUser?.email || ""}</p>
        <Link to="/settings" className="dropdown-action" onClick={() => setOpenMenu(null)}><Settings size={15}/>{t.settings}</Link>
        <div className="dropdown-alerts"><span><Globe2 size={15}/>{t.language}<b>{activeLanguage.short}</b></span>{languages.map((item) => <button type="button" key={item.key} onClick={() => selectLanguage(item.key)}>{item.label}</button>)}</div>
        <button type="button" className="dropdown-logout" onClick={onLogout}><LogOut size={15}/>{t.logout}</button>
      </div>}
    </div>;
  }

  return <div className="topbar-actions">
    <label className="currency-selector"><select value={currency} onChange={changeCurrency} aria-label={t.currency}><option>AFN</option><option>USD</option><option>PKR</option><option>EUR</option></select></label>
    <div className="header-menu">
      <button type="button" className="icon-btn" onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")} aria-label={t.notifications}><Bell size={20}/>{alertCount > 0 && <span className="alert-count">{alertCount}</span>}</button>
      {openMenu === "alerts" && <div className="dropdown alert-dropdown notification-dropdown">
        <div className="notification-dropdown-header"><div className="notification-dropdown-title"><strong>{t.notifications}</strong>{alertCount > 0 && <span>{alertCount}</span>}</div><div className="notification-header-actions"><button type="button" onClick={markAllRead} disabled={!visibleItems.length}><CheckCheck size={14}/></button><button type="button" onClick={clearAll} disabled={!visibleItems.length}><Trash2 size={14}/></button></div></div>
        {visibleGroups.length ? <><div className="notification-group-list">{visibleGroups.map((group) => { const Icon = group.icon; return <div key={group.key} className="notification-group-row"><Icon size={15}/><span>{group.title} ({group.items.length})</span></div>; })}</div><div className="notification-item-list">{visibleItems.slice(0, 12).map((item) => { const Icon = item.icon; return <div key={item.id} className={`notification-item${read.has(item.id) ? " read" : ""}`}><button type="button" className="notification-icon" onClick={() => openAlert(item)}><Icon size={15}/></button><button type="button" className="notification-item-content" onClick={() => openAlert(item)}><strong>{item.title}</strong><p>{item.description}</p><small>{read.has(item.id) ? t.read : t.unread}</small></button><button type="button" className="notification-remove-btn" onClick={() => remove(item.id)}><Trash2 size={13}/></button></div>; })}</div></> : <div className="notification-empty">{t.none}</div>}
      </div>}
    </div>
    <div className="header-menu"><button type="button" className="icon-btn header-language-btn" onClick={() => setOpenMenu(openMenu === "language" ? null : "language")}><Globe2 size={20}/></button>{openMenu === "language" && <div className="dropdown language-dropdown">{languages.map((item) => <button type="button" key={item.key} className={language === item.key ? "active" : ""} onClick={() => selectLanguage(item.key)}><span>{item.label}</span><small>{item.direction.toUpperCase()}</small></button>)}</div>}</div>
    <div className="header-menu profile-menu"><button type="button" className="profile-btn" onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}><User size={20}/></button>{openMenu === "profile" && <div className="dropdown profile-dropdown"><strong>{currentUser?.fullName || currentUser?.email || "User"}</strong><p>{currentUser?.email || ""}</p><Link to="/settings" className="dropdown-action" onClick={() => setOpenMenu(null)}><Settings size={15}/>{t.settings}</Link><button type="button" className="dropdown-logout" onClick={onLogout}><LogOut size={15}/>{t.logout}</button></div>}</div>
  </div>;
}

function Header({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_STATE_KEY) || "en");
  const t = labels[language] || labels.en;

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

  useEffect(() => { const outside = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); }; document.addEventListener("mousedown", outside); return () => document.removeEventListener("mousedown", outside); }, []);
  useEffect(() => { const sync = () => setLanguage(localStorage.getItem(LANGUAGE_STATE_KEY) || "en"); window.addEventListener("app-language-updated", sync); return () => window.removeEventListener("app-language-updated", sync); }, []);

  const results = useMemo(() => {
    const all = buildSystemSearchResults({ products, productGroups, countries, manufacturers, suppliers, customers, purchases, sales, customerPayments, supplierPayments }, query, { limit: 18 });
    return (filter === "All" ? all : all.filter((row) => row.type === filter)).slice(0, 18);
  }, [products, productGroups, countries, manufacturers, suppliers, customers, purchases, sales, customerPayments, supplierPayments, query, filter]);
  const filters = ["All", "Product", "Manufacturer", "Supplier", "Customer", "Purchase", "Sale", "Payment"];
  const openResult = (path) => { setOpen(false); setQuery(""); navigate(path); };
  const fullResults = () => { if (query.trim().length >= 2) { setOpen(false); navigate(`/search-results?q=${encodeURIComponent(query.trim())}`); } };

  return <header className="topbar">
    <div className="header-search global-search" ref={ref}>
      <button type="button" className="global-search-submit" onClick={fullResults}><Search size={17}/></button>
      <input placeholder={t.search} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); fullResults(); } }}/>
      {open && query.trim().length >= 2 && <div className="global-search-results">
        <div className="global-search-results-header"><strong>{t.systemSearch}</strong><span>{results.length}</span></div>
        <button type="button" className="global-search-view-all" onClick={fullResults}>{t.openFull}</button>
        <div className="global-search-filters">{filters.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "All" ? t.all : (t.types[item] || item)}</button>)}</div>
        {results.map((row) => <button type="button" key={row.key} className="global-search-result" onClick={() => openResult(row.path)}><span>{t.types[row.type] || row.type}</span><strong>{row.title}</strong><em>{row.subtitle}</em><div>{row.details.slice(0, 4).map((detail) => <small key={detail}>{detail}</small>)}</div></button>)}
        {!results.length && <div className="global-search-empty">{t.noResult}</div>}
      </div>}
    </div>
    <HeaderActions currentUser={currentUser} onLogout={onLogout}/>
  </header>;
}

Header.Actions = HeaderActions;
export default Header;
