import { RepairAttendanceSessionReviewRevision1731700000000 } from "../src/database/migrations/1731700000000-RepairAttendanceSessionReviewRevision";
import { AttendanceRevisionReviewIdempotency1763600400000 } from "../src/database/migrations/1763600400000-AttendanceRevisionReviewIdempotency";
import { AttendanceReviewTeacherMessage1762400000000 } from "../src/database/migrations/1762400000000-AttendanceReviewTeacherMessage";

describe("attendance session review revision repair migration", () => {
  it("adds the missing revision column to an already-migrated database", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "sessionId" }])
      .mockResolvedValue([]);

    await new RepairAttendanceSessionReviewRevision1731700000000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      "ALTER TABLE attendance_session_reviews ADD COLUMN reviewedRevision integer NOT NULL DEFAULT 0",
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE INDEX IF NOT EXISTS"),
    );
  });

  it("does not alter a database that already has the revision column", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "reviewedRevision" }])
      .mockResolvedValue([]);

    await new RepairAttendanceSessionReviewRevision1731700000000().up({
      query,
    } as never);

    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining("ALTER TABLE"),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE INDEX IF NOT EXISTS"),
    );
  });
});

describe("attendance session revision review idempotency migration", () => {
  it("adds a nullable dedupe key and unique index without rewriting review history", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "sessionId" }])
      .mockResolvedValue([]);

    await new AttendanceRevisionReviewIdempotency1763600400000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      "ALTER TABLE attendance_session_reviews ADD COLUMN dedupeKey varchar(96)",
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE UNIQUE INDEX IF NOT EXISTS"),
    );
  });

  it("does nothing when the optional review table is absent", async () => {
    const query = jest.fn().mockResolvedValue([]);

    await new AttendanceRevisionReviewIdempotency1763600400000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      "PRAGMA table_info(attendance_session_reviews)",
    );
  });

  it("keeps an already-migrated review table unchanged", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "dedupeKey" }])
      .mockResolvedValue([]);

    await new AttendanceRevisionReviewIdempotency1763600400000().up({
      query,
    } as never);

    expect(query).not.toHaveBeenCalledWith(
      "ALTER TABLE attendance_session_reviews ADD COLUMN dedupeKey varchar(96)",
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE UNIQUE INDEX IF NOT EXISTS"),
    );
  });
});

describe("attendance review teacher-message migration", () => {
  it("does not require the optional review table on retained databases", async () => {
    const query = jest.fn().mockResolvedValue([]);

    await new AttendanceReviewTeacherMessage1762400000000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      "PRAGMA table_info(attendance_session_reviews)",
    );
  });

  it("adds the defaulted message only when the review table needs it", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ name: "id" }, { name: "reviewedRevision" }])
      .mockResolvedValue([]);

    await new AttendanceReviewTeacherMessage1762400000000().up({
      query,
    } as never);

    expect(query).toHaveBeenCalledWith(
      "ALTER TABLE attendance_session_reviews ADD COLUMN teacherMessage varchar(500) NOT NULL DEFAULT ''",
    );
  });
});
