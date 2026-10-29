import "dotenv/config";
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import express from "express";
import cors from "cors";
import pg from "pg";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const { Client, Pool } = pg;
const scrypt = promisify(scryptCallback);
const app = express();
const port = Number(process.env.ISP_API_PORT || 5000);
const host = process.env.ISP_API_HOST || "127.0.0.1";
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

// Same-origin requests only: do not reflect arbitrary CORS origins.
app.disable("x-powered-by");
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

async function runAccessExport(databasePath) {
  if (process.platform !== "win32") throw new Error("Access import requires a Windows server with Microsoft Access Database Engine installed.");
  const candidates = ["System32", "SysWOW64"].map((architecture) =>
    path.join(process.env.WINDIR || "C:\\Windows", architecture, "WindowsPowerShell", "v1.0", "powershell.exe")
  );
  const script = path.join(serverDirectory, "access-export.ps1");
  for (const [index, powershell] of candidates.entries()) {
    try {
      return await new Promise((resolve, reject) => {
        const child = spawn(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-DatabasePath", databasePath], { windowsHide: true });
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
    } catch (error) {
      const providerMissing = /80040154|Class not registered|NoCOMClassIdentified|ENOENT/i.test(error.message);
      if (!providerMissing) throw error;
      if (index === candidates.length - 1) throw new Error("Microsoft Access Database Engine is missing. Install the 32-bit or 64-bit Access Runtime on the Windows server.");
    }
  }
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
  await pool.query(`CREATE TABLE IF NOT EXISTS delpha_users (
    id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Admin',
    status TEXT NOT NULL DEFAULT 'Active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS delpha_sessions (
    id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES delpha_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS delpha_sessions_expiry_idx ON delpha_sessions(expires_at)`);
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


// Delpha server-side authentication. Session tokens never enter JavaScript.
const sessionCookie = "delpha_session";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const passwordHash = async (password, salt = randomBytes(16).toString("hex")) => {
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
};
const verifyPassword = async (password, stored) => {
  if (typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, expectedHex] = stored.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(expectedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
};
const cookieValue = (request) => {
  const cookies = String(request.headers.cookie || "").split(";");
  const entry = cookies.find((part) => part.trim().startsWith(`${sessionCookie}=`));
  return entry ? entry.trim().slice(sessionCookie.length + 1) : "";
};
const clearSessionCookie = (response) => response.setHeader("Set-Cookie", `${sessionCookie}=; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=0`);
const safeUser = (row) => ({ id: String(row.id), email: row.email, fullName: row.full_name, role: row.role, status: row.status });
const isSafeOrigin = (request) => {
  const origin = request.headers.origin;
  if (!origin) return true; // Non-browser clients must still authenticate.
  try {
    const parsed = new URL(origin);
    const host = request.get("host");
    return parsed.protocol === "https:" && parsed.host === host;
  } catch { return false; }
};
app.use("/api", (request, response, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !isSafeOrigin(request)) {
    return response.status(403).json({ error: "Invalid request origin." });
  }
  next();
});
const loginAttempts = new Map();
app.use("/api/auth/login", (request, response, next) => {
  const key = request.ip;
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (entry && now - entry.since < 15 * 60_000 && entry.count >= 10) {
    return response.status(429).json({ error: "Too many login attempts. Try later." });
  }
  if (!entry || now - entry.since >= 15 * 60_000) loginAttempts.set(key, { since: now, count: 1 });
  else entry.count += 1;
  next();
});
app.post("/api/auth/login", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    if (!email || !password || password.length > 1024) return response.status(400).json({ error: "Invalid credentials." });
    const found = await pool.query("SELECT * FROM delpha_users WHERE email=$1 AND status='Active'", [email]);
    const account = found.rows[0];
    if (!account || !(await verifyPassword(password, account.password_hash))) {
      return response.status(401).json({ error: "Invalid credentials." });
    }
    const token = randomBytes(32).toString("hex");
    await pool.query("INSERT INTO delpha_sessions(user_id, token_hash, expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')", [account.id, sha256(token)]);
    response.setHeader("Set-Cookie", `${sessionCookie}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=604800`);
    loginAttempts.delete(request.ip);
    response.json({ user: safeUser(account) });
  } catch (error) { next(error); }
});
async function requireSession(request, response, next) {
  try {
    const token = cookieValue(request);
    if (!/^[a-f0-9]{64}$/.test(token)) return response.status(401).json({ error: "Authentication required." });
    const found = await pool.query(`SELECT u.id, u.email, u.full_name, u.role, u.status
      FROM delpha_sessions s JOIN delpha_users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.status='Active'`, [sha256(token)]);
    if (!found.rows.length) return response.status(401).json({ error: "Session expired." });
    request.authUser = safeUser(found.rows[0]);
    next();
  } catch (error) { next(error); }
}
app.get("/api/auth/me", requireSession, (request, response) => response.json({ user: request.authUser }));
app.post("/api/auth/logout", requireSession, async (request, response, next) => {
  try {
    await pool.query("DELETE FROM delpha_sessions WHERE token_hash=$1", [sha256(cookieValue(request))]);
    clearSessionCookie(response);
    response.json({ ok: true });
  } catch(error) { next(error); }
});
// No collections or imports are accessible without an authenticated server session.
app.use("/api/collections", requireSession, (request, response, next) => {
  if (request.authUser.role !== "Admin") return response.status(403).json({ error: "Admin access required." });
  // Legacy account objects may contain cleartext passwords. Never expose or accept them.
  if (request.path === "/accounts") return response.status(403).json({ error: "Legacy accounts disabled. Use server authentication." });
  next();
});
app.use("/api/import", requireSession, (_request, response) => response.status(403).json({ error: "Legacy import disabled." }));

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
    // Optimistic concurrency: write only when the client's last-read revision matches.
    const match = String(request.get("If-Match") || "").match(/^"(\d+)"$/);
    if (!match) return response.status(428).json({ error: "If-Match revision is required." });
    const revision = Number(match[1]);
    if (!Number.isSafeInteger(revision) || revision < 0) return response.status(400).json({ error: "Invalid revision." });
    const result = await pool.query(
      `INSERT INTO app_collections (name, items, revision)
       SELECT $1, $2::jsonb, 1 WHERE $3::bigint = 0
       ON CONFLICT (name) DO UPDATE SET
         items = EXCLUDED.items,
         revision = app_collections.revision + 1,
         updated_at = NOW()
       WHERE app_collections.revision = $3::bigint
       RETURNING name, items, revision, updated_at AS "updatedAt"`,
      [request.params.name, JSON.stringify(request.body.items), revision]
    );
    if (!result.rowCount) return response.status(409).json({ error: "Collection changed on the server. Reload before saving." });
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
    if (request.query.convert === "true") {
      return response.json({ ok: true, source: originalName, collections: incoming,
        report: Object.fromEntries(Object.entries(incoming).map(([name, items]) => [name, { imported: items.length }])) });
    }
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
