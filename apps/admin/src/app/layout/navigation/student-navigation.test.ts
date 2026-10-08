import { describe, expect, it } from "vitest";
import { navigationForCapabilities, resolveAdminNavigation } from "./admin-navigation";

describe("student navigation", () => {
  it("adds registration only when the student has registration access", () => {
    const paths = navigationForCapabilities(
      ["schedule.read", "attendance.self.read", "registration.read"] as const,
      "STUDENT",
    ).flatMap((group) => group.items.map((item) => item.path));

    expect(paths).toEqual(["", "schedule", "registration", "profile", "settings"]);
  });

  it("resolves personal routes so the mobile dock retains the active destination", () => {
    expect(resolveAdminNavigation("/admin/profile", "STUDENT")).toMatchObject({
      section: "پروفایل",
      path: "profile",
    });
    expect(resolveAdminNavigation("/admin/registration", "STUDENT")).toMatchObject({
      section: "ثبت‌نام",
      path: "registration",
    });
    expect(resolveAdminNavigation("/admin/schedule", "STUDENT")).toMatchObject({
      section: "برنامه من",
      path: "schedule",
    });
  });
});

describe("teacher navigation", () => {
  it("adds registration only when the teacher has registration access", () => {
    const paths = navigationForCapabilities(
      ["schedule.read", "attendance.manage", "registration.read"] as const,
      "TEACHER",
    ).flatMap((group) => group.items.map((item) => item.path));

    expect(paths).toEqual([
      "",
      "schedule",
      "teacher-chat",
      "teacher-profile",
      "settings",
      "registration",
    ]);
  });

  it("resolves teacher personal routes without falling back to staff navigation", () => {
    expect(resolveAdminNavigation("/admin/teacher-chat", "TEACHER")).toMatchObject({
      section: "گفت‌وگو",
      path: "teacher-chat",
    });
    expect(resolveAdminNavigation("/admin/teacher-profile", "TEACHER")).toMatchObject({
      section: "پروفایل",
      path: "teacher-profile",
    });
  });
});

describe("supervisor navigation", () => {
  it("exposes school operations and registration only when the server grants them", () => {
    const paths = navigationForCapabilities(
      [
        "schedule.read",
        "classes.read",
        "attendance.read",
        "students.read",
        "registration.read",
      ] as const,
      "SCHOOL_SUPERVISOR",
    ).flatMap((group) => group.items.map((item) => item.path));

    expect(paths).toEqual(
      expect.arrayContaining(["", "schedule", "classes", "attendance", "students", "registration"]),
    );
  });
});
