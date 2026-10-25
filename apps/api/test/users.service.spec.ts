import { UsersService } from "../src/modules/users/users.service";
import {
  User,
  UserRole,
  UserStatus,
} from "../src/database/entities/user.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";

const actor = {
  id: "owner-1",
  username: "owner",
  role: UserRole.PLATFORM_ADMIN,
  sessionId: "session-1",
  roles: ["PLATFORM_ADMIN"],
  capabilities: ["users.manage"],
};

function serviceFor(target: Partial<User>) {
  const user = {
    id: "member-1",
    username: "member",
    status: UserStatus.ACTIVE,
    isPlatformOwner: false,
    ...target,
  } as User;
  const assignments = {
    find: jest.fn(async () => [
      {
        id: "assignment-1",
        user,
        role: { code: "PLATFORM_ADMIN", permissions: [] },
        membership: null,
        createdAt: new Date(),
      } as unknown as UserRoleAssignment,
    ]),
  };
  const users = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const sessions = { delete: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  return {
    service: new UsersService(
      users as any,
      assignments as any,
      sessions as any,
      dataSource as any,
    ),
    users,
    sessions,
  };
}

function principalServiceFor(target: Partial<User>) {
  const user = {
    id: "teacher-1",
    username: "teacher",
    status: UserStatus.ACTIVE,
    isPlatformOwner: false,
    ...target,
  } as User;
  const assignments = {
    find: jest.fn(async () => [
      {
        id: "assignment-1",
        user,
        role: { code: "TEACHER", permissions: [] },
        membership: {
          status: "ACTIVE",
          organization: { id: "school-1" },
        },
        createdAt: new Date(),
      } as unknown as UserRoleAssignment,
    ]),
  };
  const users = { findOne: jest.fn(), update: jest.fn() };
  const sessions = { delete: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  return {
    service: new UsersService(
      users as any,
      assignments as any,
      sessions as any,
      dataSource as any,
    ),
    users,
    sessions,
  };
}

describe("UsersService account safety", () => {
  it("excludes student accounts from a staff-only listing", async () => {
    const { service } = serviceFor({ role: UserRole.STUDENT });

    await expect(
      service.list(actor, undefined, undefined, undefined, true),
    ).resolves.toEqual([]);
  });

  it("rejects deactivating the currently logged-in account", async () => {
    const { service, users, sessions } = serviceFor({ id: actor.id });

    await expect(
      service.setActive(actor, actor.id, false),
    ).rejects.toMatchObject({
      response: { error: { code: "SELF_ACCOUNT_PROTECTED" } },
    });
    expect(users.update).not.toHaveBeenCalled();
    expect(sessions.delete).not.toHaveBeenCalled();
  });

  it("rejects archiving the currently logged-in account", async () => {
    const { service, users, sessions } = serviceFor({ id: actor.id });

    await expect(service.archive(actor, actor.id)).rejects.toMatchObject({
      response: { error: { code: "SELF_ACCOUNT_PROTECTED" } },
    });
    expect(users.update).not.toHaveBeenCalled();
    expect(sessions.delete).not.toHaveBeenCalled();
  });

  it("rejects replacing the current account roles", async () => {
    const { service } = serviceFor({ id: actor.id });

    await expect(
      service.setRoles(actor, actor.id, { roleCodes: ["ADVISOR"] }),
    ).rejects.toMatchObject({
      response: { error: { code: "SELF_ACCOUNT_PROTECTED" } },
    });
  });

  it("requires ownership transfer before changing an owner account", async () => {
    const { service, users } = serviceFor({
      id: "other-owner",
      isPlatformOwner: true,
    });

    await expect(
      service.setActive(actor, "other-owner", false),
    ).rejects.toMatchObject({
      response: { error: { code: "PLATFORM_OWNER_PROTECTED" } },
    });
    expect(users.update).not.toHaveBeenCalled();
  });

  it("lets an authorized manager reset a user password and revokes target sessions", async () => {
    const { service, users, sessions } = serviceFor({ id: "staff-1" });

    await service.update(actor, "staff-1", { password: "ReplacementPassword123" });

    expect(users.update).toHaveBeenCalledWith(
      "staff-1",
      expect.objectContaining({ passwordHash: expect.any(String) }),
    );
    expect(sessions.delete).toHaveBeenCalledWith({ user: { id: "staff-1" } });
  });

  it("allows a principal to reset a staff password inside their active school", async () => {
    const { service, users, sessions } = principalServiceFor({
      id: "teacher-1",
    });

    await service.update(principal, "teacher-1", {
      password: "ReplacementPassword123",
    });

    expect(users.update).toHaveBeenCalledWith(
      "teacher-1",
      expect.objectContaining({ passwordHash: expect.any(String) }),
    );
    expect(sessions.delete).toHaveBeenCalledWith({ user: { id: "teacher-1" } });
  });

  it("allows a principal to archive a staff account inside their active school", async () => {
    const { service, users, sessions } = principalServiceFor({
      id: "teacher-1",
    });

    await expect(service.archive(principal, "teacher-1")).resolves.toEqual({
      userId: "teacher-1",
      status: UserStatus.ARCHIVED,
    });

    expect(users.update).toHaveBeenCalledWith("teacher-1", {
      status: UserStatus.ARCHIVED,
    });
    expect(sessions.delete).toHaveBeenCalledWith({ user: { id: "teacher-1" } });
  });

  it("keeps self-service password changes on the account settings flow", async () => {
    const { service, users, sessions } = serviceFor({ id: actor.id });

    await expect(service.update(actor, actor.id, { password: "ReplacementPassword123" })).rejects.toMatchObject({
      response: { error: { code: "SELF_PASSWORD_RESET_FORBIDDEN" } },
    });
    expect(users.update).not.toHaveBeenCalled();
    expect(sessions.delete).not.toHaveBeenCalled();
  });
});
