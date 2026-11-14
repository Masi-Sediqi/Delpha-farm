import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SearchRecordHighlight() {
  const location = useLocation();
  useEffect(() => {
    const target = location.state?.searchTarget;
    if (!target) return undefined;
    let element, timer, expiry;
    const find = () => {
      if (element) return;
      element = [...document.querySelectorAll("[data-search-kind][data-search-id]")]
        .find((node) => node.dataset.searchKind === target.kind && node.dataset.searchId === String(target.id));
      if (!element) return;
      observer.disconnect();
      clearTimeout(expiry);
      element.classList.add("search-record-flash");
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      timer = setTimeout(() => element?.classList.remove("search-record-flash"), 5000);
    };
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    find();
    expiry = setTimeout(() => observer.disconnect(), 30000);
    return () => {
      observer.disconnect(); clearTimeout(timer); clearTimeout(expiry);
      element?.classList.remove("search-record-flash");
    };
  }, [location.key, location.state]);
  return null;
}
