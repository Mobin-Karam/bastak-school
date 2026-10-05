# Platform audit — 2026-09-28

## Scope and evidence

This is a source and repository-documentation audit of the active v2 checkout. It is not browser, native-device, deployment, provider-delivery, or destructive-restore acceptance evidence.

Confirmed checks:

- `npm run workspace:check` — 19 projects, leaf-lockfile graph is acyclic.
- `npm run graphify:check` — the locally regenerated code graph fingerprint covers 1,038 tracked code/config files. Full semantic documentation extraction requires a separately configured provider key and was not performed.
- `npm run architecture:check` — CMB boundaries pass; four documented backend entity-import cycles remain, and module-level entity barrel imports are blocked.
- `npm run contracts:check` — 8 roles, 86 declared/backend capabilities, 33 frontend-guarded capabilities, `/api/v2`.
- Production dependency audit (`npm audit --omit=dev`) — no reported vulnerabilities in `apps/api`, `apps/admin`, or `apps/student`.
- `npm run docs:check` — 204 Markdown files pass owned-link, category-owner/review, and stale-path checks. Vendored Vazirmatn font READMEs are intentionally outside Moshaver documentation ownership.
- Admin validation — typecheck, formatting, lint, unit, accessibility, build and API-parity gates pass. Lint retains 20 non-failing hook-dependency warnings for behavior-specific follow-up; the build reports PostCSS source metadata and large-chunk warnings.
- Disposable runtime evidence — the authenticated security matrix, Student journey and onboarding journey pass against an isolated SQLite API. The Admin Playwright suite also passes locally for eight authorized roles, a Student-only rejection, and a platform-owner archive/restore flow at a mobile viewport. A local disposable backup/mutate/restore/integrity/authenticated-read rehearsal also passes. This is not Push, native-device, monitored rollback, or target-deployment acceptance.

## Platform map

| Surface | Confirmed source scope | Audit boundary |
| --- | --- | --- |
| API | NestJS/Fastify modular monolith with identity, organization, plans, tasks, study sessions, exams/quizzes, chat, notifications, reports, guardian, resources, sync and system modules | Endpoint presence is not production acceptance. |
| Admin | Role/capability-gated React application with operational, education, planning, communication, student, organization and system workspaces | Browser role transitions and destructive operations need disposable-target smoke tests. |
| Student | React/Vite/PWA/Tauri application with auth, home/plan, focus clock, exams/quiz, chat, notifications, audio, learning, resources and sharing features | Web, Android and desktop behavior remain separate acceptance surfaces. |
| Shared platform | API contracts, runtime-neutral `student-core`, and 13 CMB packages | CMB package boundaries pass; product policy stays in the API layer. |

## Prioritized engineering risks

1. **P0 — release evidence is incomplete.** Disposable authenticated API journeys, local Admin role-browser smoke, a Student mobile-login shell smoke, and a local restore rehearsal now pass. Run representative Admin and Student workflows, real Push delivery, native-device flows, a disposable deployed restore and monitored rollback. Source tests and route parity do not prove these; use the [release evidence checklist](../../operations/release-evidence.md).
   Admin triage now receives the authenticated, bounded Student sync-health
   state through presence heartbeats and prioritizes `SYNC_FAILED`; validate its
   retention and target-environment behavior before production sign-off.
2. **P1 — entity import cycles.** Broad module-level entity-barrel imports have been removed and the gate now prevents their return. Four entity cycles remain, including a large core-domain cycle; reduce them incrementally with migration and metadata tests.
3. **P1 — dated migration documents can mislead delivery.** The August Student gap analysis describes a scaffold that no longer matches current feature directories. It is now explicitly marked historical; refresh its replacement only from current API contracts and feature tests.
4. **P1 — documentation health is automated but needs stewardship.** Relative-link, stale-path, category owner and review-date checks now run locally and in CI; keep the manifest current as documentation changes.
5. **P2 — package validation remains component-owned.** Run focused typecheck, test, accessibility and build gates after each surface change; do not use repository-level checks as a substitute for UI/API flow evidence.

## Admin UX priorities

1. Make the dashboard a triage queue: urgent student risks, overdue recovery, unread messages and failed sync first; charts second.
2. Preserve list context in every directory: filters, sorting, pagination, selected rows and return location after detail/edit work.
3. Standardize irreversible actions: impact summary, typed confirmation for restore/destructive actions, explicit scope, progress, auditable result and recovery path.
4. Put role and organization context beside every scoped action; explain unavailable actions instead of silently hiding important workflow context.
5. Test keyboard-first tables, focus restoration after dialogs, compact-table alternatives, empty/error/retry states, and RTL truncation at narrow widths.

## Student UX priorities

1. Keep Today focused on one next action: current task, start/resume, exam deadline and an understandable sync state.
2. Make focus sessions interruption-safe: clear pause/finish controls, recovery after app restart, reduced-motion support, and no disruptive update while timing or a quiz is active.
3. Use progressive disclosure for task details, exam readiness and advisor feedback; avoid dashboard density on low-end Android screens.
4. Offline queue state now uses plain Persian for saved locally, syncing and
   needs-attention states, with a pending-change count and an online retry.
   Verify reconciliation against a live server and native storage separately;
   never imply a mutation reached the server before it did.
5. Validate keyboard, screen reader, Persian/Arabic digit entry, RTL dates, contrast, font scaling and native safe-area behavior on web and Android.

## Future product roadmap

Deliver in this order, only after the P0 release evidence above:

1. **Learning reliability:** cross-device sync observability, conflict resolution for non-exam drafts, notification preferences and a student-visible activity history.
2. **Advisor intelligence:** explainable readiness/weakness trends, review debt, sustainable workload signals and advisor-approved plan suggestions; never fabricate rank or predictive certainty.
3. **Family collaboration:** consented guardian summaries, encouragement and schedule visibility with strict server-side student/guardian scoping.
4. **Institution operations:** bulk templates, advisor capacity, import quality reports, retention controls and tenant administration.
5. **Scale only when measured:** PostgreSQL migration rehearsal, queue/cache/object-storage adoption and observability based on actual load/SLO evidence; microservices remain a last resort.

## Documentation disposition

| Category | Canonical location | Audit decision |
| --- | --- | --- |
| Current architecture and operations | `docs/architecture/`, `docs/components/`, `docs/operations/` | Retain; update when source contracts change. |
| Product direction and UX | `docs/product/` | Retain; use this audit as the prioritized current planning companion. |
| Migration plans and parity snapshots | `docs/migrations/` | Retain, label dated snapshots as historical, and do not use them as current status. |
| Dated audits and fixes | `docs/history/` | Retain as evidence; never rewrite history to claim current behavior. |
| App-local implementation notes | `apps/*/docs/` and feature-local Markdown | Retain only when they link to a canonical current document; consolidate when edited next. |

No documentation file was removed: the audit found historical evidence and current navigation value, not a safely deletable repository-owned document. Future removal requires checking inbound links, Git history value, and a replacement canonical page.

## Next verification commands

```bash
npm run workspace:check
npm run docs:check
npm run architecture:check
npm run contracts:check
cd apps/admin && npm run typecheck && npm run format:check && npm run lint && npm test && npm run test:a11y && npm run audit:parity && npm run build
cd ../student && npm run typecheck && npm run test:a11y && npm run build
cd ../api && npm test && npm run build
```
