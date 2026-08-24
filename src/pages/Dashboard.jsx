import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { getProductBatchBalances, getProductStock } from "../utils/stock";
import "./Dashboard.css";

const languageKey = "afghan-power-language";
const rtl = new Set(["fa", "ps"]);

const text = {
  en: {
    title: "Dashboard",
    subtitle: "A clear snapshot of your pharmacy operations.",
    products: "Products",
    suppliers: "Suppliers",
    customers: "Customers",
    stock: "Units in stock",
    sales: "Today sales",
    purchases: "Today purchases",
    payable: "Supplier payable",
    paid: "Paid amount",
    trends: "Trends",
    recentActivity: "Recent activity",
    stockUpdated: "Stock updated",
    stockUpdatedHint: "Stock movement recorded",
    saleCreated: "New sale created",
    purchaseCreated: "New purchase created",
    totalRevenue: "Total Revenue",
    totalExpenses: "Total Expenses",
    refunds: "Refunds",
    pendingPayments: "Pending Payments",
    expiring: "Expiring soon",
    out: "Out of stock",
    quick: "Quick actions",
    quickHint: "Common tasks, one click away.",
    newPurchase: "New purchase",
    newSale: "New sale",
    addProduct: "Add product",
    addCustomer: "Add customer",
    recentSales: "Recent sales",
    recentPurchases: "Recent purchases",
    noData: "No records yet.",
    customer: "Customer",
    supplier: "Supplier",
    vsYesterday: "vs yesterday",
    addedToday: "added today",
    netToday: "net today",
    days60: "within 60 days",
    needsAttention: "needs attention",
    healthy: "healthy",
    noChange: "no change",
    overview: "Dashboard Overview",
    productOverview: "Products overview",
    supplierOverview: "Suppliers overview",
    customerOverview: "Customers overview",
    totalProducts: "Total products",
    totalMedicineQty: "Total medicine quantity",
    totalProductValue: "Total product value",
    expiringProducts: "Products near expiry",
    totalSuppliers: "Total suppliers",
    suppliersWeOwe: "Suppliers we owe",
    totalCustomers: "Total customers",
    customersOweUs: "Customers who owe us",
  },
  fa: {
    title: "داشبورد",
    subtitle: "نمای خلاصه و واضح از وضعیت دواخانه.",
    products: "محصولات",
    suppliers: "تأمین‌کننده‌گان",
    customers: "مشتریان",
    stock: "مجموع موجودی",
    sales: "فروش امروز",
    purchases: "خرید امروز",
    payable: "قابل پرداخت",
    paid: "مبلغ پرداخت‌شده",
    trends: "روندها",
    recentActivity: "فعالیت‌های اخیر",
    stockUpdated: "موجودی تازه شد",
    stockUpdatedHint: "حرکت موجودی ثبت شد",
    saleCreated: "فروش جدید ثبت شد",
    purchaseCreated: "خرید جدید ثبت شد",
    totalRevenue: "مجموع عواید",
    totalExpenses: "مجموع مصارف",
    refunds: "برگشتی‌ها",
    pendingPayments: "پرداخت‌های باقی‌مانده",
    expiring: "نزدیک انقضا",
    out: "خلاص‌شده",
    quick: "عملیات سریع",
    quickHint: "کارهای مهم را سریع انجام بدهید.",
    newPurchase: "خرید جدید",
    newSale: "فروش جدید",
    addProduct: "محصول جدید",
    addCustomer: "مشتری جدید",
    recentSales: "فروشات اخیر",
    recentPurchases: "خریدهای اخیر",
    noData: "هنوز ریکاردی وجود ندارد.",
    customer: "مشتری",
    supplier: "تأمین‌کننده",
    vsYesterday: "نسبت به دیروز",
    addedToday: "امروز اضافه شد",
    netToday: "تغییر امروز",
    days60: "در ۶۰ روز آینده",
    needsAttention: "نیاز به توجه",
    healthy: "وضعیت خوب",
    noChange: "بدون تغییر",
    overview: "نمای کلی داشبورد",
    productOverview: "خلاصه محصولات",
    supplierOverview: "خلاصه تأمین‌کننده‌گان",
    customerOverview: "خلاصه مشتریان",
    totalProducts: "تعداد تمام محصولات",
    totalMedicineQty: "تمام مقدار دواها",
    totalProductValue: "ارزش تمام محصولات",
    expiringProducts: "محصولات نزدیک به انقضا",
    totalSuppliers: "تعداد تمام تأمین‌کننده‌گان",
    suppliersWeOwe: "تأمین‌کننده‌گانی که ما قرضدار آنها هستیم",
    totalCustomers: "تعداد تمام مشتریان",
    customersOweUs: "مشتریانی که قرضدار ما هستند",
  },
  ps: {
    title: "ډشبورد",
    subtitle: "د درملتون د فعالیتونو ساده او روښانه لنډیز.",
    products: "محصولات",
    suppliers: "عرضه کوونکي",
    customers: "پېرودونکي",
    stock: "ټوله موجودي",
    sales: "د نن خرڅلاو",
    purchases: "د نن پېرود",
    payable: "د ورکړې وړ",
    paid: "ورکړل شوې پیسې",
    trends: "روندونه",
    recentActivity: "وروستي فعالیتونه",
    stockUpdated: "موجودي تازه شوه",
    stockUpdatedHint: "د موجودي حرکت ثبت شو",
    saleCreated: "نوی خرڅلاو ثبت شو",
    purchaseCreated: "نوی پېرود ثبت شو",
    totalRevenue: "ټول عاید",
    totalExpenses: "ټول مصارف",
    refunds: "واپسۍ",
    pendingPayments: "پاتې پیسې",
    expiring: "ژر ختمېدونکي",
    out: "خلاص شوي",
    quick: "چټک کارونه",
    quickHint: "مهم کارونه په یوه کلیک ترسره کړئ.",
    newPurchase: "نوی پېرود",
    newSale: "نوی خرڅلاو",
    addProduct: "نوی محصول",
    addCustomer: "نوی پېرودونکی",
    recentSales: "وروستي خرڅلاو",
    recentPurchases: "وروستي پېرودونه",
    noData: "تر اوسه ریکارډ نشته.",
    customer: "پېرودونکی",
    supplier: "عرضه کوونکی",
    vsYesterday: "د پرون په پرتله",
    addedToday: "نن اضافه شوي",
    netToday: "د نن بدلون",
    days60: "په ۶۰ ورځو کې",
    needsAttention: "پاملرنې ته اړتیا",
    healthy: "ښه حالت",
    noChange: "بدلون نشته",
    overview: "د ډشبورد عمومي کتنه",
    productOverview: "د محصولاتو لنډیز",
    supplierOverview: "د عرضه کوونکو لنډیز",
    customerOverview: "د پېرودونکو لنډیز",
    totalProducts: "د ټولو محصولاتو شمېر",
    totalMedicineQty: "د دوا ټول مقدار",
    totalProductValue: "د ټولو محصولاتو ارزښت",
    expiringProducts: "ژر ختمېدونکي محصولات",
    totalSuppliers: "د ټولو عرضه کوونکو شمېر",
    suppliersWeOwe: "هغه عرضه کوونکي چې موږ پوروړي یو",
    totalCustomers: "د ټولو پېرودونکو شمېر",
    customersOweUs: "هغه پېرودونکي چې موږ ته پوروړي دي",
  },
};

