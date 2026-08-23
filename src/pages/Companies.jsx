import { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Companies.css";

const languageKey = "afghan-power-language";

const translations = {
  en: {
    title: "Companies",
    subtitle: "Register and manage supplier and business companies.",
    add: "Register New Company",
    total: "Total Companies",
    search: "Search company, type, contact or phone...",
    empty: "No companies have been registered yet.",
    companyName: "Company Name",
    type: "Type",
    priceType: "Price Type",
    contactPerson: "Contact Person",
    phone: "Phone Number",
    address: "Address",
    openingBalance: "Opening Balance (+ / -)",
    ledgerPage: "Ledger Page",
    notes: "Notes",
    actions: "Actions",
    addTitle: "Register New Company",
    editTitle: "Edit Company",
    hint: "Enter the company information below.",
    selectType: "Select type",
    selectPriceType: "Select price type",
    supplier: "Supplier",
    sales: "Sales",
    both: "Supplier & Sales",
    pharmacy: "Pharmacy",
    drugstore: "Drugstore",
    dostHajiZaman: "Dost Haji Zaman",
    dostHajiSharif: "Dost Haji Sharif",
    company: "Company",
    wholesaleType: "Wholesale",
    pharmacist: "Pharmacist",
    unknown: "Unknown",
    inventory: "Inventory",
    representative: "Representative",
    usd: "Dollar",
    afn: "Afghani",
    pkr: "Kaldar",
    save: "Save Company",
    update: "Update Company",
    cancel: "Cancel",
    required: "Please enter the company name.",
    saved: "Company saved successfully.",
    updated: "Company updated successfully.",
    deleted: "Company deleted successfully.",
    confirmDelete: "Delete this company?",
  },
  fa: {
    title: "شرکت‌ها",
    subtitle: "شرکت‌های تأمین‌کننده و تجارتی را ثبت و مدیریت کنید.",
    add: "ثبت شرکت جدید",
    total: "تعداد شرکت‌ها",
    search: "جستجوی نام شرکت، نوع، شخص تماس یا شماره...",
    empty: "هنوز هیچ شرکتی ثبت نشده است.",
    companyName: "نام شرکت",
    type: "نوع",
    priceType: "نوع اسعار",
    contactPerson: "شخص ارتباطی",
    phone: "شماره تماس",
    address: "آدرس",
    openingBalance: "بیلانس افتتاحیه (+ یا -)",
    ledgerPage: "صفحه کتاب تأدیات",
    notes: "ملاحظات",
    actions: "عملیات",
    addTitle: "ثبت شرکت جدید",
    editTitle: "اصلاح شرکت",
    hint: "معلومات شرکت را در فورم زیر وارد کنید.",
    selectType: "نوع را انتخاب کنید",
    selectPriceType: "نوع اسعار را انتخاب کنید",
    supplier: "تأمین‌کننده",
    sales: "فروش",
    both: "تأمین‌کننده و فروش",
    pharmacy: "پرچون",
    drugstore: "درملتون",
    dostHajiZaman: "دوست حاجی زمان",
    dostHajiSharif: "دوست حاجی شریف",
    company: "شرکت",
    wholesaleType: "عمده",
    pharmacist: "فارمسست",
    unknown: "مجهول",
    inventory: "موجودی",
    representative: "نماینده",
    usd: "دالر",
    afn: "افغانی",
    pkr: "کلدار",
    save: "ذخیره شرکت",
    update: "ثبت تغییرات",
    cancel: "لغو",
    required: "لطفاً نام شرکت را وارد کنید.",
    saved: "شرکت با موفقیت ذخیره شد.",
    updated: "شرکت با موفقیت اصلاح شد.",
    deleted: "شرکت با موفقیت حذف شد.",
    confirmDelete: "این شرکت حذف شود؟",
  },
  ps: {
    title: "شرکتونه",
    subtitle: "عرضه کوونکي او سوداګریز شرکتونه ثبت او اداره کړئ.",
    add: "نوی شرکت ثبتول",
    total: "د شرکتونو شمېر",
    search: "د شرکت، ډول، اړیکې کس یا شمېرې لټون...",
    empty: "تر اوسه کوم شرکت نه دی ثبت شوی.",
    companyName: "د شرکت نوم",
    type: "ډول",
    priceType: "د اسعارو ډول",
    contactPerson: "د اړیکې کس",
    phone: "د اړیکې شمېره",
    address: "پته",
    openingBalance: "افتتاحي بیلانس (+ یا -)",
    ledgerPage: "د تادیاتو کتاب پاڼه",
    notes: "ملاحظات",
    actions: "عملیات",
    addTitle: "نوی شرکت ثبتول",
    editTitle: "د شرکت سمون",
    hint: "د شرکت معلومات په لاندې فورم کې ولیکئ.",
    selectType: "ډول وټاکئ",
    selectPriceType: "د اسعارو ډول وټاکئ",
    supplier: "عرضه کوونکی",
    sales: "خرڅلاو",
    both: "عرضه او خرڅلاو",
    pharmacy: "پرچون",
    drugstore: "درملتون",
    dostHajiZaman: "د حاجي زمان دوست",
    dostHajiSharif: "د حاجي شریف دوست",
    company: "شرکت",
    wholesaleType: "عمده",
    pharmacist: "فارمسست",
    unknown: "نامعلوم",
    inventory: "موجودي",
    representative: "استازی",
    usd: "ډالر",
    afn: "افغانۍ",
    pkr: "کلدار",
    save: "شرکت ذخیره کول",
    update: "بدلونونه ثبتول",
    cancel: "لغوه",
    required: "مهرباني وکړئ د شرکت نوم ولیکئ.",
    saved: "شرکت په بریالیتوب سره ذخیره شو.",
    updated: "شرکت په بریالیتوب سره سم شو.",
    deleted: "شرکت په بریالیتوب سره حذف شو.",
    confirmDelete: "دا شرکت حذف شي؟",
  },
};

const emptyForm = {
  companyName: "",
  type: "",
  priceType: "",
  contactPerson: "",
  phone: "",
  address: "",
  openingBalance: "",
  ledgerPage: "",
  notes: "",
};

export default function Companies() {
  const [companies, setCompanies] = useJsonCollection("companies");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const t = translations[language] || translations.en;
  const direction = language === "en" ? "ltr" : "rtl";

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
    document.body.classList.toggle("company-modal-open", showModal);
    return () => document.body.classList.remove("company-modal-open");
  }, [showModal]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((item) =>
      [item.companyName, item.type, item.priceType, item.contactPerson, item.phone, item.address]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [companies, search]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.companyName.trim()) {
      notify(t.required, "warning");
      return;
    }

    if (editingId) {
      setCompanies(companies.map((item) => item.id === editingId ? { ...item, ...form, updatedAt: new Date().toISOString() } : item));
      notify(t.updated, "success");
    } else {
      setCompanies([
        {
          ...form,
          id: `CMP-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...companies,
      ]);
      notify(t.saved, "success");
    }
    closeModal();
  };

  const removeCompany = (item) => {
    if (!window.confirm(t.confirmDelete)) return;
    setCompanies(companies.filter((company) => company.id !== item.id));
    notify(t.deleted, "success");
  };

  return (
    <div className="companies-page" dir={direction}>
      <div className="companies-header">
        <div>
          <div className="companies-title-line">
            <Building2 size={25} />
            <h1>{t.title}</h1>
          </div>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="companies-add-btn" onClick={openNew}>
          <Plus size={18} />
          <span>{t.add}</span>
        </button>
      </div>

      <div className="companies-stat-card">
        <span>{t.total}</span>
        <strong>{companies.length}</strong>
      </div>

      <div className="companies-card">
        <div className="companies-toolbar">
          <div className="companies-search">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          </div>
        </div>

        <div className="companies-table-wrap">
          <table className="companies-table">
            <thead>
              <tr>
                <th>{t.companyName}</th>
                <th>{t.type}</th>
                <th>{t.priceType}</th>
                <th>{t.contactPerson}</th>
                <th>{t.phone}</th>
                <th>{t.openingBalance}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="companies-empty">{t.empty}</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id}>
                  <td className="company-name-cell">{item.companyName}</td>
                  <td>{item.type || "—"}</td>
                  <td>{item.priceType || "—"}</td>
                  <td>{item.contactPerson || "—"}</td>
                  <td dir="ltr">{item.phone || "—"}</td>
                  <td dir="ltr">{item.openingBalance || "0.00"}</td>
                  <td>
                    <div className="companies-actions">
                      <button type="button" onClick={() => openEdit(item)} title={t.editTitle}><Edit3 size={16} /></button>
                      <button type="button" className="danger" onClick={() => removeCompany(item)} title={t.confirmDelete}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="company-modal-backdrop" role="presentation">
          <div className="company-modal" role="dialog" aria-modal="true" dir={direction}>
            <div className="company-modal-header">
              <div>
                <h2>{editingId ? t.editTitle : t.addTitle}</h2>
                <p>{t.hint}</p>
              </div>
              <button type="button" className="company-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form className="company-form" onSubmit={handleSubmit}>
              <div className="company-field full">
                <label>{t.companyName} *</label>
                <input value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} autoFocus />
              </div>

              <div className="company-field">
                <label>{t.type}</label>
                <select value={form.type} onChange={(e) => updateField("type", e.target.value)}>
                  <option value="">{t.selectType}</option>
                  <option value="retail">{t.pharmacy}</option>
                  <option value="drugstore">{t.drugstore}</option>
                  <option value="dost_haji_zaman">{t.dostHajiZaman}</option>
                  <option value="dost_haji_sharif">{t.dostHajiSharif}</option>
                  <option value="company">{t.company}</option>
                  <option value="wholesale">{t.wholesaleType}</option>
                  <option value="pharmacist">{t.pharmacist}</option>
                  <option value="unknown">{t.unknown}</option>
                  <option value="inventory">{t.inventory}</option>
                  <option value="representative">{t.representative}</option>
                </select>
              </div>

              <div className="company-field">
                <label>{t.priceType}</label>
                <select value={form.priceType} onChange={(e) => updateField("priceType", e.target.value)}>
                  <option value="">{t.selectPriceType}</option>
                  <option value="USD">{t.usd}</option>
                  <option value="AFN">{t.afn}</option>
                  <option value="PKR">{t.pkr}</option>
                </select>
              </div>

              <div className="company-field">
                <label>{t.contactPerson}</label>
                <input value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
              </div>

              <div className="company-field">
                <label>{t.phone}</label>
                <input dir="ltr" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>

              <div className="company-field full">
                <label>{t.address}</label>
                <textarea rows="2" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>

              <div className="company-field">
                <label>{t.openingBalance}</label>
                <input dir="ltr" type="number" step="0.01" value={form.openingBalance} onChange={(e) => updateField("openingBalance", e.target.value)} placeholder="0.00" />
              </div>

              <div className="company-field">
                <label>{t.ledgerPage}</label>
                <input value={form.ledgerPage} onChange={(e) => updateField("ledgerPage", e.target.value)} />
              </div>

              <div className="company-field full">
                <label>{t.notes}</label>
                <textarea rows="4" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
              </div>

              <div className="company-form-actions full">
                <button type="button" className="secondary" onClick={closeModal}>{t.cancel}</button>
                <button type="submit" className="primary">{editingId ? t.update : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
