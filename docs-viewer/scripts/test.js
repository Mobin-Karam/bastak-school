const request = require("supertest");
const { createApp } = require("../server");

async function run() {
  const app = createApp();

  const treeResponse = await request(app).get("/api/tree").expect(200);
  const files = Array.isArray(treeResponse.body.files) ? treeResponse.body.files : [];
  if (!files.length) {
    throw new Error("Expected markdown files from /api/tree");
  }

  const docsIndex = files.find((file) => file.path === "docs/README.md") ?? files[0];
  if (!docsIndex || !Array.isArray(docsIndex.tags)) {
    throw new Error("Expected tags metadata on /api/tree file entries");
  }
  if (typeof docsIndex.searchText !== "string" || !docsIndex.searchText.length) {
    throw new Error("Expected searchText on /api/tree file entries");
  }
  if (typeof docsIndex.excerpt !== "string") {
    throw new Error("Expected excerpt on /api/tree file entries");
  }
  if (!docsIndex.metadata || typeof docsIndex.metadata !== "object") {
    throw new Error("Expected metadata object on /api/tree file entries");
  }

  const docResponse = await request(app)
    .get("/api/doc")
    .query({ path: docsIndex.path })
    .expect(200);
  if (!Array.isArray(docResponse.body.tags)) {
    throw new Error("Expected tags metadata on /api/doc responses");
  }
  if (!docResponse.body.metadata || typeof docResponse.body.metadata !== "object") {
    throw new Error("Expected metadata object on /api/doc responses");
  }
  if (typeof docResponse.body.excerpt !== "string") {
    throw new Error("Expected excerpt on /api/doc responses");
  }

  const editorFromPath =
    files.find((file) => file.path === "docs/README.md")?.path ?? docsIndex.path;
  const editorHref = "../apps/api/src/main.ts#L1";
  const editorLinkResponse = await request(app)
    .get("/api/editor/link")
    .query({ from: editorFromPath, href: editorHref, redirect: "0" })
    .expect(200);
  if (typeof editorLinkResponse.body.url !== "string" || !editorLinkResponse.body.url.startsWith("vscode://file/")) {
    throw new Error("Expected vscode:// URL from /api/editor/link");
  }
  if (typeof editorLinkResponse.body.path !== "string" || !editorLinkResponse.body.path.endsWith("src/main.ts")) {
    throw new Error("Expected resolved workspace path from /api/editor/link");
  }

  await request(app)
    .get("/api/editor/link")
    .query({ from: editorFromPath, href: "../../../../../../outside.txt", redirect: "0" })
    .expect(400);

  await request(app).get("/vendor/marked.js").expect(200);
  await request(app).get("/api/doc").query({ path: "docs/../../package.json" }).expect(400);
  await request(app).get("/api/doc/raw").query({ path: "docs/README.md" }).expect(200);
  await request(app).get("/docs/cmb-site/index.html").expect(200);
  await request(app).get("/docs/cmb-site/styles.css").expect(200);
  if (!files.some((file) => file.path === "docs/architecture/repository-architecture.md")) {
    throw new Error("Expected nested repository documentation");
  }

  const homeResponse = await request(app).get("/").expect(200);
  const html = String(homeResponse.text);
  if (!html.includes('type="module" src="./app/main.js"')) {
    throw new Error("Expected module entry script in docs viewer home page");
  }
  if (!html.includes("id=\"globalSearch\"")) {
    throw new Error("Expected global documentation search in docs viewer home page");
  }

  await request(app).get("/app/main.js").expect(200);
}

run()
  .then(() => {
    process.stdout.write("docs-viewer tests passed\n");
  })
  .catch((error) => {
    process.stderr.write(`${String(error instanceof Error ? error.stack : error)}\n`);
    process.exitCode = 1;
  });
