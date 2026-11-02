import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, UserRoundPlus } from "lucide-react";
import { notify } from "../utils/notify";
import "./Auth.css";

const languageStorageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const text = {
  en: {
    eyebrow: "Secure access", title: "Sign in to your account", subtitle: "Enter the email and password assigned to you by the administrator.",
    setupEyebrow: "First-time setup", setupTitle: "Create the system administrator", setupSubtitle: "Create the first full administrator account. All data will remain on the central PostgreSQL server.",
    fullName: "Full name", fullNamePlaceholder: "Administrator name", email: "Email", emailPlaceholder: "name@example.com", password: "Password", passwordPlaceholder: "Enter your password", confirmPassword: "Confirm password", confirmPlaceholder: "Enter your password again", signIn: "Sign In", createAdmin: "Create Administrator", required: "Complete all required fields.", mismatch: "The passwords do not match.", passwordLength: "Password must be at least 12 characters.", invalid: "The email or password is incorrect.", setupFailed: "Administrator setup failed."
  },
  fa: {
    eyebrow: "ورود امن", title: "ورود به حساب کاربری", subtitle: "ایمیل و پسوردی را که مدیر سیستم برای‌تان تعیین کرده وارد کنید.",
    setupEyebrow: "راه‌اندازی اولیه", setupTitle: "ساخت مدیر اصلی سیستم", setupSubtitle: "اولین حساب مدیر کامل را بسازید. تمام اطلاعات در سرور مرکزی PostgreSQL ذخیره می‌شود.",
    fullName: "نام کامل", fullNamePlaceholder: "نام مدیر سیستم", email: "ایمیل", emailPlaceholder: "name@example.com", password: "پسورد", passwordPlaceholder: "پسورد را وارد کنید", confirmPassword: "تکرار پسورد", confirmPlaceholder: "پسورد را دوباره وارد کنید", signIn: "ورود به سیستم", createAdmin: "ساخت مدیر سیستم", required: "تمام فیلدهای ضروری را تکمیل کنید.", mismatch: "پسورد و تکرار آن یکسان نیست.", passwordLength: "پسورد باید حداقل ۱۲ کاراکتر باشد.", invalid: "ایمیل یا پسورد نادرست است.", setupFailed: "ساخت مدیر سیستم انجام نشد."
  },
  ps: {
    eyebrow: "خوندي ننوتل", title: "خپل حساب ته ننوتل", subtitle: "هغه برېښنالیک او پټنوم ولیکئ چې مدیر درته ټاکلی دی.",
    setupEyebrow: "لومړنی تنظیم", setupTitle: "د سیسټم اصلي مدیر جوړول", setupSubtitle: "لومړی بشپړ مدیر حساب جوړ کړئ. ټول معلومات په مرکزي PostgreSQL سرور کې ساتل کېږي.",
    fullName: "بشپړ نوم", fullNamePlaceholder: "د مدیر نوم", email: "برېښنالیک", emailPlaceholder: "name@example.com", password: "پټنوم", passwordPlaceholder: "پټنوم ولیکئ", confirmPassword: "پټنوم بیا ولیکئ", confirmPlaceholder: "پټنوم بیا داخل کړئ", signIn: "سیسټم ته ننوتل", createAdmin: "مدیر جوړول", required: "ټولې اړینې برخې بشپړې کړئ.", mismatch: "دواړه پټنومونه یو شان نه دي.", passwordLength: "پټنوم باید لږ تر لږه ۱۲ توري ولري.", invalid: "برېښنالیک یا پټنوم ناسم دی.", setupFailed: "د مدیر جوړول ناکام شول."
  },
};

function Login({ accounts = [], onLogin, company, isDemo = false, setupRequired = false }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageStorageKey) || "en");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || (setupRequired && !fullName.trim())) {
      notify(t.required, "error");
      return;
    }
    if (setupRequired && password.length < 12) {
      notify(t.passwordLength, "error");
      return;
    }
    if (setupRequired && password !== confirmPassword) {
      notify(t.mismatch, "error");
      return;
    }

    setSubmitting(true);
    try {
      if (isDemo) {
        const account = accounts.find((item) => String(item.email || item.username || "").trim().toLowerCase() === normalizedEmail && item.password === password && String(item.status || "Active").toLowerCase() === "active");
        if (!account) { notify(t.invalid, "error"); return; }
        await onLogin(account);
        return;
      }

      const endpoint = setupRequired ? "/api/auth/setup" : "/api/auth/login";
      const body = setupRequired
        ? { fullName: fullName.trim(), email: normalizedEmail, password }
        : { email: normalizedEmail, password };
      const response = await fetch(endpoint, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        notify(data.error || (setupRequired ? t.setupFailed : t.invalid), "error");
        return;
      }
      if (!data.user) throw new Error("Invalid server response");
      await onLogin(data.user);
    } catch (error) {
      console.error(setupRequired ? "Administrator setup failed:" : "Login failed:", error);
      notify(setupRequired ? t.setupFailed : "Cannot connect to the authentication server.", "error");
    } finally {
      setSubmitting(false);
    }
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
          <div className="auth-card-icon">{setupRequired ? <UserRoundPlus size={23} /> : <LockKeyhole size={23} />}</div>
          <span className="auth-eyebrow">{setupRequired ? t.setupEyebrow : t.eyebrow}</span>
          <h2>{setupRequired ? t.setupTitle : t.title}</h2>
          <p>{setupRequired ? t.setupSubtitle : t.subtitle}</p>
          {setupRequired && <label><span>{t.fullName}</span><span className="auth-input-wrap"><UserRoundPlus size={17} /><input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t.fullNamePlaceholder} autoComplete="name" autoFocus /></span></label>}
          <label><span>{t.email}</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} autoComplete="username" autoFocus={!setupRequired} /></span></label>
          <label><span>{t.password}</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordPlaceholder} autoComplete={setupRequired ? "new-password" : "current-password"} /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {setupRequired && <label><span>{t.confirmPassword}</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t.confirmPlaceholder} autoComplete="new-password" /></span></label>}
          <button type="submit" className="auth-submit" disabled={submitting}><LogIn size={18} />{setupRequired ? t.createAdmin : t.signIn}</button>
        </form>
      </section>
    </main>
  );
}

export default Login;
