import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class TeacherStudentReportPrincipalActionActorForeignKey1762301100000 implements MigrationInterface {
  name = "TeacherStudentReportPrincipalActionActorForeignKey1762301100000";

  async up(queryRunner: QueryRunner) {
    const table = await queryRunner.getTable("teacher_student_reports");
    if (
      !table ||
      table.foreignKeys.some((key) =>
        key.columnNames.includes("principalActionById"),
      )
    )
      return;

    const orphaned = await queryRunner.query(
      'SELECT report."principalActionById" FROM "teacher_student_reports" report LEFT JOIN "users" actor ON actor."id" = report."principalActionById" WHERE report."principalActionById" IS NOT NULL AND actor."id" IS NULL LIMIT 1',
    );
    if (orphaned.length)
      throw new Error(
        "Cannot add principal action actor foreign key while teacher reports contain an unknown actor.",
      );

    const triggers = (await queryRunner.query(
      "SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='teacher_student_reports' AND sql IS NOT NULL",
    )) as Array<{ sql: string }>;
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
        name: "FK_teacher_student_reports_principal_action_by",
        columnNames: ["principalActionById"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
    for (const trigger of triggers)
      if (trigger.sql) await queryRunner.query(trigger.sql);
  }

  async down(queryRunner: QueryRunner) {
    const table = await queryRunner.getTable("teacher_student_reports");
    const foreignKey = table?.foreignKeys.find(
      (key) => key.name === "FK_teacher_student_reports_principal_action_by",
    );
    if (table && foreignKey)
      await queryRunner.dropForeignKey(table, foreignKey);
  }
}
