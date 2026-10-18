import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarClock,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { listOrganizations } from "../../../identity/access/api/access.api";
import { useAuth } from "../../../identity/auth";
import { listClasses } from "../../education/api/classes.api";
import { Button, Card, EmptyState, Input, LoadingState } from "../../../../shared/ui/ui";
import { notify } from "../../../../shared/ui/notifications";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
} from "../../../../shared/lib/spreadsheet-transfer";
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
import { TeacherSchedulePage } from "../../../people/teacher-portal";
import { OrganizationTag } from "../../../../shared/ui/organization-tag";
import { todayIso } from "../../../../shared/lib/utils";
import { useModal } from "../../../../shared/ui/modal";
import { SpreadsheetTransferActions } from "../../../../shared/ui/spreadsheet-transfer-actions";
import { SpreadsheetTransferLauncher } from "../../../../shared/ui/spreadsheet-transfer-launcher";
import { useViewportShell } from "../../../../app/layout/lib/viewport-shell";
import { MobileTabs } from "../../../../shared/ui/mobile";

const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
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

export function LegacySchedulePage() {
  const auth = useAuth();
  const modal = useModal();
  const client = useQueryClient();
  const [activeWeekday, setActiveWeekday] = useState(() =>
    new Date(`${todayIso()}T12:00:00`).getDay(),
  );
  const selectedOrganizationId = auth.context?.activeOrganization?.id;
  const entries = useQuery({
    queryKey: ["schedule", selectedOrganizationId ?? "all"],
    queryFn: listSchedule,
  });
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
    mutationFn: ({ id, draft }: { id?: string; draft: ScheduleDraft }) =>
      id ? updateScheduleEntry(id, draft) : createScheduleEntry(draft),
    onSuccess: () => {
      reload();
      notify("برنامه ذخیره شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "ذخیره برنامه انجام نشد.", "error"),
  });
  const archive = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "ARCHIVED" }) =>
      archiveScheduleEntry(id, status),
    onSuccess: reload,
  });
  const remove = useMutation({
    mutationFn: deleteScheduleEntry,
    onSuccess: () => {
      reload();
      notify("برنامه حذف شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "حذف برنامه انجام نشد.", "error"),
  });
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
    }
  }
  async function downloadTemplate() {
    await downloadSpreadsheet(
      spreadsheet,
      [
        {
          organizationId: selectedOrganizationId ?? "",
          classroomId: "",
          teacherId: "",
          title: "نمونه جلسه",
          weekday: 0,
          startTime: "08:00",
          endTime: "09:00",
          room: "کلاس ۱",
        },
      ],
      "schedule-import-template.xlsx",
    );
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
  const editEntry = (entry?: ScheduleEntry) => {
    modal.open({
      title: entry ? "ویرایش جلسه" : "افزودن جلسه به برنامه",
      description: entry
        ? "جزئیات جلسه را اصلاح کنید؛ تغییرات فقط پس از ذخیره اعمال می‌شود."
        : "گام ۱: مدرسه و کلاس را مشخص کنید. گام ۲: زمان و فضای جلسه را وارد کنید.",
      size: "lg",
      content: (
        <ScheduleEditorForm
          initial={entry ? draftFromEntry(entry) : blank()}
          organizations={organizationOptions}
          classes={classes.data ?? []}
          isSaving={save.isPending}
          onCancel={modal.close}
          onSubmit={async (draft) => {
            await save.mutateAsync({ id: entry?.id, draft });
            modal.close();
          }}
        />
      ),
    });
  };
  const confirmDelete = (entry: ScheduleEntry) => {
    void modal
      .confirm({
        title: "حذف جلسه از برنامه؟",
        description: `«${entry.title}» برای همیشه از برنامه حذف می‌شود. این کار قابل بازگشت نیست.`,
        tone: "danger",
        confirmLabel: "حذف جلسه",
        cancelLabel: "انصراف",
        softConfirm: true,
      })
      .then((confirmed) => confirmed && remove.mutate(entry.id));
  };
  const openDetails = (entry: ScheduleEntry) => {
    modal.open({
      title: "جزئیات جلسه",
      description: "زمان، کلاس و فضای آموزشی جلسه انتخاب‌شده",
      size: "md",
      content: (
        <SchedulePlanModal
          entry={entry}
          showOrganization={auth.hasRole("PLATFORM_ADMIN")}
          canWrite={canWrite}
          canDelete={auth.can("schedule.delete")}
          onClose={modal.close}
          onEdit={() => {
            modal.close();
            editEntry(entry);
          }}
          onArchive={() => {
            modal.close();
            archive.mutate({
              id: entry.id,
              status: entry.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE",
            });
          }}
          onDelete={() => {
            modal.close();
            confirmDelete(entry);
          }}
        />
      ),
    });
  };
  return (
    <section
      className="mx-auto grid w-full max-w-7xl gap-4 pb-[calc(6rem+env(safe-area-inset-bottom))] min-[960px]:grid-cols-[minmax(0,1fr)_22rem] min-[960px]:pb-6"
      dir="rtl"
    >
      <div className="order-2 grid gap-3 min-[960px]:order-1">
        <ScheduleWorkspace
          entries={entries.data ?? []}
          activeWeekday={activeWeekday}
          onWeekdayChange={setActiveWeekday}
          canWrite={canWrite}
          showOrganization={auth.hasRole("PLATFORM_ADMIN")}
          canDelete={auth.can("schedule.delete")}
          onEdit={editEntry}
          onArchive={(entry) =>
            archive.mutate({
              id: entry.id,
              status: entry.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE",
            })
          }
          onDelete={confirmDelete}
          onOpenDetails={openDetails}
          toolbar={
            auth.canAny(["schedule.import", "schedule.export"]) ? (
              <SpreadsheetTransferLauncher
                title="ورود و خروجی برنامه"
                description="نمونه را دریافت کنید، فایل را وارد کنید یا خروجی فعلی را بگیرید. خطاها با شماره ردیف و ستون نمایش داده می‌شوند."
                trigger="Excel"
              >
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-slate-500">
                    فایل باید ستون‌های برنامه هفتگی را داشته باشد.
                  </p>
                  <SpreadsheetTransferActions
                    canImport={auth.can("schedule.import")}
                    canExport={auth.can("schedule.export")}
                    onImport={(file) => void importFile(file)}
                    onTemplate={() => void downloadTemplate()}
                    onExport={() => void download()}
                  />
                </div>
              </SpreadsheetTransferLauncher>
            ) : null
          }
        />
      </div>
      {canWrite ? (
        <Card className="order-1 border-brand/15 bg-[rgb(var(--surface-card))] p-4 min-[960px]:order-2 min-[960px]:sticky min-[960px]:top-3 min-[960px]:self-start">
          <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
            <Plus size={20} />
          </span>
          <h2 className="mt-3 font-black text-ink">ساخت جلسه، بدون ترک جدول</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">
            در یک فرم کوتاه، مدرسه، زمان و فضای جلسه را مشخص کنید.
          </p>
          <Button className="mt-4 w-full" onClick={() => editEntry()}>
            <Plus size={16} /> افزودن جلسه
          </Button>
        </Card>
      ) : null}
    </section>
  );
}

