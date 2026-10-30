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
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { listOrganizations } from "../../../identity/access/api/access.api";
import { useAuth } from "../../../identity/auth";
import { listClasses, type EducationClass } from "../../education/api/classes.api";
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
  createScheduleEntries,
  createScheduleTemplate,
  createScheduleTimeBlock,
  createScheduleTimeBlockGroup,
  deleteScheduleEntry,
  deleteScheduleTemplate,
  deleteScheduleTimeBlock,
  deleteScheduleTimeBlockGroup,
  exportSchedule,
  listSchedule,
  listScheduleTemplates,
  listScheduleTimeBlocks,
  listScheduleTimeBlockGroups,
  listLegacyAcademicCycles,
  createLegacyAcademicYear,
  createLegacyAcademicTerm,
  changeLegacyAcademicYearState,
  changeLegacyAcademicTermState,
  updateLegacyAcademicYear,
  updateLegacyAcademicTerm,
  listLegacyAcademicYearHistory,
  listLegacyAcademicTermHistory,
  getLegacyAcademicBootstrap,
  reconcileLegacyAcademicCycle,
  previewScheduleImport,
  restoreScheduleTemplate,
  type ScheduleDraft,
  updateScheduleEntry,
} from "../api/schedule.api";
import type {
  ScheduleEntry,
  ScheduleTemplate,
  ScheduleTimeBlock,
  ScheduleTimeBlockGroup,
  LegacyAcademicTerm,
  LegacyAcademicCycleAudit,
} from "../api/schedule.api";
import { TeacherSchedulePage } from "../../../people/teacher-portal";
import { OrganizationTag } from "../../../../shared/ui/organization-tag";
import { todayIso } from "../../../../shared/lib/utils";
import { useModal } from "../../../../shared/ui/modal";
import { SpreadsheetTransferActions } from "../../../../shared/ui/spreadsheet-transfer-actions";
import { SpreadsheetTransferLauncher } from "../../../../shared/ui/spreadsheet-transfer-launcher";
import { useViewportShell } from "../../../../app/layout/lib/viewport-shell";
import { MobileTabs } from "../../../../shared/ui/mobile";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { useLocale } from "../../../../shared/ui/locale";
import { listTeacherLeaveRequests, type TeacherLeaveRequest } from "../api/teacher-leave.api";

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
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [academicCyclesOpen, setAcademicCyclesOpen] = useState(false);
  const [bootstrapTermId, setBootstrapTermId] = useState("");
  const [bootstrapEntryIds, setBootstrapEntryIds] = useState<string[]>([]);
  const [bootstrapSessionIds, setBootstrapSessionIds] = useState<string[]>([]);
  const [scheduleAcademicYearId, setScheduleAcademicYearId] = useState("");
  const [scheduleTermId, setScheduleTermId] = useState("");
  const [editor, setEditor] = useState<{
    entry?: ScheduleEntry;
    copy: boolean;
    initial?: ScheduleDraft;
  } | null>(null);
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
  const canManageAcademicCycles =
    canWrite &&
    ["PRINCIPAL", "RELIGIOUS_EDUCATION_MANAGER", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].some(
      (role) => auth.hasRole(role as Parameters<typeof auth.hasRole>[0]),
    );
  const academicCycles = useQuery({
    queryKey: ["schedule", "academic-cycles", selectedOrganizationId],
    queryFn: () => listLegacyAcademicCycles(selectedOrganizationId!),
    enabled: !!selectedOrganizationId && canManageAcademicCycles,
  });
  const academicBootstrap = useQuery({
    queryKey: ["schedule", "academic-bootstrap", selectedOrganizationId],
    queryFn: () => getLegacyAcademicBootstrap(selectedOrganizationId!),
    enabled: !!selectedOrganizationId && auth.can("schedule.read"),
  });
  const activeAcademicYear = academicCycles.data?.years.find((year) => year.state === "ACTIVE");
  const bootstrapActiveYear = academicBootstrap.data?.activeYear;
  const bootstrapTerms = (academicCycles.data?.terms ?? []).filter(
    (term) => term.academicYearId === bootstrapActiveYear?.id && term.state === "ACTIVE",
  );
  const selectedBootstrapTermId = bootstrapTermId || bootstrapTerms[0]?.id || "";
  const scheduleSetupBlocked = Boolean(
    selectedOrganizationId &&
    !academicBootstrap.isLoading &&
    (!bootstrapActiveYear ||
      (academicBootstrap.data &&
        (academicBootstrap.data.unassignedScheduleEntries.length > 0 ||
          academicBootstrap.data.unassignedAttendanceSessions.length > 0 ||
          academicBootstrap.data.pendingAttendanceCount > 0))),
  );
  const reconcileAcademicBootstrap = useMutation({
    mutationFn: () =>
      reconcileLegacyAcademicCycle({
        organizationId: selectedOrganizationId!,
        academicYearId: bootstrapActiveYear!.id,
        termId: selectedBootstrapTermId,
        scheduleEntryIds: bootstrapEntryIds,
        attendanceSessionIds: bootstrapSessionIds,
      }),
    onSuccess: () => {
      notify("داده‌های قدیمی با سال و نیم‌سال انتخاب‌شده پیوند خوردند.", "success");
      setBootstrapEntryIds([]);
      setBootstrapSessionIds([]);
      void client.invalidateQueries({ queryKey: ["schedule"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تطبیق داده‌های قدیمی انجام نشد.", "error"),
  });
  useEffect(() => {
    if (!academicBootstrap.data) return;
    setBootstrapEntryIds(academicBootstrap.data.unassignedScheduleEntries.map((entry) => entry.id));
    // Attendance history is selected by the setup gate only after a term is
    // chosen. Selecting all history here can include dates from another term.
    setBootstrapSessionIds([]);
  }, [academicBootstrap.data]);
  const selectedScheduleYearId = scheduleAcademicYearId || activeAcademicYear?.id || "";
  const availableScheduleTerms = (academicCycles.data?.terms ?? []).filter(
    (term) =>
      term.academicYearId === selectedScheduleYearId &&
      term.state !== "ARCHIVED" &&
      !term.correctionOpen,
  );
  const canManageTemplates = canCreate && canEdit && canArchive && canDelete;
  const timeBlocks = useQuery({
    queryKey: ["schedule", "time-blocks", selectedOrganizationId ?? "all"],
    queryFn: listScheduleTimeBlocks,
    enabled: canWrite,
  });
  const timeBlockGroups = useQuery({
    queryKey: ["schedule", "time-block-groups", selectedOrganizationId ?? "all"],
    queryFn: listScheduleTimeBlockGroups,
    enabled: canWrite,
  });
  const templates = useQuery({
    queryKey: ["schedule", "templates", selectedOrganizationId ?? "all"],
    queryFn: listScheduleTemplates,
    enabled: canManageTemplates,
  });
  const isTeacher = auth.activeRole === "TEACHER";
  const teacherLeaves = useQuery({
    queryKey: ["teacher-leaves", selectedOrganizationId],
    queryFn: listTeacherLeaveRequests,
    enabled: auth.can("schedule.publish"),
  });
  const approvedLeaveByTeacher = useMemo(
    () =>
      new Map(
        (teacherLeaves.data ?? [])
          .filter((leave) => leave.status === "approved")
          .map((leave) => [leave.teacherId, leave]),
      ),
    [teacherLeaves.data],
  );
  const classes = useQuery({
    queryKey: ["classes", "schedule"],
    queryFn: () => listClasses(),
    enabled: canWrite,
  });
  const reload = () => void client.invalidateQueries({ queryKey: ["schedule"] });
  const reloadAcademicCycles = () => {
    void client.invalidateQueries({
      queryKey: ["schedule", "academic-cycles", selectedOrganizationId],
    });
    void client.invalidateQueries({
      queryKey: ["schedule", "academic-bootstrap", selectedOrganizationId],
    });
  };
  const save = useMutation({
    mutationFn: async ({ id, drafts }: { id?: string; drafts: ScheduleDraft[] }) => {
      const scopedDrafts = drafts.map((draft) => ({
        ...draft,
        academicYearId: draft.academicYearId ?? (selectedScheduleYearId || undefined),
        termId: draft.termId ?? (scheduleTermId || availableScheduleTerms[0]?.id || undefined),
      }));
      if (id) return [await updateScheduleEntry(id, scopedDrafts[0])];
      if (scopedDrafts.length === 1) return [await createScheduleEntry(scopedDrafts[0])];
      return createScheduleEntries(scopedDrafts);
    },
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
  const saveTimeBlockGroup = useMutation({
    mutationFn: createScheduleTimeBlockGroup,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["schedule", "time-block-groups"] });
      notify("گروه بازه زمانی ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره گروه انجام نشد.", "error"),
  });
  const removeTimeBlockGroup = useMutation({
    mutationFn: deleteScheduleTimeBlockGroup,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["schedule", "time-block-groups"] });
      notify("گروه بازه زمانی حذف شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "حذف گروه انجام نشد.", "error"),
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
    mutationFn: ({
      id,
      academicYearId,
      termId,
    }: {
      id: string;
      academicYearId: string;
      termId: string;
    }) => applyScheduleTemplate(id, { academicYearId, termId }),
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
    return (
      <Card
        role="alert"
        className="mx-auto grid max-w-xl justify-items-center gap-3 p-6 text-center"
      >
        <CalendarClock size={28} className="text-brand" aria-hidden="true" />
        <h1 className="text-lg font-black text-ink">برنامه بارگذاری نشد</h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          اتصال را بررسی کنید و دوباره تلاش کنید. اطلاعات برنامه تغییر نکرده است.
        </p>
        <Button
          onClick={() => {
            void entries.refetch();
            if (canReadOrganizations) void organizations.refetch();
            if (canWrite) {
              void classes.refetch();
              void timeBlocks.refetch();
            }
            if (canManageTemplates) void templates.refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </Card>
    );
  if (isTeacher) return <TeacherSchedulePage entries={entries.data ?? []} />;
  const editEntry = (entry?: ScheduleEntry, copy = false, initial?: ScheduleDraft) => {
    setEditor({ entry, copy, initial });
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
    const leave = approvedLeaveByTeacher.get(
      entry.teacher?.id ?? entry.classBook?.teacher.id ?? "",
    );
    modal.open({
      title: "جزئیات جلسه",
      description: "زمان، کلاس و فضای آموزشی جلسه انتخاب‌شده",
      size: "md",
      content: (
        <SchedulePlanModal
          entry={entry}
          leave={leave}
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
  const toolsPanel = (
    <div className="grid gap-3">
      <header className="flex items-center gap-2 px-1">
        <span
          className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand"
          aria-hidden="true"
        >
          <CalendarClock size={18} />
        </span>
        <div>
          <h2 className="text-sm font-black text-ink">ابزارهای برنامه</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-300">
            جلسه‌ها، زمان‌ها و الگوها را از همین‌جا مدیریت کنید.
          </p>
        </div>
      </header>
      <ScheduleSidebarSummary entries={scheduleEntries} toolbar={scheduleToolbar} />
      {canCreate ? (
        <Card className="border-brand/15 bg-[rgb(var(--surface-card))] p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
            <Plus size={20} />
          </span>
          <h3 className="mt-3 font-black text-ink">ساخت جلسه، بدون ترک جدول</h3>
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
          groups={timeBlockGroups.data ?? []}
          organizationId={selectedOrganizationId}
          saving={saveTimeBlock.isPending || saveTimeBlockGroup.isPending}
          removing={removeTimeBlock.isPending || removeTimeBlockGroup.isPending}
          onCreate={(draft) => saveTimeBlock.mutate(draft)}
          onCreateGroup={(draft) => saveTimeBlockGroup.mutate(draft)}
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
          onRemoveGroup={(group) =>
            void modal
              .confirm({
                title: "حذف گروه بازه زمانی؟",
                description: `«${group.name}» فقط در صورتی حذف می‌شود که بازه‌ای در آن نمانده باشد.`,
                tone: "danger",
                confirmLabel: "حذف گروه",
                cancelLabel: "انصراف",
                softConfirm: true,
              })
              .then((confirmed) => confirmed && removeTimeBlockGroup.mutate(group.id))
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
    </div>
  );
  return (
    <>
      {scheduleSetupBlocked ? (
        <ScheduleAcademicSetupGate
          canManage={canManageAcademicCycles}
          activeYear={bootstrapActiveYear}
          terms={bootstrapTerms}
          selectedTermId={selectedBootstrapTermId}
          onTermChange={setBootstrapTermId}
          entries={academicBootstrap.data?.unassignedScheduleEntries ?? []}
          attendanceSessions={academicBootstrap.data?.unassignedAttendanceSessions ?? []}
          pendingAttendance={academicBootstrap.data?.pendingAttendance ?? []}
          pendingAttendanceCount={academicBootstrap.data?.pendingAttendanceCount ?? 0}
          selectedEntryIds={bootstrapEntryIds}
          selectedSessionIds={bootstrapSessionIds}
          onEntryIdsChange={setBootstrapEntryIds}
          onSessionIdsChange={setBootstrapSessionIds}
          onOpenAcademicCycles={() => setAcademicCyclesOpen(true)}
          onReconcile={() => reconcileAcademicBootstrap.mutate()}
          reconciling={reconcileAcademicBootstrap.isPending}
        />
      ) : null} */}
      <header
        className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-[var(--shadow-surface)] sm:p-5"
        dir="rtl"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <CalendarClock size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1
              id="schedule-page-title"
              className="text-xl font-black tracking-tight text-ink sm:text-2xl"
            >
              برنامه هفتگی مدرسه
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
              جلسه‌ها را بر اساس روز یا کلاس ببینید و از همین صفحه مدیریت کنید.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {activeAcademicYear ? (
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand/5 px-3 text-xs font-bold text-ink">
              <GraduationCap size={15} className="text-brand" aria-hidden="true" />
              سال ثبت جدید:{" "}
              {academicCycles.data?.years.find((year) => year.id === selectedScheduleYearId)
                ?.name ?? activeAcademicYear.name}
            </span>
          ) : null}
          {availableScheduleTerms[0] ? (
            <span className="inline-flex min-h-10 items-center rounded-xl bg-[rgb(var(--surface-muted))] px-3 text-xs font-bold text-ink">
              نیم‌سال ثبت جدید:{" "}
              {scheduleTermId
                ? availableScheduleTerms.find((term) => term.id === scheduleTermId)?.name
                : availableScheduleTerms[0].name}
            </span>
          ) : null}
          {canManageAcademicCycles ? (
            <Button
              variant="soft"
              className="min-h-10 flex-1 sm:flex-none"
              onClick={() => setAcademicCyclesOpen(true)}
            >
              <GraduationCap size={17} /> مدیریت سال و نیم‌سال
            </Button>
          ) : null}
          <Button
            variant="soft"
            className="min-h-10 flex-1 sm:flex-none"
            onClick={() => setMobileToolsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={mobileToolsOpen}
            aria-controls="legacy-schedule-tools-drawer"
          >
            <CalendarClock size={17} /> ابزارهای برنامه
          </Button>
          {canCreate ? (
            <Button className="min-h-10 flex-1 sm:flex-none" onClick={() => editEntry()}>
              <Plus size={17} /> افزودن جلسه
            </Button>
          ) : null}
        </div>
      </header>
      {canWrite && activeAcademicYear ? (
        <Card className="flex flex-wrap items-end gap-3 p-4" dir="rtl">
          <label className="grid min-w-48 gap-1 text-xs font-bold">
            سال تحصیلی جلسه‌های جدید
            <AdaptiveSelect
              value={selectedScheduleYearId}
              onChange={(event) => {
                setScheduleAcademicYearId(event.target.value);
                setScheduleTermId("");
              }}
            >
              {academicCycles.data?.years
                .filter((year) => year.state !== "ARCHIVED")
                .map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
            </AdaptiveSelect>
          </label>
          <label className="grid min-w-48 gap-1 text-xs font-bold">
            نیم‌سال جلسه‌های جدید
            <AdaptiveSelect
              value={scheduleTermId || availableScheduleTerms[0]?.id || ""}
              onChange={(event) => setScheduleTermId(event.target.value)}
            >
              <option value="">انتخاب نیم‌سال</option>
              {availableScheduleTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </AdaptiveSelect>
          </label>
          <p className="max-w-sm text-xs leading-5 text-slate-500">
            جلسه‌های تازه به سال و نیم‌سال انتخاب‌شده متصل می‌شوند؛ برنامهٔ گذشته تغییر نمی‌کند.
          </p>
        </Card>
      ) : null}
      <section
        className="relative grid w-full max-w-none gap-4 pb-[calc(6rem+env(safe-area-inset-bottom))] min-[1200px]:pb-6"
        dir="rtl"
      >
        <div
          className="order-1 grid gap-3"
          role="region"
          id="schedule-workspace-panel"
          aria-labelledby="schedule-page-title"
        >
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
                  .then((ok) =>
                    ok &&
                    selectedScheduleYearId &&
                    (scheduleTermId || availableScheduleTerms[0]?.id)
                      ? applyTemplate.mutate({
                          id: templatePreview.id,
                          academicYearId: selectedScheduleYearId,
                          termId: scheduleTermId || availableScheduleTerms[0]!.id,
                        })
                      : notify("پیش از اجرای الگو، سال و نیم‌سال را انتخاب کنید.", "error"),
                  )
              }
            />
          ) : null}
          <ScheduleWorkspace
            entries={scheduleEntries}
            classes={classes.data ?? []}
            timeBlocks={timeBlocks.data ?? []}
            activeWeekday={activeWeekday}
            onWeekdayChange={setActiveWeekday}
            canEdit={canEdit}
            canArchive={canArchive}
            showOrganization={auth.hasRole("PLATFORM_ADMIN")}
            canDelete={canDelete}
            canCreate={canCreate}
            onAdd={(classroom, weekday) =>
              editEntry(undefined, false, {
                ...blank(),
                organizationId: classroom.organization.id,
                classroomId: classroom.id,
                weekday,
              })
            }
            onCopy={(entry) => editEntry(entry, true)}
            onEdit={editEntry}
            onArchive={confirmArchive}
            onDelete={confirmDelete}
            onOpenDetails={openDetails}
            onMove={(entry, weekday) => move.mutate({ entry, weekday })}
            leaveForEntry={(entry) =>
              approvedLeaveByTeacher.get(entry.teacher?.id ?? entry.classBook?.teacher.id ?? "")
            }
            onQuickAdd={() => editEntry()}
            onOpenTools={() => setMobileToolsOpen(true)}
            toolsOpen={mobileToolsOpen}
          />
        </div>
      </section>
      <ResponsiveDrawer
        open={mobileToolsOpen}
        onOpenChange={setMobileToolsOpen}
        title="ابزارهای برنامه"
        description="عملیات برنامه، بازه‌های زمانی و الگوها را از این پنل مدیریت کنید."
        desktopSide="left"
        className="w-full max-w-xl"
      >
        <div id="legacy-schedule-tools-drawer">{toolsPanel}</div>
      </ResponsiveDrawer>
      <ResponsiveDrawer
        open={academicCyclesOpen}
        onOpenChange={setAcademicCyclesOpen}
        title="مدیریت سال تحصیلی و نیم‌سال"
        description="سال فعال باید دست‌کم دو نیم‌سال بدون هم‌پوشانی داشته باشد. بازگشایی ترم بایگانی‌شده فقط برای اصلاح سوابق است."
        desktopSide="left"
      >
        <AcademicCycleManager
          organizationId={selectedOrganizationId ?? ""}
          data={academicCycles.data}
          loading={academicCycles.isLoading}
          onChanged={reloadAcademicCycles}
        />
      </ResponsiveDrawer>
      <ResponsiveDrawer
        open={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
        title={
          editor?.entry
            ? editor.copy
              ? "کپی جلسه در برنامه"
              : "ویرایش جلسه"
            : "افزودن جلسه به برنامه"
        }
        description={
          editor?.entry && !editor.copy
            ? "جزئیات جلسه را اصلاح کنید؛ تغییرات فقط پس از ذخیره اعمال می‌شود."
            : "روز و زمان مقصد را انتخاب کنید؛ جلسه اصلی بدون تغییر باقی می‌ماند."
        }
        desktopSide="left"
        className="w-full max-w-4xl"
      >
        {editor ? (
          <ScheduleEditorForm
            initial={editor.initial ?? (editor.entry ? draftFromEntry(editor.entry) : blank())}
            timeBlocks={timeBlocks.data ?? []}
            timeBlockGroups={timeBlockGroups.data ?? []}
            organizations={organizationOptions}
            classes={classes.data ?? []}
            isSaving={save.isPending}
            onCancel={() => setEditor(null)}
            onSubmit={async (draft) => {
              await save.mutateAsync({
                id: editor.copy ? undefined : editor.entry?.id,
                drafts: draft,
              });
              setEditor(null);
            }}
            allowMultiple={!editor.entry || editor.copy}
          />
        ) : null}
      </ResponsiveDrawer>
    </>
  );
}

const displayWeekdays = [0, 1, 2, 3, 4, 5, 6] as const;

type ScheduleWorkspaceProps = {
  entries: ScheduleEntry[];
  classes: EducationClass[];
  timeBlocks: ScheduleTimeBlock[];
  activeWeekday: number;
  onWeekdayChange: (weekday: number) => void;
  canEdit: boolean;
  canCreate: boolean;
  canArchive: boolean;
  canDelete: boolean;
  showOrganization: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onArchive: (entry: ScheduleEntry) => void;
  onDelete: (entry: ScheduleEntry) => void;
  onOpenDetails: (entry: ScheduleEntry) => void;
  onMove: (entry: ScheduleEntry, weekday: number) => void;
  onAdd: (classroom: EducationClass, weekday: number) => void;
  onCopy: (entry: ScheduleEntry) => void;
  leaveForEntry: (entry: ScheduleEntry) => TeacherLeaveRequest | undefined;
  onQuickAdd: () => void;
  onOpenTools: () => void;
  toolsOpen: boolean;
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-ink">نمای کلی برنامه</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">وضعیت برنامه فعال مدرسه</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
          فعال
        </span>
      </div>
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
  classes,
  timeBlocks,
  activeWeekday,
  onWeekdayChange,
  canEdit,
  canCreate,
  canArchive,
  canDelete,
  showOrganization,
  onEdit,
  onArchive,
  onDelete,
  onOpenDetails,
  onMove,
  onAdd,
  onCopy,
  leaveForEntry,
  onQuickAdd,
  onOpenTools,
  toolsOpen,
}: ScheduleWorkspaceProps) {
  const viewportShell = useViewportShell();
  const isMobileShell = viewportShell === "mobile";
  const isCompactWorkspace = viewportShell !== "desktop";
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
    const lanesByClassId = new Map(
      classes
        .filter((classroom) => classroom.status === "ACTIVE")
        .map((classroom) => [
          classroom.id,
          {
            id: `class:${classroom.id}`,
            label: classroom.name,
            classroom,
            entries: [] as ScheduleEntry[],
          },
        ]),
    );
    const additionalLanes = new Map<
      string,
      { id: string; label: string; classroom?: EducationClass; entries: ScheduleEntry[] }
    >();

    activeScheduleEntries.forEach((entry) => {
      const classroomLane = entry.classroom?.id
        ? lanesByClassId.get(entry.classroom.id)
        : undefined;
      if (classroomLane) {
        classroomLane.entries.push(entry);
        return;
      }

      const label = entry.classroom?.name || entry.room || "برنامه عمومی مدرسه";
      const id = `other:${entry.classroom?.id ?? label}`;
      const lane = additionalLanes.get(id) ?? { id, label, entries: [] };
      lane.entries.push(entry);
      additionalLanes.set(id, lane);
    });

    return [...lanesByClassId.values(), ...additionalLanes.values()]
      .map((lane) => ({
        ...lane,
        entries: lane.entries.sort((left, right) => {
          const weekdayOrder = left.weekday - right.weekday;
          return weekdayOrder || left.startTime.localeCompare(right.startTime);
        }),
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "fa"));
  }, [activeScheduleEntries, classes]);
  const activeClasses = useMemo(
    () =>
      classes
        .filter((classroom) => classroom.status === "ACTIVE")
        .sort((left, right) => left.name.localeCompare(right.name, "fa")),
    [classes],
  );
  const [classTabIds, setClassTabIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"main" | string>("main");
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [layout, setLayout] = useState<"classes" | "time-blocks">("classes");
  const selectedClassroom =
    activeTab === "main"
      ? undefined
      : activeClasses.find((classroom) => classroom.id === activeTab);
  const openClassTab = (classroomId: string) => {
    if (!classroomId) return;
    setClassTabIds((current) =>
      current.includes(classroomId) ? current : [...current, classroomId],
    );
    setActiveTab(classroomId);
    setClassPickerOpen(false);
  };
  const closeClassTab = (classroomId: string) => {
    const tabIndex = classTabIds.indexOf(classroomId);
    const remainingTabs = classTabIds.filter((id) => id !== classroomId);
    setClassTabIds(remainingTabs);
    if (activeTab === classroomId) {
      setActiveTab(remainingTabs[tabIndex] ?? remainingTabs[tabIndex - 1] ?? "main");
    }
  };

  return (
    <section className="flex flex-col gap-3" aria-label="برنامه هفتگی مدرسه">
      {classPickerOpen ? (
        <ClassTabPicker
          classes={activeClasses}
          entries={activeScheduleEntries}
          openTabs={classTabIds}
          onSelect={openClassTab}
          onCancel={() => setClassPickerOpen(false)}
        />
      ) : selectedClassroom ? (
        <ClassScheduleBoard
          classroom={selectedClassroom}
          entries={activeScheduleEntries.filter(
            (entry) => entry.classroom?.id === selectedClassroom.id,
          )}
          today={today}
          leaveForEntry={leaveForEntry}
          onOpenDetails={onOpenDetails}
        />
      ) : (
        <Card className="overflow-hidden p-0 shadow-[0_16px_28px_-26px_rgba(18,52,86,.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border-subtle))] px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarClock size={19} className="shrink-0 text-brand" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-black text-ink">جدول کلاس‌ها</h2>
                <p className="text-[11px] text-slate-500">
                  نمای کلاس‌ها یا نمای زمان‌بندی هفتگی را انتخاب کنید.
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

          <div
            className="flex flex-wrap gap-1 border-b border-[rgb(var(--border-subtle))] px-3 py-2 sm:px-4"
            role="tablist"
            aria-label="نمای برنامه"
          >
            <Button
              type="button"
              size="sm"
              variant={layout === "classes" ? "primary" : "ghost"}
              role="tab"
              aria-selected={layout === "classes"}
              onClick={() => setLayout("classes")}
            >
              نمای کلاس‌ها
            </Button>
            <Button
              type="button"
              size="sm"
              variant={layout === "time-blocks" ? "primary" : "ghost"}
              role="tab"
              aria-selected={layout === "time-blocks"}
              onClick={() => setLayout("time-blocks")}
            >
              نمای روز و بازه
            </Button>
          </div>

          {layout === "classes" ? (
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
          ) : null}

          {layout === "time-blocks" ? (
            <ScheduleTimeBlockBoard
              entries={activeScheduleEntries}
              classes={activeClasses}
              timeBlocks={timeBlocks}
              onOpenDetails={onOpenDetails}
              leaveForEntry={leaveForEntry}
            />
          ) : isMobileShell ? (
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
                  leave={leaveForEntry(entry)}
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
                  className="w-full min-w-[72rem] table-fixed overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-right text-xs text-ink"
                  aria-label="دفتر برنامه هفتگی کلاس‌ها"
                >
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-[rgb(var(--surface-muted))] text-ink">
                      <th
                        scope="col"
                        className="sticky right-0 z-20 w-36 border-s border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-3 text-center text-sm font-black text-ink"
                      >
                        کلاس / گروه
                      </th>
                      {displayWeekdays.map((weekday) => (
                        <th
                          key={weekday}
                          scope="col"
                          className={`border-s border-[rgb(var(--border-subtle))] px-2 py-2.5 text-center ${weekday === today ? "bg-brand/10" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => onWeekdayChange(weekday)}
                            className="w-full rounded-md px-2 py-1 text-sm font-black text-ink transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
                        key={lane.id}
                        className={rowIndex % 2 ? "bg-slate-50/70 dark:bg-white/[.025]" : ""}
                      >
                        <th
                          scope="row"
                          className="sticky right-0 z-10 border-s border-t border-slate-200 bg-inherit px-3 py-3 text-right text-xs font-black text-slate-700 dark:border-white/10 dark:text-slate-100"
                        >
                          <span className="block leading-5">{lane.label}</span>
                          <span className="mt-1 block text-[10px] font-bold text-slate-400">
                            {lane.entries.length
                              ? `${lane.entries.length.toLocaleString("fa-IR")} جلسه`
                              : "هنوز جلسه‌ای ندارد"}
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
                              className={`align-top border-s border-t border-[rgb(var(--border-subtle))] p-2 ${weekday === today ? "bg-brand/[.045]" : ""}`}
                            >
                              {cellEntries.length ? (
                                <div className="grid min-h-14 gap-1">
                                  {cellEntries.map((entry) => (
                                    <ScheduleMatrixCell
                                      key={entry.id}
                                      entry={entry}
                                      canEdit={canEdit}
                                      canCreate={canCreate}
                                      canArchive={canArchive}
                                      canDelete={canDelete}
                                      showOrganization={showOrganization}
                                      onEdit={onEdit}
                                      onCopy={onCopy}
                                      onArchive={onArchive}
                                      onDelete={onDelete}
                                      onOpenPlan={onOpenDetails}
                                      onDragStart={() => setDraggedEntry(entry)}
                                      onDragEnd={() => setDraggedEntry(null)}
                                      leave={leaveForEntry(entry)}
                                    />
                                  ))}
                                  {canCreate && lane.classroom ? (
                                    <ScheduleAddDropZone
                                      classroom={lane.classroom}
                                      weekday={weekday}
                                      onAdd={onAdd}
                                    />
                                  ) : null}
                                </div>
                              ) : canCreate && lane.classroom ? (
                                <ScheduleAddDropZone
                                  classroom={lane.classroom}
                                  weekday={weekday}
                                  onAdd={onAdd}
                                />
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
      )}

      {!classPickerOpen &&
      !selectedClassroom &&
      (canEdit || canArchive || canDelete) &&
      archivedEntries.length ? (
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
                leave={leaveForEntry(entry)}
              />
            ))}
          </div>
        </Card>
      ) : null}

      <nav
        aria-label="برگه‌های فضای کاری برنامه"
        role="group"
        className="sticky top-0 z-30 order-first -mx-3 mb-14 flex min-h-[4.5rem] w-[calc(100%+1.5rem)] items-center gap-3 overflow-x-auto border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_94%)] px-3 py-2 shadow-[0_10px_22px_-22px_rgba(15,23,42,.5)] backdrop-blur-md dark:bg-[rgb(var(--surface-card)_/_94%)] sm:-mx-5 sm:w-[calc(100%+2.5rem)] sm:px-5 lg:-mx-6 lg:w-[calc(100%+3rem)] lg:px-6 xl:-mx-8 xl:w-[calc(100%+4rem)] xl:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        dir="rtl"
      >
        <div className="hidden shrink-0 border-e border-[rgb(var(--border-subtle))] pe-3 sm:block">
          <p className="text-sm font-black text-ink">برنامه هفتگی</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">فضای کاری کلاس‌ها</p>
        </div>
        <button
          type="button"
          id="schedule-main-tab"
          aria-controls="schedule-workspace-panel"
          aria-pressed={activeTab === "main"}
          onClick={() => setActiveTab("main")}
          aria-current={activeTab === "main" ? "page" : undefined}
          className={`shrink-0 rounded-t-xl border border-b-0 px-3 py-2.5 text-xs font-black outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
            activeTab === "main"
              ? "border-brand bg-brand text-white shadow-sm"
              : "border-transparent bg-[rgb(var(--surface-muted))] text-slate-600 hover:border-slate-200 hover:bg-white dark:text-slate-200 dark:hover:border-white/15 dark:hover:bg-white/10"
          }`}
        >
          برنامه اصلی
        </button>
        {classTabIds.map((classroomId) => {
          const classroom = activeClasses.find((item) => item.id === classroomId);
          if (!classroom) return null;
          const active = activeTab === classroomId;
          return (
            <span
              key={classroomId}
              className={`flex shrink-0 items-center gap-1 rounded-t-xl border border-b-0 ps-3 pe-1 py-1.5 text-xs font-black transition ${
                active
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-transparent bg-[rgb(var(--surface-muted))] text-slate-600 hover:border-slate-200 hover:bg-white dark:text-slate-200 dark:hover:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              <button
                type="button"
                id={`schedule-class-tab-${classroomId}`}
                aria-controls="schedule-workspace-panel"
                aria-pressed={active}
                onClick={() => setActiveTab(classroomId)}
                className="rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-current"
              >
                {classroom.name}
              </button>
              <button
                type="button"
                onClick={() => closeClassTab(classroomId)}
                className="grid size-7 place-items-center rounded-lg outline-none transition hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-current"
                aria-label={`بستن برگه ${classroom.name}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setClassPickerOpen((open) => !open)}
          aria-expanded={classPickerOpen}
          aria-controls="schedule-class-picker"
          className={`ms-auto grid size-9 shrink-0 place-items-center rounded-lg border outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
            classPickerOpen
              ? "border-brand bg-brand text-white"
              : "border-dashed border-brand/45 bg-brand/5 text-brand hover:bg-brand/10"
          }`}
          aria-label={classPickerOpen ? "بستن انتخاب کلاس" : "باز کردن انتخاب کلاس"}
          title={classPickerOpen ? "بستن انتخاب کلاس" : "باز کردن برنامه یک کلاس"}
        >
          {classPickerOpen ? (
            <X size={17} aria-hidden="true" />
          ) : (
            <Plus size={18} aria-hidden="true" />
          )}
        </button>
      </nav>
      {isCompactWorkspace ? (
        <div
          className={`sticky ${isMobileShell ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-2"} z-20 -mx-2 flex gap-2 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_96%)] p-2 shadow-[0_12px_30px_-16px_rgba(15,23,42,.5)] backdrop-blur motion-reduce:backdrop-blur-none`}
          dir="rtl"
          aria-label="عملیات سریع برنامه"
        >
          {canCreate ? (
            <Button className="min-h-12 flex-1" onClick={onQuickAdd}>
              <Plus size={17} aria-hidden="true" /> افزودن جلسه
            </Button>
          ) : null}
          <Button
            variant="soft"
            className="min-h-12"
            onClick={onOpenTools}
            aria-haspopup="dialog"
            aria-expanded={toolsOpen}
          >
            <CalendarClock size={17} aria-hidden="true" /> ابزارها
          </Button>
          <Button
            variant="ghost"
            className="min-h-12"
            onClick={() => {
              setActiveTab("main");
              setClassPickerOpen(false);
              onWeekdayChange(today);
            }}
          >
            امروز
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ClassTabPicker({
  classes,
  entries,
  openTabs,
  onSelect,
  onCancel,
}: {
  classes: EducationClass[];
  entries: ScheduleEntry[];
  openTabs: string[];
  onSelect: (classroomId: string) => void;
  onCancel: () => void;
}) {
  return (
    <section
      id="schedule-class-picker"
      className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-[0_16px_28px_-26px_rgba(18,52,86,.45)] sm:p-5"
      aria-labelledby="schedule-class-picker-title"
      dir="rtl"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgb(var(--border-subtle))] pb-4">
        <div>
          <p className="text-xs font-black text-brand">برگه جدید</p>
          <h2 id="schedule-class-picker-title" className="mt-1 text-xl font-black text-ink">
            یک کلاس را برای مشاهده برنامه انتخاب کنید
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            با انتخاب هر کارت، برنامه همان کلاس در یک برگه جدید باز می‌شود.
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
      </header>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((classroom) => {
          const classEntries = entries.filter((entry) => entry.classroom?.id === classroom.id);
          const teacherCount = new Set(classEntries.map(teacherName).filter(Boolean)).size;
          const alreadyOpen = openTabs.includes(classroom.id);
          return (
            <button
              key={classroom.id}
              type="button"
              onClick={() => onSelect(classroom.id)}
              className="group rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 text-right shadow-[0_10px_22px_-20px_rgba(15,23,42,.55)] outline-none transition hover:-translate-y-0.5 hover:border-brand/45 hover:bg-[rgb(var(--surface-muted))] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transform-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-ink">{classroom.name}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">
                    {classroom.schoolYear}
                  </p>
                </div>
                {alreadyOpen ? (
                  <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-black text-brand">
                    باز است
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center dark:border-white/10">
                <ClassScheduleMetric label="جلسه" value={classEntries.length} />
                <ClassScheduleMetric label="درس" value={classroom.books.length} />
                <ClassScheduleMetric label="دبیر" value={teacherCount} />
              </div>
            </button>
          );
        })}
      </div>
      {!classes.length ? <EmptyState title="کلاس فعالی برای انتخاب وجود ندارد." /> : null}
    </section>
  );
}

function ClassScheduleBoard({
  classroom,
  entries,
  today,
  leaveForEntry,
  onOpenDetails,
}: {
  classroom: EducationClass;
  entries: ScheduleEntry[];
  today: number;
  leaveForEntry: (entry: ScheduleEntry) => TeacherLeaveRequest | undefined;
  onOpenDetails: (entry: ScheduleEntry) => void;
}) {
  const sessionsByDay = useMemo(
    () =>
      new Map(
        displayWeekdays.map((weekday) => [
          weekday,
          entries
            .filter((entry) => entry.weekday === weekday)
            .sort((left, right) => left.startTime.localeCompare(right.startTime)),
        ]),
      ),
    [entries],
  );
  const teachers = new Set(entries.map(teacherName).filter(Boolean));

  return (
    <section
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
      aria-label={`برنامه کلاس ${classroom.name}`}
      dir="rtl"
    >
      <aside className="rounded-2xl border border-brand/20 bg-[linear-gradient(160deg,rgba(13,148,136,.16),rgba(255,255,255,.98)_52%,rgba(224,242,254,.8))] p-5 dark:bg-[linear-gradient(160deg,rgba(13,148,136,.3),rgba(15,23,42,.96))] lg:col-start-2 lg:row-start-1 lg:self-start">
        <p className="text-xs font-black text-brand">جزئیات کلاس</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{classroom.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          درس‌ها و دبیران متصل به این کلاس.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <ClassScheduleMetric label="جلسه" value={entries.length} />
          <ClassScheduleMetric label="درس" value={classroom.books.length} />
          <ClassScheduleMetric label="دبیر" value={teachers.size} />
        </div>

        <section
          className="mt-5 border-t border-brand/15 pt-4"
          aria-labelledby={`class-books-${classroom.id}`}
        >
          <h3
            id={`class-books-${classroom.id}`}
            className="text-xs font-black text-slate-700 dark:text-slate-100"
          >
            کتاب‌ها و دبیران
          </h3>
          <div className="mt-3 grid gap-2">
            {classroom.books.map((book) => (
              <article
                key={book.id}
                className="rounded-xl border border-sky-200 bg-white/80 px-3 py-2.5 dark:border-sky-400/20 dark:bg-slate-950/50"
              >
                <p className="text-sm font-black text-ink">{book.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">
                  {book.teacher.name}
                </p>
              </article>
            ))}
            {!classroom.books.length ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs font-bold text-slate-500 dark:border-white/15 dark:text-slate-300">
                کتابی برای این کلاس ثبت نشده است.
              </p>
            ) : null}
          </div>
        </section>
      </aside>

      <div className="grid gap-3 lg:col-start-1 lg:row-start-1">
        <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 py-3">
          <div>
            <p className="text-xs font-black text-brand">برنامه هفتگی</p>
            <h3 className="mt-1 text-lg font-black text-ink">جلسه‌ها به ترتیب روز</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
            برای دیدن جزئیات، هر جلسه را انتخاب کنید.
          </p>
        </header>
        {displayWeekdays.map((weekday) => {
          const dayEntries = sessionsByDay.get(weekday) ?? [];
          return (
            <section
              key={weekday}
              className={`rounded-2xl border p-3 ${
                weekday === today
                  ? "border-brand/35 bg-brand/[.055]"
                  : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"
              }`}
            >
              <header className="mb-3 flex items-center justify-between gap-2 border-b border-[rgb(var(--border-subtle))] pb-2">
                <h4 className="text-sm font-black text-ink">{weekdays[weekday]}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">
                  {dayEntries.length.toLocaleString("fa-IR")} جلسه
                </span>
              </header>
              <div className="grid gap-2 sm:grid-cols-2">
                {dayEntries.map((entry) => {
                  const leave = leaveForEntry(entry);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onOpenDetails(entry)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-right shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-brand/45 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transform-none dark:border-white/10 dark:bg-white/[.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 text-sm font-black text-ink">
                          {entry.classBook?.book.titleFa || entry.title}
                        </span>
                        <span
                          className="shrink-0 rounded-md bg-brand/10 px-1.5 py-1 text-[10px] font-black tabular-nums text-brand"
                          dir="ltr"
                        >
                          {entry.startTime}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {teacherName(entry) || "دبیر ثبت نشده"}
                      </p>
                      {entry.title !== entry.classBook?.book.titleFa ? (
                        <p className="mt-1 text-[11px] text-slate-500">{entry.title}</p>
                      ) : null}
                      {leave ? <LeaveFrozenTag leave={leave} /> : null}
                    </button>
                  );
                })}
                {!dayEntries.length ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs font-bold text-slate-400 dark:border-white/10 sm:col-span-2">
                    جلسه‌ای ندارد
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ClassScheduleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-16 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-950/50">
      <b className="block text-lg font-black tabular-nums text-ink">
        {value.toLocaleString("fa-IR")}
      </b>
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{label}</span>
    </div>
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

function ScheduleAddDropZone({
  classroom,
  weekday,
  onAdd,
}: {
  classroom: EducationClass;
  weekday: number;
  onAdd: (classroom: EducationClass, weekday: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(classroom, weekday)}
      className="group grid min-h-10 w-full place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50/70 px-2 py-1 text-slate-400 outline-none transition hover:border-brand/50 hover:bg-brand/5 hover:text-brand focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand dark:border-white/15 dark:bg-white/[.025]"
      aria-label={`افزودن جلسه برای ${classroom.name} در ${weekdays[weekday]}`}
      title={`افزودن جلسه برای ${classroom.name} در ${weekdays[weekday]}`}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-black opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <Plus size={13} aria-hidden="true" /> افزودن جلسه
      </span>
    </button>
  );
}

function LeaveFrozenTag({
  leave,
  compact = false,
}: {
  leave: TeacherLeaveRequest;
  compact?: boolean;
}) {
  const { formatDate } = useLocale();

  return (
    <span
      className={`mt-1 inline-flex rounded bg-amber-100 py-0.5 font-black text-amber-800 dark:bg-amber-500/20 dark:text-amber-100 ${
        compact ? "px-1 text-[9px]" : "px-2 text-[10px]"
      }`}
    >
      منجمد در مرخصی · {formatDate(leave.startDate)} تا {formatDate(leave.endDate)}
    </span>
  );
}

function ScheduleMatrixCell({
  entry,
  leave,
  canEdit,
  canCreate,
  canArchive,
  canDelete,
  showOrganization,
  onEdit,
  onCopy,
  onArchive,
  onDelete,
  onOpenPlan,
  onDragStart,
  onDragEnd,
}: {
  entry: ScheduleEntry;
  leave?: TeacherLeaveRequest;
  showOrganization: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canArchive: boolean;
  canDelete: boolean;
  onEdit: (entry: ScheduleEntry) => void;
  onCopy: (entry: ScheduleEntry) => void;
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
        {leave ? <LeaveFrozenTag leave={leave} compact /> : null}
        {showOrganization ? (
          <span className="mt-1 block scale-90 origin-right">
            <OrganizationTag organization={entry.organization} compact />
          </span>
        ) : null}
      </button>
      {canCreate || canEdit || canArchive || canDelete ? (
        <div className="mt-1 flex gap-0.5">
          {canCreate ? (
            <button
              type="button"
              aria-label={`تکرار ${entry.title}`}
              onClick={() => onCopy(entry)}
              className="rounded p-1 text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <Copy size={12} />
            </button>
          ) : null}
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

function ScheduleTimeBlockBoard({
  entries,
  classes,
  timeBlocks,
  onOpenDetails,
  leaveForEntry,
}: {
  entries: ScheduleEntry[];
  classes: EducationClass[];
  timeBlocks: ScheduleTimeBlock[];
  onOpenDetails: (entry: ScheduleEntry) => void;
  leaveForEntry: (entry: ScheduleEntry) => TeacherLeaveRequest | undefined;
}) {
  const slots = useMemo(() => {
    const known = timeBlocks.map((block) => ({
      id: block.id,
      label: block.name,
      startTime: block.startTime,
      endTime: block.endTime,
      partOfDay: block.partOfDay,
    }));
    const keys = new Set(known.map((block) => `${block.startTime}-${block.endTime}`));
    entries.forEach((entry) => {
      const key = `${entry.startTime}-${entry.endTime}`;
      if (keys.has(key)) return;
      keys.add(key);
      known.push({
        id: `session-${key}`,
        label: `${entry.startTime} تا ${entry.endTime}`,
        startTime: entry.startTime,
        endTime: entry.endTime,
        partOfDay: entry.startTime < "12:00" ? "AM" : "PM",
      });
    });
    return known.sort((left, right) => {
      const groupOrder = left.partOfDay === right.partOfDay ? 0 : left.partOfDay === "AM" ? -1 : 1;
      return groupOrder || left.startTime.localeCompare(right.startTime);
    });
  }, [entries, timeBlocks]);
  const morningSlots = slots.filter((slot) => slot.partOfDay === "AM");
  const afternoonSlots = slots.filter((slot) => slot.partOfDay === "PM");
  const classRows = useMemo(() => {
    const known = classes.map((classroom) => ({ id: classroom.id, name: classroom.name }));
    const knownIds = new Set(known.map((classroom) => classroom.id));
    entries.forEach((entry) => {
      if (!entry.classroom || knownIds.has(entry.classroom.id)) return;
      knownIds.add(entry.classroom.id);
      known.push({ id: entry.classroom.id, name: entry.classroom.name });
    });
    return known.sort((left, right) => left.name.localeCompare(right.name, "fa"));
  }, [classes, entries]);
  if (!slots.length)
    return <EmptyState title="برای نمایش زمان‌بندی، ابتدا بازه یا جلسه‌ای ثبت کنید." />;

  return (
    <div className="overflow-x-auto p-3" dir="rtl">
      <table
        className="min-w-[72rem] border-separate border-spacing-0 overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-right text-sm text-ink"
        aria-label="برنامه هفتگی بر اساس روز، کلاس و بازه زمانی"
      >
        <thead className="sticky top-0 z-30">
          <tr>
            <th
              rowSpan={2}
              className="sticky right-0 z-20 w-28 border-s border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-3 text-sm font-black text-ink"
            >
              روز
            </th>
            <th
              rowSpan={2}
              className="sticky right-28 z-20 w-40 border-s border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-3 text-sm font-black text-ink"
            >
              کلاس
            </th>
            {morningSlots.length ? (
              <th
                colSpan={morningSlots.length}
                className="border-s border-b border-sky-500/20 bg-sky-500/10 px-3 py-3 text-center text-sm font-black text-sky-800 dark:text-sky-200"
              >
                صبح
              </th>
            ) : null}
            {afternoonSlots.length ? (
              <th
                colSpan={afternoonSlots.length}
                className="border-s border-b border-amber-500/20 bg-amber-500/10 px-3 py-3 text-center text-sm font-black text-amber-800 dark:text-amber-200"
              >
                عصر
              </th>
            ) : null}
          </tr>
          <tr>
            {slots.map((slot) => (
              <th
                key={slot.id}
                className="min-w-40 border-s border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-2 py-3 text-center text-xs font-bold text-ink"
              >
                <p className="truncate text-xs font-black text-ink">{slot.label}</p>
                <p className="mt-0.5 text-[10px] font-bold text-slate-500" dir="ltr">
                  {slot.startTime}–{slot.endTime}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayWeekdays.flatMap((weekday) =>
            classRows.map((classroom, classIndex) => {
              const isDayStart = classIndex === 0;
              const dayTone =
                weekday % 2
                  ? "bg-sky-500/[.035] dark:bg-sky-400/[.045]"
                  : "bg-amber-500/[.025] dark:bg-amber-400/[.035]";
              const dayBoundary = isDayStart
                ? "border-t-4 border-brand/45 dark:border-brand/60"
                : "";
              return (
                <tr key={`${weekday}-${classroom.id}`} className={`align-top ${dayTone}`}>
                  {classIndex === 0 ? (
                    <th
                      rowSpan={classRows.length}
                      scope="rowgroup"
                      className={`sticky right-0 z-10 border-s border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-3 align-middle text-sm font-black text-ink ${dayBoundary}`}
                    >
                      {weekdays[weekday]}
                    </th>
                  ) : null}
                  <th
                    scope="row"
                    className={`sticky right-28 z-10 border-s border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-3 text-xs font-black text-ink ${dayBoundary}`}
                  >
                    {classroom.name}
                  </th>
                  {slots.map((slot) => {
                    const cellEntries = entries.filter(
                      (entry) =>
                        entry.weekday === weekday &&
                        entry.classroom?.id === classroom.id &&
                        entry.startTime === slot.startTime &&
                        entry.endTime === slot.endTime,
                    );
                    return (
                      <td
                        key={slot.id}
                        className={`min-h-16 border-s border-b border-[rgb(var(--border-subtle))] p-1.5 ${dayBoundary}`}
                      >
                        {cellEntries.map((entry) => {
                          const leave = leaveForEntry(entry);
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => onOpenDetails(entry)}
                              className="mb-1 w-full rounded-lg border border-brand/15 bg-brand/5 px-2 py-1.5 text-right transition hover:border-brand/45 hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              <span className="block truncate text-[11px] font-black text-ink">
                                {entry.title}
                              </span>
                              {leave ? (
                                <span className="mt-1 block text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                  مرخصی دبیر
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            }),
          )}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleEntryCard({
  entry,
  leave,
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
  leave?: TeacherLeaveRequest;
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
          {leave ? <LeaveFrozenTag leave={leave} /> : null}
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
  leave,
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
  leave?: TeacherLeaveRequest;
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

      {leave ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/30 dark:bg-amber-500/10">
          <p className="text-xs font-black text-amber-900 dark:text-amber-100">
            جلسه در بازه مرخصی دبیر منجمد است
          </p>
          <LeaveFrozenTag leave={leave} />
        </section>
      ) : null}

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
  timeBlockGroups,
  organizations,
  classes,
  isSaving,
  allowMultiple,
  onCancel,
  onSubmit,
}: {
  initial: ScheduleDraft;
  timeBlocks: ScheduleTimeBlock[];
  timeBlockGroups: ScheduleTimeBlockGroup[];
  organizations: Array<{ id: string; name: string }>;
  classes: Array<{
    id: string;
    name: string;
    organization: { id: string };
    books: Array<{ id: string; title: string; teacher: { id: string; name: string } }>;
  }>;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: ScheduleDraft[]) => Promise<void>;
  allowMultiple: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [occurrences, setOccurrences] = useState(() => [
    { weekday: initial.weekday, startTime: initial.startTime, endTime: initial.endTime },
  ]);
  const [attempted, setAttempted] = useState(false);
  const [selectedTimeBlockGroupId, setSelectedTimeBlockGroupId] = useState("");
  const invalidTime = occurrences.some((item) => item.startTime >= item.endTime);
  const canSubmit = Boolean(
    draft.organizationId &&
    draft.title.trim() &&
    !invalidTime &&
    (!draft.classroomId || draft.classBookId),
  );
  const selectedClass = classes.find((item) => item.id === draft.classroomId);
  const update = (changes: Partial<ScheduleDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));
  const selectedTimeBlockGroup = timeBlockGroups.find(
    (group) => group.id === selectedTimeBlockGroupId,
  );
  const visibleTimeBlocks = timeBlocks.filter(
    (block) => block.group.id === selectedTimeBlockGroupId,
  );
  useEffect(() => {
    if (
      selectedTimeBlockGroupId &&
      timeBlockGroups.some((group) => group.id === selectedTimeBlockGroupId)
    )
      return;
    setSelectedTimeBlockGroupId(timeBlockGroups[0]?.id ?? "");
  }, [selectedTimeBlockGroupId, timeBlockGroups]);

  return (
    <form
      className="grid gap-5 lg:grid-cols-2"
      dir="rtl"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (canSubmit)
          void onSubmit(
            occurrences.map((occurrence) => ({
              ...draft,
              ...occurrence,
              title: draft.title.trim(),
            })),
          );
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
        <div className="grid gap-3" aria-label="نوبت‌های هفتگی جلسه">
          {occurrences.map((occurrence, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm">نوبت {index + 1}</strong>
                {allowMultiple && occurrences.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setOccurrences((items) => items.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    حذف
                  </Button>
                ) : null}
              </div>
              <label className="grid gap-1.5 text-sm font-bold">
                روز هفته
                <AdaptiveSelect
                  value={occurrence.weekday}
                  onChange={(event) =>
                    setOccurrences((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, weekday: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                >
                  {weekdays.map((label, weekday) => (
                    <option key={label} value={weekday}>
                      {label}
                    </option>
                  ))}
                </AdaptiveSelect>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-bold">
                  شروع
                  <Input
                    type="time"
                    value={occurrence.startTime}
                    onChange={(event) =>
                      setOccurrences((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, startTime: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold">
                  پایان
                  <Input
                    type="time"
                    value={occurrence.endTime}
                    onChange={(event) =>
                      setOccurrences((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, endTime: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
          {allowMultiple ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() =>
                  setOccurrences((items) => [
                    ...items,
                    { ...items[0], weekday: (items[items.length - 1].weekday + 1) % 7 },
                  ])
                }
              >
                روز دیگر
              </Button>
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() =>
                  setOccurrences((items) => [...items, { ...items[items.length - 1] }])
                }
              >
                نوبت دیگر در همان روز
              </Button>
            </div>
          ) : null}
        </div>
        {timeBlockGroups.length ? (
          <div className="grid gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/45 p-3">
            <label className="grid gap-1.5 text-sm font-bold">
              ۱. گروه بازه زمانی
              <AdaptiveSelect
                value={selectedTimeBlockGroupId}
                onChange={(event) => setSelectedTimeBlockGroupId(event.target.value)}
                className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {timeBlockGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </AdaptiveSelect>
            </label>
            <label className="grid gap-1.5 text-sm font-bold">
              ۲. بازه زمانی آماده
              <AdaptiveSelect
                value=""
                disabled={!selectedTimeBlockGroup || !visibleTimeBlocks.length}
                onChange={(event) => {
                  const block = timeBlocks.find((item) => item.id === event.target.value);
                  if (block)
                    setOccurrences((items) =>
                      items.map((item, index) =>
                        index === items.length - 1
                          ? { ...item, startTime: block.startTime, endTime: block.endTime }
                          : item,
                      ),
                    );
                }}
                className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">
                  {visibleTimeBlocks.length
                    ? "یک بازه را برای اعمال زمان انتخاب کنید"
                    : "در این گروه بازه‌ای ثبت نشده است"}
                </option>
                {visibleTimeBlocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name} · {block.startTime} تا {block.endTime}
                  </option>
                ))}
              </AdaptiveSelect>
            </label>
          </div>
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
      <div className="flex flex-col-reverse gap-2 lg:col-span-2 sm:flex-row sm:justify-end">
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
      <h3 className="text-sm font-black text-ink">الگوهای برنامه</h3>
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
        <ul className="mt-3 grid max-h-72 gap-1.5 overflow-y-auto pe-1 [scrollbar-width:thin]">
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
              <div className="flex flex-wrap gap-1">
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  onClick={() => onRemove(template)}
                >
                  <Trash2 size={13} /> حذف
                </Button>
              </div>
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
  groups,
  organizationId,
  saving,
  removing,
  onCreate,
  onCreateGroup,
  onRemove,
  onRemoveGroup,
}: {
  blocks: ScheduleTimeBlock[];
  groups: ScheduleTimeBlockGroup[];
  organizationId?: string;
  saving: boolean;
  removing: boolean;
  onCreate: (draft: {
    organizationId: string;
    groupId: string;
    name: string;
    startTime: string;
    endTime: string;
  }) => void;
  onCreateGroup: (draft: { organizationId: string; name: string }) => void;
  onRemove: (block: ScheduleTimeBlock) => void;
  onRemoveGroup: (group: ScheduleTimeBlockGroup) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const valid = Boolean(organizationId && groupId && name.trim() && startTime < endTime);
  useEffect(() => {
    if (groupId && groups.some((group) => group.id === groupId)) return;
    setGroupId(groups[0]?.id ?? "");
  }, [groupId, groups]);
  return (
    <Card className="p-4" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
          <Clock3 size={17} />
        </span>
        <div>
          <h3 className="text-sm font-black text-ink">گروه‌ها و بازه‌های زمانی</h3>
          <p className="text-[11px] text-slate-500">
            اول گروه بسازید، سپس بازه‌های آن را در جلسه انتخاب کنید.
          </p>
        </div>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!organizationId || !groupName.trim()) return;
          onCreateGroup({ organizationId, name: groupName.trim() });
          setGroupName("");
        }}
      >
        <Input
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="مثلاً پایه دهم یا نوبت صبح"
          aria-label="نام گروه بازه زمانی"
        />
        <Button
          type="submit"
          variant="soft"
          disabled={!organizationId || !groupName.trim() || saving}
        >
          <Plus size={15} /> گروه
        </Button>
      </form>
      <form
        className="mt-3 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!organizationId || !valid) return;
          onCreate({ organizationId, groupId, name: name.trim(), startTime, endTime });
          setName("");
        }}
      >
        <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
          گروه
          <AdaptiveSelect
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            disabled={!groups.length}
            className="h-10 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink"
          >
            <option value="">ابتدا یک گروه بسازید</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </AdaptiveSelect>
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
          نام بازه
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً زنگ اول"
            aria-label="نام بازه زمانی"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            شروع
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              aria-label="شروع بازه زمانی"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            پایان
            <Input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              aria-label="پایان بازه زمانی"
            />
          </label>
        </div>
        <Button type="submit" variant="soft" disabled={!valid || saving}>
          افزودن بازه
        </Button>
      </form>
      {groups.length ? (
        <div
          className="mt-4 grid max-h-72 gap-4 overflow-y-auto pe-1 [scrollbar-width:thin]"
          aria-label="بازه‌های زمانی ذخیره‌شده"
        >
          {groups.map((group) => {
            const groupBlocks = blocks
              .filter((block) => block.group.id === group.id)
              .sort((left, right) => left.startTime.localeCompare(right.startTime));
            return (
              <section key={group.id} aria-labelledby={`time-block-group-${group.id}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                  <h4 id={`time-block-group-${group.id}`} className="text-xs font-black text-ink">
                    {group.name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    {groupBlocks.length.toLocaleString("fa-IR")} بازه
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ms-auto text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    disabled={removing || Boolean(groupBlocks.length)}
                    title={groupBlocks.length ? "ابتدا بازه‌های گروه را حذف کنید" : "حذف گروه"}
                    aria-label={`حذف گروه ${group.name}`}
                    onClick={() => onRemoveGroup(group)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
                {groupBlocks.length ? (
                  <ul className="grid gap-1.5">
                    {groupBlocks.map((block) => (
                      <li
                        key={block.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[rgb(var(--surface-muted))] px-2 py-1.5 text-xs"
                      >
                        <span className="min-w-0 truncate font-bold text-ink">
                          {block.name}{" "}
                          <b className="font-normal text-slate-500" dir="ltr">
                            {block.startTime}–{block.endTime}
                          </b>
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
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
                  <p className="text-[11px] text-slate-500">
                    هنوز بازه‌ای در این گروه ثبت نشده است.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          برای افزودن بازه، ابتدا یک گروه بسازید.
        </p>
      )}
    </Card>
  );
}

function ScheduleAcademicSetupGate({
  canManage,
  activeYear,
  terms,
  selectedTermId,
  onTermChange,
  entries,
  attendanceSessions,
  pendingAttendance,
  pendingAttendanceCount,
  selectedEntryIds,
  selectedSessionIds,
  onEntryIdsChange,
  onSessionIdsChange,
  onOpenAcademicCycles,
  onReconcile,
  reconciling,
}: {
  canManage: boolean;
  activeYear: { id: string; name: string } | null | undefined;
  terms: LegacyAcademicTerm[];
  selectedTermId: string;
  onTermChange: (id: string) => void;
  entries: Array<{
    id: string;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    classroomName: string;
    teacherName: string;
  }>;
  attendanceSessions: Array<{
    id: string;
    title: string;
    sessionDate: string;
    operationalDate: string | null;
    contextType: string;
    assignedStaffName: string;
  }>;
  pendingAttendance: Array<{
    entryId: string;
    termId: string;
    date: string;
    title: string;
    classroomName: string;
  }>;
  pendingAttendanceCount: number;
  selectedEntryIds: string[];
  selectedSessionIds: string[];
  onEntryIdsChange: (ids: string[]) => void;
  onSessionIdsChange: (ids: string[]) => void;
  onOpenAcademicCycles: () => void;
  onReconcile: () => void;
  reconciling: boolean;
}) {
  const toggle = (ids: string[], id: string, onChange: (next: string[]) => void) =>
    onChange(ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id]);
  const requiresReconciliation = entries.length > 0 || attendanceSessions.length > 0;
  const selectedTerm = terms.find((term) => term.id === selectedTermId);
  const eligibleAttendanceSessions = selectedTerm
    ? attendanceSessions.filter((session) => {
        const date = session.operationalDate ?? session.sessionDate.slice(0, 10);
        return date >= selectedTerm.startsOn && date <= selectedTerm.endsOn;
      })
    : [];
  const excludedAttendanceCount = attendanceSessions.length - eligibleAttendanceSessions.length;
  const selectedEntryCount = selectedEntryIds.filter((id) =>
    entries.some((entry) => entry.id === id),
  ).length;
  const selectedSessionCount = selectedSessionIds.filter((id) =>
    eligibleAttendanceSessions.some((session) => session.id === id),
  ).length;
  const selectedCount = selectedEntryCount + selectedSessionCount;
  const selectTerm = (termId: string) => {
    onTermChange(termId);
    // A previous term's selected attendance records must never be submitted
    // with the newly selected term. The operator chooses the new set explicitly.
    onSessionIdsChange([]);
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-setup-title"
    >
      <Card className="max-h-[min(46rem,calc(100dvh-2rem))] w-full max-w-3xl overflow-y-auto border-brand/30 bg-[rgb(var(--surface-card))] p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-brand">راه‌اندازی الزامی برنامه</p>
            <h1 id="schedule-setup-title" className="mt-1 text-xl font-black">
              {activeYear ? "تکمیل اتصال سال تحصیلی و حضور" : "برنامه هنوز سال تحصیلی ندارد"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              تا زمان تکمیل این مراحل، برنامه قابل ویرایش نیست تا هیچ جلسه یا حضور و غیابی بدون سال
              و نیم‌سال ثبت نشود.
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            مرحلهٔ {activeYear ? (requiresReconciliation ? "۲" : "۳") : "۱"} از ۳
          </span>
        </div>
        {!canManage ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          >
            مدیر یا مسئول آموزش دینی باید سال تحصیلی، نیم‌سال و تطبیق داده‌های گذشته را کامل کند. پس
            از آن برنامه برای شما باز می‌شود.
          </p>
        ) : !activeYear ? (
          <section className="mt-5 rounded-2xl border border-[rgb(var(--border-subtle))] p-4">
            <h2 className="font-black">۱. سال و نیم‌سال‌ها را بسازید و فعال کنید</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              ابتدا یک سال تحصیلی بسازید، حداقل دو نیم‌سال بدون هم‌پوشانی تعریف کنید و سپس سال را
              فعال نمایید.
            </p>
            <Button className="mt-4" onClick={onOpenAcademicCycles}>
              <GraduationCap size={17} /> ساخت سال تحصیلی و نیم‌سال
            </Button>
          </section>
        ) : requiresReconciliation ? (
          <section className="mt-5 space-y-4" aria-labelledby="academic-reconciliation-title">
            <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4">
              <p className="text-xs font-black text-brand">مرحلهٔ ۲ · انتساب سوابق قبلی</p>
              <h2 id="academic-reconciliation-title" className="mt-1 font-black">
                ابتدا نیم‌سال را انتخاب کنید، سپس فقط موارد همان بازه را تأیید کنید
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                این کار سابقه را جابه‌جا یا بازنویسی نمی‌کند؛ فقط سال و نیم‌سال آن را ثبت و در
                تاریخچه پیگیری می‌کند.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="grid gap-1 text-sm font-bold">
                نیم‌سال مقصد در {activeYear.name}
                <AdaptiveSelect
                  value={selectedTermId}
                  onChange={(event) => selectTerm(event.target.value)}
                  aria-describedby="academic-term-help"
                >
                  <option value="">انتخاب نیم‌سال</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name} · {term.startsOn} تا {term.endsOn}
                    </option>
                  ))}
                </AdaptiveSelect>
                <span id="academic-term-help" className="text-xs font-normal text-slate-500">
                  سوابق حضور بر اساس تاریخ واقعی‌شان فیلتر می‌شوند.
                </span>
              </label>
              {selectedTerm ? (
                <div className="rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  <b className="block text-ink">{selectedTerm.name}</b>
                  {selectedTerm.startsOn} تا {selectedTerm.endsOn}
                </div>
              ) : null}
            </div>

            {!selectedTermId ? (
              <EmptyState
                title="یک نیم‌سال انتخاب کنید"
                description="پس از انتخاب نیم‌سال، سامانه فقط سابقه‌های حضورِ قابل‌انتساب به همان بازه را آماده می‌کند."
              />
            ) : (
              <>
                <div className="grid gap-3 lg:grid-cols-2">
                  <fieldset className="rounded-2xl border border-[rgb(var(--border-subtle))] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <legend className="px-1 text-sm font-black">
                        جلسه‌های برنامهٔ بدون نیم‌سال ({entries.length})
                      </legend>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-2 text-xs"
                        onClick={() =>
                          onEntryIdsChange(
                            selectedEntryCount === entries.length
                              ? []
                              : entries.map((entry) => entry.id),
                          )
                        }
                      >
                        {selectedEntryCount === entries.length ? "لغو انتخاب همه" : "انتخاب همه"}
                      </Button>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      این جلسه‌های هفتگی به نیم‌سال انتخاب‌شده وصل می‌شوند.
                    </p>
                    <div className="mt-3 max-h-56 space-y-1 overflow-y-auto" role="list">
                      {entries.map((entry) => (
                        <label
                          key={entry.id}
                          className="flex cursor-pointer items-start gap-2 rounded-xl p-2 text-sm hover:bg-[rgb(var(--surface-muted))] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEntryIds.includes(entry.id)}
                            onChange={() => toggle(selectedEntryIds, entry.id, onEntryIdsChange)}
                          />
                          <span>
                            <b>{entry.title}</b>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {entry.classroomName} · {entry.teacherName} ·{" "}
                              {weekdays[entry.weekday]} · {entry.startTime} تا {entry.endTime}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="rounded-2xl border border-[rgb(var(--border-subtle))] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <legend className="px-1 text-sm font-black">
                        سوابق حضورِ قابل‌انتساب ({eligibleAttendanceSessions.length})
                      </legend>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-2 text-xs"
                        onClick={() =>
                          onSessionIdsChange(
                            selectedSessionCount === eligibleAttendanceSessions.length
                              ? []
                              : eligibleAttendanceSessions.map((session) => session.id),
                          )
                        }
                      >
                        {selectedSessionCount === eligibleAttendanceSessions.length
                          ? "لغو انتخاب همه"
                          : "انتخاب همهٔ قابل‌انتساب"}
                      </Button>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      فقط تاریخ‌های داخل بازهٔ {selectedTerm?.name} نمایش داده می‌شوند.
                    </p>
                    {excludedAttendanceCount ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        {excludedAttendanceCount.toLocaleString("fa-IR")} سابقه خارج از این نیم‌سال
                        است؛ آن‌ها را در نیم‌سال درست خود منتسب کنید.
                      </p>
                    ) : null}
                    <div className="mt-3 max-h-56 space-y-1 overflow-y-auto" role="list">
                      {eligibleAttendanceSessions.map((session) => (
                        <label
                          key={session.id}
                          className="flex cursor-pointer items-start gap-2 rounded-xl p-2 text-sm hover:bg-[rgb(var(--surface-muted))] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSessionIds.includes(session.id)}
                            onChange={() =>
                              toggle(selectedSessionIds, session.id, onSessionIdsChange)
                            }
                          />
                          <span>
                            <b>{session.title}</b>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {session.operationalDate ?? session.sessionDate.slice(0, 10)} ·{" "}
                              {session.assignedStaffName || "ثبت‌کننده نامشخص"}
                            </span>
                          </span>
                        </label>
                      ))}
                      {!eligibleAttendanceSessions.length ? (
                        <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm text-slate-500">
                          سابقهٔ حضورِ بدون نیم‌سال در این بازه وجود ندارد.
                        </p>
                      ) : null}
                    </div>
                  </fieldset>
                </div>

                <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]/95 pt-4 backdrop-blur">
                  <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
                    <b className="text-ink">{selectedCount.toLocaleString("fa-IR")}</b> مورد برای
                    انتساب انتخاب شده است.
                  </p>
                  <Button disabled={!selectedCount || reconciling} onClick={onReconcile}>
                    {reconciling ? "در حال ثبت انتساب…" : "تأیید و ثبت انتساب"}
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-950/20">
            <h2 className="font-black text-amber-950 dark:text-amber-100">
              ۳. حضور جلسه‌های گذشته را کامل کنید
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-200">
              {pendingAttendanceCount
                ? `${pendingAttendanceCount.toLocaleString("fa-IR")} رخداد برنامه تا امروز هنوز جلسهٔ حضور ندارد. ابتدا آن‌ها را در دفتر حضور تکمیل کنید.`
                : "در حال بررسی رخدادهای گذشته…"}
            </p>
            {pendingAttendance.length ? (
              <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto text-sm text-amber-950 dark:text-amber-100">
                {pendingAttendance.slice(0, 12).map((item) => (
                  <li key={`${item.entryId}:${item.date}`}>
                    {item.date} · {item.title} · {item.classroomName}
                  </li>
                ))}
              </ul>
            ) : null}
            <Button
              className="mt-4"
              onClick={() => window.location.assign("/admin/attendance?section=sessions")}
            >
              رفتن به دفتر حضور و غیاب
            </Button>
          </section>
        )}
      </Card>
    </div>
  );
}

function AcademicCycleManager({
  organizationId,
  data,
  loading,
  onChanged,
}: {
  organizationId: string;
  data?: {
    years: Array<{ id: string; name: string; startsOn: string; endsOn: string; state: string }>;
    terms: LegacyAcademicTerm[];
  };
  loading: boolean;
  onChanged: () => void;
}) {
  const { formatDate } = useLocale();
  const [yearName, setYearName] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [termName, setTermName] = useState("");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [yearId, setYearId] = useState("");
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{
    kind: "year" | "term";
    id: string;
    name: string;
  } | null>(null);
  const history = useQuery({
    queryKey: ["schedule", "academic-cycle-history", historyTarget?.kind, historyTarget?.id],
    queryFn: () =>
      historyTarget?.kind === "year"
        ? listLegacyAcademicYearHistory(historyTarget.id)
        : listLegacyAcademicTermHistory(historyTarget!.id),
    enabled: Boolean(historyTarget),
  });
  const changed = () => {
    onChanged();
    notify("چرخه تحصیلی به‌روزرسانی شد.", "success");
  };
  const createYear = useMutation({
    mutationFn: createLegacyAcademicYear,
    onSuccess: changed,
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ثبت سال انجام نشد.", "error"),
  });
  const createTerm = useMutation({
    mutationFn: createLegacyAcademicTerm,
    onSuccess: changed,
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ثبت نیم‌سال انجام نشد.", "error"),
  });
  const changeYear = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "activate" | "archive" }) =>
      changeLegacyAcademicYearState(id, action),
    onSuccess: changed,
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر وضعیت سال انجام نشد.", "error"),
  });
  const changeTerm = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "archive" | "reopen" | "close-correction";
    }) => changeLegacyAcademicTermState(id, action),
    onSuccess: changed,
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر وضعیت نیم‌سال انجام نشد.", "error"),
  });
  const updateYear = useMutation({
    mutationFn: ({
      id,
      name,
      startsOn,
      endsOn,
    }: {
      id: string;
      name: string;
      startsOn: string;
      endsOn: string;
    }) => updateLegacyAcademicYear(id, { name, startsOn, endsOn }),
    onSuccess: () => {
      setEditingYearId(null);
      setYearName("");
      setYearStart("");
      setYearEnd("");
      changed();
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ویرایش سال انجام نشد.", "error"),
  });
  const updateTerm = useMutation({
    mutationFn: ({
      id,
      name,
      startsOn,
      endsOn,
    }: {
      id: string;
      name: string;
      startsOn: string;
      endsOn: string;
    }) => updateLegacyAcademicTerm(id, { name, startsOn, endsOn }),
    onSuccess: () => {
      setEditingTermId(null);
      setTermName("");
      setTermStart("");
      setTermEnd("");
      changed();
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ویرایش نیم‌سال انجام نشد.", "error"),
  });
  if (loading) return <LoadingState label="در حال دریافت سال‌های تحصیلی…" />;
  const years = data?.years ?? [];
  const currentYearId =
    yearId || years.find((year) => year.state === "ACTIVE")?.id || years[0]?.id || "";
  return (
    <div className="grid gap-5" dir="rtl">
      <Card className="grid gap-3 p-4">
        <h3 className="font-black">{editingYearId ? "ویرایش سال تحصیلی" : "سال تحصیلی جدید"}</h3>
        <Input
          value={yearName}
          onChange={(event) => setYearName(event.target.value)}
          placeholder="مثلاً سال تحصیلی ۱۴۰۵–۱۴۰۶"
          aria-label="نام سال تحصیلی"
        />
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            calendar="persian"
            value={yearStart}
            onChange={setYearStart}
            ariaLabel="شروع سال تحصیلی"
            required
          />
          <DatePicker
            calendar="persian"
            value={yearEnd}
            onChange={setYearEnd}
            ariaLabel="پایان سال تحصیلی"
            min={yearStart}
            required
          />
        </div>
        <Button
          disabled={
            !organizationId ||
            !yearName ||
            !yearStart ||
            !yearEnd ||
            createYear.isPending ||
            updateYear.isPending
          }
          onClick={() =>
            editingYearId
              ? updateYear.mutate({
                  id: editingYearId,
                  name: yearName,
                  startsOn: yearStart,
                  endsOn: yearEnd,
                })
              : createYear.mutate({
                  organizationId,
                  name: yearName,
                  startsOn: yearStart,
                  endsOn: yearEnd,
                })
          }
        >
          {editingYearId ? "ذخیره تغییرهای سال" : "ایجاد سال پیش‌نویس"}
        </Button>
      </Card>
      <Card className="grid gap-3 p-4">
        <h3 className="font-black">{editingTermId ? "ویرایش نیم‌سال" : "نیم‌سال جدید"}</h3>
        <AdaptiveSelect
          value={currentYearId}
          onChange={(event) => setYearId(event.target.value)}
          aria-label="سال تحصیلی نیم‌سال"
        >
          <option value="">انتخاب سال</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </AdaptiveSelect>
        <Input
          value={termName}
          onChange={(event) => setTermName(event.target.value)}
          placeholder="مثلاً نیم‌سال اول"
          aria-label="نام نیم‌سال"
        />
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            calendar="persian"
            value={termStart}
            onChange={setTermStart}
            ariaLabel="شروع نیم‌سال"
            required
          />
          <DatePicker
            calendar="persian"
            value={termEnd}
            onChange={setTermEnd}
            ariaLabel="پایان نیم‌سال"
            min={termStart}
            required
          />
        </div>
        <Button
          disabled={
            !currentYearId ||
            !termName ||
            !termStart ||
            !termEnd ||
            createTerm.isPending ||
            updateTerm.isPending
          }
          onClick={() =>
            editingTermId
              ? updateTerm.mutate({
                  id: editingTermId,
                  name: termName,
                  startsOn: termStart,
                  endsOn: termEnd,
                })
              : createTerm.mutate({
                  academicYearId: currentYearId,
                  name: termName,
                  startsOn: termStart,
                  endsOn: termEnd,
                })
          }
        >
          {editingTermId ? "ذخیره تغییرهای نیم‌سال" : "افزودن نیم‌سال"}
        </Button>
      </Card>
      <section className="grid gap-3" aria-label="سال‌ها و نیم‌سال‌های ثبت‌شده">
        {years.map((year) => (
          <Card key={year.id} className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong>{year.name}</strong>
                <p className="text-xs text-slate-500">
                  {year.startsOn} تا {year.endsOn}
                </p>
              </div>
              <Button
                variant="soft"
                disabled={changeYear.isPending}
                onClick={() =>
                  changeYear.mutate({
                    id: year.id,
                    action: year.state === "ACTIVE" ? "archive" : "activate",
                  })
                }
              >
                {year.state === "ACTIVE" ? "بایگانی" : "فعال‌سازی"}
              </Button>
              {year.state !== "ARCHIVED" ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingYearId(year.id);
                    setYearName(year.name);
                    setYearStart(year.startsOn);
                    setYearEnd(year.endsOn);
                  }}
                >
                  ویرایش
                </Button>
              ) : null}
              <Button
                variant="ghost"
                onClick={() => setHistoryTarget({ kind: "year", id: year.id, name: year.name })}
              >
                تاریخچه
              </Button>
            </div>
            <ul className="grid gap-2">
              {(data?.terms ?? [])
                .filter((term) => term.academicYearId === year.id)
                .map((term) => (
                  <li
                    key={term.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[rgb(var(--surface-muted))] p-2 text-sm"
                  >
                    <span>
                      {term.name} · {term.startsOn} تا {term.endsOn}
                    </span>
                    <Button
                      variant="ghost"
                      disabled={changeTerm.isPending}
                      onClick={() =>
                        changeTerm.mutate({
                          id: term.id,
                          action: term.correctionOpen
                            ? "close-correction"
                            : term.state === "ARCHIVED"
                              ? "reopen"
                              : "archive",
                        })
                      }
                    >
                      {term.correctionOpen
                        ? "بستن اصلاح"
                        : term.state === "ARCHIVED"
                          ? "اصلاح تاریخی"
                          : "بایگانی"}
                    </Button>
                    {term.state !== "ARCHIVED" || term.correctionOpen ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingTermId(term.id);
                          setYearId(year.id);
                          setTermName(term.name);
                          setTermStart(term.startsOn);
                          setTermEnd(term.endsOn);
                        }}
                      >
                        ویرایش
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setHistoryTarget({ kind: "term", id: term.id, name: term.name })
                      }
                    >
                      تاریخچه
                    </Button>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
        {historyTarget ? (
          <Card className="grid gap-3 p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-black">تاریخچهٔ {historyTarget.name}</h4>
                <p className="text-xs text-slate-500">
                  رویدادهای ثبت‌شده برای این{" "}
                  {historyTarget.kind === "year" ? "سال تحصیلی" : "نیم‌سال"}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setHistoryTarget(null)}>
                بستن
              </Button>
            </div>
            {history.isLoading ? <LoadingState label="در حال دریافت تاریخچه…" /> : null}
            {history.isError ? (
              <p className="text-sm text-danger">دریافت تاریخچه انجام نشد.</p>
            ) : null}
            {!history.isLoading && !history.isError && !(history.data ?? []).length ? (
              <EmptyState title="رویدادی برای این مورد ثبت نشده است." />
            ) : null}
            {(history.data ?? []).map((event: LegacyAcademicCycleAudit) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[rgb(var(--surface-muted))] p-3 text-sm"
              >
                <strong>{academicCycleAuditLabel(event.action)}</strong>
                <time className="text-xs text-slate-500">
                  {formatDate(event.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
            ))}
          </Card>
        ) : null}
        {!years.length ? <EmptyState title="هنوز سال تحصیلی ثبت نشده است." /> : null}
      </section>
    </div>
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

function legacyWeekdayForIso(iso: string) {
  return (new Date(`${iso}T12:00:00`).getDay() + 1) % 7;
}

function academicCycleAuditLabel(action: string) {
  return (
    (
      {
        created: "ایجاد شد",
        updated: "ویرایش شد",
        activate: "فعال شد",
        archive: "بایگانی شد",
        reopen: "برای اصلاح تاریخی بازگشایی شد",
        "close-correction": "اصلاح تاریخی بسته شد",
      } as Record<string, string>
    )[action] ?? action
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
