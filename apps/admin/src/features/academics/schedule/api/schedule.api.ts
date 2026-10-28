import { api } from "../../../../shared/api/api";

export type ScheduleEntry = {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
  status: "ACTIVE" | "ARCHIVED" | "REPLACED";
  startsOn?: string | null;
  endsOn?: string | null;
  notes?: string;
  organization: { id: string; name: string; type?: string; status?: string };
  classroom?: { id: string; name: string } | null;
  classBook?: {
    id: string;
    book: { id: string; titleFa: string };
    teacher: { id: string; firstName?: string; lastName?: string; username: string };
  } | null;
  teacher?: { id: string; firstName?: string; lastName?: string; username: string } | null;
};
export type ScheduleDraft = {
  organizationId: string;
  classroomId?: string;
  classBookId?: string;
  teacherId?: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYearId?: string;
  termId?: string;
};
export type LegacyAcademicYear = {
  id: string;
  organizationId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  state: "DRAFT" | "ACTIVE" | "ARCHIVED";
};
export type LegacyAcademicTerm = {
  id: string;
  academicYearId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  state: "DRAFT" | "ACTIVE" | "ARCHIVED";
  correctionOpen: boolean;
};
export type LegacyAcademicCycleAudit = {
  id: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};
export type ScheduleTimeBlock = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  partOfDay: "AM" | "PM";
  group: { id: string; name: string };
  organization: { id: string; name: string };
};
export type ScheduleTimeBlockGroup = {
  id: string;
  name: string;
  organization: { id: string; name: string };
};
export type ScheduleTemplateEntry = Omit<ScheduleDraft, "organizationId">;
export type ScheduleTemplate = {
  id: string;
  name: string;
  state: "ACTIVE" | "ARCHIVED";
  entries: ScheduleTemplateEntry[];
  updatedAt: string;
};
export type ScheduleSubstitutionRequest = {
  id: string;
  sourceEntryId: string;
  targetEntryId: string;
  freezeDate: string;
  replacementDate: string;
  replacementTimeBlockId: string;
  title: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  requestedById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  replacementEntryId: string | null;
  counterpartReplacementEntryId: string | null;
  createdAt: string;
  source?: ScheduleEntry;
  target?: ScheduleEntry;
  replacementTimeBlock?: Pick<ScheduleTimeBlock, "id" | "name" | "startTime" | "endTime">;
};
export const listScheduleSubstitutionSlots = (date: string) =>
  api.get<ScheduleEntry[]>(`/schedule/substitution-slots?${new URLSearchParams({ date })}`);
export const listScheduleCancellations = (date: string) =>
  api.get<Array<{ entryId: string; date: string; message: string }>>(
    `/schedule/cancellations?${new URLSearchParams({ date })}`,
  );
export const listSchedule = () => api.get<ScheduleEntry[]>("/schedule");
export const listLegacyAcademicCycles = (organizationId: string) =>
  api.get<{ years: LegacyAcademicYear[]; terms: LegacyAcademicTerm[] }>(
    `/schedule/academic-years?${new URLSearchParams({ organizationId })}`,
  );
export const createLegacyAcademicYear = (body: {
  organizationId: string;
  name: string;
  startsOn: string;
  endsOn: string;
}) => api.post<LegacyAcademicYear>("/schedule/academic-years", body);
export const createLegacyAcademicTerm = (body: {
  academicYearId: string;
  name: string;
  startsOn: string;
  endsOn: string;
}) => api.post<LegacyAcademicTerm>("/schedule/academic-terms", body);
export const updateLegacyAcademicYear = (
  id: string,
  body: Pick<LegacyAcademicYear, "name" | "startsOn" | "endsOn">,
) => api.patch<LegacyAcademicYear>(`/schedule/academic-years/${encodeURIComponent(id)}`, body);
export const updateLegacyAcademicTerm = (
  id: string,
  body: Pick<LegacyAcademicTerm, "name" | "startsOn" | "endsOn">,
) => api.patch<LegacyAcademicTerm>(`/schedule/academic-terms/${encodeURIComponent(id)}`, body);
export const listLegacyAcademicYearHistory = (id: string) =>
  api.get<LegacyAcademicCycleAudit[]>(`/schedule/academic-years/${encodeURIComponent(id)}/history`);
export const listLegacyAcademicTermHistory = (id: string) =>
  api.get<LegacyAcademicCycleAudit[]>(`/schedule/academic-terms/${encodeURIComponent(id)}/history`);
