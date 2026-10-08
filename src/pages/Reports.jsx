import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart, FileSpreadsheet, Printer, Save, Search, Settings2 } from "lucide-react";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatAfghanDate, todayDateValue } from "../utils/afghanDate";
import "./Reports.css";

const reportTypes = [["purchases","خریداری"],["sales","فروشات"],["payables","تادیات"],["receivables","طلبات"],["expenses","مصارف"],["profit","مفاد"]];
const bases = {
  purchases:[["supplier","تأمین‌کننده"],["product","محصول"],["company","کمپنی"],["country","ساخت کشور"],["group","گروپ"],["batch","لات نمبر"],["supplierProduct","تأمین‌کننده - محصول"],["productSupplier","محصول - تأمین‌کننده"]],
  sales:[["customer","مشتری"],["product","محصول"],["company","کمپنی"],["country","ساخت کشور"],["group","گروپ"],["batch","لات نمبر"],["customerProduct","مشتری - محصول"],["productCustomer","محصول - مشتری"]],
  purchaseReturns:[["supplier","تأمین‌کننده"],["product","محصول"]],saleReturns:[["customer","مشتری"],["product","محصول"]],payables:[["supplier","تأمین‌کننده"]],receivables:[["customer","مشتری"]],cashFlow:[["party","شخص / حساب"]],expenses:[["party","شخص / حساب"]],profit:[["product","محصول"],["customer","مشتری"]],dayBook:[["party","شخص / حساب"],["product","محصول"]],
};
const n=(v)=>Number(v)||0;
const dateOf=(x)=>String(x?.purchaseDate||x?.saleDate||x?.returnDate||x?.date||x?.createdAt||"").slice(0,10);
const money=(v)=>n(v).toLocaleString("en-US",{maximumFractionDigits:2});
const currencyLabel=(value)=>{const code=String(value||"AFN").toUpperCase();return({AFN:"افغانی",PKR:"کلدار",USD:"دالر",EUR:"یورو"}[code]||code)};
const normalizeCurrencyCode=(value)=>{const code=String(value||"AFN").toUpperCase();if(code.includes("USD"))return"USD";if(code.includes("EUR"))return"EUR";if(code.includes("PKR"))return"PKR";if(code.includes("INR"))return"INR";return"AFN"};
const gregorianReportDate=(value)=>{const raw=String(value||"").slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw||"-";const [year,month,day]=raw.split("-");const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return `${day}-${months[Number(month)-1]||month}-${year.slice(-2)}`};
const afghanReportDate=(value)=>{const raw=formatAfghanDate(value,{pad:true});if(!raw||raw==="-")return "-";const [year,month,day]=raw.split("/");return `${day}/${month}/${year}`};
const today=()=>todayDateValue?.()||new Date().toISOString().slice(0,10);
const iso=(d)=>d.toISOString().slice(0,10);
const weekStart=(date)=>{const d=new Date(date);d.setDate(d.getDate()-((d.getDay()+1)%7));return d};
const excelColumn=(index)=>{let value=index+1,name="";while(value){const remainder=(value-1)%26;name=String.fromCharCode(65+remainder)+name;value=Math.floor((value-1)/26)}return name};
async function buildStyledXlsxBuffer({title,subtitle,headers,rows,widths}){
  const workbook=new ExcelJS.Workbook();
  workbook.creator="APG Medicine Management";
  workbook.created=new Date();
  workbook.views=[{rightToLeft:true}];
  const worksheet=workbook.addWorksheet("Report",{views:[{rightToLeft:true,state:"frozen",ySplit:subtitle?3:2,topLeftCell:subtitle?"A4":"A3"}]});
  worksheet.properties.defaultRowHeight=18;
  worksheet.pageSetup={paperSize:9,orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0};
  worksheet.pageMargins={left:0.25,right:0.25,top:0.4,bottom:0.4,header:0.2,footer:0.2};
  worksheet.columns=widths.map((width,index)=>({key:`column-${index}`,width}));
  worksheet.mergeCells(1,1,1,headers.length);
  const titleCell=worksheet.getCell(1,1);
  titleCell.value=title;
  titleCell.font={name:"Arial",size:22,bold:true,color:{argb:"FFFFFFFF"}};
  titleCell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1F4E78"}};
  titleCell.alignment={horizontal:"center",vertical:"middle"};
  titleCell.border={top:{style:"thin",color:{argb:"FF808080"}},bottom:{style:"thin",color:{argb:"FF808080"}},left:{style:"thin",color:{argb:"FF808080"}},right:{style:"thin",color:{argb:"FF808080"}}};
  worksheet.getRow(1).height=34;
  let headerRowNumber=2;
  if(subtitle){
    worksheet.mergeCells(2,1,2,headers.length);
    const subtitleCell=worksheet.getCell(2,1);
    subtitleCell.value=subtitle;
    subtitleCell.font={name:"Calibri",size:10,color:{argb:"FF64748B"}};
    subtitleCell.alignment={horizontal:"center",vertical:"middle"};
    worksheet.getRow(2).height=20;
    headerRowNumber=3;
  }
  const headerRow=worksheet.getRow(headerRowNumber);
  headers.forEach((header,index)=>{
    const cell=headerRow.getCell(index+1);
    cell.value=header;
    cell.font={name:"Calibri",size:11,bold:true,color:{argb:"FF111111"}};
    cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFC0C0C0"}};
    cell.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    cell.border={top:{style:"thin",color:{argb:"FF808080"}},bottom:{style:"thin",color:{argb:"FF808080"}},left:{style:"thin",color:{argb:"FF808080"}},right:{style:"thin",color:{argb:"FF808080"}}};
  });
  headerRow.height=30;
  rows.forEach((values,rowIndex)=>{
    const outputRow=worksheet.getRow(headerRowNumber+rowIndex+1);
    values.forEach((value,columnIndex)=>{
      const cell=outputRow.getCell(columnIndex+1);
      cell.value=value??"";
      cell.font={name:"Calibri",size:11,color:{argb:"FF111111"}};
      cell.alignment={horizontal:"right",vertical:"center",wrapText:true};
      cell.border={top:{style:"thin",color:{argb:"FFD9E0E6"}},bottom:{style:"thin",color:{argb:"FFD9E0E6"}},left:{style:"thin",color:{argb:"FFD9E0E6"}},right:{style:"thin",color:{argb:"FFD9E0E6"}}};
    });
    outputRow.height=22;
  });
  worksheet.autoFilter={from:{row:headerRowNumber,column:1},to:{row:Math.max(headerRowNumber,headerRowNumber+rows.length),column:headers.length}};
  worksheet.pageSetup.printTitlesRow=`${headerRowNumber}:${headerRowNumber}`;
  worksheet.printArea=`A1:${excelColumn(headers.length-1)}${Math.max(headerRowNumber,headerRowNumber+rows.length)}`;
  return workbook.xlsx.writeBuffer();
}


