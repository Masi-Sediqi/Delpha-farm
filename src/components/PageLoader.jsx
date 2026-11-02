import { useSyncExternalStore } from "react";
import { getInitialLoads, subscribeInitialLoads } from "../hooks/useJsonCollection";
import "./PageLoader.css";

export default function PageLoader({ onCancel }) {
  const language = localStorage.getItem("afghan-power-language") || "en";
  const cancelLabel = language === "fa" ? "لغو بارگذاری" : language === "ps" ? "پورته کول لغوه کړئ" : "Cancel loading";
  const label = language === "fa" ? "لطفاً کمی صبر کنید…" : language === "ps" ? "لږ صبر وکړئ…" : "Please wait…";
  return (
    <div className="page-wait-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="page-wait-card">
        <span className="page-wait-ring" aria-hidden="true" />
        <span>{label}</span>
        {onCancel && <button type="button" className="page-wait-cancel" onClick={onCancel}>{cancelLabel}</button>}
      </div>
    </div>
  );
}

export function PageTransition({ children }) {
  const pending = useSyncExternalStore(subscribeInitialLoads, getInitialLoads, getInitialLoads);
  const busy = pending > 0;

  // Route content mounts immediately. The global loader is now reserved for
  // collections that are genuinely loading for the first time, instead of
  // forcing a loader on every navigation. Lazy route chunks are still covered
  // by the surrounding Suspense fallback in App.jsx.
  return (
    <div aria-busy={busy}>
      {children}
      {busy && <PageLoader />}
    </div>
  );
}
