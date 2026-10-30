import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../../identity/auth";
import { DataTable, type DataTableColumn } from "../../../../shared/ui/data-table";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Badge, Button, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { listAcademicTeachers, type AcademicTeacher } from "../api/academic.api";
import { listClasses, type EducationClass } from "../api/classes.api";
import { listSchedule, type ScheduleEntry } from "../../schedule/api/schedule.api";
import {
  listTeacherLeaveRequests,
  reviewTeacherLeaveRequest,
  type TeacherLeaveRequest,
} from "../../schedule/api/teacher-leave.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<string, string> = {
  TEACHER: "دبیر",
  PRINCIPAL: "مدیر",
  SCHOOL_SUPERVISOR: "معاون آموزشی",
  ORGANIZATION_ADMIN: "مدیر سازمان",
  DORM_SUPERVISOR: "سرپرست خوابگاه",
};

function fullName(teacher: AcademicTeacher) {
  return [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() || teacher.username;
}

function assignmentsFor(teacherId: string, classes: EducationClass[]) {
  return classes.flatMap((classroom) =>
    classroom.books
      .filter((book) => book.teacher.id === teacherId)
      .map((book) => ({
        classroom: classroom.name,
        schoolYear: classroom.schoolYear,
        subject: book.title,
      })),
  );
}

export function TeachersPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const [selected, setSelected] = useState<AcademicTeacher | null>(null);
  const teachers = useQuery({
    queryKey: ["academic", "teachers", organizationId],
    queryFn: () => listAcademicTeachers(organizationId!, { limit: 100 }),
    enabled: Boolean(organizationId),
  });
  const classes = useQuery({
    queryKey: ["classes", "teacher-directory", organizationId],
    queryFn: () => listClasses(organizationId),
    enabled: Boolean(organizationId),
  });
  const schedule = useQuery({
    queryKey: ["schedule", "teacher-profile", organizationId, selected?.id],
    queryFn: listSchedule,
    enabled: Boolean(organizationId && selected),
  });
  const leaveRequests = useQuery({
    queryKey: ["teacher-leaves", organizationId],
    queryFn: listTeacherLeaveRequests,
    enabled: Boolean(organizationId && auth.can("schedule.publish")),
  });
  const reviewLeave = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        decision: "approved" | "rejected";
        resolution?: "cancel" | "substitute";
        substituteTeacherId?: string;
      };
    }) => reviewTeacherLeaveRequest(id, body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teacher-leaves"] });
      void client.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
  const teacherRows = teachers.data?.items ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const onLeave = (teacherId: string) =>
    (leaveRequests.data ?? []).some(
      (leave) =>
        leave.teacherId === teacherId &&
        leave.status === "approved" &&
        leave.startDate <= today &&
        leave.endDate >= today,
    );
  const classRows = useMemo(() => classes.data ?? [], [classes.data]);
  const columns = useMemo<DataTableColumn<AcademicTeacher>[]>(
    () => [
      {
        id: "name",
        label: "دبیر",
        primary: true,
        value: fullName,
        cell: (teacher) => <span className="font-bold text-ink">{fullName(teacher)}</span>,
      },
      {
        id: "username",
        label: "نام کاربری",
        value: (teacher) => teacher.username,
        cell: (teacher) => <bdi dir="ltr">{teacher.username}</bdi>,
      },
      {
        id: "roles",
        label: "نقش‌ها",
        value: (teacher) => teacher.roles.join(" "),
        cell: (teacher) => <RoleBadges roles={teacher.roles} />,
      },
      {
        id: "assignments",
        label: "تخصیص آموزشی",
        value: (teacher) => assignmentsFor(teacher.id, classRows).length,
        cell: (teacher) => assignmentsFor(teacher.id, classRows).length.toLocaleString("fa-IR"),
      },
      {
        id: "leave",
        label: "وضعیت",
        value: (teacher) => (onLeave(teacher.id) ? "در مرخصی" : "فعال"),
        cell: (teacher) =>
          onLeave(teacher.id) ? (
            <Badge tone="amber">در مرخصی</Badge>
          ) : (
            <Badge tone="green">فعال</Badge>
          ),
      },
    ],
    [classRows, leaveRequests.data],
  );

  if (!organizationId) {
    return <EmptyState title="برای مشاهدهٔ دبیران، ابتدا مدرسهٔ فعال را انتخاب کنید." />;
  }
  if (teachers.isLoading) return <LoadingState label="در حال دریافت فهرست دبیران…" />;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <ManagementPageHeader
        eyebrow="آموزش"
        title="دبیران مدرسه"
        description="همهٔ حساب‌های فعال دارای نقش دبیر، از جمله دبیران چندنقشی، در این فهرست هستند."
      />
      <DataTable
        data={teacherRows}
        columns={columns}
        getRowId={(teacher) => teacher.id}
        label="فهرست دبیران مدرسه"
        loading={teachers.isLoading}
        error={teachers.isError}
        errorMessage="فهرست دبیران دریافت نشد."
        onRefresh={() => {
          void teachers.refetch();
          void classes.refetch();
        }}
        emptyTitle="در این مدرسه هیچ دبیر فعالی وجود ندارد."
        onRowClick={setSelected}
        scrollRows
        className="min-h-0 flex-1"
        preferenceKey={`teachers:${organizationId}`}
      />
      <ResponsiveDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? fullName(selected) : "پروفایل دبیر"}
        description="پروفایل و تخصیص‌های آموزشی دبیر"
        desktopSide="left"
        className="w-full max-w-xl"
      >
        {selected ? (
          <TeacherProfile
            teacher={selected}
            schedule={schedule.data ?? []}
            scheduleLoading={schedule.isLoading}
            scheduleError={schedule.isError}
            onLeave={onLeave(selected.id)}
          />
        ) : null}
      </ResponsiveDrawer>
      {auth.can("schedule.publish") ? (
        <TeacherLeaveReviewQueue
          rows={leaveRequests.data ?? []}
          teachers={teacherRows}
          busy={reviewLeave.isPending}
          onReview={(id, body) => reviewLeave.mutate({ id, body })}
        />
      ) : null}
    </section>
  );
}

