# Bastak School current-state audit

Audit date: 2026-10-12 (Asia/Tehran). Source baseline: `5871ae5614c3534fb1dde9195f4e3e9eff067bd4`. Scope: repository architecture, critical school workflows, security, persistence, frontend, tests and deployment. This is a documentation-only phase; no application fixes, file moves, deletions, production-data inspection or deployment were performed.

Subsequent persistence implementation and measured remediation status are recorded in [database-audit.md](database-audit.md). Findings below remain the original source baseline, not a claim that later fixes are absent.

## Evidence and limits

Source and executable checks take precedence over historical documentation. The audit inventoried tracked paths and package manifests, traversed Nest module imports from `AppModule`, examined entity/migration definitions, traced the requested workflows and their frontend consumers, and inspected CI/container/deployment definitions. It is not a claim that every line of every file received manual review. Dynamic imports, production query plans, real traffic, deployed configuration, GitHub protection settings and the private deployment repository are **UNKNOWN** unless explicitly noted below.

`graphify-out/graph.json` and the `graphify` executable were absent. The local Graphify skill (`.agents/skills/graphify/SKILL.md`) was read; refresh was unavailable. Source traversal and the repository architecture checker supplied dependency evidence instead. `rg` was unavailable; filesystem/Python/grep inspection was used. Node/npm initially were outside PATH; subsequent checks used the installed Node `22.23.3` under `/home/bastak-server/.nvm/versions/node/v22.23.3/bin`.

Severity: **High** means credential exposure, authorization errors, data loss or a blocked supported deployment path; **Medium** means bounded correctness or operational risk and significant maintainability debt; **Low** means documentation/tooling drift. “Confirmed” identifies a source-verifiable property or defect, not evidence of production exploitation. “Potential” requires the additional validation described. Estimates in [refactor-plan.md](refactor-plan.md) are engineering days, excluding external approval and release waiting time.

## Verified repository and stack

| Area | Current implementation and evidence |
| --- | --- |
| Applications | `apps/api`, `apps/admin`, `apps/cmb-reference`; `apps/student` is absent. `docs-viewer` is a separate runnable package outside the declared workspace DAG. |
| Workspace | `tooling/workspace/projects.json`: 20 projects, leaf-lockfile installs, explicit dependencies and ordered verification. Root `package.json` has no npm `workspaces`, but **does** contain a `bcrypt` dependency and a root lockfile, contrary to the orchestration-only contract in `AGENTS.md`. |
| Backend | `apps/api/package.json`, `src/main.ts`: NestJS 11, Fastify 5, TypeScript 5, RxJS, TypeORM, `better-sqlite3`, bcryptjs, class-validator/class-transformer, Zod, Web Push, Swagger. Express/Multer dependencies remain for the dormant document controller; Express is not the API runtime adapter. |
| Frontend | `apps/admin/package.json`, `vite.config.ts`, `src/main.tsx`: React 18, Vite 7, TypeScript, React Router 7, Tailwind 3/PostCSS, TanStack Query/Table, React Hook Form/Zod, ExcelJS, Base UI/Radix, Framer Motion, Persian date tools, PWA assets. No active Tauri application was found. Manifest versions are declared ranges, not a guarantee of every resolved version. |
| Reusable packages | `packages/api-contract`, `packages/admin-workspace-ui`, `student-core`; 14 private CMB packages with public root exports and descriptors, JavaScript implementations and TypeScript declarations. `apps/cmb-reference` demonstrates a framework-neutral Node service. |
| Supporting tools | `docs-viewer/package.json`: Express 4 and Marked; repository tooling includes Node scripts, Bash and Python. Docker and Nginx serve the production topology; GitHub Actions handles quality and promotion. |
| TypeScript | API `tsconfig.json`: strict CommonJS/ES2022, decorators/metadata. Admin `tsconfig.app.json`: strict ESNext/bundler, React JSX, no emit; app/node references are local, not a root TS solution. `student-core/tsconfig.json`: strict ES2020, unchecked-index and exact-optional checks. Admin registration implementation paths are explicitly excluded. |
| Schema | 94 `*.entity.ts` files (some files define multiple entities), 117 migration files in `apps/api/src/database`; centralized entity barrel and migration glob. `synchronize: false`, `migrationsRun: true`, transaction mode `each`, foreign keys enabled, WAL and busy timeout configured in `data-source.ts`. `DATABASE_TYPE`/`DATABASE_URL` in config do not switch the actual SQLite data source. |
| Tests | Jest backend: 51 spec files under `apps/api/test` plus 4 under `src`; 145 Admin test/spec files under `src`, Vitest/Testing Library/axe and separate Playwright E2E. CMB uses Node test runner; student-core has one test file with multiple cases. File counts are inventory, not coverage percentages. |

