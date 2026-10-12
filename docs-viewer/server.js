const express = require("express");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = process.env.DOCS_ROOT
  ? path.resolve(process.env.DOCS_ROOT)
  : path.resolve(__dirname, path.basename(__dirname) === "dist" ? "../.." : "..");
const staticDir = path.join(__dirname, "public");
const markedUmdPath = path.join(path.dirname(require.resolve("marked")), "marked.umd.js");
const backendHealthUrl = process.env.BACKEND_HEALTH_URL || "http://127.0.0.1:4000/health";
const docsFeedbackUrl =
  process.env.DOCS_FEEDBACK_URL || "https://github.com/Mobin-Karam/bastak-school/issues/new";
const docsReviewStaleDays = Number(process.env.DOCS_REVIEW_STALE_DAYS ?? 45);
const allowedRoots = ["docs", "agents"].map((segment) => path.join(rootDir, segment));
const workspaceDir = rootDir;

function normalizeTag(input) {
  if (typeof input !== "string") return "";
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._\-/\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || "";
}

function splitFrontmatter(content) {
  if (typeof content !== "string") {
    return { frontmatter: "", body: "" };
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: "", body: content };
  }

  return {
    frontmatter: match[1] ?? "",
    body: content.slice(match[0].length)
  };
}

function stripSurroundingQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatterValue(raw) {
  const value = stripSurroundingQuotes(raw);
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((part) => stripSurroundingQuotes(part))
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return value;
}

function parseFrontmatter(content) {
  const { frontmatter, body } = splitFrontmatter(content);
  if (!frontmatter) {
    return { data: {}, body, raw: content };
  }

  const data = {};
  const lines = frontmatter.split(/\r?\n/g);
  let listKey = "";

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.+)\s*$/);
    if (listItem && listKey) {
      const next = stripSurroundingQuotes(listItem[1]).trim();
      if (next) {
        const current = Array.isArray(data[listKey]) ? data[listKey] : [];
        current.push(next);
        data[listKey] = current;
      }
      continue;
    }

    const keyValue = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyValue) {
      listKey = "";
      continue;
    }

    const key = keyValue[1].toLowerCase();
    const rawValue = keyValue[2];
    if (!rawValue.trim()) {
      data[key] = [];
      listKey = key;
      continue;
    }

    data[key] = parseFrontmatterValue(rawValue);
    listKey = "";
  }

  return { data, body, raw: content };
}