function TeacherLeaveReviewQueue({
  rows,
  teachers,
  busy,
  onReview,
}: {
  rows: TeacherLeaveRequest[];
  teachers: AcademicTeacher[];
  busy: boolean;
  onReview: (
    id: string,
    body: {
      decision: "approved" | "rejected";
      resolution?: "cancel" | "substitute";
      substituteTeacherId?: string;
    },
  ) => void;
}) {
  const [substituteByRequest, setSubstituteByRequest] = useState<Record<string, string>>({});
  const pending = rows.filter((row) => row.status === "pending");
  return (
    <section className="grid gap-3" dir="rtl">
      <h2 className="text-sm font-black text-ink">درخواست‌های مرخصی دبیران</h2>
      {!pending.length ? (
        <p className="text-sm text-slate-500">درخواست مرخصی در انتظاری وجود ندارد.</p>
      ) : (
        pending.map((row) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
          >
            <strong>
              {[row.teacher?.firstName, row.teacher?.lastName].filter(Boolean).join(" ") ||
                row.teacher?.username}
            </strong>
            <span className="text-xs text-slate-500">
              {row.startDate} تا {row.endDate} · {row.reason}
            </span>
            <select
              className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] px-2 text-sm"
              value={substituteByRequest[row.id] ?? ""}
              onChange={(event) =>
                setSubstituteByRequest((current) => ({ ...current, [row.id]: event.target.value }))
              }
            >
              <option value="">لغو همه جلسه‌های این بازه</option>
              {teachers
                .filter((teacher) => teacher.id !== row.teacherId)
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {fullName(teacher)}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  onReview(
                    row.id,
                    substituteByRequest[row.id]
                      ? {
                          decision: "approved",
                          resolution: "substitute",
                          substituteTeacherId: substituteByRequest[row.id],
                        }
                      : { decision: "approved", resolution: "cancel" },
                  )
                }
              >
                تأیید
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onReview(row.id, { decision: "rejected" })}
              >
                رد
              </Button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function RoleBadges({ roles }: { roles: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} tone={role === "TEACHER" ? "blue" : "neutral"}>
          {roleLabels[role] ?? role}
        </Badge>
      ))}
    </span>
  );
}

