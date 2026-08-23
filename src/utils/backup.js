import {
  listBrowserCollectionNames,
  readBrowserCollection,
} from "./browserStorage";

export async function loadBackupCollectionNames() {
  return listBrowserCollectionNames();
}

export async function buildBackupPayload() {
  const collections = await loadBackupCollectionNames();
  const entries = await Promise.all(
    collections.map(async (name) => {
      return [name, await readBrowserCollection(name)];
    })
  );

  return {
    app: "ISP Assets",
    exportedAt: new Date().toISOString(),
    collections: Object.fromEntries(entries),
  };
}

export async function downloadBackup(reason = "manual") {
  const payload = await buildBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  link.href = url;
  link.download = `isp-data-${reason}-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return payload;
}
