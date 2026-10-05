import { describe, expect, it } from "vitest";
import {
  adminBreadcrumbs,
  adminDestination,
  adminNavigation,
  educationCapabilities,
  educationNavigation,
  flatAdminNavigation,
  mainAdminNavigation,
  mainNavigationForCapabilities,
  localizedAdminBreadcrumbs,
  localizedAdminCurrentNavigation,
  localizedMainNavigationForCapabilities,
  localizedNavigationForCapabilities,
  navigationForCapabilities,
  normalizeAdminPath,
  resolveAdminNavigation,
} from "./admin-navigation";

describe("admin navigation metadata", () => {
  it("defines a title and description for every admin destination", () => {
    expect(flatAdminNavigation.map((item) => item.path)).toEqual([
      "",
      "education",
      "planner",
      "plan-templates",
      "learning",
      "exams",
      "questions",
      "quizzes",
      "subjects",
      "classes",
      "resources",
      "communication",
      "communication/live",
      "communication/chat",
      "communication/notifications",
      "management",
      "students",
      "permission-requests",
      "attention",
      "family",
      "onboarding",
      "users",
      "organizations",
      "reports",
      "follow-up",
      "system",
      "releases",
      "database",
      "audit",
      "settings",
    ]);
    expect(flatAdminNavigation.every((item) => item.title && item.description)).toBe(true);
    expect(adminNavigation.every((group) => group.items.length > 0)).toBe(true);
    expect(mainAdminNavigation.map((item) => item.path)).toEqual([
      "",
      "education",
      "communication",
      "management",
      "system",
    ]);
    expect(mainAdminNavigation.map((item) => item.title)).toEqual([
      "نمای کلی",
      "آموزش و برنامه‌ریزی",
      "ارتباط و پیگیری",
      "افراد و دسترسی",
      "سامانه و امنیت",
    ]);
  });

  it("keeps the education sections and their route capabilities in one registry", () => {
    expect(educationNavigation).toHaveLength(10);
    expect(educationNavigation.map((item) => item.path)).toEqual([
      "education",
      "planner",
      "plan-templates",
      "learning",
      "exams",
      "questions",
      "quizzes",
      "subjects",
      "classes",
      "resources",
    ]);
    expect(educationCapabilities).toEqual([
      "exams.read",
      "plans.read",
      "plan_templates.read",
      "learning.read",
      "questions.read",
      "quizzes.read",
      "subjects.read",
      "classes.read",
      "learning_resources.manage",
    ]);
  });

  it("uses meaningful role-aware names in the primary sidebar", () => {
    const platform = mainNavigationForCapabilities(
      ["plans.read", "chat.read", "users.read", "system.manage"],
      "PLATFORM_ADMIN",
    );
    expect(platform.map((item) => item.title)).toEqual([
      "نمای پلتفرم",
      "عملیات آموزشی",
      "ارتباطات",
      "کاربران و سازمان‌ها",
      "سامانه و امنیت",
    ]);
  });

  it("hides protected destinations from unrelated work contexts", () => {
    const guardian = navigationForCapabilities([
      "students.read",
      "plans.read",
      "reports.read",
      "chat.read",
    ] as const).flatMap((group) => group.items.map((item) => item.path));
    expect(guardian).toContain("students");
    expect(guardian).not.toContain("users");
    expect(guardian).not.toContain("system");
    const platform = navigationForCapabilities([
      "users.read",
      "organization.read",
      "database.read",
    ] as const).flatMap((group) => group.items.map((item) => item.path));
    expect(platform).toEqual(expect.arrayContaining(["users", "organizations", "database"]));
  });

  it("uses guardian-specific labels for the same capability routes", () => {
    const guardian = navigationForCapabilities(
      ["students.read", "plans.read", "reports.read", "chat.read"],
      "GUARDIAN",
    ).flatMap((group) => group.items);
    expect(guardian.find((item) => item.path === "students")?.title).toBe("فرزندان");
    expect(guardian.find((item) => item.path === "planner")?.title).toBe("برنامه");
    expect(guardian.find((item) => item.path === "settings")?.title).toBe("پروفایل");
  });

  it("resolves browser URLs, nested learning locations, and aliases", () => {
    expect(normalizeAdminPath("/admin/exams/42?tab=questions")).toBe("exams/42");
    expect(resolveAdminNavigation("/admin/exams/42").path).toBe("exams");
    expect(resolveAdminNavigation("/admin/education").path).toBe("education");
    expect(resolveAdminNavigation("/admin/students/s-1/learning").path).toBe("learning");
    expect(adminBreadcrumbs("/admin/students/s-1/learning").at(-1)?.title).toBe("سیستم یادگیری");
  });

  it("avoids duplicate breadcrumb destinations on section landing pages", () => {
    expect(adminBreadcrumbs("")).toEqual([{ title: "خانه", path: "" }]);
    expect(adminBreadcrumbs("education")).toEqual([
      { title: "خانه", path: "" },
      { title: "آموزش", path: "education" },
    ]);
    expect(adminBreadcrumbs("exams")).toEqual([
      { title: "خانه", path: "" },
      { title: "آموزش", path: "education" },
      { title: "آزمون‌ها", path: "exams" },
    ]);
    expect(adminBreadcrumbs("settings").map((item) => item.title)).toEqual([
      "خانه",
      "سامانه",
      "تنظیمات حساب",
    ]);
  });

  it("carries student context only between Education destinations", () => {
    expect(adminDestination("exams", "آموزش", "student 1")).toBe(
      "/admin/exams?studentId=student%201",
    );
    expect(adminDestination("communication/chat", "ارتباط", "student-1")).toBe(
      "/admin/communication/chat",
    );
  });

  it("provides English navigation labels without changing route or capability rules", () => {
    const english = localizedNavigationForCapabilities(
      ["students.read", "plans.read", "chat.read"],
      "ADVISOR",
      "en",
    );
    expect(english.find((group) => group.section === "Management")?.items[0]?.title).toBe(
      "Management hub",
    );
    expect(english.find((group) => group.section === "Management")?.sectionKey).toBe("مدیریت");
    expect(localizedAdminCurrentNavigation("/admin/students", "en").description).toBe(
      "Manage student accounts, status, and access",
    );
    expect(localizedAdminBreadcrumbs("exams", "en").map((item) => item.title)).toEqual([
      "Home",
      "Education",
      "Assessments",
    ]);
    expect(
      localizedMainNavigationForCapabilities(["plans.read", "chat.read"], "ADVISOR", "en").map(
        (item) => item.title,
      ),
    ).toEqual([
      "Advisor workspace",
      "Plans and learning",
      "Communication and follow-up",
      "Students and reports",
      "System and security",
    ]);
  });
});