The frontend mounts `/login`, `/register` and `/admin` with lazy feature routes, error boundaries and capability wrappers (`apps/admin/src/app/routing/router.tsx`). One page/data flow serves desktop/tablet/mobile shells. Locale/theme providers, RTL initialization, motion/performance preference handling and accessibility tests already exist. Registration completion is intentionally a coming-soon route; signup is a separate working code path.

## Runtime module graph and boundaries

`apps/api/src/app.module.ts` mounts the school composition; module reachability includes transitive imports. In particular **ExamsModule is mounted through GuardianModule**, despite not appearing as a direct AppModule import. Source presence alone does not establish an exposed HTTP API.

| Owning area | Reachable modules | Current data and coupling |
| --- | --- | --- |
| Identity/access | Auth, Authorization, Users, Organizations, SchoolAccess, Onboarding | users, sessions, throttle state, roles/permissions/assignments/grants, memberships, relationships. Auth and authorization also query student status. Onboarding writes identity, student and membership records together. |
| Student administration/registration | Students, Registration, StudentTransfer | student core/profile/contacts, registration requirements/progress, import history. StudentsModule also registers attendance and historical learning/request entities. |
| Education | SchoolEducation, EducationCatalog, Classes, ClassGroups | books/catalogue, classes, class books/teachers, enrollment, study groups. Catalogue deletion inspects plans, resources, exam attempts and reports. |
| Attendance | Attendance | sessions, records, receipts, pools/delegates, snapshots, audit. Reads classes/groups/dorms/student membership directly. Includes both AttendanceService and AttendanceOperationsService. |
| Schedule | Schedule | legacy entries plus timetable terms/versions/periods/locations/overrides. Depends on attendance's public transaction helper and education data; publishes notifications. |
| Leave/exit/letters | Workflows | leave requests, approvals, exits/returns, occupancy and letters. Also retains dorm and attendance implementations even though current controller does not expose those retained methods. |
| Family/community | Relationships, Guardian, SchoolHome, Chat, Exams | guardian links and scoped reads, prayer times/announcements, conversation membership/messages/reactions, exams/attempts. Guardian imports Exams and writes encouragement/notifications. |
| Operations/platform adapters | CmbRuntime, Health, Realtime, Notifications, System, ImportExport | readiness/descriptors, in-process SSE, durable notifications/push preferences, audit/version/backup/reset, plans/exams import/export. “CmbPlatformModule” is host wiring, not evidence that every contained Nest service is product-neutral. |

Not reachable from this composition: Activity, Analytics, Assessments, Education, EducationSharing, LearningResources, Mistakes, PermissionRequests, PlanTemplates, Plans, QuestionBank, Questions, Quiz, Recommendations, Relaxation, Reports, Reviews, StudentDocuments, StudySessions, Subjects, Sync and Tasks modules. Their tables and some direct service/repository uses remain. They are **dormant module compositions**, not proven removable code. The API entity registry still includes their schema. StudentDocuments is deliberately unmounted because its upload controller uses Express/Multer in a Fastify app.

CMB packages: `kernel`; foundation `health`, `persistence`; adapters `infrastructure`; platform `identity`, `tenancy`, `auth`, `authorization`, `system`, `realtime`, `notifications`, `activity`, `data-transfer`, `starter`. `apps/api/src/platform/cmb-runtime.service.ts` resolves descriptors and reports SQLite/SSE/Web Push adapters. Nest remains the actual school composition and concrete repository wiring; descriptor metadata is not enforcement of table ownership.

The architecture checker reports 55 workspace edges, 209 backend cross-module edges, zero backend deep implementation imports and zero entity-barrel imports in its checked boundary categories. Four permitted entity strongly connected components remain (see `tooling/architecture/baseline.json`):

