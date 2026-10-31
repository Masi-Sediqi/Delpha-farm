import fs from "node:fs/promises";
const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const text = (value) => String(value ?? "").trim();
const legacyId = (kind, value) => `legacy-${kind}-${text(value)}`;
const currencyCode = (value) => ({ 1: "AFN", 2: "PKR", 3: "USD", 4: "EUR", 5: "GBP", 6: "AED", 7: "SAR", 8: "INR" }[number(value)] || "AFN");
const isoDate = (value) => {
  const raw = text(value);
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw.slice(0, 10) : date.toISOString().slice(0, 10);
};
const indexBy = (rows, key) => new Map((rows || []).map((row) => [text(row[key]), row]));
const mergeById = (current, incoming) => {
  const merged = new Map((Array.isArray(current) ? current : []).map((item) => [String(item.id), item]));
  for (const item of incoming) merged.set(String(item.id), { ...(merged.get(String(item.id)) || {}), ...item });
  return [...merged.values()];
};


function mapAccessCollections(data) {
  const now = new Date().toISOString();
  const companies = indexBy(data.ItemCoTbl, "ItmCoID");
  const groups = indexBy(data.ItemGrpTbl, "ItmGrpID");
  const countries = indexBy(data.ItemMadeInTbl, "ItmMdID");
  const accounts = indexBy(data.AcntsLstTbl, "AcID");
  const supplierTypes = indexBy(data.SupTypTbl, "STypID");
  const customerTypes = indexBy(data.CustTypTbl, "CTypID");
  const productsByLegacyId = new Map();

  const manufacturerCompanies = [...companies.values()].filter((row) => number(row.ItmCoID) > 0 && text(row.ItmCoNm) && text(row.ItmCoNm) !== "×").map((row) => ({
    id: legacyId("manufacturer", row.ItmCoID), name: text(row.ItmCoNm), createdAt: now, legacyId: number(row.ItmCoID), importSource: "access",
  }));
  const productGroups = [...groups.values()].filter((row) => number(row.ItmGrpID) > 0 && text(row.ItmGrpNm) && text(row.ItmGrpNm) !== "×").map((row) => ({
    id: legacyId("group", row.ItmGrpID), name: text(row.ItmGrpNm), createdAt: now, legacyId: number(row.ItmGrpID), importSource: "access",
  }));
  const countryRows = [...countries.values()].filter((row) => number(row.ItmMdID) > 0 && text(row.ItmMdNm) && text(row.ItmMdNm) !== "×").map((row) => ({
    id: legacyId("country", row.ItmMdID), name: text(row.ItmMdNm), createdAt: now, legacyId: number(row.ItmMdID), importSource: "access",
  }));
  const products = (data.ItemsTbl || []).filter((row) => number(row.ItmID) > 0 && text(row.ItmNm1) && text(row.ItmNm1) !== "--").map((row) => {
    const currency = currencyCode(row.CurID);
    const purchasePrice = currency === "USD" ? number(row.UCUSD1 || row.UCUSD2) : currency === "AFN" ? number(row.UCAfs1 || row.UCAfs2) : number(row.UCRs1 || row.UCRs2);
    const salePrice = currency === "USD" ? number(row.UPUSD) : currency === "AFN" ? number(row.UPAfs) : number(row.UPRs);
    const item = {
      id: legacyId("product", row.ItmID), productName: text(row.ItmNm1 || row.ItmNm2), productNameEnglish: text(row.ItmNm2),
      manufacturerId: number(row.ItmCoID) > 0 ? legacyId("manufacturer", row.ItmCoID) : "", manufacturerName: text(companies.get(text(row.ItmCoID))?.ItmCoNm || row.medco),
      groupId: number(row.ItmGrpID) > 0 ? legacyId("group", row.ItmGrpID) : "", group: text(groups.get(text(row.ItmGrpID))?.ItmGrpNm || row.ItmGrp),
      countryId: number(row.ItmMdID) > 0 ? legacyId("country", row.ItmMdID) : "", countryName: text(countries.get(text(row.ItmMdID))?.ItmMdNm || row.madin),
      cartonSize: String(Math.max(1, number(row.CrtnSz, 1))), unitsPerUnit: Math.max(1, number(row.CrtnSz, 1)), piecesPerUnit: Math.max(1, number(row.CrtnSz, 1)),
      unit: currency.toLowerCase(), currency, purchasePrice, salePrice, discount: number(row.Prcnt), productForm: text(row.ItmGrp),
      stock: 0, currentStock: 0, quantity: 0, totalPieceQuantity: 0, status: row.Shw === false ? "inactive" : "active",
      createdAt: "", updatedAt: now, legacyId: number(row.ItmID), importSource: "access",
    };
    productsByLegacyId.set(text(row.ItmID), item);
    return item;
  });
  const suppliers = (data.AcntsLstTbl || []).filter((row) => number(row.AcID) > 0 && number(row.AcCtgID) === 1 && text(row.AcNm)).map((row) => ({
    id: legacyId("supplier", row.AcID), supplierName: text(row.AcNm || row.AcNmF), contactPerson: text(row.ContPrsn), phone: text(row.ContNmbr), address: text(row.AcAdd),
    supplierType: text(supplierTypes.get(text(row.STypID))?.STypNm), currency: currencyCode(row.AcCurID).toLowerCase(), openingBalance: number(row.OBA), notes: text(row.Remarks),
    status: row.Dsply === false ? "inactive" : "active", createdAt: isoDate(row.DteM), updatedAt: now, legacyId: number(row.AcID), importSource: "access",
  }));
  const customerCategories = [...customerTypes.values()].filter((row) => number(row.CTypID) > 1 && text(row.CTypNm)).map((row) => ({
    id: legacyId("customer-category", row.CTypID), name: text(row.CTypNm), createdAt: now, legacyId: number(row.CTypID), importSource: "access",
  }));
  const customerRegistry = (data.AcntsLstTbl || []).filter((row) => number(row.AcID) > 0 && number(row.AcCtgID) === 2 && text(row.AcNm)).map((row) => ({
    id: legacyId("customer", row.AcID), fullName: text(row.AcNm || row.AcNmF), companyName: "", phone: text(row.ContNmbr), address: text(row.AcAdd),
    categoryId: number(row.CTypID) > 1 ? legacyId("customer-category", row.CTypID) : "", categoryName: text(customerTypes.get(text(row.CTypID))?.CTypNm),
    currency: currencyCode(row.AcCurID), openingBalance: number(row.OBA), notes: text(row.Remarks), status: row.Dsply === false ? "inactive" : "active",
    createdAt: isoDate(row.DteM), updatedAt: now, legacyId: number(row.AcID), importSource: "access",
  }));

  const purchaseLines = new Map();
  for (const row of data.PurSTbl || []) {
    if (!number(row.CrdNo) || !number(row.ItmID)) continue;
    const key = text(row.CrdNo);
    if (!purchaseLines.has(key)) purchaseLines.set(key, []);
    purchaseLines.get(key).push(row);
  }
  const purchases = [];
  const purchaseItems = [];
  const stockMovements = [];
  for (const row of data.PurMTbl || []) {
    if (!number(row.CrdNo)) continue;
    const purchaseId = legacyId("purchase", row.CrdNo);
    const lines = purchaseLines.get(text(row.CrdNo)) || [];
    const supplier = accounts.get(text(row.AcID));
    const currency = currencyCode(row.PCurID || supplier?.AcCurID);
    const mappedLines = lines.map((line, index) => {
      const product = productsByLegacyId.get(text(line.ItmID));
      const cartonSize = Math.max(1, number(line.CrtnSz || product?.cartonSize, 1));
      const packageQuantity = Math.max(0, number(line.PQtyIn) - number(line.PQtyOut));
      const quantity = packageQuantity * cartonSize;
      const total = number(line.PTtlCst || line.PTtlPrice);
      const purchasePrice = packageQuantity ? total / packageQuantity : number(line.PUntCst1 || line.PUntCst2 || line.PUntPrice || product?.purchasePrice);
      const purchaseDate = isoDate(row.PDteM);
      const item = { id: `${purchaseId}-item-${index + 1}`, purchaseId, productId: legacyId("product", line.ItmID), productName: product?.productName || `#${line.ItmID}`, quantity: packageQuantity, receivedQuantity: quantity, unitsPerUnit: cartonSize, purchaseUnit: "carton", baseUnit: "piece", purchasePrice, lineTotal: total || packageQuantity * purchasePrice, expiryDate: isoDate(line.ExpDteM), batchNo: text(line.StkRcNo), createdAt: purchaseDate, updatedAt: now, legacyId: number(line.SFSN), importSource: "access" };
      stockMovements.push({ id: legacyId("purchase-stock", line.SFSN), productId: item.productId, movementType: "purchase", referenceType: "purchase", referenceId: purchaseId, referenceNumber: text(row.CrdNo), movementDate: purchaseDate, quantityIn: quantity, quantityOut: 0, unitCost: purchasePrice, expiryDate: item.expiryDate, batchNo: item.batchNo, createdAt: purchaseDate, updatedAt: now, importSource: "access" });
      return item;
    });
    purchaseItems.push(...mappedLines);
    const totalAmount = mappedLines.reduce((sum, item) => sum + number(item.lineTotal), 0) || Math.max(number(row.TtlPDr), number(row.TtlPCr));
    const purchaseDate = isoDate(row.PDteM);
    purchases.push({ id: purchaseId, systemBillNumber: `LEG-PUR-${row.CrdNo}`, billNumber: text(row.RefNo || row.CrdNo), supplierId: legacyId("supplier", row.AcID), supplierName: text(supplier?.AcNm || supplier?.AcNmF), currency, purchaseDate, totalAmount, paidAmount: number(row.TtlPCr), remainingAmount: Math.max(0, totalAmount - number(row.TtlPCr)), paymentStatus: number(row.TtlPCr) >= totalAmount ? "paid" : "debt", paymentMode: number(row.TtlPCr) >= totalAmount ? "cash" : "installment", itemCount: mappedLines.length, notes: text(row.Rmrks), createdAt: purchaseDate, updatedAt: now, legacyId: number(row.CrdNo), importSource: "access" });
  }

  const saleLines = new Map();
  for (const row of data.SaleSTbl || []) {
    if (!number(row.InvNo) || !number(row.ItmID)) continue;
    const key = text(row.InvNo);
    if (!saleLines.has(key)) saleLines.set(key, []);
    saleLines.get(key).push(row);
  }
  const salesRegister = (data.SaleMTbl || []).filter((row) => number(row.InvNo1)).map((row) => {
    const saleId = legacyId("sale", row.InvNo1);
    const customer = accounts.get(text(row.AcID));
    const items = (saleLines.get(text(row.InvNo1)) || []).map((line, index) => {
      const product = productsByLegacyId.get(text(line.ItmID));
      const cartonSize = Math.max(1, number(line.CrtnSz || product?.cartonSize, 1));
      const packageQuantity = Math.max(0, number(line.SQtyOut) - number(line.SQtyIn));
      const quantity = packageQuantity * cartonSize;
      const lineTotal = number(line.STtlPrice);
      return { lineId: `${saleId}-line-${index + 1}`, productId: legacyId("product", line.ItmID), productName: product?.productName || `#${line.ItmID}`, productNameEnglish: product?.productNameEnglish || "", packageQuantity, quantity, cartonSize: String(cartonSize), unitsPerUnit: cartonSize, salePrice: packageQuantity ? lineTotal / packageQuantity : number(line.SUntPrc1 || line.SUntPrc2 || product?.salePrice), purchasePrice: number(line.SUntCst1 || product?.purchasePrice), lineTotal, discountPercent: number(line.SDiscPrcnt), discountAmount: number(line.SDiscAmnt), importSource: "access" };
    });
    const totalAmount = number(row.InvTtl) || items.reduce((sum, item) => sum + item.lineTotal, 0);
    const paidAmount = number(row.TtlSCr);
    const saleDate = isoDate(row.SDteM);
    return { id: saleId, systemBillNumber: `LEG-SAL-${row.InvNo1}`, invoiceNumber: text(row.InvNo2 || row.InvNo1), billNumber: text(row.InvNo2 || row.InvNo1), customerId: legacyId("customer", row.AcID), customerName: text(customer?.AcNm || customer?.AcNmF), currency: currencyCode(row.InvCurID || row.SCurID), saleDate, items, itemCount: items.length, subtotalAmount: totalAmount, totalAmount, paidAmount, remainingAmount: Math.max(0, totalAmount - paidAmount), paymentStatus: paidAmount >= totalAmount ? "paid" : "debt", paymentMode: paidAmount >= totalAmount ? "cash" : "installment", notes: text(row.Rmrks), createdAt: saleDate, updatedAt: now, legacyId: number(row.InvNo1), importSource: "access" };
  });
  return { manufacturerCompanies, productGroups, countries: countryRows, products, suppliers, customerCategories, customerRegistry, purchases, purchaseItems, stockMovements, salesRegister };
}

const [,, input, output] = process.argv;
if (!input || !output) { console.error('Usage: node map-access.mjs raw.json converted.json'); process.exit(2); }
const source = JSON.parse(await fs.readFile(input,'utf8'));
const collections = mapAccessCollections(source);
const counts = Object.fromEntries(Object.entries(collections).map(([name, rows]) => [name,rows.length]));
if (!Object.values(counts).some(Boolean)) throw new Error('No recognized Access records.');
const result = {format:'apg-collections-v1', source:'Access conversion', convertedAt:new Date().toISOString(), collections};
await fs.writeFile(output,JSON.stringify(result,null,2),'utf8');
console.log('Converted collections:',JSON.stringify(counts,null,2));
console.log('Saved:',output);
