import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  DollarSign,
  Package,
  Plus,
  RefreshCcw,
  ShoppingCart,
  Smartphone,
  TrendingDown,
  TrendingUp,
  UserPlus,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getCurrentLocationRows } from "../utils/dashboardInsights";
import { todayDateValue } from "../utils/afghanDate";
import "../App.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const LANGUAGE_STATE_KEY = "afghan-power-language";
const dashboardText = {
  en: {
    title: "Dashboard",
    quick: "Quick Actions:",
    monthly: "Monthly",
    addProduct: "Add Product",
    newSale: "New Sale",
    addExpense: "Add Expense",
    addCustomer: "Add Customer",
    addCash: "Add Cash",
    addLedger: "Add Ledger Entry",
    salesVsExpenses: "Sales vs Expenses",
    inventoryByBrand: "Inventory by Brand",
    cards: [
      "Total Revenue",
      "Total Purchased",
      "Net Profit",
      "Pure Profit",
      "Total Cash Collected",
      "Cash Wallet",
      "Phones Sold",
      "In Stock",
      "Exchange Trades",
      "Total Expenses",
      "Inventory Value",
      "Total Refunded",
      "Advanced Revenue",
      "Total Accounts",
      "Total Receivable Remaining",
      "Total Payable Remaining",
      "Net Balance",
    ],
  },
  fa: {
    title: "داشبورد",
    quick: "عملیات سریع:",
    monthly: "ماهانه",
    addProduct: "افزودن محصول",
    newSale: "فروش جدید",
    addExpense: "افزودن مصرف",
    addCustomer: "افزودن مشتری",
    addCash: "افزودن نقدی",
    addLedger: "ثبت دفتر",
    salesVsExpenses: "فروشات و مصارف",
    inventoryByBrand: "موجودی بر اساس برند",
    cards: [
      "مجموع عواید",
      "مجموع خریداری",
      "مفاد خالص",
      "مفاد اصلی",
      "نقد جمع‌آوری‌شده",
      "کیف پول نقدی",
      "گوشی‌های فروخته‌شده",
      "در موجودی",
      "تبادلات اسعار",
      "مجموع مصارف",
      "ارزش موجودی",
      "مجموع برگشتی",
      "عواید پیشرفته",
      "مجموع حساب‌ها",
      "باقی‌مانده طلبات",
      "باقی‌مانده پرداختنی",
      "بیلانس خالص",
    ],
  },
  ps: {
    title: "ډشبورد",
    quick: "چټک عملیات:",
    monthly: "میاشتنی",
    addProduct: "محصول زیاتول",
    newSale: "نوی خرڅلاو",
    addExpense: "مصرف زیاتول",
    addCustomer: "مشتري زیاتول",
    addCash: "نغدي زیاتول",
    addLedger: "دفتر ثبتول",
    salesVsExpenses: "خرڅلاو او مصارف",
    inventoryByBrand: "موجودي د برند له مخې",
    cards: [
      "ټول عواید",
      "ټوله پېرودنه",
      "خالصه ګټه",
      "اصلي ګټه",
      "ټوله راټوله شوې نغدي",
      "نغدي بټوه",
      "پلورل شوي موبایلونه",
      "په موجودي کې",
      "د اسعارو تبادلې",
      "ټول مصارف",
      "د موجودۍ ارزښت",
      "ټوله بېرته ورکړه",
      "پرمختللي عواید",
      "ټول حسابونه",
      "پاتې ترلاسه کېدونکي",
      "پاتې ورکول کېدونکي",
      "خالص بیلانس",
    ],
  },
};
const clean = (value) => String(value || "").trim();
const normalize = (value) => clean(value).toLowerCase();
const isInactive = (customer) =>
  /inactive|disabled|disconnected|suspend/i.test(String(customer?.status || ""));
const isWasted = (asset) =>
  /waste|wasted|damaged|lost/i.test(String(asset?.status || asset?.location || ""));
const isApprovedTransfer = (transfer) =>
  !/rejected/i.test(String(transfer?.approvalStatus || "Approved"));

const dateFields = [
  "date",
  "createdAt",
  "createdDate",
  "transferDate",
  "issueDate",
  "purchaseDate",
  "registrationDate",
  "wasteDate",
  "resultDate",
];

const toDateValue = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const shiftDate = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateValue(date);
};

const getDateRange = (filter, customRange) => {
  const today = todayDateValue();
  if (filter === "Today") return { from: today, to: today };
  if (filter === "Yesterday") {
    const yesterday = shiftDate(today, -1);
    return { from: yesterday, to: yesterday };
  }
  if (filter === "Last Week") return { from: shiftDate(today, -6), to: today };
  if (filter === "Last Month") return { from: shiftDate(today, -29), to: today };
  if (filter === "Custom") return customRange;
  return { from: "", to: "" };
};

const recordDate = (record) => {
  const raw = dateFields.map((field) => record?.[field]).find(Boolean);
  if (!raw) return "";
  return String(raw).slice(0, 10);
};

