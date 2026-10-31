import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import {
  listSupervisorAttendanceSessions,
  saveSupervisorAttendanceCheck,
  type SupervisorAttendanceSession,
} from "../api/attendance.api";

const statuses = [
  ["present", "حاضر"],
  ["absent", "غایب"],
  ["late", "تاخیر"],
  ["excused", "موجه"],
] as const;

export function SupervisorAttendancePanel() {
  const [sessions, setSessions] = useState<SupervisorAttendanceSession[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(
    () => sessions.find((item) => item.id === selectedId) ?? null,
    [sessions, selectedId],
  );
  const reload = () =>
    listSupervisorAttendanceSessions()
      .then((items) => {
        setSessions(items);
        setSelectedId((current) => current || items[0]?.id || "");
      })
      .catch(() => setError("فهرست جلسات نظارتی دریافت نشد."));
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    if (!selected) return;
    setMarks(
      Object.fromEntries(
        (selected.ownCheck?.entries ?? []).map((entry) => [entry.studentId, entry.status]),
      ),
    );
  }, [selected?.id]);
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await saveSupervisorAttendanceCheck(selected.id, {
        expectedRevision: selected.ownCheck?.revision,
        entries: selected.roster.map((student) => ({
          studentId: student.id,
          status: (marks[student.id] ?? "present") as "present" | "absent" | "late" | "excused",
        })),
      });
      reload();
    } catch {
      setError("ذخیره بررسی نظارتی انجام نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="space-y-4 rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-black">حضور و غیاب نظارتی</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          این فهرست مستقل از ثبت معلم است و فقط برای تطبیق مدیر ثبت می‌شود.
        </p>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-2 md:grid-cols-2">
        {sessions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`rounded-xl border p-3 text-right text-sm ${item.id === selectedId ? "border-brand bg-brand/10" : "border-[rgb(var(--border-subtle))]"}`}
          >
            <b>{item.className}</b>
            <span className="block text-xs text-slate-600 dark:text-slate-300">
              {item.bookName} · {item.teacherName} ·{" "}
              {new Date(item.sessionDate).toLocaleDateString("fa-IR")}
            </span>
          </button>
        ))}
      </div>
      {selected ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border-subtle))]">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-[rgb(var(--surface-muted))]">
                <tr>
                  <th className="p-3 text-right">دانش‌آموز</th>
                  {statuses.map(([, label]) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.roster.map((student) => (
                  <tr key={student.id} className="border-t border-[rgb(var(--border-subtle))]">
                    <td className="p-3 font-bold">{student.name}</td>
                    {statuses.map(([value, label]) => (
                      <td key={value} className="p-2 text-center">
                        <button
                          type="button"
                          aria-label={`${student.name} ${label}`}
                          onClick={() => setMarks((all) => ({ ...all, [student.id]: value }))}
                          className={`rounded-lg px-3 py-2 ${marks[student.id] === value ? "bg-brand text-white" : "bg-[rgb(var(--surface-muted))]"}`}
                        >
                          {label}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || !selected.roster.length}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-white disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Check size={18} />}ثبت
            بررسی نظارتی
          </button>
        </>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300">جلسه کلاسی قابل بررسی ندارید.</p>
      )}
    </section>
  );
}
