import { describe, expect, it } from "vitest";
import { attendanceSessionWindow } from "./attendance-session-window";

const session = {
  scheduledStartAt: "2026-10-19T05:30:00.000Z",
  scheduledEndAt: "2026-10-19T06:30:00.000Z",
};

describe("attendanceSessionWindow", () => {
  it("permits the exact start and excludes the exact end", () => {
    expect(attendanceSessionWindow(session, Date.parse(session.scheduledStartAt)).active).toBe(true);
    expect(attendanceSessionWindow(session, Date.parse(session.scheduledEndAt)).active).toBe(false);
  });

  it("does not restrict legacy sessions that have no scheduled range", () => {
    expect(attendanceSessionWindow({ scheduledStartAt: null, scheduledEndAt: null })).toMatchObject({
      active: true,
      restricted: false,
    });
  });
});
