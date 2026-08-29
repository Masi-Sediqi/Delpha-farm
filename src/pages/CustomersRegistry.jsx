import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Building2, Edit3, MapPin, Phone, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./CustomersRegistry.css";

const rtlLanguages = new Set(["fa", "ps"]);
const labelsByLanguage = {
  en: {
    title: "Customers",
    subtitle: "Register and manage customer records.",
    add: "Register Customer",
    search: "Search customers...",
    empty: "No customers have been registered yet.",
    modalTitle: "Register New Customer",
    modalEditTitle: "Edit Customer",
    modalSubtitle: "Enter the customer's contact and account information.",
    customerType: "Customer Type",
    individual: "Individual",
    business: "Business",
    fullName: "Full Name",
    companyName: "Company / Business Name",
    phone: "Phone Number",
    alternatePhone: "Alternate Phone",
    email: "Email Address",
    idNumber: "National ID / Tax ID",
    address: "Address",
    city: "City",
    province: "Province / State",
    country: "Country",
    openingBalance: "Opening Balance",
    creditLimit: "Credit Limit",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    notes: "Notes",
    save: "Save Customer",
    update: "Update Customer",
    cancel: "Cancel",
    required: "Full name and phone number are required.",
    saved: "Customer saved successfully.",
    deleted: "Customer deleted successfully.",
    confirmDelete: "Delete this customer?",
    customer: "Customer",
    contact: "Contact",
    location: "Location",
    balance: "Opening Balance",
    actions: "Actions",
    count: "Customers",
    ledger: "Customer Ledger",
    ledgerSubtitle: "Purchases, payments and running balance for this customer.",
    date: "Date",
    type: "Type",
    reference: "Reference",
    description: "Description",
    purchase: "Purchase",
    payment: "Payment",
    debit: "Debit",
    credit: "Credit",
    runningBalance: "Balance",
    finalBalance: "Final Balance",
    close: "Close",
    openingEntry: "Opening balance",
    samplePurchase1: "Medicine purchase invoice",
    samplePayment1: "Cash payment received",
    samplePurchase2: "Second purchase invoice",
  },
  fa: {
    title: "مشتریان",
    subtitle: "ثبت و مدیریت معلومات مشتریان.",
    add: "ثبت مشتری جدید",
    search: "جستجوی مشتریان...",
    empty: "تا هنوز مشتری ثبت نشده است.",
    modalTitle: "ثبت مشتری جدید",
    modalEditTitle: "ویرایش مشتری",
    modalSubtitle: "معلومات تماس و حساب مشتری را وارد کنید.",
    customerType: "نوع مشتری",
    individual: "شخصی",
    business: "شرکتی",
    fullName: "نام مکمل",
    companyName: "نام شرکت / تجارت",
    phone: "شماره تماس",
    alternatePhone: "شماره تماس دوم",
    email: "ایمیل",
    idNumber: "تذکره / نمبر مالیاتی",
    address: "آدرس",
    city: "شهر",
    province: "ولایت",
    country: "کشور",
    openingBalance: "بیلانس افتتاحیه",
    creditLimit: "حد اعتبار",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    notes: "ملاحظات",
    save: "ذخیره مشتری",
    update: "ثبت تغییرات",
    cancel: "لغو",
    required: "نام مکمل و شماره تماس ضروری است.",
    saved: "مشتری با موفقیت ذخیره شد.",
    deleted: "مشتری حذف شد.",
    confirmDelete: "این مشتری حذف شود؟",
    customer: "مشتری",
    contact: "تماس",
    location: "آدرس",
    balance: "بیلانس افتتاحیه",
    actions: "عملیات",
    count: "تعداد مشتریان",
    ledger: "لیجر مشتری",
    ledgerSubtitle: "خریداری‌ها، پرداخت‌ها و بیلانس جاری این مشتری.",
    date: "تاریخ",
    type: "نوع",
    reference: "مرجع",
    description: "توضیحات",
    purchase: "خریداری",
    payment: "پرداخت",
    debit: "بدهکار",
    credit: "بستانکار",
    runningBalance: "بیلانس",
    finalBalance: "بیلانس نهایی",
    close: "بستن",
    openingEntry: "بیلانس افتتاحیه",
    samplePurchase1: "خریداری دوا - بل",
    samplePayment1: "پرداخت نقدی مشتری",
    samplePurchase2: "خریداری دوم",
  },
  ps: {
    title: "پېرودونکي",
    subtitle: "د پېرودونکو معلومات ثبت او اداره کړئ.",
    add: "نوی پېرودونکی ثبت کړئ",
    search: "پېرودونکي ولټوئ...",
    empty: "تر اوسه کوم پېرودونکی نه دی ثبت شوی.",
    modalTitle: "نوی پېرودونکی ثبت کړئ",
    modalEditTitle: "د پېرودونکي سمون",
    modalSubtitle: "د پېرودونکي د اړیکې او حساب معلومات ولیکئ.",
    customerType: "د پېرودونکي ډول",
    individual: "شخصي",
    business: "شرکت",
    fullName: "بشپړ نوم",
    companyName: "د شرکت / کاروبار نوم",
    phone: "د اړیکې شمېره",
    alternatePhone: "دوهمه شمېره",
    email: "برېښنالیک",
    idNumber: "تذکره / مالیاتي شمېره",
    address: "پته",
    city: "ښار",
    province: "ولایت",
    country: "هېواد",
    openingBalance: "افتتاحي بیلانس",
    creditLimit: "د اعتبار حد",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    notes: "یادښتونه",
    save: "پېرودونکی ثبت کړئ",
    update: "بدلونونه ثبت کړئ",
    cancel: "لغوه",
    required: "بشپړ نوم او د اړیکې شمېره اړینه ده.",
    saved: "پېرودونکی په بریالیتوب ثبت شو.",
    deleted: "پېرودونکی حذف شو.",
    confirmDelete: "دا پېرودونکی حذف شي؟",
    customer: "پېرودونکی",
    contact: "اړیکه",
    location: "پته",
    balance: "افتتاحي بیلانس",
    actions: "عملیات",
    count: "پېرودونکي",
    ledger: "د پېرودونکي لیجر",
    ledgerSubtitle: "د دې پېرودونکي پېرودنې، تادیات او روان بیلانس.",
    date: "نېټه",
    type: "ډول",
    reference: "مرجع",
    description: "تفصیل",
    purchase: "پېرودنه",
    payment: "تادیه",
    debit: "بدهکار",
    credit: "بستانکار",
    runningBalance: "بیلانس",
    finalBalance: "وروستی بیلانس",
    close: "بندول",
    openingEntry: "افتتاحي بیلانس",
    samplePurchase1: "د دوا پېرودنې بل",
    samplePayment1: "نغدي تادیه",
    samplePurchase2: "دوهمه پېرودنه",
  },
};

