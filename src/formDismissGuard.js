/**
 * Prevent unintended dismissal of APG forms across portals and pages.
 * Close and Cancel buttons inside dialogs still work normally.
 * Does not modify submit/save workflows or persisted records.
 */
const backdropName = /(?:^|[-_\s])(overlay|backdrop|modal-layer|dialog-layer|modal-wrapper)(?:$|[-_\s])/i;
const dialogName = /(?:modal|dialog|form|drawer|popup)/i;

function classText(element) {
  if (!(element instanceof Element)) return "";
  return typeof element.className === "string" ? element.className : "";
}

function isBackdropSurface(target) {
  if (!(target instanceof Element)) return false;
  const name = classText(target);
  if (backdropName.test(name)) return true;
  // Some dialogs use a bare backdrop attribute instead of a class name.
  return target.hasAttribute("data-backdrop") || target.hasAttribute("data-modal-overlay");
}

function isVisible(element) {
  if (!(element instanceof HTMLElement) || element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  const s = window.getComputedStyle(element);
  if (s.display === "none" || s.visibility === "hidden") return false;
  return !!(element.getClientRects().length);
}

function anyOpenDialog() {
  const candidates = document.querySelectorAll('[role="dialog"],dialog[open],[class*="modal"],[class*="overlay"],[class*="backdrop"],[class*="drawer"]');
  for (const element of candidates) {
    const name = classText(element);
    if (isVisible(element) && (dialogName.test(name) || backdropName.test(name) || element.matches('[role="dialog"],dialog[open]'))) return true;
  }
  return false;
}

function stopBackdrop(event) {
  // Only suppress direct clicks on the backdrop, not buttons inside a form.
  if (!isBackdropSurface(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function stopEscape(event) {
  if (event.key !== "Escape" || !anyOpenDialog()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

let installed = false;
export function installFormDismissGuard() {
  if (installed) return;
  installed = true;
  for (const type of ["pointerdown", "mousedown", "mouseup", "pointerup", "click", "dblclick"]) {
    document.addEventListener(type, stopBackdrop, true);
  }
  document.addEventListener("keydown", stopEscape, true);
}
