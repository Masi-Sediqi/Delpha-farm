import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Factory, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { environmentStorageKey } from "../config/appConfig";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./Companies.css";

const languageKey = "afghan-power-language";
const migrationKey = environmentStorageKey("apg-manufacturers-migrated-v1");

const translations = {
  en: {
    title: "Manufacturers",
    subtitle: "Register and manage medicine manufacturers. Suppliers are managed separately.",
    add: "Add Manufacturer",
    total: "Total Manufacturers",
    search: "Search manufacturer, country, phone or address...",
    empty: "No manufacturers have been registered yet.",
    name: "Manufacturer Name",
    country: "Country",
    phone: "Phone Number",
    address: "Address",
    notes: "Notes",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    actions: "Actions",
    addTitle: "Register Manufacturer",
    editTitle: "Edit Manufacturer",
    hint: "Enter the medicine manufacturer's information below.",
    save: "Save Manufacturer",
    update: "Update Manufacturer",
    cancel: "Cancel",
    required: "Please enter the manufacturer name.",
    saved: "Manufacturer saved successfully.",
    updated: "Manufacturer updated successfully.",
    deleted: "Manufacturer deleted successfully.",
    confirmDelete: "Delete this manufacturer?",
    inUse: "This manufacturer is used by one or more products and cannot be deleted.",
  },
  fa: {
    title: "شرکت‌های سازنده",
    subtitle: "کمپنی‌های تولیدکننده دوا را ثبت و مدیریت کنید. تأمین‌کننده‌گان بخش جدا دارند.",
    add: "شرکت سازنده جدید",
    total: "تعداد شرکت‌های سازنده",
    search: "جستجوی کمپنی سازنده، کشور، شماره یا آدرس...",
    empty: "هنوز شرکت سازنده‌ای ثبت نشده است.",
    name: "نام شرکت سازنده",
    country: "کشور",
    phone: "شماره تماس",
    address: "آدرس",
    notes: "ملاحظات",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    actions: "عملیات",
    addTitle: "ثبت شرکت سازنده",
    editTitle: "اصلاح شرکت سازنده",
    hint: "معلومات کمپنی تولیدکننده دوا را وارد کنید.",
    save: "ذخیره شرکت سازنده",
    update: "ثبت تغییرات",
    cancel: "لغو",
    required: "لطفاً نام شرکت سازنده را وارد کنید.",
    saved: "شرکت سازنده با موفقیت ذخیره شد.",
    updated: "شرکت سازنده با موفقیت اصلاح شد.",
    deleted: "شرکت سازنده با موفقیت حذف شد.",
    confirmDelete: "این شرکت سازنده حذف شود؟",
    inUse: "این شرکت سازنده در یک یا چند محصول استفاده شده و قابل حذف نیست.",
  },
  ps: {
    title: "تولیدوونکي شرکتونه",
    subtitle: "د درملو تولیدوونکي شرکتونه ثبت او اداره کړئ. عرضه کوونکي جلا برخه لري.",
    add: "نوی تولیدوونکی شرکت",
    total: "د تولیدوونکو شمېر",
    search: "د تولیدوونکي، هېواد، شمېرې یا پتې لټون...",
    empty: "تر اوسه تولیدوونکی شرکت نه دی ثبت شوی.",
    name: "د تولیدوونکي شرکت نوم",
    country: "هېواد",
    phone: "د اړیکې شمېره",
    address: "پته",
    notes: "ملاحظات",
    status: "حالت",
    active: "فعال",
    inactive: "غیرفعال",
    actions: "عملیات",
    addTitle: "تولیدوونکی شرکت ثبتول",
    editTitle: "د تولیدوونکي شرکت سمون",
    hint: "د درملو تولیدوونکي شرکت معلومات ولیکئ.",
    save: "تولیدوونکی ذخیره کول",
    update: "بدلونونه ثبتول",
    cancel: "لغوه",
    required: "مهرباني وکړئ د تولیدوونکي شرکت نوم ولیکئ.",
    saved: "تولیدوونکی شرکت په بریالیتوب ذخیره شو.",
    updated: "تولیدوونکی شرکت په بریالیتوب سم شو.",
    deleted: "تولیدوونکی شرکت په بریالیتوب حذف شو.",
    confirmDelete: "دا تولیدوونکی شرکت حذف شي؟",
    inUse: "دا تولیدوونکی شرکت په محصول کې کارول شوی او حذف کېدای نه شي.",
  },
};

const emptyForm = {
  manufacturerName: "",
  country: "",
  phone: "",
  address: "",
  notes: "",
  status: "active",
};

