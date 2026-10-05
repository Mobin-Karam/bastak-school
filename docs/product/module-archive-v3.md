# V3 product-module archive

The v3 product is a seminary/school operations platform. This archive is deliberately
limited to product code; CMB platform modules remain reusable and active.

## Disabled at runtime

- personal study plans and plan templates
- study-session timers and task completion
- spaced-review/mistake notebook flows
- relaxation/audio player flows
- counseling-specific analytics built from those flows

`AppModule` no longer composes the corresponding API modules, and the Admin routes
and navigation for planner, plan templates, and learning have been removed. Source is
retained temporarily for data migration and rollback; it is not a supported v3 API.

## Retained product foundations

Users and access, organization-scoped admissions, students, curriculum/catalog,
classes, assessments, communications, guardians, notifications, reports, audit,
and permission requests remain active. They are the migration foundation for the
student record, attendance, dormitory, leave, correspondence, and workflow modules.

## Account policy

New accounts authenticate with a normalized Iranian mobile number and password.
Platform and organization administrators create accounts through the same policy.
Student self-registration remains disabled by default and is enabled only by the
platform policy plus the relevant organization's delegated enrollment policy.