1. Large identity/student/education component, including `database/entities/user.entity.ts`, `student.entity.ts`, `organization.entity.ts`, `session.entity.ts`, `plan.entity.ts`, `exam.entity.ts`, `conversation.entity.ts` and associated relations.
2. `learning-resource.entity.ts` ↔ `learning-resource-assignment.entity.ts`.
3. `permission.entity.ts` ↔ `role-permission.entity.ts` ↔ `role.entity.ts`.
4. `quiz.entity.ts` ↔ `quiz-question.entity.ts`.

These are confirmed imports, not demonstrated initialization failures. Public module imports improve navigation but do not prevent services from registering and writing another domain's repositories.

## Critical workflow traces

| Workflow | Verified path and important behavior |
| --- | --- |
| Login/session | `features/auth/components/LoginForm.tsx` → `api/auth.api.ts` → `modules/auth/auth.controller.ts#login` → `AuthService.login`: normalize phone, persisted throttle, bcrypt comparison, active account/work-context check, hashed access/refresh credentials and cookies. Refresh validates CSRF and rotates credentials. `AuthSessionGuard` enriches context on each request; Roles/Capabilities/CSRF guards follow. Authentication guard populates the user rather than rejecting every anonymous request; public routes and explicit downstream guards/checks determine access. |
| Role/organization permissions | Admin `AuthProvider.setActiveRole/setActiveOrganization` refresh `/me/context` before committing context. `shared/api/api.ts#setApiWorkContext` changes headers and emits an event; `main.tsx` clears QueryClient. Backend `AuthorizationService.enrich` filters active assignments, active organizations/memberships, selected role, feature entitlements and grants; CMB `buildAuthorizationContext` scopes organization IDs. This correctly prevents a simple client-header role escalation. Some product membership helpers then bypass that scoped organization list (F02). |
| Account signup | `/register` → `StudentSignupPage` → signup API → `OnboardingController`/`SignupThrottleService` → `OnboardingService.signup`. A transaction reserves organization signup capacity via conditional UPDATE/`changes()`, then creates user/student/membership/role assignment. Public signup policy and organization quotas are checked. Platform bootstrap is a distinct first-owner path. Real deployment provisioning state is UNKNOWN. |
| Registration completion | `RegistrationController`: self/profile/contacts/sections, organization requirements and staff review → `RegistrationService`. National-code checksum checked; per-section opening/closing windows applied; derived status refreshed. Backend exists, but current Admin route is `RegistrationComingSoonPage`; excluded implementation files do not establish a released UI. Profile/contact/progress writes lack a shared transaction (F05), and education selections bypass catalogue validation (F07). |
| Student records | `StudentsPage` → students API → `StudentAdministrationController/Service`: capability/resource authorization, transactional user/student creation and update, education selection validation, lifecycle/archive delegation to StudentsService. Record primary organization and user membership are separate concepts. Unlinked imported records are supported. Historical learning and support endpoints remain mixed into StudentsModule. |
| Classes/groups | education/class pages → `ClassesController/Service`, ClassGroups → catalogue, organization/staff eligibility, books and enrollments. Replacement of enrollments and books uses transactions; classroom access checks teacher/advisor/manager relationships. Class list eagerly loads rosters before final access filtering (P03). |
| Attendance | Attendance pages → `AttendanceController` and `AttendanceOperationsController` → scoped context/roster checks, lifecycle, optimistic revisions, receipts and audit. `attendanceTransaction` serializes participating writers on a connection; bulk validation precedes writes. Physical observation and absence review are distinct. Operations support scheduled occurrences, dorm delegates and pools; guard these behaviors during refactoring. |
| Schedules | `SchedulePage`/`TimetablePage` → TimetableController/Service: configuration, draft revision, conflict detection, publish/archive, overrides and attendance occurrences. Publication commits before notifications. Legacy ScheduleController is still mounted: direct entity responses, array import validation and sequential commit create separate defects (F01/F04/F06). |
| Dormitory | Dormitory page → DormitoryController/Service → SchoolAccess, room capacity and same-primary-organization checks, replacement/movement and announcements. Pair uniqueness protects room/student duplicates but not one room per student. Movement/replacement is non-atomic (F03). |
| Leave/exit permissions | leave/exit/student portal pages → WorkflowsController/Service → membership scope, student self, principal/supervisor review routing, recorded gate departures/returns and occupancy. Some request bodies use erased TS types/`any`, so global DTO validation does not apply (F06). Helpers query memberships independently of selected work context (F02). |

