import { describe, expect, it } from "vitest";
import { navigationForCapabilities } from "./admin-navigation";

const pathsFor = (capabilities: readonly string[], role: string) =>
  navigationForCapabilities(capabilities, role).flatMap((group) =>
    group.items.map((item) => item.path),
  );

describe("role-aware navigation registry", () => {
  it("uses the same capability-filtered destinations for a principal across every shell", () => {
    const paths = pathsFor(
      ["attendance.read", "registration.read", "students.read", "classes.read", "dormitory.read"],
      "PRINCIPAL",
    );

    expect(paths).toEqual(
      expect.arrayContaining(["attendance", "registration", "students", "classes", "dormitory"]),
    );
    expect(paths).not.toContain("users");
  });

  it("limits counselor navigation to its active AccountContext capabilities", () => {
    const paths = pathsFor(["students.read", "schedule.read"], "COUNSELOR");

    expect(paths).toEqual(expect.arrayContaining(["students", "schedule"]));
    expect(paths).not.toContain("attendance");
    expect(paths).not.toContain("dormitory");
  });
});
