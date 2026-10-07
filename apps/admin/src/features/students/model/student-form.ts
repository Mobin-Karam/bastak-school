import type { Student } from "../../../shared/types/domain";
export type StudentForm = {
  name: string;
  username: string;
  password: string;
  learnerProfile: "school" | "independent";
  independentType: string;
  learningLevel: string;
  gradeId: string;
  educationTypeId: string;
  trackId: string;
  grade: string;
  major: string;
  targetUniversity: string;
  targetField: string;
  targetRank: string;
  dailyCapacity: string;
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

export function emptyStudentForm(): StudentForm {
  return {
    name: "",
    username: "",
    password: "",
    learnerProfile: "school",
    independentType: "",
    learningLevel: "",
    gradeId: "",
    educationTypeId: "",
    trackId: "",
    grade: "",
    major: "",
    targetUniversity: "",
    targetField: "",
    targetRank: "",
    dailyCapacity: "",
  };
}
export function studentToForm(student: Student): StudentForm {
  return {
    name: student.name || "",
    username:
      student.user?.phoneNumber ||
      student.user?.username ||
      student.phoneNumber ||
      student.username ||
      "",
    password: "",
    learnerProfile: student.learnerProfile || "school",
    independentType: student.independentType || "",
    learningLevel: student.learningLevel || "",
    gradeId: student.gradeId ? String(student.gradeId) : "",
    educationTypeId: student.educationTypeId || "",
    trackId: student.trackId || "",
    grade: student.grade || "",
    major: student.major || "",
    targetUniversity: student.targetUniversity || "",
    targetField: student.targetField || student.target_major || "",
    targetRank: student.targetRank || student.rank_goal || "",
    dailyCapacity: student.dailyCapacity || student.daily_capacity || "",
  };
}
export function studentPayload(form: StudentForm, includePassword: boolean) {
  const isIndependent = form.learnerProfile === "independent";
  return {
    name: form.name.trim(),
    username: form.username.trim(),
    ...(includePassword ? { password: form.password.trim() } : {}),
    learnerProfile: form.learnerProfile,
    independentType: isIndependent ? form.independentType || undefined : undefined,
    learningLevel: isIndependent ? form.learningLevel.trim() : undefined,
    gradeId: !isIndependent && form.gradeId ? Number(form.gradeId) : undefined,
    educationTypeId: !isIndependent ? form.educationTypeId || undefined : undefined,
    trackId: !isIndependent ? form.trackId || undefined : undefined,
    grade: form.grade.trim(),
    major: form.major.trim(),
    targetUniversity: form.targetUniversity.trim(),
    targetField: form.targetField.trim(),
    targetRank: form.targetRank.trim(),
    dailyCapacity: form.dailyCapacity.trim(),
  };
}
export function countData(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}
