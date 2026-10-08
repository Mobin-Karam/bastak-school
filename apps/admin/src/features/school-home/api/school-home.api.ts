import { api } from "../../../shared/api/api";

export type PrayerTimes = {
  id: string;
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  source: string;
  updatedAt: string;
};

export type SchoolAnnouncement = {
  id: string;
  audience: "STAFF" | "STUDENTS" | "CLASS";
  classroomId: string | null;
  title: string;
  body: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export const getPrayerTimes = (organizationId?: string, date?: string) => {
  const query = new URLSearchParams();
  if (organizationId) query.set("organizationId", organizationId);
  // Keep an explicitly empty date: it means the school-wide default rather
  // than today's resolved schedule.
  if (date !== undefined) query.set("date", date);
  const suffix = query.size ? `?${query.toString()}` : "";
  return api.get<{ organizationId: string; date: string; times: PrayerTimes | null }>(
    `/prayer-times${suffix}`,
  );
};

export type SavePrayerTimesInput = Pick<
  PrayerTimes,
  "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha"
> & {
  date?: string;
  source?: string;
};

export const savePrayerTimes = (organizationId: string, values: SavePrayerTimesInput) =>
  api.patch<PrayerTimes>(
    `/organizations/${encodeURIComponent(organizationId)}/prayer-times`,
    values,
  );

export const deletePrayerTimes = (organizationId: string, date = "") =>
  api.delete<{ deleted: boolean }>(
    `/organizations/${encodeURIComponent(organizationId)}/prayer-times?date=${encodeURIComponent(date)}`,
  );

export const listAnnouncements = (organizationId?: string) =>
  api.get<SchoolAnnouncement[]>(
    `/announcements${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const createAnnouncement = (
  organizationId: string,
  body: Pick<SchoolAnnouncement, "title" | "body" | "audience" | "status">,
) =>
  api.post<SchoolAnnouncement>(
    `/organizations/${encodeURIComponent(organizationId)}/announcements`,
    body,
  );
