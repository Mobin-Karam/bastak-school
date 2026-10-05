import { UsersService } from "../src/modules/users/users.service";
import { User, UserRole, UserStatus } from "../src/database/entities/user.entity";
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
  return { service: new UsersService(users as any, assignments as any, sessions as any, dataSource as any), users, sessions };
}

describe("UsersService account safety", () => {
  it("rejects deactivating the currently logged-in account", async () => {
    const { service, users, sessions } = serviceFor({ id: actor.id });

    await expect(service.setActive(actor, actor.id, false)).rejects.toMatchObject({
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

    await expect(service.setRoles(actor, actor.id, { roleCodes: ["ADVISOR"] })).rejects.toMatchObject({
      response: { error: { code: "SELF_ACCOUNT_PROTECTED" } },
    });
  });

  it("requires ownership transfer before changing an owner account", async () => {
    const { service, users } = serviceFor({ id: "other-owner", isPlatformOwner: true });

    await expect(service.setActive(actor, "other-owner", false)).rejects.toMatchObject({
      response: { error: { code: "PLATFORM_OWNER_PROTECTED" } },
    });
    expect(users.update).not.toHaveBeenCalled();
  });
});
