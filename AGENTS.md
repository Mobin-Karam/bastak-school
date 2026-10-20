# Moshaver AI Engineering Guide

Moshaver is a multi-application monorepo. Treat this file as the primary repository-wide operating contract for AI coding agents.

## Codex project context

Codex uses this file as the primary project instruction. The GitHub-maintained
role briefs, workflows, prompt templates, and scoped policies are linked—not
copied—from [`.codex/README.md`](.codex/README.md). When a task matches one of
those workflows, read the source file through that catalog before acting.

The local [`.codex/config.toml`](.codex/config.toml) may register MCP servers
for this laptop. It is ignored by Git: do not commit it, credentials, OAuth
material, or account-specific endpoints. A configured server is not proof that
the current Codex session can call it; verify with `codex mcp list`.

### Codex branch-first rule

Before starting any repository-affecting task (editing files, running a
state-changing project command, committing, or creating a PR), Codex must
inspect the current branch. If it is `develop`, `main`, detached, or otherwise
not a dedicated task branch, create and switch to a new normal local branch
from the current `develop` baseline before continuing. Use a supported prefix
(`feat/`, `fix/`, `chore/`, or `ci/`) and a concise task slug. Preserve a dirty
worktree: never reset, clean, stash, or discard changes merely to branch. For
read-only questions and audits, inspect the branch but do not create one unless
the task becomes repository-affecting. Do not create a fresh branch when
already on the dedicated branch for the active task.

When a repository-affecting Codex task is complete, unless the user explicitly
opts out, Codex must: review the task-scoped diff, run the applicable
validation, stage only task files, create a focused commit, push the task
branch, and create or update a pull request with base `develop`. Then request
squash auto-merge for that work-branch PR. If required checks, reviews, branch
protection, or GitHub permissions prevent auto-merge, report the exact pending
condition and leave the PR open; never bypass protection. This automation never
applies to the protected `develop` → `main` release PR or to unreviewed,
unvalidated, or unrelated dirty changes.

## Graphify-first discovery

Before broad grep/search or reading many source files, use the repository knowledge graph when `graphify-out/graph.json` is available.

Preferred order:

1. Query Graphify for the concept, flow, caller/callee relationship, or impact area.
2. Use Graphify path/neighbor information to identify the smallest relevant file set.
3. Open those source files and verify the graph evidence before editing.
4. If the graph is missing or stale, refresh it with the Graphify skill (`/graphify . --update`; Codex uses `$graphify`) when available.
5. Fall back to repository search only when Graphify cannot answer the question or source-level verification is required.

Graph evidence is navigation/context, not a replacement for reading the source of files being changed.

See `docs/architecture/graphify.md` and `.agents/skills/graphify/SKILL.md`.

## Repository architecture

Read `ARCHITECTURE.md` and `docs/architecture/repository-architecture.md` before repository-wide structural work.

The accepted model is a **grouped product monorepo** with a **modular-monolith backend**.

Current physical paths remain valid during migration:

- `apps/api/` — API application/composition root.
- `apps/admin/` — Admin application.
- `apps/student/` — Student application.
- `student-core/` — runtime-neutral Student domain/provider package.
- `packages/api-contract/` — shared API contract package.

Logical dependency direction is effective immediately even before folders move:

```text
applications
    ↓
product/domain code
    ↓
CMB platform modules
    ↓
CMB kernel + public contracts
```

Infrastructure adapters implement lower-level ports and are wired by application composition roots.

Never make a lower/reusable layer depend on a higher/product-specific layer. Cross-project imports must use public entrypoints. See `docs/architecture/dependency-boundaries.md`.

## Workspace foundation

Phase 2 uses `tooling/workspace/projects.json` as the authoritative cross-project package DAG.

The root `package.json` is an orchestration manifest only. It intentionally has no `workspaces` field or dependency list. Existing leaf `package-lock.json` files remain install authority until a separate root-lock migration is explicitly approved.

Before repository-wide validation or package extraction:

```bash
npm run workspace:check
npm run workspace:list
npm run workspace:plan -- build
```

To bootstrap every installable project in dependency order:

```bash
npm run bootstrap
```

To run release-quality component scripts in dependency order:

```bash
npm run verify
```

For one project and its local dependencies:

```bash
node tooling/workspace/run.mjs verify --project=student-app-v2
```

Do not run a root `npm install` expecting unified workspace dependencies. Do not add the npm `workspaces` field, Nx, Turborepo, or a root dependency lock as an incidental change. See `docs/architecture/workspace-foundation.md`.

## Backend architecture direction

