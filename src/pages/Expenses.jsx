import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Edit3,
  FileMinus2,
  FolderCog,
  Plus,
  ReceiptText,
  Search,
  Tag,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import "./Expenses.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencyCodes = ["AFN", "USD", "PKR", "EUR"];
const today = () => new Date().toISOString().slice(0, 10);
const numeric = (value) => Math.max(Number(value || 0), 0);

const tr = {
  en: {
    title: "Expenses",
    subtitle: "Manage expense transactions, expense accounts and expense reasons based on the Access accounting structure.",
    newExpense: "New Expense",
    expenses: "Expenses",
    accounts: "Expense Accounts",
    reasons: "Expense Reasons",
    totalExpenses: "Total Expenses",
    thisMonth: "This Month",
    transactions: "Transactions",
    search: "Search expense, account or reason...",
    date: "Date",
    account: "Expense Account",
    reason: "Reason",
    reference: "Reference",
    amount: "Amount",
    currency: "Currency",
    description: "Description",
    actions: "Actions",
    noExpenses: "No expenses have been registered yet.",
    addAccount: "Add Account",
    addReason: "Add Reason",
    noAccounts: "No expense accounts have been added yet.",
    noReasons: "No expense reasons have been added yet.",
    name: "Name",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    delete: "Delete",
    newExpenseTitle: "Register Expense",
    editExpenseTitle: "Edit Expense",
    expenseHint: "Register a cash expense. It will automatically appear as Cash Out in Cash Flow.",
    selectAccount: "Select expense account",
    selectReason: "Select reason",
    referencePlaceholder: "Voucher / reference number",
    descriptionPlaceholder: "Optional description...",
    save: "Save Expense",
    update: "Update Expense",
    cancel: "Cancel",
    accountTitle: "Expense Account",
    reasonTitle: "Expense Reason",
    namePlaceholder: "Enter name",
    requiredExpense: "Please complete date, account, reason, currency and amount.",
    requiredName: "Please enter a name.",
    saved: "Expense saved successfully.",
    updated: "Expense updated successfully.",
    deleted: "Expense deleted.",
    accountSaved: "Expense account saved.",
    reasonSaved: "Expense reason saved.",
    inUse: "This item is already used by an expense and cannot be deleted.",
    deleteExpense: "Delete this expense?",
    deleteAccount: "Delete this expense account?",
    deleteReason: "Delete this expense reason?",
  },
  fa: {
    title: "مصارف",
    subtitle: "مصارف، حساب‌های مصرف و دلایل مصرف را مطابق ساختار حسابداری سیستم اکسس مدیریت کنید.",
    newExpense: "ثبت مصرف جدید",
    expenses: "مصارف",
    accounts: "حساب‌های مصرف",
    reasons: "دلایل مصرف",
    totalExpenses: "مجموع مصارف",
    thisMonth: "مصارف این ماه",
    transactions: "ریکاردهای مصرف",
    search: "جستجوی مصرف، حساب یا دلیل...",
    date: "تاریخ",
    account: "حساب مصرف",
    reason: "دلیل مصرف",
    reference: "مرجع",
    amount: "مقدار",
    currency: "اسعار",
    description: "توضیحات",
    actions: "عملیات",
    noExpenses: "هنوز مصرفی ثبت نشده است.",
    addAccount: "حساب جدید",
    addReason: "دلیل جدید",
    noAccounts: "هنوز حساب مصرف اضافه نشده است.",
    noReasons: "هنوز دلیل مصرف اضافه نشده است.",
    name: "نام",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    edit: "ویرایش",
    delete: "حذف",
    newExpenseTitle: "ثبت مصرف",
    editExpenseTitle: "ویرایش مصرف",
    expenseHint: "مصرف نقدی را ثبت کنید؛ این مبلغ به‌صورت اتوماتیک در جریان نقدی به عنوان پرداخت نشان داده می‌شود.",
    selectAccount: "حساب مصرف را انتخاب کنید",
    selectReason: "دلیل مصرف را انتخاب کنید",
    referencePlaceholder: "نمبر سند / مرجع",
    descriptionPlaceholder: "توضیحات اختیاری...",
    save: "ذخیره مصرف",
    update: "ذخیره تغییرات",
    cancel: "لغو",
    accountTitle: "حساب مصرف",
    reasonTitle: "دلیل مصرف",
    namePlaceholder: "نام را وارد کنید",
    requiredExpense: "تاریخ، حساب مصرف، دلیل، اسعار و مقدار را تکمیل کنید.",
    requiredName: "لطفاً نام را وارد کنید.",
    saved: "مصرف با موفقیت ذخیره شد.",
    updated: "مصرف با موفقیت ویرایش شد.",
    deleted: "مصرف حذف شد.",
    accountSaved: "حساب مصرف ذخیره شد.",
    reasonSaved: "دلیل مصرف ذخیره شد.",
    inUse: "این مورد در یک مصرف استفاده شده و قابل حذف نیست.",
    deleteExpense: "این مصرف حذف شود؟",
    deleteAccount: "این حساب مصرف حذف شود؟",
    deleteReason: "این دلیل مصرف حذف شود؟",
  },
  ps: {
    title: "مصارف",
    subtitle: "د Access د حسابدارۍ جوړښت مطابق مصارف، د مصرف حسابونه او د مصرف دلیلونه اداره کړئ.",
    newExpense: "نوی مصرف ثبتول",
    expenses: "مصارف",
    accounts: "د مصرف حسابونه",
    reasons: "د مصرف دلیلونه",
    totalExpenses: "ټول مصارف",
    thisMonth: "د دې میاشتې مصارف",
    transactions: "د مصرف ریکارډونه",
    search: "د مصرف، حساب یا دلیل لټون...",
    date: "نېټه",
    account: "د مصرف حساب",
    reason: "د مصرف دلیل",
    reference: "مرجع",
    amount: "مقدار",
    currency: "اسعار",
    description: "تشریح",
    actions: "کړنې",
    noExpenses: "تر اوسه مصرف نه دی ثبت شوی.",
    addAccount: "نوی حساب",
    addReason: "نوی دلیل",
    noAccounts: "تر اوسه د مصرف حساب نه دی اضافه شوی.",
    noReasons: "تر اوسه د مصرف دلیل نه دی اضافه شوی.",
    name: "نوم",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    edit: "سمول",
    delete: "حذف",
    newExpenseTitle: "مصرف ثبتول",
    editExpenseTitle: "مصرف سمول",
    expenseHint: "نغدي مصرف ثبت کړئ؛ دا به په Cash Flow کې اتومات د نغدي تادیې په توګه ښکاره شي.",
    selectAccount: "د مصرف حساب وټاکئ",
    selectReason: "د مصرف دلیل وټاکئ",
    referencePlaceholder: "د سند / مرجع نمبر",
    descriptionPlaceholder: "اختیاري تشریح...",
    save: "مصرف خوندي کړئ",
    update: "بدلونونه خوندي کړئ",
    cancel: "لغوه",
    accountTitle: "د مصرف حساب",
    reasonTitle: "د مصرف دلیل",
    namePlaceholder: "نوم ولیکئ",
    requiredExpense: "نېټه، د مصرف حساب، دلیل، اسعار او مقدار بشپړ کړئ.",
    requiredName: "مهرباني وکړئ نوم ولیکئ.",
    saved: "مصرف په بریالیتوب ثبت شو.",
    updated: "مصرف په بریالیتوب بدل شو.",
    deleted: "مصرف حذف شو.",
    accountSaved: "د مصرف حساب خوندي شو.",
    reasonSaved: "د مصرف دلیل خوندي شو.",
    inUse: "دا مورد په مصرف کې کارول شوی او حذف کېدای نشي.",
    deleteExpense: "دا مصرف حذف شي؟",
    deleteAccount: "دا د مصرف حساب حذف شي؟",
    deleteReason: "دا د مصرف دلیل حذف شي؟",
  },
};

