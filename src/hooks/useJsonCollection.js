import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "../utils/notify";
import {
  readBrowserCollection,
  writeBrowserCollection,
} from "../utils/browserStorage";

export function useJsonCollection(name) {
  const [items, setItemsState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const itemsRef = useRef([]);

  const load = useCallback(async () => {
    try {
      const data = await readBrowserCollection(name);

      itemsRef.current = data;
      setItemsState(data);
      setLoaded(true);

      return data;
    } catch (error) {
      console.error(`Unable to load ${name}:`, error);
      itemsRef.current = [];
      setItemsState([]);
      setLoaded(true);
      notify(`Unable to load ${name}. Please check browser storage.`, "error");
      return [];
    }
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  const setItems = useCallback(
    async (nextValue) => {
      const previousItems = itemsRef.current;

      const nextItems =
        typeof nextValue === "function" ? nextValue(previousItems) : nextValue;

      if (!Array.isArray(nextItems)) {
        notify(`Invalid data format for ${name}.`, "error");
        return false;
      }

      itemsRef.current = nextItems;
      setItemsState(nextItems);

      try {
        const savedData = await writeBrowserCollection(name, nextItems);

        itemsRef.current = savedData;
        setItemsState(savedData);

        return true;
      } catch (error) {
        console.error(`Unable to save ${name}:`, error);

        itemsRef.current = previousItems;
        setItemsState(previousItems);

        notify(`Unable to save ${name}. Please check browser storage.`, "error");
        return false;
      }
    },
    [name]
  );

  return [items, setItems, load, loaded];
}
