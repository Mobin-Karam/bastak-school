import { describe, expect, it } from "vitest";
import { adminPortalRole, isSupportedAdminPortalRole } from "./auth-session";

describe("Admin role selection", () => {
  it("keeps the AccountContext role order when every existing Admin role is supported", () => {
    expect(adminPortalRole(["COUNSELOR", "SCHOOL_SUPERVISOR"])).toBe("COUNSELOR");
  });

  it("supports valid contextual school roles without fabricating a migration", () => {
    expect(adminPortalRole(["COUNSELOR"])).toBe("COUNSELOR");
    expect(isSupportedAdminPortalRole("COUNSELOR")).toBe(true);
  });

  it.each(["PRINCIPAL", "SCHOOL_SUPERVISOR", "STUDENT", "TEACHER"] as const)(
    "allows the released %s role",
    (role) => {
      expect(isSupportedAdminPortalRole(role)).toBe(true);
    },
  );

  it.each(["PLATFORM_ADMIN", "GUARDIAN", "RELIGIOUS_EDUCATION_MANAGER"] as const)(
    "supports the valid %s account",
    (role) => {
      expect(isSupportedAdminPortalRole(role)).toBe(true);
    },
  );
});
