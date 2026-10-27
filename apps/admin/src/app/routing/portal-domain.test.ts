import { describe, expect, it } from "vitest";
import {
  adminRouteSegment,
  isRouteAvailableOnDomain,
  loginDestination,
  portalUrl,
  preferredPortal,
  preferredRoleForDomain,
  resolveAppDomain,
} from "./portal-domain";

describe("portal-domain", () => {
  it.each([
    ["stud.sultano.ir", "student"],
    ["app.sultano.ir", "admin"],
    ["stud.localhost", "student"],
    ["app.localhost", "admin"],
    ["localhost", "local"],
    ["APP.SULTANO.IR.", "admin"],
    ["not-app.sultano.ir", "unknown"],
    ["evilapp.sultano.ir", "unknown"],
  ] as const)("resolves %s as %s using exact hosts", (host, domain) => {
    expect(resolveAppDomain(host)).toBe(domain);
  });

  it("keeps student-only routes off the administration host", () => {
    expect(adminRouteSegment("/admin/my-attendance?day=today")).toBe("my-attendance");
    expect(isRouteAvailableOnDomain("/admin/my-attendance", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/my-rewards", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/my-attendance", "admin")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin/achievements", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/achievements", "admin")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin/coin-shop", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/coin-shop", "admin")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/students", "student")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin/students", "admin")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/schedule", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/communication/notifications", "student")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin/communication/sms", "student")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin//students", "student")).toBe(false);
    expect(isRouteAvailableOnDomain("/admin/schedule", "admin")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/students", "unknown")).toBe(false);
  });

  it("chooses the administrative portal for a multi-role account", () => {
    expect(preferredPortal(["STUDENT", "TEACHER"])).toBe("admin");
    expect(preferredRoleForDomain(["STUDENT", "TEACHER"], "admin")).toBe("TEACHER");
    expect(preferredRoleForDomain(["STUDENT", "TEACHER"], "student")).toBe("STUDENT");
  });

  it("keeps guardian-only accounts on the student portal", () => {
    expect(preferredPortal(["GUARDIAN"])).toBe("student");
    expect(preferredRoleForDomain(["GUARDIAN"], "student")).toBe("GUARDIAN");
    expect(preferredRoleForDomain(["GUARDIAN"], "admin")).toBeNull();
    expect(isRouteAvailableOnDomain("/admin/family", "student")).toBe(true);
    expect(isRouteAvailableOnDomain("/admin/family", "admin")).toBe(false);
  });

  it("preserves an authorized student deep link and otherwise uses the normal portal", () => {
    expect(loginDestination(["STUDENT"], "/admin/profile?tab=security")).toEqual({
      domain: "student",
      path: "/admin/profile?tab=security",
    });
    expect(loginDestination(["STUDENT", "TEACHER"], "/admin/students")).toEqual({
      domain: "admin",
      path: "/admin/students",
    });
  });

  it("uses host-specific URLs without embedding a hostname into the build", () => {
    expect(
      portalUrl("student", "/admin/profile", {
        protocol: "http:",
        hostname: "app.localhost",
        port: "5173",
      }),
    ).toBe("http://stud.localhost:5173/admin/profile");
    expect(
      portalUrl("admin", "/admin", {
        protocol: "http:",
        hostname: "stud.sultano.ir",
        port: "",
      }),
    ).toBe("https://app.sultano.ir/admin");
  });
});
