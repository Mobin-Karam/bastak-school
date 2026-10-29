import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { notify } from "../../../../shared/ui/notifications";
import {
  getDormDelegates,
  getDormResidents,
  setDormWideDelegate,
  revokeDormWideDelegate,
  revokeDormDelegate,
  setDormDelegate,
} from "../api/attendance-operations.api";
import type { AttendanceParticipant } from "../model/attendance-workflow";

export function DormDelegateEditor({
  roomId,
  members,
  scope,
}: {
  roomId: string;
  members: AttendanceParticipant[];
  scope: string;
}) {
  const cache = useQueryClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [busy, setBusy] = useState(false);
  const delegates = useQuery({
    queryKey: ["attendance-delegates", scope],
    queryFn: getDormDelegates,
  });
  const residents = useQuery({
    queryKey: ["attendance-dorm-residents", scope],
    queryFn: getDormResidents,
    enabled: roomId === "all",
  });
  const eligible = roomId === "all" ? (residents.data ?? []) : members;
  const filteredEligible = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase("fa-IR");
    return eligible
      .filter((member) => member.userId)
      .filter((member) => !query || member.name.toLocaleLowerCase("fa-IR").includes(query));
  }, [eligible, studentSearch]);
  const label = roomId === "all" ? "تمام اتاق‌های خوابگاه" : "اتاق";
  const delegate = delegates.data?.find(
    (row) => (roomId === "all" ? row.dormWide : row.roomId === roomId) && !row.revoked,
  );
  useEffect(() => {
    setStudentId(delegate?.studentId ?? "");
    setStartsOn(delegate?.startsOn ?? today);
    setEndsOn(delegate?.endsOn ?? today);
  }, [delegate, today]);
  async function save(revoke = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (revoke && roomId === "all") await revokeDormWideDelegate();
      else if (revoke) await revokeDormDelegate(roomId);
      else if (roomId === "all") await setDormWideDelegate({ studentId, startsOn, endsOn });
      else await setDormDelegate(roomId, { studentId, startsOn, endsOn });
      await cache.invalidateQueries({ queryKey: ["attendance-delegates", scope] });
      notify(revoke ? `مسئولیت حضور ${label} لغو شد.` : `مسئول حضور ${label} تعیین شد.`, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تغییر مسئول انجام نشد.", "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <summary className="min-h-11 cursor-pointer font-bold text-ink">
        مسئول حضور {label}
        {delegate ? `: ${delegate.studentName}` : ""}
      </summary>
      <p className="mb-3 text-xs leading-6 text-slate-500">
        {roomId === "all"
          ? "اختیاری: یک ساکن را برای ثبت حضور اتاق‌ها در بازه انتخاب کنید. اگر مسئولی تعیین نکنید، خودتان می‌توانید حضور را ثبت کنید."
          : "اختیاری: یک ساکن همین اتاق را برای ثبت حضور در بازه انتخاب کنید. اگر مسئولی تعیین نکنید، خودتان می‌توانید حضور را ثبت کنید."}
        ثبت هر شب ساعت ۱۶ آغاز می‌شود.
      </p>
      {delegates.isError ? (
        <button type="button" onClick={() => void delegates.refetch()}>
          دریافت دوباره مسئول اتاق
        </button>
      ) : null}
      {roomId === "all" && residents.isError ? (
        <button type="button" onClick={() => void residents.refetch()}>
          دریافت دوباره ساکنان خوابگاه
        </button>
      ) : null}
      <label className="block text-sm font-semibold">
        جست‌وجوی دانش‌آموز
        <input
          type="search"
          inputMode="search"
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder="نام دانش‌آموز را بنویسید"
          aria-label="جست‌وجوی دانش‌آموز برای مسئول حضور"
          className="mt-2 min-h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card px-3"
        />
        <span className="mt-3 block">انتخاب دانش‌آموز</span>
        <AdaptiveSelect
          aria-label="مسئول حضور اتاق"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          disabled={
            busy ||
            delegates.isLoading ||
            delegates.isError ||
            (roomId === "all" && (residents.isLoading || residents.isError))
          }
          className="mt-2 min-h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-card px-3"
        >
          <option value="">انتخاب طلبه</option>
          {filteredEligible.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
        </AdaptiveSelect>
        {studentSearch && !filteredEligible.length ? (
          <span role="status" className="mt-2 block text-xs text-slate-500">
            دانش‌آموزی با این نام در ساکنان قابل انتخاب پیدا نشد.
          </span>
        ) : null}
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs font-bold">
          از شب
          <DatePicker value={startsOn} disabled={busy} onChange={setStartsOn} />
        </label>
        <label className="text-xs font-bold">
          تا شب (شامل این شب)
          <DatePicker value={endsOn} min={startsOn} disabled={busy} onChange={setEndsOn} />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={
            busy ||
            !studentId ||
            !startsOn ||
            !endsOn ||
            endsOn < startsOn ||
            delegates.isLoading ||
            delegates.isError
          }
          onClick={() => void save()}
          className="min-h-12 flex-1 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "در حال ذخیره…" : `تعیین مسئول ${label} و بازه`}
        </button>
        {delegate ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(true)}
            className="min-h-12 rounded-xl border border-rose-200 px-3 text-sm text-rose-700 disabled:opacity-50"
          >
            لغو مسئولیت
          </button>
        ) : null}
      </div>
    </details>
  );
}
