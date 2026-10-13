# Moshaver Docs Viewer

Browse the repository’s `docs/` Markdown with full-text search, tags, themes, recent documents and reading shortcuts. Local documentation assets and the CMB HTML site are served under `/docs/`. Source-code links open in VS Code.

```bash
cd docs-viewer
npm ci
npm start
```

Open http://localhost:4310. Run the server rather than opening `public/index.html` directly: the UI needs its document API.

```bash
npm test
npm run build
node dist/server.js
```

The build uses the repository docs in place; it does not copy or modify them. Dependencies remain local to this package, without a root workspace or lockfile change.

Optional environment variables:

- `DOCS_VIEWER_PORT`: port (default `4310`).
- `DOCS_VIEWER_HOST`: bind address (default `127.0.0.1`).
- `DOCS_ROOT`: absolute repository root containing `docs/` when running elsewhere.
- `DOCS_FEEDBACK_URL`: issue creation URL.
- `BACKEND_HEALTH_URL`: optional backend health URL (default `http://127.0.0.1:4000/health`). Backend availability does not affect browsing docs.
- `DOCS_REVIEW_STALE_DAYS`: review freshness threshold (default `45`).

An optional `agents/` directory is supported but is not required. The copied metadata validation and version bump scripts are standalone utilities; they are not part of viewer verification and do not run automatically.
