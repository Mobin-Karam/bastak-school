import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listStudents: vi.fn(),
  listUsers: vi.fn(),
  listOrganizations: vi.fn(),
  getExams: vi.fn(),
  get: vi.fn(),
}));

vi.mock("../../features/students/api/students.api", () => ({ listStudents: mocks.listStudents }));
vi.mock("../../features/access/api/access.api", () => ({
  listUsers: mocks.listUsers,
  listOrganizations: mocks.listOrganizations,
}));
vi.mock("../../features/exams/api/exams.api", () => ({ getExams: mocks.getExams }));
vi.mock("../../shared/api/api", () => ({ api: { get: mocks.get } }));

import { matchesCommandPaletteQuery, searchCommandPaletteEntities } from "./command-palette-search";

describe("command palette entity search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listStudents.mockResolvedValue([
      { id: "student-1", name: "نگار کریمی", grade: "دهم", major: "ریاضی" },
    ]);
  });

  it("uses only the sources permitted by the active capability context", async () => {
    const results = await searchCommandPaletteEntities({
      query: "نگار",
      capabilities: ["students.read"],
    });

    expect(results).toEqual([
      expect.objectContaining({
        id: "student:student-1",
        destination: "/admin/students?studentId=student-1",
      }),
    ]);
    expect(mocks.listStudents).toHaveBeenCalledOnce();
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.listOrganizations).not.toHaveBeenCalled();
    expect(mocks.getExams).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("exposes the create-exam shortcut only to exam creators", async () => {
    const results = await searchCommandPaletteEntities({
      query: "آزمون",
      capabilities: ["exams.create"],
    });

    expect(results).toContainEqual(
      expect.objectContaining({ id: "action:create-exam", destination: "/admin/exams?new=1" }),
    );
    expect(mocks.getExams).not.toHaveBeenCalled();
  });

  it("matches normalized query tokens regardless of their order", async () => {
    const results = await searchCommandPaletteEntities({
      query: "جدید آزمون",
      capabilities: ["exams.create"],
    });

    expect(results).toContainEqual(
      expect.objectContaining({ id: "action:create-exam", destination: "/admin/exams?new=1" }),
    );
    expect(matchesCommandPaletteQuery("کريمی نگار", "نگار کریمی")).toBe(true);
  });

  it("exposes the student create shortcut only to student creators", async () => {
    const results = await searchCommandPaletteEntities({
      query: "دانش آموز جدید",
      capabilities: ["students.create"],
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        id: "action:create-student",
        destination: "/admin/students?create=1",
      }),
    );
    expect(mocks.listStudents).not.toHaveBeenCalled();
  });
});