const inDateRange = (record, range) => {
  if (!range.from && !range.to) return true;
  const date = recordDate(record);
  if (!date) return false;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
};

function Dashboard() {
  const navigate = useNavigate();
  const [assets] = useJsonCollection("assets");
  const [customers] = useJsonCollection("customers");
  const [towers] = useJsonCollection("towerAssets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [dateFilter, setDateFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [language, setLanguage] = useState(
    () => localStorage.getItem(LANGUAGE_STATE_KEY) || "en"
  );
  const t = dashboardText[language] || dashboardText.en;

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(LANGUAGE_STATE_KEY) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    return () => window.removeEventListener("app-language-updated", syncLanguage);
  }, []);
  const activeDateRange = useMemo(
    () => getDateRange(dateFilter, customRange),
    [dateFilter, customRange]
  );
  const dateQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (activeDateRange.from) params.set("from", activeDateRange.from);
    if (activeDateRange.to) params.set("to", activeDateRange.to);
    return params.toString();
  }, [activeDateRange]);
  const openInsight = (insightType, extra = {}) => {
    const params = new URLSearchParams(dateQuery);
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    navigate(`/dashboard/insights/${insightType}${query ? `?${query}` : ""}`);
  };

  const filteredAssets = useMemo(
    () => assets.filter((asset) => inDateRange(asset, activeDateRange)),
    [assets, activeDateRange]
  );
  const filteredCustomers = useMemo(
    () => customers.filter((customer) => inDateRange(customer, activeDateRange)),
    [customers, activeDateRange]
  );
  const filteredTowers = useMemo(
    () => towers.filter((tower) => inDateRange(tower, activeDateRange)),
    [towers, activeDateRange]
  );
  const filteredTransfers = useMemo(
    () => deviceTransfers.filter((transfer) => inDateRange(transfer, activeDateRange)),
    [deviceTransfers, activeDateRange]
  );

  const towerRows = useMemo(
    () => getCurrentLocationRows(filteredTransfers, assets, "Tower"),
    [filteredTransfers, assets]
  );
  const customerRows = useMemo(
    () => getCurrentLocationRows(filteredTransfers, assets, "Customer"),
    [filteredTransfers, assets]
  );
  const repairRows = useMemo(
    () => getCurrentLocationRows(filteredTransfers, assets, "Repair"),
    [filteredTransfers, assets]
  );
  const wasteRows = useMemo(
    () => getCurrentLocationRows(filteredTransfers, assets, "Waste"),
    [filteredTransfers, assets]
  );

  const mainStockRows = useMemo(
    () =>
      filteredAssets.filter((asset) => Number(asset.quantity || 0) > 0 && !isWasted(asset)),
    [filteredAssets]
  );

  const activeCustomers = filteredCustomers.filter((customer) => !isInactive(customer));
  const inactiveCustomers = filteredCustomers.filter(isInactive);
  const dashboardTowerCount = useMemo(() => {
    const names = new Set([
      ...filteredTowers.map((tower) => tower.id || tower.towerName || tower.towerLocation).filter(Boolean),
      ...towerRows.map((row) => row.locationKey || row.locationName).filter(Boolean),
    ]);
    return names.size;
  }, [filteredTowers, towerRows]);
  const inactiveCustomersWithAssets = inactiveCustomers.filter((customer) =>
    customerRows.some(
      (row) =>
        normalize(row.locationKey) === normalize(customer.id || customer.customerId) ||
        normalize(row.locationName) === normalize(customer.customerName || customer.name)
    )
  );
  const inactiveCustomerAssetTotal = customerRows.reduce((sum, row) => {
    const hasInactiveOwner = inactiveCustomers.some(
      (customer) =>
        normalize(row.locationKey) === normalize(customer.id || customer.customerId) ||
        normalize(row.locationName) === normalize(customer.customerName || customer.name)
    );
    return hasInactiveOwner ? sum + Number(row.quantity || 0) : sum;
  }, 0);

  const wastedAssets = [
    ...filteredAssets.filter(isWasted),
    ...wasteRows,
  ];

  const allCurrentRows = useMemo(
    () => [
      ...mainStockRows.map((asset) => ({
        category: asset.category || "Uncategorized",
        quantity: Number(asset.quantity || 0),
      })),
      ...towerRows,
      ...customerRows,
      ...repairRows,
    ],
    [mainStockRows, towerRows, customerRows, repairRows]
  );

  const categoryGroups = useMemo(() => {
    const grouped = new Map();
    allCurrentRows.forEach((row) => {
      const category = row.category || row.asset?.category || "Uncategorized";
      const current = grouped.get(category) || 0;
      grouped.set(category, current + Number(row.quantity || 0));
    });

    return Array.from(grouped.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [allCurrentRows]);

  const totalCurrentAssets = categoryGroups.reduce((sum, group) => sum + group.total, 0);
  const wastedAssetTotal = wastedAssets.reduce(
    (sum, row) => sum + Number(row.quantity || 1),
    0
  );

  const customerStatusData = [
    { name: "Active", value: activeCustomers.length, fill: "#22c55e", target: "active-customers" },
    { name: "Terminate", value: inactiveCustomers.length, fill: "#ef4444", target: "inactive-customers" },
  ];

  const assetStatusData = [
    { name: "All", value: totalCurrentAssets, fill: "#4f46e5", target: "total-assets" },
    {
      name: "Customers",
      value: customerRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      fill: "#f59e0b",
      target: "assets-with-customers",
    },
    {
      name: "Towers",
      value: towerRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      fill: "#06b6d4",
      target: "assets-at-towers",
    },
    { name: "Wasted", value: wastedAssetTotal, fill: "#ef4444", target: "wasted-assets" },
    {
      name: "Repair",
      value: repairRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      fill: "#8b5cf6",
      target: "under-repair-assets",
    },
  ];

  const transferChartData = useMemo(() => {
    const grouped = new Map();

    filteredTransfers.filter(isApprovedTransfer).forEach((transfer) => {
      const rawDate = transfer.transferDate || transfer.date || transfer.createdAt;
      if (!rawDate) return;
      const date = String(rawDate).slice(0, 10);
      const current = grouped.get(date) || { date, transfers: 0, quantity: 0 };
      current.transfers += 1;
      current.quantity += Number(transfer.quantity || 0);
      grouped.set(date, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
  }, [filteredTransfers]);

  const dashboardCards = [
    { label: t.cards[0], value: "AFN 0", icon: DollarSign },
    { label: t.cards[1], value: "AFN 0", icon: Package },
    { label: t.cards[2], value: "AFN 0", icon: TrendingUp },
    { label: t.cards[3], value: "AFN 0", icon: TrendingDown },
    { label: t.cards[4], value: "AFN 0", icon: WalletCards },
    { label: t.cards[5], value: "AFN 0", icon: WalletCards },
    { label: t.cards[6], value: 0, icon: ShoppingCart },
    { label: t.cards[7], value: money(totalCurrentAssets), icon: Package },
    { label: t.cards[8], value: 0, icon: RefreshCcw },
    { label: t.cards[9], value: "AFN 0", icon: DollarSign },
    { label: t.cards[10], value: "AFN 0", icon: Smartphone },
    { label: t.cards[11], value: "AFN 0", icon: RefreshCcw },
    { label: t.cards[12], value: "AFN 0", icon: WalletCards },
    { label: t.cards[13], value: customers.length, icon: BookOpen },
    { label: t.cards[14], value: "AFN 0", icon: TrendingUp },
    { label: t.cards[15], value: "AFN 0", icon: TrendingDown },
    { label: t.cards[16], value: "AFN 0", icon: DollarSign },
  ];

  return (
    <div className="dashboard-page dashboard-modern-page">
      <section className="dashboard-modern-header">
        <div>
          <h1>{t.title}</h1>
          <p>Saturday, August 22, 2026</p>
        </div>
        <button type="button">{t.monthly}</button>
      </section>

      <section className="dashboard-quick-actions">
        <span>{t.quick}</span>
        {[
          [t.addProduct, Plus],
          [t.newSale, ShoppingCart],
          [t.addExpense, DollarSign],
          [t.addCustomer, UserPlus],
          [t.addCash, WalletCards],
          [t.addLedger, BookOpen],
        ].map(([label, Icon]) => (
          <button type="button" key={label}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </section>

      <section className="dashboard-modern-stats">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="dashboard-modern-card" key={card.label}>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <em>
                <Icon size={22} />
              </em>
            </article>
          );
        })}
      </section>

      <section className="dashboard-modern-charts">
        <ChartCard title={t.salesVsExpenses} subtitle="">
          <LineGraph data={transferChartData} onDateClick={(item) => openInsight("transfers-by-date", { from: item.date, to: item.date })} />
        </ChartCard>

        <ChartCard title={t.inventoryByBrand} subtitle="">
          <BarGraph data={assetStatusData} dataKey="value" onItemClick={(item) => openInsight(item.target)} />
        </ChartCard>
      </section>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card dashboard-chart-card">
      <div className="card-title">
        <div>
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function BarGraph({ data, dataKey, onItemClick }) {
  const hasData = data.some((item) => Number(item[dataKey] || 0) > 0);

  if (!hasData) {
    return <p className="dashboard-chart-empty">No data to show yet.</p>;
  }

  return (
    <div className="dashboard-chart-box">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} />
          <Bar
            dataKey={dataKey}
            radius={[8, 8, 0, 0]}
            cursor={onItemClick ? "pointer" : "default"}
            onClick={(entry) => onItemClick?.(entry?.payload || entry)}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill || "#4f46e5"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineGraph({ data, onDateClick }) {
  if (!data.length) {
    return <p className="dashboard-chart-empty">No transfer has been recorded yet.</p>;
  }

  return (
    <div className="dashboard-chart-box">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: -18, bottom: 0 }}
          onClick={(state) => {
            const payload = state?.activePayload?.[0]?.payload;
            if (payload) onDateClick?.(payload);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="transfers"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="quantity"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Dashboard;
