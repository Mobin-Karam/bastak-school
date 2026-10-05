import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { listOrganizations } from "../../access/api/access.api";
import { useAuth } from "../../auth";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Textarea,
} from "../../../shared/ui/ui";
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
import { useClassesCopy } from "../model/classes-copy";

const initial = (): ClassDraft => ({
  organizationId: "",
  code: "",
  name: "",
  schoolYear: "1405-1406",
  gradeId: 10,
  educationTypeId: "theoretical",
  trackId: "experimental_sciences",
  capacity: 35,
  description: "",
  advisorId: null,
});

export function ClassesPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const modal = useModal();
  const copy = useClassesCopy();
  const canManage = auth.can("classes.manage");
  const canRoster = auth.can("classes.roster.manage");
  const organizations = useQuery({
    queryKey: ["organizations", "classes"],
    queryFn: listOrganizations,
  });
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => listClasses() });
  const [form, setForm] = useState<ClassDraft>(initial);
  const [editing, setEditing] = useState<string | null>(null);
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
      setEditing(row.id);
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
      setEditing(null);
      setForm(initial());
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
  const start = (row?: EducationClass) => {
    if (!row) {
      setEditing(null);
      setSelectedId(null);
      setForm({
        ...initial(),
        organizationId: organizations.data?.length === 1 ? organizations.data[0].id : "",
      });
      return;
    }
    setSelectedId(row.id);
    setEditing(row.id);
    setForm({
      organizationId: row.organization.id,
      code: row.code,
      name: row.name,
      schoolYear: row.schoolYear,
      gradeId: row.gradeId,
      educationTypeId: row.educationTypeId,
      trackId: row.trackId,
      capacity: row.capacity,
      description: row.description,
      advisorId: row.advisor?.id || null,
    });
  };
  const openEditor = (row?: EducationClass) => {
    const draft: ClassDraft = row
      ? {
          organizationId: row.organization.id,
          code: row.code,
          name: row.name,
          schoolYear: row.schoolYear,
          gradeId: row.gradeId,
          educationTypeId: row.educationTypeId,
          trackId: row.trackId,
          capacity: row.capacity,
          description: row.description,
          advisorId: row.advisor?.id || null,
        }
      : {
          ...initial(),
          organizationId: organizations.data?.length === 1 ? organizations.data[0].id : "",
        };
    modal.open({
      title: row ? copy.editClass : copy.newClass,
      description: copy.editorDescription,
      size: "lg",
      content: (
        <ClassEditorModal
          initialDraft={draft}
          editingId={row?.id || null}
          organizations={organizations.data || []}
          saving={save.isPending}
          onClose={modal.close}
          onSave={(next) => save.mutate({ id: row?.id || null, draft: next })}
        />
      ),
    });
  };
  const visible = useMemo(
    () =>
      (classes.data || []).filter(
        (row) => !form.organizationId || row.organization.id === form.organizationId,
      ),
    [classes.data, form.organizationId],
  );
  if (classes.isLoading || organizations.isLoading) return <LoadingState label={copy.loading} />;
  if (classes.isError || organizations.isError) return <EmptyState title={copy.loadFailed} />;
  if (!auth.can("classes.read")) return <EmptyState title={copy.noAccess} />;
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
      <Card className="min-w-0 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">{copy.organizationClasses}</h2>
            <p className="mt-1 text-xs text-slate-500">{copy.listDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{visible.length.toLocaleString(copy.locale)}</Badge>
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
              className={`grid gap-2 rounded-lg border p-3 text-start shadow-[var(--shadow-surface)] transition ${selectedId === row.id ? "border-brand bg-brand/5 ring-1 ring-brand/15" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand/40"}`}
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
                  </span>
                </span>
                <Badge tone={row.status === "ACTIVE" ? "green" : "neutral"}>
                  {row.status === "ACTIVE" ? copy.active : copy.archived}
                </Badge>
              </span>
              <span className="flex flex-wrap gap-1">
                <Badge tone="blue">{copy.grade(row.gradeId)}</Badge>
                <Badge tone="neutral">
                  {localizedEducationLabel(row.educationTypeId, copy)} ·{" "}
                  {localizedTrackLabel(row.trackId, copy)}
                </Badge>
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
        canRoster={canRoster}
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

function ClassDetail({
  classroom,
  options,
  loading,
  canManage,
  canRoster,
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
  canRoster: boolean;
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
  const [books, setBooks] = useState<Array<{ bookId: string; teacherId: string }>>([]);
  const [students, setStudents] = useState<string[]>([]);
  if (!classroom)
    return (
      <Card className="p-3 xl:sticky xl:top-16">
        <p className="text-sm text-slate-500">{copy.selectClass}</p>
      </Card>
    );
  const activeBooks = books.length
    ? books
    : classroom.books.map((book) => ({ bookId: book.bookId, teacherId: book.teacher.id }));
  const activeStudents = students.length
    ? students
    : classroom.students.map((student) => student.id);
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
  return (
    <Card className="grid gap-3 p-3 xl:sticky xl:top-16">
      <div>
        <h2 className="text-sm font-bold">{classroom.name}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {classroom.code} · {classroom.enrollmentCount}/{classroom.capacity} {copy.students}
        </p>
      </div>
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
      </div>
      {loading ? (
        <LoadingState label={copy.loadingOptions} />
      ) : options ? (
        <>
          <section className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
            <h3 className="flex items-center gap-1 text-xs font-bold">
              <BookOpen size={14} />
              {copy.booksAndTeachers}
            </h3>
            {false && canManage && options ? (
              <>
                {options!.books.map((book) => {
                  const selected = activeBooks.find((item) => item.bookId === book.id);
                  return (
                    <div
                      key={book.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        aria-label={`انتخاب ${book.title}`}
                        checked={!!selected}
                        onChange={() =>
                          setBooks(
                            selected
                              ? activeBooks.filter((item) => item.bookId !== book.id)
                              : [
                                  ...activeBooks,
                                  { bookId: book.id, teacherId: options!.teachers[0]?.id || "" },
                                ],
                          )
                        }
                      />
                      <span className="min-w-0">
                        <strong className="block truncate text-xs">{book.title}</strong>
                        <small className="text-xs text-slate-500">{book.category}</small>
                        {selected ? (
                          <select
                            className="mt-1 h-8 w-full rounded border bg-white px-1 text-xs dark:bg-slate-950"
                            value={selected.teacherId}
                            onChange={(event) =>
                              setBooks(
                                activeBooks.map((item) =>
                                  item.bookId === book.id
                                    ? { ...item, teacherId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">دبیر را انتخاب کنید</option>
                            {options!.teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
                <Button
                  size="sm"
                  variant="soft"
                  disabled={activeBooks.some((item) => !item.teacherId)}
                  loading={savingBooks}
                  onClick={() => onBooks(activeBooks)}
                >
                  <Save size={14} />
                  ذخیره کتاب‌ها
                </Button>
              </>
            ) : (
              classroom.books.map((book) => (
                <p
                  key={book.id}
                  className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
                >
                  {book.title} · {book.teacher.name}
                </p>
              ))
            )}
          </section>
          <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
            <h3 className="flex items-center gap-1 text-xs font-black">
              <UsersRound size={14} />
              {copy.eligibleStudents}
            </h3>
            {false && canRoster && options ? (
              <>
                <div className="grid max-h-56 gap-1 overflow-auto">
                  {options!.eligibleStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={activeStudents.includes(student.id)}
                        onChange={() =>
                          setStudents(
                            activeStudents.includes(student.id)
                              ? activeStudents.filter((id) => id !== student.id)
                              : [...activeStudents, student.id],
                          )
                        }
                      />
                      <span>
                        {student.name}
                        <small className="me-1 text-slate-500">
                          {student.major || student.grade}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  disabled={activeStudents.length > classroom!.capacity}
                  loading={savingRoster}
                  onClick={() => onRoster(activeStudents)}
                >
                  <Save size={14} />
                  ذخیره دانش‌آموزان
                </Button>
              </>
            ) : (
              classroom.students.map((student) => (
                <p
                  key={student.id}
                  className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
                >
                  {student.name}
                </p>
              ))
            )}
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
function ClassBooksModal({
  options,
  classroom,
  onSave,
  onClose,
  saving,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (books: Array<{ bookId: string; teacherId: string }>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const copy = useClassesCopy();
  const [selected, setSelected] = useState(() =>
    classroom.books.map((book) => ({ bookId: book.bookId, teacherId: book.teacher.id })),
  );
  const toggle = (bookId: string) =>
    setSelected((rows) =>
      rows.some((row) => row.bookId === bookId)
        ? rows.filter((row) => row.bookId !== bookId)
        : [...rows, { bookId, teacherId: options.teachers[0]?.id || "" }],
    );
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.books.map((book) => {
          const row = selected.find((item) => item.bookId === book.id);
          return (
            <article
              key={book.id}
              className={`grid gap-2 rounded-xl border p-3 ${row ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-brand"
                  checked={!!row}
                  onChange={() => toggle(book.id)}
                />
                <span className="min-w-0">
                  <strong className="block text-sm">{book.title}</strong>
                  <small className="mt-1 block text-xs text-slate-500">
                    {book.category} · {book.track}
                  </small>
                </span>
              </label>
              {row ? (
                <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{copy.responsibleTeacher}</span>
                  <select
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    value={row.teacherId}
                    onChange={(event) =>
                      setSelected((rows) =>
                        rows.map((item) =>
                          item.bookId === book.id
                            ? { ...item, teacherId: event.target.value }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="">{copy.selectTeacher}</option>
                    {options.teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <small className="text-xs text-slate-400">{copy.inactiveBook}</small>
              )}
            </article>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button
          loading={saving}
          disabled={selected.some((item) => !item.teacherId)}
          onClick={() => {
            onSave(selected);
            onClose();
          }}
        >
          <Save size={15} />
          {copy.saveBooks}
        </Button>
      </div>
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
          <select
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
          </select>
        </Field>
        <Field label={copy.schoolYear}>
          <Input
            required
            value={draft.schoolYear}
            onChange={(event) => setDraft({ ...draft, schoolYear: event.target.value })}
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
        <Field label={copy.grade(0).replace(/0|۰/, "").trim()}>
          <select
            value={draft.gradeId}
            onChange={(event) => setDraft({ ...draft, gradeId: Number(event.target.value) })}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
              <option key={grade} value={grade}>
                {copy.grade(grade)}
              </option>
            ))}
          </select>
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
        <Field label={copy.educationType}>
          <select
            value={draft.educationTypeId}
            onChange={(event) =>
              setDraft({
                ...draft,
                educationTypeId: event.target.value,
                trackId: event.target.value === "general" ? "general" : draft.trackId,
              })
            }
          >
            {educationTypeOptions(copy).map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.track}>
          <select
            value={draft.trackId}
            onChange={(event) => setDraft({ ...draft, trackId: event.target.value })}
          >
            {trackOptions(draft.educationTypeId, copy).map((track) => (
              <option key={track.id} value={track.id}>
                {track.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={copy.description}>
        <Textarea
          className="min-h-24"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Field>
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
function trackOptions(type: string, copy: ReturnType<typeof useClassesCopy>) {
  const english = copy.locale === "en-US";
  if (type === "general") return [{ id: "general", label: english ? "General" : "عمومی" }];
  if (type === "theoretical")
    return [
      { id: "experimental_sciences", label: english ? "Experimental sciences" : "علوم تجربی" },
      { id: "math_physics", label: english ? "Mathematics and physics" : "ریاضی و فیزیک" },
      { id: "humanities", label: english ? "Humanities" : "علوم انسانی" },
    ];
  return [
    { id: "industry", label: english ? "Industry" : "صنعت" },
    { id: "services", label: english ? "Services" : "خدمات" },
    { id: "agriculture", label: english ? "Agriculture" : "کشاورزی" },
    { id: "art", label: english ? "Art" : "هنر" },
  ];
}

function educationTypeOptions(copy: ReturnType<typeof useClassesCopy>) {
  const english = copy.locale === "en-US";
  return [
    { id: "general", label: english ? "General" : "عمومی" },
    { id: "theoretical", label: english ? "Theoretical" : "نظری" },
    {
      id: "technical_vocational",
      label: english ? "Technical and vocational" : "فنی و حرفه‌ای",
    },
    { id: "kar_danesh", label: english ? "Skills and knowledge" : "کاردانش" },
  ];
}

function localizedEducationLabel(id: string, copy: ReturnType<typeof useClassesCopy>) {
  return educationTypeOptions(copy).find((type) => type.id === id)?.label || id;
}

function localizedTrackLabel(id: string, copy: ReturnType<typeof useClassesCopy>) {
  const trackTypes = ["general", "theoretical", "technical_vocational", "kar_danesh"];
  return (
    trackTypes.flatMap((type) => trackOptions(type, copy)).find((track) => track.id === id)
      ?.label || id
  );
}
