"use client";

export type SWUpdateEvent =
  | { type: "waiting" | "update-available"; worker: ServiceWorker }
  | { type: "controller-change" };

type Listener = (event: SWUpdateEvent) => void;
const listeners = new Set<Listener>();
let controllerBound = false;

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    if (registration.waiting) emit({ type: "waiting", worker: registration.waiting });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          emit({ type: "update-available", worker });
        }
      });
    });
    if (!controllerBound) {
      controllerBound = true;
      navigator.serviceWorker.addEventListener("controllerchange", () => emit({ type: "controller-change" }));
    }
    window.addEventListener("focus", () => registration.update().catch(() => undefined), { passive: true });
    return registration;
  } catch (error) {
    console.warn("[Zanin PWA] Service worker registration failed", error);
    return null;
  }
}

export function onSWUpdate(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
function emit(event: SWUpdateEvent) { listeners.forEach((listener) => listener(event)); }
export function skipWaiting(worker?: ServiceWorker | null) { worker?.postMessage({ type: "SKIP_WAITING" }); }
export function warmAppCache(_version: string, urls: string[]) { navigator.serviceWorker?.controller?.postMessage({ type: "WARM_APP_CACHE", urls }); }
export function activateCachedVersion(version: string, urls: string[]) { warmAppCache(version, urls); }
