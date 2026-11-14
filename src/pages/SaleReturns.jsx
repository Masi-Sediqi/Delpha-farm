import { formatAfghanDate } from "../utils/afghanDate";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Undo2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { writeAtomicFinanceBatch } from "../utils/browserStorage";
import { notify } from "../utils/notify";
import { useSearchParams } from "react-router-dom";
import { saleReturnLines, returnAmount, buildSaleReturn } from "../utils/saleReturns";
import { todayDateValue } from "../utils/afghanDate";
import "./Returns.css";
const languageKey="afghan-power-language";const rtl=new Set(["fa","ps"]);const n=v=>Math.max(Number(v||0),0);const today=todayDateValue;
const tr={en:{title:"Sale Returns",sub:"Return sold medicine from customers and update stock and customer ledger.",new:"New Sale Return",records:"Sale Return Records",search:"Search return, invoice or customer...",empty:"No sale returns recorded.",returnNo:"Return No.",date:"Date",customer:"Customer",sale:"Original Sale",invoice:"Invoice",items:"Items",total:"Return Total",newTitle:"Register Sale Return",selectCustomer:"Select customer",selectSale:"Select original sale",notes:"Notes",notesPh:"Reason or notes...",returnItems:"Return Items",product:"Product",sold:"Sold",returned:"Already Returned",qty:"Return Qty",price:"Sale Price",save:"Save Return",cancel:"Cancel",required:"Select a customer and original sale.",selectItem:"Enter at least one return quantity.",tooMuch:"Return quantity is greater than sold quantity for",saved:"Sale return saved successfully."},fa:{title:"برگشت فروش",sub:"دواهای فروخته‌شده را از مشتری برگشت گرفته و موجودی و لیجر مشتری را اصلاح کنید.",new:"برگشت فروش جدید",records:"ریکاردهای برگشت فروش",search:"جستجوی برگشت، بل یا مشتری...",empty:"هنوز برگشت فروش ثبت نشده است.",returnNo:"نمبر برگشت",date:"تاریخ",customer:"مشتری",sale:"فروش اصلی",invoice:"بل فروش",items:"اقلام",total:"جمله برگشت",newTitle:"ثبت برگشت فروش",selectCustomer:"مشتری را انتخاب کنید",selectSale:"فروش اصلی را انتخاب کنید",notes:"ملاحظات",notesPh:"دلیل یا ملاحظات...",returnItems:"اقلام برگشتی",product:"محصول",sold:"فروخته‌شده",returned:"قبلاً برگشت",qty:"مقدار برگشت",price:"قیمت فروش",save:"ذخیره برگشت",cancel:"لغو",required:"مشتری و فروش اصلی را انتخاب کنید.",selectItem:"حداقل برای یک محصول مقدار برگشت وارد کنید.",tooMuch:"مقدار برگشت بیشتر از مقدار فروخته‌شده است برای",saved:"برگشت فروش با موفقیت ذخیره شد."},ps:{title:"د خرڅلاو بېرته ستنول",sub:"له پېرودونکي څخه پلورل شوي درمل بېرته واخلئ او موجودي او لیجر اصلاح کړئ.",new:"نوی د خرڅلاو بېرته ستنول",records:"د خرڅلاو بېرته ستنولو ریکارډونه",search:"د بېرته ستنولو، بل یا پېرودونکي لټون...",empty:"تر اوسه د خرڅلاو بېرته ستنول نشته.",returnNo:"د بېرته ستنولو نمبر",date:"نېټه",customer:"پېرودونکی",sale:"اصلي خرڅلاو",invoice:"د خرڅلاو بل",items:"توکي",total:"ټول بېرته مبلغ",newTitle:"د خرڅلاو بېرته ستنول ثبتول",selectCustomer:"پېرودونکی وټاکئ",selectSale:"اصلي خرڅلاو وټاکئ",notes:"یادښتونه",notesPh:"دلیل یا یادښتونه...",returnItems:"بېرته ستنېدونکي توکي",product:"محصول",sold:"پلورل شوی",returned:"مخکې بېرته",qty:"بېرته مقدار",price:"د خرڅلاو بیه",save:"ثبت کړئ",cancel:"لغوه",required:"پېرودونکی او اصلي خرڅلاو وټاکئ.",selectItem:"لږ تر لږه د یوه توکي بېرته مقدار ولیکئ.",tooMuch:"بېرته مقدار د پلورل شوي مقدار څخه زیات دی د",saved:"د خرڅلاو بېرته ستنول ثبت شول."}};
export default function SaleReturns() {
 const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "fa");
 const t = tr[language] || tr.fa;
 const [returns, , , returnsLoaded] = useJsonCollection("saleReturns");
 const [returnItems, , , itemsLoaded] = useJsonCollection("saleReturnItems");
 const [sales, , , salesLoaded] = useJsonCollection("salesRegister");
 const [customers] = useJsonCollection("customerRegistry");
 const [movements, , , movementsLoaded] = useJsonCollection("stockMovements");
 const [journal, , , journalLoaded] = useJsonCollection("partyCashTransactions");
 const [params] = useSearchParams();
 const requestedSale = params.get("saleId");
 const openedRequest = useRef(null);
 const saving = useRef(false);
 const [busy, setBusy] = useState(false);
 const [show, setShow] = useState(false);
 const [customerId, setCustomerId] = useState("");
 const [saleId, setSaleId] = useState("");
 const [returnNo, setReturnNo] = useState("");
 const [date, setDate] = useState(today);
 const [notes, setNotes] = useState("");
 const [rows, setRows] = useState([]);
 const [search, setSearch] = useState("");
 const [refundMode, setRefundMode] = useState("account");
 const loaded = returnsLoaded && itemsLoaded && salesLoaded && movementsLoaded && journalLoaded;
 const sale = sales.find((row) => String(row.id) === String(saleId));
 const customerName = (id) => { const customer = customers.find((row) => String(row.id) === String(id)); return customer?.fullName || customer?.companyName || "—"; };
 const customerSales = useMemo(() => sales.filter((row) => !customerId || String(row.customerId) === String(customerId)), [sales, customerId]);
 const total = rows.reduce((sum, row) => sum + returnAmount(row), 0);
 const currency = sale?.currency || "AFN";
 useEffect(() => {
   const sync = () => setLanguage(localStorage.getItem(languageKey) || "fa");
   window.addEventListener("app-language-updated", sync);
   return () => window.removeEventListener("app-language-updated", sync);
 }, []);
 useEffect(() => {
   document.body.classList.toggle("returns-modal-open", show);
   return () => document.body.classList.remove("returns-modal-open");
 }, [show]);
 useEffect(() => {
   if (!requestedSale || !loaded || openedRequest.current === requestedSale) return;
   const found = sales.find((row) => String(row.id) === requestedSale);
   if (!found) return;
   openedRequest.current = requestedSale;
   setSaleId(found.id); setCustomerId(found.customerId || "");
   setRows(saleReturnLines(found, returnItems));
   setReturnNo(`SR-${Date.now()}`); setDate(today()); setNotes(""); setRefundMode("account"); setShow(true);
 }, [requestedSale, loaded, sales, returnItems]);
 const open = () => {
   setCustomerId(""); setSaleId(""); setReturnNo(`SR-${Date.now()}`); setDate(today());
   setNotes(""); setRows([]); setRefundMode("account"); setShow(true);
 };
 const chooseSale = (id) => {
   const selected = sales.find((row) => String(row.id) === String(id));
   setSaleId(id); if (selected) setCustomerId(selected.customerId || "");
   setRows(saleReturnLines(selected, returnItems));
 };
 const changeRow = (id, patch) => setRows((current) => current.map((row) => row.saleLineId === id ? { ...row, ...patch } : row));
 const save = async (event) => {
   event.preventDefault();
   if (saving.current || !loaded) return;
   if (!sale || !customerId) return notify(t.required, "warning");
   if (!date || !returnNo.trim()) return;
   saving.current = true; setBusy(true);
   try {
     // Recheck the selected quantities against the latest loaded return records.
     const fresh = saleReturnLines(sale, returnItems).map((row) => {
       const draft = rows.find((item) => item.saleLineId === row.saleLineId);
       return { ...row, returnQty: draft?.returnQty || "", returnUnit: draft?.returnUnit || row.returnUnit };
     });
     const result = buildSaleReturn({ sale, rows: fresh, id: `sale-return-${Date.now()}`, returnNo: returnNo.trim(), date, notes: notes.trim(), refundMode, now: new Date().toISOString() });
     const changes = { saleReturns: [result.header, ...returns], saleReturnItems: [...result.items, ...returnItems], stockMovements: [...result.movements, ...movements] };
     if (result.refund) changes.partyCashTransactions = [result.refund, ...journal];
     await writeAtomicFinanceBatch(changes);
     notify(t.saved, "success", { silent: true }); setShow(false);
   } catch (error) { notify(error.message || "ثبت برگشت انجام نشد.", "error"); }
   finally { saving.current = false; setBusy(false); }
 };
 const filtered = returns.filter((row) => `${row.returnNo} ${customerName(row.customerId)} ${row.saleId}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <div className="returns-page" dir={rtl.has(language) ? "rtl" : "ltr"}>
   <div className="returns-head"><div><h1>{t.title}</h1><p>{t.sub}</p></div><button className="returns-primary" type="button" disabled={!loaded} onClick={open}><RotateCcw size={17}/>{t.new}</button></div>
   <section className="returns-card"><div className="returns-card-head"><h2>{t.records}</h2><div className="returns-search"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}/></div></div>
     <div className="returns-table"><table><thead><tr><th>{t.returnNo}</th><th>{t.date}</th><th>{t.customer}</th><th>{t.invoice}</th><th>{t.total}</th><th>نوع تصفیه</th></tr></thead>
       <tbody>{filtered.map((row) => <tr key={row.id}><td>{row.returnNo}</td><td>{formatAfghanDate(row.returnDate)}</td><td>{customerName(row.customerId)}</td><td>{sales.find((item) => String(item.id) === String(row.saleId))?.invoiceNumber || "—"}</td><td>{n(row.totalAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {row.currency || sales.find((item) => String(item.id) === String(row.saleId))?.currency || "AFN"}</td><td>{row.refundMode === "cash" ? "پرداخت نقدی" : "ثبت در حساب مشتری"}</td></tr>)}
       {!filtered.length && <tr><td colSpan="6" className="returns-empty">{t.empty}</td></tr>}</tbody></table></div>
   </section>
   {show && createPortal(<div className="returns-overlay"><form className="returns-modal" onSubmit={save}>
     <div className="returns-modal-head"><h2><Undo2 size={19}/>{t.newTitle}</h2><button type="button" className="returns-close" disabled={busy} onClick={() => setShow(false)}><X size={18}/></button></div>
     <div className="returns-body"><div className="returns-grid">
       <label><span>{t.returnNo}</span><input value={returnNo} onChange={(e) => setReturnNo(e.target.value)} required/></label>
       <label><span>{t.date}</span><ShamsiDateInput value={date} onChange={(e) => setDate(e.target.value)} required/></label>
       <label><span>{t.customer}</span><select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSaleId(""); setRows([]); }} required><option value="">{t.selectCustomer}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName || customer.companyName}</option>)}</select></label>
       <label><span>{t.sale}</span><select value={saleId} onChange={(e) => chooseSale(e.target.value)} disabled={!customerId} required><option value="">{t.selectSale}</option>{customerSales.map((item) => <option key={item.id} value={item.id}>{item.invoiceNumber} — {formatAfghanDate(item.saleDate)}</option>)}</select></label>
       <label className="returns-wide"><span>تصفیهٔ مبلغ برگشت</span><select value={refundMode} onChange={(e) => setRefundMode(e.target.value)}><option value="account">ثبت در حساب مشتری</option><option value="cash">پرداخت نقدی به مشتری</option></select></label>
       <label className="returns-wide"><span>{t.notes}</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh}/></label>
     </div><div className="returns-items"><h3>{t.returnItems}</h3>{rows.map((row) => <div className="returns-line sale-return-line" key={row.saleLineId}>
       <strong>{row.productName}<small>قیمت خالص فی دانه: {row.netPricePerPiece.toLocaleString(undefined, { maximumFractionDigits: 6 })} {currency}</small></strong>
       <label><span>{t.sold} (دانه)</span><input value={row.quantity} readOnly/></label>
       <label><span>{t.returned} (دانه)</span><input value={row.alreadyReturned} readOnly/></label>
       <label><span>واحد برگشت</span><select value={row.returnUnit} onChange={(e) => changeRow(row.saleLineId, { returnUnit: e.target.value, returnQty: "" })}><option value="piece">دانه</option>{row.cartonSize > 1 && <option value="carton">کارتن ({row.cartonSize} دانه)</option>}</select></label>
       <label><span>{t.qty}</span><input type="number" min="0" step="any" max={row.remainingPieces / (row.returnUnit === "carton" ? row.cartonSize : 1)} value={row.returnQty} onChange={(e) => changeRow(row.saleLineId, { returnQty: e.target.value })}/></label>
       <output>مبلغ برگشت: {returnAmount(row).toLocaleString(undefined, { maximumFractionDigits: 6 })} {currency}</output>
     </div>)}</div><div className="returns-summary"><span>{t.total}</span><strong>{total.toLocaleString(undefined, { maximumFractionDigits: 6 })} {currency}</strong></div>
     <p>{refundMode === "account" ? "مبلغ از باقی مشتری کم می‌شود؛ اگر حساب مشتری طلبکار شود، در تادیات نمایش داده می‌شود." : "مبلغ برگشت همزمان به‌عنوان پرداخت نقدی به مشتری در روزنامچه ثبت می‌شود."}</p>
     </div><div className="returns-footer"><button type="button" className="returns-secondary" disabled={busy} onClick={() => setShow(false)}>{t.cancel}</button><button type="submit" className="returns-primary" disabled={busy || !loaded}>{busy ? "در حال ثبت..." : t.save}</button></div>
   </form></div>, document.body)}
 </div>;
}
