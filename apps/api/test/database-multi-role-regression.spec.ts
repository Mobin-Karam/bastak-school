import "reflect-metadata";
import { migratedDatabase } from "./helpers/migrated-database";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../src/modules/auth/auth.service";
import {
  User,
  UserRole,
  UserStatus,
} from "../src/database/entities/user.entity";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { Role } from "../src/database/entities/role.entity";
import { Student } from "../src/database/entities/student.entity";
import {
  UserRelationship,
  RelationshipType,
  RelationshipStatus,
} from "../src/database/entities/user-relationship.entity";
import { AuthorizationService } from "../src/modules/authorization/authorization.service";
import { RelationshipsService } from "../src/modules/relationships/relationships.service";
import { UsersService } from "../src/modules/users/users.service";
import {
  Conversation,
  ConversationType,
} from "../src/database/entities/conversation.entity";
import { Session } from "../src/database/entities/session.entity";

describe("database and multi-role regression (migration-built SQLite)", () => {
  let db: DataSource;
  let auth: AuthorizationService;
  let links: RelationshipsService;
  let users: UsersService;
  let teacher: User;
  let manager: User;
  let studentA: Student;
  let studentB: Student;
  let schoolA: Organization;
  let schoolB: Organization;
  let memberA: OrganizationMembership;
  let memberB: OrganizationMembership;

  async function assign(
    user: User,
    code: string,
    membership: OrganizationMembership | null,
  ) {
    const role = await db.getRepository(Role).findOneByOrFail({ code });
    return db
      .getRepository(UserRoleAssignment)
      .save({ user, role, membership });
  }
  beforeEach(async () => {
    db = await migratedDatabase();
    const userRepo = db.getRepository(User);
    teacher = await userRepo.save({
      username: "teacher",
      passwordHash: "unused",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    manager = await userRepo.save({
      username: "manager",
      passwordHash: "unused",
      role: UserRole.ADMIN,
    });
    const orgs = db.getRepository(Organization);
    schoolA = await orgs.save({ name: "A", type: OrganizationType.SCHOOL });
    schoolB = await orgs.save({ name: "B", type: OrganizationType.SCHOOL });
    memberA = await db
      .getRepository(OrganizationMembership)
      .save({ user: teacher, organization: schoolA });
    memberB = await db
      .getRepository(OrganizationMembership)
      .save({ user: teacher, organization: schoolB });
    const managerMember = await db
      .getRepository(OrganizationMembership)
      .save({ user: manager, organization: schoolA });
    await assign(teacher, "TEACHER", memberA);
    await assign(teacher, "PRINCIPAL", memberB);
    await assign(manager, "PRINCIPAL", managerMember);
    studentA = await db
      .getRepository(Student)
      .save({ name: "A student", organization: schoolA });
    studentB = await db
      .getRepository(Student)
      .save({ name: "B student", organization: schoolB });
    auth = new AuthorizationService(
      db.getRepository(UserRoleAssignment),
      db.getRepository(OrganizationMembership),
      db.getRepository(UserRelationship),
      db.getRepository(Student),
    );
    links = new RelationshipsService(
      db.getRepository(UserRelationship),
      userRepo,
      db.getRepository(Student),
      orgs,
      db.getRepository(OrganizationMembership),
      db.getRepository(UserRoleAssignment),
      { createForUsers: jest.fn() } as never,
    );
    users = new UsersService(
      userRepo,
      db.getRepository(UserRoleAssignment),
      db.getRepository(Session),
      db,
    );
  });
  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });
  const base = (user: User) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    sessionId: "test",
  });

  it("scopes both effective roles and permissions to the selected school", async () => {
    const context = await auth.enrich(base(teacher), undefined, schoolA.id);
    expect(context.roles).toEqual(["TEACHER"]);
    expect(
      await auth.canAccessStudent(context, studentA.id, "students.read"),
    ).toBe(false);
    await expect(
      auth.enrich(base(teacher), "PRINCIPAL", schoolA.id),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("does not combine tenant authority when organization headers are omitted", async () => {
    const context = await auth.enrich(base(teacher));
    expect(context.organizationIds).toHaveLength(1);
    expect(context.roles).toHaveLength(1);
  });
  it("supports supervisor, teacher, and counselor on one membership", async () => {
    await assign(teacher, "SCHOOL_SUPERVISOR", memberA);
    await assign(teacher, "COUNSELOR", memberA);
    const context = await auth.enrich(base(teacher), undefined, schoolA.id);
    expect(context.roles.sort()).toEqual([
      "COUNSELOR",
      "SCHOOL_SUPERVISOR",
      "TEACHER",
    ]);
    const work = await auth.enrich(base(teacher), "TEACHER", schoolA.id);
    expect(work.roles).toEqual(["TEACHER"]);
    expect(work.capabilities).not.toContain("users.manage");
  });
  it("rejects creating a relationship to a student in another school", async () => {
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    await expect(
      links.create(actor, {
        fromUserId: teacher.id,
        toStudentId: studentB.id,
        organizationId: schoolA.id,
        type: RelationshipType.TEACHER_OF,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("does not let the source user restore a revoked relationship", async () => {
    const relation = await db.getRepository(UserRelationship).save({
      fromUser: teacher,
      toStudent: studentA,
      organization: schoolA,
      type: RelationshipType.TEACHER_OF,
      status: RelationshipStatus.REVOKED,
    });
    const actor = await auth.enrich(base(teacher), "TEACHER", schoolA.id);
    await expect(
      links.update(actor, relation.id, { status: RelationshipStatus.ACTIVE }),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (
        await db
          .getRepository(UserRelationship)
          .findOneByOrFail({ id: relation.id })
      ).status,
    ).toBe("REVOKED");
  });
  it("allows an authorized school manager to restore an eligible revoked link", async () => {
    const relation = await db
      .getRepository(UserRelationship)
      .save({
        fromUser: teacher,
        toStudent: studentA,
        organization: schoolA,
        type: RelationshipType.TEACHER_OF,
        status: RelationshipStatus.REVOKED,
      });
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    expect(
      await links.update(actor, relation.id, {
        status: RelationshipStatus.ACTIVE,
      }),
    ).toMatchObject({ status: "ACTIVE" });
  });
  it("accepts a valid pending relationship and enforces the work-role relationship type", async () => {
    await assign(teacher, "COUNSELOR", memberA);
    const relation = await db.getRepository(UserRelationship).save({
      fromUser: teacher,
      toStudent: studentA,
      organization: schoolA,
      type: RelationshipType.TEACHER_OF,
      status: RelationshipStatus.PENDING,
    });
    const actor = await auth.enrich(base(teacher), "TEACHER", schoolA.id);
    await links.update(actor, relation.id, {
      status: RelationshipStatus.ACTIVE,
    });
    expect(
      await auth.canAccessStudent(actor, studentA.id, "students.read"),
    ).toBe(true);
    const counselor = await auth.enrich(base(teacher), "COUNSELOR", schoolA.id);
    expect(
      await auth.canAccessStudent(counselor, studentA.id, "students.read"),
    ).toBe(false);
  });
  it("does not expose another school's user assignments", async () => {
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    expect(
      (await users.get(actor, teacher.id)).assignments.map((a) => a.role),
    ).toEqual(["TEACHER"]);
  });
  it("provisions a student profile when STUDENT is added to an existing staff account", async () => {
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    await users.setRoles(actor, teacher.id, {
      roleCodes: ["STUDENT", "TEACHER"],
      organizationId: schoolA.id,
    });
    expect(
      await db.getRepository(Student).findOne({
        where: { user: { id: teacher.id } },
        relations: { organization: true },
      }),
    ).toMatchObject({
      organization: { id: schoolA.id },
      accountStatus: "active",
    });
  });
  it("creates and logs in a new student/teacher account with its provisioned profile", async () => {
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    const created = await users.create(actor, {
      phoneNumber: "09123456789",
      password: "TestPassword123!",
      firstName: "New",
      roleCodes: ["STUDENT", "TEACHER"],
      organizationId: schoolA.id,
    });
    const authentication = new AuthService(
      db.getRepository(User),
      db.getRepository(Session),
      db.getRepository(Student),
      { get: (_key: string, fallback: unknown) => fallback } as ConfigService,
      db.getRepository(OrganizationMembership),
      auth,
    );
    const result = await authentication.login(
      "09123456789",
      "TestPassword123!",
    );
    expect(result.user.id).toBe(created.id);
    expect(
      await db
        .getRepository(Student)
        .count({ where: { user: { id: created.id } } }),
    ).toBe(1);
  });
  it.each([UserRole.ADMIN, UserRole.STUDENT])(
    "keeps staff login independent of a legacy %s label and inactive student profile",
    async (legacy) => {
      await db.getRepository(User).update(teacher.id, {
        role: legacy,
        phoneNumber: "09123456789",
        passwordHash: await bcrypt.hash("TestPassword123!", 4),
      });
      await assign(teacher, "STUDENT", memberA);
      await db.getRepository(Student).save({
        name: "Inactive",
        user: teacher,
        organization: schoolA,
        accountStatus: "inactive",
      });
      const authentication = new AuthService(
        db.getRepository(User),
        db.getRepository(Session),
        db.getRepository(Student),
        { get: (_key: string, fallback: unknown) => fallback } as ConfigService,
        db.getRepository(OrganizationMembership),
        auth,
      );
      const result = await authentication.login(
        "09123456789",
        "TestPassword123!",
      );
      expect(result.user.id).toBe(teacher.id);
      await expect(
        auth.enrich(base(teacher), "STUDENT", schoolA.id),
      ).rejects.toMatchObject({ status: 403 });
      expect(
        (await auth.enrich(base(teacher), "TEACHER", schoolA.id)).roles,
      ).toEqual(["TEACHER"]);
    },
  );
  it("does not allow a school manager to deactivate a shared account globally", async () => {
    const actor = await auth.enrich(base(manager), "PRINCIPAL", schoolA.id);
    await expect(
      users.setActive(actor, teacher.id, false),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await db.getRepository(User).findOneByOrFail({ id: teacher.id })).status,
    ).toBe("ACTIVE");
  });
  it("removes revoked membership links from the student's visible relationship list", async () => {
    const relation = await db.getRepository(UserRelationship).save({
      fromUser: teacher,
      toStudent: studentA,
      organization: schoolA,
      type: RelationshipType.TEACHER_OF,
      status: RelationshipStatus.ACTIVE,
    });
    const context = await auth.enrich(base(teacher), "TEACHER", schoolA.id);
    expect(await links.myStudents(context)).toHaveLength(1);
    await db.query(
      "UPDATE organization_memberships SET status='REMOVED' WHERE id=?",
      [memberA.id],
    );
    expect(await links.myStudents(context)).toHaveLength(0);
    // Fresh request authority also removes the inactive membership role.
    await expect(
      auth.enrich(base(teacher), "TEACHER", schoolA.id),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (
        await db
          .getRepository(UserRelationship)
          .findOneByOrFail({ id: relation.id })
      ).status,
    ).toBe("ACTIVE");
  });
  it("keeps all entity columns, nullability, and declared foreign keys aligned with migrations", async () => {
    for (const metadata of db.entityMetadatas) {
      const columns = await db.query(
        `PRAGMA table_info("${metadata.tableName}")`,
      );
      for (const column of metadata.columns) {
        const actual = columns.find(
          (item: { name: string }) => item.name === column.databaseName,
        );
        expect(actual).toBeDefined();
        if (!column.isPrimary)
          expect({
            table: metadata.tableName,
            column: column.databaseName,
            nullable: !actual.notnull,
          }).toEqual({
            table: metadata.tableName,
            column: column.databaseName,
            nullable: column.isNullable,
          });
      }
      const keys = await db.query(
        `PRAGMA foreign_key_list("${metadata.tableName}")`,
      );
      for (const key of metadata.foreignKeys)
        expect(keys).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              from: key.columnNames[0],
              table: key.referencedTablePath,
              on_delete: key.onDelete ?? "NO ACTION",
            }),
          ]),
        );
    }
  });
  it("enforces student/user uniqueness", async () => {
    await db.getRepository(Student).save({ name: "first", user: teacher });
    await expect(
      db.getRepository(Student).save({ name: "second", user: teacher }),
    ).rejects.toThrow();
  });
  it("enforces unscoped role uniqueness and membership ownership", async () => {
    await assign(manager, "PLATFORM_ADMIN", null);
    await expect(assign(manager, "PLATFORM_ADMIN", null)).rejects.toThrow();
    await expect(assign(manager, "TEACHER", memberA)).rejects.toThrow();
  });
  it("enforces role scope on insert and membership ownership changes", async () => {
    await expect(assign(manager, "TEACHER", null)).rejects.toThrow();
    await expect(assign(teacher, "PLATFORM_ADMIN", memberA)).rejects.toThrow();
    await expect(
      db.query("UPDATE organization_memberships SET userId=? WHERE id=?", [
        manager.id,
        memberA.id,
      ]),
    ).rejects.toThrow();
  });
  it.each([
    ["conversations", "organizationId", "organizations", "CASCADE"],
    ["chat_messages", "linkedTaskId", "tasks", "SET NULL"],
    [
      "school_schedule_entries",
      "classBookId",
      "education_class_books",
      "SET NULL",
    ],
    ["attendance_records", "reviewedById", "users", "SET NULL"],
    ["exit_permissions", "returnVerifiedById", "users", "SET NULL"],
  ])(
    "enforces the migrated foreign key for %s.%s",
    async (table, column, target, onDelete) => {
      expect(await db.query(`PRAGMA foreign_key_list("${table}")`)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: column,
            table: target,
            on_delete: onDelete,
          }),
        ]),
      );
      // No row needs to be inserted to exercise a missing parent: update a real conversation.
      if (table === "conversations") {
        const conversation = await db
          .getRepository(Conversation)
          .save({ type: ConversationType.GROUP, organization: schoolA });
        await expect(
          db.query(
            "UPDATE conversations SET organizationId='missing' WHERE id=?",
            [conversation.id],
          ),
        ).rejects.toThrow();
      }
      expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
    },
  );
});
