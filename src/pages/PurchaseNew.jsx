import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
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
    add: "Add",
    cancel: "Cancel",
    currency: "Currency",
    billNumber: "Bill number",
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
    qty: "Quantity by unit",
    purchaseUnit: "Main unit",
    unitsPerUnit: "Pieces in unit",
    actualQty: "Quantity by piece",
    actualQtyText: "{qty} {unit}",
    unitPrice: "Purchase price",
    salePrice: "Sale price",
    addMedicine: "Add",
    total: "Total",
    stock: "Current stock",
    unit: "Unit",
    remove: "Remove",
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
    add: "اضافه",
    cancel: "لغو",
    currency: "واحد پول",
    billNumber: "بل نمبر",
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
    qty: "مقدار به واحد اصلی",
    purchaseUnit: "واحد اصلی",
    unitsPerUnit: "تعداد دانه در واحد",
    actualQty: "مقدار به دانه",
    actualQtyText: "{qty} {unit}",
    unitPrice: "قیمت خرید",
    salePrice: "قیمت فروش",
    addMedicine: "اضافه",
    total: "جمله",
    stock: "موجودی فعلی",
    unit: "واحد",
    remove: "حذف",
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
    add: "اضافه",
    cancel: "لغوه",
    currency: "اسعار",
    billNumber: "بل نمبر",
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
    qty: "په اصلي واحد مقدار",
    purchaseUnit: "اصلي واحد",
    unitsPerUnit: "په واحد کې دانې",
    actualQty: "په دانه مقدار",
    actualQtyText: "{qty} {unit}",
    unitPrice: "د پېرود بیه",
    salePrice: "د پلور بیه",
    addMedicine: "اضافه",
    total: "ټول",
    stock: "اوسنی موجودي",
    unit: "واحد",
    remove: "حذف",
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

