import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  Building2,
  Database,
  Download,
  Edit3,
  LockKeyhole,
  Image,
  Palette,
  Printer,
  Save,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { downloadBackup, loadBackupCollectionNames } from "../utils/backup";
import { writeBrowserCollection } from "../utils/browserStorage";
import { IS_DEMO, APP_MODE } from "../config/appConfig";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import "./Settings.css";

const defaultSystemName = "APG";
const defaultSystemSubtitle = "Pharmacy & Medicine Management System";
const themeStorageKey = "afghan-power-theme";
const languageStorageKey = "afghan-power-language";
const settingsLabels = {
  en: {
    company: "Company",
    currency: "Exchange Rates",
    companyName: "Company Name",
    address: "Address",
    phone: "Phone Number",
    logo: "Company Logo",
    currencyTitle: "Exchange Rates",
    currencies: { AFN: "Afghani", USD: "US Dollar", INR: "Indian Rupee" },
  },
  fa: {
    company: "کمپنی",
    currency: "نرخ اسعار",
    companyName: "نام کمپنی",
    address: "آدرس",
    phone: "شماره تماس",
    logo: "لوگوی کمپنی",
    currencyTitle: "نرخ اسعار",
    currencies: { AFN: "افغانی", USD: "دالر", INR: "کلدار هندی" },
  },
  ps: {
    company: "شرکت",
    currency: "د اسعارو نرخونه",
    companyName: "د شرکت نوم",
    address: "پته",
    phone: "د اړیکې شمېره",
    logo: "د شرکت لوګو",
    currencyTitle: "د اسعارو نرخونه",
    currencies: { AFN: "افغانۍ", USD: "امریکایي ډالر", INR: "هندي روپۍ" },
  },
};
const themeOptions = [
  {
    key: "minimalism",
    title: "Minimalism",
    description: "Clean, focused, distraction-free",
  },
  {
    key: "clay-minimalism",
    title: "Graphite Mist",
    description: "Layered gray gradients with charcoal navigation",
  },
  {
    key: "black-white",
    title: "Midnight Blue",
    description: "Deep navy surfaces with luminous blue accents",
  },
  {
    key: "aurora",
    title: "Aurora Flow",
    description: "Premium dark glass with company-colored aurora light",
  },
];

