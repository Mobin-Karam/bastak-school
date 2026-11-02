import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Links absence approvals to physical movement without rewriting retained
 * workflow data. SQLite triggers protect future writes while legacy rows stay
 * readable for reconciliation.
 */
export class StudentMovementCenter1763600000000 implements MigrationInterface {
  name = "StudentMovementCenter1763600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(exit_permissions)",
    )) as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "leaveRequestId")) {
      await queryRunner.query(
        "ALTER TABLE exit_permissions ADD COLUMN leaveRequestId varchar",
      );
    }
    if (!columns.some((column) => column.name === "resolution")) {
      await queryRunner.query(
        "ALTER TABLE exit_permissions ADD COLUMN resolution varchar(32)",
      );
    }
    await queryRunner.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS UQ_exit_permissions_leave_request ON exit_permissions(leaveRequestId) WHERE leaveRequestId IS NOT NULL",
    );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_exit_permissions_org_student_active ON exit_permissions(organizationId, studentId, status, actualReturnAt)",
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS student_movement_events (
      id varchar PRIMARY KEY NOT NULL,
      organizationId varchar NOT NULL,
      studentId varchar NOT NULL,
      leaveRequestId varchar,
      exitPermissionId varchar,
      type varchar(48) NOT NULL,
      note text NOT NULL DEFAULT '',
      actorId varchar,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(leaveRequestId) REFERENCES leave_requests(id) ON DELETE SET NULL,
      FOREIGN KEY(exitPermissionId) REFERENCES exit_permissions(id) ON DELETE SET NULL,
      FOREIGN KEY(actorId) REFERENCES users(id) ON DELETE SET NULL
    )`);
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_movement_events_student_created ON student_movement_events(organizationId, studentId, createdAt)",
    );
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS prevent_duplicate_active_exit_insert
      BEFORE INSERT ON exit_permissions
      WHEN NEW.status IN ('PENDING','APPROVED')
        AND NEW.actualReturnAt IS NULL
        AND EXISTS (SELECT 1 FROM exit_permissions existing
          WHERE existing.organizationId=NEW.organizationId
            AND existing.studentId=NEW.studentId
            AND existing.status IN ('PENDING','APPROVED')
            AND existing.actualReturnAt IS NULL)
      BEGIN SELECT RAISE(ABORT, 'STUDENT_ACTIVE_MOVEMENT_EXISTS'); END`);
    await queryRunner.query(`CREATE TRIGGER IF NOT EXISTS prevent_duplicate_active_exit_update
      BEFORE UPDATE OF status, actualReturnAt, organizationId, studentId ON exit_permissions
      WHEN NEW.status IN ('PENDING','APPROVED')
        AND NEW.actualReturnAt IS NULL
        AND EXISTS (SELECT 1 FROM exit_permissions existing
          WHERE existing.organizationId=NEW.organizationId
            AND existing.studentId=NEW.studentId
            AND existing.id<>NEW.id
            AND existing.status IN ('PENDING','APPROVED')
            AND existing.actualReturnAt IS NULL)
      BEGIN SELECT RAISE(ABORT, 'STUDENT_ACTIVE_MOVEMENT_EXISTS'); END`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TRIGGER IF EXISTS prevent_duplicate_active_exit_insert");
    await queryRunner.query("DROP TRIGGER IF EXISTS prevent_duplicate_active_exit_update");
    await queryRunner.query("DROP TABLE IF EXISTS student_movement_events");
    await queryRunner.query("DROP INDEX IF EXISTS UQ_exit_permissions_leave_request");
    await queryRunner.query("DROP INDEX IF EXISTS IDX_exit_permissions_org_student_active");
  }
}
