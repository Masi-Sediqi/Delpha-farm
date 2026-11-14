import { useEffect, useRef } from "react";
import { notify } from "../utils/notify";

// Lock the app shell while a purchase or sale contains unsaved items.
export function useEntryNavigationLock(hasItems) {
  const released = useRef(false);
  const restoreShell = useRef(() => {});

  useEffect(() => {
    released.current = false;
    if (!hasItems) return undefined;
    const shell = [...document.querySelectorAll(".app > .sidebar, .app > .main > .topbar")];
    const previous = shell.map((element) => ({ element, inert: element.inert }));
    shell.forEach((element) => {
      element.inert = true;
      element.classList.add("entry-navigation-locked");
    });
    const restore = () => previous.forEach(({ element, inert }) => {
      element.inert = inert;
      element.classList.remove("entry-navigation-locked");
    });
    restoreShell.current = restore;
    const preventExit = (event) => {
      if (released.current) return;
      if (!event.target.closest("a[href], .purchase-back")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      notify("برای جلوگیری از پاک‌شدن اقلام، ابتدا خریداری یا فروش را ذخیره کنید.", "warning");
    };
    const preventUnload = (event) => {
      if (released.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("click", preventExit, true);
    window.addEventListener("beforeunload", preventUnload);
    return () => {
      restore();
      document.removeEventListener("click", preventExit, true);
      window.removeEventListener("beforeunload", preventUnload);
    };
  }, [hasItems]);

  return () => {
    released.current = true;
    restoreShell.current();
  };
}
