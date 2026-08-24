import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Building2,
  FileBarChart,
  FileMinus2,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Settings as SettingsIcon,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Undo2,
  RotateCcw,
  Users,
  Wallet,
  BadgeDollarSign,
  BookOpenCheck,
  Landmark,
  Banknote,
} from "lucide-react";
import appLogo from "./assets/logo.png";
import Header from "./components/Header";
import GlobalTableEnhancer from "./components/GlobalTableEnhancer";
import ConfirmDialogHost from "./components/ConfirmDialogHost";
import StartupSplash from "./components/StartupSplash";
import StockBootstrap from "./components/StockBootstrap";
import ToastHost from "./components/ToastHost";
import { useJsonCollection } from "./hooks/useJsonCollection";
import { downloadBackup } from "./utils/backup";
import { notify } from "./utils/notify";
import { canViewModule } from "./utils/permissions";
import { IS_DEMO, APP_MODE, environmentStorageKey } from "./config/appConfig";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetail = lazy(() => import("./pages/SupplierDetail"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Purchasing = lazy(() => import("./pages/Purchasing"));
const CustomersRegistry = lazy(() => import("./pages/CustomersRegistry"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const SalesRegister = lazy(() => import("./pages/SalesRegister"));
const PurchaseReturns = lazy(() => import("./pages/PurchaseReturns"));
const SaleReturns = lazy(() => import("./pages/SaleReturns"));
const CashFlow = lazy(() => import("./pages/CashFlow"));
const Expenses = lazy(() => import("./pages/Expenses"));
const ReceivablesPayables = lazy(() => import("./pages/ReceivablesPayables"));
const GeneralJournal = lazy(() => import("./pages/GeneralJournal"));
const Banks = lazy(() => import("./pages/Banks"));
const CashCount = lazy(() => import("./pages/CashCount"));
const SaleDetail = lazy(() => import("./pages/SaleDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Accounts = lazy(() => import("./pages/Accounts"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Login = lazy(() => import("./pages/Login"));
const License = lazy(() => import("./pages/License"));


const defaultAdminAccount = {
  id: "default-admin",
  fullName: "System Admin",
  email: "admin@gmail.com",
  password: "mynameisadmin",
  secondaryPassword: "",
  role: "Admin",
  status: "Active",
  permissions: {},
  isDefaultAdmin: true,
  createdAt: "2026-07-18",
};

const autoBackupStorageKey = environmentStorageKey("isp-auto-backup-last-run");
const sessionStorageKey = environmentStorageKey("isp-system-session");
const appThemeStorageKey = "afghan-power-theme";
const appLanguageStorageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const shellLabels = {
  en: {
    dashboard: "Dashboard",
    companies: "Manufacturers",
    suppliers: "Suppliers",
    products: "Products",
    purchasing: "Purchasing",
    purchaseReturns: "Purchase Returns",
    customerRegistry: "Customers",
    salesRegister: "Sales",
    saleReturns: "Sale Returns",
    cashFlow: "Cash Flow",
    banks: "Banks",
    cashCount: "Cash Count",
    expenses: "Expenses",
    receivablesPayables: "Receivables & Payables",
    generalJournal: "General Journal",
    reports: "Reports",
    settings: "Settings",
  },
  fa: {
    dashboard: "داشبورد",
    companies: "شرکت‌های سازنده",
    suppliers: "تأمین‌کننده‌گان",
    products: "محصولات",
    purchasing: "خریداری",
    purchaseReturns: "برگشت خرید",
    customerRegistry: "مشتریان",
    salesRegister: "فروشات",
    saleReturns: "برگشت فروش",
    cashFlow: "جریان نقدی",
    banks: "بانک‌ها",
    cashCount: "شمارش نقدی",
    expenses: "مصارف",
    receivablesPayables: "دریافتنی و پرداختنی",
    generalJournal: "ژورنال عمومی",
    reports: "گزارشات",
    settings: "تنظیمات",
  },
  ps: {
    dashboard: "ډشبورد",
    companies: "تولیدوونکي شرکتونه",
    suppliers: "عرضه کوونکي",
    products: "محصولات",
    purchasing: "پېرود",
    purchaseReturns: "د پېرود بېرته ستنول",
    customerRegistry: "پېرودونکي",
    salesRegister: "خرڅلاو",
    saleReturns: "د خرڅلاو بېرته ستنول",
    cashFlow: "نغدي جریان",
    banks: "بانکونه",
    cashCount: "د نغدو شمېرنه",
    expenses: "مصارف",
    receivablesPayables: "ترلاسه کېدونکي او ورکول کېدونکي",
    generalJournal: "عمومي ژورنال",
    reports: "راپورونه",
    settings: "تنظیمات",
  },
};

function applyStoredTheme() {
  const storedTheme = localStorage.getItem(appThemeStorageKey) || "minimalism";
  const theme = ["neon", "glassmorphism"].includes(storedTheme) ? "aurora" : storedTheme;
  if (theme !== storedTheme) localStorage.setItem(appThemeStorageKey, theme);
  document.body.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("dark-mode", ["black-white", "aurora"].includes(theme));
}

function applyCompanyThemeIdentity(companyName = "") {
  const source = String(companyName || "APG").trim() || "APG";
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 360;
  }

  const root = document.documentElement;
  root.style.setProperty("--company-accent-hue", String(hash));
  root.style.setProperty("--company-accent", `hsl(${hash} 86% 58%)`);
  root.style.setProperty("--company-accent-2", `hsl(${(hash + 78) % 360} 88% 56%)`);
  root.style.setProperty("--company-accent-3", `hsl(${(hash + 152) % 360} 92% 60%)`);
  root.style.setProperty("--company-accent-soft", `hsl(${hash} 88% 58% / 0.16)`);
  document.body.dataset.companyName = source;
}

function getStoredDirection() {
  const language = localStorage.getItem(appLanguageStorageKey) || "en";
  return rtlLanguages.has(language) ? "rtl" : "ltr";
}

function applyStoredLanguage() {
  const language = localStorage.getItem(appLanguageStorageKey) || "en";
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body.dir = direction;
  document.body.dataset.language = language;
  document.body.dataset.direction = direction;
}

function getAutoBackupIntervalMs(mode, customDays) {
  if (mode === "daily") return 24 * 60 * 60 * 1000;
  if (mode === "weekly") return 7 * 24 * 60 * 60 * 1000;
  if (mode === "monthly") return 30 * 24 * 60 * 60 * 1000;
  if (mode === "custom") return Math.max(Number(customDays || 1), 1) * 24 * 60 * 60 * 1000;
  return 0;
}

function ModulePlaceholder({ title, description, items = [] }) {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder-card">
        <span className="module-kicker">Module</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {!!items.length && (
          <div className="module-feature-grid">
            {items.map((item) => (
              <div className="module-feature" key={item}>
                <span></span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionDenied() {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder-card">
        <span className="module-kicker">Access Control</span>
        <h1>Permission Denied</h1>
        <p>You do not have permission to access this module.</p>
      </div>
    </div>
  );
}

function BusyLoader({ label = "System is preparing..." }) {
  return (
    <div className="page-loading app-busy-loader" role="status" aria-live="polite">
      <div className="app-busy-loader-card">
        <div className="app-busy-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <strong>{label}</strong>
        <p>Please wait a moment.</p>
      </div>
    </div>
  );
}

function ProtectedModule({ currentUser, moduleKey, children }) {
  if (!canViewModule(currentUser, moduleKey)) {
    return <PermissionDenied />;
  }

  return children;
}

function App() {
  const [settings, , loadSettings] = useJsonCollection("settings");
  const [accounts, setAccounts, , accountsLoaded] = useJsonCollection("accounts");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseLoaded, setLicenseLoaded] = useState(!window.ispDesktop?.getLicenseStatus);
  const [appDirection, setAppDirection] = useState(getStoredDirection);
  const [appLanguage, setAppLanguage] = useState(
    () => localStorage.getItem(appLanguageStorageKey) || "en"
  );
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem(sessionStorageKey)
  );
  const routeClassName = location.pathname === "/"
    ? "route-dashboard"
    : `route-${location.pathname.replace(/^\/+/, "").replace(/[^a-zA-Z0-9]+/g, "-") || "dashboard"}`;

  useEffect(() => {
    applyStoredTheme();
    window.addEventListener("app-theme-updated", applyStoredTheme);
    return () => window.removeEventListener("app-theme-updated", applyStoredTheme);
  }, []);

  useEffect(() => {
    const syncLanguage = () => {
      applyStoredLanguage();
      setAppDirection(getStoredDirection());
      setAppLanguage(localStorage.getItem(appLanguageStorageKey) || "en");
    };

    syncLanguage();
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  useEffect(() => {
    const hasOpenModal = () =>
      Boolean(
        document.querySelector(
          [
            '[class$="-modal-backdrop"]',
            '[class*="-modal-backdrop "]',
            '[class$="-modal-layer"]',
            '[class*="-modal-layer "]',
            '[role="dialog"][aria-modal="true"]',
          ].join(",")
        )
      );

    const syncModalState = () => {
      document.body.classList.toggle("app-modal-open", hasOpenModal());
    };

    syncModalState();
    const observer = new MutationObserver(syncModalState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "role", "aria-modal"],
    });

    return () => {
      observer.disconnect();
      document.body.classList.remove("app-modal-open");
    };
  }, []);


  const company = settings[0] || {};
  const labels = shellLabels[appLanguage] || shellLabels.en;
  const systemName = company.companyName || "APG";
  const systemSubtitle = company.systemSubtitle || "Pharmacy & Medicine Management System";
  const systemLogo = company.logo || appLogo;
  const effectiveAccounts = accounts.some((account) => String(account.id) === "default-admin")
    ? accounts
    : [defaultAdminAccount, ...accounts];
  const currentUser = effectiveAccounts.find(
    (account) => String(account.id) === String(sessionId)
  );

  useEffect(() => {
    window.addEventListener("company-settings-updated", loadSettings);
    return () => window.removeEventListener("company-settings-updated", loadSettings);
  }, [loadSettings]);

  useEffect(() => {
    applyCompanyThemeIdentity(systemName);
  }, [systemName]);

  useEffect(() => {
    let cancelled = false;

    const checkLicense = async () => {
      if (!window.ispDesktop?.getLicenseStatus) {
        setLicenseLoaded(true);
        return;
      }

      try {
        const nextStatus = await window.ispDesktop.getLicenseStatus();
        if (cancelled) return;
        setLicenseStatus(nextStatus);
        setLicenseLoaded(true);

        if (!nextStatus.valid && location.pathname !== "/license") {
          navigate("/license", { replace: true });
        }
      } catch (error) {
        if (cancelled) return;
        setLicenseStatus({
          valid: false,
          status: "storage-error",
          error: error.message,
        });
        setLicenseLoaded(true);
        if (location.pathname !== "/license") {
          navigate("/license", { replace: true });
        }
      }
    };

    checkLicense();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  // Re-check while a user is logged in so the seven-day trial locks
  // the running application without requiring a reload or route change.
  useEffect(() => {
    if (!currentUser || !window.ispDesktop?.getLicenseStatus) return undefined;
    let cancelled = false;
    const checkSession = async (startIfNeeded = false) => {
      try {
        const nextStatus = startIfNeeded && window.ispDesktop?.startLicenseSession
          ? await window.ispDesktop.startLicenseSession(currentUser.id)
          : await window.ispDesktop.getLicenseStatus();
        if (cancelled) return;
        setLicenseStatus(nextStatus);
        if (!nextStatus.valid) navigate("/license", { replace: true });
      } catch (error) {
        if (!cancelled) {
          setLicenseStatus({ valid: false, status: "storage-error", error: error.message });
          navigate("/license", { replace: true });
        }
      }
    };
    // A persisted login bypasses the login() function, so start the trial here
    // as well. startLicenseSession is idempotent and will not reset its expiry.
    checkSession(true);
    const timer = window.setInterval(() => checkSession(false), 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const mode = company.autoBackupMode || "off";
    const intervalMs = getAutoBackupIntervalMs(mode, company.autoBackupCustomDays);
    if (!intervalMs) return undefined;

    let cancelled = false;
    let running = false;

    const checkBackup = async () => {
      if (cancelled || running) return;

      const lastRun = Number(localStorage.getItem(autoBackupStorageKey) || 0);
      const now = Date.now();
      if (lastRun && now - lastRun < intervalMs) return;

      running = true;
      try {
        await downloadBackup(`auto-${mode}`);
        localStorage.setItem(autoBackupStorageKey, String(now));
        notify(`Automatic ${mode} backup created successfully.`);
      } catch (error) {
        console.error("Automatic backup failed:", error);
        notify("Automatic backup failed. Please export a manual backup from Settings.", "error");
      } finally {
        running = false;
      }
    };

    const startupTimer = window.setTimeout(checkBackup, 4000);
    const intervalTimer = window.setInterval(checkBackup, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(startupTimer);
      window.clearInterval(intervalTimer);
    };
  }, [company.autoBackupCustomDays, company.autoBackupMode, currentUser]);

  useEffect(() => {
    if (!accountsLoaded) return;
    if (accounts.some((account) => String(account.id) === "default-admin")) return;
    setAccounts([defaultAdminAccount, ...accounts]);
  }, [accountsLoaded, accounts, setAccounts]);

  const login = async (account) => {
    if (window.ispDesktop?.startLicenseSession) {
      const nextStatus = await window.ispDesktop.startLicenseSession(account.id);
      setLicenseStatus(nextStatus);
      if (!nextStatus.valid) {
        navigate("/license", { replace: true });
        return;
      }
    }

    localStorage.setItem(sessionStorageKey, String(account.id));
    setSessionId(String(account.id));
  };

  const logout = () => {
    localStorage.removeItem(sessionStorageKey);
    setSessionId(null);
  };

  // Keep the sidebar focused on the same high-level areas used by the Access system.
  // Supporting tools (returns, banks, cash count, expenses and journals) stay available
  // through their parent modules instead of occupying permanent sidebar space.
  const menuItems = [
    { to: "/", label: labels.dashboard, moduleKey: "dashboard", icon: LayoutDashboard },
    { to: "/manufacturers", label: labels.companies, moduleKey: "suppliers", icon: Building2 },
    { to: "/suppliers", label: labels.suppliers, moduleKey: "suppliers", icon: Truck },
    { to: "/products", label: labels.products, moduleKey: "customers", icon: ReceiptText },
    { to: "/purchasing", label: labels.purchasing, moduleKey: "suppliers", icon: ShoppingCart },
    { to: "/customer-registry", label: labels.customerRegistry, moduleKey: "customers", icon: Users },
    { to: "/sales-register", label: labels.salesRegister, moduleKey: "customers", icon: ShoppingBag },
    { to: "/cash-flow", label: labels.cashFlow, moduleKey: "reports", icon: Wallet },
    { to: "/reports", label: labels.reports, moduleKey: "reports", icon: FileBarChart },
    { to: "/settings", label: labels.settings, moduleKey: "settings", icon: SettingsIcon },
  ];

  const protect = (moduleKey, element) => (
    <ProtectedModule currentUser={currentUser} moduleKey={moduleKey}>
      {element}
    </ProtectedModule>
  );

  let appContent;

  const licenseGateLocked =
    window.ispDesktop?.getLicenseStatus &&
    licenseLoaded &&
    licenseStatus &&
    !licenseStatus.valid;

  if (!licenseLoaded) {
    appContent = <BusyLoader label="Checking license..." />;
  } else if (licenseGateLocked || location.pathname === "/license") {
    appContent = (
      <Suspense fallback={<BusyLoader label="Opening license..." />}>
        <License onLicenseChanged={setLicenseStatus} />
      </Suspense>
    );
  } else if (!accountsLoaded) {
    appContent = <BusyLoader label="Preparing system..." />;
  } else if (!currentUser) {
    appContent = (
      <Suspense fallback={<BusyLoader label="Opening login..." />}>
        <Login
          accounts={effectiveAccounts}
          setAccounts={setAccounts}
          onLogin={login}
          company={company}
        />
      </Suspense>
    );
  } else {
    appContent = (
      <div
        className={`app app-${appDirection} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
        dir={appDirection}
        data-direction={appDirection}
        data-language={appLanguage}
        data-app-mode={APP_MODE}
      >
        <aside
          className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}
        >
        <div className="brand">
          <button
            type="button"
            className="mobile-sidebar-menu-btn"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            aria-label="Open sections"
            aria-expanded={mobileMenuOpen}
            title="Sections"
          >
            <MoreHorizontal size={20} />
          </button>

          <div className="brand-logo">
            <img src={systemLogo} alt={`${systemName} logo`} />
          </div>

          <div>
            <h2>{systemName}</h2>
            <p>{systemSubtitle}</p>
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <Header.Actions currentUser={currentUser} onLogout={logout} compact />
        </div>

        <nav className="menu">
  {menuItems
    .filter((item) =>
      canViewModule(currentUser, item.moduleKey)
    )
    .map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.to}
          to={item.to}
          className="sidebar-main-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Icon size={16} strokeWidth={1.8} />
          <span>{item.label}</span>
        </NavLink>
      );
    })}
</nav>
        <div className="sidebar-version-area">
          <div className="sidebar-version-row">
            <span className="sidebar-version-label">v0.0.1 • Business Management</span>
            {IS_DEMO && <span className="app-mode-badge">DEMO</span>}
          </div>
        </div>
        </aside>

        <main className="main">
        <Header company={company} currentUser={currentUser} onLogout={logout} />
        <GlobalTableEnhancer />

        <div className="page-content">
          <Suspense fallback={<BusyLoader label="Loading module..." />}>
            <div className={`page-fade-shell ${routeClassName}`} key={location.pathname}>
            <Routes>
              <Route path="/" element={protect("dashboard", <Dashboard />)} />
              <Route path="/search-results" element={protect("dashboard", <SearchResults />)} />

              <Route path="/manufacturers" element={protect("suppliers", <Companies />)} />
              <Route path="/companies" element={protect("suppliers", <Companies />)} />
              <Route path="/suppliers" element={protect("suppliers", <Suppliers />)} />
              <Route path="/supplier-detail/:supplierId" element={protect("suppliers", <SupplierDetail />)} />
              <Route path="/products" element={protect("customers", <Products />)} />
              <Route path="/product-detail/:productId" element={protect("customers", <ProductDetail />)} />
              <Route path="/purchasing" element={protect("suppliers", <Purchasing />)} />
              <Route path="/purchase-returns" element={protect("suppliers", <PurchaseReturns />)} />
              <Route path="/customer-registry" element={protect("customers", <CustomersRegistry />)} />
              <Route path="/customer-detail/:customerId" element={protect("customers", <CustomerDetail />)} />
              <Route path="/sales-register" element={protect("customers", <SalesRegister />)} />
              <Route path="/sales" element={protect("customers", <SalesRegister />)} />
              <Route path="/sale-returns" element={protect("customers", <SaleReturns />)} />
              <Route path="/cash-flow" element={protect("reports", <CashFlow />)} />
              <Route path="/banks" element={protect("reports", <Banks />)} />
              <Route path="/cash-count" element={protect("reports", <CashCount />)} />
              <Route path="/expenses" element={protect("reports", <Expenses />)} />
              <Route path="/receivables-payables" element={protect("reports", <ReceivablesPayables />)} />
              <Route path="/general-journal" element={protect("reports", <GeneralJournal />)} />
              <Route path="/sale-detail/:saleId" element={protect("customers", <SaleDetail />)} />
              <Route path="/reports" element={protect("reports", <Reports />)} />

              <Route
                path="/user-management"
                element={protect(
                  "userManagement",
                  <UserManagement
                    accounts={effectiveAccounts}
                    setAccounts={setAccounts}
                    currentUser={currentUser}
                  />
                )}
              />
              <Route path="/settings" element={protect("settings", <Settings accounts={effectiveAccounts} setAccounts={setAccounts} currentUser={currentUser} />)} />
              <Route
                path="/accounts"
                element={protect(
                  "userManagement",
                  <Accounts
                    accounts={accounts}
                    setAccounts={setAccounts}
                    currentUser={currentUser}
                  />
                )}
              />

              <Route
                path="*"
                element={
                  <ModulePlaceholder
                    title="Page Not Found"
                    description="The requested page does not exist in the current system."
                  />
                }
              />
            </Routes>
            </div>
          </Suspense>
        </div>
        </main>

        <ToastHost />
        <ConfirmDialogHost />
      </div>
    );
  }

  return (
    <>
      <StartupSplash />
      <StockBootstrap />
      {appContent}
      {!currentUser && <ToastHost />}
      {!currentUser && <ConfirmDialogHost />}
    </>
  );
}

export default App;