The reusable backend initiative is **CMB — Composable Modular Backend Architecture** (tracking epic #21).
Before changing CMB packages or backend composition, read
`docs/architecture/cmb-reference-and-release.md` and run the compatibility and
architecture gates documented there.

When changing backend architecture:

- keep the reusable kernel independent from Moshaver education domains;
- keep product modules such as students, plans, exams, reports, guardian, tasks, and study sessions outside the reusable kernel;
- prefer explicit module contracts and public entrypoints over private cross-module imports;
- keep infrastructure replaceable where portability justifies it;
- preserve `/api/v2` compatibility unless a breaking change is explicitly approved;
- do not weaken authentication, authorization, CSRF, validation, tenant isolation, or audit boundaries;
- do not introduce a microservice boundary without a documented operational reason and ADR.

## First actions

1. Read this file and `.github/copilot-instructions.md`.
2. Query Graphify first when the graph exists.
3. Read `ARCHITECTURE.md` for structural/repository work.
4. Read applicable `.github/instructions/*.instructions.md` files.
5. Run `.github/ai-toolkit/scripts/detect-project.sh` when a shell is available.
6. Read `.agent-state/project.json` if present.
7. Inspect nearby tests, package scripts, migrations, and public contracts before editing.

## Engineering rules

- Repository source and executable tests are authoritative; documentation and graphs may drift.
- Prefer existing libraries, patterns, tokens, modules, and commands.
- Make the smallest complete change that satisfies the requirement.
- Preserve public contracts unless a breaking change is explicitly requested.
- Never invent repository facts. Mark unresolved facts as `UNKNOWN`.
- Never expose, print, commit, or fabricate secrets.
- Never disable security controls to make a change pass.
- For bugs, identify the root cause and add a regression test when practical.
- For database changes, inspect migration history, data compatibility, constraints, and rollback safety.
- For UI work, cover loading, empty, error, disabled, responsive, keyboard, accessibility, theme, and Persian/RTL behavior where relevant.
- For API changes, identify admin/student/other consumers and synchronize shared contracts.
- Do not promote code into a shared package without a clear ownership reason or real second consumer.

## Modular Excel import/export

- Reuse `apps/admin/src/shared/lib/spreadsheet-transfer.ts` for feature-specific Excel workbook schemas, parsing, template generation, and downloads; do not duplicate `exceljs` row-index parsing in feature pages.
- Reuse `@moshaver/cmb-data-transfer` only for framework-neutral transfer safety checks and normalization. It must not know Moshaver entities or make persistence decisions.
- Every API feature owns an explicit allowlisted DTO/schema, a capability-gated preview endpoint, per-row errors/conflicts, a bounded transactional commit, scoped export, and import history/audit where data is changed. Never accept a client-provided table/entity name or authorize import from the UI alone.
- Keep organization and student scope server-enforced on preview, commit, and export. Reject authority fields (`roles`, permissions, passwords, sessions, capabilities) and cap batch size. New adapters for teachers, schedules, or other school data should follow `student-transfer` as the product example.

## Validation

## Admin role and capability UX

- Treat `/me/context` as the Admin authority for active roles, organization scope, and capabilities. On any role or organization switch, refresh that context before rendering new capability-gated UI or issuing feature requests.
- Use `auth.can`, `auth.canAny`, `auth.canAll`, and `CapabilityGate` for Admin visibility and interaction states; do not gate a new page or action with a role name. Declare the actual capability on its navigation item and protect the route with `CapabilityRoute`. API authorization is still mandatory.

## Admin responsive shell

- Keep one capability-aware page and data flow for every viewport. Compose it with the desktop rail workspace and the mobile drawer/bottom-navigation shell; do not fork feature pages by device type.
- Use `useDevicePerformance` for optional Admin shell presentation effects. `reduced` is for reduced-motion, Data Saver, slow network, or constrained browser hints and must remove decorative motion and backdrop filters without removing functionality. `enhanced` may add lightweight decorative motion only after those signals permit it.
- Do not use Android user-agent sniffing for performance decisions. Respect user motion preferences, safe-area insets, keyboard focus, RTL/LTR logical properties, and the existing mobile focus trap.

Use the root workspace graph for repository-level ordering, but keep component-defined scripts authoritative.

### Repository

```bash
npm run workspace:check
npm run workspace:list
npm run verify
```

### Backend

```bash
cd apps/api
npm ci
npm run lint
npm test
npm run build
```

### Admin

```bash
cd apps/admin
npm ci
npm run typecheck
npm run format:check
npm run lint
npm test
npm run test:a11y
npm run build
```

### Student core

```bash
cd student-core
npm ci
npm run build
npm test
```

### Student app

```bash
cd apps/student
npm ci
npm run typecheck
npm test
npm run test:a11y
npm run build
```

Generic toolkit fallback:

```bash
.github/ai-toolkit/scripts/validate-project.sh quick
```

Release-quality fallback:

```bash
.github/ai-toolkit/scripts/validate-project.sh full
```

Never claim a validation command passed unless it actually ran successfully.

## Branch and release lifecycle

For new work, start from current `origin/develop` and use a normal local branch in the existing checkout. Codex must apply the branch-first and task-completion rules above before and after repository-affecting work. Follow the branch names in Codex Workspace and Git Rules above; repository lifecycle scripts currently accept `feat/`, `fix/`, `chore/`, or `ci/`. Use `scripts/cicd/start-work.sh` only for supported branch names and without a worktree path. If the checkout is dirty, preserve existing edits before switching branches; never create a separate worktree. When explicitly asked to switch to `develop`, fast-forward it to `origin/develop` without overwriting existing work. Commit only the task's changes. Use `scripts/cicd/finish-work.sh` to push, create the develop PR, wait for CI, and merge only when GitHub checks and configured reviews permit it. Do not bypass protection or force push.

After develop passes CI, automation opens a develop-to-main release PR. Merge that PR with a merge commit after its required checks and release review. Main's successful push CI dispatches the exact tested commit to the private bastak-school-deploy repository, whose server workflow validates CI again before production deployment. Do not merge unrelated application work merely to activate infrastructure. See `docs/operations/github-cicd.md` for setup, recovery, and learning guidance.
