import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Edit3, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import { defaultProductImage, productImageSrc } from "../utils/productImages";
import { countryNameById, groupNameById, makeMasterId, normalizeMasterName } from "../utils/productMasterData";
import { replaceReferenceMovements, stockMovementId } from "../utils/stock";
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
    search: "Search product, supplier, group or country...",
    noProducts: "No products have been registered yet.",
    productName: "Product Name",
    group: "Group",
    cartonSize: "Carton Size",
    discount: "Discount (%)",
    company: "Supplier",
    madeIn: "Made In",
    currency: "Currency",
    productUnit: "Unit",
    unitSize: "{unit} Size",
    unitSizeHint: "How many pieces are in one {unit}?",
    productForm: "Product Form",
    selectProductForm: "Select product form",
    addProductForm: "Add custom form",
    newProductFormPlaceholder: "Example: Effervescent tablet",
    productFormRequired: "Enter a name for the custom product form.",
    quantityOfUnit: "{unit} Quantity",
    totalPieces: "Total: {count} pieces",
    unitCarton: "Carton",
    unitBox: "Box",
    unitPack: "Pack",
    unitBottle: "Bottle",
    unitStrip: "Strip",
    unitPiece: "Piece",
    unitDozen: "Dozen",
    unitTube: "Tube",
    unitSachet: "Sachet",
    formTablet: "Tablet",
    formCapsule: "Capsule",
    formSyrup: "Syrup",
    formSuspension: "Suspension",
    formInjection: "Injection",
    formAmpoule: "Ampoule",
    formVial: "Vial",
    formCream: "Cream",
    formOintment: "Ointment",
    formGel: "Gel",
    formDrops: "Drops",
    formEyeDrops: "Eye Drops",
    formEarDrops: "Ear Drops",
    formNasalSpray: "Nasal Spray",
    formInhaler: "Inhaler",
    formPowder: "Powder",
    formSachet: "Sachet",
    formSuppository: "Suppository",
    formLozenge: "Lozenge",
    formSolution: "Solution",
    formLotion: "Lotion",
    formSoap: "Medicated Soap",
    formShampoo: "Medicated Shampoo",
    formOralSolution: "Oral Solution",
    expiryDate: "Expiry Date",
    alertBefore: "Alert me before",
    sixMonths: "6 months",
    threeMonths: "3 months",
    oneWeek: "1 week",
    lowStock: "Low Stock",
    quantity: "Quantity",
    image: "Image",
    chooseImage: "Choose Image",
    removeImage: "Remove Image",
    salePrice: "Sale Price",
    purchasePrice: "Purchase Price",
    purchasePricePerUnit: "Purchase Price per {unit}",
    salePricePerUnit: "Sale Price per {unit}",
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
    selectCompany: "Select supplier",
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
    requiredProductName: "Product name is required.",
    requiredGroup: "Please select a group.",
    groupRequired: "Please enter a name for the new group.",
    companyRequired: "Please select a supplier.",
    countryRequired: "Please enter a name for the new country.",
    saved: "Product saved successfully.",
    updated: "Product updated successfully.",
    deleted: "Product deleted successfully.",
    confirmDelete: "Delete this product?",
    edit: "Edit",
    delete: "Delete",
    afn: "Afghani (AFN)",
    usd: "US Dollar (USD)",
    inr: "Indian Rupee (INR)",
    eur: "Euro (EUR)",
  },
  fa: {
    title: "محصولات",
    subtitle: "محصولات را ثبت و مدیریت کنید.",
    addProduct: "درج جنس جدید",
    totalProducts: "مجموع اجناس",
    groups: "گروپ‌ها",
    countries: "کشورهای ساخت",
    avgDiscount: "اوسط تخفیف",
    search: "جستجوی نام جنس، تأمین‌کننده، گروپ یا کشور...",
    noProducts: "هنوز هیچ جنسی ثبت نشده است.",
    productName: "نام جنس",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    discount: "تخفیف (%)",
    company: "تأمین‌کننده",
    madeIn: "ساخت",
    currency: "واحد پول",
    productUnit: "واحد",
    unitSize: "سایز {unit}",
    unitSizeHint: "یعنی در یک {unit} چند دانه موجود است؟",
    productForm: "حالت محصول",
    selectProductForm: "حالت محصول را انتخاب کنید",
    addProductForm: "افزودن حالت جدید",
    newProductFormPlaceholder: "مثلاً تابلیت جوشان",
    productFormRequired: "لطفاً نام حالت جدید محصول را وارد کنید.",
    quantityOfUnit: "مقدار {unit}",
    totalPieces: "مجموع: {count} دانه",
    unitCarton: "کارتن",
    unitBox: "بکس",
    unitPack: "بسته",
    unitBottle: "بوتل",
    unitStrip: "ورق",
    unitPiece: "عدد",
    unitDozen: "درجن",
    unitTube: "تیوب",
    unitSachet: "پاکت",
    formTablet: "تابلیت",
    formCapsule: "کپسول",
    formSyrup: "شربت",
    formSuspension: "سوسپانسیون",
    formInjection: "آمپول / تزریقی",
    formAmpoule: "امپول",
    formVial: "ویال",
    formCream: "کریم",
    formOintment: "مرهم",
    formGel: "ژل",
    formDrops: "قطره",
    formEyeDrops: "قطره چشم",
    formEarDrops: "قطره گوش",
    formNasalSpray: "اسپری بینی",
    formInhaler: "انهیلر",
    formPowder: "پودر",
    formSachet: "ساشه",
    formSuppository: "شیاف",
    formLozenge: "قرص مکیدنی",
    formSolution: "محلول",
    formLotion: "لوشن",
    formSoap: "صابون طبی",
    formShampoo: "شامپوی طبی",
    formOralSolution: "محلول خوراکی",
    expiryDate: "تاریخ انقضا",
    alertBefore: "هشدار قبل از",
    sixMonths: "۶ ماه",
    threeMonths: "۳ ماه",
    oneWeek: "۱ هفته",
    lowStock: "موجودی کم",
    quantity: "مقدار",
    image: "عکس",
    chooseImage: "انتخاب عکس",
    removeImage: "حذف عکس",
    salePrice: "قیمت فروش",
    purchasePrice: "قیمت خرید",
    purchasePricePerUnit: "قیمت خرید فی {unit}",
    salePricePerUnit: "قیمت فروش فی {unit}",
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
    selectCompany: "تأمین‌کننده را انتخاب کنید",
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
    requiredProductName: "لطفاً نام جنس را وارد کنید.",
    requiredGroup: "لطفاً یک گروپ را انتخاب کنید.",
    groupRequired: "لطفاً نام گروپ جدید را وارد کنید.",
    companyRequired: "لطفاً تأمین‌کننده را انتخاب کنید.",
    countryRequired: "لطفاً نام کشور جدید را وارد کنید.",
    saved: "جنس با موفقیت ذخیره شد.",
    updated: "جنس با موفقیت ویرایش شد.",
    deleted: "جنس با موفقیت حذف شد.",
    confirmDelete: "این جنس حذف شود؟",
    edit: "ویرایش",
    delete: "حذف",
    afn: "افغانی (AFN)",
    usd: "دالر (USD)",
    inr: "کلدار هندی (INR)",
    eur: "یورو (EUR)",
  },
  ps: {
    title: "محصولات",
    subtitle: "د خرڅلاو توکي ثبت او اداره کړئ.",
    addProduct: "نوی توکی ثبتول",
    totalProducts: "ټول توکي",
    groups: "ګروپونه",
    countries: "د جوړېدو هېوادونه",
    avgDiscount: "اوسط تخفیف",
    search: "د توکي، عرضه کوونکي، ګروپ یا هېواد لټون...",
    noProducts: "تر اوسه کوم توکی نه دی ثبت شوی.",
    productName: "د توکي نوم",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    discount: "تخفیف (%)",
    company: "عرضه کوونکی",
    madeIn: "جوړ شوی په",
    currency: "د پیسو واحد",
    productUnit: "واحد",
    unitSize: "د {unit} سایز",
    unitSizeHint: "یعنې په یوه {unit} کې څو دانې شته؟",
    productForm: "د محصول بڼه",
    selectProductForm: "د محصول بڼه وټاکئ",
    addProductForm: "نوې بڼه زیاتول",
    newProductFormPlaceholder: "لکه جوشان ټابلیټ",
    productFormRequired: "مهرباني وکړئ د محصول د نوې بڼې نوم ولیکئ.",
    quantityOfUnit: "د {unit} مقدار",
    totalPieces: "ټول: {count} دانې",
    unitCarton: "کارتن",
    unitBox: "بکس",
    unitPack: "بسته",
    unitBottle: "بوتل",
    unitStrip: "پټه",
    unitPiece: "عدد",
    unitDozen: "درجن",
    unitTube: "ټیوب",
    unitSachet: "پاکټ",
    formTablet: "ټابلیټ",
    formCapsule: "کپسول",
    formSyrup: "شربت",
    formSuspension: "سسپنشن",
    formInjection: "پیچکاري",
    formAmpoule: "امپول",
    formVial: "ویال",
    formCream: "کریم",
    formOintment: "مرهم",
    formGel: "جېل",
    formDrops: "څاڅکي",
    formEyeDrops: "د سترګو څاڅکي",
    formEarDrops: "د غوږ څاڅکي",
    formNasalSpray: "د پوزې سپرې",
    formInhaler: "انهیلر",
    formPowder: "پوډر",
    formSachet: "ساشه",
    formSuppository: "شیاف",
    formLozenge: "مکیدونکی ټابلیټ",
    formSolution: "محلول",
    formLotion: "لوشن",
    formSoap: "طبي صابون",
    formShampoo: "طبي شامپو",
    formOralSolution: "خوراکي محلول",
    expiryDate: "د ختمېدو نېټه",
    alertBefore: "مخکې خبر راکړه",
    sixMonths: "۶ میاشتې",
    threeMonths: "۳ میاشتې",
    oneWeek: "۱ اونۍ",
    lowStock: "کم موجودي",
    quantity: "مقدار",
    image: "انځور",
    chooseImage: "انځور وټاکئ",
    removeImage: "انځور لرې کړئ",
    salePrice: "د خرڅلاو بیه",
    purchasePrice: "د پېرود بیه",
    purchasePricePerUnit: "د هر {unit} د پېرود بیه",
    salePricePerUnit: "د هر {unit} د خرڅلاو بیه",
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
    selectCompany: "عرضه کوونکی وټاکئ",
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
    requiredProductName: "مهرباني وکړئ د توکي نوم ولیکئ.",
    requiredGroup: "مهرباني وکړئ یو ګروپ وټاکئ.",
    groupRequired: "مهرباني وکړئ د نوي ګروپ نوم ولیکئ.",
    companyRequired: "مهرباني وکړئ عرضه کوونکی وټاکئ.",
    countryRequired: "مهرباني وکړئ د نوي هېواد نوم ولیکئ.",
    saved: "توکی په بریالیتوب سره ذخیره شو.",
    updated: "توکی په بریالیتوب سره سم شو.",
    deleted: "توکی په بریالیتوب سره حذف شو.",
    confirmDelete: "دا توکی حذف شي؟",
    edit: "سمون",
    delete: "حذف",
    afn: "افغانۍ (AFN)",
    usd: "ډالر (USD)",
    inr: "هندي روپۍ (INR)",
    eur: "یورو (EUR)",
  },
};

