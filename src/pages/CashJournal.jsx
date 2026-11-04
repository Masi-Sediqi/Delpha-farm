import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpenCheck, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { todayDateValue, formatAfghanDate } from "../utils/afghanDate";
import "./CashJournal.css";
import "./CashJournalPolish.css";
import "./CashJournalUnified.css";

const codes = ["AFN", "USD", "PKR", "EUR"];
const num = (value) => Number(value || 0) || 0;
const currency = (value) => String(value || "AFN").toUpperCase().replace("INR", "PKR");
const partyName = (row, type) => type === "customer" ? (row.fullName || row.companyName || row.name || "مشتری") : (row.supplierName || row.name || row.companyName || "تأمین‌کننده");
const emptyRow = () => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, account: "", partyKey: "", debit: "", credit: "", details: "" });
const INITIAL_ROWS = 50;
const makeInitialRows = () => Array.from({ length: INITIAL_ROWS }, () => emptyRow());
const JEN = (number) => `JEN${String(number).padStart(5, "0")}`;

function AccountPicker({ row, options, update }) {
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState(0);
  const holder = useRef(null);
  const q = String(row.account || "").trim().toLowerCase();
  const matches = options.filter((option) => !q || `${option.name} ${option.searchText || ""} ${option.typeLabel}`.toLowerCase().includes(q)).slice(0, 30);
  const pick = (option) => { update({ ...row, account: option.name, partyKey: option.key }); setOpened(false); };
  return <div className="journal-party-search" ref={holder} onBlur={(event) => { if (!holder.current?.contains(event.relatedTarget)) setOpened(false); }}>
    <div className="journal-party-input"><Search size={15}/><input aria-label="نام اکونت" autoComplete="off" value={row.account} placeholder="جستجوی تمام مشتریان، تأمین‌کنندگان یا حساب عمومی..." onFocus={() => setOpened(true)} onChange={(event) => { update({ ...row, account: event.target.value, partyKey: "" }); setOpened(true); setActive(0); }} onKeyDown={(event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setOpened(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setOpened(true); setActive((i) => Math.max(0, i - 1)); }
      if (event.key === "Enter" && opened && matches[active]) { event.preventDefault(); pick(matches[active]); }
      if (event.key === "Escape") setOpened(false);
    }}/></div>
    {opened && <div className="journal-party-results">{matches.length ? matches.map((option, index) => <button key={option.key} type="button" className={index === active ? "active" : ""} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => pick(option)}><span><strong>{option.name}</strong><small>{option.typeLabel}</small></span></button>) : <div className="journal-no-result">حساب پیدا نشد. برای حساب عمومی می‌توانید نام را مستقیم وارد کنید.</div>}</div>}
  </div>;
}

