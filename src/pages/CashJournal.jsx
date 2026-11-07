import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpenCheck, Plus, Search, Trash2, X, Eye, Pencil, Printer } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { todayDateValue, formatAfghanDate, gregorianToAfghan, afghanToGregorian, getAfghanMonthDays, AFGHAN_MONTHS } from "../utils/afghanDate";
import "./CashJournal.css";
import "./CashJournalPolish.css";
import "./CashJournalUnified.css";

const codes = ["AFN", "USD", "PKR", "EUR"];
const num = (value) => Number(value || 0) || 0;
const currency = (value) => String(value || "AFN").toUpperCase().replace("INR", "PKR");
const partyName = (row, type) => type === "customer" ? (row.fullName || row.companyName || row.name || "مشتری") : (row.supplierName || row.name || row.companyName || "تأمین‌کننده");
const emptyRow = () => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, account: "", partyKey: "", debit: "", credit: "", details: "", autoDetails: false, detailsTouched: false });
const INITIAL_ROWS = 50;
const makeInitialRows = () => Array.from({ length: INITIAL_ROWS }, () => emptyRow());
const JEN = (number) => `JEN${String(number).padStart(5, "0")}`;
const padDate = (value) => String(value).padStart(2, "0");
const validGregorianDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};
const isAllowedJournalDate = (value) => validGregorianDate(value) && value <= todayDateValue();

