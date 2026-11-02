import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../../identity/auth";
import {
  listScheduleSubstitutionRequests,
  reviewScheduleSubstitution,
  type ScheduleSubstitutionRequest,
} from "../api/schedule.api";
import { DataTable, type DataTableColumn } from "../../../../shared/ui/data-table";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { Button } from "../../../../shared/ui/ui";
import { notify } from "../../../../shared/ui/notifications";

/** Persistent principal inbox for one-time legacy schedule swaps. */
export function PrincipalScheduleSubstitutionInbox() {
  const auth = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const enabled = auth.can("schedule.publish");
  const requests = useQuery({
    queryKey: [
      "schedule",
      "substitution-requests",
      "principal",
      auth.context?.activeOrganization?.id,
    ],
    queryFn: listScheduleSubstitutionRequests,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      reviewScheduleSubstitution(id, decision),
    onSuccess: (_result, variables) => {
      void client.invalidateQueries({ queryKey: ["schedule", "substitution-requests"] });
      void client.invalidateQueries({ queryKey: ["schedule"] });
      notify(
        variables.decision === "approved" ? "جابه‌جایی یک‌باره تأیید شد." : "درخواست رد شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "بررسی درخواست انجام نشد.", "error"),
  });
  const pending = requests.data?.filter((request) => request.status === "pending") ?? [];
  const columns = useMemo<DataTableColumn<ScheduleSubstitutionRequest>[]>(
    () => [
      {
        id: "swap",
        label: "جابه‌جایی",
        primary: true,
        value: (row) => `${row.source?.title ?? "جلسه اول"} ↔ ${row.target?.title ?? "جلسه دوم"}`,
        cell: (row) => (
          <div className="grid gap-1">
            <strong>
              {row.source?.title ?? "جلسه اول"} ↔ {row.target?.title ?? "جلسه دوم"}
            </strong>
            <span className="text-xs text-slate-500">
              {row.freezeDate} ↔ {row.replacementDate}
            </span>
          </div>
        ),
      },
      {
        id: "teachers",
        label: "دبیران",
        value: (row) => `${teacherName(row.source)} / ${teacherName(row.target)}`,
      },
      {
        id: "block",
        label: "بازه مقصد",
        value: (row) => row.replacementTimeBlock?.name ?? "—",
        cell: (row) =>
          row.replacementTimeBlock
            ? `${row.replacementTimeBlock.name} · ${row.replacementTimeBlock.startTime}–${row.replacementTimeBlock.endTime}`
            : "—",
      },
      {
        id: "message",
        label: "پیام دبیر",
        value: (row) => row.message || "—",
      },
      {
        id: "actions",
        label: "بررسی",
        value: (row) => row.status,
        cell: (row) =>
          row.status === "pending" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={review.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  review.mutate({ id: row.id, decision: "approved" });
                }}
              >
                تأیید
              </Button>
              <Button
                disabled={review.isPending}
                variant="soft"
                onClick={(event) => {
                  event.stopPropagation();
                  review.mutate({ id: row.id, decision: "rejected" });
                }}
              >
                رد
              </Button>
            </div>
          ) : row.status === "approved" ? (
            "تأیید شد"
          ) : (
            "رد شد"
          ),
      },
    ],
    [review.isPending],
  );
  if (!enabled) return null;
  return (
    <>
      {pending.length ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[70] inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-black text-white shadow-xl outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label={`${pending.length} درخواست جابه‌جایی جلسه در انتظار بررسی`}
        >
          <BellRing size={18} aria-hidden="true" />
          <span>{pending.length} درخواست جابه‌جایی</span>
        </button>
      ) : null}
      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="درخواست‌های جابه‌جایی جلسه"
        description="هر تأیید، جای دو جلسه را فقط برای تاریخ‌های درخواست‌شده عوض می‌کند و برنامه هفتگی عادی را حفظ می‌کند."
        desktopSide="left"
        className="w-full max-w-5xl"
      >
        <div className="h-[min(70dvh,44rem)] min-h-0" dir="rtl">
          <DataTable
            className="h-full"
            scrollRows
            data={requests.data ?? []}
            columns={columns}
            getRowId={(row) => row.id}
            label="درخواست‌های جابه‌جایی جلسه"
            preferenceKey="principal-schedule-substitution-requests"
            loading={requests.isLoading}
            error={requests.isError}
            onRefresh={() => void requests.refetch()}
            emptyTitle="درخواستی وجود ندارد."
          />
        </div>
      </ResponsiveDrawer>
    </>
  );
}

function teacherName(entry: ScheduleSubstitutionRequest["source"]) {
  const teacher = entry?.teacher;
  return teacher
    ? [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.username
    : "دبیر تعیین نشده";
}
