import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import {
  buildAssetInventoryInsights,
  sumAssetRows,
} from "../utils/assetInventoryInsights";
import "./Reports.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const clean = (value) => String(value || "").trim();
const currencyLabel = (value) => clean(value || "AFN").toUpperCase();
const formatCurrencyTotals = (totals) => {
  const entries = Object.entries(totals || {}).filter(([, amount]) => Number(amount || 0) !== 0);
  if (!entries.length) return "-";
  return entries.map(([currency, amount]) => `${money(amount)} ${currencyLabel(currency)}`).join(" / ");
};
const sumAmountsByCurrency = (rows) =>
  rows.reduce((totals, row) => {
    const currency = currencyLabel(row.currency || row.depositCurrency || "AFN");
    return {
      ...totals,
      [currency]: Number(totals[currency] || 0) + Number(row.amount || 0),
    };
  }, {});
const keyOf = (value) => clean(value).toLowerCase();
const isInactiveCustomer = (customer) =>
  /inactive|disabled|disconnected|suspend/i.test(clean(customer?.status));
const isRealTransfer = (transfer) =>
  !transfer?.isSummaryRecord &&
  !transfer?.summaryType &&
  Number(transfer?.quantity || 0) > 0;
const rowDate = (row) =>
  clean(row.date || row.transferDate || row.purchaseDate || row.createdAt || row.updatedAt).slice(0, 10);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const sectionMeta = {
  assets: {
    title: "Current Assets",
    subtitle: "Asset categories, quantities, and current holders.",
    groupTitle: "Asset Categories",
    rowTitle: "Assets",
  },
  activeCustomers: {
    title: "Active Customers",
    subtitle: "Active customer list and assets currently held by each customer.",
    groupTitle: "Active Customers",
    rowTitle: "Customer Assets",
  },
  inactiveCustomers: {
    title: "Inactive / Suspend Customers",
    subtitle: "Inactive or suspend customers and company assets still held by them.",
    groupTitle: "Inactive / Suspend Customers",
    rowTitle: "Customer Assets",
  },
  towers: {
    title: "Towers",
    subtitle: "Tower list and assets currently held by every tower.",
    groupTitle: "Towers",
    rowTitle: "Tower Assets",
  },
  suppliers: {
    title: "Suppliers",
    subtitle: "Supplier purchase contribution by category and quantity.",
    groupTitle: "Suppliers",
    rowTitle: "Supplier Purchase Records",
  },
  transfers: {
    title: "Transfer Report",
    subtitle: "Every transfer made in the system, with issued from, issued to, date, and status.",
    groupTitle: "Transfer Destinations",
    rowTitle: "Transfer Records",
  },
  deposits: {
    title: "Deposit Recived / Deposit Paid Report",
    subtitle: "Customer deposits received and refunds or withdraws paid back.",
    groupTitle: "Deposit Recived / Deposit Paid Summary",
    rowTitle: "Deposit Recived / Deposit Paid Records",
  },
};

const sectionOrder = [
  "assets",
  "activeCustomers",
  "inactiveCustomers",
  "towers",
  "suppliers",
  "transfers",
  "deposits",
];

const colors = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#0ea5e9"];

