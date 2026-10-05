#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "docs/current-documentation.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const markdownFiles = [];
const errors = [];
const skippedRoots = new Set([".git", "node_modules", "dist", "coverage", "graphify-out"]);

function posix(value) {
  return value.split(path.sep).join("/");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedRoots.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(absolute);
  }
}

function resolveLink(from, href) {
  const target = href.trim().split("#")[0];
  if (!target || /^(?:https?:|mailto:|#)/.test(target) || target.includes("{") || target.includes("<")) return null;
  return path.resolve(path.dirname(from), target);
}

function ownerFor(relative) {
  return config.categories.find((category) =>
    relative === category.path || relative.startsWith(`${category.path}/`),
  );
}

walk(root);
for (const file of markdownFiles) {
  const relative = posix(path.relative(root, file));
  // Vendored upstream documentation is retained verbatim and is not Moshaver-owned.
  if (relative.includes("/public/fonts/")) continue;
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = resolveLink(file, match[1]);
    if (target && !fs.existsSync(target)) errors.push(`${relative}: broken relative link ${match[1]}`);
  }

  const owner = ownerFor(relative);
  if (!owner) continue;
  if (!owner.owner || !/^\d{4}-\d{2}-\d{2}$/.test(owner.reviewed || "")) {
    errors.push(`${relative}: current-status documentation needs an owner and ISO review date`);
  }
  for (const stale of config.stalePathPatterns) {
    const allowed = config.allowedLegacyReferences?.[relative] || [];
    const sanitized = allowed.reduce((value, reference) => value.split(reference).join(""), source);
    if (new RegExp(stale.pattern, "g").test(sanitized)) {
      errors.push(`${relative}: ${stale.message}`);
    }
  }
}

if (errors.length) {
  console.error("Documentation health check failed:");
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation health OK: ${markdownFiles.length} Markdown files scanned.`);
