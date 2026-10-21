import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Tag } from "lucide-react";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { Card, EmptyState } from "../../../../shared/ui/ui";
import { getStudentTextbooks } from "../api/student-textbooks.api";

export function StudentTextbooksPage() {
  const textbooks = useQuery({
    queryKey: ["student", "textbooks"],
    queryFn: getStudentTextbooks,
  });

  if (textbooks.isLoading) {
    return <StudentTextbooksSkeleton />;
  }

  if (textbooks.isError || !textbooks.data) {
    return (
      <section className="mx-auto grid w-full max-w-5xl gap-4">
        <ManagementPageHeader
          eyebrow="کتابخانه من"
          title="کتاب‌های درسی من"
          description="فهرست کتاب‌ها بر اساس پایه و رشته ثبت‌شده در پرونده شما نمایش داده می‌شود."
        />
        <EmptyState
          icon={<BookOpen aria-hidden="true" />}
          title="دریافت کتاب‌ها ممکن نشد"
          description="اگر اطلاعات پایه یا رشته شما کامل نیست، با مسئول مدرسه تماس بگیرید."
        />
      </section>
    );
  }

  const data = textbooks.data;
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-4">
      <ManagementPageHeader
        eyebrow="کتابخانه من"
        title="کتاب‌های درسی من"
        description="فقط کتاب‌های متناسب با پایه و رشته ثبت‌شده در پرونده شما نمایش داده می‌شوند."
      />
      <Card className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <GraduationCap size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-black text-ink">
            {data.education.gradeLabel} · {data.education.trackLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500">سال تحصیلی {data.schoolYear}</p>
        </div>
        <span className="mr-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {data.books.length.toLocaleString("fa-IR")} کتاب
        </span>
      </Card>

      {data.books.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.books.map((book) => (
            <Card key={book.id} className="flex min-h-40 flex-col p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <BookOpen size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-black text-ink">{book.titleFa}</h2>
              {book.titleEn ? (
                <p dir="ltr" className="mt-1 text-xs text-slate-500">
                  {book.titleEn}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs text-slate-600 dark:text-slate-300">
                {book.category ? <span>{book.category}</span> : null}
                {book.textbookCode ? (
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <Tag size={13} aria-hidden="true" />
                    {book.textbookCode}
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen aria-hidden="true" />}
          title="هنوز کتابی برای شما منتشر نشده است"
          description="پس از انتشار کتاب‌های پایه و رشته شما، آن‌ها در همین صفحه نمایش داده می‌شوند."
        />
      )}
    </section>
  );
}

function StudentTextbooksSkeleton() {
  return (
    <section
      className="mx-auto grid w-full max-w-5xl gap-4"
      aria-busy="true"
      aria-label="در حال دریافت کتاب‌ها"
    >
      <div className="h-20 animate-pulse rounded-2xl bg-[rgb(var(--surface-card))]" />
      <div className="h-20 animate-pulse rounded-2xl bg-[rgb(var(--surface-card))]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-2xl bg-[rgb(var(--surface-card))]"
          />
        ))}
      </div>
    </section>
  );
}
