import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  Building2,
  Edit3,
  MapPin,
  Plus,
  Search,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import "./Suppliers.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);

const translations = {
  en: {
    title: "Suppliers",
    subtitle: "Register and manage suppliers, balances and contact information.",
    add: "Register New Supplier",
    total: "Total Suppliers",
    active: "Active",
    inactive: "Inactive",
    search: "Search supplier, type, contact or phone...",
    empty: "No suppliers have been registered yet.",
    supplierName: "Supplier Name",
    supplierType: "Supplier Type",
    currency: "Currency",
    contactPerson: "Contact Person",
    phone: "Phone Number",
    address: "Address",
    openingBalance: "Opening Balance (+ / -)",
    openingBalanceHint: "Positive means we owe the supplier. Negative means the supplier owes us.",
    notes: "Notes",
    status: "Status",
    actions: "Actions",
    addTitle: "Register New Supplier",
    editTitle: "Edit Supplier",
    hint: "Enter the supplier information based on the supplier account structure.",
    selectType: "Select supplier type",
    selectCurrency: "Select currency",
    wholesale: "Wholesale",
    retail: "Retail",
    pharmacy: "Pharmacy",
    drugstore: "Drugstore",
    company: "Company",
    representative: "Representative",
    pharmacist: "Pharmacist",
    inventory: "Inventory",
    unknown: "Unknown",
    dostHajiZaman: "Dost Haji Zaman",
    dostHajiSharif: "Dost Haji Sharif",
    afn: "Afghani (AFN)",
    usd: "US Dollar (USD)",
    inr: "Indian Rupee (INR)",
    addType: "Add supplier type",
    newType: "New supplier type",
    typeName: "Type name",
    saveType: "Save Type",
    updateType: "Update Type",
    manageTypes: "Manage custom types",
    noCustomTypes: "No custom supplier types yet.",
    typeSaved: "Supplier type saved.",
    typeUpdated: "Supplier type updated.",
    typeDeleted: "Supplier type deleted.",
    typeRequired: "Enter a supplier type name.",
    typeInUse: "This supplier type is used by a supplier and cannot be deleted.",
    eur: "Euro (EUR)",
    save: "Save Supplier",
    update: "Update Supplier",
    cancel: "Cancel",
    required: "Please enter the supplier name.",
    saved: "Supplier saved successfully.",
    updated: "Supplier updated successfully.",
    deleted: "Supplier deleted successfully.",
    confirmDelete: "Delete this supplier?",
  },
  fa: {
    title: "تأمین‌کننده‌گان",
    subtitle: "تأمین‌کننده‌گان، بیلانس و معلومات ارتباطی آنان را ثبت و مدیریت کنید.",
    add: "ثبت تأمین‌کننده جدید",
    total: "تعداد تأمین‌کننده‌گان",
    active: "فعال",
    inactive: "غیرفعال",
    search: "جستجوی نام، نوع، شخص ارتباطی یا شماره تماس...",
    empty: "هنوز هیچ تأمین‌کننده ثبت نشده است.",
    supplierName: "نام تأمین‌کننده",
    supplierType: "نوع",
    currency: "نوع اسعار",
    contactPerson: "شخص ارتباطی",
    phone: "شماره تماس",
    address: "آدرس",
    openingBalance: "بیلانس افتتاحیه (+ / -)",
    openingBalanceHint: "مثبت یعنی ما قرضدار تأمین‌کننده هستیم. منفی یعنی تأمین‌کننده قرضدار ما است.",
    notes: "ملاحظات",
    status: "حالت",
    actions: "عملیات",
    addTitle: "ثبت تأمین‌کننده جدید",
    editTitle: "اصلاح تأمین‌کننده",
    hint: "معلومات تأمین‌کننده را مطابق ساختار حساب تأمین‌کننده وارد کنید.",
    selectType: "نوع تأمین‌کننده را انتخاب کنید",
    selectCurrency: "نوع اسعار را انتخاب کنید",
    wholesale: "عمده",
    retail: "پرچون",
    pharmacy: "فارمیسی",
    drugstore: "درملتون",
    company: "شرکت",
    representative: "نماینده",
    pharmacist: "فارمسست",
    inventory: "موجودی",
    unknown: "مجهول",
    dostHajiZaman: "دوست حاجی زمان",
    dostHajiSharif: "دوست حاجی شریف",
    afn: "افغانی (AFN)",
    usd: "دالر (USD)",
    inr: "کلدار هندی (INR)",
    addType: "افزودن نوع تأمین‌کننده",
    newType: "نوع جدید تأمین‌کننده",
    typeName: "نام نوع",
    saveType: "ذخیره نوع",
    updateType: "ثبت تغییرات",
    manageTypes: "مدیریت نوع‌های اضافه‌شده",
    noCustomTypes: "هنوز نوع جدیدی اضافه نشده است.",
    typeSaved: "نوع تأمین‌کننده ذخیره شد.",
    typeUpdated: "نوع تأمین‌کننده اصلاح شد.",
    typeDeleted: "نوع تأمین‌کننده حذف شد.",
    typeRequired: "نام نوع تأمین‌کننده را وارد کنید.",
    typeInUse: "این نوع توسط یک تأمین‌کننده استفاده شده و قابل حذف نیست.",
    eur: "یورو (EUR)",
    save: "ذخیره تأمین‌کننده",
    update: "ثبت تغییرات",
    cancel: "لغو",
    required: "لطفاً نام تأمین‌کننده را وارد کنید.",
    saved: "تأمین‌کننده با موفقیت ذخیره شد.",
    updated: "تأمین‌کننده با موفقیت اصلاح شد.",
    deleted: "تأمین‌کننده با موفقیت حذف شد.",
    confirmDelete: "این تأمین‌کننده حذف شود؟",
  },
  ps: {
    title: "عرضه کوونکي",
    subtitle: "عرضه کوونکي، بیلانس او د اړیکو معلومات ثبت او مدیریت کړئ.",
    add: "نوی عرضه کوونکی ثبتول",
    total: "ټول عرضه کوونکي",
    active: "فعال",
    inactive: "غیرفعال",
    search: "د نوم، ډول، اړیکې کس یا شمېرې لټون...",
    empty: "تر اوسه کوم عرضه کوونکی نه دی ثبت شوی.",
    supplierName: "د عرضه کوونکي نوم",
    supplierType: "ډول",
    currency: "د اسعارو ډول",
    contactPerson: "د اړیکې کس",
    phone: "د اړیکې شمېره",
    address: "پته",
    openingBalance: "افتتاحي بیلانس (+ / -)",
    openingBalanceHint: "مثبت یعنې موږ عرضه کوونکي ته قرضدار یو. منفي یعنې عرضه کوونکی موږ ته قرضدار دی.",
    notes: "یادښتونه",
    status: "حالت",
    actions: "کړنې",
    addTitle: "نوی عرضه کوونکی ثبتول",
    editTitle: "عرضه کوونکی سمول",
    hint: "د عرضه کوونکي معلومات د حساب د جوړښت مطابق ولیکئ.",
    selectType: "د عرضه کوونکي ډول وټاکئ",
    selectCurrency: "اسعار وټاکئ",
    wholesale: "عمده",
    retail: "پرچون",
    pharmacy: "فارمسي",
    drugstore: "درملتون",
    company: "شرکت",
    representative: "استازی",
    pharmacist: "فارمسست",
    inventory: "موجودي",
    unknown: "نامعلوم",
    dostHajiZaman: "د حاجي زمان دوست",
    dostHajiSharif: "د حاجي شریف دوست",
    afn: "افغانۍ (AFN)",
    usd: "ډالر (USD)",
    inr: "هندي روپۍ (INR)",
    addType: "د عرضه کوونکي ډول اضافه کړئ",
    newType: "د عرضه کوونکي نوی ډول",
    typeName: "د ډول نوم",
    saveType: "ډول خوندي کړئ",
    updateType: "بدلونونه ثبت کړئ",
    manageTypes: "اضافه شوي ډولونه اداره کړئ",
    noCustomTypes: "تر اوسه نوی ډول نه دی اضافه شوی.",
    typeSaved: "د عرضه کوونکي ډول خوندي شو.",
    typeUpdated: "د عرضه کوونکي ډول سم شو.",
    typeDeleted: "د عرضه کوونکي ډول حذف شو.",
    typeRequired: "د عرضه کوونکي د ډول نوم ولیکئ.",
    typeInUse: "دا ډول د عرضه کوونکي لخوا کارول شوی او حذف کېدای نشي.",
    eur: "یورو (EUR)",
    save: "عرضه کوونکی ذخیره کول",
    update: "بدلونونه ثبتول",
    cancel: "لغوه",
    required: "مهرباني وکړئ د عرضه کوونکي نوم ولیکئ.",
    saved: "عرضه کوونکی په بریالیتوب ذخیره شو.",
    updated: "عرضه کوونکی په بریالیتوب سم شو.",
    deleted: "عرضه کوونکی په بریالیتوب حذف شو.",
    confirmDelete: "دا عرضه کوونکی حذف شي؟",
  },
};