function getPathTags(relPath) {
  const parts = relPath.replace(/\\/g, "/").split("/").filter(Boolean);
  const tags = new Set();

  if (parts[0]) tags.add(normalizeTag(parts[0]));
  if (parts[1] && parts[1] !== `${parts[parts.length - 1]}`) tags.add(normalizeTag(parts[1]));

  const fileName = parts[parts.length - 1] ?? "";
  const fileBase = fileName.replace(/\.md$/i, "");
  for (const token of fileBase.split(/[-_.\s]+/g)) {
    const next = normalizeTag(token);
    if (next) tags.add(next);
  }

  return tags;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseDateInput(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const normalized = value.trim();
  const isoLike = /^\d{4}-\d{2}-\d{2}$/;
  const parsed = isoLike.test(normalized)
    ? new Date(`${normalized}T00:00:00.000Z`)
    : new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function deriveOwner(relPath) {
  if (relPath.startsWith("agents/")) return "backend-platform";
  if (relPath.startsWith("docs/features/")) return "backend-feature";
  if (relPath.startsWith("docs/")) return "backend-ops";
  return "backend-team";
}

function normalizeStatus(input) {
  const candidate = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (["active", "draft", "deprecated", "experimental"].includes(candidate)) {
    return candidate;
  }
  return "active";
}

function extractLastUpdatedFromBody(body) {
  if (typeof body !== "string") return "";
  const match = body.match(/^Last updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/im);
  return parseDateInput(match?.[1] ?? "");
}

function extractTitle(body, fallbackPath) {
  const heading = typeof body === "string" ? body.match(/^#\s+(.+)\s*$/m) : null;
  if (heading?.[1]) {
    return heading[1].trim();
  }
  const leaf = fallbackPath.split("/").pop() ?? fallbackPath;
  return leaf.replace(/\.md$/i, "");
}

function stripMarkdownForSearch(body) {
  if (typeof body !== "string") return "";
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/^#+\s+/gm, " ")
    .replace(/[*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeExcerpt(cleanText) {
  if (!cleanText) return "";
  return cleanText.length > 220 ? `${cleanText.slice(0, 217)}...` : cleanText;
}

function computeReviewInfo(lastReviewedIso) {
  const parsed = parseDateInput(lastReviewedIso);
  if (!parsed) {
    return { state: "needs-review", daysSinceReview: null };
  }

  const millis = Date.now() - new Date(parsed).getTime();
  const daysSinceReview = Math.max(0, Math.floor(millis / 86400000));
  return {
    state: daysSinceReview > docsReviewStaleDays ? "needs-review" : "fresh",
    daysSinceReview
  };
}

function pickFrontmatterValue(frontmatterData, ...keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(frontmatterData, key)) {
      const value = frontmatterData[key];
      if (Array.isArray(value)) {
        return value[0] ?? "";
      }
      return value;
    }
  }
  return "";
}

async function readDocInfo(absolutePath, relPath, modifiedAt) {
  const rawContent = await fs.readFile(absolutePath, "utf8");
  const parsed = parseFrontmatter(rawContent);
  const frontmatterData = parsed.data;
  const body = parsed.body;

  const tags = getPathTags(relPath);
  for (const candidate of toStringArray(frontmatterData.tags)) {
    const next = normalizeTag(candidate);
    if (next) tags.add(next);
  }

  const title = String(pickFrontmatterValue(frontmatterData, "title") || "").trim();
  const owner = String(pickFrontmatterValue(frontmatterData, "owner") || "").trim();
  const status = String(pickFrontmatterValue(frontmatterData, "status") || "").trim();
  const version = String(pickFrontmatterValue(frontmatterData, "version") || "").trim();
  const frontmatterReview = String(
    pickFrontmatterValue(frontmatterData, "last_reviewed", "last-reviewed", "lastreviewed") || ""
  ).trim();

  const lastUpdatedFromBody = extractLastUpdatedFromBody(body);
  const lastReviewedIso =
    parseDateInput(frontmatterReview) || lastUpdatedFromBody || parseDateInput(modifiedAt);
  const review = computeReviewInfo(lastReviewedIso);
  const searchText = stripMarkdownForSearch(body);
  const excerpt = computeExcerpt(searchText);

  const metadata = {
    title: title || extractTitle(body, relPath),
    owner: owner || deriveOwner(relPath),
    status: normalizeStatus(status),
    version: version || "1.0",
    lastReviewed: lastReviewedIso,
    reviewState: review.state,
    daysSinceReview: review.daysSinceReview
  };

  return {
    rawContent,
    body,
    tags: Array.from(tags).filter(Boolean).sort((left, right) => left.localeCompare(right)),
    metadata,
    excerpt,
    searchText: `${relPath} ${metadata.title} ${searchText}`.toLowerCase()
  };
}

function normalizeRelPath(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Missing path");
  }

  const normalized = path.posix
    .normalize(input.replace(/\\/g, "/"))
    .replace(/^\/+/, "");

  if (!normalized.endsWith(".md")) {
    throw new Error("Only markdown files are supported");
  }

  if (!(normalized.startsWith("docs/") || normalized.startsWith("agents/"))) {
    throw new Error("Path must be under docs/ or agents/");
  }

  const absolutePath = path.resolve(rootDir, normalized);
  const isAllowed = allowedRoots.some(
    (allowedRoot) =>
      absolutePath === allowedRoot || absolutePath.startsWith(`${allowedRoot}${path.sep}`)
  );

  if (!isAllowed) {
    throw new Error("Invalid path");
  }

  return { normalized, absolutePath };
}

function isExternalHref(input) {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//")) return true;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function parseLineColumnFromLink(pathPart, hashPart) {
  let cleanPathPart = pathPart;
  let line = 0;
  let column = 0;

  const suffixMatch = cleanPathPart.match(/^(.*?)(?::([0-9]+)(?::([0-9]+))?)$/);
  if (suffixMatch && suffixMatch[1] && suffixMatch[1].includes(".")) {
    cleanPathPart = suffixMatch[1];
    line = Number(suffixMatch[2] || 0);
    column = Number(suffixMatch[3] || 0);
  }

  const fragment = String(hashPart || "").trim();
  if (fragment) {
    const lineMatch = fragment.match(/^L([0-9]+)(?:C([0-9]+))?$/i);
    if (lineMatch) {
      line = Number(lineMatch[1] || 0);
      column = Number(lineMatch[2] || 0);
    }
  }

  return {
    pathPart: cleanPathPart,
    line: Number.isFinite(line) && line > 0 ? line : 0,
    column: Number.isFinite(column) && column > 0 ? column : 0
  };
}

function isWithinWorkspace(absolutePath) {
  const resolved = path.resolve(absolutePath);
  return resolved === workspaceDir || resolved.startsWith(`${workspaceDir}${path.sep}`);
}

function toPosixRelative(inputPath, fromRoot) {
  return path.relative(fromRoot, inputPath).split(path.sep).join("/");
}

async function resolveEditorLink(fromDocPath, href) {
  const { absolutePath: fromAbsolutePath } = normalizeRelPath(String(fromDocPath ?? ""));
  const inputHref = String(href ?? "").trim();
  if (!inputHref) {
    throw new Error("Missing href");
  }

  if (inputHref.startsWith("#")) {
    throw new Error("Anchor-only links cannot open files");
  }

  if (isExternalHref(inputHref)) {
    throw new Error("Only local repository links are supported");
  }

  const [hrefWithoutHash, rawHash = ""] = inputHref.split("#");
  const [rawPath = ""] = hrefWithoutHash.split("?");
  const decodedPath = decodeURIComponent(rawPath.trim());
  if (!decodedPath) {
    throw new Error("Missing local file path");
  }

  const parsedPosition = parseLineColumnFromLink(decodedPath, decodeURIComponent(rawHash));
  if (!parsedPosition.pathPart) {
    throw new Error("Missing local file path");
  }

  const targetAbsolutePath = parsedPosition.pathPart.startsWith("/")
    ? path.resolve(workspaceDir, parsedPosition.pathPart.slice(1))
    : path.resolve(path.dirname(fromAbsolutePath), parsedPosition.pathPart);

  if (!isWithinWorkspace(targetAbsolutePath)) {
    throw new Error("Linked path is outside workspace");
  }

  const stats = await fs.stat(targetAbsolutePath);
  if (!stats.isFile()) {
    throw new Error("Linked path is not a file");
  }

  return {
    absolutePath: targetAbsolutePath,
    workspacePath: toPosixRelative(targetAbsolutePath, workspaceDir),
    line: parsedPosition.line,
    column: parsedPosition.column
  };
}

function toVsCodeFileUrl(absolutePath, line, column) {
  const normalizedPath = absolutePath.split(path.sep).join("/");
  const locationSuffix = line > 0 ? `:${line}${column > 0 ? `:${column}` : ""}` : "";
  const encodedPath = encodeURI(`${normalizedPath}${locationSuffix}`);
  return `vscode://file/${encodedPath}`;
}

async function collectMarkdownFiles(rootSegment) {
  const startDir = path.join(rootDir, rootSegment);
  const found = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
        continue;
      }

      const rel = path.relative(rootDir, nextPath).split(path.sep).join("/");
      const stats = await fs.stat(nextPath);
      const info = await readDocInfo(nextPath, rel, stats.mtime.toISOString());
      found.push({
        path: rel,
        mtimeMs: stats.mtimeMs,
        modifiedAt: stats.mtime.toISOString(),
        tags: info.tags,
        metadata: info.metadata,
        excerpt: info.excerpt,
        searchText: info.searchText
      });
    }
  }

  if (!fsSync.existsSync(startDir)) return found;
  await walk(startDir);
  return found;
}

