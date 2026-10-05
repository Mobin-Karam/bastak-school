"use client";

// Safe baseline. Plug your domain-specific IndexedDB mutation queue into these two functions.
export async function warmOfflineCache() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.controller?.postMessage({
    type: "WARM_APP_CACHE",
    urls: [window.location.pathname + window.location.search],
  });
}

export async function syncOfflineChanges(): Promise<number> {
  // Intentionally does not replay unknown authenticated writes.
  // Return the number of successfully replayed mutations when your queue is connected.
  return 0;
}
