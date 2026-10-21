---
description: Repository-specific engineering boundaries for the Moshaver modular monorepo.
applyTo: "**"
---

# Moshaver repository contract

- Read `AGENTS.md` and `.github/copilot-instructions.md` before non-trivial work. The source and executable tests are authoritative when documentation or Graphify disagree.
- This is a leaf-lockfile monorepo. `tooling/workspace/projects.json` is the cross-project DAG; do not add root npm workspaces, a root lockfile, Nx, or Turborepo as incidental work.
- Treat `apps/api` and `apps/admin` as composition roots, `packages/api-contract` as the shared HTTP contract, `student-core` as runtime-neutral product code, and `packages/cmb/*` as reusable platform layers. Cross-project imports use public entrypoints only.
- Dependency direction is applications → product/domain code → CMB platform → CMB kernel/public contracts. CMB must never depend on Moshaver education domains.
- For API, permission, or schema changes, trace the server implementation, capability enforcement, shared contract, Admin consumers, migrations, and focused tests. UI visibility is supplementary; authorization and organization scope are enforced server-side.
- Admin capability-aware UI reads `/me/context`, uses capabilities rather than role names, and preserves Persian/RTL, responsive, accessible behavior. Keep one feature/data flow across desktop and mobile shells.
- For structural discovery, query `graphify-out/graph.json` first when available, then verify the selected source. The graph is navigation evidence, not proof.
- Use component scripts and the workspace runner as appropriate: `npm run workspace:check`, `npm run workspace:plan -- build`, and `npm run verify`; do not run a root `npm install`.
- Preserve unrelated uncommitted work. Do not claim a validation, deployment, provider integration, browser result, or production behavior was verified unless it actually was.
