import { api } from "../../../shared/api/api";
import type {
  DatabaseMeta,
  HistoryRow,
  PasswordDraft,
  ReleaseDraft,
  Readiness,
  ServiceHealth,
  Session,
} from "../model/system.types";
export const getDatabaseMeta = () => api.get<DatabaseMeta>("/system/database");
export const getServiceHealth = () => api.get<ServiceHealth>("/health");
export const getReadiness = () => api.get<Readiness>("/ready");
export const getSessions = () => api.get<Session[]>("/auth/sessions");
export const getImportHistory = () => api.get<HistoryRow[]>("/import/history");
export const getReleases = () => api.get<HistoryRow[]>("/app-releases");
export const getAudit = () => api.get<HistoryRow[]>("/audit");
export const restoreDatabase = (file: File) => api.uploadBinary("/system/database-restore", file);
export const changeAdminPassword = (body: PasswordDraft) =>
  api.post("/auth/change-password", {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });
export const saveAppRelease = (release: ReleaseDraft) =>
  api.put(`/app-releases/${encodeURIComponent(release.app)}`, {
    version: release.version,
    notes: release.notes,
  });
export type AppVersion = { app: string; version: string; notes: string; updatedAt: string };
export const getAppVersions = () => api.get<AppVersion[]>("/app-versions");
export const saveAppVersion = (app: string, body: { version: string; notes: string }) =>
  api.put<AppVersion>(`/app-versions/${encodeURIComponent(app)}`, body);
export const downloadDatabaseBackup = () => api.download("/system/database-backup");
export type RelaxationTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  active: boolean;
  organizationId?: string | null;
  gradeIds?: number[] | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  updatedAt: string;
};
export type RelaxationTrackDraft = {
  title: string;
  artist: string;
  url: string;
  active: boolean;
  organizationId?: string;
  gradeIds?: number[];
  availableFrom?: string;
  availableUntil?: string;
};
export const getRelaxationTracks = () => api.get<RelaxationTrack[]>("/system/relaxation-tracks");
export const getRelaxationTrackAudience = (id: string) =>
  api.get<{
    trackId: string;
    eligibleStudents: number;
    byGrade: Array<{ grade: number; count: number }>;
  }>(`/system/relaxation-tracks/${encodeURIComponent(id)}/audience`);
export const createRelaxationTrack = (body: RelaxationTrackDraft) =>
  api.post<RelaxationTrack>("/system/relaxation-tracks", body);
export const updateRelaxationTrack = (id: string, body: RelaxationTrackDraft) =>
  api.patch<RelaxationTrack>(`/system/relaxation-tracks/${encodeURIComponent(id)}`, body);
