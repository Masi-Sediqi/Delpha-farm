import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Edit3, Mail, Search, ShieldCheck, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import { todayDateValue } from "../utils/afghanDate";
import "./Accounts.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    title: "Accounts",
    subtitle: "Create and manage system login accounts.",
    addAccount: "Add Account",
    totalAccounts: "Total Accounts",
    activeAccounts: "Active Accounts",
    search: "Search username or email...",
    username: "User Name",
    email: "Email",
    password: "Password",
    rePassword: "Re-enter Password",
    newPassword: "New Password (optional)",
    reNewPassword: "Re-enter New Password",
    status: "Status",
    role: "Role",
    created: "Created",
    actions: "Actions",
    active: "Active",
    administrator: "Administrator",
    noAccounts: "No accounts have been registered yet.",
    createTitle: "Create New Account",
    editTitle: "Edit Account",
    formHint: "This account can be used from the login screen after logout.",
    usernamePlaceholder: "Enter user name",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "Enter password",
    rePasswordPlaceholder: "Enter password again",
    cancel: "Cancel",
    save: "Save Account",
    update: "Save Changes",
    requiredUsername: "Please enter a user name.",
    requiredEmail: "Please enter an email address.",
    invalidEmail: "Please enter a valid email address.",
    requiredPassword: "Please enter a password.",
    shortPassword: "Password must be at least 4 characters.",
    mismatch: "The passwords do not match.",
    duplicateEmail: "This email is already used by another account.",
    duplicateUsername: "This user name is already used by another account.",
    saved: "Account created successfully.",
    updated: "Account updated successfully.",
    deleted: "Account deleted successfully.",
    deleteTitle: "Delete Account",
    deleteMessage: "Are you sure you want to delete this account?",
    delete: "Delete",
    cannotDeleteCurrent: "You cannot delete the account currently in use.",
  },
  fa: {
    title: "اکونت‌ها",
    subtitle: "اکونت‌های ورود به سیستم را ثبت و مدیریت کنید.",
    addAccount: "افزودن اکونت",
    totalAccounts: "مجموع اکونت‌ها",
    activeAccounts: "اکونت‌های فعال",
    search: "جستجوی نام کاربری یا ایمیل...",
    username: "نام کاربری",
    email: "ایمیل",
    password: "پسورد",
    rePassword: "تکرار پسورد",
    newPassword: "پسورد جدید (اختیاری)",
    reNewPassword: "تکرار پسورد جدید",
    status: "وضعیت",
    role: "صلاحیت",
    created: "تاریخ ثبت",
    actions: "عملیات",
    active: "فعال",
    administrator: "مدیر سیستم",
    noAccounts: "هنوز هیچ اکونتی ثبت نشده است.",
    createTitle: "ثبت اکونت جدید",
    editTitle: "ویرایش اکونت",
    formHint: "بعد از خروج از سیستم می‌توانید با این اکونت وارد شوید.",
    usernamePlaceholder: "نام کاربری را وارد کنید",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "پسورد را وارد کنید",
    rePasswordPlaceholder: "پسورد را دوباره وارد کنید",
    cancel: "لغو",
    save: "ذخیره اکونت",
    update: "ثبت تغییرات",
    requiredUsername: "لطفاً نام کاربری را وارد کنید.",
    requiredEmail: "لطفاً ایمیل را وارد کنید.",
    invalidEmail: "لطفاً یک ایمیل معتبر وارد کنید.",
    requiredPassword: "لطفاً پسورد را وارد کنید.",
    shortPassword: "پسورد باید حداقل ۴ کاراکتر باشد.",
    mismatch: "پسورد و تکرار پسورد یکسان نیست.",
    duplicateEmail: "این ایمیل قبلاً برای یک اکونت دیگر استفاده شده است.",
    duplicateUsername: "این نام کاربری قبلاً استفاده شده است.",
    saved: "اکونت با موفقیت ثبت شد.",
    updated: "اکونت با موفقیت ویرایش شد.",
    deleted: "اکونت با موفقیت حذف شد.",
    deleteTitle: "حذف اکونت",
    deleteMessage: "آیا از حذف این اکونت مطمئن هستید؟",
    delete: "حذف",
    cannotDeleteCurrent: "اکونتی را که فعلاً با آن وارد شده‌اید نمی‌توانید حذف کنید.",
  },
  ps: {
    title: "اکونټونه",
    subtitle: "سیسټم ته د ننوتلو اکونټونه ثبت او مدیریت کړئ.",
    addAccount: "اکونټ اضافه کړئ",
    totalAccounts: "ټول اکونټونه",
    activeAccounts: "فعال اکونټونه",
    search: "د کارن نوم یا ایمیل ولټوئ...",
    username: "د کارن نوم",
    email: "برېښنالیک",
    password: "پټنوم",
    rePassword: "پټنوم بیا ولیکئ",
    newPassword: "نوی پټنوم (اختیاري)",
    reNewPassword: "نوی پټنوم بیا ولیکئ",
    status: "حالت",
    role: "صلاحیت",
    created: "د ثبت نېټه",
    actions: "عملیات",
    active: "فعال",
    administrator: "د سیستم مدیر",
    noAccounts: "تر اوسه هېڅ اکونټ نه دی ثبت شوی.",
    createTitle: "نوی اکونټ ثبت کړئ",
    editTitle: "اکونټ سمول",
    formHint: "له سیسټم څخه تر وتلو وروسته په دې اکونټ ننوتلی شئ.",
    usernamePlaceholder: "د کارن نوم ولیکئ",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "پټنوم ولیکئ",
    rePasswordPlaceholder: "پټنوم بیا ولیکئ",
    cancel: "لغوه",
    save: "اکونټ ذخیره کړئ",
    update: "بدلونونه ذخیره کړئ",
    requiredUsername: "مهرباني وکړئ د کارن نوم ولیکئ.",
    requiredEmail: "مهرباني وکړئ برېښنالیک ولیکئ.",
    invalidEmail: "مهرباني وکړئ سم برېښنالیک ولیکئ.",
    requiredPassword: "مهرباني وکړئ پټنوم ولیکئ.",
    shortPassword: "پټنوم باید لږ تر لږه ۴ توري ولري.",
    mismatch: "پټنومونه یو شان نه دي.",
    duplicateEmail: "دا برېښنالیک د بل اکونټ لپاره کارول شوی دی.",
    duplicateUsername: "دا د کارن نوم مخکې کارول شوی دی.",
    saved: "اکونټ په بریالیتوب ثبت شو.",
    updated: "اکونټ په بریالیتوب بدل شو.",
    deleted: "اکونټ په بریالیتوب حذف شو.",
    deleteTitle: "اکونټ حذف کړئ",
    deleteMessage: "ایا ډاډه یاست چې دا اکونټ حذف کړئ؟",
    delete: "حذف",
    cannotDeleteCurrent: "هغه اکونټ چې اوس ورسره ننوتلي یاست نشئ حذف کولی.",
  },
};

