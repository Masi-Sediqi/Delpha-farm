import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./GlobalTableEnhancer.css";

let activeFullTextTooltip = null;

function shouldSkipTable(table) {
  return table.closest("form") || table.closest(".receipt-page") || table.closest(".reports-page");
}

function ensureScrollWrapper(table) {
  if (table.parentElement?.classList?.contains("global-table-scroll")) {
    return;
  }

  if (
    table.closest(".dashboard-table-wrap") ||
    table.closest(".search-results-table-wrap")
  ) {
    return;
  }

  const parent = table.parentElement;
  if (!parent) return;

  const wrapper = document.createElement("div");
  wrapper.className = "global-table-scroll";
  parent.insertBefore(wrapper, table);
  wrapper.appendChild(table);
}

function removeLegacyFilterRows(table) {
  table.querySelectorAll(".table-column-filter-row").forEach((row) => row.remove());
}

function closeFullTextTooltip() {
  activeFullTextTooltip?.remove();
  activeFullTextTooltip = null;
}

function getCellDisplayText(cell) {
  return (cell.getAttribute("title") || cell.innerText || cell.textContent || "").trim();
}

function cellHasHiddenText(cell) {
  return (
    cell.scrollWidth > cell.clientWidth + 1 ||
    cell.scrollHeight > cell.clientHeight + 1 ||
    Boolean(cell.getAttribute("title"))
  );
}

function showFullTextTooltip(cell) {
  const text = getCellDisplayText(cell);
  if (!text || text === "-") return;

  closeFullTextTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "global-full-text-tooltip";
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  const rect = cell.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const screenPadding = 12;
  const gap = 8;

  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + tooltipRect.width > window.innerWidth - screenPadding) {
    left = window.innerWidth - tooltipRect.width - screenPadding;
  }

  if (left < screenPadding) left = screenPadding;

  if (top + tooltipRect.height > window.innerHeight - screenPadding) {
    top = rect.top - tooltipRect.height - gap;
  }

  if (top < screenPadding) top = screenPadding;

  tooltip.style.left = `${Math.round(left)}px`;
  tooltip.style.top = `${Math.round(top)}px`;
  activeFullTextTooltip = tooltip;
}

function bindFullTextCells(table) {
  Array.from(table.querySelectorAll("tbody td")).forEach((cell) => {
    if (cell.dataset.fullTextBound === "true") return;

    cell.dataset.fullTextBound = "true";
    cell.classList.add("global-full-text-cell");
    cell.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea, [role='button']")) {
        return;
      }

      if (!cellHasHiddenText(cell)) {
        closeFullTextTooltip();
        return;
      }

      event.stopPropagation();
      showFullTextTooltip(cell);
    });
  });
}

function enhanceTable(table) {
  if (shouldSkipTable(table)) return;
  removeLegacyFilterRows(table);
  bindFullTextCells(table);
  ensureScrollWrapper(table);
}

function enhanceAllTables() {
  document.querySelectorAll("table").forEach(enhanceTable);
}

function GlobalTableEnhancer() {
  const location = useLocation();

  useEffect(() => {
    const run = () => window.requestAnimationFrame(enhanceAllTables);
    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    const handleClose = () => closeFullTextTooltip();

    document.addEventListener("mousedown", handleClose);
    document.addEventListener("keydown", handleClose);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);

    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("keydown", handleClose);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      closeFullTextTooltip();
    };
  }, []);

  return null;
}

export default GlobalTableEnhancer;
