import ShamsiDateInput from "../components/ShamsiDateInput";
import { groupJournalPages, replaceJournalPage } from "../utils/journalPages";
import { accountCurrency, partyAccountRows } from "../utils/partyAccounts";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpenCheck, Plus, Search, Trash2, X, MoreHorizontal, Eye, Pencil, Printer } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import { todayDateValue, formatAfghanDate } from "../utils/afghanDate";
import "./CashJournal.css";
import "./CashJournalPolish.css";
import "./CashJournalUnified.css";

const codes = ["AFN", "USD", "INR", "EUR"];
const num = (value) => Number(value || 0) || 0;
const customerName = (row) => row.fullName || row.companyName || row.name || "مشتری";
const emptyRow = () => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, account: "", partyKey: "", debit: "", credit: "", details: "", autoDetails: false, detailsTouched: false });
const INITIAL_ROWS = 50;
const makeInitialRows = () => Array.from({ length: INITIAL_ROWS }, () => emptyRow());
const JEN = (number) => `JEN${String(number).padStart(5, "0")}`;
const formatAmount = (value) => num(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
const customerBalanceText = (balance, currency) => {
  const amount = formatAmount(Math.abs(balance));
  if (balance > 0.000001) return `این مشتری به ما قرضدار است: ${amount} ${currency}`;
  if (balance < -0.000001) return `ما به این مشتری قرضدار استیم: ${amount} ${currency}`;
  return `حساب مشتری تصفیه است: 0 ${currency}`;
};

const defaultDetails = (row) => {
  const account = row.account.trim();
  const isDebit = num(row.debit) > 0;
  if (!account || (!isDebit && num(row.credit) <= 0)) return "";
  return `${isDebit ? "رسید نقدی از" : "پرداخت نقدی به"} ${account}`;
};
const withSuggestedDetails = (row) => {
  // Never overwrite a description typed or edited by the user.
  if (row.detailsTouched || (row.details?.trim() && !row.autoDetails)) return row;
  return { ...row, details: defaultDetails(row), autoDetails: true };
};

function AccountPicker({ row, options, update, readOnly = false }) {
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState(0);
  const holder = useRef(null);
  const q = String(row.account || "").trim().toLowerCase();
  const matches = options.filter((option) => !q || `${option.name} ${option.searchText || ""} ${option.typeLabel}`.toLowerCase().includes(q)).slice(0, 30);
  const pick = (option) => { update({ ...row, account: option.name, partyKey: option.key }); setOpened(false); };
  const selected = options.find((option) => option.key === row.partyKey);
  const selectedBalance = selected?.balance + (readOnly ? 0 : num(row.credit) - num(row.debit));
  if (readOnly) return <div className="journal-party-selected"><input aria-label="نام اکونت" readOnly value={row.account} />{selected?.type === "customer" && <small className={`journal-customer-balance ${selected.balance > 0 ? "debtor" : selected.balance < 0 ? "creditor" : "settled"}`}>{customerBalanceText(selected.balance, selected.currency)}</small>}</div>;
  return <div className="journal-party-search" ref={holder} onBlur={(event) => { if (!holder.current?.contains(event.relatedTarget)) setOpened(false); }}>
    <div className="journal-party-input"><Search size={15}/><input aria-label="نام اکونت" autoComplete="off" value={row.account} placeholder="جستجوی اکونت یا حساب عمومی..." onFocus={() => setOpened(true)} onChange={(event) => { update({ ...row, account: event.target.value, partyKey: "" }); setOpened(true); setActive(0); }} onKeyDown={(event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setOpened(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setOpened(true); setActive((i) => Math.max(0, i - 1)); }
      if (event.key === "Enter" && opened && matches[active]) { event.preventDefault(); pick(matches[active]); }
      if (event.key === "Escape") { event.preventDefault(); setOpened(false); setActive(0); update({ ...row, account: "", partyKey: "" }); }
    }}/></div>
    {selected?.type === "customer" && <small className={`journal-customer-balance ${selectedBalance > 0 ? "debtor" : selectedBalance < 0 ? "creditor" : "settled"}`}>{customerBalanceText(selectedBalance, selected.currency)}</small>}
    {opened && <div className="journal-party-results">{matches.length ? matches.map((option, index) => <button key={option.key} type="button" className={index === active ? "active" : ""} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => pick(option)}><span><strong>{option.name}</strong><small>{option.typeLabel}</small>{option.type === "customer" && <small className={`journal-customer-balance ${option.balance > 0 ? "debtor" : option.balance < 0 ? "creditor" : "settled"}`}>{customerBalanceText(option.balance, option.currency)}</small>}</span></button>) : <div className="journal-no-result">حساب پیدا نشد. برای حساب عمومی می‌توانید نام را مستقیم وارد کنید.</div>}</div>}
  </div>;
}

