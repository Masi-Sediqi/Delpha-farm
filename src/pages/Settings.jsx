import { useEffect, useState } from "react";
import axios from "axios";
import {
  Banknote,
  Building2,
  Database,
  Download,
  LockKeyhole,
  Image,
  Palette,
  Printer,
  Save,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { apiUrl } from "../utils/api";
import { downloadBackup, loadBackupCollectionNames } from "../utils/backup";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import "./Settings.css";

const defaultSystemName = "ISP Assets";
const defaultSystemSubtitle = "Asset & Inventory Management";
const themeStorageKey = "afghan-power-theme";
const themeOptions = [
  {
    key: "minimalism",
    title: "Minimalism",
    description: "Clean, focused, distraction-free",
  },
  {
    key: "clay-minimalism",
    title: "Clay Minimalism",
    description: "Soft, rounded, clay-style depth",
  },
  {
    key: "glassmorphism",
    title: "Glassmorphism",
    description: "Frosted glass with blur & transparency",
  },
  {
    key: "black-white",
    title: "Black & White",
    description: "Pure black & white high contrast",
  },
  {
    key: "neon",
    title: "Neon",
    description: "Dark with vivid neon accents",
  },
];

function applyTheme(theme) {
  localStorage.setItem(themeStorageKey, theme);
  document.body.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("dark-mode", ["black-white", "neon"].includes(theme));
  window.dispatchEvent(new Event("app-theme-updated"));
}

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};

  const [activeTab, setActiveTab] = useState("identity");
  const [companyName, setCompanyName] = useState(defaultSystemName);
  const [systemSubtitle, setSystemSubtitle] = useState(defaultSystemSubtitle);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [securityPassword, setSecurityPassword] = useState("");
  const [logo, setLogo] = useState("");
  const [autoBackupMode, setAutoBackupMode] = useState("off");
  const [autoBackupCustomDays, setAutoBackupCustomDays] = useState("7");
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem(themeStorageKey) || "minimalism"
  );
  const [appDataBusy, setAppDataBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");

  useEffect(() => {
    setCompanyName(current.companyName || defaultSystemName);
    setSystemSubtitle(current.systemSubtitle || defaultSystemSubtitle);
    setCompanyAddress(current.companyAddress || "");
    setCompanyPhone(current.companyPhone || "");
    setCurrency(current.currency || "AFN");
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
    current.securityPassword,
    current.systemSubtitle,
    current.logo,
  ]);

  const selectTheme = (theme) => {
    setActiveTheme(theme);
    applyTheme(theme);
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
        securityPassword,
        logo,
        autoBackupMode,
        autoBackupCustomDays: Math.max(Number(autoBackupCustomDays || 7), 1),
        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;

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
        importable.map((name) => axios.put(apiUrl(name), data[name]))
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
      await Promise.all(collections.map((name) => axios.put(apiUrl(name), [])));
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
          کمپنی
        </button>
        <button
          type="button"
          className={activeTab === "currency" ? "active" : ""}
          onClick={() => setActiveTab("currency")}
        >
          <Banknote size={16} />
          واحد پول
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
          Users
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
                <h3>کمپنی</h3>
                <p>Company information used across receipts, reports, login and print layouts.</p>
              </div>

              <div className="settings-form-grid">
                <label>
                  نام کمپنی
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
                  آدرس
                  <input
                    value={companyAddress}
                    onChange={(event) => setCompanyAddress(event.target.value)}
                    placeholder="Kabul, Afghanistan"
                  />
                </label>

                <label>
                  شماره تماس
                  <input
                    value={companyPhone}
                    onChange={(event) => setCompanyPhone(event.target.value)}
                    placeholder="+93 700 000 000"
                  />
                </label>

                <label>
                  لوگو کمپنی
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
        <form className="settings-card settings-card-single" onSubmit={save}>
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>واحد پول</h3>
              <p>Select the default currency used in billing, sales, reports and print views.</p>
            </div>

            <div className="settings-choice-grid">
              {[
                { key: "AFN", title: "افغانی", description: "Afghan Afghani" },
                { key: "USD", title: "دالر", description: "US Dollar" },
                { key: "INR", title: "کلدار هندی", description: "Indian Rupee" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={currency === item.key ? "active" : ""}
                  onClick={() => setCurrency(item.key)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Currency
            </button>
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
        <div className="settings-data-card">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>Users</h3>
              <p>Open user management to add users, roles and permissions.</p>
            </div>
            <a className="settings-link-button" href="#/user-management">
              <Users size={16} />
              Open Users
            </a>
          </section>
        </div>
      )}

      {activeTab === "theme" && (
        <div className="settings-theme-card">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>Theme Settings</h3>
              <p>Select one of the five available interface themes.</p>
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

            <div className="settings-clear-zone">
              <div>
                <Database size={18} />
                <strong>Clear Data</strong>
                <span>Type CLEAR, then press Clear Data.</span>
              </div>

              <input
                value={clearConfirm}
                onChange={(event) => setClearConfirm(event.target.value)}
                placeholder="CLEAR"
                disabled={appDataBusy}
              />

              <button type="button" onClick={clearData} disabled={appDataBusy}>
                <Trash2 size={16} />
                Clear Data
              </button>
            </div>
          </section>
        </div>
      )}
      </div>
    </div>
  );
}

export default Settings;


