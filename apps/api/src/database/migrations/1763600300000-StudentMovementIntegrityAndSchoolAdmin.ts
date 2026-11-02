import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Forward repair for already-applied movement-center migrations.  SQLite cannot
 * add a foreign key to an existing column without rebuilding retained tables,
 * so triggers provide the same write-time referential protection safely.
 */
export class StudentMovementIntegrityAndSchoolAdmin1763600300000 implements MigrationInterface {
  name = "StudentMovementIntegrityAndSchoolAdmin1763600300000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_exit_permissions_origin ON exit_permissions(origin)",
    );
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS exit_leave_reference_insert
      BEFORE INSERT ON exit_permissions
      WHEN NEW.leaveRequestId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM leave_requests WHERE id = NEW.leaveRequestId)
      BEGIN SELECT RAISE(ABORT, 'EXIT_LEAVE_REQUEST_NOT_FOUND'); END`);
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS exit_leave_reference_update
      BEFORE UPDATE OF leaveRequestId ON exit_permissions
      WHEN NEW.leaveRequestId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM leave_requests WHERE id = NEW.leaveRequestId)
      BEGIN SELECT RAISE(ABORT, 'EXIT_LEAVE_REQUEST_NOT_FOUND'); END`);
    await queryRunner.query(
      "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Confirm a student is physically in school')",
      ["student.movement.resolve"],
    );
    await queryRunner.query(
      "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_ADMIN' AND p.code=?",
      ["student.movement.resolve"],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP TRIGGER IF EXISTS exit_leave_reference_insert",
    );
    await queryRunner.query(
      "DROP TRIGGER IF EXISTS exit_leave_reference_update",
    );
    await queryRunner.query("DROP INDEX IF EXISTS IDX_exit_permissions_origin");
  }
}
