import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { listClasses } from "../../../academics/education/api/classes.api";
import { ClassBookGradePanel } from "../../../academics/education/components/ClassBookGradePanel";
import { useAuth } from "../../../identity/auth";
import { useLocale } from "../../../../shared/ui/locale";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { Button, Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";

export function TeacherGradebookPage() {
  const auth = useAuth();
  const language = useLocale().language;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const organizationId = auth.context?.activeOrganization?.id;
  const classes = useQuery({
    queryKey: ["teacher-gradebook-classes", auth.user?.id, organizationId],
    queryFn: () => listClasses(organizationId),
  });
  const books = (classes.data ?? []).flatMap((classroom) =>
    classroom.books
      .filter((book) => book.teacher.id === auth.user?.id)
      .map((book) => ({
        ...book,
        className: classroom.name,
        schoolYear: classroom.schoolYear,
        status: classroom.status,
      })),
  );
  const selected = books.find((book) => book.id === selectedId) ?? books[0];
  return (
    <section className="grid min-w-0 gap-4">
      <ManagementPageHeader
        eyebrow={language === "fa" ? "میز استاد" : "Teacher workspace"}
        title={language === "fa" ? "دفتر نمره" : "Gradebook"}
        description={
          language === "fa"
            ? "کتاب کلاس را انتخاب کنید و نمرهٔ دانش‌آموزان همان کلاس را ثبت کنید."
            : "Choose a class book to manage its students' grades."
        }
      />
      {classes.isLoading ? (
        <LoadingState label={language === "fa" ? "در حال دریافت کلاس‌ها…" : "Loading classes…"} />
      ) : null}
      {classes.isError ? (
        <EmptyState
          title={language === "fa" ? "دریافت کلاس‌ها ناموفق بود." : "Could not load classes."}
          action={
            <Button onClick={() => void classes.refetch()}>
              {language === "fa" ? "تلاش دوباره" : "Retry"}
            </Button>
          }
        />
      ) : null}
      {!classes.isLoading && !classes.isError && !books.length ? (
        <EmptyState
          title={
            language === "fa"
              ? "هنوز کتابی به شما در کلاس اختصاص داده نشده است."
              : "No class book is assigned to you yet."
          }
        />
      ) : null}
      {books.length ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
          <Card
            className="grid content-start gap-2 p-3"
            aria-label={language === "fa" ? "کتاب‌های من" : "My class books"}
          >
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                aria-pressed={selected?.id === book.id}
                onClick={() => setSelectedId(book.id)}
                className="flex min-h-12 items-center gap-2 rounded-lg border border-[rgb(var(--border-subtle))] px-3 text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-pressed:bg-brand/10"
              >
                <BookOpen size={16} aria-hidden="true" />
                <span className="min-w-0">
                  <strong className="block truncate">{book.title}</strong>
                  <small className="text-slate-500">
                    {book.className} · {book.schoolYear}
                  </small>
                </span>
              </button>
            ))}
          </Card>
          {selected ? (
            <Card className="p-4">
              <ClassBookGradePanel
                key={selected.id}
                classBookId={selected.id}
                allowEdit={selected.status === "ACTIVE"}
              />
            </Card>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
