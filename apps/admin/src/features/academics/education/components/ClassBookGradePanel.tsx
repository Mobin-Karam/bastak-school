import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { useLocale } from "../../../../shared/ui/locale";
import { Badge, Button, Input, LoadingState } from "../../../../shared/ui/ui";
import {
  deleteClassBookGrade,
  createClassBookGradeSession,
  deleteClassBookGradeSession,
  getClassBookAttendance,
  getClassBookGrades,
  saveClassBookGrade,
  updateClassBookGradeSession,
  type ClassBookGrades,
  type ClassBookGrade,
} from "../api/classes.api";

const words = {
  fa: {
    loading: "در حال دریافت نمره‌ها…",
    error: "دریافت نمره‌ها ناموفق بود.",
    retry: "تلاش دوباره",
    empty: "هنوز دانش‌آموزی در کلاس نیست.",
    noGrade: "نمره ثبت نشده",
    score: "نمره از ۲۰",
    note: "توضیح نمره",
    save: "ذخیره نمره",
    remove: "حذف نمره",
    edited: "ویرایش‌شده توسط مدیر",
    notEdited: "ویرایش مدیر ندارد",
    saveError: "ذخیره نمره ناموفق بود.",
    deleteError: "حذف نمره ناموفق بود.",
    deleteConfirm: "این نمره حذف شود؟",
    cancel: "انصراف",
    sessions: "جلسه‌های نمره‌دهی",
    createSession: "ساخت جلسه نمره‌دهی",
    sessionTitle: "موضوع جلسه و دلیل نمره",
    sessionDate: "تاریخ جلسه",
    sessionDescription: "توضیح اختیاری",
    sessionError: "ساخت جلسه ناموفق بود.",
    noSession: "برای ثبت نمره، ابتدا یک جلسه با موضوع و تاریخ بسازید.",
    attendance: "جلسه‌های حضور و غیاب این کتاب",
    attendanceError: "دریافت حضور و غیاب ناموفق بود.",
    noAttendance: "جلسهٔ حضور و غیابی برای این کتاب ثبت نشده است.",
    loadMore: "نمایش جلسه‌های بیشتر",
    noRecord: "ثبت نشده",
    present: "حاضر",
    absent: "غایب",
    late: "دیرآمده",
    excused: "موجه",
    editSession: "ویرایش جلسه",
    saveSession: "ذخیره جلسه",
    deleteSession: "حذف جلسه خالی",
    deleteSessionConfirm: "این جلسهٔ بدون نمره حذف شود؟",
    sessionUpdateError: "ذخیره یا حذف جلسه ناموفق بود.",
    finalized: "نهایی",
    submitted: "ارسال‌شده",
    scheduled: "برنامه‌ریزی‌شده",
    open: "باز",
    draft: "پیش‌نویس",
    cancelled: "لغوشده",
  },
  en: {
    loading: "Loading grades…",
    error: "Could not load grades.",
    retry: "Retry",
    empty: "No students are enrolled yet.",
    noGrade: "No grade recorded",
    score: "Score out of 20",
    note: "Grade note",
    save: "Save grade",
    remove: "Delete grade",
    edited: "Edited by principal",
    notEdited: "No principal edit",
    saveError: "Could not save grade.",
    deleteError: "Could not delete grade.",
    deleteConfirm: "Delete this grade?",
    cancel: "Cancel",
    sessions: "Grade sessions",
    createSession: "Create grade session",
    sessionTitle: "Session topic and purpose",
    sessionDate: "Session date",
    sessionDescription: "Optional description",
    sessionError: "Could not create session.",
    noSession: "Create a dated session with a topic before recording grades.",
    attendance: "Attendance sessions for this book",
    attendanceError: "Could not load attendance.",
    noAttendance: "No attendance sessions recorded for this book.",
    loadMore: "Show more sessions",
    noRecord: "Not recorded",
    present: "Present",
    absent: "Absent",
    late: "Late",
    excused: "Excused",
    editSession: "Edit session",
    saveSession: "Save session",
    deleteSession: "Delete empty session",
    deleteSessionConfirm: "Delete this session without grades?",
    sessionUpdateError: "Could not save or delete the session.",
    finalized: "Finalized",
    submitted: "Submitted",
    scheduled: "Scheduled",
    open: "Open",
    draft: "Draft",
    cancelled: "Cancelled",
  },
} as const;