function Reports() {
  const [settings] = useJsonCollection("settings");
  const [assets] = useJsonCollection("assets");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [customers] = useJsonCollection("customers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [suppliers] = useJsonCollection("suppliers");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");

  const [activeSection, setActiveSection] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    status: "All",
    type: "All",
  });

  const company = settings[0] || {};
  const systemName = company.companyName || "ISP Assets";
  const logo = company.logo || "";

  const insights = useMemo(
    () =>
      buildAssetInventoryInsights({
        assets,
        assetMovements,
        deviceTransfers,
        towerAssets,
        customers,
      }),
    [assets, assetMovements, customers, deviceTransfers, towerAssets]
  );

  const reportData = useMemo(
    () =>
      buildReportData({
        assets,
        customers,
        towerAssets,
        suppliers,
        supplierPurchases,
        deviceTransfers,
        insights,
      }),
    [assets, customers, deviceTransfers, insights, supplierPurchases, suppliers, towerAssets]
  );

  const activeMeta = sectionMeta[activeSection] || null;
  const activeGroups = activeSection ? reportData[activeSection]?.groups || [] : [];
  const rawRows = activeSection
    ? selectedGroup
      ? selectedGroup.rows || []
      : reportData[activeSection]?.rows || []
    : [];
  const columns = activeSection ? reportData[activeSection]?.columns || [] : [];
  const chartData = activeSection
    ? selectedGroup
      ? summarizeRowsForChart(rawRows)
      : activeGroups.map((group) => ({
          name: group.name || group.category || group.type || "Unknown",
          value: Number(group.quantity || group.total || group.records || 0),
        }))
    : overviewChartData(reportData);

  const filteredRows = useMemo(
    () =>
      rawRows.filter((row) => {
        const search = keyOf(filters.search);
        const date = rowDate(row);
        const haystack = keyOf(Object.values(row).join(" "));
        if (search && !haystack.includes(search)) return false;
        if (filters.fromDate && (!date || date < filters.fromDate)) return false;
        if (filters.toDate && (!date || date > filters.toDate)) return false;
        if (filters.status !== "All" && keyOf(row.status) !== keyOf(filters.status)) return false;
        if (filters.type !== "All" && keyOf(row.type || row.destinationType || row.category) !== keyOf(filters.type)) return false;
        return true;
      }),
    [filters, rawRows]
  );
  const filteredDepositReceivedTotals = activeSection === "deposits"
    ? sumAmountsByCurrency(filteredRows.filter((row) => row.type === "Deposit Recived"))
    : {};
  const filteredDepositPaidTotals = activeSection === "deposits"
    ? sumAmountsByCurrency(filteredRows.filter((row) => row.type === "Deposit Paid"))
    : {};

  const filterOptions = useMemo(
    () => ({
      status: ["All", ...Array.from(new Set(rawRows.map((row) => clean(row.status)).filter(Boolean))).sort()],
      type: [
        "All",
        ...Array.from(
          new Set(rawRows.map((row) => clean(row.type || row.destinationType || row.category)).filter(Boolean))
        ).sort(),
      ],
    }),
    [rawRows]
  );

  const currentTitle = activeMeta
    ? selectedGroup
      ? `${activeMeta.title} - ${selectedGroup.name || selectedGroup.category}`
      : activeMeta.title
    : "Reporting Center";

  const resetFilters = () =>
    setFilters({ search: "", fromDate: "", toDate: "", status: "All", type: "All" });

  const openSection = (section) => {
    setActiveSection(section);
    setSelectedGroup(null);
    resetFilters();
  };

  const backToOverview = () => {
    setActiveSection("");
    setSelectedGroup(null);
    resetFilters();
  };

  const exportCsv = () => {
    const rows = activeSection ? filteredRows : overviewRows(reportData);
    const exportColumns = activeSection ? columns : overviewColumns;
    const lines = [
      exportColumns.map((column) => column.label).join(","),
      ...rows.map((row) =>
        exportColumns.map((column) => `"${String(row[column.key] ?? "").replaceAll('"', '""')}"`).join(",")
      ),
    ];
    exportFile(`${currentTitle}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  };

  const exportExcel = () =>
    exportFile(`${currentTitle}.xls`, `\ufeff${reportHtml()}`, "application/vnd.ms-excel;charset=utf-8");

  const printReport = () => {
    if (window.ispDesktop?.openPrintPreview) {
      window.ispDesktop.openPrintPreview(reportHtml(), currentTitle);
      return;
    }

    const frameId = "reports-print-frame";
    let frame = document.getElementById(frameId);
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = frameId;
      frame.title = "Report print preview";
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.style.opacity = "0";
      document.body.appendChild(frame);
    }

    const frameWindow = frame.contentWindow;
    const frameDocument = frame.contentDocument || frameWindow?.document;
    if (!frameWindow || !frameDocument) return;

    let didPrint = false;
    const openPrintOptions = () => {
      if (didPrint) return;
      didPrint = true;
      frameWindow.focus();
      frameWindow.print();
    };

    frame.onload = () => setTimeout(openPrintOptions, 150);
    frameDocument.open();
    frameDocument.write(reportHtml());
    frameDocument.close();
    setTimeout(openPrintOptions, 350);
  };

  const reportHtml = () => {
    const rows = activeSection ? filteredRows : overviewRows(reportData);
    const exportColumns = activeSection ? columns : overviewColumns;
    const cards = activeSection
      ? activeSection === "deposits"
        ? [
            ["Records", filteredRows.length],
            ["Groups", activeGroups.length],
            ["Total Amount", `Deposit Recived: ${formatCurrencyTotals(filteredDepositReceivedTotals)} / Deposit Paid: ${formatCurrencyTotals(filteredDepositPaidTotals)}`],
          ]
        : [
            ["Records", filteredRows.length],
            ["Groups", activeGroups.length],
            ["Total Quantity", money(sumQuantity(filteredRows))],
          ]
      : overviewRows(reportData).map((row) => [row.section, row.value]);
    const printCards = activeSection
      ? cards
      : [
          ...cards.filter(([label]) => label !== "Deposit Recived / Deposit Paid Report").slice(0, 5),
          ["Deposit Recived / Deposit Paid Report", reportData.deposits.value],
        ];
    const renderPrintCell = (row, column) => {
      if (!activeSection && row.section === "Deposit Recived / Deposit Paid Report" && column.key === "value") {
        return `<span class="deposit-value">Deposit Recived: ${escapeHtml(formatCurrencyTotals(row.depositTotalsByCurrency))}</span><span class="withdraw-value">Deposit Paid: ${escapeHtml(formatCurrencyTotals(row.withdrawTotalsByCurrency))}</span>`;
      }
      if (!activeSection && row.section === "Deposit Recived / Deposit Paid Report" && column.key === "description") {
        return `<span class="deposit-value">Deposit Recived: ${escapeHtml(formatCurrencyTotals(row.depositTotalsByCurrency))}</span> / <span class="withdraw-value">Deposit Paid: ${escapeHtml(formatCurrencyTotals(row.withdrawTotalsByCurrency))}</span>`;
      }
      return escapeHtml(row[column.key] ?? "-");
    };
    const tableRows = rows
      .map(
        (row) =>
          `<tr>${exportColumns.map((column) => `<td>${renderPrintCell(row, column)}</td>`).join("")}</tr>`
      )
      .join("");
    const logoHtml = logo
      ? `<img src="${escapeHtml(logo)}" alt="System logo" />`
      : `<span>${escapeHtml(systemName.slice(0, 1))}</span>`;

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(currentTitle)}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; padding: 22px; font-family: Arial, sans-serif; color: #102033; background: #eef4ff; }
            .page { background: #fff; border: 1px solid #dbeafe; border-radius: 20px; overflow: hidden; }
            header { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; padding: 24px; color: white; background: linear-gradient(135deg, #0f766e, #2563eb 56%, #4f46e5); }
            .logo { width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; background: rgba(255,255,255,.18); overflow: hidden; font-size: 26px; font-weight: 900; }
            .logo img { width: 100%; height: 100%; object-fit: cover; }
            h1 { margin: 0; font-size: 25px; }
            p { margin: 6px 0 0; color: rgba(255,255,255,.86); font-size: 13px; }
            .date { border: 1px solid rgba(255,255,255,.28); border-radius: 999px; padding: 9px 13px; background: rgba(255,255,255,.16); font-size: 12px; font-weight: 800; }
            main { padding: 20px 24px 26px; }
            .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
            .card { border: 1px solid #bfdbfe; border-radius: 16px; padding: 14px; background: linear-gradient(180deg, #eff6ff, #fff); }
            .card span { display: block; color: #64748b; font-size: 11px; font-weight: 800; }
            .card strong { display: block; margin-top: 6px; font-size: 22px; color: #0f172a; }
            .deposit-value, .withdraw-value { display: block; font-weight: 900; }
            .deposit-value { color: #15803d; }
            .withdraw-value { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #dbeafe; color: #0f3f5f; }
            tr:nth-child(even) td { background: #f8fafc; }
            @media print { body { padding: 10px; background: #fff; } .page { border-radius: 0; } }
          </style>
        </head>
        <body>
          <section class="page">
            <header>
              <div class="logo">${logoHtml}</div>
              <div><h1>${escapeHtml(systemName)}</h1><p>${escapeHtml(currentTitle)}</p></div>
              <div class="date">${escapeHtml(new Date().toLocaleDateString("en-US"))}</div>
            </header>
            <main>
              <section class="cards">
                ${printCards.map(([label, value]) => {
                  if (!activeSection && label === "Deposit Recived / Deposit Paid Report") {
                    return `<div class="card"><span>${escapeHtml(label)}</span><strong class="deposit-value">Deposit Recived: ${escapeHtml(formatCurrencyTotals(reportData.deposits.depositTotalsByCurrency))}</strong><strong class="withdraw-value">Deposit Paid: ${escapeHtml(formatCurrencyTotals(reportData.deposits.withdrawTotalsByCurrency))}</strong></div>`;
                  }
                  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
                }).join("")}
              </section>
              <table>
                <thead><tr>${exportColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
                <tbody>${tableRows || `<tr><td colspan="${exportColumns.length}">No records found.</td></tr>`}</tbody>
              </table>
            </main>
          </section>
        </body>
      </html>`;
  };

  return (
    <div className="reports-page">
      <div className="reports-header report-modern-header">
        <div>
          <span>Reporting</span>
          <h1>Reporting Center</h1>
          <p>System-wide reporting for assets, customers, towers, suppliers, transfers, deposits, and withdrawals.</p>
        </div>

        <div className="report-export-actions">
          <button type="button" onClick={exportExcel}><FileSpreadsheet size={16} /> Excel</button>
          <button type="button" onClick={printReport}><FileText size={16} /> PDF</button>
          <button type="button" onClick={exportCsv}><Download size={16} /> CSV</button>
          <button type="button" onClick={printReport}><Printer size={16} /> Print</button>
        </div>
      </div>

      {!activeSection ? (
        <>
          <section className="report-overview-grid">
            {sectionOrder.map((section) => {
              const data = reportData[section];
              return (
                <button
                  type="button"
                  key={section}
                  className={`report-overview-card report-card-${section}`}
                  onClick={() => openSection(section)}
                >
                  <span>{sectionMeta[section].title}</span>
                  {section === "deposits" ? (
                    <div className="report-money-split">
                      <strong className="deposit">Deposit Recived: {formatCurrencyTotals(data.depositTotalsByCurrency)}</strong>
                      <strong className="withdraw">Deposit Paid: {formatCurrencyTotals(data.withdrawTotalsByCurrency)}</strong>
                    </div>
                  ) : (
                    <strong>{data.value}</strong>
                  )}
                  <p>{section === "deposits" ? `${data.value} records` : data.caption}</p>
                </button>
              );
            })}
          </section>

          <section className="report-chart-grid">
            <ReportChart title="Current Assets by Location" data={overviewChartData(reportData)} />
            <ReportChart title="Customer Status" data={reportData.customerStatusChart} variant="pie" />
            <ReportChart title="Transfers by Destination" data={reportData.transfers.groups.slice(0, 8)} />
          </section>
        </>
      ) : (
        <section className="report-workspace report-modern-workspace">
          <div className="report-workspace-header">
            <div>
              <button type="button" className="report-back-btn" onClick={selectedGroup ? () => setSelectedGroup(null) : backToOverview}>
                {selectedGroup ? "Back to Groups" : "Back to Reports"}
              </button>
              <h2>{currentTitle}</h2>
              <p>{activeMeta.subtitle}</p>
            </div>
          </div>

          <div className="report-filters pro-report-filters report-modern-filters">
            <label><span>Search</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search records..." /></label>
            <label><span>From Date</span><input type="date" value={filters.fromDate} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} /></label>
            <label><span>To Date</span><input type="date" value={filters.toDate} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} /></label>
            <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>{filterOptions.status.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Type / Category</span><select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>{filterOptions.type.map((option) => <option key={option}>{option}</option>)}</select></label>
            <div className="report-filter-buttons"><button type="button" onClick={resetFilters}>Reset</button></div>
          </div>

          <div className="report-summary-cards">
            <div><span>Groups</span><strong>{money(activeGroups.length)}</strong></div>
            <div><span>Records</span><strong>{money(filteredRows.length)}</strong></div>
            {activeSection === "deposits" ? (
              <div>
                <span>Total Amount</span>
                <div className="report-money-split compact">
                  <strong className="deposit">Deposit Recived: {formatCurrencyTotals(filteredDepositReceivedTotals)}</strong>
                  <strong className="withdraw">Deposit Paid: {formatCurrencyTotals(filteredDepositPaidTotals)}</strong>
                </div>
              </div>
            ) : (
              <div><span>Total Quantity</span><strong>{money(sumQuantity(filteredRows))}</strong></div>
            )}
          </div>

          <section className="report-chart-grid report-chart-grid-inside">
            <ReportChart title={`${activeMeta.title} Chart`} data={chartData} />
            <ReportChart title="Share Chart" data={chartData.slice(0, 7)} variant="pie" />
          </section>

          {!selectedGroup && (
            <ReportGroupTable
              groups={activeGroups}
              section={activeSection}
              onSelect={(group) => {
                setSelectedGroup(group);
                resetFilters();
              }}
            />
          )}

          <ReportRowsTable rows={filteredRows} columns={columns} title={activeMeta.rowTitle} />
        </section>
      )}
    </div>
  );
}

