import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../identity/auth";
import { DataTable, type DataTableColumn } from "../../../shared/ui/data-table";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { attendanceRequestId } from "../../student-life/attendance/model/attendance-request-id";
import {
  getRewardTransactions,
  getStudentRewardLedger,
  getStudentRewardSummary,
  reverseRewardTransaction,
  type RewardTransaction,
} from "../api/rewards.api";

export function RewardsPage() {
  const auth = useAuth();
  const modal = useModal();
  const [sourceType, setSourceType] = useState("");
  const query = useQuery({
    queryKey: ["rewards", "transactions", auth.context?.activeOrganization?.id, sourceType],
    queryFn: () => getRewardTransactions({ sourceType: sourceType || undefined }),
  });
  const openDetails = (row: RewardTransaction) => {
    modal.open({
      title: "جزئیات تراکنش سکه",
      description: row.studentName,
      size: "md",
      content: <RewardTransactionDetails row={row} />,
    });
  };
  const columns: DataTableColumn<RewardTransaction>[] = [
    { id: "student", label: "دانش‌آموز", primary: true, value: (row) => row.studentName },
    {
      id: "points",
      label: "سکه",
      value: (row) => row.points,
      cell: (row) => (
        <strong className={row.points >= 0 ? "text-emerald-600" : "text-rose-600"}>
          {row.points > 0 ? "+" : ""}
          {row.points.toLocaleString("fa-IR")}
        </strong>
      ),
    },
    { id: "issuer", label: "ثبت‌کننده", value: (row) => row.awardedBy?.name ?? "سامانه" },
    { id: "reason", label: "دلیل", value: (row) => row.reason },
    { id: "context", label: "کلاس/محل", value: (row) => row.contextName ?? "—" },
    {
      id: "time",
      label: "زمان",
      value: (row) => row.createdAt,
      cell: (row) => new Date(row.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }),
    },
  ];
  return (
    <section className="h-[calc(100dvh-8rem)] min-h-0" dir="rtl">
      <DataTable
        className="h-full"
        scrollRows
        data={query.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openDetails}
        label="تراکنش‌های سکه"
        preferenceKey="rewards-transactions"
        loading={query.isLoading}
        error={query.isError}
        onRefresh={() => void query.refetch()}
        toolbar={
          <label className="flex shrink-0 items-center gap-2 text-sm font-bold">
            <span className="sr-only">منبع تراکنش</span>
            <select
              aria-label="منبع تراکنش"
              className="min-h-11 rounded-lg border bg-card px-3"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value)}
            >
              <option value="">همهٔ منابع</option>
              <option value="attendance">حضور و غیاب</option>
              <option value="manual">ثبت دستی</option>
              <option value="reversal">معکوس‌سازی</option>
            </select>
          </label>
        }
      />
    </section>
  );
}

function RewardTransactionDetails({ row }: { row: RewardTransaction }) {
  const auth = useAuth();
  const modal = useModal();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const summary = useQuery({
    queryKey: ["rewards", "students", row.studentId, "summary"],
    queryFn: () => getStudentRewardSummary(row.studentId),
  });
  const ledger = useQuery({
    queryKey: ["rewards", "students", row.studentId, "ledger"],
    queryFn: () => getStudentRewardLedger(row.studentId),
  });
  const reverse = useMutation({
    mutationFn: () =>
      reverseRewardTransaction(row.id, { requestId: attendanceRequestId(), reason }),
    onSuccess: () => {
      notify("تراکنش معکوس شد.", "success");
      modal.close();
      void client.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
  return (
    <div className="space-y-4" dir="rtl">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">مبلغ</dt>
          <dd className="font-black">{row.points.toLocaleString("fa-IR")}</dd>
        </div>
        <div>
          <dt className="text-slate-500">ثبت‌کننده</dt>
          <dd>{row.awardedBy?.name ?? "سامانه"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">کلاس/محل</dt>
          <dd>{row.contextName ?? "نامشخص"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">زمان</dt>
          <dd>{new Date(row.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</dd>
        </div>
        <div>
          <dt className="text-slate-500">موجودی دانش‌آموز</dt>
          <dd>
            {summary.isLoading
              ? "در حال دریافت…"
              : `${(summary.data?.points ?? 0).toLocaleString("fa-IR")} سکه`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">تاریخچهٔ دانش‌آموز</dt>
          <dd>
            {ledger.isLoading
              ? "در حال دریافت…"
              : `${(ledger.data?.total ?? 0).toLocaleString("fa-IR")} تراکنش`}
          </dd>
        </div>
      </dl>
      <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm">{row.reason}</p>
      {auth.can("rewards.reverse") && !row.reversalOfId ? (
        <>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 w-full rounded-xl border p-3"
            placeholder="دلیل حذف/معکوس‌سازی سکه"
          />
          <button
            type="button"
            disabled={reason.trim().length < 3 || reverse.isPending}
            onClick={() => reverse.mutate()}
            className="min-h-11 w-full rounded-xl bg-rose-600 font-bold text-white disabled:opacity-50"
          >
            {reverse.isPending ? "در حال ثبت…" : "معکوس‌سازی تراکنش نامعتبر"}
          </button>
        </>
      ) : null}
    </div>
  );
}
