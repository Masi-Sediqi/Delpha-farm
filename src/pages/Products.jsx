import { useSearchResultReset } from "../hooks/useSearchResultReset";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { CopyPlus, Edit3, PackagePlus, Plus, Minus, Search, Trash2, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { confirmAction } from "../utils/confirmDialog";
import { notify } from "../utils/notify";
import { countryNameById, groupNameById, makeMasterId, normalizeMasterName, isProductMasterInUse } from "../utils/productMasterData";
import { productPricePerPiece } from "../utils/piecePricing";
import { writeAtomicFinanceBatch } from "../utils/browserStorage";
import { updateProductDetails } from "../utils/productDetails";
import "./Products.css";

const languageKey = "afghan-power-language";

const translations = {
  en: {
    title: "Products",
    deleteCountry: "Delete selected country",
    deleteManufacturer: "Delete selected company",
    masterInUse: "This country or company is used by a product and cannot be deleted.",
    masterDeleted: "Deleted successfully.",
    subtitle: "Register and manage products.",
    addProduct: "Add Product",
    totalProducts: "Total Products",
    groups: "Groups",
    countries: "Manufacturing Countries",
    avgDiscount: "Average Discount",
    search: "Search product, supplier, manufacturer, group or country...",
    noProducts: "No products have been registered yet.",
    productName: "Product Name",
    group: "Group",
    cartonSize: "Carton Size",
    discount: "Discount (%)",
    company: "Supplier",
    manufacturerCompany: "Manufacturer Company",
    manufacturerCompanyPlaceholder: "Enter manufacturer company",
    selectManufacturerCompany: "Select manufacturer company",
    addManufacturerCompany: "Add manufacturer company",
    editManufacturerCompany: "Edit manufacturer company",
    deleteManufacturerCompany: "Delete manufacturer company",
    manufacturerCompanyRequired: "Enter manufacturer company name.",
    manufacturerCompanyExists: "This manufacturer company already exists.",
    manufacturerCompanySaved: "Manufacturer company saved.",
    manufacturerCompanyUpdated: "Manufacturer company updated.",
    manufacturerCompanyDeleted: "Manufacturer company deleted.",
    confirmDeleteManufacturer: "Delete this manufacturer company?",
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
    saveAll: "Save All Products",
    addAnother: "Add another product",
    productNumber: "Product {number}",
    update: "Update Product",
    required: "Please enter the product name and select a group.",
    requiredProductName: "Product name is required.",
    duplicateProductName: "A product with this name has already been added.",
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
    deleteCountry: "حذف کشور انتخاب‌شده",
    deleteManufacturer: "حذف کمپنی انتخاب‌شده",
    masterInUse: "این کشور یا کمپنی در اجناس استفاده شده و قابل حذف نیست.",
    masterDeleted: "با موفقیت حذف شد.",
    title: "محصولات",
    subtitle: "محصولات را ثبت و مدیریت کنید.",
    addProduct: "درج جنس جدید",
    totalProducts: "مجموع اجناس",
    groups: "گروپ‌ها",
    countries: "کشورهای ساخت",
    avgDiscount: "اوسط تخفیف",
    search: "جستجوی نام جنس، تأمین‌کننده، کمپنی سازنده، گروپ یا کشور...",
    noProducts: "هنوز هیچ جنسی ثبت نشده است.",
    productName: "نام جنس",
    group: "گروپ",
    cartonSize: "سایز کارتن",
    discount: "تخفیف (%)",
    company: "تأمین‌کننده",
    manufacturerCompany: "کمپنی سازنده",
    manufacturerCompanyPlaceholder: "نام کمپنی سازنده را وارد کنید",
    selectManufacturerCompany: "کمپنی سازنده را انتخاب کنید",
    addManufacturerCompany: "افزودن کمپنی سازنده",
    editManufacturerCompany: "ویرایش کمپنی سازنده",
    deleteManufacturerCompany: "حذف کمپنی سازنده",
    manufacturerCompanyRequired: "نام کمپنی سازنده را وارد کنید.",
    manufacturerCompanyExists: "این کمپنی سازنده قبلاً ثبت شده است.",
    manufacturerCompanySaved: "کمپنی سازنده با موفقیت ثبت شد.",
    manufacturerCompanyUpdated: "کمپنی سازنده با موفقیت ویرایش شد.",
    manufacturerCompanyDeleted: "کمپنی سازنده با موفقیت حذف شد.",
    confirmDeleteManufacturer: "این کمپنی سازنده حذف شود؟",
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
    saveAll: "ذخیره تمام اجناس",
    addAnother: "افزودن جنس دیگر",
    productNumber: "جنس {number}",
    update: "ثبت تغییرات",
    required: "لطفاً نام جنس را وارد و گروپ را انتخاب کنید.",
    requiredProductName: "لطفاً نام جنس را وارد کنید.",
    duplicateProductName: "این جنس با این نام قبلاً اضافه شده است.",
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
    deleteCountry: "ټاکل شوی هېواد حذف کړئ",
    deleteManufacturer: "ټاکل شوې کمپنی حذف کړئ",
    masterInUse: "دا هېواد یا کمپنی په توکو کې کارول شوې او حذف کېدای نشي.",
    masterDeleted: "په بریالیتوب حذف شو.",
    title: "محصولات",
    subtitle: "د خرڅلاو توکي ثبت او اداره کړئ.",
    addProduct: "نوی توکی ثبتول",
    totalProducts: "ټول توکي",
    groups: "ګروپونه",
    countries: "د جوړېدو هېوادونه",
    avgDiscount: "اوسط تخفیف",
    search: "د توکي، عرضه کوونکي، جوړوونکې کمپنی، ګروپ یا هېواد لټون...",
    noProducts: "تر اوسه کوم توکی نه دی ثبت شوی.",
    productName: "د توکي نوم",
    group: "ګروپ",
    cartonSize: "د کارتن سایز",
    discount: "تخفیف (%)",
    company: "عرضه کوونکی",
    manufacturerCompany: "جوړوونکې کمپنی",
    manufacturerCompanyPlaceholder: "د جوړوونکې کمپنی نوم ولیکئ",
    selectManufacturerCompany: "جوړوونکې کمپنی وټاکئ",
    addManufacturerCompany: "جوړوونکې کمپنی اضافه کړئ",
    editManufacturerCompany: "جوړوونکې کمپنی سمول",
    deleteManufacturerCompany: "جوړوونکې کمپنی حذف کړئ",
    manufacturerCompanyRequired: "د جوړوونکې کمپنی نوم ولیکئ.",
    manufacturerCompanyExists: "دا جوړوونکې کمپنی مخکې ثبت شوې ده.",
    manufacturerCompanySaved: "جوړوونکې کمپنی ثبت شوه.",
    manufacturerCompanyUpdated: "جوړوونکې کمپنی تازه شوه.",
    manufacturerCompanyDeleted: "جوړوونکې کمپنی حذف شوه.",
    confirmDeleteManufacturer: "دا جوړوونکې کمپنی حذف شي؟",
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
    saveAll: "ټول توکي ذخیره کول",
    addAnother: "بل توکی اضافه کړئ",
    productNumber: "توکی {number}",
    update: "بدلونونه ثبتول",
    required: "مهرباني وکړئ د توکي نوم ولیکئ او ګروپ وټاکئ.",
    requiredProductName: "مهرباني وکړئ د توکي نوم ولیکئ.",
    duplicateProductName: "دا توکی په همدې نوم مخکې ثبت شوی دی.",
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

const emptyForm = {
  productName: "",
  productNameEn: "",
  groupId: "",
  cartonSize: "",
  productForm: "",
  manufacturerName: "",
  secondaryManufacturerName: "",
  saleCurrency: "afn",
  discount: "",
  supplierId: "",
  countryId: "",
  unit: "afn",
  productUnit: "piece",
  expiryDate: "",
  alertBeforeExpiryDays: "180",
  lowStockThreshold: "",
  quantity: "",
  salePrice: "",
  purchasePrice: "",
  description: "",
};

function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts, , productsLoaded] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [suppliers] = useJsonCollection("suppliers");
  const [legacyCompanies] = useJsonCollection("companies");
  const [productCountries, setProductCountries] = useJsonCollection("countries");
  const [manufacturerCompanies, setManufacturerCompanies] = useJsonCollection("manufacturerCompanies");
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [search, setSearch] = useState("");
  useSearchResultReset(setSearch);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [batchForms, setBatchForms] = useState(() => Array.from({ length: 10 }, () => ({ ...emptyForm })));
  const [fieldErrors, setFieldErrors] = useState({});

  const t = translations[language] || translations.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const availableSuppliers = useMemo(() => suppliers.filter((item) => item?.supplierName || item?.companyName || item?.name), [suppliers]);
  const manufacturerOptions = useMemo(() => {
    const byName = new Map();
    manufacturerCompanies
      .filter((item) => item?.name)
      .forEach((item) => byName.set(normalizeMasterName(item.name), { ...item, source: "master" }));

    products
      .map((item) => String(item?.manufacturerName || item?.companyName || "").trim())
      .filter(Boolean)
      .forEach((name) => {
        const key = normalizeMasterName(name);
        if (!byName.has(key)) byName.set(key, { id: `legacy:${key}`, name, source: "legacy" });
      });

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [manufacturerCompanies, products]);

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
        product.manufacturerName,
        product.companyName,
        groupLabel(product),
        supplierNameById(product.supplierId || product.manufacturerId || product.companyId, product.supplierName || product.company),
        countryLabel(product),
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, search, availableSuppliers, legacyCompanies, productGroups, productCountries, language]);


  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, groupId: defaultGroupId, countryId: defaultCountryId });
    setBatchForms(Array.from({ length: 10 }, () => ({ ...emptyForm, countryId: defaultCountryId })));
    setFieldErrors({});
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
      manufacturerName: product.manufacturerName || product.companyName || "",
      saleCurrency: String(product.saleCurrency || product.unit || "afn").toLowerCase(),
      unit: String(product.purchaseCurrency || product.unit || "afn").toLowerCase(),
      purchasePrice: productPricePerPiece(product, "purchasePrice"),
      salePrice: productPricePerPiece(product, "salePrice"),
      priceUnit: "piece",
    });
    setShowModal(true);
  };

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const match = products.find((product) => String(product.id) === editId);
    if (!match) return;
    openEdit(match);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("edit");
      return next;
    }, { replace: true });
  }, [products, searchParams, setSearchParams]);

  // Reuse the existing product registration form for requests coming from Inventory.
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openNew();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("new");
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFieldErrors({});
  };

  const normalizedProductName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

  const isDuplicateProductName = (value, currentId = editingId) => {
    const normalized = normalizedProductName(value);
    if (!normalized) return false;
    return products.some((product) =>
      String(product?.id) !== String(currentId || "") &&
      normalizedProductName(product?.productName) === normalized
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const errorKey = name === "groupId" ? "group" : name === "countryId" ? "country" : name === "productForm" ? "productForm" : name;
    setFieldErrors((current) => {
      const next = { ...current };
      if (name === "productName") {
        if (!value.trim()) next.productName = t.requiredProductName;
        else if (isDuplicateProductName(value)) next.productName = t.duplicateProductName;
        else delete next.productName;
        return next;
      }
      if (!current[errorKey]) return current;
      delete next[errorKey];
      return next;
    });
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const updateBatchForm = (index, event) => {
    if (editingId) { handleChange(event); return; }
    const { name, value } = event.target;
    setBatchForms((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [name]: value } : item
    ));
    if (fieldErrors.batch) setFieldErrors({});
  };

  const addBatchForm = () => {
    setBatchForms((current) => [...current, { ...emptyForm, countryId: defaultCountryId }]);
  };

  const removeBatchForm = (index) => {
    setBatchForms((current) => current.length <= 10
      ? current.map((item, itemIndex) => itemIndex === index
        ? { ...emptyForm, countryId: defaultCountryId }
        : item)
      : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addBatchMasterOption = async (type, index) => {
    const labels = {
      productForm: t.newProductFormPlaceholder,
      country: t.newCountryPlaceholder,
      manufacturer: t.manufacturerCompanyPlaceholder,
    };
    const rawName = window.prompt(labels[type] || t.addAnother, "");
    const name = String(rawName || "").trim().replace(/\s+/g, " ");
    if (!name) return;

    if (type === "country") {
      const existing = productCountries.find((entry) => normalizeMasterName(entry.name || entry.en) === normalizeMasterName(name));
      const row = existing || { id: makeMasterId("country", name), name, en: name, fa: name, ps: name, createdAt: new Date().toISOString() };
      if (!existing && !await setProductCountries([...productCountries, row])) return;
      if (editingId) setFormData(current => ({ ...current, countryId: row.id }));
      else setBatchForms((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, countryId: row.id } : item));
      return;
    }

    const existing = manufacturerCompanies.find((entry) => normalizeMasterName(entry.name) === normalizeMasterName(name));
    const row = existing || { id: makeMasterId("manufacturer", name), name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!existing && !await setManufacturerCompanies([...manufacturerCompanies, row])) return;
    if (editingId) setFormData(current => ({ ...current, manufacturerName: row.name }));
    else setBatchForms((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, manufacturerName: row.name } : item));
  };

  const deleteMasterOption = async (type, item) => {
    const option = type === "country"
      ? productCountries.find((entry) => String(entry.id) === String(item.countryId))
      : manufacturerCompanies.find((entry) => normalizeMasterName(entry.name) === normalizeMasterName(item.manufacturerName));
    if (!option || !productsLoaded) return;
    if (isProductMasterInUse(type, option, products)) {
      notify(t.masterInUse, "warning");
      return;
    }
    const saved = type === "country"
      ? await setProductCountries(productCountries.filter((entry) => String(entry.id) !== String(option.id)))
      : await setManufacturerCompanies(manufacturerCompanies.filter((entry) => String(entry.id) !== String(option.id)));
    if (!saved) return;
    const clearOption = (row) => type === "country"
      ? (String(row.countryId) === String(option.id) ? { ...row, countryId: "" } : row)
      : (normalizeMasterName(row.manufacturerName) === normalizeMasterName(option.name) ? { ...row, manufacturerName: "" } : row);
    setFormData(clearOption);
    setBatchForms((rows) => rows.map(clearOption));
    notify(t.masterDeleted, "success", { silent: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});

    if (!editingId) {
      const rows = batchForms.filter((item) => item.productName.trim());
      const names = rows.map((item) => normalizedProductName(item.productName));
      const duplicateInBatch = names.some((name, index) => names.indexOf(name) !== index);
      const duplicateExisting = rows.some((item) => isDuplicateProductName(item.productName, null));
      if (!rows.length) {
        setFieldErrors({ batch: t.requiredProductName });
        return;
      }
      if (duplicateInBatch || duplicateExisting) {
        setFieldErrors({ batch: t.duplicateProductName });
        return;
      }

      const now = new Date().toISOString();
      const records = rows.map((item, index) => ({
        ...emptyForm,
        ...item,
        id: `sale-product-${Date.now()}-${index}`,
        productName: item.productName.trim(),
        manufacturerName: String(item.manufacturerName || "").trim(),
        saleCurrency: currencyOptions.includes(item.saleCurrency) ? item.saleCurrency : (item.unit || "afn"),
        supplierName: supplierNameById(item.supplierId, ""),
        unit: item.unit || "afn",
        productUnit: "piece",
        priceUnit: "piece",
        cartonSize: String(item.cartonSize || "").trim(),
        expiryDate: "",
        alertBeforeExpiryDays: 180,
        lowStockThreshold: 0,
        quantity: 0,
        currentStock: 0,
        stock: 0,
        piecesPerUnit: Math.max(1, Number(item.cartonSize || 1)),
        totalPieceQuantity: 0,
        discount: Number(item.discount || 0),
        salePrice: Number(item.salePrice || 0),
        purchasePrice: Number(item.purchasePrice || 0),
        description: String(item.description || "").trim(),
        createdAt: now,
        updatedAt: now,
      }));
      const saved = await setProducts([...records, ...products]);
      if (!saved) return;
      notify(t.saved);
      closeModal();
      return;
    }

    if (!formData.productName.trim()) {
      setFieldErrors({ productName: t.requiredProductName });
      return;
    }
    if (isDuplicateProductName(formData.productName)) {
      setFieldErrors({ productName: t.duplicateProductName });
      return;
    }
    const existing = products.find(item => String(item.id) === String(editingId));
    if (!existing) return;
    const record = updateProductDetails(existing, formData, new Date().toISOString());
    try {
      await writeAtomicFinanceBatch({
        products: products.map(item => String(item.id) === String(editingId) ? record : item),
      });
      notify(t.saved);
      closeModal();
    } catch (error) { notify(error.message, "error"); }

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
                <th>{t.manufacturerCompany}</th>
                <th>{t.salePrice}</th>
                <th>{t.purchasePrice}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr data-search-kind="product" data-search-id={product.id} key={product.id} className="sales-product-clickable-row" role="button" tabIndex={0} onClick={() => navigate(`/product-detail/${product.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/product-detail/${product.id}`); }}>
                  <td className="sales-product-name-cell">
                    <div><strong>{product.productName}</strong>{product.description && <small>{product.description}</small>}</div>
                  </td>
                  <td><span className="sales-product-group-badge">{groupLabel(product)}</span></td>
                  <td>{product.cartonSize || "—"}</td>
                  <td>{t[productUnitOptions.find((option) => option.value === (product.productUnit || "piece"))?.labelKey] || product.productUnit || t.unitPiece}</td>
                  <td>{countryLabel(product)}</td>
                  <td>{product.manufacturerName || product.companyName || "—"}</td>
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

              <form onSubmit={handleSubmit} className="sales-product-form sales-product-batch-form">
                {(fieldErrors.batch || fieldErrors.productName) && <div id="product-form-error" className="sales-product-batch-error" role="alert">{fieldErrors.batch || fieldErrors.productName}</div>}
                <div className="sales-product-batch-grid">
                  {(editingId ? [formData] : batchForms).map((item, index) => (
                    <section className="sales-product-batch-card" key={index}>
                      <header>
                        {editingId ? <strong>{t.editTitle}</strong> : <button type="button" tabIndex={-1} onClick={() => removeBatchForm(index)} aria-label={t.delete} title={t.delete}><Trash2 size={15} /></button>}
                      </header>
                      <div className="sales-product-batch-fields">
                        <label className="sales-product-field sales-product-field-wide">
                          <span>{t.productName} *</span>
                          <input name="productName" value={item.productName} onChange={(event) => updateBatchForm(index, event)} placeholder={t.productPlaceholder} autoFocus={index === 0} aria-invalid={Boolean(fieldErrors.productName || fieldErrors.batch)} aria-describedby={fieldErrors.productName || fieldErrors.batch ? "product-form-error" : undefined} />
                        </label>
                        <label className="sales-product-field">
                          <span>{t.cartonSize}</span>
                          <input type="number" min="1" step="1" name="cartonSize" value={item.cartonSize} onChange={(event) => updateBatchForm(index, event)} placeholder={t.cartonPlaceholder} />
                        </label>
                        <label className="sales-product-field">
                          <span>{t.madeIn}</span>
                          <span className="sales-product-batch-select"><select name="countryId" value={item.countryId || ""} onChange={(event) => updateBatchForm(index, event)}>
                              <option value="">{t.selectCountry}</option>
                              {allCountries.map((country) => <option key={country.id} value={country.id}>{country[language] || country.en || country.name}</option>)}
                            </select><button type="button" onClick={() => addBatchMasterOption("country", index)} title={t.addNewCountry} aria-label={t.addNewCountry}><Plus size={14} /></button><button type="button" className="sales-product-master-delete" disabled={!productsLoaded || !item.countryId} onClick={() => deleteMasterOption("country", item)} title={t.deleteCountry} aria-label={t.deleteCountry}><Minus size={14} /></button></span>
                        </label>
                        <label className="sales-product-field">
                          <span>{t.manufacturerCompany}</span>
                          <span className="sales-product-batch-select"><select name="manufacturerName" value={item.manufacturerName || ""} onChange={(event) => updateBatchForm(index, event)}>
                              <option value="">{t.selectManufacturerCompany}</option>
                              {manufacturerOptions.map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}
                            </select><button type="button" onClick={() => addBatchMasterOption("manufacturer", index)} title={t.addManufacturerCompany} aria-label={t.addManufacturerCompany}><Plus size={14} /></button><button type="button" className="sales-product-master-delete" disabled={!productsLoaded || !manufacturerCompanies.some((entry) => normalizeMasterName(entry.name) === normalizeMasterName(item.manufacturerName))} onClick={() => deleteMasterOption("manufacturer", item)} title={t.deleteManufacturer} aria-label={t.deleteManufacturer}><Minus size={14} /></button></span>
                        </label>
                        <label className="sales-product-field">
                          <span>{t.currency}</span>
                          <select name="unit" value={item.unit || "afn"} onChange={(event) => updateBatchForm(index, event)}>
                            {currencyOptions.map((currency) => <option key={currency} value={currency}>{t[currency]}</option>)}
                          </select>
                        </label>
                        <label className="sales-product-field">
                          <span>{t.purchasePrice}</span>
                          <input type="number" min="0" step="any" name="purchasePrice" value={item.purchasePrice} onChange={(event) => updateBatchForm(index, event)} placeholder={t.pricePlaceholder} />
                        </label>
                        <label className="sales-product-field">
                          <span>{t.currency}</span>
                          <select name="saleCurrency" value={item.saleCurrency || "afn"} onChange={(event) => updateBatchForm(index, event)}>
                            {currencyOptions.map((currency) => <option key={currency} value={currency}>{t[currency]}</option>)}
                          </select>
                        </label>
                        <label className="sales-product-field">
                          <span>{t.salePrice}</span>
                          <input type="number" min="0" step="any" name="salePrice" value={item.salePrice} onChange={(event) => updateBatchForm(index, event)} placeholder={t.pricePlaceholder} />
                        </label>
                      </div>
                    </section>
                  ))}
                </div>
                {!editingId && <button type="button" className="sales-product-add-row" onClick={addBatchForm}><CopyPlus size={17} />{t.addAnother}</button>}
                <div className="sales-product-modal-footer">
                  <button type="button" className="sales-product-cancel-btn" onClick={closeModal}>{t.cancel}</button>
                  <button type="submit" className="sales-product-save-btn">{editingId ? t.update : t.saveAll}</button>
                </div>
              </form>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}

export default Products;
