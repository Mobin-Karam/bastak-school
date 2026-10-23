import { describe, expect, it } from "vitest";
import { parseStudentPageNumber } from "./student-ui";

describe("student directory URL pagination", () => {
  it("accepts only positive safe integers", () => {
    expect(parseStudentPageNumber("3", 1)).toBe(3);
    expect(parseStudentPageNumber("1.5", 1)).toBe(1);
    expect(parseStudentPageNumber("0", 1)).toBe(1);
    expect(parseStudentPageNumber("9007199254740992", 1)).toBe(1);
    expect(parseStudentPageNumber("50", 25, [25, 50, 100])).toBe(50);
    expect(parseStudentPageNumber("75", 25, [25, 50, 100])).toBe(25);
  });
});
