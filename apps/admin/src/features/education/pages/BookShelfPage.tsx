import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Button, Card, EmptyState, Field, Input, LoadingState } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { useDevicePerformance } from "../../../app/layout/shell/use-device-performance";
import { useAuth } from "../../auth";
import {
  getClassOptions,
  listClasses,
  setClassBooks,
  type EducationClassBook,
} from "../api/classes.api";
import {
  createEducationBook,
  updateEducationBook,
  type EducationBookInput,
} from "../api/education-catalog.api";

const spineColors = [
  "from-teal-700 to-teal-950",
  "from-amber-600 to-amber-950",
  "from-violet-700 to-violet-950",
  "from-rose-700 to-rose-950",
  "from-sky-700 to-sky-950",
  "from-emerald-700 to-emerald-950",
];
const colorFor = (id: string) =>
  spineColors[
    [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % spineColors.length
  ];

export function BookShelfPage() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const queryClient = useQueryClient();
  const modal = useModal();
  const performance = useDevicePerformance();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [query, setQuery] = useState("");
  const canReadClasses = auth.can("classes.read");
  const canManageBooks = auth.can("education.catalog.manage");
  const classes = useQuery({
    queryKey: ["classes", "book-shelves", auth.context?.activeOrganization?.id ?? "all"],
    queryFn: () => listClasses(auth.context?.activeOrganization?.id),
    enabled: canReadClasses,
  });
  const selectedClass = (classes.data ?? []).find((item) => item.id === selectedClassId) ?? null;
  const classOptions = useQuery({
    queryKey: ["class-options", "book-shelf", selectedClassId],
    queryFn: () => getClassOptions(selectedClassId),
    enabled: Boolean(selectedClassId) && canReadClasses,
  });
  const books = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(profile.locale);
    return (selectedClass?.books ?? []).filter((book) =>
      `${book.title} ${book.code} ${book.teacher.name}`
        .toLocaleLowerCase(profile.locale)
        .includes(needle),
    );
  }, [profile.locale, query, selectedClass?.books]);
  const refreshShelf = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["classes"] }),
      queryClient.invalidateQueries({ queryKey: ["class-options", "book-shelf", selectedClassId] }),
      queryClient.invalidateQueries({ queryKey: ["education-catalog"] }),
    ]);
  const addBook = useMutation({
    mutationFn: async (draft: EducationBookInput & { teacherId: string }) => {
      if (!selectedClass) throw new Error("CLASS_REQUIRED");
      const { teacherId, ...book } = draft;
      const created = await createEducationBook(book);
      await setClassBooks(selectedClass.id, [
        ...selectedClass.books.map((item) => ({ bookId: item.bookId, teacherId: item.teacher.id })),
        { bookId: created.id, teacherId },
      ]);
    },
    onSuccess: () => {
      void refreshShelf();
      modal.close();
      notify(
        language === "fa"
          ? "کتاب روی قفسه این کلاس قرار گرفت."
          : "The book was placed on this class shelf.",
        "success",
      );
    },
    onError: () =>
      notify(language === "fa" ? "افزودن کتاب انجام نشد." : "Could not add the book.", "error"),
  });
  const editBook = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<EducationBookInput> }) =>
      updateEducationBook(id, changes),
    onSuccess: () => {
      void refreshShelf();
      modal.close();
      notify(
        language === "fa" ? "اطلاعات کتاب به‌روزرسانی شد." : "Book details were updated.",
        "success",
      );
    },
    onError: () =>
      notify(language === "fa" ? "ویرایش کتاب انجام نشد." : "Could not update the book.", "error"),
  });
  const removeBook = useMutation({
    mutationFn: (book: EducationClassBook) => {
      if (!selectedClass) throw new Error("CLASS_REQUIRED");
      return setClassBooks(
        selectedClass.id,
        selectedClass.books
          .filter((item) => item.bookId !== book.bookId)
          .map((item) => ({ bookId: item.bookId, teacherId: item.teacher.id })),
      );
    },
    onSuccess: () => {
      void refreshShelf();
      modal.close();
      notify(
        language === "fa"
          ? "کتاب از قفسه کلاس برداشته شد."
          : "The book was removed from the class shelf.",
        "success",
      );
    },
    onError: () =>
      notify(
        language === "fa" ? "حذف از قفسه انجام نشد." : "Could not remove the book from this shelf.",
        "error",
      ),
  });
  const copy =
    language === "fa"
      ? {
          eyebrow: "کتابخانه کلاس",
          title: "قفسه کتاب‌های کلاس",
          description:
            "یک کلاس را انتخاب کنید؛ فقط کتاب‌های همان کلاس را اضافه، ویرایش یا از قفسه حذف کنید.",
          choose: "۱. کلاس را انتخاب کنید",
          search: "جست‌وجو در قفسه",
          add: "افزودن کتاب به این قفسه",
          empty: "این کلاس هنوز کتابی ندارد.",
          selectPrompt: "برای دیدن قفسه، ابتدا یک کلاس را انتخاب کنید.",
          access: "برای مدیریت کتاب‌ها دسترسی لازم را ندارید.",
          edit: "ویرایش کتاب",
          remove: "برداشتن از قفسه",
        }
      : {
          eyebrow: "Class library",
          title: "Class book shelf",
          description:
            "Choose a class and add, edit, or remove only the books on that class shelf.",
          choose: "1. Choose a class",
          search: "Search this shelf",
          add: "Add a book to this shelf",
          empty: "This class has no books yet.",
          selectPrompt: "Choose a class first to open its shelf.",
          access: "You do not have permission to manage books.",
          edit: "Edit book",
          remove: "Remove from shelf",
        };
  const openAdd = () => {
    if (!selectedClass) return;
    modal.open({
      title: copy.add,
      description:
        language === "fa"
          ? `کتاب مستقیماً به قفسه «${selectedClass.name}» اضافه می‌شود.`
          : `The book will be added directly to ${selectedClass.name}'s shelf.`,
      size: "lg",
      content: (
        <BookEditor
          language={language}
          schoolYear={selectedClass.schoolYear}
          teachers={classOptions.data?.teachers ?? []}
          saving={addBook.isPending}
          onCancel={modal.close}
          onSubmit={(draft) => addBook.mutate(draft)}
        />
      ),
    });
  };
  const openEdit = (book: EducationClassBook) =>
    modal.open({
      title: copy.edit,
      description:
        language === "fa"
          ? "این تغییر فقط اطلاعات همین کتاب را به‌روزرسانی می‌کند."
          : "This updates this book’s details.",
      size: "md",
      content: (
        <BookEditor
          language={language}
          schoolYear={selectedClass?.schoolYear ?? "1405-1406"}
          initial={book}
          saving={editBook.isPending}
          onCancel={modal.close}
          onSubmit={(draft) => editBook.mutate({ id: book.bookId, changes: draft })}
        />
      ),
    });
  const openRemove = (book: EducationClassBook) =>
    modal.open({
      title: copy.remove,
      description:
        language === "fa"
          ? `«${book.title}» فقط از قفسه «${selectedClass?.name}» برداشته می‌شود.`
          : `${book.title} will only be removed from ${selectedClass?.name}'s shelf.`,
      tone: "danger",
      content: (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === "fa"
              ? "برای ادامه، حذف از قفسه را تأیید کنید."
              : "Confirm removal from this shelf."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={modal.close}>
              {language === "fa" ? "انصراف" : "Cancel"}
            </Button>
            <Button
              variant="danger"
              loading={removeBook.isPending}
              onClick={() => removeBook.mutate(book)}
            >
              <Trash2 size={16} aria-hidden="true" />
              {copy.remove}
            </Button>
          </div>
        </div>
      ),
    });
  if (classes.isLoading)
    return (
      <LoadingState
        label={language === "fa" ? "در حال آماده‌سازی کتابخانه…" : "Preparing the library…"}
      />
    );
  if (classes.isError)
    return (
      <Card className="p-4 text-sm text-rose-700">
        {language === "fa" ? "کلاس‌ها دریافت نشدند." : "Classes could not be loaded."}
      </Card>
    );
  return (
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          selectedClass && canManageBooks ? (
            <Button onClick={openAdd}>
              <Plus size={16} aria-hidden="true" />
              {copy.add}
            </Button>
          ) : undefined
        }
      />
      <Card className="overflow-hidden border-amber-950/15 bg-[#f7f2e8] p-3 shadow-[0_16px_34px_-25px_rgba(69,38,19,.85)] dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-11 min-w-56 rounded-lg border border-amber-950/15 bg-white px-3 text-sm font-bold text-amber-950 dark:bg-slate-900 dark:text-amber-100"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            aria-label={copy.choose}
            disabled={!canReadClasses}
          >
            <option value="">{copy.choose}</option>
            {(classes.data ?? [])
              .filter((item) => item.status === "ACTIVE")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.schoolYear}
                </option>
              ))}
          </select>
          <label className="flex h-11 min-w-48 flex-1 items-center gap-2 rounded-lg border border-amber-950/15 bg-white/80 px-3 text-sm dark:bg-slate-900">
            <Search size={16} aria-hidden="true" className="text-slate-500" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
              disabled={!selectedClass}
            />
          </label>
        </div>
        {selectedClass ? (
          <section className="mt-5" aria-label={selectedClass.name}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-black text-amber-950 dark:text-amber-100">
              <span className="flex items-center gap-2">
                <BookOpen size={18} aria-hidden="true" />
                {selectedClass.name}
              </span>
              <span className="rounded-full bg-amber-950/10 px-2.5 py-1 text-xs">
                {books.length.toLocaleString(profile.locale)} {language === "fa" ? "کتاب" : "books"}
              </span>
            </div>
            {books.length ? (
              <ClassLibraryScene
                books={books}
                language={language}
                canManage={canManageBooks}
                performance={performance}
                onEdit={openEdit}
                onRemove={openRemove}
              />
            ) : (
              <EmptyState
                title={
                  query
                    ? language === "fa"
                      ? "کتابی با این جست‌وجو نیست."
                      : "No books match this search."
                    : copy.empty
                }
                description={
                  canManageBooks
                    ? language === "fa"
                      ? "از «افزودن کتاب به این قفسه» شروع کنید."
                      : "Start with Add a book to this shelf."
                    : copy.access
                }
              />
            )}
          </section>
        ) : (
          <EmptyState title={copy.selectPrompt} />
        )}
      </Card>
    </div>
  );
}