function TeacherProfile({
  teacher,
  schedule,
  scheduleLoading,
  scheduleError,
  onLeave,
}: {
  teacher: AcademicTeacher;
  schedule: ScheduleEntry[];
  scheduleLoading: boolean;
  scheduleError: boolean;
  onLeave: boolean;
}) {
  const teacherSchedule = schedule
    .filter(
      (entry) =>
        entry.status === "ACTIVE" &&
        (entry.teacher?.id === teacher.id || entry.classBook?.teacher.id === teacher.id),
    )
    .sort(
      (left, right) =>
        left.weekday - right.weekday || left.startTime.localeCompare(right.startTime),
    );
  const totalMinutes = teacherSchedule.reduce((sum, entry) => sum + durationMinutes(entry), 0);
  const scheduleByDay = teacherSchedule.reduce<Map<number, ScheduleEntry[]>>((days, entry) => {
    const entries = days.get(entry.weekday) ?? [];
    entries.push(entry);
    days.set(entry.weekday, entries);
    return days;
  }, new Map());
  return (
    <div className="grid gap-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <UserRound size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-ink">{fullName(teacher)}</h2>
          {onLeave ? <Badge tone="amber">در مرخصی</Badge> : null}
          <p className="mt-1 text-sm text-slate-500">
            <bdi dir="ltr">{teacher.username}</bdi>
          </p>
        </div>
      </div>
      <section aria-labelledby="teacher-roles-title" className="grid gap-2">
        <h3 id="teacher-roles-title" className="text-sm font-bold text-ink">
          نقش‌ها در این مدرسه
        </h3>
        <RoleBadges roles={teacher.roles} />
      </section>
      <section
        aria-labelledby="teacher-load-title"
        className="grid gap-3 border-t border-[rgb(var(--border-subtle))] pt-4"
      >
        <div>
          <h3 id="teacher-load-title" className="text-sm font-bold text-ink">
            بار آموزشی هفتگی
          </h3>
          <p className="mt-1 text-xs text-slate-500">جلسه‌های فعال ثبت‌شده در برنامه مدرسه</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-brand/10 p-3">
            <strong className="block text-lg font-black text-brand">
              {teacherSchedule.length.toLocaleString("fa-IR")}
            </strong>
            <span className="text-xs font-bold text-slate-600">جلسه در هفته</span>
          </div>
          <div className="rounded-xl bg-sky-500/10 p-3">
            <strong className="block text-lg font-black text-sky-800">
              {formatHours(totalMinutes)}
            </strong>
            <span className="text-xs font-bold text-slate-600">ساعت در هفته</span>
          </div>
        </div>
        {scheduleLoading ? (
          <p role="status" className="text-sm text-slate-500">
            در حال دریافت برنامه دبیر…
          </p>
        ) : null}
        {scheduleError ? (
          <p role="alert" className="text-sm text-rose-700">
            برنامه دبیر دریافت نشد؛ دوباره تلاش کنید.
          </p>
        ) : null}
        {!scheduleLoading && !scheduleError && !teacherSchedule.length ? (
          <EmptyState title="جلسه فعالی برای این دبیر ثبت نشده است." />
        ) : null}
        {!scheduleLoading && !scheduleError && teacherSchedule.length ? (
          <div className="grid gap-3" aria-label="برنامه هفتگی دبیر">
            {[...scheduleByDay.entries()].map(([weekday, entries]) => {
              const style = scheduleDayStyles[weekday] ?? scheduleDayStyles[0];
              return (
                <section
                  key={weekday}
                  aria-labelledby={`teacher-schedule-day-${weekday}`}
                  className={`overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] border-s-4 ${style.frame}`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 px-3 py-2 ${style.header}`}
                  >
                    <h4
                      id={`teacher-schedule-day-${weekday}`}
                      className="text-base font-black text-ink"
                    >
                      {weekdays[weekday]}
                    </h4>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      {entries.length.toLocaleString("fa-IR")} جلسه
                    </span>
                  </div>
                  <ul className="grid gap-px bg-[rgb(var(--border-subtle))]">
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3 bg-[rgb(var(--surface))] px-3 py-3"
                      >
                        <span className="min-w-0">
                          <strong className="block truncate text-base font-black text-ink">
                            {entry.title}
                          </strong>
                          <span className="mt-1 block text-sm font-bold text-slate-600 dark:text-slate-300">
                            {entry.classroom?.name ?? "کلاس ثبت نشده"}
                          </span>
                        </span>
                        <bdi
                          dir="ltr"
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-black ${style.time}`}
                        >
                          {entry.startTime}–{entry.endTime}
                        </bdi>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const scheduleDayStyles = [
  {
    frame: "border-s-blue-600 dark:border-s-blue-400",
    header: "bg-blue-50 dark:bg-blue-950/40",
    time: "bg-blue-100 text-blue-900 dark:bg-blue-900/70 dark:text-blue-100",
  },
  {
    frame: "border-s-teal-600 dark:border-s-teal-400",
    header: "bg-teal-50 dark:bg-teal-950/40",
    time: "bg-teal-100 text-teal-900 dark:bg-teal-900/70 dark:text-teal-100",
  },
  {
    frame: "border-s-violet-600 dark:border-s-violet-400",
    header: "bg-violet-50 dark:bg-violet-950/40",
    time: "bg-violet-100 text-violet-900 dark:bg-violet-900/70 dark:text-violet-100",
  },
  {
    frame: "border-s-rose-600 dark:border-s-rose-400",
    header: "bg-rose-50 dark:bg-rose-950/40",
    time: "bg-rose-100 text-rose-900 dark:bg-rose-900/70 dark:text-rose-100",
  },
  {
    frame: "border-s-amber-600 dark:border-s-amber-400",
    header: "bg-amber-50 dark:bg-amber-950/40",
    time: "bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-100",
  },
  {
    frame: "border-s-cyan-600 dark:border-s-cyan-400",
    header: "bg-cyan-50 dark:bg-cyan-950/40",
    time: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/70 dark:text-cyan-100",
  },
  {
    frame: "border-s-fuchsia-600 dark:border-s-fuchsia-400",
    header: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    time: "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/70 dark:text-fuchsia-100",
  },
];
const durationMinutes = (entry: ScheduleEntry) => {
  const [startHour, startMinute] = entry.startTime.split(":").map(Number);
  const [endHour, endMinute] = entry.endTime.split(":").map(Number);
  return endHour * 60 + endMinute - startHour * 60 - startMinute;
};
const formatHours = (minutes: number) =>
  `${Math.floor(minutes / 60).toLocaleString("fa-IR")}:${(minutes % 60).toLocaleString("fa-IR", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  })} ساعت`;
