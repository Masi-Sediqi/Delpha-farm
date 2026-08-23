import fs from "fs/promises";
import path from "path";
import express from "express";
import cors from "cors";

const host = process.env.ISP_API_HOST || "127.0.0.1";
const port = Number(process.env.ISP_API_PORT || 5000);
const dataDirectory = process.env.ISP_DATA_DIR || "C:/ISP";
const collectionPattern = /^[a-zA-Z0-9_-]+$/;

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

async function ensureDataDirectory() {
  await fs.mkdir(dataDirectory, { recursive: true });
}

function getCollectionPath(collection) {
  if (!collectionPattern.test(collection)) {
    const error = new Error("Invalid collection name.");
    error.status = 400;
    throw error;
  }

  return path.join(dataDirectory, `${collection}.json`);
}

async function readCollection(collection) {
  const filePath = getCollectionPath(collection);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeCollection(collection, []);
      return [];
    }

    if (error instanceof SyntaxError) {
      return [];
    }

    throw error;
  }
}

async function writeCollection(collection, data) {
  if (!Array.isArray(data)) {
    const error = new Error("Collection payload must be an array.");
    error.status = 400;
    throw error;
  }

  await ensureDataDirectory();
  const filePath = getCollectionPath(collection);
  const temporaryPath = `${filePath}.tmp`;
  const content = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(temporaryPath, content, "utf8");
  await fs.rename(temporaryPath, filePath);
}

app.get("/api/health", async (_request, response, next) => {
  try {
    await ensureDataDirectory();
    response.json({
      ready: true,
      app: "ISP Asset & Inventory Management",
      dataDirectory,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/:collection", async (request, response, next) => {
  try {
    response.json(await readCollection(request.params.collection));
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection", async (request, response, next) => {
  try {
    await writeCollection(request.params.collection, request.body);
    response.json(request.body);
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({
    error: status === 500 ? "Internal server error." : error.message,
  });
});

ensureDataDirectory()
  .then(() => {
    app.listen(port, host, () => {
      console.log(
        `ISP server running on http://${host}:${port}; data directory: ${dataDirectory}`
      );
    });
  })
  .catch((error) => {
    console.error("Unable to start ISP server:", error);
    process.exit(1);
  });
