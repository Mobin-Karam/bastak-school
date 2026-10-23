import { Check, Clock3, Minus, UserRound, ShieldCheck } from "lucide-react";
import { type AttendanceFilter, type AttendanceStatus } from "../model/attendance-workflow";

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
  {
    status: "excused",
    icon: ShieldCheck,
    label: "موجه",
    color:
      "border-sky-200 bg-sky-50/70 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
      {tiles.map(({ status, icon: Icon, label, color }) => (
        <button
          key={status}
          type="button"
          aria-pressed={filter === status}
          onClick={() => onFilter(filter === status ? "all" : status)}
          className={`flex min-h-[4.5rem] items-center gap-2 rounded-xl border px-3 py-2 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:min-h-20 sm:flex-col sm:justify-center sm:gap-1.5 sm:p-2 ${color} ${filter === status ? "ring-2 ring-current ring-offset-1" : ""}`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-current/10 sm:size-9">
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-col sm:justify-center">
            <span className="text-xs font-bold">{label}</span>
            <span className="text-lg font-black tabular-nums sm:text-2xl">
              {counts[status].toLocaleString("fa-IR")}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