const currencyOptions = ["afn", "usd", "inr", "eur"];
const productUnitOptions = [
  { value: "carton", labelKey: "unitCarton" },
  { value: "box", labelKey: "unitBox" },
  { value: "pack", labelKey: "unitPack" },
  { value: "bottle", labelKey: "unitBottle" },
  { value: "strip", labelKey: "unitStrip" },
  { value: "piece", labelKey: "unitPiece" },
  { value: "dozen", labelKey: "unitDozen" },
  { value: "tube", labelKey: "unitTube" },
  { value: "sachet", labelKey: "unitSachet" },
];

const productFormOptions = [
  { value: "tablet", labelKey: "formTablet" },
  { value: "capsule", labelKey: "formCapsule" },
  { value: "syrup", labelKey: "formSyrup" },
  { value: "suspension", labelKey: "formSuspension" },
  { value: "injection", labelKey: "formInjection" },
  { value: "ampoule", labelKey: "formAmpoule" },
  { value: "vial", labelKey: "formVial" },
  { value: "cream", labelKey: "formCream" },
  { value: "ointment", labelKey: "formOintment" },
  { value: "gel", labelKey: "formGel" },
  { value: "drops", labelKey: "formDrops" },
  { value: "eye-drops", labelKey: "formEyeDrops" },
  { value: "ear-drops", labelKey: "formEarDrops" },
  { value: "nasal-spray", labelKey: "formNasalSpray" },
  { value: "inhaler", labelKey: "formInhaler" },
  { value: "powder", labelKey: "formPowder" },
  { value: "sachet", labelKey: "formSachet" },
  { value: "suppository", labelKey: "formSuppository" },
  { value: "lozenge", labelKey: "formLozenge" },
  { value: "solution", labelKey: "formSolution" },
  { value: "lotion", labelKey: "formLotion" },
  { value: "soap", labelKey: "formSoap" },
  { value: "shampoo", labelKey: "formShampoo" },
  { value: "oral-solution", labelKey: "formOralSolution" },
];

