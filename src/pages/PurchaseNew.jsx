import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Info,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { productImageSrc } from "../utils/productImages";
import { groupNameById } from "../utils/productMasterData";
import {
  getProductStock,
  legacyProductStock,
  replaceReferenceMovements,
  stockMovementId,
} from "../utils/stock";
import "./PurchaseNew.css";
import "./SaleNew.css";
import "./PurchaseSaleLayout.css";

const languageKey = "afghan-power-language";
const currencies = ["AFN", "USD", "EUR", "INR"];

const text = {
  en: {
    title: "New Purchase",
    subtitle: "Create a purchase invoice and receive medicines into stock",
    back: "Back to purchases",
    supplier: "Supplier",
    selectSupplier: "Select supplier",
    quickSupplier: "Add supplier",
    supplierName: "Supplier name",
    supplierPlaceholder: "Enter supplier name",
    supplierInfo: "Supplier information",
    supplierInfoEmpty: "Select a supplier to view information.",
    contactPerson: "Contact person",
    phone: "Phone",
    address: "Address",
    openingBalance: "Opening balance",
    add: "Add",
    cancel: "Cancel",
    currency: "Currency",
    billNumber: "Bill number",
    systemBillNumber: "System bill number",
    date: "Purchase date (Solar Hijri)",
    paymentStatus: "Payment status",
    paidFull: "Fully paid",
    debt: "Credit / Debt",
    paidAmount: "Amount paid now",
    searchPlaceholder: "Search medicine by name, group or company...",
    searchHint: "Click the search field and choose a medicine",
    results: "Search results",
    invoiceItems: "Purchase items",
    emptyTitle: "No medicine added yet",
    emptyText: "Search above and select a medicine to add it to this purchase.",
    company: "Company",
    selectCompany: "Select company",
    registerCompany: "Register company",
    companyPlaceholder: "Enter company name",
    companySaved: "Company registered and linked to this medicine.",
    companyRequired: "Enter company name.",
    qty: "Quantity by unit",
    purchaseUnit: "Main unit",
    unitsPerUnit: "Pieces in unit",
    actualQty: "Quantity by piece",
    actualQtyText: "{qty} {unit}",
    unitPrice: "Purchase price",
    salePrice: "Sale price",
    addMedicine: "Add",
    expiryDate: "Expiry date (Gregorian)",
    total: "Total",
    stock: "Current stock",
    unit: "Unit",
    remove: "Remove",
    itemCount: "Item count",
    subtotal: "Subtotal",
    grandTotal: "Grand total",
    paid: "Paid",
    remaining: "Remaining / Debt",
    save: "Save Purchase",
    requiredSupplier: "Please select a supplier.",
    requiredItems: "Please add at least one medicine.",
    invalidPaid: "Paid amount cannot be greater than the payable total.",
    supplierSaved: "Supplier added successfully.",
    saved: "Purchase saved successfully.",
    updated: "Purchase updated successfully.",
    editTitle: "Edit Purchase",
    editSubtitle: "Update this purchase while keeping its original record number.",
    nameRequired: "Enter supplier name.",
  },
  fa: {
    title: "خریداری جدید",
    subtitle: "ایجاد بل خریداری و اضافه‌کردن دواها به موجودی",
    back: "برگشت به خریداری",
    supplier: "تأمین‌کننده",
    selectSupplier: "تأمین‌کننده را انتخاب کنید",
    quickSupplier: "افزودن تأمین‌کننده",
    supplierName: "نام تأمین‌کننده",
    supplierPlaceholder: "نام تأمین‌کننده را وارد کنید",
    supplierInfo: "معلومات تأمین‌کننده",
    supplierInfoEmpty: "برای دیدن معلومات، تأمین‌کننده را انتخاب کنید.",
    contactPerson: "شخص تماس",
    phone: "شماره تماس",
    address: "آدرس",
    openingBalance: "بیلانس شروع",
    add: "اضافه",
    cancel: "لغو",
    currency: "واحد پول",
    billNumber: "بل نمبر",
    systemBillNumber: "بل نمبر سیستم",
    date: "تاریخ خریداری (شمسی)",
    paymentStatus: "وضعیت پرداخت",
    paidFull: "مکمل پرداخت",
    debt: "قرض",
    paidAmount: "مقدار پرداخت فعلی",
    searchPlaceholder: "جستجوی دوا با نام، گروپ یا کمپنی...",
    searchHint: "در جستجو کلیک کنید و دوا را انتخاب نمایید",
    results: "نتایج جستجو",
    invoiceItems: "اقلام خریداری",
    emptyTitle: "هنوز دوایی اضافه نشده",
    emptyText: "از جستجوی بالا دوا را پیدا کرده و به این خریداری اضافه کنید.",
    company: "کمپنی",
    selectCompany: "کمپنی را انتخاب کنید",
    registerCompany: "ثبت کمپنی",
    companyPlaceholder: "نام کمپنی را وارد کنید",
    companySaved: "کمپنی ثبت و به همین دوا لینک شد.",
    companyRequired: "نام کمپنی را وارد کنید.",
    qty: "تعداد",
    purchaseUnit: "واحد اصلی",
    unitsPerUnit: "تعداد دانه در واحد",
    actualQty: "مقدار به دانه",
    actualQtyText: "{qty} {unit}",
    unitPrice: "قیمت خرید",
    salePrice: "قیمت فروش",
    addMedicine: "اضافه",
    expiryDate: "تاریخ انقضا (میلادی)",
    total: "جمله",
    stock: "موجودی فعلی",
    unit: "واحد",
    remove: "حذف",
    itemCount: "تعداد اقلام",
    subtotal: "جمع اقلام",
    grandTotal: "مجموع نهایی",
    paid: "پرداخت",
    remaining: "باقی / قرض",
    save: "ذخیره خریداری",
    requiredSupplier: "لطفاً تأمین‌کننده را انتخاب کنید.",
    requiredItems: "حداقل یک دوا را اضافه کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از مجموع نهایی باشد.",
    supplierSaved: "تأمین‌کننده با موفقیت اضافه شد.",
    saved: "خریداری با موفقیت ذخیره شد.",
    updated: "خریداری با موفقیت ویرایش شد.",
    editTitle: "ایدیت خریداری",
    editSubtitle: "معلومات این خریداری را با حفظ بل نمبر اصلی ویرایش کنید.",
    nameRequired: "نام تأمین‌کننده را وارد کنید.",
  },
  ps: {
    title: "نوی پېرود",
    subtitle: "د پېرود بل جوړ کړئ او درمل موجودۍ ته اضافه کړئ",
    back: "پېرودونو ته بېرته",
    supplier: "عرضه کوونکی",
    selectSupplier: "عرضه کوونکی وټاکئ",
    quickSupplier: "عرضه کوونکی اضافه کړئ",
    supplierName: "د عرضه کوونکي نوم",
    supplierPlaceholder: "د عرضه کوونکي نوم ولیکئ",
    supplierInfo: "د عرضه کوونکي معلومات",
    supplierInfoEmpty: "د معلوماتو لپاره عرضه کوونکی وټاکئ.",
    contactPerson: "د اړیکې کس",
    phone: "د اړیکې شمېره",
    address: "پته",
    openingBalance: "پیل بیلانس",
    add: "اضافه",
    cancel: "لغوه",
    currency: "اسعار",
    billNumber: "بل نمبر",
    systemBillNumber: "د سیستم بل نمبر",
    date: "د پېرود نېټه (لمریز)",
    paymentStatus: "د ورکړې حالت",
    paidFull: "بشپړ ورکړل شوی",
    debt: "پور",
    paidAmount: "اوس ورکړل شوی مبلغ",
    searchPlaceholder: "درمل د نوم، ګروپ یا کمپنۍ له مخې ولټوئ...",
    searchHint: "د لټون په ساحه کلیک او درمل وټاکئ",
    results: "د لټون پایلې",
    invoiceItems: "د پېرود توکي",
    emptyTitle: "تر اوسه درمل نه دي اضافه شوي",
    emptyText: "له پورته لټون څخه درمل پیدا او دې پېرود ته یې اضافه کړئ.",
    company: "کمپنۍ",
    selectCompany: "کمپنۍ وټاکئ",
    registerCompany: "کمپنۍ ثبت کړئ",
    companyPlaceholder: "د کمپنۍ نوم ولیکئ",
    companySaved: "کمپنۍ ثبت او له همدې درمل سره ونښلول شوه.",
    companyRequired: "د کمپنۍ نوم ولیکئ.",
    qty: "په اصلي واحد مقدار",
    purchaseUnit: "اصلي واحد",
    unitsPerUnit: "په واحد کې دانې",
    actualQty: "په دانه مقدار",
    actualQtyText: "{qty} {unit}",
    unitPrice: "د پېرود بیه",
    salePrice: "د پلور بیه",
    addMedicine: "اضافه",
    expiryDate: "د ختمېدو نېټه (میلادي)",
    total: "ټول",
    stock: "اوسنی موجودي",
    unit: "واحد",
    remove: "حذف",
    itemCount: "د توکو شمېر",
    subtotal: "د توکو مجموعه",
    grandTotal: "وروستی مجموع",
    paid: "ورکړه",
    remaining: "پاتې / پور",
    save: "پېرود ذخیره کړئ",
    requiredSupplier: "مهرباني وکړئ عرضه کوونکی وټاکئ.",
    requiredItems: "لږ تر لږه یو درمل اضافه کړئ.",
    invalidPaid: "ورکړل شوی مبلغ له وروستي مجموع څخه زیات نه شي کېدای.",
    supplierSaved: "عرضه کوونکی په بریالیتوب اضافه شو.",
    saved: "پېرود په بریالیتوب ذخیره شو.",
    updated: "پېرود په بریالیتوب سم شو.",
    editTitle: "د پېرود سمون",
    editSubtitle: "د اصلي بل نمبر په ساتلو سره د پېرود معلومات بدل کړئ.",
    nameRequired: "د عرضه کوونکي نوم ولیکئ.",
  },
};

