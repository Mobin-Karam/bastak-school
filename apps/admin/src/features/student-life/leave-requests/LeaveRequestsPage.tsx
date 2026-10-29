import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { api } from "../../../shared/api/api";
import { Button, Card, EmptyState, Badge } from "../../../shared/ui/ui";
import { SearchBar } from "../../../shared/ui/mobile/forms";
import { useLocale } from "../../../shared/ui/locale";
import { leaveRequestsCopy } from "./leave-requests-locale";
import { useAuth } from "../../identity/auth";
import {
  listAcademicTeachers,
  type AcademicTeacher,
} from "../../academics/education/api/academic.api";
import {
  listTeacherLeaveRequests,
  reviewTeacherLeaveRequest,
  reviewTeacherLeaveReturn,
  type TeacherLeaveRequest,
} from "../../academics/schedule/api/teacher-leave.api";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
type LeaveRequest = {
  id: string;
  studentName: string | null;
  organizationName: string;
  leaveType: string;
  reviewerRole?: "PRINCIPAL" | "SCHOOL_SUPERVISOR";
  startDate: string;
  endDate: string;
  reason: string;
  note: string;
  includesLunch?: boolean;
  includesDinner?: boolean;
  exitPermissionId?: string | null;
  status: Status;
};
const tones: Record<Status, "amber" | "green" | "red" | "blue" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "neutral",
  COMPLETED: "blue",
};
const requestLabel = (row: LeaveRequest) =>
  row.leaveType === "SCHOOL_EXIT" ? "خروج از مدرسه · بررسی ناظم" : "مرخصی · بررسی مدیر";

