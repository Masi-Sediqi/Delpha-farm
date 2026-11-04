// Never persist admin passwords in state, storage, logs or collection records.
export function containsRemovedRecords(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after)) return false;
  const next = new Set(after.map((row) => String(row.id)));
  return before.some((row) => !next.has(String(row.id)));
}
export function requestAdminDeletionPassword() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#000a;display:flex;align-items:center;justify-content:center;padding:18px;";
    overlay.innerHTML = `<form dir="rtl" style="width:min(410px,100%);background:#10352e;border:1px solid #477b6d;border-radius:14px;padding:24px;color:white;box-shadow:0 16px 60px #000a"><h3 style="margin:0 0 12px">تأیید حذف توسط ادمین</h3><p>برای حذف ریکارد، رمز عبور ادمین را وارد کنید.</p><input type="password" required autocomplete="off" aria-label="رمز ادمین" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #7aaa99;border-radius:8px;background:white;color:#152820"/><div style="display:flex;gap:10px;margin-top:18px"><button type="submit" style="padding:10px 18px;border:0;border-radius:7px;background:#08785b;color:white">تأیید</button><button type="button" data-cancel style="padding:10px 18px;border-radius:7px">انصراف</button></div></form>`;
    document.body.append(overlay);
    const form = overlay.querySelector("form");
    const input = overlay.querySelector("input");
    const finish = (value) => { overlay.remove(); resolve(value); };
    form.addEventListener("submit", (event) => { event.preventDefault(); finish(input.value); });
    overlay.querySelector("[data-cancel]").addEventListener("click", () => finish(null));
    input.focus();
  });
}
