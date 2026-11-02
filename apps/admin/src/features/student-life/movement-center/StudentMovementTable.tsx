import { Check, DoorOpen, Eye, LogIn, ShieldAlert } from "lucide-react";
import {
  DataTable,
  type DataTableAction,
  type DataTableColumn,
} from "../../../shared/ui/data-table";
import { Badge } from "../../../shared/ui/ui";
import type { MovementState, StudentMovement } from "./api/student-movements.api";

type MovementAction = "departure" | "return" | "confirm_in_school";

const stateLabels: Record<Exclude<MovementState, "all">, string> = {
  review: "نیازمند تصمیم",
  awaiting_departure: "خروج امروز",
  outside: "خارج از مدرسه",
  overdue: "بازگشت معوق",
  archive: "بایگانی",
};

const stateTone: Record<
  Exclude<MovementState, "all">,
  "amber" | "blue" | "red" | "green" | "neutral"
> = {
  review: "amber",
  awaiting_departure: "blue",
  outside: "amber",
  overdue: "red",
  archive: "neutral",
};

const format = (value?: string | null) =>
  value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }) : "—";

const columns: DataTableColumn<StudentMovement>[] = [
  {
    id: "student",
    label: "دانش‌آموز",
    primary: true,
    value: (item) => item.leave?.studentName ?? item.exit?.studentName ?? "دانش‌آموز",
  },
  {
    id: "type",
    label: "نوع درخواست",
    value: (item) =>
      item.leave?.leaveType === "SCHOOL_EXIT"
        ? "خروج کوتاه‌مدت"
        : item.exit?.origin === "dorm_unauthorized"
          ? "بررسی خوابگاه"
          : "مرخصی دانش‌آموز",
  },
  {
    id: "reason",
    label: "دلیل",
    value: (item) => item.leave?.reason ?? item.exit?.reason ?? "",
  },
  {
    id: "state",
    label: "وضعیت",
    value: (item) => stateLabels[item.state],
    cell: (item) => <Badge tone={stateTone[item.state]}>{stateLabels[item.state]}</Badge>,
  },
  {
    id: "departure",
    label: "خروج",
    value: (item) =>
      format(
        item.exit?.actualDepartureAt ?? item.exit?.requestedDepartureAt ?? item.leave?.startDate,
      ),
  },
  {
    id: "return",
    label: "بازگشت",
    value: (item) =>
      format(item.exit?.actualReturnAt ?? item.exit?.expectedReturnAt ?? item.leave?.endDate),
  },
];

export function StudentMovementTable({
  items,
  loading,
  error,
  busy,
  canManageLeave,
  canManageExit,
  canResolveMovement,
  preferenceKey,
  onRefresh,
  onOpenDetails,
  onAction,
}: {
  items: StudentMovement[];
  loading: boolean;
  error: boolean;
  busy: boolean;
  canManageLeave: boolean;
  canManageExit: boolean;
  canResolveMovement: boolean;
  preferenceKey: string;
  onRefresh: () => void;
  onOpenDetails: (item: StudentMovement) => void;
  onAction: (action: MovementAction, item: StudentMovement) => void;
}) {
  const actions: DataTableAction<StudentMovement>[] = [
    {
      id: "details",
      label: "جزئیات تردد",
      icon: <Eye size={16} aria-hidden="true" />,
      onClick: onOpenDetails,
    },
    {
      id: "review",
      label: "بررسی درخواست",
      icon: <Check size={16} aria-hidden="true" />,
      visible: (item) => item.state === "review" && (item.leave ? canManageLeave : canManageExit),
      onClick: onOpenDetails,
    },
    {
      id: "departure",
      label: "ثبت خروج فیزیکی",
      icon: <DoorOpen size={16} aria-hidden="true" />,
      visible: (item) => canManageExit && item.state === "awaiting_departure",
      onClick: (item) => onAction("departure", item),
    },
    {
      id: "return",
      label: "تأیید بازگشت",
      icon: <LogIn size={16} aria-hidden="true" />,
      visible: (item) =>
        canManageExit && item.state === "outside" && Boolean(item.exit?.returnRequestedAt),
      onClick: (item) => onAction("return", item),
    },
    {
      id: "confirm-in-school",
      label: "تأیید حضور در مدرسه",
      icon: <Check size={16} aria-hidden="true" />,
      visible: (item) =>
        canResolveMovement && Boolean(item.exit?.actualDepartureAt) && !item.exit?.actualReturnAt,
      onClick: (item) => onAction("confirm_in_school", item),
    },
    {
      id: "resolve-overdue",
      label: "بررسی بازگشت معوق",
      icon: <ShieldAlert size={16} aria-hidden="true" />,
      visible: (item) => canResolveMovement && item.state === "overdue",
      onClick: onOpenDetails,
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      getRowId={(item) => item.id}
      label="فهرست تردد و مرخصی دانش‌آموزان"
      preferenceKey={preferenceKey}
      loading={loading}
      error={error}
      errorMessage="دریافت ترددها انجام نشد."
      busy={busy}
      onRefresh={onRefresh}
      emptyTitle="موردی در این بخش وجود ندارد."
      actions={actions}
      onRowClick={onOpenDetails}
    />
  );
}
