import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Edit3, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import { countryNameById, groupNameById, makeMasterId, normalizeMasterName } from "../utils/productMasterData";
import "./Products.css";

const languageKey = "afghan-power-language";

const translations = {
  en: {
    title: "Products",
    subtitle: "Register and manage products.",
    addProduct: "Add Product",
    totalProducts: "Total Products",
    groups: "Groups",
    countries: "Manufacturing Countries",
    avgDiscount: "Average Discount",
    search: "Search product, company, group or country...",
    noProducts: "No products have been registered yet.",
    productName: "Product Name",
    group: "Group",
    cartonSize: "Carton Size",
    discount: "Discount (%)",
    company: "Manufacturer",
    madeIn: "Made In",
    salePrice: "Sale Price",
    purchasePrice: "Purchase Price",
    description: "Description",
    actions: "Actions",
    addTitle: "Register New Product",
    editTitle: "Edit Product",
    modalHint: "Enter the product information below.",
    selectGroup: "Select group",
    addNewGroup: "Add group",
    newGroup: "New Group Name",
    addNewCompany: "Add company",
    newCompany: "New Company Name",
    newCompanyPlaceholder: "Enter new company name",
    selectCompany: "Select manufacturer",
    addNewCountry: "Add country",
    newCountry: "New Country Name",
    newCountryPlaceholder: "Enter new country name",
    newGroupPlaceholder: "Example: C",
    selectCountry: "Select country",
    productPlaceholder: "Enter product name",
    cartonPlaceholder: "Example: 12 / 24 / 48",
    companyPlaceholder: "Enter company name",
    pricePlaceholder: "0.00",
    descriptionPlaceholder: "Write an optional description...",
    cancel: "Cancel",
    save: "Save Product",
    update: "Update Product",
    required: "Please enter the product name and select a group.",
    groupRequired: "Please enter a name for the new group.",
    companyRequired: "Please select a manufacturer.",
    countryRequired: "Please enter a name for the new country.",
    saved: "Product saved successfully.",
    updated: "Product updated successfully.",
    deleted: "Product deleted successfully.",
    confirmDelete: "Delete this product?",
    edit: "Edit",
    delete: "Delete",
    afn: "AFN",
  },
  fa: {
    title: "محصولات",
    subtitle: "محصولات را ثبت و مدیریت کنید.",
    addProduct: "درج جنس جدید",
    totalProducts: "مجموع اجناس",
    groups: "گروپ‌ها",
    countries: "کشورهای ساخت",
    avgDiscount: "اوسط تخفیف",
    search: "جستجوی نام جنس، کمپنی، گروپ یا کشور...",
    noProducts: "هنوز هیچ جنسی ثبت نشده است.",
    productName: "نام جنس",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    discount: "تخفیف (%)",
    company: "کمپنی سازنده",
    madeIn: "ساخت",
    salePrice: "قیمت فروش",
    purchasePrice: "قیمت خرید",
    description: "توضیحات",
    actions: "عملیات",
    addTitle: "درج جنس جدید",
    editTitle: "ویرایش جنس",
    modalHint: "معلومات جنس را در فورم زیر وارد کنید.",
    selectGroup: "گروپ را انتخاب کنید",
    addNewGroup: "افزودن گروپ",
    newGroup: "نام گروپ جدید",
    addNewCompany: "افزودن کمپنی",
    newCompany: "نام کمپنی جدید",
    newCompanyPlaceholder: "نام کمپنی جدید را وارد کنید",
    selectCompany: "کمپنی سازنده را انتخاب کنید",
    addNewCountry: "افزودن کشور",
    newCountry: "نام کشور جدید",
    newCountryPlaceholder: "نام کشور جدید را وارد کنید",
    newGroupPlaceholder: "مثلاً C",
    selectCountry: "کشور را انتخاب کنید",
    productPlaceholder: "نام جنس را وارد کنید",
    cartonPlaceholder: "مثلاً 12 / 24 / 48",
    companyPlaceholder: "نام کمپنی را وارد کنید",
    pricePlaceholder: "0.00",
    descriptionPlaceholder: "در صورت نیاز توضیحات بنویسید...",
    cancel: "لغو",
    save: "ذخیره جنس",
    update: "ثبت تغییرات",
    required: "لطفاً نام جنس را وارد و گروپ را انتخاب کنید.",
    groupRequired: "لطفاً نام گروپ جدید را وارد کنید.",
    companyRequired: "لطفاً کمپنی سازنده را انتخاب کنید.",
    countryRequired: "لطفاً نام کشور جدید را وارد کنید.",
    saved: "جنس با موفقیت ذخیره شد.",
    updated: "جنس با موفقیت ویرایش شد.",
    deleted: "جنس با موفقیت حذف شد.",
    confirmDelete: "این جنس حذف شود؟",
    edit: "ویرایش",
    delete: "حذف",
    afn: "افغانی",
  },
  ps: {
    title: "محصولات",
    subtitle: "د خرڅلاو توکي ثبت او اداره کړئ.",
    addProduct: "نوی توکی ثبتول",
    totalProducts: "ټول توکي",
    groups: "ګروپونه",
    countries: "د جوړېدو هېوادونه",
    avgDiscount: "اوسط تخفیف",
    search: "د توکي، شرکت، ګروپ یا هېواد لټون...",
    noProducts: "تر اوسه کوم توکی نه دی ثبت شوی.",
    productName: "د توکي نوم",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    discount: "تخفیف (%)",
    company: "تولیدوونکی شرکت",
    madeIn: "جوړ شوی په",
    salePrice: "د خرڅلاو بیه",
    purchasePrice: "د پېرود بیه",
    description: "تشریحات",
    actions: "عملیات",
    addTitle: "نوی توکی ثبتول",
    editTitle: "د توکي سمون",
    modalHint: "د توکي معلومات په لاندې فورم کې ولیکئ.",
    selectGroup: "ګروپ وټاکئ",
    addNewGroup: "ګروپ زیاتول",
    newGroup: "د نوي ګروپ نوم",
    addNewCompany: "شرکت زیاتول",
    newCompany: "د نوي شرکت نوم",
    newCompanyPlaceholder: "د نوي شرکت نوم ولیکئ",
    selectCompany: "تولیدوونکی شرکت وټاکئ",
    addNewCountry: "هېواد زیاتول",
    newCountry: "د نوي هېواد نوم",
    newCountryPlaceholder: "د نوي هېواد نوم ولیکئ",
    newGroupPlaceholder: "لکه C",
    selectCountry: "هېواد وټاکئ",
    productPlaceholder: "د توکي نوم ولیکئ",
    cartonPlaceholder: "لکه 12 / 24 / 48",
    companyPlaceholder: "د شرکت نوم ولیکئ",
    pricePlaceholder: "0.00",
    descriptionPlaceholder: "که اړتیا وي تشریحات ولیکئ...",
    cancel: "لغوه",
    save: "توکی ذخیره کول",
    update: "بدلونونه ثبتول",
    required: "مهرباني وکړئ د توکي نوم ولیکئ او ګروپ وټاکئ.",
    groupRequired: "مهرباني وکړئ د نوي ګروپ نوم ولیکئ.",
    companyRequired: "مهرباني وکړئ تولیدوونکی شرکت وټاکئ.",
    countryRequired: "مهرباني وکړئ د نوي هېواد نوم ولیکئ.",
    saved: "توکی په بریالیتوب سره ذخیره شو.",
    updated: "توکی په بریالیتوب سره سم شو.",
    deleted: "توکی په بریالیتوب سره حذف شو.",
    confirmDelete: "دا توکی حذف شي؟",
    edit: "سمون",
    delete: "حذف",
    afn: "افغانۍ",
  },
};


