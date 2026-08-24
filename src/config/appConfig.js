const rawMode = String(import.meta.env.VITE_APP_MODE || "demo").toLowerCase();

export const APP_MODE = rawMode === "production" ? "production" : "demo";
export const IS_DEMO = APP_MODE === "demo";
export const IS_PRODUCTION = APP_MODE === "production";

export const DATA_NAMESPACE = IS_PRODUCTION ? "production" : "demo";

export function environmentStorageKey(baseKey) {
  return IS_PRODUCTION ? `${baseKey}-production` : baseKey;
}

export const appEnvironment = {
  mode: APP_MODE,
  isDemo: IS_DEMO,
  isProduction: IS_PRODUCTION,
  dataNamespace: DATA_NAMESPACE,
};