export function ClassBookGradePanel({
  classBookId,
  allowEdit = true,
}: {
  classBookId: string;
  allowEdit?: boolean;
}) {
  const auth = useAuth();
  const copy = words[useLocale().language];
  const client = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [heldOn, setHeldOn] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [sessionError, setSessionError] = useState("");
  const queryKey = ["class-book-grades", classBookId];
  const grades = useQuery({ queryKey, queryFn: () => getClassBookGrades(classBookId) });
  const attendance = useInfiniteQuery({
    queryKey: ["class-book-attendance", classBookId],
    queryFn: ({ pageParam }) => getClassBookAttendance(classBookId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: auth.can("attendance.read"),
  });
  const createSession = useMutation({
    mutationFn: () =>
      createClassBookGradeSession(classBookId, { title: sessionTitle, heldOn, description }),
    onSuccess: async (session) => {
      setSelectedSessionId(session.id);
      setSessionTitle("");
      setDescription("");
      await client.invalidateQueries({ queryKey });
    },
  });
  const refresh = () => client.invalidateQueries({ queryKey });
  if (grades.isLoading) return <LoadingState label={copy.loading} />;
  if (grades.isError || !grades.data)
    return (
      <div role="alert" className="grid gap-2 text-sm">
        <p>{copy.error}</p>
        <Button variant="soft" onClick={() => void grades.refetch()}>
          {copy.retry}
        </Button>
      </div>
    );
  const activeSession =
    grades.data.sessions.find((session) => session.id === selectedSessionId) ??
    grades.data.sessions[0];
  const editable = allowEdit && auth.can("class_grades.manage");
  return (
    <section
      className="grid gap-3"
      aria-label={`${grades.data.bookTitle} · ${grades.data.className}`}
    >
      <div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3">
        <p className="text-sm font-bold text-ink">{grades.data.teacher.name}</p>
        <p className="text-xs text-slate-500">
          {grades.data.bookTitle} · {grades.data.className}
        </p>
        <p className="mt-1 text-xs text-slate-500" dir="ltr">
          {grades.data.teacher.username}
        </p>
      </div>
      <div className="grid gap-3 rounded-xl border border-[rgb(var(--border-subtle))] p-3">
        <h3 className="font-bold">{copy.sessions}</h3>
        {editable ? (
          <form
            className="grid gap-2 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (createSession.isPending) return;
              setSessionError("");
              try {
                await createSession.mutateAsync();
              } catch {
                setSessionError(copy.sessionError);
              }
            }}
          >
            <label className="grid gap-1 text-sm">
              {copy.sessionTitle}
              <Input
                required
                minLength={2}
                maxLength={160}
                value={sessionTitle}
                onChange={(event) => setSessionTitle(event.target.value)}
                disabled={createSession.isPending}
              />
            </label>
            <label className="grid gap-1 text-sm">
              {copy.sessionDate}
              <Input
                required
                type="date"
                value={heldOn}
                onChange={(event) => setHeldOn(event.target.value)}
                disabled={createSession.isPending}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              {copy.sessionDescription}
              <Input
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={createSession.isPending}
              />
            </label>
            {sessionError ? (
              <p role="alert" className="text-sm text-rose-700">
                {sessionError}
              </p>
            ) : null}
            <Button
              type="submit"
              size="sm"
              loading={createSession.isPending}
              disabled={createSession.isPending || !sessionTitle.trim()}
            >
              {copy.createSession}
            </Button>
          </form>
        ) : null}
        {grades.data.sessions.length ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={copy.sessions}>
            {grades.data.sessions.map((session) => (
              <Button
                key={session.id}
                type="button"
                size="sm"
                variant={activeSession?.id === session.id ? "primary" : "soft"}
                onClick={() => setSelectedSessionId(session.id)}
              >
                {session.title} · {session.heldOn}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{copy.noSession}</p>
        )}
        {activeSession?.description ? (
          <p className="text-sm text-slate-600">{activeSession.description}</p>
        ) : null}
        {activeSession && editable ? (
          <GradeSessionEditor
            key={activeSession.id}
            session={activeSession}
            classBookId={classBookId}
            refresh={refresh}
            copy={copy}
            onDeleted={() => setSelectedSessionId("")}
          />
        ) : null}
      </div>
      {activeSession && grades.data.students.length ? (
        grades.data.students.map((student) => (
          <GradeRow
            key={`${activeSession.id}:${student.id}:${activeSession.grades.find((grade) => grade.studentId === student.id)?.updatedAt ?? "new"}`}
            student={{
              ...student,
              grade: activeSession.grades.find((grade) => grade.studentId === student.id) ?? null,
            }}
            classBookId={classBookId}
            sessionId={activeSession.id}
            editable={editable}
            refresh={refresh}
            copy={copy}
          />
        ))
      ) : activeSession ? (
        <p className="text-sm text-slate-500">{copy.empty}</p>
      ) : null}
      {auth.can("attendance.read") ? (
        <section className="grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
          <h3 className="font-bold">{copy.attendance}</h3>
          {attendance.isError ? (
            <p role="alert" className="text-sm text-rose-700">
              {copy.attendanceError}
            </p>
          ) : null}
          {attendance.data?.pages[0]?.items.length === 0 ? (
            <p className="text-sm text-slate-500">{copy.noAttendance}</p>
          ) : null}
          {attendance.data?.pages
            .flatMap((page) => page.items)
            .map((session) => (
              <details
                key={session.id}
                className="rounded-xl border border-[rgb(var(--border-subtle))] p-3"
              >
                <summary className="cursor-pointer font-medium">
                  {session.title || copy.attendance} · {session.date} ·{" "}
                  {copy[session.status as keyof typeof copy] ?? session.status}
                </summary>
                <div className="mt-3 grid gap-2">
                  {grades.data.students.map((student) => {
                    const status = session.records.find(
                      (record) => record.studentId === student.id,
                    )?.status;
                    return (
                      <div key={student.id} className="flex justify-between gap-3 text-sm">
                        <span>{student.name}</span>
                        <span>
                          {status === "present"
                            ? copy.present
                            : status === "absent"
                              ? copy.absent
                              : status === "late"
                                ? copy.late
                                : status === "excused"
                                  ? copy.excused
                                  : copy.noRecord}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          {attendance.hasNextPage ? (
            <Button
              variant="soft"
              disabled={attendance.isFetchingNextPage}
              onClick={() => void attendance.fetchNextPage()}
            >
              {copy.loadMore}
            </Button>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

function GradeSessionEditor({
  session,
  classBookId,
  refresh,
  copy,
  onDeleted,
}: {
  session: ClassBookGrades["sessions"][number];
  classBookId: string;
  refresh: () => Promise<unknown>;
  copy: typeof words.fa | typeof words.en;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(session.title);
  const [heldOn, setHeldOn] = useState(session.heldOn);
  const [description, setDescription] = useState(session.description);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useMutation({
    mutationFn: () =>
      updateClassBookGradeSession(classBookId, session.id, { title, heldOn, description }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteClassBookGradeSession(classBookId, session.id),
    onSuccess: async () => {
      onDeleted();
      await refresh();
    },
  });
  const busy = update.isPending || remove.isPending;
  return (
    <details className="rounded-lg border border-[rgb(var(--border-subtle))] p-3">
      <summary className="cursor-pointer text-sm font-medium">{copy.editSession}</summary>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setError("");
          try {
            await update.mutateAsync();
          } catch {
            setError(copy.sessionUpdateError);
          }
        }}
      >
        <label className="grid gap-1 text-sm">
          {copy.sessionTitle}
          <Input
            required
            minLength={2}
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="grid gap-1 text-sm">
          {copy.sessionDate}
          <Input
            required
            type="date"
            value={heldOn}
            onChange={(event) => setHeldOn(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          {copy.sessionDescription}
          <Input
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={busy}
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-rose-700 sm:col-span-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" size="sm" loading={update.isPending} disabled={busy}>
            {copy.saveSession}
          </Button>
          {!session.grades.length ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              {copy.deleteSession}
            </Button>
          ) : null}
        </div>
      </form>
      {confirmDelete ? (
        <div className="mt-2 grid gap-2 rounded-lg border border-rose-300 p-3 text-sm">
          <p>{copy.deleteSessionConfirm}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={remove.isPending}
              disabled={busy}
              onClick={async () => {
                setError("");
                try {
                  await remove.mutateAsync();
                } catch {
                  setError(copy.sessionUpdateError);
                }
              }}
            >
              {copy.deleteSession}
            </Button>
          </div>
        </div>
      ) : null}
    </details>
  );
}

function GradeRow({
  student,
  classBookId,
  sessionId,
  editable,
  refresh,
  copy,
}: {
  student: ClassBookGrades["students"][number] & { grade: ClassBookGrade | null };
  classBookId: string;
  sessionId: string;
  editable: boolean;
  refresh: () => Promise<unknown>;
  copy: typeof words.fa | typeof words.en;
}) {
  const [score, setScore] = useState(student.grade?.score.toString() ?? "");
  const [note, setNote] = useState(student.grade?.note ?? "");
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      saveClassBookGrade(classBookId, sessionId, {
        studentId: student.id,
        score: Number(score),
        note,
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteClassBookGrade(classBookId, sessionId, student.id),
    onSuccess: async () => {
      setScore("");
      setNote("");
      setConfirmRemove(false);
      await refresh();
    },
  });
  const busy = save.isPending || remove.isPending;
  return (
    <div className="grid gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-base">{student.name}</strong>
        <div className="flex flex-wrap items-center gap-2">
          {student.grade ? (
            <Badge tone={student.grade.principalEdited ? "amber" : "neutral"}>
              {student.grade.principalEdited ? copy.edited : copy.notEdited}
            </Badge>
          ) : null}
          <span className="text-sm tabular-nums" dir="ltr">
            {student.grade ? `${student.grade.score} / 20` : copy.noGrade}
          </span>
        </div>
      </div>
      {editable ? (
        <form
          className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await save.mutateAsync();
            } catch {
              setError(copy.saveError);
            }
          }}
        >
          <label className="grid gap-1 text-xs">
            {copy.score}
            <Input
              type="number"
              min="0"
              max="20"
              step="0.01"
              required
              value={score}
              onChange={(event) => setScore(event.target.value)}
              disabled={busy}
              dir="ltr"
            />
          </label>
          <label className="grid gap-1 text-xs">
            {copy.note}
            <Input
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
          </label>
          {error ? (
            <p role="alert" className="text-xs text-rose-700 sm:col-span-2">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="submit"
              size="sm"
              loading={save.isPending}
              disabled={busy || score === ""}
            >
              {copy.save}
            </Button>
            {student.grade && !confirmRemove ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                loading={remove.isPending}
                onClick={() => setConfirmRemove(true)}
              >
                {copy.remove}
              </Button>
            ) : null}
          </div>
          {confirmRemove ? (
            <div className="grid gap-2 rounded-lg border border-rose-300 p-3 text-xs sm:col-span-2">
              <p>{copy.deleteConfirm}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmRemove(false)}
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  loading={remove.isPending}
                  onClick={async () => {
                    setError("");
                    try {
                      await remove.mutateAsync();
                    } catch {
                      setError(copy.deleteError);
                    }
                  }}
                >
                  {copy.remove}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
