import { useCallback, useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { readBrowserCollection, writeBrowserCollection } from "../utils/browserStorage";

const collectionUpdateEvent = "app-json-collection-updated";
const pollIntervalMs = 15000;
const browserOnly = import.meta.env.VITE_USE_BROWSER_STORAGE !== "false";
const stores = new Map();
const initialLoadListeners = new Set();
let initialLoads = 0;
const publishInitialLoads = () => initialLoadListeners.forEach((listener) => listener());
export const subscribeInitialLoads = (listener) => {
  initialLoadListeners.add(listener);
  return () => initialLoadListeners.delete(listener);
};
export const getInitialLoads = () => initialLoads;

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, {
      items: [], loaded: false, loading: null, subscribers: new Set(),
      pollTimer: null, focusHandler: null, errorShown: false,
      pendingWrites: 0, writeQueue: Promise.resolve(), generation: 0,
    });
  }
  return stores.get(name);
}

function publish(name, items, loaded = true) {
  const store = getStore(name);
  store.items = Array.isArray(items) ? items : [];
  store.loaded = loaded;
  store.subscribers.forEach((subscriber) => subscriber(store.items, store.loaded));
}

async function loadStore(name, { quiet = false } = {}) {
  const store = getStore(name);
  if (store.loading) return store.loading;
  if (store.pendingWrites) return store.items;
  const generation = store.generation;
  const initialLoad = !store.loaded;
  if (initialLoad) {
    initialLoads += 1;
    publishInitialLoads();
  }
  store.loading = readBrowserCollection(name)
    .then((items) => {
      if (generation === store.generation && !store.pendingWrites) {
        if (items !== store.items || !store.loaded) publish(name, items);
      }
      store.errorShown = false;
      return items;
    })
    .catch((error) => {
      console.error(`Unable to load ${name}:`, error);
      if (!store.loaded) publish(name, []);
      if (!quiet && !store.errorShown) {
        store.errorShown = true;
        notify(`Unable to load ${name}. Please check the central server.`, "error");
      }
      return store.items;
    })
    .finally(() => {
      store.loading = null;
      if (initialLoad) {
        initialLoads -= 1;
        publishInitialLoads();
      }
    });
  return store.loading;
}

function startPolling(name) {
  const store = getStore(name);
  if (browserOnly || store.pollTimer) return;
  store.pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) loadStore(name, { quiet: true });
  }, pollIntervalMs);
  store.focusHandler = () => {
    if (document.visibilityState === "visible" && navigator.onLine) loadStore(name, { quiet: true });
  };
  window.addEventListener("focus", store.focusHandler);
}

function stopPolling(name) {
  const store = getStore(name);
  if (store.subscribers.size) return;
  window.clearInterval(store.pollTimer);
  store.pollTimer = null;
  if (store.focusHandler) window.removeEventListener("focus", store.focusHandler);
  store.focusHandler = null;
}

export function useJsonCollection(name) {
  const store = getStore(name);
  const [snapshot, setSnapshot] = useState(() => ({ items: store.items, loaded: store.loaded }));

  useEffect(() => {
    const subscriber = (items, loaded) => setSnapshot((current) =>
      current.items === items && current.loaded === loaded ? current : { items, loaded }
    );
    store.subscribers.add(subscriber);
    subscriber(store.items, store.loaded);
    loadStore(name, { quiet: store.loaded });
    startPolling(name);
    return () => {
      store.subscribers.delete(subscriber);
      stopPolling(name);
    };
  }, [name, store]);

  useEffect(() => {
    const syncCollection = (event) => {
      if (event?.detail?.name === name && !event.detail.internal && Array.isArray(event.detail.items)) publish(name, event.detail.items);
    };
    window.addEventListener(collectionUpdateEvent, syncCollection);
    return () => window.removeEventListener(collectionUpdateEvent, syncCollection);
  }, [name]);

  const load = useCallback(() => loadStore(name), [name]);
  const setItems = useCallback((nextValue) => {
    const currentStore = getStore(name);
    const previousItems = currentStore.items;
    const nextItems = typeof nextValue === "function" ? nextValue(previousItems) : nextValue;
    if (!Array.isArray(nextItems)) {
      notify(`Invalid data format for ${name}.`, "error");
      return Promise.resolve(false);
    }
    currentStore.generation += 1;
    currentStore.pendingWrites += 1;
    publish(name, nextItems);
    const save = async () => {
      try {
        const savedItems = await writeBrowserCollection(name, nextItems);
        // A newer optimistic change must not be overwritten by an older save.
        if (currentStore.items === nextItems) publish(name, savedItems);
        window.dispatchEvent(new CustomEvent(collectionUpdateEvent, { detail: { name, items: savedItems, internal: true } }));
        return true;
      } catch (error) {
        console.error(`Unable to save ${name}:`, error);
        if (currentStore.items === nextItems) publish(name, previousItems);
        notify(`Unable to save ${name}. Please check the server connection or reload after a revision conflict.`, "error");
        return false;
      } finally {
        currentStore.pendingWrites -= 1;
      }
    };
    const result = currentStore.writeQueue.then(save, save);
    currentStore.writeQueue = result.then(() => undefined);
    return result;
  }, [name]);

  return [snapshot.items, setItems, load, snapshot.loaded];
}
