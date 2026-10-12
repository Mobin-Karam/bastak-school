import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Student } from "../src/database/entities/student.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassBook } from "../src/database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { EducationBook } from "../src/database/entities/education-book.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { StudyGroup } from "../src/database/entities/study-group.entity";
import { StudyGroupMembership } from "../src/database/entities/study-group-membership.entity";
import { ClassGroupsService } from "../src/modules/class-groups/class-groups.service";
import { ClassGroupsController } from "../src/modules/class-groups/class-groups.controller";
import { ClassesService } from "../src/modules/classes/classes.service";
import { SchoolAccessService } from "../src/modules/school-access";
import { CapabilitiesGuard } from "../src/common/guards/capabilities.guard";
import type { AuthenticatedUser } from "../src/modules/auth";

describe("Class groups (real SQLite)", () => {
  let db: DataSource;
  let service: ClassGroupsService;
  let actor: AuthenticatedUser;
  let org: Organization;
  let otherOrg: Organization;
  let classroom: EducationClass;
  let otherClass: EducationClass;
  let group: StudyGroup;
  let alice: Student;
  let bob: Student;
  let outsider: Student;
  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(entities).filter(
        (value) => typeof value === "function",
      ),
      synchronize: true,
    }).initialize();
    [org, otherOrg] = await db.getRepository(Organization).save([
      { name: "School A", type: OrganizationType.SCHOOL },
      { name: "School B", type: OrganizationType.SCHOOL },
    ]);
    const user = await db.getRepository(User).save({
      username: "staff",
      passwordHash: "fixture-only",
      role: UserRole.TEACHER,
    });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: org, user });
    actor = {
      id: user.id,
      username: user.username,
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: [
        "class_groups.read",
        "class_groups.manage",
        "classes.roster.manage",
      ],
      organizationIds: [org.id],
      activeOrganizationId: org.id,
      sessionId: "fixture",
    };
    [classroom, otherClass] = await db.getRepository(EducationClass).save([
      {
        organization: org,
        code: "a",
        name: "Class A",
        schoolYear: "1405",
        gradeId: 7,
        educationTypeId: "general",
        trackId: "general",
      },
      {
        organization: otherOrg,
        code: "b",
        name: "Class B",
        schoolYear: "1405",
        gradeId: 7,
        educationTypeId: "general",
        trackId: "general",
      },
    ]);
    [alice, bob, outsider] = await db.getRepository(Student).save([
      { name: "Alice", organization: org, gradeId: 7 },
      { name: "Bob", organization: org, gradeId: 7 },
      { name: "Outsider", organization: otherOrg, gradeId: 7 },
    ]);
    await db.getRepository(EducationClassEnrollment).save([
      { classroom, student: alice },
      { classroom, student: bob },
    ]);
    group = await db.getRepository(StudyGroup).save({
      organization: org,
      classroom,
      code: "first",
      name: "First group",
    });
    const access = new SchoolAccessService(
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
    );
    service = new ClassGroupsService(
      db.getRepository(EducationClass),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(StudyGroup),
      db.getRepository(StudyGroupMembership),
      db.getRepository(Student),
      access,
    );
  });
  const classService = () =>
    new ClassesService(
      db.getRepository(EducationClass),
      db.getRepository(EducationClassBook),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(EducationBook),
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
      db.getRepository(Student),
      db.getRepository(User),
      db.getRepository(UserRoleAssignment),
      { requireCapability: jest.fn() } as never,
      {} as never,
    );
  afterEach(async () => {
    await db.destroy();
  });
  it("normalizes group identity, edits details, and rejects duplicate codes", async () => {
    const created = await service.create(actor, {
      classId: classroom.id,
      code: "  SECOND  ",
      name: " Second group ",
    });
    expect(created).toMatchObject({
      code: "second",
      name: "Second group",
      classId: classroom.id,
    });
    await expect(
      service.create(actor, {
        classId: classroom.id,
        code: "Second",
        name: "Duplicate",
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_GROUP_CODE_EXISTS" } },
    });
    expect(
      await service.update(actor, created.id, {
        name: " Renamed ",
        description: " Notes ",
      }),
    ).toMatchObject({ name: "Renamed", description: "Notes" });
    await expect(
      service.create(actor, {
        classId: classroom.id,
        code: "   ",
        name: "Blank",
      }),
    ).rejects.toBeDefined();
  });
  it("allows only students enrolled in the same class and organization", async () => {
    await service.setMembers(actor, group.id, [alice.id]);
    await expect(
      service.setMembers(actor, group.id, [outsider.id]),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_GROUP_MEMBER_NOT_ENROLLED" } },
    });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom, student: outsider });
    await expect(
      service.setMembers(actor, group.id, [outsider.id]),
    ).rejects.toBeDefined();
    expect(
      (await service.members(actor, group.id)).map((item) => item.id),
    ).toEqual([alice.id]);
  });
  it("rolls back roster deletion when inserting replacement memberships fails", async () => {
    await service.setMembers(actor, group.id, [alice.id]);
    await db.query(
      `CREATE TRIGGER fail_group_membership BEFORE INSERT ON study_group_memberships WHEN NEW.studentId = '${bob.id}' BEGIN SELECT RAISE(ABORT, 'fixture insertion failure'); END`,
    );
    await expect(service.setMembers(actor, group.id, [bob.id])).rejects.toThrow(
      "fixture insertion failure",
    );
    expect(
      (await service.members(actor, group.id)).map((item) => item.id),
    ).toEqual([alice.id]);
  });
  it("supports explicitly clearing a group roster", async () => {
    await service.setMembers(actor, group.id, [alice.id, bob.id]);
    expect(await service.setMembers(actor, group.id, [])).toEqual({
      groupId: group.id,
      count: 0,
    });
    expect(await service.members(actor, group.id)).toEqual([]);
  });
  it("rejects foreign-school writes, mismatched work scope, and missing capabilities", async () => {
    await expect(
      service.create(actor, {
        classId: otherClass.id,
        name: "Foreign",
        code: "foreign",
      }),
    ).rejects.toBeDefined();
    await expect(
      service.setMembers(
        { ...actor, activeOrganizationId: otherOrg.id },
        group.id,
        [],
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_GROUP_WORK_CONTEXT_MISMATCH" } },
    });
    await expect(
      service.setMembers(
        { ...actor, capabilities: ["class_groups.read"] },
        group.id,
        [],
      ),
    ).rejects.toBeDefined();
  });
  it("exposes class options through group capabilities and restricts teachers to assigned classes", async () => {
    expect(await service.classOptions(actor)).toHaveLength(1);
    expect(
      (await service.eligibleStudents(actor, classroom.id)).map(
        (item) => item.name,
      ),
    ).toEqual(["Alice", "Bob"]);
    const teacher = {
      ...actor,
      role: "TEACHER",
      roles: ["TEACHER"],
      capabilities: ["class_groups.read"],
    };
    expect(await service.list(teacher)).toEqual([]);
    await expect(service.members(teacher, group.id)).rejects.toBeDefined();
    await db
      .getRepository(EducationClass)
      .update(classroom.id, { advisor: { id: actor.id } });
    expect(await service.classOptions(teacher)).toHaveLength(1);
    expect(await service.list(teacher)).toHaveLength(1);
  });
  it("blocks archived class/group membership changes", async () => {
    await db
      .getRepository(EducationClass)
      .update(classroom.id, { status: "ARCHIVED" });
    await expect(
      service.setMembers(actor, group.id, [alice.id]),
    ).rejects.toBeDefined();
    await expect(
      service.create(actor, {
        classId: classroom.id,
        name: "New",
        code: "new",
      }),
    ).rejects.toBeDefined();
  });
  it("prunes group memberships when class enrollments change", async () => {
    await service.setMembers(actor, group.id, [alice.id, bob.id]);
    const classes = classService();
    await classes.setEnrollments(actor, classroom.id, { studentIds: [bob.id] });
    expect(
      (await service.members(actor, group.id)).map((item) => item.id),
    ).toEqual([bob.id]);
    await classes.setEnrollments(actor, classroom.id, { studentIds: [] });
    expect(await service.members(actor, group.id)).toEqual([]);
  });
  it("rolls back class enrollment changes if group membership cleanup fails", async () => {
    await service.setMembers(actor, group.id, [alice.id, bob.id]);
    await db.query(
      `CREATE TRIGGER fail_group_cleanup BEFORE DELETE ON study_group_memberships BEGIN SELECT RAISE(ABORT, 'fixture cleanup failure'); END`,
    );
    await expect(
      classService().setEnrollments(actor, classroom.id, {
        studentIds: [alice.id],
      }),
    ).rejects.toThrow("fixture cleanup failure");
    expect(
      await db
        .getRepository(EducationClassEnrollment)
        .count({ where: { classroom: { id: classroom.id } } }),
    ).toBe(2);
    expect(await service.members(actor, group.id)).toHaveLength(2);
  });
  it("deletes group memberships without deleting the class or student accounts", async () => {
    await service.setMembers(actor, group.id, [alice.id]);
    expect(await service.remove(actor, group.id)).toEqual({ deleted: true });
    expect(await db.getRepository(StudyGroupMembership).count()).toBe(0);
    expect(await db.getRepository(Student).count()).toBe(3);
    expect(await db.getRepository(EducationClass).count()).toBe(2);
  });
  it("validates DTOs and capabilities through the real HTTP routes", async () => {
    const module = await Test.createTestingModule({
      controllers: [ClassGroupsController],
      providers: [{ provide: ClassGroupsService, useValue: service }],
    }).compile();
    const app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix("api/v2");
    app.useGlobalGuards(new CapabilitiesGuard(new Reflector()));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app
      .getHttpAdapter()
      .getInstance()
      .addHook("preHandler", async (request) => {
        (request as typeof request & { user: AuthenticatedUser }).user = actor;
      });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    try {
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v2/class-groups/classes",
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v2/class-groups",
            payload: { classId: classroom.id, name: " ", code: " " },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/api/v2/class-groups/${group.id}/members`,
            payload: { studentIds: [alice.id, alice.id] },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/api/v2/class-groups/${group.id}/members`,
            payload: {
              studentIds: Array.from({ length: 1001 }, () => alice.id),
            },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/api/v2/class-groups/${group.id}`,
            payload: { name: "Updated" },
          })
        ).statusCode,
      ).toBe(200);
      actor.capabilities = ["class_groups.read"];
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/api/v2/class-groups/${group.id}`,
            payload: { name: "Forbidden" },
          })
        ).statusCode,
      ).toBe(403);
    } finally {
      await app.close();
    }
  });
});
