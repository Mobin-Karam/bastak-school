import { describe, expect, it } from "vitest";
import {
  emptyStudentForm,
  normalizeIranianPhoneNumber,
  studentPayload,
  studentToForm,
} from "./student-form";

describe("student education form", () => {
  it("normalizes Persian digits and international Iranian mobile formats", () => {
    expect(normalizeIranianPhoneNumber("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizeIranianPhoneNumber("+989123456789")).toBe("09123456789");
    expect(normalizeIranianPhoneNumber("00989123456789")).toBe("09123456789");
  });

  it("keeps the structured grade, education type and track from an account", () => {
    const form = studentToForm({
      id: "student-1",
      name: "مها کرام",
      gradeId: 12,
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
      grade: "پایه دوازدهم",
      major: "علوم تجربی",
    });
    expect(form).toMatchObject({
      gradeId: "12",
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
    });
  });

  it("uses the account phone number as the editable login contact", () => {
    const form = studentToForm({
      id: "student-2",
      name: "مها کرام",
      user: { id: "user-2", username: "09123456789", phoneNumber: "09123456789" },
    });
    expect(form.username).toBe("09123456789");
  });

  it("keeps an ISO date for the picker while sending the API its Jalali date", () => {
    const form = studentToForm({
      id: "student-3",
      name: "مها کرام",
      birthDate: "2010-03-21T00:00:00.000Z",
    });

    expect(form.birthDateJalali).toBe("2010-03-21");
    expect(studentPayload({ ...form, username: "09123456789" }, false).birthDateJalali).toBe(
      "1389/01/01",
    );
  });

  it("sends structured education identifiers for server-side catalog validation", () => {
    const payload = studentPayload(
      {
        ...emptyStudentForm(),
        name: "مها کرام",
        username: "۰۹۱۲۳۴۵۶۷۸۹",
        password: "secure-development-password",
        gradeId: "12",
        educationTypeId: "theoretical",
        trackId: "experimental_sciences",
      },
      true,
    );
    expect(payload).toMatchObject({
      gradeId: 12,
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
    });
    expect(normalizeIranianPhoneNumber(payload.username)).toBe("09123456789");
    expect(payload).not.toHaveProperty("targetUniversity");
    expect(payload).not.toHaveProperty("targetField");
    expect(payload).not.toHaveProperty("targetRank");
    expect(payload).not.toHaveProperty("dailyCapacity");
  });

  it("does not invent a school grade for an independent learner", () => {
    const payload = studentPayload(
      {
        ...emptyStudentForm(),
        name: "آرمان رضایی",
        username: "arman-rezaei",
        password: "secure-development-password",
        learnerProfile: "independent",
        independentType: "adult",
        learningLevel: "زبان عمومی",
      },
      true,
    );

    expect(payload).toMatchObject({
      learnerProfile: "independent",
      independentType: "adult",
      learningLevel: "زبان عمومی",
    });
    expect(payload.gradeId).toBeUndefined();
    expect(payload.educationTypeId).toBeUndefined();
  });
});
