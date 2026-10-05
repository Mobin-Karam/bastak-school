#!/usr/bin/env node
/**
 * Produces npm-safe CMB release artifacts without changing the local `file:`
 * dependency graph. It never calls `npm publish`.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const pack = args.has("--pack");
const checkOnly = args.has("--check");
const configuredLicense = String(process.env.CMB_LICENSE ?? "UNLICENSED").trim();
const licenseFile = String(process.env.CMB_LICENSE_FILE ?? "LICENSE").trim();
const outArgument = process.argv.slice(2).find((argument) => argument.startsWith("--out="));
const out = path.resolve(root, outArgument ? outArgument.slice("--out=".length) : "dist/cmb-npm");
const workspace = JSON.parse(
  fs.readFileSync(path.join(root, "tooling/workspace/projects.json"), "utf8"),
);
const packages = workspace.projects.filter((project) => project.path.startsWith("packages/cmb/"));
const manifests = new Map(
  packages.map((project) => [
    project.packageName,
    JSON.parse(fs.readFileSync(path.join(root, project.path, "package.json"), "utf8")),
  ]),
);

const requiredFiles = ["package.json", "README.md", "src/index.js", "src/index.d.ts"];
const errors = [];

if (!configuredLicense) errors.push("CMB_LICENSE must be a non-empty SPDX license identifier or UNLICENSED");
if (configuredLicense !== "UNLICENSED" && !fs.existsSync(path.join(root, licenseFile))) {
  errors.push(`CMB_LICENSE=${configuredLicense} requires repository license file ${licenseFile}`);
}

function releaseManifest(project) {
  const source = manifests.get(project.packageName);
  const dependencies = Object.fromEntries(
    Object.entries(source.dependencies ?? {}).map(([name, value]) => {
      const local = manifests.get(name);
      return [name, local && String(value).startsWith("file:") ? `^${local.version}` : value];
    }),
  );
  return {
    name: source.name,
    version: source.version,
    description: source.description || `Composable Modular Backend ${project.id.replace(/^cmb-/, "")} primitives.`,
    type: source.type || "commonjs",
    main: "./src/index.js",
    types: "./src/index.d.ts",
    exports: source.exports,
    files: configuredLicense === "UNLICENSED" ? ["src", "README.md"] : ["src", "README.md", licenseFile],
    keywords: ["cmb", "modular-backend", "backend", "framework-agnostic", project.id.replace(/^cmb-/, "")],
    engines: { node: ">=22.13.0 <23" },
    repository: {
      type: "git",
      url: "git+https://github.com/Mobin-Karam/moshaver.git",
      directory: project.path,
    },
    bugs: { url: "https://github.com/Mobin-Karam/moshaver/issues" },
    homepage: "https://github.com/Mobin-Karam/moshaver/tree/main/packages/cmb",
    publishConfig: { access: "public" },
    license: configuredLicense,
    sideEffects: false,
    dependencies,
  };
}

for (const project of packages) {
  const directory = path.join(root, project.path);
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(directory, file))) errors.push(`${project.packageName}: missing ${file}`);
  }
  const source = manifests.get(project.packageName);
  if (!source?.private) errors.push(`${project.packageName}: local manifest must stay private`);
  if (!source?.exports?.["."] || !source.types) errors.push(`${project.packageName}: root export/types are incomplete`);
}

if (errors.length) {
  console.error("CMB npm preparation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (checkOnly) {
  console.log(`CMB npm preparation OK: ${packages.length} package sources can be staged.`);
  process.exit(0);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const project of packages) {
  const source = path.join(root, project.path);
  const target = path.join(out, project.id);
  fs.mkdirSync(path.join(target, "src"), { recursive: true });
  for (const file of ["README.md", "src/index.js", "src/index.d.ts"]) {
    fs.copyFileSync(path.join(source, file), path.join(target, file));
  }
  if (configuredLicense !== "UNLICENSED") {
    fs.copyFileSync(path.join(root, licenseFile), path.join(target, licenseFile));
  }
  fs.writeFileSync(
    path.join(target, "package.json"),
    `${JSON.stringify(releaseManifest(project), null, 2)}\n`,
  );
  if (pack) execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts"], { cwd: target, stdio: "inherit" });
}

console.log(`Prepared ${packages.length} CMB npm artifacts in ${path.relative(root, out)}.`);
if (configuredLicense === "UNLICENSED") {
  console.log("Artifacts are marked UNLICENSED until the repository owner chooses and adds a license; this tool never publishes.");
} else {
  console.log(`Artifacts include ${licenseFile} and declare ${configuredLicense}; this tool never publishes.`);
}
if (!pack) console.log("Run `npm run cmb:pack` to validate every staged artifact with npm pack --dry-run.");