const englishDigitMap = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};
const toEnglishDigits = (value) => String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => englishDigitMap[digit] || digit);
const cleanNumberInput = (value) => {
  const normalized = toEnglishDigits(value).replace(/[٬,]/g, "").replace(/٫/g, ".");
  const [head, ...tail] = normalized.replace(/[^\d.]/g, "").split(".");
  return tail.length ? `${head}.${tail.join("")}` : head;
};
const num = (value) => Math.max(Number(cleanNumberInput(value) || 0), 0);
const money = (value) => num(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plainAmount = (value) => num(value).toFixed(2);
const positiveUnitCount = (value) => Math.max(Number(value || 1) || 1, 1);
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const createSystemBillNumber = () => `BILL-${String(Date.now()).slice(-6).padStart(6, "0")}`;

function PurchaseNew() {
  const navigate = useNavigate();
  const { purchaseId } = useParams();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [purchases, setPurchases, , purchasesLoaded] = useJsonCollection("purchases");
  const [purchaseItems, setPurchaseItems, , purchaseItemsLoaded] = useJsonCollection("purchaseItems");
  const [suppliers, setSuppliers, , suppliersLoaded] = useJsonCollection("suppliers");
  const [products, setProducts, , productsLoaded] = useJsonCollection("products");
  const [manufacturers] = useJsonCollection("manufacturers");
  const [manufacturerCompanies, setManufacturerCompanies] = useJsonCollection("manufacturerCompanies");
  const [productGroups] = useJsonCollection("productGroups");
  const [stockMovements, setStockMovements, , stockMovementsLoaded] = useJsonCollection("stockMovements");
  const [hydratedEditId, setHydratedEditId] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [supplierInfoOpen, setSupplierInfoOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [billNumber, setBillNumber] = useState("");
  const [systemBillNumber, setSystemBillNumber] = useState(createSystemBillNumber);
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [companyEditorProductId, setCompanyEditorProductId] = useState("");
  const [companyDraft, setCompanyDraft] = useState("");
  const searchInputRef = useRef(null);
  const searchAreaRef = useRef(null);
  const resultButtonRefs = useRef(new Map());
  const quantityInputRefs = useRef(new Map());

  const t = text[language] || text.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const isEditing = Boolean(purchaseId);
  const selectedSupplier = useMemo(
    () => suppliers.find((row) => String(row.id) === String(supplierId)) || null,
    [suppliers, supplierId]
  );
  const supplierBalanceCurrency = (supplier) => String(supplier?.currency || currency || "AFN").toUpperCase();
  const receivedQuantity = (row) => num(row.receivedQuantity ?? (num(row.quantity) * positiveUnitCount(row.unitsPerUnit)));
  const unitLabels = {
    en: { carton: "Carton", box: "Box", pack: "Pack", bottle: "Bottle", strip: "Strip", piece: "Piece", dozen: "Dozen", tube: "Tube", sachet: "Sachet" },
    fa: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "ورق", piece: "دانه", dozen: "درجن", tube: "تیوب", sachet: "پاکت" },
    ps: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "پټه", piece: "دانه", dozen: "درجن", tube: "ټیوب", sachet: "پاکټ" },
  };
  const unitLabel = (unit) => unitLabels[language]?.[String(unit || "piece").toLowerCase()] || unit || "—";
  const productPiecesPerUnit = (product) => positiveUnitCount(
    product?.piecesPerUnit ?? product?.unitsPerUnit ?? product?.quantityPerUnit ?? product?.piecesPerBox ?? product?.cartonSize ?? 1
  );
  const productDisplayName = (product) =>
    product?.productName || product?.name || product?.title || product?.medicineName || "—";
  const manufacturerName = (item) => item?.manufacturerName || item?.companyName || item?.name || "";
  const manufacturerIdForProduct = (product) => {
    const directId = product?.manufacturerId || product?.companyId || "";
    if (directId) return directId;
    const wantedName = String(product?.manufacturerName || product?.companyName || product?.company || "").trim().toLowerCase();
    if (!wantedName) return "";
    const currentMaster = manufacturerCompanies.find((item) => String(item?.name || "").trim().toLowerCase() === wantedName);
    if (currentMaster?.id) return currentMaster.id;
    return manufacturers.find((item) => manufacturerName(item).trim().toLowerCase() === wantedName)?.id || "";
  };
  const getStock = useCallback(
    (product) => Math.max(getProductStock(stockMovements, product?.id, legacyProductStock(product)), 0),
    [stockMovements]
  );

  const companyOptions = useMemo(() => {
    const byName = new Map();
    [...manufacturerCompanies, ...manufacturers].forEach((item) => {
      const name = manufacturerName(item).trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!byName.has(key)) byName.set(key, { ...item, name });
    });
    return Array.from(byName.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [manufacturerCompanies, manufacturers]);

  const linkCompanyToProduct = async (row, company) => {
    if (!company) return;
    const companyName = manufacturerName(company).trim();
    if (!companyName) return;

    updateItemField(row.productId, {
      manufacturerId: company.id || "",
      manufacturerName: companyName,
    });

    const now = new Date().toISOString();
    const nextProducts = products.map((product) =>
      String(product.id) === String(row.productId)
        ? { ...product, manufacturerId: company.id || "", manufacturerName: companyName, companyName, updatedAt: now }
        : product
    );
    await setProducts(nextProducts);
  };
  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ۀ/g, "ه")
      .replace(/ة/g, "ه")
      .replace(/\s+/g, " ")
      .trim();

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
    if (!supplierId) setSupplierInfoOpen(false);
  }, [supplierId]);


  useEffect(() => {
    if (!purchaseId || String(hydratedEditId) === String(purchaseId)) return;

    // Do not hydrate the edit form until every collection used to rebuild the
    // previous invoice has finished loading. Hydrating too early with an empty
    // purchaseItems array was the reason old purchase lines disappeared.
    if (!purchasesLoaded || !purchaseItemsLoaded || !productsLoaded || !stockMovementsLoaded || !suppliersLoaded) return;

    const purchase = purchases.find((row) => String(row.id) === String(purchaseId));
    if (!purchase) return;

    const purchaseKeys = new Set([
      purchaseId,
      purchase.id,
      purchase.billNumber,
      purchase.billNo,
      purchase.invoiceNumber,
      purchase.referenceNumber,
    ].filter(Boolean).map(String));

    const belongsToPurchase = (row) => [
      row?.purchaseId,
      row?.purchase_id,
      row?.referenceId,
      row?.referenceNumber,
      row?.billNumber,
      row?.billNo,
      row?.invoiceNumber,
    ].filter(Boolean).some((value) => purchaseKeys.has(String(value)));

    const storedRows = purchaseItems.filter(belongsToPurchase);
    const embeddedRows = Array.isArray(purchase.items) ? purchase.items : [];
    const movementRows = stockMovements
      .filter((row) => {
        const isPurchaseMovement = !row.referenceType || row.referenceType === "purchase" || row.movementType === "purchase";
        return isPurchaseMovement && belongsToPurchase(row);
      })
      .map((movement, index) => ({
        ...movement,
        id: movement.id || `recovered-${purchaseId}-${index + 1}`,
        purchaseId,
        productId: movement.productId || movement.product_id,
        quantity: num(movement.purchaseQuantity ?? movement.packQuantity ?? (num(movement.quantityIn ?? movement.quantity ?? movement.qty) / positiveUnitCount(movement.unitsPerUnit ?? 1))),
        purchasePrice: num(movement.unitCost ?? movement.purchasePrice ?? movement.buyPrice),
        salePrice: num(movement.salePrice ?? movement.sellPrice),
      }));

    const sourceRows = storedRows.length ? storedRows : (embeddedRows.length ? embeddedRows : movementRows);

    setSupplierId(String(purchase.supplierId || purchase.supplier_id || ""));
    setCurrency(purchase.currency || "AFN");
    setBillNumber(purchase.billNumber || purchase.billNo || purchase.invoiceNumber || "");
    setSystemBillNumber(purchase.systemBillNumber || purchase.systemBillNo || createSystemBillNumber());
    setPurchaseDate(purchase.purchaseDate || purchase.date || String(purchase.createdAt || "").slice(0, 10) || today());
    const hasDebt = num(purchase.remainingAmount || purchase.remaining || 0) > 0 || purchase.paymentStatus === "debt" || purchase.paymentMode === "installment";
    setPaymentStatus(hasDebt ? "debt" : "paid");
    setPaidAmount(cleanNumberInput(purchase.paidAmount ?? purchase.paid ?? ""));

    const restoredItems = sourceRows.map((row, index) => {
      const productId = row.productId || row.product_id || row.idProduct;
      const product = products.find((item) => String(item.id) === String(productId));
      const unitsPerUnit = positiveUnitCount(row.unitsPerUnit ?? row.quantityPerUnit ?? row.piecesPerUnit ?? row.piecesPerBox ?? productPiecesPerUnit(product));
      const packageQuantity = num(row.quantity ?? row.purchaseQuantity ?? row.packQuantity ?? row.qty);
      const pieceQuantity = num(row.receivedQuantity ?? row.totalQuantity ?? row.quantityIn) || (packageQuantity * unitsPerUnit);
      return {
        ...row,
        id: row.id || `purchase-item-${purchaseId}-${index + 1}`,
        productId,
        productName: row.productName || row.name || productDisplayName(product),
        image: row.image || productImageSrc(product),
        group: row.group || groupNameById(productGroups, product?.groupId, product?.group || ""),
        unit: row.unit || product?.productUnit || "piece",
        baseUnit: row.baseUnit || row.stockUnit || "piece",
        purchaseUnit: row.purchaseUnit || row.packageUnit || row.buyUnit || product?.productUnit || product?.purchaseUnit || product?.packageUnit || "piece",
        unitsPerUnit,
        receivedQuantity: pieceQuantity,
        quantity: packageQuantity || (pieceQuantity / unitsPerUnit),
        purchasePrice: num(row.purchasePrice ?? row.unitCost ?? row.buyPrice ?? product?.purchasePrice),
        salePrice: num(row.salePrice ?? row.sellPrice ?? product?.salePrice),
        currentStock: row.currentStock ?? (product ? getStock(product) : 0),
        manufacturerId: row.manufacturerId || row.companyId || manufacturerIdForProduct(product),
        manufacturerName: row.manufacturerName || row.companyName || product?.manufacturerName || product?.companyName || "",
        batchNo: row.batchNo || row.batch || "",
        expiryDate: row.expiryDate || row.expiry || "",
      };
    }).filter((row) => row.productId);

    setItems(restoredItems);
    // Mark hydration complete only after all source collections have loaded and
    // the previous purchase has been reconstructed.
    setHydratedEditId(purchaseId);
  }, [
    purchaseId, hydratedEditId, purchases, purchaseItems, stockMovements, products, productGroups, getStock,
    purchasesLoaded, purchaseItemsLoaded, productsLoaded, stockMovementsLoaded, suppliersLoaded,
  ]);

  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!searchFocused || !q) return [];

    const available = (Array.isArray(products) ? products : [])
      .filter((product) => product && product.status !== "inactive" && product.active !== false)
      .filter((product) => !items.some((row) => String(row.productId) === String(product.id)));

    const scored = available.map((product, originalIndex) => {
      const group = groupNameById(productGroups, product.groupId, product.group || "");
      const fields = [
        productDisplayName(product), group, product.companyName, product.company,
        product.supplierName, product.manufacturerName, product.barcode,
        product.barcodeNumber, product.serial, product.serialNumber, product.sku,
      ].map(normalizeSearchText).filter(Boolean);
      const name = normalizeSearchText(productDisplayName(product));
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (fields.some((value) => value.startsWith(q))) score = 60;
      else if (fields.some((value) => value.includes(q))) score = 40;
      return { product, score, originalIndex };
    });

    const matching = scored
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
    const fallback = scored
      .filter((row) => row.score === 0)
      .sort((a, b) => a.originalIndex - b.originalIndex);

    // Keep the best matches first, but keep the result panel useful by filling
    // it with other available products until at least five choices are visible.
    return [...matching, ...fallback].slice(0, 20).map((row) => row.product);
  }, [products, productGroups, query, searchFocused, items]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    const active = document.querySelector(`.purchase-inline-result[data-result-index="${activeResultIndex}"]`);
    active?.scrollIntoView?.({ block: "nearest" });
  }, [activeResultIndex]);

  const addProduct = (product) => {
    if (!product) return;
    const piecesPerUnit = productPiecesPerUnit(product);
    setItems((current) => {
      if (current.some((row) => String(row.productId) === String(product.id))) return current;
      return [...current, {
        productId: product.id,
        productName: productDisplayName(product),
        image: productImageSrc(product),
        group: groupNameById(productGroups, product.groupId, product.group || ""),
        unit: product.productUnit || "piece",
        baseUnit: "piece",
        purchaseUnit: product.productUnit || product.purchaseUnit || product.packageUnit || "piece",
        unitsPerUnit: piecesPerUnit,
        receivedQuantity: piecesPerUnit,
        quantity: 1,
        purchasePrice: num(product.purchasePrice),
        salePrice: num(product.salePrice),
        currentStock: getStock(product),
        manufacturerId: manufacturerIdForProduct(product),
        manufacturerName: product.manufacturerName || product.companyName || "",
        batchNo: "",
        expiryDate: "",
      }];
    });
    setQuery("");
    setSearchFocused(false);
    setActiveResultIndex(0);
    window.setTimeout(() => quantityInputRefs.current.get(String(product.id))?.focus(), 0);
  };

  const focusSearchResult = (index) => {
    if (!results.length) return;
    const nextIndex = (index + results.length) % results.length;
    setActiveResultIndex(nextIndex);
    resultButtonRefs.current.get(nextIndex)?.focus();
  };

  const moveSearchResult = (index, step) => {
    focusSearchResult(index + step);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Tab" && !event.shiftKey && results.length) {
      event.preventDefault();
      const index = Math.min(activeResultIndex, results.length - 1);
      focusSearchResult(index);
      return;
    }
    if (event.key === "Home" && results.length) {
      event.preventDefault();
      focusSearchResult(0);
      return;
    }
    if (event.key === "End" && results.length) {
      event.preventDefault();
      focusSearchResult(results.length - 1);
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && results.length) {
      event.preventDefault();
      const visualStep = direction === "rtl"
        ? (event.key === "ArrowLeft" ? 1 : -1)
        : (event.key === "ArrowRight" ? 1 : -1);
      moveSearchResult(activeResultIndex, visualStep);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (results.length) addProduct(results[Math.min(activeResultIndex, results.length - 1)]);
      return;
    }
    if (event.key === "Escape") {
      setSearchFocused(false);
    }
  };

  const handleResultKeyDown = (event, product, index) => {
    if (event.key === "Tab") {
      event.preventDefault();
      moveSearchResult(index, event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusSearchResult(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusSearchResult(results.length - 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const visualStep = direction === "rtl"
        ? (event.key === "ArrowLeft" ? 1 : -1)
        : (event.key === "ArrowRight" ? 1 : -1);
      moveSearchResult(index, visualStep);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      addProduct(product);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchFocused(false);
      searchInputRef.current?.focus();
    }
  };

  const handleSearchAreaBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    window.setTimeout(() => setSearchFocused(false), 80);
  };

  const updateItem = (productId, key, value) => {
    setItems((current) => current.map((row) => String(row.productId) === String(productId) ? { ...row, [key]: cleanNumberInput(value) } : row));
  };

  const updateItemField = (productId, fields) => {
    setItems((current) => current.map((row) => String(row.productId) === String(productId) ? { ...row, ...fields } : row));
  };

  const updatePackageQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const quantity = cleanNumberInput(value);
      const receivedQuantityValue = num(quantity) * positiveUnitCount(row.unitsPerUnit);
      return { ...row, quantity, receivedQuantity: receivedQuantityValue };
    }));
  };

  const updatePieceQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const pieces = cleanNumberInput(value);
      const unitsPerUnit = positiveUnitCount(row.unitsPerUnit);
      const packageQuantity = pieces === "" ? "" : Number((num(pieces) / unitsPerUnit).toFixed(4));
      return { ...row, receivedQuantity: pieces, quantity: packageQuantity };
    }));
  };

  const removeItem = (productId) => setItems((current) => current.filter((row) => String(row.productId) !== String(productId)));

  const openCompanyEditor = (row) => {
    setCompanyEditorProductId(String(row.productId));
    setCompanyDraft(row.manufacturerName || "");
  };

  const closeCompanyEditor = () => {
    setCompanyEditorProductId("");
    setCompanyDraft("");
  };

  const saveAndLinkCompany = async (row) => {
    const name = companyDraft.trim().replace(/\s+/g, " ");
    if (!name) return notify(t.companyRequired, "warning");

    const normalizedName = name.toLowerCase();
    let master = manufacturerCompanies.find((item) => String(item?.name || "").trim().toLowerCase() === normalizedName);
    if (!master) {
      master = {
        id: `manufacturer-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = await setManufacturerCompanies([...manufacturerCompanies, master]);
      if (!saved) return;
    }

    updateItemField(row.productId, {
      manufacturerId: master.id,
      manufacturerName: master.name || name,
    });

    const now = new Date().toISOString();
    const nextProducts = products.map((product) =>
      String(product.id) === String(row.productId)
        ? { ...product, manufacturerName: master.name || name, companyName: master.name || name, updatedAt: now }
        : product
    );
    await setProducts(nextProducts);
    closeCompanyEditor();
    notify(t.companySaved, "success", { silent: true });
  };

  const lineTotal = (row) => Math.max(num(row.quantity) * num(row.purchasePrice), 0);
  const subtotal = items.reduce((sum, row) => sum + lineTotal(row), 0);
  const grandTotal = subtotal;
  const paid = paymentStatus === "paid" ? grandTotal : Math.min(num(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentStatus === "paid") setPaidAmount(plainAmount(grandTotal));
  }, [paymentStatus, grandTotal]);

  const addQuickSupplier = async () => {
    const name = quickName.trim();
    if (!name) return notify(t.nameRequired, "warning");
    const id = `SUP-${Date.now()}`;
    const now = new Date().toISOString();
    const supplier = {
      id,
      supplierName: name,
      supplierType: "",
      currency: currency.toLowerCase(),
      contactPerson: "",
      phone: "",
      address: "",
      openingBalance: 0,
      status: "active",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    const saved = await setSuppliers([supplier, ...suppliers]);
    if (!saved) return;
    setSupplierId(id);
    setQuickName("");
    setQuickOpen(false);
    notify(t.supplierSaved, "success", { silent: true });
  };

  const savePurchase = async () => {
    if (!supplierId) return notify(t.requiredSupplier, "warning");
    if (!items.length) return notify(t.requiredItems, "warning");
    if (paymentStatus === "debt" && num(paidAmount) > grandTotal) return notify(t.invalidPaid, "warning");

    const now = new Date().toISOString();
    const existingPurchase = isEditing ? purchases.find((row) => String(row.id) === String(purchaseId)) : null;
    const targetPurchaseId = existingPurchase?.id || `purchase-${Date.now()}`;
    const supplier = suppliers.find((row) => String(row.id) === String(supplierId));
    const finalBillNumber = String(billNumber || "").trim() || existingPurchase?.billNumber || "";
    const finalSystemBillNumber = existingPurchase?.systemBillNumber || existingPurchase?.systemBillNo || systemBillNumber || createSystemBillNumber();
    const purchase = {
      id: targetPurchaseId,
      supplierId,
      supplierName: supplier?.supplierName || "",
      billNumber: finalBillNumber,
      systemBillNumber: finalSystemBillNumber,
      purchaseDate,
      currency,
      paymentMode: paymentStatus === "paid" ? "cash" : "installment",
      paymentStatus,
      paidAmount: paid,
      totalAmount: grandTotal,
      remainingAmount: remaining,
      itemCount: items.length,
      createdAt: existingPurchase?.createdAt || now,
      updatedAt: now,
    };

    const nextPurchases = isEditing ? purchases.map((row) => String(row.id) === String(targetPurchaseId) ? purchase : row) : [purchase, ...purchases];
    if (!(await setPurchases(nextPurchases))) return;

    const detailRows = items.map((row, index) => ({
      ...row,
      id: row.id || `purchase-item-${targetPurchaseId}-${index + 1}`,
      purchaseId: targetPurchaseId,
      lineTotal: lineTotal(row),
      receivedQuantity: receivedQuantity(row),
      baseUnit: row.baseUnit || row.unit || "piece",
      purchaseUnit: row.purchaseUnit || row.unit || "piece",
      unitsPerUnit: positiveUnitCount(row.unitsPerUnit),
      createdAt: now,
      updatedAt: now,
    }));
    const retainedPurchaseItems = purchaseItems.filter((row) => String(row.purchaseId) !== String(targetPurchaseId));
    if (!(await setPurchaseItems([...detailRows, ...retainedPurchaseItems]))) return;

    const movements = items.map((row) => ({
      id: stockMovementId("purchase", targetPurchaseId, row.productId, `line-${row.productId}`),
      productId: row.productId,
      movementType: "purchase",
      referenceType: "purchase",
      referenceId: targetPurchaseId,
      referenceNumber: finalBillNumber,
      quantityIn: receivedQuantity(row),
      quantityOut: 0,
      quantity: receivedQuantity(row),
      purchaseQuantity: num(row.quantity),
      purchaseUnit: row.purchaseUnit || row.unit || "piece",
      baseUnit: row.baseUnit || row.unit || "piece",
      unitsPerUnit: positiveUnitCount(row.unitsPerUnit),
      unitCost: num(row.purchasePrice),
      manufacturerId: row.manufacturerId || "",
      manufacturerName: row.manufacturerName || "",
      batchNo: row.batchNo || "",
      expiryDate: row.expiryDate || "",
      movementDate: purchaseDate,
      createdAt: now,
      updatedAt: now,
    }));
    if (!(await setStockMovements(replaceReferenceMovements(stockMovements, "purchase", targetPurchaseId, movements)))) return;

    const nextProducts = products.map((product) => {
      const row = items.find((item) => String(item.productId) === String(product.id));
      if (!row) return product;
      return {
        ...product,
        purchasePrice: num(row.purchasePrice),
        salePrice: num(row.salePrice || product.salePrice),
        purchaseUnit: row.purchaseUnit || product.purchaseUnit || product.unit || "piece",
        unitsPerUnit: positiveUnitCount(row.unitsPerUnit),
        updatedAt: now,
      };
    });
    await setProducts(nextProducts);

    notify(isEditing ? t.updated : t.saved, "success", { silent: true });
    navigate("/purchasing");
  };

  return (
    <div className="purchase-entry-page sale-entry-page purchase-sale-layout" dir={direction}>
      <header className="purchase-entry-header">
        <div>
          <button className="purchase-back" type="button" onClick={() => navigate("/purchasing")}><ArrowLeft size={16} />{t.back}</button>
          <h1>{isEditing ? t.editTitle : t.title}</h1>
          <p>{isEditing ? t.editSubtitle : t.subtitle}</p>
        </div>
        <button className="purchase-save-top" type="button" onClick={savePurchase}><Check size={17} />{t.save}</button>
      </header>

      <div className="purchase-entry-layout">
        <main className="purchase-entry-main">
          <section className="purchase-items-card">
            <div className="purchase-section-title purchase-section-title-with-meta sale-section-title-with-meta">
              <div className="purchase-section-heading">
                <ShoppingCart size={18} />
                <h2>{t.invoiceItems}</h2>
              </div>

              <div className="purchase-top-meta sale-top-meta">
                <div className="purchase-top-meta-supplier sale-top-meta-customer purchase-top-meta-supplier-as-sale">
                  <label className="purchase-field purchase-top-field">
                    <span className="purchase-supplier-label">
                      <span className="purchase-supplier-label-text"><Truck size={13} />{t.supplier}</span>
                    </span>
                    <div className={`purchase-select-with-add purchase-supplier-control sale-customer-select-wrap ${quickOpen ? "is-quick-entry" : ""} ${supplierId && !quickOpen ? "has-info" : ""}`}>
                      {quickOpen ? (
                        <>
                          <input
                            className="purchase-inline-supplier-input"
                            autoFocus
                            value={quickName}
                            onChange={(e) => setQuickName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addQuickSupplier(); if (e.key === "Escape") { setQuickOpen(false); setQuickName(""); } }}
                            placeholder={t.supplierPlaceholder}
                            aria-label={t.supplierName}
                          />
                          <button className="purchase-inline-supplier-save" type="button" onClick={addQuickSupplier} aria-label={t.add}><Check size={16} /></button>
                          <button className="purchase-inline-supplier-cancel" type="button" onClick={() => { setQuickOpen(false); setQuickName(""); }} aria-label={t.cancel}><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <select
                            value={supplierId}
                            onChange={(e) => {
                              setSupplierId(e.target.value);
                              setSupplierInfoOpen(false);
                            }}
                          >
                            <option value="">{t.selectSupplier}</option>
                            {suppliers.filter((row) => row.status !== "inactive").map((row) => <option value={row.id} key={row.id}>{row.supplierName}</option>)}
                          </select>
                          {supplierId && (
                            <button
                              className={`purchase-supplier-info-toggle ${supplierInfoOpen ? "active" : ""}`}
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                setSupplierInfoOpen((open) => !open);
                              }}
                              aria-label={t.supplierInfo}
                              title={t.supplierInfo}
                            >
                              <Info size={14} />
                            </button>
                          )}
                          <button className="purchase-inline-supplier-add" type="button" onClick={() => { setSupplierInfoOpen(false); setQuickOpen(true); }} aria-label={t.quickSupplier}><Plus size={17} /></button>
                        </>
                      )}
                    </div>
                  </label>

                  {supplierInfoOpen && (
                    <div className="purchase-supplier-info-panel">
                      {selectedSupplier ? (
                        <>
                          <div className="purchase-supplier-info-head">
                            <strong>{selectedSupplier.supplierName || "—"}</strong>
                            <small>{t.supplierInfo}</small>
                          </div>
                          <div className="purchase-supplier-info-grid">
                            <div><span>{t.contactPerson}</span><strong>{selectedSupplier.contactPerson || "—"}</strong></div>
                            <div><span>{t.phone}</span><strong dir="ltr">{selectedSupplier.phone || selectedSupplier.contact || "—"}</strong></div>
                            <div className="purchase-supplier-info-wide"><span>{t.address}</span><strong>{selectedSupplier.address || "—"}</strong></div>
                            <div><span>{t.openingBalance}</span><strong dir="ltr">{money(selectedSupplier.openingBalance || 0)} {supplierBalanceCurrency(selectedSupplier)}</strong></div>
                          </div>
                        </>
                      ) : (
                        <div className="purchase-supplier-info-empty">{t.supplierInfoEmpty}</div>
                      )}
                    </div>
                  )}
                </div>

                <label className="purchase-field purchase-top-field purchase-top-bill">
                  <span>{t.billNumber}</span>
                  <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
                </label>

                <label className="purchase-field purchase-top-field purchase-top-system-bill">
                  <span>{t.systemBillNumber}</span>
                  <input value={systemBillNumber} readOnly dir="ltr" aria-readonly="true" />
                </label>

                <label className="purchase-field purchase-top-field purchase-top-currency">
                  <span>{t.currency}</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                </label>

                <label className="purchase-field purchase-top-field purchase-top-date">
                  <span>{t.date}</span>
                  <ShamsiDateInput value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </label>
              </div>

              <span className="purchase-items-count">{items.length}</span>
            </div>
            <div className="purchase-items-list">
              {items.map((row) => (
                <article className="purchase-item-row purchase-keyboard-row sale-entry-item-row purchase-sale-item-row" key={row.productId}>
                  <div className="purchase-product-card sale-product-info">
                    <img
                      className="purchase-item-image"
                      src={row.image || productImageSrc(products.find((item) => String(item.id) === String(row.productId)))}
                      alt={row.productName || "Product"}
                    />
                    <span className="purchase-item-name purchase-item-product purchase-product-card-copy">
                      <span className="sale-product-title">
                        <strong title={row.productName}>{row.productName}</strong>
                        <small>{row.group || "—"} · {t.purchaseUnit}: {unitLabel(row.purchaseUnit)}</small>
                      </span>
                      <span className="sale-product-meta purchase-product-meta">
                        <span className="sale-meta-badge sale-meta-size"><span>{t.unitsPerUnit}</span><b>{row.unitsPerUnit || 1}</b></span>
                        <span className="sale-meta-badge sale-meta-maker"><span>{t.company}</span><b title={row.manufacturerName || "—"}>{row.manufacturerName || "—"}</b></span>
                      </span>
                    </span>
                  </div>
                  <label className={`purchase-company-field ${String(companyEditorProductId) === String(row.productId) ? "is-editing" : ""}`}>
                    <span>{t.company}</span>
                    {String(companyEditorProductId) === String(row.productId) ? (
                      <div className="purchase-company-inline-editor">
                        <input
                          autoFocus
                          value={companyDraft}
                          onChange={(e) => setCompanyDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); saveAndLinkCompany(row); }
                            if (e.key === "Escape") { e.preventDefault(); closeCompanyEditor(); }
                          }}
                          placeholder={t.companyPlaceholder}
                          aria-label={t.companyPlaceholder}
                        />
                        <button type="button" className="purchase-company-save" onClick={() => saveAndLinkCompany(row)} title={t.registerCompany} aria-label={t.registerCompany}><Check size={12} /></button>
                        <button type="button" className="purchase-company-cancel" onClick={closeCompanyEditor} title={t.cancel} aria-label={t.cancel}><X size={12} /></button>
                      </div>
                    ) : (
                      <div className={`purchase-company-linked-control ${row.manufacturerName ? "has-company" : "needs-company"}`}>
                        <select
                          className={`purchase-company-linked-value ${row.manufacturerName ? "has-value" : "is-empty"}`}
                          value={row.manufacturerId || manufacturerIdForProduct(row) || ""}
                          onChange={(e) => {
                            const selected = companyOptions.find((item) => String(item.id) === String(e.target.value));
                            if (selected) linkCompanyToProduct(row, selected);
                          }}
                          aria-label={t.selectCompany}
                        >
                          <option value="">{t.selectCompany}</option>
                          {companyOptions.map((company) => (
                            <option key={company.id || company.name} value={company.id || ""}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="purchase-company-add"
                          onClick={() => openCompanyEditor(row)}
                          title={t.registerCompany}
                          aria-label={t.registerCompany}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    )}
                  </label>
                  <label>
                    <span>{t.qty} ({unitLabel(row.purchaseUnit)})</span>
                    <input
                      ref={(node) => {
                        const key = String(row.productId);
                        if (node) quantityInputRefs.current.set(key, node);
                        else quantityInputRefs.current.delete(key);
                      }}
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      min="0"
                      step="any"
                      value={row.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updatePackageQuantity(row.productId, e.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t.actualQty}</span>
                    <input
                      className="purchase-piece-quantity"
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      min="0"
                      step="any"
                      value={row.receivedQuantity ?? receivedQuantity(row)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updatePieceQuantity(row.productId, e.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t.unitPrice}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      min="0"
                      step="0.01"
                      value={row.purchasePrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(row.productId, "purchasePrice", e.target.value)}
                    />
                  </label>
                  <div className="purchase-line-total">
                    <span>{t.total}</span>
                    <strong>{money(lineTotal(row))} {currency}</strong>
                  </div>
                  <label className="purchase-expiry-field">
                    <span>{t.expiryDate}</span>
                    <input
                      type="date"
                      dir="ltr"
                      value={row.expiryDate || ""}
                      onChange={(e) => updateItemField(row.productId, { expiryDate: e.target.value })}
                    />
                  </label>
                  <button className="purchase-remove" type="button" title={t.remove} onClick={() => removeItem(row.productId)}><Trash2 size={16} /></button>
                </article>
              ))}

              <div
                className="purchase-inline-search-row"
                ref={searchAreaRef}
                onBlur={handleSearchAreaBlur}
              >
                <div className="purchase-inline-search-box">
                  <Search size={18} />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={t.searchPlaceholder}
                    autoComplete="off"
                  />
                </div>
                {searchFocused && query.trim() && (
                  <div className={`purchase-inline-search-results purchase-product-search-results ${results.length ? "has-results" : "is-empty"}`}>
                    <div className="purchase-search-results-head"><span>{t.results}</span><small>{results.length}</small></div>
                    {results.length ? (
                      <div className="purchase-inline-result-list purchase-product-result-list">
                        {results.map((product, index) => (
                          <button
                            ref={(node) => {
                              if (node) resultButtonRefs.current.set(index, node);
                              else resultButtonRefs.current.delete(index);
                            }}
                            type="button"
                            className={`purchase-inline-result ${index === activeResultIndex ? "active" : ""}`}
                            data-result-index={index}
                            key={product.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onFocus={() => setActiveResultIndex(index)}
                            onMouseEnter={() => setActiveResultIndex(index)}
                            onKeyDown={(event) => handleResultKeyDown(event, product, index)}
                            onClick={() => addProduct(product)}
                          >
                            <img src={productImageSrc(product)} alt="" />
                            <span>
                              <strong>{productDisplayName(product)}</strong>
                              <small>{groupNameById(productGroups, product.groupId, product.group || "—")} · {unitLabel(product.productUnit || "piece")} · 1 = {productPiecesPerUnit(product)} {unitLabel("piece")}</small>
                            </span>
                            <em>{money(product.purchasePrice)} {currency}</em>
                            <b className="purchase-result-check" aria-hidden="true"><Check size={12} /></b>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="purchase-no-result"><PackageSearch size={22} /><span>{productsLoaded ? t.searchHint : "..."}</span></div>
                    )}
                  </div>
                )}
              </div>
              {!items.length && (
                <div className="purchase-items-empty sale-inline-empty">
                  <PackageSearch size={34} />
                  <strong>{t.emptyTitle}</strong>
                  <p>{t.emptyText}</p>
                </div>
              )}
            </div>

          </section>

        </main>

        <aside className="purchase-entry-sidebar sale-bottom-panels">
          <section className="purchase-side-card purchase-summary-card">
            <div className="purchase-side-title"><ShoppingCart size={17} /><strong>{t.grandTotal}</strong></div>
            <div className="purchase-summary-row"><span>{t.itemCount}</span><strong>{items.length.toLocaleString("en-US")}</strong></div>
            <div className="purchase-summary-row"><span>{t.subtotal}</span><strong>{money(subtotal)} {currency}</strong></div>
            <div className="purchase-summary-row purchase-summary-grand"><span>{t.grandTotal}</span><strong>{money(grandTotal)} {currency}</strong></div>
            <div className="purchase-summary-row"><span>{t.paid}</span><strong>{money(paid)} {currency}</strong></div>
            <div className={`purchase-summary-row ${remaining > 0 ? "has-debt" : ""}`}><span>{t.remaining}</span><strong>{money(remaining)} {currency}</strong></div>
          </section>

          <section className="purchase-side-card sale-payment-card purchase-sale-payment-card">
            <div className="purchase-side-title"><WalletCards size={17} /><strong>{t.paymentStatus}</strong></div>
            <div className="purchase-payment-options">
              <button type="button" className={paymentStatus === "paid" ? "active" : ""} onClick={() => setPaymentStatus("paid")}>{t.paidFull}</button>
              <button type="button" className={paymentStatus === "debt" ? "active" : ""} onClick={() => setPaymentStatus("debt")}>{t.debt}</button>
            </div>
            <label className="purchase-field">
              <span>{t.paidAmount}</span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                min="0"
                max={grandTotal}
                step="0.01"
                value={paymentStatus === "debt" ? paidAmount : plainAmount(grandTotal)}
                disabled={paymentStatus !== "debt"}
                onChange={(e) => setPaidAmount(cleanNumberInput(e.target.value))}
              />
            </label>
            <div className="purchase-payment-record"><span>{t.paid}</span><strong>{paymentStatus === "paid" ? t.paidFull : `${money(paid)} ${currency}`}</strong></div>
          </section>

          <button className="purchase-save-mobile" type="button" onClick={savePurchase}><Check size={17} />{t.save}</button>
        </aside>
      </div>
    </div>
  );
}

export default PurchaseNew;
