import { RepairAttendanceSessionReviewRevision1731700000000 } from "../src/database/migrations/1731700000000-RepairAttendanceSessionReviewRevision";
import { AttendanceRevisionReviewIdempotency1763600400000 } from "../src/database/migrations/1763600400000-AttendanceRevisionReviewIdempotency";

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
    const query = jest.fn().mockResolvedValue([]);

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
});
