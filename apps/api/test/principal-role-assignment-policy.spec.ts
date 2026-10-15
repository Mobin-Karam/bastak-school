import { assertRoleCodesAssignableByActor } from "../src/modules/organizations/organization-role-policy";

const principal = {
  id: "principal-1",
  username: "principal",
  role: "ADMIN",
  sessionId: "session-1",
  roles: ["PRINCIPAL"],
};

describe("Principal account provisioning policy", () => {
  it.each(["STUDENT", "SCHOOL_SUPERVISOR", "TEACHER", "GUARDIAN", "COUNSELOR", "DISCIPLINARIAN"])(
    "allows a Principal to assign %s",
    (role) => {
      expect(() =>
        assertRoleCodesAssignableByActor(principal, [role]),
      ).not.toThrow();
    },
  );

  it("rejects a role outside the Principal provisioning list", () => {
    try {
      assertRoleCodesAssignableByActor(principal, ["ORGANIZATION_ADMIN"]);
      fail("Expected the Principal assignment policy to reject ORGANIZATION_ADMIN.");
    } catch (error) {
      expect(error).toMatchObject({
        response: { error: { code: "PRINCIPAL_ROLE_ASSIGNMENT_RESTRICTED" } },
      });
    }
  });

  it("does not narrow platform administrator authority", () => {
    expect(() =>
      assertRoleCodesAssignableByActor(
        { ...principal, roles: ["PRINCIPAL", "PLATFORM_ADMIN"] },
        ["ORGANIZATION_ADMIN"],
      ),
    ).not.toThrow();
  });
});