const blankExpense = {
  date: today(),
  accountId: "",
  reasonId: "",
  currency: "AFN",
  amount: "",
  reference: "",
  description: "",
};

export default function Expenses() {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const t = tr[language] || tr.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

  const [expenses, setExpenses] = useJsonCollection("expenses");
  const [accounts, setAccounts] = useJsonCollection("expenseAccounts");
  const [reasons, setReasons] = useJsonCollection("expenseReasons");

  const [activeTab, setActiveTab] = useState("expenses");
  const [query, setQuery] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterKind, setMasterKind] = useState("account");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingMasterId, setEditingMasterId] = useState(null);
  const [expenseForm, setExpenseForm] = useState(blankExpense);
  const [masterForm, setMasterForm] = useState({ name: "", status: "active" });

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
    const open = showExpenseModal || showMasterModal;
    document.body.classList.toggle("expenses-modal-open", open);
    return () => document.body.classList.remove("expenses-modal-open");
  }, [showExpenseModal, showMasterModal]);

  const accountMap = useMemo(() => new Map(accounts.map((item) => [String(item.id), item])), [accounts]);
  const reasonMap = useMemo(() => new Map(reasons.map((item) => [String(item.id), item])), [reasons]);

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + numeric(item.amount), 0), [expenses]);
  const monthExpenses = useMemo(() => expenses.filter((item) => String(item.date || "").startsWith(monthPrefix)).reduce((sum, item) => sum + numeric(item.amount), 0), [expenses, monthPrefix]);

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...expenses]
      .sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")))
      .filter((item) => {
        if (!q) return true;
        const account = accountMap.get(String(item.accountId));
        const reason = reasonMap.get(String(item.reasonId));
        return [account?.name, reason?.name, item.reference, item.description, item.amount, item.currency]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      });
  }, [expenses, accountMap, reasonMap, query]);

  const openExpense = (expense = null) => {
    if (expense) {
      setEditingExpenseId(expense.id);
      setExpenseForm({ ...blankExpense, ...expense, amount: String(expense.amount ?? "") });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({ ...blankExpense, date: today() });
    }
    setShowExpenseModal(true);
  };

  const closeExpense = () => {
    setShowExpenseModal(false);
    setEditingExpenseId(null);
    setExpenseForm(blankExpense);
  };

  const saveExpense = (event) => {
    event.preventDefault();
    if (!expenseForm.date || !expenseForm.accountId || !expenseForm.reasonId || !expenseForm.currency || numeric(expenseForm.amount) <= 0) {
      notify(t.requiredExpense, "warning");
      return;
    }
    const now = new Date().toISOString();
    const payload = {
      date: expenseForm.date,
      accountId: expenseForm.accountId,
      reasonId: expenseForm.reasonId,
      currency: expenseForm.currency,
      amount: numeric(expenseForm.amount),
      reference: String(expenseForm.reference || "").trim(),
      description: String(expenseForm.description || "").trim(),
      paymentMethod: "cash",
      updatedAt: now,
    };
    if (editingExpenseId) {
      setExpenses((current) => current.map((item) => String(item.id) === String(editingExpenseId) ? { ...item, ...payload } : item));
      notify(t.updated, "success");
    } else {
      setExpenses((current) => [{ id: `exp-${Date.now()}`, ...payload, createdAt: now }, ...current]);
      notify(t.saved, "success");
    }
    closeExpense();
  };

  const deleteExpense = async (expense) => {
    const ok = await confirmAction({ title: t.delete, message: t.deleteExpense, confirmText: t.delete, cancelText: t.cancel, tone: "danger" });
    if (!ok) return;
    setExpenses((current) => current.filter((item) => String(item.id) !== String(expense.id)));
    notify(t.deleted, "success");
  };

  const openMaster = (kind, item = null) => {
    setMasterKind(kind);
    setEditingMasterId(item?.id || null);
    setMasterForm({ name: item?.name || "", status: item?.status || "active" });
    setShowMasterModal(true);
  };

  const closeMaster = () => {
    setShowMasterModal(false);
    setEditingMasterId(null);
    setMasterForm({ name: "", status: "active" });
  };

  const saveMaster = (event) => {
    event.preventDefault();
    const name = masterForm.name.trim();
    if (!name) {
      notify(t.requiredName, "warning");
      return;
    }
    const setter = masterKind === "account" ? setAccounts : setReasons;
    const now = new Date().toISOString();
    if (editingMasterId) {
      setter((current) => current.map((item) => String(item.id) === String(editingMasterId) ? { ...item, name, status: masterForm.status, updatedAt: now } : item));
    } else {
      setter((current) => [{ id: `${masterKind}-${Date.now()}`, name, status: masterForm.status, createdAt: now }, ...current]);
    }
    notify(masterKind === "account" ? t.accountSaved : t.reasonSaved, "success");
    closeMaster();
  };

  const deleteMaster = async (kind, item) => {
    const isUsed = expenses.some((expense) => String(kind === "account" ? expense.accountId : expense.reasonId) === String(item.id));
    if (isUsed) {
      notify(t.inUse, "warning");
      return;
    }
    const ok = await confirmAction({
      title: t.delete,
      message: kind === "account" ? t.deleteAccount : t.deleteReason,
      confirmText: t.delete,
      cancelText: t.cancel,
      tone: "danger",
    });
    if (!ok) return;
    const setter = kind === "account" ? setAccounts : setReasons;
    setter((current) => current.filter((row) => String(row.id) !== String(item.id)));
  };

  const activeAccounts = accounts.filter((item) => item.status !== "inactive");
  const activeReasons = reasons.filter((item) => item.status !== "inactive");

  const renderMasterList = (kind) => {
    const items = kind === "account" ? accounts : reasons;
    const empty = kind === "account" ? t.noAccounts : t.noReasons;
    const add = kind === "account" ? t.addAccount : t.addReason;
    return (
      <section className="expenses-card">
        <div className="expenses-card-head">
          <div><h2>{kind === "account" ? t.accounts : t.reasons}</h2><p>{items.length}</p></div>
          <button type="button" className="expenses-primary small" onClick={() => openMaster(kind)}><Plus size={17} />{add}</button>
        </div>
        <div className="expenses-master-list">
          {items.length === 0 ? <div className="expenses-empty">{empty}</div> : items.map((item) => (
            <article key={item.id} className="expenses-master-row">
              <span className="expenses-master-icon">{kind === "account" ? <FolderCog size={18} /> : <Tag size={18} />}</span>
              <div><strong>{item.name}</strong><small>{item.status === "inactive" ? t.inactive : t.active}</small></div>
              <div className="expenses-row-actions">
                <button type="button" onClick={() => openMaster(kind, item)} title={t.edit}><Edit3 size={15} /></button>
                <button type="button" className="danger" onClick={() => deleteMaster(kind, item)} title={t.delete}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="expenses-page" dir={direction}>
      <header className="expenses-header">
        <div>
          <span className="expenses-kicker"><FileMinus2 size={16} />{t.title}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="expenses-primary" onClick={() => openExpense()}><Plus size={18} />{t.newExpense}</button>
      </header>

      <div className="expenses-tabs" role="tablist">
        <button type="button" className={activeTab === "expenses" ? "active" : ""} onClick={() => setActiveTab("expenses")}><ReceiptText size={17} />{t.expenses}</button>
        <button type="button" className={activeTab === "accounts" ? "active" : ""} onClick={() => setActiveTab("accounts")}><FolderCog size={17} />{t.accounts}</button>
        <button type="button" className={activeTab === "reasons" ? "active" : ""} onClick={() => setActiveTab("reasons")}><Tag size={17} />{t.reasons}</button>
      </div>

      {activeTab === "expenses" && <>
        <section className="expenses-stats">
          <article><span><WalletCards size={20} /></span><div><small>{t.totalExpenses}</small><strong>{totalExpenses.toLocaleString()}</strong></div></article>
          <article><span><CalendarDays size={20} /></span><div><small>{t.thisMonth}</small><strong>{monthExpenses.toLocaleString()}</strong></div></article>
          <article><span><ReceiptText size={20} /></span><div><small>{t.transactions}</small><strong>{expenses.length}</strong></div></article>
        </section>

        <section className="expenses-card">
          <div className="expenses-card-head">
            <div><h2>{t.transactions}</h2><p>{filteredExpenses.length}</p></div>
            <label className="expenses-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
          </div>
          <div className="expenses-table-wrap">
            <table>
              <thead><tr><th>{t.date}</th><th>{t.account}</th><th>{t.reason}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {filteredExpenses.length === 0 ? <tr><td colSpan="7" className="expenses-empty">{t.noExpenses}</td></tr> : filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{String(expense.date || expense.createdAt || "—").slice(0, 10)}</td>
                    <td><strong>{accountMap.get(String(expense.accountId))?.name || "—"}</strong></td>
                    <td>{reasonMap.get(String(expense.reasonId))?.name || "—"}</td>
                    <td>{expense.reference || "—"}</td>
                    <td className="expenses-description">{expense.description || "—"}</td>
                    <td className="expenses-money">{numeric(expense.amount).toLocaleString()} <small>{expense.currency}</small></td>
                    <td><div className="expenses-row-actions"><button type="button" onClick={() => openExpense(expense)} title={t.edit}><Edit3 size={15} /></button><button type="button" className="danger" onClick={() => deleteExpense(expense)} title={t.delete}><Trash2 size={15} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>}

      {activeTab === "accounts" && renderMasterList("account")}
      {activeTab === "reasons" && renderMasterList("reason")}

      {showExpenseModal && createPortal(
        <div className="expenses-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeExpense()}>
          <section className="expenses-modal" role="dialog" aria-modal="true" dir={direction}>
            <header className="expenses-modal-head"><div><span><ReceiptText size={19} /></span><div><h2>{editingExpenseId ? t.editExpenseTitle : t.newExpenseTitle}</h2><p>{t.expenseHint}</p></div></div><button type="button" onClick={closeExpense}><X size={19} /></button></header>
            <form onSubmit={saveExpense}>
              <div className="expenses-modal-body">
                <label><span>{t.date}</span><ShamsiDateInput value={expenseForm.date} onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))} /></label>
                <label><span>{t.account}</span><select value={expenseForm.accountId} onChange={(event) => setExpenseForm((current) => ({ ...current, accountId: event.target.value }))}><option value="">{t.selectAccount}</option>{activeAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>{t.reason}</span><select value={expenseForm.reasonId} onChange={(event) => setExpenseForm((current) => ({ ...current, reasonId: event.target.value }))}><option value="">{t.selectReason}</option>{activeReasons.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>{t.currency}</span><select value={expenseForm.currency} onChange={(event) => setExpenseForm((current) => ({ ...current, currency: event.target.value }))}>{currencyCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
                <label><span>{t.amount}</span><input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} /></label>
                <label><span>{t.reference}</span><input value={expenseForm.reference} onChange={(event) => setExpenseForm((current) => ({ ...current, reference: event.target.value }))} placeholder={t.referencePlaceholder} /></label>
                <label className="expenses-span-2"><span>{t.description}</span><textarea rows="4" value={expenseForm.description} onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))} placeholder={t.descriptionPlaceholder} /></label>
              </div>
              <footer className="expenses-modal-footer"><button type="button" className="expenses-secondary" onClick={closeExpense}>{t.cancel}</button><button type="submit" className="expenses-primary">{editingExpenseId ? t.update : t.save}</button></footer>
            </form>
          </section>
        </div>, document.body
      )}

      {showMasterModal && createPortal(
        <div className="expenses-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeMaster()}>
          <section className="expenses-modal expenses-master-modal" role="dialog" aria-modal="true" dir={direction}>
            <header className="expenses-modal-head"><div><span>{masterKind === "account" ? <FolderCog size={19} /> : <Tag size={19} />}</span><div><h2>{masterKind === "account" ? t.accountTitle : t.reasonTitle}</h2></div></div><button type="button" onClick={closeMaster}><X size={19} /></button></header>
            <form onSubmit={saveMaster}>
              <div className="expenses-modal-body one-column">
                <label><span>{t.name}</span><input autoFocus value={masterForm.name} onChange={(event) => setMasterForm((current) => ({ ...current, name: event.target.value }))} placeholder={t.namePlaceholder} /></label>
                <label><span>{t.status}</span><select value={masterForm.status} onChange={(event) => setMasterForm((current) => ({ ...current, status: event.target.value }))}><option value="active">{t.active}</option><option value="inactive">{t.inactive}</option></select></label>
              </div>
              <footer className="expenses-modal-footer"><button type="button" className="expenses-secondary" onClick={closeMaster}>{t.cancel}</button><button type="submit" className="expenses-primary">{t.save}</button></footer>
            </form>
          </section>
        </div>, document.body
      )}
    </div>
  );
}