function ClassLibraryScene({
  books,
  language,
  canManage,
  performance,
  onEdit,
  onRemove,
}: {
  books: EducationClassBook[];
  language: "fa" | "en";
  canManage: boolean;
  performance: "reduced" | "standard" | "enhanced";
  onEdit: (book: EducationClassBook) => void;
  onRemove: (book: EducationClassBook) => void;
}) {
  const rows = [0, 1, 2].map((row) => books.filter((_, index) => index % 3 === row));
  return (
    <div
      className="relative isolate min-h-[31rem] overflow-x-auto rounded-xl border border-amber-950/25 bg-[#26140c] shadow-[inset_0_0_0_1px_rgba(255,207,127,.12),0_20px_35px_-28px_rgba(30,12,2,.95)] sm:min-h-[34rem]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(20,8,2,.08), rgba(20,8,2,.2)), url('/library/classic-library-shelf-wall.webp')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-x-3 top-[15%] flex h-[14%] items-end gap-1 overflow-x-auto px-2 sm:inset-x-[11%]">
        {rows[0].map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            language={language}
            canManage={canManage}
            performance={performance}
            onEdit={() => onEdit(book)}
            onRemove={() => onRemove(book)}
          />
        ))}
      </div>
      <div className="absolute inset-x-3 top-[34%] flex h-[14%] items-end gap-1 overflow-x-auto px-2 sm:inset-x-[11%]">
        {rows[1].map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            language={language}
            canManage={canManage}
            performance={performance}
            onEdit={() => onEdit(book)}
            onRemove={() => onRemove(book)}
          />
        ))}
      </div>
      <div className="absolute inset-x-3 top-[53%] flex h-[14%] items-end gap-1 overflow-x-auto px-2 sm:inset-x-[11%]">
        {rows[2].map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            language={language}
            canManage={canManage}
            performance={performance}
            onEdit={() => onEdit(book)}
            onRemove={() => onRemove(book)}
          />
        ))}
      </div>
    </div>
  );
}