## Prioritized confirmed findings

### F01 — High: schedule responses expose password hashes

Evidence: `apps/api/src/database/entities/user.entity.ts:53` defines `passwordHash` with plain `@Column()` (no `select: false` or serialization exclusion). `modules/schedule/schedule.service.ts#list` (line 49) returns ORM results with `teacher: true` and `classBook.teacher: true`; create/update also return saved entities containing the loaded teacher. `schedule.controller.ts` wraps results in `common/utils/envelope.ts#ok`, which only constructs `{ok, data}`. `AppModule`/`main.ts` installs no serializer that strips the field.

Impact: authorized schedule readers can receive teachers' credential hashes and unrelated account fields; same entity-return pattern can affect legacy export/create/update. This is a confirmed source response path; no real hash was fetched or printed. Remediation: explicit allowlisted schedule response projections, then consider select-by-default hardening with explicit auth queries. Regression risk: frontend currently uses nested teacher/book shapes; blanket hiding can break login if auth queries are not adapted. Test nested response trees, not just top-level properties.

### F02 — High: membership helpers accept a tenant outside the selected authority context

Evidence: `modules/authorization/authorization.service.ts#enrich` and `packages/cmb/authorization/src/index.js#buildAuthorizationContext` narrow capability assignments and organization IDs to the selected school. `modules/school-access/school-access.service.ts:33#organizationForUser` instead checks any active membership in the requested school; it neither checks the actor's scoped organization IDs nor re-evaluates capabilities there. `DormitoryService.createRoom/requireRoom`, Registration requirements/review and StudentTransfer call this helper after capability guards. `WorkflowsService.activeMemberships/organizationForUser` similarly re-queries membership independently.

Trigger: an account is principal with a capability in school A, but has a less privileged membership in B. With A selected, a mutation targeting B can pass A's capability guard and B's membership-only resource check. A disposable service-level assertion confirmed that SchoolAccess accepts B for an actor scoped to A. This is not proof that every endpoint is exploitable: endpoints using AuthorizationService resource policy may be safe.

Remediation: enforce selected tenant/resource capability together; retain an explicit, reviewed platform-admin exception. Regression risk: platform-wide screens and legitimate cross-school administration. Add HTTP tests for privileged A + unprivileged B in both directions, disabled organizations, omitted headers and direct IDs.

### F03 — High: dorm room moves/replacement can lose assignments

Evidence: `modules/dormitory/dormitory.service.ts:58#setAssignments` removes previous-room assignments, deletes target-room assignments, then saves new ones without a surrounding transaction. `database/entities/dorm-room-assignment.entity.ts` and `migrations/1724148200000-SchoolMvpFoundation.ts` enforce only `(roomId, studentId)` uniqueness. A failure after delete leaves lost placements. Concurrent moves can violate the service's stated one-current-room rule; the schema does not independently enforce that invariant.

Remediation: serialized transaction covering revalidation, movement and replacement; audit existing duplicates before an additive uniqueness migration matching the agreed ownership model. Regression risk: historical/cross-school assignment interpretation and attendance roster snapshots. Do not silently deduplicate existing students' placements.

### F04 — High: legacy schedule import can partially commit

Evidence: `modules/schedule/schedule.service.ts:380#commitImport` previews, then loops `await this.create(user, entry)` outside a transaction. Preview checks basic text/time/scope but not all class/book/teacher references resolved by create. A later invalid reference can fail after earlier rows persisted. A disposable injected second-row failure assertion confirmed the sequential partial-write path.

Remediation: revalidate all references and capabilities, commit the bounded batch atomically using the same transaction manager, record import history. Regression risk: existing response shape and capability split (`schedule.import` plus `schedule.create`); retain explicit permission semantics.

### F05 — Medium: registration aggregate updates are non-atomic

