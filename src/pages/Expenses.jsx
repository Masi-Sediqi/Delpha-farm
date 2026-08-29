import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Edit3,
  FileMinus2,
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

const defaultCategories = [
  ["rent", "Rent", "کرایه", "کرایه"],
  ["electricity", "Electricity", "برق", "برېښنا"],
  ["water", "Water", "آب", "اوبه"],
  ["internet", "Internet", "انترنت", "انټرنېټ"],
  ["phone", "Phone & Mobile", "تلفن و موبایل", "ټیلیفون او موبایل"],
  ["transport", "Transport", "ترانسپورت", "ترانسپورت"],
  ["fuel", "Fuel", "تیل و سوخت", "تېل او سون توکي"],
  ["salary", "Salary & Wages", "معاش و دستمزد", "معاش او مزدوري"],
  ["overtime", "Overtime", "اضافه‌کاری", "اضافي کار"],
  ["food", "Food & Refreshments", "غذا و پذیرایی", "خوراک او مېلمستیا"],
  ["office_supplies", "Office Supplies", "لوازم دفتری", "د دفتر توکي"],
  ["stationery", "Stationery", "قرطاسیه", "قرطاسیه"],
  ["printing", "Printing", "چاپ", "چاپ"],
  ["packaging", "Packaging", "بسته‌بندی", "بسته بندي"],
  ["cleaning", "Cleaning", "نظافت", "پاک کاري"],
  ["maintenance", "Maintenance", "حفظ و مراقبت", "ساتنه او مراقبت"],
  ["repair", "Repair", "ترمیمات", "ترمیم"],
  ["medicine_loss", "Medicine Damage / Loss", "ضایعات دوا", "د درملو ضایعات"],
  ["expired_medicine", "Expired Medicine", "دوای منقضی", "تېرمهاله درمل"],
  ["delivery", "Delivery & Courier", "ارسال و پیک", "لېږد او کوریر"],
  ["marketing", "Marketing", "بازاریابی", "بازارموندنه"],
  ["advertising", "Advertising", "اعلانات", "اعلانونه"],
  ["bank_fee", "Bank Charges", "هزینه بانکی", "بانکي لګښت"],
  ["tax", "Tax", "مالیات", "مالیه"],
  ["license", "License & Permit", "جواز و مجوز", "جواز او اجازه"],
  ["security", "Security", "امنیت", "امنیت"],
  ["software", "Software & Subscription", "نرم‌افزار و اشتراک", "سافټویر او ګډون"],
  ["equipment", "Equipment", "تجهیزات", "تجهیزات"],
  ["charity", "Charity & Donation", "کمک و خیریه", "مرسته او خیرات"],
  ["misc", "Miscellaneous", "سایر مصارف", "نور مصارف"],
].map(([key, en, fa, ps]) => ({ id: `expense-category-${key}`, key, labels: { en, fa, ps }, isDefault: true }));