export default function CashJournal() {
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [expenseAccounts] = useJsonCollection("expenseAccounts");
  const [bankAccounts] = useJsonCollection("bankAccounts");
  const [entries, setEntries] = useJsonCollection("partyCashTransactions");
  const [opened, setOpened] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [printPage, setPrintPage] = useState(null);
  const actionTrigger = useRef(null);
  const menuRef = useRef(null);
  const pageRowRefs = useRef(new Map());
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState("journal");
  const [date, setDate] = useState(todayDateValue());
  const [code, setCode] = useState("AFN");
  const [rows, setRows] = useState(makeInitialRows);
  useEffect(() => { document.body.classList.toggle("cash-journal-open", opened); return () => document.body.classList.remove("cash-journal-open"); }, [opened]);

  const customerAccounts = useMemo(() => new Map(customers.map((row) => [
    `customer:${row.id}`, accountCurrency(row.currency || row.currencyCode),
  ])), [customers]);
  // Compute from the same financial sources as customer ledgers; do not count journal cash twice.
  const customerBalances = useMemo(() => new Map(partyAccountRows({
    type: "customer", parties: customers, invoices: sales,
    returns: saleReturns, payments: customerPayments, journal: entries,
  }).map((row) => [`customer:${row.party.id}:${row.currency}`, row.balance])),
  [customers, sales, saleReturns, customerPayments, entries]);
  const options = useMemo(() => [
    ...customers.filter((row) => customerAccounts.get(`customer:${row.id}`) === code).map((row) => ({ key: `customer:${row.id}`, name: customerName(row), searchText: [row.companyName, row.phone, row.mobile, row.contactNumber, row.id].filter(Boolean).join(" "), typeLabel: "مشتری", type: "customer", currency: code, balance: customerBalances.get(`customer:${row.id}:${code}`) ?? 0 })),
    ...expenseAccounts.map((row) => ({ key: `expense:${row.id}`, name: row.name || row.accountName || "حساب مصرف", typeLabel: "حساب مصرف" })),
    ...bankAccounts.map((row) => ({ key: `bank:${row.id}`, name: row.accountName || row.bankName || row.name || "بانک", typeLabel: "بانک" })),
    { key: "general:cash", name: "دخل شرکت", typeLabel: "حساب عمومی" },
  ].filter((option) => option.name), [customers, customerAccounts, customerBalances, code, expenseAccounts, bankAccounts]);

  // Existing records remain intact; only a new page receives a JEN number.
  const nextSequence = useMemo(() => Math.max(0, ...entries.map((entry) => {
    const match = String(entry.pageNumber || entry.reference || "").match(/^JEN(\d+)/i);
    return match ? Number(match[1]) : 0;
  })) + 1, [entries]);
  const pageNumber = activePage?.number || JEN(nextSequence);
  const updateRow = (id, value) => setRows((current) => current.map((row) => row.id === id ? withSuggestedDetails(value) : row));
  const currencyLocked = readOnly || rows.some((row) =>
    row.partyKey || row.account.trim() || num(row.debit) > 0 || num(row.credit) > 0 || row.details.trim()
  );
  const canAddRow = Boolean(activePage) || rows.length >= INITIAL_ROWS && rows.every((row) => row.account.trim() && (num(row.debit) > 0 || num(row.credit) > 0));
  const totals = rows.reduce((acc, row) => ({ debit: acc.debit + num(row.debit), credit: acc.credit + num(row.credit) }), { debit: 0, credit: 0 });
  const rowOptions = useMemo(() => rows.map((_, index) => {
    if (readOnly) return options;
    const savedPageChanges = new Map();
    activePage?.entries.forEach((entry) => {
      if (entry.partyType !== "customer" || !entry.partyId) return;
      const key = `customer:${entry.partyId}`;
      const change = entry.direction === "out" ? num(entry.amount) : -num(entry.amount);
      savedPageChanges.set(key, (savedPageChanges.get(key) || 0) + change);
    });
    const earlierRows = rows.slice(0, index);
    return options.map((option) => {
      if (option.type !== "customer") return option;
      let balance = option.balance - (savedPageChanges.get(option.key) || 0);
      earlierRows.forEach((earlier) => {
        if (earlier.partyKey === option.key) balance += num(earlier.credit) - num(earlier.debit);
      });
      return { ...option, balance };
    });
  }), [rows, options, activePage, readOnly]);

  const save = async () => {
    if (saving || readOnly) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayDateValue()) return notify("ثبت روزنامچه به تاریخ فردا یا آینده مجاز نیست.", "warning");
    const prepared = rows.filter((row) => row.account.trim() || row.details.trim() || num(row.debit) || num(row.credit));
    if (!prepared.length) return notify("حداقل یک ردیف روزنامچه را تکمیل کنید.", "warning");
    if (prepared.some((row) => !row.account.trim() || (num(row.debit) <= 0 && num(row.credit) <= 0) || (num(row.debit) > 0 && num(row.credit) > 0) || num(row.debit) < 0 || num(row.credit) < 0)) return notify("برای هر ردیف نام اکونت و فقط یکی از Debit یا Credit را وارد کنید.", "warning");
    if (prepared.some((row) => customerAccounts.has(row.partyKey) && customerAccounts.get(row.partyKey) !== code)) {
      return notify("اسعار اکونت مشتری باید با واحد پول روزنامچه یکسان باشد.", "warning");
    }
    const now = new Date().toISOString();
    // Each page has one sequential reference; its lines remain separate ledger records.
    const records = prepared.map((row, index) => {
      const separator = row.partyKey.indexOf(":");
      const type = separator < 0 ? "" : row.partyKey.slice(0, separator);
      const id = separator < 0 ? "" : row.partyKey.slice(separator + 1);
      const incoming = num(row.debit) > 0;
      const amount = incoming ? num(row.debit) : num(row.credit);
      const previous = activePage?.entries.find(entry=>String(entry.id)===String(row.id));
      return { ...previous, id: previous?.id || `JRN-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, pageNumber, lineNumber: index + 1, direction: incoming ? "in" : "out", date, currency: code, amount, debit: incoming ? amount : 0, credit: incoming ? 0 : amount, accountName: row.account.trim(), partyType: ["customer", "supplier"].includes(type) ? type : "", partyId: ["customer", "supplier"].includes(type) ? id : "", partyName: row.account.trim(), accountType: type || "general", accountId: id || "", note: row.details.trim(), description: row.details.trim(), reference: pageNumber, createdAt: previous?.createdAt || now, updatedAt: now };
    });
    setSaving(true);
    try {
      if (await setEntries(activePage ? replaceJournalPage(entries, activePage, records) : [...records, ...entries])) { setRows(makeInitialRows()); setOpened(false); notify(`صفحه ${pageNumber} با ${records.length} ردیف ذخیره شد.`, "success"); }
    } finally { setSaving(false); }
  };
  const pages = useMemo(() => groupJournalPages(entries), [entries]);
  const openingBalances = useMemo(() => {
    const search = query.trim().toLowerCase();
    return customers.filter((customer) =>
      num(customer.openingBalance) !== 0 && [
        customerName(customer), customer.companyName, customer.id,
        accountCurrency(customer.currency || customer.currencyCode),
      ].some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [customers, query]);
  const visible = useMemo(() => pages.filter(page => !query.trim() || `${page.number} ${page.entries.map(row=>`${row.accountName || row.partyName || ""} ${row.description || row.note || ""} ${row.currency || ""}`).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())), [pages, query]);
  const handleJournalSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" && visible.length) {
      event.preventDefault();
      setActiveResultIndex((current) => current < 0 ? 0 : Math.min(current + 1, visible.length - 1));
    } else if (event.key === "ArrowUp" && visible.length) {
      event.preventDefault();
      setActiveResultIndex((current) => current < 0 ? visible.length - 1 : Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeResultIndex >= 0 && visible[activeResultIndex]) {
      event.preventDefault();
      openPage(visible[activeResultIndex], true);
    } else if (event.key === "Escape") {
      setActiveResultIndex(-1);
    }
  };
  useEffect(() => {
    if (activeResultIndex < 0) return;
    pageRowRefs.current.get(visible[activeResultIndex]?.key)?.scrollIntoView({ block: "nearest" });
  }, [activeResultIndex, visible]);
  const journalSales = useMemo(() => {
    const search = query.trim().toLowerCase();
    const customerMap = new Map(customers.map((customer) => [String(customer.id), customer]));
    return sales.map((sale) => ({ ...sale,
      customerLabel: customerName(customerMap.get(String(sale.customerId)) || { name: sale.customerName }),
    })).filter((sale) => !search || [sale.customerLabel, sale.invoiceNumber, sale.billNumber,
      sale.systemBillNumber, sale.id, sale.currency].some((value) => String(value || "").toLowerCase().includes(search)))
      .sort((a, b) => String(b.saleDate || b.createdAt || "").localeCompare(String(a.saleDate || a.createdAt || "")));
  }, [customers, sales, query]);
  const openPage = (page, viewOnly) => {
    setActionMenu(null); setActivePage(page); setReadOnly(viewOnly);
    setDate(String(page.entries[0]?.date || "").slice(0,10));
    setCode(accountCurrency(page.entries[0]?.currency));
    setRows(page.entries.map(entry=>({id:entry.id,account:entry.accountName || entry.partyName || "",partyKey:entry.partyType && entry.partyId ? `${entry.partyType}:${entry.partyId}` : entry.accountType && entry.accountId ? `${entry.accountType}:${entry.accountId}` : "",debit:entry.direction==="in" ? entry.amount : "",credit:entry.direction==="out" ? entry.amount : "",details:entry.note || entry.description || "",autoDetails:false,detailsTouched:true})));
    setOpened(true);
  };
  const toggleMenu = (event, page) => {
    const trigger = event.currentTarget;
    if (actionMenu?.page.key === page.key) { setActionMenu(null); return; }
    const rect = trigger.getBoundingClientRect(), width = 180, height = 180, gap = 5;
    actionTrigger.current = trigger;
    setActionMenu({page,left:Math.max(8,Math.min(rect.right-width,window.innerWidth-width-8)),top:window.innerHeight-rect.bottom>=height+gap+8 ? rect.bottom+gap : Math.max(8,rect.top-height-gap)});
  };
  const deletePage = async (page) => {
    setActionMenu(null);
    const confirmed = await confirmAction({
      title: "حذف صفحهٔ روزنامچه",
      message: `آیا می‌خواهید صفحهٔ ${page.number} و تمام ردیف‌های آن را حذف کنید؟`,
      confirmText: "حذف",
      cancelText: "لغو",
    });
    if (!confirmed) {
      actionTrigger.current?.focus();
      return;
    }
    if (await setEntries((current) => replaceJournalPage(current, page, []))) {
      notify(`صفحهٔ ${page.number} حذف شد.`, "success");
    }
  };
  useEffect(() => {
    if (!actionMenu) return;
    const outside = event => { if (!menuRef.current?.contains(event.target) && !actionTrigger.current?.contains(event.target)) setActionMenu(null); };
    const close = () => setActionMenu(null);
    const keys = event => {
      if (event.key === "Escape") { event.preventDefault(); close(); actionTrigger.current?.focus(); }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault(); const buttons = [...menuRef.current.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement), delta = event.key === "ArrowDown" ? 1 : -1;
        buttons[(index + delta + buttons.length) % buttons.length]?.focus();
      }
      if (event.key === "Tab") close();
    };
    menuRef.current?.querySelector("button")?.focus();
    document.addEventListener("pointerdown",outside); document.addEventListener("keydown",keys);
    window.addEventListener("resize",close); window.addEventListener("scroll",close,true);
    return () => { document.removeEventListener("pointerdown",outside); document.removeEventListener("keydown",keys); window.removeEventListener("resize",close); window.removeEventListener("scroll",close,true); };
  }, [actionMenu]);
  useEffect(() => {
    if (!printPage) return;
    const clear = () => setPrintPage(null);
    window.addEventListener("afterprint",clear);
    const timer = window.setTimeout(()=>window.print(),100);
    return () => { window.clearTimeout(timer); window.removeEventListener("afterprint",clear); };
  }, [printPage]);

  const modal = opened ? <div className="cash-journal-overlay"><div className="cash-journal-modal unified-journal-modal"><header><div><BookOpenCheck/><div><h2>{readOnly ? "نمایش روزنامچه" : activePage ? "ویرایش روزنامچه" : "روزنامچه شماره"} {pageNumber}</h2><p>Debit دریافت پول به شرکت، Credit پرداخت پول از شرکت</p></div></div><button type="button" onClick={() => setOpened(false)} aria-label="بستن"><X/></button></header><main><section className="cash-journal-panel unified-journal-panel"><header><div className="journal-page-info"><strong>{pageNumber}</strong><small>شماره مسلسل اتومات</small></div><div className="journal-side-controls"><label><small>واحد پول</small><select disabled={currencyLocked} value={code} onChange={(event) => setCode(event.target.value)}>{codes.map((c) => <option key={c}>{c}</option>)}</select></label><label><small>تاریخ شمسی</small><ShamsiDateInput readOnly={readOnly}  max={todayDateValue()} value={date} onChange={(event) => setDate(event.target.value)}/></label><label><small>تاریخ میلادی</small><input type="date" lang="en" dir="ltr" readOnly={readOnly} max={todayDateValue()} value={date} onChange={(event) => setDate(event.target.value)}/></label></div></header><div className="journal-entry-head"><span>نام اکونت</span><span>Debit (دریافت)</span><span>Credit (پرداخت)</span><span>تفصیلات</span><span></span></div><div className="journal-entry-list">{rows.map((row, index) => <div className="journal-entry-row" key={row.id}><AccountPicker readOnly={readOnly} row={row} options={rowOptions[index] || options} update={(value) => updateRow(row.id, value)}/><input readOnly={readOnly} type="number" aria-label="Debit دریافت" min="0" step="any" value={row.debit} onChange={(event) => updateRow(row.id, { ...row, debit: event.target.value, credit: event.target.value && num(event.target.value) > 0 ? "" : row.credit })} placeholder="0"/><input readOnly={readOnly} type="number" aria-label="Credit پرداخت" min="0" step="any" value={row.credit} onChange={(event) => updateRow(row.id, { ...row, credit: event.target.value, debit: event.target.value && num(event.target.value) > 0 ? "" : row.debit })} placeholder="0"/><textarea readOnly={readOnly} aria-label="تفصیلات" value={row.details} maxLength={150} rows={2} onChange={(event) => updateRow(row.id, { ...row, details: event.target.value.slice(0, 150), autoDetails: false, detailsTouched: true })} placeholder="پس از انتخاب حساب و درج مبلغ، تفصیلات خودکار نوشته می‌شود"/><button hidden={readOnly} className="journal-remove" tabIndex={-1} type="button" title="حذف ردیف" onClick={() => setRows((current) => current.length === 1 ? [emptyRow()] : current.filter((item) => item.id !== row.id))}><Trash2 size={15}/></button></div>)}</div><button hidden={readOnly} type="button" className="journal-add-row" disabled={!canAddRow} title={!canAddRow ? "پس از تکمیل ۵۰ ردیف اولیه، می‌توانید ردیف بیشتری اضافه کنید." : "افزودن ردیف"} onClick={() => setRows((current) => [...current, emptyRow()])}><Plus size={16}/>افزودن ردیف دیگر ({rows.length} ردیف)</button></section></main><footer><span>Debit: {totals.debit.toLocaleString()} {code} | Credit: {totals.credit.toLocaleString()} {code}</span><div><button hidden={readOnly} type="button" className="journal-save-all" disabled={saving} onClick={save}>{saving ? "در حال ذخیره..." : `ذخیره ${pageNumber}`}</button></div></footer></div></div> : null;

  return <div className="cash-journal-page" dir="rtl"><header className="cash-journal-head"><div><BookOpenCheck size={24}/><div><h1>روزنامچه نقدی</h1><p>ثبت یکپارچه دریافت و پرداخت، با شماره مسلسل هر صفحه</p></div></div><button type="button" onClick={() => { setActivePage(null); setReadOnly(false); setDate(todayDateValue()); setRows(makeInitialRows()); setOpened(true); }}><Plus size={18}/>ثبت روزنامچه</button></header><nav className="cash-journal-tabs" role="tablist" aria-label="بخش‌های روزنامچه">
    {[["journal", "روزنامچه"], ["opening", "بیلانس افتتاحیه"], ["sales", "فروشات"]].map(([id, label]) => <button key={id} id={`cash-journal-tab-${id}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`cash-journal-panel-${id}`} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>{label}</button>)}
  </nav>{activeTab === "journal" && <section role="tabpanel" id="cash-journal-panel-journal" aria-labelledby="cash-journal-tab-journal" className="cash-journal-tab-panel"><div className="cash-journal-toolbar"><label><Search size={17}/><input value={query} onChange={(event) => { setQuery(event.target.value); setActiveResultIndex(-1); }} onKeyDown={handleJournalSearchKeyDown} aria-activedescendant={activeResultIndex >= 0 && visible[activeResultIndex] ? `cash-journal-result-${activeResultIndex}` : undefined} placeholder="جستجوی نام اکونت، تفصیلات یا نمبر JEN..."/></label></div><div className="cash-journal-table"><table><thead><tr><th>نمبر صفحه</th><th>تاریخ هجری شمسی</th><th>تاریخ میلادی</th><th>نام اکونت</th><th>تفصیلات</th><th>تعداد ردیف</th><th>عملیات</th></tr></thead><tbody>{visible.length ? visible.map((page, index) => {
    const row=page.entries[0];
    return <tr id={`cash-journal-result-${index}`} ref={(node) => { if (node) pageRowRefs.current.set(page.key, node); else pageRowRefs.current.delete(page.key); }} className={activeResultIndex === index ? "keyboard-active" : ""} key={page.key}><td>{page.number}</td><td>{formatAfghanDate(row.date)}</td><td dir="ltr">{row.date?.slice(0, 10) || "—"}</td><td>{page.entries.slice(0,2).map((entry,index)=><span className="journal-account-summary" key={entry.id}>{index>0 ? "، " : ""}{entry.partyId && ["customer","supplier"].includes(entry.partyType) ? <Link to={`/${entry.partyType}-detail/${encodeURIComponent(entry.partyId)}`}>{entry.accountName || entry.partyName}</Link> : entry.accountName || entry.partyName || "عمومی"}</span>)}{page.entries.length>2 && <small title={page.entries.map(entry=>entry.accountName || entry.partyName).join("، ")}> و {page.entries.length-2} ردیف دیگر</small>}</td><td className="journal-description-cell" title={row.note || row.description || ""}><span className="journal-description-preview">{Array.from(row.note || row.description || "").slice(0, 90).join("")}{Array.from(row.note || row.description || "").length > 90 ? "…" : ""}</span></td><td>{page.entries.length}</td><td className="journal-actions-cell"><button type="button" className="journal-actions-trigger" aria-label={`عملیات ${page.number}`} aria-haspopup="menu" aria-expanded={actionMenu?.page.key===page.key} aria-controls={actionMenu?.page.key===page.key ? "journal-actions-menu" : undefined} onClick={event=>toggleMenu(event,page)}><MoreHorizontal size={20}/></button></td></tr>;
  }) : <tr><td colSpan="7" className="journal-empty">هنوز ریکاردی ثبت نشده است.</td></tr>}</tbody></table></div></section>}{modal && createPortal(modal, document.body)}
    {activeTab === "opening" && <section role="tabpanel" id="cash-journal-panel-opening" aria-labelledby="cash-journal-tab-opening" className="cash-journal-tab-panel journal-sales-receivables" >
      <h2 id="journal-opening-balances-title">بیلانس افتتاحیۀ مشتریان</h2>
      <div className="cash-journal-table"><table>
        <thead><tr><th>تاریخ شمسی</th><th>تاریخ میلادی</th><th>مشتری</th><th>قرضداری مشتری</th><th>بستانکاری مشتری</th><th>اسعار</th></tr></thead>
        <tbody>{openingBalances.length ? openingBalances.map((customer) => {
          const date = customer.openingBalanceDate || customer.createdAt?.slice(0, 10);
          const balance = num(customer.openingBalance);
          return (
            <tr key={customer.id}>
              <td>{date ? formatAfghanDate(date) : "—"}</td><td dir="ltr">{date || "—"}</td>
              <td><Link to={`/customer-detail/${encodeURIComponent(customer.id)}`}>{customerName(customer)}</Link></td>
              <td>{balance > 0 ? formatAmount(balance) : "—"}</td>
              <td>{balance < 0 ? formatAmount(Math.abs(balance)) : "—"}</td>
              <td>{accountCurrency(customer.currency || customer.currencyCode)}</td>
            </tr>
          );
        }) : <tr><td colSpan="6" className="journal-empty">بیلانس افتتاحیۀ مشتری یافت نشد.</td></tr>}</tbody>
      </table></div>
    </section>}
    {activeTab === "sales" && <section role="tabpanel" id="cash-journal-panel-sales" aria-labelledby="cash-journal-tab-sales" className="cash-journal-tab-panel journal-sales-receivables">
      <h2 id="journal-sales-title">فروشات</h2>
      <div className="cash-journal-table"><table>
        <thead><tr><th>تاریخ شمسی</th><th>تاریخ میلادی</th><th>نمبر بل</th><th>مشتری</th><th>مبلغ فروش</th><th>دریافت هنگام فروش</th><th>باقی هنگام فروش</th><th>اسعار</th><th>عملیات</th></tr></thead>
        <tbody>{journalSales.length ? journalSales.map((sale) => (
          <tr key={sale.id}>
            <td>{formatAfghanDate(sale.saleDate || sale.createdAt)}</td><td dir="ltr">{(sale.saleDate || sale.createdAt)?.slice(0, 10) || "—"}</td>
            <td><Link to={`/sale-detail/${encodeURIComponent(sale.id)}`}>{sale.invoiceNumber || sale.billNumber || sale.systemBillNumber || sale.id}</Link></td>
            <td>{sale.customerId ? <Link to={`/customer-detail/${encodeURIComponent(sale.customerId)}`}>{sale.customerLabel}</Link> : sale.customerLabel}</td>
            <td>{formatAmount(sale.totalAmount)}</td>
            <td>{formatAmount(sale.paidAmount)}</td>
            <td>{formatAmount(sale.remainingAmount ?? Math.max(num(sale.totalAmount) - num(sale.paidAmount), 0))}</td>
            <td>{sale.currency || "AFN"}</td>
            <td><Link to={`/sale-detail/${encodeURIComponent(sale.id)}`}>نمایش بل</Link>
              {sale.customerId && <> · <Link to={`/customer-detail/${encodeURIComponent(sale.customerId)}`}>حساب مشتری</Link></>}
            </td>
          </tr>
        )) : <tr><td colSpan="9" className="journal-empty">{query.trim() ? "فروش مطابق جستجو پیدا نشد." : "هنوز فروشی ثبت نشده است."}</td></tr>}</tbody>
      </table></div>
    </section>}
    {actionMenu && createPortal(<div id="journal-actions-menu" ref={menuRef} role="menu" dir="rtl" aria-label="عملیات روزنامچه" className="journal-actions-menu" style={{top:actionMenu.top,left:actionMenu.left}}>
      <button type="button" role="menuitem" onClick={()=>openPage(actionMenu.page,true)}><Eye size={16}/>نمایش</button>
      <button type="button" role="menuitem" onClick={()=>openPage(actionMenu.page,false)}><Pencil size={16}/>ویرایش</button>
      <button type="button" role="menuitem" onClick={()=>{setPrintPage(actionMenu.page);setActionMenu(null);}}><Printer size={16}/>چاپ</button>
      {!actionMenu.page.entries.some((entry) => entry.saleReturnId) &&
        <button type="button" role="menuitem" onClick={() => deletePage(actionMenu.page)}><Trash2 size={16}/>حذف</button>}
    </div>,document.body)}
    {printPage && createPortal(<div className="cash-journal-print-sheet" dir="rtl"><h1>روزنامچه نقدی {printPage.number}</h1><p>{formatAfghanDate(printPage.entries[0]?.date)} · <bdi>{printPage.entries[0]?.date?.slice(0, 10)}</bdi> میلادی</p><table><thead><tr><th>ردیف</th><th>نام اکونت</th><th>تفصیلات</th><th>Debit</th><th>Credit</th><th>اسعار</th></tr></thead><tbody>{printPage.entries.map((entry,index)=><tr key={entry.id}><td>{index+1}</td><td>{entry.accountName || entry.partyName}</td><td>{entry.note || entry.description}</td><td>{entry.direction==="in" ? formatAmount(entry.amount) : ""}</td><td>{entry.direction==="out" ? formatAmount(entry.amount) : ""}</td><td>{entry.currency}</td></tr>)}</tbody></table></div>,document.body)}
  </div>;
}
