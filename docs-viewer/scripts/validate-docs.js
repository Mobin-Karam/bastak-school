const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const scopedRoots = ["docs", "agents"];
const allowedStatuses = new Set(["active", "draft", "deprecated", "experimental"]);

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: "", body: content };
  }
  return { frontmatter: match[1] ?? "", body: content.slice(match[0].length) };
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(raw) {
  const value = stripQuotes(raw);
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => stripQuotes(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

function parseFrontmatter(frontmatter) {
  if (!frontmatter) return {};
  const data = {};
  const lines = frontmatter.split(/\r?\n/g);
  let listKey = "";

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s*-\s+(.+)\s*$/);
    if (listItem && listKey) {
      const next = stripQuotes(listItem[1]).trim();
      if (!next) continue;
      const list = Array.isArray(data[listKey]) ? data[listKey] : [];
      list.push(next);
      data[listKey] = list;
      continue;
    }

    const keyValue = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!keyValue) {
      listKey = "";
      continue;
    }

    const key = keyValue[1].toLowerCase();
    const raw = keyValue[2];
    if (!raw.trim()) {
      data[key] = [];
      listKey = key;
      continue;
    }
    data[key] = parseValue(raw);
    listKey = "";
  }

  return data;
}

function toArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeRelativeFromRoot(absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function resolveInternalMarkdownLink(fromFile, href) {
  if (
    !href ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("#")
  ) {
    return "";
  }

  const clean = href.split("#")[0].split("?")[0].trim();
  if (!clean) return "";
  if (!clean.toLowerCase().endsWith(".md")) return "";

  const fromDir = path.dirname(fromFile);
  const absolute = clean.startsWith("/")
    ? path.resolve(rootDir, clean.replace(/^\/+/, ""))
    : path.resolve(fromDir, clean);

  return absolute;
}

function extractMarkdownLinks(content) {
  const withoutCodeFences = content.replace(/```[\s\S]*?```/g, " ");
  const links = [];
  const regex = /\[[^\]]*]\(([^)]+)\)/g;
  let match = regex.exec(withoutCodeFences);
  while (match) {
    links.push(match[1]);
    match = regex.exec(withoutCodeFences);
  }
  return links;
}

function parseDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00.000Z`)
    : new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function collectMarkdownFiles() {
  const files = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const next = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        files.push(next);
      }
    }
  }

  for (const root of scopedRoots) {
    await walk(path.join(rootDir, root));
  }

  return files;
}

async function validateFile(absolutePath) {
  const content = await fs.readFile(absolutePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(content);
  const frontmatterData = parseFrontmatter(frontmatter);
  const relPath = normalizeRelativeFromRoot(absolutePath);
  const errors = [];
  const warnings = [];

  if (!/^#\s+.+$/m.test(body)) {
    errors.push("Missing top-level heading (`# Title`).");
  }

  const lastUpdatedMatch = body.match(/^Last updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/im);
  if (!lastUpdatedMatch) {
    errors.push("Missing `Last updated: YYYY-MM-DD` line.");
  }

  const owner = String(frontmatterData.owner || "").trim();
  const status = String(frontmatterData.status || "").trim().toLowerCase();
  const version = String(frontmatterData.version || "").trim();
  const lastReviewed = String(
    frontmatterData.last_reviewed || frontmatterData["last-reviewed"] || frontmatterData.lastreviewed || ""
  ).trim();

  if (!owner) warnings.push("Missing frontmatter `owner`.");
  if (!status) warnings.push("Missing frontmatter `status`.");
  if (status && !allowedStatuses.has(status)) {
    errors.push(`Invalid frontmatter status: "${status}".`);
  }
  if (!version) warnings.push("Missing frontmatter `version`.");
  if (!lastReviewed) warnings.push("Missing frontmatter `last_reviewed`.");
  if (lastReviewed && !parseDate(lastReviewed)) {
    errors.push(`Invalid frontmatter last_reviewed date: "${lastReviewed}".`);
  }

  const tags = toArray(frontmatterData.tags);
  if (!tags.length) {
    warnings.push("Missing frontmatter `tags` (recommended for search quality).");
  }

  const markdownLinks = extractMarkdownLinks(content);
  for (const link of markdownLinks) {
    const resolved = resolveInternalMarkdownLink(absolutePath, link);
    if (!resolved) continue;
    try {
      await fs.access(resolved);
    } catch {
      errors.push(`Broken markdown link: ${link}`);
    }
  }

  return { relPath, errors, warnings };
}

async function run() {
  const files = await collectMarkdownFiles();
  const results = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await validateFile(file));
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const result of results) {
    if (!result.errors.length && !result.warnings.length) {
      continue;
    }
    process.stdout.write(`\n[${result.relPath}]\n`);
    for (const error of result.errors) {
      errorCount += 1;
      process.stdout.write(`  ERROR: ${error}\n`);
    }
    for (const warning of result.warnings) {
      warningCount += 1;
      process.stdout.write(`  WARN : ${warning}\n`);
    }
  }

  process.stdout.write(
    `\nDocs validation summary: files=${files.length}, errors=${errorCount}, warnings=${warningCount}\n`
  );

  if (errorCount > 0) {
    throw new Error("Docs validation failed.");
  }
}

run().catch((error) => {
  process.stderr.write(`${String(error instanceof Error ? error.message : error)}\n`);
  process.exitCode = 1;
});