export default function CashJournal() {
  const [customers] = useJsonCollection("customerRegistry");
  const [suppliers] = useJsonCollection("suppliers");
  const [expenseAccounts] = useJsonCollection("expenseAccounts");
  const [bankAccounts] = useJsonCollection("bankAccounts");
  const [entries, setEntries] = useJsonCollection("partyCashTransactions");
  const [opened, setOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(todayDateValue());
  const [code, setCode] = useState("AFN");
  const [rows, setRows] = useState(makeInitialRows);
  useEffect(() => { document.body.classList.toggle("cash-journal-open", opened); return () => document.body.classList.remove("cash-journal-open"); }, [opened]);

  // All registered accounts are selectable regardless of outstanding balance.
  const options = useMemo(() => [
    ...customers.map((row) => ({ key: `customer:${row.id}`, name: partyName(row, "customer"), searchText: [row.companyName, row.phone, row.mobile, row.contactNumber, row.id].filter(Boolean).join(" "), typeLabel: "مشتری" })),
    ...suppliers.map((row) => ({ key: `supplier:${row.id}`, name: partyName(row, "supplier"), typeLabel: "تأمین‌کننده" })),
    ...expenseAccounts.map((row) => ({ key: `expense:${row.id}`, name: row.name || row.accountName || "حساب مصرف", typeLabel: "حساب مصرف" })),
    ...bankAccounts.map((row) => ({ key: `bank:${row.id}`, name: row.accountName || row.bankName || row.name || "بانک", typeLabel: "بانک" })),
    { key: "general:cash", name: "دخل شرکت", typeLabel: "حساب عمومی" },
  ].filter((option) => option.name), [customers, suppliers, expenseAccounts, bankAccounts]);

  // Existing records remain intact; only a new page receives a JEN number.
  const nextSequence = useMemo(() => Math.max(0, ...entries.map((entry) => {
    const match = String(entry.pageNumber || entry.reference || "").match(/^JEN(\d+)/i);
    return match ? Number(match[1]) : 0;
  })) + 1, [entries]);
  const pageNumber = JEN(nextSequence);
  const updateRow = (id, value) => setRows((current) => current.map((row) => row.id === id ? value : row));
  const canAddRow = rows.length >= INITIAL_ROWS && rows.every((row) => row.account.trim() && (num(row.debit) > 0 || num(row.credit) > 0));
  const totals = rows.reduce((acc, row) => ({ debit: acc.debit + num(row.debit), credit: acc.credit + num(row.credit) }), { debit: 0, credit: 0 });

  const save = async () => {
    if (saving) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayDateValue()) return notify("ثبت روزنامچه به تاریخ فردا یا آینده مجاز نیست.", "warning");
    const prepared = rows.filter((row) => row.account.trim() || row.details.trim() || num(row.debit) || num(row.credit));
    if (!prepared.length) return notify("حداقل یک ردیف روزنامچه را تکمیل کنید.", "warning");
    if (prepared.some((row) => !row.account.trim() || (num(row.debit) <= 0 && num(row.credit) <= 0) || (num(row.debit) > 0 && num(row.credit) > 0) || num(row.debit) < 0 || num(row.credit) < 0)) return notify("برای هر ردیف نام اکونت و فقط یکی از Debit یا Credit را وارد کنید.", "warning");
    const now = new Date().toISOString();
    // Each page has one sequential reference; its lines remain separate ledger records.
    const records = prepared.map((row, index) => {
      const [type, id] = row.partyKey.split(":");
      const incoming = num(row.debit) > 0;
      const amount = incoming ? num(row.debit) : num(row.credit);
      return { id: `JRN-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, pageNumber, lineNumber: index + 1, direction: incoming ? "in" : "out", date, currency: code, amount, debit: incoming ? amount : 0, credit: incoming ? 0 : amount, accountName: row.account.trim(), partyType: ["customer", "supplier"].includes(type) ? type : "", partyId: ["customer", "supplier"].includes(type) ? id : "", partyName: row.account.trim(), accountType: type || "general", accountId: id || "", note: row.details.trim(), description: row.details.trim(), reference: pageNumber, createdAt: now, updatedAt: now };
    });
    setSaving(true);
    try {
      if (await setEntries([...records, ...entries])) { setRows(makeInitialRows()); setOpened(false); notify(`صفحه ${pageNumber} با ${records.length} ردیف ذخیره شد.`, "success"); }
    } finally { setSaving(false); }
  };
  const visible = useMemo(() => entries.filter((row) => !query.trim() || `${row.accountName || row.partyName || ""} ${row.description || row.note || ""} ${row.reference || ""} ${row.currency || ""}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || ""))), [entries, query]);

  const modal = opened ? <div className="cash-journal-overlay"><div className="cash-journal-modal unified-journal-modal"><header><div><BookOpenCheck/><div><h2>روزنامچه شماره {pageNumber}</h2><p>Debit دریافت پول به شرکت، Credit پرداخت پول از شرکت</p></div></div><button type="button" onClick={() => setOpened(false)} aria-label="بستن"><X/></button></header><main><section className="cash-journal-panel unified-journal-panel"><header><div className="journal-page-info"><strong>{pageNumber}</strong><small>شماره مسلسل اتومات</small></div><div className="journal-side-controls"><label><small>واحد پول</small><select value={code} onChange={(event) => setCode(event.target.value)}>{codes.map((c) => <option key={c}>{c}</option>)}</select></label><label><small>تاریخ میلادی</small><input type="date" max={todayDateValue()} value={date} onChange={(event) => setDate(event.target.value)}/><small>تاریخ هجری شمسی: {formatAfghanDate(date, { pad: true })}</small></label></div></header><div className="journal-entry-head"><span>نام اکونت</span><span>تفصیلات</span><span>Debit (دریافت)</span><span>Credit (پرداخت)</span><span></span></div><div className="journal-entry-list">{rows.map((row) => <div className="journal-entry-row" key={row.id}><AccountPicker row={row} options={options} update={(value) => updateRow(row.id, value)}/><textarea aria-label="تفصیلات" value={row.details} maxLength={150} rows={2} onChange={(event) => updateRow(row.id, { ...row, details: event.target.value.slice(0, 150) })} placeholder="تفصیلات معامله"/><input type="number" aria-label="Debit دریافت" min="0" step="any" value={row.debit} onChange={(event) => updateRow(row.id, { ...row, debit: event.target.value, credit: event.target.value && num(event.target.value) > 0 ? "" : row.credit })} placeholder="0"/><input type="number" aria-label="Credit پرداخت" min="0" step="any" value={row.credit} onChange={(event) => updateRow(row.id, { ...row, credit: event.target.value, debit: event.target.value && num(event.target.value) > 0 ? "" : row.debit })} placeholder="0"/><button className="journal-remove" tabIndex={-1} type="button" title="حذف ردیف" onClick={() => setRows((current) => current.length === 1 ? [emptyRow()] : current.filter((item) => item.id !== row.id))}><Trash2 size={15}/></button></div>)}</div><button type="button" className="journal-add-row" disabled={!canAddRow} title={!canAddRow ? "پس از تکمیل ۵۰ ردیف اولیه، می‌توانید ردیف بیشتری اضافه کنید." : "افزودن ردیف"} onClick={() => setRows((current) => [...current, emptyRow()])}><Plus size={16}/>افزودن ردیف دیگر ({rows.length} ردیف)</button></section></main><footer><span>Debit: {totals.debit.toLocaleString()} {code} | Credit: {totals.credit.toLocaleString()} {code}</span><div><button type="button" className="journal-cancel" onClick={() => setOpened(false)}>لغو</button><button type="button" className="journal-save-all" disabled={saving} onClick={save}>{saving ? "در حال ذخیره..." : `ذخیره ${pageNumber}`}</button></div></footer></div></div> : null;

  return <div className="cash-journal-page" dir="rtl"><header className="cash-journal-head"><div><BookOpenCheck size={24}/><div><h1>روزنامچه نقدی</h1><p>ثبت یکپارچه دریافت و پرداخت، با شماره مسلسل هر صفحه</p></div></div><button type="button" onClick={() => { setDate(todayDateValue()); setRows(makeInitialRows()); setOpened(true); }}><Plus size={18}/>ثبت روزنامچه</button></header><div className="cash-journal-toolbar"><label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی نام اکونت، تفصیلات یا نمبر JEN..."/></label></div><div className="cash-journal-table"><table><thead><tr><th>نمبر صفحه</th><th>تاریخ میلادی</th><th>تاریخ هجری شمسی</th><th>نام اکونت</th><th>تفصیلات</th><th>Debit</th><th>Credit</th><th>اسعار</th></tr></thead><tbody>{visible.length ? visible.map((row) => <tr key={row.id}><td>{row.pageNumber || row.reference || "قدیمی"}</td><td>{String(row.date || "").slice(0,10)}</td><td>{formatAfghanDate(row.date)}</td><td>{row.accountName || row.partyName || "عمومی"}</td><td>{row.note || row.description || ""}</td><td className="in">{row.direction === "in" ? num(row.amount).toLocaleString() : ""}</td><td className="out">{row.direction === "out" ? num(row.amount).toLocaleString() : ""}</td><td>{row.currency}</td></tr>) : <tr><td colSpan="8" className="journal-empty">هنوز ریکاردی ثبت نشده است.</td></tr>}</tbody></table></div>{modal && createPortal(modal, document.body)}</div>;
}