function row(source,item,extra={}){return{id:`${source}-${item.id||Math.random()}-${extra.id||""}`,source,date:dateOf(item),reference:item.systemBillNumber||item.invoiceNumber||item.billNumber||item.reference||item.id||"-",party:extra.party||item.supplierName||item.customerName||item.partyName||item.description||"-",supplier:item.supplierName||"",customer:item.customerName||"",product:extra.product||item.productName||"",company:extra.company||"",country:extra.country||"",group:extra.group||"",batch:extra.batch||item.batchNo||"",quantity:n(extra.quantity??item.quantity??item.itemCount),amount:n(extra.amount??item.totalAmount??item.amount),cost:n(extra.cost),currency:item.currency||extra.currency||"AFN",details:extra.details||item.description||"-"}}

export default function Reports(){
  const navigate=useNavigate();
  const [purchases]=useJsonCollection("purchases"),[purchaseItems]=useJsonCollection("purchaseItems"),[sales]=useJsonCollection("salesRegister"),[purchaseReturns]=useJsonCollection("purchaseReturns"),[saleReturns]=useJsonCollection("saleReturns"),[supplierPayments]=useJsonCollection("supplierPayments"),[customerPayments]=useJsonCollection("customerPayments"),[cashTransactions]=useJsonCollection("partyCashTransactions"),[expenses]=useJsonCollection("expenses"),[products]=useJsonCollection("products"),[suppliers]=useJsonCollection("suppliers"),[customers]=useJsonCollection("customerRegistry");
  const [reportType,setReportType]=useState("sales"),[basis,setBasis]=useState("company"),[basisValue,setBasisValue]=useState(""),[preset,setPreset]=useState("all"),[from,setFrom]=useState(today()),[to,setTo]=useState(today()),[measure,setMeasure]=useState("both"),[trade,setTrade]=useState("all"),[reportSearch,setReportSearch]=useState(""),[shown,setShown]=useState(false);
  useEffect(()=>{setBasis((bases[reportType]||[])[0]?.[0]||"party");setBasisValue("");setReportSearch("");setShown(false)},[reportType]);
  const productMap=useMemo(()=>new Map(products.map(p=>[String(p.id),p])),[products]);
  const allRows=useMemo(()=>{
    const prs=purchases.flatMap(p=>{const items=purchaseItems.filter(i=>String(i.purchaseId)===String(p.id));return(items.length?items:[{}]).map(i=>{const product=productMap.get(String(i.productId))||{};const quantity=n(i.receivedQuantity??i.quantity);const totalCost=n(i.lineTotal??p.totalAmount);return {...row("خریداری",p,{id:i.id,product:i.productName||product.productName,company:i.manufacturerName||product.manufacturerName,country:product.countryName||product.madeIn,group:product.groupName||product.group,batch:i.batchNo,quantity,amount:totalCost,cost:n(i.purchasePrice)*quantity}),purchaseCurrency:currencyLabel(p.currency||i.currency||product.currency),purchaseCompany:i.manufacturerName||product.manufacturerName||"-",cardNumber:p.cardNumber||p.billNumber||p.reference||p.legacyId||"-",accountName:p.supplierName||"-",productNameDari:i.productName||product.productName||"-",productNameEnglish:i.productNameEnglish||product.productNameEnglish||"-----",dateM:dateOf(p),dateS:afghanReportDate(dateOf(p)),unitCost:n(i.purchasePrice??product.purchasePrice),totalCost,expiryDate:i.expiryDate?afghanReportDate(i.expiryDate):""}})});
    const srs=sales.flatMap(s=>{const items=s.items?.length?s.items:[null];return items.map((i,index)=>{const product=productMap.get(String(i?.productId))||{};const quantity=i?.quantity??i?.packageQuantity??0;const amount=n(i?.lineTotal??(items.length===1?s.totalAmount:0));const discountAmount=n(i?.discountAmount);const grossSale=amount+discountAmount;return {...row("فروشات",s,{id:i?.id||index,product:i?.productName||product.productName,company:i?.companyName||product.manufacturerName,country:product.countryName||product.madeIn,group:product.groupName||product.group,batch:i?.batchNo,quantity,amount,cost:n(i?.purchasePrice)*n(quantity)}),billCurrency:s.currency||"AFN",productNameDari:i?.productName||product.productName||"-",productNameEnglish:i?.productNameEnglish||product.productNameEnglish||"-",invoiceNumber:s.invoiceNumber||s.billNumber||s.systemBillNumber||"-",dateM:dateOf(s),dateS:afghanReportDate(dateOf(s)),discountPercent:n(i?.discountPercent??i?.discountRate),discountAmount,totalPrice:amount,grossSale}})});
    const pr=purchaseReturns.map(x=>row("برگشت خریداری",x)),sr=saleReturns.map(x=>row("برگشت فروش",x)),paymentRows=supplierPayments.map(x=>row("تادیه",x)),receiptRows=customerPayments.map(x=>row("طلب",x)),cash=cashTransactions.map(x=>row(x.type==="payment"?"پرداخت نقدی":"دریافت نقدی",x)),exp=expenses.map(x=>row("مصرف",x));
    const cutoff=preset==="all"?"":to;
    const beforeCutoff=(item)=>!cutoff||!dateOf(item)||dateOf(item)<=cutoff;
    const reportDate=(items,fallback)=>cutoff||items.map(dateOf).filter(Boolean).sort().pop()||fallback||"";
    const payableRows=suppliers.flatMap(supplier=>{
      const supplierId=String(supplier.id),sp=purchases.filter(x=>String(x.supplierId)===supplierId&&beforeCutoff(x)),srRows=purchaseReturns.filter(x=>String(x.supplierId)===supplierId&&beforeCutoff(x)),mp=supplierPayments.filter(x=>String(x.supplierId)===supplierId&&beforeCutoff(x));
      const buckets=new Map();
      const ensure=(currency)=>{const code=normalizeCurrencyCode(currency||supplier.currency);if(!buckets.has(code))buckets.set(code,{currency:code,purchased:0,paidAtPurchase:0,paidLater:0,returned:0,opening:0});return buckets.get(code)};
      const supplierCurrency=normalizeCurrencyCode(supplier.currency);
      if(n(supplier.openingBalance))ensure(supplierCurrency).opening+=n(supplier.openingBalance);
      sp.forEach(p=>{const b=ensure(p.currency);b.purchased+=n(p.totalAmount);b.paidAtPurchase+=n(p.paidAmount)});
      mp.forEach(p=>{ensure(p.currency).paidLater+=n(p.amount)});
      srRows.forEach(ret=>{const linked=sp.find(p=>String(p.id)===String(ret.purchaseId));ensure(ret.currency||linked?.currency).returned+=n(ret.totalAmount)});
      const party=supplier.supplierName||supplier.name||"-",activity=[...sp,...srRows,...mp];
      return [...buckets.values()].map(b=>{const balance=Math.max(b.purchased+Math.max(b.opening,0)-b.paidAtPurchase-b.paidLater-b.returned,0);if(balance<=0.0001)return null;return{id:`payable-${supplierId}-${b.currency}`,source:"تادیات",date:reportDate(activity,supplier.createdAt),reference:"BALANCE",party,supplier:party,customer:"",product:"",quantity:0,amount:balance,currency:b.currency,details:"باقی‌مانده حساب تأمین‌کننده"}}).filter(Boolean);
    });
    const receivableRows=customers.flatMap(customer=>{
      const customerId=String(customer.id),cs=sales.filter(x=>String(x.customerId)===customerId&&beforeCutoff(x)),cr=saleReturns.filter(x=>String(x.customerId)===customerId&&beforeCutoff(x)),cp=customerPayments.filter(x=>String(x.customerId)===customerId&&beforeCutoff(x));
      const buckets=new Map();
      const ensure=(currency)=>{const code=normalizeCurrencyCode(currency||customer.currency);if(!buckets.has(code))buckets.set(code,{currency:code,sold:0,paidAtSale:0,paidLater:0,returned:0,opening:0});return buckets.get(code)};
      const customerCurrency=normalizeCurrencyCode(customer.currency);
      if(n(customer.openingBalance))ensure(customerCurrency).opening+=n(customer.openingBalance);
      cs.forEach(s=>{const b=ensure(s.currency);b.sold+=n(s.totalAmount);b.paidAtSale+=n(s.paidAmount)});
      cp.forEach(p=>{ensure(p.currency).paidLater+=n(p.amount)});
      cr.forEach(ret=>{const linked=cs.find(s=>String(s.id)===String(ret.saleId));ensure(ret.currency||linked?.currency).returned+=n(ret.totalAmount)});
      const party=customer.fullName||customer.companyName||"-",activity=[...cs,...cr,...cp];
      return [...buckets.values()].map(b=>{const balance=Math.max(Math.max(b.opening,0)+b.sold-b.paidAtSale-b.paidLater-b.returned+Math.min(b.opening,0),0);if(balance<=0.0001)return null;return{id:`receivable-${customerId}-${b.currency}`,source:"طلبات",date:reportDate(activity,customer.createdAt),reference:"BALANCE",party,customer:party,supplier:"",product:"",quantity:0,amount:balance,currency:b.currency,details:"باقی‌مانده حساب مشتری"}}).filter(Boolean);
    });
    if(reportType==="purchases")return prs;if(reportType==="sales")return srs;if(reportType==="purchaseReturns")return pr;if(reportType==="saleReturns")return sr;if(reportType==="payables")return payableRows;if(reportType==="receivables")return receivableRows;if(reportType==="cashFlow")return[...receiptRows,...paymentRows,...cash];if(reportType==="expenses")return exp;if(reportType==="profit")return srs.map(x=>({...x,source:"مفاد",amount:x.amount-x.cost}));return[...prs,...srs,...pr,...sr,...paymentRows,...receiptRows,...cash,...exp];
  },[reportType,purchases,purchaseItems,sales,purchaseReturns,saleReturns,supplierPayments,customerPayments,cashTransactions,expenses,productMap,suppliers,customers,preset,to]);
  const basisKey=(x)=>basis==="supplierProduct"?`${x.supplier} - ${x.product}`:basis==="productSupplier"?`${x.product} - ${x.supplier}`:basis==="customerProduct"?`${x.customer} - ${x.product}`:basis==="productCustomer"?`${x.product} - ${x.customer}`:(x[basis]||(basis==="party"?x.party:""));
  const basisOptions=useMemo(()=>[...new Set(allRows.map(basisKey).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fa")),[allRows,basis]);
  const rows=useMemo(()=>{const query=reportSearch.trim().toLocaleLowerCase();return allRows.filter(x=>(preset==="all"||((!from||x.date>=from)&&(!to||x.date<=to)))&&(!basisValue||basisKey(x)===basisValue)&&(!query||Object.values(x).some(value=>String(value??"").toLocaleLowerCase().includes(query)))).sort((a,b)=>String(b.date).localeCompare(String(a.date)))},[allRows,preset,from,to,basisValue,basis,reportSearch]);
  const totals=useMemo(()=>rows.reduce((a,x)=>{a[x.currency]=(a[x.currency]||0)+x.amount;return a},{}),[rows]);
  const applyPreset=(value)=>{setPreset(value);const now=new Date();let start=new Date(now),end=new Date(now);if(value==="yesterday"){start.setDate(start.getDate()-1);end=new Date(start)}if(value==="week")start=weekStart(now);if(value==="lastWeek"){end=weekStart(now);end.setDate(end.getDate()-1);start=new Date(end);start.setDate(start.getDate()-6)}if(value==="month")start=new Date(now.getFullYear(),now.getMonth(),1);if(value==="lastMonth"){start=new Date(now.getFullYear(),now.getMonth()-1,1);end=new Date(now.getFullYear(),now.getMonth(),0)}if(!["all","custom"].includes(value)){setFrom(iso(start));setTo(iso(end))}setShown(false)};
  const getExportData=()=>{
    if(reportType==="sales")return{title:"راپور فروشات",subtitle:`به اساس کمپنی · ${basisValue||"همه کمپنی‌ها"}`,headers:["Bill Cur","Co.Name","Product Name1","Product Name2","Inv No","Date-M","Date-S","Customer Name","Qty","% Discnt","Discnt Amnt","Total Price","Gross Sale"],rows:rows.map(x=>[x.billCurrency,x.company||"-",x.productNameDari,x.productNameEnglish,x.invoiceNumber,x.dateM,x.dateS,x.party,x.quantity,x.discountPercent,x.discountAmount,x.totalPrice,x.grossSale]),widths:[12,18,34,24,14,14,14,30,12,12,16,16,16]};
    if(reportType==="purchases")return{title:"راپور خریداری",subtitle:`به اساس کمپنی · ${basisValue||"همه کمپنی‌ها"}`,headers:["Bill Cur","Co.Name","Card No","Date-M","Date-S","Account Name","Product Name1","Product Name2","Unit Cost","Qty","Total Cost","Expiry Date"],rows:rows.map(x=>[x.purchaseCurrency,x.purchaseCompany,x.cardNumber,x.dateM,x.dateS,x.accountName,x.productNameDari,x.productNameEnglish,x.unitCost,x.quantity,x.totalCost,x.expiryDate]),widths:[12,18,20,14,14,32,36,26,16,12,18,18]};
    const headers=["#","تاریخ","مرجع","نوع","شخص / حساب","محصول"];if(measure!=="amount")headers.push("تعداد");if(measure!=="quantity")headers.push("مبلغ","واحد پول");
    const genericRows=rows.map((x,index)=>{const values=[index+1,formatAfghanDate(x.date)||x.date||"-",x.reference,x.source,x.party,x.product||"-"];if(measure!=="amount")values.push(x.quantity);if(measure!=="quantity")values.push(x.amount,x.currency);return values});
    return{title:reportTypes.find(([key])=>key===reportType)?.[1]||"راپور",subtitle:`${preset==="all"?"تمام دوره‌ها":`${formatAfghanDate(from)} تا ${formatAfghanDate(to)}`} · ${basisValue||"همه"}`,headers,rows:genericRows,widths:[8,14,18,16,28,28,12,16,12].slice(0,headers.length)};
  };
  const exportExcel=async()=>{try{const data=getExportData(),buffer=await buildStyledXlsxBuffer(data),blob=new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`report-${reportType}-${today()}.xlsx`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(error){console.error("Excel export failed",error);window.alert("خروجی Excel ساخته نشد. لطفاً دوباره تلاش کنید.")}};
  const downloadPdf=async()=>{
    // Render a dedicated, paginated document rather than shrinking the on-screen table.
    const data=getExportData();
    const wide=data.headers.length>=11;
    const pageWidth=wide?1480:1100;
    const paper=wide?"a3":"a4";
    const sheet=document.createElement("div");
    sheet.setAttribute("dir","rtl");
    sheet.style.cssText=`position:fixed;left:0;top:0;width:${pageWidth}px;background:#fff;color:#17212d;direction:rtl;font-family:Tahoma,"Noto Naskh Arabic","Noto Sans Arabic",Arial,sans-serif;z-index:2147483647;box-sizing:border-box;pointer-events:none;`;
    const style=document.createElement("style");
    style.textContent=`
      .apg-pdf-page { box-sizing:border-box;width:100%;padding:24px 26px 18px;background:#fff;break-after:page;page-break-after:always; }
      .apg-pdf-page:last-child { break-after:auto;page-break-after:auto; }
      .apg-pdf-title { display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #075f4d;padding:0 0 14px;margin-bottom:10px;gap:24px; }
      .apg-pdf-title h2 { font:bold 23px Tahoma,"Noto Naskh Arabic",Arial,sans-serif;direction:rtl;unicode-bidi:plaintext;margin:0 0 7px;color:#075f4d; }
      .apg-pdf-title p { font:13px Tahoma,"Noto Naskh Arabic",Arial,sans-serif;direction:rtl;unicode-bidi:plaintext;margin:0;color:#536273; }
      .apg-pdf-meta { white-space:nowrap;font-size:12px;color:#526173;direction:rtl; }
      .apg-pdf-table { width:100%;border-collapse:collapse;table-layout:fixed;direction:rtl; }
      .apg-pdf-table th { background:#e7f2ee;color:#113b31;font-weight:bold; }
      .apg-pdf-table th,.apg-pdf-table td { box-sizing:border-box;border:1px solid #b7c6c0;padding:9px 5px;vertical-align:middle;text-align:center;direction:rtl;unicode-bidi:plaintext;font-family:Tahoma,"Noto Naskh Arabic","Noto Sans Arabic",Arial,sans-serif;line-height:1.7;font-size:${wide?12:13}px;overflow-wrap:anywhere;word-break:normal;white-space:normal; }
      .apg-pdf-table tbody tr:nth-child(even) td { background:#f6faf8; }
      .apg-pdf-table th { direction:rtl;unicode-bidi:plaintext; }
      .apg-pdf-table td.apg-pdf-ltr { direction:ltr;unicode-bidi:isolate; }
      .apg-pdf-foot { margin-top:14px;padding-top:8px;border-top:1px solid #c7d5cf;display:flex;justify-content:space-between;font-size:11px;color:#64748b; }
    `;
    sheet.appendChild(style);
    const create=(tag,text,className)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text??"-");return el};
    // Restrict rows per page so no item is cut at a paper boundary.
    const pageSize=wide?13:19;
    const pages=Math.max(1,Math.ceil(data.rows.length/pageSize));
    const weights=(data.widths||[]).slice(0,data.headers.length);
    const totalWeight=weights.reduce((sum,value)=>sum+(Number(value)||1),0);
    for(let index=0;index<pages;index++){
      const page=create("section",undefined,"apg-pdf-page");
      const heading=create("div",undefined,"apg-pdf-title");
      const name=create("div");name.append(create("h2",data.title),create("p",data.subtitle));
      heading.append(name,create("div",`تعداد: ${data.rows.length}  |  صفحه ${index+1} از ${pages}`,"apg-pdf-meta"));
      page.appendChild(heading);
      const table=create("table",undefined,"apg-pdf-table");
      const cols=create("colgroup");
      data.headers.forEach((_,i)=>{const col=create("col");col.style.width=`${((Number(weights[i])||1)/totalWeight)*100}%`;cols.appendChild(col)});
      table.appendChild(cols);
      const head=create("thead"),headerRow=create("tr");
      data.headers.forEach(label=>headerRow.appendChild(create("th",label)));
      head.appendChild(headerRow);table.appendChild(head);
      const body=create("tbody");
      const batch=data.rows.slice(index*pageSize,(index+1)*pageSize);
      if(!batch.length){const tr=create("tr"),td=create("td","برای این فیلتر ریکاردی یافت نشد.");td.colSpan=data.headers.length;tr.appendChild(td);body.appendChild(tr)}
      batch.forEach(record=>{const tr=create("tr");record.forEach(value=>{const td=create("td",value===""?"-":value);if(typeof value==="number"||/^[\d.,%/ -]+$/.test(String(value??"")))td.classList.add("apg-pdf-ltr");tr.appendChild(td)});body.appendChild(tr)});
      table.appendChild(body);page.appendChild(table);
      const foot=create("footer",undefined,"apg-pdf-foot");foot.append(create("span","APG Medicine Management"),create("span",`صفحه ${index+1} / ${pages}`));page.appendChild(foot);
      sheet.appendChild(page);
    }
    // Capture every page while it is in the visible rendering area. Offscreen
    // positioning produces blank canvases in Chromium/Edge on some systems.
    const pdf=new jsPDF({unit:"mm",format:paper,orientation:"landscape",compress:true});
    const paperWidth=pdf.internal.pageSize.getWidth();
    const paperHeight=pdf.internal.pageSize.getHeight();
    const pageNodes=[...sheet.querySelectorAll(".apg-pdf-page")];
    const originalOverflow=document.documentElement.style.overflow;
    try{
      document.documentElement.style.overflow="hidden";
      document.body.appendChild(sheet);
      if(document.fonts?.ready)await document.fonts.ready;
      for(let index=0;index<pageNodes.length;index++){
        const page=pageNodes[index];
        // Keep only the current page mounted, preventing html2canvas from
        // capturing a multi-page area or producing an empty PDF image.
        pageNodes.forEach((other)=>{other.style.display=other===page?"block":"none"});
        // Browser-native SVG foreignObject preserves Persian/Arabic glyph joining
        // and bidi shaping, unlike html2canvas's text-by-text canvas renderer.
        const canvas=await html2canvas(page,{
          foreignObjectRendering:true,
          scale:1.6,useCORS:true,backgroundColor:"#ffffff",logging:false,
          scrollX:0,scrollY:0,windowWidth:Math.max(window.innerWidth,pageWidth),
          width:pageWidth,height:Math.ceil(page.getBoundingClientRect().height)
        });
        if(canvas.width===0||canvas.height===0)throw new Error("PDF page canvas is empty");
        const img=canvas.toDataURL("image/jpeg",0.95);
        const margin=6,availableWidth=paperWidth-2*margin,availableHeight=paperHeight-2*margin;
        const ratio=Math.min(availableWidth/canvas.width,availableHeight/canvas.height);
        const renderedWidth=canvas.width*ratio,renderedHeight=canvas.height*ratio;
        if(index>0)pdf.addPage(paper,"landscape");
        pdf.addImage(img,"JPEG",(paperWidth-renderedWidth)/2,margin,renderedWidth,renderedHeight);
      }
      pdf.save(`report-${reportType}-${today()}.pdf`);
    }catch(error){console.error("PDF export failed",error);window.alert("خروجی PDF ساخته نشد. لطفاً دوباره تلاش کنید.")}
    finally{sheet.remove();document.documentElement.style.overflow=originalOverflow}

  };
  const exportCsv=()=>{const{headers,rows:exportRows}=getExportData(),lines=[headers,...exportRows],blob=new Blob(["\ufeff"+lines.map(line=>line.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`report-${reportType}-${today()}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const saveSettings=()=>localStorage.setItem("reports-builder-settings",JSON.stringify({reportType,basis,basisValue,preset,from,to,measure,trade}));
  return <div className="reports-page" dir="rtl">
    <section className="report-builder no-print"><header><div><FileBarChart size={23}/><h1>گزارشات</h1></div><button className="exchange-button" onClick={()=>navigate("/settings")}><Settings2 size={16}/> نرخ تبادله</button></header>
      <div className="report-period"><div className="period-unit"><label><input type="radio" name="unit" defaultChecked/>روز</label><label><input type="radio" name="unit"/>ماه</label><label><input type="radio" name="unit"/>سال</label></div>
        <div className="date-grid"><span>میلادی</span><label>از<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreset("custom")}}/></label><label>الی<input type="date" value={to} onChange={e=>{setTo(e.target.value);setPreset("custom")}}/></label><span>شمسی</span><label>از<ShamsiDateInput value={from} onChange={e=>{setFrom(e.target.value);setPreset("custom")}}/></label><label>الی<ShamsiDateInput value={to} onChange={e=>{setTo(e.target.value);setPreset("custom")}}/></label></div>
        <div className="preset-row">{[["all","همه"],["today","امروز"],["yesterday","دیروز"],["week","هفته جاری"],["lastWeek","هفته گذشته"],["month","ماه جاری"],["lastMonth","ماه گذشته"],["custom","سفارشی"]].map(([k,l])=><button key={k} className={preset===k?"active":""} onClick={()=>applyPreset(k)}>{l}</button>)}</div></div>
      <div className="report-options"><div className="radio-row"><span>نوع فروش:</span>{[["all","همه"],["wholesale","عمده"],["retail","پرچون"]].map(([k,l])=><label key={k}><input type="radio" name="trade" checked={trade===k} onChange={()=>setTrade(k)}/>{l}</label>)}</div>
        <label>راپور<select value={reportType} onChange={e=>setReportType(e.target.value)}>{reportTypes.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
        <label>به اساس<select value={basis} onChange={e=>{setBasis(e.target.value);setBasisValue("")}}>{(bases[reportType]||[]).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
        <label>انتخاب<div className="search-select"><Search size={15}/><select value={basisValue} onChange={e=>setBasisValue(e.target.value)}><option value="">همه</option>{basisOptions.map(v=><option key={v}>{v}</option>)}</select></div></label>
        <div className="radio-row"><span>نمایش:</span>{[["amount","مبلغ"],["quantity","تعداد"],["both","هر دو"]].map(([k,l])=><label key={k}><input type="radio" name="measure" checked={measure===k} onChange={()=>setMeasure(k)}/>{l}</label>)}</div>
        <div className="report-actions"><button onClick={()=>setShown(true)}><FileBarChart size={17}/> نمایش راپور</button><button className="secondary" onClick={saveSettings}><Save size={16}/> ذخیره تنظیمات</button><span>تعداد راپور: <b>{rows.length}</b></span></div></div>
    </section>
    {shown&&<section className={`report-sheet ${reportType==="sales"?"report-sheet-sales":""} ${reportType==="purchases"?"report-sheet-purchases":""}`}>
      <div className="report-sheet-tools no-print"><button onClick={downloadPdf}><Printer size={16}/> PDF</button><button onClick={exportExcel}><FileSpreadsheet size={16}/> Excel</button><button onClick={exportCsv}><Download size={16}/> CSV</button><label className="report-search-box"><Search size={15}/><input value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="جستجو در راپور..." aria-label="جستجو در راپور"/></label></div>
      <header>
        {reportType==="sales" ? <div className="report-sales-title"><h2>راپور فروشات</h2><p>به اساس کمپنی · {basisValue||"همه کمپنی‌ها"}</p></div> : reportType==="purchases" ? <div className="report-purchases-title"><h2>راپور خریداری</h2><p>به اساس کمپنی · {basisValue||"همه کمپنی‌ها"}</p></div> : <div><h2>{reportTypes.find(([k])=>k===reportType)?.[1]}</h2><p>{preset==="all"?"تمام دوره‌ها":`${formatAfghanDate(from)} تا ${formatAfghanDate(to)}`} · {basisValue||"همه"}</p></div>}
        <div className="report-number">تعداد: {rows.length}</div>
      </header>
      <div className="report-table-wrap">
        {reportType==="sales" ? <table className="report-sales-table"><thead><tr><th>اسعار بل<br/><small>(Bill Cur)</small></th><th>کمپنی<br/><small>(Co.Name)</small></th><th>نام جنس دری<br/><small>(Product Name1)</small></th><th>نام جنس انگلیسی<br/><small>(Product Name2)</small></th><th>نمبر بل<br/><small>(Inv No)</small></th><th>تاریخ-م<br/><small>(Date-M)</small></th><th>تاریخ-ش<br/><small>(Date-S)</small></th><th>نام مشتری<br/><small>(Customer Name)</small></th><th>مقدار<br/><small>(Qty)</small></th><th>% تخفیف<br/><small>(% Discnt)</small></th><th>مبلغ تخفیف<br/><small>(Discnt Amnt)</small></th><th>جمله قیمت<br/><small>(Total Price)</small></th><th>فروش ناخالص<br/><small>(Gross Sale)</small></th></tr></thead><tbody>{rows.length?rows.map((x)=><tr key={x.id}><td>{x.billCurrency}</td><td>{x.company||"-"}</td><td>{x.productNameDari}</td><td>{x.productNameEnglish}</td><td>{x.invoiceNumber}</td><td dir="ltr">{gregorianReportDate(x.dateM)}</td><td dir="ltr">{x.dateS}</td><td>{x.party}</td><td className="number-cell">{money(x.quantity)}</td><td className="number-cell">{money(x.discountPercent)}</td><td className="number-cell">{money(x.discountAmount)}</td><td className="number-cell">{money(x.totalPrice)}</td><td className="number-cell">{money(x.grossSale)}</td></tr>):<tr><td colSpan="13" className="empty-report">برای این فیلتر ریکاردی یافت نشد.</td></tr>}</tbody></table> : reportType==="purchases" ? <table className="report-purchases-table"><thead><tr><th>اسعار<br/><small>(Cur)</small></th><th>کمپنی<br/><small>(Co.Name)</small></th><th>کارت نمبر<br/><small>(Card No)</small></th><th>تاریخ-م<br/><small>(Date-M)</small></th><th>تاریخ-ش<br/><small>(Date-S)</small></th><th>نام حساب<br/><small>(Account Name)</small></th><th>نام جنس دری<br/><small>(Product Name1)</small></th><th>نام جنس انگلیسی<br/><small>(Product Name2)</small></th><th>نرخ خرید<br/><small>(Unit Cost)</small></th><th>مقدار<br/><small>(Qty)</small></th><th>جمله قیمت<br/><small>(Total Cost)</small></th><th>تاریخ انقضاء<br/><small>(Expiry Date)</small></th></tr></thead><tbody>{rows.length?rows.map((x)=><tr key={x.id}><td>{x.purchaseCurrency}</td><td>{x.purchaseCompany}</td><td>{x.cardNumber}</td><td dir="ltr">{gregorianReportDate(x.dateM)}</td><td dir="ltr">{x.dateS}</td><td>{x.accountName}</td><td>{x.productNameDari}</td><td>{x.productNameEnglish}</td><td className="number-cell">{money(x.unitCost)}</td><td className="number-cell">{money(x.quantity)}</td><td className="number-cell">{money(x.totalCost)}</td><td dir="ltr">{x.expiryDate}</td></tr>):<tr><td colSpan="12" className="empty-report">برای این فیلتر ریکاردی یافت نشد.</td></tr>}</tbody></table> : <table><thead><tr><th>#</th><th>تاریخ</th><th>مرجع</th><th>نوع</th><th>شخص / حساب</th><th>محصول</th>{measure!=="amount"&&<th>تعداد</th>}{measure!=="quantity"&&<><th>مبلغ</th><th>واحد پول</th></>}</tr></thead><tbody>{rows.length?rows.map((x,i)=><tr key={x.id}><td>{i+1}</td><td>{formatAfghanDate(x.date)||x.date||"-"}</td><td>{x.reference}</td><td>{x.source}</td><td>{x.party}</td><td>{x.product||"-"}</td>{measure!=="amount"&&<td>{money(x.quantity)}</td>}{measure!=="quantity"&&<><td>{money(x.amount)}</td><td>{x.currency}</td></>}</tr>):<tr><td colSpan="9" className="empty-report">برای این فیلتر ریکاردی یافت نشد.</td></tr>}</tbody></table>}
      </div>
      {reportType==="sales" ? <footer><div><span>مجموع جمله قیمت</span><strong>{money(rows.reduce((sum,item)=>sum+n(item.totalPrice),0))} AFN</strong></div><div><span>مجموع فروش ناخالص</span><strong>{money(rows.reduce((sum,item)=>sum+n(item.grossSale),0))} AFN</strong></div><div><span>مجموع تخفیف</span><strong>{money(rows.reduce((sum,item)=>sum+n(item.discountAmount),0))} AFN</strong></div></footer> : reportType==="purchases" ? <footer><div><span>مجموع جمله قیمت</span><strong>{money(rows.reduce((sum,item)=>sum+n(item.totalCost),0))}</strong></div><div><span>مجموع مقدار</span><strong>{money(rows.reduce((sum,item)=>sum+n(item.quantity),0))}</strong></div></footer> : measure!=="quantity"&&<footer>{Object.entries(totals).map(([currency,value])=><div key={currency}><span>مجموع {currency}</span><strong>{money(value)} {currency}</strong></div>)}</footer>}
    </section>}
  </div>;
}
