const notificationSoundStorageKey = "afghan-power-notification-sound";
const notificationSoundEnabledKey = "afghan-power-notification-sound-enabled";
const defaultNotificationSound = "chime.mov";

export function playNotificationSound() {
  try {
    if (localStorage.getItem(notificationSoundEnabledKey) === "false") return;
    const sound = localStorage.getItem(notificationSoundStorageKey) || defaultNotificationSound;
    if (!sound) return;
    const audio = new Audio(`/sounds/${encodeURIComponent(sound)}`);
    audio.volume = 0.9;
    audio.play().catch(() => {
      // Browsers can block sound until the user has interacted with the page.
    });
  } catch (error) {
    console.warn("Unable to play notification sound:", error);
  }
}

export function notify(message, type = "success", options = {}) {
  if (options.silent) return;
  window.dispatchEvent(new CustomEvent("app-notification", {
    detail: { id: Date.now(), message, type },
  }));
  playNotificationSound();
}
