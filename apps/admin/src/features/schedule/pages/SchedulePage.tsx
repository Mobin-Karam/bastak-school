import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarClock,
  Download,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { listOrganizations } from "../../access/api/access.api";
import { useAuth } from "../../auth";
import { listClasses } from "../../education/api/classes.api";
import { Button, Card, EmptyState, Input, LoadingState } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
} from "../../../shared/lib/spreadsheet-transfer";
import {
  archiveScheduleEntry,
  commitScheduleImport,
  createScheduleEntry,
  deleteScheduleEntry,
  exportSchedule,
  listSchedule,
  previewScheduleImport,
  type ScheduleDraft,
  updateScheduleEntry,
} from "../api/schedule.api";
import type { ScheduleEntry } from "../api/schedule.api";
import { TeacherSchedulePage } from "../../teacher-portal";

const weekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const blank = (): ScheduleDraft => ({
  organizationId: "",
  title: "",
  weekday: 0,
  startTime: "08:00",
  endTime: "09:00",
  room: "",
});
const spreadsheet = defineSpreadsheet<ScheduleDraft>({
  sheetName: "برنامه هفتگی",
  columns: [
    { key: "organizationId", header: "شناسه مدرسه", required: true },
    { key: "classroomId", header: "شناسه کلاس" },
    { key: "teacherId", header: "شناسه دبیر" },
    { key: "title", header: "عنوان", required: true },
    { key: "weekday", header: "روز هفته", required: true, read: (value) => Number(value) },
    { key: "startTime", header: "شروع", required: true },
    { key: "endTime", header: "پایان", required: true },
    { key: "room", header: "اتاق" },
  ],
});

