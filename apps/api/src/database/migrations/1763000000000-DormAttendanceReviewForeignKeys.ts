import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/** Adds the nullable reviewer references without changing attendance facts. */
export class DormAttendanceReviewForeignKeys1763000000000 implements MigrationInterface {
  name = "DormAttendanceReviewForeignKeys1763000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("attendance_sessions");
    if (!table) return;
    const required = [
      ["dormSupervisorReviewedById", "FK_attendance_dorm_supervisor_reviewer"],
      ["dormPrincipalReviewedById", "FK_attendance_dorm_principal_reviewer"],
    ] as const;
    const missing = required.filter(
      ([columnName]) =>
        table.columns.some((column) => column.name === columnName) &&
        !table.foreignKeys.some((foreignKey) =>
          foreignKey.columnNames.includes(columnName),
        ),
    );
    if (!missing.length) return;

    const triggers = (await queryRunner.query(
      "SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='attendance_sessions' AND sql IS NOT NULL",
    )) as Array<{ sql: string }>;
    await queryRunner.createForeignKeys(
      table,
      missing.map(
        ([columnName, name]) =>
          new TableForeignKey({
            name,
            columnNames: [columnName],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL",
          }),
      ),
    );
    for (const trigger of triggers) {
      if (trigger.sql) await queryRunner.query(trigger.sql);
    }
  }

  async down(): Promise<void> {
    // Forward-only SQLite schema repair; historical review attribution remains.
  }
}
