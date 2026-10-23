# Mobile interaction and performance audit

**Scope:** current `apps/admin` source after the feature reorganization. This is source and automated-test evidence, not a device benchmark.

## Implemented safeguards

| Area | Evidence | Result |
| --- | --- | --- |
| Shell breakpoints | `useViewportShell` classifies widths below 768px as mobile; regression coverage includes 320, 360, 390 and 430px. | Phone chrome changes without remounting page state. |
| Navigation performance | `useDevicePerformance` selects `reduced` for reduced motion, Data Saver, slow connection, low memory or low CPU. `AdminMobileBottomNav` only enables backdrop blur for `enhanced`. | Decorative blur is removed on constrained Android/browser conditions. |
| Navigation interaction | `AdminMobileBottomNav` has 56px primary controls, capability-derived destinations, visible focus rings and a `ResponsiveDrawer` for secondary routes. | Primary destinations stay compact and the secondary navigation is focus-managed. |
| Sheets and dialogs | `ResponsiveDrawer` uses Radix Dialog, a 44px close target, safe-area padding, a sticky heading, focus containment and `motion-reduce:animate-none`. | Bottom-sheet and desktop drawer use one accessible contract. |
| Scroll ownership | `SharedPageViewport` owns normal vertical page scrolling. Tables retain horizontal containment; only specialist directories own bounded vertical scroll. | Avoids common nested-scroll traps and clipped long content. |
| Mutation feedback | Attendance, exit, dormitory, SMS and follow-up flows use busy states, server-authoritative mutations and shared toast/error feedback. | No offline mutation queue was introduced. |

## Audited live mobile workflows

- Attendance: existing request IDs, conflict protection, review and sticky submission remain authoritative.
- Students: `ManagementMasterDetail` keeps its intentional bounded desktop directory scroll; stacked phone views retain natural page scrolling.
- Schedule: mobile weekday tabs and lesson cards use existing schedule state and API semantics.
- Dormitory: room/assignment workflows use `ResponsiveDrawer`, loading/error states and capacity guards.
- Exit permissions: confirmations distinguish approval from audited physical departure/return; search, status filters and busy states remain intact.
- Notifications: mobile tabs have 44px targets, with URL-backed filters and capability-scoped inbox access.

## Validation

- `viewport-shell.test.ts`: mobile breakpoints including 320, 360, 390 and 430px.
- `AdminMobileNavigation.test.tsx`: role-filtered destinations, drawer accessibility and performance-profile blur behavior.
- 2026-10-18 focused interaction run: the two suites above passed (2 files, 9 tests).
- The Admin-wide typecheck is currently blocked by the active feature reorganization: moved source files use explicit local `.ts` import suffixes while the current TypeScript configuration does not enable `allowImportingTsExtensions`. Lint and build were not run after that blocking gate.
- Earlier focused feature, typecheck, lint, build and accessibility validation remain recorded in `MOBILE_FEATURE_MIGRATION.md`; they predate this reorganization state.

## Remaining evidence and risks

- No physical Android or browser performance profile was captured; no numerical performance claim is made.
- Test real keyboard/virtual-keyboard scrolling, safe-area behavior, landscape and browser zoom at 320–430px.
- The current router does not mount several implemented source modules (including follow-up, chat and notifications page); do not enable them without a product and authorization decision.
- Large spreadsheet bundle warning and PostCSS source-metadata warning remain outside this audit's changes.
