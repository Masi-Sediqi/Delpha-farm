import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Info,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import ShamsiDateInput from "../components/ShamsiDateInput";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { productImageSrc } from "../utils/productImages";
import { groupNameById } from "../utils/productMasterData";
import {
  allocateProductBatchesFEFO,
  getProductStock,
  legacyProductStock,
  replaceReferenceMovements,
  stockMovementId,
} from "../utils/stock";
import "./PurchaseNew.css";
import "./SaleNew.css";

const languageKey = "afghan-power-language";
const currencies = ["AFN", "USD", "EUR", "INR"];
const num = (value) => Math.max(Number(value || 0), 0);
const positiveUnitCount = (value) => Math.max(Number(value || 1) || 1, 1);
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const text = {
  en: {
    title: "New Sale",
    editTitle: "Edit Sale",
    subtitle: "Create a sale invoice and issue medicines from stock",
    editSubtitle: "Update the previously registered sale without creating a new record.",
    back: "Back to sales",
    customer: "Customer",
    selectCustomer: "Select customer",
    quickCustomer: "Add customer",
    customerName: "Customer name",
    customerPlaceholder: "Enter customer name",
    customerInfo: "Customer information",
    customerInfoEmpty: "Select a customer to view information.",
    phone: "Phone",
    company: "Company / Business",
    address: "Address",
    openingBalance: "Opening balance",
    add: "Add",
    cancel: "Cancel",
    currency: "Currency",
    billNumber: "Bill number",
    date: "Sale date (Solar Hijri)",
    paymentStatus: "Payment status",
    paidFull: "Fully paid",
    debt: "Credit / Debt",
    paidAmount: "Amount paid now",
    searchPlaceholder: "Search medicine by name, group or company...",
    searchHint: "Click the search field and choose a medicine",
    results: "Search results",
    invoiceItems: "Sale items",
    emptyTitle: "No medicine added yet",
    emptyText: "Search above and select medicines to add them to this sale.",
    qty: "Quantity by main unit",
    actualQty: "Quantity by piece",
    salePrice: "Sale price",
    purchasePrice: "Purchase price",
    cartonSize: "Carton / unit size",
    costPrice: "Cost price",
    manufacturer: "Manufacturer",
    expiryDate: "Expiry date",
    addMedicine: "Add",
    total: "Total",
    discount: "Discount",
    totalBeforeDiscount: "Total before discount",
    totalDiscount: "Total discount",
    invalidDiscount: "Discount cannot be greater than the item total.",
    stock: "Current stock",
    unit: "Unit",
    remove: "Remove",
    subtotal: "Subtotal",
    grandTotal: "Grand total",
    paid: "Paid",
    remaining: "Remaining / Debt",
    save: "Save Sale",
    update: "Update Sale",
    requiredCustomer: "Please select a customer.",
    requiredItems: "Please add at least one medicine.",
    invalidPaid: "Paid amount cannot be greater than the payable total.",
    insufficientStock: "Insufficient stock for",
    outOfStock: "Out of stock",
    maxStock: "Maximum available stock",
    customerSaved: "Customer added successfully.",
    saved: "Sale saved successfully.",
    updated: "Sale updated successfully.",
    notFound: "Sale record not found.",
    nameRequired: "Enter customer name.",
  },
  fa: {
    title: "فروش جدید",
    editTitle: "ایدیت فروش",
    subtitle: "ایجاد بل فروش و کسر دواها از موجودی",
    editSubtitle: "معلومات فروش ثبت‌شده را ویرایش کنید؛ ریکارد جدید ساخته نمی‌شود.",
    back: "برگشت به فروشات",
    customer: "مشتری",
    selectCustomer: "مشتری را انتخاب کنید",
    quickCustomer: "افزودن مشتری",
    customerName: "نام مشتری",
    customerPlaceholder: "نام مشتری را وارد کنید",
    customerInfo: "معلومات مشتری",
    customerInfoEmpty: "برای دیدن معلومات، مشتری را انتخاب کنید.",
    phone: "شماره تماس",
    company: "نام شرکت / تجارت",
    address: "آدرس",
    openingBalance: "بیلانس افتتاحیه",
    add: "اضافه",
    cancel: "لغو",
    currency: "واحد پول",
    billNumber: "بل نمبر",
    date: "تاریخ فروش (شمسی)",
    paymentStatus: "وضعیت پرداخت",
    paidFull: "مکمل پرداخت",
    debt: "قرض",
    paidAmount: "مقدار پرداخت فعلی",
    searchPlaceholder: "جستجوی دوا با نام، گروپ یا کمپنی...",
    searchHint: "در جستجو کلیک کنید و دوا را انتخاب نمایید",
    results: "نتایج جستجو",
    invoiceItems: "اقلام فروش",
    emptyTitle: "هنوز دوایی اضافه نشده",
    emptyText: "از جستجوی بالا چندین دوا را پیدا کرده و به این فروش اضافه کنید.",
    qty: "مقدار به واحد اصلی",
    actualQty: "مقدار به دانه",
    salePrice: "قیمت فروش",
    purchasePrice: "قیمت خرید",
    cartonSize: "سایز کارتن / واحد",
    costPrice: "قیمت تمام شد",
    manufacturer: "کمپنی سازنده",
    expiryDate: "تاریخ انقضا",
    addMedicine: "اضافه",
    total: "جمله",
    discount: "تخفیف",
    totalBeforeDiscount: "مجموع قبل از تخفیف",
    totalDiscount: "مجموع تخفیف",
    invalidDiscount: "تخفیف نمی‌تواند بیشتر از مجموع همان جنس باشد.",
    stock: "موجودی فعلی",
    unit: "واحد",
    remove: "حذف",
    subtotal: "جمع اقلام",
    grandTotal: "مجموع نهایی",
    paid: "پرداخت",
    remaining: "باقی / طلب",
    save: "ذخیره فروش",
    update: "ذخیره تغییرات",
    requiredCustomer: "لطفاً مشتری را انتخاب کنید.",
    requiredItems: "حداقل یک دوا را اضافه کنید.",
    invalidPaid: "مقدار پرداخت نمی‌تواند بیشتر از مجموع نهایی باشد.",
    insufficientStock: "موجودی کافی نیست برای",
    outOfStock: "موجودی تمام شده",
    maxStock: "حداکثر موجودی قابل فروش",
    customerSaved: "مشتری با موفقیت اضافه شد.",
    saved: "فروش با موفقیت ذخیره شد.",
    updated: "فروش با موفقیت ویرایش شد.",
    notFound: "ریکارد فروش پیدا نشد.",
    nameRequired: "نام مشتری را وارد کنید.",
  },
  ps: {
    title: "نوی خرڅلاو",
    editTitle: "د خرڅلاو سمون",
    subtitle: "د خرڅلاو بل جوړ کړئ او درمل له موجودۍ څخه وباسئ",
    editSubtitle: "مخکې ثبت شوی خرڅلاو سم کړئ؛ نوی ریکارډ نه جوړېږي.",
    back: "خرڅلاو ته بېرته",
    customer: "پېرودونکی",
    selectCustomer: "پېرودونکی وټاکئ",
    quickCustomer: "پېرودونکی اضافه کړئ",
    customerName: "د پېرودونکي نوم",
    customerPlaceholder: "د پېرودونکي نوم ولیکئ",
    customerInfo: "د پېرودونکي معلومات",
    customerInfoEmpty: "د معلوماتو لپاره پېرودونکی وټاکئ.",
    phone: "د اړیکې شمېره",
    company: "د شرکت / سوداګرۍ نوم",
    address: "پته",
    openingBalance: "افتتاحي بیلانس",
    add: "اضافه",
    cancel: "لغوه",
    currency: "اسعار",
    billNumber: "بل نمبر",
    date: "د خرڅلاو نېټه (لمریز)",
    paymentStatus: "د ورکړې حالت",
    paidFull: "بشپړ ورکړل شوی",
    debt: "پور",
    paidAmount: "اوس ورکړل شوی مبلغ",
    searchPlaceholder: "درمل د نوم، ګروپ یا کمپنۍ له مخې ولټوئ...",
    searchHint: "د لټون په ساحه کلیک او درمل وټاکئ",
    results: "د لټون پایلې",
    invoiceItems: "د خرڅلاو توکي",
    emptyTitle: "تر اوسه درمل نه دي اضافه شوي",
    emptyText: "له پورته لټون څخه څو درمل پیدا او دې خرڅلاو ته یې اضافه کړئ.",
    qty: "په اصلي واحد مقدار",
    actualQty: "په دانه مقدار",
    salePrice: "د پلور بیه",
    purchasePrice: "د پېرود بیه",
    cartonSize: "د کارتن / واحد سایز",
    costPrice: "تمام شوی قیمت",
    manufacturer: "جوړوونکې کمپنی",
    expiryDate: "د ختمېدو نېټه",
    addMedicine: "اضافه",
    total: "ټول",
    discount: "تخفیف",
    totalBeforeDiscount: "له تخفیف مخکې مجموع",
    totalDiscount: "ټول تخفیف",
    invalidDiscount: "تخفیف د هماغه توکي له مجموع څخه زیات نه شي کېدای.",
    stock: "اوسنی موجودي",
    unit: "واحد",
    remove: "حذف",
    subtotal: "د توکو مجموعه",
    grandTotal: "وروستی مجموع",
    paid: "ورکړه",
    remaining: "پاتې / پور",
    save: "خرڅلاو ذخیره کړئ",
    update: "بدلونونه ذخیره کړئ",
    requiredCustomer: "مهرباني وکړئ پېرودونکی وټاکئ.",
    requiredItems: "لږ تر لږه یو درمل اضافه کړئ.",
    invalidPaid: "ورکړل شوی مبلغ له وروستي مجموع څخه زیات نه شي کېدای.",
    insufficientStock: "کافي موجودي نشته د",
    outOfStock: "موجودي ختمه ده",
    maxStock: "د پلور اعظمي موجودي",
    customerSaved: "پېرودونکی په بریالیتوب اضافه شو.",
    saved: "خرڅلاو په بریالیتوب ذخیره شو.",
    updated: "خرڅلاو په بریالیتوب سم شو.",
    notFound: "د خرڅلاو ریکارډ ونه موندل شو.",
    nameRequired: "د پېرودونکي نوم ولیکئ.",
  },
};

