# School Portal MVP Update

This is still **one React application for every role**. Pages and navigation are exposed by capabilities instead of creating separate student/teacher/admin applications.

## Active school workspace

- `/register` — public student account creation
- `/admin` — role-aware dashboard
- `/admin/students` — accessible student directory
- `/admin/registration` — student self-completion or management/review UI
- `/admin/classes` — classes
- `/admin/class-groups` — groups inside a class and group membership
- `/admin/attendance` — class, class-group and dorm attendance
- `/admin/dormitory` — rooms and assignments
- `/admin/student-transfer` — Excel roster preview/import/export
- `/admin/users` — users/staff (when capability allows)
- `/admin/organizations` — schools/organizations (when capability allows)
- `/admin/system` — platform operations (when capability allows)
- `/admin/settings` — account settings

The old feature source remains in `src/features`, but the normal router/navigation no longer mounts it as part of the school MVP.

## Attendance correction

The old attendance screen displayed demo statuses derived from array position. That behavior is removed. Every participant starts as `unmarked`; only explicitly selected statuses are sent to the API.

## Role model

The same portal supports:

- `PRINCIPAL`
- `DISCIPLINARIAN`
- `COUNSELOR`
- `RELIGIOUS_EDUCATION_MANAGER`
- `GOVERNMENT_EDUCATION_MANAGER`
- `STUDENT_AFFAIRS_MENTOR`
- `TEACHER`
- `STUDENT`
- `GUARDIAN`
- platform/organization administration roles

Navigation checks capabilities; do not add new UI by checking `role === ...` unless the difference is truly role-specific rather than permission-specific.

## Excel format

The import page currently reads these columns in order:

1. first name
2. last name
3. national code
4. grade ID
5. education type ID
6. track ID

It always previews validation results before commit.

## Monorepo requirement

This archive references sibling packages including `../../packages/admin-workspace-ui` and `../../packages/api-contract`. Keep it in the original monorepo location before installing/building.

```bash
npm ci
npm run dev
```

## Next UI work

- complete all progressive registration fields/contacts
- add document upload UI once object storage transport is implemented in API
- improve registration review detail/actions
- add mobile-first role dashboards
- add server-side student pagination before very large deployments
