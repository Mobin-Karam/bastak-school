const fs = require("node:fs/promises");
const path = require("node:path");

const viewerRoot = path.resolve(__dirname, "..");
const distRoot = path.join(viewerRoot, "dist");

async function ensureCleanDist() {
  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });
}

async function copyRuntimeFiles() {
  await fs.cp(path.join(viewerRoot, "public"), path.join(distRoot, "public"), {
    recursive: true
  });
  await fs.copyFile(path.join(viewerRoot, "server.js"), path.join(distRoot, "server.js"));
}

async function writeBuildMetadata() {
  const metadata = {
    builtAt: new Date().toISOString(),
    runtime: {
      node: process.version
    },
    files: ["server.js", "public/"]
  };
  await fs.writeFile(
    path.join(distRoot, "build-info.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8"
  );
}

async function run() {
  await ensureCleanDist();
  await copyRuntimeFiles();
  await writeBuildMetadata();
  process.stdout.write(`docs-viewer build output: ${distRoot}\n`);
}

run().catch((error) => {
  process.stderr.write(`${String(error instanceof Error ? error.stack : error)}\n`);
  process.exitCode = 1;
});
