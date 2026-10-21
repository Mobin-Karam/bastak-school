# Bastak School Admin mobile design-system modernization plan

**Status:** proposed implementation plan based on `MOBILE_UI_AUDIT.md`. It preserves current APIs, role/capability rules, stored preferences, and business workflows.

## Product principles

1. Persian/RTL is the primary layout, reading, number/date and action-order experience; English/LTR remains supported by the same components.
2. One capability-aware feature flow serves phone, tablet and desktop. Presentation can adapt; data, authorization, mutations and route contracts do not fork by device.
3. Phone defaults to one task at a time: summary, filter, list, detail/edit sheet, confirmation. Dense desktop tools are progressively disclosed, not squeezed.
4. The main viewport owns vertical scroll. A component may own a bounded scroll region only for a specialist operational grid, with a documented reason and keyboard behavior.
5. Reuse existing libraries and primitives. `@moshaver/admin-workspace-ui` stays pure logic; Admin owns React, localization, roles, API and rendering.

## Target architecture

```text
app/layout
  public shell + viewport + responsive shell model
  navigation config (capability metadata) -> phone/tab/desktop renderers

shared/ui
  foundations: tokens, locale, theme, motion, safe-area
  primitives: button, field controls, feedback, card
  patterns: page header, collection, toolbar, overlay, form section, action bar

features/<name>
  route/page -> feature composition -> feature API/query/form model
  never owns a second shell, authorization model, token system or generic dialog

packages/admin-workspace-ui
  portable preference/search view-models only
```

## Foundation contract

| Concern | Proposed contract | Current anchor |
| --- | --- | --- |
| Viewports | Phone `<768`, tablet `768–1199`, desktop `>=1200`; use content needs rather than device/UA detection | `useViewportShell`, `TabletShell`, `DesktopShell` |
| Spacing | Retain Tailwind scale; define page padding and section gaps as shared recipes rather than feature literals | `styles/globals.css`, core Card/Field |
| Targets | Minimum 44x44px for touch actions; paired labels for destructive/icon actions | Button and drawer close already meet it |
| Insets | Shell, mobile nav, sheets, toasts and sticky action bars use logical safe-area padding | `MobileShell`, `ResponsiveDrawer`, globals |
| Typography | Persian-first hierarchy with clamped page titles and numeric/date `fa-IR` display; transport dates remain unchanged | locale/date components |
| Color/theme | Use existing semantic CSS variables (`surface`, `ink`, border, destructive) and role accents; no feature hex palette | theme and globals |
| Motion | `prefers-reduced-motion` and current `useDevicePerformance` remove decoration/backdrop work but never controls | Admin shell/global selectors |
| Direction | Prefer `start/end`, `ms/me`, `ps/pe`, logical border/radius; isolate unavoidable directional media/art | RTL shell and drawer |

## Pattern decisions

| Need | Required pattern | Avoid |
| --- | --- | --- |
| Route/page | `SharedPageViewport` + a consistent page heading, context, primary action and state area | Feature-owned full-height scroll containers by default |
| Record collection | `DataTable`: desktop table, phone cards, shared query/selection/detail contract | Separate phone API/query and a visual table compressed below readable width |
| Detail/create/edit | `ResponsiveDrawer` for operational forms/details; it becomes a phone bottom sheet and desktop side drawer | Duplicated mobile/desktop form trees or arbitrary modal choice |
| Small confirmation | Existing modal/dialog contract, explicit destructive label and focus return | Browser confirms or hidden destructive icon action |
| Complex specialist grid | Bounded horizontal region, sticky context, accessible alternate summary/detail route | Forcing a timetable/roster into generic cards without task validation |
| Forms | Existing `Field` relation, labels/help/error, top error summary for long forms, draft/discard feedback | Placeholder-only labels, visual required marker with no semantic state |
| Async states | Loading skeleton/status, actionable error+retry, empty explanation+primary action, disabled/busy mutation control | Blank panels, spinner-only feedback, optimistic claims without rollback |
| Mobile action bar | One primary action, secondary actions in menu/sheet; pad above bottom nav and safe area | Fixed actions obscured by keyboard, toast or bottom navigation |

## Delivery phases

### Phase 0 — safety baseline (P0)

1. Complete the current layout path migration as a focused change; make public imports canonical and preserve compatibility only during migration.
2. Add a viewport/role acceptance harness using existing Vitest/a11y/Playwright tooling: 320, 360, 390, 430, 768, 1024 and 1280px; Persian RTL plus English LTR; light/dark; reduced motion.
3. Define a route-to-role/capability smoke matrix from `admin-navigation.ts` and `router.tsx`. Refresh `/me/context` after role/organization changes.

**Exit criteria:** no duplicated shell source of truth; shell tests/typecheck pass; every route has a named owner and expected capability; baseline screenshots/interactions are stored as CI artifacts or documented manual evidence.

