const safe = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt = (value) => Number(value || 0).toLocaleString('en-US', {maximumFractionDigits: 2});

export function accountReportRows(rows, type) {
  return rows.map((row, index) => {
    const party = type === 'customer' ? row.customer : row.supplier;
    return {
      no: index + 1,
      name: party?.fullName || party?.name || party?.supplierName || party?.companyName || '',
      company: party?.companyName || party?.contactPerson || '',
      phone: party?.phone || party?.phoneNumber || '',
      category: party?.categoryName || party?.category || party?.customerType || party?.supplierType || '',
      currency: row.currency || 'AFN',
      count: row.invoiceCount ?? row.purchaseCount ?? 0,
      total: row.totalSold ?? row.totalPurchased ?? 0,
      paid: row.totalPaid ?? 0,
      balance: row.balance ?? 0,
    };
  });
}

const columns = [['no','#'],['name','نام حساب'],['company','کمپنی / شخص مسئول'],['phone','شماره تماس'],['category','کتگوری'],['currency','اسعار'],['count','تعداد بل'],['total','مجموع'],['paid','دریافت / پرداخت'],['balance','بیلانس']];
const reportMarkup = (rows, title) => `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;padding:22px;color:#17233b;background:#fff"><h2 style="margin:0 0 8px">${safe(title)}</h2><small>APG Medicine Management · ${safe(new Date().toLocaleDateString('en-CA'))}</small><table style="border-collapse:collapse;width:100%;margin-top:18px;font-size:11px"><thead><tr>${columns.map(([,label])=>`<th style="border:1px solid #ccd5df;padding:8px;background:#e7edf4">${safe(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${columns.map(([key])=>`<td style="border:1px solid #ccd5df;padding:7px;overflow-wrap:anywhere">${safe(['total','paid','balance'].includes(key)?fmt(r[key]):r[key])}</td>`).join('')}</tr>`).join('')}</tbody></table><p style="font-size:11px;color:#65758a">مبالغ بدون تبدیل اسعار، در واحد پولی همان ردیف نمایش داده می‌شوند.</p></div>`;

export function printAccountStatement(rows, title) {
  const popup = window.open('', '_blank', 'width=1100,height=800');
  if (!popup) { window.alert('مرورگر پنجره چاپ را مسدود کرده است. لطفاً Pop-up را فعال کنید.'); return; }
  popup.opener = null;
  popup.document.write(`<!doctype html><html lang="fa"><head><meta charset="utf-8"><title>${safe(title)}</title><style>@page{size:A4 landscape;margin:12mm}body{margin:0}button{padding:10px 18px;cursor:pointer}@media print{button{display:none}}</style></head><body><button onclick="window.print()">چاپ / Save as PDF</button>${reportMarkup(rows,title)}</body></html>`);
  popup.document.close();
}

export async function downloadAccountExcel(rows, filename) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Accounts', {views:[{rightToLeft:true,state:'frozen',ySplit:1}]});
  sheet.columns = columns.map(([key,label])=>({header:label,key,width:key==='name'?32:key==='company'?25:18}));
  for(const row of rows) sheet.addRow(row);
  sheet.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  sheet.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF075A46'}};
  ['total','paid','balance'].forEach(key => sheet.getColumn(key).numFmt = '#,##0.00');
  sheet.autoFilter = {from:'A1',to:'J1'};
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');link.href=url;link.download=`${filename}.xlsx`;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function downloadAccountPDF(rows, title, filename) {
  const el = document.createElement('div');
  el.innerHTML = reportMarkup(rows,title);
  el.style.cssText = 'position:absolute;left:0;top:0;width:1040px;background:white;z-index:-1';
  document.body.append(el);
  try {
    const mod = await import('html2pdf.js');
    const html2pdf = mod.default || mod;
    await html2pdf().set({margin:6,filename:`${filename}.pdf`,html2canvas:{scale:1.6,useCORS:true},jsPDF:{orientation:'landscape',unit:'mm',format:'a4'},pagebreak:{mode:['css','legacy']}}).from(el).save();
  } finally { el.remove(); }
}
