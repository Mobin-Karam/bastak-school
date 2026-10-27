import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../identity/auth";
import { DataTable, type DataTableColumn } from "../../../shared/ui/data-table";
import { useModal } from "../../../shared/ui/modal";
import { getRewardTransactions, type RewardTransaction } from "../api/rewards.api";
import { RewardTransactionDetails } from "../components/RewardTransactionDetails";

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
      content: <RewardTransactionDetails transactionId={row.id} initialTransaction={row} />,
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
