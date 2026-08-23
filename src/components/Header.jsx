import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Box,
  CheckCheck,
  ChevronDown,
  CreditCard,
  Globe2,
  LogOut,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { buildSystemSearchResults, money } from "../utils/systemSearch";

const NOTIFICATION_STATE_KEY = "isp-notification-state";
const LANGUAGE_STATE_KEY = "afghan-power-language";
const languages = [
  { key: "fa", label: "دری", short: "DRI", direction: "rtl" },
  { key: "ps", label: "پشتو", short: "PS", direction: "rtl" },
  { key: "en", label: "English", short: "ENG", direction: "ltr" },
];
const headerLabels = {
  en: {
    accounts: "Accounts",
    currency: "Currency",
    search: "Search any system data...",
    language: "Language",
    notifications: "Notifications",
    noNotifications: "No notifications right now.",
    systemSearch: "System Search",
    openFullResult: "Open full result page",
  },
  fa: {
    accounts: "حساب‌ها",
    currency: "واحد پول",
    search: "جستجو در تمام معلومات سیستم...",
    language: "زبان",
    notifications: "خبرتیاها",
    noNotifications: "فعلا خبرتیا وجود ندارد.",
    systemSearch: "جستجوی سیستم",
    openFullResult: "باز کردن تمام نتایج",
  },
  ps: {
    accounts: "حسابونه",
    currency: "د پیسو واحد",
    search: "د سیستم په معلوماتو کې لټون...",
    language: "ژبه",
    notifications: "خبرتیاوې",
    noNotifications: "اوس خبرتیا نشته.",
    systemSearch: "د سیستم لټون",
    openFullResult: "ټولې پایلې پرانیزه",
  },
};

const readNotificationState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_STATE_KEY) || "{}");

    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      clearedIds: Array.isArray(parsed.clearedIds) ? parsed.clearedIds : [],
    };
  } catch {
    return {
      readIds: [],
      clearedIds: [],
    };
  }
};

const writeNotificationState = (state) => {
  localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
};

