const esc = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const labels = {
  en: { title:"Purchase Report", supplier:"Supplier", bill:"Bill No.", date:"Purchase Date", currency:"Currency", status:"Payment Status", paid:"Paid", debt:"Debt", items:"Purchased Items", product:"Product", qty:"Quantity", buy:"Purchase Price", sell:"Sale Price", total:"Line Total", grand:"Grand Total", paidAmount:"Paid Amount", remaining:"Remaining", print:"Print", close:"Close", fullyPaid:"Fully Paid", credit:"Credit / Debt", report:"REPORT" },
  fa: { title:"گزارش خریداری", supplier:"تأمین‌کننده", bill:"بل نمبر", date:"تاریخ خریداری", currency:"واحد پول", status:"وضعیت پرداخت", paid:"پرداخت", debt:"قرض", items:"اقلام خریداری‌شده", product:"محصول", qty:"مقدار", buy:"قیمت خرید", sell:"قیمت فروش", total:"جمله", grand:"مجموع نهایی", paidAmount:"پرداخت‌شده", remaining:"باقی‌مانده", print:"پرنت", close:"بستن", fullyPaid:"مکمل پرداخت", credit:"قرض", report:"راپور" },
  ps: { title:"د پېرود راپور", supplier:"عرضه کوونکی", bill:"بل نمبر", date:"د پېرود نېټه", currency:"اسعار", status:"د ورکړې حالت", paid:"ورکړه", debt:"پور", items:"پېرودل شوي توکي", product:"توکی", qty:"مقدار", buy:"د پېرود بیه", sell:"د پلور بیه", total:"ټول", grand:"وروستی مجموع", paidAmount:"ورکړل شوی", remaining:"پاتې", print:"پرنټ", close:"بندول", fullyPaid:"بشپړ ورکړل شوی", credit:"پور", report:"راپور" },
};

export function printPurchaseReport(purchase, items = [], language = "en") {
  if (!purchase) return;
  const t = labels[language] || labels.en;
  const rtl = language !== "en";
  const currency = purchase.currency || "AFN";
  const fmt = (v) => `${Number(v || 0).toFixed(2)} ${esc(currency)}`;
  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${esc(item.productName || "—")}</strong><small>${esc(item.group || "")}</small></td>
      <td>${esc(item.quantity || 0)}</td>
      <td>${fmt(item.purchasePrice)}</td>
      <td>${fmt(item.salePrice)}</td>
      <td>${fmt(item.lineTotal ?? Number(item.quantity || 0) * Number(item.purchasePrice || 0))}</td>
    </tr>`).join("");
  const win = window.open("", "_blank", "width=1080,height=820");
  if (!win) return;
  win.document.write(`<!doctype html><html dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><title>${esc(t.title)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eef1f5;font-family:Arial,"Segoe UI",sans-serif;color:#101828}.toolbar{position:sticky;top:0;z-index:5;display:flex;gap:8px;align-items:center;padding:12px 18px;background:#fff;border-bottom:1px solid #dfe4ea}.toolbar button{height:38px;padding:0 15px;border:1px solid #d8dde5;border-radius:9px;background:#fff;font-weight:700;cursor:pointer}.toolbar .primary{background:#14213d;color:#fff;border-color:#14213d}.sheet{position:relative;width:210mm;min-height:297mm;margin:22px auto;background:#fff;box-shadow:0 16px 48px rgba(16,24,40,.16);overflow:hidden}.top-wave{height:33mm;background:linear-gradient(135deg,#2d83b7,#0f8a94);clip-path:polygon(0 0,100% 0,100% 76%,78% 88%,52% 82%,28% 91%,0 82%);color:#fff;padding:11mm 14mm;display:flex;justify-content:space-between;align-items:flex-start}.brand strong{font-size:22px;letter-spacing:.5px}.brand small{display:block;margin-top:4px;font-size:10px;opacity:.92}.report-badge{display:inline-block;margin:5mm 0 2mm;padding:4px 9px;border-radius:999px;background:#eef7f8;color:#126779;font-size:9px;font-weight:800}.content{padding:0 14mm 26mm}.title{text-align:center;margin:1mm 0 6mm}.title h1{font-size:21px;margin:0}.title p{font-size:10px;color:#667085;margin:4px 0}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-bottom:6mm}.meta div,.sum-card{border:1px solid #d8e0e7;background:#f8fbfc;border-radius:8px;padding:4mm}.meta span,.sum-card span{display:block;font-size:9px;color:#667085;margin-bottom:2px}.meta strong,.sum-card strong{font-size:12px}.section-title{font-size:13px;margin:6mm 0 3mm}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#eff5f7;color:#344054;padding:8px;border-bottom:1px solid #d9e2e8;text-align:${rtl?'right':'left'}}td{padding:9px 8px;border-bottom:1px solid #e8edf1;vertical-align:top}td small{display:block;color:#98a2b3;margin-top:2px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin-top:6mm}.sum-card.total{background:#eef7f8;border-color:#abd6db}.footer-wave{position:absolute;bottom:0;left:0;right:0;height:18mm;background:linear-gradient(135deg,#168b99,#2d83b7);clip-path:polygon(0 34%,28% 48%,59% 40%,82% 46%,100% 37%,100% 100%,0 100%)}.footer-text{position:absolute;bottom:6mm;left:0;right:0;text-align:center;color:#fff;font-size:8px;z-index:2}@media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;box-shadow:none;width:210mm;min-height:297mm}@page{size:A4;margin:0}}
  </style></head><body><div class="toolbar"><button class="primary" onclick="window.print()">${esc(t.print)}</button><button onclick="window.close()">${esc(t.close)}</button></div><article class="sheet"><div class="top-wave"><div class="brand"><strong>APG</strong><small>Pharmacy & Medicine Management System</small></div><div>${esc(purchase.billNumber || "")}</div></div><div class="content"><div class="title"><span class="report-badge">${esc(t.report)}</span><h1>${esc(t.title)}</h1><p>${esc(purchase.purchaseDate || "")}</p></div><div class="meta"><div><span>${esc(t.supplier)}</span><strong>${esc(purchase.supplierName || "—")}</strong></div><div><span>${esc(t.bill)}</span><strong>${esc(purchase.billNumber || "—")}</strong></div><div><span>${esc(t.currency)}</span><strong>${esc(currency)}</strong></div><div><span>${esc(t.status)}</span><strong>${esc((purchase.paymentStatus === 'debt' || Number(purchase.remainingAmount)>0) ? t.credit : t.fullyPaid)}</strong></div><div><span>${esc(t.paidAmount)}</span><strong>${fmt(purchase.paidAmount)}</strong></div><div><span>${esc(t.remaining)}</span><strong>${fmt(purchase.remainingAmount)}</strong></div></div><h2 class="section-title">${esc(t.items)}</h2><table><thead><tr><th>#</th><th>${esc(t.product)}</th><th>${esc(t.qty)}</th><th>${esc(t.buy)}</th><th>${esc(t.sell)}</th><th>${esc(t.total)}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">—</td></tr>`}</tbody></table><div class="summary"><div class="sum-card"><span>${esc(t.paidAmount)}</span><strong>${fmt(purchase.paidAmount)}</strong></div><div class="sum-card"><span>${esc(t.remaining)}</span><strong>${fmt(purchase.remainingAmount)}</strong></div><div class="sum-card total"><span>${esc(t.grand)}</span><strong>${fmt(purchase.totalAmount)}</strong></div></div></div><div class="footer-text">Powered by Afghan Power Group</div><div class="footer-wave"></div></article></body></html>`);
  win.document.close();
}
