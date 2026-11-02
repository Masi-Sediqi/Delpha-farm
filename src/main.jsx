// Apply saved display preferences before first React paint.
try {
  const selectedFont = localStorage.getItem('delpha-ui-font') || 'system';
  const families = {system:'inherit',tahoma:'Tahoma, Arial, sans-serif',segoe:'"Segoe UI", Arial, sans-serif',arial:'Arial, sans-serif'};
  document.documentElement.style.setProperty('--delpha-user-font',families[selectedFont] || 'inherit');
  const scale = Number(localStorage.getItem('delpha-ui-font-scale') || 100);
  document.documentElement.style.zoom = `${Math.max(85, Math.min(125, Number.isFinite(scale) ? scale : 100))}%`;
} catch {}
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import { installFormDismissGuard } from "./formDismissGuard";
import "./App.css";
import "./dark-theme-fixes.css";
import "./hidden-scrollbars.css";
import "./contrast-final-fixes.css";

installFormDismissGuard();

ReactDOM.createRoot(document.getElementById("root")).render(
  <MemoryRouter initialEntries={[(() => {
    // Accept bookmarks created by older HashRouter releases without exposing
    // route changes in the address bar during in-app navigation.
    const legacy = window.location.hash.replace(/^#/, "");
    if (legacy.startsWith("/")) return legacy;
    try { return sessionStorage.getItem("delpha-last-route") || "/"; }
    catch { return "/"; }
  })()]}>
    <App />
  </MemoryRouter>
);