const unitsWithoutSize = new Set(["bottle", "piece", "dozen", "tube", "sachet"]);
const fixedUnitMultipliers = { dozen: 12 };

const expiryAlertOptions = [
  { value: "180", labelKey: "sixMonths" },
  { value: "90", labelKey: "threeMonths" },
  { value: "7", labelKey: "oneWeek" },
];

const emptyForm = {
  productName: "",
  groupId: "",
  cartonSize: "",
  productForm: "",
  discount: "",
  supplierId: "",
  countryId: "",
  unit: "afn",
  productUnit: "piece",
  expiryDate: "",
  alertBeforeExpiryDays: "180",
  lowStockThreshold: "",
  quantity: "",
  image: defaultProductImage,
  salePrice: "",
  purchasePrice: "",
  description: "",
};

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useJsonCollection("products");
  const [stockMovements, setStockMovements] = useJsonCollection("stockMovements");
  const [productGroups, setProductGroups] = useJsonCollection("productGroups");
  const [suppliers] = useJsonCollection("suppliers");
  const [legacyCompanies] = useJsonCollection("companies");
  const [productCountries, setProductCountries] = useJsonCollection("countries");
  const [customProductForms, setCustomProductForms] = useJsonCollection("productForms");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [addingCountry, setAddingCountry] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [addingProductForm, setAddingProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const t = translations[language] || translations.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const selectedUnit = productUnitOptions.find((option) => option.value === (formData.productUnit || "piece"));
  const selectedUnitLabel = selectedUnit ? t[selectedUnit.labelKey] : t.unitPiece;
  const showUnitSize = !unitsWithoutSize.has(formData.productUnit || "piece");
  const unitMultiplier = showUnitSize ? Math.max(0, Number(formData.cartonSize || 0)) : (fixedUnitMultipliers[formData.productUnit] || 1);
  const totalPieces = Math.max(0, Number(formData.quantity || 0)) * unitMultiplier;
  const formatTemplate = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template || "");

  const availableSuppliers = useMemo(() => suppliers.filter((item) => item?.supplierName || item?.companyName || item?.name), [suppliers]);

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

  const supplierNameById = (supplierId, legacyName = "") => {
    const supplier = availableSuppliers.find((item) => String(item.id) === String(supplierId));
    const legacy = legacyCompanies.find((item) => String(item.id) === String(supplierId));
    return supplier?.supplierName || supplier?.companyName || supplier?.name || legacy?.manufacturerName || legacy?.companyName || legacyName || "—";
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [
        product.productName,
        groupLabel(product),
        supplierNameById(product.supplierId || product.manufacturerId || product.companyId, product.supplierName || product.company),
        countryLabel(product),
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, search, availableSuppliers, legacyCompanies, productGroups, productCountries, language]);


  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, groupId: defaultGroupId, countryId: defaultCountryId });
    setFieldErrors({});
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
    setAddingProductForm(false);
    setNewProductForm("");
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setFieldErrors({});
    const legacyGroup = productGroups.find((item) => normalizeMasterName(item.name) === normalizeMasterName(product.group));
    const legacyCountry = productCountries.find((item) => normalizeMasterName(item.name || item.en) === normalizeMasterName(product.madeIn));
    setFormData({
      ...emptyForm,
      ...product,
      groupId: product.groupId || legacyGroup?.id || defaultGroupId,
      countryId: product.countryId || legacyCountry?.id || defaultCountryId,
      supplierId: product.supplierId || product.manufacturerId || product.companyId || "",
      alertBeforeExpiryDays: String(product.alertBeforeExpiryDays || "180"),
    });
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
    setAddingProductForm(false);
    setNewProductForm("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFieldErrors({});
    setAddingGroup(false);
    setNewGroup("");
    setAddingCountry(false);
    setNewCountry("");
    setAddingProductForm(false);
    setNewProductForm("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const errorKey = name === "groupId" ? "group" : name === "countryId" ? "country" : name === "productForm" ? "productForm" : name;
    setFieldErrors((current) => {
      if (!current[errorKey]) return current;
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
    setFormData((previous) => {
      if (name === "productUnit") {
        return { ...previous, productUnit: value, cartonSize: unitsWithoutSize.has(value) ? "" : previous.cartonSize };
      }
      return { ...previous, [name]: value };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((previous) => ({ ...previous, image: reader.result || defaultProductImage }));
    };
    reader.readAsDataURL(file);
  };

  const saveInlineGroup = async () => {
    const name = newGroup.trim();
    if (!name) {
      setFieldErrors((current) => ({ ...current, group: t.groupRequired }));
      return;
    }
    const existing = productGroups.find((item) => normalizeMasterName(item.name) === normalizeMasterName(name));
    if (existing) {
      setFormData((previous) => ({ ...previous, groupId: existing.id }));
    } else {
      const row = { id: makeMasterId("group", name), name, createdAt: new Date().toISOString() };
      const saved = await setProductGroups([...productGroups, row]);
      if (!saved) return;
      setFormData((previous) => ({ ...previous, groupId: row.id }));
    }
    setAddingGroup(false);
    setNewGroup("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.group;
      return next;
    });
  };

  const saveInlineCountry = async () => {
    const name = newCountry.trim();
    if (!name) {
      setFieldErrors((current) => ({ ...current, country: t.countryRequired }));
      return;
    }
    const existing = productCountries.find((item) => normalizeMasterName(item.name || item.en) === normalizeMasterName(name));
    if (existing) {
      setFormData((previous) => ({ ...previous, countryId: existing.id }));
    } else {
      const row = { id: makeMasterId("country", name), name, en: name, fa: name, ps: name, createdAt: new Date().toISOString() };
      const saved = await setProductCountries([...productCountries, row]);
      if (!saved) return;
      setFormData((previous) => ({ ...previous, countryId: row.id }));
    }
    setAddingCountry(false);
    setNewCountry("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.country;
      return next;
    });
  };

  const saveInlineProductForm = async () => {
    const name = newProductForm.trim();
    if (!name) {
      setFieldErrors((current) => ({ ...current, productForm: t.productFormRequired }));
      return;
    }
    const existingDefault = productFormOptions.find((item) => normalizeMasterName(t[item.labelKey]) === normalizeMasterName(name));
    const existingCustom = customProductForms.find((item) => normalizeMasterName(item.name) === normalizeMasterName(name));
    if (existingDefault) {
      setFormData((previous) => ({ ...previous, productForm: existingDefault.value }));
    } else if (existingCustom) {
      setFormData((previous) => ({ ...previous, productForm: `custom:${existingCustom.id}` }));
    } else {
      const row = { id: makeMasterId("product-form", name), name, createdAt: new Date().toISOString() };
      const saved = await setCustomProductForms([...customProductForms, row]);
      if (!saved) return;
      setFormData((previous) => ({ ...previous, productForm: `custom:${row.id}` }));
    }
    setAddingProductForm(false);
    setNewProductForm("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.productForm;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});

    let selectedGroupId = formData.groupId;
    let selectedCountryId = formData.countryId;

    if (addingGroup) {
      const name = newGroup.trim();
      if (!name) {
        setFieldErrors({ group: t.groupRequired });
        return;
      }
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
      if (!name) {
        setFieldErrors({ country: t.countryRequired });
        return;
      }
      const existing = productCountries.find((item) => normalizeMasterName(item.name || item.en) === normalizeMasterName(name));
      if (existing) selectedCountryId = existing.id;
      else {
        const row = { id: makeMasterId("country", name), name, en: name, fa: name, ps: name, createdAt: new Date().toISOString() };
        const saved = await setProductCountries([...productCountries, row]);
        if (!saved) return;
        selectedCountryId = row.id;
      }
    }

    const nextErrors = {};
    if (!formData.productName.trim()) nextErrors.productName = t.requiredProductName;
    if (!selectedGroupId) nextErrors.group = t.requiredGroup;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }


    const productId = editingId || `sale-product-${Date.now()}`;
    const now = new Date().toISOString();
    const openingQuantity = Number(formData.quantity || 0);
    const { group: _legacyGroup, madeIn: _legacyMadeIn, companyId: _legacyCompanyId, company: _legacyCompany, manufacturerId: _legacyManufacturerId, ...cleanFormData } = formData;
    const record = {
      ...cleanFormData,
      id: productId,
      productName: formData.productName.trim(),
      groupId: selectedGroupId,
      supplierId: formData.supplierId,
      supplierName: supplierNameById(formData.supplierId, ""),
      countryId: selectedCountryId,
      unit: formData.unit || "afn",
      productUnit: formData.productUnit || "piece",
      expiryDate: formData.expiryDate || "",
      alertBeforeExpiryDays: Number(formData.alertBeforeExpiryDays || 180),
      lowStockThreshold: Number(formData.lowStockThreshold || 0),
      quantity: openingQuantity,
      currentStock: openingQuantity,
      stock: openingQuantity,
      piecesPerUnit: unitMultiplier,
      totalPieceQuantity: openingQuantity * unitMultiplier,
      image: formData.image || defaultProductImage,
      cartonSize: formData.cartonSize.trim(),
      discount: Number(formData.discount || 0),
      salePrice: Number(formData.salePrice || 0),
      purchasePrice: Number(formData.purchasePrice || 0),
      description: formData.description.trim(),
      updatedAt: now,
      createdAt: editingId
        ? products.find((item) => String(item.id) === String(editingId))?.createdAt || now
        : now,
    };


    const nextProducts = editingId
      ? products.map((item) => (String(item.id) === String(editingId) ? record : item))
      : [record, ...products];

    const saved = await setProducts(nextProducts);
    if (!saved) return;

    const openingMovements = openingQuantity > 0
      ? [{
        id: stockMovementId("opening", productId, productId),
        productId,
        movementType: "opening",
        referenceType: "opening",
        referenceId: productId,
        referenceNumber: record.productName,
        // Stock movements are kept in the base piece unit; the form quantity is in main units.
        quantityIn: openingQuantity * unitMultiplier,
        quantityOut: 0,
        purchaseQuantity: openingQuantity,
        purchaseUnit: record.productUnit,
        unitsPerUnit: unitMultiplier,
        stockUnit: "piece",
        unitCost: Number(formData.purchasePrice || 0),
        batchNo: "OPENING",
        expiryDate: formData.expiryDate || "",
        movementDate: now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      }]
      : [];
    await setStockMovements(replaceReferenceMovements(stockMovements, "opening", productId, openingMovements));

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
                <th>{t.productUnit}</th>
                <th>{t.madeIn}</th>
                <th>{t.salePrice}</th>
                <th>{t.purchasePrice}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="sales-product-clickable-row" role="button" tabIndex={0} onClick={() => navigate(`/product-detail/${product.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/product-detail/${product.id}`); }}>
                  <td className="sales-product-name-cell">
                    <img src={productImageSrc(product)} alt="" />
                    <div><strong>{product.productName}</strong>{product.description && <small>{product.description}</small>}</div>
                  </td>
                  <td><span className="sales-product-group-badge">{groupLabel(product)}</span></td>
                  <td>{product.cartonSize || "—"}</td>
                  <td>{t[productUnitOptions.find((option) => option.value === (product.productUnit || "piece"))?.labelKey] || product.productUnit || t.unitPiece}</td>
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
                <label className={`sales-product-field sales-product-field-wide ${fieldErrors.productName ? "has-error" : ""}`}>
                  <span>{t.productName} *</span>
                  <input name="productName" value={formData.productName} onChange={handleChange} placeholder={t.productPlaceholder} autoFocus aria-invalid={Boolean(fieldErrors.productName)} aria-describedby={fieldErrors.productName ? "product-name-error" : undefined} />
                  {fieldErrors.productName && <span id="product-name-error" className="sales-product-field-error" role="alert">{fieldErrors.productName}</span>}
                </label>

                <div className={`sales-product-field ${fieldErrors.group ? "has-error" : ""}`}>
                  <span>{t.group} *</span>
                  <div className={`sales-product-inline-manager ${addingGroup ? "is-editing" : ""}`}>
                    {addingGroup ? (
                      <>
                        <input
                          value={newGroup}
                          onChange={(e) => setNewGroup(e.target.value)}
                          placeholder={t.newGroupPlaceholder}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveInlineGroup();
                            }
                            if (e.key === "Escape") {
                              setAddingGroup(false);
                              setNewGroup("");
                            }
                          }}
                        />
                        <button type="button" className="sales-product-inline-save" onClick={saveInlineGroup} title={t.addNewGroup} aria-label={t.addNewGroup}>
                          <Plus size={14} />
                        </button>
                        <button type="button" className="sales-product-inline-cancel" onClick={() => { setAddingGroup(false); setNewGroup(""); }} title={t.cancel} aria-label={t.cancel}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <select name="groupId" value={formData.groupId} onChange={handleChange} aria-invalid={Boolean(fieldErrors.group)} aria-describedby={fieldErrors.group ? "group-error" : undefined}>
                          <option value="" disabled>{t.selectGroup}</option>
                          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                        </select>
                        <button type="button" className="sales-product-inline-add" onClick={() => setAddingGroup(true)} title={t.addNewGroup} aria-label={t.addNewGroup}><Plus size={14} /></button>
                      </>
                    )}
                  </div>
                  {fieldErrors.group && <span id="group-error" className="sales-product-field-error" role="alert">{fieldErrors.group}</span>}
                </div>

                <label className="sales-product-field">
                  <span>{t.productUnit}</span>
                  <select name="productUnit" value={formData.productUnit || "piece"} onChange={handleChange}>
                    {productUnitOptions.map((option) => <option key={option.value} value={option.value}>{t[option.labelKey]}</option>)}
                  </select>
                </label>

                {showUnitSize && (
                  <label className="sales-product-field">
                    <span>{formatTemplate(t.unitSize, { unit: selectedUnitLabel })}</span>
                    <input type="number" min="1" step="1" name="cartonSize" value={formData.cartonSize} onChange={handleChange} placeholder={t.cartonPlaceholder} />
                    <small className="sales-product-field-help">{formatTemplate(t.unitSizeHint, { unit: selectedUnitLabel })}</small>
                  </label>
                )}

                <div className={`sales-product-field ${fieldErrors.productForm ? "has-error" : ""}`}>
                  <span>{t.productForm}</span>
                  <div className={`sales-product-inline-manager ${addingProductForm ? "is-editing" : ""}`}>
                    {addingProductForm ? (
                      <>
                        <input
                          value={newProductForm}
                          onChange={(e) => setNewProductForm(e.target.value)}
                          placeholder={t.newProductFormPlaceholder}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); saveInlineProductForm(); }
                            if (e.key === "Escape") { setAddingProductForm(false); setNewProductForm(""); }
                          }}
                        />
                        <button type="button" className="sales-product-inline-save" onClick={saveInlineProductForm} title={t.addProductForm} aria-label={t.addProductForm}><Plus size={14} /></button>
                        <button type="button" className="sales-product-inline-cancel" onClick={() => { setAddingProductForm(false); setNewProductForm(""); }} title={t.cancel} aria-label={t.cancel}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <select name="productForm" value={formData.productForm || ""} onChange={handleChange}>
                          <option value="">{t.selectProductForm}</option>
                          {productFormOptions.map((option) => <option key={option.value} value={option.value}>{t[option.labelKey]}</option>)}
                          {customProductForms.filter((item) => item?.name).map((item) => <option key={item.id} value={`custom:${item.id}`}>{item.name}</option>)}
                        </select>
                        <button type="button" className="sales-product-inline-add" onClick={() => setAddingProductForm(true)} title={t.addProductForm} aria-label={t.addProductForm}><Plus size={14} /></button>
                      </>
                    )}
                  </div>
                  {fieldErrors.productForm && <span className="sales-product-field-error" role="alert">{fieldErrors.productForm}</span>}
                </div>


                <div className={`sales-product-field ${fieldErrors.country ? "has-error" : ""}`}>
                  <span>{t.madeIn}</span>
                  <div className={`sales-product-inline-manager ${addingCountry ? "is-editing" : ""}`}>
                    {addingCountry ? (
                      <>
                        <input
                          value={newCountry}
                          onChange={(e) => setNewCountry(e.target.value)}
                          placeholder={t.newCountryPlaceholder}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveInlineCountry();
                            }
                            if (e.key === "Escape") {
                              setAddingCountry(false);
                              setNewCountry("");
                            }
                          }}
                        />
                        <button type="button" className="sales-product-inline-save" onClick={saveInlineCountry} title={t.addNewCountry} aria-label={t.addNewCountry}>
                          <Plus size={14} />
                        </button>
                        <button type="button" className="sales-product-inline-cancel" onClick={() => { setAddingCountry(false); setNewCountry(""); }} title={t.cancel} aria-label={t.cancel}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <select name="countryId" value={formData.countryId} onChange={handleChange}>
                          <option value="" disabled>{t.selectCountry}</option>
                          {allCountries.map((country) => <option key={country.id} value={country.id}>{country[language] || country.en || country.name}</option>)}
                        </select>
                        <button type="button" className="sales-product-inline-add" onClick={() => setAddingCountry(true)} title={t.addNewCountry} aria-label={t.addNewCountry}><Plus size={14} /></button>
                      </>
                    )}
                  </div>
                  {fieldErrors.country && <span className="sales-product-field-error" role="alert">{fieldErrors.country}</span>}
                </div>

                <label className="sales-product-field">
                  <span>{t.currency}</span>
                  <select name="unit" value={formData.unit || "afn"} onChange={handleChange}>
                    {currencyOptions.map((currency) => <option key={currency} value={currency}>{t[currency]}</option>)}
                  </select>
                </label>

                <label className="sales-product-field">
                  <span>{formatTemplate(t.purchasePricePerUnit, { unit: selectedUnitLabel })}</span>
                  <input type="number" min="0" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder={t.pricePlaceholder} />
                </label>

                <label className="sales-product-field">
                  <span>{formatTemplate(t.salePricePerUnit, { unit: selectedUnitLabel })}</span>
                  <input type="number" min="0" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} placeholder={t.pricePlaceholder} />
                </label>

                <label className="sales-product-field">
                  <span>{t.expiryDate}</span>
                  <input type="date" name="expiryDate" value={formData.expiryDate || ""} onChange={handleChange} />
                </label>

                <label className="sales-product-field">
                  <span>{t.alertBefore}</span>
                  <select name="alertBeforeExpiryDays" value={String(formData.alertBeforeExpiryDays || "180")} onChange={handleChange}>
                    {expiryAlertOptions.map((option) => <option key={option.value} value={option.value}>{t[option.labelKey]}</option>)}
                  </select>
                </label>

                <label className="sales-product-field">
                  <span>{t.lowStock}</span>
                  <input type="number" min="0" step="1" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} placeholder="0" />
                </label>

                <label className="sales-product-field">
                  <span>{formatTemplate(t.quantityOfUnit, { unit: selectedUnitLabel })}</span>
                  <input type="number" min="0" step="1" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" />
                  {Number(formData.quantity || 0) > 0 && (
                    <small className="sales-product-quantity-total">{formatTemplate(t.totalPieces, { count: totalPieces.toLocaleString("en-US") })}</small>
                  )}
                </label>

                <div className="sales-product-field sales-product-image-field">
                  <span>{t.image}</span>
                  <div className="sales-product-image-control">
                    <img src={productImageSrc(formData)} alt="" />
                    <div>
                      <label className="sales-product-image-picker">
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                        <span>{t.chooseImage}</span>
                      </label>
                      <button type="button" onClick={() => setFormData((previous) => ({ ...previous, image: defaultProductImage }))}>
                        {t.removeImage}
                      </button>
                    </div>
                  </div>
                </div>

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
