export function notify(message, type = "success", options = {}) {
  if (options.silent) return;
  window.dispatchEvent(new CustomEvent("app-notification", {
    detail: { id: Date.now(), message, type },
  }));
}
