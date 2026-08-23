import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./GlobalTableEnhancer.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
let activeFullTextTooltip = null;

function getDataRows(table) {
  const tbody = table.tBodies?.[0];
  if (!tbody) return [];

  return Array.from(tbody.rows).filter((row) => {
    const cells = Array.from(row.cells || []);
    if (!cells.length) return false;
    return !cells.some((cell) => Number(cell.colSpan || 1) > 1);
  });
}

function shouldSkipTable(table) {
  return table.closest("form") || table.closest(".receipt-page");
}

function findGlobalPagination(table) {
  return table.nextElementSibling?.classList?.contains("global-table-pagination")
    ? table.nextElementSibling
    : null;
}

function hasBuiltInPagination(table) {
  let container = table.parentElement;

  for (let depth = 0; depth < 3 && container; depth += 1) {
    if (container.querySelector(".table-pagination")) return true;
    container = container.parentElement;
  }

  return false;
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

function cleanupEnhancedTable(table) {
  findGlobalPagination(table)?.remove();
  table.dataset.enhancedTable = "false";
  table.__globalTableEnhancer = null;
  getDataRows(table).forEach((row) => {
    row.hidden = false;
  });
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

  if (hasBuiltInPagination(table)) {
    cleanupEnhancedTable(table);
    return;
  }

  ensureScrollWrapper(table);

  if (table.dataset.enhancedTable === "true") {
    table.__globalTableEnhancer?.refresh();
    return;
  }
  if (findGlobalPagination(table)) return;

  let rows = getDataRows(table);
  if (rows.length === 0) return;

  table.dataset.enhancedTable = "true";
  table.classList.add("enhanced-data-table");

  let page = 1;
  let pageSize = 20;

  const pagination = document.createElement("div");
  pagination.className = "global-table-pagination";

  const summary = document.createElement("span");
  const controls = document.createElement("div");
  const pageSizeLabel = document.createElement("label");
  const pageSizeSelect = document.createElement("select");
  const previous = document.createElement("button");
  const current = document.createElement("strong");
  const next = document.createElement("button");

  pageSizeLabel.textContent = "Rows per page";
  pageSizeSelect.setAttribute("aria-label", "Rows per page");
  PAGE_SIZE_OPTIONS.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = String(size);
    pageSizeSelect.appendChild(option);
  });
  pageSizeSelect.value = String(pageSize);

  previous.type = "button";
  previous.textContent = "Previous";
  next.type = "button";
  next.textContent = "Next";

  pageSizeSelect.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value) || 20;
    page = 1;
    render();
  });

  previous.addEventListener("click", () => {
    page = Math.max(1, page - 1);
    render();
  });

  next.addEventListener("click", () => {
    page += 1;
    render();
  });

  controls.append(pageSizeLabel, pageSizeSelect, previous, current, next);
  pagination.append(summary, controls);
  table.insertAdjacentElement("afterend", pagination);

  function render() {
    rows = getDataRows(table);
    bindFullTextCells(table);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    page = Math.min(page, totalPages);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const visibleSet = new Set(rows.slice(start, end));

    rows.forEach((row) => {
      row.hidden = !visibleSet.has(row);
    });

    const first = rows.length ? start + 1 : 0;
    const last = Math.min(end, rows.length);
    summary.textContent = `Showing ${first} to ${last} of ${rows.length} records`;
    current.textContent = `Page ${page} of ${totalPages}`;
    previous.disabled = page <= 1;
    next.disabled = page >= totalPages;
    pagination.hidden = rows.length <= Math.min(...PAGE_SIZE_OPTIONS);
  }

  table.__globalTableEnhancer = { refresh: render };
  render();
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
