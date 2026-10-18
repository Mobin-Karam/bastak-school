import { useState, useId } from "react";
import { Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../shared/ui/ui";
import { useClassesCopy } from "../model/classes-copy";
import { deleteEducationBook } from "../api/education-catalog.api.ts";
import type { EducationClass, getClassOptions } from "../api/classes.api.ts";

export function ClassBooksModal({
  options,
  classroom,
  onSave,
  onClose,
  saving,
  canDeleteBooks,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (books: Array<{ bookId: string; teacherId: string }>) => void;
  onClose: () => void;
  saving: boolean;
  canDeleteBooks: boolean;
}) {
  const copy = useClassesCopy();
  const client = useQueryClient();
  const fa = copy.locale === "fa-IR";
  const confirmationId = useId();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const deleteBook = useMutation({
    mutationFn: (id: string) => deleteEducationBook(id),
    onSuccess: async (_, id) => {
      setRemoved((ids) => [...ids, id]);
      setSelected((rows) => rows.filter((row) => row.bookId !== id));
      setPendingDelete(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["classes"] }),
        client.invalidateQueries({ queryKey: ["class-options"] }),
        client.invalidateQueries({ queryKey: ["education-catalog"] }),
      ]);
    },
    onError: (failure) => setError(failure instanceof Error ? failure.message : copy.deleteFailed),
  });
  const [selected, setSelected] = useState(() =>
    classroom.books.map((book) => ({ bookId: book.bookId, teacherId: book.teacher.id })),
  );
  const toggle = (bookId: string) =>
    setSelected((rows) =>
      rows.some((row) => row.bookId === bookId)
        ? rows.filter((row) => row.bookId !== bookId)
        : [...rows, { bookId, teacherId: options.teachers[0]?.id || "" }],
    );
  if (pendingDelete)
    return (
      <div role="alertdialog" aria-labelledby={confirmationId} className="grid gap-4">
        <h3 id={confirmationId} className="font-bold">
          {fa ? "حذف کتاب" : "Delete book"}: {pendingDelete.title}
        </h3>
        <p>
          {fa
            ? "این کتاب از کاتالوگ، صفحه کتاب‌ها و همه کلاس‌های متصل حذف می‌شود. کتاب‌های استفاده‌شده در برنامه درسی قابل حذف نیستند. ادامه می‌دهید؟"
            : "This deletes the book from the catalog, Books page, and every linked class. Books used by timetables cannot be deleted. Continue?"}
        </p>
        {error ? <p role="alert">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            autoFocus
            disabled={deleteBook.isPending}
            onClick={() => {
              setPendingDelete(null);
              setError("");
            }}
          >
            {copy.cancel}
          </Button>
          <Button
            variant="danger"
            loading={deleteBook.isPending}
            onClick={() => deleteBook.mutate(pendingDelete.id)}
          >
            {fa ? "حذف از کاتالوگ و کلاس‌ها" : "Delete from catalog and classes"}
          </Button>
        </div>
      </div>
    );
  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid max-h-[55dvh] min-w-0 gap-2 overflow-y-auto overscroll-contain p-1 sm:grid-cols-2">
        {[
          ...options.books,
          ...classroom.books
            .filter((book) => !options.books.some((option) => option.id === book.bookId))
            .map((book) => ({ id: book.bookId, title: book.title, category: "", track: "" })),
        ]
          .filter((book) => !removed.includes(book.id))
          .map((book) => {
            const row = selected.find((item) => item.bookId === book.id);
            return (
              <article
                key={book.id}
                className={`grid min-w-0 gap-2 rounded-xl border p-3 ${row ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
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
                {canDeleteBooks ? (
                  <Button
                    variant="danger"
                    disabled={saving}
                    onClick={() => {
                      setError("");
                      setPendingDelete({ id: book.id, title: book.title });
                    }}
                  >
                    {fa ? "حذف کتاب" : "Delete book"}
                  </Button>
                ) : null}
                {row ? (
                  <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>{copy.responsibleTeacher}</span>
                    <select
                      className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
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
      <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t pt-3 dark:border-slate-800">
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
