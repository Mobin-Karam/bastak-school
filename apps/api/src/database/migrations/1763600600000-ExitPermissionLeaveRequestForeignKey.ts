import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/**
 * Completes the nullable leave-to-movement relation declared by ExitPermission.
 * Existing movement rows remain intact; deleting a leave clears only its link.
 */
export class ExitPermissionLeaveRequestForeignKey1763600600000 implements MigrationInterface {
  name = "ExitPermissionLeaveRequestForeignKey1763600600000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("exit_permissions");
    if (!table?.findColumnByName("leaveRequestId")) return;
    if (
      table.foreignKeys.some(
        (key) =>
          key.columnNames.length === 1 &&
          key.columnNames[0] === "leaveRequestId" &&
          key.referencedTableName === "leave_requests",
      )
    )
      return;

    const triggers = (await queryRunner.query(
      "SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='exit_permissions' AND sql IS NOT NULL",
    )) as Array<{ sql: string }>;
    await queryRunner.createForeignKey(
      "exit_permissions",
      new TableForeignKey({
        columnNames: ["leaveRequestId"],
        referencedTableName: "leave_requests",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
    for (const trigger of triggers)
      if (trigger.sql) await queryRunner.query(trigger.sql);
    // TypeORM rebuilds a SQLite table to add a foreign key. Recreate the
    // retained movement guards that SQLite drops with the old table.
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
            AND existing.status IN ('PENDING','APPROVED')
            AND existing.actualReturnAt IS NULL)
      BEGIN SELECT RAISE(ABORT, 'STUDENT_ACTIVE_MOVEMENT_EXISTS'); END`);
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
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("exit_permissions");
    const foreignKey = table?.foreignKeys.find(
      (key) =>
        key.columnNames.length === 1 &&
        key.columnNames[0] === "leaveRequestId" &&
        key.referencedTableName === "leave_requests",
    );
    if (foreignKey)
      await queryRunner.dropForeignKey("exit_permissions", foreignKey);
  }
}
