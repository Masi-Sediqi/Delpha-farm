import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownLeft, ArrowUpRight, BookOpenCheck, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { todayDateValue } from "../utils/afghanDate";
import "./CashJournal.css";
import "./CashJournalPolish.css";

const codes = ["AFN", "USD", "INR", "EUR"];
const n = (value) => Number(value || 0) || 0;
const currency = (value) => { const code = String(value || "AFN").toUpperCase(); return code === "PKR" ? "INR" : (codes.includes(code) ? code : "AFN"); };
const partyName = (row, type) => type === "customer" ? (row.fullName || row.companyName || "مشتری") : (row.supplierName || row.name || row.companyName || "تأمین‌کننده");
const newRow = () => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, partyKey: "", partyName: "", search: "", amount: "", note: "" });

function PartySearch({ row, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const q = String(row.search || "").trim().toLowerCase();
  const results = options.filter((item) => !q || `${item.name} ${item.type}`.toLowerCase().includes(q)).slice(0, 12);
  useEffect(() => setActive(-1), [q]);
  const choose = (item) => { onChange({ ...row, partyKey: item.key, partyName: item.name, search: item.name }); setOpen(false); };
  const keyDown = (event) => {
    if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) setOpen(true);
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter" && open && results[active]) { event.preventDefault(); choose(results[active]); }
    if (event.key === "Escape") setOpen(false);
  };
  return <div className="journal-party-search" ref={wrapRef} onBlur={(event) => { if (!wrapRef.current?.contains(event.relatedTarget)) setOpen(false); }}>
    <div className="journal-party-input"><Search size={15}/><input value={row.search} placeholder={placeholder} onFocus={() => setOpen(true)} onKeyDown={keyDown} onChange={(event) => { onChange({ ...row, search: event.target.value, partyKey: "", partyName: "" }); setOpen(true); }}/></div>
    {open && <div className="journal-party-results">{results.length ? results.map((item, index) => <button type="button" key={item.key} className={index === active ? "active" : ""} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(item)}><span><strong>{item.name}</strong><small>{item.type === "customer" ? "مشتری" : "تأمین‌کننده"}</small></span><b>{item.balance.toLocaleString()} {item.currency}</b></button>) : <div className="journal-no-result">شخص واجد حساب پیدا نشد.</div>}</div>}
  </div>;
}

