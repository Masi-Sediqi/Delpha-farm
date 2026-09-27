import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { notify } from "../utils/notify";
import "./Auth.css";

const languageStorageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const text = {
  en: { eyebrow: "Secure access", title: "Sign in to your account", subtitle: "Enter the email and password assigned to you by the administrator.", email: "Email", emailPlaceholder: "name@example.com", password: "Password", passwordPlaceholder: "Enter your password", confirmPassword: "Confirm password", confirmPlaceholder: "Enter your password again", signIn: "Sign In", required: "Complete all login fields.", mismatch: "The passwords do not match.", invalid: "The email or password is incorrect." },
  fa: { eyebrow: "ورود امن", title: "ورود به حساب کاربری", subtitle: "ایمیل و پسوردی را که مدیر سیستم برای‌تان تعیین کرده وارد کنید.", email: "ایمیل", emailPlaceholder: "name@example.com", password: "پسورد", passwordPlaceholder: "پسورد را وارد کنید", confirmPassword: "تکرار پسورد", confirmPlaceholder: "پسورد را دوباره وارد کنید", signIn: "ورود به سیستم", required: "تمام فیلدهای ورود را تکمیل کنید.", mismatch: "پسورد و تکرار آن یکسان نیست.", invalid: "ایمیل یا پسورد نادرست است." },
  ps: { eyebrow: "خوندي ننوتل", title: "خپل حساب ته ننوتل", subtitle: "هغه برېښنالیک او پټنوم ولیکئ چې مدیر درته ټاکلی دی.", email: "برېښنالیک", emailPlaceholder: "name@example.com", password: "پټنوم", passwordPlaceholder: "پټنوم ولیکئ", confirmPassword: "پټنوم بیا ولیکئ", confirmPlaceholder: "پټنوم بیا داخل کړئ", signIn: "سیسټم ته ننوتل", required: "د ننوتلو ټولې برخې بشپړې کړئ.", mismatch: "دواړه پټنومونه یو شان نه دي.", invalid: "برېښنالیک یا پټنوم ناسم دی." },
};

function Login({ accounts = [], onLogin, company }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageStorageKey) || "en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
  const activeAccounts = useMemo(() => accounts.filter((account) => String(account.status || "Active").toLowerCase() !== "inactive"), [accounts]);

  const submit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !confirmPassword) {
      notify(t.required, "error");
      return;
    }
    if (password !== confirmPassword) {
      notify(t.mismatch, "error");
      return;
    }
    const account = activeAccounts.find((item) =>
      String(item.email || item.username || "").trim().toLowerCase() === normalizedEmail
    );
    const passwordMatches = account && (account.password === password || account.secondaryPassword === password);
    if (!passwordMatches) {
      notify(t.invalid, "error");
      return;
    }
    await onLogin(account);
  };

  return (
    <main className="auth-page" dir={direction}>
      <section className="auth-brand-panel" aria-label={systemName}>
        <div className="auth-brand-content">
          <div className="auth-logo">{company.logo ? <img src={company.logo} alt={`${systemName} logo`} /> : systemName.slice(0, 1)}</div>
          <h1>{systemName}</h1>
          <p>{systemSubtitle}</p>
        </div>
        <div className="auth-brand-mark" aria-hidden="true">{systemName.slice(0, 1)}</div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card auth-login-card" onSubmit={submit} noValidate>
          <div className="auth-card-icon"><LockKeyhole size={23} /></div>
          <span className="auth-eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
          <label><span>{t.email}</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} autoComplete="username" autoFocus /></span></label>
          <label><span>{t.password}</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordPlaceholder} autoComplete="current-password" /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <label><span>{t.confirmPassword}</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t.confirmPlaceholder} autoComplete="current-password" /></span></label>
          <button type="submit" className="auth-submit"><LogIn size={18} />{t.signIn}</button>
        </form>
      </section>
    </main>
  );
}

export default Login;
