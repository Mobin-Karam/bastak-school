import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../shared/api/api";
import { Button, Card, EmptyState } from "../../../shared/ui/ui";
import {
  listAttendanceAbsenceReviews,
  listLiveAttendanceRecords,
  reviewAttendanceAbsence,
  type AttendanceAbsenceReview,
} from "../api/attendance.api";

/** Live, server-authorized absence-reason review for principals and supervisors. */
export function AttendanceReviewQueue() {
  const client = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const reviews = useQuery({
    queryKey: ["attendance", "absence-reviews"],
    queryFn: () => listAttendanceAbsenceReviews(),
  });
  const liveRecords = useQuery({
    queryKey: ["attendance", "live-records"],
    queryFn: () => listLiveAttendanceRecords(),
  });
  useEffect(() => {
    const stream = api.openEvents((type) => {
      if (type === "attendance.updated" || type === "attendance.reviewed")
        void client.invalidateQueries({ queryKey: ["attendance"] });
    });
    return () => stream.close();
  }, [client]);
  const mutation = useMutation({
    mutationFn: ({ record, decision }: { record: AttendanceAbsenceReview; decision: "approved" | "rejected" }) =>
      reviewAttendanceAbsence(record.id, { decision }),
    onSuccess: (_, { decision }) => {
      setNotice(decision === "approved" ? "دلیل غیبت پذیرفته و وضعیت موجه شد." : "دلیل غیبت رد شد و استاد در جریان قرار گرفت.");
      void client.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
  const pending = (reviews.data ?? []).filter((review) => review.reviewStatus === "pending");
  return (
    <Card className="border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/15">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><ClipboardCheck size={20} aria-hidden="true" /></span>
          <div><h2 className="text-sm font-black text-ink">بررسی زنده غیبت‌ها</h2><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{pending.length ? `${pending.length.toLocaleString("fa-IR")} دلیل غیبت در انتظار تصمیم است` : "موردی برای بررسی ندارید"}</p></div>
        </div>
        {reviews.isFetching ? <LoaderCircle className="animate-spin text-amber-700" size={17} aria-label="به‌روزرسانی" /> : null}
      </header>
      {notice ? <p role="status" className="mt-3 rounded-lg bg-card px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
      {reviews.isError ? <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">صف بررسی دریافت نشد؛ دوباره تلاش کنید.</p> : pending.length ? (
        <ul className="mt-3 grid gap-2" aria-label="غیبت‌های منتظر بررسی">
          {pending.map((review) => <li key={review.id} className="rounded-xl border border-amber-200 bg-card p-3 dark:border-amber-900/60">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-black text-ink">{review.studentName}</p><p className="mt-0.5 text-[11px] text-slate-500">ثبت‌شده توسط {review.teacherName} · {new Date(review.sessionDate).toLocaleDateString("fa-IR")}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">در انتظار</span></div>
            <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-200"><span className="font-bold">دلیل استاد: </span>{review.reason || "دلیلی ثبت نشده است."}</p>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ record: review, decision: "approved" })}><Check size={15} aria-hidden="true" /> پذیرش و موجه‌کردن</Button><Button size="sm" variant="soft" disabled={mutation.isPending} onClick={() => mutation.mutate({ record: review, decision: "rejected" })}><X size={15} aria-hidden="true" /> رد دلیل</Button></div>
          </li>)}
        </ul>
      ) : <div className="mt-3"><EmptyState title="همه دلیل‌های غیبت بررسی شده‌اند." /></div>}
      {liveRecords.data?.length ? <div className="mt-4 border-t border-amber-200 pt-3 dark:border-amber-900/60"><p className="text-xs font-black text-ink">آخرین حضورهای ثبت‌شده</p><ul className="mt-2 grid gap-1 sm:grid-cols-2" aria-label="آخرین وضعیت حضور دانش‌آموزان">{liveRecords.data.slice(0, 12).map((record) => <li key={record.id} className="flex items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2 text-xs"><span className="truncate font-bold text-ink">{record.studentName}</span><span className={record.status === "present" ? "font-bold text-emerald-700 dark:text-emerald-300" : record.status === "absent" ? "font-bold text-rose-700 dark:text-rose-300" : "font-bold text-sky-700 dark:text-sky-300"}>{record.status === "present" ? "حاضر" : record.status === "absent" ? "غایب" : record.status === "late" ? "با تأخیر" : "موجه"}</span></li>)}</ul></div> : null}
    </Card>
  );
}