function BookSpine({
  book,
  language,
  canManage,
  performance,
  onEdit,
  onRemove,
}: {
  book: EducationClassBook;
  language: "fa" | "en";
  canManage: boolean;
  performance: "reduced" | "standard" | "enhanced";
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article
      role="listitem"
      className={`group relative flex h-28 w-[3.75rem] shrink-0 origin-bottom sm:h-36 sm:w-[4.5rem] ${performance === "reduced" ? "" : "motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-3 motion-safe:focus-within:-translate-y-3"}`}
    >
      <button
        type="button"
        className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-t-md border border-white/35 bg-gradient-to-br ${colorFor(book.bookId)} p-2 text-start text-white shadow-[7px_6px_0_rgba(68,40,20,.22)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand ${performance === "reduced" ? "" : "[transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:perspective(680px)_rotateY(-14deg)_rotateX(3deg)]"}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {performance === "reduced" ? <BookMark /> : <BookArtwork view="spine" />}
        <span className="[writing-mode:vertical-rl] text-[12px] font-black leading-tight">
          {book.title}
        </span>
        <span className="text-[8px] font-bold opacity-80" dir="ltr">
          {book.code}
        </span>
        {performance === "enhanced" ? <BookArtwork view="edge" decorative /> : null}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full z-10 mt-2 grid min-w-52 gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 text-start shadow-xl">
          {performance === "reduced" ? null : (
            <div
              className="grid grid-cols-2 gap-1"
              aria-label={language === "fa" ? "نماهای کتاب" : "Book views"}
            >
              <div className="relative h-24 overflow-hidden rounded-lg bg-[#1b1717]">
                <BookArtwork view="front" large />
              </div>
              <div className="relative h-24 overflow-hidden rounded-lg bg-[#1b1717]">
                <BookArtwork view="angled" large />
              </div>
            </div>
          )}
          <strong className="text-sm text-ink">{book.title}</strong>
          <span className="text-xs text-slate-500">
            {language === "fa" ? "دبیر:" : "Teacher:"} {book.teacher.name}
          </span>
          <span className="text-xs text-slate-500" dir="ltr">
            {language === "fa" ? "کد:" : "Code:"} {book.code}
          </span>
          {canManage ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                aria-label={language === "fa" ? `ویرایش ${book.title}` : `Edit ${book.title}`}
              >
                <Pencil size={14} aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-700"
                onClick={onRemove}
                aria-label={language === "fa" ? `حذف ${book.title}` : `Remove ${book.title}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function BookArtwork({
  view,
  decorative = false,
  large = false,
}: {
  view: "front" | "spine" | "edge" | "angled";
  decorative?: boolean;
  large?: boolean;
}) {
  const position = {
    front: "0% 0%",
    spine: "100% 0%",
    edge: "0% 100%",
    angled: "100% 100%",
  }[view];
  return (
    <span
      aria-hidden="true"
      className={`${large ? "absolute inset-0" : decorative ? "absolute inset-x-0 bottom-0 h-7 opacity-80" : "absolute inset-x-1 top-1 h-9 opacity-90"} pointer-events-none bg-no-repeat`}
      style={{
        backgroundImage: "url('/library/classic-book-views.webp')",
        backgroundPosition: position,
        backgroundSize: "200% 200%",
      }}
    />
  );
}
function BookMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5 opacity-90" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 4h16a4 4 0 0 1 4 4v19H9a3 3 0 0 0-3 3V4Zm4 5v3h11V9H10Zm0 7v2h11v-2H10Z"
      />
      <path fill="currentColor" fillOpacity=".55" d="M6 30a3 3 0 0 1 3-3h17v2H9a1 1 0 0 0-1 1H6Z" />
    </svg>
  );
}
function BookEditor({
  language,
  schoolYear,
  teachers = [],
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  language: "fa" | "en";
  schoolYear: string;
  teachers?: Array<{ id: string; name: string }>;
  initial?: EducationClassBook;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (draft: EducationBookInput & { teacherId: string }) => void;
}) {
  const fa = language === "fa";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [teacherId, setTeacherId] = useState(initial?.teacher.id ?? "");
  const [attempted, setAttempted] = useState(false);
  const valid = Boolean(title.trim() && (initial || teacherId));
  return (
    <form
      className="grid gap-4"
      dir={fa ? "rtl" : "ltr"}
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (!valid) return;
        onSubmit({
          id: initial?.bookId ?? `class-book-${crypto.randomUUID()}`,
          titleFa: title.trim(),
          titleEn: "",
          textbookCode: code.trim(),
          schoolYear,
          grade: 0,
          country: "IR",
          level: "class",
          branch: fa ? "کلاس" : "Class",
          track: fa ? "کلاس" : "Class",
          category: "class",
          appliesTo: [],
          state: "PUBLISHED",
          organizationId: undefined,
          teacherId,
        });
      }}
    >
      <Field label={fa ? "نام کتاب" : "Book title"}>
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={attempted && !title.trim()}
        />
      </Field>
      <Field label={fa ? "کد کتاب" : "Book code"}>
        <Input dir="ltr" value={code} onChange={(event) => setCode(event.target.value)} />
      </Field>
      {!initial ? (
        <Field
          label={fa ? "دبیر مسئول" : "Responsible teacher"}
          description={
            fa
              ? "برای اتصال کتاب به کلاس لازم است."
              : "Required to place the book on this class shelf."
          }
        >
          <select
            className="h-11 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            aria-invalid={attempted && !teacherId}
          >
            <option value="">{fa ? "انتخاب دبیر" : "Choose a teacher"}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {attempted && !valid ? (
        <p role="alert" className="text-xs font-bold text-rose-600">
          {fa
            ? "نام کتاب و دبیر مسئول را وارد کنید."
            : "Enter a book title and responsible teacher."}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {fa ? "انصراف" : "Cancel"}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (fa ? "در حال ذخیره…" : "Saving…") : fa ? "ذخیره روی قفسه" : "Save to shelf"}
        </Button>
      </div>
    </form>
  );
}
