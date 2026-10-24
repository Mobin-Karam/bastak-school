import { api } from "../../../../shared/api/api";

export type ScheduleEntry = {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
  status: "ACTIVE" | "ARCHIVED";
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
};
export type ScheduleTimeBlock = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  partOfDay: "AM" | "PM";
  organization: { id: string; name: string };
};
export const listSchedule = () => api.get<ScheduleEntry[]>("/schedule");
export const createScheduleEntry = (draft: ScheduleDraft) =>
  api.post<ScheduleEntry>("/schedule", draft);
export const updateScheduleEntry = (id: string, draft: ScheduleDraft) =>
  api.patch<ScheduleEntry>(`/schedule/${encodeURIComponent(id)}`, draft);
export const archiveScheduleEntry = (id: string, status: "ACTIVE" | "ARCHIVED") =>
  api.patch<ScheduleEntry>(`/schedule/${encodeURIComponent(id)}/archive`, { status });
export const deleteScheduleEntry = (id: string) =>
  api.delete(`/schedule/${encodeURIComponent(id)}`);
export const listScheduleTimeBlocks = () => api.get<ScheduleTimeBlock[]>("/schedule/time-blocks");
export const createScheduleTimeBlock = (draft: {
  organizationId: string;
  name: string;
  startTime: string;
  endTime: string;
}) => api.post<ScheduleTimeBlock>("/schedule/time-blocks", draft);
export const deleteScheduleTimeBlock = (id: string) =>
  api.delete(`/schedule/time-blocks/${encodeURIComponent(id)}`);
export const previewScheduleImport = (entries: ScheduleDraft[]) =>
  api.post<{ valid: boolean; errors: Array<{ row: number; message: string }> }>(
    "/schedule/import/preview",
    { entries },
  );
export const commitScheduleImport = (entries: ScheduleDraft[]) =>
  api.post<{ imported: number }>("/schedule/import/commit", { entries });
export const exportSchedule = () => api.get<ScheduleEntry[]>("/schedule/export");