const money = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const dateOnly = (value) => String(value || "").slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const currentMonthDays = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month, day).toISOString().slice(0, 10);
    return { date, label: now.toLocaleString("en-US", { month: "short" }).replace(".", "") + ` ${day}` };
  });
};
const shiftDay = (dateValue, amount) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
};
const daysUntil = (date) => {
  if (!date) return Infinity;
  const a = new Date(`${today()}T00:00:00`);
  const b = new Date(`${dateOnly(date)}T00:00:00`);
  return Math.ceil((b - a) / 86400000);
};
const recordDate = (record) => dateOnly(
  record?.createdAt || record?.registrationDate || record?.date || record?.updatedAt
);
const relativeAge = (value) => {
  const date = new Date(value || Date.now());
  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} days ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours} hours ago`;
  return "just now";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [stockMovements] = useJsonCollection("stockMovements");
  const [suppliers] = useJsonCollection("suppliers");
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const t = text[language] || text.en;

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const stats = useMemo(() => {
    const todayValue = today();
    const yesterdayValue = shiftDay(todayValue, -1);
    const stocks = products.map((product) => getProductStock(stockMovements, product.id, 0));
    const expiring = products.reduce((count, product) => {
      const hasSoon = getProductBatchBalances(stockMovements, product.id)
        .some((batch) => Number(batch.available || 0) > 0 && daysUntil(batch.expiryDate) >= 0 && daysUntil(batch.expiryDate) <= 60);
      return count + (hasSoon ? 1 : 0);
    }, 0);

    const totalForDate = (rows, date, fields) => rows
      .filter((row) => dateOnly(row.saleDate || row.purchaseDate || row.createdAt) === date)
      .reduce((sum, row) => sum + Number(fields.map((field) => row?.[field]).find((value) => value !== undefined) || 0), 0);

    const todaySales = totalForDate(sales, todayValue, ["totalAmount", "grandTotal", "total"]);
    const yesterdaySales = totalForDate(sales, yesterdayValue, ["totalAmount", "grandTotal", "total"]);
    const todayPurchases = totalForDate(purchases, todayValue, ["totalAmount", "grandTotal", "total"]);
    const yesterdayPurchases = totalForDate(purchases, yesterdayValue, ["totalAmount", "grandTotal", "total"]);

    const countCreated = (rows, date) => rows.filter((row) => recordDate(row) === date).length;
    const netMovement = (date) => stockMovements
      .filter((move) => dateOnly(move.date || move.createdAt) === date)
      .reduce((sum, move) => sum + Number(move.quantityIn || 0) - Number(move.quantityOut || 0), 0);

    return {
      productCount: products.length,
      supplierCount: suppliers.length,
      customerCount: customers.length,
      stockUnits: stocks.reduce((sum, value) => sum + Number(value || 0), 0),
      productValue: products.reduce((sum, product, index) => {
        const stock = Number(stocks[index] || 0);
        const price = Number(product.purchasePrice || product.salePrice || 0);
        return sum + stock * price;
      }, 0),
      outOfStock: stocks.filter((value) => Number(value || 0) <= 0).length,
      expiring,
      todaySales,
      yesterdaySales,
      todayPurchases,
      yesterdayPurchases,
      totalPayable: purchases.reduce((sum, item) => sum + Number(item.remainingBalance || item.dueAmount || item.remaining || 0), 0),
      suppliersWithDebt: new Set(purchases
        .filter((item) => Number(item.remainingBalance || item.dueAmount || item.remaining || 0) > 0)
        .map((item) => item.supplierId || item.supplierName || item.id)
        .filter(Boolean)).size,
      customersWithDebt: new Set(sales
        .filter((item) => Number(item.remainingBalance || item.dueAmount || item.remaining || 0) > 0)
        .map((item) => item.customerId || item.customerName || item.id)
        .filter(Boolean)).size,
      totalPaid: [...sales, ...purchases].reduce((sum, item) => sum + Number(item.paidAmount || item.cashAmount || 0), 0),
      productsToday: countCreated(products, todayValue),
      suppliersToday: countCreated(suppliers, todayValue),
      customersToday: countCreated(customers, todayValue),
      stockNetToday: netMovement(todayValue),
    };
  }, [products, stockMovements, suppliers, customers, sales, purchases]);

  const overviewSections = [
    {
      title: t.productOverview,
      cards: [
        { icon: PackageCheck, label: t.totalProducts, value: stats.productCount, path: "/products", accent: "navy" },
        { icon: Boxes, label: t.totalMedicineQty, value: money(stats.stockUnits), path: "/inventory", accent: "sky" },
        { icon: BadgeDollarSign, label: t.totalProductValue, value: `${money(stats.productValue)} ؋`, path: "/inventory", accent: "green" },
        { icon: CalendarClock, label: t.expiringProducts, value: stats.expiring, path: "/inventory", accent: "amber" },
      ],
    },
    {
      title: t.supplierOverview,
      cards: [
        { icon: Truck, label: t.totalSuppliers, value: stats.supplierCount, path: "/suppliers", accent: "violet" },
        { icon: ShoppingCart, label: t.suppliersWeOwe, value: stats.suppliersWithDebt, path: "/purchasing", accent: "red" },
      ],
    },
    {
      title: t.customerOverview,
      cards: [
        { icon: UserPlus, label: t.totalCustomers, value: stats.customerCount, path: "/customer-registry", accent: "sky" },
        { icon: Wallet, label: t.customersOweUs, value: stats.customersWithDebt, path: "/sales-register", accent: "green" },
      ],
    },
  ];

  const chartData = useMemo(() => currentMonthDays().map((day) => {
    const salesTotal = sales
      .filter((row) => dateOnly(row.saleDate || row.createdAt) === day.date)
      .reduce((sum, row) => sum + Number(row.totalAmount || row.grandTotal || row.total || 0), 0);
    const purchaseTotal = purchases
      .filter((row) => dateOnly(row.purchaseDate || row.createdAt) === day.date)
      .reduce((sum, row) => sum + Number(row.totalAmount || row.grandTotal || row.total || 0), 0);
    const paidTotal = [...sales, ...purchases]
      .filter((row) => dateOnly(row.saleDate || row.purchaseDate || row.createdAt) === day.date)
      .reduce((sum, row) => sum + Number(row.paidAmount || row.cashAmount || 0), 0);
    return {
      name: day.label,
      revenue: salesTotal,
      expenses: purchaseTotal,
      refunds: 0,
      pending: Math.max(0, purchaseTotal - paidTotal),
      sales: salesTotal,
    };
  }), [sales, purchases]);

  const recentActivity = useMemo(() => [
    ...stockMovements.map((record) => ({
      id: `stock-${record.id}`,
      icon: Boxes,
      title: t.stockUpdated,
      description: `${t.stockUpdatedHint}${record.productName ? `: ${record.productName}` : ""}`,
      date: record.createdAt || record.date,
      tone: "muted",
    })),
    ...sales.map((record) => ({
      id: `sale-${record.id}`,
      icon: ShoppingBag,
      title: t.saleCreated,
      description: `${record.invoiceNumber || record.billNumber || "—"} - ؋ ${money(record.totalAmount || record.grandTotal || record.total)}`,
      date: record.createdAt || record.saleDate,
      tone: "sky",
      path: record.id ? `/sale-detail/${record.id}` : "",
    })),
    ...purchases.map((record) => ({
      id: `purchase-${record.id}`,
      icon: Truck,
      title: t.purchaseCreated,
      description: `${record.billNumber || record.invoiceNumber || "—"} - ؋ ${money(record.totalAmount || record.grandTotal || record.total)}`,
      date: record.createdAt || record.purchaseDate,
      tone: "amber",
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6), [stockMovements, sales, purchases, t]);

  return (
    <div className="ph-dashboard" dir={rtl.has(language) ? "rtl" : "ltr"}>
      <section className="ph-overview-card">
        <div className="ph-overview-head">
          <h2>{t.overview}</h2>
        </div>
        {overviewSections.map((section, sectionIndex) => (
          <div className="ph-overview-section" key={section.title}>
            {sectionIndex > 0 && <div className="ph-overview-divider" />}
            <h3>{section.title}</h3>
            <div className="ph-dashboard-cards">
              {section.cards.map(({ icon: Icon, label, value, path, accent }) => (
                <button type="button" className={`ph-stat-card is-${accent}`} key={label} onClick={() => navigate(path)}>
                  <span className="ph-stat-icon"><Icon size={20} /></span>
                  <div className="ph-stat-copy">
                    <div className="ph-stat-label">{label}</div>
                    <div className="ph-stat-value">{value}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ph-trends-card">
        <h2>{t.trends}</h2>
        <div className="ph-chart-wrap">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 22, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#506480" }} interval={1} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#506480" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 10, border: "1px solid #dfe5ec" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="revenue" name={t.totalRevenue} stroke="#18284f" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="expenses" name={t.totalExpenses} stroke="#ff3b3b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="refunds" name={t.refunds} stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pending" name={t.pendingPayments} stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sales" name={t.sales} stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ph-dashboard-bottom">
      <div className="ph-dashboard-quick">
        <div className="ph-section-title">
          <h2>{t.quick}</h2>
        </div>
        <div className="ph-quick-grid">
          <button className="is-primary" onClick={() => navigate("/sales-register")}>
            <ShoppingBag size={22} />
            <span>{t.newSale}</span>
          </button>
          <button onClick={() => navigate("/products")}>
            <Plus size={23} />
            <span>{t.addProduct}</span>
          </button>
          <button onClick={() => navigate("/customer-registry")}>
            <UserPlus size={22} />
            <span>{t.addCustomer}</span>
          </button>
          <button onClick={() => navigate("/purchasing")}>
            <ShoppingCart size={22} />
            <span>{t.newPurchase}</span>
          </button>
        </div>
      </div>

      <div className="ph-recent-card">
        <div className="ph-section-title"><h2>{t.recentActivity}</h2></div>
          {recentActivity.length ? recentActivity.map(({ id, icon: Icon, title, description, date, tone, path }) => (
            <button type="button" className="ph-activity-row" key={id} onClick={() => path && navigate(path)}>
              <span className={`ph-activity-icon is-${tone}`}><Icon size={18} /></span>
              <span className="ph-activity-copy"><strong>{title}</strong><small>{description}</small></span>
              <small className="ph-activity-time">{relativeAge(date)}</small>
            </button>
          )) : <p className="ph-empty">{t.noData}</p>}
      </div>
      </section>
    </div>
  );
}
