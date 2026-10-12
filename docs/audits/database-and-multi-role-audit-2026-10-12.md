# Database, relationships, and multi-role audit

Date: 2026-10-12. Scope: current working tree, including existing uncommitted changes.
The original audit changed no application code or database. A subsequent authorized
implementation addresses the findings; validation explicitly migrated disposable databases only.

## Remediation status

All ten findings have implementation fixes and regression coverage in this working
tree. The historical findings below describe the audited pre-fix behavior.
UI changes were described to the user before editing: multi-role account selection
and preservation, and tenant-valid work-role selection during school switching.
See [rollout and compatibility notes](../operations/database-multi-role-integrity-rollout.md)
for migration behavior, data conflict handling, and deployment/rollback steps.
Deployed database contents and migration state remain unverified. The API applies
configured startup migrations when it starts; validation commands used disposable
databases.

## Implementation validation

- `npm run verify` passed across the workspace, including API lint/build and
  **378 tests**, Admin typecheck/format/lint/build and **505 tests**, its six
  accessibility checks, CMB package/reference tests, and Student core build/tests.
- Workspace check, project listing, and build planning completed successfully.
- Architecture check and its self-test, API contracts, and CMB compatibility passed.
- CMB publish preparation checks and packing passed; artifacts were staged only,
  not published.
- All **117 migrations** ran successfully through the normal TypeORM migration CLI
  against a disposable fresh SQLite database.
- The disposable HTTP security matrix passed, including multi-role capability
  isolation, cross-tenant denials, CSRF, revoked relationships, and revoked sessions.
- New migration-built SQLite tests cover all 106 entity mappings, required-column
  nullability, declared foreign keys and delete policies, uniqueness and ownership
  constraints, populated upgrades, preservation of children/indexes/triggers,
  rollback on ambiguous ownership, and historical student-profile provisioning.
- New Admin tests cover retaining three roles during profile edits, removing only
  the selected role, multi-role creation, successful/failed work-context refresh,
  and desktop/mobile keyboard and automated accessibility for role selection.
- `git diff --check` passed. Existing unrelated changes were retained. Two small
  validation blockers in those changes were corrected: the timetable service now
  imports entity files directly, and the date picker test uses its mobile parameter.

The workspace still emits existing non-failing lint and bundle warnings. Validation
used disposable databases; deployed data and migration state remain UNKNOWN. See
[the rollout notes](../operations/database-multi-role-integrity-rollout.md) before
applying the migration to deployed data. Ambiguous student ownership or conflicting
relationship decisions cause an atomic migration failure rather than a guessed merge.

## Original audit conclusion

The RBAC model supports two or more roles per user. `SCHOOL_SUPERVISOR` and
`TEACHER` can coexist on the same school membership. The user APIs accept arrays
of role codes, and authorization can select a work role through `X-Work-Role`.
The Admin account form currently only creates/edits one role, however, and saving
an existing multi-role account can discard its other roles.

The system cannot be considered free of database or authorization issues. The
findings below include reproduced authorization failures and constraints missing
from a database built with the actual migration chain.

## Findings

### 1. High: relationship creation permits a student from another school

