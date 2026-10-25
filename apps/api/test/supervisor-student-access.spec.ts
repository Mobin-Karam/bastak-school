import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { In } from "typeorm";
import { Student } from "../src/database/entities/student.entity";
import { UserRelationship } from "../src/database/entities/user-relationship.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import {
  AuthorizationService,
  UserContext,
} from "../src/modules/authorization";
import { StudentAdministrationService } from "../src/modules/students/student-administration.service";

describe("supervisor student access", () => {
  const context: UserContext = {
    id: "supervisor",
    username: "supervisor",
    sessionId: "session",
    role: "SCHOOL_SUPERVISOR",
    roles: ["SCHOOL_SUPERVISOR"],
    capabilities: ["students.read"],
    membershipIds: ["membership"],
    organizationIds: ["school-a"],
    activeOrganizationId: "school-a",
  };
  const student = {
    id: "student-a",
    name: "Student A",
    organization: { id: "school-a", name: "School A" },
  };
  let students: { find: jest.Mock; findOne: jest.Mock };
  let relationships: { find: jest.Mock; findOne: jest.Mock };
  let service: StudentAdministrationService;
  let authorization: AuthorizationService;

  beforeEach(async () => {
    students = {
      find: jest.fn().mockResolvedValue([student]),
      findOne: jest.fn().mockResolvedValue(student),
    };
    relationships = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const module = await Test.createTestingModule({
      providers: [StudentAdministrationService, AuthorizationService],
    })
      .useMocker((token) => {
        if (token === getRepositoryToken(Student)) return students;
        if (token === getRepositoryToken(UserRelationship))
          return relationships;
        if (token === getRepositoryToken(OrganizationMembership))
          return { findOne: jest.fn().mockResolvedValue(null) };
        return {};
      })
      .compile();
    service = module.get(StudentAdministrationService);
    authorization = module.get(AuthorizationService);
  });

  it("lists school students without an assigned relationship", async () => {
    expect(await service.list(context)).toEqual([
      expect.objectContaining({ id: student.id }),
    ]);
    expect(students.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization: { id: In(["school-a"]) } },
      }),
    );
    expect(relationships.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "GUARDIAN_OF",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("projects active linked guardians without exposing credentials", async () => {
    relationships.find.mockResolvedValueOnce([
      {
        toStudent: { id: student.id },
        fromUser: {
          id: "guardian-a",
          firstName: "مریم",
          lastName: "نمونه",
          phoneNumber: "09120000000",
        },
      },
    ]);

    const [projected] = await service.list(context);

    expect(projected).toEqual(
      expect.objectContaining({
        guardians: [
          { id: "guardian-a", name: "مریم نمونه", phoneNumber: "09120000000" },
        ],
      }),
    );
    expect(projected).not.toHaveProperty("password");
  });

  it("returns student details within the supervisor's school", async () => {
    expect(await service.get(context, student.id)).toEqual(
      expect.objectContaining({ id: student.id }),
    );
  });

  it("does not list a requested foreign school", async () => {
    expect(await service.list(context, "school-b")).toEqual([]);
    expect(students.find).not.toHaveBeenCalled();
  });

  it("does not query all students when the supervisor has no organization scope", async () => {
    expect(await service.list({ ...context, organizationIds: [] })).toEqual([]);
    expect(students.find).not.toHaveBeenCalled();
  });

  it("denies unlinked foreign-school details", async () => {
    students.findOne.mockResolvedValue({
      ...student,
      organization: { id: "school-b" },
    });
    await expect(service.get(context, student.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("still requires the requested capability", async () => {
    expect(
      await authorization.canAccessStudent(
        { ...context, capabilities: [] },
        student.id,
        "students.read",
      ),
    ).toBe(false);
    expect(students.findOne).not.toHaveBeenCalled();
  });

  it("allows a principal with students.archive to archive a student in their school", async () => {
    const principal: UserContext = {
      ...context,
      id: "principal",
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: ["students.archive"],
    };

    await expect(
      authorization.canAccessStudent(principal, student.id, "students.archive"),
    ).resolves.toBe(true);
  });
});
