import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { StudentAttendanceHistoryList } from "./StudentAttendanceHistoryList";

type StudentAttendanceProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: number;
  scope: string;
};

/** Home uses the same complete attendance timeline as the dedicated Student page. */
export function StudentAttendanceProfileDrawer({
  open,
  onOpenChange,
  points,
  scope,
}: StudentAttendanceProfileDrawerProps) {
  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="پرونده کامل حضور من"
      description="هر جلسه، دلیل و زمان ثبت حضور را اینجا ببینید."
      className="md:w-[min(34rem,92vw)]"
    >
      <section aria-label="تاریخچه کامل حضور" className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="flex items-center gap-2 text-sm font-black">
            <AttendanceCoin className="size-5 object-contain" /> سکه‌های حضور و رفتار
          </span>
          <strong className="text-xl">{points.toLocaleString("fa-IR")}</strong>
        </div>
        {open ? <StudentAttendanceHistoryList scope={scope} /> : null}
      </section>
    </ResponsiveDrawer>
  );
}
