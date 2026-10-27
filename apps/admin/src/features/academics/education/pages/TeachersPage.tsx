import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../../identity/auth";
import { DataTable, type DataTableColumn } from "../../../../shared/ui/data-table";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Badge, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { listAcademicTeachers, type AcademicTeacher } from "../api/academic.api";
import { listClasses, type EducationClass } from "../api/classes.api";
import { listSchedule, type ScheduleEntry } from "../../schedule/api/schedule.api";

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
  const teacherRows = teachers.data?.items ?? [];
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
    ],
    [classRows],
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
            assignments={assignmentsFor(selected.id, classRows)}
            loading={classes.isLoading}
            assignmentsError={classes.isError}
            schedule={schedule.data ?? []}
            scheduleLoading={schedule.isLoading}
            scheduleError={schedule.isError}
          />
        ) : null}
      </ResponsiveDrawer>
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
  assignments,
  loading,
  assignmentsError,
  schedule,
  scheduleLoading,
  scheduleError,
}: {
  teacher: AcademicTeacher;
  assignments: Array<{ classroom: string; schoolYear: string; subject: string }>;
  loading: boolean;
  assignmentsError: boolean;
  schedule: ScheduleEntry[];
  scheduleLoading: boolean;
  scheduleError: boolean;
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
  return (
    <div className="grid gap-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <UserRound size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-ink">{fullName(teacher)}</h2>
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
      <section aria-labelledby="teacher-assignments-title" className="grid gap-2">
        <h3 id="teacher-assignments-title" className="text-sm font-bold text-ink">
          تخصیص‌های آموزشی
        </h3>
        {loading ? (
          <p role="status" className="text-sm text-slate-500">
            در حال دریافت تخصیص‌ها…
          </p>
        ) : null}
        {assignmentsError ? (
          <p role="alert" className="text-sm text-rose-700">
            تخصیص‌های آموزشی دریافت نشدند؛ دوباره تلاش کنید.
          </p>
        ) : null}
        {!loading && !assignmentsError && !assignments.length ? (
          <EmptyState title="هنوز درس یا کلاسی به این دبیر تخصیص داده نشده است." />
        ) : null}
        {!loading && !assignmentsError ? (
          <ul className="grid gap-2">
            {assignments.map((assignment, index) => (
              <li
                key={`${assignment.classroom}-${assignment.subject}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <BookOpen size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-ink">{assignment.subject}</strong>
                  <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <GraduationCap size={13} aria-hidden="true" />
                    {assignment.classroom} · {assignment.schoolYear}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
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
          <ul className="grid gap-2" aria-label="برنامه هفتگی دبیر">
            {teacherSchedule.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              >
                <span>
                  <strong className="block text-sm text-ink">{entry.title}</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {weekdays[entry.weekday]} · {entry.classroom?.name ?? "کلاس ثبت نشده"}
                  </span>
                </span>
                <bdi dir="ltr" className="text-xs font-black text-brand">
                  {entry.startTime}–{entry.endTime}
                </bdi>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const durationMinutes = (entry: ScheduleEntry) => {
  const [startHour, startMinute] = entry.startTime.split(":").map(Number);
  const [endHour, endMinute] = entry.endTime.split(":").map(Number);
  return endHour * 60 + endMinute - startHour * 60 - startMinute;
};
const formatHours = (minutes: number) =>
  `${(minutes / 60).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ساعت`;
