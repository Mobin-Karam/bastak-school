import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useAuth } from "../../identity/auth";
import { ErrorState, LoadingState } from "../../../shared/ui/ui";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { createRequestId } from "../../../shared/lib/request-id";
import {
  getRewardTransaction,
  getStudentRewardLedger,
  getStudentRewardSummary,
  reverseRewardTransaction,
  type RewardTransaction,
} from "../api/rewards.api";

/** Shared, live transaction detail surface for the principal dashboard and audit table. */
export function RewardTransactionDetails({
  transactionId,
  initialTransaction,
}: {
  transactionId: string;
  initialTransaction?: RewardTransaction;
}) {
  const auth = useAuth();
  const modal = useModal();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const transactionQuery = useQuery({
    queryKey: ["rewards", "transactions", transactionId],
    queryFn: () => getRewardTransaction(transactionId),
    placeholderData: initialTransaction,
  });
  const transaction = transactionQuery.data;
  const summary = useQuery({
    queryKey: ["rewards", "students", transaction?.studentId, "summary"],
    queryFn: () => getStudentRewardSummary(transaction!.studentId),
    enabled: Boolean(transaction),
  });
  const ledger = useQuery({
    queryKey: ["rewards", "students", transaction?.studentId, "ledger"],
    queryFn: () => getStudentRewardLedger(transaction!.studentId),
    enabled: Boolean(transaction),
  });
  const reverse = useMutation({
    mutationFn: () =>
      reverseRewardTransaction(transactionId, { requestId: createRequestId(), reason }),
    onSuccess: () => {
      notify("تراکنش معکوس شد.", "success");
      modal.close();
      void client.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  if (!transaction && transactionQuery.isLoading)
    return <LoadingState label="در حال دریافت جزئیات…" />;
  if (!transaction)
    return (
      <ErrorState
        title="جزئیات تراکنش دریافت نشد."
        action={<button onClick={() => void transactionQuery.refetch()}>تلاش دوباره</button>}
      />
    );

  const canReverse =
    auth.can("rewards.reverse") && !transaction.reversalOfId && !transaction.reversedById;
  return (
    <div className="space-y-4" dir="rtl">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Fact label="مبلغ">
          <span className={transaction.points >= 0 ? "text-emerald-700" : "text-rose-700"}>
            {transaction.points > 0 ? "+" : ""}
            {transaction.points.toLocaleString("fa-IR")}
          </span>
        </Fact>
        <Fact label="ثبت‌کننده">{transaction.awardedBy?.name ?? "سامانه"}</Fact>
        <Fact label="کلاس/محل">{transaction.contextName ?? "نامشخص"}</Fact>
        <Fact label="زمان">
          {new Date(transaction.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}
        </Fact>
        <Fact label="موجودی دانش‌آموز">
          {summary.isLoading
            ? "در حال دریافت…"
            : `${(summary.data?.points ?? 0).toLocaleString("fa-IR")} سکه`}
        </Fact>
        <Fact label="تاریخچهٔ دانش‌آموز">
          {ledger.isLoading
            ? "در حال دریافت…"
            : `${(ledger.data?.total ?? 0).toLocaleString("fa-IR")} تراکنش`}
        </Fact>
      </dl>
      <p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm">{transaction.reason}</p>
      {transaction.reversalOfId ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          این تراکنش، معکوس‌سازیِ یک تراکنش قبلی است.
        </p>
      ) : transaction.reversedById ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          این تراکنش معکوس شده و در سابقه حفظ شده است.
        </p>
      ) : null}
      {canReverse ? (
        <div className="space-y-3 border-t border-[rgb(var(--border-subtle))] pt-4">
          <label className="grid gap-2 text-sm font-bold">
            دلیل معکوس‌سازی
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 w-full rounded-xl border p-3"
              placeholder="دلیل حذف/معکوس‌سازی سکه"
            />
          </label>
          <button
            type="button"
            disabled={reason.trim().length < 3 || reverse.isPending}
            onClick={() => reverse.mutate()}
            className="min-h-11 w-full rounded-xl bg-rose-600 font-bold text-white disabled:opacity-50"
          >
            {reverse.isPending ? "در حال ثبت…" : "معکوس‌سازی تراکنش نامعتبر"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}
