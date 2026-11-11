import "reflect-metadata";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import { ClassGradesService } from "../src/modules/classes/class-grades.service";
import { ClassBookGradeSession } from "../src/database/entities/class-book-grade-session.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import {
  AttendanceRecord,
  AttendanceStatus,
} from "../src/database/entities/attendance-record.entity";
import { ClassBookGrade } from "../src/database/entities/class-book-grade.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassBook } from "../src/database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { EducationBook } from "../src/database/entities/education-book.entity";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { Student } from "../src/database/entities/student.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import type { AuthenticatedUser } from "../src/modules/auth";

describe("Class book grades", () => {
  let db: DataSource;
  let service: ClassGradesService;
  let book: EducationClassBook;
  let student: Student;
  let gradeSessionId: string;
  let outsider: Student;
  let organizationId: string;
  let teacher: User;
  let principal: User;
  let rem: User;
  let learner: User;
  const actor = (
    user: User,
    role: string,
    orgId = organizationId,
  ): AuthenticatedUser => ({
    id: user.id,
    username: user.username,
    role,
    roles: [role],
    sessionId: "test",
    capabilities: [
      "class_grades.read",
      "class_grades.manage",
      "class_grades.self.read",
    ],
    organizationIds: [orgId],
    activeOrganizationId: orgId,
  });

  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(entities).filter(
        (value) => typeof value === "function",
      ),
      synchronize: true,
    }).initialize();
    const org = await db
      .getRepository(Organization)
      .save({ name: "School", type: OrganizationType.SCHOOL });
    organizationId = org.id;
    const otherOrg = await db
      .getRepository(Organization)
      .save({ name: "Other", type: OrganizationType.SCHOOL });
    [teacher, principal, rem, learner] = await db.getRepository(User).save([
      { username: "teacher", passwordHash: "fixture", role: UserRole.TEACHER },
      {
        username: "principal",
        passwordHash: "fixture",
        role: UserRole.ORGANIZATION_ADMIN,
      },
      {
        username: "rem",
        passwordHash: "fixture",
        role: UserRole.ORGANIZATION_ADMIN,
      },
      { username: "learner", passwordHash: "fixture", role: UserRole.STUDENT },
    ]);
    [student, outsider] = await db.getRepository(Student).save([
      { name: "Alice", organization: org, user: learner },
      { name: "Other learner", organization: otherOrg },
    ]);
    const classroom = await db.getRepository(EducationClass).save({
      organization: org,
      code: "a",
      name: "Class A",
      schoolYear: "1405-1406",
      gradeId: 0,
      educationTypeId: "universal",
      trackId: "universal",
    });
    const textbook = await db.getRepository(EducationBook).save({
      id: "textbook",
      country: "IR",
      schoolYear: "1405-1406",
      grade: 0,
      level: "",
      branch: "",
      track: "",
      category: "",
      titleFa: "کتاب",
      titleEn: "Book",
      appliesTo: [],
    });
    book = await db
      .getRepository(EducationClassBook)
      .save({ classroom, book: textbook, teacher });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom, student });
    service = new ClassGradesService(
      db.getRepository(ClassBookGrade),
      db.getRepository(ClassBookGradeSession),
      db.getRepository(EducationClassBook),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(AttendanceSession),
      db.getRepository(Student),
      db.getRepository(User),
    );
  });
  afterEach(async () => {
    await db.destroy();
  });

  it("lets the assigned teacher create and update a grade; students read only their own", async () => {
    const teacherActor = actor(teacher, "TEACHER");
    const created = await service.createSession(teacherActor, book.id, {
      title: "Quiz",
      heldOn: "2026-11-11",
    });
    gradeSessionId = created.id;
    const initial = await service.save(teacherActor, book.id, gradeSessionId, {
      studentId: student.id,
      score: 14,
      note: "First",
    });
    expect(initial.principalEdited).toBe(false);
    expect(
      (await service.list(teacherActor, book.id)).sessions[0].grades[0]?.score,
    ).toBe(14);
    expect(
      (await service.mine(actor(learner, "STUDENT"))).map(
        (grade) => grade.score,
      ),
    ).toEqual([14]);
    await expect(
      service.save(teacherActor, book.id, gradeSessionId, {
        studentId: outsider.id,
        score: 10,
        note: "",
      }),
    ).rejects.toMatchObject({ status: 422 });
    await service.save(teacherActor, book.id, gradeSessionId, {
      studentId: student.id,
      score: 15,
      note: "Updated",
    });
    expect(await db.getRepository(ClassBookGrade).count()).toBe(1);
  });

  it("keeps the principal edit marker after a later teacher update and lets REM read only", async () => {
    gradeSessionId = (
      await service.createSession(actor(teacher, "TEACHER"), book.id, {
        title: "Quiz",
        heldOn: "2026-11-11",
      })
    ).id;
    await service.save(actor(principal, "PRINCIPAL"), book.id, gradeSessionId, {
      studentId: student.id,
      score: 18,
      note: "Review",
    });
    const reviewed = await service.list(
      actor(rem, "RELIGIOUS_EDUCATION_MANAGER"),
      book.id,
    );
    expect(reviewed.sessions[0].grades[0]?.principalEdited).toBe(true);
    await expect(
      service.save(
        actor(rem, "RELIGIOUS_EDUCATION_MANAGER"),
        book.id,
        gradeSessionId,
        {
          studentId: student.id,
          score: 20,
          note: "",
        },
      ),
    ).rejects.toMatchObject({ status: 403 });
    const afterTeacher = await service.save(
      actor(teacher, "TEACHER"),
      book.id,
      gradeSessionId,
      { studentId: student.id, score: 17, note: "" },
    );
    expect(afterTeacher.principalEdited).toBe(true);
  });

  it("rejects a different organization or an unassigned teacher", async () => {
    const secondTeacher = await db.getRepository(User).save({
      username: "second",
      passwordHash: "fixture",
      role: UserRole.TEACHER,
    });
    await expect(
      service.list(actor(secondTeacher, "TEACHER"), book.id),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.list(actor(principal, "PRINCIPAL", "other-org"), book.id),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.mine(actor(principal, "PRINCIPAL")),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("requires a session belonging to the selected book before saving a score", async () => {
    await expect(
      service.save(actor(teacher, "TEACHER"), book.id, "missing", {
        studentId: student.id,
        score: 12,
        note: "",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(await db.getRepository(ClassBookGrade).count()).toBe(0);
  });
  it("allows correction of session context and blocks deletion while it has grades", async () => {
    const principalActor = actor(principal, "PRINCIPAL");
    const session = await service.createSession(principalActor, book.id, {
      title: "Quiz",
      heldOn: "2026-11-11",
    });
    const changed = await service.updateSession(
      principalActor,
      book.id,
      session.id,
      { title: "Chapter quiz", heldOn: "2026-11-12" },
    );
    expect(changed.title).toBe("Chapter quiz");
    await service.save(principalActor, book.id, session.id, {
      studentId: student.id,
      score: 16,
      note: "",
    });
    await expect(
      service.removeSession(principalActor, book.id, session.id),
    ).rejects.toMatchObject({ status: 409 });
    await service.remove(principalActor, book.id, session.id, student.id);
    expect(
      await service.removeSession(principalActor, book.id, session.id),
    ).toEqual({ deleted: true });
  });
  it("returns only this class and book's attendance with student statuses", async () => {
    const organization = await db
      .getRepository(Organization)
      .findOneByOrFail({ id: organizationId });
    const attendance = db.getRepository(AttendanceSession);
    const matching = await attendance.save(
      attendance.create({
        organization,
        contextType: "class",
        contextId: book.classroom.id,
        subjectIdSnapshot: "textbook",
        sessionDate: new Date("2026-11-11T08:00:00Z"),
        titleSnapshot: "Lesson",
      }),
    );
    await attendance.save(
      attendance.create({
        organization,
        contextType: "class",
        contextId: book.classroom.id,
        subjectIdSnapshot: "other-book",
        sessionDate: new Date("2026-11-12T08:00:00Z"),
        titleSnapshot: "Other",
      }),
    );
    await db
      .getRepository(AttendanceRecord)
      .save({ session: matching, student, status: AttendanceStatus.LATE });
    const result = await service.attendanceSessions(
      actor(principal, "PRINCIPAL"),
      book.id,
    );
    expect(result.total).toBe(1);
    expect(result.items[0].records).toEqual([
      { studentId: student.id, status: "late" },
    ]);
  });
});
