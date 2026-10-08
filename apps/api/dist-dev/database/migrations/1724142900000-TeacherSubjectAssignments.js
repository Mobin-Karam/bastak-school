"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherSubjectAssignments1724142900000 = void 0;
class TeacherSubjectAssignments1724142900000 {
    name = "TeacherSubjectAssignments1724142900000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "teacher_subject_assignments" ("id" varchar PRIMARY KEY NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "teacherId" varchar NOT NULL, "subjectId" varchar NOT NULL, "organizationId" varchar NOT NULL, CONSTRAINT "FK_teacher_subject_teacher" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE CASCADE, CONSTRAINT "FK_teacher_subject_subject" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE, CONSTRAINT "FK_teacher_subject_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_teacher_subject_scope" ON "teacher_subject_assignments" ("teacherId", "subjectId", "organizationId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_teacher_subject_scope"`);
        await queryRunner.query(`DROP TABLE "teacher_subject_assignments"`);
    }
}
exports.TeacherSubjectAssignments1724142900000 = TeacherSubjectAssignments1724142900000;
//# sourceMappingURL=1724142900000-TeacherSubjectAssignments.js.map