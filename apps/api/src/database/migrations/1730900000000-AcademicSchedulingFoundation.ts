import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from "typeorm";

/** Additive only: old academic-year and curriculum facts remain unknown. */
export class AcademicSchedulingFoundation1730900000000 implements MigrationInterface {
  name = "AcademicSchedulingFoundation1730900000000";
  async up(q: QueryRunner) {
    const timestamp =
      q.connection.options.type === "postgres" ? "timestamp" : "datetime";
    if (
      (
        await q.query(
          `SELECT "organizationId" FROM timetable_academic_years WHERE "active" = ${q.connection.options.type === "postgres" ? "true" : "1"} GROUP BY "organizationId" HAVING COUNT(*) > 1`,
        )
      ).length
    )
      throw new Error(
        "Multiple active academic years require explicit resolution; no historical facts were changed.",
      );
    if (
      q.connection.options.type === "better-sqlite3" ||
      q.connection.options.type === "sqlite"
    ) {
      // Native additive DDL retains dependent rows, custom triggers and indexes.
      // TypeORM's SQLite addColumn rebuilds the parent and can cascade deletes.
      await q.query(
        'ALTER TABLE "education_classes" ADD COLUMN "academicYearId" varchar(36) REFERENCES "timetable_academic_years"("id") ON DELETE RESTRICT',
      );
      await q.query(
        `ALTER TABLE "timetable_periods" ADD COLUMN "weekdays" text NOT NULL DEFAULT '[]'`,
      );
    } else {
      await q.addColumn(
        "education_classes",
        new TableColumn({
          name: "academicYearId",
          type: "varchar",
          length: "36",
          isNullable: true,
        }),
      );
      await q.createForeignKey(
        "education_classes",
        new TableForeignKey({
          columnNames: ["academicYearId"],
          referencedTableName: "timetable_academic_years",
          referencedColumnNames: ["id"],
          onDelete: "RESTRICT",
        }),
      );
      await q.addColumn(
        "timetable_periods",
        new TableColumn({ name: "weekdays", type: "text", default: "'[]'" }),
      );
    }
    for (const [table, columns, name] of [
      ["timetable_academic_years", ["id", "organizationId"], "UQ_year_school"],
      [
        "education_classes",
        ["id", "organizationId", "academicYearId"],
        "UQ_class_academic_scope",
      ],
      ["timetable_terms", ["id", "yearId"], "UQ_term_year"],
    ] as const)
      await q.createIndex(
        table,
        new TableIndex({ name, columnNames: [...columns], isUnique: true }),
      );
    await q.createIndex(
      "timetable_academic_years",
      new TableIndex({
        name: "UQ_year_active_school",
        columnNames: ["organizationId"],
        isUnique: true,
        where:
          q.connection.options.type === "postgres"
            ? '"active" = true'
            : '"active" = 1',
      }),
    );
    const base = () => [
      { name: "id", type: "varchar", length: "36", isPrimary: true },
      { name: "organizationId", type: "varchar", length: "36" },
      { name: "createdAt", type: timestamp, default: "CURRENT_TIMESTAMP" },
    ];
    const tables = [
      new Table({
        name: "teaching_assignments",
        columns: [
          ...base(),
          { name: "academicYearId", type: "varchar", length: "36" },
          { name: "termId", type: "varchar", length: "36", isNullable: true },
          { name: "classroomId", type: "varchar", length: "36" },
          { name: "subjectId", type: "varchar", length: "36" },
          { name: "teacherId", type: "varchar", length: "36" },
          { name: "createdById", type: "varchar", length: "36" },
          { name: "startsOn", type: "varchar", length: "10" },
          { name: "endsOn", type: "varchar", length: "10" },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'ACTIVE'",
          },
        ],
      }),
      new Table({
        name: "subject_book_references",
        columns: [
          ...base(),
          { name: "subjectId", type: "varchar", length: "36" },
          { name: "bookId", type: "varchar", length: "120" },
        ],
      }),
      new Table({
        name: "class_enrollment_history",
        columns: [
          ...base(),
          { name: "classroomId", type: "varchar", length: "36" },
          { name: "actorId", type: "varchar", length: "36" },
          { name: "beforeStudentIds", type: "text" },
          { name: "afterStudentIds", type: "text" },
        ],
      }),
    ];
    for (const table of tables) {
      await q.createTable(table);
      await q.createForeignKey(
        table.name,
        new TableForeignKey({
          columnNames: ["organizationId"],
          referencedTableName: "organizations",
          referencedColumnNames: ["id"],
          onDelete: "RESTRICT",
        }),
      );
    }
    for (const [table, column, parent] of [
      ["teaching_assignments", "subjectId", "subjects"],
      ["teaching_assignments", "teacherId", "users"],
      ["teaching_assignments", "createdById", "users"],
      ["subject_book_references", "subjectId", "subjects"],
      ["subject_book_references", "bookId", "education_books"],
      ["class_enrollment_history", "classroomId", "education_classes"],
      ["class_enrollment_history", "actorId", "users"],
    ])
      await q.createForeignKey(
        table,
        new TableForeignKey({
          columnNames: [column],
          referencedTableName: parent,
          referencedColumnNames: ["id"],
          onDelete: "RESTRICT",
        }),
      );
    for (const fk of [
      {
        columnNames: ["academicYearId", "organizationId"],
        referencedTableName: "timetable_academic_years",
        referencedColumnNames: ["id", "organizationId"],
      },
      {
        columnNames: ["classroomId", "organizationId", "academicYearId"],
        referencedTableName: "education_classes",
        referencedColumnNames: ["id", "organizationId", "academicYearId"],
      },
      {
        columnNames: ["termId", "academicYearId"],
        referencedTableName: "timetable_terms",
        referencedColumnNames: ["id", "yearId"],
      },
    ])
      await q.createForeignKey(
        "teaching_assignments",
        new TableForeignKey({ ...fk, onDelete: "RESTRICT" }),
      );
    for (const [table, columns, name, unique] of [
      [
        "teaching_assignments",
        ["organizationId", "teacherId", "startsOn", "endsOn"],
        "IDX_teaching_assignment_teacher",
        false,
      ],
      [
        "teaching_assignments",
        ["classroomId", "subjectId", "startsOn"],
        "IDX_teaching_assignment_class",
        false,
      ],
      [
        "subject_book_references",
        ["organizationId", "subjectId", "bookId"],
        "UQ_subject_book_school",
        true,
      ],
      [
        "class_enrollment_history",
        ["organizationId", "classroomId", "createdAt", "id"],
        "IDX_enrollment_history_scope",
        false,
      ],
      [
        "education_classes",
        ["organizationId", "academicYearId", "status"],
        "IDX_class_year",
        false,
      ],
    ] as const)
      await q.createIndex(
        table,
        new TableIndex({ name, columnNames: [...columns], isUnique: unique }),
      );
  }
  async down(): Promise<void> {
    throw new Error(
      "Academic assignment and enrollment history is forward-only. Roll application code back; preserve the additive schema.",
    );
  }
}
