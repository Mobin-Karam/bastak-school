import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/** Links legacy sessions to reusable time blocks without changing existing session times. */
export class ScheduleEntryTimeBlocks1763600800000 implements MigrationInterface {
  name = "ScheduleEntryTimeBlocks1763600800000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("school_schedule_entries");
    if (table && !table.findColumnByName("timeBlockId"))
      await queryRunner.query(
        "ALTER TABLE school_schedule_entries ADD COLUMN timeBlockId varchar(36)",
      );
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_schedule_entries_time_block ON school_schedule_entries(timeBlockId)",
    );
    // Only backfill when one exact organization/time-range match exists. Ambiguous
    // legacy sessions stay unassigned so an operator can classify them explicitly.
    await queryRunner.query(`
      UPDATE school_schedule_entries
      SET timeBlockId = (
        SELECT MIN(block.id) FROM school_schedule_time_blocks block
        WHERE block.organizationId = school_schedule_entries.organizationId
          AND block.startTime = school_schedule_entries.startTime
          AND block.endTime = school_schedule_entries.endTime
        GROUP BY block.organizationId, block.startTime, block.endTime
        HAVING COUNT(*) = 1
      )
      WHERE timeBlockId IS NULL
        AND 1 = (
          SELECT COUNT(*) FROM school_schedule_time_blocks block
          WHERE block.organizationId = school_schedule_entries.organizationId
            AND block.startTime = school_schedule_entries.startTime
            AND block.endTime = school_schedule_entries.endTime
        )
    `);
    const updated = await queryRunner.getTable("school_schedule_entries");
    if (
      !updated?.foreignKeys.some(
        (key) =>
          key.columnNames.length === 1 &&
          key.columnNames[0] === "timeBlockId" &&
          key.referencedTableName === "school_schedule_time_blocks",
      )
    ) {
      // SQLite rebuilds the table for a new FK; restore its existing schedule guards.
      const triggers = (await queryRunner.query(
        "SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='school_schedule_entries' AND sql IS NOT NULL",
      )) as Array<{ sql: string }>;
      await queryRunner.createForeignKey(
        "school_schedule_entries",
        new TableForeignKey({
          columnNames: ["timeBlockId"],
          referencedTableName: "school_schedule_time_blocks",
          referencedColumnNames: ["id"],
          onDelete: "RESTRICT",
        }),
      );
      for (const trigger of triggers)
        if (trigger.sql) await queryRunner.query(trigger.sql);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("school_schedule_entries");
    const foreignKey = table?.foreignKeys.find(
      (key) =>
        key.columnNames.length === 1 &&
        key.columnNames[0] === "timeBlockId" &&
        key.referencedTableName === "school_schedule_time_blocks",
    );
    if (foreignKey) {
      const triggers = (await queryRunner.query(
        "SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='school_schedule_entries' AND sql IS NOT NULL",
      )) as Array<{ sql: string }>;
      await queryRunner.dropForeignKey("school_schedule_entries", foreignKey);
      for (const trigger of triggers)
        if (trigger.sql) await queryRunner.query(trigger.sql);
    }
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_schedule_entries_time_block",
    );
    // SQLite cannot safely remove this additive column without rebuilding a populated table.
  }
}
