import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  CreditCard,
  Edit3,
  Landmark,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { confirmAction } from "../utils/confirmDialog";
import { todayDateValue } from "../utils/afghanDate";
import ShamsiDateInput from "../components/ShamsiDateInput";
import "./Banks.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const currencies = ["AFN", "USD", "PKR", "EUR"];
const numeric = (value) => Math.max(Number(value || 0), 0);

const tr = {
  en: {
    title: "Bank Accounts",
    subtitle: "Manage bank accounts and bank cash movements based on the bank module used in the Access system.",
    addBank: "Add Bank",
    newTransaction: "New Bank Transaction",
    accounts: "Bank Accounts",
    transactions: "Transactions",
    totalBanks: "Total Banks",
    bankBalance: "Bank Balance",
    deposits: "Deposits",
    withdrawals: "Withdrawals",
    search: "Search bank, account or reference...",
    all: "All",
    bankName: "Bank Name",
    accountName: "Account Name",
    accountNumber: "Account Number",
    currency: "Currency",
    openingBalance: "Opening Balance",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    notes: "Notes",
    actions: "Actions",
    noAccounts: "No bank accounts have been registered yet.",
    noTransactions: "No bank transactions found.",
    edit: "Edit",
    delete: "Delete",
    addBankTitle: "Register Bank Account",
    editBankTitle: "Edit Bank Account",
    bankHint: "Create a separate bank account for each currency/account used by the business.",
    transactionTitle: "Register Bank Transaction",
    transactionEditTitle: "Edit Bank Transaction",
    transactionHint: "Deposit moves cash into the bank. Withdrawal moves bank money back to cash.",
    bank: "Bank",
    selectBank: "Select bank",
    date: "Date",
    type: "Type",
    deposit: "Cash Deposit to Bank",
    withdrawal: "Cash Withdrawal from Bank",
    amount: "Amount",
    reference: "Reference",
    description: "Description",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    saved: "Bank account saved successfully.",
    updated: "Bank account updated successfully.",
    deleted: "Bank account deleted.",
    transactionSaved: "Bank transaction saved successfully.",
    transactionUpdated: "Bank transaction updated successfully.",
    transactionDeleted: "Bank transaction deleted.",
    requiredBank: "Please enter bank name, account name and currency.",
    requiredTransaction: "Please select bank, date, type and enter an amount greater than zero.",
    usedBank: "This bank account has transactions and cannot be deleted.",
    deleteBankConfirm: "Delete this bank account?",
    deleteTransactionConfirm: "Delete this bank transaction?",
    balance: "Balance",
  },
  fa: {
    title: "حساب‌های بانکی",
    subtitle: "حساب‌های بانکی و جریان پول بانک را مطابق بخش بانک در سیستم اکسس مدیریت کنید.",
    addBank: "افزودن بانک",
    newTransaction: "تراکنش بانکی جدید",
    accounts: "حساب‌های بانکی",
    transactions: "تراکنش‌ها",
    totalBanks: "مجموع بانک‌ها",
    bankBalance: "بیلانس بانک",
    deposits: "واریزها",
    withdrawals: "برداشت‌ها",
    search: "جستجوی بانک، حساب یا مرجع...",
    all: "همه",
    bankName: "نام بانک",
    accountName: "نام حساب",
    accountNumber: "شماره حساب",
    currency: "اسعار",
    openingBalance: "بیلانس افتتاحیه",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    notes: "ملاحظات",
    actions: "عملیات",
    noAccounts: "هنوز حساب بانکی ثبت نشده است.",
    noTransactions: "تراکنش بانکی یافت نشد.",
    edit: "ویرایش",
    delete: "حذف",
    addBankTitle: "ثبت حساب بانکی",
    editBankTitle: "ویرایش حساب بانکی",
    bankHint: "برای هر حساب/اسعار مورد استفاده شرکت یک حساب بانکی جدا ثبت کنید.",
    transactionTitle: "ثبت تراکنش بانکی",
    transactionEditTitle: "ویرایش تراکنش بانکی",
    transactionHint: "واریز، پول نقد را به بانک انتقال می‌دهد و برداشت، پول بانک را دوباره به نقد تبدیل می‌کند.",
    bank: "بانک",
    selectBank: "بانک را انتخاب کنید",
    date: "تاریخ",
    type: "نوع",
    deposit: "واریز نقدی به بانک",
    withdrawal: "برداشت نقدی از بانک",
    amount: "مقدار",
    reference: "مرجع",
    description: "توضیحات",
    save: "ذخیره",
    update: "آپدیت",
    cancel: "لغو",
    saved: "حساب بانکی با موفقیت ثبت شد.",
    updated: "حساب بانکی با موفقیت ویرایش شد.",
    deleted: "حساب بانکی حذف شد.",
    transactionSaved: "تراکنش بانکی با موفقیت ثبت شد.",
    transactionUpdated: "تراکنش بانکی با موفقیت ویرایش شد.",
    transactionDeleted: "تراکنش بانکی حذف شد.",
    requiredBank: "نام بانک، نام حساب و اسعار را تکمیل کنید.",
    requiredTransaction: "بانک، تاریخ، نوع و مقدار بیشتر از صفر را تکمیل کنید.",
    usedBank: "این حساب بانکی تراکنش دارد و قابل حذف نیست.",
    deleteBankConfirm: "این حساب بانکی حذف شود؟",
    deleteTransactionConfirm: "این تراکنش بانکی حذف شود؟",
    balance: "بیلانس",
  },
  ps: {
    title: "بانکي حسابونه",
    subtitle: "بانکي حسابونه او د بانک نغدي جریان د Access د بانک برخې مطابق اداره کړئ.",
    addBank: "بانک اضافه کړئ",
    newTransaction: "نوی بانکي تراکنش",
    accounts: "بانکي حسابونه",
    transactions: "تراکنشونه",
    totalBanks: "ټول بانکونه",
    bankBalance: "د بانک بیلانس",
    deposits: "جمع شوې پیسې",
    withdrawals: "ایستل شوې پیسې",
    search: "د بانک، حساب یا مرجع لټون...",
    all: "ټول",
    bankName: "د بانک نوم",
    accountName: "د حساب نوم",
    accountNumber: "د حساب شمېره",
    currency: "اسعار",
    openingBalance: "ابتدایي بیلانس",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    notes: "یادښتونه",
    actions: "عملیات",
    noAccounts: "تر اوسه بانکي حساب نه دی ثبت شوی.",
    noTransactions: "بانکي تراکنش ونه موندل شو.",
    edit: "سمول",
    delete: "حذف",
    addBankTitle: "بانکي حساب ثبتول",
    editBankTitle: "بانکي حساب سمول",
    bankHint: "د شرکت د هر حساب/اسعار لپاره جلا بانکي حساب ثبت کړئ.",
    transactionTitle: "بانکي تراکنش ثبتول",
    transactionEditTitle: "بانکي تراکنش سمول",
    transactionHint: "جمع کول نغدې بانک ته وړي، او ایستل د بانک پیسې بېرته نغدو ته راوړي.",
    bank: "بانک",
    selectBank: "بانک وټاکئ",
    date: "نېټه",
    type: "ډول",
    deposit: "بانک ته نغدي جمع",
    withdrawal: "له بانک څخه نغدي ایستل",
    amount: "مقدار",
    reference: "مرجع",
    description: "تشریح",
    save: "ثبت",
    update: "اپډېټ",
    cancel: "لغوه",
    saved: "بانکي حساب ثبت شو.",
    updated: "بانکي حساب اپډېټ شو.",
    deleted: "بانکي حساب حذف شو.",
    transactionSaved: "بانکي تراکنش ثبت شو.",
    transactionUpdated: "بانکي تراکنش اپډېټ شو.",
    transactionDeleted: "بانکي تراکنش حذف شو.",
    requiredBank: "د بانک نوم، د حساب نوم او اسعار بشپړ کړئ.",
    requiredTransaction: "بانک، نېټه، ډول او له صفر څخه زیات مقدار بشپړ کړئ.",
    usedBank: "دا بانکي حساب تراکنشونه لري او حذف کېدای نه شي.",
    deleteBankConfirm: "دا بانکي حساب حذف شي؟",
    deleteTransactionConfirm: "دا بانکي تراکنش حذف شي؟",
    balance: "بیلانس",
  },
};

