import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/**
 * Aligns the declared replacement-entry ownership relation with retained
 * SQLite schema. The earlier migration deliberately used triggers so it did
 * not have to rebuild populated schedule tables; TypeORM metadata now needs
 * the equivalent foreign keys as well.
 */
export class ScheduleEntryTeacherLeaveForeignKey1763600500000 implements MigrationInterface {
  name = "ScheduleEntryTeacherLeaveForeignKey1763600500000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureLeaveRequestForeignKey(
      queryRunner,
      "school_schedule_entries",
    );
    await this.ensureLeaveRequestForeignKey(
      queryRunner,
      "school_schedule_occurrence_overrides",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropLeaveRequestForeignKey(
      queryRunner,
      "school_schedule_occurrence_overrides",
    );
    await this.dropLeaveRequestForeignKey(
      queryRunner,
      "school_schedule_entries",
    );
  }

  private async ensureLeaveRequestForeignKey(
    queryRunner: QueryRunner,
    tableName:
      "school_schedule_entries" | "school_schedule_occurrence_overrides",
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName("leaveRequestId")) return;
    if (
      table.foreignKeys.some(
        (key) =>
          key.columnNames.length === 1 &&
          key.columnNames[0] === "leaveRequestId" &&
          key.referencedTableName === "teacher_leave_requests",
      )
    )
      return;

    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        columnNames: ["leaveRequestId"],
        referencedTableName: "teacher_leave_requests",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );
  }

  private async dropLeaveRequestForeignKey(
    queryRunner: QueryRunner,
    tableName:
      "school_schedule_entries" | "school_schedule_occurrence_overrides",
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table?.foreignKeys.find(
      (key) =>
        key.columnNames.length === 1 &&
        key.columnNames[0] === "leaveRequestId" &&
        key.referencedTableName === "teacher_leave_requests",
    );
    if (foreignKey) await queryRunner.dropForeignKey(tableName, foreignKey);
  }
}
