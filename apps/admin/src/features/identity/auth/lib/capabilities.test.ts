import { describe, expect, it } from "vitest";
import { hasAllCapabilities, hasAnyCapability, hasCapability } from "./capabilities";

describe("capability evaluation", () => {
  const capabilities = ["students.read", "students.update", "export.read"];

  it("supports one, any, and all requirements without role-name assumptions", () => {
    expect(hasCapability(capabilities, "students.read")).toBe(true);
    expect(hasAnyCapability(capabilities, ["students.archive", "export.read"])).toBe(true);
    expect(hasAllCapabilities(capabilities, ["students.read", "students.update"])).toBe(true);
    expect(hasAllCapabilities(capabilities, ["students.read", "students.archive"])).toBe(false);
  });
});