const tr = {
  en: {
    title: "Expenses", subtitle: "Register and manage daily business expenses in one simple workspace.",
    newExpense: "New Expense", totalExpenses: "Total Expenses", thisMonth: "This Month", transactions: "Expense Records",
    search: "Search category, description or amount...", date: "Date", category: "Category", amount: "Amount", currency: "Currency",
    description: "Description", actions: "Actions", noExpenses: "No expenses have been registered yet.", edit: "Edit", delete: "Delete",
    newExpenseTitle: "Register Expense", editExpenseTitle: "Edit Expense", expenseHint: "Record a daily expense. It will also be available to Cash Flow.",
    selectCategory: "Select category", addCategory: "Add Category", customCategory: "New Category", categoryName: "Category name",
    categoryPlaceholder: "Enter category name", saveCategory: "Save Category", descriptionPlaceholder: "Optional description...",
    save: "Save Expense", update: "Save Changes", cancel: "Cancel", requiredExpense: "Please complete date, category, currency and amount.",
    requiredCategory: "Please enter a category name.", saved: "Expense saved successfully.", updated: "Expense updated successfully.",
    deleted: "Expense deleted.", categorySaved: "Category saved.", deleteExpense: "Delete this expense?",
  },
  fa: {
    title: "مصارفات", subtitle: "مصارف روزانه کاروبار را در یک صفحه ساده ثبت و مدیریت کنید.",
    newExpense: "ثبت مصرف جدید", totalExpenses: "مجموع مصارف", thisMonth: "مصارف این ماه", transactions: "ریکاردهای مصرف",
    search: "جستجوی کتگوری، توضیحات یا مقدار...", date: "تاریخ", category: "کتگوری", amount: "مقدار", currency: "اسعار",
    description: "توضیحات", actions: "عملیات", noExpenses: "هنوز مصرفی ثبت نشده است.", edit: "ویرایش", delete: "حذف",
    newExpenseTitle: "ثبت مصرف", editExpenseTitle: "ویرایش مصرف", expenseHint: "مصرف روزانه را ثبت کنید؛ این مبلغ در جریان نقدی نیز قابل استفاده است.",
    selectCategory: "کتگوری را انتخاب کنید", addCategory: "افزودن کتگوری", customCategory: "کتگوری جدید", categoryName: "نام کتگوری",
    categoryPlaceholder: "نام کتگوری را وارد کنید", saveCategory: "ذخیره کتگوری", descriptionPlaceholder: "توضیحات اختیاری...",
    save: "ذخیره مصرف", update: "ذخیره تغییرات", cancel: "لغو", requiredExpense: "تاریخ، کتگوری، اسعار و مقدار را تکمیل کنید.",
    requiredCategory: "لطفاً نام کتگوری را وارد کنید.", saved: "مصرف با موفقیت ذخیره شد.", updated: "مصرف با موفقیت ویرایش شد.",
    deleted: "مصرف حذف شد.", categorySaved: "کتگوری ذخیره شد.", deleteExpense: "این مصرف حذف شود؟",
  },
  ps: {
    title: "مصارف", subtitle: "د کاروبار ورځني مصارف په یوه ساده پاڼه کې ثبت او اداره کړئ.",
    newExpense: "نوی مصرف ثبتول", totalExpenses: "ټول مصارف", thisMonth: "د دې میاشتې مصارف", transactions: "د مصرف ریکارډونه",
    search: "د کټګورۍ، تشریح یا مقدار لټون...", date: "نېټه", category: "کټګوري", amount: "مقدار", currency: "اسعار",
    description: "تشریح", actions: "کړنې", noExpenses: "تر اوسه مصرف نه دی ثبت شوی.", edit: "سمون", delete: "حذف",
    newExpenseTitle: "مصرف ثبتول", editExpenseTitle: "مصرف سمول", expenseHint: "ورځنی مصرف ثبت کړئ؛ دا به په نغدي جریان کې هم موجود وي.",
    selectCategory: "کټګوري وټاکئ", addCategory: "کټګوري اضافه کړئ", customCategory: "نوې کټګوري", categoryName: "د کټګورۍ نوم",
    categoryPlaceholder: "د کټګورۍ نوم ولیکئ", saveCategory: "کټګوري خوندي کړئ", descriptionPlaceholder: "اختیاري تشریح...",
    save: "مصرف خوندي کړئ", update: "بدلونونه خوندي کړئ", cancel: "لغوه", requiredExpense: "نېټه، کټګوري، اسعار او مقدار بشپړ کړئ.",
    requiredCategory: "مهرباني وکړئ د کټګورۍ نوم ولیکئ.", saved: "مصرف په بریالیتوب ثبت شو.", updated: "مصرف په بریالیتوب بدل شو.",
    deleted: "مصرف حذف شو.", categorySaved: "کټګوري خوندي شوه.", deleteExpense: "دا مصرف حذف شي؟",
  },
};

const blankExpense = { date: today(), categoryId: "", currency: "AFN", amount: "", description: "" };

