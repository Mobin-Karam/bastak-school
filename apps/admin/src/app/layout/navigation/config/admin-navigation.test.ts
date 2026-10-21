import { describe, expect, it } from "vitest";
import {
  adminBreadcrumbs,
  adminDestination,
  adminNavigation,
  educationCapabilities,
  educationNavigation,
  flatAdminNavigation,
  localizedNavigationForCapabilities,
  mainNavigationForCapabilities,
  navigationForCapabilities,
  normalizeAdminPath,
  resolveAdminNavigation,
} from "./admin-navigation";
describe("school navigation registry", () => {
  it("defines unique destinations with descriptions", () => {
    expect(new Set(flatAdminNavigation.map((item) => item.path)).size).toBe(
      flatAdminNavigation.length,
    );
    expect(flatAdminNavigation.every((item) => item.title && item.description)).toBe(true);
    expect(adminNavigation.every((group) => group.items.length)).toBe(true);
    expect(flatAdminNavigation.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        "classes",
        "class-groups",
        "attendance",
        "dormitory",
        "students",
        "users",
        "organizations",
        "settings",
      ]),
    );
  });
  it("keeps school education capability declarations in the registry", () => {
    expect(educationNavigation.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        "classes",
        "schedule",
        "class-groups",
        "attendance",
        "my-attendance",
      ]),
    );
    expect(educationCapabilities).toEqual(
      expect.arrayContaining(["classes.read", "attendance.read", "class_groups.read"]),
    );
  });
  it("shows role labels without granting capabilities", () => {
    const items = mainNavigationForCapabilities(
      ["users.read", "organization.read"],
      "PLATFORM_ADMIN",
    );
    expect(items.map((item) => item.title)).toContain("نمای پلتفرم");
    expect(items[0]).toMatchObject({ path: "", section: "داشبورد" });
    expect(
      navigationForCapabilities([], "PLATFORM_ADMIN")
        .flatMap((group) => group.items)
        .some((item) => item.path === "users"),
    ).toBe(false);
  });
  it("filters protected destinations by active capabilities", () => {
    const paths = navigationForCapabilities(["students.read"]).flatMap((group) =>
      group.items.map((item) => item.path),
    );
    expect(paths).toContain("students");
    expect(paths).not.toContain("users");
    expect(paths).not.toContain("organizations");
    expect(paths).not.toContain("attendance");
  });
  it("resolves nested school routes and preserves clean destinations", () => {
    expect(normalizeAdminPath("/admin/classes/42?tab=roster")).toBe("classes/42");
    expect(resolveAdminNavigation("/admin/classes/42").path).toBe("classes");
    expect(adminDestination("attendance", "آموزش", "student-1")).toBe("/admin/attendance");
  });
  it("does not duplicate section landing breadcrumbs", () => {
    expect(adminBreadcrumbs("")).toEqual([{ title: "خانه", path: "" }]);
    const crumbs = adminBreadcrumbs("classes");
    expect(new Set(crumbs.map((item) => item.path)).size).toBe(crumbs.length);
  });
  it("keeps the dashboard out of contextual navigation while resolving it at the root", () => {
    expect(
      navigationForCapabilities([], "TEACHER").flatMap((group) => group.items),
    ).not.toContainEqual(expect.objectContaining({ path: "" }));
    expect(resolveAdminNavigation("/admin", "TEACHER")).toMatchObject({
      path: "",
      section: "داشبورد",
      title: "میز استاد",
    });
  });
  it("localizes the same capability-filtered destinations", () => {
    const fa = navigationForCapabilities(["students.read", "attendance.read"]);
    const en = localizedNavigationForCapabilities(["students.read", "attendance.read"], null, "en");
    expect(en.flatMap((group) => group.items.map((item) => item.path))).toEqual(
      fa.flatMap((group) => group.items.map((item) => item.path)),
    );
    expect(
      en
        .find((group) => group.section === "Management")
        ?.items.find((item) => item.path === "students")?.title,
    ).toBe("Students");
  });
});
