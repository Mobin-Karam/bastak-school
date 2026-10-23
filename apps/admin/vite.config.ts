import http from "node:http";
import https from "node:https";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { fileURLToPath } from "node:url";

const backendTargets = {
  local:
    process.env.MOSHAVER_LOCAL_API_ORIGIN ||
    process.env.VITE_LOCAL_API_ORIGIN ||
    "http://localhost:4000",
  remote:
    process.env.MOSHAVER_REMOTE_API_ORIGIN ||
    process.env.VITE_REMOTE_API_ORIGIN ||
    "https://api.sultano.ir",
} as const;

const localPortalHosts = ["localhost", "127.0.0.1", "::1", "app.localhost", "stud.localhost"];

function getDevCachePort() {
  const inlinePort = process.argv.find((argument) => argument.startsWith("--port="))?.slice(7);
  const portIndex = process.argv.indexOf("--port");
  const port = inlinePort ?? (portIndex >= 0 ? process.argv[portIndex + 1] : undefined);
  return port && /^\d{1,5}$/.test(port) && Number(port) <= 65535 ? port : "5173";
}

function selectedBackend(cookieHeader = "") {
  const match = cookieHeader.match(/(?:^|;\s*)moshaver_admin_backend=(local|remote)(?:;|$)/);
  return match?.[1] === "remote" ? "remote" : "local";
}

function proxyToBackend(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  target: string,
  path: string,
) {
  const upstreamUrl = new URL(path, target);
  const client = upstreamUrl.protocol === "https:" ? https : http;
  const proxyReq = client.request(
    upstreamUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: upstreamUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on("error", () => {
    if (res.headersSent) return;
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: false,
        error: { code: "PROXY_ERROR", message: "Backend proxy error" },
      }),
    );
  });
  req.pipe(proxyReq);
}

function devBackendProxy() {
  return {
    name: "dev-backend-proxy",
    // Infrastructure endpoints live at the root and must be registered before
    // Vite's SPA fallback would turn them into the Admin index document.
    enforce: "pre" as const,
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/api", (req, res, next) => {
        const target = backendTargets[selectedBackend(req.headers.cookie)];
        const mountedUrl = req.url || "";
        const originalUrl = (req as typeof req & { originalUrl?: string }).originalUrl;
        const requestPath = originalUrl?.startsWith("/api/")
          ? originalUrl
          : `/api${mountedUrl.startsWith("/") ? mountedUrl : `/${mountedUrl}`}`;
        if (!/^\/api\/v[12](?:\/|$)/.test(requestPath)) {
          next();
          return;
        }
        proxyToBackend(req, res, target, requestPath);
      });
      // `configureServer()` middleware is otherwise appended after Vite's
      // SPA fallback. A root middleware is reliable for the exact `/health`
      // and `/ready` paths (Connect strips mounted paths), then is inserted
      // first so these infrastructure routes cannot become frontend 404s.
      server.middlewares.use((req, res, next) => {
        const requestPath = req.url || "";
        if (!/^\/(?:health|ready)(?:\?|$)/.test(requestPath)) {
          next();
          return;
        }
        proxyToBackend(req, res, backendTargets[selectedBackend(req.headers.cookie)], requestPath);
      });
      const healthProxyLayer = server.middlewares.stack.pop();
      if (healthProxyLayer) server.middlewares.stack.unshift(healthProxyLayer);
    },
  };
}

/**
 * The public service worker is intentionally framework-neutral. This plugin
 * gives each build an immutable manifest of every emitted application asset
 * and changes sw.js itself, so browsers always discover a new worker when the
 * bundle changes.
 */
function pwaPrecacheManifest(): Plugin {
  let buildId = "development";
  return {
    name: "pwa-precache-manifest",
    apply: "build",
    generateBundle(_, bundle) {
      const assets = Object.values(bundle)
        .map((entry) => `/${entry.fileName}`)
        .filter((fileName) => !fileName.endsWith(".map"))
        .sort();
      buildId = createHash("sha256").update(assets.join("\n")).digest("hex").slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "pwa-precache.json",
        source: JSON.stringify({ buildId, assets }),
      });
    },
    async closeBundle() {
      const serviceWorker = path.resolve("dist/sw.js");
      const source = await readFile(serviceWorker, "utf8");
      const updated = source.replace(
        /const CACHE_VERSION = "[^"]+";/,
        `const CACHE_VERSION = "${buildId}";`,
      );
      if (updated === source)
        throw new Error("PWA service-worker cache version marker is missing.");
      await writeFile(serviceWorker, updated);
    },
  };
}

export default defineConfig({
  // Each dev port gets an isolated dependency cache. Running the app on two
  // ports at once must not let one optimizer invalidate the other's URLs.
  cacheDir: `node_modules/.vite-zanin-${process.env.VITE_CACHE_NAMESPACE ?? getDevCachePort()}`,
  // The Base UI drawer is first reached through lazy attendance routes. Keep it
  // in the initial dependency graph so opening that route cannot invalidate
  // the browser's current optimized-dependency hash mid-session.
  optimizeDeps: {
    include: ["@base-ui/react/drawer"],
  },
  plugins: [devBackendProxy(), react(), pwaPrecacheManifest()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (id.includes("node_modules/react-router")) return "router";
          if (id.includes("node_modules/@tanstack/")) return "query";
          if (
            /node_modules\/(exceljs|jszip|fast-csv|dayjs|saxes|readable-stream|archiver|unzipper|uuid)\//.test(
              id,
            )
          )
            return "spreadsheet";
          if (/node_modules\/(lucide-react|react-multi-date-picker|@persian-tools)\//.test(id))
            return "ui";
          if (/node_modules\/(recharts|d3-|victory-vendor|react-smooth)\//.test(id))
            return "charts";
          if (id.includes("node_modules/@base-ui/")) return "base-ui";
          return "vendor";
        },
      },
    },
  },
  server: {
    // Exact local portal names exercise the same hostname policy as production
    // without accepting arbitrary Host headers or exposing the dev server.
    host: "localhost",
    port: 5173,
    strictPort: true,
    allowedHosts: localPortalHosts,
  },
  preview: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    allowedHosts: localPortalHosts,
  },
  resolve: {
    // Keep lazy route modules and the application shell on the same React
    // instance; duplicate runtimes cause hooks to resolve to a null dispatcher.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
