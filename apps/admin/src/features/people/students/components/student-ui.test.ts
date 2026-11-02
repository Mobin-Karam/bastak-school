import { describe, expect, it } from "vitest";
import { matchesStudentClass, parseStudentPageNumber, studentClassOptions } from "./student-ui";

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

describe("student directory school-class options", () => {
  it("uses current enrollment classes and never the previous government school", () => {
    const enrolledStudent = {
      id: "student-1",
      name: "Ali",
      classId: "class-2",
      className: "دهم ب",
      governmentSchool: "مدرسه دولتی الف",
    };
    expect(
      studentClassOptions([
        enrolledStudent,
        { id: "student-2", name: "Sara", classId: "class-1", className: "دهم الف" },
        { id: "student-3", name: "Reza", classId: "class-1", className: "دهم الف" },
        { id: "student-4", name: "Mina", governmentSchool: "مدرسه دولتی ب" },
      ]),
    ).toEqual([
      { id: "class-1", name: "دهم الف" },
      { id: "class-2", name: "دهم ب" },
    ]);
    expect(matchesStudentClass(enrolledStudent, "class-2")).toBe(true);
    expect(matchesStudentClass(enrolledStudent, "مدرسه دولتی الف")).toBe(false);
  });
});