function buildReportData({
  assets,
  customers,
  towerAssets,
  suppliers,
  supplierPurchases,
  deviceTransfers,
  insights,
}) {
  const categoryGroups = insights.categoryGroups.map((group) => ({
    ...group,
    name: group.category,
    quantity: group.total,
    caption: `${money(group.stock)} stock, ${money(group.customer)} customer, ${money(group.tower)} tower, ${money(group.repair)} repair, ${money(group.wasted)} waste`,
    rows: group.rows.map(assetReportRow),
  }));

  const activeCustomerGroups = insights.customerGroups
    .filter((group) => group.type === "Active")
    .map((group) => ({ ...group, caption: `${money(group.quantity)} asset(s)`, rows: group.rows.map(assetReportRow) }));

  const inactiveCustomerGroups = insights.customerGroups
    .filter((group) => group.type === "Inactive")
    .map((group) => ({ ...group, caption: `${money(group.quantity)} asset(s)`, rows: group.rows.map(assetReportRow) }));

  const towerGroups = insights.towerGroups.map((group) => ({
    ...group,
    caption: `${money(group.quantity)} asset(s)`,
    rows: group.rows.map(assetReportRow),
  }));

  const supplierGroups = suppliers.map((supplier) => {
    const rows = supplierPurchases
      .filter(
        (purchase) =>
          keyOf(purchase.supplierName || purchase.supplier) === keyOf(supplier.supplierName) ||
          keyOf(purchase.supplierRecordId) === keyOf(supplier.id)
      )
      .map(purchaseReportRow);
    const categories = new Set(rows.map((row) => row.category).filter(Boolean));
    return {
      id: supplier.id || supplier.supplierName,
      name: supplier.supplierName || supplier.companyName || "Supplier",
      type: supplier.companyName || "Supplier",
      quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      categories: categories.size,
      caption: `${categories.size} categories / ${money(rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} pieces`,
      rows,
    };
  });

  const transferRows = deviceTransfers.filter(isRealTransfer).map(transferReportRow);
  const transferGroups = groupBy(transferRows, (row) => row.issuedToType || row.issuedTo || "Unknown").map((group) => ({
    ...group,
    type: "Destination",
    quantity: group.rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    value: group.rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0) || group.records,
    caption: `${group.rows.length} transfers / ${money(group.rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} assets`,
  }));

  const depositRows = deviceTransfers
    .filter(isRealTransfer)
    .filter((transfer) => Number(transfer.depositAmount || 0) > 0 || Number(transfer.refundAmount || 0) > 0)
    .map(depositTransferRow);
  const depositReceivedRows = depositRows.filter((row) => row.type === "Deposit Recived");
  const depositPaidRows = depositRows.filter((row) => row.type === "Deposit Paid");
  const depositTotal = depositRows
    .filter((row) => row.type === "Deposit Recived")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const withdrawTotal = depositRows
    .filter((row) => row.type === "Deposit Paid")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const depositTotalsByCurrency = sumAmountsByCurrency(depositReceivedRows);
  const withdrawTotalsByCurrency = sumAmountsByCurrency(depositPaidRows);
  const depositGroups = groupBy(depositRows, (row) => row.type).map((group) => ({
    ...group,
    quantity: group.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    caption: `${group.rows.length} records / ${formatCurrencyTotals(sumAmountsByCurrency(group.rows))}`,
  }));

  const activeCustomers = customers.filter((customer) => !isInactiveCustomer(customer));
  const inactiveCustomers = customers.filter(isInactiveCustomer);

  return {
    assets: {
      value: `${money(categoryGroups.length)} categories`,
      caption: `${money(sumAssetRows(insights.currentRows))} asset pieces currently tracked`,
      groups: categoryGroups,
      rows: categoryGroups.flatMap((group) => group.rows),
      columns: assetColumns,
    },
    activeCustomers: {
      value: money(activeCustomers.length),
      caption: `${money(sumAssetRows(activeCustomerGroups.flatMap((group) => group.rows)))} assets with active customers`,
      groups: activeCustomerGroups,
      rows: activeCustomerGroups.flatMap((group) => group.rows),
      columns: assetColumns,
    },
    inactiveCustomers: {
      value: money(inactiveCustomers.length),
      caption: `${money(sumAssetRows(inactiveCustomerGroups.flatMap((group) => group.rows)))} assets still with inactive/suspend customers`,
      groups: inactiveCustomerGroups,
      rows: inactiveCustomerGroups.flatMap((group) => group.rows),
      columns: assetColumns,
    },
    towers: {
      value: money(towerAssets.length),
      caption: `${money(sumAssetRows(towerGroups.flatMap((group) => group.rows)))} assets at towers`,
      groups: towerGroups,
      rows: towerGroups.flatMap((group) => group.rows),
      columns: assetColumns,
    },
    suppliers: {
      value: money(suppliers.length),
      caption: `${money(supplierGroups.reduce((sum, group) => sum + group.categories, 0))} category purchases`,
      groups: supplierGroups,
      rows: supplierGroups.flatMap((group) => group.rows),
      columns: purchaseColumns,
    },
    transfers: {
      value: money(transferRows.length),
      caption: `${money(transferRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} assets transferred`,
      groups: transferGroups,
      rows: transferRows,
      columns: transferColumns,
    },
    deposits: {
      value: money(depositRows.length),
      caption: `${money(depositRows.reduce((sum, row) => sum + Number(row.amount || 0), 0))} total Deposit Recived / Deposit Paid value`,
      depositTotal,
      withdrawTotal,
      depositTotalsByCurrency,
      withdrawTotalsByCurrency,
      groups: depositGroups,
      rows: depositRows,
      columns: depositColumns,
    },
    customerStatusChart: [
      { name: "Active", value: activeCustomers.length },
      { name: "Inactive / Suspend", value: inactiveCustomers.length },
    ],
  };
}

