import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, PackagePlus, Pencil, Printer, RotateCcw, Search, Trash2, Undo2 } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { formatDateTime } from "../utils/afghanDate";
import { notify } from "../utils/notify";
import "./Purchasing.css";

const languageKey = "afghan-power-language";
const n = (v) => Math.max(Number(v || 0), 0);
const tr = {
  en:{title:"Purchasing",subtitle:"Register and manage supplier purchases in one simple workspace.",newPurchase:"New Purchase",purchaseReturns:"Purchase Returns",records:"Purchase Records",search:"Search bill number or supplier...",bill:"Bill No.",supplier:"Supplier",items:"Items",total:"Total",paid:"Paid",remaining:"Remaining",payment:"Payment",date:"Date",actions:"Actions",cash:"Paid",debt:"Debt",empty:"No purchases have been registered yet.",menu:"Actions",details:"Full Details",edit:"Edit",delete:"Delete",print:"Print",return:"Return",deleteTitle:"Move purchase to Trash?",deleteMessage:"The purchase will be removed from active records and kept in Trash until permanently deleted.",cancel:"Cancel",moveToTrash:"Move to Trash",deleted:"Purchase moved to Trash."},
  fa:{title:"خریداری",subtitle:"خریدهای تأمین‌کننده را در یک محیط ساده ثبت و مدیریت کنید.",newPurchase:"خریداری جدید",purchaseReturns:"برگشت خرید",records:"ریکاردهای خریداری",search:"جستجوی بل نمبر یا تأمین‌کننده...",bill:"بل نمبر",supplier:"تأمین‌کننده",items:"اقلام",total:"جمله مقدار",paid:"پرداخت",remaining:"باقی‌مانده",payment:"حالت پرداخت",date:"تاریخ",actions:"عملیات",cash:"پرداخت شده",debt:"قرض",empty:"هنوز خریداری ثبت نشده است.",menu:"عملیات",details:"معلومات مکمل",edit:"ایدیت",delete:"حذف",print:"پرنت",return:"برگشت",deleteTitle:"خریداری به سطل زباله انتقال شود؟",deleteMessage:"ریکارد از خریداری فعال حذف می‌شود و تا حذف نهایی در سطل زباله باقی می‌ماند.",cancel:"لغو",moveToTrash:"انتقال به سطل زباله",deleted:"خریداری به سطل زباله انتقال شد."},
  ps:{title:"پېرود",subtitle:"د عرضه کوونکو پېرودونه په یوه ساده چاپېریال کې ثبت او اداره کړئ.",newPurchase:"نوی پېرود",purchaseReturns:"د پېرود بېرته ستنول",records:"د پېرود ریکارډونه",search:"د بل نمبر یا عرضه کوونکي لټون...",bill:"بل نمبر",supplier:"عرضه کوونکی",items:"توکي",total:"ټول مبلغ",paid:"ورکړه",remaining:"پاتې",payment:"د ورکړې حالت",date:"نېټه",actions:"کړنې",cash:"ورکړل شوی",debt:"پور",empty:"تر اوسه پېرود نه دی ثبت شوی.",menu:"کړنې",details:"بشپړ معلومات",edit:"سمون",delete:"حذف",print:"پرنټ",return:"بېرته ستنول",deleteTitle:"پېرود کثافاتو ته ولېږدول شي؟",deleteMessage:"ریکارډ له فعال پېرود څخه لرې کېږي او تر وروستي حذف پورې په کثافاتو کې ساتل کېږي.",cancel:"لغوه",moveToTrash:"کثافاتو ته انتقال",deleted:"پېرود کثافاتو ته انتقال شو."}
};

