# Role and sensitive-resource permission matrix

Date: 2026-10-13. Source: every migration on a fresh disposable SQLite database, verified against backend controllers and service policies. [Exact grants](permission-baseline.json) contain all **16 roles and 181 permissions**. Deployment-specific overrides and per-user grants were not read; production effective assignments are UNKNOWN.

Regenerate exact grants with `cd apps/api && npx --no-install ts-node scripts/audit-security-permissions.ts`. The script cannot target a production database.

`R` means at least one read/export/view-like capability; `W` means at least one mutation capability; `—` means no seeded capability for this resource family. These are capability gates, **not** unrestricted record permissions. Some legacy permission families have no mounted controller. Read the ownership rules below; the exact JSON distinguishes individual operations. PLATFORM_ADMIN expands to all registered permissions at runtime. Legacy `ADMIN` is not an assignable modern role: RolesGuard maps legacy decorator metadata to PLATFORM_ADMIN and AuthorizationService requires valid assignments. SCHOOL_ADMIN has only three compatibility grants; its name does not imply school-wide administration.

| Resource family | ADVISOR | CONTENT_MANAGER | COUNSELOR | DISCIPLINARIAN | GOVERNMENT_EDUCATION_MANAGER | GUARDIAN | MENTOR | ORGANIZATION_ADMIN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| account_change_requests | — | — | — | — | — | — | — | RW |
| analytics | R | — | — | — | — | — | R | R |
| announcements | R | R | R | R | R | R | R | RW |
| attendance | RW | — | R | RW | RW | R | RW | RW |
| audit | — | — | — | — | — | — | — | — |
| chat | RW | RW | RW | RW | RW | RW | RW | RW |
| class_groups | — | — | — | R | RW | — | — | RW |
| classes | RW | — | — | R | RW | R | RW | RW |
| counseling | — | — | RW | — | — | — | — | — |
| database | — | — | — | — | — | — | — | — |
| documents | — | — | — | — | — | — | — | — |
| dormitory | — | — | — | RW | — | — | — | RW |
| dorms | — | — | — | — | — | — | — | — |
| education | RW | RW | RW | RW | RW | — | RW | RW |
| exams | — | RW | — | — | RW | R | — | — |
| exit | RW | — | — | RW | — | — | RW | RW |
| export | R | R | — | — | — | — | — | R |
| groups | — | — | — | — | — | — | — | — |
| guardian | — | — | — | — | — | R | — | — |
| import | W | W | — | — | — | — | — | W |
| learning | RW | — | — | — | — | — | R | — |
| learning_resources | RW | RW | — | — | — | R | RW | RW |
| leave | RW | — | — | RW | — | — | RW | RW |
| letters | RW | — | — | — | — | — | RW | RW |
| mistakes | — | — | — | — | — | — | — | — |
| organization | — | — | — | — | — | — | — | RW |
| permission_requests | RW | — | — | — | — | — | RW | RW |
| plan_templates | RW | — | — | — | — | — | — | RW |
| plans | RW | — | — | — | — | R | R | RW |
| prayer_times | R | R | R | R | R | R | R | RW |
| principal | — | — | — | — | — | — | — | W |
| question_bank | W | — | — | — | — | — | W | W |
| questions | — | RW | — | — | — | — | — | — |
| quiz_questions | — | W | — | — | — | — | — | — |
| quizzes | — | RW | — | — | — | — | — | — |
| recommendations | RW | — | — | — | — | — | R | RW |
| recovery_requests | RW | — | — | — | — | — | — | RW |
| registration | — | — | — | RW | — | — | — | RW |
| relationships | — | — | RW | — | — | — | — | — |
| release | — | — | — | — | — | — | — | — |
| reports | RW | — | R | R | — | R | R | R |
| retry_requests | RW | — | — | — | — | — | — | — |
| roles | — | — | — | — | — | — | — | — |
| schedule | R | R | R | R | R | R | R | RW |
| school | R | R | R | R | R | — | R | R |
| student | RW | — | R | — | — | R | R | RW |
| studentSubjects | RW | — | — | — | — | R | — | RW |
| student_onboarding | — | — | — | — | — | — | — | — |
| students | R | — | R | RW | R | R | R | RW |
| subjects | — | RW | — | — | R | — | — | RW |
| syllabus | — | W | — | — | — | — | — | — |
| system | — | — | — | — | — | — | — | — |
| tasks | RW | — | — | — | — | — | — | RW |
| users | — | — | — | — | — | — | — | RW |

