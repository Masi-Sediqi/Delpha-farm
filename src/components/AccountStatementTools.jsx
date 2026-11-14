import { useState } from "react";
import { accountReportRows, printAccountStatement, downloadAccountExcel, downloadAccountPDF } from "../utils/accountStatementExport";
import { notify } from "../utils/notify";

export function AccountStatementExports({ rows, type }) {
  const [busy, setBusy] = useState(false);
  const run = async (format) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = accountReportRows(rows, type);
      const title = type === "customer" ? "صورت حساب طلبات" : "صورت حساب تادیات";
      const name = `${type}-accounts`;
      if (format === "excel") await downloadAccountExcel(data, name);
      else if (format === "pdf") await downloadAccountPDF(data, title, name);
      else printAccountStatement(data, title);
    } catch (error) { notify(error.message || "خروجی آماده نشد.", "error"); }
    finally { setBusy(false); }
  };
  return <div className="account-report-actions">{[["print", "چاپ"], ["pdf", "PDF"], ["excel", "Excel"]].map(([format, title]) => <button key={format} type="button" className="account-report-btn" disabled={busy || !rows.length} onClick={() => run(format)}>{title}</button>)}</div>;
}

export default function AccountStatementTools({ filters, rows, type }) {
  return <>
    <label className="account-filter-label">اسعار<select value={filters.currency} onChange={event => filters.setCurrency(event.target.value)}><option value="ALL">همه اسعار</option>{filters.currencies.map(value => <option key={value}>{value}</option>)}</select></label>
    <label className="account-filter-label">کتگوری<select value={filters.selectedCategory} onChange={event => filters.setCategory(event.target.value)}><option value="ALL">همه کتگوری‌ها</option>{filters.categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <AccountStatementExports rows={rows} type={type}/>
  </>;
}
