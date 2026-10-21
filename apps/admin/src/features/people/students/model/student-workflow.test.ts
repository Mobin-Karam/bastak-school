import { describe, expect, it } from "vitest";
import { studentWorkflowActions } from "./student-workflow";

describe("student workflow actions", () => {
  it("carries the selected student into only the workspaces the operator may access", () => {
    expect(studentWorkflowActions("student 1", ["plans.read", "reports.read"])).toEqual([
      expect.objectContaining({
        id: "planner",
        destination: "/admin/planner?studentId=student%201",
      }),
      expect.objectContaining({
        id: "reports",
        destination: "/admin/reports?studentId=student%201",
      }),
    ]);
  });

  it("does not expose an operational hand-off without a selected student", () => {
    expect(studentWorkflowActions("", ["plans.read", "learning.read"])).toEqual([]);
  });
});
