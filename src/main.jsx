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