function HeaderActions({ currentUser, onLogout, compact = false }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [language, setLanguage] = useState(
    () => localStorage.getItem(LANGUAGE_STATE_KEY) || "en"
  );
  const [notificationState, setNotificationState] = useState(readNotificationState);
  const [settings, setSettings] = useJsonCollection("settings");
  const currentSettings = settings[0] || {};
  const currency = currentSettings.currency || "AFN";

  const [assets] = useJsonCollection("assets");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");

  const damagedOrLostAssets = assets.filter((asset) =>
    ["Damaged", "Lost"].includes(asset.status)
  );

  const pendingTowerAssets = towerAssets.filter(
    (item) => item.installationStatus === "Pending"
  );

  const outstandingDeposits = securityDeposits.filter((item) =>
    ["Outstanding", "Held"].includes(item.status)
  );

  const lowStockAssets = assets.filter((asset) => {
    const alertQuantity = Number(asset.alertQuantity || 0);
    return alertQuantity > 0 && Number(asset.quantity || 0) <= alertQuantity;
  });

  const notificationGroups = [
    {
      key: "stock",
      title: "Stock Alerts",
      count: lowStockAssets.length,
      icon: Box,
      items: lowStockAssets.map((asset) => ({
        id: `stock:${asset.id || asset.assetId || asset.deviceName}:${asset.quantity}:${asset.alertQuantity}`,
        title: "Low Stock Alert",
        description: `${asset.assetId || asset.deviceName || "Asset"} has only ${money(asset.quantity)} ${asset.purchaseUsageUnit || asset.purchaseUnit || "unit(s)"} left`,
      })),
    },
    {
      key: "asset-status",
      title: "Asset Status Alerts",
      count: damagedOrLostAssets.length,
      icon: AlertTriangle,
      items: damagedOrLostAssets.map((asset) => ({
        id: `asset-status:${asset.id || asset.assetId || asset.deviceName}:${asset.status}`,
        title: `${asset.status || "Asset"} Asset`,
        description: `${asset.assetId || asset.deviceName || "Asset"} needs attention`,
      })),
    },
    {
      key: "tower",
      title: "Tower Alerts",
      count: pendingTowerAssets.length,
      icon: Wrench,
      items: pendingTowerAssets.map((tower) => ({
        id: `tower:${tower.id || tower.towerName}:${tower.installationStatus}`,
        title: "Pending Tower Installation",
        description: `${tower.towerName || "Tower"} is still pending`,
      })),
    },
    {
      key: "deposit",
      title: "Deposit Alerts",
      count: outstandingDeposits.length,
      icon: CreditCard,
      items: outstandingDeposits.map((deposit) => ({
        id: `deposit:${deposit.id || deposit.customerId || deposit.customerName}:${deposit.status}:${deposit.remainingAmount || deposit.amount || deposit.depositAmount}`,
        title: "Outstanding Deposit",
        description: `${deposit.customerName || deposit.customerId || "Customer"} has a deposit balance`,
      })),
    },
  ].filter((group) => group.count > 0);

  const notificationItems = notificationGroups.flatMap((group) =>
    group.items.map((item) => ({ ...item, groupTitle: group.title, icon: group.icon }))
  );

  const clearedNotificationIds = new Set(notificationState.clearedIds);
  const readNotificationIds = new Set(notificationState.readIds);

  const visibleNotificationItems = notificationItems.filter(
    (item) => !clearedNotificationIds.has(item.id)
  );

  const visibleNotificationGroups = notificationGroups
    .map((group) => {
      const items = group.items.filter((item) => !clearedNotificationIds.has(item.id));
      return {
        ...group,
        count: items.length,
        unreadCount: items.filter((item) => !readNotificationIds.has(item.id)).length,
        items,
      };
    })
    .filter((group) => group.count > 0);

  const alertCount = visibleNotificationItems.filter(
    (item) => !readNotificationIds.has(item.id)
  ).length;

  const persistNotificationState = (nextState) => {
    setNotificationState(nextState);
    writeNotificationState(nextState);
  };

  const markAllNotificationsRead = () => {
    persistNotificationState({
      ...notificationState,
      readIds: Array.from(
        new Set([
          ...notificationState.readIds,
          ...visibleNotificationItems.map((item) => item.id),
        ])
      ),
    });
  };

  const clearAllNotifications = () => {
    persistNotificationState({
      ...notificationState,
      clearedIds: Array.from(
        new Set([
          ...notificationState.clearedIds,
          ...visibleNotificationItems.map((item) => item.id),
        ])
      ),
    });
  };

  const removeNotification = (notificationId) => {
    persistNotificationState({
      ...notificationState,
      clearedIds: Array.from(new Set([...notificationState.clearedIds, notificationId])),
    });
  };

  const selectLanguage = (nextLanguage) => {
    const selected = languages.find((item) => item.key === nextLanguage) || languages[2];
    localStorage.setItem(LANGUAGE_STATE_KEY, selected.key);
    document.documentElement.lang = selected.key;
    document.documentElement.dir = selected.direction;
    document.body.dir = selected.direction;
    document.body.dataset.language = selected.key;
    document.body.dataset.direction = selected.direction;
    setLanguage(selected.key);
    setOpenMenu(null);
    window.dispatchEvent(new Event("app-language-updated"));
  };

  const activeLanguage = languages.find((item) => item.key === language) || languages[2];
  const t = headerLabels[language] || headerLabels.en;

  const changeCurrency = async (event) => {
    const nextCurrency = event.target.value;
    const saved = await setSettings([
      { ...currentSettings, currency: nextCurrency, updatedAt: new Date().toISOString() },
    ]);
    if (saved) window.dispatchEvent(new Event("company-settings-updated"));
  };

  if (compact) {
    return (
      <div className="header-menu mobile-brand-actions">
        <button
          className="profile-btn mobile-actions-toggle"
          onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}
          aria-label="Open mobile actions"
          type="button"
        >
          <User size={17} />
          {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          <ChevronDown size={14} />
        </button>

        {openMenu === "mobile" && (
          <div className="dropdown mobile-actions-dropdown">
            <strong>
              {currentUser?.fullName || currentUser?.email || currentUser?.username}
            </strong>
            <p>{currentUser?.email || "No email configured"}</p>

            <Link to="/accounts" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Users size={15} />
              Accounts
            </Link>
            <Link to="/settings" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Settings size={15} />
              Settings
            </Link>
            <div className="dropdown-alerts">
              <span>
                <Globe2 size={15} />
                {t.language}
                <b>{activeLanguage.short}</b>
              </span>
              {languages.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className="dropdown-language-option"
                  onClick={() => selectLanguage(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="dropdown-alerts">
              <span>
                <Bell size={15} />
                Alerts
                <b>{alertCount}</b>
              </span>
              <small>Low stock assets: {visibleNotificationGroups.find((group) => group.key === "stock")?.count || 0}</small>
              <small>Damaged / lost assets: {visibleNotificationGroups.find((group) => group.key === "asset-status")?.count || 0}</small>
              <small>Pending tower installations: {visibleNotificationGroups.find((group) => group.key === "tower")?.count || 0}</small>
              <small>Outstanding deposits: {visibleNotificationGroups.find((group) => group.key === "deposit")?.count || 0}</small>
            </div>

            <button className="dropdown-logout" onClick={onLogout} type="button">
              <LogOut size={15} />
              Logout
            </button>

          </div>
        )}
      </div>
    );
  }

  return (
    <div className="top-actions">
        <label className="header-account-link header-currency-control" title={t.currency}>
          <CreditCard size={19} strokeWidth={1.9} />
          <select value={currency} onChange={changeCurrency} aria-label={t.currency}>
            <option value="AFN">AFN</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </label>

        <div className="header-menu">
          <button
            className="icon-btn"
            onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")}
            aria-label="Alerts"
          >
            <Bell size={21} strokeWidth={1.9} />
            {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          </button>

          {openMenu === "alerts" && (
            <div className="dropdown alert-dropdown notification-dropdown">
              <div className="notification-dropdown-header">
  <div className="notification-dropdown-title">
    <strong>{t.notifications}</strong>

    {alertCount > 0 && (
      <span>{alertCount}</span>
    )}
  </div>

  <div className="notification-header-actions">
    <button
      type="button"
      aria-label="Mark all notifications as read"
      title="Mark all as read"
      onClick={markAllNotificationsRead}
      disabled={visibleNotificationItems.length === 0 || alertCount === 0}
    >
      <CheckCheck size={14} />
    </button>

    <button
      type="button"
      className="notification-clear-btn"
      aria-label="Clear all notifications"
      title="Clear notifications"
      onClick={clearAllNotifications}
      disabled={visibleNotificationItems.length === 0}
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>

              {visibleNotificationGroups.length > 0 ? (
                <>
                  <div className="notification-group-list">
                    {visibleNotificationGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <div key={group.key} className="notification-group-row">
                          <Icon size={15} />
                          <span>
                            {group.title} ({group.unreadCount}/{group.count})
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="notification-item-list">
                    {visibleNotificationItems.slice(0, 8).map((item, index) => {
                      const Icon = item.icon;
                      const isRead = readNotificationIds.has(item.id);
                      return (
                        <div
  key={`${item.groupTitle}-${index}`}
  className={`notification-item${isRead ? " read" : ""}`}
>
  <span className="notification-icon">
    <Icon size={15} strokeWidth={1.9} />
  </span>

  <div className="notification-item-content">
    <strong>{item.title}</strong>
    <p>{item.description}</p>
    <small>{isRead ? "Read" : "Unread"}</small>
  </div>

  <button
    type="button"
    className="notification-remove-btn"
    aria-label={`Remove ${item.title}`}
    title="Remove notification"
    onClick={() => removeNotification(item.id)}
  >
    <Trash2 size={13} />
  </button>
</div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="notification-empty">{t.noNotifications}</div>
              )}
            </div>
          )}
        </div>

        <div className="header-menu">
          <button
            className="icon-btn header-language-btn"
            onClick={() => setOpenMenu(openMenu === "language" ? null : "language")}
            aria-label="Language"
            title="Language"
            type="button"
          >
            <Globe2 size={20} strokeWidth={1.9} />
          </button>

          {openMenu === "language" && (
            <div className="dropdown language-dropdown">
              {languages.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={language === item.key ? "active" : ""}
                  onClick={() => selectLanguage(item.key)}
                >
                  <span>{item.label}</span>
                  <small>{item.direction.toUpperCase()}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-menu profile-menu">
          <button
            className="profile-btn"
            onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
            aria-label="Profile"
          >
          <User size={21} strokeWidth={1.9} />
          </button>

          {openMenu === "profile" && (
            <div className="dropdown profile-dropdown">
              <strong>
                {currentUser?.fullName || currentUser?.email || currentUser?.username}
              </strong>
              <p>{currentUser?.email || "No email configured"}</p>

          <button className="dropdown-logout" onClick={onLogout}>
                <LogOut size={15} />
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
  );
}

function Header({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [resultFilter, setResultFilter] = useState("All");
  const [language, setLanguage] = useState(
    () => localStorage.getItem(LANGUAGE_STATE_KEY) || "en"
  );
  const t = headerLabels[language] || headerLabels.en;

  const [assets] = useJsonCollection("assets");
  const [suppliers] = useJsonCollection("suppliers");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [towerAssetTransfers] = useJsonCollection("towerAssetTransfers");
  const [deviceHistory] = useJsonCollection("deviceHistory");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [customerDevices] = useJsonCollection("customerDevices");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [transactions] = useJsonCollection("transactions");
  const [packages] = useJsonCollection("packages");
  const [customerPackages] = useJsonCollection("customerPackages");
  const [disconnections] = useJsonCollection("disconnections");

  useEffect(() => {
    const handleOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenSearch(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(LANGUAGE_STATE_KEY) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    return () => window.removeEventListener("app-language-updated", syncLanguage);
  }, []);

  const searchResults = useMemo(() => {
    const keyword = query.trim();
    if (keyword.length < 2) return [];

    const allResults = buildSystemSearchResults(
      {
        assets,
        customers,
        suppliers,
        supplierPurchases,
        towerAssets,
        deviceTransfers,
        assetMovements,
        towerAssetTransfers,
        deviceHistory,
        securityDeposits,
        customerDevices,
        customerPayments,
        transactions,
        packages,
        customerPackages,
        disconnections,
      },
      keyword,
      { limit: 18 }
    );
    const filteredResults =
      resultFilter === "All"
        ? allResults
        : allResults.filter((result) => result.type === resultFilter);

    return filteredResults.slice(0, 18);
  }, [
    assetMovements,
    assets,
    customerDevices,
    customerPackages,
    customerPayments,
    customers,
    deviceHistory,
    deviceTransfers,
    disconnections,
    packages,
    query,
    resultFilter,
    securityDeposits,
    supplierPurchases,
    suppliers,
    towerAssetTransfers,
    towerAssets,
    transactions,
  ]);

  const openResult = (path) => {
    setOpenSearch(false);
    setQuery("");
    navigate(path);
  };

  const openSearchResultsPage = () => {
    const keyword = query.trim();
    if (keyword.length < 2) return;
    setOpenSearch(false);
    navigate(`/search-results?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <header className="topbar">
      <div className="header-search global-search" ref={searchRef}>
        <button
          type="button"
          className="global-search-submit"
          onClick={openSearchResultsPage}
          aria-label="Open search results"
        >
          <Search size={17} />
        </button>
        <input
          placeholder={t.search}
          aria-label="Search system"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenSearch(true);
          }}
          onFocus={() => setOpenSearch(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              openSearchResultsPage();
            }
          }}
        />

        {openSearch && query.trim().length >= 2 && (
          <div className="global-search-results">
            <div className="global-search-results-header">
              <strong>{t.systemSearch}</strong>
              <span>{searchResults.length} result(s)</span>
            </div>
            <button type="button" className="global-search-view-all" onClick={openSearchResultsPage}>
              {t.openFullResult}
            </button>

            <div className="global-search-filters">
              {[
                "All",
                "Asset",
                "Customer",
                "Tower",
                "Supplier",
                "Transfer",
                "Purchase",
                "Movement",
                "Deposit",
                "History",
                "Payment",
                "Transaction",
                "Package",
              ].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={resultFilter === filter ? "active" : ""}
                  onClick={() => setResultFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {searchResults.map((result) => (
              <button
                type="button"
                key={result.key}
                className="global-search-result"
                onClick={() => openResult(result.path)}
              >
                <span>{result.type}</span>
                <strong>{result.title}</strong>
                <em>{result.subtitle}</em>
                <div>
                  {result.details.slice(0, 6).map((detail) => (
                    <small key={detail}>{detail}</small>
                  ))}
                </div>
              </button>
            ))}

            {!searchResults.length && (
              <div className="global-search-empty">
                No exact result found. Try a partial MAC, serial number, asset ID, customer, tower, or supplier name.
              </div>
            )}
          </div>
        )}
      </div>

      <HeaderActions currentUser={currentUser} onLogout={onLogout} />
    </header>
  );
}

Header.Actions = HeaderActions;

export default Header;
