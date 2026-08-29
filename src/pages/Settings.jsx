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
  Volume2,
  Play,
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
const notificationSoundStorageKey = "afghan-power-notification-sound";
const notificationSoundEnabledKey = "afghan-power-notification-sound-enabled";
const notificationSounds = [
  "bell.mp4",
  "blip.mov",
  "chime.mov",
  "click.mp4",
  "ding.mp4",
  "ping.mp4",
  "pop.mov",
  "sparkle.mp4",
  "water-drop.mp4",
  "whoosh.mp4",
];
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
  { key: "minimalism" },
  { key: "clay-minimalism" },
  { key: "black-white" },
  { key: "aurora" },
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
  const [notificationSound, setNotificationSound] = useState(
    () => localStorage.getItem(notificationSoundStorageKey) || "chime.mov"
  );
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(
    () => localStorage.getItem(notificationSoundEnabledKey) !== "false"
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
      pageTitle: "Settings",
      pageDescription: "Choose the system name, logo, and global values used across the app.",
      decimalsTab: "Currency Decimals",
      decimalsTitle: "Currency Decimal Places",
      decimalsDescription: "Set how many digits after the decimal point are allowed for each currency.",
      afn: "Afghani", usd: "US Dollar", eur: "Euro", pkr: "Pakistani Rupee",
      decimalPlaces: "Decimal places", preview: "Preview", saveDecimals: "Save Decimal Settings",
      exchangeRateTitle: "Exchange Rates Against Afghani", exchangeRateDescription: "Enter how many Afghanis equal one unit of each foreign currency.",
      usdRate: "US Dollar", eurRate: "Euro", inrRate: "Indian Rupee", oneUnit: "1 {code} =", afnUnit: "AFN", saveExchangeRates: "Save Exchange Rates",
      usersTab: "Users", usersTitle: "Users", usersDescription: "Create and manage the accounts that can sign in to this system.", addUser: "Add User", editUser: "Edit User", userName: "Name", email: "Email", password: "Password", confirmPassword: "Confirm Password", actions: "Actions", edit: "Edit", delete: "Delete", noUsers: "No user accounts found.", saveUser: "Save User", updateUser: "Update User", cancel: "Cancel", createUserHint: "Enter the user's account information.", editUserHint: "Update the account information. Leave password empty to keep the current password.", passwordOptional: "Leave empty to keep current password", activeAccount: "Current account", close: "Close",
      themeTab: "Theme Settings", printingTab: "Printing", securityTab: "Security", backupTab: "Backup", notificationSoundTab: "Notification Sound", notificationSoundTitle: "Notification Sound", notificationSoundDescription: "Choose the sound played whenever the system shows a notification.", soundEnabled: "Notification sound", soundOn: "On", soundOff: "Off", testSound: "Test", selectedSound: "Selected", saveSound: "Save Sound Settings", soundSaved: "Notification sound settings saved.",
      companyDescription: "Company information used across receipts, reports, login and print layouts.", subTitle: "Sub Title", companyAddressPlaceholder: "Kabul, Afghanistan", removeLogo: "Remove Logo", saveSettings: "Save Settings", logoPreviewAlt: "System logo preview", companyAddressFallback: "Company address",
      masterPrintMode: "Master Print Mode (Gold + Black HD)", masterPrintDescription: "Premium polished configuration for reports and receipts.", proPrintMode: "Pro Print Mode (Unified HD)", proPrintDescription: "Optimised black quality printing with Dari and Pashto RTL support.", footerNotesBox: "Footer Notes Box", footerNotesDescription: "Add address, phone, warranty or custom footer details.", footerNotesEn: "Footer Notes Box (EN)", footerNotesDari: "Footer Notes (Dari)", footerNotesPashto: "Footer Notes (Pashto)", footerPlaceholderEn: "Address, phone number, warranty note, return policy...", footerPlaceholderDari: "آدرس، شماره تماس، شرایط ضمانت...", footerPlaceholderPashto: "آدرس، د تماس شمېره، د ضمانت شرایط...", printConfiguration: "Print Configuration", defaultPaperSize: "Default Paper Size", billingPaperSize: "Billing Paper Size", defaultOrientation: "Default Orientation", pageDensity: "Page Density", thermal80: "Thermal 80mm", portrait: "Portrait", landscape: "Landscape", normal: "Normal", compact: "Compact", savePrinting: "Save Printing",
      securityTitle: "Security", securityDescription: "Set a password for protected settings and sensitive system actions.", setPassword: "Set Password", enterPassword: "Enter password", savePassword: "Save Password",
      themeTitle: "Theme Settings", themeDescription: "Select one of the available interface themes. Each theme uses the company name as its visual signature.", themes: {
        minimalism: ["Minimalism", "Clean, focused, distraction-free"],
        "clay-minimalism": ["Graphite Mist", "Layered gray gradients with charcoal navigation"],
        "black-white": ["Midnight Blue", "Deep navy surfaces with luminous blue accents"],
        aurora: ["Aurora Flow", "Premium dark glass with company-colored aurora light"],
      },
      appDataTitle: "App Data", appDataDescription: "Export a backup, import a backup, or clear all saved app data.", demoEnvironment: "Demo Environment", productionEnvironment: "Production Environment", demoEnvironmentDescription: "Demo data is isolated from the customer production environment.", productionEnvironmentDescription: "Production data is isolated from the demo environment.", exportData: "Export Data", importData: "Import Data", automaticallyBackup: "Automatically Backup", automaticallyBackupDescription: "The system checks this schedule while the app is open and reports when a backup is created.", backupSchedule: "Backup Schedule", off: "Off", daily: "Daily", weekly: "Weekly", monthly: "Monthly", custom: "Custom", customIntervalDays: "Custom Interval (Days)", saveBackupSetting: "Save Backup Setting", clearDemoData: "Clear Demo Data", clearDemoInstruction: "Type CLEAR, then press Clear Demo Data.",
      themeUpdated: "Theme updated successfully.", invalidLogo: "Please select an image file for the logo.", settingsSaved: "System settings saved successfully.", exportSuccess: "App data exported successfully.", exportError: "Unable to export app data.", invalidBackup: "This file does not contain valid app data.", importTitle: "Import App Data", importConfirm: "Import will replace {count} data table(s). Continue?", importSuccess: "App data imported successfully. Refresh the app to see all changes.", importError: "Unable to import app data. Please select a valid JSON file.", clearDisabled: "Clear Data is disabled in Production mode.", clearTypeConfirm: "Type CLEAR to confirm data clearing.", clearAllTitle: "Clear All App Data", clearAllMessage: "This will clear all saved app data, including settings. This cannot be undone. Continue?", clearData: "Clear Data", clearSuccess: "App data cleared successfully. Refresh the app to start clean.", clearError: "Unable to clear app data.",
    },
    fa: {
      pageTitle: "تنظیمات",
      pageDescription: "نام سیستم، لوگو و تنظیمات عمومی مورد استفاده در سراسر برنامه را انتخاب کنید.",
      decimalsTab: "اعشار اسعار",
      decimalsTitle: "خانه‌های اعشاری اسعار",
      decimalsDescription: "تعداد رقم‌های بعد از ممیز را برای هر واحد پول مشخص کنید.",
      afn: "افغانی", usd: "دالر", eur: "یورو", pkr: "کلدار پاکستانی",
      decimalPlaces: "خانه اعشاری", preview: "نمونه نمایش", saveDecimals: "ذخیره تنظیمات اعشار",
      exchangeRateTitle: "نرخ اسعار در مقابل افغانی", exchangeRateDescription: "مشخص کنید یک واحد از هر اسعار خارجی چند افغانی می‌شود.",
      usdRate: "دالر امریکایی", eurRate: "یورو", inrRate: "کلدار هندی", oneUnit: "1 {code} =", afnUnit: "افغانی", saveExchangeRates: "ذخیره نرخ اسعار",
      usersTab: "کاربران", usersTitle: "کاربران", usersDescription: "اکانت‌هایی را که اجازه ورود به سیستم دارند ایجاد و مدیریت کنید.", addUser: "افزودن کاربر", editUser: "ویرایش کاربر", userName: "نام", email: "ایمیل", password: "پسورد", confirmPassword: "تکرار پسورد", actions: "عملیات", edit: "ویرایش", delete: "حذف", noUsers: "هیچ اکانت کاربری موجود نیست.", saveUser: "ذخیره کاربر", updateUser: "ذخیره تغییرات", cancel: "لغو", createUserHint: "معلومات اکانت کاربر را وارد کنید.", editUserHint: "معلومات اکانت را ویرایش کنید. برای حفظ پسورد فعلی، فیلد پسورد را خالی بگذارید.", passwordOptional: "برای حفظ پسورد فعلی خالی بگذارید", activeAccount: "اکانت فعلی", close: "بستن",
      themeTab: "تنظیمات پوسته", printingTab: "چاپ", securityTab: "امنیت", backupTab: "بکاپ", notificationSoundTab: "صدای هشدار", notificationSoundTitle: "صدای هشدار", notificationSoundDescription: "صدایی را انتخاب کنید که هنگام نمایش هر هشدار سیستم پخش شود.", soundEnabled: "صدای هشدار", soundOn: "روشن", soundOff: "خاموش", testSound: "تست", selectedSound: "انتخاب شده", saveSound: "ذخیره تنظیمات صدا", soundSaved: "تنظیمات صدای هشدار ذخیره شد.",
      companyDescription: "معلومات کمپنی که در رسیدها، گزارش‌ها، صفحه ورود و قالب‌های چاپ استفاده می‌شود.", subTitle: "عنوان فرعی", companyAddressPlaceholder: "کابل، افغانستان", removeLogo: "حذف لوگو", saveSettings: "ذخیره تنظیمات", logoPreviewAlt: "پیش‌نمایش لوگوی سیستم", companyAddressFallback: "آدرس کمپنی",
      masterPrintMode: "حالت چاپ اصلی (طلایی + سیاه HD)", masterPrintDescription: "تنظیم حرفه‌ای و باکیفیت برای گزارش‌ها و رسیدها.", proPrintMode: "حالت چاپ حرفه‌ای (Unified HD)", proPrintDescription: "چاپ سیاه با کیفیت بهینه همراه با پشتیبانی راست‌به‌چپ دری و پشتو.", footerNotesBox: "بخش یادداشت پایانی", footerNotesDescription: "آدرس، شماره تماس، ضمانت یا توضیحات دلخواه فوتر را اضافه کنید.", footerNotesEn: "یادداشت فوتر (انگلیسی)", footerNotesDari: "یادداشت فوتر (دری)", footerNotesPashto: "یادداشت فوتر (پشتو)", footerPlaceholderEn: "آدرس، شماره تماس، یادداشت ضمانت، شرایط بازگشت...", footerPlaceholderDari: "آدرس، شماره تماس، شرایط ضمانت...", footerPlaceholderPashto: "آدرس، د تماس شمېره، د ضمانت شرایط...", printConfiguration: "تنظیمات چاپ", defaultPaperSize: "اندازه پیش‌فرض کاغذ", billingPaperSize: "اندازه کاغذ بل", defaultOrientation: "جهت پیش‌فرض", pageDensity: "تراکم صفحه", thermal80: "حرارتی 80 میلی‌متر", portrait: "عمودی", landscape: "افقی", normal: "عادی", compact: "فشرده", savePrinting: "ذخیره تنظیمات چاپ",
      securityTitle: "امنیت", securityDescription: "برای تنظیمات محافظت‌شده و عملیات حساس سیستم پسورد تعیین کنید.", setPassword: "تعیین پسورد", enterPassword: "پسورد را وارد کنید", savePassword: "ذخیره پسورد",
      themeTitle: "تنظیمات پوسته", themeDescription: "یکی از پوسته‌های موجود را انتخاب کنید. هر پوسته از نام کمپنی به‌عنوان امضای بصری استفاده می‌کند.", themes: {
        minimalism: ["مینیمال", "ساده، متمرکز و بدون عناصر اضافی"],
        "clay-minimalism": ["مه گرافیتی", "گرادیانت‌های خاکستری لایه‌ای با ناوبری زغالی"],
        "black-white": ["آبی نیمه‌شب", "سطوح سرمه‌ای عمیق با جلوه‌های آبی روشن"],
        aurora: ["جریان شفق", "شیشه تیره حرفه‌ای با نور شفق هماهنگ با رنگ کمپنی"],
      },
      appDataTitle: "دیتای برنامه", appDataDescription: "از اطلاعات بکاپ بگیرید، بکاپ را وارد کنید یا تمام دیتای ذخیره‌شده برنامه را پاک کنید.", demoEnvironment: "محیط دمو", productionEnvironment: "محیط اصلی", demoEnvironmentDescription: "دیتای دمو از محیط اصلی مشتری جدا نگهداری می‌شود.", productionEnvironmentDescription: "دیتای اصلی از محیط دمو جدا نگهداری می‌شود.", exportData: "خروجی گرفتن از دیتا", importData: "وارد کردن دیتا", automaticallyBackup: "بکاپ خودکار", automaticallyBackupDescription: "سیستم هنگام باز بودن برنامه این زمان‌بندی را بررسی می‌کند و پس از ایجاد بکاپ اطلاع می‌دهد.", backupSchedule: "زمان‌بندی بکاپ", off: "خاموش", daily: "روزانه", weekly: "هفتگی", monthly: "ماهانه", custom: "دلخواه", customIntervalDays: "فاصله دلخواه (روز)", saveBackupSetting: "ذخیره تنظیمات بکاپ", clearDemoData: "پاک کردن دیتای دمو", clearDemoInstruction: "عبارت CLEAR را بنویسید، سپس روی پاک کردن دیتای دمو کلیک کنید.",
      themeUpdated: "پوسته با موفقیت تغییر کرد.", invalidLogo: "لطفاً یک فایل تصویری برای لوگو انتخاب کنید.", settingsSaved: "تنظیمات سیستم با موفقیت ذخیره شد.", exportSuccess: "دیتای برنامه با موفقیت خروجی گرفته شد.", exportError: "خروجی گرفتن از دیتای برنامه انجام نشد.", invalidBackup: "این فایل دیتای معتبر برنامه را ندارد.", importTitle: "وارد کردن دیتای برنامه", importConfirm: "با وارد کردن بکاپ، {count} جدول داده جایگزین می‌شود. ادامه می‌دهید؟", importSuccess: "دیتای برنامه با موفقیت وارد شد. برای مشاهده همه تغییرات برنامه را تازه‌سازی کنید.", importError: "وارد کردن دیتا انجام نشد. لطفاً یک فایل JSON معتبر انتخاب کنید.", clearDisabled: "پاک کردن دیتا در حالت اصلی غیرفعال است.", clearTypeConfirm: "برای تأیید پاک کردن دیتا، CLEAR را وارد کنید.", clearAllTitle: "پاک کردن تمام دیتای برنامه", clearAllMessage: "تمام دیتای ذخیره‌شده برنامه، شامل تنظیمات، پاک می‌شود و قابل بازگشت نیست. ادامه می‌دهید؟", clearData: "پاک کردن دیتا", clearSuccess: "دیتای برنامه با موفقیت پاک شد. برای شروع دوباره برنامه را تازه‌سازی کنید.", clearError: "پاک کردن دیتای برنامه انجام نشد.",
    },
    ps: {
      pageTitle: "تنظیمات",
      pageDescription: "د سیسټم نوم، لوګو او هغه عمومي ارزښتونه وټاکئ چې په ټول اپ کې کارېږي.",
      decimalsTab: "د اسعارو اعشار",
      decimalsTitle: "د اسعارو اعشاري خانې",
      decimalsDescription: "د هرې پیسې لپاره له اعشاریې وروسته د شمېرو شمېر وټاکئ.",
      afn: "افغانۍ", usd: "امریکایي ډالر", eur: "یورو", pkr: "پاکستانۍ کلدارې",
      decimalPlaces: "اعشاري خانې", preview: "بېلګه", saveDecimals: "د اعشاریو تنظیمات خوندي کړئ",
      exchangeRateTitle: "د افغانیو په مقابل کې د اسعارو نرخ", exchangeRateDescription: "وټاکئ چې د هرې بهرنۍ پیسې یو واحد څو افغانۍ کېږي.",
      usdRate: "امریکایي ډالر", eurRate: "یورو", inrRate: "هندي روپۍ", oneUnit: "1 {code} =", afnUnit: "افغانۍ", saveExchangeRates: "د اسعارو نرخونه خوندي کړئ",
      usersTab: "کاروونکي", usersTitle: "کاروونکي", usersDescription: "هغه حسابونه جوړ او اداره کړئ چې دې سیسټم ته ننوتلی شي.", addUser: "کاروونکی اضافه کړئ", editUser: "کاروونکی سمول", userName: "نوم", email: "برېښنالیک", password: "پټنوم", confirmPassword: "پټنوم بیا ولیکئ", actions: "کړنې", edit: "سمول", delete: "حذف", noUsers: "هیڅ کارن حساب نشته.", saveUser: "کاروونکی خوندي کړئ", updateUser: "بدلونونه خوندي کړئ", cancel: "لغوه", createUserHint: "د کاروونکي د حساب معلومات ولیکئ.", editUserHint: "د حساب معلومات بدل کړئ. د اوسني پټنوم ساتلو لپاره د پټنوم برخه تشه پرېږدئ.", passwordOptional: "د اوسني پټنوم ساتلو لپاره تش پرېږدئ", activeAccount: "اوسنی حساب", close: "بندول",
      themeTab: "د بڼې تنظیمات", printingTab: "چاپ", securityTab: "امنیت", backupTab: "بیک اپ", notificationSoundTab: "د خبرتیا غږ", notificationSoundTitle: "د خبرتیا غږ", notificationSoundDescription: "هغه غږ وټاکئ چې د سیسټم د هرې خبرتیا پر مهال غږول کېږي.", soundEnabled: "د خبرتیا غږ", soundOn: "چالان", soundOff: "بند", testSound: "ازموینه", selectedSound: "ټاکل شوی", saveSound: "د غږ تنظیمات ذخیره کړئ", soundSaved: "د خبرتیا د غږ تنظیمات ذخیره شول.",
      companyDescription: "د شرکت هغه معلومات چې په رسیدونو، راپورونو، ننوتلو او چاپي بڼو کې کارېږي.", subTitle: "فرعي سرلیک", companyAddressPlaceholder: "کابل، افغانستان", removeLogo: "لوګو لرې کړئ", saveSettings: "تنظیمات خوندي کړئ", logoPreviewAlt: "د سیسټم لوګو مخکتنه", companyAddressFallback: "د شرکت پته",
      masterPrintMode: "اصلي چاپ حالت (طلایي + تور HD)", masterPrintDescription: "د راپورونو او رسیدونو لپاره مسلکي او لوړ کیفیت تنظیم.", proPrintMode: "مسلکي چاپ حالت (Unified HD)", proPrintDescription: "له دري او پښتو RTL ملاتړ سره د لوړ کیفیت تور چاپ لپاره غوره شوی.", footerNotesBox: "د پای یادښتونو برخه", footerNotesDescription: "پته، د اړیکې شمېره، تضمین یا د فوتر ځانګړي معلومات اضافه کړئ.", footerNotesEn: "د فوتر یادښت (انګلیسي)", footerNotesDari: "د فوتر یادښت (دري)", footerNotesPashto: "د فوتر یادښت (پښتو)", footerPlaceholderEn: "پته، د اړیکې شمېره، د تضمین یادښت، د بېرته ستنولو تګلاره...", footerPlaceholderDari: "آدرس، شماره تماس، شرایط ضمانت...", footerPlaceholderPashto: "پته، د اړیکې شمېره، د تضمین شرایط...", printConfiguration: "د چاپ تنظیمات", defaultPaperSize: "د کاغذ اصلي اندازه", billingPaperSize: "د بل کاغذ اندازه", defaultOrientation: "اصلي جهت", pageDensity: "د پاڼې تراکم", thermal80: "حرارتي 80 ملي متر", portrait: "عمودي", landscape: "افقي", normal: "عادي", compact: "متراکم", savePrinting: "د چاپ تنظیمات خوندي کړئ",
      securityTitle: "امنیت", securityDescription: "د خوندي تنظیماتو او حساسو سیسټمي کړنو لپاره پټنوم وټاکئ.", setPassword: "پټنوم وټاکئ", enterPassword: "پټنوم ولیکئ", savePassword: "پټنوم خوندي کړئ",
      themeTitle: "د بڼې تنظیمات", themeDescription: "له شته بڼو څخه یوه وټاکئ. هره بڼه د شرکت نوم د خپل لیدیز پېژند په توګه کاروي.", themes: {
        minimalism: ["مینیمال", "پاکه، متمرکزه او له اضافي ګډوډۍ پرته بڼه"],
        "clay-minimalism": ["ګرافایټي مه", "پوړیز خړ تدریجونه له تیاره ناوبري سره"],
        "black-white": ["د نیمې شپې شین", "ژور تیاره شین سطحې له روښانه شینو اغېزو سره"],
        aurora: ["د شفق جریان", "مسلکي تیاره ښیښه له د شرکت رنګ سره همغږې شفق رڼا"],
      },
      appDataTitle: "د اپ معلومات", appDataDescription: "بیک اپ صادر کړئ، بیک اپ وارد کړئ یا د اپ ټول خوندي معلومات پاک کړئ.", demoEnvironment: "ډیمو چاپېریال", productionEnvironment: "اصلي چاپېریال", demoEnvironmentDescription: "د ډیمو معلومات د پیرودونکي له اصلي چاپېریال څخه جلا ساتل کېږي.", productionEnvironmentDescription: "اصلي معلومات د ډیمو له چاپېریال څخه جلا ساتل کېږي.", exportData: "معلومات صادر کړئ", importData: "معلومات وارد کړئ", automaticallyBackup: "اتومات بیک اپ", automaticallyBackupDescription: "سیسټم د اپ د خلاصېدو پر مهال دا مهالویش ګوري او د بیک اپ له جوړېدو وروسته خبر ورکوي.", backupSchedule: "د بیک اپ مهالویش", off: "بند", daily: "ورځنی", weekly: "اوونیز", monthly: "میاشتنی", custom: "ځانګړی", customIntervalDays: "ځانګړی واټن (ورځې)", saveBackupSetting: "د بیک اپ تنظیم خوندي کړئ", clearDemoData: "د ډیمو معلومات پاک کړئ", clearDemoInstruction: "CLEAR ولیکئ، بیا د ډیمو معلومات پاک کړئ تڼۍ کېکاږئ.",
      themeUpdated: "بڼه په بریالیتوب بدله شوه.", invalidLogo: "مهرباني وکړئ د لوګو لپاره انځوریز فایل وټاکئ.", settingsSaved: "د سیسټم تنظیمات په بریالیتوب خوندي شول.", exportSuccess: "د اپ معلومات په بریالیتوب صادر شول.", exportError: "د اپ معلومات صادر نه شول.", invalidBackup: "دا فایل د اپ معتبر معلومات نه لري.", importTitle: "د اپ معلومات واردول", importConfirm: "واردول به {count} ډیټا جدولونه بدل کړي. دوام ورکړئ؟", importSuccess: "د اپ معلومات په بریالیتوب وارد شول. د ټولو بدلونونو د لیدلو لپاره اپ تازه کړئ.", importError: "معلومات وارد نه شول. مهرباني وکړئ معتبر JSON فایل وټاکئ.", clearDisabled: "په اصلي حالت کې د معلوماتو پاکول غیرفعال دي.", clearTypeConfirm: "د معلوماتو پاکول د تایید لپاره CLEAR ولیکئ.", clearAllTitle: "د اپ ټول معلومات پاکول", clearAllMessage: "د اپ ټول خوندي معلومات، د تنظیماتو په ګډون، پاکېږي او بېرته نه راګرځي. دوام ورکړئ؟", clearData: "معلومات پاک کړئ", clearSuccess: "د اپ معلومات په بریالیتوب پاک شول. د نوي پیل لپاره اپ تازه کړئ.", clearError: "د اپ معلومات پاک نه شول.",
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
    const savedSound = current.notificationSound || localStorage.getItem(notificationSoundStorageKey) || "chime.mov";
    const savedSoundEnabled = current.notificationSoundEnabled ?? (localStorage.getItem(notificationSoundEnabledKey) !== "false");
    setNotificationSound(savedSound);
    setNotificationSoundEnabled(Boolean(savedSoundEnabled));
    localStorage.setItem(notificationSoundStorageKey, savedSound);
    localStorage.setItem(notificationSoundEnabledKey, String(Boolean(savedSoundEnabled)));
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
    current.notificationSound,
    current.notificationSoundEnabled,
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
    notify(language === "fa" ? (editingUserId ? "کاربر ویرایش شد." : "کاربر اضافه شد.") : language === "ps" ? (editingUserId ? "کاروونکی سم شو." : "کاروونکی اضافه شو.") : (editingUserId ? "User updated." : "User added."), "success", { silent: true });
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
    notify(st.themeUpdated);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify(st.invalidLogo, "error");
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
        notificationSound,
        notificationSoundEnabled,
        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;

    localStorage.setItem(notificationSoundStorageKey, notificationSound);
    localStorage.setItem(notificationSoundEnabledKey, String(notificationSoundEnabled));
    window.dispatchEvent(new Event("notification-sound-updated"));
    applyCompanyThemeIdentity(nextSettings[0].companyName);
    window.dispatchEvent(new Event("company-settings-updated"));
    notify(st.settingsSaved, "success", { silent: true });
  };

  const loadCollectionNames = async () => {
    return loadBackupCollectionNames();
  };

  const exportData = async () => {
    try {
      setAppDataBusy(true);
      await downloadBackup("manual");
      notify(st.exportSuccess);
    } catch (error) {
      console.error("Unable to export app data:", error);
      notify(st.exportError, "error");
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
        notify(st.invalidBackup, "error");
        return;
      }

      const ok = await confirmAction({
        title: st.importTitle,
        message: st.importConfirm.replace("{count}", String(importable.length)),
        confirmText: st.importData,
      });
      if (!ok) return;

      await Promise.all(
        importable.map((name) => writeBrowserCollection(name, data[name]))
      );
      notify(st.importSuccess);
    } catch (error) {
      console.error("Unable to import app data:", error);
      notify(st.importError, "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const clearData = async () => {
    if (!IS_DEMO) {
      notify(st.clearDisabled, "error");
      return;
    }

    if (clearConfirm.trim().toUpperCase() !== "CLEAR") {
      notify(st.clearTypeConfirm, "error");
      return;
    }

    const ok = await confirmAction({
      title: st.clearAllTitle,
      message: st.clearAllMessage,
      confirmText: st.clearData,
    });
    if (!ok) return;

    try {
      setAppDataBusy(true);
      const collections = await loadCollectionNames();
      await Promise.all(collections.map((name) => writeBrowserCollection(name, [])));
      setClearConfirm("");
      notify(st.clearSuccess);
    } catch (error) {
      console.error("Unable to clear app data:", error);
      notify(st.clearError, "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const testNotificationSound = (soundName) => {
    try {
      const audio = new Audio(`/sounds/${encodeURIComponent(soundName)}`);
      audio.volume = 0.9;
      audio.play().catch(() => {});
    } catch (error) {
      console.warn("Unable to test notification sound:", error);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{st.pageTitle}</h1>
        <p>{st.pageDescription}</p>
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
          {st.themeTab}
        </button>
        <button
          type="button"
          className={activeTab === "printing" ? "active" : ""}
          onClick={() => setActiveTab("printing")}
        >
          <Printer size={16} />
          {st.printingTab}
        </button>
        <button
          type="button"
          className={activeTab === "notification-sound" ? "active" : ""}
          onClick={() => setActiveTab("notification-sound")}
        >
          <Volume2 size={16} />
          {st.notificationSoundTab}
        </button>
        <button
          type="button"
          className={activeTab === "security" ? "active" : ""}
          onClick={() => setActiveTab("security")}
        >
          <LockKeyhole size={16} />
          {st.securityTab}
        </button>
        <button
          type="button"
          className={activeTab === "app-data" ? "active" : ""}
          onClick={() => setActiveTab("app-data")}
        >
          <Database size={16} />
          {st.backupTab}
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
                <img src={logo} alt={st.logoPreviewAlt} />
              ) : (
                <span>{(companyName || defaultSystemName).slice(0, 1)}</span>
              )}
            </div>

            <div>
              <h2>{companyName || defaultSystemName}</h2>
              <p>{systemSubtitle || defaultSystemSubtitle}</p>
              <small>{companyAddress || st.companyAddressFallback}</small>
            </div>
          </div>

          <div className="settings-form">
            <section className="settings-panel">
              <div className="settings-section-title">
                <h3>{t.company}</h3>
                <p>{st.companyDescription}</p>
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
                  {st.subTitle}
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
                    placeholder={st.companyAddressPlaceholder}
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
                  {st.removeLogo}
                </button>
              )}
            </section>

            <button type="submit" className="settings-save">
              <Save size={16} />
              {st.saveSettings}
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
                <strong>{st.masterPrintMode}</strong>
                <span>{st.masterPrintDescription}</span>
              </div>
              <input type="checkbox" />
            </div>
            <div className="settings-print-toggle">
              <div>
                <strong>{st.proPrintMode}</strong>
                <span>{st.proPrintDescription}</span>
              </div>
              <input type="checkbox" />
            </div>

            <div className="settings-section-title">
              <h3>{st.footerNotesBox}</h3>
              <p>{st.footerNotesDescription}</p>
            </div>

            <div className="settings-print-notes">
              <label>
                {st.footerNotesEn}
                <textarea placeholder={st.footerPlaceholderEn} />
              </label>
              <label>
                {st.footerNotesDari}
                <textarea dir="rtl" placeholder={st.footerPlaceholderDari} />
              </label>
              <label>
                {st.footerNotesPashto}
                <textarea dir="rtl" placeholder={st.footerPlaceholderPashto} />
              </label>
            </div>

            <div className="settings-section-title">
              <h3>{st.printConfiguration}</h3>
            </div>

            <div className="settings-form-grid">
              <label>{st.defaultPaperSize}<select defaultValue="A4"><option>A4 (210x297mm)</option><option>{st.thermal80}</option></select></label>
              <label>{st.billingPaperSize}<select defaultValue="Thermal 80mm"><option value="Thermal 80mm">{st.thermal80}</option><option>A5</option></select></label>
              <label>{st.defaultOrientation}<select defaultValue="Portrait"><option value="Portrait">{st.portrait}</option><option value="Landscape">{st.landscape}</option></select></label>
              <label>{st.pageDensity}<select defaultValue="Normal"><option value="Normal">{st.normal}</option><option value="Compact">{st.compact}</option></select></label>
            </div>

            <button type="submit" className="settings-save">
              <Save size={16} />
              {st.savePrinting}
            </button>
          </section>
        </form>
      )}

      {activeTab === "notification-sound" && (
        <form className="settings-card settings-card-single settings-full-width-card" onSubmit={save}>
          <section className="settings-panel settings-full-width-panel settings-sound-panel">
            <div className="settings-section-title">
              <h3>{st.notificationSoundTitle}</h3>
              <p>{st.notificationSoundDescription}</p>
            </div>

            <div className="settings-sound-master">
              <div>
                <Volume2 size={19} />
                <span>
                  <strong>{st.soundEnabled}</strong>
                  <small>{notificationSoundEnabled ? st.soundOn : st.soundOff}</small>
                </span>
              </div>
              <button
                type="button"
                className={notificationSoundEnabled ? "active" : ""}
                onClick={() => setNotificationSoundEnabled((value) => !value)}
                aria-pressed={notificationSoundEnabled}
              >
                <span />
              </button>
            </div>

            <div className="settings-sound-grid">
              {notificationSounds.map((soundName) => {
                const selected = notificationSound === soundName;
                const label = soundName.replace(/\.(mp4|mov)$/i, "").replace(/[-_]/g, " ");
                return (
                  <article className={`settings-sound-card ${selected ? "selected" : ""}`} key={soundName}>
                    <button
                      type="button"
                      className="settings-sound-select"
                      onClick={() => setNotificationSound(soundName)}
                    >
                      <span className="settings-sound-icon"><Volume2 size={18} /></span>
                      <span className="settings-sound-name">
                        <strong>{label}</strong>
                        <small>{soundName}</small>
                      </span>
                      {selected && <span className="settings-sound-selected">{st.selectedSound}</span>}
                    </button>
                    <button
                      type="button"
                      className="settings-sound-test"
                      onClick={() => testNotificationSound(soundName)}
                    >
                      <Play size={14} />
                      {st.testSound}
                    </button>
                  </article>
                );
              })}
            </div>

            <button type="submit" className="settings-save settings-save-full">
              <Save size={16} />
              {st.saveSound}
            </button>
          </section>
        </form>
      )}

      {activeTab === "security" && (
        <form className="settings-card settings-card-single" onSubmit={save}>
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>{st.securityTitle}</h3>
              <p>{st.securityDescription}</p>
            </div>

            <label>
              {st.setPassword}
              <input
                type="password"
                value={securityPassword}
                onChange={(event) => setSecurityPassword(event.target.value)}
                placeholder={st.enterPassword}
              />
            </label>

            <button type="submit" className="settings-save">
              <Save size={16} />
              {st.savePassword}
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
              <h3>{st.themeTitle}</h3>
              <p>{st.themeDescription}</p>
            </div>

            <div className="settings-theme-grid">
              {themeOptions.map((theme) => (
                <button
                  type="button"
                  key={theme.key}
                  className={activeTheme === theme.key ? "active" : ""}
                  onClick={() => selectTheme(theme.key)}
                >
                  <strong>{st.themes[theme.key]?.[0] || theme.key}</strong>
                  <span>{st.themes[theme.key]?.[1] || ""}</span>
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
              <h3>{st.appDataTitle}</h3>
              <p>{st.appDataDescription}</p>
            </div>

            <div className={`settings-environment-status ${IS_DEMO ? "is-demo" : "is-production"}`}>
              <strong>{IS_DEMO ? st.demoEnvironment : st.productionEnvironment}</strong>
              <span>{IS_DEMO ? st.demoEnvironmentDescription : st.productionEnvironmentDescription}</span>
              <code>{APP_MODE}</code>
            </div>

            <div className="settings-data-actions">
              <button type="button" onClick={exportData} disabled={appDataBusy}>
                <Download size={16} />
                {st.exportData}
              </button>

              <label className={appDataBusy ? "disabled" : ""}>
                <Upload size={16} />
                {st.importData}
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
                  <strong>{st.automaticallyBackup}</strong>
                  <span>{st.automaticallyBackupDescription}</span>
                </div>
              </div>

              <label>
                {st.backupSchedule}
                <select
                  value={autoBackupMode}
                  onChange={(event) => setAutoBackupMode(event.target.value)}
                >
                  <option value="off">{st.off}</option>
                  <option value="daily">{st.daily}</option>
                  <option value="weekly">{st.weekly}</option>
                  <option value="monthly">{st.monthly}</option>
                  <option value="custom">{st.custom}</option>
                </select>
              </label>

              {autoBackupMode === "custom" && (
                <label>
                  {st.customIntervalDays}
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
                {st.saveBackupSetting}
              </button>
            </div>

            {IS_DEMO && (
              <div className="settings-clear-zone">
                <div>
                  <Database size={18} />
                  <strong>{st.clearDemoData}</strong>
                  <span>{st.clearDemoInstruction}</span>
                </div>

                <input
                  value={clearConfirm}
                  onChange={(event) => setClearConfirm(event.target.value)}
                  placeholder="CLEAR"
                  disabled={appDataBusy}
                />

                <button type="button" onClick={clearData} disabled={appDataBusy}>
                  <Trash2 size={16} />
                  {st.clearDemoData}
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
              <button type="button" onClick={closeUserModal} aria-label={st.close}><X size={18} /></button>
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
