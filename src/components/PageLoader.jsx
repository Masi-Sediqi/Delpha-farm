import { useEffect, useState, useSyncExternalStore } from "react";
import { getInitialLoads, subscribeInitialLoads } from "../hooks/useJsonCollection";
import "./PageLoader.css";

export default function PageLoader() {
  const language = localStorage.getItem("afghan-power-language") || "en";
  const label = language === "fa" ? "لطفاً کمی صبر کنید…" : language === "ps" ? "لږ صبر وکړئ…" : "Please wait…";
  return (
    <div className="page-wait-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="page-wait-card">
        <span className="page-wait-ring" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function PageTransition({ children }) {
  const [mounted, setMounted] = useState(false);
  const [painted, setPainted] = useState(false);
  const pending = useSyncExternalStore(subscribeInitialLoads, getInitialLoads, getInitialLoads);

  // Give the loader a frame to paint before mounting a potentially heavy page.
  useEffect(() => {
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  useEffect(() => {
    if (!mounted || pending) return undefined;
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setPainted(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [mounted, pending]);

  const busy = !painted || pending > 0;
  return (
    <div aria-busy={busy}>
      {mounted && children}
      {busy && <PageLoader />}
    </div>
  );
}
