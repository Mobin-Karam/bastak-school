import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { DailyReport } from "../src/database/entities/daily-report.entity";
import { Organization, OrganizationType } from "../src/database/entities/organization.entity";
import { RecoveryRequest } from "../src/database/entities/recovery-request.entity";
import { Student } from "../src/database/entities/student.entity";
import { TeacherStudentReport } from "../src/database/entities/teacher-student-report.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { ReportsService } from "../src/modules/reports/reports.service";

describe("teacher report academic snapshots", () => {
  let db: DataSource;

  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(entities).filter((value) => typeof value === "function"),
      synchronize: true,
    }).initialize();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("persists report snapshots and filters principal reports by academic cycle", async () => {
    const organization = await db.getRepository(Organization).save({
      name: "School",
      type: OrganizationType.SCHOOL,
    });
    const teacher = await db.getRepository(User).save({
      username: "report-teacher",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    const student = await db.getRepository(Student).save({ name: "Student", organization });
    const session = await db.getRepository(AttendanceSession).save({
      organization,
      contextType: "class",
      contextId: randomUUID(),
      sessionDate: new Date("2026-10-12T08:00:00Z"),
      titleSnapshot: "درس آزمون",
      sourceKind: "legacy_schedule",
      academicYearIdSnapshot: "year-1",
      academicYearNameSnapshot: "۱۴۰۵–۱۴۰۶",
      termIdSnapshot: "term-1",
      termNameSnapshot: "نیم‌سال اول",
      assignedStaff: teacher,
      rosterSnapshot: [{ id: student.id, name: student.name, nationalCode: null, userId: null }],
    });
    const service = new ReportsService(
      db.getRepository(DailyReport),
      db.getRepository(RecoveryRequest),
      db.getRepository(Student),
      { requireCapability: jest.fn() } as never,
      db.getRepository(User),
      db.getRepository(TeacherStudentReport),
      db.getRepository(AttendanceSession),
    );
    const context = {
      id: teacher.id,
      roles: ["TEACHER"],
      capabilities: ["attendance.class.manage"],
      organizationIds: [organization.id],
    } as never;

    await service.createTeacherReport(context, session.id, student.id, { message: "پیگیری لازم است" });
    const row = await db.getRepository(TeacherStudentReport).findOneByOrFail({ message: "پیگیری لازم است" });
    expect(row).toMatchObject({
      academicYearIdSnapshot: "year-1",
      academicYearNameSnapshot: "۱۴۰۵–۱۴۰۶",
      termIdSnapshot: "term-1",
      termNameSnapshot: "نیم‌سال اول",
    });

    const principal = {
      id: randomUUID(),
      roles: ["PRINCIPAL"],
      capabilities: ["attendance.review"],
      organizationIds: [organization.id],
    };
    expect(await service.teacherReportsForPrincipal(principal as never, { academicYearId: "year-1", termId: "term-1" })).toHaveLength(1);
    expect(await service.teacherReportsForPrincipal(principal as never, { termId: "other-term" })).toHaveLength(0);
    await expect(
      service.teacherReportsForPrincipal({
        ...principal,
        roles: ["RELIGIOUS_EDUCATION_MANAGER"],
      } as never),
    ).rejects.toMatchObject({ status: 403 });
  });
});