Evidence: `modules/registration/registration.service.ts:66#updateProfile` saves Student before profile; `:100#setContacts` deletes existing contacts before insertion and student-status update; `submitSection/reviewSection` save progress separately from derived student status. Failures can leave incomplete registration state or lose emergency contacts. This is confirmed missing transaction coverage; production incidents are UNKNOWN.

Remediation: owner-level unit of work for each aggregate change and status recalculation; make initialization idempotent. Regression risk: existing section status transitions and required/disabled section behavior. Test rollback on later repository failure and repeat requests.

### F06 — Medium: global validation does not cover several mounted request bodies

Evidence: `modules/workflows/workflows.controller.ts#createStudentLeaveRequest/createStudentExitPermission/createStudentLetter` use `@Body() body: any`; review/gate methods use inline type literals. `modules/system/system.controller.ts#setVersion/setRelease` also uses inline types. `modules/schedule/schedule.controller.ts:15-16` binds `@Body("entries") SaveScheduleEntryDto[]` rather than a concrete nested-array DTO. These runtime metatypes cannot supply the property whitelist and nested class-validator metadata configured in `main.ts`.

Services perform some manual checks; this finding does **not** claim arbitrary privilege fields are persisted. Specific gaps include unbounded letter text/attachments at the workflow boundary and schedule import rows bypassing SaveScheduleEntryDto decorators. Remediation: concrete DTOs with nested validation, size bounds and cross-field checks; retain manual domain checks. Regression risk: clients currently sending extra/loosely typed fields will receive new 4xx responses.

### F07 — Medium: self-registration can persist invalid catalogue selections

Evidence: `modules/registration/registration.dto.ts#UpdateRegistrationProfileDto` allows arbitrary bounded strings for educationTypeId/trackId and an independently optional grade. `RegistrationService.updateProfile` copies them directly. By contrast, `StudentAdministrationService.create/update` uses `EducationCatalogService.validateSelection` for compatible grade/type/track combinations.

Impact: two writers of the same student fields enforce different domain invariants. Remediation: one public catalogue-selection policy reused by both paths; validate partial updates against persisted selection. Regression risk: existing invalid values require an explicit repair/report policy; do not reject every unrelated profile update without a migration strategy.

### F08 — Medium: remote database restore is advertised but not transport-compatible

Evidence: `SystemController.restore` expects Buffer; `main.ts` has the octet-stream/SQLite Buffer content-type parser commented out and defaults to 2 MiB while `SystemService.restore` allows 64 MiB. `apps/admin/nginx.conf.template` allows 64 MiB. The service reports enablement solely from `ALLOW_REMOTE_DATABASE_RESTORE`.

Impact: enabling the flag does not provide the expected binary restore path; large uploads hit a different limit. Default production compose does not enable remote restore. Remediation: keep it explicitly unavailable until a bounded Fastify binary adapter and maintenance-mode recovery tests exist. Regression risk: uploaded snapshots, active connections and audit continuity.

### F09 — High for the alternate topology: root/Coolify Compose references an absent app

Evidence: both `docker-compose.yml` and `docker-compose.coolify.yml` define `student-v2` with `dockerfile: apps/student/Dockerfile`; that path is absent. Production LAN uses `docker-compose.production.yml` plus `deployment/lan/compose.yml`, which compose the shared Admin application instead. `.github/workflows/coolify-deploy.yml` verifies Compose syntax, then calls a webhook; syntax validation does not prove Dockerfile existence/build success.

Impact: those two stack build paths cannot build from this checkout. Remediation: align supported topologies with the shared application or explicitly deprecate unsupported profiles; add referenced-context/Dockerfile validation. Regression risk: external host routing still pointing to a separate student service. LAN deployment is not proven broken by this finding.

### F10 — Medium: module public imports do not enforce data ownership

Evidence: `StudentsModule` registers AttendanceRecord/Session and historical learning/request entities; `AttendanceModule` registers class/group/dorm repositories; `WorkflowsModule` registers attendance, student, class and dorm repositories. `WorkflowsService` is 1,694 lines, TimetableService 1,690, AttendanceService 1,461 and ChatService 1,064 at the baseline. `WorkflowsService.setDormAssignments` duplicates DormitoryService placement logic but does not perform the same move-between-rooms behavior; current WorkflowsController does not expose that retained method.

