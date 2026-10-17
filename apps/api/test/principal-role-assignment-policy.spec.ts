import { assertRoleCodesAssignableByActor } from "../src/modules/organizations/organization-role-policy";

const principal = {
  id: "principal-1",
  username: "principal",
  role: "ADMIN",
  sessionId: "session-1",
  roles: ["PRINCIPAL"],
};

describe("Principal account provisioning policy", () => {
  it.each([
    "STUDENT",
    "SCHOOL_SUPERVISOR",
    "TEACHER",
    "GUARDIAN",
    "RELIGIOUS_EDUCATION_MANAGER",
    "GOVERNMENT_EDUCATION_MANAGER",
    "STUDENT_AFFAIRS_MENTOR",
    "COUNSELOR",
    "ADVISOR",
    "MENTOR",
    "CONTENT_MANAGER",
    "ORGANIZATION_ADMIN",
    "PRINCIPAL",
    "SCHOOL_ADMIN",
  ])("allows a Principal to assign %s", (role) => {
    expect(() =>
      assertRoleCodesAssignableByActor(principal, [role]),
    ).not.toThrow();
  });

  it("keeps the duplicate disciplinarian role out of Principal provisioning", () => {
    try {
      assertRoleCodesAssignableByActor(principal, ["DISCIPLINARIAN"]);
      fail(
        "Expected the Principal assignment policy to reject DISCIPLINARIAN.",
      );
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
        ["DISCIPLINARIAN"],
      ),
    ).not.toThrow();
  });
});
