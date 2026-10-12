import type {
  TimetableWorkspace,
  TimetableVersion,
  TimetableLessonDraft,
  TimetableImportRow,
  TimetableImportPreview,
  TimetableOverrideDraft,
  TimetableConflict,
} from "@moshaver/api-contract";
import { api } from "../../../shared/api/api";
export const getTimetable = (
  organizationId: string,
  versionId: string | undefined,
  startsOn: string,
) =>
  api.get<TimetableWorkspace>(
    `/schedule/timetable/${encodeURIComponent(organizationId)}?startsOn=${startsOn}${versionId ? `&versionId=${encodeURIComponent(versionId)}` : ""}`,
  );
export const saveTimetableConfig = (organizationId: string, body: Record<string, unknown>) =>
  api.post(`/schedule/timetable/${organizationId}/config`, body);
export const createTimetableVersion = (
  organizationId: string,
  body: {
    termId: string;
    name: string;
    effectiveOn: string;
    reason: string;
    copyVersionId?: string;
  },
) => api.post<TimetableVersion>(`/schedule/timetable/${organizationId}/versions`, body);
export const writeTimetableLesson = (
  versionId: string,
  expectedRevision: number,
  lesson: TimetableLessonDraft,
  id?: string,
) =>
  id
    ? api.patch<{ id: string; revision: number }>(
        `/schedule/timetable/versions/${versionId}/lessons/${id}`,
        {
          expectedRevision,
          lesson: timetableLessonDraft(lesson),
        },
      )
    : api.post<{ id: string; revision: number }>(
        `/schedule/timetable/versions/${versionId}/lessons`,
        {
          expectedRevision,
          lesson: timetableLessonDraft(lesson),
        },
      );
export const previewTimetableLesson = (
  versionId: string,
  expectedRevision: number,
  lesson: TimetableLessonDraft,
  id?: string,
) =>
  id
    ? api.post<{ conflicts: TimetableConflict[] }>(
        `/schedule/timetable/versions/${versionId}/lessons/${id}/preview`,
        { expectedRevision, lesson: timetableLessonDraft(lesson) },
      )
    : api.post<{ conflicts: TimetableConflict[] }>(
        `/schedule/timetable/versions/${versionId}/lessons/preview`,
        { expectedRevision, lesson: timetableLessonDraft(lesson) },
      );
export const removeTimetableLesson = (versionId: string, id: string, expectedRevision: number) =>
  api.delete(`/schedule/timetable/versions/${versionId}/lessons/${id}`, { expectedRevision });
export const publishTimetable = (id: string, expectedRevision: number, reason: string) =>
  api.post(`/schedule/timetable/versions/${id}/publish`, { expectedRevision, reason });
export const overrideTimetable = (
  id: string,
  expectedRevision: number,
  change: TimetableOverrideDraft,
) => api.post(`/schedule/timetable/versions/${id}/overrides`, { ...change, expectedRevision });
export const previewTimetableImport = (
  id: string,
  expectedRevision: number,
  filename: string,
  sheetName: string,
  rows: TimetableImportRow[],
) =>
  api.post<TimetableImportPreview>(`/schedule/timetable/versions/${id}/import/preview`, {
    expectedRevision,
    filename,
    sheetName,
    rows,
  });
export const commitTimetableImport = (
  id: string,
  expectedRevision: number,
  filename: string,
  sheetName: string,
  rows: TimetableImportRow[],
) =>
  api.post<{ imported: number; revision: number }>(
    `/schedule/timetable/versions/${id}/import/commit`,
    {
      expectedRevision,
      filename,
      sheetName,
      rows,
    },
  );
export const openTimetableAttendance = (id: string, date: string) =>
  api.post<{ sessionId: string; cancelled: boolean }>(
    `/schedule/timetable/lessons/${id}/attendance`,
    { date },
  );

export function timetableLessonDraft(lesson: TimetableLessonDraft): TimetableLessonDraft {
  return {
    classroomId: lesson.classroomId,
    classBookId: lesson.classBookId,
    teacherId: lesson.teacherId ?? null,
    periodId: lesson.periodId,
    locationId: lesson.locationId ?? null,
    weekday: lesson.weekday,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    startsOn: lesson.startsOn,
    endsOn: lesson.endsOn,
    notes: lesson.notes ?? "",
  };
}
