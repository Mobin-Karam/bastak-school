import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../shared/api/api";
import { commitTimetableBulk, previewTimetableBulk } from "./timetable.api";

describe("bulk timetable client safety", () => {
  afterEach(() => vi.restoreAllMocks());
  it("strips view and authority fields from drag/edit rows before both preview and commit", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({});
    const lesson = {
      classroomId: "class",
      classBookId: "book",
      teacherId: "teacher",
      periodId: "period",
      weekday: 0,
      startTime: "08:00",
      endTime: "09:00",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      title: "readonly title",
      roles: ["PLATFORM_ADMIN"],
    };
    const body = { expectedRevision: 7, items: [{ id: "lesson", lesson }] };
    await previewTimetableBulk("version", body);
    await commitTimetableBulk("version", body);
    for (const [, payload] of post.mock.calls) {
      const draft = payload as typeof body;
      expect(draft.expectedRevision).toBe(7);
      expect(draft.items[0].id).toBe("lesson");
      expect(draft.items[0].lesson).not.toHaveProperty("roles");
      expect(draft.items[0].lesson).not.toHaveProperty("title");
      expect(draft.items[0].lesson.startTime).toBe("08:00");
    }
  });
});
