import { apiUrl } from "../utils/api";
import { requestAdminDeletionPassword } from "../utils/adminDeletionApproval";
import { formatDateTime } from "../utils/afghanDate";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, Trash2 } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { publishServerCollections, writeAtomicFinanceBatch } from "../utils/browserStorage";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./Trash.css";
const key="afghan-power-language"; const rtl=new Set(["fa","ps"]);
const tr={
 en:{title:"Trash",subtitle:"Deleted records stay here until you restore or permanently remove them.",records:"Deleted Records",search:"Search deleted records...",record:"Record",module:"Section",deletedAt:"Deleted Date",status:"Status",actions:"Actions",purchase:"Purchasing",restorable:"Restorable",restore:"Restore",delete:"Delete forever",restoreOk:"Purchase restored successfully.",deleteOk:"Record permanently deleted.",confirmDelete:"Delete this record forever?",cancel:"Cancel",empty:"Trash is empty."},
 fa:{title:"سطل زباله",subtitle:"ریکاردهای حذف‌شده تا زمان برگشت یا حذف نهایی در اینجا نگهداری می‌شوند.",records:"ریکاردهای حذف‌شده",search:"جستجوی ریکاردهای حذف‌شده...",record:"ریکارد",module:"بخش",deletedAt:"تاریخ حذف",status:"حالت",actions:"عملیات",purchase:"خریداری",restorable:"قابل برگشت",restore:"برگشت",delete:"حذف نهایی",restoreOk:"خریداری با موفقیت برگشت داده شد.",deleteOk:"ریکارد به‌صورت نهایی حذف شد.",confirmDelete:"این ریکارد برای همیشه حذف شود؟",cancel:"لغو",empty:"سطل زباله خالی است."},
 ps:{title:"د کثافاتو ټوکرۍ",subtitle:"حذف شوي ریکارډونه تر بېرته راوستلو یا وروستي حذف پورې دلته ساتل کېږي.",records:"حذف شوي ریکارډونه",search:"حذف شوي ریکارډونه ولټوئ...",record:"ریکارډ",module:"برخه",deletedAt:"د حذف نېټه",status:"حالت",actions:"کړنې",purchase:"پېرود",restorable:"بېرته راتلونکی",restore:"بېرته راوستل",delete:"تل لپاره حذف",restoreOk:"پېرود په بریالیتوب بېرته راوستل شو.",deleteOk:"ریکارډ د تل لپاره حذف شو.",confirmDelete:"دا ریکارډ د تل لپاره حذف شي؟",cancel:"لغوه",empty:"کثافات تش دي."}
};

