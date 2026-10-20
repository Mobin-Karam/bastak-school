import { describe, expect, it } from "vitest";
import type { TimetableWorkspace } from "@moshaver/api-contract";
import type { WorkbookLesson } from "./timetable-workbook";
import { proposeTimetableMappings } from "./timetable-import-mapping";
const row = {
  classLabel: "اول",
  subjectLabel: "نحو",
  teacherLabel: "احمد کریمی",
  blockId: "2:2",
  periodLabel: "زنگ اول",
  timeLabel: "8:00-8:50",
  startTime: "08:00",
  endTime: "08:50",
} as WorkbookLesson;
const workspace = {
  classes: [{ id: "class", name: "اول", books: [{ id: "course", name: "نحو" }] }],
  teachers: [{ id: "teacher", name: "احمد کریمی" }],
  periods: [{ id: "period", name: "زنگ اول", startTime: "08:00", endTime: "08:50" }],
} as TimetableWorkspace;
describe("timetable workbook relationship suggestions", () => {
  it("connects a uniquely named book only inside the selected class", () => {
    expect(proposeTimetableMappings([row], workspace)).toEqual({
      "class:اول": "class",
      "book:اول|نحو": "course",
      "teacher:احمد کریمی": "teacher",
      "period:2:2|زنگ اول|8:00-8:50": "period",
    });
    expect(
      proposeTimetableMappings([row], workspace, { "class:اول": "another-class" }),
    ).not.toHaveProperty("book:اول|نحو");
  });
  it("leaves repeated class names and surname-only teachers for explicit mapping", () => {
    const repeated = {
      ...workspace,
      classes: [...workspace.classes, { ...workspace.classes[0], id: "other-year-class" }],
    };
    const suggestions = proposeTimetableMappings([{ ...row, teacherLabel: "کریمی" }], repeated);
    expect(suggestions).not.toHaveProperty("class:اول");
    expect(suggestions).not.toHaveProperty("book:اول|نحو");
    expect(suggestions).not.toHaveProperty("teacher:کریمی");
  });
  it("preserves operator choices and refuses ambiguous clock matches", () => {
    const suggestions = proposeTimetableMappings(
      [{ ...row, startTime: "", endTime: "" }],
      workspace,
      { "teacher:احمد کریمی": "chosen-teacher" },
    );
    expect(suggestions).not.toHaveProperty("teacher:احمد کریمی");
    expect(suggestions).not.toHaveProperty("period:2:2|زنگ اول|8:00-8:50");
  });
});
