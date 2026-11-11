import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { getMyClassBookGrades } from "../../../academics/education/api/classes.api";
import { useLocale } from "../../../../shared/ui/locale";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { Badge, Button, Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";

export function StudentGradesPage() {
  const language = useLocale().language;
  const grades = useQuery({
    queryKey: ["student", "class-book-grades"],
    queryFn: getMyClassBookGrades,
  });
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-4">
      <ManagementPageHeader
        eyebrow={language === "fa" ? "آموزش من" : "My education"}
        title={language === "fa" ? "نمره‌های من" : "My grades"}
        description={
          language === "fa"
            ? "نمره‌های ثبت‌شده برای کتاب‌های کلاس‌های شما."
            : "Grades recorded for your class books."
        }
      />
      {grades.isLoading ? (
        <LoadingState label={language === "fa" ? "در حال دریافت نمره‌ها…" : "Loading grades…"} />
      ) : null}
      {grades.isError ? (
        <EmptyState
          title={language === "fa" ? "دریافت نمره‌ها ناموفق بود." : "Could not load grades."}
          action={
            <Button onClick={() => void grades.refetch()}>
              {language === "fa" ? "تلاش دوباره" : "Retry"}
            </Button>
          }
        />
      ) : null}
      {grades.data && !grades.data.length ? (
        <EmptyState
          icon={<GraduationCap aria-hidden="true" />}
          title={
            language === "fa"
              ? "هنوز نمره‌ای برای شما ثبت نشده است."
              : "No grades have been recorded for you yet."
          }
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {grades.data?.map((grade) => (
          <Card key={grade.id} className="grid gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{grade.bookTitle}</h2>
                <p className="text-sm font-medium">
                  {grade.sessionTitle} · {grade.heldOn}
                </p>
                <p className="text-xs text-slate-500">
                  {grade.className} · {grade.schoolYear} · {grade.teacherName}
                </p>
              </div>
              <strong className="shrink-0 text-lg tabular-nums" dir="ltr">
                {grade.score} / 20
              </strong>
            </div>
            {grade.note ? <p className="text-sm">{grade.note}</p> : null}
            <Badge tone={grade.principalEdited ? "amber" : "neutral"}>
              {grade.principalEdited
                ? language === "fa"
                  ? "ویرایش‌شده توسط مدیر"
                  : "Edited by principal"
                : language === "fa"
                  ? "ویرایش مدیر ندارد"
                  : "No principal edit"}
            </Badge>
          </Card>
        ))}
      </div>
    </section>
  );
}
