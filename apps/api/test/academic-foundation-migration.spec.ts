import { migratedDatabase } from "./helpers/migrated-database";
import { AcademicSchedulingFoundation1730900000000 } from "../src/database/migrations/1730900000000-AcademicSchedulingFoundation";
import { DataSource } from "typeorm";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Student } from "../src/database/entities/student.entity";

describe("academic foundation populated SQLite upgrade", () => {
  let db: DataSource;
  beforeEach(async () => {
    db = await migratedDatabase(true, ["1730900000000"]);
  });
  afterEach(async () => {
    await db.destroy();
  });
  async function upgrade() {
    const q = db.createQueryRunner();
    await q.startTransaction();
    try {
      await new AcademicSchedulingFoundation1730900000000().up(q);
      await q.commitTransaction();
    } catch (error) {
      await q.rollbackTransaction();
      throw error;
    } finally {
      await q.release();
    }
  }
  it("preserves classes, enrollments, books, lessons, custom triggers and indexes without inferring a year", async () => {
    const org = await db.manager.save(
      Organization,
      db.manager.create(Organization, {
        name: "School",
        type: OrganizationType.SCHOOL,
      }),
    );
    const teacher = await db.manager.save(
      User,
      db.manager.create(User, {
        username: "teacher",
        passwordHash: "fixture",
        role: UserRole.TEACHER,
      }),
    );
    const student = await db.manager.save(
      Student,
      db.manager.create(Student, { name: "Student", organization: org }),
    );
    await db.query(
      `INSERT INTO education_classes(id,organizationId,code,name,schoolYear,gradeId,educationTypeId,trackId) VALUES('class',?,'A','Class','1405',1,'school','general')`,
      [org.id],
    );
    await db.query(
      `INSERT INTO education_class_enrollments(id,classroomId,studentId) VALUES('enrollment','class',?)`,
      [student.id],
    );
    await db.query(
      `INSERT INTO education_books(id,country,schoolYear,grade,level,branch,track,category,titleFa,titleEn,appliesTo,createdAt,updatedAt) VALUES('book','IR','1405',1,'school','general','general','subject','نحو','Nahw','[]',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    );
    await db.query(
      `INSERT INTO education_class_books(id,classroomId,bookId,teacherId) VALUES('classbook','class','book',?)`,
      [teacher.id],
    );
    await db.query(
      `INSERT INTO school_schedule_entries(id,organizationId,classroomId,classBookId,teacherId,title,weekday,startTime,endTime) VALUES('lesson',?,'class','classbook',?,'Lesson',0,'08:00','09:00')`,
      [org.id, teacher.id],
    );
    await db.query(`CREATE TABLE class_change_probe(id varchar)`);
    await db.query(
      `CREATE TRIGGER class_change_probe_trigger AFTER UPDATE ON education_classes BEGIN INSERT INTO class_change_probe VALUES(NEW.id); END`,
    );
    await db.query(
      `CREATE INDEX class_custom_index ON education_classes(name)`,
    );
    await upgrade();
    for (const table of [
      "education_classes",
      "education_class_enrollments",
      "education_class_books",
      "school_schedule_entries",
    ]) {
      expect(await db.query(`SELECT * FROM ${table}`)).toHaveLength(1);
    }
    expect(
      (await db.query(`SELECT academicYearId FROM education_classes`))[0]
        .academicYearId,
    ).toBeNull();
    expect(
      await db.query(
        `SELECT name FROM sqlite_master WHERE name='class_custom_index'`,
      ),
    ).toHaveLength(1);
    await db.query(
      `UPDATE education_classes SET name='Updated' WHERE id='class'`,
    );
    expect(await db.query(`SELECT * FROM class_change_probe`)).toHaveLength(1);
    expect(await db.query(`PRAGMA foreign_key_check`)).toEqual([]);
    expect((await db.query(`PRAGMA foreign_keys`))[0].foreign_keys).toBe(1);
  });
  it("rejects duplicate active years atomically and preserves all historical values", async () => {
    const org = await db.manager.save(
      Organization,
      db.manager.create(Organization, {
        name: "School",
        type: OrganizationType.SCHOOL,
      }),
    );
    for (const id of ["year-one", "year-two"])
      await db.query(
        `INSERT INTO timetable_academic_years(id,organizationId,name,startsOn,endsOn,timeZone,active) VALUES(?,?,?,'2026-01-01','2026-12-31','Asia/Tehran',1)`,
        [id, org.id, id],
      );
    await expect(upgrade()).rejects.toThrow("Multiple active academic years");
    expect(
      await db.query(`SELECT * FROM timetable_academic_years`),
    ).toHaveLength(2);
    expect(
      (await db.query(`PRAGMA table_info(education_classes)`)).some(
        (c: { name: string }) => c.name === "academicYearId",
      ),
    ).toBe(false);
  });
});