export function LeaveRequestsPage() {
  const auth = useAuth();
  const { language, formatDate, formatDateTime } = useLocale();
  const copy = leaveRequestsCopy(language);
  const [rows, setRows] = useState<LeaveRequest[]>([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<Status | "ALL">("PENDING"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<AcademicTeacher[]>([]);
  const [substitutes, setSubstitutes] = useState<Record<string, string>>({});
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await api.get<LeaveRequest[]>("/leave-requests"));
      const organizationId = auth.context?.activeOrganization?.id;
      if (organizationId) {
        const [leaveRows, directory] = await Promise.all([
          listTeacherLeaveRequests(),
          listAcademicTeachers(organizationId, { limit: 100 }),
        ]);
        setTeacherLeaves(leaveRows);
        setTeachers(directory.items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fa-IR");
    return rows.filter(
      (row) =>
        (filter === "ALL" || row.status === filter) &&
        (!needle ||
          [row.studentName, row.organizationName, row.reason, row.leaveType]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("fa-IR")
            .includes(needle)),
    );
  }, [filter, query, rows]);
  const review = async (row: LeaveRequest, status: "APPROVED" | "REJECTED") => {
    setBusy(row.id);
    setError("");
    try {
      const updated = await api.patch<LeaveRequest>(`/leave-requests/${row.id}`, {
        status,
        note: reviewNotes[row.id]?.trim() || undefined,
      });
      setRows((items) => items.map((item) => (item.id === row.id ? updated : item)));
      setReviewNotes((notes) => {
        const next = { ...notes };
        delete next[row.id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.saveFailed);
    } finally {
      setBusy("");
    }
  };
  const reviewTeacherLeave = async (
    row: TeacherLeaveRequest,
    decision: "approved" | "rejected",
  ) => {
    setBusy(`teacher:${row.id}`);
    setError("");
    try {
      const substituteTeacherId = substitutes[row.id];
      const updated = await reviewTeacherLeaveRequest(
        row.id,
        decision === "rejected"
          ? { decision }
          : substituteTeacherId
            ? { decision, resolution: "substitute", substituteTeacherId }
            : { decision, resolution: "cancel" },
      );
      setTeacherLeaves((items) => items.map((item) => (item.id === row.id ? updated : item)));
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setBusy("");
    }
  };
  const reviewTeacherReturn = async (
    row: TeacherLeaveRequest,
    decision: "approved" | "rejected",
  ) => {
    setBusy(`teacher-return:${row.id}`);
    setError("");
    try {
      const updated = await reviewTeacherLeaveReturn(row.id, { decision });
      setTeacherLeaves((items) => items.map((item) => (item.id === row.id ? updated : item)));
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setBusy("");
    }
  };
  return (
    <section className="grid gap-4" aria-busy={loading}>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <Button variant="soft" loading={loading} onClick={() => void load()}>
          <RefreshCw size={16} />
          {copy.refresh}
        </Button>
      </section>
      <Card className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label={copy.summary}>
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "primary" : "ghost"}
              onClick={() => setFilter(status)}
            >
              {status === "ALL" ? copy.all : copy.status[status]}
            </Button>
          ))}
        </div>
      </Card>
      {error ? <Card className="border-danger/30 p-4 text-sm text-danger">{error}</Card> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="divide-y divide-[rgb(var(--border-subtle))]">
          {!loading && !visible.length ? (
            <EmptyState title={filter === "PENDING" ? copy.noPending : copy.noMatches} />
          ) : (
            visible.map((row) => (
              <article
                key={row.id}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{row.studentName || copy.student}</h2>
                    <Badge tone={tones[row.status]}>{copy.status[row.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs font-bold text-brand">{requestLabel(row)}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(row.startDate)} — {formatDateTime(row.endDate)} · {row.organizationName}
                  </p>
                  {row.leaveType === "LEAVE" ? (
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      وعده‌ها: {row.includesLunch ? "ناهار" : "بدون ناهار"}
                      {" · "}
                      {row.includesDinner ? "شام" : "بدون شام"}
                    </p>
                  ) : null}
                  {row.note ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {copy.note}: {row.note}
                    </p>
                  ) : null}
                </div>
                {row.status === "PENDING" ? (
                  <div className="grid gap-2 sm:min-w-64">
                    <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      پیام مدیر برای حضور موجه دانش‌آموز (اختیاری)
                      <textarea
                        value={reviewNotes[row.id] ?? ""}
                        onChange={(event) =>
                          setReviewNotes((notes) => ({ ...notes, [row.id]: event.target.value }))
                        }
                        className="min-h-20 rounded-lg border border-[rgb(var(--border-subtle))] bg-transparent px-2 py-1.5 text-sm text-ink"
                        placeholder="مثلاً مرخصی تأیید شده است."
                      />
                    </label>
                    <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={busy === row.id}
                      onClick={() => void review(row, "APPROVED")}
                    >
                      <Check size={15} />
                      {copy.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy === row.id}
                      onClick={() => void review(row, "REJECTED")}
                    >
                      <X size={15} />
                      {copy.reject}
                    </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </Card>
        <Card className="grid content-start gap-3 p-4" dir="rtl">
          <div>
            <h2 className="font-black text-ink">درخواست‌های مرخصی دبیران</h2>
            <p className="mt-1 text-xs text-slate-500">
              برای هر بازه، جانشین انتخاب کنید یا جلسه‌ها را لغو کنید.
            </p>
          </div>
          {!teacherLeaves.filter(
            (row) => row.status === "pending" || row.returnStatus === "pending",
          ).length ? (
            <EmptyState title="درخواست مرخصی دبیر در انتظاری وجود ندارد." />
          ) : (
            teacherLeaves
              .filter((row) => row.status === "pending" || row.returnStatus === "pending")
              .map((row) => (
                <article
                  key={row.id}
                  className="grid gap-2 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
                >
                  <strong>
                    {[row.teacher?.firstName, row.teacher?.lastName].filter(Boolean).join(" ") ||
                      row.teacher?.username}
                  </strong>
                  <p className="text-xs text-slate-500">
                    {formatDate(row.startDate)} تا {formatDate(row.endDate)} · {row.reason}
                  </p>
                  {row.status === "pending" ? (
                    <select
                      value={substitutes[row.id] ?? ""}
                      onChange={(event) =>
                        setSubstitutes((items) => ({ ...items, [row.id]: event.target.value }))
                      }
                      className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] px-2 text-sm"
                    >
                      <option value="">لغو جلسه‌ها و نمایش اطلاعیه برای دانش‌آموزان</option>
                      {teachers
                        .filter((teacher) => teacher.id !== row.teacherId)
                        .map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
                              teacher.username}
                          </option>
                        ))}
                    </select>
                  ) : null}
                  {row.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={busy === `teacher:${row.id}`}
                        onClick={() => void reviewTeacherLeave(row, "approved")}
                      >
                        تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={Boolean(busy)}
                        onClick={() => void reviewTeacherLeave(row, "rejected")}
                      >
                        رد
                      </Button>
                    </div>
                  ) : null}
                  {row.returnStatus === "pending" && row.returnDate ? (
                    <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <p>درخواست بازگشت در {formatDate(row.returnDate)}</p>
                      {row.returnMessage ? <p className="mt-1">{row.returnMessage}</p> : null}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          loading={busy === `teacher-return:${row.id}`}
                          onClick={() => void reviewTeacherReturn(row, "approved")}
                        >
                          تأیید بازگشت
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={Boolean(busy)}
                          onClick={() => void reviewTeacherReturn(row, "rejected")}
                        >
                          رد بازگشت
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
          )}
        </Card>
      </div>
    </section>
  );
}
