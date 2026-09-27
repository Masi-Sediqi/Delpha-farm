import { useCallback, useEffect, useState } from "react";
import { notify } from "../utils/notify";
import { readBrowserCollection, writeBrowserCollection } from "../utils/browserStorage";

const collectionUpdateEvent = "app-json-collection-updated";
const pollIntervalMs = 15000;
const stores = new Map();

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, {
      items: [], loaded: false, loading: null, subscribers: new Set(),
      pollTimer: null, focusHandler: null, errorShown: false,
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
  store.loading = readBrowserCollection(name)
    .then((items) => {
      if (items !== store.items) publish(name, items);
      else if (!store.loaded) publish(name, items);
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
    .finally(() => { store.loading = null; });
  return store.loading;
}

function startPolling(name) {
  const store = getStore(name);
  if (store.pollTimer) return;
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
      if (event?.detail?.name === name && Array.isArray(event.detail.items)) publish(name, event.detail.items);
    };
    window.addEventListener(collectionUpdateEvent, syncCollection);
    return () => window.removeEventListener(collectionUpdateEvent, syncCollection);
  }, [name]);

  const load = useCallback(() => loadStore(name), [name]);
  const setItems = useCallback(async (nextValue) => {
    const currentStore = getStore(name);
    const previousItems = currentStore.items;
    const nextItems = typeof nextValue === "function" ? nextValue(previousItems) : nextValue;
    if (!Array.isArray(nextItems)) {
      notify(`Invalid data format for ${name}.`, "error");
      return false;
    }
    publish(name, nextItems);
    try {
      const savedItems = await writeBrowserCollection(name, nextItems);
      publish(name, savedItems);
      window.dispatchEvent(new CustomEvent(collectionUpdateEvent, { detail: { name, items: savedItems } }));
      return true;
    } catch (error) {
      console.error(`Unable to save ${name}:`, error);
      publish(name, previousItems);
      notify(`Unable to save ${name}. Please check the central server.`, "error");
      return false;
    }
  }, [name]);

  return [snapshot.items, setItems, load, snapshot.loaded];
}