const emptyForm = {
  productName: "",
  groupId: "",
  cartonSize: "",
  discount: "",
  manufacturerId: "",
  countryId: "",
  salePrice: "",
  purchasePrice: "",
  description: "",
};

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useJsonCollection("products");
  const [productGroups, setProductGroups] = useJsonCollection("productGroups");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [legacyCompanies] = useJsonCollection("companies");
  const [productCountries, setProductCountries] = useJsonCollection("countries");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [addingCountry, setAddingCountry] = useState(false);
  const [newCountry, setNewCountry] = useState("");

  const t = translations[language] || translations.en;
  const direction = language === "en" ? "ltr" : "rtl";

  const availableManufacturers = useMemo(() => {
    if (manufacturers.length) return manufacturers;
    return legacyCompanies.map((item) => ({
      ...item,
      manufacturerName: item.manufacturerName || item.companyName || item.name || "",
      status: item.status || "active",
    }));
  }, [manufacturers, legacyCompanies]);

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
    document.body.classList.toggle("sales-product-modal-open", showModal);
    return () => document.body.classList.remove("sales-product-modal-open");
  }, [showModal]);

  const groups = useMemo(() => productGroups.filter((item) => item?.name), [productGroups]);
  const allCountries = useMemo(() => productCountries.filter((item) => item?.name || item?.en), [productCountries]);
  const defaultGroupId = productGroups.find((item) => normalizeMasterName(item.name) === "a")?.id || productGroups[0]?.id || "";
  const defaultCountryId = productCountries.find((item) => normalizeMasterName(item.name || item.en) === "afghanistan")?.id || productCountries[0]?.id || "";

  const groupLabel = (product) => groupNameById(productGroups, product.groupId, product.group || "—") || "—";
  const countryLabel = (product) => countryNameById(productCountries, product.countryId, language, product.madeIn || "—") || "—";

  const manufacturerNameById = (manufacturerId, legacyName = "") => {
    const manufacturer = availableManufacturers.find((item) => String(item.id) === String(manufacturerId));
    return manufacturer?.manufacturerName || manufacturer?.companyName || legacyName || "—";
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [
        product.productName,
        groupLabel(product),
        manufacturerNameById(product.manufacturerId || product.companyId, product.company),
        countryLabel(product),
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, search, availableManufacturers, productGroups, productCountries, language]);


  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, groupId: defaultGroupId, countryId: defaultCountryId });
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    const legacyManufacturer = availableManufacturers.find(
      (item) => String(item.manufacturerName || item.companyName || "").trim().toLowerCase() === String(product.company || "").trim().toLowerCase()
    );
    const legacyGroup = productGroups.find((item) => normalizeMasterName(item.name) === normalizeMasterName(product.group));
    const legacyCountry = productCountries.find((item) => normalizeMasterName(item.name || item.en) === normalizeMasterName(product.madeIn));
    setFormData({
      ...emptyForm,
      ...product,
      groupId: product.groupId || legacyGroup?.id || defaultGroupId,
      countryId: product.countryId || legacyCountry?.id || defaultCountryId,
      manufacturerId: product.manufacturerId || product.companyId || legacyManufacturer?.id || "",
    });
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let selectedGroupId = formData.groupId;
    let selectedCountryId = formData.countryId;

    if (addingGroup) {
      const name = newGroup.trim();
      if (!name) { notify(t.groupRequired, "error"); return; }
      const existing = productGroups.find((item) => normalizeMasterName(item.name) === normalizeMasterName(name));
      if (existing) selectedGroupId = existing.id;
      else {
        const row = { id: makeMasterId("group", name), name, createdAt: new Date().toISOString() };
        const saved = await setProductGroups([...productGroups, row]);
        if (!saved) return;
        selectedGroupId = row.id;
      }
    }

    if (addingCountry) {
      const name = newCountry.trim();
      if (!name) { notify(t.countryRequired, "error"); return; }
      const existing = productCountries.find((item) => normalizeMasterName(item.name || item.en) === normalizeMasterName(name));
      if (existing) selectedCountryId = existing.id;
      else {
        const row = { id: makeMasterId("country", name), name, en: name, fa: name, ps: name, createdAt: new Date().toISOString() };
        const saved = await setProductCountries([...productCountries, row]);
        if (!saved) return;
        selectedCountryId = row.id;
      }
    }

    if (!formData.productName.trim() || !selectedGroupId) {
      notify(t.required, "error");
      return;
    }

    if (!formData.manufacturerId) {
      notify(t.companyRequired, "error");
      return;
    }

    const { group: _legacyGroup, madeIn: _legacyMadeIn, companyId: _legacyCompanyId, company: _legacyCompany, ...cleanFormData } = formData;
    const record = {
      ...cleanFormData,
      id: editingId || `sale-product-${Date.now()}`,
      productName: formData.productName.trim(),
      groupId: selectedGroupId,
      manufacturerId: formData.manufacturerId,
      countryId: selectedCountryId,
      cartonSize: formData.cartonSize.trim(),
      discount: Number(formData.discount || 0),
      salePrice: Number(formData.salePrice || 0),
      purchasePrice: Number(formData.purchasePrice || 0),
      description: formData.description.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingId
        ? products.find((item) => String(item.id) === String(editingId))?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };


    const nextProducts = editingId
      ? products.map((item) => (String(item.id) === String(editingId) ? record : item))
      : [record, ...products];

    const saved = await setProducts(nextProducts);
    if (!saved) return;

    notify(editingId ? t.updated : t.saved);
    closeModal();
  };

  const deleteProduct = async (product) => {
    const confirmed = await confirmAction({
      title: t.confirmDelete,
      message: product.productName || t.confirmDelete,
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const saved = await setProducts(products.filter((item) => String(item.id) !== String(product.id)));
    if (saved) notify(t.deleted);
  };

  const averageDiscount = products.length
    ? products.reduce((sum, item) => sum + Number(item.discount || 0), 0) / products.length
    : 0;

  return (
    <div className="sales-products-page" dir={direction}>
      <div className="sales-products-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="sales-add-product-btn" onClick={openNew}>
          <PackagePlus size={18} />
          <span>{t.addProduct}</span>
        </button>
      </div>

      <div className="sales-products-stats">
        <div className="sales-products-stat-card"><span>{t.totalProducts}</span><strong>{products.length}</strong></div>
        <div className="sales-products-stat-card"><span>{t.groups}</span><strong>{productGroups.length}</strong></div>
        <div className="sales-products-stat-card"><span>{t.countries}</span><strong>{new Set(products.map((item) => item.countryId).filter(Boolean)).size}</strong></div>
        <div className="sales-products-stat-card"><span>{t.avgDiscount}</span><strong>{averageDiscount.toFixed(1)}%</strong></div>
      </div>

      <div className="sales-products-card">
        <div className="sales-products-toolbar">
          <div className="sales-products-search">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          </div>
        </div>

        <div className="sales-products-table-wrap">
          <table className="sales-products-table">
            <thead>
              <tr>
                <th>{t.productName}</th>
                <th>{t.group}</th>
                <th>{t.cartonSize}</th>
                <th>{t.discount}</th>
                <th>{t.company}</th>
                <th>{t.madeIn}</th>
                <th>{t.salePrice}</th>
                <th>{t.purchasePrice}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="sales-product-clickable-row" role="button" tabIndex={0} onClick={() => navigate(`/product-detail/${product.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/product-detail/${product.id}`); }}>
                  <td className="sales-product-name-cell"><strong>{product.productName}</strong>{product.description && <small>{product.description}</small>}</td>
                  <td><span className="sales-product-group-badge">{groupLabel(product)}</span></td>
                  <td>{product.cartonSize || "—"}</td>
                  <td>{Number(product.discount || 0)}%</td>
                  <td>{manufacturerNameById(product.manufacturerId || product.companyId, product.company)}</td>
                  <td>{countryLabel(product)}</td>
                  <td>{Number(product.salePrice || 0).toLocaleString("en-US")}</td>
                  <td>{Number(product.purchasePrice || 0).toLocaleString("en-US")}</td>
                  <td>
                    <div className="sales-product-row-actions">
                      <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(product); }} title={t.edit}><Edit3 size={15} /></button>
                      <button type="button" className="danger" onClick={(event) => { event.stopPropagation(); deleteProduct(product); }} title={t.delete}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredProducts.length && <div className="sales-products-empty">{t.noProducts}</div>}
        </div>
      </div>

      {showModal && createPortal((
        <div className="sales-product-modal-layer" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <section className="sales-product-modal" role="dialog" aria-modal="true" aria-labelledby="sales-product-modal-title" dir={direction} onClick={(e) => e.stopPropagation()}>
            <div className="sales-product-modal-header">
              <div>
                <h2 id="sales-product-modal-title">{editingId ? t.editTitle : t.addTitle}</h2>
                <p>{t.modalHint}</p>
              </div>
              <button type="button" className="sales-product-modal-close" onClick={closeModal} aria-label={t.cancel}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="sales-product-form">
              <div className="sales-product-form-grid">
                <label className="sales-product-field sales-product-field-wide">
                  <span>{t.productName} *</span>
                  <input name="productName" value={formData.productName} onChange={handleChange} placeholder={t.productPlaceholder} autoFocus />
                </label>

                <div className="sales-product-field">
                  <span>{t.group} *</span>
                  <div className="sales-product-select-with-add">
                    <select name="groupId" value={formData.groupId} onChange={handleChange}>
                      <option value="" disabled>{t.selectGroup}</option>
                      {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                    <button type="button" className="sales-product-inline-add" onClick={() => setAddingGroup((v) => !v)} title={t.addNewGroup} aria-label={t.addNewGroup}><Plus size={18} /></button>
                  </div>
                  {addingGroup && <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder={t.newGroupPlaceholder} />}
                </div>

                <label className="sales-product-field">
                  <span>{t.cartonSize}</span>
                  <input name="cartonSize" value={formData.cartonSize} onChange={handleChange} placeholder={t.cartonPlaceholder} />
                </label>

                <label className="sales-product-field">
                  <span>{t.discount}</span>
                  <input type="number" min="0" max="100" step="0.01" name="discount" value={formData.discount} onChange={handleChange} placeholder="0" />
                </label>

                <div className="sales-product-field">
                  <span>{t.company} *</span>
                  <select name="manufacturerId" value={formData.manufacturerId} onChange={handleChange}>
                    <option value="">{t.selectCompany}</option>
                    {availableManufacturers.filter((manufacturer) => manufacturer.status !== "inactive").map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.manufacturerName || manufacturer.companyName || manufacturer.name || manufacturer.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sales-product-field">
                  <span>{t.madeIn}</span>
                  <div className="sales-product-select-with-add">
                    <select name="countryId" value={formData.countryId} onChange={handleChange}>
                      <option value="" disabled>{t.selectCountry}</option>
                      {allCountries.map((country) => <option key={country.id} value={country.id}>{country[language] || country.en || country.name}</option>)}
                    </select>
                    <button type="button" className="sales-product-inline-add" onClick={() => setAddingCountry((v) => !v)} title={t.addNewCountry} aria-label={t.addNewCountry}><Plus size={18} /></button>
                  </div>
                  {addingCountry && <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder={t.newCountryPlaceholder} />}
                </div>

                <label className="sales-product-field">
                  <span>{t.salePrice}</span>
                  <input type="number" min="0" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} placeholder={t.pricePlaceholder} />
                </label>

                <label className="sales-product-field">
                  <span>{t.purchasePrice}</span>
                  <input type="number" min="0" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder={t.pricePlaceholder} />
                </label>

                <label className="sales-product-field sales-product-field-wide">
                  <span>{t.description}</span>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder={t.descriptionPlaceholder} rows="4" />
                </label>
              </div>

              <div className="sales-product-modal-footer">
                <button type="button" className="sales-product-cancel-btn" onClick={closeModal}>{t.cancel}</button>
                <button type="submit" className="sales-product-save-btn">{editingId ? t.update : t.save}</button>
              </div>
            </form>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}

export default Products;
