import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { ClassBooksModal } from "../components/ClassBooksModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  GraduationCap,
  Archive,
  Pencil,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../../shared/api/api";
import { listOrganizations } from "../../../identity/access/api/access.api";
import { useAuth } from "../../../identity/auth";
import { useModal } from "../../../../shared/ui/modal";
import { notify } from "../../../../shared/ui/notifications";
import { OrganizationTag } from "../../../../shared/ui/organization-tag";
import { SpreadsheetTransferLauncher } from "../../../../shared/ui/spreadsheet-transfer-launcher";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../../shared/ui/ui";
import { CollectionToolbar } from "../../../../shared/ui/collection-toolbar";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import {
  createClass,
  deleteClass,
  getClassOptions,
  listClasses,
  setClassBooks,
  setClassEnrollments,
  type ClassDraft,
  type EducationClass,
  updateClass,
} from "../api/classes.api";
import { ClassTransferWorkspace } from "../components/ClassTransferWorkspace";
import { useClassesCopy } from "../model/classes-copy";

const initial = (): ClassDraft => ({
  organizationId: "",
  code: "",
  name: "",
  schoolYear: "1405-1406",
  capacity: 35,
});

export function ClassesPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const modal = useModal();
  const copy = useClassesCopy();
  const isMobile = useIsMobile();
  const canManage = auth.can("classes.manage");
  const canRoster = auth.can("classes.roster.manage");
  const canManageBooks = auth.can("education.catalog.manage");
  const canReadOrganizations = auth.can("organization.read");
  const organizations = useQuery({
    queryKey: ["organizations", "classes"],
    queryFn: listOrganizations,
    enabled: canReadOrganizations,
  });
  const selectedOrganizationId = auth.context?.activeOrganization?.id;
  const classes = useQuery({
    queryKey: ["classes", selectedOrganizationId ?? "all"],
    queryFn: () => listClasses(selectedOrganizationId),
  });
  const organizationOptions = canReadOrganizations
    ? (organizations.data ?? [])
    : (auth.context?.availableOrganizations ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("ACTIVE");
  const selected = (classes.data || []).find((item) => item.id === selectedId) || null;
  const options = useQuery({
    queryKey: ["class-options", selectedId],
    queryFn: () => getClassOptions(selectedId!),
    enabled: !!selectedId,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["classes"] });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ClassDraft }) =>
      id ? updateClass(id, draft) : createClass(draft),
    onSuccess: async (row) => {
      await refresh();
      setSelectedId(row.id);
      notify(copy.saved, "success");
    },
  });
  const remove = useMutation({
    mutationFn: deleteClass,
    onSuccess: async () => {
      await refresh();
      setSelectedId(null);
      notify(copy.deleted, "success");
    },
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EducationClass["status"] }) =>
      updateClass(id, { status }),
    onSuccess: async (row) => {
      await refresh();
      setSelectedId(row.id);
      setStatus(row.status);
      notify(row.status === "ARCHIVED" ? copy.archivedNotice : copy.restoredNotice, "success");
    },
  });
  const saveBooks = useMutation({
    mutationFn: (books: Array<{ bookId: string; teacherId: string }>) =>
      setClassBooks(selectedId!, books),
    onSuccess: async () => {
      await Promise.all([refresh(), options.refetch()]);
      notify(copy.booksSaved, "success");
    },
  });
  const saveRoster = useMutation({
    mutationFn: (studentIds: string[]) => setClassEnrollments(selectedId!, studentIds),
    onSuccess: async () => {
      await Promise.all([refresh(), options.refetch()]);
      notify(copy.rosterSaved, "success");
    },
  });
  const saveAdvisor = useMutation({
    mutationFn: (advisorId: string | null) => updateClass(selectedId!, { advisorId }),
    onSuccess: async () => {
      await Promise.all([refresh(), options.refetch()]);
      notify(copy.advisorSaved, "success");
    },
  });
  const openEditor = (row?: EducationClass) => {
    const draft: ClassDraft = row
      ? {
          organizationId: row.organization.id,
          code: row.code,
          name: row.name,
          schoolYear: normalizeSchoolYear(row.schoolYear),
          capacity: row.capacity,
        }
      : {
          ...initial(),
          organizationId: organizationOptions.length === 1 ? organizationOptions[0].id : "",
        };
    modal.open({
      title: row ? copy.editClass : copy.newClass,
      description: copy.editorDescription,
      size: "lg",
      content: (
        <ClassEditorModal
          initialDraft={draft}
          editingId={row?.id || null}
          organizations={organizationOptions}
          onClose={modal.close}
          onSave={async (next) => {
            await save.mutateAsync({ id: row?.id || null, draft: next });
            modal.close();
          }}
        />
      ),
    });
  };
  const rows = useMemo(() => classes.data || [], [classes.data]);
  const years = useMemo(() => [...new Set(rows.map((row) => row.schoolYear))], [rows]);
  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const term = search.trim().toLocaleLowerCase();
        return (
          (year === "all" || row.schoolYear === year) &&
          (status === "all" || row.status === status) &&
          (!term ||
            [
              row.name,
              row.code,
              row.advisor?.name,
              ...row.books.map((book) => book.teacher.name),
            ].some((value) => value?.toLocaleLowerCase().includes(term)))
        );
      }),
    [rows, search, year, status],
  );
  const needsStudents = rows.filter(
    (row) => row.status === "ACTIVE" && !row.students.length,
  ).length;
  const needsTeacher = rows.filter((row) => row.status === "ACTIVE" && !row.books.length).length;
  const needsAdvisor = rows.filter((row) => row.status === "ACTIVE" && !row.advisor).length;
  const deleteSelected = async () => {
    if (!selected) return;
    try {
      await remove.mutateAsync(selected.id);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CLASS_TIMETABLE_REFERENCED") {
        notify(copy.archiveInstead, "error");
      } else notify(error instanceof Error ? error.message : copy.deleteFailed, "error");
    }
  };
  const detail = (
    <ClassDetail
      classroom={selected}
      options={options.data}
      loading={options.isLoading}
      optionsError={options.isError}
      onRetryOptions={() => void options.refetch()}
      canManage={canManage}
      canManageBooks={canManageBooks}
      canRoster={canRoster}
      canTakeAttendance={auth.can("attendance.manage")}
      onBooks={(books) => saveBooks.mutateAsync(books).then(() => undefined)}
      onRoster={(ids) => saveRoster.mutateAsync(ids).then(() => undefined)}
      onAdvisor={(advisorId) => saveAdvisor.mutateAsync(advisorId).then(() => undefined)}
      onEdit={() => selected && openEditor(selected)}
      onDelete={deleteSelected}
      onStatusChange={(next) =>
        selected
          ? changeStatus.mutateAsync({ id: selected.id, status: next }).then(() => undefined)
          : Promise.resolve()
      }
      changingStatus={changeStatus.isPending}
      deleting={remove.isPending}
    />
  );
  if (classes.isLoading || (canReadOrganizations && organizations.isLoading))
    return <LoadingState label={copy.loading} />;
  if (!auth.can("classes.read")) return <EmptyState title={copy.noAccess} />;
  return (
    <section className="classes-workspace grid min-w-0 gap-3">
      <Card className="classes-directory min-w-0 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">{copy.organizationClasses}</h2>
            <p className="mt-1 text-xs text-slate-500">{copy.listDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{rows.length.toLocaleString(copy.locale)}</Badge>
            {canManage ? (
              <SpreadsheetTransferLauncher
                title={copy.transferTitle}
                description={copy.transferDescription}
                trigger={copy.transfer}
              >
                <ClassTransferWorkspace
                  organizationId={selectedOrganizationId ?? ""}
                  canImport={canManage}
                  canExport={canManage}
                  onCompleted={() => void refresh()}
                />
              </SpreadsheetTransferLauncher>
            ) : null}
            {canManage ? (
              <Button size="sm" onClick={() => openEditor()}>
                <Plus size={15} />
                {copy.newClass}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs" aria-label={copy.needsAttention}>
          <span>
            {copy.needsStudents}: <b>{needsStudents.toLocaleString(copy.locale)}</b>
          </span>
          <span>
            {copy.needsTeacher}: <b>{needsTeacher.toLocaleString(copy.locale)}</b>
          </span>
          <span>
            {copy.needsAdvisor}: <b>{needsAdvisor.toLocaleString(copy.locale)}</b>
          </span>
        </div>
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          searchLabel={copy.searchClasses}
          placeholder={copy.searchClasses}
          resultLabel={copy.results(visible.length)}
          onClear={() => {
            setSearch("");
            setYear("all");
            setStatus("ACTIVE");
          }}
          filters={
            <>
              <label className="flex items-center gap-1 text-xs">
                {copy.schoolYear}
                <select
                  aria-label={copy.schoolYear}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="rounded border bg-transparent px-2 py-1.5"
                >
                  <option value="all">{copy.allYears}</option>
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-xs">
                {copy.status}
                <select
                  aria-label={copy.status}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded border bg-transparent px-2 py-1.5"
                >
                  <option value="ACTIVE">{copy.active}</option>
                  <option value="ARCHIVED">{copy.archived}</option>
                  <option value="all">{copy.allStatuses}</option>
                </select>
              </label>
            </>
          }
        />
        {classes.isError || (canReadOrganizations && organizations.isError) ? (
          <EmptyState
            title={copy.loadFailed}
            action={
              <Button
                onClick={() => {
                  void classes.refetch();
                  void organizations.refetch();
                }}
              >
                {copy.retry}
              </Button>
            }
          />
        ) : null}
        <div className="classes-directory__results grid gap-2">
          {!classes.isError &&
            visible.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-pressed={selectedId === row.id}
                className={`grid min-h-24 gap-2 rounded-lg border p-3 text-start shadow-[var(--shadow-surface)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${selectedId === row.id ? "border-brand bg-brand/5 ring-1 ring-brand/15" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand/40"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-md bg-brand/10 text-brand">
                      <GraduationCap size={18} />
                    </span>
                    <span>
                      <strong className="block text-sm">{row.name}</strong>
                      <small className="text-xs text-slate-500">
                        {row.organization.name} · {row.schoolYear}
                      </small>
                      {auth.hasRole("PLATFORM_ADMIN") ? (
                        <span className="mt-1 block">
                          <OrganizationTag organization={row.organization} compact />
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Badge tone={row.status === "ACTIVE" ? "green" : "neutral"}>
                    {row.status === "ACTIVE" ? copy.active : copy.archived}
                  </Badge>
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  <small className="ms-auto flex items-center gap-1 text-xs text-slate-500">
                    <UsersRound size={13} />
                    {row.enrollmentCount}/{row.capacity}
                  </small>
                </span>
                <small className="text-xs text-slate-500">
                  {copy.advisor}: {row.advisor?.name || copy.notAssigned} ·{" "}
                  {row.books.length.toLocaleString(copy.locale)} {copy.books}
                </small>
              </button>
            ))}
          {!classes.isError && !visible.length ? (
            <EmptyState
              title={rows.length ? copy.noMatches : copy.noClasses}
              action={
                canManage && !rows.length ? (
                  <Button variant="soft" onClick={() => openEditor()}>
                    {copy.createClass}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </div>
      </Card>
      {isMobile ? (
        <ResponsiveDrawer
          open={!!selected}
          onOpenChange={(open) => !open && setSelectedId(null)}
          title={selected?.name || copy.selectClass}
          description={selected ? `${selected.code} · ${selected.schoolYear}` : undefined}
        >
          {selected ? detail : null}
        </ResponsiveDrawer>
      ) : (
        detail
      )}
    </section>
  );
}

function normalizeSchoolYear(value: string) {
  if (value.includes("-")) return value;
  const start = Number(value);
  return Number.isFinite(start) ? `${start}-${start + 1}` : "1405-1406";
}

function ClassDetail({
  classroom,
  options,
  loading,
  optionsError,
  onRetryOptions,
  canManage,
  canManageBooks,
  canRoster,
  canTakeAttendance,
  onBooks,
  onRoster,
  onAdvisor,
  onEdit,
  onDelete,
  onStatusChange,
  changingStatus,
  deleting,
}: {
  classroom: EducationClass | null;
  options?: Awaited<ReturnType<typeof getClassOptions>>;
  loading: boolean;
  optionsError?: boolean;
  onRetryOptions?: () => void;
  canManage: boolean;
  canManageBooks: boolean;
  canRoster: boolean;
  canTakeAttendance: boolean;
  onBooks: (books: Array<{ bookId: string; teacherId: string }>) => Promise<void>;
  onRoster: (ids: string[]) => Promise<void>;
  onAdvisor: (advisorId: string | null) => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onStatusChange: (status: EducationClass["status"]) => Promise<void>;
  changingStatus: boolean;
  deleting: boolean;
}) {
  const modal = useModal();
  const copy = useClassesCopy();
  if (!classroom)
    return (
      <Card className="p-3">
        <p className="text-sm text-slate-500">{copy.selectClass}</p>
      </Card>
    );
  const openBooks = () =>
    options &&
    modal.open({
      title: copy.bookTeachersTitle,
      description: copy.bookTeachersDescription,
      size: "xl",
      content: (
        <ClassBooksModal
          options={options}
          classroom={classroom}
          onSave={onBooks}
          onClose={modal.close}
          canDeleteBooks={canManageBooks}
        />
      ),
    });
  const openRoster = () =>
    options &&
    modal.open({
      title: copy.rosterTitle,
      description: copy.rosterDescription,
      size: "xl",
      content: (
        <ClassRosterModal
          options={options}
          classroom={classroom}
          onSave={onRoster}
          onClose={modal.close}
        />
      ),
    });
  const openAdvisor = () =>
    options &&
    modal.open({
      title: copy.classAdvisor,
      description: copy.advisorDescription,
      content: (
        <ClassAdvisorModal
          advisors={options.advisors}
          value={classroom.advisor?.id || null}
          onSave={onAdvisor}
          onClose={modal.close}
        />
      ),
    });
  const confirmDelete = async () => {
    const confirmed = await modal.confirm({
      title: copy.deleteTitle,
      description: copy.deleteDescription(classroom.name),
      tone: "danger",
      confirmLabel: copy.deleteClass,
      confirmationText: classroom.name,
    });
    if (confirmed) onDelete();
  };
  const confirmStatus = async () => {
    const archiving = classroom.status === "ACTIVE";
    const confirmed = await modal.confirm({
      title: archiving ? copy.archiveClass : copy.restoreClass,
      description: archiving
        ? copy.archiveDescription(classroom.name)
        : copy.restoreDescription(classroom.name),
      confirmLabel: archiving ? copy.archiveClass : copy.restoreClass,
    });
    if (confirmed) {
      try {
        await onStatusChange(archiving ? "ARCHIVED" : "ACTIVE");
      } catch (error) {
        notify(error instanceof Error ? error.message : copy.saveFailed, "error");
      }
    }
  };
  const hasStudents = classroom.students.length > 0;
  const hasTeacher = classroom.books.length > 0;
  const readyForAttendance = hasStudents && hasTeacher;
  return (
    <Card className="grid gap-3 p-3">
      <div>
        <h2 className="text-sm font-bold">{classroom.name}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {classroom.code} · {classroom.enrollmentCount}/{classroom.capacity} {copy.students}
        </p>
      </div>
      <section aria-label={copy.setupFlow} className="grid grid-cols-2 gap-2">
        <ClassSetupStep label={copy.setupClass} complete />
        <ClassSetupStep label={copy.setupStudents} complete={hasStudents} />
        <ClassSetupStep label={copy.setupTeachers} complete={hasTeacher} />
        <ClassSetupStep label={copy.setupAttendance} complete={readyForAttendance} />
      </section>
      <div className="grid grid-cols-2 gap-2">
        {canManage ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil size={14} />
            {copy.edit}
          </Button>
        ) : null}
        {canManage ? (
          <Button size="sm" variant="ghost" disabled={!options} onClick={openAdvisor}>
            {copy.classAdvisor}
          </Button>
        ) : null}
        {canManageBooks ? (
          <Button size="sm" variant="soft" disabled={!options} onClick={openBooks}>
            <BookOpen size={14} />
            {copy.manageBooks}
          </Button>
        ) : null}
        {canRoster ? (
          <Button size="sm" variant="soft" disabled={!options} onClick={openRoster}>
            <UsersRound size={14} />
            {copy.manageStudents}
          </Button>
        ) : null}
        {canTakeAttendance && classroom.status === "ACTIVE" && readyForAttendance ? (
          <Link
            to={`/admin/attendance?contextType=class&contextId=${encodeURIComponent(classroom.id)}`}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            <ClipboardCheck size={14} />
            {copy.takeAttendance}
          </Link>
        ) : canTakeAttendance && classroom.status === "ACTIVE" ? (
          <Button className="col-span-2" size="sm" disabled title={copy.attendanceLocked}>
            <ClipboardCheck size={14} />
            {copy.takeAttendance}
          </Button>
        ) : null}
      </div>
      {!readyForAttendance ? (
        <p className="rounded-lg border border-brand/15 bg-brand/5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          {copy.setupHint}
        </p>
      ) : null}
      {loading ? (
        <LoadingState label={copy.loadingOptions} />
      ) : optionsError ? (
        <EmptyState
          title={copy.optionsFailed}
          action={
            <Button variant="soft" onClick={onRetryOptions}>
              {copy.retry}
            </Button>
          }
        />
      ) : options ? (
        <>
          <section className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
            <h3 className="flex items-center gap-1 text-xs font-bold">
              <BookOpen size={14} />
              {copy.booksAndTeachers}
            </h3>
            {classroom.books.map((book) => (
              <p
                key={book.id}
                className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
              >
                {book.title} · {book.teacher.name}
              </p>
            ))}
            {!classroom.books.length ? (
              <p className="text-xs text-slate-500">{copy.noTeachers}</p>
            ) : null}
          </section>
          <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
            <h3 className="flex items-center gap-1 text-xs font-black">
              <UsersRound size={14} />
              {copy.eligibleStudents}
            </h3>
            {classroom.students.map((student) => (
              <p
                key={student.id}
                className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
              >
                {student.name}
              </p>
            ))}
            {!classroom.students.length ? (
              <p className="text-xs text-slate-500">{copy.noStudents}</p>
            ) : null}
          </section>
          {canManage ? (
            <Button
              size="sm"
              variant="ghost"
              loading={changingStatus}
              onClick={() => void confirmStatus()}
            >
              <Archive size={14} />
              {classroom.status === "ACTIVE" ? copy.archiveClass : copy.restoreClass}
            </Button>
          ) : null}
          {canManage ? (
            <Button
              size="sm"
              variant="ghost"
              className="justify-self-start text-rose-700"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              <Trash2 size={14} />
              {copy.deleteClass}
            </Button>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function ClassSetupStep({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-slate-600 dark:text-slate-300"}`}
    >
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${complete ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}
      >
        {complete ? (
          <Check size={12} strokeWidth={3} aria-hidden="true" />
        ) : (
          <span aria-hidden="true">•</span>
        )}
      </span>
      <span className="min-w-0 truncate text-[11px] font-bold">{label}</span>
    </div>
  );
}
function ClassEditorModal({
  initialDraft,
  editingId,
  organizations,
  onSave,
  onClose,
}: {
  initialDraft: ClassDraft;
  editingId: string | null;
  organizations: Array<{ id: string; name: string }>;
  onSave: (draft: ClassDraft) => Promise<void>;
  onClose: () => void;
}) {
  const copy = useClassesCopy();
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : copy.saveFailed);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.organization}>
          <AdaptiveSelect
            required
            disabled={!!editingId}
            value={draft.organizationId}
            onChange={(event) => setDraft({ ...draft, organizationId: event.target.value })}
          >
            {organizations.length !== 1 ? (
              <option value="">{copy.selectOrganization}</option>
            ) : null}
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </AdaptiveSelect>
        </Field>
        <Field label={copy.schoolYear}>
          <ClassYearPicker
            value={draft.schoolYear}
            onChange={(schoolYear) => setDraft({ ...draft, schoolYear })}
            label={copy.schoolYear}
          />
        </Field>
        <Field label={copy.className}>
          <Input
            required
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder={copy.classNamePlaceholder}
          />
        </Field>
        <Field label={copy.classCode}>
          <Input
            required
            value={draft.code}
            onChange={(event) => setDraft({ ...draft, code: event.target.value })}
            placeholder="12-exp-a"
            dir="ltr"
          />
        </Field>
        <Field label={copy.capacity}>
          <Input
            type="number"
            min={1}
            max={200}
            value={draft.capacity}
            onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) || 1 })}
          />
        </Field>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          type="submit"
          loading={saving}
          disabled={!draft.organizationId || !draft.name.trim() || !draft.code.trim()}
        >
          <Save size={15} />
          {editingId ? copy.saveChanges : copy.createClass}
        </Button>
      </div>
    </form>
  );
}