/** Both calendars edit the same Gregorian ISO date saved in the journal. */
function JournalDateFields({ value, onChange }) {
  const afghan = gregorianToAfghan(value) || gregorianToAfghan(todayDateValue());
  const maximum = gregorianToAfghan(todayDateValue());
  const earliestYear = gregorianToAfghan("1900-01-01").jy;
  const years = Array.from({ length: maximum.jy - earliestYear + 1 }, (_, index) => maximum.jy - index);
  const updateGregorian = (next) => {
    if (!next || !isAllowedJournalDate(next)) {
      if (next) notify("ثبت روزنامچه به تاریخ فردا یا تاریخ نامعتبر مجاز نیست.", "warning");
      return;
    }
    onChange(next);
  };
  const updateAfghan = (part, nextValue) => {
    const target = { ...afghan, [part]: Number(nextValue) };
    target.jd = Math.min(target.jd, getAfghanMonthDays(target.jy, target.jm));
    const next = afghanToGregorian(target.jy, target.jm, target.jd);
    if (!isAllowedJournalDate(next)) {
      notify("انتخاب تاریخ آینده یا تاریخ نامعتبر مجاز نیست.", "warning");
      return;
    }
    onChange(next);
  };
  const monthLimit = afghan.jy === maximum.jy ? maximum.jm : 12;
  const dayLimit = Math.min(getAfghanMonthDays(afghan.jy, afghan.jm), afghan.jy === maximum.jy && afghan.jm === maximum.jm ? maximum.jd : 31);
  return <div className="journal-dual-dates">
    <label className="journal-gregorian-date"><small>تاریخ میلادی</small><input type="date" lang="en" dir="ltr" value={value} min="1900-01-01" max={todayDateValue()} onChange={(event) => updateGregorian(event.target.value)} aria-label="انتخاب تاریخ میلادی" /></label>
    <fieldset className="journal-afghan-date"><legend>تاریخ هجری شمسی</legend><div className="journal-afghan-selects" dir="ltr">
      <select aria-label="سال هجری شمسی" value={afghan.jy} onChange={(event) => updateAfghan("jy", event.target.value)}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
      <select aria-label="ماه هجری شمسی" value={afghan.jm} onChange={(event) => updateAfghan("jm", event.target.value)}>{AFGHAN_MONTHS.slice(0, monthLimit).map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
      <select aria-label="روز هجری شمسی" value={afghan.jd} onChange={(event) => updateAfghan("jd", event.target.value)}>{Array.from({ length: dayLimit }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{padDate(day)}</option>)}</select>
    </div></fieldset>
  </div>;
}

const formatAmount = (value) => num(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
const defaultDetails = (row) => {
  if (!row.account.trim() || (num(row.debit) <= 0 && num(row.credit) <= 0)) return "";
  return `${num(row.debit) > 0 ? "رسید نقدی از" : "پرداخت نقدی به"} ${row.account.trim()}`.slice(0, 150);
};
const withSuggestedDetails = (row, date, code) => {
  // Never overwrite a description typed or edited by the user.
  if (row.detailsTouched) return row;
  return { ...row, details: defaultDetails(row), autoDetails: true };
};

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
  const [editingPage, setEditingPage] = useState(null);
  const [viewPage, setViewPage] = useState(null);
  const [printPage, setPrintPage] = useState(null);
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
  const pageNumber = editingPage || JEN(nextSequence);
  const openNew = () => { setEditingPage(null); setDate(todayDateValue()); setRows(makeInitialRows()); setOpened(true); };
  const openEdit = (group) => {
    setViewPage(null);
    setEditingPage(group.key);
    setDate(String(group.lines[0]?.date || todayDateValue()).slice(0, 10));
    setCode(currency(group.lines[0]?.currency));
    const restored = group.lines.map((item) => ({
      ...emptyRow(), id: `edit-${item.id}`,
      sourceId: item.id,
      account: item.accountName || item.partyName || "",
      partyKey: item.partyType && item.partyId ? `${item.partyType}:${item.partyId}` : `${item.accountType || "general"}:${item.accountId || ""}`,
      debit: item.direction === "in" ? String(item.amount || "") : "",
      credit: item.direction === "out" ? String(item.amount || "") : "",
      details: item.note || item.description || "", autoDetails: false, detailsTouched: true,
    }));
    setRows([...restored, ...Array.from({ length: Math.max(0, INITIAL_ROWS-restored.length) }, emptyRow)]);
    setOpened(true);
  };
  const updateRow = (id, value) => setRows((current) => current.map((row) => row.id === id ? withSuggestedDetails(value, date, code) : row));
  const updateDate = (value) => { if (!isAllowedJournalDate(value)) return; setDate(value); setRows((current) => current.map((row) => withSuggestedDetails(row, value, code))); };
  const updateCurrency = (value) => { setCode(value); setRows((current) => current.map((row) => withSuggestedDetails(row, date, value))); };
  const canAddRow = rows.length >= INITIAL_ROWS && rows.every((row) => row.account.trim() && (num(row.debit) > 0 || num(row.credit) > 0));
  const totals = rows.reduce((acc, row) => ({ debit: acc.debit + num(row.debit), credit: acc.credit + num(row.credit) }), { debit: 0, credit: 0 });

  const save = async () => {
    if (saving) return;
    if (!isAllowedJournalDate(date)) return notify("ثبت روزنامچه به تاریخ فردا یا آینده مجاز نیست.", "warning");
    const prepared = rows.filter((row) => row.account.trim() || row.details.trim() || num(row.debit) || num(row.credit));
    if (!prepared.length) return notify("حداقل یک ردیف روزنامچه را تکمیل کنید.", "warning");
    if (prepared.some((row) => !row.account.trim() || (num(row.debit) <= 0 && num(row.credit) <= 0) || (num(row.debit) > 0 && num(row.credit) > 0) || num(row.debit) < 0 || num(row.credit) < 0)) return notify("برای هر ردیف نام اکونت و فقط یکی از Debit یا Credit را وارد کنید.", "warning");
    const now = new Date().toISOString();
    // Each page has one sequential reference; its lines remain separate ledger records.
    const records = prepared.map((row, index) => {
      const [type, id] = row.partyKey.split(":");
      const incoming = num(row.debit) > 0;
      const amount = incoming ? num(row.debit) : num(row.credit);
      return { id: row.sourceId || `JRN-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, pageNumber, lineNumber: index + 1, direction: incoming ? "in" : "out", date, currency: code, amount, debit: incoming ? amount : 0, credit: incoming ? 0 : amount, accountName: row.account.trim(), partyType: ["customer", "supplier"].includes(type) ? type : "", partyId: ["customer", "supplier"].includes(type) ? id : "", partyName: row.account.trim(), accountType: type || "general", accountId: id || "", note: row.details.trim(), description: row.details.trim(), reference: pageNumber, createdAt: now, updatedAt: now };
    });
    setSaving(true);
    try {
      const retained = editingPage ? entries.filter((item) => String(item.pageNumber || item.reference) !== editingPage) : entries;
      if (await setEntries([...records, ...retained])) { setRows(makeInitialRows()); setOpened(false); setEditingPage(null); notify(`صفحه ${pageNumber} با ${records.length} ردیف ذخیره شد.`, "success"); }
    } finally { setSaving(false); }
  };
  const grouped = useMemo(() => {
    const result = new Map();
    entries.forEach((entry) => {
      const key = String(entry.pageNumber || entry.reference || entry.id || "");
      if (!result.has(key)) result.set(key, { key, lines: [] });
      result.get(key).lines.push(entry);
    });
    const q = query.trim().toLowerCase();
    return [...result.values()].map((group) => ({
      ...group, lines: [...group.lines].sort((a,b) => num(a.lineNumber || 1)-num(b.lineNumber || 1)),
    })).filter((group) => !q || group.key.toLowerCase().includes(q) || group.lines.some((line) =>
      `${line.accountName || line.partyName || ""} ${line.note || line.description || ""} ${line.currency || ""}`.toLowerCase().includes(q)
    )).sort((a,b) => String(b.lines[0]?.date || b.lines[0]?.createdAt || "").localeCompare(String(a.lines[0]?.date || a.lines[0]?.createdAt || "")) || b.key.localeCompare(a.key));
  }, [entries, query]);
  const shownPage = grouped.find((g) => g.key === viewPage);
  useEffect(() => {
    if (!printPage || viewPage !== printPage || !shownPage) return;
    const timer = window.setTimeout(() => { window.print(); setPrintPage(null); }, 100);
    return () => window.clearTimeout(timer);
  }, [printPage, viewPage, shownPage]);

  const modal = opened ? <div className="cash-journal-overlay"><div className="cash-journal-modal unified-journal-modal"><header><div><BookOpenCheck/><div><h2>روزنامچه شماره {pageNumber}</h2><p>Debit دریافت پول به شرکت، Credit پرداخت پول از شرکت</p></div></div><button type="button" onClick={() => setOpened(false)} aria-label="بستن"><X/></button></header><main><section className="cash-journal-panel unified-journal-panel"><header><div className="journal-page-info"><strong>{pageNumber}</strong><small>شماره مسلسل اتومات</small></div><div className="journal-side-controls"><label><small>واحد پول</small><select value={code} onChange={(event) => updateCurrency(event.target.value)}>{codes.map((c) => <option key={c}>{c}</option>)}</select></label><JournalDateFields value={date} onChange={updateDate}/></div></header><div className="journal-entry-head"><span>نام اکونت</span><span>Debit (دریافت)</span><span>Credit (پرداخت)</span><span>تفصیلات</span><span></span></div><div className="journal-entry-list">{rows.map((row) => <div className="journal-entry-row" key={row.id}><AccountPicker row={row} options={options} update={(value) => updateRow(row.id, value)}/><input type="number" aria-label="Debit دریافت" min="0" step="any" value={row.debit} onChange={(event) => updateRow(row.id, { ...row, debit: event.target.value, credit: event.target.value && num(event.target.value) > 0 ? "" : row.credit })} placeholder="0"/><input type="number" aria-label="Credit پرداخت" min="0" step="any" value={row.credit} onChange={(event) => updateRow(row.id, { ...row, credit: event.target.value, debit: event.target.value && num(event.target.value) > 0 ? "" : row.debit })} placeholder="0"/><textarea aria-label="تفصیلات" value={row.details} maxLength={150} rows={2} onChange={(event) => updateRow(row.id, { ...row, details: event.target.value.slice(0, 150), autoDetails: false, detailsTouched: true })} placeholder="پس از انتخاب حساب و درج مبلغ، تفصیلات خودکار نوشته می‌شود"/><button className="journal-remove" tabIndex={-1} type="button" title="حذف ردیف" onClick={() => setRows((current) => current.length === 1 ? [emptyRow()] : current.filter((item) => item.id !== row.id))}><Trash2 size={15}/></button></div>)}</div><button type="button" className="journal-add-row" disabled={!canAddRow} title={!canAddRow ? "پس از تکمیل ۵۰ ردیف اولیه، می‌توانید ردیف بیشتری اضافه کنید." : "افزودن ردیف"} onClick={() => setRows((current) => [...current, emptyRow()])}><Plus size={16}/>افزودن ردیف دیگر ({rows.length} ردیف)</button></section></main><footer><span>Debit: {totals.debit.toLocaleString()} {code} | Credit: {totals.credit.toLocaleString()} {code}</span><div><button type="button" className="journal-cancel" onClick={() => setOpened(false)}>لغو</button><button type="button" className="journal-save-all" disabled={saving} onClick={save}>{saving ? "در حال ذخیره..." : `ذخیره ${pageNumber}`}</button></div></footer></div></div> : null;

  return <div className="cash-journal-page" dir="rtl"><header className="cash-journal-head"><div><BookOpenCheck size={24}/><div><h1>روزنامچه نقدی</h1><p>ثبت یکپارچه دریافت و پرداخت، با شماره مسلسل هر صفحه</p></div></div><button type="button" onClick={openNew}><Plus size={18}/>ثبت روزنامچه</button></header><div className="cash-journal-toolbar"><label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی نام اکونت، تفصیلات یا نمبر JEN..."/></label></div><div className="cash-journal-table"><table><thead><tr><th>نمبر صفحه</th><th>تاریخ میلادی</th><th>تاریخ هجری شمسی</th><th>نام اکونت</th><th>اولین ترانزکشن</th><th>تعداد ردیف</th><th>عملیات</th></tr></thead><tbody>{grouped.length ? grouped.map((group) => {
    const first = group.lines[0];
    return <tr key={group.key}><td dir="ltr">{group.key}</td><td dir="ltr">{String(first.date || "").slice(0,10)}</td><td>{formatAfghanDate(first.date)}</td><td>{first.accountName || first.partyName || "عمومی"}</td><td className="journal-summary-cell" title={first.note || first.description || ""}>{(first.note || first.description || (first.direction === "in" ? "رسید نقدی" : "پرداخت نقدی")).slice(0, 65)}</td><td>{group.lines.length}</td><td><div className="journal-table-actions"><button type="button" onClick={() => setViewPage(group.key)} title="نمایش"><Eye size={16}/>نمایش</button><button type="button" onClick={() => openEdit(group)} title="ویرایش"><Pencil size={16}/>ویرایش</button><button type="button" onClick={() => { setViewPage(group.key); setPrintPage(group.key); }} title="چاپ صفحه روزنامچه"><Printer size={16}/>چاپ</button></div></td></tr>;
  }) : <tr><td colSpan="7" className="journal-empty">هنوز ریکاردی ثبت نشده است.</td></tr>}</tbody></table></div>
  {shownPage && createPortal(<div className="cash-journal-overlay journal-view-overlay" role="dialog" aria-modal="true" aria-label={`جزئیات ${shownPage.key}`}><div className="journal-view-card"><header><h2>روزنامچه {shownPage.key}</h2><div className="journal-table-actions print-hidden"><button type="button" onClick={() => openEdit(shownPage)}><Pencil size={16}/>ویرایش</button><button type="button" onClick={() => window.print()}><Printer size={16}/>چاپ</button><button type="button" onClick={() => setViewPage(null)}><X size={16}/>بستن</button></div></header><p>تاریخ: {shownPage.lines[0]?.date} | هجری شمسی: {formatAfghanDate(shownPage.lines[0]?.date)}</p><div className="journal-view-scroll"><table><thead><tr><th>#</th><th>نام اکونت</th><th>تفصیلات</th><th>Debit</th><th>Credit</th><th>اسعار</th></tr></thead><tbody>{shownPage.lines.map((line,index) => <tr key={line.id}><td>{index+1}</td><td>{line.accountName || line.partyName}</td><td className="journal-details-text">{line.note || line.description}</td><td>{line.direction === "in" ? formatAmount(line.amount) : ""}</td><td>{line.direction === "out" ? formatAmount(line.amount) : ""}</td><td>{line.currency}</td></tr>)}</tbody></table></div></div></div>,document.body)}
  {modal && createPortal(modal, document.body)}</div>;
}