const sectionNames={products:"اجناس",suppliers:"تأمین‌کنندگان",customerRegistry:"مشتریان",customerPayments:"دریافت مشتری",supplierPayments:"تادیات",purchases:"خریداری",purchaseItems:"اقلام خریداری",salesRegister:"فروشات",saleReturns:"برگشت فروش",saleReturnItems:"اقلام برگشت",stockMovements:"موجودی",partyCashTransactions:"روزنامچه",countries:"کشورها",manufacturerCompanies:"کمپنی سازنده",expenseAccounts:"اکونت مصرف",accounts:"اکونت‌ها",__users:"کاربران"};
export default function Trash(){
 const [language,setLanguage]=useState(()=>localStorage.getItem(key)||"en");
 const t=tr[language]||tr.en;
 const [trash,setTrash]=useJsonCollection("trashPurchases");
 const [purchases]=useJsonCollection("purchases");
 const [items]=useJsonCollection("purchaseItems");
 const [movements]=useJsonCollection("stockMovements");
 const [records,setRecords]=useState([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [search,setSearch]=useState("");
 const refresh=async()=>{
  try {const response=await fetch(apiUrl("trash"),{credentials:"include",cache:"no-store"});
   if(!response.ok)throw new Error("بارگذاری سطل زباله ناموفق بود. دوباره کوشش کنید.");
   setRecords(await response.json());setError("");
  }catch(e){setError(e.message)}finally{setLoading(false)}
 };
 useEffect(()=>{refresh();const f=()=>setLanguage(localStorage.getItem(key)||"en");window.addEventListener("app-language-updated",f);return()=>window.removeEventListener("app-language-updated",f)},[]);
 const filtered=useMemo(()=>[...records.map(r=>({...r,generic:true})),...trash].filter(r=>`${r.recordName||""} ${r.purchase?.supplierName||""} ${(r.collections||[]).map(n=>sectionNames[n]||n).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())),[records,trash,search]);
 const restore=async(r)=>{
  if(busy)return;setBusy(true);
  try {
   if(r.generic){
    const response=await fetch(apiUrl(`trash/${encodeURIComponent(r.id)}/restore`),{method:"POST",credentials:"include"});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"بازیابی ناموفق بود.");
    publishServerCollections(result);await refresh();
   }else{
    if(!r.purchase)throw new Error("نسخهٔ ریکارد موجود نیست.");
    const restoredItems=Array.isArray(r.items)?r.items:[],restoredMovements=Array.isArray(r.movements)?r.movements:[];
    if(purchases.some(x=>String(x.id)===String(r.purchase.id))||restoredItems.some(row=>items.some(x=>String(x.id)===String(row.id)))||restoredMovements.some(row=>movements.some(x=>String(x.id)===String(row.id))))throw new Error("ریکارد موجود است؛ برای جلوگیری از بازنویسی، بازیابی متوقف شد.");
    await writeAtomicFinanceBatch({purchases:[r.purchase,...purchases],purchaseItems:[...restoredItems,...items],stockMovements:[...restoredMovements,...movements],trashPurchases:trash.filter(x=>String(x.id)!==String(r.id))});
   }
   notify("ریکارد با موفقیت بازیابی شد.","success");
  }catch(e){notify(e.message,"error")}finally{setBusy(false)}
 };
 const permanent=async(r)=>{
  if(busy)return;
  const ok=await confirmAction({title:t.confirmDelete,message:r.recordName||t.confirmDelete,confirmText:t.delete,cancelText:t.cancel});if(!ok)return;
  setBusy(true);
  try{
   if(r.generic){const password=await requestAdminDeletionPassword();if(!password)return;
    const response=await fetch(apiUrl(`trash/${encodeURIComponent(r.id)}`),{method:"DELETE",credentials:"include",headers:{"X-Admin-Password":password}});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"حذف ناموفق بود.");await refresh();
   }else{if(!(await setTrash(trash.filter(x=>String(x.id)!==String(r.id)))))return;}
   notify(t.deleteOk,"success");
  }catch(e){notify(e.message,"error")}finally{setBusy(false)}
 };
 return <div className="trash-page" dir={rtl.has(language)?"rtl":"ltr"}>
  <div className="trash-hero"><div><span className="trash-kicker"><Trash2 size={15}/>{t.records}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div></div>
  {error&&<p role="alert">{error} <button type="button" onClick={refresh}>کوشش دوباره</button></p>}
  <section className="trash-card"><div className="trash-toolbar"><h2>{t.records}</h2><div className="trash-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div></div>
   <div className="trash-table-wrap"><table><thead><tr><th>{t.record}</th><th>{t.module}</th><th>{t.deletedAt}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead><tbody>
    {filtered.map(r=><tr key={`${r.generic?"central":"legacy"}-${r.id}`}><td><strong>{r.recordName||r.purchase?.billNumber||"—"}</strong><small>{r.purchase?.supplierName||""}</small></td><td>{r.generic?(r.collections||[]).map(n=>sectionNames[n]||n).join("، "):t.purchase}</td><td>{formatDateTime(r.deletedAt)}</td><td>{t.restorable}</td><td><div className="trash-actions"><button disabled={busy} type="button" className="restore" title={t.restore} onClick={()=>restore(r)}><RotateCcw size={15}/></button><button disabled={busy} type="button" className="delete" title={t.delete} onClick={()=>permanent(r)}><Trash2 size={15}/></button></div></td></tr>)}
    {!filtered.length&&<tr><td colSpan="5" className="trash-empty">{loading?"در حال بارگذاری…":error?"—":t.empty}</td></tr>}
   </tbody></table></div>
  </section>
 </div>;
}