const normalizeLegacyCompany = (item) => ({
  id: item.id || `MFR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  manufacturerName: item.manufacturerName || item.companyName || item.name || "",
  country: item.country || item.madeIn || "",
  phone: item.phone || "",
  address: item.address || "",
  notes: item.notes || "",
  status: item.status || "active",
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString(),
  migratedFromCompany: true,
});

export default function Companies() {
  const [manufacturers, setManufacturers, , manufacturersLoaded] = useJsonCollection("manufacturers");
  const [legacyCompanies, , , legacyLoaded] = useJsonCollection("companies");
  const [products] = useJsonCollection("products");
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
    if (!manufacturersLoaded || !legacyLoaded) return;
    if (localStorage.getItem(migrationKey) === "1") return;

    const migrate = async () => {
      if (!manufacturers.length && legacyCompanies.length) {
        await setManufacturers(legacyCompanies.map(normalizeLegacyCompany));
      }
      localStorage.setItem(migrationKey, "1");
    };

    migrate();
  }, [manufacturersLoaded, legacyLoaded, manufacturers.length, legacyCompanies, setManufacturers]);

  useEffect(() => {
    document.body.classList.toggle("company-modal-open", showModal);
    return () => document.body.classList.remove("company-modal-open");
  }, [showModal]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return manufacturers;
    return manufacturers.filter((item) =>
      [item.manufacturerName, item.country, item.phone, item.address, item.notes]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [manufacturers, search]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.manufacturerName.trim();
    if (!name) {
      notify(t.required, "warning");
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      const saved = await setManufacturers(manufacturers.map((item) =>
        String(item.id) === String(editingId)
          ? { ...item, ...form, manufacturerName: name, updatedAt: now }
          : item
      ));
      if (!saved) return;
      notify(t.updated, "success");
    } else {
      const saved = await setManufacturers([
        {
          ...form,
          manufacturerName: name,
          id: `MFR-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        },
        ...manufacturers,
      ]);
      if (!saved) return;
      notify(t.saved, "success");
    }
    closeModal();
  };

  const removeManufacturer = async (item) => {
    const inUse = products.some((product) =>
      String(product.manufacturerId || product.companyId || "") === String(item.id)
    );
    if (inUse) {
      notify(t.inUse, "warning");
      return;
    }

    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: item.manufacturerName || t.confirmDelete,
      confirmText: "Delete",
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const saved = await setManufacturers(manufacturers.filter((manufacturer) => manufacturer.id !== item.id));
    if (saved) notify(t.deleted, "success");
  };

  return (
    <div className="companies-page" dir={direction}>
      <div className="companies-header">
        <div>
          <div className="companies-title-line">
            <Factory size={25} />
            <h1>{t.title}</h1>
          </div>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="companies-add-btn" onClick={openNew}>
          <Plus size={18} />
          <span>{t.add}</span>
        </button>
      </div>

      <div className="companies-card">
        <div className="companies-toolbar">
          <div className="companies-search">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          </div>
          <div className="companies-total" dir={direction}>
            <span>{t.total}</span>
            <strong>{manufacturers.length}</strong>
          </div>
        </div>

        <div className="companies-table-wrap">
          <table className="companies-table manufacturer-table">
            <thead>
              <tr>
                <th>{t.name}</th>
                <th>{t.country}</th>
                <th>{t.phone}</th>
                <th>{t.address}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="companies-empty">{t.empty}</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id}>
                  <td className="company-name-cell">{item.manufacturerName}</td>
                  <td>{item.country || "—"}</td>
                  <td dir="ltr">{item.phone || "—"}</td>
                  <td className="manufacturer-address-cell">{item.address || "—"}</td>
                  <td><span className={`manufacturer-status ${item.status === "inactive" ? "inactive" : "active"}`}>{item.status === "inactive" ? t.inactive : t.active}</span></td>
                  <td>
                    <div className="companies-actions">
                      <button type="button" onClick={() => openEdit(item)} title={t.editTitle}><Edit3 size={16} /></button>
                      <button type="button" className="danger" onClick={() => removeManufacturer(item)} title={t.confirmDelete}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal((
        <div className="company-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="company-modal" role="dialog" aria-modal="true" dir={direction} onClick={(event) => event.stopPropagation()}>
            <div className="company-modal-header">
              <div>
                <h2>{editingId ? t.editTitle : t.addTitle}</h2>
                <p>{t.hint}</p>
              </div>
              <button type="button" className="company-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <form className="company-form" onSubmit={handleSubmit}>
              <div className="company-field full">
                <label>{t.name} *</label>
                <input value={form.manufacturerName} onChange={(e) => updateField("manufacturerName", e.target.value)} autoFocus />
              </div>

              <div className="company-field">
                <label>{t.country}</label>
                <input value={form.country} onChange={(e) => updateField("country", e.target.value)} />
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
                <label>{t.status}</label>
                <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
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
      ), document.body)}
    </div>
  );
}