function applyCompanyThemeIdentity(companyName = "") {
  const source = String(companyName || defaultSystemName).trim() || defaultSystemName;
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

function applyTheme(theme) {
  localStorage.setItem(themeStorageKey, theme);
  document.body.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("dark-mode", ["black-white", "aurora"].includes(theme));
  window.dispatchEvent(new Event("app-theme-updated"));
}

function Settings({ accounts = [], setAccounts, currentUser }) {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};

  const [activeTab, setActiveTab] = useState("identity");
  const [companyName, setCompanyName] = useState(defaultSystemName);
  const [systemSubtitle, setSystemSubtitle] = useState(defaultSystemSubtitle);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [exchangeRates, setExchangeRates] = useState({ USD: "", EUR: "", INR: "" });
  const [currencyDecimals, setCurrencyDecimals] = useState({
    AFN: 2,
    USD: 2,
    EUR: 2,
    PKR: 2,
  });
  const [securityPassword, setSecurityPassword] = useState("");
  const [logo, setLogo] = useState("");
  const [autoBackupMode, setAutoBackupMode] = useState("off");
  const [autoBackupCustomDays, setAutoBackupCustomDays] = useState("7");
  const [activeTheme, setActiveTheme] = useState(
    () => {
      const storedTheme = localStorage.getItem(themeStorageKey) || "minimalism";
      return ["neon", "glassmorphism"].includes(storedTheme) ? "aurora" : storedTheme;
    }
  );
  const [appDataBusy, setAppDataBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [language, setLanguage] = useState(
    () => localStorage.getItem(languageStorageKey) || "en"
  );
  const t = settingsLabels[language] || settingsLabels.en;

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageStorageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const settingsText = {
    en: {
      decimalsTab: "Currency Decimals",
      decimalsTitle: "Currency Decimal Places",
      decimalsDescription: "Set how many digits after the decimal point are allowed for each currency.",
      afn: "Afghani", usd: "US Dollar", eur: "Euro", pkr: "Pakistani Rupee",
      decimalPlaces: "Decimal places", preview: "Preview", saveDecimals: "Save Decimal Settings",
      exchangeRateTitle: "Exchange Rates Against Afghani", exchangeRateDescription: "Enter how many Afghanis equal one unit of each foreign currency.",
      usdRate: "US Dollar", eurRate: "Euro", inrRate: "Indian Rupee", oneUnit: "1 {code} =", afnUnit: "AFN", saveExchangeRates: "Save Exchange Rates",
      usersTab: "Users", usersTitle: "Users", usersDescription: "Create and manage the accounts that can sign in to this system.", addUser: "Add User", editUser: "Edit User", userName: "Name", email: "Email", password: "Password", confirmPassword: "Confirm Password", actions: "Actions", edit: "Edit", delete: "Delete", noUsers: "No user accounts found.", saveUser: "Save User", updateUser: "Update User", cancel: "Cancel", createUserHint: "Enter the user's account information.", editUserHint: "Update the account information. Leave password empty to keep the current password.", passwordOptional: "Leave empty to keep current password", activeAccount: "Current account",
    },
    fa: {
      decimalsTab: "اعشار اسعار",
      decimalsTitle: "خانه‌های اعشاری اسعار",
      decimalsDescription: "تعداد رقم‌های بعد از ممیز را برای هر واحد پول مشخص کنید.",
      afn: "افغانی", usd: "دالر", eur: "یورو", pkr: "کلدار",
      decimalPlaces: "خانه اعشاری", preview: "نمونه نمایش", saveDecimals: "ذخیره تنظیمات اعشار",
      exchangeRateTitle: "نرخ اسعار در مقابل افغانی", exchangeRateDescription: "مشخص کنید یک واحد از هر اسعار خارجی چند افغانی می‌شود.",
      usdRate: "دالر امریکایی", eurRate: "یورو", inrRate: "کلدار هندی", oneUnit: "1 {code} =", afnUnit: "افغانی", saveExchangeRates: "ذخیره نرخ اسعار",
      usersTab: "کاربران", usersTitle: "کاربران", usersDescription: "اکانت‌هایی را که اجازه ورود به سیستم دارند ایجاد و مدیریت کنید.", addUser: "افزودن کاربر", editUser: "ویرایش کاربر", userName: "نام", email: "ایمیل", password: "پسورد", confirmPassword: "تکرار پسورد", actions: "عملیات", edit: "ویرایش", delete: "حذف", noUsers: "هیچ اکانت کاربری موجود نیست.", saveUser: "ذخیره کاربر", updateUser: "ذخیره تغییرات", cancel: "لغو", createUserHint: "معلومات اکانت کاربر را وارد کنید.", editUserHint: "معلومات اکانت را ویرایش کنید. برای حفظ پسورد فعلی، فیلد پسورد را خالی بگذارید.", passwordOptional: "برای حفظ پسورد فعلی خالی بگذارید", activeAccount: "اکانت فعلی",
    },
    ps: {
      decimalsTab: "د اسعارو اعشار",
      decimalsTitle: "د اسعارو اعشاري خانې",
      decimalsDescription: "د هرې پیسې لپاره له اعشاریې وروسته د شمېرو شمېر وټاکئ.",
      afn: "افغانۍ", usd: "ډالر", eur: "یورو", pkr: "کلدار",
      decimalPlaces: "اعشاري خانې", preview: "بېلګه", saveDecimals: "د اعشاریو تنظیمات خوندي کړئ",
      exchangeRateTitle: "د افغانیو په مقابل کې د اسعارو نرخ", exchangeRateDescription: "وټاکئ چې د هرې بهرنۍ پیسې یو واحد څو افغانۍ کېږي.",
      usdRate: "امریکایي ډالر", eurRate: "یورو", inrRate: "هندي روپۍ", oneUnit: "1 {code} =", afnUnit: "افغانۍ", saveExchangeRates: "د اسعارو نرخونه خوندي کړئ",
      usersTab: "کاروونکي", usersTitle: "کاروونکي", usersDescription: "هغه حسابونه جوړ او اداره کړئ چې دې سیسټم ته ننوتلی شي.", addUser: "کاروونکی اضافه کړئ", editUser: "کاروونکی سمول", userName: "نوم", email: "برېښنالیک", password: "پټنوم", confirmPassword: "پټنوم بیا ولیکئ", actions: "کړنې", edit: "سمول", delete: "حذف", noUsers: "هیڅ کارن حساب نشته.", saveUser: "کاروونکی خوندي کړئ", updateUser: "بدلونونه خوندي کړئ", cancel: "لغوه", createUserHint: "د کاروونکي د حساب معلومات ولیکئ.", editUserHint: "د حساب معلومات بدل کړئ. د اوسني پټنوم ساتلو لپاره د پټنوم برخه تشه پرېږدئ.", passwordOptional: "د اوسني پټنوم ساتلو لپاره تش پرېږدئ", activeAccount: "اوسنی حساب",
    },
  };
  const st = settingsText[language] || settingsText.en;

  useEffect(() => {
    setCompanyName(current.companyName || defaultSystemName);
    setSystemSubtitle(current.systemSubtitle || defaultSystemSubtitle);
    setCompanyAddress(current.companyAddress || "");
    setCompanyPhone(current.companyPhone || "");
    setCurrency(current.currency || "AFN");
    setExchangeRates({
      USD: current.exchangeRates?.USD ?? "",
      EUR: current.exchangeRates?.EUR ?? "",
      INR: current.exchangeRates?.INR ?? "",
    });
    setCurrencyDecimals({
      AFN: Number.isInteger(Number(current.currencyDecimals?.AFN)) ? Number(current.currencyDecimals.AFN) : 2,
      USD: Number.isInteger(Number(current.currencyDecimals?.USD)) ? Number(current.currencyDecimals.USD) : 2,
      EUR: Number.isInteger(Number(current.currencyDecimals?.EUR)) ? Number(current.currencyDecimals.EUR) : 2,
      PKR: Number.isInteger(Number(current.currencyDecimals?.PKR)) ? Number(current.currencyDecimals.PKR) : 2,
    });
    setSecurityPassword(current.securityPassword || "");
    setLogo(current.logo || "");
    setAutoBackupMode(current.autoBackupMode || "off");
    setAutoBackupCustomDays(String(current.autoBackupCustomDays || "7"));
  }, [
    current.autoBackupCustomDays,
    current.autoBackupMode,
    current.companyName,
    current.companyAddress,
    current.companyPhone,
    current.currency,
    current.exchangeRates,
    current.currencyDecimals,
    current.securityPassword,
    current.systemSubtitle,
    current.logo,
  ]);

  useEffect(() => {
    document.body.classList.toggle("settings-user-modal-open", showUserModal);
    return () => document.body.classList.remove("settings-user-modal-open");
  }, [showUserModal]);

  const openAddUser = () => {
    setEditingUserId(null);
    setUserForm({ fullName: "", email: "", password: "", confirmPassword: "" });
    setShowUserModal(true);
  };

  const openEditUser = (account) => {
    setEditingUserId(account.id);
    setUserForm({
      fullName: account.fullName || "",
      email: account.email || account.username || "",
      password: "",
      confirmPassword: "",
    });
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUserId(null);
    setUserForm({ fullName: "", email: "", password: "", confirmPassword: "" });
  };

  const saveUserAccount = async (event) => {
    event.preventDefault();
    if (!setAccounts) return;
    const fullName = userForm.fullName.trim();
    const email = userForm.email.trim().toLowerCase();
    if (!fullName || !email) {
      notify(language === "fa" ? "نام و ایمیل الزامی است." : language === "ps" ? "نوم او برېښنالیک اړین دي." : "Name and email are required.", "error");
      return;
    }
    const duplicate = accounts.some((account) => String(account.id) !== String(editingUserId) && String(account.email || account.username || "").toLowerCase() === email);
    if (duplicate) {
      notify(language === "fa" ? "این ایمیل قبلاً استفاده شده است." : language === "ps" ? "دا برېښنالیک مخکې کارول شوی دی." : "This email is already in use.", "error");
      return;
    }
    if (!editingUserId && !userForm.password) {
      notify(language === "fa" ? "پسورد را وارد کنید." : language === "ps" ? "پټنوم ولیکئ." : "Please enter a password.", "error");
      return;
    }
    if (userForm.password && userForm.password.length < 4) {
      notify(language === "fa" ? "پسورد حداقل 4 حرف باشد." : language === "ps" ? "پټنوم لږ تر لږه 4 توري وي." : "Password must be at least 4 characters.", "error");
      return;
    }
    if (userForm.password !== userForm.confirmPassword) {
      notify(language === "fa" ? "تکرار پسورد مطابقت ندارد." : language === "ps" ? "د پټنوم تکرار سمون نه خوري." : "Password confirmation does not match.", "error");
      return;
    }
    const existing = accounts.find((account) => String(account.id) === String(editingUserId));
    const payload = {
      ...(existing || {}),
      fullName,
      email,
      username: email,
      role: existing?.role || "Admin",
      status: existing?.status || "Active",
      permissions: existing?.permissions || {},
      updatedAt: new Date().toISOString(),
      ...(userForm.password ? { password: userForm.password } : {}),
    };
    const next = editingUserId
      ? accounts.map((account) => String(account.id) === String(editingUserId) ? payload : account)
      : [...accounts, { id: Date.now(), ...payload, createdAt: new Date().toISOString() }];
    const saved = await setAccounts(next);
    if (!saved) return;
    notify(language === "fa" ? (editingUserId ? "کاربر ویرایش شد." : "کاربر اضافه شد.") : language === "ps" ? (editingUserId ? "کاروونکی سم شو." : "کاروونکی اضافه شو.") : (editingUserId ? "User updated." : "User added."));
    closeUserModal();
  };

  const deleteUserAccount = async (account) => {
    if (!setAccounts) return;
    if (String(account.id) === String(currentUser?.id)) {
      notify(language === "fa" ? "اکانت فعلی را نمی‌توانید حذف کنید." : language === "ps" ? "اوسنی حساب نشئ حذف کولی." : "You cannot delete the current account.", "error");
      return;
    }
    const ok = await confirmAction({
      title: st.delete,
      message: `${st.delete}: ${account.fullName || account.email}?`,
      confirmText: st.delete,
    });
    if (!ok) return;
    const saved = await setAccounts(accounts.filter((item) => String(item.id) !== String(account.id)));
    if (!saved) return;
    notify(language === "fa" ? "کاربر حذف شد." : language === "ps" ? "کاروونکی حذف شو." : "User deleted.");
  };

  const selectTheme = (theme) => {
    setActiveTheme(theme);
    applyTheme(theme);
    applyCompanyThemeIdentity(companyName);
    notify("Theme updated successfully.");
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image file for the logo.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();

    const nextSettings = [
      {
        ...current,
        companyName: companyName.trim() || defaultSystemName,
        systemSubtitle: systemSubtitle.trim() || defaultSystemSubtitle,
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        currency,
        exchangeRates: {
          USD: Number(exchangeRates.USD || 0),
          EUR: Number(exchangeRates.EUR || 0),
          INR: Number(exchangeRates.INR || 0),
        },
        currencyDecimals,
        securityPassword,
        logo,
        autoBackupMode,
        autoBackupCustomDays: Math.max(Number(autoBackupCustomDays || 7), 1),
        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;

    applyCompanyThemeIdentity(nextSettings[0].companyName);
    window.dispatchEvent(new Event("company-settings-updated"));
    notify("System settings saved successfully.");
  };

  const loadCollectionNames = async () => {
    return loadBackupCollectionNames();
  };

  const exportData = async () => {
    try {
      setAppDataBusy(true);
      await downloadBackup("manual");
      notify("App data exported successfully.");
    } catch (error) {
      console.error("Unable to export app data:", error);
      notify("Unable to export app data.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setAppDataBusy(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.collections && typeof parsed.collections === "object"
        ? parsed.collections
        : parsed;
      const collections = await loadCollectionNames();
      const importable = collections.filter((name) => Array.isArray(data[name]));

      if (!importable.length) {
        notify("This file does not contain valid app data.", "error");
        return;
      }

      const ok = await confirmAction({
        title: "Import App Data",
        message: `Import will replace ${importable.length} data table(s). Continue?`,
        confirmText: "Import Data",
      });
      if (!ok) return;

      await Promise.all(
        importable.map((name) => writeBrowserCollection(name, data[name]))
      );
      notify("App data imported successfully. Refresh the app to see all changes.");
    } catch (error) {
      console.error("Unable to import app data:", error);
      notify("Unable to import app data. Please select a valid JSON file.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const clearData = async () => {
    if (!IS_DEMO) {
      notify("Clear Data is disabled in Production mode.", "error");
      return;
    }

    if (clearConfirm.trim().toUpperCase() !== "CLEAR") {
      notify("Type CLEAR to confirm data clearing.", "error");
      return;
    }

    const ok = await confirmAction({
      title: "Clear All App Data",
      message:
        "This will clear all saved app data, including settings. This cannot be undone. Continue?",
      confirmText: "Clear Data",
    });
    if (!ok) return;

    try {
      setAppDataBusy(true);
      const collections = await loadCollectionNames();
      await Promise.all(collections.map((name) => writeBrowserCollection(name, [])));
      setClearConfirm("");
      notify("App data cleared successfully. Refresh the app to start clean.");
    } catch (error) {
      console.error("Unable to clear app data:", error);
      notify("Unable to clear app data.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Choose the system name, logo, and global values used across the app.</p>
      </div>

      <div className="settings-tabs">
        <button
          type="button"
          className={activeTab === "identity" ? "active" : ""}
          onClick={() => setActiveTab("identity")}
        >
          <Building2 size={16} />
          {t.company}
        </button>
        <button
          type="button"
          className={activeTab === "currency" ? "active" : ""}
          onClick={() => setActiveTab("currency")}
        >
          <Banknote size={16} />
          {t.currency}
        </button>
        <button
          type="button"
          className={activeTab === "currency-decimals" ? "active" : ""}
          onClick={() => setActiveTab("currency-decimals")}
        >
          <Banknote size={16} />
          {st.decimalsTab}
        </button>
        <button
          type="button"
          className={activeTab === "theme" ? "active" : ""}
          onClick={() => setActiveTab("theme")}
        >
          <Palette size={16} />
          Theme Settings
        </button>
        <button
          type="button"
          className={activeTab === "printing" ? "active" : ""}
          onClick={() => setActiveTab("printing")}
        >
          <Printer size={16} />
          Printing
        </button>
        <button
          type="button"
          className={activeTab === "security" ? "active" : ""}
          onClick={() => setActiveTab("security")}
        >
          <LockKeyhole size={16} />
          Security
        </button>
        <button
          type="button"
          className={activeTab === "app-data" ? "active" : ""}
          onClick={() => setActiveTab("app-data")}
        >
          <Database size={16} />
          Backup
        </button>
        <button
          type="button"
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} />
          {st.usersTab}
        </button>
      </div>

      <div className="settings-shell-card">
      {activeTab === "identity" && (
        <form className="settings-card settings-card-flat" onSubmit={save}>
          <div className="settings-preview tab-visible">
            <div className="settings-logo">
              {logo ? (
                <img src={logo} alt="System logo preview" />
              ) : (
                <span>{(companyName || defaultSystemName).slice(0, 1)}</span>
              )}
            </div>

            <div>
              <h2>{companyName || defaultSystemName}</h2>
              <p>{systemSubtitle || defaultSystemSubtitle}</p>
              <small>{companyAddress || "Company address"}</small>
            </div>
          </div>

          <div className="settings-form">
            <section className="settings-panel">
              <div className="settings-section-title">
                <h3>{t.company}</h3>
                <p>Company information used across receipts, reports, login and print layouts.</p>
              </div>

              <div className="settings-form-grid">
                <label>
                  {t.companyName}
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder={defaultSystemName}
                  />
                </label>

                <label>
                  Sub Title
                  <input
                    value={systemSubtitle}
                    onChange={(event) => setSystemSubtitle(event.target.value)}
                    placeholder={defaultSystemSubtitle}
                  />
                </label>

                <label>
                  {t.address}
                  <input
                    value={companyAddress}
                    onChange={(event) => setCompanyAddress(event.target.value)}
                    placeholder="Kabul, Afghanistan"
                  />
                </label>

                <label>
                  {t.phone}
                  <input
                    value={companyPhone}
                    onChange={(event) => setCompanyPhone(event.target.value)}
                    placeholder="+93 700 000 000"
                  />
                </label>

                <label>
                  {t.logo}
                  <span className="settings-file-control">
                    <Image size={16} />
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                  </span>
                </label>
              </div>

              {logo && (
                <button
                  type="button"
                  className="settings-remove"
                  onClick={() => setLogo("")}
                >
                  <Trash2 size={15} />
                  Remove Logo
                </button>
              )}
            </section>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      )}

      {activeTab === "currency" && (
        <form className="settings-card settings-card-single settings-full-width-card" onSubmit={save}>
          <section className="settings-panel settings-full-width-panel">
            <div className="settings-section-title">
              <h3>{st.exchangeRateTitle}</h3>
              <p>{st.exchangeRateDescription}</p>
            </div>

            <div className="settings-exchange-grid">
              {[
                { key: "USD", title: st.usdRate },
                { key: "EUR", title: st.eurRate },
                { key: "INR", title: st.inrRate },
              ].map((item) => (
                <label className="settings-exchange-card" key={item.key}>
                  <div className="settings-exchange-card-head">
                    <Banknote size={19} />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.key}</span>
                    </div>
                  </div>
                  <div className="settings-exchange-input-row">
                    <span>{st.oneUnit.replace("{code}", item.key)}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      inputMode="decimal"
                      value={exchangeRates[item.key]}
                      onChange={(event) =>
                        setExchangeRates((previous) => ({
                          ...previous,
                          [item.key]: event.target.value,
                        }))
                      }
                      placeholder="0.0000"
                    />
                    <b>{st.afnUnit}</b>
                  </div>
                </label>
              ))}
            </div>

            <div className="settings-exchange-note">
              <Banknote size={18} />
              <span>{st.exchangeRateDescription}</span>
            </div>

            <button type="submit" className="settings-save settings-save-full">
              <Save size={16} />
              {st.saveExchangeRates}
            </button>
          </section>
        </form>
      )}

      {activeTab === "currency-decimals" && (
        <form className="settings-card settings-card-single settings-full-width-card" onSubmit={save}>
          <section className="settings-panel settings-full-width-panel">
            <div className="settings-section-title">
              <h3>{st.decimalsTitle}</h3>
              <p>{st.decimalsDescription}</p>
            </div>
            <div className="settings-decimal-grid settings-decimal-grid-full">
              {[
                { key: "AFN", title: st.afn, code: "AFN" },
                { key: "USD", title: st.usd, code: "USD" },
                { key: "EUR", title: st.eur, code: "EUR" },
                { key: "PKR", title: st.pkr, code: "PKR" },
              ].map((item) => (
                <label className="settings-decimal-card" key={item.key}>
                  <div><strong>{item.title}</strong><span>{item.code}</span></div>
                  <input type="number" min="0" max="6" step="1" value={currencyDecimals[item.key]} onChange={(event) => {
                    const value = Math.min(6, Math.max(0, Number.parseInt(event.target.value || "0", 10)));
                    setCurrencyDecimals((previous) => ({ ...previous, [item.key]: value }));
                  }} aria-label={`${item.title} ${st.decimalPlaces}`} />
                  <small>{st.decimalPlaces}</small>
                </label>
              ))}
            </div>
            <div className="settings-format-preview settings-format-preview-full">
              <strong>{st.preview}</strong>
              <div>
                <span>{st.afn}: {(1234.56789).toFixed(currencyDecimals.AFN)}</span>
                <span>{st.usd}: {(1234.56789).toFixed(currencyDecimals.USD)}</span>
                <span>{st.eur}: {(1234.56789).toFixed(currencyDecimals.EUR)}</span>
                <span>{st.pkr}: {(1234.56789).toFixed(currencyDecimals.PKR)}</span>
              </div>
            </div>
            <button type="submit" className="settings-save settings-save-full"><Save size={16} />{st.saveDecimals}</button>
          </section>
        </form>
      )}

      {activeTab === "printing" && (
        <form className="settings-print-card" onSubmit={save}>
          <section className="settings-panel">
            <div className="settings-print-toggle">
              <div>
                <strong>Master Print Mode (Gold + Black HD)</strong>
                <span>Premium polished configuration for reports and receipts.</span>
              </div>
              <input type="checkbox" />
            </div>
            <div className="settings-print-toggle">
              <div>
                <strong>Pro Print Mode (Unified HD)</strong>
                <span>Optimised black quality printing with Dari and Pashto RTL support.</span>
              </div>
              <input type="checkbox" />
            </div>

            <div className="settings-section-title">
              <h3>Footer Notes Box</h3>
              <p>Add address, phone, warranty or custom footer details.</p>
            </div>

            <div className="settings-print-notes">
              <label>
                Footer Notes Box (EN)
                <textarea placeholder="Address, phone number, warranty note, return policy..." />
              </label>
              <label>
                Footer Notes (Dari)
                <textarea dir="rtl" placeholder="آدرس، شماره تماس، شرایط ضمانت..." />
              </label>
              <label>
                Footer Notes (Pashto)
                <textarea dir="rtl" placeholder="آدرس، د تماس شمېره، د ضمانت شرایط..." />
              </label>
            </div>

            <div className="settings-section-title">
              <h3>Print Configuration</h3>
            </div>

            <div className="settings-form-grid">
              <label>Default Paper Size<select defaultValue="A4"><option>A4 (210x297mm)</option><option>Thermal 80mm</option></select></label>
              <label>Billing Paper Size<select defaultValue="Thermal 80mm"><option>Thermal 80mm</option><option>A5</option></select></label>
              <label>Default Orientation<select defaultValue="Portrait"><option>Portrait</option><option>Landscape</option></select></label>
              <label>Page Density<select defaultValue="Normal"><option>Normal</option><option>Compact</option></select></label>
            </div>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Printing
            </button>
          </section>
        </form>
      )}

      {activeTab === "security" && (
        <form className="settings-card settings-card-single" onSubmit={save}>
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>Security</h3>
              <p>Set Password for protected settings and sensitive system actions.</p>
            </div>

            <label>
              Set Password
              <input
                type="password"
                value={securityPassword}
                onChange={(event) => setSecurityPassword(event.target.value)}
                placeholder="Enter password"
              />
            </label>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Password
            </button>
          </section>
        </form>
      )}

      {activeTab === "users" && (
        <div className="settings-data-card settings-users-card" dir={language === "en" ? "ltr" : "rtl"}>
          <section className="settings-panel settings-users-panel">
            <div className="settings-users-head">
              <div className="settings-section-title">
                <h3>{st.usersTitle}</h3>
                <p>{st.usersDescription}</p>
              </div>
              <button type="button" className="settings-add-user" onClick={openAddUser}>
                <UserPlus size={17} />
                {st.addUser}
              </button>
            </div>

            <div className="settings-users-table-wrap">
              <table className="settings-users-table">
                <thead>
                  <tr>
                    <th>{st.userName}</th>
                    <th>{st.email}</th>
                    <th>{st.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <div className="settings-user-name">
                          <span>{(account.fullName || account.email || "U").slice(0, 1).toUpperCase()}</span>
                          <div><strong>{account.fullName || account.email}</strong>{String(account.id) === String(currentUser?.id) && <small>{st.activeAccount}</small>}</div>
                        </div>
                      </td>
                      <td>{account.email || account.username || "—"}</td>
                      <td>
                        <div className="settings-user-actions">
                          <button type="button" onClick={() => openEditUser(account)}><Edit3 size={14} />{st.edit}</button>
                          <button type="button" className="danger" onClick={() => deleteUserAccount(account)} disabled={String(account.id) === String(currentUser?.id)}><Trash2 size={14} />{st.delete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && <tr><td colSpan="3" className="settings-users-empty">{st.noUsers}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "theme" && (
        <div className="settings-theme-card">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>Theme Settings</h3>
              <p>Select one of the available interface themes. Each theme uses the company name as its visual signature.</p>
            </div>

            <div className="settings-theme-grid">
              {themeOptions.map((theme) => (
                <button
                  type="button"
                  key={theme.key}
                  className={activeTheme === theme.key ? "active" : ""}
                  onClick={() => selectTheme(theme.key)}
                >
                  <strong>{theme.title}</strong>
                  <span>{theme.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "app-data" && (
        <div className="settings-data-card">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>App Data</h3>
              <p>Export a backup, import a backup, or clear all saved app data.</p>
            </div>

            <div className={`settings-environment-status ${IS_DEMO ? "is-demo" : "is-production"}`}>
              <strong>{IS_DEMO ? "Demo Environment" : "Production Environment"}</strong>
              <span>{IS_DEMO ? "Demo data is isolated from the customer production environment." : "Production data is isolated from the demo environment."}</span>
              <code>{APP_MODE}</code>
            </div>

            <div className="settings-data-actions">
              <button type="button" onClick={exportData} disabled={appDataBusy}>
                <Download size={16} />
                Export Data
              </button>

              <label className={appDataBusy ? "disabled" : ""}>
                <Upload size={16} />
                Import Data
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importData}
                  disabled={appDataBusy}
                />
              </label>
            </div>

            <div className="settings-auto-backup">
              <div className="settings-auto-backup-title">
                <Database size={18} />
                <div>
                  <strong>Automatically Backup</strong>
                  <span>The system checks this schedule while the app is open and reports when a backup is created.</span>
                </div>
              </div>

              <label>
                Backup Schedule
                <select
                  value={autoBackupMode}
                  onChange={(event) => setAutoBackupMode(event.target.value)}
                >
                  <option value="off">Off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              {autoBackupMode === "custom" && (
                <label>
                  Custom Interval (Days)
                  <input
                    type="number"
                    min="1"
                    value={autoBackupCustomDays}
                    onChange={(event) => setAutoBackupCustomDays(event.target.value)}
                  />
                </label>
              )}

              <button type="button" onClick={save} disabled={appDataBusy}>
                <Save size={16} />
                Save Backup Setting
              </button>
            </div>

            {IS_DEMO && (
              <div className="settings-clear-zone">
                <div>
                  <Database size={18} />
                  <strong>Clear Demo Data</strong>
                  <span>Type CLEAR, then press Clear Demo Data.</span>
                </div>

                <input
                  value={clearConfirm}
                  onChange={(event) => setClearConfirm(event.target.value)}
                  placeholder="CLEAR"
                  disabled={appDataBusy}
                />

                <button type="button" onClick={clearData} disabled={appDataBusy}>
                  <Trash2 size={16} />
                  Clear Demo Data
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      </div>

      {showUserModal && createPortal(
        <div className="settings-user-modal-backdrop" role="presentation">
          <div className="settings-user-modal" role="dialog" aria-modal="true" dir={language === "en" ? "ltr" : "rtl"} onClick={(event) => event.stopPropagation()}>
            <div className="settings-user-modal-head">
              <div>
                <h3>{editingUserId ? st.editUser : st.addUser}</h3>
                <p>{editingUserId ? st.editUserHint : st.createUserHint}</p>
              </div>
              <button type="button" onClick={closeUserModal} aria-label="Close"><X size={18} /></button>
            </div>
            <form className="settings-user-form" onSubmit={saveUserAccount}>
              <div className="settings-user-form-grid">
                <label><span>{st.userName} *</span><input value={userForm.fullName} onChange={(e) => setUserForm((v) => ({...v, fullName:e.target.value}))} autoFocus /></label>
                <label><span>{st.email} *</span><input type="email" value={userForm.email} onChange={(e) => setUserForm((v) => ({...v, email:e.target.value}))} /></label>
                <label><span>{st.password}{!editingUserId ? " *" : ""}</span><input type="password" value={userForm.password} placeholder={editingUserId ? st.passwordOptional : ""} onChange={(e) => setUserForm((v) => ({...v, password:e.target.value}))} autoComplete="new-password" /></label>
                <label><span>{st.confirmPassword}{!editingUserId ? " *" : ""}</span><input type="password" value={userForm.confirmPassword} onChange={(e) => setUserForm((v) => ({...v, confirmPassword:e.target.value}))} autoComplete="new-password" /></label>
              </div>
              <div className="settings-user-modal-footer">
                <button type="button" className="secondary" onClick={closeUserModal}>{st.cancel}</button>
                <button type="submit" className="primary"><Save size={16} />{editingUserId ? st.updateUser : st.saveUser}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Settings;