function assetReportRow(row) {
  return {
    date: row.date || row.createdAt || "",
    assetId: row.assetId || "-",
    category: row.category || "-",
    deviceName: row.deviceName || "-",
    model: row.model || "-",
    quantity: Number(row.quantity || 0),
    unit: row.unit || "Piece",
    currentHolder: row.locationName || row.placeType || "-",
    issuedFrom: row.transfer?.sourceLocation || row.sourceName || "-",
    issuedTo: row.transfer?.destinationLocation || row.destinationName || row.locationName || "-",
    status: row.status || row.placeType || "-",
    macAddress: row.transfer?.macAddress || row.asset?.macAddress || row.macAddress || "-",
    serialNumber: row.transfer?.serialNumber || row.asset?.serialNumber || row.serialNumber || "-",
  };
}

function purchaseReportRow(purchase) {
  return {
    date: purchase.purchaseDate || purchase.date || purchase.createdAt || "",
    supplier: purchase.supplierName || purchase.supplier || "-",
    invoiceNumber: purchase.invoiceNumber || purchase.referenceNumber || "-",
    assetId: purchase.assetId || "-",
    category: purchase.category || "-",
    deviceName: purchase.deviceName || purchase.assetName || "-",
    quantity: Number(purchase.quantity || 0),
    unit: purchase.unit || "Piece",
    status: purchase.status || "Recorded",
  };
}

