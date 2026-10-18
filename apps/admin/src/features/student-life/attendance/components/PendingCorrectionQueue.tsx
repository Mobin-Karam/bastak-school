import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { Button, Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { notify } from "../../../../shared/ui/notifications";
import { attendanceRequestId } from "../model/attendance-request-id";
import {
  getPendingAttendanceCorrections,
  reviewAttendanceCorrection,
  type PendingAttendanceCorrection,
} from "../api/attendance-operations.api.ts";

const statusLabel: Record<string, string> = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
};

/** Reviewer-only queue; a pending request never mutates the attendance record. */
export function PendingCorrectionQueue() {
  const auth = useAuth();
  const client = useQueryClient();
  const scope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const [selected, setSelected] = useState<PendingAttendanceCorrection | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const corrections = useQuery({
    queryKey: ["attendance-pending-corrections", scope],
    queryFn: getPendingAttendanceCorrections,
    enabled: auth.can("attendance.review"),
  });
  async function submit() {
    if (!selected || !decision || saving) return;
    setSaving(true);
    try {
      await reviewAttendanceCorrection(selected.id, {
        requestId: attendanceRequestId(),
        decision,
        note: note.trim() || undefined,
      });
      notify(
        decision === "approved" ? "اصلاح حضور تأیید و اعمال شد." : "درخواست اصلاح رد شد.",
        "success",
      );
      setSelected(null);
      setDecision(null);
      setNote("");
      await client.invalidateQueries({ queryKey: ["attendance-pending-corrections"] });
      await client.invalidateQueries({ queryKey: ["attendance-staff-sessions"] });
    } catch (error) {
      notify(error instanceof Error ? error.message : "بررسی اصلاح انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }
  if (!auth.can("attendance.review")) return null;
  return (
    <Card className="space-y-3 p-4">
      <header>
        <h2 className="font-black">درخواست‌های اصلاح حضور</h2>
        <p className="mt-1 text-sm text-slate-500">تا زمان تأیید، هیچ رکورد حضوری تغییر نمی‌کند.</p>
      </header>
      {corrections.isLoading ? <LoadingState label="دریافت درخواست‌های اصلاح…" /> : null}
      {corrections.isError ? (
        <div role="alert" className="text-sm text-rose-700">
          دریافت درخواست‌ها انجام نشد.{" "}
          <Button variant="soft" onClick={() => void corrections.refetch()}>
            تلاش مجدد
          </Button>
        </div>
      ) : null}
      {!corrections.isLoading && !corrections.isError && !corrections.data?.length ? (
        <EmptyState title="درخواست اصلاح منتظر بررسی نیست." />
      ) : null}
      <ul className="space-y-2" aria-label="اصلاح‌های منتظر بررسی">
        {corrections.data?.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border-subtle))] p-3"
          >
            <div className="min-w-0">
              <p className="font-bold">
                {item.studentName} · {item.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">درخواست‌کننده: {item.requestedBy}</p>
            </div>
            <Button
              variant="soft"
              onClick={() => {
                setSelected(item);
                setDecision(null);
                setNote("");
              }}
            >
              بررسی
            </Button>
          </li>
        ))}
      </ul>
      <ResponsiveModal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !saving) setSelected(null);
        }}
        title={decision ? "تأیید نهایی اصلاح" : "بررسی درخواست اصلاح"}
        description={selected ? `${selected.studentName} · ${selected.title}` : ""}
      >
        <div className="space-y-4">
          <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm leading-6">
            {selected?.reason}
          </p>
          <p className="text-sm">
            تغییر پیشنهادی: {statusLabel[String(selected?.before.status)] ?? "نامشخص"} ←{" "}
            {statusLabel[String(selected?.after.status)] ?? "نامشخص"}
          </p>
          {!decision ? (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setDecision("approved")}>
                تأیید
              </Button>
              <Button variant="soft" className="flex-1" onClick={() => setDecision("rejected")}>
                رد
              </Button>
            </div>
          ) : (
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
                <Button variant="soft" disabled={saving} onClick={() => setDecision(null)}>
                  بازگشت
                </Button>
                <Button className="flex-1" loading={saving} onClick={() => void submit()}>
                  تأیید و ثبت تصمیم
                </Button>
              </div>
            </>
          )}
        </div>
      </ResponsiveModal>
    </Card>
  );
}
