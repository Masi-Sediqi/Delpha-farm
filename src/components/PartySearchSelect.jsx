import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { normalizeSupplierName } from "../utils/supplierName";
import "./SupplierSearchSelect.css";

export default function PartySearchSelect({ records, value, onChange, placeholder, language, partyType = "supplier", triggerRef, portal = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const trigger = useRef(null);
  const listId = useId();
  const popup = useRef(null);
  const holder = useRef(null);
  const [popupStyle, setPopupStyle] = useState({});
  useLayoutEffect(() => {
    if (!open || !portal) return undefined;
    const position = () => {
      const rect = trigger.current.getBoundingClientRect();
      const height = Math.min(320, window.innerHeight - 24);
      const below = window.innerHeight - rect.bottom - 8;
      const top = below >= Math.min(height, 200) ? rect.bottom + 4 : Math.max(8, rect.top - height - 4);
      setPopupStyle({ position: "fixed", top, left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width, maxHeight: Math.max(100, Math.min(height, window.innerHeight - top - 8)), zIndex: 2147483001 });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); };
  }, [open, portal]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!holder.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const isProduct = partyType === "product";
  const isCustomer = partyType === "customer";
  const recordName = (record) => isProduct ? (record.productName || record.name) : isCustomer ? (record.fullName || record.companyName || record.name) : (record.supplierName || record.name);
  const selected = records.find((supplier) => String(supplier.id) === String(value));
  const search = normalizeSupplierName(query);
  const matches = records.filter((supplier) => isProduct || supplier.status !== "inactive")
    .filter((supplier) => normalizeSupplierName([recordName(supplier), supplier.companyName, supplier.phone, supplier.mobile, supplier.contactNumber, supplier.contactPerson, supplier.manufacturerName, supplier.productNameEn, supplier.id].filter(Boolean).join(" ")).includes(search));
  const pick = (id) => {
    onChange(String(id));
    setOpen(false);
    trigger.current?.focus();
  };
  const searchLabel = isProduct ? (language === "en" ? "Search product..." : "جستجوی نام جنس...") : isCustomer
    ? (language === "en" ? "Search customer name or phone..." : language === "ps" ? "د پېرودونکي نوم یا شمېره ولټوئ..." : "جستجوی نام یا شماره تماس مشتری...")
    : (language === "en" ? "Search supplier name or phone..." : language === "ps" ? "د عرضه کوونکي نوم یا شمېره ولټوئ..." : "جستجوی نام یا شماره تماس تأمین‌کننده...");
  const emptyLabel = isProduct ? (language === "en" ? "No product found." : "جنس پیدا نشد.") : isCustomer
    ? (language === "en" ? "No customer found." : language === "ps" ? "پېرودونکی ونه موندل شو." : "مشتری پیدا نشد.")
    : (language === "en" ? "No supplier found." : language === "ps" ? "عرضه کوونکی ونه موندل شو." : "تأمین‌کننده پیدا نشد.");
  const dropdown = <div className="supplier-search-dropdown">
      <input autoFocus role="combobox" aria-label={searchLabel} aria-autocomplete="list" aria-expanded="true" aria-controls={listId} aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined} placeholder={searchLabel} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
        if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0))); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); }
        if (event.key === "Enter") { event.preventDefault(); if (matches[active]) pick(matches[active].id); }
      }} />
      <div id={listId} role="listbox" aria-label={placeholder} className="supplier-search-results">
        <button type="button" role="option" aria-selected={!value} onMouseDown={(event) => event.preventDefault()} onClick={() => pick("")}>{placeholder}</button>
        {matches.map((supplier, index) => <button id={`${listId}-${index}`} key={supplier.id} type="button" role="option" aria-selected={String(supplier.id) === String(value)} className={active === index ? "is-active" : ""} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => pick(supplier.id)}>
          <span>{recordName(supplier)}</span>{supplier.phone && <small dir="ltr">{supplier.phone}</small>}
        </button>)}
        {!matches.length && <p role="status">{emptyLabel}</p>}
      </div>
    </div>;
  return <div className="supplier-search-select" ref={holder} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget) && !popup.current?.contains(event.relatedTarget) && !event.relatedTarget?.closest?.("[data-entry-picker-popup]")) setOpen(false);
  }}>
    <button ref={(node) => { trigger.current = node; if (triggerRef) triggerRef.current = node; }} type="button" className="supplier-search-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => {
      setOpen(!open); setQuery(""); setActive(0);
    }}><span>{(selected && recordName(selected)) || placeholder}</span><ChevronDown size={14} /></button>
    {open && (portal ? createPortal(<div className="supplier-search-select supplier-search-portal" ref={popup} style={popupStyle} dir={language === "en" ? "ltr" : "rtl"} data-entry-picker-popup="true">{dropdown}</div>, document.body) : dropdown)}
  </div>;
}
