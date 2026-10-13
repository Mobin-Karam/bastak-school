import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  TimetableBulkDto,
  TimetableQueryDto,
  TimetableConfigDto,
} from "../src/modules/schedule/timetable.dto";
import {
  TeachingAssignmentDto,
  SubjectBookReferenceDto,
} from "../src/modules/school-education/academic.dto";

describe("academic scheduling request boundaries", () => {
  it("rejects missing nested lessons, authority fields and oversized batches", async () => {
    for (const body of [
      { expectedRevision: 0, items: [{}] },
      {
        expectedRevision: 0,
        items: [{ lesson: { roles: ["PLATFORM_ADMIN"] } }],
      },
      { expectedRevision: 0, items: Array.from({ length: 101 }, () => ({})) },
    ])
      expect(
        await validate(plainToInstance(TimetableBulkDto, body), {
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      ).not.toHaveLength(0);
  });
  it("transforms bounded pagination and rejects timestamps in calendar date fields", async () => {
    const dto = plainToInstance(TimetableQueryDto, {
      offset: "0",
      limit: "20",
      startsOn: "2026-10-13",
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto.limit).toBe(20);
    for (const input of [
      { limit: 201 },
      { offset: -1 },
      { startsOn: "2026-10-13T00:00:00Z" },
      { startsOn: "2026-02-30" },
    ]) {
      expect(
        await validate(plainToInstance(TimetableQueryDto, input)),
      ).not.toHaveLength(0);
    }
  });
  it("rejects duplicated or invalid weekdays and unknown book identities", async () => {
    for (const weekdays of [[0, 0], [7], [-1]])
      expect(
        await validate(
          plainToInstance(TimetableConfigDto, { kind: "period", weekdays }),
        ),
      ).not.toHaveLength(0);
    expect(
      await validate(
        plainToInstance(SubjectBookReferenceDto, {
          subjectId: "invalid",
          bookId: "",
        }),
      ),
    ).not.toHaveLength(0);
    expect(
      await validate(
        plainToInstance(TeachingAssignmentDto, {
          startsOn: "2026-01-01T00:00:00Z",
        }),
      ),
    ).not.toHaveLength(0);
  });
});