### Phase 1 — shared pattern consolidation (P1)

1. Publish `PageFrame`, `PageHeader`, `MobileActionBar`, `FormSection`, `AsyncState`, and overlay selection guidance by composing, not replacing, existing primitives.
2. Make `DataTable` the default for eligible CRUD collections. Create a documented exception list for timetable, attendance roster, planner canvas, chat and bookshelf.
3. Designate `ResponsiveDrawer` as the standard adaptive operational detail/editor. Deprecate duplicate feature-level sheet/modal patterns only after each caller migrates.
4. Add RTL logical-style lint/search checks and a shared overflow/scroll ownership test recipe.

**Exit criteria:** shared components carry no product authorization; new work follows a written pattern; migrated list maintains filtering, pagination, row action, detail and error semantics on both presentations.

### Phase 2 — high-value workflow migration (P1)

Order work by operational frequency and risk:

1. Students, users, organizations and guardian workspaces.
2. Attendance, leave/exit permissions and dormitory.
3. Classes, class groups, books and schedule.
4. SMS, notifications and chat.
5. Account settings and dashboard action queues.

For every feature, retain its existing API calls, query keys, capability gate, organization/student scope, destructive confirmation, and data-transfer contract. Move only presentation composition.

**Exit criteria per feature:** one responsive route flow; phone task completion with no horizontal page scroll; keyboard/screen reader matrix passes; all loading/empty/error/offline/disabled states demonstrated; typecheck/tests pass.

### Phase 3 — specialist and deferred surfaces (P2)

Planner, timetable, assessments, reports, system administration and registration need product-specific discovery before migration. Confirm whether each source module is currently routed/live; then set task-specific success metrics rather than applying generic cards.

**Exit criteria:** specialist grids keep context and actionable alternatives at phone widths; platform/system actions are safely constrained rather than merely warned about; activation of any coming-soon route is explicitly approved.

## Feature-level acceptance checklist

Use this checklist for each live feature family from the audit.

- [ ] Role/capability and active organization context are preserved; no role-name-only UI gate is introduced.
- [ ] 320–430px RTL flow completes the primary task without clipped primary action, accidental horizontal page scroll, or hidden keyboard focus.
- [ ] Tablet and desktop use the same route/query/mutation model, not a device-specific endpoint.
- [ ] Page has visible loading, empty, error/retry, unauthorized, offline and busy/disabled states where applicable.
- [ ] Inputs have labels, help/error association, valid touch target, correct Persian numeric/date presentation and logical direction.
- [ ] Overlays trap focus, close with Escape/backdrop where appropriate, restore focus, respect safe areas and avoid bottom-nav/keyboard collision.
- [ ] Collections preserve search/filter/sort/pagination/selection/export rules and offer card/table parity or an approved exception.
- [ ] Contrast, dark mode, reduced motion, zoom/reflow, keyboard navigation and screen-reader labels are verified.
- [ ] Existing focused tests are updated, `npm run typecheck`, applicable `npm test`/`npm run test:a11y`, and browser/device evidence are recorded.

## Dependency and ownership map

| Layer | May depend on | Must not depend on |
| --- | --- | --- |
| Feature page | shared UI, feature model/API, public contracts, capability hooks | another feature's private implementation, shell internals |
| Shared UI | locale/theme/utilities and generic UI libraries | feature APIs, education entities, roles or permissions |
| Layout/navigation | auth context/capability metadata, shared UI | individual feature API implementation |
| `admin-workspace-ui` | JavaScript platform types only | React, routes, translations, API, authorization, business entities |
| API/backend | unchanged by this programme | presentation-driven schema/endpoint changes |

## Validation matrix and performance guardrails

Run source gates from `apps/admin`: `npm run typecheck`, relevant `npm test`, `npm run test:a11y`, `npm run lint`, and `npm run build`. Use `npm run test:e2e` for changed flows when a stable environment is available.

Separately verify Chrome Android and Safari iOS at 360/390/430px, a 768px tablet and a 1280px desktop; Persian RTL plus English LTR; light/dark; reduced motion; on-screen keyboard; 200% zoom; slow network/offline. Record that as browser/device evidence, not as a consequence of a build passing.

Measure before optimizing. Keep initial route code-splitting, pagination and query caching behavior; profile dashboard, planner, timetable, chat and shelf surfaces on a constrained phone before introducing virtualization or new dependencies.

## First implementation slice after Phase 0

After the shell migration is stable, migrate **Students directory collection presentation only** to the shared `DataTable` card/table contract if its current behavior is not already fully on it. Preserve filters, selected student, pagination and desktop master/detail behavior; use `ResponsiveDrawer` only for a narrow-phone detail if source inspection confirms it does not already have one. This is reversible, capability-safe and exercises the core mobile patterns without API changes.