export const changeLegacyAcademicYearState = (id: string, action: "activate" | "archive") =>
  api.post<LegacyAcademicYear>(`/schedule/academic-years/${encodeURIComponent(id)}/lifecycle`, {
    action,
  });
export const changeLegacyAcademicTermState = (
  id: string,
  action: "archive" | "reopen" | "close-correction",
) =>
  api.post<LegacyAcademicTerm>(`/schedule/academic-terms/${encodeURIComponent(id)}/lifecycle`, {
    action,
  });
export const createScheduleEntry = (draft: ScheduleDraft) =>
  api.post<ScheduleEntry>("/schedule", draft);
export const createScheduleEntries = (entries: ScheduleDraft[]) =>
  api.post<ScheduleEntry[]>("/schedule/batch", { entries });
export const updateScheduleEntry = (id: string, draft: ScheduleDraft) =>
  api.patch<ScheduleEntry>(`/schedule/${encodeURIComponent(id)}`, draft);
export const archiveScheduleEntry = (id: string, status: "ACTIVE" | "ARCHIVED") =>
  api.patch<ScheduleEntry>(`/schedule/${encodeURIComponent(id)}/archive`, { status });
export const deleteScheduleEntry = (id: string) =>
  api.delete(`/schedule/${encodeURIComponent(id)}`);
export const listScheduleTimeBlocks = () => api.get<ScheduleTimeBlock[]>("/schedule/time-blocks");
export const createScheduleTimeBlock = (draft: {
  organizationId: string;
  groupId: string;
  name: string;
  startTime: string;
  endTime: string;
}) => api.post<ScheduleTimeBlock>("/schedule/time-blocks", draft);
export const deleteScheduleTimeBlock = (id: string) =>
  api.delete(`/schedule/time-blocks/${encodeURIComponent(id)}`);
export const listScheduleTimeBlockGroups = () =>
  api.get<ScheduleTimeBlockGroup[]>("/schedule/time-block-groups");
export const createScheduleTimeBlockGroup = (draft: { organizationId: string; name: string }) =>
  api.post<ScheduleTimeBlockGroup>("/schedule/time-block-groups", draft);
export const deleteScheduleTimeBlockGroup = (id: string) =>
  api.delete(`/schedule/time-block-groups/${encodeURIComponent(id)}`);
export const listScheduleTemplates = () => api.get<ScheduleTemplate[]>("/schedule/templates");
export const createScheduleTemplate = (draft: {
  organizationId: string;
  name: string;
  sourceTemplateId?: string;
}) => api.post<ScheduleTemplate>("/schedule/templates", draft);
export const applyScheduleTemplate = (id: string) =>
  api.post<{ applied: number }>(`/schedule/templates/${encodeURIComponent(id)}/apply`, {});
export const archiveScheduleTemplate = (id: string) =>
  api.patch<ScheduleTemplate>(`/schedule/templates/${encodeURIComponent(id)}/archive`, {});
export const restoreScheduleTemplate = (id: string) =>
  api.patch<ScheduleTemplate>(`/schedule/templates/${encodeURIComponent(id)}/restore`, {});
export const deleteScheduleTemplate = (id: string) =>
  api.delete(`/schedule/templates/${encodeURIComponent(id)}`);
export const previewScheduleImport = (entries: ScheduleDraft[]) =>
  api.post<{ valid: boolean; errors: Array<{ row: number; message: string }> }>(
    "/schedule/import/preview",
    { entries },
  );
export const commitScheduleImport = (entries: ScheduleDraft[]) =>
  api.post<{ imported: number }>("/schedule/import/commit", { entries });
export const exportSchedule = () => api.get<ScheduleEntry[]>("/schedule/export");
export const listScheduleSubstitutionRequests = () =>
  api.get<ScheduleSubstitutionRequest[]>("/schedule/substitution-requests");
export const requestScheduleSubstitution = (body: {
  sourceEntryId: string;
  targetEntryId: string;
  freezeDate: string;
  replacementDate: string;
  replacementTimeBlockId: string;
  title: string;
  message?: string;
}) => api.post<ScheduleSubstitutionRequest>("/schedule/substitution-requests", body);
export const reviewScheduleSubstitution = (id: string, decision: "approved" | "rejected") =>
  api.post<ScheduleSubstitutionRequest>(
    `/schedule/substitution-requests/${encodeURIComponent(id)}/review`,
    { decision },
  );
