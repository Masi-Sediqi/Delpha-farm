import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, UserRound } from "lucide-react";
import { notify } from "../utils/notify";
import "./Auth.css";

const languageStorageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const text = {
  en: {
    title: "Choose an Account",
    subtitle: "Select your account to continue.",
    passwordTitle: "Enter Password",
    passwordHint: "Enter the password for the selected account.",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    signIn: "Sign In",
    back: "Choose another account",
    noAccounts: "No active accounts are available.",
    wrongPassword: "The password is incorrect.",
  },
  fa: {
    title: "انتخاب اکانت",
    subtitle: "برای ادامه، اکانت خود را انتخاب کنید.",
    passwordTitle: "پسورد را وارد کنید",
    passwordHint: "پسورد اکانت انتخاب‌شده را وارد کنید.",
    password: "پسورد",
    passwordPlaceholder: "پسورد را وارد کنید",
    signIn: "ورود",
    back: "انتخاب اکانت دیگر",
    noAccounts: "هیچ اکانت فعال موجود نیست.",
    wrongPassword: "پسورد نادرست است.",
  },
  ps: {
    title: "حساب وټاکئ",
    subtitle: "د دوام لپاره خپل حساب وټاکئ.",
    passwordTitle: "پټنوم ولیکئ",
    passwordHint: "د ټاکل شوي حساب پټنوم ولیکئ.",
    password: "پټنوم",
    passwordPlaceholder: "پټنوم ولیکئ",
    signIn: "ننوتل",
    back: "بل حساب وټاکئ",
    noAccounts: "هیڅ فعال حساب نشته.",
    wrongPassword: "پټنوم سم نه دی.",
  },
};

function Login({ accounts = [], onLogin, company }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageStorageKey) || "en");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageStorageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const t = text[language] || text.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const systemName = company.companyName || "APG";
  const systemSubtitle = company.systemSubtitle || "Pharmacy & Medicine Management System";

  const activeAccounts = useMemo(
    () => accounts.filter((account) => String(account.status || "Active").toLowerCase() !== "inactive"),
    [accounts]
  );

  const selectedAccount = activeAccounts.find((account) => String(account.id) === String(selectedAccountId));

  const chooseAccount = async (account) => {
    setPassword("");

    // The built-in default administrator has no stored email/password.
    // Selecting that account opens the system directly. User-created accounts
    // can still keep their own passwords.
    const hasPassword = Boolean(account.password || account.secondaryPassword);
    if (!hasPassword) {
      await onLogin(account);
      return;
    }

    setSelectedAccountId(String(account.id));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedAccount) return;
    if (!password) {
      notify(t.passwordPlaceholder, "error");
      return;
    }
    const matches = selectedAccount.password === password || selectedAccount.secondaryPassword === password;
    if (!matches) {
      notify(t.wrongPassword, "error");
      return;
    }
    await onLogin(selectedAccount);
  };

  return (
    <div className="auth-page" dir={direction}>
      <div className="auth-brand-panel">
        <div className="auth-logo">
          {company.logo ? <img src={company.logo} alt={`${systemName} logo`} /> : systemName.slice(0, 1)}
        </div>
        <h1>{systemName}</h1>
        <p>{systemSubtitle}</p>
      </div>

      <div className="auth-form-panel">
        {!selectedAccount ? (
          <section className="auth-card auth-account-card">
            <div className="auth-card-icon"><UserRound /></div>
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>

            <div className="auth-account-list">
              {activeAccounts.map((account) => (
                <button type="button" className="auth-account-item" key={account.id} onClick={() => chooseAccount(account)}>
                  <span className="auth-account-avatar">{(account.fullName || account.email || "U").slice(0, 1).toUpperCase()}</span>
                  <span className="auth-account-copy">
                    <strong>{account.fullName || account.email}</strong>
                    <small>{account.email || account.username || ""}</small>
                  </span>
                  <span className="auth-account-check"><Check size={16} /></span>
                </button>
              ))}
              {activeAccounts.length === 0 && <div className="auth-empty-accounts">{t.noAccounts}</div>}
            </div>
          </section>
        ) : (
          <form className="auth-card auth-password-card" onSubmit={submit} noValidate>
            <button type="button" className="auth-back-account" onClick={() => { setSelectedAccountId(""); setPassword(""); }}>
              <ArrowLeft size={16} /> {t.back}
            </button>

            <div className="auth-selected-user">
              <span className="auth-account-avatar large">{(selectedAccount.fullName || selectedAccount.email || "U").slice(0, 1).toUpperCase()}</span>
              <div><strong>{selectedAccount.fullName || selectedAccount.email}</strong><small>{selectedAccount.email || selectedAccount.username || ""}</small></div>
            </div>

            <div className="auth-card-icon"><LockKeyhole /></div>
            <h2>{t.passwordTitle}</h2>
            <p>{t.passwordHint}</p>

            <label>
              {t.password}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordPlaceholder} autoComplete="current-password" autoFocus />
            </label>
            <button type="submit">{t.signIn}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