export default function Expenses() {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const t = tr[language] || tr.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";
  const [expenses, setExpenses] = useJsonCollection("expenses");
  const [categories, setCategories] = useJsonCollection("expenseCategories");
  const [legacyAccounts] = useJsonCollection("expenseAccounts");
  const [legacyReasons] = useJsonCollection("expenseReasons");
  const [query, setQuery] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState(blankExpense);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => { window.removeEventListener("app-language-updated", syncLanguage); window.removeEventListener("storage", syncLanguage); };
  }, []);

  useEffect(() => {
    if (categories.length) return;
    setCategories(defaultCategories);
  }, [categories.length, setCategories]);

  useEffect(() => {
    const open = showExpenseModal || showCategoryModal;
    document.body.classList.toggle("expenses-modal-open", open);
    return () => document.body.classList.remove("expenses-modal-open");
  }, [showExpenseModal, showCategoryModal]);

  const categoryLabel = (item) => item?.labels?.[language] || item?.name || item?.labels?.en || "—";
  const categoryMap = useMemo(() => new Map(categories.map((item) => [String(item.id), item])), [categories]);
  const legacyAccountMap = useMemo(() => new Map(legacyAccounts.map((item) => [String(item.id), item])), [legacyAccounts]);
  const legacyReasonMap = useMemo(() => new Map(legacyReasons.map((item) => [String(item.id), item])), [legacyReasons]);

  const expenseCategoryText = (expense) => {
    const direct = categoryMap.get(String(expense.categoryId || ""));
    if (direct) return categoryLabel(direct);
    const reason = legacyReasonMap.get(String(expense.reasonId || ""));
    if (reason?.name) return reason.name;
    const account = legacyAccountMap.get(String(expense.accountId || ""));
    if (account?.name) return account.name;
    return "—";
  };

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + numeric(item.amount), 0), [expenses]);
  const monthExpenses = useMemo(() => expenses.filter((item) => String(item.date || "").startsWith(monthPrefix)).reduce((sum, item) => sum + numeric(item.amount), 0), [expenses, monthPrefix]);

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...expenses]
      .sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")))
      .filter((item) => !q || [expenseCategoryText(item), item.description, item.amount, item.currency].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [expenses, query, categoryMap, legacyAccountMap, legacyReasonMap, language]);

  const openExpense = (expense = null) => {
    if (expense) {
      setEditingExpenseId(expense.id);
      setExpenseForm({
        ...blankExpense,
        ...expense,
        categoryId: expense.categoryId || "",
        amount: String(expense.amount ?? ""),
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({ ...blankExpense, date: today() });
    }
    setShowExpenseModal(true);
  };

  const closeExpense = () => { setShowExpenseModal(false); setEditingExpenseId(null); setExpenseForm(blankExpense); };

  const saveExpense = (event) => {
    event.preventDefault();
    if (!expenseForm.date || !expenseForm.categoryId || !expenseForm.currency || numeric(expenseForm.amount) <= 0) {
      notify(t.requiredExpense, "warning");
      return;
    }
    const now = new Date().toISOString();
    const payload = {
      date: expenseForm.date,
      categoryId: expenseForm.categoryId,
      currency: expenseForm.currency,
      amount: numeric(expenseForm.amount),
      description: String(expenseForm.description || "").trim(),
      paymentMethod: "cash",
      updatedAt: now,
    };
    if (editingExpenseId) {
      setExpenses((current) => current.map((item) => String(item.id) === String(editingExpenseId) ? { ...item, ...payload, accountId: undefined, reasonId: undefined, reference: undefined } : item));
      notify(t.updated, "success");
    } else {
      setExpenses((current) => [{ id: `exp-${Date.now()}`, ...payload, createdAt: now }, ...current]);
      notify(t.saved, "success");
    }
    closeExpense();
  };

  const saveCategory = (event) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) { notify(t.requiredCategory, "warning"); return; }
    const existing = categories.find((item) => categoryLabel(item).trim().toLowerCase() === name.toLowerCase() || String(item.name || "").trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setExpenseForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategoryModal(false); setCategoryName(""); return;
    }
    const item = { id: `expense-category-custom-${Date.now()}`, name, isDefault: false, createdAt: new Date().toISOString() };
    setCategories((current) => [...current, item]);
    setExpenseForm((current) => ({ ...current, categoryId: item.id }));
    notify(t.categorySaved, "success");
    setShowCategoryModal(false); setCategoryName("");
  };

  const deleteExpense = async (expense) => {
    const ok = await confirmAction({ title: t.delete, message: t.deleteExpense, confirmText: t.delete, cancelText: t.cancel, tone: "danger" });
    if (!ok) return;
    setExpenses((current) => current.filter((item) => String(item.id) !== String(expense.id)));
    notify(t.deleted, "success");
  };

  return (
    <div className="expenses-page" dir={direction}>
      <header className="expenses-header">
        <div>
          <span className="expenses-kicker"><FileMinus2 size={16} />{t.title}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="expenses-primary" onClick={() => openExpense()}><Plus size={16} />{t.newExpense}</button>
      </header>

      <section className="expenses-stats">
        <article><span><WalletCards size={19} /></span><div><small>{t.totalExpenses}</small><strong>{totalExpenses.toLocaleString()}</strong></div></article>
        <article><span><CalendarDays size={19} /></span><div><small>{t.thisMonth}</small><strong>{monthExpenses.toLocaleString()}</strong></div></article>
        <article><span><ReceiptText size={19} /></span><div><small>{t.transactions}</small><strong>{expenses.length}</strong></div></article>
      </section>

      <section className="expenses-card">
        <div className="expenses-card-head">
          <div><h2>{t.transactions}</h2><p>{filteredExpenses.length}</p></div>
          <label className="expenses-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></label>
        </div>
        <div className="expenses-table-wrap">
          <table>
            <thead><tr><th>{t.date}</th><th>{t.category}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {filteredExpenses.length === 0 ? <tr><td colSpan="5" className="expenses-empty">{t.noExpenses}</td></tr> : filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{String(expense.date || expense.createdAt || "—").slice(0, 10)}</td>
                  <td><span className="expenses-category-badge"><Tag size={13} />{expenseCategoryText(expense)}</span></td>
                  <td className="expenses-description">{expense.description || "—"}</td>
                  <td className="expenses-money">{numeric(expense.amount).toLocaleString()} <small>{expense.currency}</small></td>
                  <td><div className="expenses-row-actions"><button type="button" onClick={() => openExpense(expense)} title={t.edit}><Edit3 size={14} /></button><button type="button" className="danger" onClick={() => deleteExpense(expense)} title={t.delete}><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showExpenseModal && createPortal(
        <div className="expenses-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeExpense()}>
          <section className="expenses-modal" role="dialog" aria-modal="true" dir={direction}>
            <header className="expenses-modal-head"><div><span><ReceiptText size={18} /></span><div><h2>{editingExpenseId ? t.editExpenseTitle : t.newExpenseTitle}</h2><p>{t.expenseHint}</p></div></div><button type="button" onClick={closeExpense}><X size={18} /></button></header>
            <form onSubmit={saveExpense}>
              <div className="expenses-modal-body">
                <label><span>{t.date}</span><ShamsiDateInput value={expenseForm.date} onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))} /></label>
                <label><span>{t.category}</span><div className="expenses-category-control"><select value={expenseForm.categoryId} onChange={(event) => setExpenseForm((current) => ({ ...current, categoryId: event.target.value }))}><option value="">{t.selectCategory}</option>{categories.map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)}</option>)}</select><button type="button" title={t.addCategory} onClick={() => setShowCategoryModal(true)}><Plus size={16} /></button></div></label>
                <label><span>{t.currency}</span><select value={expenseForm.currency} onChange={(event) => setExpenseForm((current) => ({ ...current, currency: event.target.value }))}>{currencyCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
                <label><span>{t.amount}</span><input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} /></label>
                <label className="expenses-span-2"><span>{t.description}</span><textarea rows="4" value={expenseForm.description} onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))} placeholder={t.descriptionPlaceholder} /></label>
              </div>
              <footer className="expenses-modal-footer"><button type="button" className="expenses-secondary" onClick={closeExpense}>{t.cancel}</button><button type="submit" className="expenses-primary">{editingExpenseId ? t.update : t.save}</button></footer>
            </form>
          </section>
        </div>, document.body
      )}

      {showCategoryModal && createPortal(
        <div className="expenses-modal-overlay expenses-category-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowCategoryModal(false)}>
          <section className="expenses-modal expenses-category-modal" role="dialog" aria-modal="true" dir={direction}>
            <header className="expenses-modal-head"><div><span><Tag size={18} /></span><div><h2>{t.customCategory}</h2></div></div><button type="button" onClick={() => setShowCategoryModal(false)}><X size={18} /></button></header>
            <form onSubmit={saveCategory}>
              <div className="expenses-modal-body one-column"><label><span>{t.categoryName}</span><input autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder={t.categoryPlaceholder} /></label></div>
              <footer className="expenses-modal-footer"><button type="button" className="expenses-secondary" onClick={() => setShowCategoryModal(false)}>{t.cancel}</button><button type="submit" className="expenses-primary">{t.saveCategory}</button></footer>
            </form>
          </section>
        </div>, document.body
      )}
    </div>
  );
}