function SaleNew() {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const isEditMode = Boolean(saleId);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [sales, setSales] = useJsonCollection("salesRegister");
  const [customers, setCustomers] = useJsonCollection("customerRegistry");
  const [products] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [stockMovements, setStockMovements] = useJsonCollection("stockMovements");

  const [customerId, setCustomerId] = useState("");
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [billNumber, setBillNumber] = useState(() => `SAL-${Date.now().toString().slice(-8)}`);
  const [saleDate, setSaleDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [editInitialized, setEditInitialized] = useState(false);
  const searchInputRef = useRef(null);
  const resultButtonRefs = useRef(new Map());
  const customerSelectRef = useRef(null);
  const packageQuantityInputRefs = useRef(new Map());

  const t = text[language] || text.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const selectedCustomer = useMemo(
    () => customers.find((row) => String(row.id) === String(customerId)) || null,
    [customers, customerId]
  );

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
    if (!customerId) setCustomerInfoOpen(false);
  }, [customerId]);

  const normalizeSearchText = (value) => String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

  const productDisplayName = (product) => product?.productName || product?.name || product?.title || product?.medicineName || "—";
  const unitLabels = {
    en: { carton: "Carton", box: "Box", pack: "Pack", bottle: "Bottle", strip: "Strip", piece: "Piece", dozen: "Dozen", tube: "Tube", sachet: "Sachet" },
    fa: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "ورق", piece: "دانه", dozen: "درجن", tube: "تیوب", sachet: "پاکت" },
    ps: { carton: "کارتن", box: "بکس", pack: "بسته", bottle: "بوتل", strip: "پټه", piece: "دانه", dozen: "درجن", tube: "ټیوب", sachet: "پاکټ" },
  };
  const unitLabel = (unit) => unitLabels[language]?.[String(unit || "piece").toLowerCase()] || unit || "—";
  const productPiecesPerUnit = (product) => positiveUnitCount(
    product?.piecesPerUnit ?? product?.unitsPerUnit ?? product?.quantityPerUnit ?? product?.piecesPerBox ?? product?.cartonSize ?? 1
  );
  const editingSale = isEditMode ? sales.find((row) => String(row.id) === String(saleId)) : null;
  const effectiveStockMovements = useMemo(
    () => (isEditMode && editingSale ? replaceReferenceMovements(stockMovements, "sale", editingSale.id, []) : stockMovements),
    [isEditMode, editingSale, stockMovements]
  );
  const pieceStockMovements = useMemo(
    () => effectiveStockMovements.map((movement) => {
      const isLegacyOpening = movement.referenceType === "opening"
        && movement.stockUnit !== "piece"
        && movement.quantityUnit !== "piece";
      if (!isLegacyOpening) return movement;
      const product = products.find((row) => String(row.id) === String(movement.productId));
      const multiplier = productPiecesPerUnit(product);
      return {
        ...movement,
        quantityIn: num(movement.quantityIn) * multiplier,
        quantityOut: num(movement.quantityOut) * multiplier,
      };
    }),
    [effectiveStockMovements, products]
  );
  const getStock = useCallback(
    (product) => {
      const productId = String(product?.id || "");
      const movements = pieceStockMovements.filter((movement) => String(movement.productId) === productId);
      const unitsPerUnit = productPiecesPerUnit(product);
      if (!movements.length) {
        const fallback = product?.totalPieceQuantity !== undefined && product?.totalPieceQuantity !== null && product?.totalPieceQuantity !== ""
          ? num(product.totalPieceQuantity)
          : num(legacyProductStock(product)) * unitsPerUnit;
        return fallback;
      }
      return Math.max(getProductStock(pieceStockMovements, productId, 0), 0);
    },
    [pieceStockMovements]
  );

  useEffect(() => {
    if (!isEditMode || editInitialized || !editingSale) return;
    setCustomerId(editingSale.customerId || "");
    setCurrency(editingSale.currency || "AFN");
    setBillNumber(editingSale.invoiceNumber || editingSale.billNumber || editingSale.billNo || `SAL-${Date.now().toString().slice(-8)}`);
    setSaleDate(editingSale.saleDate || today());
    const debt = num(editingSale.remainingAmount) > 0 || editingSale.paymentStatus === "debt" || editingSale.paymentMode === "installment";
    setPaymentStatus(debt ? "debt" : "paid");
    setPaidAmount(String(editingSale.paidAmount ?? ""));
    setItems((editingSale.items || []).map((item) => {
      const product = products.find((row) => String(row.id) === String(item.productId));
      const unitsPerUnit = positiveUnitCount(item.unitsPerUnit ?? productPiecesPerUnit(product));
      const pieceQuantity = num(item.quantity);
      return {
        productId: item.productId,
        productName: item.productName || productDisplayName(product),
        image: item.image || productImageSrc(product),
        group: item.group || groupNameById(productGroups, product?.groupId, product?.group || ""),
        unit: item.unit || product?.unit || "piece",
        purchaseUnit: item.purchaseUnit || item.packageUnit || product?.productUnit || product?.purchaseUnit || product?.packageUnit || product?.unit || "piece",
        unitsPerUnit,
        packageQuantity: num(item.packageQuantity ?? item.purchaseQuantity) || (pieceQuantity / unitsPerUnit),
        quantity: pieceQuantity,
        purchasePrice: num(item.purchasePrice ?? product?.purchasePrice),
        cartonSize: item.cartonSize ?? product?.cartonSize ?? unitsPerUnit,
        manufacturerName: item.manufacturerName || item.manufacturerCompany || product?.manufacturerName || product?.companyName || "",
        expiryDate: item.expiryDate || product?.expiryDate || "",
        salePrice: num(item.salePrice ?? product?.salePrice),
        discountAmount: num(item.discountAmount ?? item.discount),
        currentStock: product ? getStock(product) : num(item.quantity),
      };
    }));
    setEditInitialized(true);
  }, [isEditMode, editInitialized, editingSale, products, productGroups, effectiveStockMovements, getStock]);

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
          product.manufacturerName, product.barcode, product.barcodeNumber,
          product.serial, product.serialNumber, product.sku,
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

    return [...matching, ...fallback].slice(0, 20).map((row) => row.product);
  }, [products, productGroups, query, searchFocused, items]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [query, results.length]);

  useEffect(() => {
    const active = document.querySelector(`.sale-inline-result[data-result-index="${activeResultIndex}"]`);
    active?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeResultIndex]);

  const addProduct = (product) => {
    const stock = getStock(product);
    if (stock <= 0) return;
    const unitsPerUnit = productPiecesPerUnit(product);
    const pieceQuantity = Math.min(unitsPerUnit, stock);
    const productKey = String(product.id);
    let shouldFocusQuantity = true;
    setItems((current) => {
      if (current.some((row) => String(row.productId) === productKey)) {
        shouldFocusQuantity = true;
        return current;
      }
      return [...current, {
        productId: product.id,
        productName: productDisplayName(product),
        image: productImageSrc(product),
        group: groupNameById(productGroups, product.groupId, product.group || ""),
        unit: product.unit || "piece",
        purchaseUnit: product.productUnit || product.purchaseUnit || product.packageUnit || product.unit || "piece",
        unitsPerUnit,
        packageQuantity: Number((pieceQuantity / unitsPerUnit).toFixed(4)),
        quantity: pieceQuantity,
        purchasePrice: num(product.purchasePrice),
        cartonSize: product.cartonSize ?? unitsPerUnit,
        manufacturerName: product.manufacturerName || product.companyName || "",
        expiryDate: product.expiryDate || "",
        salePrice: num(product.salePrice),
        discountAmount: 0,
        currentStock: stock,
      }];
    });
    setQuery("");
    setSearchFocused(false);
    setActiveResultIndex(0);
    window.setTimeout(() => {
      if (!shouldFocusQuantity) return;
      const input = packageQuantityInputRefs.current.get(productKey);
      input?.focus();
      input?.select?.();
    }, 0);
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
      focusSearchResult(Math.min(activeResultIndex, results.length - 1));
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && !results.length) {
      event.preventDefault();
      customerSelectRef.current?.focus();
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
    if (event.key === "Escape") setSearchFocused(false);
  };

  const handleResultKeyDown = (event, product, index) => {
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        if (index === 0) searchInputRef.current?.focus();
        else moveSearchResult(index, -1);
      } else if (index === results.length - 1) {
        customerSelectRef.current?.focus();
      } else {
        moveSearchResult(index, 1);
      }
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

  const focusSaleSearch = () => {
    setQuery("");
    setSearchFocused(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleSaleRemoveKeyDown = (event, index) => {
    if (event.key === "Tab" && !event.shiftKey && index === items.length - 1) {
      event.preventDefault();
      focusSaleSearch();
    }
  };

  const updateItem = (productId, key, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      if (key === "quantity") {
        const raw = Number(value);
        if (!Number.isFinite(raw)) return { ...row, quantity: "" };
        const clamped = Math.min(Math.max(raw, 0), num(row.currentStock));
        const nextGross = clamped * num(row.salePrice);
        return { ...row, quantity: clamped, discountAmount: Math.min(num(row.discountAmount), nextGross) };
      }
      if (key === "salePrice") {
        const price = Math.max(Number(value || 0), 0);
        const nextGross = num(row.quantity) * price;
        return { ...row, salePrice: value, discountAmount: Math.min(num(row.discountAmount), nextGross) };
      }
      if (key === "discountAmount") {
        const gross = num(row.quantity) * num(row.salePrice);
        const discount = Math.min(Math.max(Number(value || 0), 0), gross);
        return { ...row, discountAmount: discount };
      }
      return { ...row, [key]: value };
    }));
  };

  const updatePackageQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const unitsPerUnit = positiveUnitCount(row.unitsPerUnit);
      const maxPackages = num(row.currentStock) / unitsPerUnit;
      if (value === "") return { ...row, packageQuantity: "", quantity: "" };
      const raw = Number(value);
      if (!Number.isFinite(raw)) return { ...row, packageQuantity: "", quantity: "" };
      const packageQuantity = Math.min(Math.max(raw, 0), maxPackages);
      const pieceQuantity = Number((packageQuantity * unitsPerUnit).toFixed(4));
      const nextGross = num(pieceQuantity) * num(row.salePrice);
      return { ...row, packageQuantity, quantity: pieceQuantity, discountAmount: Math.min(num(row.discountAmount), nextGross) };
    }));
  };

  const updatePieceQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const raw = Number(value);
      if (!Number.isFinite(raw)) return { ...row, quantity: "", packageQuantity: "" };
      const clamped = Math.min(Math.max(raw, 0), num(row.currentStock));
      const unitsPerUnit = positiveUnitCount(row.unitsPerUnit);
      const nextGross = clamped * num(row.salePrice);
      return {
        ...row,
        quantity: clamped,
        packageQuantity: Number((clamped / unitsPerUnit).toFixed(4)),
        discountAmount: Math.min(num(row.discountAmount), nextGross),
      };
    }));
  };
  const removeItem = (productId) => setItems((current) => current.filter((row) => String(row.productId) !== String(productId)));
  const maxPackageQuantity = (row) => num(row.currentStock) / positiveUnitCount(row.unitsPerUnit);
  const formatQuantity = (value) => {
    const number = num(value);
    return Number.isInteger(number) ? String(number) : number.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  };
  const lineGross = (row) => Math.max(num(row.quantity) * num(row.salePrice), 0);
  const lineDiscount = (row) => Math.min(num(row.discountAmount), lineGross(row));
  const lineTotal = (row) => Math.max(lineGross(row) - lineDiscount(row), 0);
  const subtotal = items.reduce((sum, row) => sum + lineGross(row), 0);
  const totalDiscount = items.reduce((sum, row) => sum + lineDiscount(row), 0);
  const grandTotal = Math.max(subtotal - totalDiscount, 0);
  const paid = paymentStatus === "paid" ? grandTotal : Math.min(num(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentStatus === "paid") setPaidAmount(String(grandTotal || ""));
  }, [paymentStatus, grandTotal]);

  const addQuickCustomer = async () => {
    const name = quickName.trim();
    if (!name) return notify(t.nameRequired, "warning");
    const id = `CUS-${Date.now()}`;
    const now = new Date().toISOString();
    const customer = {
      id,
      fullName: name,
      companyName: "",
      currency,
      phone: "",
      address: "",
      openingBalance: 0,
      status: "active",
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    const saved = await setCustomers([customer, ...customers]);
    if (!saved) return;
    setCustomerId(id);
    setQuickName("");
    setQuickOpen(false);
    notify(t.customerSaved, "success");
  };

  const saveSale = async () => {
    if (isEditMode && !editingSale) return notify(t.notFound, "warning");
    if (!customerId) return notify(t.requiredCustomer, "warning");
    if (!items.length) return notify(t.requiredItems, "warning");
    if (paymentStatus === "debt" && num(paidAmount) > grandTotal) return notify(t.invalidPaid, "warning");

    const allocationByProduct = new Map();
    for (const item of items) {
      if (num(item.discountAmount) > lineGross(item)) {
        return notify(`${t.invalidDiscount} ${item.productName}.`, "warning");
      }
      if (num(item.quantity) <= 0 || num(item.quantity) > num(item.currentStock)) {
        return notify(`${t.insufficientStock} ${item.productName}.`, "warning");
      }
      const allocation = allocateProductBatchesFEFO(pieceStockMovements, item.productId, num(item.quantity));
      if (allocation.unallocated > 0) return notify(`${t.insufficientStock} ${item.productName}.`, "warning");
      allocationByProduct.set(String(item.productId), allocation.allocations);
    }

    const now = new Date().toISOString();
    const recordId = isEditMode ? editingSale.id : `sale-${Date.now()}`;
    const invoiceNumber = String(billNumber || "").trim() || (isEditMode ? (editingSale.invoiceNumber || editingSale.billNumber) : "") || `SAL-${Date.now().toString().slice(-8)}`;
    const customer = customers.find((row) => String(row.id) === String(customerId));
    const sale = {
      id: recordId,
      customerId,
      customerName: customer?.fullName || customer?.companyName || "",
      invoiceNumber,
      saleDate,
      currency,
      paymentMode: paymentStatus === "paid" ? "cash" : "installment",
      paymentStatus,
      subtotalAmount: subtotal,
      discountAmount: totalDiscount,
      totalAmount: grandTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      itemCount: items.length,
      items: items.map((row) => ({
        ...row,
        packageQuantity: num(row.packageQuantity),
        unitsPerUnit: positiveUnitCount(row.unitsPerUnit),
        purchaseUnit: row.purchaseUnit || row.unit || "piece",
        lineGross: lineGross(row),
        discountAmount: lineDiscount(row),
        lineTotal: lineTotal(row),
        batchAllocations: allocationByProduct.get(String(row.productId)) || [],
      })),
      createdAt: isEditMode ? (editingSale?.createdAt || now) : now,
      updatedAt: now,
    };

    const nextSales = isEditMode
      ? sales.map((row) => String(row.id) === String(recordId) ? sale : row)
      : [sale, ...sales];
    if (!(await setSales(nextSales))) return;

    const saleMovements = items.flatMap((row) => {
      const allocations = allocationByProduct.get(String(row.productId)) || [];
      return allocations.map((allocation, index) => ({
        id: stockMovementId("sale", recordId, row.productId, `${allocation.batchNo || "UNBATCHED"}-${index + 1}`),
        productId: row.productId,
        movementType: "sale",
        referenceType: "sale",
        referenceId: recordId,
        referenceNumber: invoiceNumber,
        quantityIn: 0,
        quantityOut: num(allocation.quantity),
        unitPrice: num(row.salePrice),
        batchNo: allocation.batchNo || "UNBATCHED",
        expiryDate: allocation.expiryDate || "",
        movementDate: saleDate,
        createdAt: now,
        updatedAt: now,
      }));
    });

    if (!(await setStockMovements(replaceReferenceMovements(stockMovements, "sale", recordId, saleMovements)))) return;
    notify(isEditMode ? t.updated : t.saved, "success");
    navigate("/sales-register");
  };

  const saleSearchField = (
    <div
      className="purchase-inline-search-row sale-inline-search-row"
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
        <div className={`purchase-inline-search-results sale-inline-search-results ${results.length ? "has-results" : "is-empty"}`}>
          <div className="purchase-search-results-head"><span>{t.results}</span><small>{results.length}</small></div>
          {results.length ? (
            <div className="purchase-inline-result-list sale-inline-result-list">
              {results.map((product, index) => {
                const stock = getStock(product);
                const unavailable = stock <= 0;
                return (
                  <button
                    ref={(node) => {
                      if (node) resultButtonRefs.current.set(index, node);
                      else resultButtonRefs.current.delete(index);
                    }}
                    type="button"
                    className={`purchase-inline-result sale-inline-result sale-search-result ${index === activeResultIndex ? "active" : ""} ${unavailable ? "is-out-of-stock" : ""}`}
                    data-result-index={index}
                    key={product.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onFocus={() => setActiveResultIndex(index)}
                    onMouseEnter={() => setActiveResultIndex(index)}
                    onKeyDown={(event) => handleResultKeyDown(event, product, index)}
                    onClick={() => addProduct(product)}
                    aria-disabled={unavailable}
                  >
                    <img src={productImageSrc(product)} alt="" />
                    <span>
                      <strong>{productDisplayName(product)}</strong>
                      <small>{groupNameById(productGroups, product.groupId, product.group || "—")} · {t.stock}: {stock}</small>
                    </span>
                    <em>{unavailable ? t.outOfStock : `${num(product.salePrice).toFixed(2)} ${currency}`}</em>
                    <b className="sale-result-check" aria-hidden="true"><Check size={13} /></b>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="purchase-no-result"><PackageSearch size={22} /><span>{t.searchHint}</span></div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="purchase-entry-page sale-entry-page" dir={direction}>
      <header className="purchase-entry-header">
        <div>
          <button className="purchase-back" type="button" onClick={() => navigate("/sales-register")}><ArrowLeft size={16} />{t.back}</button>
          <h1>{isEditMode ? t.editTitle : t.title}</h1>
          <p>{isEditMode ? t.editSubtitle : t.subtitle}</p>
        </div>
        <button className="purchase-save-top" type="button" onClick={saveSale}><Check size={17} />{isEditMode ? t.update : t.save}</button>
      </header>

      <div className="purchase-entry-layout">
        <main className="purchase-entry-main">
          <section className="purchase-items-card">
            <div className="purchase-section-title purchase-section-title-with-meta sale-section-title-with-meta">
              <div className="purchase-section-heading">
                <ShoppingBag size={18} />
                <h2>{t.invoiceItems}</h2>
              </div>

              <div className="purchase-top-meta sale-top-meta">
                <div className="purchase-top-meta-supplier sale-top-meta-customer">
                  <label className="purchase-field purchase-top-field">
                    <span><UserRound size={13} />{t.customer}</span>
                    <div className={`purchase-select-with-add sale-customer-select-wrap ${quickOpen ? "is-quick-entry" : ""} ${customerId && !quickOpen ? "has-info" : ""}`}>
                      {quickOpen ? (
                        <>
                          <input
                            className="purchase-inline-supplier-input"
                            autoFocus
                            value={quickName}
                            onChange={(e) => setQuickName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addQuickCustomer(); if (e.key === "Escape") { setQuickOpen(false); setQuickName(""); } }}
                            placeholder={t.customerPlaceholder}
                            aria-label={t.customerName}
                          />
                          <button className="purchase-inline-supplier-save" type="button" onClick={addQuickCustomer} aria-label={t.add}><Check size={16} /></button>
                          <button className="purchase-inline-supplier-cancel" type="button" onClick={() => { setQuickOpen(false); setQuickName(""); }} aria-label={t.cancel}>×</button>
                        </>
                      ) : (
                        <>
                          <select
                            ref={customerSelectRef}
                            value={customerId}
                            onChange={(e) => {
                              setCustomerId(e.target.value);
                              setCustomerInfoOpen(false);
                            }}
                          >
                            <option value="">{t.selectCustomer}</option>
                            {customers.filter((row) => row.status !== "inactive").map((row) => <option value={row.id} key={row.id}>{row.fullName || row.companyName || "—"}</option>)}
                          </select>
                          {customerId && (
                            <button
                              className={`sale-customer-info-toggle ${customerInfoOpen ? "active" : ""}`}
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                setCustomerInfoOpen((open) => !open);
                              }}
                              aria-label={t.customerInfo}
                              title={t.customerInfo}
                            >
                              <Info size={15} />
                            </button>
                          )}
                          <button className="purchase-inline-supplier-add" type="button" onClick={() => setQuickOpen(true)} aria-label={t.quickCustomer}><Plus size={17} /></button>
                        </>
                      )}
                    </div>
                  </label>

                  {customerInfoOpen && selectedCustomer && (
                    <div className="sale-customer-info-panel">
                      <div className="sale-customer-info-head">
                        <div>
                          <strong>{selectedCustomer.fullName || selectedCustomer.companyName || "—"}</strong>
                          <small>{t.customerInfo}</small>
                        </div>
                        <button type="button" onClick={() => setCustomerInfoOpen(false)} aria-label={t.cancel}>×</button>
                      </div>
                      <div className="sale-customer-info-grid">
                        <div><span>{t.phone}</span><strong dir="ltr">{selectedCustomer.phone || selectedCustomer.contact || "—"}</strong></div>
                        <div><span>{t.company}</span><strong>{selectedCustomer.companyName || "—"}</strong></div>
                        <div className="sale-customer-info-wide"><span>{t.address}</span><strong>{selectedCustomer.address || "—"}</strong></div>
                        <div><span>{t.openingBalance}</span><strong dir="ltr">{num(selectedCustomer.openingBalance || 0).toFixed(2)} {String(selectedCustomer.currency || currency || "AFN").toUpperCase()}</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                <label className="purchase-field purchase-top-field purchase-top-bill">
                  <span>{t.billNumber}</span>
                  <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
                </label>

                <label className="purchase-field purchase-top-field purchase-top-currency">
                  <span>{t.currency}</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                </label>

                <label className="purchase-field purchase-top-field purchase-top-date">
                  <span>{t.date}</span>
                  <ShamsiDateInput value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
                </label>
              </div>

              <span className="purchase-items-count">{items.length}</span>
            </div>
            <div className="purchase-items-list">
              {!items.length && saleSearchField}
              {!items.length && (
                <div className="purchase-items-empty sale-inline-empty"><ImageIcon size={34} /><strong>{t.emptyTitle}</strong><p>{t.emptyText}</p></div>
              )}
              {items.map((row, index) => (
                <article className="purchase-item-row sale-entry-item-row" key={row.productId}>
                  <img src={row.image} alt="" />
                  <div className="purchase-item-name sale-product-info">
                    <div className="sale-product-title"><strong>{row.productName}</strong><small>{row.group || "—"} · {t.unit}: {unitLabel(row.purchaseUnit || row.unit)}</small></div>
                    <div className="sale-product-meta">
                      <div className="sale-meta-badge sale-meta-size">
                        <span>{t.cartonSize}</span>
                        <b>{row.cartonSize || row.unitsPerUnit || "—"}</b>
                      </div>
                      <div className="sale-meta-badge sale-meta-cost">
                        <span>{t.costPrice}</span>
                        <b>{num(row.purchasePrice).toFixed(2)} {currency}</b>
                      </div>
                      <div className="sale-meta-badge sale-meta-maker">
                        <span>{t.manufacturer}</span>
                        <b title={row.manufacturerName || "—"}>{row.manufacturerName || "—"}</b>
                      </div>
                      <div className="sale-meta-badge sale-meta-expiry">
                        <span>{t.expiryDate}</span>
                        <b dir="ltr">{row.expiryDate || "—"}</b>
                      </div>
                    </div>
                  </div>
                  <label><span>{t.qty} ({unitLabel(row.purchaseUnit)})</span><input ref={(node) => {
                    const key = String(row.productId);
                    if (node) packageQuantityInputRefs.current.set(key, node);
                    else packageQuantityInputRefs.current.delete(key);
                  }} type="number" min="0" max={maxPackageQuantity(row)} step="any" value={row.packageQuantity} title={`${t.maxStock}: ${formatQuantity(maxPackageQuantity(row))} ${unitLabel(row.purchaseUnit)}`} onFocus={(e) => e.target.select()} onChange={(e) => updatePackageQuantity(row.productId, e.target.value)} /><small className="sale-stock-limit">{t.maxStock}: {formatQuantity(maxPackageQuantity(row))} {unitLabel(row.purchaseUnit)}</small></label>
                  <label><span>{t.actualQty}</span><input type="number" min="0" max={row.currentStock} step="any" value={row.quantity} title={`${t.maxStock}: ${formatQuantity(row.currentStock)} ${unitLabel("piece")}`} onChange={(e) => updatePieceQuantity(row.productId, e.target.value)} /><small className="sale-stock-limit">{t.maxStock}: {formatQuantity(row.currentStock)} {unitLabel("piece")}</small></label>
                  <label><span>{t.salePrice}</span><input type="number" min="0" step="0.01" value={row.salePrice} onChange={(e) => updateItem(row.productId, "salePrice", e.target.value)} /></label>
                  <label><span>{t.discount}</span><input type="number" min="0" max={lineGross(row)} step="0.01" value={row.discountAmount ?? 0} onChange={(e) => updateItem(row.productId, "discountAmount", e.target.value)} /></label>
                  <div className="purchase-line-total"><span>{t.total}</span><strong>{lineTotal(row).toFixed(2)} {currency}</strong></div>
                  <button className="purchase-remove" type="button" title={t.remove} onKeyDown={(event) => handleSaleRemoveKeyDown(event, index)} onClick={() => removeItem(row.productId)}><Trash2 size={16} /></button>
                </article>
              ))}
              {!!items.length && saleSearchField}
            </div>
          </section>
        </main>

        <aside className="purchase-entry-sidebar sale-bottom-panels">
          <section className="purchase-side-card purchase-summary-card">
            <div className="purchase-side-title"><ShoppingBag size={17} /><strong>{t.grandTotal}</strong></div>
            <div className="purchase-summary-row"><span>{t.totalBeforeDiscount}</span><strong>{subtotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row sale-discount-summary"><span>{t.totalDiscount}</span><strong>- {totalDiscount.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row purchase-summary-grand"><span>{t.grandTotal}</span><strong>{grandTotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row"><span>{t.paid}</span><strong>{paid.toFixed(2)} {currency}</strong></div>
            <div className={`purchase-summary-row ${remaining > 0 ? "has-debt" : ""}`}><span>{t.remaining}</span><strong>{remaining.toFixed(2)} {currency}</strong></div>
          </section>

          <section className="purchase-side-card sale-payment-card">
            <div className="purchase-side-title"><WalletCards size={17} /><strong>{t.paymentStatus}</strong></div>
            <div className="purchase-payment-options">
              <button type="button" className={paymentStatus === "paid" ? "active" : ""} onClick={() => setPaymentStatus("paid")}>{t.paidFull}</button>
              <button type="button" className={paymentStatus === "debt" ? "active" : ""} onClick={() => setPaymentStatus("debt")}>{t.debt}</button>
            </div>
            {paymentStatus === "debt" && <label className="purchase-field"><span>{t.paidAmount}</span><input type="number" min="0" max={grandTotal} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>}
            <div className="purchase-payment-record"><span>{t.paid}</span><strong>{paymentStatus === "paid" ? t.paidFull : `${paid.toFixed(2)} ${currency}`}</strong></div>
          </section>

          <button className="purchase-save-mobile" type="button" onClick={saveSale}><Check size={17} />{isEditMode ? t.update : t.save}</button>
        </aside>
      </div>
    </div>
  );
}

export default SaleNew;