const emptyForm = { username: "", email: "", password: "", confirmPassword: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Accounts({ accounts = [], setAccounts, currentUser }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("app-modal-open", showModal);
    return () => document.body.classList.remove("app-modal-open");
  }, [showModal]);

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const activeCount = accounts.filter((item) => String(item.status || "Active").toLowerCase() !== "inactive").length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) =>
      [account.username, account.fullName, account.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [accounts, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (account) => {
    setEditId(account.id);
    setForm({
      username: account.username || account.fullName || "",
      email: account.email || "",
      password: "",
      confirmPassword: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();

    if (!username) return notify(t.requiredUsername, "error");
    if (!email) return notify(t.requiredEmail, "error");
    if (!emailPattern.test(email)) return notify(t.invalidEmail, "error");
    if (!editId && !form.password) return notify(t.requiredPassword, "error");
    if (form.password && form.password.length < 4) return notify(t.shortPassword, "error");
    if (form.password !== form.confirmPassword) return notify(t.mismatch, "error");

    const duplicateUsername = accounts.some(
      (item) => String(item.id) !== String(editId) && String(item.username || item.fullName || "").trim().toLowerCase() === username.toLowerCase()
    );
    if (duplicateUsername) return notify(t.duplicateUsername, "error");

    const duplicateEmail = accounts.some(
      (item) => String(item.id) !== String(editId) && String(item.email || "").trim().toLowerCase() === email
    );
    if (duplicateEmail) return notify(t.duplicateEmail, "error");

    let nextAccounts;
    if (editId) {
      nextAccounts = accounts.map((item) =>
        String(item.id) === String(editId)
          ? {
              ...item,
              username,
              fullName: username,
              email,
              ...(form.password ? { password: form.password } : {}),
              status: item.status || "Active",
              role: item.role || "Admin",
              updatedAt: new Date().toISOString(),
            }
          : item
      );
    } else {
      nextAccounts = [
        ...accounts,
        {
          id: `ACC-${Date.now()}`,
          username,
          fullName: username,
          email,
          password: form.password,
          secondaryPassword: "",
          role: "Admin",
          status: "Active",
          permissions: {},
          createdAt: todayDateValue(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const saved = await setAccounts(nextAccounts);
    if (!saved) return;
    notify(editId ? t.updated : t.saved, "success", { silent: true });
    closeModal();
  };

  const removeAccount = async (account) => {
    if (String(account.id) === String(currentUser?.id)) {
      notify(t.cannotDeleteCurrent, "error");
      return;
    }
    const confirmed = await confirmAction({
      title: t.deleteTitle,
      message: `${t.deleteMessage} ${account.username || account.email || ""}`,
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const saved = await setAccounts(accounts.filter((item) => String(item.id) !== String(account.id)));
    if (saved) notify(t.deleted, "success", { silent: true });
  };

  const modal = showModal ? (
    <div className="account-manager-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
      <section className="account-manager-modal" role="dialog" aria-modal="true" dir={direction}>
        <div className="account-manager-modal-head">
          <div>
            <span className="account-manager-kicker"><ShieldCheck size={15} />{editId ? t.editTitle : t.createTitle}</span>
            <h2>{editId ? t.editTitle : t.createTitle}</h2>
            <p>{t.formHint}</p>
          </div>
          <button type="button" onClick={closeModal} aria-label={t.cancel}><X size={18} /></button>
        </div>

        <form className="account-manager-form" onSubmit={saveAccount} noValidate>
          <label>
            <span>{t.username}</span>
            <input autoFocus value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} placeholder={t.usernamePlaceholder} />
          </label>
          <label>
            <span>{t.email}</span>
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder={t.emailPlaceholder} autoComplete="email" />
          </label>
          <label>
            <span>{editId ? t.newPassword : t.password}</span>
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder={t.passwordPlaceholder} autoComplete="new-password" />
          </label>
          <label>
            <span>{editId ? t.reNewPassword : t.rePassword}</span>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder={t.rePasswordPlaceholder} autoComplete="new-password" />
          </label>
          <div className="account-manager-form-actions">
            <button type="button" className="secondary" onClick={closeModal}>{t.cancel}</button>
            <button type="submit" className="primary">{editId ? t.update : t.save}</button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  return (
    <div className="account-manager-page" dir={direction}>
      <div className="account-manager-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="account-manager-add" onClick={openCreate}><UserPlus size={17} />{t.addAccount}</button>
      </div>

      <div className="account-manager-stats">
        <article><span>{t.totalAccounts}</span><strong>{accounts.length}</strong></article>
        <article><span>{t.activeAccounts}</span><strong>{activeCount}</strong></article>
      </div>

      <section className="account-manager-card">
        <div className="account-manager-toolbar">
          <div className="account-manager-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div>
        </div>

        <div className="account-manager-table-wrap">
          <table className="account-manager-table">
            <thead>
              <tr><th>{t.username}</th><th>{t.email}</th><th>{t.role}</th><th>{t.status}</th><th>{t.created}</th><th>{t.actions}</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((account) => (
                <tr key={account.id}>
                  <td><div className="account-manager-user"><span><UserRound size={18} /></span><strong>{account.username || account.fullName || "—"}</strong></div></td>
                  <td><div className="account-manager-email"><Mail size={14} />{account.email || "—"}</div></td>
                  <td><span className="account-manager-role">{t.administrator}</span></td>
                  <td><span className="account-manager-status">{t.active}</span></td>
                  <td>{account.createdAt || "—"}</td>
                  <td><div className="account-manager-actions"><button type="button" onClick={() => openEdit(account)} title={t.editTitle}><Edit3 size={15} /></button><button type="button" className="danger" onClick={() => removeAccount(account)} title={t.delete}><Trash2 size={15} /></button></div></td>
                </tr>
              )) : <tr><td colSpan="6" className="account-manager-empty">{t.noAccounts}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && createPortal(modal, document.body)}
    </div>
  );
}