const blankForm = {
  fullName: "",
  companyName: "",
  phone: "",
  address: "",
  openingBalance: "0",
  status: "active",
  notes: "",
};

export default function CustomersRegistry() {
  const language = localStorage.getItem("afghan-power-language") || "en";
  const t = labelsByLanguage[language] || labelsByLanguage.en;
  const isRtl = rtlLanguages.has(language);
  const [customers, setCustomers] = useJsonCollection("customerRegistry");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((item) =>
      [item.fullName, item.companyName, item.phone, item.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [customers, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm);
    setIsOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...blankForm, ...item });
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveCustomer = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      notify(t.required, "warning");
      return;
    }

    const {
      customerType: _customerType,
      alternatePhone: _alternatePhone,
      email: _email,
      idNumber: _idNumber,
      city: _city,
      province: _province,
      country: _country,
      creditLimit: _creditLimit,
      ...visibleForm
    } = form;

    const record = {
      ...visibleForm,
      fullName: form.fullName.trim(),
      companyName: form.companyName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      openingBalance: Number(form.openingBalance || 0),
      updatedAt: new Date().toISOString(),
    };

    const ok = await setCustomers((current) => {
      if (editingId) return current.map((item) => (item.id === editingId ? { ...item, ...record } : item));
      return [{ ...record, id: `CUS-${Date.now()}`, createdAt: new Date().toISOString() }, ...current];
    });
    if (ok !== false) {
      notify(t.saved, "success", { silent: true });
      closeModal();
    }
  };

  const removeCustomer = async (item) => {
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: item.fullName || item.companyName || t.confirmDelete,
      confirmText: t.delete || "Delete",
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const ok = await setCustomers((current) => current.filter((row) => row.id !== item.id));
    if (ok !== false) notify(t.deleted, "success");
  };


  return (
    <div className="customer-registry-page" dir={isRtl ? "rtl" : "ltr"}>
      <div className="customer-registry-heading">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="customer-primary-btn" type="button" onClick={openCreate}>
          <Plus size={18} /> {t.add}
        </button>
      </div>

      <div className="customer-registry-toolbar">
        <div className="customer-search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} />
        </div>
        <div className="customer-count"><UsersIcon /> <strong>{customers.length}</strong> {t.count}</div>
      </div>

      <div className="customer-table-card">
        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>{t.customer}</th>
                <th>{t.contact}</th>
                <th>{t.location}</th>
                <th>{t.balance}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="customer-clickable-row" onClick={() => navigate(`/customer-detail/${encodeURIComponent(item.id)}`)}>
                  <td>
                    <div className="customer-name-cell">
                      <span className="customer-avatar"><UserRound size={18} /></span>
                      <div><strong>{item.fullName}</strong><small>{item.companyName || "—"}</small></div>
                    </div>
                  </td>
                  <td><strong>{item.phone}</strong></td>
                  <td>{item.address || "—"}</td>
                  <td>{Number(item.openingBalance || 0).toLocaleString()}</td>
                  <td><span className={`customer-status ${item.status}`}>{item.status === "inactive" ? t.inactive : t.active}</span></td>
                  <td>
                    <div className="customer-row-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(item); }} aria-label="Edit"><Edit3 size={16} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeCustomer(item); }} aria-label="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td className="customer-empty" colSpan="6">{t.empty}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>


      {isOpen && createPortal(
        <div
          className="customer-modal-layer"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customer-modal-head">
              <div><h2 id="customer-modal-title">{editingId ? t.modalEditTitle : t.modalTitle}</h2><p>{t.modalSubtitle}</p></div>
              <button type="button" className="customer-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={saveCustomer}>
              <div className="customer-form-body">
                <section className="customer-form-section">
                  <div className="customer-section-title"><UserRound size={18} /><span>{t.customer}</span></div>
                  <div className="customer-form-grid">
                    <label className="customer-field"><span>{t.fullName} *</span><input value={form.fullName} onChange={(e) => change("fullName", e.target.value)} autoFocus /></label>
                    <label className="customer-field customer-span-6"><span>{t.companyName}</span><div className="customer-input-icon"><Building2 size={17} /><input value={form.companyName} onChange={(e) => change("companyName", e.target.value)} /></div></label>
                  </div>
                </section>

                <section className="customer-form-section">
                  <div className="customer-section-title"><Phone size={18} /><span>{t.contact}</span></div>
                  <div className="customer-form-grid">
                    <label className="customer-field"><span>{t.phone} *</span><input value={form.phone} onChange={(e) => change("phone", e.target.value)} /></label>
                  </div>
                </section>

                <section className="customer-form-section">
                  <div className="customer-section-title"><MapPin size={18} /><span>{t.location}</span></div>
                  <div className="customer-form-grid">
                    <label className="customer-field customer-span-6"><span>{t.address}</span><input value={form.address} onChange={(e) => change("address", e.target.value)} /></label>
                  </div>
                </section>

                <section className="customer-form-section">
                  <div className="customer-section-title"><Building2 size={18} /><span>{t.balance}</span></div>
                  <div className="customer-form-grid">
                    <label className="customer-field"><span>{t.openingBalance}</span><input type="number" step="any" value={form.openingBalance} onChange={(e) => change("openingBalance", e.target.value)} /></label>
                    <label className="customer-field customer-span-6"><span>{t.status}</span><select value={form.status} onChange={(e) => change("status", e.target.value)}><option value="active">{t.active}</option><option value="inactive">{t.inactive}</option></select></label>
                    <label className="customer-field customer-span-2"><span>{t.notes}</span><textarea rows="4" value={form.notes} onChange={(e) => change("notes", e.target.value)} /></label>
                  </div>
                </section>
              </div>

              <div className="customer-modal-footer">
                <button type="button" className="customer-secondary-btn" onClick={closeModal}>{t.cancel}</button>
                <button type="submit" className="customer-primary-btn">{editingId ? t.update : t.save}</button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}

function UsersIcon() {
  return <UserRound size={16} />;
}
