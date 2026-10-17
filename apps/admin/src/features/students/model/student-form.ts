import type { Student } from "../../../shared/types/domain";
export type StudentForm = {
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  nationalCode: string;
  birthDateJalali: string;
  governmentSchool: string;
  classId: string;
  motherPhoneNumber: string;
  motherPassword: string;
  fatherPhoneNumber: string;
  fatherPassword: string;
  learnerProfile: "school" | "independent";
  independentType: string;
  learningLevel: string;
  gradeId: string;
  educationTypeId: string;
  trackId: string;
  grade: string;
  major: string;
};
export function normalizeIranianPhoneNumber(value: string) {
  const englishDigits = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

  let phone = englishDigits.replace(/[^\d+]/g, "");

  if (phone.startsWith("+98")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("0098")) {
    phone = `0${phone.slice(4)}`;
  } else if (phone.startsWith("98") && phone.length === 12) {
    phone = `0${phone.slice(2)}`;
  }

  return phone;
}

function isoToJalaliInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const year = part("year"),
    month = part("month"),
    day = part("day");
  return year && month && day ? `${year}/${month}/${day}` : "";
}

function isoDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function emptyStudentForm(): StudentForm {
  return {
    name: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    nationalCode: "",
    birthDateJalali: "",
    governmentSchool: "",
    classId: "",
    motherPhoneNumber: "",
    motherPassword: "",
    fatherPhoneNumber: "",
    fatherPassword: "",
    learnerProfile: "school",
    independentType: "",
    learningLevel: "",
    gradeId: "",
    educationTypeId: "",
    trackId: "",
    grade: "",
    major: "",
  };
}
export function studentToForm(student: Student): StudentForm {
  return {
    name: student.name || "",
    firstName: student.name?.split(/\s+/)[0] || "",
    lastName: student.name?.split(/\s+/).slice(1).join(" ") || "",
    username:
      student.user?.phoneNumber ||
      student.user?.username ||
      student.phoneNumber ||
      student.username ||
      "",
    password: "",
    nationalCode: student.nationalCode || "",
    birthDateJalali: isoDateInput(student.birthDate),
    governmentSchool: student.governmentSchool || "",
    classId: student.classId || "",
    motherPhoneNumber: "",
    motherPassword: "",
    fatherPhoneNumber: "",
    fatherPassword: "",
    learnerProfile: student.learnerProfile || "school",
    independentType: student.independentType || "",
    learningLevel: student.learningLevel || "",
    gradeId: student.gradeId ? String(student.gradeId) : "",
    educationTypeId: student.educationTypeId || "",
    trackId: student.trackId || "",
    grade: student.grade || "",
    major: student.major || "",
  };
}
export function studentPayload(form: StudentForm, includePassword: boolean) {
  const isIndependent = form.learnerProfile === "independent";
  return {
    name: `${form.firstName} ${form.lastName}`.trim() || form.name.trim(),
    username: form.username.trim(),
    ...(includePassword ? { password: form.password.trim() } : {}),
    nationalCode: form.nationalCode.trim() || undefined,
    birthDateJalali: isoToJalaliInput(form.birthDateJalali) || undefined,
    governmentSchool: form.governmentSchool.trim() || undefined,
    classId: form.classId || undefined,
    mother:
      form.motherPhoneNumber.trim() && form.motherPassword
        ? {
            phoneNumber: normalizeIranianPhoneNumber(form.motherPhoneNumber),
            password: form.motherPassword,
          }
        : undefined,
    father:
      form.fatherPhoneNumber.trim() && form.fatherPassword
        ? {
            phoneNumber: normalizeIranianPhoneNumber(form.fatherPhoneNumber),
            password: form.fatherPassword,
          }
        : undefined,
    learnerProfile: form.learnerProfile,
    independentType: isIndependent ? form.independentType || undefined : undefined,
    learningLevel: isIndependent ? form.learningLevel.trim() : undefined,
    gradeId: !isIndependent && form.gradeId ? Number(form.gradeId) : undefined,
    educationTypeId: !isIndependent ? form.educationTypeId || undefined : undefined,
    trackId: !isIndependent ? form.trackId || undefined : undefined,
    grade: form.grade.trim(),
    major: form.major.trim(),
  };
}
export function countData(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}
