import { useEffect, useState } from "react";
import { listSupervisorComparisons, type SupervisorComparison } from "../api/attendance.api";

const labels = {
  matched: "مطابق",
  mismatch: "مغایرت",
  teacher_missing: "ثبت معلم انجام نشده",
  supervisor_missing: "بررسی ناظر انجام نشده",
};
export function SupervisorComparisonPanel() {
  const [items, setItems] = useState<SupervisorComparison[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    listSupervisorComparisons()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);
  return (
    <section className="space-y-4 rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-black">تطبیق حضور معلم و ناظر</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          مدیر می‌تواند ثبت اصلی معلم را با مشاهده مستقل ناظر مقایسه کند.
        </p>
      </div>
      {failed ? (
        <p role="alert" className="text-rose-700 dark:text-rose-300">
          دریافت گزارش تطبیق انجام نشد.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border-subtle))]">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="bg-[rgb(var(--surface-muted))]">
              <tr>
                <th className="p-3 text-right">کلاس و کتاب</th>
                <th className="p-3 text-right">معلم</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">مغایرت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sessionId} className="border-t border-[rgb(var(--border-subtle))]">
                  <td className="p-3">
                    <b>{item.className}</b>
                    <span className="block text-xs text-slate-600 dark:text-slate-300">
                      {item.bookName} · {new Date(item.sessionDate).toLocaleDateString("fa-IR")}
                    </span>
                  </td>
                  <td className="p-3">{item.teacherName}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${item.comparisonStatus === "matched" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"}`}
                    >
                      {labels[item.comparisonStatus]}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {item.supervisorChecks
                      .reduce((sum, check) => sum + check.mismatchCount, 0)
                      .toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