Evidence: [RelationshipsService.create](../../apps/api/src/modules/relationships/relationships.service.ts#L76)
checks the actor's organization access and the source user's membership, but loads
the target student by ID without validating the student's organization or target
membership. A School A manager can create a School A relationship to School B's
student. The source user can accept it; student authorization then accepts any
active relationship without filtering its organization.

Validation: a service probe created this cross-school relationship successfully.
The probe used controlled repository doubles; no production endpoint was called.

Fix: load and validate the target student's tenant ownership before creation,
and enforce tenant, current membership, and relationship policy when consuming
the relationship. Regression: School A manager linking School B student must fail.

### 2. High: a user can reactivate their own revoked relationship

Evidence: [RelationshipsService.update](../../apps/api/src/modules/relationships/relationships.service.ts#L163)
allows the source user to choose ACTIVE or REJECTED regardless of previous
status. After a manager revokes a link, its source can call the accept/update
endpoint and restore access.

Validation: a service probe changed REVOKED to ACTIVE as the source user with no
management capability.

Fix: self acceptance/rejection must be restricted to PENDING invitations with
current eligibility. Restoring revoked relationships must require an authorized
manager. Regression: accepting a revoked link returns a denied/conflict response.

### 3. High: roles from one school can affect authorization in another

Evidence: [buildAuthorizationContext](../../packages/cmb/authorization/src/index.js#L6)
filters capabilities by requested organization but returns `allRoles` from all
organizations when no work role is supplied. A requested work role is also
validated against all assignments rather than its assignment in the selected
organization. [canAccessStudent](../../apps/api/src/modules/authorization/authorization.service.ts#L236)
uses privileged role names plus organization IDs to allow broad student access.

Validation: a user who is TEACHER in A and PRINCIPAL in B, requesting organization
A without a work-role header, received roles TEACHER and PRINCIPAL and was allowed
to read an unrelated student in A. Only A's `students.read` capability was needed.

Fix: derive effective roles and capabilities from the same eligible assignments;
validate the requested role/organization pair. Keep the account's full assignment
catalog separate from effective request authority. Regression: principal authority
in B must not grant school-wide student access in A.

### 4. High: editing a multi-role user silently removes other roles

Evidence: [UsersPage save](../../apps/admin/src/features/access/UsersPage.tsx#L145)
always sends `roleCodes: [editDraft.role]`, including when only a name or phone
number changes. [UsersService.setRoles](../../apps/api/src/modules/users/users.service.ts#L318)
replaces all assignments in the selected membership. `startEdit` selects one
assignment; the create form also sends only one role.

Example: saving the name of a SCHOOL_SUPERVISOR + TEACHER account leaves only the
role selected by the editor. Additional third/fourth roles are equally affected.

Fix: use a multi-select role editor, preserve the complete role set for the
selected scope, and avoid role writes when roles did not change. Regression:
editing profile fields preserves all roles; explicitly removing one preserves others.

### 5. Medium: the database does not enforce the student/user one-to-one link

Evidence: [Student.user](../../apps/api/src/database/entities/student.entity.ts#L26)
declares OneToOne, but the initial migration creates `students.userId` without a
unique constraint, and the complete migration replay still permits duplicates.
Student services use `findOne` by user ID, so duplicate links make the chosen
student record ambiguous.

Validation: two students referencing the same user were inserted successfully
with SQLite foreign keys enabled.

Fix: audit existing duplicates, resolve them explicitly, and add a unique index
on non-null `students.userId`. Regression: a second student linked to one user
must fail on a migration-built database.

### 6. Medium: five declared relationships have no database foreign key

Full migration replay and comparison with TypeORM metadata identified:

| Table.column                        | Declared target       | Migration introducing the column                 |
| ----------------------------------- | --------------------- | ------------------------------------------------ |
| conversations.organizationId        | organizations         | 1724144300000-OrganizationManagedChat            |
| chat_messages.linkedTaskId          | tasks                 | 1724144500000-ChatTaskLinks                      |
| school_schedule_entries.classBookId | education_class_books | 1729800000000-ScheduleClassBooks                 |
| attendance_records.reviewedById     | users                 | 1729900000000-AttendanceAbsenceReview            |
| exit_permissions.returnVerifiedById | users                 | 1729500000000-ExitReturnVerificationAndOccupancy |

These migrations add plain columns. Entity declarations do not add constraints
because production uses `synchronize: false`. The conversation migration has a
cleanup trigger for auto-managed conversations only; it does not enforce parent
existence or cover every conversation as the entity's CASCADE relationship does.
Declared SET NULL behavior for the other optional relationships is not enforced.

Fix: repair orphan values and add forward migrations with appropriate foreign
keys and delete policies, using a reviewed SQLite table-rebuild strategy where
necessary. Regression: invalid parent references fail and deleting a parent
applies the declared delete policy. Do not use synchronize as a migration fix.

### 7. Medium: global role uniqueness is ineffective when membership is null

Evidence: [assignment index](../../apps/api/src/database/entities/user-role-assignment.entity.ts#L13)
and `IDX_assignment_scope` include nullable `membershipId`. SQLite permits multiple
rows with the same user and role when this value is NULL.

Validation: two unscoped PLATFORM_ADMIN assignments for one user were accepted.
This demonstrates missing uniqueness; it does not mean this probe granted any
live account platform administration.

Fix: deduplicate existing rows and add a partial unique index on `(userId, roleId)`
where `membershipId IS NULL`. Consider the same NULL-scope uniqueness issue for
`user_relationships`, whose composite unique index includes nullable organization.

### 8. Medium: an assignment can reference another user's membership

Evidence: [UserRoleAssignment](../../apps/api/src/database/entities/user-role-assignment.entity.ts)
has independent foreign keys for user and membership, without enforcing
`assignment.userId = membership.userId`. Role scope consistency is also enforced
by application conventions rather than a database invariant.

Validation: an assignment for user 1 referencing user 2's membership was accepted
with foreign keys enabled. Existing provisioning methods construct matching
values; this is a persistence integrity gap, not a demonstrated API injection.

Fix: validate all persistence paths and add a database invariant using a supported
composite relationship or triggers. Regression: mismatched assignment ownership
must fail even through direct persistence.

### 9. Medium: user detail exposes assignments from other organizations

Evidence: [UsersService.get](../../apps/api/src/modules/users/users.service.ts#L187)
authorizes access if any assignment shares an organization with the actor, then
projects every assignment. `/users/:id/roles` and `/users/:id/capabilities` reuse
this result. A School A user administrator can inspect a shared user's School B
role assignments, organization IDs, and associated capability definitions.

Fix: project only assignments within the actor's authorized scope; keep global
assignment visibility behind explicit platform authority. Regression: School A
detail must not expose School B assignments. Account-wide update/deactivation
authority for shared users also needs an explicit product policy review.

### 10. Medium: student provisioning and login still depend on the legacy role

Evidence: [UsersService.create](../../apps/api/src/modules/users/users.service.ts#L236)
sets `users.role = STUDENT` whenever STUDENT is among the requested roles, but
does not create a Student record. [AuthService.login](../../apps/api/src/modules/auth/auth.service.ts#L107)
and [hasActiveStudentAccount](../../apps/api/src/modules/auth/auth.service.ts#L636)
require an active Student record based on this legacy discriminator.

Consequences: creating STUDENT through the generic user form/API yields an
account that cannot log in until separately provisioned. Creating STUDENT +
TEACHER behaves the same way. Changing RBAC assignments later does not update
the legacy role, so equivalent role sets can behave differently depending on
account creation history. An inactive student profile can block staff access for
an account whose legacy role remains STUDENT.

Fix: define student-profile provisioning explicitly and base profile restrictions
on authoritative assignments and the intended active work context. Regression:
equivalent assignments have equivalent login behavior regardless of legacy role;
student account creation either provisions its profile or rejects the request.

## Additional schema consistency observations

The metadata comparison found numerous nullability differences: many required
database foreign keys are nullable in TypeORM metadata because ManyToOne lacks
`nullable: false`. Some timestamp columns are nullable in migrations while the
entities mark them required. These differences are not all immediate runtime
failures, but can hide invalid object construction and make synchronized test
schemas differ from deployed schemas. Align them deliberately and validate against
migrations, rather than treating every difference as an independent severe bug.

All 106 mapped entities had their mapped columns present after all 116 migrations.
`PRAGMA foreign_key_check` returned no violations on the fresh replay before
synthetic constraint probes. This checks a fresh schema; it does not establish
the integrity of any deployed or existing database.

## Original audit validation and limits

- Backend role/authentication/user/organization tests: six suites, 51 tests passed.
- Backend attendance migration and organization chat tests: three suites, 10 tests passed.
- Admin user page and authentication provider tests: two files, nine tests passed.
- All 116 migration classes replayed successfully against disposable SQLite
  `:memory:` with foreign keys enabled; all 106 entity mappings initialized.
- Disposable SQL probes confirmed duplicate global assignments, duplicate
  student/user links, and mismatched assignment membership ownership.
- Service probes with controlled repository doubles reproduced cross-organization
  role leakage, cross-school relationship creation, and self-reactivation of a
  revoked relationship. These are service-level reproductions, not HTTP end-to-end
  tests.
- Graphify output was absent. Navigation used source inspection instead.
- Existing/live database contents, deployed migration history, orphan counts,
  concurrency behavior, and production exploitability are UNKNOWN.
- This is a targeted schema and authorization audit, not proof that every query,
  module, or data lifecycle in the repository is defect-free.

## Recommended order

1. Close relationship creation and revoked-link acceptance authorization gaps.
2. Scope effective role names and capabilities to the same organization assignments.
3. Preserve multiple roles in the Admin account editor.
4. Repair data and add uniqueness/foreign-key/ownership constraints through forward migrations.
5. Reconcile legacy student login behavior and tenant-scoped user projections.

Add regression tests for the reproduced failures before implementing fixes.