function ClassRosterModal({
  options,
  classroom,
  onSave,
  onClose,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (studentIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const copy = useClassesCopy();
  const [selected, setSelected] = useState(() => classroom.students.map((student) => student.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toggle = (id: string) =>
    setSelected((rows) => (rows.includes(id) ? rows.filter((item) => item !== id) : [...rows, id]));
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
        <span>{copy.selected(selected.length)}</span>
        <span>{copy.capacityLabel(classroom.capacity)}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.eligibleStudents.map((student) => {
          const active = selected.includes(student.id);
          return (
            <label
              key={student.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${active ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
            >
              <input
                type="checkbox"
                className="size-4 accent-brand"
                checked={active}
                onChange={() => toggle(student.id)}
              />
              <span className="min-w-0">
                <strong className="block truncate text-sm">{student.name}</strong>
                <small className="mt-1 block truncate text-xs text-slate-500">
                  {student.grade || copy.unknownGrade} · {student.major || copy.unknownTrack}
                </small>
              </span>
              {active ? (
                <Badge tone="green">{copy.enrolled}</Badge>
              ) : (
                <Badge tone="neutral">{copy.eligible}</Badge>
              )}
            </label>
          );
        })}
      </div>
      {!options.eligibleStudents.length ? <EmptyState title={copy.noEligible} /> : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" disabled={saving} onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          loading={saving}
          disabled={saving || selected.length > classroom.capacity}
          onClick={() => {
            if (saving) return;
            setSaving(true);
            setError("");
            void onSave(selected)
              .then(onClose)
              .catch((failure) =>
                setError(failure instanceof Error ? failure.message : copy.saveFailed),
              )
              .finally(() => setSaving(false));
          }}
        >
          <Save size={15} />
          {copy.saveRoster}
        </Button>
      </div>
    </div>
  );
}

function ClassAdvisorModal({
  advisors,
  value,
  onSave,
  onClose,
}: {
  advisors: Array<{ id: string; name: string; roles: string[] }>;
  value: string | null;
  onSave: (advisorId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const copy = useClassesCopy();
  const [advisorId, setAdvisorId] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${!advisorId ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
        >
          <input type="radio" checked={!advisorId} onChange={() => setAdvisorId("")} />
          <span>
            <strong className="block text-sm">{copy.noAdvisor}</strong>
            <small className="text-xs text-slate-500">{copy.advisorLater}</small>
          </span>
        </label>
        {advisors.map((advisor) => (
          <label
            key={advisor.id}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${advisorId === advisor.id ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
          >
            <input
              type="radio"
              checked={advisorId === advisor.id}
              onChange={() => setAdvisorId(advisor.id)}
            />
            <span>
              <strong className="block text-sm">{advisor.name}</strong>
              <small className="text-xs text-slate-500">
                {advisor.roles.includes("ADVISOR") ? copy.advisorRole : copy.coachRole}
              </small>
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" disabled={saving} onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          loading={saving}
          disabled={saving}
          onClick={() => {
            if (saving) return;
            setSaving(true);
            setError("");
            void onSave(advisorId || null)
              .then(onClose)
              .catch((failure) =>
                setError(failure instanceof Error ? failure.message : copy.saveFailed),
              )
              .finally(() => setSaving(false));
          }}
        >
          <Save size={15} />
          {copy.saveAdvisor}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ClassYearPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (year: string) => void;
  label: string;
}) {
  const years = Array.from({ length: 26 }, (_, index) => String(1405 + index));
  const start = value.split("-")[0];
  const end = Number(start) + 1;
  return (
    <div className="grid gap-2" aria-label={label}>
      <div className="flex items-center justify-between rounded-lg bg-brand/5 px-3 py-2 text-xs font-bold text-brand dark:bg-brand/10">
        <span>{start}</span>
        <span aria-hidden="true">←</span>
        <span>{Number.isFinite(end) ? end : "—"}</span>
      </div>
      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto overscroll-y-contain pe-1 md:max-h-none md:flex-row md:overflow-x-auto md:overflow-y-hidden md:pb-1 md:pe-0 md:[scrollbar-width:thin] md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
        {years.map((year) => {
          const selected = year === start;
          return (
            <button
              key={year}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(`${year}-${Number(year) + 1}`)}
              className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }`}
            >
              {year}–{Number(year) + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
