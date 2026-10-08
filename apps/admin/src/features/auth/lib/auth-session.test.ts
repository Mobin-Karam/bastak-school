import { describe, expect, it } from "vitest";
import { adminPortalRole, isSupportedAdminPortalRole } from "./auth-session";

describe("released Admin role selection", () => {
  it("selects a released workspace before an unreleased secondary role", () => {
    expect(adminPortalRole(["COUNSELOR", "TEACHER"])).toBe("TEACHER");
  });

  it("keeps an unreleased role authenticated so it can receive the coming-soon modal", () => {
    expect(adminPortalRole(["COUNSELOR"])).toBe("COUNSELOR");
    expect(isSupportedAdminPortalRole("COUNSELOR")).toBe(false);
  });

  it.each([
    "PLATFORM_ADMIN",
    "PRINCIPAL",
    "SCHOOL_SUPERVISOR",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
  ] as const)("allows the released %s role", (role) => {
    expect(isSupportedAdminPortalRole(role)).toBe(true);
  });
});