export function SchedulePage() {
  const auth = useAuth();
  const client = useQueryClient();
  const [draft, setDraft] = useState<ScheduleDraft>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const entries = useQuery({ queryKey: ["schedule"], queryFn: listSchedule });
  const canReadOrganizations = auth.can("organization.read");
  const organizations = useQuery({
    queryKey: ["organizations", "schedule"],
    queryFn: listOrganizations,
    enabled: canReadOrganizations,
  });
  const organizationOptions = canReadOrganizations
    ? (organizations.data ?? [])
    : (auth.context?.availableOrganizations ?? []);
  const canWrite = auth.canAny(["schedule.create", "schedule.update"]);
  const isStudent = auth.activeRole === "STUDENT";
  const isTeacher = auth.activeRole === "TEACHER";
  const classes = useQuery({
    queryKey: ["classes", "schedule"],
    queryFn: () => listClasses(),
    enabled: canWrite,
  });
  const reload = () => void client.invalidateQueries({ queryKey: ["schedule"] });
  const save = useMutation({
    mutationFn: () => (editing ? updateScheduleEntry(editing, draft) : createScheduleEntry(draft)),
    onSuccess: () => {
      reload();
      setDraft(blank());
      setEditing(null);
      notify("برنامه ذخیره شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "ذخیره برنامه انجام نشد.", "error"),
  });
  const archive = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "ARCHIVED" }) =>
      archiveScheduleEntry(id, status),
    onSuccess: reload,
  });
  const remove = useMutation({ mutationFn: deleteScheduleEntry, onSuccess: reload });
  async function download() {
    try {
      const rows = await exportSchedule();
      await downloadSpreadsheet(
        spreadsheet,
        rows.map((item) => ({
          organizationId: item.organization.id,
          classroomId: item.classroom?.id || "",
          teacherId: item.teacher?.id || "",
          title: item.title,
          weekday: item.weekday,
          startTime: item.startTime,
          endTime: item.endTime,
          room: item.room,
        })),
        "zanin-schedule",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "خروجی برنامه انجام نشد.", "error");
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const rows = await readSpreadsheet<ScheduleDraft>(file, spreadsheet);
      const preview = await previewScheduleImport(rows);
      if (!preview.valid)
        throw new Error(
          preview.errors.map((item) => `ردیف ${item.row}: ${item.message}`).join("\n"),
        );
      const result = await commitScheduleImport(rows);
      reload();
      notify(`${result.imported} برنامه وارد شد.`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "ورود برنامه انجام نشد.", "error");
    } finally {
      if (upload.current) upload.current.value = "";
    }
  }
  if (
    entries.isLoading ||
    (canReadOrganizations && organizations.isLoading) ||
    (canWrite && classes.isLoading)
  )
    return <LoadingState label="در حال دریافت برنامه…" />;
  if (
    entries.isError ||
    (canReadOrganizations && organizations.isError) ||
    (canWrite && classes.isError)
  )
    return <EmptyState title="دریافت برنامه انجام نشد." />;
  if (isStudent) return <StudentWeeklySchedule entries={entries.data ?? []} />;
  if (isTeacher) return <TeacherSchedulePage entries={entries.data ?? []} />;
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]" dir="rtl">
      <Card className="order-2 p-3 xl:order-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="text-brand" size={19} />
            <div>
              <h1 className="font-black">برنامه هفتگی</h1>
              <p className="text-xs text-slate-500">برنامه‌های خواندنیِ مجاز برای نقش فعلی شما</p>
            </div>
          </div>
          {auth.can("schedule.export") ? (
            <div className="flex gap-1">
              <Button size="sm" variant="soft" onClick={() => void download()}>
                <Download size={14} />
                Excel
              </Button>
              {auth.can("schedule.import") ? (
                <>
                  <input
                    ref={upload}
                    className="hidden"
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => void importFile(e.target.files?.[0])}
                  />
                  <Button size="sm" variant="soft" onClick={() => upload.current?.click()}>
                    <Upload size={14} />
                    Excel
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {entries.data?.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3"
            >
              <div className="flex justify-between gap-2">
                <b>{entry.title}</b>
                <span className="text-xs text-slate-500">{weekdays[entry.weekday]}</span>
              </div>
              <p className="mt-2 text-sm text-brand">
                {entry.startTime} تا {entry.endTime}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {entry.classroom?.name || entry.organization.name}
                {entry.room ? ` · ${entry.room}` : ""}
              </p>
              {canWrite ? (
                <div className="mt-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setEditing(entry.id);
                      setDraft({
                        organizationId: entry.organization.id,
                        classroomId: entry.classroom?.id,
                        teacherId: entry.teacher?.id,
                        title: entry.title,
                        weekday: entry.weekday,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        room: entry.room,
                      });
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      archive.mutate({
                        id: entry.id,
                        status: entry.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE",
                      })
                    }
                  >
                    <Archive size={14} />
                  </Button>
                  {auth.can("schedule.delete") ? (
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(entry.id)}>
                      <Trash2 size={14} />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          {!entries.data?.length ? <EmptyState title="برنامه‌ای برای نمایش ندارید." /> : null}
        </div>
      </Card>
      {canWrite ? (
        <Card className="order-1 p-4 xl:order-2">
          <h2 className="font-black">{editing ? "ویرایش برنامه" : "افزودن برنامه"}</h2>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              مدرسه
              <select
                value={draft.organizationId}
                onChange={(e) => setDraft({ ...draft, organizationId: e.target.value })}
                className="h-10 rounded-lg border bg-[rgb(var(--surface-card))] px-3"
              >
                <option value="">انتخاب کنید</option>
                {organizationOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              کلاس
              <select
                value={draft.classroomId || ""}
                onChange={(e) => setDraft({ ...draft, classroomId: e.target.value || undefined })}
                className="h-10 rounded-lg border bg-[rgb(var(--surface-card))] px-3"
              >
                <option value="">بدون کلاس</option>
                {classes.data
                  ?.filter(
                    (item) =>
                      !draft.organizationId || item.organization.id === draft.organizationId,
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <Input
              placeholder="عنوان درس یا برنامه"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
              />
              <Input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
              />
            </div>
            <select
              value={draft.weekday}
              onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}
              className="h-10 rounded-lg border bg-[rgb(var(--surface-card))] px-3"
            >
              {weekdays.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              placeholder="کلاس / اتاق"
              value={draft.room || ""}
              onChange={(e) => setDraft({ ...draft, room: e.target.value })}
            />
            <Button
              disabled={!draft.organizationId || !draft.title || save.isPending}
              onClick={() => save.mutate()}
            >
              <Plus size={16} />
              {editing ? "ذخیره تغییرات" : "افزودن"}
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function StudentWeeklySchedule({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <section className="mx-auto grid w-full max-w-4xl gap-4" dir="rtl" aria-label="برنامه هفتگی من">
      <header className="px-1">
        <p className="text-xs font-bold text-brand">فضای آموزشی من</p>
        <h1 className="mt-1 text-xl font-black text-ink">برنامه هفتگی کلاس‌ها</h1>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          زمان هر درس، کلاس و استاد مربوط به آن را ببینید.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {weekdays.map((day, weekday) => {
          const dailyEntries = entries
            .filter((entry) => entry.status === "ACTIVE" && entry.weekday === weekday)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <Card key={day} className="min-w-0 p-3">
              <h2 className="text-sm font-black text-ink">{day}</h2>
              <div className="mt-3 grid gap-2">
                {dailyEntries.map((entry) => (
                  <article key={entry.id} className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
                    <div className="flex items-start gap-2">
                      <CalendarClock
                        size={17}
                        className="mt-0.5 shrink-0 text-brand"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-ink">{entry.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-brand">
                          {entry.startTime} تا {entry.endTime}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {entry.classroom?.name || entry.room || entry.organization.name}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <GraduationCap size={14} aria-hidden="true" />
                          {teacherName(entry) || "استاد این کلاس هنوز ثبت نشده است."}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
                {!dailyEntries.length ? (
                  <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-xs text-slate-500">
                    کلاسی برای این روز ثبت نشده است.
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function teacherName(entry: ScheduleEntry) {
  if (!entry.teacher) return "";
  return (
    [entry.teacher.firstName, entry.teacher.lastName].filter(Boolean).join(" ") ||
    entry.teacher.username
  );
}
