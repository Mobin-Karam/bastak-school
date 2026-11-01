import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Eye, RefreshCw, UserRoundCheck, UsersRound, X } from "lucide-react";
import { api } from "../../../shared/api/api";
import { Button, Card, EmptyState, Badge } from "../../../shared/ui/ui";
import { SearchBar } from "../../../shared/ui/mobile/forms";
import { useLocale } from "../../../shared/ui/locale";
import { leaveRequestsCopy } from "./leave-requests-locale";
import { useAuth } from "../../identity/auth";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";
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
  const [selectedStudentRequest, setSelectedStudentRequest] = useState<LeaveRequest | null>(null);
  const [selectedTeacherLeave, setSelectedTeacherLeave] = useState<TeacherLeaveRequest | null>(null);
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
  const pendingTeacherLeaves = teacherLeaves.filter(
    (row) => row.status === "pending" || row.returnStatus === "pending",
  );
  const pendingStudentRequests = rows.filter((row) => row.status === "PENDING");
  return (
    <section className="grid gap-4" aria-busy={loading} dir="rtl">
      <section className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-brand">میز تصمیم‌گیری مرخصی‌ها</p>
            <h1 className="mt-1 text-xl font-black text-ink sm:text-2xl">مرخصی و بازگشت</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              ابتدا درخواست را باز کنید، جزئیات بازه و پیام را ببینید، سپس فقط یک تصمیم نهایی ثبت کنید.
            </p>
          </div>
          <Button variant="soft" loading={loading} onClick={() => void load()}>
            <RefreshCw size={16} />
            {copy.refresh}
          </Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <QueueMetric icon={UsersRound} label="درخواست دانش‌آموز" value={pendingStudentRequests.length} tone="amber" />
          <QueueMetric icon={UserRoundCheck} label="مرخصی و بازگشت استاد" value={pendingTeacherLeaves.length} tone="rose" />
          <QueueMetric icon={Clock3} label="همهٔ موارد قابل پیگیری" value={rows.length + teacherLeaves.length} tone="blue" />
        </div>
      </section>
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
                    {formatDateTime(row.startDate)} — {formatDateTime(row.endDate)} ·{" "}
                    {row.organizationName}
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
                    <Button size="sm" variant="soft" onClick={() => setSelectedStudentRequest(row)}>
                      <Eye size={15} />
                      بررسی در پنل
                    </Button>
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
                    <Button size="sm" variant="soft" onClick={() => setSelectedTeacherLeave(row)}>
                      <Eye size={15} />
                      بررسی در پنل
                    </Button>
                  ) : null}
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
      <ResponsiveDrawer
        open={Boolean(selectedStudentRequest)}
        onOpenChange={(open) => !open && setSelectedStudentRequest(null)}
        title={selectedStudentRequest ? `بررسی درخواست ${selectedStudentRequest.studentName || copy.student}` : "بررسی درخواست"}
        description="تصمیم شما برای دانش‌آموز ثبت و از طریق اعلان ارسال می‌شود."
        desktopSide="left"
      >
        {selectedStudentRequest ? (
          <div className="grid gap-4">
            <section className="rounded-2xl bg-[rgb(var(--surface-muted))] p-4 text-sm leading-7">
              <p><b>بازه:</b> {formatDateTime(selectedStudentRequest.startDate)} تا {formatDateTime(selectedStudentRequest.endDate)}</p>
              <p><b>نوع:</b> {requestLabel(selectedStudentRequest)}</p>
              <p><b>دلیل:</b> {selectedStudentRequest.reason}</p>
              {selectedStudentRequest.leaveType === "LEAVE" ? <p><b>وعده‌ها:</b> {selectedStudentRequest.includesLunch ? "ناهار" : "—"} · {selectedStudentRequest.includesDinner ? "شام" : "—"}</p> : null}
            </section>
            <label className="grid gap-2 text-sm font-bold">
              پیام برای دانش‌آموز <span className="text-xs font-normal text-muted-foreground">(اختیاری)</span>
              <textarea
                value={reviewNotes[selectedStudentRequest.id] ?? ""}
                onChange={(event) => setReviewNotes((notes) => ({ ...notes, [selectedStudentRequest.id]: event.target.value }))}
                className="min-h-28 rounded-xl border border-[rgb(var(--border-subtle))] bg-transparent p-3 text-sm font-normal"
                placeholder="شرط تأیید یا دلیل تصمیم را بنویسید…"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button loading={busy === selectedStudentRequest.id} onClick={async () => { await review(selectedStudentRequest, "APPROVED"); setSelectedStudentRequest(null); }}>
                <Check size={16} /> تأیید مرخصی
              </Button>
              <Button variant="danger" disabled={busy === selectedStudentRequest.id} onClick={async () => { await review(selectedStudentRequest, "REJECTED"); setSelectedStudentRequest(null); }}>
                <X size={16} /> رد درخواست
              </Button>
            </div>
          </div>
        ) : null}
      </ResponsiveDrawer>
      <ResponsiveDrawer
        open={Boolean(selectedTeacherLeave)}
        onOpenChange={(open) => !open && setSelectedTeacherLeave(null)}
        title="بررسی مرخصی استاد"
        description="برای بازهٔ مرخصی، جلسه‌ها را منجمد کنید یا جانشین انتخاب کنید."
        desktopSide="left"
      >
        {selectedTeacherLeave ? (
          <div className="grid gap-4">
            <section className="rounded-2xl bg-[rgb(var(--surface-muted))] p-4 text-sm leading-7">
              <p><b>استاد:</b> {[selectedTeacherLeave.teacher?.firstName, selectedTeacherLeave.teacher?.lastName].filter(Boolean).join(" ") || selectedTeacherLeave.teacher?.username || "استاد"}</p>
              <p><b>بازه:</b> {formatDate(selectedTeacherLeave.startDate)} تا {formatDate(selectedTeacherLeave.endDate)}</p>
              <p><b>دلیل:</b> {selectedTeacherLeave.reason}</p>
            </section>
            {selectedTeacherLeave.status === "pending" ? <>
              <label className="grid gap-2 text-sm font-bold">
                روش پوشش جلسه‌ها
                <select className="h-11 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] px-3 font-normal" value={substitutes[selectedTeacherLeave.id] ?? ""} onChange={(event) => setSubstitutes((items) => ({ ...items, [selectedTeacherLeave.id]: event.target.value }))}>
                  <option value="">بدون جانشین؛ جلسه‌ها منجمد شوند</option>
                  {teachers.filter((teacher) => teacher.id !== selectedTeacherLeave.teacherId).map((teacher) => <option key={teacher.id} value={teacher.id}>{[teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.username}</option>)}
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button loading={busy === `teacher:${selectedTeacherLeave.id}`} onClick={async () => { await reviewTeacherLeave(selectedTeacherLeave, "approved"); setSelectedTeacherLeave(null); }}>تأیید و اعمال برنامه</Button>
                <Button variant="danger" disabled={Boolean(busy)} onClick={async () => { await reviewTeacherLeave(selectedTeacherLeave, "rejected"); setSelectedTeacherLeave(null); }}>رد درخواست</Button>
              </div>
            </> : null}
            {selectedTeacherLeave.returnStatus === "pending" ? <div className="grid gap-2 sm:grid-cols-2"><Button loading={busy === `teacher-return:${selectedTeacherLeave.id}`} onClick={async () => { await reviewTeacherReturn(selectedTeacherLeave, "approved"); setSelectedTeacherLeave(null); }}>تأیید بازگشت</Button><Button variant="danger" disabled={Boolean(busy)} onClick={async () => { await reviewTeacherReturn(selectedTeacherLeave, "rejected"); setSelectedTeacherLeave(null); }}>رد بازگشت</Button></div> : null}
          </div>
        ) : null}
      </ResponsiveDrawer>
    </section>
  );
}

function QueueMetric({ icon: Icon, label, value, tone }: { icon: typeof UsersRound; label: string; value: number; tone: "amber" | "rose" | "blue" }) {
  const classes = {
    amber: "border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
    rose: "border-rose-300/70 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100",
    blue: "border-sky-300/70 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  }[tone];
  return <div className={`flex items-center gap-3 rounded-2xl border p-3 ${classes}`}><span className="grid size-10 place-items-center rounded-xl bg-white/70 dark:bg-black/15"><Icon size={20} /></span><span><b className="block text-lg">{value.toLocaleString("fa-IR")}</b><span className="text-xs font-bold">{label}</span></span></div>;
}
