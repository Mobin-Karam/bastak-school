export type ClassGroupSummary = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "ACTIVE" | "ARCHIVED";
  organizationId: string;
  classId: string | null;
  className: string | null;
  memberCount: number;
};
export type ClassGroupMember = {
  id: string;
  name: string;
  nationalCode: string | null;
  userId: string | null;
};
export type ClassGroupDraft = {
  classId: string;
  code: string;
  name: string;
  description?: string;
};
export type ClassGroupUpdate = Partial<
  Pick<ClassGroupDraft, "code" | "name" | "description">
>;
export type ClassGroupClassOption = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  organizationId: string;
  organizationName: string;
  enrollmentCount: number;
};
export type ClassGroupStudentOption = {
  id: string;
  name: string;
  grade: string;
  major: string;
};
