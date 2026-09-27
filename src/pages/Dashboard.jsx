import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Boxes,
  CalendarDays,
  CalendarClock,
  PackageCheck,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
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
    currency: "Currency",
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
    welcomeUser: (name) => `Welcome back, ${name}`,
    periodFilter: "Chart period",
    today: "Today",
    yesterday: "Yesterday",
    lastWeek: "Last week",
    lastMonth: "Last month",
    custom: "Custom",
    from: "From",
    to: "To",
    productOverview: "Products overview",
    financialOverview: "Financial overview",
    inventoryOverview: "Inventory overview",
    supplierOverview: "Suppliers overview",
    customerOverview: "Customers overview",
    totalProducts: "Total products",
    totalMedicineQty: "Total medicine quantity",
    totalProductValue: "Total product value",
    expiringProducts: "Products near expiry",
    totalSuppliers: "Total suppliers",
    suppliersWeOwe: "Suppliers we owe",
    suppliersOweUs: "Suppliers who owe us",
    totalCustomers: "Total customers",
    customersOweUs: "Customers who owe us",
    customersWeOwe: "Customers we owe",
    receivablesTrend: "Receivables",
    payablesTrend: "Payables",
    returnsTrend: "Returns",
    netRevenue: "Net revenue",
    totalLoss: "Estimated loss",
    totalPurchasesValue: "Total purchases",
    totalSalesValue: "Total sales",
    estimatedProfit: "Estimated profit",
    operatingExpenses: "Operating expenses",
    productsInStock: "Products in stock",
    lowStockProducts: "Low-stock products",
    expiredProducts: "Expired products",
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
    currency: "واحد",
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
    welcomeUser: (name) => `خوش آمدید ${name}`,
    periodFilter: "بازه نمودار",
    today: "امروز",
    yesterday: "دیروز",
    lastWeek: "هفته قبل",
    lastMonth: "ماه قبل",
    custom: "سفارشی",
    from: "از تاریخ",
    to: "تا تاریخ",
    productOverview: "خلاصه محصولات",
    financialOverview: "مرور مالی",
    inventoryOverview: "مرور موجودی",
    supplierOverview: "خلاصه تأمین‌کننده‌گان",
    customerOverview: "خلاصه مشتریان",
    totalProducts: "تعداد تمام محصولات",
    totalMedicineQty: "تمام مقدار دواها",
    totalProductValue: "ارزش تمام محصولات",
    expiringProducts: "محصولات نزدیک به انقضا",
    totalSuppliers: "تعداد تمام تأمین‌کننده‌گان",
    suppliersWeOwe: "تأمین‌کننده‌گانی که ما قرضدار آنها هستیم",
    suppliersOweUs: "تأمین‌کننده‌گانی که آنها قرضدار ما هستند",
    totalCustomers: "تعداد تمام مشتریان",
    customersOweUs: "مشتریانی که قرضدار ما هستند",
    customersWeOwe: "مشتریانی که ما قرضدار آنها هستیم",
    receivablesTrend: "طلبات",
    payablesTrend: "تادیات",
    returnsTrend: "برگشتی‌ها",
    netRevenue: "مجموع عاید خالص",
    totalLoss: "تاوان تخمینی",
    totalPurchasesValue: "مجموع خریداری‌ها",
    totalSalesValue: "مجموع فروشات",
    estimatedProfit: "سود تخمینی",
    operatingExpenses: "مجموع مصارف",
    productsInStock: "محصولات موجود در گدام",
    lowStockProducts: "محصولات با موجودی کم",
    expiredProducts: "محصولات تاریخ‌گذشته",
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
    currency: "اسعار",
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
    welcomeUser: (name) => `${name}، ښه راغلاست`,
    periodFilter: "د چارت موده",
    today: "نن",
    yesterday: "پرون",
    lastWeek: "تېره اوونۍ",
    lastMonth: "تېره میاشت",
    custom: "دودیز",
    from: "له نېټې",
    to: "تر نېټې",
    productOverview: "د محصولاتو لنډیز",
    financialOverview: "مالي کتنه",
    inventoryOverview: "د موجودۍ کتنه",
    supplierOverview: "د عرضه کوونکو لنډیز",
    customerOverview: "د پېرودونکو لنډیز",
    totalProducts: "د ټولو محصولاتو شمېر",
    totalMedicineQty: "د دوا ټول مقدار",
    totalProductValue: "د ټولو محصولاتو ارزښت",
    expiringProducts: "ژر ختمېدونکي محصولات",
    totalSuppliers: "د ټولو عرضه کوونکو شمېر",
    suppliersWeOwe: "هغه عرضه کوونکي چې موږ پوروړي یو",
    suppliersOweUs: "هغه عرضه کوونکي چې موږ ته پوروړي دي",
    totalCustomers: "د ټولو پېرودونکو شمېر",
    customersOweUs: "هغه پېرودونکي چې موږ ته پوروړي دي",
    customersWeOwe: "هغه پېرودونکي چې موږ یې پوروړي یو",
    receivablesTrend: "طلبات",
    payablesTrend: "تادیات",
    returnsTrend: "واپسۍ",
    netRevenue: "ټول خالص عاید",
    totalLoss: "اټکلی تاوان",
    totalPurchasesValue: "ټول پېرودونه",
    totalSalesValue: "ټول خرڅلاو",
    estimatedProfit: "اټکلی ګټه",
    operatingExpenses: "ټول مصارف",
    productsInStock: "په ګدام کې موجود محصولات",
    lowStockProducts: "کم موجود محصولات",
    expiredProducts: "تاریخ تېر محصولات",
  },
};

