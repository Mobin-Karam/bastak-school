# Book deletion and class assignments

The Books page has two distinct actions:

- **Remove from class** detaches the assignment from the selected class. The catalog book remains available for other classes. Bulk removal has the same scope.
- **Delete book** retires the catalog record and removes every linked class assignment atomically. The same action is available in Classes → Book management, including books not selected for that class. Both entry points require confirmation explaining that the Books page and all linked classes are affected.

Deletion uses the existing capability-gated `PATCH /api/v2/education-catalog/admin/books/:id` with `state: ARCHIVED`. There is no database migration and no automatic deletion during deployment. The operator chooses the book and confirms the action. An archived catalog row remains in the database for audit purposes; published book lists and class options exclude it. Existing archived books with unreferenced class assignments can be cleaned through the same operation.

The API checks the original book ownership before considering submitted fields. School managers cannot delete shared global books or another school's book. A school-owned book with an unexpected class assignment in another school requires platform review. Removing only a shared book's assignment from a class remains available.

Any schedule lesson (including legacy lessons) or weekly timetable allocation referencing a class-book assignment blocks catalog deletion. Published timetable and attendance history must be preserved. Resolve unused draft dependencies first; a published historical dependency is not removed by this feature. The server error is shown in the confirmation flow, and no partial deletion takes place. Catalog retirement, class-assignment removal, and the audit record commit in one transaction. Query caches for classes, class options, and the catalog refresh after success.

Regression tests use migration-built SQLite to cover all-class removal, archived-row cleanup, foreign ownership, shared-book protection, missing capability, timetable/allocation protection, and rollback when audit persistence fails. UI tests verify confirmation, cancellation, list refresh, and visible protection errors in both workflows. Persian/RTL and English use the existing responsive dialogs, buttons, and locale system.

Changes follow [the GitHub CI/CD process](../operations/github-cicd.md): a fix branch, checked PR to develop, develop CI, reviewed release PR to main, main CI, and the private production runner. Deployments preserve a private SQLite backup and verify HTTPS readiness.