const currencyOptions = ["afn", "usd", "inr", "eur"];

const emptyForm = {
  supplierName: "",
  supplierType: "",
  currency: "afn",
  contactPerson: "",
  phone: "",
  address: "",
  openingBalance: "",
  notes: "",
  status: "active",
};

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useJsonCollection("suppliers");
  const [customSupplierTypes, setCustomSupplierTypes] = useJsonCollection("supplierTypes");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [typeDraft, setTypeDraft] = useState("");
  const [editingTypeId, setEditingTypeId] = useState(null);

  const t = translations[language] || translations.en;
  const direction = rtlLanguages.has(language) ? "rtl" : "ltr";

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
    document.body.classList.toggle("supplier-modal-open", showModal);
    return () => document.body.classList.remove("supplier-modal-open");
  }, [showModal]);


  const customTypeOptions = useMemo(() =>
    customSupplierTypes
      .filter((item) => item && item.id && item.name)
      .map((item) => ({ key: `custom:${item.id}`, name: String(item.name).trim() })),
  [customSupplierTypes]);

  const selectedCustomType = form.supplierType?.startsWith("custom:")
    ? customSupplierTypes.find((item) => `custom:${item.id}` === form.supplierType)
    : null;

  const typeLabel = (value) => {
    if (!value) return "—";
    if (value.startsWith("custom:")) {
      return customTypeOptions.find((item) => item.key === value)?.name || value.replace("custom:", "");
    }
    return t[value] || value;
  };

  const resetTypeDraft = () => {
    setEditingTypeId(null);
    setTypeDraft("");
  };

  const saveCustomType = async () => {
    const name = typeDraft.trim();
    if (!name) {
      notify(t.typeRequired, "warning");
      return;
    }
    const duplicate = customSupplierTypes.some((item) =>
      String(item.name || "").trim().toLowerCase() === name.toLowerCase() && String(item.id) !== String(editingTypeId)
    );
    if (duplicate) {
      notify(t.typeRequired, "warning");
      return;
    }

    const newTypeId = editingTypeId || `ST-${Date.now()}`;
    const next = editingTypeId
      ? customSupplierTypes.map((item) => String(item.id) === String(editingTypeId) ? { ...item, name, updatedAt: new Date().toISOString() } : item)
      : [{ id: newTypeId, name, createdAt: new Date().toISOString() }, ...customSupplierTypes];
    const saved = await setCustomSupplierTypes(next);
    if (!saved) return;
    updateField("supplierType", `custom:${newTypeId}`);
    notify(editingTypeId ? t.typeUpdated : t.typeSaved, "success", { silent: true });
    resetTypeDraft();
    setShowTypeManager(false);
  };

  const editCustomType = (item) => {
    setEditingTypeId(item.id);
    setTypeDraft(item.name || "");
    setShowTypeManager(true);
  };

  const deleteCustomType = async (item) => {
    const key = `custom:${item.id}`;
    if (suppliers.some((supplier) => supplier.supplierType === key)) {
      notify(t.typeInUse, "warning");
      return;
    }

    // Supplier-type deletion is intentionally immediate. This action lives
    // inside the supplier form, so opening a second confirmation modal would
    // stack dialogs and break the form flow.
    const saved = await setCustomSupplierTypes(customSupplierTypes.filter((type) => type.id !== item.id));
    if (!saved) return;
    if (form.supplierType === key) updateField("supplierType", "");
    if (editingTypeId === item.id) resetTypeDraft();
    setShowTypeManager(false);
    notify(t.typeDeleted, "success");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((item) =>
      [item.supplierName, item.supplierType, item.contactPerson, item.phone, item.address, item.currency]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const activeCount = suppliers.filter((item) => item.status !== "inactive").length;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowTypeManager(false);
    resetTypeDraft();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item, currency: item.currency === "pkr" ? "inr" : (item.currency || "afn") });
    setShowTypeManager(false);
    resetTypeDraft();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowTypeManager(false);
    resetTypeDraft();
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.supplierName.trim()) {
      notify(t.required, "warning");
      return;
    }

    const payload = {
      ...form,
      openingBalance: Number(form.openingBalance || 0),
      updatedAt: new Date().toISOString(),
    };

    let saved;
    if (editingId) {
      saved = await setSuppliers(
        suppliers.map((item) => item.id === editingId ? { ...item, ...payload } : item)
      );
      if (saved) notify(t.updated, "success", { silent: true });
    } else {
      saved = await setSuppliers([
        {
          ...payload,
          id: `SUP-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...suppliers,
      ]);
      if (saved) notify(t.saved, "success", { silent: true });
    }

    if (saved) closeModal();
  };

  const removeSupplier = async (item) => {
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: item.supplierName || t.confirmDelete,
      confirmText: t.actions === "Actions" ? "Delete" : t.actions,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const saved = await setSuppliers(suppliers.filter((supplier) => supplier.id !== item.id));
    if (saved) notify(t.deleted, "success");
  };

  const modal = showModal ? (
    <div className="supplier-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
      <section className="supplier-modal" dir={direction} role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title">
        <div className="supplier-modal-header">
          <div>
            <div className="supplier-modal-title-line">
              <Truck size={22} />
              <h2 id="supplier-modal-title">{editingId ? t.editTitle : t.addTitle}</h2>
            </div>
            <p>{t.hint}</p>
          </div>
          <button type="button" className="supplier-close" onClick={closeModal} aria-label={t.cancel}>
            <X size={19} />
          </button>
        </div>

        <form className="supplier-form" onSubmit={handleSubmit}>
          <div className="supplier-section supplier-section-main">
            <div className="supplier-section-title"><Building2 size={17} /><span>{t.supplierName}</span></div>
            <div className="supplier-fields-grid">
              <div className="supplier-field supplier-field-full">
                <label>{t.supplierName} *</label>
                <input autoFocus value={form.supplierName} onChange={(e) => updateField("supplierName", e.target.value)} />
              </div>
              <div className="supplier-field">
                <label>{t.supplierType}</label>
                <div className={`supplier-type-row ${showTypeManager ? "is-editing" : ""}`}>
                  {showTypeManager ? (
                    <>
                      <input
                        className="supplier-type-inline-input"
                        value={typeDraft}
                        onChange={(e) => setTypeDraft(e.target.value)}
                        placeholder={t.typeName}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveCustomType();
                          }
                          if (e.key === "Escape") {
                            resetTypeDraft();
                            setShowTypeManager(false);
                          }
                        }}
                      />
                      <button type="button" className="supplier-type-save" onClick={saveCustomType} title={editingTypeId ? t.updateType : t.saveType}>
                        {editingTypeId ? <Edit3 size={14} /> : <Plus size={14} />}
                      </button>
                      <button type="button" className="supplier-type-cancel" onClick={() => { resetTypeDraft(); setShowTypeManager(false); }} aria-label={t.cancel} title={t.cancel}>
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <select value={form.supplierType} onChange={(e) => updateField("supplierType", e.target.value)}>
                        <option value="">{t.selectType}</option>
                        {customTypeOptions.map((type) => <option key={type.key} value={type.key}>{type.name}</option>)}
                      </select>
                      {selectedCustomType && (
                        <button type="button" className="supplier-type-edit" onClick={() => editCustomType(selectedCustomType)} aria-label={t.editTitle} title={t.editTitle}>
                          <Edit3 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="supplier-type-delete"
                        onClick={() => selectedCustomType && deleteCustomType(selectedCustomType)}
                        disabled={!selectedCustomType}
                        aria-label={t.confirmDelete}
                        title={selectedCustomType ? t.confirmDelete : t.selectType}
                      >
                        <Trash2 size={13} />
                      </button>
                      <button type="button" className="supplier-type-add" onClick={() => { resetTypeDraft(); setShowTypeManager(true); }} aria-label={t.addType} title={t.addType}>
                        <Plus size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="supplier-field">
                <label>{t.currency}</label>
                <select value={form.currency} onChange={(e) => updateField("currency", e.target.value)}>
                  {currencyOptions.map((currency) => <option key={currency} value={currency}>{t[currency]}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="supplier-section">
            <div className="supplier-section-title"><UserRound size={17} /><span>{t.contactPerson}</span></div>
            <div className="supplier-fields-grid">
              <div className="supplier-field">
                <label>{t.contactPerson}</label>
                <input value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
              </div>
              <div className="supplier-field">
                <label>{t.phone}</label>
                <input inputMode="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="supplier-field supplier-field-full">
                <label>{t.address}</label>
                <textarea rows="2" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="supplier-section">
            <div className="supplier-section-title"><BadgeDollarSign size={17} /><span>{t.openingBalance}</span></div>
            <div className="supplier-fields-grid supplier-account-grid">
              <div className="supplier-field">
                <label>{t.openingBalance}</label>
                <input type="number" step="any" value={form.openingBalance} onChange={(e) => updateField("openingBalance", e.target.value)} />
                <small>{t.openingBalanceHint}</small>
              </div>
              <div className="supplier-field">
                <label>{t.status}</label>
                <div className="supplier-status-switch">
                  <button type="button" className={form.status === "active" ? "active" : ""} onClick={() => updateField("status", "active")}>{t.active}</button>
                  <button type="button" className={form.status === "inactive" ? "active" : ""} onClick={() => updateField("status", "inactive")}>{t.inactive}</button>
                </div>
              </div>
            </div>
          </div>

          <div className="supplier-section supplier-section-notes">
            <div className="supplier-section-title"><MapPin size={17} /><span>{t.notes}</span></div>
            <div className="supplier-field supplier-field-full">
              <label>{t.notes}</label>
              <textarea rows="3" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
            </div>
          </div>

          <div className="supplier-form-actions">
            <button type="button" className="secondary" onClick={closeModal}>{t.cancel}</button>
            <button type="submit" className="primary">{editingId ? t.update : t.save}</button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  return (
    <div className="suppliers-page" dir={direction}>
      <div className="suppliers-header">
        <div>
          <div className="suppliers-title-line"><Truck size={26} /><h1>{t.title}</h1></div>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="suppliers-add-btn" onClick={openNew}><Plus size={18} />{t.add}</button>
      </div>

      <div className="suppliers-stats">
        <div className="supplier-stat-card"><span>{t.total}</span><strong>{suppliers.length}</strong></div>
        <div className="supplier-stat-card"><span>{t.active}</span><strong>{activeCount}</strong></div>
        <div className="supplier-stat-card"><span>{t.inactive}</span><strong>{Math.max(suppliers.length - activeCount, 0)}</strong></div>
      </div>

      <div className="suppliers-card">
        <div className="suppliers-toolbar">
          <div className="suppliers-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div>
        </div>

        <div className="suppliers-table-wrap">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>{t.supplierName}</th>
                <th>{t.supplierType}</th>
                <th>{t.currency}</th>
                <th>{t.contactPerson}</th>
                <th>{t.phone}</th>
                <th>{t.openingBalance}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((item) => (
                <tr key={item.id} className="supplier-clickable-row" onClick={() => navigate(`/supplier-detail/${item.id}`)}>
                  <td className="supplier-name-cell"><span className="supplier-avatar"><Building2 size={15} /></span><span>{item.supplierName}</span></td>
                  <td>{typeLabel(item.supplierType)}</td>
                  <td>{t[item.currency === "pkr" ? "inr" : item.currency] || String(item.currency === "pkr" ? "INR" : (item.currency || "—")).toUpperCase()}</td>
                  <td>{item.contactPerson || "—"}</td>
                  <td className="supplier-phone-cell"><span dir="ltr">{item.phone || "—"}</span></td>
                  <td className={Number(item.openingBalance || 0) < 0 ? "negative-balance" : ""}>{Number(item.openingBalance || 0).toLocaleString()}</td>
                  <td><span className={`supplier-status ${item.status === "inactive" ? "inactive" : "active"}`}>{item.status === "inactive" ? t.inactive : t.active}</span></td>
                  <td>
                    <div className="suppliers-actions">
                      <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(item); }} aria-label={t.editTitle}><Edit3 size={14} strokeWidth={2} /></button>
                      <button type="button" className="danger" onClick={(event) => { event.stopPropagation(); removeSupplier(item); }} aria-label={t.confirmDelete}><Trash2 size={14} strokeWidth={2} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="suppliers-empty">{t.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(modal, document.body)}
    </div>
  );
}
