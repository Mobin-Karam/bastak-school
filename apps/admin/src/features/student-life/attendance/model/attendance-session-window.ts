import type { AttendanceSessionDetail } from "@moshaver/api-contract";

export type AttendanceSessionWindow = {
  active: boolean;
  restricted: boolean;
  message: string | null;
};

/** Mirrors the server's [start, end) rule for scheduled attendance sessions. */
export function attendanceSessionWindow(
  session: Pick<AttendanceSessionDetail, "scheduledStartAt" | "scheduledEndAt">,
  now = Date.now(),
): AttendanceSessionWindow {
  if (!session.scheduledStartAt || !session.scheduledEndAt)
    return { active: true, restricted: false, message: null };

  const startsAt = Date.parse(session.scheduledStartAt);
  const endsAt = Date.parse(session.scheduledEndAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt))
    return { active: false, restricted: true, message: "زمان جلسه معتبر نیست." };
  if (now >= startsAt && now < endsAt)
    return { active: true, restricted: true, message: null };

  return {
    active: false,
    restricted: true,
    message:
      now < startsAt
        ? "ثبت حضور با شروع زمان برنامه‌ریزی‌شده جلسه فعال می‌شود."
        : "زمان این جلسه پایان یافته است؛ تغییر حضور از این صفحه مجاز نیست.",
  };
}
