import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import { AuthService } from "../src/modules/auth/auth.service";
import { Session } from "../src/database/entities/session.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Student } from "../src/database/entities/student.entity";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../src/database/entities/organization-membership.entity";

function repo<T>(items: T[] = []) {
  return {
    findOne: jest.fn(
      async ({ where }: { where: Partial<T> }) =>
        items.find((item) =>
          Object.entries(where).every(
            ([key, value]) => (item as Record<string, unknown>)[key] === value,
          ),
        ) || null,
    ),
    find: jest.fn(async () => items),
    save: jest.fn(async (item: T) => ({ id: "session-1", ...item })),
    create: jest.fn((item: T) => item),
    delete: jest.fn(async () => ({ affected: 1 })),
  };
}

describe("AuthService", () => {
  it("selects the first active membership as a non-platform user's organization context", async () => {
    const user = {
      id: "teacher-1",
      username: "teacher",
      role: UserRole.ADMIN,
      firstName: "Teacher",
      lastName: "One",
    } as User;
    const memberships = repo<OrganizationMembership>([
      {
        id: "membership-a",
        status: MembershipStatus.ACTIVE,
        organization: { id: "org-a", name: "School A", type: "SCHOOL" },
      } as OrganizationMembership,
      {
        id: "membership-b",
        status: MembershipStatus.ACTIVE,
        organization: { id: "org-b", name: "School B", type: "SCHOOL" },
      } as OrganizationMembership,
    ]);
    const authorization = {
      enrich: jest.fn(async (_user, role, organizationId) => ({
        id: user.id,
        username: user.username,
        role: UserRole.ADMIN,
        roles: ["TEACHER"],
        capabilities: [`scoped:${organizationId ?? "platform"}`],
        organizationIds: ["org-a", "org-b"],
        membershipIds: ["membership-a", "membership-b"],
        ...(role ? { role } : {}),
      })),
    };
    const service = new AuthService(
      repo([user]) as any,
      repo() as any,
      repo() as any,
      { get: (_key: string, fallback: unknown) => fallback } as ConfigService,
      memberships as any,
      authorization as any,
    );

    const context = await service.context({
      id: user.id,
      username: user.username,
      role: UserRole.ADMIN,
      sessionId: "session-1",
      roles: ["TEACHER"],
      organizationIds: ["org-a", "org-b"],
    });

    expect(context.activeOrganization).toMatchObject({
      id: "org-a",
      name: "School A",
    });
    expect(context.capabilities).toEqual(["scoped:org-a"]);
    expect(authorization.enrich).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      "org-a",
    );
  });

  it("creates a session for valid credentials", async () => {
    const user = {
      id: "u1",
      username: "09123456789",
      phoneNumber: "09123456789",
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash("secret", 4),
    } as User;
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo([user]) },
        { provide: getRepositoryToken(Session), useValue: repo() },
        { provide: getRepositoryToken(Student), useValue: repo() },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    const result = await module.get(AuthService).login("09123456789", "secret");
    expect(result.user.phoneNumber).toBe("09123456789");
    expect(result.csrfToken).toBeTruthy();
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshExpiresAt.getTime()).toBeGreaterThan(
      result.expiresAt.getTime(),
    );
  });

  it("rotates access, refresh, and CSRF credentials together", async () => {
    const user = {
      id: "u1",
      username: "09123456789",
      phoneNumber: "09123456789",
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash("secret", 4),
    } as User;
    const sessions = repo<Session>();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo([user]) },
        { provide: getRepositoryToken(Session), useValue: sessions },
        { provide: getRepositoryToken(Student), useValue: repo() },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();
    const auth = module.get(AuthService);
    const original = await auth.login("09123456789", "secret");
    sessions.findOne.mockResolvedValueOnce({ ...original.session, user });

    const rotated = await auth.refresh(
      original.refreshToken,
      original.csrfToken,
    );

    expect(rotated.accessToken).not.toBe(original.accessToken);
    expect(rotated.refreshToken).not.toBe(original.refreshToken);
    expect(rotated.csrfToken).not.toBe(original.csrfToken);
    expect(sessions.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tokenHash: expect.any(String),
        refreshTokenHash: expect.any(String),
        csrfToken: rotated.csrfToken,
      }),
    );
  });

  it("rejects refresh for a student account deactivated after login", async () => {
    const user = {
      id: "u1",
      username: "student",
      role: UserRole.STUDENT,
    } as User;
    const session = {
      id: "session-1",
      user,
      refreshTokenHash: "hash",
      csrfToken: "csrf",
      expiresAt: new Date(Date.now() + 60_000),
      refreshExpiresAt: new Date(Date.now() + 60_000),
    } as Session;
    const sessions = repo<Session>();
    sessions.findOne.mockResolvedValueOnce(session);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo([user]) },
        { provide: getRepositoryToken(Session), useValue: sessions },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            ...repo(),
            findOne: jest.fn(async () => ({
              accountStatus: "archived",
              user: { id: "u1" },
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    await expect(
      module.get(AuthService).refresh("refresh", "csrf"),
    ).rejects.toMatchObject({
      response: { error: { code: "ACCOUNT_INACTIVE" } },
    });
    expect(sessions.delete).toHaveBeenCalledWith({ id: "session-1" });
  });

  it("rejects an access token for a student account deactivated after login", async () => {
    const user = {
      id: "u1",
      username: "student",
      role: UserRole.STUDENT,
    } as User;
    const sessions = repo<Session>();
    sessions.findOne.mockResolvedValueOnce({
      id: "session-1",
      user,
      expiresAt: new Date(Date.now() + 60_000),
    } as Session);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo([user]) },
        { provide: getRepositoryToken(Session), useValue: sessions },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            ...repo(),
            findOne: jest.fn(async () => ({
              accountStatus: "inactive",
              user: { id: "u1" },
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    await expect(
      module.get(AuthService).userFromToken("access"),
    ).resolves.toBeNull();
    expect(sessions.delete).toHaveBeenCalledWith({ id: "session-1" });
  });

  it("changes the password and revokes other sessions", async () => {
    const user = {
      id: "u1",
      username: "student",
      role: UserRole.STUDENT,
      passwordHash: await bcrypt.hash("current-password", 4),
    } as User;
    const users = repo([user]);
    const sessions = repo();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: getRepositoryToken(Session), useValue: sessions },
        {
          provide: getRepositoryToken(Student),
          useValue: repo([
            { accountStatus: "active", user: { id: "u1" } },
          ] as any[]),
        },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    await expect(
      module
        .get(AuthService)
        .changePassword(
          {
            id: "u1",
            username: "student",
            role: UserRole.STUDENT,
            sessionId: "current",
          },
          "current-password",
          "a-new-password-long-enough",
        ),
    ).resolves.toEqual({ changed: true, otherSessionsRevoked: true });
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", passwordHash: expect.any(String) }),
    );
    expect(sessions.delete).toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    const user = {
      id: "u1",
      passwordHash: await bcrypt.hash("current-password", 4),
    } as User;
    const sessions = repo();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo([user]) },
        { provide: getRepositoryToken(Session), useValue: sessions },
        { provide: getRepositoryToken(Student), useValue: repo() },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    await expect(
      module
        .get(AuthService)
        .changePassword(
          {
            id: "u1",
            username: "student",
            role: UserRole.STUDENT,
            sessionId: "current",
          },
          "wrong-password",
          "a-new-password-long-enough",
        ),
    ).rejects.toMatchObject({
      response: { error: { code: "INVALID_CREDENTIALS" } },
    });
    expect(sessions.delete).not.toHaveBeenCalled();
  });

  it("does not allow revoking the current session", async () => {
    const sessions = repo();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo() },
        { provide: getRepositoryToken(Session), useValue: sessions },
        { provide: getRepositoryToken(Student), useValue: repo() },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();

    await expect(
      module
        .get(AuthService)
        .revokeSession(
          {
            id: "u1",
            username: "student",
            role: UserRole.STUDENT,
            sessionId: "current",
          },
          "current",
        ),
    ).rejects.toMatchObject({
      response: { error: { code: "CURRENT_SESSION" } },
    });
    expect(sessions.delete).not.toHaveBeenCalled();
  });
});