function createApiMetrics() {
  return {
    total: 0,
    failed: 0,
    routes: new Map()
  };
}

function observeApiCall(metrics, details) {
  metrics.total += 1;
  if (details.status >= 400) {
    metrics.failed += 1;
  }

  const routeKey = `${details.method} ${details.path}`;
  const current =
    metrics.routes.get(routeKey) ?? { count: 0, failed: 0, totalLatencyMs: 0, maxLatencyMs: 0 };
  current.count += 1;
  if (details.status >= 400) {
    current.failed += 1;
  }
  current.totalLatencyMs += details.latencyMs;
  current.maxLatencyMs = Math.max(current.maxLatencyMs, details.latencyMs);
  metrics.routes.set(routeKey, current);
}

function getMetricsSnapshot(metrics) {
  const routes = Array.from(metrics.routes.entries())
    .map(([route, value]) => ({
      route,
      count: value.count,
      failed: value.failed,
      avgLatencyMs: value.count ? Math.round(value.totalLatencyMs / value.count) : 0,
      maxLatencyMs: value.maxLatencyMs
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);

  return {
    total: metrics.total,
    failed: metrics.failed,
    routes
  };
}

async function checkBackendStatus() {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(backendHealthUrl, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeout);

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      url: backendHealthUrl
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      url: backendHealthUrl,
      error: String(error instanceof Error ? error.message : error)
    };
  }
}

