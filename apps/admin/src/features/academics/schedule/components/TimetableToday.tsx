import type { TimetableOccurrence } from "@moshaver/api-contract";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { Card, Button } from "../../../../shared/ui/ui";
import { notify } from "../../../../shared/ui/notifications";
import { getTimetable, openTimetableAttendance } from "../api/timetable.api.ts";
import { timetableDateLabel, timetableToday, timetableWeekStart } from "../lib/timetable-time";
export function TimetableToday() {
  const auth = useAuth();
  const navigate = useNavigate();
  const org = auth.context?.activeOrganization?.id;
  const [now, setNow] = useState(Date.now());
  const [zone, setZone] = useState("Asia/Tehran");
  const today = timetableToday(zone, new Date(now));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ["timetable-today", org, auth.activeRole, today],
    queryFn: () => getTimetable(org!, undefined, timetableWeekStart(today)),
    enabled: !!org && auth.can("schedule.read"),
  });
  useEffect(() => {
    const year = query.data?.years.find((year) => year.active);
    if (year) setZone(year.timeZone);
  }, [query.data?.years]);
  const rows = (query.data?.occurrences ?? []).filter((x) => !x.cancelled);
  const current = rows.find((x) => Date.parse(x.startsAt) <= now && Date.parse(x.endsAt) > now);
  const next = rows
    .filter((x) => Date.parse(x.startsAt) > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const attendance = useMutation({
    mutationFn: (occurrence: TimetableOccurrence) =>
      openTimetableAttendance(occurrence.id, occurrence.date),
    onSuccess: (result, occurrence) =>
      navigate(
        `/admin/attendance?contextType=class&contextId=${occurrence.classroomId}&sessionId=${result.sessionId}`,
      ),
    onError: (e) => notify(e.message, "error"),
  });
  if (!org || !auth.can("schedule.read") || !query.data?.versions.length) return null;
  return (
    <Card className="grid gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold">برنامه امروز</h2>
          <p className="text-xs text-slate-500">{timetableDateLabel(today)}</p>
        </div>
        <Link className="min-h-11 py-2 text-sm text-brand" to="/admin/schedule">
          برنامه کامل
        </Link>
      </div>
      {query.isError ? (
        <p role="alert">دریافت برنامه انجام نشد.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">اکنون</p>
            {current ? (
              <>
                <strong>{current.title}</strong>
                <p className="text-xs">
                  {current.teacherName} · {current.locationName || current.classroomName}
                </p>
                <p className="text-xs">
                  تا {current.endTime} · {Math.ceil((Date.parse(current.endsAt) - now) / 60000)}{" "}
                  دقیقه باقی‌مانده
                </p>
                {current.changeReason ? (
                  <p className="text-xs text-amber-700">{current.changeReason}</p>
                ) : null}
                {auth.can("attendance.class.manage") ? (
                  <Button
                    variant="soft"
                    disabled={attendance.isPending}
                    onClick={() => current && attendance.mutate(current)}
                  >
                    حضور همین درس
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-sm">اکنون کلاس فعالی ندارید.</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">بعدی</p>
            {next ? (
              <>
                <strong>{next.title}</strong>
                <p className="text-xs">
                  {next.teacherName} · {next.locationName || next.classroomName} · {next.startTime}
                </p>
                {next.changeReason ? (
                  <p className="text-xs text-amber-700">{next.changeReason}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm">درس بعدی ثبت نشده است.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
