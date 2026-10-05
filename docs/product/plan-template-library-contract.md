# Organization plan-template library contract

Status: proposed product contract. Owner: education/planning.

## Purpose

An organization can keep reusable weekly or multi-day plan blueprints without
using a real student's plan as an accidental template. Applying a template
always produces a new plan copy; later template edits never change delivered
student plans.

## Ownership and lifecycle

Each template belongs to exactly one organization and has one immutable
published version at a time. A revision creates a new version rather than
overwriting the version used to produce prior plans.

| State | Meaning |
| --- | --- |
| `DRAFT` | Editable by authorized staff; cannot be applied. |
| `IN_REVIEW` | Ready for review; editable only by an author or organization administrator. |
| `PUBLISHED` | Available to apply; immutable. |
| `ARCHIVED` | Hidden from normal selection; retained for provenance. |

Template fields are: title, description, education-type/grade/track tags,
subject tags, task blueprint, target day offsets, author, version, lifecycle
state, and timestamps. Task blueprints retain the same rich Planner fields as
shared plans, excluding task progress and a concrete exam assignment.

## Authorization

- `plan_templates.read`: view templates in the active organization.
- `plan_templates.manage`: create drafts and revise/archive owned templates.
- `plan_templates.publish`: publish or archive a reviewed template.
- Organization and platform administrators can manage/publish within their
  authorized organization scope; advisors can manage drafts for organizations
  they are assigned to. Teachers can read only.

The API verifies organization scope server-side for every template ID and
application target. UI visibility is only a convenience.

## Apply flow

1. Choose an organization-scoped published template.
2. Select one or more students using the existing grade/type/track-aware
   selector.
3. Choose the first destination date.
4. Request the existing cohort preview. It reports existing plans, workload,
   capacity, and time/exam conflicts before any write.
5. Explicitly choose preserve or overwrite and acknowledge overwrite.
6. Apply transactionally. Each created plan stores template ID and version in
   provenance metadata; the audit event stores template/version, recipients,
   preview policy, and result counts.

## API contract

```text
GET    /plan-templates?organizationId=&state=&gradeId=&educationTypeId=&trackId=  (implemented: organization list and Admin library view)
POST   /plan-templates                                                   (implemented: create draft from the current Planner range)
PATCH  /plan-templates/:id              # draft or creates next revision
POST   /plan-templates/:id/publish                                        (implemented: authorized Admin action)
POST   /plan-templates/:id/archive
POST   /plan-templates/:id/preview-apply
POST   /plan-templates/:id/apply
GET    /plan-templates/:id/versions
```

`preview-apply` and `apply` accept the same recipient/date/conflict payload as
plan-range sharing. `apply` returns copied/skipped counts and never mutates a
completed student task.

The currently delivered Admin creation flow serializes each visible plan as a
zero-based day offset and retains task blueprint fields only. It deliberately
removes task IDs and completion data. Template application, revision,
archiving, metadata filters, and immutable version history remain pending;
the UI must not represent them as available.

## Acceptance evidence

- API tests prove tenant isolation, lifecycle transitions, immutable published
  versions, apply provenance, authorization, conflict handling, and rollback.
- Admin tests cover empty/loading/error states, RTL tags, keyboard selection,
  preview, overwrite acknowledgement, and version display.
- An authorized browser journey verifies advisor creation, administrator
  publication, multi-student application, and Student-visible copied plans.

## Current integration audit (2026-09-29)

Verified together: the API module is composed by the application, the
`plan_templates` migration grants the documented capabilities, Admin opens the
organization-scoped library from Planner, and draft creation/publishing use
the same API contracts. Focused API service tests, API build, Admin typecheck,
and Planner tests pass.

Not yet delivered: revision/archive, filtering by education metadata,
template preview/apply, and Student-visible template provenance. These remain
intentionally absent from the Admin controls and API routes; a published
template cannot yet be applied to a cohort.