const displayWeekdays = [6, 0, 1, 2, 3, 4, 5] as const;

type ScheduleWorkspaceProps = {
  entries: ScheduleEntry[];
  activeWeekday: number;
  onWeekdayChange: (weekday: number) => void;
  canWrite: boolean;
  canDelete: boolean;
  showOrganization: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenDetails: (entry: ScheduleEntry) => void;
  toolbar?: ReactNode;
};

function ScheduleWorkspace({
  entries,
  activeWeekday,
  onWeekdayChange,
  canWrite,
  canDelete,
  showOrganization,
  onEdit,
  onArchive,
  onDelete,
  onOpenDetails,
  toolbar,
}: ScheduleWorkspaceProps) {
  const isMobileShell = useViewportShell() === "mobile";
  const activeScheduleEntries = useMemo(
    () => entries.filter((entry) => entry.status === "ACTIVE"),
    [entries],
  );
  const archivedEntries = useMemo(
    () => entries.filter((entry) => entry.status === "ARCHIVED"),
    [entries],
  );
  const entriesByWeekday = useMemo(
    () =>
      new Map(
        weekdays.map((_, weekday) => [
          weekday,
          activeScheduleEntries
            .filter((entry) => entry.weekday === weekday)
            .sort((left, right) => left.startTime.localeCompare(right.startTime)),
        ]),
      ),
    [activeScheduleEntries],
  );
  const today = new Date(`${todayIso()}T12:00:00`).getDay();
  const activeEntries = entriesByWeekday.get(activeWeekday) ?? [];
  const classLanes = useMemo(() => {
    const lanes = new Map<string, ScheduleEntry[]>();

    activeScheduleEntries.forEach((entry) => {
      const label = entry.classroom?.name || entry.room || "برنامه عمومی مدرسه";
      lanes.set(label, [...(lanes.get(label) ?? []), entry]);
    });

    return Array.from(lanes, ([label, laneEntries]) => ({
      label,
      entries: laneEntries.sort((left, right) => {
        const weekdayOrder = left.weekday - right.weekday;
        return weekdayOrder || left.startTime.localeCompare(right.startTime);
      }),
    })).sort((left, right) => left.label.localeCompare(right.label, "fa"));
  }, [activeScheduleEntries]);

  return (
    <section className="grid gap-3" aria-label="برنامه هفتگی مدرسه">
      <section className="grid gap-3">
        <div className="flex min-w-0 flex-wrap justify-end gap-2">{toolbar}</div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">
          <ScheduleMetric label="جلسه فعال" value={activeScheduleEntries.length} tone="blue" />
          <ScheduleMetric
            label="امروز"
            value={(entriesByWeekday.get(today) ?? []).length}
            tone="teal"
          />
          <ScheduleMetric
            label="روزهای دارای کلاس"
            value={Array.from(entriesByWeekday.values()).filter((rows) => rows.length).length}
            tone="violet"
          />
        </div>
      </section>

      <Card className="overflow-hidden p-0 shadow-[0_16px_28px_-26px_rgba(18,52,86,.45)]">
        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border-subtle))] px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock size={19} className="shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-black text-ink">جدول کلاس‌ها</h2>
              <p className="text-[11px] text-slate-500">
                برای مشاهده جزئیات، یک روز را انتخاب کنید.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onWeekdayChange(today)}
            className="shrink-0 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-black text-brand transition hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            امروز · {weekdays[today]}
          </button>
        </div>

        <div className="border-b border-[rgb(var(--border-subtle))] px-3 py-2 md:hidden">
          <MobileTabs
            ariaLabel="انتخاب روز برنامه"
            value={activeWeekday}
            onValueChange={onWeekdayChange}
            options={displayWeekdays.map((weekday) => ({
              value: weekday,
              label: weekdays[weekday],
              className: "min-h-11 shrink-0 rounded-xl px-3 text-xs",
            }))}
            className="justify-start gap-1.5 border-0 bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
        </div>

        {isMobileShell ? (
          <div className="grid gap-2 p-3">
            {activeEntries.map((entry) => (
              <ScheduleEntryCard
                key={entry.id}
                entry={entry}
                showOrganization={showOrganization}
                compact={false}
                canWrite={canWrite}
                canDelete={canDelete}
                onEdit={onEdit}
                onArchive={onArchive}
                onDelete={onDelete}
                onOpenPlan={onOpenDetails}
              />
            ))}
            {!activeEntries.length ? (
              <EmptyState title={`برای ${weekdays[activeWeekday]} کلاسی ثبت نشده است.`} />
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto p-3">
            {classLanes.length ? (
              <table
                className="w-full min-w-[72rem] table-fixed overflow-hidden rounded-xl border border-slate-300 bg-white text-right text-[11px] dark:border-white/15 dark:bg-slate-950"
                aria-label="دفتر برنامه هفتگی کلاس‌ها"
              >
                <thead>
                  <tr className="bg-[#f2b600] text-slate-950 dark:bg-amber-500">
                    <th
                      scope="col"
                      className="sticky right-0 z-20 w-36 border-s border-amber-700/35 bg-[#f2b600] px-3 py-2.5 text-center text-xs font-black dark:bg-amber-500"
                    >
                      کلاس / گروه
                    </th>
                    {displayWeekdays.map((weekday) => (
                      <th
                        key={weekday}
                        scope="col"
                        className={`border-s border-amber-700/30 px-2 py-2 text-center ${weekday === today ? "bg-[#e3a900] dark:bg-amber-400" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => onWeekdayChange(weekday)}
                          className="w-full rounded-md px-2 py-1 text-xs font-black transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          {weekdays[weekday]}
                          {weekday === today ? (
                            <span className="mt-0.5 block text-[10px]">امروز</span>
                          ) : null}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classLanes.map((lane, rowIndex) => (
                    <tr
                      key={lane.label}
                      className={rowIndex % 2 ? "bg-slate-50/70 dark:bg-white/[.025]" : ""}
                    >
                      <th
                        scope="row"
                        className="sticky right-0 z-10 border-s border-t border-slate-200 bg-inherit px-3 py-3 text-right text-xs font-black text-slate-700 dark:border-white/10 dark:text-slate-100"
                      >
                        <span className="block leading-5">{lane.label}</span>
                        <span className="mt-1 block text-[10px] font-bold text-slate-400">
                          {lane.entries.length.toLocaleString("fa-IR")} جلسه
                        </span>
                      </th>
                      {displayWeekdays.map((weekday) => {
                        const cellEntries = lane.entries.filter(
                          (entry) => entry.weekday === weekday,
                        );
                        return (
                          <td
                            key={weekday}
                            className={`align-top border-s border-t border-slate-200 p-1.5 dark:border-white/10 ${weekday === today ? "bg-brand/[.045]" : ""}`}
                          >
                            {cellEntries.length ? (
                              <div className="grid min-h-14 gap-1">
                                {cellEntries.map((entry) => (
                                  <ScheduleMatrixCell
                                    key={entry.id}
                                    entry={entry}
                                    canWrite={canWrite}
                                    canDelete={canDelete}
                                    showOrganization={showOrganization}
                                    onEdit={onEdit}
                                    onArchive={onArchive}
                                    onDelete={onDelete}
                                    onOpenPlan={onOpenDetails}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="block min-h-14" aria-label="کلاسی ثبت نشده است" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="برنامه فعالی برای نمایش ندارید." />
            )}
          </div>
        )}
      </Card>

      {canWrite && archivedEntries.length ? (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Archive size={17} className="text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-black text-ink">برنامه‌های بایگانی‌شده</h2>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {archivedEntries.map((entry) => (
              <ScheduleEntryCard
                key={entry.id}
                entry={entry}
                showOrganization={showOrganization}
                compact={false}
                canWrite={canWrite}
                canDelete={canDelete}
                onEdit={onEdit}
                onArchive={onArchive}
                onDelete={onDelete}
                onOpenPlan={onOpenDetails}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}

function ScheduleMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "teal" | "violet";
}) {
  const colors = {
    blue: "bg-sky-100/70 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100",
    teal: "bg-teal-100/70 text-teal-800 dark:bg-teal-900/40 dark:text-teal-100",
    violet: "bg-violet-100/70 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100",
  };
  return (
    <div className={`rounded-xl px-3 py-2 ${colors[tone]}`}>
      <b className="block text-lg font-black tabular-nums">{value.toLocaleString("fa-IR")}</b>
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}

function ScheduleMatrixCell({
  entry,
  canWrite,
  canDelete,
  showOrganization,
  onEdit,
  onArchive,
  onDelete,
  onOpenPlan,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenPlan: (entry: ScheduleEntry) => void;
}) {
  return (
    <article
      className={`rounded-md border px-1.5 py-1 shadow-[0_5px_9px_-9px_rgba(20,81,138,.7)] dark:border-white/10 ${
        isSchoolWidePlan(entry)
          ? "border-amber-300 bg-[#fff7cc] dark:border-amber-400/30 dark:bg-amber-500/15"
          : "border-slate-200 bg-white/90 dark:bg-white/[.04]"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenPlan(entry)}
        className="block w-full rounded-md text-right transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transform-none"
        aria-label={`مشاهده جزئیات برنامه ${entry.title}`}
      >
        <p className="truncate text-[11px] font-black text-ink" title={entry.title}>
          {entry.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-bold tabular-nums text-brand" dir="ltr">
          {entry.startTime}–{entry.endTime}
        </p>
        {showOrganization ? (
          <span className="mt-1 block scale-90 origin-right">
            <OrganizationTag organization={entry.organization} compact />
          </span>
        ) : null}
      </button>
      {canWrite ? (
        <div className="mt-1 flex gap-0.5">
          <button
            type="button"
            aria-label={`ویرایش ${entry.title}`}
            onClick={() => onEdit(entry)}
            className="rounded p-1 text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            aria-label={`${entry.status === "ARCHIVED" ? "بازیابی" : "بایگانی"} ${entry.title}`}
            onClick={() => onArchive(entry)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand dark:hover:bg-white/10"
          >
            <Archive size={12} />
          </button>
          {canDelete ? (
            <button
              type="button"
              aria-label={`حذف ${entry.title}`}
              onClick={() => onDelete(entry)}
              className="rounded p-1 text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 dark:hover:bg-rose-950/30"
            >
              <Trash2 size={12} />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ScheduleEntryCard({
  entry,
  showOrganization,
  compact,
  canWrite,
  canDelete,
  onEdit,
  onArchive,
  onDelete,
  onOpenPlan,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  compact: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenPlan: (entry: ScheduleEntry) => void;
}) {
  return (
    <article
      className={`rounded-xl border border-sky-100 bg-[linear-gradient(145deg,#ffffff,#f3f9ff)] p-2.5 shadow-[0_8px_14px_-14px_rgba(20,81,138,.6)] dark:border-white/10 dark:bg-white/[.03] ${compact ? "" : "p-3"}`}
    >
      <button
        type="button"
        onClick={() => onOpenPlan(entry)}
        aria-label={`مشاهده جزئیات برنامه ${entry.title}`}
        className="flex w-full gap-2 rounded-lg text-right transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transform-none"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
          <Clock3 size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-black text-ink">{entry.title}</h3>
          <p className="mt-1 text-[11px] font-bold text-brand" dir="ltr">
            {entry.startTime} — {entry.endTime}
          </p>
          {!compact ? (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin size={13} aria-hidden="true" />
              {entry.classroom?.name || entry.organization.name}
              {entry.room ? ` · ${entry.room}` : ""}
            </p>
          ) : null}
          {showOrganization ? (
            <div className="mt-2">
              <OrganizationTag organization={entry.organization} compact />
            </div>
          ) : null}
        </div>
      </button>
      {canWrite ? (
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            variant="soft"
            aria-label={`ویرایش ${entry.title}`}
            onClick={() => onEdit(entry)}
          >
            <Pencil size={13} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`${entry.status === "ARCHIVED" ? "بازیابی" : "بایگانی"} ${entry.title}`}
            onClick={() => onArchive(entry)}
          >
            <Archive size={13} />
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`حذف ${entry.title}`}
              onClick={() => onDelete(entry)}
            >
              <Trash2 size={13} />
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function SchedulePlanModal({
  entry,
  showOrganization,
  canWrite,
  canDelete,
  onEdit,
  onArchive,
  onDelete,
  onClose,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="grid gap-4" dir="rtl">
      <section className="relative overflow-hidden rounded-2xl border border-brand/15 bg-[linear-gradient(135deg,rgba(13,148,136,.15),rgba(239,250,250,.8)_50%,rgba(236,246,255,.8))] p-4 dark:bg-[linear-gradient(135deg,rgba(13,148,136,.22),rgba(10,37,49,.92))]">
        <span
          className="absolute -end-6 -top-8 size-28 rounded-full bg-brand/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_20px_-13px_rgba(13,118,111,.95)]">
            <BookOpenCheck size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-ink">{entry.title}</h3>
            <p className="mt-1 text-sm font-black tabular-nums text-brand" dir="ltr">
              {entry.startTime} — {entry.endTime}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              {weekdays[entry.weekday]}
            </p>
          </div>
        </div>
      </section>

      <dl className="grid gap-2">
        <PlanDetail
          icon={GraduationCap}
          label="کلاس"
          value={entry.classroom?.name || "کلاس ثبت نشده"}
        />
        <PlanDetail icon={MapPin} label="فضا / اتاق" value={entry.room || "فضای آموزشی ثبت نشده"} />
        <PlanDetail
          icon={UserRound}
          label="استاد"
          value={teacherName(entry) || "استاد این جلسه ثبت نشده است"}
        />
      </dl>

      {showOrganization ? (
        <section className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3">
          <p className="mb-2 text-xs font-bold text-slate-500">سازمان مالک برنامه</p>
          <OrganizationTag organization={entry.organization} />
        </section>
      ) : null}

      {canWrite ? (
        <div className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-4 sm:grid-cols-2">
          <Button variant="soft" onClick={onEdit}>
            <Pencil size={16} /> ویرایش برنامه
          </Button>
          <Button variant="ghost" onClick={onArchive}>
            <Archive size={16} />
            {entry.status === "ARCHIVED" ? "بازیابی برنامه" : "بایگانی برنامه"}
          </Button>
          {canDelete ? (
            <Button className="sm:col-span-2" variant="ghost" onClick={onDelete}>
              <Trash2 size={16} className="text-rose-600" /> حذف برنامه
            </Button>
          ) : null}
        </div>
      ) : null}
      <Button variant="ghost" onClick={onClose}>
        بستن
      </Button>
    </div>
  );
}

function ScheduleEditorForm({
  initial,
  organizations,
  classes,
  isSaving,
  onCancel,
  onSubmit,
}: {
  initial: ScheduleDraft;
  organizations: Array<{ id: string; name: string }>;
  classes: Array<{
    id: string;
    name: string;
    organization: { id: string };
    books: Array<{ id: string; title: string; teacher: { id: string; name: string } }>;
  }>;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: ScheduleDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const invalidTime = draft.startTime >= draft.endTime;
  const canSubmit = Boolean(
    draft.organizationId &&
    draft.title.trim() &&
    !invalidTime &&
    (!draft.classroomId || draft.classBookId),
  );
  const selectedClass = classes.find((item) => item.id === draft.classroomId);
  const update = (changes: Partial<ScheduleDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  return (
    <form
      className="grid gap-5"
      dir="rtl"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (canSubmit) void onSubmit({ ...draft, title: draft.title.trim() });
      }}
    >
      <fieldset className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/60 p-3">
        <legend className="px-1 text-sm font-black text-ink">۱. محل برگزاری</legend>
        <label className="grid gap-1.5 text-sm font-bold">
          مدرسه
          <select
            value={draft.organizationId}
            onChange={(event) =>
              update({
                organizationId: event.target.value,
                classroomId: undefined,
                classBookId: undefined,
                teacherId: undefined,
              })
            }
            className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">مدرسه را انتخاب کنید</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        {attempted && !draft.organizationId ? (
          <p className="text-xs font-bold text-rose-600">انتخاب مدرسه ضروری است.</p>
        ) : null}
        <label className="grid gap-1.5 text-sm font-bold">
          کلاس <span className="font-normal text-slate-500">(اختیاری)</span>
          <select
            value={draft.classroomId || ""}
            onChange={(event) =>
              update({
                classroomId: event.target.value || undefined,
                classBookId: undefined,
                teacherId: undefined,
              })
            }
            className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">کلاس عمومی / بدون کلاس</option>
            {classes
              .filter(
                (item) => !draft.organizationId || item.organization.id === draft.organizationId,
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        {selectedClass ? (
          <label className="grid gap-1.5 text-sm font-bold">
            کتاب و استاد مسئول
            <select
              value={draft.classBookId || ""}
              onChange={(event) => {
                const book = selectedClass.books.find((item) => item.id === event.target.value);
                update({ classBookId: book?.id, teacherId: book?.teacher.id });
              }}
              className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">کتاب و استاد را انتخاب کنید</option>
              {selectedClass.books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.teacher.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </fieldset>
      <fieldset className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/60 p-3">
        <legend className="px-1 text-sm font-black text-ink">۲. زمان و محتوا</legend>
        <label className="grid gap-1.5 text-sm font-bold">
          عنوان درس یا برنامه
          <Input
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="مثلاً ریاضی پایه هفتم"
            aria-invalid={attempted && !draft.title.trim()}
          />
        </label>
        {attempted && !draft.title.trim() ? (
          <p className="text-xs font-bold text-rose-600">عنوان جلسه را وارد کنید.</p>
        ) : null}
        <label className="grid gap-1.5 text-sm font-bold">
          روز هفته
          <select
            value={draft.weekday}
            onChange={(event) => update({ weekday: Number(event.target.value) })}
            className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {weekdays.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-bold">
            شروع{" "}
            <Input
              type="time"
              value={draft.startTime}
              onChange={(event) => update({ startTime: event.target.value })}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            پایان{" "}
            <Input
              type="time"
              value={draft.endTime}
              onChange={(event) => update({ endTime: event.target.value })}
            />
          </label>
        </div>
        {attempted && invalidTime ? (
          <p className="text-xs font-bold text-rose-600">زمان پایان باید پس از زمان شروع باشد.</p>
        ) : null}
        <label className="grid gap-1.5 text-sm font-bold">
          فضا / اتاق <span className="font-normal text-slate-500">(اختیاری)</span>
          <Input
            value={draft.room || ""}
            onChange={(event) => update({ room: event.target.value })}
            placeholder="مثلاً اتاق ۲۰۴"
          />
        </label>
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "در حال ذخیره…" : "ذخیره جلسه"}
        </Button>
      </div>
    </form>
  );
}

function draftFromEntry(entry: ScheduleEntry): ScheduleDraft {
  return {
    organizationId: entry.organization.id,
    classroomId: entry.classroom?.id || undefined,
    classBookId: entry.classBook?.id || undefined,
    teacherId: entry.teacher?.id || undefined,
    title: entry.title,
    weekday: entry.weekday,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
  };
}

function PlanDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/70 px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm dark:bg-white/10">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold text-slate-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-black text-ink" title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function StudentWeeklySchedule({ entries }: { entries: ScheduleEntry[] }) {
  const today = new Date(`${todayIso()}T12:00:00`).getDay();
  const [activeWeekday, setActiveWeekday] = useState(today);
  const isMobileShell = useViewportShell() === "mobile";
  const activeEntries = entries
    .filter((entry) => entry.status === "ACTIVE" && entry.weekday === activeWeekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section
      className="mx-auto grid w-full max-w-5xl gap-3 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4"
      dir="rtl"
      aria-label="برنامه هفتگی من"
    >
      <div
        className="flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="انتخاب روز برنامه"
      >
        {displayWeekdays.map((weekday) => (
          <button
            key={weekday}
            type="button"
            aria-pressed={weekday === activeWeekday}
            onClick={() => setActiveWeekday(weekday)}
            className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${weekday === activeWeekday ? "bg-brand text-white shadow-[0_7px_12px_-8px_rgba(13,118,111,.85)]" : "bg-[rgb(var(--surface-muted))] text-slate-600 dark:text-slate-300"}`}
          >
            {weekdays[weekday]}
          </button>
        ))}
      </div>
      {isMobileShell ? (
        <div className="grid gap-2">
          {activeEntries.map((entry) => (
            <StudentScheduleCard key={entry.id} entry={entry} />
          ))}
          {!activeEntries.length ? (
            <EmptyState title={`برای ${weekdays[activeWeekday]} کلاسی ثبت نشده است.`} />
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-3">
          {weekdays.map((day, weekday) => {
            const dailyEntries = entries
              .filter((entry) => entry.status === "ACTIVE" && entry.weekday === weekday)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <Card key={day} className="min-w-0 p-3">
                <h2 className="text-sm font-black text-ink">{day}</h2>
                <div className="mt-3 grid gap-2">
                  {dailyEntries.map((entry) => (
                    <StudentScheduleCard key={entry.id} entry={entry} />
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
      )}
    </section>
  );
}

function StudentScheduleCard({ entry }: { entry: ScheduleEntry }) {
  return (
    <article className="rounded-xl border border-sky-100 bg-[linear-gradient(145deg,#fff,#f3f9ff)] p-3 shadow-[0_9px_16px_-14px_rgba(20,81,138,.55)] dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex items-start gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <CalendarClock size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-ink">{entry.title}</h3>
          <p className="mt-1 text-xs font-bold text-brand" dir="ltr">
            {entry.startTime} — {entry.endTime}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {entry.classroom?.name || entry.room || entry.organization.name}
          </p>
          {entry.classBook?.book?.titleFa ? (
            <p className="mt-1 truncate text-xs font-bold text-brand">
              {entry.classBook.book.titleFa}
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <GraduationCap size={14} aria-hidden="true" />
            {teacherName(entry) || "استاد این کلاس هنوز ثبت نشده است."}
          </p>
        </div>
      </div>
    </article>
  );
}

function teacherName(entry: ScheduleEntry) {
  if (!entry.teacher) return "";
  return (
    [entry.teacher.firstName, entry.teacher.lastName].filter(Boolean).join(" ") ||
    entry.teacher.username
  );
}

function isSchoolWidePlan(entry: ScheduleEntry) {
  return !entry.classroom && !entry.room;
}