Impact: separate writers/policies for the same records and broad regression surfaces. The line counts are supporting evidence, not proof that size alone is defective. Remediation: establish writer ownership and delegate legacy methods through public use cases; split by behavior inside current folders before extracting packages. Regression risk: hidden consumers and historical API contracts. Do not delete retained code based only on route reachability.

### F11 — Low: root install contract and workspace coverage drift

Evidence: `package.json`/`package-lock.json` have root bcrypt dependencies despite `AGENTS.md` declaring an orchestration-only manifest. `docs-viewer/package.json` defines tests/build, but `tooling/workspace/projects.json` omits it; root verify consequently does not validate it. Existing architecture documents still include some absent Student application entries.

Remediation: establish the root dependency consumer and viewer lifecycle, then correct manifest/DAG/documentation in a dedicated maintenance change. Regression risk: an undiscovered utility using root bcrypt; avoid incidental lockfile/workspace conversion.

### F12 — Low: development build artifacts are tracked

Evidence: `git ls-files` includes 1,361 files under `apps/api/dist-dev/`; `apps/api/tsconfig.dev.json` declares that directory as development compiler output, and `nest-cli.json` enables deleteOutDir. Production `dist/` and Admin `dist/` are not tracked. This is confirmed repository hygiene debt, not evidence that production runs stale development output.

Impact: development rebuilds can create broad unrelated Git churn and duplicate source/navigation evidence. Remediation: verify whether any tooling consumes checked-in development output, then separately propose generated-artifact cleanup and ignore enforcement. No files were deleted in this phase. Regression risk: an undiscovered utility depending on prebuilt dev output.

## Potential issues requiring further evidence

| ID / severity | Evidence and plausible impact | Required confirmation / remediation |
| --- | --- | --- |
| P01 / Medium | `SystemService.restore/resetSystemData` destroys/reinitializes the shared DataSource or disables connection-level FK checks. The restoring flag protects competing restores, not all API traffic; reset runs generic DELETEs and checks quick_check after commit. | Disposable concurrent-request and failure-injection tests; no production reset. Add maintenance admission control, foreign_key_check, explicit reset registry and verified recovery boundary. Runtime corruption is not claimed. |
| P02 / Medium | `attendance/attendance-transaction.ts` serializes only callers of that helper; onboarding, imports and classes use independent TypeORM transactions on the same SQLite connection. | Exercise concurrent writes across domains. Consolidate SQLite write admission behind a host-owned unit of work if failures occur. No repository-wide concurrency benchmark was run. |
| P03 / Medium | `ClassesService.list/load` eagerly loads class books and full enrollments; `DormitoryService.listRooms` loads student assignments just to count; `RegistrationService.students` returns an unpaginated list; dorm search uses `%term%` LIKE. | EXPLAIN QUERY PLAN on synthetic representative sizes and end-to-end load tests. Use scoped projections/counts and cursor pagination. Query slowness/index insufficiency is not proven by source alone. |
| P04 / Medium | `RealtimeController.events` authenticates once; heartbeats merge with user hub stream without periodic session/work-context revalidation. | Test revocation/deactivation of an already-open stream and whether sensitive events continue. Add bounded stream lifetime or server-side revalidation/disconnect. Cross-user stream leakage is not claimed. |
| P05 / Medium | `NotificationsService.createForUser` uses check-then-save dedupe; fan-out is Promise.all; `TimetableService.notifyChange` swallows notification creation failure after commit. SSE is in-memory; no durable worker/outbox execution was found in API source. | Test concurrent dedupe and crash between commit and notification creation. Define retryable outbox and bounded delivery if reliable notification guarantees are required. Push provider failure already preserves saved notification state. |
| P06 / Medium | `LoggingInterceptor` starts after guards, logs raw request URL and error message, accepts caller request ID; exception filter does not consistently include that ID. Readiness runs SELECT 1; no production latency/error/disk/backup-age metrics were established. | Test rejected-request correlation/redaction; identify operational SLOs and monitoring. Introduce pre-guard request IDs, safe structured logs and storage/backup alerts. Actual sensitive-log disclosure is UNKNOWN. |
| P07 / Medium | Registration and dormitory failure-path coverage requires an assertion map. Correction from the later persistence audit: dedicated Workflows tests exist at `apps/api/src/modules/workflows/workflows.service.spec.ts`; the initial named-file search under `apps/api/test` missed them. Security and journey scripts also exercise some flows, so test placement alone does not establish absent coverage. | Map assertions to failure/tenant matrices before adding tests; prioritize F01–F07 rather than snapshot or implementation-mirroring tests. Quantitative backend coverage is UNKNOWN. |
| P08 / Low | Dormant backend modules, excluded registration UI, legacy wrappers and Moshaver/Bastak/Zanin naming coexist (`main.ts` title/cookie fallback versus auth config). | Consumer/build/route inventory before removal or renaming. No blanket unused-code, unnecessary-abstraction or branding defect claim. |

