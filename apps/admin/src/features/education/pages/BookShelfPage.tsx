import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FilePlus2, GraduationCap, Plus, Search, UserRoundCheck } from "lucide-react";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Textarea,
} from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { useAuth } from "../../auth";
import { getClassOptions, listClasses, setClassBooks } from "../api/classes.api";
import {
  createEducationBook,
  getPublishedEducationBooks,
  type EducationBookInput,
  type PublishedEducationBook,
} from "../api/education-catalog.api";

const spineColors = [
  "from-teal-700 to-teal-950",
  "from-amber-600 to-amber-950",
  "from-violet-700 to-violet-950",
  "from-rose-700 to-rose-950",
  "from-sky-700 to-sky-950",
  "from-emerald-700 to-emerald-950",
  "from-orange-700 to-orange-950",
];

function colorFor(id: string) {
  return spineColors[
    [...id].reduce((total, letter) => total + letter.charCodeAt(0), 0) % spineColors.length
  ];
}

function gradeLabel(grade: number, locale: string) {
  return locale === "fa-IR" ? `پایه ${grade.toLocaleString(locale)}` : `Grade ${grade}`;
}

export function BookShelfPage() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const locale = profile.locale;
  const queryClient = useQueryClient();
  const modal = useModal();
  const canReadClasses = auth.can("classes.read");
  const canManageCatalog = auth.can("education.catalog.manage");
  const [grade, setGrade] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBook, setSelectedBook] = useState<PublishedEducationBook | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const books = useQuery({
    queryKey: ["education-catalog", "published", grade],
    queryFn: () => getPublishedEducationBooks(grade === "all" ? undefined : grade),
  });
  const classes = useQuery({
    queryKey: ["classes", "bookshelf", auth.context?.activeOrganization?.id ?? "all"],
    queryFn: () => listClasses(auth.context?.activeOrganization?.id),
    enabled: canReadClasses,
  });
  const selectedClass = (classes.data ?? []).find((item) => item.id === selectedClassId) ?? null;
  const classOptions = useQuery({
    queryKey: ["class-options", "bookshelf", selectedClassId],
    queryFn: () => getClassOptions(selectedClassId),
    enabled: Boolean(selectedClassId) && canReadClasses,
  });
  const bookFitsSelectedClass =
    !selectedBook ||
    !selectedClassId ||
    Boolean(classOptions.data?.books.some((book) => book.id === selectedBook.id));
  const assign = useMutation({
    mutationFn: async () => {
      if (!selectedClass || !selectedBook || !teacherId) throw new Error("INCOMPLETE_ASSIGNMENT");
      const current = selectedClass.books
        .filter((item) => item.bookId !== selectedBook.id)
        .map((item) => ({ bookId: item.bookId, teacherId: item.teacher.id }));
      return setClassBooks(selectedClass.id, [...current, { bookId: selectedBook.id, teacherId }]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      void classOptions.refetch();
      setTeacherId("");
      modal.close();
      notify(
        language === "fa"
          ? "کتاب و دبیر کلاس ذخیره شد."
          : "The class textbook and teacher were saved.",
        "success",
      );
    },
    onError: () =>
      notify(
        language === "fa" ? "اتصال کتاب به کلاس ذخیره نشد." : "Could not save the class textbook.",
        "error",
      ),
  });
  const createBook = useMutation({
    mutationFn: createEducationBook,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["education-catalog"] });
      modal.close();
      notify(
        language === "fa"
          ? "کتاب به‌صورت پیش‌نویس ایجاد شد. آن را از کاتالوگ آموزشی منتشر کنید."
          : "The textbook was created as a draft. Publish it from the education catalog.",
        "success",
      );
    },
    onError: (error) =>
      notify(
        error instanceof Error
          ? error.message
          : language === "fa"
            ? "ایجاد کتاب انجام نشد."
            : "Could not create the textbook.",
        "error",
      ),
  });
  const filteredBooks = useMemo(
    () =>
      (books.data ?? []).filter((book) =>
        `${book.titleFa} ${book.titleEn} ${book.category} ${book.textbookCode ?? ""}`
          .toLocaleLowerCase(locale)
          .includes(query.trim().toLocaleLowerCase(locale)),
      ),
    [books.data, locale, query],
  );
  const shelves = useMemo(() => {
    const byGrade = new Map<number, PublishedEducationBook[]>();
    filteredBooks.forEach((book) =>
      byGrade.set(book.grade, [...(byGrade.get(book.grade) ?? []), book]),
    );
    return [...byGrade.entries()].sort(([first], [second]) => first - second);
  }, [filteredBooks]);
  const copy =
    language === "fa"
      ? {
          eyebrow: "کتابخانه آموزشی",
          title: "قفسه درس‌ها",
          description:
            "کتاب‌های مصوب را بر پایه ببینید و برای هر کلاس، دبیر مسئول آن را مشخص کنید.",
          search: "جست‌وجوی عنوان یا درس",
          all: "همه پایه‌ها",
          chooseClass: "انتخاب کلاس برای اتصال کتاب",
          chooseTeacher: "انتخاب دبیر مسئول",
          assign: "اتصال به کلاس",
          assignment: "اتصال به کلاس و دبیر",
          openAssignment: "افزودن به قفسه کلاس",
          existingAssignment: "دبیر این کتاب در کلاس",
          noBooks: "کتابی برای این جست‌وجو وجود ندارد.",
          access:
            "قفسه برای همه کارکنان قابل مشاهده است؛ فقط مدیران کلاس می‌توانند اتصال را تغییر دهند.",
          classUnavailable: "برای انتخاب کلاس، این نقش باید دسترسی مشاهده کلاس‌ها داشته باشد.",
          compatible: "کتاب‌های سازگار با پایه و رشته کلاس نمایش داده می‌شوند.",
          selected: "کتاب انتخاب‌شده",
        }
      : {
          eyebrow: "Curriculum library",
          title: "Course shelves",
          description:
            "Browse approved books by grade and set the responsible teacher for each class.",
          search: "Search a title or subject",
          all: "All grades",
          chooseClass: "Choose a class to connect a book",
          chooseTeacher: "Choose responsible teacher",
          assign: "Connect to class",
          assignment: "Class and teacher assignment",
          openAssignment: "Add to a class shelf",
          existingAssignment: "Teacher for this book in class",
          noBooks: "No books match this search.",
          access: "All staff can browse these shelves; only class managers can change assignments.",
          classUnavailable: "This role needs class-read access to select a class.",
          compatible: "Only books that fit the selected class profile are shown.",
          selected: "Selected book",
        };

  if (books.isLoading)
    return (
      <LoadingState label={language === "fa" ? "در حال چیدن قفسه‌ها…" : "Arranging shelves…"} />
    );
  if (books.isError)
    return (
      <Card className="p-4 text-sm text-red-700">
        {language === "fa" ? "کتابخانه دریافت نشد." : "The library could not be loaded."}
      </Card>
    );

  const openAssignment = () => {
    if (!selectedBook) return;
    modal.open({
      title: copy.assignment,
      description: copy.compatible,
      size: "lg",
      content: (
        <ClassBookAssignmentEditor
          copy={copy}
          language={language}
          locale={locale}
          canReadClasses={canReadClasses}
          canManageClasses={canManageCatalog}
          classes={classes.data ?? []}
          selectedBook={selectedBook}
          selectedClassId={selectedClassId}
          onSelectClass={(id) => {
            setSelectedClassId(id);
            setTeacherId("");
          }}
          classOptions={classOptions.data}
          classOptionsLoading={classOptions.isLoading}
          teacherId={teacherId}
          onSelectTeacher={setTeacherId}
          bookFitsSelectedClass={bookFitsSelectedClass}
          assigning={assign.isPending}
          onAssign={() => assign.mutate()}
        />
      ),
    });
  };
  const openCreateBook = () => {
    modal.open({
      title: language === "fa" ? "افزودن کتاب به کاتالوگ" : "Add a textbook to the catalog",
      description:
        language === "fa"
          ? "کتاب ابتدا به‌صورت پیش‌نویس ذخیره می‌شود و پس از بررسی از کاتالوگ منتشر خواهد شد."
          : "The textbook is saved as a draft first, then published from the catalog after review.",
      size: "lg",
      content: (
        <BookCreationForm
          language={language}
          saving={createBook.isPending}
          organizationId={selectedClass?.organization.id}
          onCancel={modal.close}
          onSubmit={(draft) => createBook.mutate(draft)}
        />
      ),
    });
  };

  return (
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          canManageCatalog ? (
            <Button disabled={!selectedClass} onClick={openCreateBook}>
              <FilePlus2 size={16} aria-hidden="true" />
              {language === "fa" ? "افزودن کتاب" : "Add textbook"}
            </Button>
          ) : undefined
        }
      />
      <Card className="overflow-hidden border-amber-950/15 bg-[#f7f2e8] p-3 shadow-[0_14px_30px_-24px_rgba(69,38,19,.8)] dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          {canReadClasses ? (
            <select
              className="h-10 min-w-52 rounded-lg border border-amber-950/15 bg-white px-3 text-sm dark:bg-slate-900"
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(event.target.value);
                setSelectedBook(null);
                setTeacherId("");
              }}
              aria-label={language === "fa" ? "انتخاب قفسه کلاس" : "Choose a class shelf"}
            >
              <option value="">
                {language === "fa"
                  ? "۱. ابتدا قفسه کلاس را انتخاب کنید"
                  : "1. Choose a class shelf first"}
              </option>
              {(classes.data ?? [])
                .filter((item) => item.status === "ACTIVE")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {gradeLabel(item.gradeId, locale)}
                  </option>
                ))}
            </select>
          ) : null}
          <label className="flex h-10 min-w-52 flex-1 items-center gap-2 rounded-lg border border-amber-950/15 bg-white/80 px-3 text-sm dark:bg-slate-900">
            <Search size={16} aria-hidden="true" className="text-slate-500" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
            />
          </label>
          <select
            className="h-10 rounded-lg border border-amber-950/15 bg-white px-3 text-sm dark:bg-slate-900"
            value={grade}
            onChange={(event) =>
              setGrade(event.target.value === "all" ? "all" : Number(event.target.value))
            }
          >
            <option value="all">{copy.all}</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {gradeLabel(value, locale)}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-amber-950/70 dark:text-slate-400">
          {selectedClass
            ? language === "fa"
              ? `قفسه «${selectedClass.name}» را مدیریت می‌کنید.`
              : `Managing ${selectedClass.name}'s shelf.`
            : language === "fa"
              ? "ابتدا قفسه کلاس را انتخاب کنید."
              : "Choose a class shelf first."}
        </p>
        <div
          className={`mt-5 grid gap-5 ${selectedClass ? "" : "pointer-events-none opacity-45"}`}
          aria-disabled={!selectedClass}
        >
          {shelves.map(([shelfGrade, shelfBooks]) => (
            <section key={shelfGrade} aria-label={gradeLabel(shelfGrade, locale)}>
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-amber-950 dark:text-amber-100">
                <GraduationCap size={17} aria-hidden="true" /> {gradeLabel(shelfGrade, locale)}{" "}
                <span className="text-xs font-medium opacity-60">
                  {shelfBooks.length.toLocaleString(locale)}
                </span>
              </div>
              <div className="relative rounded-lg bg-gradient-to-b from-amber-900/15 via-transparent to-transparent px-3 pt-3">
                <div
                  className="flex min-h-40 items-end gap-1 overflow-x-auto pb-5 pt-4"
                  role="list"
                >
                  {shelfBooks.map((book) => {
                    const selected = selectedBook?.id === book.id;
                    return (
                      <button
                        key={book.id}
                        type="button"
                        role="listitem"
                        onClick={() => setSelectedBook(book)}
                        className={`group relative flex h-32 w-16 shrink-0 origin-bottom cursor-pointer flex-col justify-between overflow-hidden rounded-t-md border border-white/30 bg-gradient-to-br ${colorFor(book.id)} p-1.5 text-start text-white shadow-[5px_5px_0_rgba(68,40,20,.22)] transition motion-safe:hover:-translate-y-2 motion-safe:hover:rotate-[-1deg] focus-visible:-translate-y-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand ${selected ? "-translate-y-2 ring-3 ring-brand/60" : ""}`}
                        aria-pressed={selected}
                        title={book.titleFa}
                      >
                        <BookOpen size={14} aria-hidden="true" className="opacity-80" />
                        <span className="[writing-mode:vertical-rl] text-[11px] font-black leading-tight">
                          {language === "fa" ? book.titleFa : book.titleEn || book.titleFa}
                        </span>
                        <span className="text-[9px] opacity-70">{book.category}</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-5 rounded-b bg-gradient-to-b from-[#754522] to-[#3b2213] shadow-[0_-3px_0_rgba(255,255,255,.2)]"
                  aria-hidden="true"
                />
              </div>
            </section>
          ))}
          {!shelves.length ? <EmptyState title={copy.noBooks} /> : null}
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <UserRoundCheck size={18} className="text-brand" aria-hidden="true" />
          <h2 className="font-black text-ink">{copy.assignment}</h2>
        </div>
        {selectedBook ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <strong>{copy.selected}:</strong>{" "}
            {language === "fa"
              ? selectedBook.titleFa
              : selectedBook.titleEn || selectedBook.titleFa}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {language === "fa" ? "یک کتاب را از قفسه انتخاب کنید." : "Choose a book from a shelf."}
          </p>
        )}
        {canReadClasses ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{copy.access}</p>
            <Button disabled={!selectedBook} onClick={openAssignment}>
              <Plus size={16} aria-hidden="true" />
              {copy.openAssignment}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{copy.classUnavailable}</p>
        )}
        {selectedClass && selectedBook ? (
          <p className="mt-3 text-xs text-slate-500">
            {copy.existingAssignment}:{" "}
            {selectedClass.books.find((book) => book.bookId === selectedBook.id)?.teacher.name ??
              (language === "fa" ? "هنوز تعیین نشده" : "Not assigned yet")}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function BookCreationForm({
  language,
  saving,
  organizationId,
  onCancel,
  onSubmit,
}: {
  language: "fa" | "en";
  saving: boolean;
  organizationId?: string;
  onCancel: () => void;
  onSubmit: (draft: EducationBookInput) => void;
}) {
  const fa = language === "fa";
  const [draft, setDraft] = useState<EducationBookInput>({
    id: "",
    titleFa: "",
    titleEn: "",
    schoolYear: fa ? "1405-1406" : "2026-2027",
    grade: 1,
    country: "IR",
    level: "primary",
    branch: fa ? "مشترک" : "Common",
    track: fa ? "مشترک" : "Common",
    category: fa ? "عمومی" : "General",
    appliesTo: [],
    notes: "",
    organizationId,
  });
  const [attempted, setAttempted] = useState(false);
  const update = (changes: Partial<EducationBookInput>) =>
    setDraft((current) => ({ ...current, ...changes }));
  const valid = Boolean(draft.id.trim() && draft.titleFa.trim() && draft.schoolYear.trim());

  return (
    <form
      className="grid gap-4"
      dir={fa ? "rtl" : "ltr"}
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (valid) onSubmit({ ...draft, id: draft.id.trim(), titleFa: draft.titleFa.trim() });
      }}
    >
      <section className="grid gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/60 p-3">
        <h3 className="text-sm font-black text-ink">{fa ? "۱. مشخصات اصلی" : "1. Core details"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={fa ? "شناسه یکتای کتاب" : "Unique textbook ID"}
            description={fa ? "پس از ذخیره قابل تغییر نیست." : "It cannot be changed after saving."}
          >
            <Input
              dir="ltr"
              value={draft.id}
              onChange={(event) => update({ id: event.target.value })}
              placeholder="math-7-1405"
              aria-invalid={attempted && !draft.id.trim()}
            />
          </Field>
          <Field label={fa ? "سال تحصیلی" : "School year"}>
            <Input
              dir="ltr"
              value={draft.schoolYear}
              onChange={(event) => update({ schoolYear: event.target.value })}
              aria-invalid={attempted && !draft.schoolYear.trim()}
            />
          </Field>
        </div>
        <Field label={fa ? "عنوان فارسی" : "Persian title"}>
          <Input
            value={draft.titleFa}
            onChange={(event) => update({ titleFa: event.target.value })}
            placeholder={fa ? "مثلاً ریاضی پایه هفتم" : "e.g. Mathematics, Grade 7"}
            aria-invalid={attempted && !draft.titleFa.trim()}
          />
        </Field>
        {attempted && !valid ? (
          <p role="alert" className="text-xs font-bold text-rose-600">
            {fa
              ? "شناسه، عنوان فارسی و سال تحصیلی را کامل کنید."
              : "Complete the ID, Persian title, and school year."}
          </p>
        ) : null}
        <Field label={fa ? "عنوان انگلیسی" : "English title"}>
          <Input
            dir="ltr"
            value={draft.titleEn || ""}
            onChange={(event) => update({ titleEn: event.target.value })}
          />
        </Field>
      </section>
      <section className="grid gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/60 p-3">
        <h3 className="text-sm font-black text-ink">
          {fa ? "۲. جایگاه آموزشی" : "2. Curriculum placement"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label={fa ? "پایه" : "Grade"}>
            <Input
              type="number"
              min={1}
              max={12}
              value={draft.grade}
              onChange={(event) => update({ grade: Number(event.target.value) })}
            />
          </Field>
          <Field label={fa ? "دسته" : "Category"}>
            <Input
              value={draft.category}
              onChange={(event) => update({ category: event.target.value })}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={fa ? "شاخه" : "Branch"}>
            <Input
              value={draft.branch}
              onChange={(event) => update({ branch: event.target.value })}
            />
          </Field>
          <Field label={fa ? "رشته" : "Track"}>
            <Input
              value={draft.track}
              onChange={(event) => update({ track: event.target.value })}
            />
          </Field>
        </div>
        <Field label={fa ? "کد کتاب (اختیاری)" : "Textbook code (optional)"}>
          <Input
            dir="ltr"
            value={draft.textbookCode || ""}
            onChange={(event) => update({ textbookCode: event.target.value })}
          />
        </Field>
        <Field label={fa ? "یادداشت داخلی (اختیاری)" : "Internal notes (optional)"}>
          <Textarea
            className="min-h-20"
            value={draft.notes || ""}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </Field>
      </section>
      <p className="rounded-lg border border-amber-400/30 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        {fa
          ? "کتاب ابتدا پیش‌نویس است؛ انتشار آن از کاتالوگ آموزشی و با دسترسی انتشار انجام می‌شود."
          : "The textbook starts as a draft; publish it from the education catalog with publish access."}
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {fa ? "انصراف" : "Cancel"}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? fa
              ? "در حال ذخیره…"
              : "Saving…"
            : fa
              ? "ایجاد پیش‌نویس کتاب"
              : "Create draft textbook"}
        </Button>
      </div>
    </form>
  );
}

function ClassBookAssignmentEditor({
  copy,
  language,
  locale,
  canReadClasses,
  canManageClasses,
  classes,
  selectedBook,
  selectedClassId,
  onSelectClass,
  classOptions,
  classOptionsLoading,
  teacherId,
  onSelectTeacher,
  bookFitsSelectedClass,
  assigning,
  onAssign,
}: {
  copy: Record<string, string>;
  language: "fa" | "en";
  locale: string;
  canReadClasses: boolean;
  canManageClasses: boolean;
  classes: Awaited<ReturnType<typeof listClasses>>;
  selectedBook: PublishedEducationBook | null;
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  classOptions: Awaited<ReturnType<typeof getClassOptions>> | undefined;
  classOptionsLoading: boolean;
  teacherId: string;
  onSelectTeacher: (id: string) => void;
  bookFitsSelectedClass: boolean;
  assigning: boolean;
  onAssign: () => void;
}) {
  if (!canReadClasses || !selectedBook)
    return <p className="text-sm text-slate-500">{copy.classUnavailable}</p>;
  return (
    <div className="grid gap-4">
      <p className="rounded-xl bg-brand/5 p-3 text-sm text-slate-700 dark:text-slate-200">
        <strong>{copy.selected}:</strong>{" "}
        {language === "fa" ? selectedBook.titleFa : selectedBook.titleEn || selectedBook.titleFa}
      </p>
      <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{copy.chooseClass}</span>
        <select
          className="h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
          value={selectedClassId}
          onChange={(event) => onSelectClass(event.target.value)}
        >
          <option value="">{language === "fa" ? "کلاس را انتخاب کنید" : "Select a class"}</option>
          {classes
            .filter((item) => item.status === "ACTIVE")
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {gradeLabel(item.gradeId, locale)}
              </option>
            ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{copy.chooseTeacher}</span>
        <select
          className="h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
          disabled={!selectedClassId || classOptionsLoading || !canManageClasses}
          value={teacherId}
          onChange={(event) => onSelectTeacher(event.target.value)}
        >
          <option value="">{copy.chooseTeacher}</option>
          {(classOptions?.teachers ?? []).map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
      </label>
      {!bookFitsSelectedClass && selectedClassId ? (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          {language === "fa"
            ? "این کتاب با پایه یا رشته این کلاس سازگار نیست."
            : "This book does not fit the selected class profile."}
        </p>
      ) : null}
      <Button
        disabled={
          !selectedClassId || !teacherId || !bookFitsSelectedClass || !canManageClasses || assigning
        }
        loading={assigning}
        onClick={onAssign}
      >
        {copy.assign}
      </Button>
    </div>
  );
}
