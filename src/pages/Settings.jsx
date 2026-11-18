import { exchangeCurrencies, exchangeRate, updateExchangePair } from "../utils/exchangeRates";

import { useEffect,  useState } from "react";

import {
  Banknote,
  Building2,

  Image,

  Save,
  Trash2,

} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";

import { notify } from "../utils/notify";
import "./Settings.css";

const defaultSystemName = "APG";
const defaultSystemSubtitle = "Pharmacy & Medicine Management System";
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

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};

  const fontChoices = [
    { value: 'system', label: 'System / پیش‌فرض' },
    { value: 'tahoma', label: 'Tahoma / تاهوما' },
    { value: 'segoe', label: 'Segoe UI' },
    { value: 'arial', label: 'Arial' },
  ];
  const fontFamilyMap = { system: 'inherit', tahoma: 'Tahoma, Arial, sans-serif', segoe: '"Segoe UI", Arial, sans-serif', arial: 'Arial, sans-serif' };
  const [uiFont, setUiFont] = useState(() => localStorage.getItem('delpha-ui-font') || 'system');
  const [uiFontSize, setUiFontSize] = useState(() => Number(localStorage.getItem('delpha-ui-font-scale') || 100));
  useEffect(() => {
    const family = fontFamilyMap[uiFont] || 'inherit';
    const scale = Math.max(85, Math.min(125, uiFontSize || 100));
    document.documentElement.style.setProperty('--delpha-user-font', family);
    document.documentElement.style.zoom = `${scale}%`;
    localStorage.setItem('delpha-ui-font', uiFont);
    localStorage.setItem('delpha-ui-font-scale', String(scale));
  }, [uiFont, uiFontSize]);
  const [activeTab, setActiveTab] = useState("identity");
  const [companyName, setCompanyName] = useState(defaultSystemName);
  const [systemSubtitle, setSystemSubtitle] = useState(defaultSystemSubtitle);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [exchangeRates, setExchangeRates] = useState({ USD: "", EUR: "", INR: "" });
  const [rateFrom, setRateFrom] = useState("EUR");
  const [rateTo, setRateTo] = useState("USD");
  const [pairValue, setPairValue] = useState("");
  const rateText = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 8 });
  const applyPair = () => {
    try {
      setExchangeRates(updateExchangePair(exchangeRates, rateFrom, rateTo, pairValue));
      setPairValue("");
    } catch (error) {
      notify(error.message === "missing-base-rate"
        ? (language === "en" ? "First enter the AFN rate for either selected currency." : "ابتدا نرخ یکی از دو ارز انتخاب‌شده را در مقابل افغانی وارد کنید.")
        : (language === "en" ? "Enter a positive rate and select two different currencies." : "دو ارز متفاوت و نرخ بزرگ‌تر از صفر انتخاب کنید."), "warning");
    }
  };
  const [currencyDecimals, setCurrencyDecimals] = useState({
    AFN: 2,
    USD: 2,
    EUR: 2,
    PKR: 2,
  });
  const [logo, setLogo] = useState("");
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
      pageTitle: "Settings",
      pageDescription: "Choose the system name, logo, and global values used across the app.",
      decimalsTab: "Currency Decimals",
      decimalsTitle: "Currency Decimal Places",
      decimalsDescription: "Set how many digits after the decimal point are allowed for each currency.",
      afn: "Afghani", usd: "US Dollar", eur: "Euro", pkr: "Pakistani Rupee",
      decimalPlaces: "Decimal places", preview: "Preview", saveDecimals: "Save Decimal Settings",
      exchangeRateTitle: "Exchange Rates Against Afghani", exchangeRateDescription: "Enter how many Afghanis equal one unit of each foreign currency.",
      usdRate: "US Dollar", eurRate: "Euro", inrRate: "Indian Rupee", oneUnit: "1 {code} =", afnUnit: "AFN", saveExchangeRates: "Save Exchange Rates",

      companyDescription: "Company information used across receipts, reports, login and print layouts.", subTitle: "Sub Title", companyAddressPlaceholder: "Kabul, Afghanistan", removeLogo: "Remove Logo", saveSettings: "Save Settings", logoPreviewAlt: "System logo preview", companyAddressFallback: "Company address",

       invalidLogo: "Please select an image file for the logo.", settingsSaved: "System settings saved successfully.",
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

      companyDescription: "معلومات کمپنی که در رسیدها، گزارش‌ها، صفحه ورود و قالب‌های چاپ استفاده می‌شود.", subTitle: "عنوان فرعی", companyAddressPlaceholder: "کابل، افغانستان", removeLogo: "حذف لوگو", saveSettings: "ذخیره تنظیمات", logoPreviewAlt: "پیش‌نمایش لوگوی سیستم", companyAddressFallback: "آدرس کمپنی",

       invalidLogo: "لطفاً یک فایل تصویری برای لوگو انتخاب کنید.", settingsSaved: "تنظیمات سیستم با موفقیت ذخیره شد.",
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

      companyDescription: "د شرکت هغه معلومات چې په رسیدونو، راپورونو، ننوتلو او چاپي بڼو کې کارېږي.", subTitle: "فرعي سرلیک", companyAddressPlaceholder: "کابل، افغانستان", removeLogo: "لوګو لرې کړئ", saveSettings: "تنظیمات خوندي کړئ", logoPreviewAlt: "د سیسټم لوګو مخکتنه", companyAddressFallback: "د شرکت پته",

       invalidLogo: "مهرباني وکړئ د لوګو لپاره انځوریز فایل وټاکئ.", settingsSaved: "د سیسټم تنظیمات په بریالیتوب خوندي شول.",
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
      USD: Number(current.exchangeRates?.USD) > 0 ? current.exchangeRates.USD : "",
      EUR: Number(current.exchangeRates?.EUR) > 0 ? current.exchangeRates.EUR : "",
      INR: Number(current.exchangeRates?.INR) > 0 ? current.exchangeRates.INR : "",
    });
    setCurrencyDecimals({
      AFN: Number.isInteger(Number(current.currencyDecimals?.AFN)) ? Number(current.currencyDecimals.AFN) : 2,
      USD: Number.isInteger(Number(current.currencyDecimals?.USD)) ? Number(current.currencyDecimals.USD) : 2,
      EUR: Number.isInteger(Number(current.currencyDecimals?.EUR)) ? Number(current.currencyDecimals.EUR) : 2,
      PKR: Number.isInteger(Number(current.currencyDecimals?.PKR)) ? Number(current.currencyDecimals.PKR) : 2,
    });

    setLogo(current.logo || "");

  }, [

    current.companyName,
    current.companyAddress,
    current.companyPhone,
    current.currency,
    current.exchangeRates,
    current.currencyDecimals,

    current.systemSubtitle,
    current.logo,

  ]);

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

    let ratesToSave = exchangeRates;
    if (activeTab === "currency" && pairValue.trim()) {
      try {
        ratesToSave = updateExchangePair(exchangeRates, rateFrom, rateTo, pairValue);
      } catch {
        notify(language === "en" ? "Enter a valid rate; first set the AFN rate for either currency." : "نرخ معتبر وارد کنید؛ ابتدا نرخ یکی از دو ارز را در مقابل افغانی مشخص کنید.", "warning");
        return;
      }
    }
    if (Object.values(ratesToSave).some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) <= 0))) {
      notify(language === "en" ? "Exchange rates must be greater than zero." : "نرخ اسعار باید بزرگ‌تر از صفر باشد.", "warning");
      return;
    }
    const nextSettings = [
      {
        ...current,
        companyName: companyName.trim() || defaultSystemName,
        systemSubtitle: systemSubtitle.trim() || defaultSystemSubtitle,
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        currency,
        exchangeRates: {
          USD: Number(ratesToSave.USD || 0),
          EUR: Number(ratesToSave.EUR || 0),
          INR: Number(ratesToSave.INR || 0),
        },
        currencyDecimals,

        logo,

        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;
    if (activeTab === "currency") setPairValue("");

    applyCompanyThemeIdentity(nextSettings[0].companyName);
    window.dispatchEvent(new Event("company-settings-updated"));
    notify(st.settingsSaved, "success");
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

        <button type="button" className={activeTab === "typography" ? "active" : ""} onClick={() => setActiveTab("typography")}>
          {language === 'fa' ? 'فونت و اندازه' : language === 'ps' ? 'فونټ او اندازه' : 'Font & Size'}
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
                      step="any"
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
                  <output className="settings-inverse-rate" dir="ltr">{Number(exchangeRates[item.key]) > 0 ? `1 AFN = ${rateText(exchangeRate(exchangeRates, "AFN", item.key))} ${item.key}` : "—"}</output>
                </label>
              ))}
            </div>

            <section className="settings-pair-rate">
              <h3>{language === "en" ? "Exchange rate between currencies" : "نرخ تبدیل بین اسعار"}</h3>
              <div className="settings-pair-controls">
                <label>{language === "en" ? "From" : "از"}<select value={rateFrom} onChange={(e) => { setRateFrom(e.target.value); setPairValue(""); }}>{exchangeCurrencies.map((code) => <option key={code}>{code}</option>)}</select></label>
                <label>{language === "en" ? "To" : "به"}<select value={rateTo} onChange={(e) => { setRateTo(e.target.value); setPairValue(""); }}>{exchangeCurrencies.map((code) => <option key={code}>{code}</option>)}</select></label>
                <label>{language === "en" ? "Rate for 1 unit" : "معادل یک واحد"}<input type="number" step="any" min="0" value={pairValue} placeholder={exchangeRate(exchangeRates, rateFrom, rateTo) ? rateText(exchangeRate(exchangeRates, rateFrom, rateTo)) : "—"} onChange={(e) => setPairValue(e.target.value)} /></label>
                <button type="button" className="settings-save" onClick={applyPair}>{language === "en" ? "Apply rate" : "اعمال نرخ"}</button>
              </div>
              <output dir="ltr">{exchangeRate(exchangeRates, rateFrom, rateTo) ? `1 ${rateFrom} = ${rateText(exchangeRate(exchangeRates, rateFrom, rateTo))} ${rateTo} · 1 ${rateTo} = ${rateText(exchangeRate(exchangeRates, rateTo, rateFrom))} ${rateFrom}` : "—"}</output>
            </section>
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

      {activeTab === "typography" && (
        <section className="settings-card settings-card-flat settings-font-panel">
          <h2>{language === 'fa' ? 'تنظیمات فونت سیستم' : language === 'ps' ? 'د سیسټم فونټ تنظیمات' : 'System Typography'}</h2>
          <p>{language === 'fa' ? 'نوع و اندازه فونت را انتخاب کنید. تغییرات فوراً در تمام صفحات اعمال می‌شود.' : language === 'ps' ? 'فونټ او اندازه وټاکئ. بدلونونه سمدستي پلي کېږي.' : 'Select the font family and size. Changes apply instantly across the app.'}</p>
          <div className="settings-font-controls">
            <label><span>{language === 'fa' ? 'نوع فونت' : language === 'ps' ? 'د فونټ ډول' : 'Font family'}</span>
              <select value={uiFont} onChange={(event) => setUiFont(event.target.value)}>
                {fontChoices.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label><span>{language === 'fa' ? 'اندازه فونت' : language === 'ps' ? 'د فونټ اندازه' : 'Font size'}: {uiFontSize}%</span>
              <input type="range" min="85" max="125" step="5" value={uiFontSize} onChange={(event) => setUiFontSize(Number(event.target.value))} />
            </label>
          </div>
          <div className="settings-font-preview">{language === 'fa' ? 'پیش‌نمایش: نام جنس، کمپنی، تعداد کارتن و قیمت فروش' : language === 'ps' ? 'بېلګه: د توکي نوم، شرکت، شمېر او بیه' : 'Preview: Product, Company, Cartons and Sale Price'}</div>
          <button type="button" onClick={() => {setUiFont('system');setUiFontSize(100);}}>{language === 'fa' ? 'بازگشت به پیش‌فرض' : language === 'ps' ? 'اصلي حالت ته ستنېدل' : 'Reset to defaults'}</button>
        </section>
      )}

      </div>

    </div>
  );
}

export default Settings;