## Performance, integrity and operating constraints

SQLite WAL supports concurrent readers but one writer; better-sqlite3 is synchronous and shares process resources with hashing, import loops and live HTTP/SSE. The supported production profile is one API replica with a persistent volume. There is no source basis for a requests-per-second capacity claim. Scale first by measuring event-loop lag, p95/p99, transaction wait time, busy errors, database/backup size and roster cardinalities; never add replicas against a shared SQLite file as an incidental change.

Integrity protections already present: student/user uniqueness, national-code uniqueness, scoped role-assignment triggers, FK enforcement, occurrence/receipt/revision machinery and transactional timetable publication. The latest `1730700000000-DatabaseRelationshipIntegrity.ts` migration preflights ambiguous ownership, preserves DDL/indexes/triggers during rebuilds, repairs optional dangling links, performs foreign_key_check before commit and restores pragmas. Its `down()` deliberately throws: restoration requires a pre-migration backup. This is a documented irreversible repair, not automatically a bad migration. Startup migrations make schema work part of service restart availability; rehearse on restored representative data before release.

No production database, real personal data or secret configuration was read. Tenant ownership of a student is primary organization; identity can have multiple memberships. Any target model must preserve that distinction rather than making membership alone sufficient for privileged data access.

## CI/CD and deployment assessment

`.github/workflows/continuous-integration.yml` orders docs/workspace/bootstrap/architecture/contracts/CMB/verify/security/parity/coverage/browser checks and production container validation; CI Gate requires quality and containers. Component workflows additionally test fresh SQLite migrations and a disposable security matrix. Workflow definitions are evidence of intended checks, not proof of current remote success or branch protection.

`release-promotion.yml`, `lan-production.yml` and `.github/deployment/server-deploy.yml` describe develop→main promotion and exact-tested-SHA dispatch to the private deployment repository. The private template verifies successful source CI, current main and SHA before a trusted self-hosted deployment. `scripts/deploy/lan.sh` and `docs/operations/github-cicd.md` define backup/readiness and release receipt. Source dispatch success alone is not production health. Live private workflow parity, protection/review configuration, backup retention/off-host copies and recovery drills remain UNKNOWN.

API Dockerfile uses build/prod-deps/runtime stages and a non-root node runtime. Admin uses Nginx static SPA fallback, same-origin API/health proxy, SSE buffering disabled and security headers. LAN adds TLS/redirect. Restart deployments can interrupt requests/SSE; no zero-downtime guarantee exists. Container tags are version pinned but not content digests. No image vulnerability scan result is asserted here.

## Validation record

Successfully executed at the audited baseline: `workspace:check`, `workspace:list`, `workspace:plan -- build`, `architecture:check`, `cmb:compatibility`, `contracts:check`. Architecture tolerates the four listed entity cycles; a passing gate does not mean zero coupling. Contracts check reports 16 roles, 162 declared capabilities, 158 backend capabilities and 30 guarded frontend capabilities; these counts do not prove full endpoint contract equality.

Two disposable service-level assertions passed: out-of-context SchoolAccess membership acceptance and the schedule import later-row failure path. They used mocks and no database/secrets. Full `npm run verify` and documentation verification results are recorded in [refactor-plan.md](refactor-plan.md). Docker builds, real browser journeys, production benchmarks, a full vulnerability audit and private deployment health were not part of this local execution. No application code was changed to obtain passing checks.
