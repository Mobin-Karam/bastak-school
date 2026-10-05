# Platform dashboard contract

The Admin home is an operational workspace, not a chart gallery. It is designed
for a returning operator who needs to answer three questions quickly:

1. What has changed since I last looked?
2. What needs a decision or follow-up now?
3. Where do I go to complete that work?

## Evidence-informed design direction

The implementation takes interaction patterns, not source code, from a small
set of representative systems:

- Twenty's view model separates navigation, saved view configuration, detail
  layouts and command actions. We use that separation for dashboard layout
  preferences: the reusable package stores only widget position/density while
  Moshaver owns routes, permissions, data and copy.
- GOV.UK's dashboard guidance recommends high-level indicators, a clear
  hierarchy and concise explanation rather than a collection of unexplained
  visualizations. The dashboard therefore leads with the role's work queue and
  uses metrics as context, not as a destination by themselves.
- The data-visualisation guidance maps the question to the visual. This first
  slice deliberately does not introduce charts until the product has a
  time-series, comparison, distribution or ranking question with an
  authorized API contract.

Sources: [Twenty layout overview](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docs/developers/extend/apps/layout/overview.mdx),
[GOV.UK dashboard guidance](https://brand.design-system.service.gov.uk/data/dashboards/),
[GOV.UK data-visualisation guidance](https://brand.design-system.service.gov.uk/data/),
[Carbon dashboard guidance](https://www.carbondesignsystem.com/building-blocks/data-visualization/dashboards),
and [Atlassian's design-system foundations](https://atlassian.design/get-started/about-atlassian-design-system).

### Adopted and deliberately deferred

| Pattern observed                                         | Decision for the platform dashboard                      | Why                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Saved view/layout state (Twenty)                         | Adopted for density and optional supporting widgets      | Operators can tailor scan density without changing data visibility or authorization.                                   |
| Work-first hierarchy (GOV.UK, Carbon)                    | Adopted: actionable queue before supporting context      | A platform operator returns to decide and resolve work, not merely watch KPIs.                                         |
| Reusable foundations and product composition (Atlassian) | Adopted: neutral preference package plus product adapter | Shared code has no routes, roles, API clients, copy, or education data.                                                |
| Drill-down/exploration charts (Carbon)                   | Deferred                                                 | There is no approved time-series/comparison API contract yet; a chart without a decision question would be decorative. |
| Cross-widget linked filters                              | Deferred                                                 | Current widgets share no compatible analytical dimension. Add only with an authorized, documented filter contract.     |

## Layout and flow

Every primary navigation section has a purposeful landing. Platform home is
role-aware; Education and System keep their existing operational overviews;
Communication and Management use a compact directory plus a server-authorized
filtered work queue. A primary-rail click therefore never silently redirects
an operator into an unrelated leaf screen.

| Primary section | Landing                | Primary decision                              | Secondary tools                                       |
| --------------- | ---------------------- | --------------------------------------------- | ----------------------------------------------------- |
| Platform        | `/admin`               | role-relevant operating queue                 | role quick actions and platform health when permitted |
| Education       | `/admin/education`     | assessment and learning operations            | planner, content, catalog tools                       |
| Communication   | `/admin/communication` | unread and sync work                          | live activity, conversations, notifications           |
| Management      | `/admin/management`    | recovery, task, retry, and inactive-user work | students, access, organizations, follow-up            |
| System          | `/admin/system`        | service health and controlled operations      | release, backup, audit, account settings              |

```text
Desktop (>= 1280px)
┌──────────────────────── header: role, context, freshness, density, refresh ────────────────┐
├──────────────────────── summary metrics (2 columns -> 4 columns at 2xl) ────────────────────┤
├──────────────────── primary operational work ────────────────────┬─ secondary (352px) ──────┤
│ server-authorized operational queue (one internal list)           │ platform health*         │
│                                                                     │ next actions             │
└───────────────────────────────────────────────────────────────────┴─────────────────────────┘

Narrow (< 1280px): header actions wrap, metrics stay 1/2 columns,
primary work precedes secondary context, and the page shell remains the only
vertical scroll owner.
```

`*` Platform health is visible only for the platform-admin data context.

### Per-widget flow

| Widget            | Actor/entry                                 | Primary action                             | Success/return                                        | Empty/error                                              |
| ----------------- | ------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------- |
| Summary metrics   | any authorized role, Admin home             | refresh current data                       | values update in place                                | dashboard retry state                                    |
| Operational queue | any role with an eligible source capability | open the returned deep link                | route owns the next action                            | priority filter explains no matches; retry keeps context |
| Next actions      | active role                                 | go to authorized destination               | destination owns completion                           | hidden when no authorized actions exist                  |
| Platform health   | platform admin                              | inspect operations center via next actions | return to home retains layout preference              | status is explicit; no invented health data              |
| Upcoming schedule | advisor, teacher, or mentor                 | read authorized upcoming work              | optional Assessments header action opens the schedule | explicit no-schedule state                               |
| Plan health       | advisor or mentor                           | inspect today’s task completion            | Planner link appears only with `plans.read`           | explicit no-plan state                                   |
| Extra tools       | active role                                 | expand permitted tool handoffs             | target route owns the next action                     | only appears when more tools are available               |
| Shared layout     | returning operator                          | change density or widget visibility        | URL preserves the same layout intent for a recipient  | unknown widget ids are ignored by the host               |
| Layout controls   | returning operator                          | show/hide supporting widgets or reset      | local preference persists per role                    | primary queue and metrics remain available               |
| Assessments entry | role with `exams.read`                      | open Assessments from the dashboard header | returns through normal route navigation               | omitted for roles without the capability                 |

## Reuse boundary

`@moshaver/admin-workspace-ui` is framework- and domain-neutral. Its dashboard
API validates/persists a view id, density, ordered widget ids and zones
(`full`, `primary`, `secondary`) through an injected storage adapter. It does
not know React, routes, roles, permissions, API clients, education data or
translated text.

The Admin host composes that generic model through:

- `shared/ui/dashboard-workspace.tsx` — generic React hierarchy and responsive
  grid slots;
- `features/dashboard/model/dashboard-layout.ts` — Moshaver's role/widget
  adapter and optional local preference persistence;
- `features/dashboard/*` — capability-filtered data, localized text, deep
  links and platform health interpretation.

The operational queue remains a product capability: the API removes items the
active context is not permitted to see and applies student-scope checks before
the frontend receives a deep link. The reusable package never decides which
widgets or records an operator may access.

Another product can use the package with its own widget renderer and storage
adapter without importing Moshaver business logic.

The package also exports a transport-neutral view state (`density` and hidden
host-widget ids). The Admin URL adapter maps it to `dashboard-density` and
`dashboard-hidden`. A shared URL changes presentation only: it cannot request
new records, add a widget the host does not define, or grant a capability.

## RTL, LTR and accessibility

- The shell uses logical layout utilities; secondary content is a grid column,
  not an absolute left/right panel.
- Dates/numbers use the active locale; release/version values remain LTR.
- Metric and action targets have visible labels; icon-only refresh has an
  accessible name.
- Density is a labelled segmented control, keyboard reachable and persisted
  per role view.
- Optional supporting widgets use native checkbox controls inside a labelled
  layout disclosure; reset restores the product-defined view for that role.
- The primary queue remains before secondary content in DOM order on narrow
  screens. No widget creates a competing full-page vertical scroll container.