const money = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const currencyOrder = ["AFN", "USD", "INR", "EUR"];
const normalizeCurrency = (value) => {
  const code = String(value || "AFN").trim().toUpperCase();
  if (code === "AFGHANI" || code === "AFS") return "AFN";
  if (code === "DOLLAR" || code === "US DOLLAR") return "USD";
  if (code === "PKR" || code === "KALDAR" || code === "KALDAAR") return "INR";
  return currencyOrder.includes(code) ? code : "AFN";
};
const addCurrencyAmount = (target, currency, amount) => {
  const code = normalizeCurrency(currency);
  target[code] = Number(target[code] || 0) + Number(amount || 0);
  return target;
};
const currencyRows = (values = {}) => {
  const rows = currencyOrder
    .map((code) => ({ code, value: Number(values?.[code] || 0) }))
    .filter((row) => Math.abs(row.value) > 0.000001);
  return rows.length ? rows : [{ code: "AFN", value: 0 }];
};
const recordCurrency = (record, fallback = "AFN") => normalizeCurrency(record?.currency || record?.unit || fallback);

function CurrencyStack({ values }) {
  return (
    <span className="ph-currency-stack" dir="ltr">
      {currencyRows(values).map(({ code, value }) => (
        <span key={code}><b>{money(value)}</b><small>{code}</small></span>
      ))}
    </span>
  );
}
const dateOnly = (value) => String(value || "").slice(0, 10);
const localIsoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => localIsoDate(new Date());
const chartDateLabel = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const datesBetween = (startValue, endValue) => {
  const start = new Date(`${dateOnly(startValue)}T00:00:00`);
  const end = new Date(`${dateOnly(endValue)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const dates = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(localIsoDate(cursor));
  }
  return dates;
};
const shiftDay = (dateValue, amount) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return localIsoDate(date);
};
const daysUntil = (date) => {
  if (!date) return Infinity;
  const a = new Date(`${today()}T00:00:00`);
  const b = new Date(`${dateOnly(date)}T00:00:00`);
  return Math.ceil((b - a) / 86400000);
};
const transactionDate = (record) => dateOnly(
  record?.saleDate || record?.purchaseDate || record?.returnDate || record?.movementDate || record?.paymentDate || record?.expenseDate || record?.date || record?.createdAt
);
const recordDate = (record) => {
  const sourceDate = record?.registrationDate || record?.date;
  if (sourceDate) return dateOnly(sourceDate);
  if (record?.importSource === "access") return "";
  return dateOnly(record?.createdAt || record?.updatedAt);
};
const relativeAge = (value) => {
  const date = new Date(value || Date.now());
  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} days ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours} hours ago`;
  return "just now";
};

const statTrend = (value, label, positive = true) => ({
  value: Number(value || 0),
  label,
  tone: Number(value || 0) === 0 ? "neutral" : positive ? "up" : "down",
});

export default function Dashboard({ currentUser }) {
  const navigate = useNavigate();
  const [products] = useJsonCollection("products");
  const [stockMovements] = useJsonCollection("stockMovements");
  const [suppliers] = useJsonCollection("suppliers");
  const [customers] = useJsonCollection("customerRegistry");
  const [sales] = useJsonCollection("salesRegister");
  const [purchases] = useJsonCollection("purchases");
  const [saleReturns] = useJsonCollection("saleReturns");
  const [saleReturnItems] = useJsonCollection("saleReturnItems");
  const [purchaseReturns] = useJsonCollection("purchaseReturns");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [supplierPayments] = useJsonCollection("supplierPayments");
  const [partyCashTransactions] = useJsonCollection("partyCashTransactions");
  const [expenses] = useJsonCollection("expenses");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [chartPeriod, setChartPeriod] = useState("today");
  const [chartCurrency, setChartCurrency] = useState("AFN");
  const [customFrom, setCustomFrom] = useState(() => shiftDay(today(), -29));
  const [customTo, setCustomTo] = useState(() => today());
  const t = text[language] || text.en;
  const userName = currentUser?.fullName || currentUser?.username || currentUser?.email || "User";

  const selectedDates = useMemo(() => {
    const endDate = today();
    if (chartPeriod === "today") return [endDate];
    if (chartPeriod === "yesterday") return [shiftDay(endDate, -1)];
    if (chartPeriod === "lastWeek") return datesBetween(shiftDay(endDate, -7), shiftDay(endDate, -1));
    if (chartPeriod === "lastMonth") return datesBetween(shiftDay(endDate, -30), shiftDay(endDate, -1));
    return datesBetween(customFrom, customTo);
  }, [chartPeriod, customFrom, customTo]);

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
    const selectedDateSet = new Set(selectedDates);
    const inSelectedPeriod = (record) => selectedDateSet.has(transactionDate(record));
    const periodSales = sales.filter(inSelectedPeriod);
    const periodPurchases = purchases.filter(inSelectedPeriod);
    const periodExpenses = expenses.filter(inSelectedPeriod);
    const periodSaleReturns = saleReturns.filter(inSelectedPeriod);
    const expiring = products.reduce((count, product) => {
      const hasSoon = getProductBatchBalances(stockMovements, product.id)
        .some((batch) => Number(batch.available || 0) > 0 && daysUntil(batch.expiryDate) >= 0 && daysUntil(batch.expiryDate) <= 60);
      return count + (hasSoon ? 1 : 0);
    }, 0);
    const expired = products.reduce((count, product) => {
      const hasExpired = getProductBatchBalances(stockMovements, product.id)
        .some((batch) => Number(batch.available || 0) > 0 && daysUntil(batch.expiryDate) < 0);
      return count + (hasExpired ? 1 : 0);
    }, 0);

    const salesByCurrency = periodSales.reduce((totals, item) => {
      addCurrencyAmount(totals, recordCurrency(item), item.totalAmount || item.grandTotal || item.total || 0);
      return totals;
    }, {});
    const purchasesByCurrency = periodPurchases.reduce((totals, item) => {
      addCurrencyAmount(totals, recordCurrency(item), item.totalAmount || item.grandTotal || item.total || 0);
      return totals;
    }, {});
    const expensesByCurrency = periodExpenses.reduce((totals, item) => {
      addCurrencyAmount(totals, recordCurrency(item), item.amount || item.totalAmount || 0);
      return totals;
    }, {});
    const saleReturnsByCurrency = periodSaleReturns.reduce((totals, item) => {
      const linkedSale = sales.find((sale) => String(sale.id) === String(item.saleId));
      addCurrencyAmount(totals, item.currency || linkedSale?.currency || "AFN", item.totalAmount || 0);
      return totals;
    }, {});
    const costOfGoodsByCurrency = periodSales.reduce((totals, sale) => {
      const cost = (sale.items || []).reduce((sum, item) => {
        const unitsPerUnit = Math.max(Number(item.unitsPerUnit || 1), 1);
        const packageQuantity = item.packageQuantity ?? item.purchaseQuantity ?? (Number(item.quantity || 0) / unitsPerUnit);
        return sum + Number(item.purchasePrice || item.costPrice || 0) * Number(packageQuantity || 0);
      }, 0);
      addCurrencyAmount(totals, recordCurrency(sale), cost);
      return totals;
    }, {});
    const returnedCostByCurrency = saleReturnItems.reduce((totals, returnedItem) => {
      const linkedSale = sales.find((sale) => String(sale.id) === String(returnedItem.saleId));
      const soldItem = linkedSale?.items?.find((item) => String(item.productId) === String(returnedItem.productId));
      const unitsPerUnit = Math.max(Number(soldItem?.unitsPerUnit || 1), 1);
      const costPerPiece = Number(soldItem?.purchasePrice || soldItem?.costPrice || 0) / unitsPerUnit;
      addCurrencyAmount(totals, recordCurrency(linkedSale), costPerPiece * Number(returnedItem.quantity || 0));
      return totals;
    }, {});
    const financialCodes = new Set([
      ...Object.keys(salesByCurrency),
      ...Object.keys(purchasesByCurrency),
      ...Object.keys(expensesByCurrency),
      ...Object.keys(saleReturnsByCurrency),
      ...Object.keys(costOfGoodsByCurrency),
      ...Object.keys(returnedCostByCurrency),
    ]);
    const netRevenueByCurrency = {};
    const estimatedProfitByCurrency = {};
    const estimatedLossByCurrency = {};
    financialCodes.forEach((code) => {
      const netRevenue = Number(salesByCurrency[code] || 0) - Number(saleReturnsByCurrency[code] || 0);
      const netCost = Number(costOfGoodsByCurrency[code] || 0) - Number(returnedCostByCurrency[code] || 0);
      const result = netRevenue - netCost - Number(expensesByCurrency[code] || 0);
      netRevenueByCurrency[code] = netRevenue;
      estimatedProfitByCurrency[code] = Math.max(result, 0);
      estimatedLossByCurrency[code] = Math.max(-result, 0);
    });

    const supplierBalances = new Map();
    const adjustSupplierBalance = (supplierId, currency, amount) => {
      if (!supplierId) return;
      const code = normalizeCurrency(currency);
      const key = `${supplierId}::${code}`;
      supplierBalances.set(key, Number(supplierBalances.get(key) || 0) + Number(amount || 0));
    };
    suppliers.forEach((supplier) => adjustSupplierBalance(supplier.id, supplier.currency || "AFN", supplier.openingBalance));
    purchases.forEach((purchase) => adjustSupplierBalance(
      purchase.supplierId,
      purchase.currency || "AFN",
      Number(purchase.totalAmount || 0) - Number(purchase.paidAmount || purchase.paid || 0)
    ));
    supplierPayments.forEach((payment) => adjustSupplierBalance(payment.supplierId, payment.currency || "AFN", -Number(payment.amount || 0)));
    purchaseReturns.forEach((item) => {
      const linkedPurchase = purchases.find((purchase) => String(purchase.id) === String(item.purchaseId));
      adjustSupplierBalance(item.supplierId || linkedPurchase?.supplierId, item.currency || linkedPurchase?.currency || "AFN", -Number(item.totalAmount || 0));
    });
    const totalPayableByCurrency = {};
    const supplierReceivableByCurrency = {};
    const suppliersWithDebt = new Set();
    const suppliersOwingUs = new Set();
    supplierBalances.forEach((balance, key) => {
      const [supplierId, code] = key.split("::");
      if (balance > 0.000001) {
        addCurrencyAmount(totalPayableByCurrency, code, balance);
        suppliersWithDebt.add(supplierId);
      } else if (balance < -0.000001) {
        addCurrencyAmount(supplierReceivableByCurrency, code, Math.abs(balance));
        suppliersOwingUs.add(supplierId);
      }
    });

    const customerBalances = new Map();
    const adjustCustomerBalance = (customerId, currency, amount) => {
      if (!customerId) return;
      const code = normalizeCurrency(currency);
      const key = `${customerId}::${code}`;
      customerBalances.set(key, Number(customerBalances.get(key) || 0) + Number(amount || 0));
    };
    customers.forEach((customer) => adjustCustomerBalance(customer.id, customer.currency || "AFN", customer.openingBalance));
    sales.forEach((sale) => adjustCustomerBalance(
      sale.customerId,
      sale.currency || "AFN",
      Number(sale.totalAmount || 0) - Number(sale.paidAmount || 0)
    ));
    customerPayments.forEach((payment) => adjustCustomerBalance(payment.customerId, payment.currency || "AFN", -Number(payment.amount || 0)));
    saleReturns.forEach((item) => {
      const linkedSale = sales.find((sale) => String(sale.id) === String(item.saleId));
      adjustCustomerBalance(item.customerId || linkedSale?.customerId, item.currency || linkedSale?.currency || "AFN", -Number(item.totalAmount || 0));
    });
    partyCashTransactions.filter((item) => item.partyType === "customer").forEach((item) => {
      adjustCustomerBalance(item.partyId, item.currency || "AFN", item.direction === "out" ? Number(item.amount || 0) : -Number(item.amount || 0));
    });
    const totalReceivableByCurrency = {};
    const customerPayableByCurrency = {};
    const customersWithDebt = new Set();
    const customersWeOwe = new Set();
    customerBalances.forEach((balance, key) => {
      const [customerId, code] = key.split("::");
      if (balance > 0.000001) {
        addCurrencyAmount(totalReceivableByCurrency, code, balance);
        customersWithDebt.add(customerId);
      } else if (balance < -0.000001) {
        addCurrencyAmount(customerPayableByCurrency, code, Math.abs(balance));
        customersWeOwe.add(customerId);
      }
    });

    const totalForDate = (rows, date, fields) => rows
      .filter((row) => dateOnly(row.saleDate || row.purchaseDate || row.createdAt) === date)
      .reduce((sum, row) => sum + Number(fields.map((field) => row?.[field]).find((value) => value !== undefined) || 0), 0);

    const todaySales = totalForDate(sales, todayValue, ["totalAmount", "grandTotal", "total"]);
    const yesterdaySales = totalForDate(sales, yesterdayValue, ["totalAmount", "grandTotal", "total"]);
    const todayPurchases = totalForDate(purchases, todayValue, ["totalAmount", "grandTotal", "total"]);
    const yesterdayPurchases = totalForDate(purchases, yesterdayValue, ["totalAmount", "grandTotal", "total"]);

    const countCreated = (rows, date) => rows.filter((row) => recordDate(row) === date).length;
    const netMovement = (date) => stockMovements
      .filter((move) => transactionDate(move) === date)
      .reduce((sum, move) => sum + Number(move.quantityIn || 0) - Number(move.quantityOut || 0), 0);

    return {
      productCount: products.length,
      productsInStock: stocks.filter((value) => Number(value || 0) > 0).length,
      lowStock: products.filter((product, index) => {
        const stock = Number(stocks[index] || 0);
        const threshold = Number(product.lowStockThreshold || 0);
        return threshold > 0 && stock > 0 && stock <= threshold;
      }).length,
      supplierCount: suppliers.length,
      customerCount: customers.length,
      stockUnits: stocks.reduce((sum, value) => sum + Number(value || 0), 0),
      productValueByCurrency: products.reduce((totals, product, index) => {
        const stock = Number(stocks[index] || 0);
        const price = Number(product.purchasePrice || product.salePrice || 0);
        addCurrencyAmount(totals, product.currency || product.unit || "AFN", stock * price);
        return totals;
      }, {}),
      outOfStock: stocks.filter((value) => Number(value || 0) <= 0).length,
      expiring,
      expired,
      salesByCurrency,
      purchasesByCurrency,
      expensesByCurrency,
      netRevenueByCurrency,
      estimatedProfitByCurrency,
      estimatedLossByCurrency,
      todaySales,
      yesterdaySales,
      todayPurchases,
      yesterdayPurchases,
      totalPayableByCurrency,
      supplierReceivableByCurrency,
      suppliersWithDebt: suppliersWithDebt.size,
      suppliersOwingUs: suppliersOwingUs.size,
      totalReceivableByCurrency,
      customerPayableByCurrency,
      customersWithDebt: customersWithDebt.size,
      customersWeOwe: customersWeOwe.size,
      totalPaidByCurrency: [...sales, ...purchases].reduce((totals, item) => {
        addCurrencyAmount(totals, recordCurrency(item), item.paidAmount || item.cashAmount || 0);
        return totals;
      }, {}),
      productsToday: countCreated(products, todayValue),
      suppliersToday: countCreated(suppliers, todayValue),
      customersToday: countCreated(customers, todayValue),
      stockNetToday: netMovement(todayValue),
    };
  }, [products, stockMovements, suppliers, customers, sales, purchases, saleReturns, saleReturnItems, purchaseReturns, customerPayments, supplierPayments, partyCashTransactions, expenses, selectedDates]);

  const overviewSections = [
    {
      title: t.financialOverview,
      cards: [
        { icon: ShoppingCart, label: t.totalPurchasesValue, value: <CurrencyStack values={stats.purchasesByCurrency} />, path: "/purchasing", accent: "amber", trend: statTrend(stats.todayPurchases, t.vsYesterday, stats.todayPurchases <= stats.yesterdayPurchases) },
        { icon: ShoppingBag, label: t.totalSalesValue, value: <CurrencyStack values={stats.salesByCurrency} />, path: "/sales-register", accent: "sky", trend: statTrend(stats.todaySales, t.vsYesterday, stats.todaySales >= stats.yesterdaySales) },
        { icon: TrendingUp, label: t.estimatedProfit, value: <CurrencyStack values={stats.estimatedProfitByCurrency} />, path: "/reports", accent: "violet", trend: statTrend(Object.values(stats.estimatedProfitByCurrency).filter((value) => value > 0).length, t.healthy) },
      ],
    },
    {
      title: t.inventoryOverview,
      cards: [
        { icon: PackageCheck, label: t.totalProducts, value: stats.productCount, path: "/products", accent: "navy", trend: statTrend(stats.productsToday, t.addedToday) },
        { icon: Boxes, label: t.productsInStock, value: stats.productsInStock, path: "/inventory", accent: "green", trend: statTrend(stats.productsInStock, t.healthy) },
        { icon: Boxes, label: t.totalMedicineQty, value: money(stats.stockUnits), path: "/inventory", accent: "sky", trend: statTrend(stats.stockNetToday, t.netToday, stats.stockNetToday >= 0) },
        { icon: BadgeDollarSign, label: t.totalProductValue, value: <CurrencyStack values={stats.productValueByCurrency} />, path: "/inventory", accent: "green", trend: statTrend(stats.stockUnits, t.healthy) },
        { icon: CalendarClock, label: t.lowStockProducts, value: stats.lowStock, path: "/inventory", accent: "amber", trend: statTrend(stats.lowStock, t.needsAttention, false) },
        { icon: Boxes, label: t.out, value: stats.outOfStock, path: "/inventory", accent: "red", trend: statTrend(stats.outOfStock, t.needsAttention, false) },
        { icon: CalendarClock, label: t.expiringProducts, value: stats.expiring, path: "/inventory", accent: "amber", trend: statTrend(stats.expiring, t.days60, false) },
        { icon: CalendarClock, label: t.expiredProducts, value: stats.expired, path: "/inventory", accent: "red", trend: statTrend(stats.expired, t.needsAttention, false) },
      ],
    },
    {
      title: t.supplierOverview,
      cards: [
        { icon: Truck, label: t.totalSuppliers, value: stats.supplierCount, path: "/suppliers", accent: "violet", trend: statTrend(stats.suppliersToday, t.addedToday) },
        { icon: ShoppingCart, label: t.suppliersWeOwe, value: <CurrencyStack values={stats.totalPayableByCurrency} />, path: "/purchasing", accent: "red", trend: statTrend(stats.suppliersWithDebt, t.needsAttention, false) },
        { icon: Wallet, label: t.suppliersOweUs, value: <CurrencyStack values={stats.supplierReceivableByCurrency} />, path: "/suppliers", accent: "green", trend: statTrend(stats.suppliersOwingUs, t.needsAttention) },
      ],
    },
    {
      title: t.customerOverview,
      cards: [
        { icon: UserPlus, label: t.totalCustomers, value: stats.customerCount, path: "/customer-registry", accent: "sky", trend: statTrend(stats.customersToday, t.addedToday) },
        { icon: Wallet, label: t.customersOweUs, value: <CurrencyStack values={stats.totalReceivableByCurrency} />, path: "/sales-register", accent: "green", trend: statTrend(stats.customersWithDebt, t.needsAttention, false) },
        { icon: Wallet, label: t.customersWeOwe, value: <CurrencyStack values={stats.customerPayableByCurrency} />, path: "/customer-registry", accent: "red", trend: statTrend(stats.customersWeOwe, t.needsAttention, false) },
      ],
    },
  ];

  const chartData = useMemo(() => {
    const endDate = today();
    let buckets;

    buckets = selectedDates.map((date) => ({ name: chartDateLabel(new Date(`${date}T00:00:00`)), dates: [date] }));

    if (!buckets.length) buckets = [{ name: chartDateLabel(new Date(`${endDate}T00:00:00`)), dates: [endDate] }];

    return buckets.map((bucket) => {
      const salesTotal = sales
        .filter((row) => recordCurrency(row) === chartCurrency && bucket.dates.includes(dateOnly(row.saleDate || row.createdAt)))
        .reduce((sum, row) => sum + Number(row.totalAmount || row.grandTotal || row.total || 0), 0);
      const purchaseTotal = purchases
        .filter((row) => recordCurrency(row) === chartCurrency && bucket.dates.includes(dateOnly(row.purchaseDate || row.createdAt)))
        .reduce((sum, row) => sum + Number(row.totalAmount || row.grandTotal || row.total || 0), 0);
      const receivablesTotal = sales
        .filter((row) => recordCurrency(row) === chartCurrency && bucket.dates.includes(transactionDate(row)))
        .reduce((sum, row) => sum + Number(row.remainingAmount ?? Math.max(0, Number(row.totalAmount || 0) - Number(row.paidAmount || 0))), 0);
      const payablesTotal = purchases
        .filter((row) => recordCurrency(row) === chartCurrency && bucket.dates.includes(transactionDate(row)))
        .reduce((sum, row) => sum + Number(row.remainingAmount ?? Math.max(0, Number(row.totalAmount || 0) - Number(row.paidAmount || 0))), 0);
      const returnsTotal = [...saleReturns, ...purchaseReturns]
        .filter((row) => {
          const linkedSale = sales.find((sale) => String(sale.id) === String(row.saleId));
          const linkedPurchase = purchases.find((purchase) => String(purchase.id) === String(row.purchaseId));
          return recordCurrency({ currency: row.currency || linkedSale?.currency || linkedPurchase?.currency }) === chartCurrency && bucket.dates.includes(transactionDate(row));
        })
        .reduce((sum, row) => sum + Number(row.totalAmount || row.amount || 0), 0);
      return {
        name: bucket.name,
        purchases: purchaseTotal,
        sales: salesTotal,
        receivables: receivablesTotal,
        payables: payablesTotal,
        returns: returnsTotal,
      };
    });
  }, [sales, purchases, saleReturns, purchaseReturns, selectedDates, chartCurrency]);

  const recentActivity = useMemo(() => [
    ...stockMovements.map((record) => ({
      id: `stock-${record.id}`,
      icon: Boxes,
      title: t.stockUpdated,
      description: `${t.stockUpdatedHint}${record.productName ? `: ${record.productName}` : ""}`,
      date: record.movementDate || record.date || (record.importSource === "access" ? "" : record.createdAt),
      tone: "muted",
    })),
    ...sales.map((record) => ({
      id: `sale-${record.id}`,
      icon: ShoppingBag,
      title: t.saleCreated,
      description: `${record.invoiceNumber || record.billNumber || "—"} - ${money(record.totalAmount || record.grandTotal || record.total)} ${recordCurrency(record)}`,
      date: record.saleDate || record.createdAt,
      tone: "sky",
      path: record.id ? `/sale-detail/${record.id}` : "",
    })),
    ...purchases.map((record) => ({
      id: `purchase-${record.id}`,
      icon: Truck,
      title: t.purchaseCreated,
      description: `${record.billNumber || record.invoiceNumber || "—"} - ${money(record.totalAmount || record.grandTotal || record.total)} ${recordCurrency(record)}`,
      date: record.purchaseDate || record.createdAt,
      tone: "amber",
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6), [stockMovements, sales, purchases, t]);

  return (
    <div className="ph-dashboard" dir={rtl.has(language) ? "rtl" : "ltr"}>
      <section className="ph-overview-card">
        <div className="ph-overview-head">
          <div className="ph-overview-title">
            <h2>{t.overview}</h2>
            <p>{t.welcomeUser(userName)}</p>
          </div>
          <div className={`ph-dashboard-period-filter ${chartPeriod === "custom" ? "is-custom" : ""}`}>
            <div className="ph-period-filter-label"><CalendarDays size={15} aria-hidden="true" /><span>{t.periodFilter}</span></div>
            <select className="ph-period-filter-select" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value)} aria-label={t.periodFilter}>
              {["today", "yesterday", "lastWeek", "lastMonth", "custom"].map((period) => <option value={period} key={period}>{t[period]}</option>)}
            </select>
            {chartPeriod === "custom" && (
              <div className="ph-custom-period-fields">
                <label><span>{t.from}</span><input type="date" value={customFrom} max={customTo} onChange={(event) => setCustomFrom(event.target.value)} /></label>
                <label><span>{t.to}</span><input type="date" value={customTo} min={customFrom} onChange={(event) => setCustomTo(event.target.value)} /></label>
              </div>
            )}
          </div>
        </div>
        {overviewSections.map((section, sectionIndex) => (
          <div className="ph-overview-section" key={section.title}>
            {sectionIndex > 0 && <div className="ph-overview-divider" />}
            <h3>{section.title}</h3>
            <div className={`ph-dashboard-cards count-${section.cards.length}`}>
              {section.cards.map(({ icon: Icon, label, value, path, accent, trend }) => (
                <button type="button" className={`ph-stat-card is-${accent}`} key={label} onClick={() => navigate(path)}>
                  <span className="ph-stat-icon" aria-hidden="true"><Icon size={18} /></span>
                  <div className="ph-stat-copy">
                    <div className="ph-stat-label">{label}</div>
                    <div className="ph-stat-value">{value}</div>
                    <div className={`ph-stat-trend is-${trend.tone}`}>
                      {trend.tone === "down" ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      <span>{trend.value > 0 ? `${trend.tone === "down" ? "" : "+"}${money(trend.value)}` : "0"} {trend.label}</span>
                    </div>
                  </div>
                  <span className="ph-stat-spark" aria-hidden="true">
                    <svg viewBox="0 0 96 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`spark-${accent}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="ph-stat-spark-fill" d="M0 33 C12 18 22 19 34 28 S57 36 68 20 S85 16 96 4 L96 50 L0 50 Z" />
                      <path className="ph-stat-spark-line" d="M0 33 C12 18 22 19 34 28 S57 36 68 20 S85 16 96 4" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ph-trends-card">
        <div className="ph-trends-head">
          <h2>{t.trends}</h2>
          <div className="ph-currency-filter" role="group" aria-label={t.currency}>
            <span>{t.currency}</span>
            <div>
              {currencyOrder.map((code) => (
                <button
                  type="button"
                  key={code}
                  className={chartCurrency === code ? "is-active" : ""}
                  aria-pressed={chartCurrency === code}
                  onClick={() => setChartCurrency(code)}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ph-chart-wrap">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 22, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7edf5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#506480" }} interval={1} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#506480" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip formatter={(value, name) => [`${money(value)} ${chartCurrency}`, name]} contentStyle={{ borderRadius: 10, border: "1px solid #dfe5ec" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="purchases" name={t.totalPurchasesValue} stroke="#f59e0b" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="sales" name={t.totalSalesValue} stroke="#10b981" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="receivables" name={t.receivablesTrend} stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="payables" name={t.payablesTrend} stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="returns" name={t.returnsTrend} stroke="#8b5cf6" strokeWidth={2} dot={false} />
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
