import { describe, expect, it, vi } from "vitest";
import { prepareAttendanceWrite } from "./attendance-write";

describe("attendance retry requests", () => {
  it("keeps the original request ID and session timestamp after an uncertain save", () => {
    const first = prepareAttendanceWrite(null, "same draft", () => ({
      organizationId: "school",
      sessionDate: "2026-10-11T08:00:00Z",
      entries: [{ studentId: "student", status: "present" }],
    }));
    const buildRetry = vi.fn(() => ({
      organizationId: "school",
      sessionDate: "2026-10-11T08:01:00Z",
      entries: [],
    }));
    const retry = prepareAttendanceWrite(first, "same draft", buildRetry);
    expect(retry.body.requestId).toBe(first.body.requestId);
    expect(retry.body.sessionDate).toBe("2026-10-11T08:00:00Z");
    expect(buildRetry).not.toHaveBeenCalled();
  });
  it("uses another request ID for changed intent or scope", () => {
    const build = () => ({ organizationId: "school", entries: [] });
    const first = prepareAttendanceWrite(null, "school:user:role:session:present", build);
    const changed = prepareAttendanceWrite(first, "school:user:role:session:absent", build);
    expect(changed.body.requestId).not.toBe(first.body.requestId);
    const switched = prepareAttendanceWrite(
      changed,
      "other-school:user:role:session:absent",
      build,
    );
    expect(switched.body.requestId).not.toBe(changed.body.requestId);
  });
});
