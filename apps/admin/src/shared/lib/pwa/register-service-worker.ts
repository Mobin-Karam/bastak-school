"use client";

export type SWUpdateEvent =
  { type: "waiting" | "update-available"; worker: ServiceWorker } | { type: "controller-change" };

type Listener = (event: SWUpdateEvent) => void;
const listeners = new Set<Listener>();
let controllerBound = false;

async function removeDevelopmentServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.filter((name) => name.startsWith("zanin-pwa-")).map((name) => caches.delete(name)),
    );
  }
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  // Vite's module graph changes during development. A production service
  // worker using stale-while-revalidate for scripts can otherwise combine an
  // old React runtime with a newly loaded lazy route, causing invalid hook
  // calls until the user manually reloads. Keep local development network-only.
  if (import.meta.env.DEV) {
    try {
      await removeDevelopmentServiceWorkers();
    } catch {
      // A blocked/unavailable service worker must not affect the application.
    }
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
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
      navigator.serviceWorker.addEventListener("controllerchange", () =>
        emit({ type: "controller-change" }),
      );
    }
    window.addEventListener("focus", () => registration.update().catch(() => undefined), {
      passive: true,
    });
    return registration;
  } catch (error) {
    console.warn("[Zanin PWA] Service worker registration failed", error);
    return null;
  }
}

export function onSWUpdate(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit(event: SWUpdateEvent) {
  listeners.forEach((listener) => listener(event));
}
export function skipWaiting(worker?: ServiceWorker | null) {
  worker?.postMessage({ type: "SKIP_WAITING" });
}
export function warmAppCache(_version: string, urls: string[]) {
  navigator.serviceWorker?.controller?.postMessage({ type: "WARM_APP_CACHE", urls });
}
export function activateCachedVersion(version: string, urls: string[]) {
  warmAppCache(version, urls);
}