const num = (value) => Math.max(Number(value || 0), 0);
const positiveUnitCount = (value) => Math.max(Number(value || 1) || 1, 1);
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function PurchaseNew() {
  const navigate = useNavigate();
  const { purchaseId } = useParams();
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const [purchases, setPurchases, , purchasesLoaded] = useJsonCollection("purchases");
  const [purchaseItems, setPurchaseItems, , purchaseItemsLoaded] = useJsonCollection("purchaseItems");
  const [suppliers, setSuppliers, , suppliersLoaded] = useJsonCollection("suppliers");
  const [products, setProducts, , productsLoaded] = useJsonCollection("products");
  const [productGroups] = useJsonCollection("productGroups");
  const [stockMovements, setStockMovements, , stockMovementsLoaded] = useJsonCollection("stockMovements");
  const [hydratedEditId, setHydratedEditId] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [billNumber, setBillNumber] = useState(() => `PUR-${Date.now().toString().slice(-8)}`);
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [items, setItems] = useState([]);
  const searchInputRef = useRef(null);
  const searchAreaRef = useRef(null);
  const resultButtonRefs = useRef(new Map());
  const quantityInputRefs = useRef(new Map());

  const t = text[language] || text.en;
  const direction = language === "en" ? "ltr" : "rtl";
  const isEditing = Boolean(purchaseId);
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
  const getStock = useCallback(
    (product) => Math.max(getProductStock(stockMovements, product?.id, legacyProductStock(product)), 0),
    [stockMovements]
  );
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
    setBillNumber(purchase.billNumber || purchase.billNo || purchase.invoiceNumber || `PUR-${Date.now().toString().slice(-8)}`);
    setPurchaseDate(purchase.purchaseDate || purchase.date || String(purchase.createdAt || "").slice(0, 10) || today());
    const hasDebt = Number(purchase.remainingAmount || purchase.remaining || 0) > 0 || purchase.paymentStatus === "debt" || purchase.paymentMode === "installment";
    setPaymentStatus(hasDebt ? "debt" : "paid");
    setPaidAmount(String(purchase.paidAmount ?? purchase.paid ?? ""));

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
    setItems((current) => current.map((row) => String(row.productId) === String(productId) ? { ...row, [key]: value } : row));
  };

  const updatePackageQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const quantity = value;
      const receivedQuantityValue = num(value) * positiveUnitCount(row.unitsPerUnit);
      return { ...row, quantity, receivedQuantity: receivedQuantityValue };
    }));
  };

  const updatePieceQuantity = (productId, value) => {
    setItems((current) => current.map((row) => {
      if (String(row.productId) !== String(productId)) return row;
      const pieces = value;
      const unitsPerUnit = positiveUnitCount(row.unitsPerUnit);
      const packageQuantity = value === "" ? "" : Number((num(value) / unitsPerUnit).toFixed(4));
      return { ...row, receivedQuantity: pieces, quantity: packageQuantity };
    }));
  };

  const removeItem = (productId) => setItems((current) => current.filter((row) => String(row.productId) !== String(productId)));
  const lineTotal = (row) => Math.max(num(row.quantity) * num(row.purchasePrice), 0);
  const subtotal = items.reduce((sum, row) => sum + lineTotal(row), 0);
  const grandTotal = subtotal;
  const paid = paymentStatus === "paid" ? grandTotal : Math.min(num(paidAmount), grandTotal);
  const remaining = Math.max(grandTotal - paid, 0);

  useEffect(() => {
    if (paymentStatus === "paid") setPaidAmount(String(grandTotal || ""));
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
    const finalBillNumber = String(billNumber || "").trim() || existingPurchase?.billNumber || `PUR-${Date.now().toString().slice(-8)}`;
    const purchase = {
      id: targetPurchaseId,
      supplierId,
      supplierName: supplier?.supplierName || "",
      billNumber: finalBillNumber,
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
    <div className="purchase-entry-page" dir={direction}>
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
            <div className="purchase-section-title"><ShoppingCart size={18} /><h2>{t.invoiceItems}</h2><span>{items.length}</span></div>
            <div className="purchase-items-list">
              {items.map((row) => (
                <article className="purchase-item-row purchase-keyboard-row" key={row.productId}>
                  <img src={row.image} alt="" />
                  <div className="purchase-item-name">
                    <strong>{row.productName}</strong>
                    <small>{row.group || "—"} · {t.purchaseUnit}: {unitLabel(row.purchaseUnit)}</small>
                  </div>
                  <label>
                    <span>{t.qty} ({unitLabel(row.purchaseUnit)})</span>
                    <input
                      ref={(node) => {
                        const key = String(row.productId);
                        if (node) quantityInputRefs.current.set(key, node);
                        else quantityInputRefs.current.delete(key);
                      }}
                      type="number"
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
                      type="number"
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
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.purchasePrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateItem(row.productId, "purchasePrice", e.target.value)}
                    />
                  </label>
                  <div className="purchase-line-total">
                    <span>{t.total}</span>
                    <strong>{lineTotal(row).toFixed(2)} {currency}</strong>
                  </div>
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
                  <div className="purchase-inline-search-results">
                    <div className="purchase-search-results-head"><span>{t.results}</span><small>{results.length}</small></div>
                    {results.length ? (
                      <div className="purchase-inline-result-list">
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
                            <em>{num(product.purchasePrice).toFixed(2)} {currency}</em>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="purchase-no-result"><PackageSearch size={22} /><span>{productsLoaded ? t.searchHint : "..."}</span></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>

        <aside className="purchase-entry-sidebar">
          <section className="purchase-side-card">
            <div className="purchase-side-title"><Truck size={17} /><strong>{t.supplier}</strong></div>
            <div className={`purchase-select-with-add ${quickOpen ? "is-quick-entry" : ""}`}>
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
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">{t.selectSupplier}</option>
                    {suppliers.filter((row) => row.status !== "inactive").map((row) => <option value={row.id} key={row.id}>{row.supplierName}</option>)}
                  </select>
                  <button className="purchase-inline-supplier-add" type="button" onClick={() => setQuickOpen(true)} aria-label={t.quickSupplier}><Plus size={17} /></button>
                </>
              )}
            </div>
          </section>

          <section className="purchase-side-card purchase-meta-card">
            <div className="purchase-meta-grid">
              <label className="purchase-field purchase-meta-bill"><span>{t.billNumber}</span><input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} /></label>
              <label className="purchase-field purchase-meta-currency"><span>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
              <label className="purchase-field purchase-meta-date"><span>{t.date}</span><ShamsiDateInput value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></label>
            </div>
          </section>

          <section className="purchase-side-card purchase-summary-card">
            <div className="purchase-side-title"><ShoppingCart size={17} /><strong>{t.grandTotal}</strong></div>
            <div className="purchase-summary-row"><span>{t.subtotal}</span><strong>{subtotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row purchase-summary-grand"><span>{t.grandTotal}</span><strong>{grandTotal.toFixed(2)} {currency}</strong></div>
            <div className="purchase-summary-row"><span>{t.paid}</span><strong>{paid.toFixed(2)} {currency}</strong></div>
            <div className={`purchase-summary-row ${remaining > 0 ? "has-debt" : ""}`}><span>{t.remaining}</span><strong>{remaining.toFixed(2)} {currency}</strong></div>
          </section>

          <section className="purchase-side-card">
            <div className="purchase-side-title"><WalletCards size={17} /><strong>{t.paymentStatus}</strong></div>
            <div className="purchase-payment-options">
              <button type="button" className={paymentStatus === "paid" ? "active" : ""} onClick={() => setPaymentStatus("paid")}>{t.paidFull}</button>
              <button type="button" className={paymentStatus === "debt" ? "active" : ""} onClick={() => setPaymentStatus("debt")}>{t.debt}</button>
            </div>
            {paymentStatus === "debt" && <label className="purchase-field"><span>{t.paidAmount}</span><input type="number" min="0" max={grandTotal} step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} /></label>}
            <div className="purchase-payment-record"><span>{t.paid}</span><strong>{paymentStatus === "paid" ? t.paidFull : `${paid.toFixed(2)} ${currency}`}</strong></div>
          </section>

          <button className="purchase-save-mobile" type="button" onClick={savePurchase}><Check size={17} />{t.save}</button>
        </aside>
      </div>
    </div>
  );
}

export default PurchaseNew;
