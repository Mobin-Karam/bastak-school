import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");

test("CMB release staging replaces local links without changing source manifests", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "cmb-npm-"));
  try {
    execFileSync(process.execPath, ["tooling/cmb/prepare-publish.mjs", `--out=${out}`], {
      cwd: root,
      env: { ...process.env, CMB_LICENSE: "UNLICENSED" },
      stdio: "pipe",
    });
    const staged = fs.readdirSync(out).sort();
    const workspace = JSON.parse(
      fs.readFileSync(path.join(root, "tooling/workspace/projects.json"), "utf8"),
    );
    const expectedPackages = workspace.projects.filter((project) =>
      project.path.startsWith("packages/cmb/"),
    );
    assert.equal(staged.length, expectedPackages.length);
    const auth = JSON.parse(fs.readFileSync(path.join(out, "cmb-auth", "package.json"), "utf8"));
    assert.equal(auth.private, undefined);
    assert.equal(auth.publishConfig.access, "public");
    assert.equal(auth.license, "UNLICENSED");
    assert.equal(auth.dependencies["@moshaver/cmb-kernel"], "^0.1.0");
    assert.equal(auth.dependencies["@moshaver/cmb-identity"], "^0.1.0");
    assert.ok(fs.existsSync(path.join(out, "cmb-auth", "src", "index.d.ts")));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test("packages the selected repository license in public artifacts", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "cmb-npm-license-"));
  try {
    execFileSync(process.execPath, ["tooling/cmb/prepare-publish.mjs", `--out=${out}`], {
      cwd: root,
      env: { ...process.env, CMB_LICENSE: "MIT" },
      stdio: "pipe",
    });
    const starter = JSON.parse(fs.readFileSync(path.join(out, "cmb-starter", "package.json"), "utf8"));
    assert.equal(starter.license, "MIT");
    assert.ok(fs.existsSync(path.join(out, "cmb-starter", "LICENSE")));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test("rejects a selected public license when its license file is absent", () => {
  assert.throws(
    () => execFileSync(process.execPath, ["tooling/cmb/prepare-publish.mjs", "--check"], {
      cwd: root,
      env: { ...process.env, CMB_LICENSE: "MIT", CMB_LICENSE_FILE: "MISSING-LICENSE" },
      stdio: "pipe",
    }),
    /CMB npm preparation failed/,
  );
});