const blankBank = { bankName: "", accountName: "", accountNumber: "", currency: "AFN", openingBalance: "", status: "Active", notes: "" };
const blankTransaction = { bankId: "", date: todayDateValue(), type: "deposit", amount: "", reference: "", description: "" };

export default function Banks() {
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [banks, setBanks] = useJsonCollection("bankAccounts");
  const [transactions, setTransactions] = useJsonCollection("bankTransactions");
  const [activeTab, setActiveTab] = useState("accounts");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [modalType, setModalType] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [bankForm, setBankForm] = useState(blankBank);
  const [transactionForm, setTransactionForm] = useState(blankTransaction);

  const t = tr[language] || tr.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("app-language-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const opened = Boolean(modalType);
    document.body.classList.toggle("bank-modal-open", opened);
    return () => document.body.classList.remove("bank-modal-open");
  }, [modalType]);

  const bankMap = useMemo(() => new Map(banks.map((item) => [String(item.id), item])), [banks]);
  const balanceForBank = (bank) => {
    const opening = Number(bank?.openingBalance || 0) || 0;
    return transactions
      .filter((item) => String(item.bankId) === String(bank.id))
      .reduce((balance, item) => balance + (item.type === "deposit" ? numeric(item.amount) : -numeric(item.amount)), opening);
  };

  const visibleBanks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return banks.filter((bank) => {
      if (currencyFilter !== "ALL" && bank.currency !== currencyFilter) return false;
      if (!q) return true;
      return `${bank.bankName || ""} ${bank.accountName || ""} ${bank.accountNumber || ""}`.toLowerCase().includes(q);
    });
  }, [banks, currencyFilter, query]);

  const visibleTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .filter((item) => {
        const bank = bankMap.get(String(item.bankId));
        if (currencyFilter !== "ALL" && bank?.currency !== currencyFilter) return false;
        if (!q) return true;
        return `${bank?.bankName || ""} ${bank?.accountName || ""} ${item.reference || ""} ${item.description || ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.id).localeCompare(String(a.id)));
  }, [transactions, bankMap, currencyFilter, query]);

  const summary = useMemo(() => {
    const selectedBanks = currencyFilter === "ALL" ? banks : banks.filter((bank) => bank.currency === currencyFilter);
    const bankIds = new Set(selectedBanks.map((bank) => String(bank.id)));
    const rows = transactions.filter((item) => bankIds.has(String(item.bankId)));
    return {
      banks: selectedBanks.length,
      deposits: rows.reduce((sum, item) => sum + (item.type === "deposit" ? numeric(item.amount) : 0), 0),
      withdrawals: rows.reduce((sum, item) => sum + (item.type === "withdrawal" ? numeric(item.amount) : 0), 0),
      balance: selectedBanks.reduce((sum, bank) => sum + balanceForBank(bank), 0),
    };
  }, [banks, transactions, currencyFilter]);

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setBankForm(blankBank);
    setTransactionForm(blankTransaction);
  };

  const openBank = (bank = null) => {
    if (bank) {
      setEditingId(bank.id);
      setBankForm({ ...blankBank, ...bank, openingBalance: String(bank.openingBalance ?? "") });
    } else {
      setEditingId(null);
      setBankForm({ ...blankBank, currency: currencyFilter !== "ALL" ? currencyFilter : "AFN" });
    }
    setModalType("bank");
  };

  const openTransaction = (transaction = null, defaultBankId = "") => {
    if (transaction) {
      setEditingId(transaction.id);
      setTransactionForm({ ...blankTransaction, ...transaction, amount: String(transaction.amount ?? "") });
    } else {
      setEditingId(null);
      setTransactionForm({ ...blankTransaction, date: todayDateValue(), bankId: defaultBankId || "" });
    }
    setModalType("transaction");
  };

  const saveBank = async (event) => {
    event.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountName.trim() || !bankForm.currency) return notify(t.requiredBank, "warning");
    const now = new Date().toISOString();
    const record = {
      ...bankForm,
      bankName: bankForm.bankName.trim(),
      accountName: bankForm.accountName.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      openingBalance: Number(bankForm.openingBalance || 0) || 0,
      notes: bankForm.notes.trim(),
      updatedAt: now,
    };
    const next = editingId
      ? banks.map((item) => String(item.id) === String(editingId) ? { ...item, ...record } : item)
      : [{ id: `bank-${Date.now()}`, ...record, createdAt: now }, ...banks];
    const ok = await setBanks(next);
    if (ok) {
      notify(editingId ? t.updated : t.saved, "success");
      closeModal();
    }
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    const amount = numeric(transactionForm.amount);
    const bank = bankMap.get(String(transactionForm.bankId));
    if (!bank || !transactionForm.date || !["deposit", "withdrawal"].includes(transactionForm.type) || !amount) return notify(t.requiredTransaction, "warning");
    const now = new Date().toISOString();
    const record = {
      ...transactionForm,
      amount,
      currency: bank.currency,
      reference: transactionForm.reference.trim(),
      description: transactionForm.description.trim(),
      updatedAt: now,
    };
    const next = editingId
      ? transactions.map((item) => String(item.id) === String(editingId) ? { ...item, ...record } : item)
      : [{ id: `bank-txn-${Date.now()}`, ...record, createdAt: now }, ...transactions];
    const ok = await setTransactions(next);
    if (ok) {
      notify(editingId ? t.transactionUpdated : t.transactionSaved, "success");
      closeModal();
    }
  };

  const removeBank = async (bank) => {
    if (transactions.some((item) => String(item.bankId) === String(bank.id))) return notify(t.usedBank, "warning");
    const approved = await confirmAction({ message: t.deleteBankConfirm, confirmText: t.delete, cancelText: t.cancel, tone: "danger" });
    if (!approved) return;
    await setBanks(banks.filter((item) => String(item.id) !== String(bank.id)));
    notify(t.deleted, "success");
  };

  const removeTransaction = async (transaction) => {
    const approved = await confirmAction({ message: t.deleteTransactionConfirm, confirmText: t.delete, cancelText: t.cancel, tone: "danger" });
    if (!approved) return;
    await setTransactions(transactions.filter((item) => String(item.id) !== String(transaction.id)));
    notify(t.transactionDeleted, "success");
  };

  const money = (value, currency = currencyFilter === "ALL" ? "" : currencyFilter) => `${(Number(value || 0) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;

  return (
    <div className="banks-page" dir={direction}>
      <header className="banks-header">
        <div>
          <span className="banks-kicker"><Landmark size={15} />Bank Module</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="banks-header-actions">
          <button className="banks-secondary" type="button" onClick={() => openTransaction()}><WalletCards size={17} />{t.newTransaction}</button>
          <button className="banks-primary" type="button" onClick={() => openBank()}><Plus size={17} />{t.addBank}</button>
        </div>
      </header>

      <section className="banks-stats">
        <article><Building2 size={20} /><span>{t.totalBanks}</span><strong>{summary.banks}</strong></article>
        <article><Landmark size={20} /><span>{t.bankBalance}</span><strong>{money(summary.balance)}</strong></article>
        <article><ArrowDownToLine size={20} /><span>{t.deposits}</span><strong>{money(summary.deposits)}</strong></article>
        <article><ArrowUpFromLine size={20} /><span>{t.withdrawals}</span><strong>{money(summary.withdrawals)}</strong></article>
      </section>

      <section className="banks-card">
        <div className="banks-toolbar">
          <div className="banks-tabs">
            <button className={activeTab === "accounts" ? "active" : ""} onClick={() => setActiveTab("accounts")}>{t.accounts}</button>
            <button className={activeTab === "transactions" ? "active" : ""} onClick={() => setActiveTab("transactions")}>{t.transactions}</button>
          </div>
          <div className="banks-filters">
            <div className="banks-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /></div>
            <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}><option value="ALL">{t.all}</option>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select>
          </div>
        </div>

        {activeTab === "accounts" ? (
          <div className="banks-account-grid">
            {visibleBanks.map((bank) => (
              <article className="bank-account-card" key={bank.id}>
                <div className="bank-account-top"><div className="bank-icon"><Landmark size={20} /></div><div><h3>{bank.bankName}</h3><p>{bank.accountName}</p></div><span className={`bank-status ${String(bank.status).toLowerCase()}`}>{bank.status === "Inactive" ? t.inactive : t.active}</span></div>
                <div className="bank-account-number"><CreditCard size={15} />{bank.accountNumber || "—"}</div>
                <div className="bank-balance"><span>{t.balance}</span><strong>{money(balanceForBank(bank), bank.currency)}</strong></div>
                <div className="bank-account-meta"><span>{t.currency}<strong>{bank.currency}</strong></span><span>{t.openingBalance}<strong>{money(bank.openingBalance, bank.currency)}</strong></span></div>
                {bank.notes && <p className="bank-notes">{bank.notes}</p>}
                <div className="bank-card-actions"><button onClick={() => openTransaction(null, bank.id)}><Plus size={15} />{t.newTransaction}</button><button onClick={() => openBank(bank)}><Edit3 size={15} />{t.edit}</button><button className="danger" onClick={() => removeBank(bank)}><Trash2 size={15} />{t.delete}</button></div>
              </article>
            ))}
            {!visibleBanks.length && <div className="banks-empty"><Landmark size={32} /><p>{t.noAccounts}</p><button className="banks-primary" onClick={() => openBank()}><Plus size={16} />{t.addBank}</button></div>}
          </div>
        ) : (
          <div className="banks-table-wrap">
            <table>
              <thead><tr><th>{t.date}</th><th>{t.bank}</th><th>{t.type}</th><th>{t.reference}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.actions}</th></tr></thead>
              <tbody>
                {visibleTransactions.map((item) => {
                  const bank = bankMap.get(String(item.bankId));
                  return <tr key={item.id}><td>{item.date || "—"}</td><td><strong>{bank?.bankName || "—"}</strong><small>{bank?.accountName || ""}</small></td><td><span className={`bank-transaction-type ${item.type}`}>{item.type === "deposit" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}{item.type === "deposit" ? t.deposit : t.withdrawal}</span></td><td>{item.reference || "—"}</td><td>{item.description || "—"}</td><td className={item.type === "deposit" ? "amount-in" : "amount-out"}>{money(item.amount, bank?.currency || item.currency)}</td><td><div className="bank-row-actions"><button onClick={() => openTransaction(item)}><Edit3 size={15} /></button><button className="danger" onClick={() => removeTransaction(item)}><Trash2 size={15} /></button></div></td></tr>;
                })}
                {!visibleTransactions.length && <tr><td colSpan="7" className="banks-table-empty">{t.noTransactions}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalType && createPortal(
        <div className="bank-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bank-modal" role="dialog" aria-modal="true" dir={direction}>
            <div className="bank-modal-head"><div><h2><Landmark size={19} />{modalType === "bank" ? (editingId ? t.editBankTitle : t.addBankTitle) : (editingId ? t.transactionEditTitle : t.transactionTitle)}</h2><p>{modalType === "bank" ? t.bankHint : t.transactionHint}</p></div><button type="button" onClick={closeModal}><X size={18} /></button></div>
            {modalType === "bank" ? <form onSubmit={saveBank} className="bank-form">
              <div className="bank-form-grid">
                <label><span>{t.bankName}</span><input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} /></label>
                <label><span>{t.accountName}</span><input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} /></label>
                <label><span>{t.accountNumber}</span><input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} /></label>
                <label><span>{t.currency}</span><select value={bankForm.currency} onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
                <label><span>{t.openingBalance}</span><input type="number" step="any" value={bankForm.openingBalance} onChange={(e) => setBankForm({ ...bankForm, openingBalance: e.target.value })} /></label>
                <label><span>{t.status}</span><select value={bankForm.status} onChange={(e) => setBankForm({ ...bankForm, status: e.target.value })}><option value="Active">{t.active}</option><option value="Inactive">{t.inactive}</option></select></label>
                <label className="bank-form-full"><span>{t.notes}</span><textarea rows="3" value={bankForm.notes} onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })} /></label>
              </div>
              <div className="bank-modal-footer"><button type="button" className="banks-secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className="banks-primary">{editingId ? t.update : t.save}</button></div>
            </form> : <form onSubmit={saveTransaction} className="bank-form">
              <div className="bank-form-grid">
                <label><span>{t.bank}</span><select value={transactionForm.bankId} onChange={(e) => setTransactionForm({ ...transactionForm, bankId: e.target.value })}><option value="">{t.selectBank}</option>{banks.filter((bank) => bank.status !== "Inactive").map((bank) => <option key={bank.id} value={bank.id}>{bank.bankName} — {bank.accountName} ({bank.currency})</option>)}</select></label>
                <label><span>{t.date}</span><ShamsiDateInput value={transactionForm.date} onChange={(value) => setTransactionForm({ ...transactionForm, date: value })} /></label>
                <label><span>{t.type}</span><select value={transactionForm.type} onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}><option value="deposit">{t.deposit}</option><option value="withdrawal">{t.withdrawal}</option></select></label>
                <label><span>{t.amount}</span><input type="number" step="any" min="0" value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} /></label>
                <label className="bank-form-full"><span>{t.reference}</span><input value={transactionForm.reference} onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })} /></label>
                <label className="bank-form-full"><span>{t.description}</span><textarea rows="3" value={transactionForm.description} onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })} /></label>
              </div>
              <div className="bank-modal-footer"><button type="button" className="banks-secondary" onClick={closeModal}>{t.cancel}</button><button type="submit" className="banks-primary">{editingId ? t.update : t.save}</button></div>
            </form>}
          </div>
        </div>, document.body)}
    </div>
  );
}
