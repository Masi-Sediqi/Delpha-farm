import {
  lazy,
  Suspense,
  useEffect,
  useRef,
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
  AlertTriangle,
  BadgeDollarSign,
  BookOpen,
  CircleHelp,
  Code2,
  CreditCard,
  FileBarChart,
  HelpCircle,
  Info,
  LayoutDashboard,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  RadioTower,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingCart,
  Building2,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import appLogo from "./assets/logo.png";
import Header from "./components/Header";
import GlobalTableEnhancer from "./components/GlobalTableEnhancer";
import ConfirmDialogHost from "./components/ConfirmDialogHost";
import StartupSplash from "./components/StartupSplash";
import ToastHost from "./components/ToastHost";
import { useJsonCollection } from "./hooks/useJsonCollection";
import { downloadBackup } from "./utils/backup";
import { notify } from "./utils/notify";
import { canViewModule } from "./utils/permissions";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardInsight = lazy(() => import("./pages/DashboardInsight"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Companies = lazy(() => import("./pages/Companies"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails"));
const AssetInventory = lazy(() => import("./pages/AssetInventory"));
const AssetInventoryInsight = lazy(() => import("./pages/AssetInventoryInsight"));
const MainStock = lazy(() => import("./pages/MainStock"));
const DeviceTransferManagement = lazy(() => import("./pages/DeviceTransferManagement"));
const TowerAssets = lazy(() => import("./pages/TowerAssets"));
const TowerInsight = lazy(() => import("./pages/TowerInsight"));
const Customers = lazy(() => import("./pages/Customers"));
const Products = lazy(() => import("./pages/Products"));
const Purchasing = lazy(() => import("./pages/Purchasing"));
const CustomerInsight = lazy(() => import("./pages/CustomerInsight"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Reports = lazy(() => import("./pages/Reports"));
const Repair = lazy(() => import("./pages/Repair"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Agent = lazy(() => import("./pages/Agent"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Login = lazy(() => import("./pages/Login"));
const License = lazy(() => import("./pages/License"));
const AssetFullInformation = lazy(() => import("./pages/AssetFullInformation"));
const AssetAuditTrail = lazy(() => import("./pages/AssetAuditTrail"));
const AssetInsightDetails = lazy(() => import("./pages/AssetInsightDetails"));
const TowerLinks = lazy(() => import("./pages/TowerLinks"));
const CustomerIssueDevice = lazy(() => import("./pages/CustomerIssueDevice"));
const TowerAssetDetails = lazy(() => import("./pages/TowerAssetDetails"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Developer = lazy(() => import("./pages/Developer"));
const TermsPrivacy = lazy(
  () => import("./pages/TermsPrivacy")
);
const FAQ = lazy(() => import("./pages/FAQ"));
const UserGuide = lazy(() => import("./pages/UserGuide"));



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

const autoBackupStorageKey = "isp-auto-backup-last-run";
const appThemeStorageKey = "afghan-power-theme";
const appLanguageStorageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const shellLabels = {
  en: {
    dashboard: "Dashboard",
    companies: "Companies",
    products: "Products",
    purchasing: "Purchasing",
    approvals: "Approvals",
    loans: "Receivables",
    stock: "Stock",
    expiry: "Expiry Date",
    cash: "Cash",
    repair: "Repair",
    reports: "Reports",
    settings: "Settings",
  },
  fa: {
    dashboard: "داشبورد",
    companies: "شرکت‌ها",
    products: "محصولات",
    purchasing: "خریداری",
    approvals: "تاییدات",
    loans: "طلبات",
    stock: "موجودی",
    expiry: "تاریخ انقضا",
    cash: "نقدی",
    repair: "اصلاح",
    reports: "گزارشات",
    settings: "تنظیمات",
  },
  ps: {
    dashboard: "ډشبورد",
    companies: "شرکتونه",
    products: "محصولات",
    purchasing: "پېرود",
    approvals: "تاییدات",
    loans: "پورونه",
    stock: "موجودي",
    expiry: "د ختمېدو نېټه",
    cash: "نغدي",
    repair: "ترمیم",
    reports: "راپورونه",
    settings: "تنظیمات",
  },
};

function applyStoredTheme() {
  const theme = localStorage.getItem(appThemeStorageKey) || "minimalism";
  document.body.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("dark-mode", ["black-white", "neon"].includes(theme));
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
    const [sidebarInfoOpen, setSidebarInfoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarInfoRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseLoaded, setLicenseLoaded] = useState(!window.ispDesktop?.getLicenseStatus);
  const [appDirection, setAppDirection] = useState(getStoredDirection);
  const [appLanguage, setAppLanguage] = useState(
    () => localStorage.getItem(appLanguageStorageKey) || "en"
  );
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("isp-system-session")
  );

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


  const company = settings[0] || {};
  const labels = shellLabels[appLanguage] || shellLabels.en;
  const systemName = company.companyName || "ISP Assets";
  const systemSubtitle = company.systemSubtitle || "Asset & Inventory Management";
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
    const closeSidebarInfo = (event) => {
      if (
        sidebarInfoRef.current &&
        !sidebarInfoRef.current.contains(event.target)
      ) {
        setSidebarInfoOpen(false);
      }
    };

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSidebarInfo);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeSidebarInfo
      );

      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, []);

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

    localStorage.setItem("isp-system-session", String(account.id));
    setSessionId(String(account.id));
  };

  const logout = () => {
    localStorage.removeItem("isp-system-session");
    setSessionId(null);
  };

  const menuItems = [
  {
    to: "/",
    label: labels.dashboard,
    moduleKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/companies",
    label: labels.companies,
    moduleKey: "suppliers",
    icon: Building2,
  },
  {
    to: "/products",
    label: labels.products,
    moduleKey: "customers",
    icon: ReceiptText,
  },
  {
    to: "/purchasing",
    label: labels.purchasing,
    moduleKey: "suppliers",
    icon: ShoppingCart,
  },
  {
    to: "/approvals",
    label: labels.approvals,
    moduleKey: "deviceTransfer",
    icon: PackageCheck,
  },
  {
    to: "/loans",
    label: labels.loans,
    moduleKey: "customers",
    icon: BadgeDollarSign,
  },
  {
    to: "/main-stock",
    label: labels.stock,
    moduleKey: "mainStock",
    icon: Warehouse,
  },
  {
    to: "/expiry",
    label: labels.expiry,
    moduleKey: "mainStock",
    icon: AlertTriangle,
  },
  {
    to: "/cash",
    label: labels.cash,
    moduleKey: "userManagement",
    icon: CreditCard,
  },
  {
    to: "/repair",
    label: labels.repair,
    moduleKey: "repair",
    icon: Wrench,
  },
  {
    to: "/reports",
    label: labels.reports,
    moduleKey: "reports",
    icon: FileBarChart,
  },
  {
    to: "/settings",
    label: labels.settings,
    moduleKey: "settings",
    icon: SettingsIcon,
  },
];

    const sidebarInfoLinks = [
    {
      key: "help-center",
      label: "Help Center",
      icon: HelpCircle,
      to: "/help-center",
    },
    {
      key: "developer",
      label: "Developer",
      icon: Code2,
      to: "/developer",
    },
    {
      key: "faq",
      label: "FAQ",
      icon: CircleHelp,
      to: "/faq",
    },
    {
      key: "user-guide",
      label: "User Guide",
      icon: BookOpen,
      to: "/user-guide",
    },
    {
      key: "terms-privacy",
      label: "Terms & Privacy",
      icon: ShieldCheck,
      to: "/terms-privacy",
    },
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
          accounts={accounts}
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
            <img src={appLogo} alt="Afghan Power Logo" />
          </div>

          <div>
            <h2>Afghan Power</h2>
            <p>{systemSubtitle}</p>
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
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
        <div
  className="sidebar-version-area"
  ref={sidebarInfoRef}
>
  <div className="sidebar-version-row">
   <span className="sidebar-version-label">
  v0.0.1 • ISP Asset Inventory
</span>

    <button
      type="button"
      className={`sidebar-version-info-btn ${
        sidebarInfoOpen ? "active" : ""
      }`}
      onClick={() =>
        setSidebarInfoOpen((previous) => !previous)
      }
      aria-label="Open information menu"
      aria-expanded={sidebarInfoOpen}
      title="Information"
    >
      <Info size={16} />
    </button>
  </div>

  {sidebarInfoOpen && (
    <div className="sidebar-simple-dropdown">
      {sidebarInfoLinks.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.key}
            to={item.to}
            className="sidebar-simple-dropdown-link"
            onClick={() => setSidebarInfoOpen(false)}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  )}
</div>
        </aside>

        <main className="main">
        <Header company={company} currentUser={currentUser} onLogout={logout} />
        <GlobalTableEnhancer />

        <div className="page-content">
          <Suspense fallback={<BusyLoader label="Loading module..." />}>
            <div className="page-fade-shell" key={location.pathname}>
            <Routes>
              <Route path="/" element={protect("dashboard", <Dashboard />)} />
              <Route path="/search-results" element={protect("dashboard", <SearchResults />)} />
              <Route path="/dashboard/insights/:insightType" element={protect("dashboard", <DashboardInsight />)} />

              <Route path="/companies" element={protect("suppliers", <Companies />)} />
              <Route path="/suppliers" element={protect("suppliers", <Suppliers currentUser={currentUser} />)} />
              <Route path="/suppliers/:id" element={protect("suppliers", <SupplierDetails />)} />

              <Route path="/assets" element={protect("assets", <AssetInventory />)} />
              <Route path="/assets/insights/:insightType" element={protect("assets", <AssetInventoryInsight />)} />
              <Route path="/assets/:assetId/audit-trail" element={protect("assets", <AssetAuditTrail />)} />
              <Route path="/assets/:assetId/audit-trail/*" element={protect("assets", <AssetAuditTrail />)} />
              <Route path="/assets/:assetId/details/audit-trail" element={protect("assets", <AssetAuditTrail />)} />
              <Route path="/main-stock" element={protect("mainStock", <MainStock />)} />
              <Route path="/products" element={protect("customers", <Products />)} />
              <Route path="/purchasing" element={protect("suppliers", <Purchasing />)} />
              <Route path="/sales" element={protect("customers", <Products />)} />
              <Route path="/approvals" element={protect("deviceTransfer", <DeviceTransferManagement />)} />
              <Route
                path="/loans"
                element={protect(
                  "customers",
                  <ModulePlaceholder title="طلبات" description="Customer loan and receivable records." />
                )}
              />
              <Route
                path="/expiry"
                element={protect(
                  "mainStock",
                  <ModulePlaceholder title="تاریخ انقضا" description="Expiry date monitoring page." />
                )}
              />
              <Route
                path="/cash"
                element={protect(
                  "userManagement",
                  <ModulePlaceholder title="نقدی" description="Cash records and daily cash flow." />
                )}
              />
              <Route path="/device-transfer-management" element={protect("deviceTransfer", <DeviceTransferManagement />)} />

              <Route path="/customers" element={protect("customers", <Customers />)} />
              <Route path="/customers/insights/:insightType" element={protect("customers", <CustomerInsight />)} />
              <Route path="/customers/:id" element={protect("customers", <CustomerDetails />)} />

              <Route path="/tower-assets" element={protect("towerAssets", <TowerAssets />)} />
              <Route path="/tower-assets/insights/:insightType" element={protect("towerAssets", <TowerInsight />)} />
              <Route path="/tower-links" element={protect("towerAssets", <TowerLinks />)} />
              <Route path="/reports" element={protect("reports", <Reports />)} />
              <Route path="/repair" element={protect("repair", <Repair />)} />
              <Route path="/agent" element={protect("agent", <Agent />)} />
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
              <Route path="/settings" element={protect("settings", <Settings />)} />
              
              <Route path="/customers/:id/issue-device" element={protect("customers", <CustomerIssueDevice />)} />
              <Route path="/customers/:id/issue-device/:viewMode" element={protect("customers", <CustomerIssueDevice />)} />
              <Route
                  path="/tower-assets/:towerId/details"
                  element={protect("towerAssets", <TowerAssetDetails />)}
                />
                <Route
                  path="/assets/:assetId/details"
                  element={protect("assets", <AssetFullInformation />)}
                />
                <Route
                  path="/assets/:assetId/details/insights/:insightType"
                  element={protect("assets", <AssetInsightDetails />)}
                />
              <Route
                path="/device-history"
                element={
                  <ModulePlaceholder
                    title="Device History & Audit Trail"
                    description="Search any device by MAC address, serial number, or asset ID."
                    items={[
                      "Purchase history",
                      "Stock entry",
                      "Tower assignment",
                      "Customer assignment",
                      "Return to stock",
                      "Current status",
                    ]}
                  />
                }
              />

              <Route
                path="/disconnections"
                element={
                  <ModulePlaceholder
                    title="Customer Disconnection Management"
                    description="Manage inactive customers and device recovery status."
                    items={[
                      "Inactive customers",
                      "Collected devices",
                      "Pending collection",
                      "Recovery status",
                    ]}
                  />
                }
              />

              <Route
                path="/security-deposits"
                element={
                  <ModulePlaceholder
                    title="Security Deposit Management"
                    description="Manage deposits, refunds, held balances, and outstanding amounts."
                    items={[
                      "Deposit amount",
                      "Refund status",
                      "Held balance",
                      "Outstanding balance",
                    ]}
                  />
                }
              />

             <Route
  path="/help-center"
  element={<HelpCenter />}
/>

<Route
  path="/developer"
  element={<Developer />}
/>

<Route
  path="/faq"
  element={<FAQ />}
/>

<Route
  path="/user-guide"
  element={<UserGuide />}
/>

<Route
  path="/terms-privacy"
  element={<TermsPrivacy />}
/>

              <Route
                path="/employees"
                element={
                  <ModulePlaceholder
                    title="Employees"
                    description="Employee management module will be added later."
                    items={["Employee records", "Roles", "Permissions"]}
                  />
                }
              />

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
                    description="The requested page does not exist in the current ISP system."
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
      {appContent}
      {!currentUser && <ToastHost />}
      {!currentUser && <ConfirmDialogHost />}
    </>
  );
}

export default App;
