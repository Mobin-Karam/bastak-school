const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..", "..");
const today = new Date().toISOString().slice(0, 10);
const patchMaxLines = Number(process.env.DOCS_BUMP_PATCH_MAX_LINES ?? 35);
const minorMaxLines = Number(process.env.DOCS_BUMP_MINOR_MAX_LINES ?? 220);

function runGit(args) {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
}

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)?/);
  if (!match) return null;
  const frontmatter = match[1] ?? "";
  const body = content.slice(match[0].length);
  return { frontmatter, body };
}

function parseVersion(input) {
  const raw = String(input ?? "").trim();
  const parts = raw
    .split(".")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part) && part >= 0);

  if (!parts.length) return [1, 0, 0];
  if (parts.length === 1) return [parts[0], 0, 0];
  if (parts.length === 2) return [parts[0], parts[1], 0];
  return [parts[0], parts[1], parts[2]];
}

function formatVersion(version) {
  return `${version[0]}.${version[1]}.${version[2]}`;
}

function extractVersionFromContent(content) {
  if (!content) return "";
  const parsed = splitFrontmatter(content);
  if (!parsed) return "";
  const match = parsed.frontmatter.match(/^version\s*:\s*(.+)\s*$/im);
  return match?.[1] ? String(match[1]).trim() : "";
}

function extractLastReviewedFromContent(content) {
  if (!content) return "";
  const parsed = splitFrontmatter(content);
  if (!parsed) return "";
  const match = parsed.frontmatter.match(/^last_reviewed\s*:\s*(.+)\s*$/im);
  return match?.[1] ? String(match[1]).trim() : "";
}

function compareVersions(left, right) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

function bumpVersion(version, scope) {
  const [major, minor, patch] = version;
  if (scope === "major") return [major + 1, 0, 0];
  if (scope === "minor") return [major, minor + 1, 0];
  return [major, minor, patch + 1];
}

function stripFrontmatterForCompare(content) {
  const parsed = splitFrontmatter(content);
  if (!parsed) return content;
  return parsed.body.replace(/\r\n/g, "\n");
}

function getChangeStats(relPath) {
  const output = runGit(["diff", "--numstat", "--", relPath]);
  if (!output) return { added: 0, deleted: 0 };
  const line = output.split(/\r?\n/)[0];
  const [addedRaw, deletedRaw] = line.split("\t");
  const added = Number(addedRaw) || 0;
  const deleted = Number(deletedRaw) || 0;
  return { added, deleted };
}

function inferScope(relPath, currentContent, previousContent) {
  if (!previousContent) return "minor";
  const previousBody = stripFrontmatterForCompare(previousContent);
  const currentBody = stripFrontmatterForCompare(currentContent);
  if (previousBody === currentBody) return "patch";

  const { added, deleted } = getChangeStats(relPath);
  const total = added + deleted;
  const currentHeadings = (currentBody.match(/^#{1,3}\s+/gm) ?? []).length;
  const previousHeadings = (previousBody.match(/^#{1,3}\s+/gm) ?? []).length;
  const headingDelta = Math.abs(currentHeadings - previousHeadings);
  const baselineSize = Math.max(previousBody.split(/\r?\n/g).length, 1);
  const ratio = total / baselineSize;

  if (headingDelta === 0 && ratio <= 0.08 && total <= patchMaxLines) return "patch";
  if (headingDelta <= 2 && ratio <= 0.55 && total <= minorMaxLines) return "minor";
  return "major";
}

function updateFrontmatter(frontmatter, nextVersion) {
  const lines = frontmatter.split(/\r?\n/g);
  const versionIndex = lines.findIndex((line) => /^version\s*:/i.test(line));
  if (versionIndex === -1) return null;
  lines[versionIndex] = `version: ${nextVersion}`;

  const lastReviewedIndex = lines.findIndex((line) => /^last_reviewed\s*:/i.test(line));
  if (lastReviewedIndex === -1) {
    lines.splice(versionIndex + 1, 0, `last_reviewed: ${today}`);
  } else {
    lines[lastReviewedIndex] = `last_reviewed: ${today}`;
  }

  return lines.join("\n");
}

async function bumpFile(relPath) {
  const absolutePath = path.join(rootDir, relPath);
  const currentContent = await fs.readFile(absolutePath, "utf8");
  const parsed = splitFrontmatter(currentContent);
  if (!parsed) return null;

  const versionMatch = parsed.frontmatter.match(/^version\s*:\s*(.+)\s*$/im);
  if (!versionMatch) return null;

  let previousContent = "";
  try {
    previousContent = runGit(["show", `HEAD:${relPath.replace(/\\/g, "/")}`]);
  } catch {
    previousContent = "";
  }

  const previousVersion = extractVersionFromContent(previousContent);
  const currentVersion = String(versionMatch[1]).trim();
  const currentLastReviewed = extractLastReviewedFromContent(currentContent);
  if (!previousVersion && currentLastReviewed === today) {
    return null;
  }
  if (
    previousVersion &&
    currentLastReviewed === today &&
    compareVersions(currentVersion, previousVersion) > 0
  ) {
    return null;
  }

  const scope = inferScope(relPath, currentContent, previousContent);
  const baseVersion = previousVersion || currentVersion;
  const nextVersion = formatVersion(bumpVersion(parseVersion(baseVersion), scope));
  const nextFrontmatter = updateFrontmatter(parsed.frontmatter, nextVersion);
  if (!nextFrontmatter) return null;
  if (nextFrontmatter === parsed.frontmatter) return null;

  const eol = currentContent.includes("\r\n") ? "\r\n" : "\n";
  const normalizedFrontmatter = nextFrontmatter.replace(/\n/g, eol);
  const rebuilt = `---${eol}${normalizedFrontmatter}${eol}---${eol}${parsed.body}`;
  await fs.writeFile(absolutePath, rebuilt, "utf8");

  return { relPath, scope, nextVersion };
}

async function run() {
  const changed = runGit(["diff", "--name-only", "--", "docs", "agents"])
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".md"));

  const results = [];
  for (const relPath of changed) {
    // eslint-disable-next-line no-await-in-loop
    const outcome = await bumpFile(relPath);
    if (outcome) {
      results.push(outcome);
    }
  }

  if (!results.length) {
    process.stdout.write("No markdown versions were bumped.\n");
    return;
  }

  for (const item of results) {
    process.stdout.write(`${item.relPath} -> ${item.nextVersion} (${item.scope})\n`);
  }
}

run().catch((error) => {
  process.stderr.write(`${String(error instanceof Error ? error.stack : error)}\n`);
  process.exitCode = 1;
});
