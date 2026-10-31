import { describe, expect, it } from "vitest";
import { navigationForCapabilities, resolveAdminNavigation } from "./config/admin-navigation";

describe("student navigation", () => {
  it("adds registration only when the student has registration access", () => {
    const paths = navigationForCapabilities(
      [
        "schedule.read",
        "attendance.self.read",
        "leave.read",
        "leave.manage",
        "registration.read",
      ] as const,
      "STUDENT",
    ).flatMap((group) => group.items.map((item) => item.path));

    expect(paths).toEqual([
      "schedule",
      "books",
      "profile",
      "student-leave",
      "achievements",
      "coin-shop",
      "registration",
      "my-attendance",
      "communication/notifications",
      "settings",
    ]);
  });

  it("hides leave requests unless both route capabilities are granted", () => {
    const paths = navigationForCapabilities(["leave.manage"], "STUDENT").flatMap((group) =>
      group.items.map((item) => item.path),
    );
    expect(paths).not.toContain("student-leave");
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
    expect(resolveAdminNavigation("/admin/student-leave", "STUDENT")).toMatchObject({
      section: "درخواست‌های من",
      path: "student-leave",
    });
    expect(resolveAdminNavigation("/admin/achievements", "STUDENT")).toMatchObject({
      section: "پیشرفت و سکه",
      path: "achievements",
    });
    expect(resolveAdminNavigation("/admin/communication/notifications", "STUDENT")).toMatchObject({
      section: "اعلان‌ها",
      path: "communication/notifications",
    });
  });
});

describe("teacher navigation", () => {
  it("adds registration only when the teacher has registration access", () => {
    const paths = navigationForCapabilities(
      [
        "schedule.read",
        "classes.read",
        "attendance.read",
        "attendance.manage",
        "registration.read",
      ] as const,
      "TEACHER",
    ).flatMap((group) => group.items.map((item) => item.path));

    expect(paths).toEqual([
      "schedule",
      "communication/notifications",
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
      expect.arrayContaining(["schedule", "classes", "attendance", "students", "registration"]),
    );
  });
});
