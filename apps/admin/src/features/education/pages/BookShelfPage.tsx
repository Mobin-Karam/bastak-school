import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Button, Card, EmptyState, Field } from "../../../shared/ui/ui";
import {
  DataTable,
  useDataTableUrlQuery,
  type DataTableColumn,
  type DataTableAction,
} from "../../../shared/ui/data-table";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { useAuth } from "../../auth";
import { BookEditor } from "../components/BookEditor";
import { listClasses, setClassBooks, type EducationClassBook } from "../api/classes.api";
import {
  createEducationBook,
  updateEducationBook,
  type EducationBookInput,
} from "../api/education-catalog.api";

export function BookShelfPage() {
  const auth = useAuth();
  const scope = `${auth.user?.id ?? "anonymous"}:${auth.activeRole ?? "none"}:${auth.context?.activeOrganization?.id ?? "all"}`;
  return <BooksWorkspace key={scope} scope={scope} />;
}

function BooksWorkspace({ scope }: { scope: string }) {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const fa = language === "fa";
  const queryClient = useQueryClient();
  const modal = useModal();
  // Authority changes remount this workspace and dismiss any dialog from the old scope.
  useEffect(() => () => modal.close(), [modal.close]);
  const [params, setParams] = useSearchParams();
  const selectedClassId = params.get("class") ?? "";
  const tableQuery = useDataTableUrlQuery("books");
  const canReadClasses = auth.can("classes.read");
  const canManageBooks = auth.can("education.catalog.manage");
  const classes = useQuery({
    queryKey: ["classes", "books", scope],
    queryFn: () => listClasses(auth.context?.activeOrganization?.id),
    enabled: canReadClasses,
  });
  const selectedClass =
    (classes.data ?? []).find((item) => item.id === selectedClassId && item.status === "ACTIVE") ??
    null;
  const books = useMemo(() => selectedClass?.books ?? [], [selectedClass?.books]);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["classes"] }),
      queryClient.invalidateQueries({ queryKey: ["class-options"] }),
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
    onSuccess: async () => {
      await refresh();
      modal.close();
      notify(fa ? "کتاب به کلاس اضافه شد." : "Book added to the class.", "success");
    },
    onError: () => notify(fa ? "افزودن کتاب انجام نشد." : "Could not add the book.", "error"),
  });
  const editBook = useMutation({
    mutationFn: ({
      id,
      titleFa,
      textbookCode,
    }: {
      id: string;
      titleFa: string;
      textbookCode?: string | null;
    }) => updateEducationBook(id, { titleFa, textbookCode }),
    onSuccess: async () => {
      await refresh();
      modal.close();
      notify(fa ? "اطلاعات کتاب به‌روزرسانی شد." : "Book details updated.", "success");
    },
    onError: () => notify(fa ? "ویرایش کتاب انجام نشد." : "Could not update the book.", "error"),
  });
  const removeBooks = useMutation({
    mutationFn: (ids: string[]) => {
      if (!selectedClass) throw new Error("CLASS_REQUIRED");
      const removed = new Set(ids);
      return setClassBooks(
        selectedClass.id,
        selectedClass.books
          .filter((item) => !removed.has(item.bookId))
          .map((item) => ({ bookId: item.bookId, teacherId: item.teacher.id })),
      );
    },
    onSuccess: async () => {
      await refresh();
      notify(
        fa ? "کتاب‌ها از این کلاس برداشته شدند." : "Books removed from this class.",
        "success",
      );
    },
    onError: () => notify(fa ? "حذف کتاب انجام نشد." : "Could not remove the books.", "error"),
  });
  const busy = addBook.isPending || editBook.isPending || removeBooks.isPending;
  const openAdd = () => {
    if (!selectedClass || !canManageBooks) return;
    modal.open({
      title: fa ? "افزودن کتاب" : "Add book",
      description: selectedClass.name,
      size: "lg",
      content: (
        <BookEditor
          language={language}
          schoolYear={selectedClass.schoolYear}
          classId={selectedClass.id}
          organizationId={selectedClass.organization.id}
          onCancel={modal.close}
          onSubmit={(draft) => addBook.mutateAsync(draft)}
        />
      ),
    });
  };
  const openEdit = (book: EducationClassBook) => {
    if (!selectedClass || !canManageBooks) return;
    modal.open({
      title: fa ? "ویرایش کتاب" : "Edit book",
      description: book.title,
      size: "md",
      content: (
        <BookEditor
          language={language}
          schoolYear={selectedClass.schoolYear}
          initial={book}
          onCancel={modal.close}
          onSubmit={({ titleFa, textbookCode }) =>
            editBook.mutateAsync({ id: book.bookId, titleFa, textbookCode })
          }
        />
      ),
    });
  };
  const confirmRemove = (rows: EducationClassBook[], clearSelection?: () => void) => {
    if (!selectedClass || !canManageBooks || !rows.length) return;
    modal.open({
      title: fa ? "برداشتن کتاب از کلاس" : "Remove books from class",
      description: fa
        ? `این ${rows.length.toLocaleString(profile.locale)} کتاب از «${selectedClass.name}» برداشته می‌شود. اطلاعات کتاب‌ها در کاتالوگ باقی می‌ماند.`
        : `Remove ${rows.length.toLocaleString(profile.locale)} books from ${selectedClass.name}. Their catalog records will be kept.`,
      content: (
        <ul className="grid gap-2 text-sm">
          {rows.map((book) => (
            <li key={book.bookId}>{book.title}</li>
          ))}
        </ul>
      ),
      tone: "danger",
      showCancel: true,
      confirmLabel: fa ? "برداشتن از کلاس" : "Remove from class",
      onConfirm: async () => {
        await removeBooks.mutateAsync(rows.map((book) => book.bookId));
        clearSelection?.();
      },
    });
  };
  const columns = useMemo<DataTableColumn<EducationClassBook>[]>(
    () => [
      {
        id: "title",
        label: fa ? "نام کتاب" : "Book title",
        value: (book) => book.title,
        primary: true,
        filter: { type: "text" },
        cell: (book) => (
          <span className="font-medium" title={book.title}>
            {book.title}
          </span>
        ),
      },
      {
        id: "code",
        label: fa ? "کد کتاب" : "Book code",
        value: (book) => book.code,
        filter: { type: "text" },
        cell: (book) => (
          <span dir="ltr" className="font-mono text-xs">
            {book.code || "—"}
          </span>
        ),
      },
      {
        id: "teacher",
        label: fa ? "دبیر مسئول" : "Responsible teacher",
        value: (book) => book.teacher.name,
        filter: {
          type: "select",
          options: Array.from(new Set(books.map((book) => book.teacher.name)))
            .sort((a, b) => a.localeCompare(b, profile.locale))
            .map((name) => ({ value: name, label: name })),
        },
      },
    ],
    [books, fa, profile.locale],
  );
  const actions: DataTableAction<EducationClassBook>[] = canManageBooks
    ? [
        {
          id: "edit",
          label: fa ? "ویرایش" : "Edit",
          icon: <Pencil size={16} aria-hidden="true" />,
          onClick: openEdit,
        },
        {
          id: "remove",
          label: fa ? "برداشتن از کلاس" : "Remove from class",
          icon: <Trash2 size={16} aria-hidden="true" />,
          tone: "danger",
          onClick: (book) => confirmRemove([book]),
        },
      ]
    : [];
  return (
    <div className="grid min-w-0 gap-4">
      <ManagementPageHeader
        eyebrow={fa ? "مدیریت آموزش" : "Education management"}
        title={fa ? "کتاب‌های کلاس" : "Class books"}
        description={
          fa
            ? "کتاب‌های هر کلاس را جست‌وجو، فیلتر و مدیریت کنید."
            : "Search, filter, and manage each class’s books."
        }
        action={
          selectedClass && canManageBooks ? (
            <Button onClick={openAdd} disabled={busy || classes.isFetching}>
              <Plus size={16} aria-hidden="true" />
              {fa ? "افزودن کتاب" : "Add book"}
            </Button>
          ) : undefined
        }
      />
      <Card className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label={fa ? "کلاس" : "Class"}>
          <select
            className="h-11 w-full rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
            value={selectedClass?.id ?? ""}
            disabled={!canReadClasses || classes.isLoading || busy}
            onChange={(event) =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                if (event.target.value) next.set("class", event.target.value);
                else next.delete("class");
                next.delete("books");
                return next;
              })
            }
          >
            <option value="">{fa ? "انتخاب کلاس" : "Choose a class"}</option>
            {(classes.data ?? [])
              .filter((item) => item.status === "ACTIVE")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.schoolYear}
                </option>
              ))}
          </select>
        </Field>
        {selectedClass ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {books.length.toLocaleString(profile.locale)} {fa ? "کتاب" : "books"} ·{" "}
            {selectedClass.schoolYear}
          </p>
        ) : null}
      </Card>
      {!canReadClasses ? (
        <EmptyState
          title={fa ? "دسترسی به کتاب‌های کلاس ندارید." : "You do not have access to class books."}
        />
      ) : selectedClass || classes.isLoading || classes.isError ? (
        <DataTable
          key={`${scope}:${selectedClassId}`}
          label={fa ? "کتاب‌ها" : "Books"}
          language={language}
          data={books}
          columns={columns}
          getRowId={(book) => book.bookId}
          {...tableQuery}
          loading={classes.isLoading}
          error={classes.isError}
          refreshing={classes.isFetching && !classes.isLoading}
          onRefresh={() => void classes.refetch()}
          busy={busy || classes.isFetching}
          preferenceKey={`books-table:${scope}`}
          exportFilename="class-books"
          actions={actions}
          selectable={canManageBooks}
          emptyTitle={fa ? "این کلاس هنوز کتابی ندارد." : "This class has no books yet."}
          emptyAction={
            canManageBooks ? (
              <Button onClick={openAdd}>{fa ? "افزودن اولین کتاب" : "Add the first book"}</Button>
            ) : undefined
          }
          bulkActions={(rows, clear) => (
            <Button variant="danger" disabled={busy} onClick={() => confirmRemove(rows, clear)}>
              <Trash2 size={16} aria-hidden="true" />
              {fa ? "برداشتن انتخاب‌شده‌ها" : "Remove selected"}
            </Button>
          )}
          renderDetail={(book) => (
            <div className="grid gap-4">
              <dl className="grid gap-4">
                {columns.map((column) => (
                  <div key={column.id} className="grid gap-1">
                    <dt className="text-xs text-slate-500">{column.label}</dt>
                    <dd className="break-words text-sm font-medium">
                      {column.cell?.(book) ?? column.value(book)}
                    </dd>
                  </div>
                ))}
              </dl>
              {canManageBooks ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="soft" disabled={busy} onClick={() => openEdit(book)}>
                    {fa ? "ویرایش" : "Edit"}
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={() => confirmRemove([book])}>
                    {fa ? "برداشتن از کلاس" : "Remove from class"}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        />
      ) : (
        <EmptyState
          title={
            fa ? "برای دیدن کتاب‌ها یک کلاس انتخاب کنید." : "Choose a class to view its books."
          }
        />
      )}
    </div>
  );
}
