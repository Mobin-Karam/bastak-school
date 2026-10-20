---
description: Document Bastak School components in Storybook with truthful fixtures, RTL/Persian support, and enforceable catalog coverage.
---

Use the `storybook-documentation` agent and skill to audit the requested
Admin component and page scope. Read `AGENTS.md`, query Graphify, run the catalog
generator, and inspect each component's providers, tests, locale, styles, and
consumer boundaries. Add or update co-located CSF stories with autodocs and
meaningful interactive states; for each Admin page use deterministic Storybook
fixtures as the UI/UX development source before live integration. Cover loading, empty, error, disabled,
keyboard/focus, responsive, RTL, and theme variants where applicable.

Do not call a production API, use credentials, weaken authorization, or invent
server-derived data. Components requiring auth/API/workflow fixtures must be
listed honestly as requiring fixtures until their deterministic story exists.
Run typecheck, catalog freshness, Storybook build, and relevant tests. Report
component coverage separately from browser/device/live-provider proof.