function transferReportRow(transfer) {
  return {
    date: transfer.transferDate || transfer.date || transfer.createdAt || "",
    transferId: transfer.transferId || transfer.id || "-",
    type: transfer.transferType || "-",
    issuedFromType: transfer.sourceType || "-",
    issuedFrom: transfer.sourceLocation || transfer.sourceName || transfer.sourceType || "-",
    issuedToType: transfer.destinationType || "-",
    issuedTo: transfer.destinationLocation || transfer.destinationName || transfer.destinationType || "-",
    assetId: transfer.assetId || "-",
    category: transfer.category || "-",
    deviceName: transfer.deviceName || "-",
    quantity: Number(transfer.quantity || 0),
    unit: transfer.unit || "Piece",
    responsibleUser: transfer.responsibleUser || "-",
    receivedBy: transfer.receivedBy || "-",
    status: displayTransferStatus(transfer),
  };
}

function depositTransferRow(transfer) {
  const isRefund = Number(transfer.refundAmount || 0) > 0;
  return {
    date: isRefund ? transfer.refundDate || transfer.transferDate || transfer.createdAt : transfer.depositReceivedDate || transfer.transferDate || transfer.createdAt,
    transferId: transfer.transferId || transfer.id || "-",
    transferType: transfer.transferType || "-",
    type: isRefund ? "Deposit Paid" : "Deposit Recived",
    customer: transfer.destinationType === "Customer" ? transfer.destinationLocation : transfer.sourceLocation || "-",
    assetId: transfer.assetId || "-",
    category: transfer.category || "-",
    deviceName: transfer.deviceName || "-",
    amount: Number(isRefund ? transfer.refundAmount : transfer.depositAmount || 0),
    currency: isRefund ? transfer.refundCurrency || transfer.depositCurrency || "AFN" : transfer.depositCurrency || "AFN",
    issuedFrom: transfer.sourceLocation || "-",
    issuedTo: transfer.destinationLocation || "-",
    status: transfer.depositStatus || transfer.status || "-",
  };
}

