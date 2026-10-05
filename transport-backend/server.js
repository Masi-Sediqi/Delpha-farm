import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const { Client, Pool } = pg;
const app = express();
const port = Number(process.env.ISP_API_PORT || 5000);
const host = process.env.ISP_API_HOST || "0.0.0.0";
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const localStorageMode = String(process.env.ISP_STORAGE || "postgresql").toLowerCase() === "file";
const localDataDirectory = path.join(serverDirectory, "data");
const localStorePath = path.join(localDataDirectory, "local-storage.json");
let localState = { collections: {}, backups: [] };
let localSaveQueue = Promise.resolve();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "apg_medicine",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  max: 10,
});

app.use(cors({ origin: true }));
app.use("/api/import/access", express.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use(express.json({ limit: "50mb" }));

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

async function saveLocalState() {
  const snapshot = JSON.stringify(localState);
  localSaveQueue = localSaveQueue.then(async () => {
    await fs.mkdir(localDataDirectory, { recursive: true });
    const temporaryPath = `${localStorePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporaryPath, snapshot, "utf8");
    await fs.rename(temporaryPath, localStorePath);
  });
  return localSaveQueue;
}

async function loadLocalState() {
  await fs.mkdir(localDataDirectory, { recursive: true });
  try {
    const parsed = JSON.parse(await fs.readFile(localStorePath, "utf8"));
    localState = {
      collections: parsed && typeof parsed.collections === "object" ? parsed.collections : {},
      backups: Array.isArray(parsed?.backups) ? parsed.backups : [],
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await saveLocalState();
  }
}

function runAccessExport(databasePath) {
  const powershell = process.env.WINDIR
    ? path.join(process.env.WINDIR, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";
  const script = path.join(serverDirectory, "access-export.ps1");
  return new Promise((resolve, reject) => {
    const child = spawn(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-DatabasePath", databasePath], {
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || "Unable to read the Access database."));
      try { resolve(JSON.parse(stdout.replace(/^\uFEFF/, ""))); }
      catch { reject(new Error("Access returned invalid data.")); }
    });
  });
}

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

async function initializeDatabase() {
  if (localStorageMode) {
    await loadLocalState();
    return;
  }
  const database = process.env.PGDATABASE || "apg_medicine";
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Invalid PostgreSQL database name.");
  const admin = new Client({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: "postgres",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD,
  });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (!exists.rowCount) await admin.query(`CREATE DATABASE "${database}"`);
  await admin.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_collections (
      name TEXT PRIMARY KEY,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      revision BIGINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_import_backups (
      id BIGSERIAL PRIMARY KEY,
      source_name TEXT NOT NULL,
      collections JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get("/api/health", async (_request, response) => {
  if (localStorageMode) {
    return response.json({ ok: true, storage: "local-file", database: localStorePath });
  }
  try {
    const result = await pool.query("SELECT current_database() AS database, NOW() AS time");
    response.json({ ok: true, storage: "postgresql", ...result.rows[0] });
  } catch (error) {
    response.status(503).json({ ok: false, error: "Database connection failed." });
  }
});

app.get("/api/collections", async (_request, response, next) => {
  if (localStorageMode) {
    const collections = Object.entries(localState.collections)
      .map(([name, record]) => ({ name, revision: String(record.revision || 1), updatedAt: record.updatedAt }))
      .sort((left, right) => left.name.localeCompare(right.name));
    return response.json(collections);
  }
  try {
    const result = await pool.query("SELECT name, revision, updated_at AS \"updatedAt\" FROM app_collections ORDER BY name");
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/collections/:name", async (request, response, next) => {
  if (localStorageMode) {
    const record = localState.collections[request.params.name];
    if (!record) return response.status(404).json({ error: "Collection not found." });
    const revision = String(record.revision || 1);
    response.set("ETag", `"${revision}"`);
    if (request.get("If-None-Match") === `"${revision}"`) return response.status(304).end();
    return response.json({ name: request.params.name, items: record.items, revision, updatedAt: record.updatedAt });
  }
  try {
    const result = await pool.query(
      "SELECT name, items, revision, updated_at AS \"updatedAt\" FROM app_collections WHERE name = $1",
      [request.params.name]
    );
    if (!result.rowCount) return response.status(404).json({ error: "Collection not found." });
    const revision = String(result.rows[0].revision);
    response.set("ETag", `"${revision}"`);
    if (request.get("If-None-Match") === `"${revision}"`) return response.status(304).end();
    response.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/collections/:name", async (request, response, next) => {
  try {
    if (!Array.isArray(request.body?.items)) {
      return response.status(400).json({ error: "items must be an array." });
    }
    if (localStorageMode) {
      const name = request.params.name;
      const previous = localState.collections[name];
      const record = {
        items: request.body.items,
        revision: Number(previous?.revision || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      localState.collections[name] = record;
      await saveLocalState();
      return response.json({ name, ...record, revision: String(record.revision) });
    }
    const result = await pool.query(
      `INSERT INTO app_collections (name, items)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (name) DO UPDATE SET
         items = EXCLUDED.items,
         revision = app_collections.revision + 1,
         updated_at = NOW()
       RETURNING name, items, revision, updated_at AS "updatedAt"`,
      [request.params.name, JSON.stringify(request.body.items)]
    );
    response.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/import/access", async (request, response, next) => {
  let originalName = text(request.headers["x-file-name"] || "legacy.accde");
  try { originalName = decodeURIComponent(originalName); } catch { /* Keep the transmitted name. */ }
  const extension = path.extname(originalName).toLowerCase();
  if (![".accdb", ".accde"].includes(extension)) {
    return response.status(400).json({ error: "Please select an ACCDB or ACCDE file." });
  }
  if (!Buffer.isBuffer(request.body) || !request.body.length) {
    return response.status(400).json({ error: "The Access file is empty." });
  }

  const temporaryPath = path.join(os.tmpdir(), `apg-access-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  try {
    await fs.writeFile(temporaryPath, request.body);
    const raw = await runAccessExport(temporaryPath);
    const incoming = mapAccessCollections(raw);
    if (request.query.preview === "true") {
      return response.json({
        ok: true,
        preview: true,
        source: originalName,
        report: Object.fromEntries(Object.entries(incoming).map(([name, items]) => [name, { imported: items.length }])),
      });
    }
    if (localStorageMode) {
      const current = localState.collections;
      localState.backups.push({
        sourceName: originalName,
        collections: Object.fromEntries(Object.entries(current).map(([name, record]) => [name, record.items])),
        createdAt: new Date().toISOString(),
      });
      const report = {};
      for (const [name, items] of Object.entries(incoming)) {
        const previous = current[name];
        const merged = mergeById(previous?.items, items);
        current[name] = {
          items: merged,
          revision: Number(previous?.revision || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        report[name] = { imported: items.length, total: merged.length };
      }
      await saveLocalState();
      return response.json({ ok: true, storage: "local-file", source: originalName, report });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const currentResult = await client.query("SELECT name, items FROM app_collections");
      const current = Object.fromEntries(currentResult.rows.map((row) => [row.name, row.items]));
      await client.query(
        "INSERT INTO app_import_backups (source_name, collections) VALUES ($1, $2::jsonb)",
        [originalName, JSON.stringify(current)]
      );
      const report = {};
      for (const [name, items] of Object.entries(incoming)) {
        const merged = mergeById(current[name], items);
        await client.query(
          `INSERT INTO app_collections (name, items)
           VALUES ($1, $2::jsonb)
           ON CONFLICT (name) DO UPDATE SET items = EXCLUDED.items, revision = app_collections.revision + 1, updated_at = NOW()`,
          [name, JSON.stringify(merged)]
        );
        report[name] = { imported: items.length, total: merged.length };
      }
      await client.query("COMMIT");
      response.json({ ok: true, source: originalName, report });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  } finally {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
  }
});

app.use((error, _request, response, _next) => {
  console.error("[API]", error);
  response.status(500).json({ error: "Internal server error." });
});

initializeDatabase()
  .then(() => app.listen(port, host, () => {
    const storageLabel = localStorageMode ? "local file" : "PostgreSQL";
    console.log(`[API] ${storageLabel} API listening on http://${host}:${port}`);
  }))
  .catch((error) => {
    console.error("[API] Unable to initialize PostgreSQL:", error.message);
    process.exit(1);
  });

async function shutdown() {
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
