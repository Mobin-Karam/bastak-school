import { api } from "../../../shared/api/api";
import type {
  ClassGroupSummary,
  ClassGroupMember,
  ClassGroupDraft,
  ClassGroupUpdate,
  ClassGroupClassOption,
  ClassGroupStudentOption,
} from "@moshaver/api-contract";
export type {
  ClassGroupSummary,
  ClassGroupMember,
  ClassGroupDraft,
  ClassGroupClassOption,
  ClassGroupStudentOption,
} from "@moshaver/api-contract";
export const listGroupClasses = (organizationId?: string) =>
  api.get<ClassGroupClassOption[]>(
    `/class-groups/classes${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const listClassGroups = (classId: string, organizationId?: string) =>
  api.get<ClassGroupSummary[]>(
    `/class-groups?classId=${encodeURIComponent(classId)}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const listGroupStudents = (classId: string) =>
  api.get<ClassGroupStudentOption[]>(
    `/class-groups/classes/${encodeURIComponent(classId)}/students`,
  );
export const listGroupMembers = (id: string) =>
  api.get<ClassGroupMember[]>(`/class-groups/${encodeURIComponent(id)}/members`);
export const createClassGroup = (body: ClassGroupDraft) =>
  api.post<ClassGroupSummary>("/class-groups", body);
export const updateClassGroup = (id: string, body: ClassGroupUpdate) =>
  api.patch<ClassGroupSummary>(`/class-groups/${encodeURIComponent(id)}`, body);
export const setGroupMembers = (id: string, studentIds: string[]) =>
  api.put<{ groupId: string; count: number }>(`/class-groups/${encodeURIComponent(id)}/members`, {
    studentIds,
  });
export const deleteClassGroup = (id: string) =>
  api.delete<{ deleted: boolean }>(`/class-groups/${encodeURIComponent(id)}`);
