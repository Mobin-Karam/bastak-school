import { ArrowUpLeft, BookOpen, GraduationCap, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { apiClient } from "../../services/api-client";
import { useStudentStore } from "../../services/student-store";

type StudentClass = {
  id: string;
  organization: { id: string; name: string };
  code: string;
  name: string;
  schoolYear: string;
  gradeId: number;
  educationTypeId: string;
  trackId: string;
  capacity: number;
  description: string;
  advisor: { id: string; name: string } | null;
  books: Array<{
    id: string;
    bookId: string;
    title: string;
    category: string;
    teacher: { id: string; name: string };
  }>;
  enrollmentCount: number;
};

export function StudentClassesPage() {
  const access = useStudentStore((state) => state.access);
  const childId = useStudentStore((state) => state.selectedGuardianStudentId);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (access?.mode === "guardian" && !childId) {
      setClasses([]);
      setStatus("ready");
      return () => {
        active = false;
      };
    }
    setStatus("loading");
    const query =
      access?.mode === "guardian" && childId
        ? `?studentId=${encodeURIComponent(childId)}`
        : "";
    void apiClient
      .request<StudentClass[]>("GET", `/classes/assigned${query}`)
      .then((rows) => {
        if (active) {
          setClasses(rows);
          setStatus("ready");
        }
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [access?.mode, childId, revision]);
  return (
    <section className="student-classes">
      <header className="resource-library__header">
        <div>
          <small>کلاس‌های من</small>
          <h1>کلاس و کتاب‌های درسی</h1>
          <p>
            {access?.mode === "guardian"
              ? "کلاس‌های فرزند انتخاب‌شده"
              : "کلاس، دبیران، مشاور و کتاب‌های آموزشی شما"}
          </p>
        </div>
        <Link to="/more" aria-label="بازگشت به بیشتر">
          <ArrowUpLeft />
        </Link>
      </header>
      {status === "loading" ? (
        <LoadingState label="در حال دریافت کلاس‌ها" />
      ) : null}
      {status === "error" ? (
        <ErrorState
          message="دریافت کلاس‌ها ناموفق بود."
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : null}
      {status === "ready" && !classes.length ? (
        <EmptyState
          title="هنوز در کلاسی ثبت‌نام نشده‌اید."
          description="مدیر یا مشاور سازمان می‌تواند پس از تکمیل پروفایل آموزشی شما را به کلاس مناسب اضافه کند."
        />
      ) : null}
      {status === "ready" && classes.length ? (
        <div className="student-classes__list">
          {classes.map((classroom) => (
            <article key={classroom.id} className="student-class-card">
              <div className="student-class-card__head">
                <span className="student-class-card__icon">
                  <GraduationCap />
                </span>
                <div>
                  <small>
                    {classroom.organization.name} · {classroom.schoolYear}
                  </small>
                  <h2>{classroom.name}</h2>
                  <p>
                    پایه {classroom.gradeId.toLocaleString("fa-IR")} ·{" "}
                    {label(classroom.educationTypeId)} ·{" "}
                    {label(classroom.trackId)}
                  </p>
                </div>
              </div>
              <div className="student-class-card__facts">
                <span>
                  <UserRound />
                  مشاور: {classroom.advisor?.name || "تعیین نشده"}
                </span>
                <span>
                  {classroom.enrollmentCount.toLocaleString("fa-IR")} از{" "}
                  {classroom.capacity.toLocaleString("fa-IR")} دانش‌آموز
                </span>
              </div>
              {classroom.description ? (
                <p className="student-class-card__description">
                  {classroom.description}
                </p>
              ) : null}
              <section>
                <h3>
                  <BookOpen />
                  کتاب‌ها و دبیران
                </h3>
                {classroom.books.length ? (
                  <div className="student-class-card__books">
                    {classroom.books.map((book) => (
                      <div key={book.id}>
                        <strong>{book.title}</strong>
                        <span>
                          {book.category} · {book.teacher.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="student-class-card__empty">
                    هنوز کتابی برای این کلاس ثبت نشده است.
                  </p>
                )}
              </section>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
function label(value: string) {
  return (
    (
      {
        general: "عمومی",
        theoretical: "نظری",
        technical_vocational: "فنی و حرفه‌ای",
        kar_danesh: "کاردانش",
        experimental_sciences: "علوم تجربی",
        math_physics: "ریاضی و فیزیک",
        humanities: "علوم انسانی",
        industry: "صنعت",
        services: "خدمات",
        agriculture: "کشاورزی",
        art: "هنر",
      } as Record<string, string>
    )[value] || value
  );
}