export default function CashJournal() {
  const [customers] = useJsonCollection("customerRegistry"); const [suppliers] = useJsonCollection("suppliers");
  const [sales] = useJsonCollection("salesRegister"); const [purchases] = useJsonCollection("purchases");
  const [saleReturns] = useJsonCollection("saleReturns"); const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [customerPayments] = useJsonCollection("customerPayments"); const [supplierPayments] = useJsonCollection("supplierPayments");
  const [entries, setEntries] = useJsonCollection("partyCashTransactions");
  const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const [receiptCurrency, setReceiptCurrency] = useState("AFN"); const [paymentCurrency, setPaymentCurrency] = useState("AFN");
  const [receiptDate, setReceiptDate] = useState(todayDateValue()); const [paymentDate, setPaymentDate] = useState(todayDateValue());
  const [receiptRows, setReceiptRows] = useState([newRow()]); const [paymentRows, setPaymentRows] = useState([newRow()]);

  useEffect(() => { document.body.classList.toggle("cash-journal-open", open); return () => document.body.classList.remove("cash-journal-open"); }, [open]);
  const balances = useMemo(() => {
    const map = new Map(); const add = (type, id, code, amount) => { if (!id) return; const key = `${type}:${id}:${currency(code)}`; map.set(key, n(map.get(key)) + n(amount)); };
    customers.forEach((r) => add("customer", r.id, r.currency, r.openingBalance)); suppliers.forEach((r) => add("supplier", r.id, r.currency, r.openingBalance));
    sales.forEach((r) => add("customer", r.customerId, r.currency, n(r.totalAmount) - n(r.paidAmount))); saleReturns.forEach((r) => add("customer", r.customerId, r.currency, -n(r.totalAmount))); customerPayments.forEach((r) => add("customer", r.customerId, r.currency, -n(r.amount)));
    purchases.forEach((r) => add("supplier", r.supplierId, r.currency, n(r.totalAmount) - n(r.paidAmount))); purchaseReturns.forEach((r) => add("supplier", r.supplierId, r.currency, -n(r.totalAmount))); supplierPayments.forEach((r) => add("supplier", r.supplierId, r.currency, -n(r.amount)));
    entries.forEach((r) => { if (!r.partyId || !r.partyType) return; const effect = r.partyType === "customer" ? (r.direction === "in" ? -n(r.amount) : n(r.amount)) : (r.direction === "out" ? -n(r.amount) : n(r.amount)); add(r.partyType, r.partyId, r.currency, effect); });
    return map;
  }, [customers, suppliers, sales, purchases, saleReturns, purchaseReturns, customerPayments, supplierPayments, entries]);
  const optionsFor = (direction, code) => [...customers.map((row) => ({ type: "customer", row })), ...suppliers.map((row) => ({ type: "supplier", row }))].map(({ type, row }) => {
    const balance = n(balances.get(`${type}:${row.id}:${currency(code)}`)); const eligible = direction === "in" ? (type === "customer" ? balance > 0 : balance < 0) : (type === "supplier" ? balance > 0 : balance < 0);
    return { key: `${type}:${row.id}`, type, id: row.id, name: partyName(row, type), balance: Math.abs(balance), currency: code, eligible };
  }).filter((item) => item.eligible);

  const updateRow = (setter, id, next) => setter((rows) => rows.map((row) => row.id === id ? next : row));
  const removeRow = (setter, id) => setter((rows) => rows.length === 1 ? [newRow()] : rows.filter((row) => row.id !== id));
  const saveAll = async () => {
    const groups = [{ direction: "in", code: receiptCurrency, date: receiptDate, rows: receiptRows }, { direction: "out", code: paymentCurrency, date: paymentDate, rows: paymentRows }];
    const prepared = groups.flatMap((group) => group.rows.filter((row) => n(row.amount) > 0).map((row) => ({ group, row })));
    if (!prepared.length) return notify("حداقل یک ریکارد با مقدار معتبر وارد کنید.", "warning");
    const now = new Date().toISOString();
    const records = prepared.map(({ group, row }, index) => {
      const [partyType = "", partyId = ""] = row.partyKey.split(":"); const amount = n(row.amount);
      const routeText = row.partyName
        ? (group.direction === "in" ? `از ${row.partyName} به دخل` : `از دخل به ${row.partyName}`)
        : (group.direction === "in" ? "از دریافت عمومی به دخل" : "از دخل به پرداخت عمومی");
      const details = row.note.trim() || routeText;
      return { id: `JRN-${Date.now()}-${index}`, direction: group.direction, date: group.date, currency: group.code, amount, partyType: row.partyKey ? partyType : "", partyId: row.partyKey ? partyId : "", partyName: row.partyName, note: details, description: `${details} - ${amount.toLocaleString()} ${group.code}`, reference: `CASH-${String(Date.now()).slice(-7)}-${index + 1}`, createdAt: now, updatedAt: now };
    });
    if (await setEntries([...records, ...entries])) { setReceiptRows([newRow()]); setPaymentRows([newRow()]); setOpen(false); notify(`${records.length} ریکارد با موفقیت ذخیره شد.`, "success"); }
  };
  const visible = useMemo(() => { const q = query.trim().toLowerCase(); return [...entries].filter((r) => !q || `${r.partyName} ${r.description} ${r.reference} ${r.currency}`.toLowerCase().includes(q)).sort((a,b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt))); }, [entries, query]);

  const side = (direction, code, setCode, date, setDate, rows, setRows) => { const incoming = direction === "in"; const options = optionsFor(direction, code); return <section className={`cash-journal-panel ${direction}`}>
    <header><span>{incoming ? <ArrowDownLeft/> : <ArrowUpRight/>}</span><div><h3>{incoming ? "دریافت نقدی" : "پرداخت نقدی"}</h3><p>{incoming ? "اشخاصی که به ما قرضدار هستند" : "اشخاصی که ما به آنان قرضدار هستیم یا پرداخت عمومی"}</p></div><div className="journal-side-controls"><label><small>واحد پول</small><select value={code} onChange={(e) => { setCode(e.target.value); setRows([newRow()]); }}>{codes.map((item) => <option key={item}>{item}</option>)}</select></label><label><small>تاریخ</small><input type="date" value={date} onChange={(e) => setDate(e.target.value)}/></label></div></header>
    <div className="journal-entry-head"><span>شخص / جستجو</span><span>مقدار</span><span>مسیر و تفصیلات</span><span></span></div>
    <div className="journal-entry-list">{rows.map((row) => <div className="journal-entry-row" key={row.id}><PartySearch row={row} options={options} onChange={(next) => updateRow(setRows, row.id, { ...next, note: incoming ? `از ${next.partyName} به دخل` : `از دخل به ${next.partyName}` })} placeholder={incoming ? "مشتری یا تأمین‌کننده را جستجو کنید..." : "جستجوی شخص، یا خالی برای مصرف عمومی..."}/><input className="journal-amount" type="number" min="0" step="any" value={row.amount} onChange={(e) => updateRow(setRows, row.id, { ...row, amount: e.target.value })} placeholder="0"/><input value={row.note} onChange={(e) => updateRow(setRows, row.id, { ...row, note: e.target.value })} placeholder={incoming ? "از نام شخص به دخل" : "از دخل به نان چاشت"}/><button type="button" className="journal-remove" onClick={() => removeRow(setRows, row.id)} title="حذف"><Trash2 size={15}/></button><div className="journal-auto-text">{`${row.note.trim() || (incoming ? "از ... به دخل" : "از دخل به ...")} - ${n(row.amount).toLocaleString()} ${code}`}</div></div>)}</div>
    <button type="button" className="journal-add-row" onClick={() => setRows((current) => [...current, newRow()])}><Plus size={16}/>افزودن ریکارد دیگر</button>
  </section>; };

  const modal = open ? <div className="cash-journal-overlay"><div className="cash-journal-modal"><header><div><BookOpenCheck/><div><h2>ثبت روز نامچه نقدی</h2><p>چندین دریافت و پرداخت را همزمان ثبت کنید</p></div></div><button type="button" onClick={() => setOpen(false)}><X/></button></header><main>{side("in", receiptCurrency, setReceiptCurrency, receiptDate, setReceiptDate, receiptRows, setReceiptRows)}{side("out", paymentCurrency, setPaymentCurrency, paymentDate, setPaymentDate, paymentRows, setPaymentRows)}</main><footer><span>{receiptRows.filter((r) => n(r.amount)>0).length + paymentRows.filter((r) => n(r.amount)>0).length} ریکارد آماده ثبت</span><div><button type="button" className="journal-cancel" onClick={() => setOpen(false)}>لغو</button><button type="button" className="journal-save-all" onClick={saveAll}>ذخیره تمام ریکاردها</button></div></footer></div></div> : null;
  return <div className="cash-journal-page" dir="rtl"><header className="cash-journal-head"><div><BookOpenCheck size={24}/><div><h1>روز نامچه / نقدی</h1><p>ثبت دریافت‌ها و پرداخت‌ها به تفکیک واحد پول</p></div></div><button type="button" onClick={() => setOpen(true)}><Plus size={18}/>ثبت روزنامچه</button></header><div className="cash-journal-toolbar"><label><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی شخص، تفصیلات یا مرجع..."/></label></div><div className="cash-journal-table"><table><thead><tr><th>تاریخ</th><th>نوع</th><th>شخص</th><th>تفصیلات</th><th>مقدار</th><th>مرجع</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td>{String(row.date||"").slice(0,10)}</td><td><span className={`journal-kind ${row.direction}`}>{row.direction === "in" ? "دریافت" : "پرداخت"}</span></td><td>{row.partyName||"عمومی"}</td><td>{row.description}</td><td className={row.direction}>{n(row.amount).toLocaleString()} {row.currency}</td><td>{row.reference}</td></tr>)}{!visible.length&&<tr><td colSpan="6" className="journal-empty">هنوز ریکاردی ثبت نشده است.</td></tr>}</tbody></table></div>{modal && createPortal(modal, document.body)}</div>;
}
