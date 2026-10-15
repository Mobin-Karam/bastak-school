# Moshaver Docs Viewer

Browse the repository’s `docs/` Markdown as a focused library. The viewer provides full-text search across titles, paths and body text, a category-led library, page outline, recent documents, adjacent-page navigation, deep links and light/dark reading themes. Local documentation assets and the CMB HTML site are served under `/docs/`.

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
The viewer intentionally does not include project-health status, task planning, plugin controls, feedback workflows, or an `agents/` browser. Those concerns distracted from reading and made the navigation harder to scan. The metadata validation and version bump scripts remain standalone utilities; they are not part of viewer verification and do not run automatically.