| Resource family | PLATFORM_ADMIN | PRINCIPAL | RELIGIOUS_EDUCATION_MANAGER | SCHOOL_ADMIN | SCHOOL_SUPERVISOR | STUDENT | STUDENT_AFFAIRS_MENTOR | TEACHER |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| account_change_requests | RW | RW | — | — | — | — | — | — |
| analytics | R | — | — | — | — | — | — | R |
| announcements | RW | RW | R | — | RW | R | R | R |
| attendance | RW | RW | RW | — | RW | RW | R | RW |
| audit | R | — | — | — | — | — | — | — |
| chat | RW | — | RW | — | — | RW | RW | RW |
| class_groups | RW | RW | RW | — | — | — | — | R |
| classes | RW | RW | RW | — | RW | R | — | R |
| counseling | RW | — | — | — | — | — | — | — |
| database | RW | — | — | — | — | — | — | — |
| documents | RW | — | — | — | — | — | — | — |
| dormitory | RW | RW | — | — | — | — | R | — |
| dorms | RW | — | — | — | — | — | — | — |
| education | RW | RW | RW | RW | RW | W | RW | RW |
| exams | RW | — | RW | — | — | R | — | RW |
| exit | RW | RW | — | — | — | RW | — | — |
| export | R | — | — | — | — | — | — | — |
| groups | RW | — | — | — | — | — | — | — |
| guardian | RW | — | — | — | — | — | — | — |
| import | W | — | — | — | — | — | — | — |
| learning | RW | — | — | — | — | RW | — | R |
| learning_resources | RW | — | — | — | — | R | — | RW |
| leave | RW | RW | — | — | RW | RW | W | — |
| letters | RW | — | — | — | — | RW | — | — |
| mistakes | R | — | — | — | — | — | — | — |
| organization | RW | RW | — | — | — | — | — | — |
| permission_requests | RW | — | — | — | — | W | — | — |
| plan_templates | RW | — | — | — | — | — | — | R |
| plans | RW | — | — | — | — | R | — | R |
| prayer_times | RW | RW | R | — | RW | R | R | R |
| principal | W | W | — | — | — | — | — | — |
| question_bank | W | — | — | — | — | — | — | W |
| questions | RW | — | — | — | — | — | — | RW |
| quiz_questions | W | — | — | — | — | — | — | W |
| quizzes | RW | — | — | — | — | — | — | RW |
| recommendations | RW | — | — | — | — | — | — | R |
| recovery_requests | RW | — | — | — | — | — | — | — |
| registration | RW | RW | — | — | — | RW | — | — |
| relationships | RW | RW | — | — | — | — | R | — |
| release | RW | — | — | — | — | — | — | — |
| reports | RW | R | — | — | — | — | R | R |
| retry_requests | RW | — | — | — | — | — | — | R |
| roles | W | — | — | — | — | — | — | — |
| schedule | RW | RW | R | — | R | R | R | R |
| school | RW | R | R | R | R | — | R | — |
| student | RW | — | — | — | — | R | R | R |
| studentSubjects | RW | — | — | — | — | R | — | RW |
| student_onboarding | W | — | — | — | — | — | — | — |
| students | RW | RW | R | — | R | RW | R | R |
| subjects | RW | — | R | — | — | R | — | R |
| syllabus | W | — | — | — | — | — | — | W |
| system | W | — | — | — | — | — | — | — |
| tasks | RW | — | — | — | — | RW | — | R |
| users | RW | RW | — | — | — | — | — | — |

## Additional identity and object policies

