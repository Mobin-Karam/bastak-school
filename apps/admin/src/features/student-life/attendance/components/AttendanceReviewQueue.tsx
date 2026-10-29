import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../identity/auth";
import { api } from "../../../../shared/api/api";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Button, Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import {
  listAttendanceAbsenceReviews,
  markDormAbsenceOutsideSchool,
  reviewAttendanceAbsence,
  type AttendanceAbsenceReview,
} from "../api/attendance.api";

/** Scoped principal/supervisor review: inspect, choose a decision, confirm. */
export function AttendanceReviewQueue({ initialRecordId }: { initialRecordId?: string | null }) {
  const client = useQueryClient();
  const auth = useAuth();
  const organizationId = auth.context?.activeOrganization?.id;
  const scope = JSON.stringify([auth.user?.id, auth.activeRole, organizationId]);
  const scopeRef = useRef(scope);
  const openedInitialRecordId = useRef<string | null>(null);
  scopeRef.current = scope;
  const [selected, setSelected] = useState<AttendanceAbsenceReview | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [markOutsideSchool, setMarkOutsideSchool] = useState(false);
  const reviews = useQuery({
    queryKey: ["attendance", "absence-reviews", scope],
    queryFn: () => listAttendanceAbsenceReviews(organizationId),
    enabled: auth.can("attendance.review"),
  });
  useEffect(() => {
    setSelected(null);
    setDecision(null);
    setNote("");
    setNotice(null);
  }, [scope]);
  useEffect(() => {
    const stream = api.openEvents((type, payload) => {
      if (
        (type === "attendance.updated" || type === "attendance.reviewed") &&
        (!organizationId || payload.organizationId === organizationId)
      )
        void client.invalidateQueries({ queryKey: ["attendance", "absence-reviews", scope] });
    });
    return () => stream.close();
  }, [client, organizationId, scope]);
  const mutation = useMutation({
    mutationFn: ({
      record,
      decision,
      note,
      outsideSchool,
    }: {
      record: AttendanceAbsenceReview;
      decision: "approved" | "rejected";
      note: string;
      outsideSchool: boolean;
      scope: string;
    }) =>
      reviewAttendanceAbsence(record.id, { decision, note: note.trim() || undefined }).then(
        async (saved) => {
          if (decision === "approved" && record.contextType === "dorm" && outsideSchool)
            await markDormAbsenceOutsideSchool(saved.id, note.trim() || undefined);
          return saved;
        },
      ),
    onSuccess: (_, variables) => {
      if (variables.scope !== scopeRef.current) return;
      setSelected(null);
      setNotice(
        variables.decision === "approved"
          ? "دلیل غیبت پذیرفته شد؛ غیبت فیزیکی در سابقه حفظ می‌شود."
          : "دلیل غیبت رد شد.",
      );
      void client.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
  const pending = (reviews.data ?? []).filter((review) => review.reviewStatus === "pending");
  const focusedReview = initialRecordId
    ? (pending.find((review) => review.id === initialRecordId) ?? null)
    : null;

  useEffect(() => {
    if (!focusedReview || selected || openedInitialRecordId.current === focusedReview.id) return;
    openedInitialRecordId.current = focusedReview.id;
    mutation.reset();
    setSelected(focusedReview);
    setDecision(null);
    setNote("");
    setMarkOutsideSchool(false);
  }, [focusedReview, mutation, selected]);

  return (
    <Card id="attendance-absence-reviews" className="space-y-3 p-4">
      <header>
        <h2 className="font-black">دلیل‌های غیبت</h2>
        <p className="mt-1 text-sm text-slate-500">
          یک مورد را باز کنید، دلیل را بخوانید و سپس تصمیم خود را ثبت کنید.
        </p>
      </header>
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        >
          {notice}
        </p>
      ) : null}
      {reviews.isLoading ? (
        <LoadingState label="دریافت موارد منتظر بررسی…" />
      ) : reviews.isError ? (
        <div role="alert">
          <p>دریافت موارد انجام نشد.</p>
          <Button variant="soft" onClick={() => void reviews.refetch()}>
            تلاش مجدد
          </Button>
        </div>
      ) : pending.length ? (
        <ul className="grid gap-2" aria-label="غیبت‌های منتظر بررسی">
          {pending.map((review) => (
            <li
              key={review.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
            >
              <div className="min-w-0">
                <p className="font-bold">{review.studentName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {review.teacherName} · {new Date(review.sessionDate).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <Button
                variant="soft"
                onClick={() => {
                  mutation.reset();
                  setSelected(review);
                  setDecision(null);
                  setNote("");
                  setMarkOutsideSchool(false);
                }}
              >
                بررسی
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="موردی در انتظار بررسی نیست." />
      )}
      <ResponsiveDrawer
        open={Boolean(selected)}
        dismissible={!mutation.isPending}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setSelected(null);
        }}
        title={decision ? "مرحله ۲: تأیید تصمیم" : "مرحله ۱: بررسی دلیل غیبت"}
        description={selected?.studentName ?? "بررسی غیبت"}
        desktopSide="left"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[rgb(var(--surface-muted))] p-3">
            <p className="text-sm font-bold">دلیل ثبت‌شده</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {selected?.reason || "دلیلی ثبت نشده است."}
            </p>
          </div>
          {!decision ? (
            <>
              <label className="block text-sm font-bold">
                یادداشت بررسی (اختیاری)
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card p-3 font-normal"
                />
              </label>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setDecision("approved")}>
                  پذیرش دلیل
                </Button>
                <Button variant="soft" className="flex-1" onClick={() => setDecision("rejected")}>
                  رد دلیل
                </Button>
              </div>
              {selected?.contextType === "dorm" && auth.can("exit.manage") && (
                <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                  <input
                    type="checkbox"
                    checked={markOutsideSchool}
                    onChange={(event) => setMarkOutsideSchool(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    پس از پذیرش، دانش‌آموز را «خارج از مدرسه» ثبت کن و از آمار حاضرین کم کن.
                  </span>
                </label>
              )}
            </>
          ) : (
            <>
              <p className="text-sm leading-6">
                {decision === "approved"
                  ? "دلیل غیبت پذیرفته می‌شود. این تصمیم به معنی حضور دانش‌آموز نیست."
                  : "دلیل غیبت رد می‌شود. سابقه غیبت حفظ می‌شود."}
              </p>
              {note ? <p className="text-sm">یادداشت: {note}</p> : null}
              {mutation.isError ? (
                <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "ثبت تصمیم انجام نشد؛ دوباره تلاش کنید."}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="soft"
                  disabled={mutation.isPending}
                  onClick={() => setDecision(null)}
                >
                  بازگشت
                </Button>
                <Button
                  loading={mutation.isPending}
                  disabled={!auth.can("attendance.review")}
                  onClick={() => {
                    if (selected && decision)
                      mutation.mutate({
                        record: selected,
                        decision,
                        note,
                        outsideSchool: markOutsideSchool,
                        scope,
                      });
                  }}
                >
                  تأیید و ثبت تصمیم
                </Button>
              </div>
            </>
          )}
        </div>
      </ResponsiveDrawer>
    </Card>
  );
}
