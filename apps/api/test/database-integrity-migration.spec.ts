import { DataSource } from "typeorm";
import { DatabaseRelationshipIntegrity1730700000000 } from "../src/database/migrations/1730700000000-DatabaseRelationshipIntegrity";
import { migratedDatabase } from "./helpers/migrated-database";
import { User, UserRole } from "../src/database/entities/user.entity";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { Student } from "../src/database/entities/student.entity";
import {
  Conversation,
  ConversationType,
} from "../src/database/entities/conversation.entity";
import { ConversationMember } from "../src/database/entities/conversation-member.entity";
import {
  ChatMessage,
  ChatMessageType,
} from "../src/database/entities/chat-message.entity";
import { Task, TaskType } from "../src/database/entities/task.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";
import { ExitPermission } from "../src/database/entities/exit-permission.entity";
import { SchoolScheduleEntry } from "../src/database/entities/school-schedule-entry.entity";
import { EducationClassBook } from "../src/database/entities/education-class-book.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationBook } from "../src/database/entities/education-book.entity";

describe("relationship integrity upgrade preserves populated SQLite", () => {
  let db: DataSource;
  let user: User;
  let org: Organization;
  let student: Student;
  beforeEach(async () => {
    db = await migratedDatabase(false);
    user = await db.getRepository(User).save({
      username: "integrity-user",
      passwordHash: "unused",
      role: UserRole.ADMIN,
    });
    org = await db
      .getRepository(Organization)
      .save({ name: "Integrity school", type: OrganizationType.SCHOOL });
    student = await db
      .getRepository(Student)
      .save({ name: "Student", organization: org });
  });
  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });
  const upgrade = async () => {
    const q = db.createQueryRunner();
    try {
      await new DatabaseRelationshipIntegrity1730700000000().up(q);
    } finally {
      await q.release();
    }
  };
  it("preserves conversation children, custom indexes/triggers, and applies CASCADE to all organization chats", async () => {
    const chat = await db.getRepository(Conversation).save({
      type: ConversationType.GROUP,
      organization: org,
      autoManaged: false,
    });
    const member = await db
      .getRepository(ConversationMember)
      .save({ conversation: chat, user });
    const message = await db.getRepository(ChatMessage).save({
      sender: user,
      receiverId: user.id,
      conversation: chat,
      type: ChatMessageType.TEXT,
      content: "Retained",
    });
    await db.query("CREATE INDEX audit_chat_title ON conversations(title)");
    await db.query("CREATE TABLE audit_chat_changes(id varchar)");
    await db.query(
      "CREATE TRIGGER audit_chat_update AFTER UPDATE ON conversations BEGIN INSERT INTO audit_chat_changes VALUES(NEW.id); END",
    );
    await upgrade();
    expect(
      await db.getRepository(ConversationMember).findOneBy({ id: member.id }),
    ).not.toBeNull();
    expect(
      await db.getRepository(ChatMessage).findOneBy({ id: message.id }),
    ).not.toBeNull();
    expect(
      await db.query(
        "SELECT name FROM sqlite_master WHERE name='audit_chat_title'",
      ),
    ).toHaveLength(1);
    await db.getRepository(Conversation).update(chat.id, { title: "Changed" });
    expect(await db.query("SELECT * FROM audit_chat_changes")).toHaveLength(1);
    // The existing partial unique index must survive the rebuild.
    await db.getRepository(Conversation).save({
      type: ConversationType.GROUP,
      organization: org,
      autoManaged: true,
    });
    await expect(
      db.getRepository(Conversation).save({
        type: ConversationType.GROUP,
        organization: org,
        autoManaged: true,
      }),
    ).rejects.toThrow();
    await db.getRepository(Organization).delete(org.id);
    expect(
      await db.getRepository(Conversation).findOneBy({ id: chat.id }),
    ).toBeNull();
    expect(
      await db.getRepository(ConversationMember).findOneBy({ id: member.id }),
    ).toBeNull();
    expect(
      await db.getRepository(ChatMessage).findOneBy({ id: message.id }),
    ).toBeNull();
    expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
  });
  it("enforces SET NULL for task links, attendance reviewers, exit verifiers, and class-book links", async () => {
    const task = await db
      .getRepository(Task)
      .save({ type: TaskType.STUDY, title: "Task" });
    const message = await db.getRepository(ChatMessage).save({
      sender: user,
      receiverId: user.id,
      type: ChatMessageType.TEXT,
      content: "Task",
      linkedTask: task,
    });
    const session = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "class",
      contextId: "class",
      sessionDate: new Date(),
    });
    const record = await db
      .getRepository(AttendanceRecord)
      .save({ session, student, reviewedBy: user });
    const exit = await db.getRepository(ExitPermission).save({
      organization: org,
      student,
      requestedDepartureAt: new Date(),
      destination: "home",
      reason: "test",
      returnVerifiedBy: user,
    });
    const classroom = await db.getRepository(EducationClass).save({
      organization: org,
      code: "A",
      name: "A",
      schoolYear: "2026",
      gradeId: 1,
      educationTypeId: "general",
      trackId: "general",
    });
    const book = await db.getRepository(EducationBook).save({
      id: "integrity-book",
      country: "IR",
      schoolYear: "2026",
      grade: 1,
      level: "school",
      branch: "general",
      track: "general",
      category: "test",
      titleFa: "Book",
      titleEn: "Book",
      appliesTo: [],
    });
    const classBook = await db
      .getRepository(EducationClassBook)
      .save({ classroom, teacher: user, book });
    const lesson = await db.getRepository(SchoolScheduleEntry).save({
      organization: org,
      classroom,
      classBook,
      title: "Lesson",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    });
    await upgrade();
    for (const [table, column, id] of [
      ["chat_messages", "linkedTaskId", message.id],
      ["attendance_records", "reviewedById", record.id],
      ["exit_permissions", "returnVerifiedById", exit.id],
      ["school_schedule_entries", "classBookId", lesson.id],
    ])
      await expect(
        db.query(`UPDATE "${table}" SET "${column}"='missing' WHERE id=?`, [
          id,
        ]),
      ).rejects.toThrow();
    await db.getRepository(Task).delete(task.id);
    expect(
      (
        await db.query("SELECT linkedTaskId FROM chat_messages WHERE id=?", [
          message.id,
        ])
      )[0].linkedTaskId,
    ).toBeNull();
    await db.getRepository(EducationClassBook).delete(classBook.id);
    // Sender cascades are intentional; use a separate reviewer so the message survives.
    await db.getRepository(User).delete(user.id);
    expect(
      (
        await db.query(
          "SELECT reviewedById FROM attendance_records WHERE id=?",
          [record.id],
        )
      )[0].reviewedById,
    ).toBeNull();
    expect(
      (
        await db.query(
          "SELECT returnVerifiedById FROM exit_permissions WHERE id=?",
          [exit.id],
        )
      )[0].returnVerifiedById,
    ).toBeNull();
    expect(
      (
        await db.query(
          "SELECT classBookId FROM school_schedule_entries WHERE id=?",
          [lesson.id],
        )
      )[0].classBookId,
    ).toBeNull();
    expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
  });
  it("detaches dangling optional references without deleting their records", async () => {
    const chat = await db
      .getRepository(Conversation)
      .save({ type: ConversationType.GROUP, organization: { id: "missing" } });
    await upgrade();
    expect(
      (
        await db.query("SELECT organizationId FROM conversations WHERE id=?", [
          chat.id,
        ])
      )[0].organizationId,
    ).toBeNull();
  });
  it("rolls back rather than guessing duplicate student ownership", async () => {
    await db.getRepository(Student).save({ name: "First", user });
    await db.getRepository(Student).save({ name: "Second", user });
    await expect(upgrade()).rejects.toThrow("Duplicate students.userId");
    expect((await db.query("PRAGMA foreign_keys"))[0].foreign_keys).toBe(1);
    expect(
      await db
        .getRepository(Student)
        .count({ where: { user: { id: user.id } } }),
    ).toBe(2);
    expect(
      await db.query(
        "SELECT name FROM sqlite_master WHERE name='UQ_students_user'",
      ),
    ).toEqual([]);
  });
  it("deduplicates global assignments without changing authority", async () => {
    await db.query(
      "INSERT INTO user_role_assignments(id,userId,roleId) SELECT 'first',?,id FROM roles WHERE code='PLATFORM_ADMIN'",
      [user.id],
    );
    await db.query(
      "INSERT INTO user_role_assignments(id,userId,roleId) SELECT 'second',?,id FROM roles WHERE code='PLATFORM_ADMIN'",
      [user.id],
    );
    await upgrade();
    expect(
      await db.query("SELECT * FROM user_role_assignments WHERE userId=?", [
        user.id,
      ]),
    ).toHaveLength(1);
    await expect(
      db.query(
        "INSERT INTO user_role_assignments(id,userId,roleId) SELECT 'third',?,id FROM roles WHERE code='PLATFORM_ADMIN'",
        [user.id],
      ),
    ).rejects.toThrow();
  });
  it("repairs an existing student-role account without a profile in its assigned school", async () => {
    await db.query(
      "INSERT INTO organization_memberships(id,userId,organizationId) VALUES('student-member',?,?)",
      [user.id, org.id],
    );
    await db.query(
      "INSERT INTO user_role_assignments(id,userId,roleId,membershipId) SELECT 'student-role',?,id,'student-member' FROM roles WHERE code='STUDENT'",
      [user.id],
    );
    await upgrade();
    expect(
      await db
        .getRepository(Student)
        .findOne({
          where: { user: { id: user.id } },
          relations: { organization: true },
        }),
    ).toMatchObject({
      name: user.username,
      organization: { id: org.id },
      accountStatus: "active",
    });
  });
  it("refuses conflicting duplicate personal relationship decisions", async () => {
    await db.query(
      "INSERT INTO user_relationships(id,fromUserId,toStudentId,type,status) VALUES('one',?,?,'GUARDIAN_OF','ACTIVE'),('two',?,?,'GUARDIAN_OF','REVOKED')",
      [user.id, student.id, user.id, student.id],
    );
    await expect(upgrade()).rejects.toThrow(
      "Conflicting duplicate personal relationships",
    );
    expect(
      await db.query("SELECT * FROM user_relationships WHERE fromUserId=?", [
        user.id,
      ]),
    ).toHaveLength(2);
  });
  it("enforces personal relationship uniqueness when organization is null", async () => {
    await db.query(
      "INSERT INTO user_relationships(id,fromUserId,toStudentId,type,status) VALUES('one',?,?,'GUARDIAN_OF','ACTIVE'),('two',?,?,'GUARDIAN_OF','ACTIVE')",
      [user.id, student.id, user.id, student.id],
    );
    await upgrade();
    expect(
      await db.query("SELECT * FROM user_relationships WHERE fromUserId=?", [
        user.id,
      ]),
    ).toHaveLength(1);
    await expect(
      db.query(
        "INSERT INTO user_relationships(id,fromUserId,toStudentId,type,status) VALUES('three',?,?,'GUARDIAN_OF','ACTIVE')",
        [user.id, student.id],
      ),
    ).rejects.toThrow();
  });
  it("rejects mismatched assignment ownership and restores enforcement on failure", async () => {
    const other = await db.getRepository(User).save({
      username: "other",
      passwordHash: "unused",
      role: UserRole.ADMIN,
    });
    await db.query(
      "INSERT INTO organization_memberships(id,userId,organizationId) VALUES('foreign-member',?,?)",
      [other.id, org.id],
    );
    await db.query(
      "INSERT INTO user_role_assignments(id,userId,roleId,membershipId) SELECT 'bad',?,id,'foreign-member' FROM roles WHERE code='TEACHER'",
      [user.id],
    );
    await expect(upgrade()).rejects.toThrow("Invalid role assignment");
    expect((await db.query("PRAGMA foreign_keys"))[0].foreign_keys).toBe(1);
    expect(
      await db.query("SELECT * FROM user_role_assignments WHERE id='bad'"),
    ).toHaveLength(1);
  });
});