| Sensitive resource | Mandatory backend boundary | Evidence |
| --- | --- | --- |
| Password hashes and session tokens | No JSON profile/list response may expose password hashes; credentials explicitly selected only for login/password verification. Full platform-authorized database backups necessarily contain credential/session hashes and require restricted handling. | `database/entities/user.entity.ts#User.passwordHash`; `auth/auth.service.ts#login/changePassword`; controllers project responses |
| Own account and sessions | Every valid role: own `/auth/me`, context, session list/revoke/password; foreign session delete is scoped by user ID. Logout/refresh require session CSRF even with expired access. | `auth/auth.service.ts#me/listSessions/revokeSession/logout/refresh` |
| Student profile/academic history | Required capability plus self identity, valid relationship type in active organization, or school-wide role in primary school; PLATFORM_ADMIN deliberate global authority. Teachers/advisors/counselors/mentors require assigned relationships. | `authorization/authorization.service.ts#canAccessStudent`; `students/student-administration.service.ts#get/profile/list` |
| Registration identity and contacts | Self endpoints derive student from authenticated user; management/review require organization authority. Legacy students without primary school need explicit ownership review (see audit). | `registration/registration.service.ts#selfStudent/reviewSection/studentOrganization`; `registration.controller.ts` |
| Guardian/parent academic and attendance reads | Active GUARDIAN_OF plus student-access policy in current active membership/context; guardian role alone is insufficient. | `guardian/guardian.service.ts#requireChild/students` |
| Classes, groups and rosters | Capability plus school scope; student assigned-class reads and teacher class-book assignments are service-specific policies. | `classes/classes.service.ts#list/assigned`; `class-groups/class-groups.service.ts` |
| Attendance and corrections | Organization and context ownership, teacher/class or delegate scope; session participant validation, revisions and scoped review; self/guardian routes derive identity/link. | `attendance/attendance.service.ts#authorizeContext/bulkMark`; `attendance-operations.service.ts`; `guardian.service.ts#attendance` |
| Dormitories and room allocation | SchoolAccessService organization boundary; participants must belong to room school; capacity/uniqueness enforced transactionally and in database. | `dormitory/dormitory.service.ts#setAssignments`; `school-access/school-access.service.ts#organizationForUser` |
| Schedules | Required capability; assigned/self/linked or staff organization scope; teacher response is a public projection. | `schedule/schedule.service.ts#list/create/update` |
| Leave/exit permissions and letters | Capability plus selected organization membership; self requests constrained to own student; staff review scope and workflow status checks. DTO validation gaps remain documented. | `workflows/workflows.service.ts#activeMemberships/reviewLeaveRequest/reviewExitPermission/reviewLetter` |
| Users, roles, platform ownership | users.read/manage plus organization scope; assignment policy; cannot disable self/owner or mutate shared global accounts as tenant admin; ownership transfer limited to active platform owner. | `users/users.service.ts#assertRoles/assertCanMutateGlobalAccount/setRoles/transferPlatformOwnership` |
| Relationships/parent selection | Staff capability+organization management or authenticated party/self decision; pending/active transitions and student school/role eligibility validated server-side. | `relationships/relationships.service.ts#create/update/assertEligible/requestGuardian` |
| Chat profiles/messages | Profile: self, allowed peer or existing shared conversation. Direct student peers require authorized relationship/school scope. Messages: active conversation membership; guardian observation additionally requires consent, GUARDIAN_OF and authorized student scope. Explicit conversation membership is a separate authority; revocation behavior needs policy review. | `chat/chat.service.ts#directAllowed/requireMember/requireViewer/guardianObservedMemberships` |
| Notifications/push subscriptions | All valid roles, own user ID; item-level recipient checks on notification changes. Push destination threat model remains open. | `notifications/notifications.service.ts#markRead`; `notifications/push.service.ts` |
| Student import/export and personal-data bulk transfer | Capability, bounded allowlisted DTO, selected organization, preview validation, transactional commit and audit; never client-selected entity/table. | `student-transfer/student-transfer.service.ts`; `import-export/import-export.service.ts` |
| Audit history, DB metadata, backup/restore, system reset | Seeded platform authority; explicit relevant capability. Backup grants expose complete database: keep platform-only. Reset also platform role and confirmation. Capability grants require careful administration. No destructive endpoints called by audit. | `system/system.controller.ts`; `system/system.service.ts` |
| Uploaded student documents | No live role access: StudentDocumentsModule is deliberately not mounted. documents.* grants alone do not enable upload/download. Dormant Express/Multer controller is unsafe to enable unchanged. | `app.module.ts`; `student-documents/student-documents.controller.ts` |
| Health/readiness/public bootstrap/signup | Minimal liveness/readiness public; signup guarded by platform/school policy and rate budget; bootstrap is first-owner-only, transactionally closed after owner creation. | `health/health.controller.ts`; `onboarding/onboarding.service.ts#bootstrapPlatformAdmin/signup` |

Paths in this table are relative to `apps/api/src`. Active role, capability grants, disabled features, organization membership and resource ownership must be checked together. A frontend CapabilityGate is presentation only. Negative HTTP tests in `apps/api/test/security-boundaries.integration.spec.ts` exercise real guards and services.