function createApp() {
  const app = express();
  const metrics = createApiMetrics();

  app.use("/api", (req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      const latencyMs = Date.now() - startedAt;
      const details = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        latencyMs
      };
      observeApiCall(metrics, details);
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          service: "docs-viewer",
          type: "api_request",
          method: details.method,
          path: details.path,
          status: details.status,
          latencyMs: details.latencyMs,
          timestamp: new Date().toISOString()
        })
      );
    });
    next();
  });

  app.get("/api/tree", async (_req, res) => {
    try {
      const files = (
        await Promise.all([collectMarkdownFiles("docs"), collectMarkdownFiles("agents")])
      )
        .flat()
        .sort((left, right) => left.path.localeCompare(right.path));

      res.json({
        files,
        generatedAt: new Date().toISOString(),
        config: {
          feedbackUrl: docsFeedbackUrl,
          reviewStaleDays: docsReviewStaleDays
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to list markdown files", error: String(error) });
    }
  });

  app.get("/api/doc", async (req, res) => {
    try {
      const { normalized, absolutePath } = normalizeRelPath(String(req.query.path ?? ""));
      const stats = await fs.stat(absolutePath);
      const info = await readDocInfo(absolutePath, normalized, stats.mtime.toISOString());
      res.json({
        path: normalized,
        content: info.body,
        mtimeMs: stats.mtimeMs,
        modifiedAt: stats.mtime.toISOString(),
        tags: info.tags,
        metadata: info.metadata,
        excerpt: info.excerpt
      });
    } catch (error) {
      res.status(400).json({ message: String(error instanceof Error ? error.message : error) });
    }
  });

  app.get("/api/doc/raw", async (req, res) => {
    try {
      const { absolutePath } = normalizeRelPath(String(req.query.path ?? ""));
      const content = await fs.readFile(absolutePath, "utf8");
      res.type("text/plain").send(content);
    } catch (error) {
      res.status(400).send(String(error instanceof Error ? error.message : error));
    }
  });

  app.get("/api/status", async (_req, res) => {
    const backend = await checkBackendStatus();
    res.json({
      ok: true,
      service: "docs-viewer",
      now: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      backend,
      config: {
        feedbackUrl: docsFeedbackUrl,
        reviewStaleDays: docsReviewStaleDays
      },
      metrics: getMetricsSnapshot(metrics)
    });
  });

  app.get("/api/editor/link", async (req, res) => {
    try {
      const from = String(req.query.from ?? "");
      const href = String(req.query.href ?? "");
      const redirect = String(req.query.redirect ?? "1") !== "0";
      const resolved = await resolveEditorLink(from, href);
      const url = toVsCodeFileUrl(resolved.absolutePath, resolved.line, resolved.column);
      if (redirect) {
        res.redirect(302, url);
        return;
      }

      res.json({
        ok: true,
        url,
        path: resolved.workspacePath,
        line: resolved.line,
        column: resolved.column
      });
    } catch (error) {
      res.status(400).json({ message: String(error instanceof Error ? error.message : error) });
    }
  });

  app.get("/vendor/marked.js", (_req, res) => {
    if (!fsSync.existsSync(markedUmdPath)) {
      res.status(500).type("text/plain").send("Local marked asset not found. Run npm install.");
      return;
    }
    res.type("application/javascript").sendFile(markedUmdPath);
  });

  app.use("/docs", express.static(path.join(rootDir, "docs"), { dotfiles: "deny", fallthrough: false }));
  app.use(express.static(staticDir));
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.DOCS_VIEWER_PORT ?? 4310);
  createApp().listen(port, process.env.DOCS_VIEWER_HOST || "127.0.0.1", () => {
    // eslint-disable-next-line no-console
    console.log(`Markdown docs viewer running at http://localhost:${port}`);
  });
}

module.exports = { createApp };