export default function Purchasing(){
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightPurchaseId,setHighlightPurchaseId]=useState(null);
  const [language,setLanguage]=useState(()=>localStorage.getItem(languageKey)||"en");
  const [purchases,setPurchases]=useJsonCollection("purchases");
  const [purchaseItems,setPurchaseItems]=useJsonCollection("purchaseItems");
  const [suppliers]=useJsonCollection("suppliers");
  const [movements,setMovements]=useJsonCollection("stockMovements");
  const [trashPurchases,setTrashPurchases]=useJsonCollection("trashPurchases");
  const [search,setSearch]=useState("");
  const [actionMenu,setActionMenu]=useState(null);
  const t=tr[language]||tr.en; const dir=language==="en"?"ltr":"rtl";
  useEffect(()=>{const sync=()=>setLanguage(localStorage.getItem(languageKey)||"en");window.addEventListener("app-language-updated",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("app-language-updated",sync);window.removeEventListener("storage",sync)}},[]);
  useEffect(()=>{
    const target=location.state?.highlightPurchaseId;
    if(!target)return;
    setHighlightPurchaseId(String(target));
    const scrollTimer=setTimeout(()=>{
      document.getElementById(`purchase-row-${target}`)?.scrollIntoView({behavior:"smooth",block:"center"});
    },120);
    const clearTimer=setTimeout(()=>{
      setHighlightPurchaseId(null);
      navigate(location.pathname,{replace:true,state:null});
    },5000);
    return()=>{clearTimeout(scrollTimer);clearTimeout(clearTimer)};
  },[location.state?.highlightPurchaseId]);
  useEffect(()=>{
    if(!actionMenu)return;
    const close=()=>setActionMenu(null);
    const closeFromOutside=(event)=>{
      if(!event.target.closest(".purchase-action-trigger,.purchase-action-popover-fixed"))close();
    };
    window.addEventListener("resize",close);
    window.addEventListener("scroll",close,true);
    document.addEventListener("pointerdown",closeFromOutside,true);
    return()=>{
      window.removeEventListener("resize",close);
      window.removeEventListener("scroll",close,true);
      document.removeEventListener("pointerdown",closeFromOutside,true);
    };
  },[actionMenu]);
  const toggleActionMenu=(event,p)=>{
    event.stopPropagation();
    const rect=event.currentTarget.getBoundingClientRect();
    const menuWidth=Math.min(148,Math.max(window.innerWidth-20,1));
    const menuHeight=164;
    const gap=4;
    const viewportW=window.innerWidth;
    const viewportH=window.innerHeight;
    const openBelow=viewportH-rect.bottom>=menuHeight+gap+8;
    const top=openBelow?rect.bottom+gap:Math.max(8,rect.top-menuHeight-gap);
    let left=dir==="rtl"?rect.right-menuWidth:rect.left;
    left=Math.min(Math.max(8,left),viewportW-menuWidth-8);
    setActionMenu(current=>current?.id===p.id?null:{id:p.id,purchase:p,top,left});
  };
  const supplierName=(id)=>suppliers.find(x=>String(x.id)===String(id))?.supplierName||"—";
  const rowsFor=(p)=>{const rows=purchaseItems.filter(x=>String(x.purchaseId)===String(p.id));return rows.length?rows:(Array.isArray(p.items)?p.items:[])};
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return purchases;return purchases.filter(p=>`${p.billNumber||""} ${p.supplierName||supplierName(p.supplierId)}`.toLowerCase().includes(q))},[purchases,search,suppliers]);
  const moveToTrash=async(p)=>{const ok=await confirmAction({title:t.deleteTitle,message:t.deleteMessage,confirmText:t.moveToTrash,cancelText:t.cancel});if(!ok)return;const itemRows=rowsFor(p);const relatedMovements=movements.filter(m=>m.referenceType==="purchase"&&String(m.referenceId)===String(p.id));const trashRecord={id:`trash-purchase-${p.id}`,type:"purchase",purchaseId:p.id,recordName:p.billNumber||p.supplierName||p.id,purchase:p,items:itemRows,movements:relatedMovements,deletedAt:new Date().toISOString(),restorable:true};if(!(await setTrashPurchases([trashRecord,...trashPurchases.filter(x=>String(x.purchaseId)!==String(p.id))])))return;if(!(await setPurchases(purchases.filter(x=>String(x.id)!==String(p.id)))))return;await setPurchaseItems(purchaseItems.filter(x=>String(x.purchaseId)!==String(p.id)));await setMovements(movements.filter(m=>!(m.referenceType==="purchase"&&String(m.referenceId)===String(p.id))));notify(t.deleted,"success")};
  return <div className="purchasing-page" dir={dir}>
    <div className="purchasing-page-header"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="purchasing-header-actions"><button className="purchasing-secondary-btn" onClick={()=>navigate("/purchase-returns")}><RotateCcw size={16}/>{t.purchaseReturns}</button><button className="purchasing-primary-btn" onClick={()=>navigate("/purchasing/new")}><PackagePlus size={16}/>{t.newPurchase}</button></div></div>
    <section className="purchasing-history-card"><div className="purchasing-card-title"><h2>{t.records}</h2><div className="purchasing-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div></div><div className="purchasing-table-wrap"><table><thead><tr><th>{t.bill}</th><th>{t.supplier}</th><th>{t.items}</th><th>{t.total}</th><th>{t.paid}</th><th>{t.remaining}</th><th>{t.payment}</th><th>{t.date}</th><th>{t.actions}</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id} id={`purchase-row-${p.id}`} className={String(highlightPurchaseId)===String(p.id)?"purchase-row-highlight":""}><td><strong>{p.billNumber||"—"}</strong></td><td>{p.supplierName||supplierName(p.supplierId)}</td><td>{rowsFor(p).length||p.itemCount||0}</td><td>{n(p.totalAmount).toFixed(2)} {p.currency||"AFN"}</td><td>{n(p.paidAmount).toFixed(2)} {p.currency||"AFN"}</td><td>{n(p.remainingAmount).toFixed(2)} {p.currency||"AFN"}</td><td><span className={`purchase-payment-pill ${n(p.remainingAmount)>0?"debt":"paid"}`}>{n(p.remainingAmount)>0?t.debt:t.cash}</span></td><td>{formatDateTime(p.purchaseDate||p.createdAt)}</td><td className="purchase-actions-cell"><button type="button" className="purchase-action-trigger" title={t.menu} aria-label={t.menu} aria-expanded={actionMenu?.id===p.id} onClick={(event)=>toggleActionMenu(event,p)}><span className="purchase-action-dots" aria-hidden="true">•••</span></button></td></tr>)}{!filtered.length&&<tr><td colSpan="9" className="purchasing-empty">{t.empty}</td></tr>}</tbody></table></div></section>{actionMenu&&createPortal(<div className="purchase-action-popover-fixed" style={{top:actionMenu.top,left:actionMenu.left}} role="menu" onClick={(e)=>e.stopPropagation()}><button type="button" role="menuitem" onClick={()=>{setActionMenu(null);navigate(`/purchasing/${actionMenu.purchase.id}`)}}><Eye size={13}/><span>{t.details}</span></button><button type="button" role="menuitem" onClick={()=>{setActionMenu(null);navigate(`/purchasing/${actionMenu.purchase.id}/edit`)}}><Pencil size={13}/><span>{t.edit}</span></button><button type="button" role="menuitem" onClick={()=>{setActionMenu(null);navigate(`/purchasing/${actionMenu.purchase.id}/print`)}}><Printer size={13}/><span>{t.print}</span></button><button type="button" role="menuitem" onClick={()=>{setActionMenu(null);navigate(`/purchase-returns?purchaseId=${encodeURIComponent(actionMenu.purchase.id)}`)}}><Undo2 size={13}/><span>{t.return}</span></button><button type="button" role="menuitem" className="danger" onClick={()=>{const purchase=actionMenu.purchase;setActionMenu(null);moveToTrash(purchase)}}><Trash2 size={13}/><span>{t.delete}</span></button></div>,document.body)}
  </div>
}
