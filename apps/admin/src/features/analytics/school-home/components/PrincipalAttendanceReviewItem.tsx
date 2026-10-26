import type { PrincipalDashboardContract } from "../api/principal-dashboard.api";

export type PrincipalAttendanceReviewSession = NonNullable<
  PrincipalDashboardContract["sessionReviews"]
>["items"][number];

type PrincipalAttendanceReviewItemProps = {
  session: PrincipalAttendanceReviewSession;
  busy: boolean;
  onReview: (session: PrincipalAttendanceReviewSession) => void;
};

/** A reusable DataTable item for the principal's daily attendance-review inbox. */
export function PrincipalAttendanceReviewItem({
  session,
  busy,
  onReview,
}: PrincipalAttendanceReviewItemProps) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <strong>{session.title}</strong>
        <span className="text-xs text-slate-500">
          {new Date(session.sessionDate).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}
        </span>
      </div>
      <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        خوانده‌نشده · {session.status === "submitted" ? "ثبت‌شده" : "نهایی‌شده"}
      </span>
      <button
        type="button"
        className="min-h-11 w-fit rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          onReview(session);
        }}
      >
        {busy
          ? "در حال ثبت بازبینی…"
          : session.absent === 0
            ? "تأیید بازبینی و ثبت"
            : `مشاهدهٔ جزئیات ${session.absent.toLocaleString("fa-IR")} غایب`}
      </button>
    </div>
  );
}