function displayTransferStatus(transfer) {
  const destination = transfer.destinationType || transfer.toType || "";
  if (destination === "Customer") return "Issued to Customer";
  if (destination === "Tower") return "Issued to Tower";
  if (destination === "Repair") return "Issued to Repair";
  if (destination === "Waste") return "Issued to Waste";
  if (destination === "Main Stock") return "In Stock";
  return transfer.newStatus || transfer.status || "-";
}

function groupBy(rows, getName) {
  const map = new Map();
  rows.forEach((row) => {
    const name = getName(row) || "Unknown";
    const current = map.get(name) || { id: name, name, rows: [], records: 0 };
    current.rows.push(row);
    current.records += 1;
    map.set(name, current);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function overviewRows(reportData) {
  return sectionOrder.map((section) => ({
    section: sectionMeta[section].title,
    value: reportData[section].value,
    description: reportData[section].caption,
    depositTotal: reportData[section].depositTotal,
    withdrawTotal: reportData[section].withdrawTotal,
    depositTotalsByCurrency: reportData[section].depositTotalsByCurrency,
    withdrawTotalsByCurrency: reportData[section].withdrawTotalsByCurrency,
  }));
}

const overviewColumns = [
  { key: "section", label: "Report Section" },
  { key: "value", label: "Value" },
  { key: "description", label: "Description" },
];

const assetColumns = [
  { key: "date", label: "Date" },
  { key: "assetId", label: "Asset ID" },
  { key: "category", label: "Category" },
  { key: "deviceName", label: "Device Name" },
  { key: "model", label: "Model" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
  { key: "currentHolder", label: "Current Holder" },
  { key: "issuedFrom", label: "Issued" },
  { key: "issuedTo", label: "Recived" },
  { key: "status", label: "Status" },
  { key: "macAddress", label: "MAC Address" },
  { key: "serialNumber", label: "Serial Number" },
];

const purchaseColumns = [
  { key: "date", label: "Date" },
  { key: "supplier", label: "Supplier" },
  { key: "invoiceNumber", label: "Invoice No" },
  { key: "assetId", label: "Asset ID" },
  { key: "category", label: "Category" },
  { key: "deviceName", label: "Device Name" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
  { key: "status", label: "Status" },
];

const transferColumns = [
  { key: "date", label: "Date" },
  { key: "transferId", label: "Transfer ID" },
  { key: "type", label: "Transfer Type" },
  { key: "issuedFrom", label: "Issued" },
  { key: "issuedTo", label: "Recived" },
  { key: "category", label: "Category" },
  { key: "deviceName", label: "Device Name" },
  { key: "quantity", label: "Quantity" },
  { key: "responsibleUser", label: "Responsible User" },
  { key: "receivedBy", label: "Received By" },
  { key: "status", label: "Status" },
];

const depositColumns = [
  { key: "date", label: "Date" },
  { key: "transferId", label: "Transfer ID" },
  { key: "transferType", label: "Transfer Type" },
  { key: "type", label: "Type" },
  { key: "customer", label: "Customer" },
  { key: "assetId", label: "Asset ID" },
  { key: "category", label: "Category" },
  { key: "deviceName", label: "Device Name" },
  { key: "amount", label: "Amount" },
  { key: "currency", label: "Currency" },
  { key: "issuedFrom", label: "Issued" },
  { key: "issuedTo", label: "Recived" },
  { key: "status", label: "Status" },
];

function overviewChartData(reportData) {
  return [
    { name: "Stock", value: sumQuantity(reportData.assets.rows.filter((row) => row.currentHolder === "Main Stock")) },
    { name: "Customers", value: sumQuantity(reportData.activeCustomers.rows) + sumQuantity(reportData.inactiveCustomers.rows) },
    { name: "Towers", value: sumQuantity(reportData.towers.rows) },
    { name: "Transfers", value: reportData.transfers.rows.length },
    { name: "Deposits", value: reportData.deposits.rows.length },
  ];
}

function summarizeRowsForChart(rows) {
  return groupBy(rows, (row) => row.category || row.status || row.type || "Records").map((group) => ({
    name: group.name,
    value: sumQuantity(group.rows) || group.rows.length,
  }));
}

function sumQuantity(rows) {
  return rows.reduce((sum, row) => sum + Number(row.quantity || row.amount || 0), 0);
}

function ReportChart({ title, data, variant = "bar" }) {
  const cleanData = data
    .map((item) => ({
      ...item,
      value: Number(item.value || item.quantity || item.records || 0),
    }))
    .filter((item) => item.value > 0)
    .slice(0, 10);
  return (
    <section className="report-chart-card">
      <h3>{title}</h3>
      <div className="report-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          {variant === "pie" ? (
            <PieChart>
              <Pie data={cleanData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4}>
                {cleanData.map((item, index) => (
                  <Cell key={item.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={cleanData} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[7, 7, 0, 0]} fill="#2563eb" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ReportGroupTable({ groups, section, onSelect }) {
  return (
    <section className="report-table-card">
      <div className="report-section-title">
        <h3>{sectionMeta[section].groupTitle}</h3>
        <span>Click a row to open detailed records.</span>
      </div>
      <div className="report-table-shell">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Quantity / Value</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id || group.name || group.category} className="report-click-row" onClick={() => onSelect(group)}>
                <td>{group.name || group.category}</td>
                <td>{group.type || "Group"}</td>
                <td>{money(group.quantity || group.total || group.records || 0)}</td>
                <td>{group.caption || `${group.rows?.length || 0} records`}</td>
              </tr>
            ))}
            {!groups.length && (
              <tr><td colSpan="4" className="report-empty">No group records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportRowsTable({ rows, columns, title }) {
  return (
    <section className="report-table-card">
      <div className="report-section-title">
        <h3>{title}</h3>
        <span>Filtered records with dates, issued from, issued to, status, and device details.</span>
      </div>
      <div className="report-table-shell">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 250).map((row, index) => (
              <tr key={`${row.assetId || row.transferId || row.customer || row.supplier}-${index}`}>
                {columns.map((column) => (
                  <td key={column.key}>{column.key === "date" ? formatDateTime(row[column.key]) : row[column.key] ?? "-"}</td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={columns.length} className="report-empty">No records found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function exportFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default Reports;
