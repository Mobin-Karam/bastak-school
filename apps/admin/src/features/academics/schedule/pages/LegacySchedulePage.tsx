import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarClock,
  BookOpenCheck,
  Clock3,
  Copy,
  Eye,
  GraduationCap,
  MapPin,
  Pencil,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
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
  archiveScheduleTemplate,
  applyScheduleTemplate,
  commitScheduleImport,
  createScheduleEntry,
  createScheduleTemplate,
  createScheduleTimeBlock,
  deleteScheduleEntry,
  deleteScheduleTemplate,
  deleteScheduleTimeBlock,
  exportSchedule,
  listSchedule,
  listScheduleTemplates,
  listScheduleTimeBlocks,
  previewScheduleImport,
  restoreScheduleTemplate,
  type ScheduleDraft,
  updateScheduleEntry,
} from "../api/schedule.api";
import type { ScheduleEntry, ScheduleTemplate, ScheduleTimeBlock } from "../api/schedule.api";
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
  const [activeWeekday, setActiveWeekday] = useState(() => legacyWeekdayForIso(todayIso()));
  const [templatePreview, setTemplatePreview] = useState<ScheduleTemplate | null>(null);
  const [toolsSidebarHidden, setToolsSidebarHidden] = useState(false);
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
  const canCreate = auth.can("schedule.create");
  const canEdit = auth.can("schedule.update");
  const canArchive = auth.can("schedule.archive");
  const canDelete = auth.can("schedule.delete");
  const canWrite = canCreate || canEdit;
  const canManageTemplates = canCreate && canEdit && canArchive && canDelete;
  const timeBlocks = useQuery({
    queryKey: ["schedule", "time-blocks", selectedOrganizationId ?? "all"],
    queryFn: listScheduleTimeBlocks,
    enabled: canWrite,
  });
  const templates = useQuery({
    queryKey: ["schedule", "templates", selectedOrganizationId ?? "all"],
    queryFn: listScheduleTemplates,
    enabled: canManageTemplates,
  });
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
    onSuccess: () => {
      reload();
      notify("وضعیت جلسه به‌روزرسانی شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "بایگانی جلسه انجام نشد.", "error"),
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
  const move = useMutation({
    mutationFn: ({ entry, weekday }: { entry: ScheduleEntry; weekday: number }) =>
      updateScheduleEntry(entry.id, { ...draftFromEntry(entry), weekday }),
    onSuccess: () => {
      reload();
      notify("جلسه به روز جدید منتقل شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "جابجایی جلسه انجام نشد.", "error"),
  });
  const saveTimeBlock = useMutation({
    mutationFn: createScheduleTimeBlock,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["schedule", "time-blocks"] });
      notify("بازه زمانی ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره بازه زمانی انجام نشد.", "error"),
  });
  const removeTimeBlock = useMutation({
    mutationFn: deleteScheduleTimeBlock,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["schedule", "time-blocks"] });
      notify("بازه زمانی حذف شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "حذف بازه زمانی انجام نشد.", "error"),
  });
  const templateReload = () => void client.invalidateQueries({ queryKey: ["schedule"] });
  const createTemplate = useMutation({
    mutationFn: createScheduleTemplate,
    onSuccess: () => {
      templateReload();
      notify("الگوی برنامه ذخیره شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "ذخیره الگو انجام نشد.", "error"),
  });
  const applyTemplate = useMutation({
    mutationFn: applyScheduleTemplate,
    onSuccess: (result) => {
      setTemplatePreview(null);
      templateReload();
      notify(`${result.applied} جلسه از الگو اجرا شد.`, "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "اجرای الگو انجام نشد.", "error"),
  });
  const archiveTemplate = useMutation({
    mutationFn: archiveScheduleTemplate,
    onSuccess: () => {
      templateReload();
      notify("الگو بایگانی شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "بایگانی الگو انجام نشد.", "error"),
  });
  const restoreTemplate = useMutation({
    mutationFn: restoreScheduleTemplate,
    onSuccess: () => {
      templateReload();
      notify("الگو از بایگانی خارج شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "بازیابی الگو انجام نشد.", "error"),
  });
  const removeTemplate = useMutation({
    mutationFn: deleteScheduleTemplate,
    onSuccess: () => {
      templateReload();
      notify("الگو حذف شد.", "success");
    },
    onError: (e) => notify(e instanceof Error ? e.message : "حذف الگو انجام نشد.", "error"),
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
    (canWrite && (classes.isLoading || timeBlocks.isLoading)) ||
    (canManageTemplates && templates.isLoading)
  )
    return <LoadingState label="در حال دریافت برنامه…" />;
  if (
    entries.isError ||
    (canReadOrganizations && organizations.isError) ||
    (canWrite && (classes.isError || timeBlocks.isError)) ||
    (canManageTemplates && templates.isError)
  )
    return <EmptyState title="دریافت برنامه انجام نشد." />;
  if (isTeacher) return <TeacherSchedulePage entries={entries.data ?? []} />;
  const editEntry = (entry?: ScheduleEntry, copy = false) => {
    modal.open({
      title: entry ? (copy ? "کپی جلسه در برنامه" : "ویرایش جلسه") : "افزودن جلسه به برنامه",
      description:
        entry && !copy
          ? "جزئیات جلسه را اصلاح کنید؛ تغییرات فقط پس از ذخیره اعمال می‌شود."
          : "روز و زمان مقصد را انتخاب کنید؛ جلسه اصلی بدون تغییر باقی می‌ماند.",
      size: "lg",
      content: (
        <ScheduleEditorForm
          initial={entry ? draftFromEntry(entry) : blank()}
          timeBlocks={timeBlocks.data ?? []}
          organizations={organizationOptions}
          classes={classes.data ?? []}
          isSaving={save.isPending}
          onCancel={modal.close}
          onSubmit={async (draft) => {
            await save.mutateAsync({ id: copy ? undefined : entry?.id, draft });
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
  const confirmArchive = (entry: ScheduleEntry) => {
    const archiving = entry.status === "ACTIVE";
    void modal
      .confirm({
        title: archiving ? "بایگانی جلسه؟" : "بازیابی جلسه؟",
        description: archiving
          ? `«${entry.title}» از برنامه فعال خارج می‌شود و در بخش بایگانی می‌ماند.`
          : `«${entry.title}» دوباره در برنامه فعال نمایش داده می‌شود.`,
        tone: archiving ? "danger" : "default",
        confirmLabel: archiving ? "بایگانی جلسه" : "بازیابی جلسه",
        cancelLabel: "انصراف",
        softConfirm: archiving,
      })
      .then(
        (confirmed) =>
          confirmed &&
          archive.mutate({
            id: entry.id,
            status: archiving ? "ARCHIVED" : "ACTIVE",
          }),
      );
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
          canEdit={canEdit}
          canCreate={canCreate}
          canArchive={canArchive}
          canDelete={canDelete}
          onClose={modal.close}
          onEdit={() => {
            modal.close();
            editEntry(entry);
          }}
          onCopy={() => {
            modal.close();
            editEntry(entry, true);
          }}
          onArchive={() => {
            modal.close();
            confirmArchive(entry);
          }}
          onDelete={() => {
            modal.close();
            confirmDelete(entry);
          }}
        />
      ),
    });
  };
  const scheduleEntries = entries.data ?? [];
  const scheduleToolbar = auth.canAny(["schedule.import", "schedule.export"]) ? (
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
  ) : null;
  return (
    <section
      className={`relative grid w-full max-w-none gap-4 pb-[calc(6rem+env(safe-area-inset-bottom))] min-[960px]:pb-6 min-[960px]:transition-[grid-template-columns] min-[960px]:duration-300 min-[960px]:ease-out motion-reduce:transition-none ${toolsSidebarHidden ? "min-[960px]:grid-cols-[minmax(0,1fr)_0rem]" : "min-[960px]:grid-cols-[minmax(0,1fr)_22rem]"}`}
      dir="rtl"
    >
      <button
        type="button"
        className="absolute -left-3 top-4 z-20 hidden size-11 place-items-center rounded-r-full border border-slate-200 bg-[rgb(var(--surface-card))] text-slate-500 shadow-[0_8px_20px_rgb(15_23_42_/_14%)] outline-none transition hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none min-[960px]:grid"
        onClick={() => setToolsSidebarHidden((hidden) => !hidden)}
        title={toolsSidebarHidden ? "نمایش ابزارهای برنامه" : "پنهان کردن ابزارهای برنامه"}
        aria-label={toolsSidebarHidden ? "نمایش ابزارهای برنامه" : "پنهان کردن ابزارهای برنامه"}
        aria-pressed={!toolsSidebarHidden}
      >
        {toolsSidebarHidden ? (
          <PanelRightOpen size={18} aria-hidden="true" />
        ) : (
          <PanelRightClose size={18} aria-hidden="true" />
        )}
      </button>
      <div className="order-2 grid gap-3 min-[960px]:order-1">
        {templatePreview ? (
          <ScheduleTemplatePreview
            template={templatePreview}
            activeEntries={scheduleEntries.filter((entry) => entry.status === "ACTIVE")}
            onCancel={() => setTemplatePreview(null)}
            onApply={() =>
              void modal
                .confirm({
                  title: "اجرای الگوی برنامه؟",
                  description: `جلسه‌های فعال فعلی با جلسه‌های «${templatePreview.name}» جایگزین می‌شوند. جلسه‌ای به بایگانی برنامه اضافه نمی‌شود.`,
                  tone: "danger",
                  confirmLabel: "اجرای الگو",
                  cancelLabel: "انصراف",
                  softConfirm: true,
                })
                .then((ok) => ok && applyTemplate.mutate(templatePreview.id))
            }
          />
        ) : null}
        <ScheduleWorkspace
          entries={scheduleEntries}
          activeWeekday={activeWeekday}
          onWeekdayChange={setActiveWeekday}
          canEdit={canEdit}
          canArchive={canArchive}
          showOrganization={auth.hasRole("PLATFORM_ADMIN")}
          canDelete={canDelete}
          onEdit={editEntry}
          onArchive={confirmArchive}
          onDelete={confirmDelete}
          onOpenDetails={openDetails}
          onMove={(entry, weekday) => move.mutate({ entry, weekday })}
        />
      </div>
      <aside
        className={`order-1 grid min-w-0 gap-3 overflow-hidden transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none min-[960px]:order-2 min-[960px]:sticky min-[960px]:top-3 min-[960px]:self-start ${toolsSidebarHidden ? "min-[960px]:pointer-events-none min-[960px]:translate-x-3 min-[960px]:opacity-0" : "min-[960px]:translate-x-0 min-[960px]:opacity-100"}`}
      >
        <ScheduleSidebarSummary entries={scheduleEntries} toolbar={scheduleToolbar} />
        {canCreate ? (
          <Card className="border-brand/15 bg-[rgb(var(--surface-card))] p-4">
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
        {canEdit ? (
          <ScheduleTimeBlocks
            blocks={timeBlocks.data ?? []}
            organizationId={selectedOrganizationId}
            saving={saveTimeBlock.isPending}
            removing={removeTimeBlock.isPending}
            onCreate={(draft) => saveTimeBlock.mutate(draft)}
            onRemove={(block) =>
              void modal
                .confirm({
                  title: "حذف بازه زمانی؟",
                  description: `«${block.name}» از فهرست بازه‌های قابل‌استفاده حذف می‌شود؛ جلسه‌های قبلی تغییری نمی‌کنند.`,
                  tone: "danger",
                  confirmLabel: "حذف بازه",
                  cancelLabel: "انصراف",
                  softConfirm: true,
                })
                .then((confirmed) => confirmed && removeTimeBlock.mutate(block.id))
            }
          />
        ) : null}
        {canManageTemplates ? (
          <ScheduleTemplates
            templates={templates.data ?? []}
            organizationId={selectedOrganizationId}
            onCreate={(name) =>
              selectedOrganizationId &&
              createTemplate.mutate({ organizationId: selectedOrganizationId, name })
            }
            onCopy={(template) =>
              selectedOrganizationId &&
              createTemplate.mutate({
                organizationId: selectedOrganizationId,
                name: `${template.name} (کپی)`,
                sourceTemplateId: template.id,
              })
            }
            onPreview={setTemplatePreview}
            onArchive={(template) =>
              void modal
                .confirm({
                  title: "بایگانی الگو؟",
                  description: `«${template.name}» دیگر قابل اجرا نخواهد بود.`,
                  tone: "danger",
                  confirmLabel: "بایگانی الگو",
                  cancelLabel: "انصراف",
                  softConfirm: true,
                })
                .then((ok) => ok && archiveTemplate.mutate(template.id))
            }
            onRestore={(template) =>
              void modal
                .confirm({
                  title: "بازیابی الگوی برنامه؟",
                  description: `«${template.name}» دوباره در فهرست الگوهای قابل اجرا قرار می‌گیرد.`,
                  confirmLabel: "بازیابی الگو",
                  cancelLabel: "انصراف",
                })
                .then((ok) => ok && restoreTemplate.mutate(template.id))
            }
            onRemove={(template) =>
              void modal
                .confirm({
                  title: "حذف الگوی برنامه؟",
                  description: `«${template.name}» برای همیشه حذف می‌شود؛ جلسه‌های ساخته‌شده از آن تغییری نمی‌کنند.`,
                  tone: "danger",
                  confirmLabel: "حذف الگو",
                  cancelLabel: "انصراف",
                  softConfirm: true,
                })
                .then((ok) => ok && removeTemplate.mutate(template.id))
            }
          />
        ) : null}
      </aside>
    </section>
  );
}

const displayWeekdays = [0, 1, 2, 3, 4, 5, 6] as const;

type ScheduleWorkspaceProps = {
  entries: ScheduleEntry[];
  activeWeekday: number;
  onWeekdayChange: (weekday: number) => void;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  showOrganization: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenDetails: (entry: ScheduleEntry) => void;
  onMove: (entry: ScheduleEntry, weekday: number) => void;
};

function ScheduleSidebarSummary({
  entries,
  toolbar,
}: {
  entries: ScheduleEntry[];
  toolbar?: ReactNode;
}) {
  const activeEntries = entries.filter((entry) => entry.status === "ACTIVE");
  const today = legacyWeekdayForIso(todayIso());
  const daysWithSessions = new Set(activeEntries.map((entry) => entry.weekday)).size;
  return (
    <Card className="grid gap-3 p-4">
      {toolbar ? <div className="flex min-w-0 flex-wrap justify-end gap-2">{toolbar}</div> : null}
      <div className="grid grid-cols-3 gap-2" aria-label="خلاصه برنامه هفتگی">
        <ScheduleMetric label="جلسه فعال" value={activeEntries.length} tone="blue" />
        <ScheduleMetric
          label="امروز"
          value={activeEntries.filter((entry) => entry.weekday === today).length}
          tone="teal"
        />
        <ScheduleMetric label="روزهای دارای کلاس" value={daysWithSessions} tone="violet" />
      </div>
    </Card>
  );
}

function ScheduleWorkspace({
  entries,
  activeWeekday,
  onWeekdayChange,
  canEdit,
  canArchive,
  canDelete,
  showOrganization,
  onEdit,
  onArchive,
  onDelete,
  onOpenDetails,
  onMove,
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
  const today = legacyWeekdayForIso(todayIso());
  const activeEntries = entriesByWeekday.get(activeWeekday) ?? [];
  const [draggedEntry, setDraggedEntry] = useState<ScheduleEntry | null>(null);
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
                canEdit={canEdit}
                canArchive={canArchive}
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
                            onDragOver={(event) => {
                              if (canEdit) event.preventDefault();
                            }}
                            onDrop={() => {
                              if (draggedEntry && draggedEntry.weekday !== weekday)
                                onMove(draggedEntry, weekday);
                              setDraggedEntry(null);
                            }}
                            className={`align-top border-s border-t border-slate-200 p-1.5 dark:border-white/10 ${weekday === today ? "bg-brand/[.045]" : ""}`}
                          >
                            {cellEntries.length ? (
                              <div className="grid min-h-14 gap-1">
                                {cellEntries.map((entry) => (
                                  <ScheduleMatrixCell
                                    key={entry.id}
                                    entry={entry}
                                    canEdit={canEdit}
                                    canArchive={canArchive}
                                    canDelete={canDelete}
                                    showOrganization={showOrganization}
                                    onEdit={onEdit}
                                    onArchive={onArchive}
                                    onDelete={onDelete}
                                    onOpenPlan={onOpenDetails}
                                    onDragStart={() => setDraggedEntry(entry)}
                                    onDragEnd={() => setDraggedEntry(null)}
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

      {(canEdit || canArchive || canDelete) && archivedEntries.length ? (
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
                canEdit={canEdit}
                canArchive={canArchive}
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
  canEdit,
  canArchive,
  canDelete,
  showOrganization,
  onEdit,
  onArchive,
  onDelete,
  onOpenPlan,
  onDragStart,
  onDragEnd,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenPlan: (entry: ScheduleEntry) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={
        canEdit
          ? "برای انتقال به روز دیگر بکشید؛ برای تغییر ساعت، ویرایش را انتخاب کنید."
          : undefined
      }
      className={`rounded-md border px-1.5 py-1 shadow-[0_5px_9px_-9px_rgba(20,81,138,.7)] dark:border-white/10 ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${
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
      {canEdit || canArchive || canDelete ? (
        <div className="mt-1 flex gap-0.5">
          {canEdit ? (
            <button
              type="button"
              aria-label={`ویرایش ${entry.title}`}
              onClick={() => onEdit(entry)}
              className="rounded p-1 text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <Pencil size={12} />
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              aria-label={`${entry.status === "ARCHIVED" ? "بازیابی" : "بایگانی"} ${entry.title}`}
              onClick={() => onArchive(entry)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand dark:hover:bg-white/10"
            >
              <Archive size={12} />
            </button>
          ) : null}
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
  canEdit,
  canArchive,
  canDelete,
  onEdit,
  onArchive,
  onDelete,
  onOpenPlan,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  compact: boolean;
  canEdit: boolean;
  canArchive: boolean;
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
      {canEdit || canArchive || canDelete ? (
        <div className="mt-2 flex gap-1">
          {canEdit ? (
            <Button
              size="sm"
              variant="soft"
              aria-label={`ویرایش ${entry.title}`}
              onClick={() => onEdit(entry)}
            >
              <Pencil size={13} />
            </Button>
          ) : null}
          {canArchive ? (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`${entry.status === "ARCHIVED" ? "بازیابی" : "بایگانی"} ${entry.title}`}
              onClick={() => onArchive(entry)}
            >
              <Archive size={13} />
            </Button>
          ) : null}
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
  canEdit,
  canCreate,
  canArchive,
  canDelete,
  onEdit,
  onCopy,
  onArchive,
  onDelete,
  onClose,
}: {
  entry: ScheduleEntry;
  showOrganization: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canArchive: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onCopy: () => void;
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

      {canCreate || canEdit || canArchive || canDelete ? (
        <div className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-4 sm:grid-cols-2">
          {canCreate ? (
            <Button variant="soft" onClick={onCopy}>
              <Copy size={16} /> کپی در روز یا ساعت دیگر
            </Button>
          ) : null}
          {canEdit ? (
            <Button variant="soft" onClick={onEdit}>
              <Pencil size={16} /> ویرایش برنامه
            </Button>
          ) : null}
          {canArchive ? (
            <Button variant="ghost" onClick={onArchive}>
              <Archive size={16} />
              {entry.status === "ARCHIVED" ? "بازیابی برنامه" : "بایگانی برنامه"}
            </Button>
          ) : null}
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
  timeBlocks,
  organizations,
  classes,
  isSaving,
  onCancel,
  onSubmit,
}: {
  initial: ScheduleDraft;
  timeBlocks: ScheduleTimeBlock[];
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
          <AdaptiveSelect
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
          </AdaptiveSelect>
        </label>
        {attempted && !draft.organizationId ? (
          <p className="text-xs font-bold text-rose-600">انتخاب مدرسه ضروری است.</p>
        ) : null}
        <label className="grid gap-1.5 text-sm font-bold">
          کلاس <span className="font-normal text-slate-500">(اختیاری)</span>
          <AdaptiveSelect
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
          </AdaptiveSelect>
        </label>
        {selectedClass ? (
          <label className="grid gap-1.5 text-sm font-bold">
            کتاب و استاد مسئول
            <AdaptiveSelect
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
            </AdaptiveSelect>
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
          <AdaptiveSelect
            value={draft.weekday}
            onChange={(event) => update({ weekday: Number(event.target.value) })}
            className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {weekdays.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </AdaptiveSelect>
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
        {timeBlocks.length ? (
          <label className="grid gap-1.5 text-sm font-bold">
            بازه زمانی آماده
            <AdaptiveSelect
              defaultValue=""
              onChange={(event) => {
                const block = timeBlocks.find((item) => item.id === event.target.value);
                if (block) update({ startTime: block.startTime, endTime: block.endTime });
              }}
              className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">یک بازه را برای اعمال زمان انتخاب کنید</option>
              {timeBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} · {block.startTime} تا {block.endTime}
                  {timeBlockPartOfDay(block.startTime)}
                </option>
              ))}
            </AdaptiveSelect>
          </label>
        ) : null}
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

function ScheduleTemplatePreview({
  template,
  activeEntries,
  onCancel,
  onApply,
}: {
  template: ScheduleTemplate;
  activeEntries: ScheduleEntry[];
  onCancel: () => void;
  onApply: () => void;
}) {
  const orderedTemplateEntries = [...template.entries].sort(
    (left, right) => left.weekday - right.weekday || left.startTime.localeCompare(right.startTime),
  );
  const orderedActiveEntries = [...activeEntries].sort(
    (left, right) => left.weekday - right.weekday || left.startTime.localeCompare(right.startTime),
  );
  return (
    <Card className="border-brand/25 bg-brand/5 p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-brand">پیش‌نمایش تغییر برنامه</p>
          <h2 className="mt-1 text-base font-black text-ink">اجرای «{template.name}»</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            جلسه‌های فعال فعلی جایگزین می‌شوند و به بایگانی برنامه منتقل نخواهند شد.
          </p>
        </div>
        <span className="rounded-full bg-[rgb(var(--surface-card))] px-3 py-1 text-xs font-bold text-brand">
          {template.entries.length.toLocaleString("fa-IR")} جلسه جدید
        </span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ScheduleTemplatePreviewColumn
          title={`جلسه‌های فعلی (${activeEntries.length.toLocaleString("fa-IR")})`}
          entries={orderedActiveEntries.map((entry) => ({
            key: entry.id,
            label: entry.title,
            meta: `${weekdays[entry.weekday]} · ${entry.startTime} تا ${entry.endTime}${entry.room ? ` · ${entry.room}` : ""}`,
          }))}
          empty="جلسه فعالی وجود ندارد."
        />
        <ScheduleTemplatePreviewColumn
          title={`جلسه‌های الگو (${template.entries.length.toLocaleString("fa-IR")})`}
          entries={orderedTemplateEntries.map((entry, index) => ({
            key: `${entry.weekday}-${entry.startTime}-${entry.title}-${index}`,
            label: entry.title,
            meta: `${weekdays[entry.weekday]} · ${entry.startTime} تا ${entry.endTime}${entry.room ? ` · ${entry.room}` : ""}`,
          }))}
          empty="این الگو جلسه‌ای ندارد."
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
        <Button onClick={onApply}>تأیید و اجرای الگو</Button>
      </div>
    </Card>
  );
}

function ScheduleTemplatePreviewColumn({
  title,
  entries,
  empty,
}: {
  title: string;
  entries: Array<{ key: string; label: string; meta: string }>;
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3">
      <h3 className="text-xs font-black text-ink">{title}</h3>
      {entries.length ? (
        <ul className="mt-2 grid max-h-44 gap-1 overflow-y-auto pe-1">
          {entries.map((entry) => (
            <li key={entry.key} className="rounded-lg bg-[rgb(var(--surface-muted))] px-2.5 py-2">
              <p className="truncate text-xs font-bold text-ink">{entry.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{entry.meta}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function ScheduleTemplates({
  templates,
  organizationId,
  onCreate,
  onCopy,
  onPreview,
  onArchive,
  onRestore,
  onRemove,
}: {
  templates: ScheduleTemplate[];
  organizationId?: string;
  onCreate: (name: string) => void;
  onCopy: (template: ScheduleTemplate) => void;
  onPreview: (template: ScheduleTemplate) => void;
  onArchive: (template: ScheduleTemplate) => void;
  onRestore: (template: ScheduleTemplate) => void;
  onRemove: (template: ScheduleTemplate) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Card className="p-4" dir="rtl">
      <h2 className="text-sm font-black text-ink">الگوهای برنامه</h2>
      <p className="mt-1 text-[11px] text-slate-500">
        از برنامه فعال نسخه بسازید و هر زمان اجرا کنید.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (organizationId && name.trim()) {
            onCreate(name.trim());
            setName("");
          }
        }}
      >
        <Input
          aria-label="نام الگوی برنامه"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="مثلاً برنامه ماه رمضان"
        />
        <Button type="submit" variant="soft" disabled={!organizationId || !name.trim()}>
          ساخت الگو
        </Button>
      </form>
      {templates.length ? (
        <ul className="mt-3 grid gap-1.5">
          {templates.map((template) => (
            <li
              key={template.id}
              className="grid gap-2 rounded-lg bg-[rgb(var(--surface-muted))] p-2.5 text-xs"
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate font-bold">{template.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${template.state === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/10 text-slate-600 dark:text-slate-300"}`}
                >
                  {template.state === "ACTIVE" ? "فعال" : "بایگانی"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300">
                {template.entries.length.toLocaleString("fa-IR")} جلسه در الگو
              </p>
              <span className="flex flex-wrap gap-1">
                {template.state === "ACTIVE" ? (
                  <Button size="sm" variant="soft" onClick={() => onPreview(template)}>
                    <Eye size={13} /> بررسی
                  </Button>
                ) : (
                  <Button size="sm" variant="soft" onClick={() => onRestore(template)}>
                    <RotateCcw size={13} /> بازیابی
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onCopy(template)}>
                  <Copy size={13} /> کپی
                </Button>
                {template.state === "ACTIVE" ? (
                  <Button size="sm" variant="ghost" onClick={() => onArchive(template)}>
                    <Archive size={13} /> بایگانی
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => onRemove(template)}>
                  <Trash2 size={13} /> حذف
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">هنوز الگویی ثبت نشده است.</p>
      )}
    </Card>
  );
}

function ScheduleTimeBlocks({
  blocks,
  organizationId,
  saving,
  removing,
  onCreate,
  onRemove,
}: {
  blocks: ScheduleTimeBlock[];
  organizationId?: string;
  saving: boolean;
  removing: boolean;
  onCreate: (draft: {
    organizationId: string;
    name: string;
    startTime: string;
    endTime: string;
  }) => void;
  onRemove: (block: ScheduleTimeBlock) => void;
}) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const valid = Boolean(organizationId && name.trim() && startTime < endTime);
  return (
    <Card className="p-4" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
          <Clock3 size={17} />
        </span>
        <div>
          <h2 className="text-sm font-black text-ink">بازه‌های زمانی آماده</h2>
          <p className="text-[11px] text-slate-500">یک‌بار بسازید، در هر جلسه استفاده کنید.</p>
        </div>
      </div>
      <form
        className="mt-3 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!organizationId || !valid) return;
          onCreate({ organizationId, name: name.trim(), startTime, endTime });
          setName("");
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="مثلاً زنگ اول"
          aria-label="نام بازه زمانی"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            aria-label="شروع بازه زمانی"
          />
          <Input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            aria-label="پایان بازه زمانی"
          />
        </div>
        <Button type="submit" variant="soft" disabled={!valid || saving}>
          افزودن بازه
        </Button>
      </form>
      {blocks.length ? (
        <ul className="mt-3 grid gap-1.5" aria-label="بازه‌های زمانی ذخیره‌شده">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[rgb(var(--surface-muted))] px-2 py-1.5 text-xs"
            >
              <span className="min-w-0 truncate font-bold text-ink">
                {block.name}{" "}
                <b className="font-normal text-slate-500" dir="ltr">
                  {block.startTime}–{block.endTime}
                </b>
                <em className="ms-1 not-italic text-slate-500">
                  {timeBlockPartOfDay(block.startTime)}
                </em>
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={removing}
                aria-label={`حذف بازه ${block.name}`}
                onClick={() => onRemove(block)}
              >
                <Trash2 size={13} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">هنوز بازه‌ای ثبت نشده است.</p>
      )}
    </Card>
  );
}

function timeBlockPartOfDay(startTime: string) {
  return startTime < "12:00" ? "پیش از ظهر" : "پس از ظهر";
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

function legacyWeekdayForIso(iso: string) {
  return (new Date(`${iso}T12:00:00`).getDay() + 1) % 7;
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
