export const PWA_OPEN_INSTALL_EVENT = "zanin:pwa-open-install";

/** Opens the shared installation sheet from any authenticated feature. */
export function openPWAInstall() {
  window.dispatchEvent(new CustomEvent(PWA_OPEN_INSTALL_EVENT));
}
