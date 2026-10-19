"use strict";

const APP_NAME = "zanin";
// Replaced with an immutable build id by vite.config.ts for every production build.
const CACHE_VERSION = "development";
const CACHE_PREFIX = `${APP_NAME}-pwa`;
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const DEFAULT_NOTIFICATION_URL = "/admin/communication/notifications";

const APP_SHELL = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/version.json",
  "/pwa-precache.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/app-logo.png",
  "/zanin-install-promo.webp",
  "/pwa-install-android-guide.webp",
  "/pwa-install-ios-guide.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(precacheApplication());
  // Development servers must never leave an old worker in control of Vite's
  // changing module graph. Production keeps the explicit update confirmation.
  if (isLocalDevelopmentHost()) void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
      .map((key) => caches.delete(key)));

    if ("navigationPreload" in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
    await broadcast({ type: "ZANIN_SW_ACTIVATED", version: CACHE_VERSION });
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  let url;
  try { url = new URL(request.url); } catch { return; }
  if (!["http:", "https:"].includes(url.protocol)) return;
  if (url.origin !== self.location.origin) return;
  if (isSensitiveRequest(url)) return;
  // Never cache Vite's live development graph. Mixing a cached optimized
  // dependency with a fresh lazy route can load two React runtimes and make
  // hooks fail until the page is manually reloaded.
  if (isViteDevelopmentAsset(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

function isSensitiveRequest(url) {
  return url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.includes("/session") ||
    url.pathname.includes("/logout");
}

function isStaticAsset(request, url) {
  return ["style", "script", "font", "image", "worker"].includes(request.destination) ||
    /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|ico)$/i.test(url.pathname);
}

function isViteDevelopmentAsset(url) {
  return (
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/.vite")
  );
}

function isLocalDevelopmentHost() {
  const host = self.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)
  );
}

async function networkFirstNavigation(event) {
  const request = event.request;
  try {
    const preload = await event.preloadResponse;
    const response = preload || await fetch(request);
    if (cacheable(response)) void put(RUNTIME_CACHE, request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) ||
      (await caches.match(OFFLINE_URL)) ||
      (await caches.match("/")) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fresh = fetch(request).then(async (response) => {
    if (cacheable(response)) await put(RUNTIME_CACHE, request, response.clone());
    return response;
  }).catch(() => null);
  if (cached) { void fresh; return cached; }
  return (await fresh) || new Response("", { status: 504 });
}

function cacheable(response) {
  return Boolean(response && response.ok && ["basic", "cors"].includes(response.type));
}

async function put(cacheName, request, response) {
  try { (await caches.open(cacheName)).put(request, response); } catch {}
}

async function warmCache(urls) {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.allSettled([...new Set(urls)].map(async (url) => {
    try {
      const response = await fetch(url, { cache: url.startsWith("/version.json") ? "no-store" : "reload" });
      if (response.ok) await cache.put(url, response);
    } catch {}
  }));
}

async function precacheApplication() {
  let assets = [];
  try {
    const response = await fetch("/pwa-precache.json", { cache: "no-store" });
    const manifest = response.ok ? await response.json() : null;
    if (Array.isArray(manifest?.assets)) {
      assets = manifest.assets.filter(
        (asset) =>
          typeof asset === "string" &&
          asset.startsWith("/") &&
          !asset.startsWith("//") &&
          !asset.includes(".."),
      );
    }
  } catch {
    // A shell-only cache still gives users an offline recovery page.
  }
  await warmCache([...APP_SHELL, ...assets]);
}

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;

  if (message.type === "SKIP_WAITING") void self.skipWaiting();
  if (message.type === "WARM_APP_CACHE") event.waitUntil(warmCache(Array.isArray(message.urls) ? message.urls : []));
  if (message.type === "CLEAR_RUNTIME_CACHE") event.waitUntil(caches.delete(RUNTIME_CACHE));
  if (message.type === "GET_SW_VERSION" && event.source) {
    event.source.postMessage({ type: "SW_VERSION", version: CACHE_VERSION });
  }
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const payload = readPushPayload(event);
    const id = String(payload.notificationId || payload.id || `zanin-${Date.now()}`);
    const url = safeAppUrl(payload.url || payload.link || DEFAULT_NOTIFICATION_URL);
    const title = String(payload.title || payload.notification?.title || "مدرسه دینی سلطان العلماء بستک");
    const body = String(payload.body || payload.message || payload.notification?.body || "اعلان جدیدی دارید.");

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.allSettled(windows.map((client) => client.postMessage({ type: "PUSH_RECEIVED", notificationId: id, url, payload })));
    if (windows.some((client) => client.visibilityState === "visible")) return;

    await self.registration.showNotification(title, {
      body,
      tag: id,
      icon: safeString(payload.icon) || "/icons/icon-192.png",
      badge: safeString(payload.badge) || "/icons/icon-192.png",
      dir: payload.dir === "ltr" ? "ltr" : "rtl",
      lang: safeString(payload.lang) || "fa",
      data: { notificationId: id, url },
      timestamp: typeof payload.timestamp === "number" ? payload.timestamp : Date.now(),
      silent: Boolean(payload.silent),
      requireInteraction: Boolean(payload.requireInteraction),
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const destination = new URL(safeAppUrl(event.notification?.data?.url), self.location.origin);
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => {
      try { return new URL(client.url).origin === self.location.origin; } catch { return false; }
    });
    if (existing) {
      try { await existing.navigate(destination.href); } catch {}
      try { await existing.focus(); } catch {}
      return;
    }
    if (self.clients.openWindow) await self.clients.openWindow(destination.href);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(broadcast({ type: "PUSH_SUBSCRIPTION_CHANGED" }));
});

function readPushPayload(event) {
  if (!event.data) return {};
  try { return event.data.json() || {}; } catch {}
  try { return { body: event.data.text() }; } catch { return {}; }
}

function safeAppUrl(value) {
  try {
    const url = new URL(typeof value === "string" ? value : DEFAULT_NOTIFICATION_URL, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return DEFAULT_NOTIFICATION_URL;
    if (url.pathname.startsWith("/admin/")) return `${url.pathname}${url.search}${url.hash}`;
    if (url.pathname.startsWith("/attendance")) return `/admin/attendance${url.search}${url.hash}`;
    if (url.pathname.startsWith("/communication/chat") || url.pathname.startsWith("/chat") || url.pathname.startsWith("/messages")) {
      return `/admin/communication/chat${url.search}${url.hash}`;
    }
    if (url.pathname.startsWith("/exams")) return `/admin/exams${url.search}${url.hash}`;
    if (url.pathname.startsWith("/schedule") || url.pathname.startsWith("/plans")) return `/admin/planner${url.search}${url.hash}`;
    return DEFAULT_NOTIFICATION_URL;
  } catch { return DEFAULT_NOTIFICATION_URL; }
}

function safeString(value) { return typeof value === "string" ? value.trim() : ""; }
async function broadcast(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.allSettled(clients.map((client) => client.postMessage(message)));
}
