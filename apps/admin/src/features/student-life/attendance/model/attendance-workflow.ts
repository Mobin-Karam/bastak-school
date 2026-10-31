export type MarkedAttendanceStatus = "present" | "absent" | "late" | "excused";
export type AttendanceStatus = "unmarked" | MarkedAttendanceStatus;

export type AttendanceParticipant = {
  id: string;
  name: string;
  studentNumber: string;
  userId?: string | null;
  status: AttendanceStatus;
  approvedLeave?: { startsAt: string; endsAt: string } | null;
  overdueReturn?: boolean;
};

export type AttendanceFilter = "all" | AttendanceStatus;

/** Keep the four statuses together so every roster renders the same choices. */
export const attendanceStatuses: MarkedAttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

export const attendanceStatusMeta: Record<
  MarkedAttendanceStatus,
  { label: string; active: string; dot: string }
> = {
  present: {
    label: "حاضر",
    active:
      "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  absent: {
    label: "غایب",
    active: "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  late: {
    label: "تأخیر",
    active: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  excused: {
    label: "موجه",
    active: "border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    dot: "bg-sky-500",
  },
};
