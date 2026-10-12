# Database and multi-role integrity rollout

The 2026-10-12 audit fixes preserve `/api/v2` request/response shapes. Effective
roles now belong to the selected organization, relationship invitations cannot
cross school ownership, and only pending invitations can be accepted by their
source. Global role assignments remain separate from school assignments.

Admin supports multiple roles in the account form. Editing only profile details
preserves roles. Switching organization refreshes `/me/context` before activating
its role and capability set. A principal can retain existing roles outside their
assignment authority while changing only the roles they are allowed to manage.

Student profiles are provisioned in the same transaction as new STUDENT roles.
Inactive student profiles do not remove a user's independent staff authority;
the STUDENT work context remains unavailable until that profile is active.
Login and refresh use current assignments rather than a legacy role label.
School administrators cannot change global profile fields or globally disable
accounts shared with other organizations; those operations require platform
administration. School membership and scoped role management remain available.

## Migration behavior

`1730700000000-DatabaseRelationshipIntegrity` runs at normal migration startup.
`migrationsTransactionMode` is `each`; this migration owns its transaction so it
can temporarily change SQLite connection pragmas before rebuilding tables.
Foreign key enforcement and the previous rename behavior are restored on success
or failure. Existing rows, table definitions, indexes, triggers, and dependent
rows are preserved. Fresh migrations and populated upgrade tests cover this path.

The migration:

- Adds real foreign keys for conversation organization, linked tasks, class-book
  schedule links, attendance reviewers, and exit return verifiers.
- Detaches optional links to nonexistent parents without deleting owning records.
- Enforces unique non-null student/user links and unique unscoped assignments
  and personal relationships.
- Collapses duplicate global role assignments and same-status personal links,
  retaining the oldest row. Conflicting relationship decisions are not merged.
- Enforces assignment membership ownership and global/organization role scope,
  including updates to the membership owner or role scope flag.
- Provisions missing historical student profiles only when their student-role
  school ownership is unambiguous. Existing profiles/statuses are preserved.
- Backfills missing timestamps/client mutation IDs and enforces their required
  columns. Entity relation nullability matches the migration-built schema.

## Deployment

1. Take and verify a restorable database backup. Stop other writers while applying
   this migration; the SQLite production model is one API replica.
2. Validate the change against a copy of the deployed database, including its
   existing migration history. Never use schema synchronization for this repair.
3. From `apps/api`, run the existing command:

   ```bash
   npm run migration:run
   ```

4. If migration preflight fails, leave the original rows intact and resolve the
   reported ownership/decision conflict explicitly on the copied database first.
   A duplicate student/user link, missing student profile with several student
   school assignments, malformed role assignment ownership/scope, or conflicting
   duplicate personal relationship decision requires a deliberate data decision.
   Do not automatically merge student records or delete conflicting role scopes.
5. Confirm `PRAGMA foreign_keys` is `1` and `PRAGMA foreign_key_check` is empty;
   exercise supervisor + teacher role switching and tenant-scoped access.

The migration is forward-only because data repairs cannot be reconstructed by
removing constraints. Rollback requires restoring the verified pre-migration
backup together with the matching application version. Explicit validation used
disposable databases. Existing development processes can apply configured startup
migrations when restarted.

## Production-copy rehearsal, 2026-10-12

A SQLite online backup from the running production API was copied into a private
operator directory and upgraded using this release's actual data-source and full
migration chain. Production itself was not migrated during this rehearsal.
The copy upgraded from 115 to 117 migrations, including the timetable and
relationship-integrity migrations. `PRAGMA quick_check` returned `ok` and
`PRAGMA foreign_key_check` returned no violations before and after the upgrade.
Row counts across all 94 existing application tables were unchanged except for
the expected timetable permission additions (two permissions and eight role
permission links). No users, students, assignments, relationships, attendance,
or other existing application records were removed or newly provisioned on this
copy. The copied database and logs are private operational artifacts and must
never be committed. Deployment takes another online backup immediately before
replacing the API; startup applies the tested migrations with one API replica.
