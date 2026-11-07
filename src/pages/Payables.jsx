import { accountReportRows, printAccountStatement, downloadAccountExcel, downloadAccountPDF } from "../utils/accountStatementExport";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign, Building2, CreditCard,
  Printer, Search, Truck, WalletCards,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Payables.css";

const languageKey="afghan-power-language";
const numeric=(value)=>Number(value||0)||0;
const translations={
 en:{title:"Payables",subtitle:"Suppliers with unpaid purchase balances are listed here.",batchPay:"Pay Payables",search:"Search supplier, phone or currency...",suppliersDue:"Supplier Accounts",totalPurchases:"Total Purchases",totalPaid:"Total Paid",outstanding:"Outstanding",supplier:"Supplier",phone:"Phone",purchases:"Purchases",purchased:"Purchased",paid:"Paid",balance:"Balance Due",currency:"Currency",actions:"Actions",menu:"Actions",pay:"Payment",makePaid:"Make as Paid",print:"Print",bill:"Bill",paidSuccess:"Supplier balance marked as paid.",makePaidTitle:"Mark supplier balance as paid?",makePaidMessage:"This will record a payment for the full outstanding balance.",confirm:"Confirm",cancel:"Cancel",noData:"No unpaid supplier balances were found.",settled:"All supplier accounts are currently settled."},
 fa:{title:"تادیات",subtitle:"تأمین‌کننده‌هایی که پول خریداری‌های شان هنوز مکمل پرداخت نشده در اینجا نمایش داده می‌شوند.",batchPay:"پرداخت تادیات",search:"جستجوی تأمین‌کننده، شماره تماس یا ارز...",suppliersDue:"حساب‌های تأمین‌کنندگان",totalPurchases:"مجموع خریداری",totalPaid:"مجموع پرداخت",outstanding:"مجموع باقی‌مانده",supplier:"تأمین‌کننده",phone:"شماره تماس",purchases:"تعداد خریداری",purchased:"مجموع خرید",paid:"پرداخت‌شده",balance:"باقی / قابل پرداخت",currency:"واحد پول",actions:"عملیات",menu:"عملیات",pay:"پرداخت",makePaid:"پرداخت مکمل",print:"چاپ",bill:"بل",paidSuccess:"حساب تأمین‌کننده مکمل پرداخت شد.",makePaidTitle:"حساب تأمین‌کننده مکمل پرداخت شود؟",makePaidMessage:"به اندازه تمام باقی‌مانده یک پرداخت جدید ثبت می‌شود.",confirm:"تأیید",cancel:"لغو",noData:"هیچ حساب پرداخت‌نشده‌ای برای تأمین‌کننده‌ها وجود ندارد.",settled:"فعلاً حساب تمام تأمین‌کننده‌ها تصفیه است."},
 ps:{title:"تادیات",subtitle:"هغه عرضه کوونکي چې د پېرود پیسې یې لا بشپړې نه دي ورکړل شوې دلته ښودل کېږي.",batchPay:"د تادیاتو ورکړه",search:"عرضه کوونکی، د اړیکې شمېره یا اسعار ولټوئ...",suppliersDue:"پاتې عرضه کوونکي",totalPurchases:"ټول پېرود",totalPaid:"ټولې ورکړې",outstanding:"ټولې پاتې پیسې",supplier:"عرضه کوونکی",phone:"د اړیکې شمېره",purchases:"د پېرود شمېر",purchased:"د پېرود مجموعه",paid:"ورکړل شوي",balance:"پاتې / ورکول کېدونکي",currency:"اسعار",actions:"عملیات",menu:"عملیات",pay:"تادیه",makePaid:"بشپړ تادیه",print:"چاپ",bill:"بل",paidSuccess:"د عرضه کوونکي حساب بشپړ تادیه شو.",makePaidTitle:"د عرضه کوونکي حساب بشپړ تادیه شي؟",makePaidMessage:"د ټول پاتې مبلغ په اندازه نوې تادیه ثبتېږي.",confirm:"تایید",cancel:"لغوه",noData:"د عرضه کوونکو لپاره هېڅ پاتې حساب نشته.",settled:"اوس مهال د ټولو عرضه کوونکو حسابونه تصفیه دي."}
};
function normalizeCurrency(value){const raw=String(value||"AFN").toUpperCase();if(raw.includes("USD"))return"USD";if(raw.includes("EUR"))return"EUR";if(raw.includes("PKR")||raw.includes("PAK"))return"PKR";if(raw.includes("INR"))return"INR";return"AFN"}
function currencyCode(supplier){return normalizeCurrency(supplier?.currency||supplier?.currencyCode||"AFN")}
export default function Payables(){
 const navigate=useNavigate();
 const [suppliers]=useJsonCollection("suppliers");const [purchases]=useJsonCollection("purchases");const [purchaseReturns]=useJsonCollection("purchaseReturns");const [supplierPayments]=useJsonCollection("supplierPayments");const [journalCash]=useJsonCollection("partyCashTransactions");
 const [language,setLanguage]=useState(()=>localStorage.getItem(languageKey)||"fa");const [search,setSearch]=useState("");const [selectedCurrency,setSelectedCurrency]=useState("ALL");const [selectedCategory,setSelectedCategory]=useState("ALL");const [showAll,setShowAll]=useState(true);const t=translations[language]||translations.fa;
 useEffect(()=>{const f=()=>setLanguage(localStorage.getItem(languageKey)||"fa");window.addEventListener("storage",f);window.addEventListener("app-language-updated",f);return()=>{window.removeEventListener("storage",f);window.removeEventListener("app-language-updated",f)}},[]);
 const rows=useMemo(()=>suppliers.flatMap(supplier=>{
  const id=String(supplier.id);
  const sp=purchases.filter(x=>String(x.supplierId)===id);
  const sr=purchaseReturns.filter(x=>String(x.supplierId)===id);
  const mp=supplierPayments.filter(x=>String(x.supplierId)===id);
  const buckets={};
  const ensure=(currency)=>{const code=normalizeCurrency(currency);if(!buckets[code])buckets[code]={currency:code,purchases:[],totalPurchased:0,paidAtPurchase:0,paidLater:0,returned:0,opening:0};return buckets[code]};
  const supplierUnit=currencyCode(supplier);
  const opening=numeric(supplier.openingBalance);
  ensure(supplierUnit).opening+=opening;
  sp.forEach(p=>{const b=ensure(p.currency||supplierUnit);b.purchases.push(p);b.totalPurchased+=numeric(p.totalAmount);b.paidAtPurchase+=numeric(p.paidAmount)});
  mp.forEach(payment=>{ensure(payment.currency||supplierUnit).paidLater+=numeric(payment.amount)});
  sr.forEach(ret=>{const linked=sp.find(p=>String(p.id)===String(ret.purchaseId));ensure(ret.currency||linked?.currency||supplierUnit).returned+=numeric(ret.totalAmount)});
  journalCash.filter(item=>item.partyType==="supplier"&&String(item.partyId)===id).forEach(item=>{
    const b=ensure(item.currency||supplierUnit);
    if(item.direction==="out")b.paidLater+=Math.max(numeric(item.amount),0);
    if(item.direction==="in")b.opening+=Math.max(numeric(item.amount),0);
  });
  return Object.values(buckets).map(b=>{
    const totalPaid=b.paidAtPurchase+b.paidLater+b.returned+Math.max(-b.opening,0);
    const balance=Math.max(b.totalPurchased+Math.max(b.opening,0)-b.paidAtPurchase-b.paidLater-b.returned,0);
    const unpaid=b.purchases.map(p=>({...p,calculatedRemaining:Math.max(numeric(p.remainingAmount??(numeric(p.totalAmount)-numeric(p.paidAmount))),0)})).filter(p=>p.calculatedRemaining>.0001).sort((a,c)=>new Date(a.purchaseDate||a.createdAt||0)-new Date(c.purchaseDate||c.createdAt||0));
    return{supplier,purchaseCount:b.purchases.length,totalPurchased:b.totalPurchased,totalPaid,balance,currency:b.currency,focusPurchase:unpaid[0]||b.purchases[b.purchases.length-1]||null};
  });
}).sort((a,b)=>b.balance-a.balance),[suppliers,purchases,purchaseReturns,supplierPayments,journalCash]);
 const categories=[...new Set(rows.map(({supplier})=>String(supplier.categoryName||supplier.category||supplier.supplierType||'').trim()).filter(Boolean))].sort();
 const availableCurrencies=[...new Set(rows.map(row=>row.currency))].sort();
 const filteredRows=useMemo(()=>{const q=search.trim().toLowerCase();return rows.filter(({supplier,currency,balance})=>{const cat=String(supplier.categoryName||supplier.category||supplier.supplierType||'').trim();return (showAll||balance>.0001)&&(selectedCurrency==='ALL'||currency===selectedCurrency)&&(selectedCategory==='ALL'||cat===selectedCategory)&&(!q||[supplier.name,supplier.supplierName,supplier.contactPerson,supplier.phone,supplier.phoneNumber,currency,cat,supplier.id].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)))});},[rows,search,selectedCurrency,selectedCategory,showAll]);
 const totalsByCurrency=useMemo(()=>{const r={};rows.forEach(row=>{if(!r[row.currency])r[row.currency]={purchased:0,paid:0,balance:0};r[row.currency].purchased+=row.totalPurchased;r[row.currency].paid+=row.totalPaid;r[row.currency].balance+=row.balance});return r},[rows]);
 const totalText=(field)=>Object.entries(totalsByCurrency).filter(([,v])=>v[field]>0).map(([c,v])=>`${c} ${v[field].toLocaleString(undefined,{maximumFractionDigits:2})}`).join(" · ")||"—";
 const reportTitle=language==='en'?'Supplier payables':'تادیات (صورت حساب)';
 const reportAction=async(action,list)=>{try{const data=accountReportRows(list,'supplier');const filename=`payables-${new Date().toISOString().slice(0,10)}`;if(action==='excel')await downloadAccountExcel(data,filename);else if(action==='pdf')await downloadAccountPDF(data,reportTitle,filename);else printAccountStatement(data,reportTitle)}catch(error){console.error(error);notify(language==='en'?'Export failed':'خروجی آماده نشد. دوباره تلاش کنید.','error')}};
 const openSupplierLedger=(row,openPayment=false)=>{const purchaseId=row.focusPurchase?.id||"";navigate(`/supplier-detail/${row.supplier.id}?highlightPurchase=${encodeURIComponent(purchaseId)}`,{state:{openPayment,highlightPurchaseId:purchaseId,paymentCurrency:row.currency}})};
 return <section className="payables-page">
  <div className="payables-header"><div><div className="payables-title-line"><BadgeDollarSign size={24}/><h1>{t.title}</h1></div><p>{t.subtitle}</p></div></div>
  <div className="payables-stats"><article className="payables-stat-card"><div className="payables-stat-icon"><Truck size={19}/></div><span>{t.suppliersDue}</span><strong>{rows.length}</strong></article><article className="payables-stat-card"><div className="payables-stat-icon"><Building2 size={19}/></div><span>{t.totalPurchases}</span><strong>{totalText("purchased")}</strong></article><article className="payables-stat-card"><div className="payables-stat-icon"><CreditCard size={19}/></div><span>{t.totalPaid}</span><strong>{totalText("paid")}</strong></article><article className="payables-stat-card is-due"><div className="payables-stat-icon"><WalletCards size={19}/></div><span>{t.outstanding}</span><strong>{totalText("balance")}</strong></article></div>
  <div className="payables-card"><div className="payables-toolbar"><label className="payables-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></label><label className="account-filter-label">{t.currency}<select value={selectedCurrency} onChange={e=>setSelectedCurrency(e.target.value)}><option value="ALL">همه اسعار</option>{availableCurrencies.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label className="account-filter-label">کتگوری<select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}><option value="ALL">همه کتگوری‌ها</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label className="account-filter-toggle"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>نمایش حساب صفر</label><button className="account-report-btn" onClick={()=>void reportAction('print',filteredRows)}><Printer size={15}/>چاپ</button><button className="account-report-btn" onClick={()=>void reportAction('pdf',filteredRows)}>PDF</button><button className="account-report-btn" onClick={()=>void reportAction('excel',filteredRows)}>Excel</button></div><div className="payables-table-wrap"><table className="payables-table"><thead><tr><th>{t.supplier}</th><th>{t.phone}</th><th>{t.purchases}</th><th>{t.purchased}</th><th>{t.paid}</th><th>{t.balance}</th><th>{t.currency}</th><th>نمایش / چاپ / PDF / Excel</th></tr></thead><tbody>{filteredRows.map(row=>{const {supplier,purchaseCount,totalPurchased,totalPaid,balance,currency}=row;const name=supplier.name||supplier.supplierName||"—";return <tr key={`${supplier.id}-${currency}`} className="payables-clickable-row" onClick={()=>openSupplierLedger(row)}><td><div className="payables-supplier-cell"><span className="payables-supplier-icon"><Truck size={15}/></span><div><strong>{name}</strong><small>{supplier.contactPerson||""}</small></div></div></td><td>{supplier.phone||supplier.phoneNumber||"—"}</td><td>{purchaseCount}</td><td>{totalPurchased.toLocaleString()}</td><td>{totalPaid.toLocaleString()}</td><td><span className="payables-balance-pill">{balance.toLocaleString()}</span></td><td><span className="payables-currency-pill">{currency}</span></td><td className="payables-actions-cell" onClick={e=>e.stopPropagation()}><div className="account-report-actions"><button type="button" onClick={()=>openSupplierLedger(row)} title="نمایش حساب">نمایش</button><button type="button" onClick={()=>void reportAction('print',[row])} title="چاپ"><Printer size={15}/></button><button type="button" onClick={()=>void reportAction('pdf',[row])} title="PDF">PDF</button><button type="button" onClick={()=>void reportAction('excel',[row])} title="Excel">XLS</button></div></td></tr>})}{!filteredRows.length&&<tr><td colSpan="8" className="payables-empty"><WalletCards size={30}/><strong>{t.noData}</strong><span>{t.settled}</span></td></tr>}</tbody></table></div></div>

  <footer className="account-statement-footer"><span>تعداد حساب‌ها: <strong>{filteredRows.length}</strong></span><span>مجموع باقی‌مانده به تفکیک اسعار: <strong>{Object.entries(filteredRows.reduce((acc,row)=>(acc[row.currency]=(acc[row.currency]||0)+row.balance,acc),{})).map(([cur,total])=>`${cur} ${total.toLocaleString(undefined,{maximumFractionDigits:2})}`).join(' · ')||'0'}</strong></span></footer>
 </section>
}
