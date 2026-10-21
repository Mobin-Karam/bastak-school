import { Check, Clock3, Minus, UserRound } from "lucide-react";
import {
  attendanceStatusMeta,
  type AttendanceFilter,
  type AttendanceStatus,
} from "../model/attendance-workflow";

const tiles = [
  {
    status: "unmarked",
    icon: UserRound,
    label: "نامشخص",
    color:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200",
  },
  {
    status: "present",
    icon: Check,
    label: "حاضر",
    color:
      "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  {
    status: "absent",
    icon: Minus,
    label: "غایب",
    color:
      "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
  },
  {
    status: "late",
    icon: Clock3,
    label: "تأخیر",
    color:
      "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  },
] as const;
export function AttendanceStatusTiles({
  counts,
  filter,
  onFilter,
}: {
  counts: Record<AttendanceStatus, number>;
  filter: AttendanceFilter;
  onFilter: (filter: AttendanceFilter) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {tiles.map(({ status, icon: Icon, label, color }) => (
        <button
          key={status}
          type="button"
          aria-pressed={filter === status}
          onClick={() => onFilter(filter === status ? "all" : status)}
          className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 sm:min-h-24 ${color} ${filter === status ? "ring-2 ring-current" : ""}`}
        >
          <span className="grid size-9 place-items-center rounded-full bg-current/10">
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="text-2xl font-black tabular-nums">
            {counts[status].toLocaleString("fa-IR")}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold">
            <span
              className={`size-1.5 rounded-full ${status === "unmarked" ? "bg-slate-400" : attendanceStatusMeta[status].dot}`}
            />
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
