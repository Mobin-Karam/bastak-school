import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { ClassBooksModal } from "../components/ClassBooksModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { listOrganizations } from "../../../identity/access/api/access.api";
import { useAuth } from "../../../identity/auth";
import { useModal } from "../../../../shared/ui/modal";
import { notify } from "../../../../shared/ui/notifications";
import { OrganizationTag } from "../../../../shared/ui/organization-tag";
import { SpreadsheetTransferLauncher } from "../../../../shared/ui/spreadsheet-transfer-launcher";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../../shared/ui/ui";
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
  const canManage = auth.can("classes.manage");
  const canRoster = auth.can("classes.roster.manage");
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
  const selected = (classes.data || []).find((item) => item.id === selectedId) || null;
  const options = useQuery({
    queryKey: ["class-options", selectedId],
    queryFn: () => getClassOptions(selectedId!),
    enabled: !!selectedId,
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ["classes"] });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ClassDraft }) =>
      id ? updateClass(id, draft) : createClass(draft),
    onSuccess: (row) => {
      refresh();
      setSelectedId(row.id);
      modal.close();
      notify(copy.saved, "success");
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
  });
  const remove = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      refresh();
      setSelectedId(null);
      notify(copy.deleted, "success");
    },
    onError: () => notify(copy.deleteFailed, "error"),
  });
  const saveBooks = useMutation({
    mutationFn: (books: Array<{ bookId: string; teacherId: string }>) =>
      setClassBooks(selectedId!, books),
    onSuccess: () => {
      refresh();
      void options.refetch();
      notify(copy.booksSaved, "success");
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
  });
  const saveRoster = useMutation({
    mutationFn: (studentIds: string[]) => setClassEnrollments(selectedId!, studentIds),
    onSuccess: () => {
      refresh();
      void options.refetch();
      notify(copy.rosterSaved, "success");
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
  });
  const saveAdvisor = useMutation({
    mutationFn: (advisorId: string | null) => updateClass(selectedId!, { advisorId }),
    onSuccess: () => {
      refresh();
      void options.refetch();
      notify(copy.advisorSaved, "success");
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.saveFailed, "error"),
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
          saving={save.isPending}
          onClose={modal.close}
          onSave={(next) => save.mutate({ id: row?.id || null, draft: next })}
        />
      ),
    });
  };
  const visible = useMemo(() => classes.data || [], [classes.data]);
  if (classes.isLoading || (canReadOrganizations && organizations.isLoading))
    return <LoadingState label={copy.loading} />;
  if (classes.isError || (canReadOrganizations && organizations.isError))
    return <EmptyState title={copy.loadFailed} />;
  if (!auth.can("classes.read")) return <EmptyState title={copy.noAccess} />;
  return (
    <section className="classes-workspace grid min-w-0 gap-3">
      <Card className="min-w-0 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">{copy.organizationClasses}</h2>
            <p className="mt-1 text-xs text-slate-500">{copy.listDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{visible.length.toLocaleString(copy.locale)}</Badge>
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
                  onCompleted={refresh}
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
        <div className="grid gap-2">
          {visible.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
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
          {!visible.length ? (
            <EmptyState
              title={copy.noClasses}
              action={
                canManage ? (
                  <Button variant="soft" onClick={() => openEditor()}>
                    {copy.createClass}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </div>
      </Card>
      <ClassDetail
        classroom={selected}
        options={options.data}
        loading={options.isLoading}
        canManage={canManage}
        canDeleteBooks={auth.can("education.catalog.manage")}
        canRoster={canRoster}
        canTakeAttendance={auth.can("attendance.manage")}
        onBooks={(rows) => saveBooks.mutate(rows)}
        onRoster={(ids) => saveRoster.mutate(ids)}
        onAdvisor={(advisorId) => saveAdvisor.mutate(advisorId)}
        onEdit={() => selected && openEditor(selected)}
        onDelete={() => selected && remove.mutate(selected.id)}
        savingBooks={saveBooks.isPending}
        savingRoster={saveRoster.isPending}
        savingAdvisor={saveAdvisor.isPending}
        deleting={remove.isPending}
      />
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
  canManage,
  canDeleteBooks,
  canRoster,
  canTakeAttendance,
  onBooks,
  onRoster,
  onAdvisor,
  onEdit,
  onDelete,
  savingBooks,
  savingRoster,
  savingAdvisor,
  deleting,
}: {
  classroom: EducationClass | null;
  options?: Awaited<ReturnType<typeof getClassOptions>>;
  loading: boolean;
  canManage: boolean;
  canDeleteBooks: boolean;
  canRoster: boolean;
  canTakeAttendance: boolean;
  onBooks: (books: Array<{ bookId: string; teacherId: string }>) => void;
  onRoster: (ids: string[]) => void;
  onAdvisor: (advisorId: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  savingBooks: boolean;
  savingRoster: boolean;
  savingAdvisor: boolean;
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
          saving={savingBooks}
          canDeleteBooks={canDeleteBooks}
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
          saving={savingRoster}
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
          saving={savingAdvisor}
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
        {canManage ? (
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
        {canTakeAttendance && readyForAttendance ? (
          <Link
            to={`/admin/attendance?contextType=class&contextId=${encodeURIComponent(classroom.id)}`}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            <ClipboardCheck size={14} />
            {copy.takeAttendance}
          </Link>
        ) : canTakeAttendance ? (
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
  saving,
}: {
  initialDraft: ClassDraft;
  editingId: string | null;
  organizations: Array<{ id: string; name: string }>;
  onSave: (draft: ClassDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const copy = useClassesCopy();
  const [draft, setDraft] = useState(initialDraft);
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
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
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button type="button" variant="ghost" onClick={onClose}>
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
  saving,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (studentIds: string[]) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const copy = useClassesCopy();
  const [selected, setSelected] = useState(() => classroom.students.map((student) => student.id));
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
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          loading={saving}
          disabled={selected.length > classroom.capacity}
          onClick={() => {
            onSave(selected);
            onClose();
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
  saving,
  onSave,
  onClose,
}: {
  advisors: Array<{ id: string; name: string; roles: string[] }>;
  value: string | null;
  saving: boolean;
  onSave: (advisorId: string | null) => void;
  onClose: () => void;
}) {
  const copy = useClassesCopy();
  const [advisorId, setAdvisorId] = useState(value || "");
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
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          loading={saving}
          onClick={() => {
            onSave(advisorId || null);
            onClose();
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
