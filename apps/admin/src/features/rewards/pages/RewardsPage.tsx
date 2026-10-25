import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../identity/auth";
import { DataTable, type DataTableColumn } from "../../../shared/ui/data-table";
import { ErrorState, LoadingState, Card } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { attendanceRequestId } from "../../student-life/attendance/model/attendance-request-id";
import { getRewardTransactions, reverseRewardTransaction, type RewardTransaction } from "../api/rewards.api";

export function RewardsPage() {
  const auth = useAuth(); const modal = useModal(); const client = useQueryClient(); const [reason, setReason] = useState(""); const [sourceType, setSourceType] = useState("");
  const query = useQuery({ queryKey: ["rewards", "transactions", auth.context?.activeOrganization?.id, sourceType], queryFn: () => getRewardTransactions({ sourceType: sourceType || undefined }) });
  const reverse = useMutation({ mutationFn: (row: RewardTransaction) => reverseRewardTransaction(row.id, { requestId: attendanceRequestId(), reason }), onSuccess: () => { notify("تراکنش معکوس شد.", "success"); modal.close(); void client.invalidateQueries({ queryKey: ["rewards"] }); } });
  const openDetails = (row: RewardTransaction) => modal.open({ title: "جزئیات تراکنش سکه", description: row.studentName, size: "md", content: <div className="space-y-4" dir="rtl"><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">مبلغ</dt><dd className="font-black">{row.points.toLocaleString("fa-IR")}</dd></div><div><dt className="text-slate-500">ثبت‌کننده</dt><dd>{row.awardedBy?.name ?? "سامانه"}</dd></div><div><dt className="text-slate-500">کلاس/محل</dt><dd>{row.contextName ?? "نامشخص"}</dd></div><div><dt className="text-slate-500">زمان</dt><dd>{new Date(row.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</dd></div></dl><p className="rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-sm">{row.reason}</p>{auth.can("rewards.reverse") && !row.reversalOfId ? <><textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 w-full rounded-xl border p-3" placeholder="دلیل حذف/معکوس‌سازی سکه" /><button type="button" disabled={reason.trim().length < 3 || reverse.isPending} onClick={() => reverse.mutate(row)} className="min-h-11 w-full rounded-xl bg-rose-600 font-bold text-white disabled:opacity-50">{reverse.isPending ? "در حال ثبت…" : "معکوس‌سازی تراکنش نامعتبر"}</button></> : null}</div> });
  const columns: DataTableColumn<RewardTransaction>[] = [
    { id: "student", label: "دانش‌آموز", primary: true, value: (row) => row.studentName },
    { id: "points", label: "سکه", value: (row) => row.points, cell: (row) => <strong className={row.points >= 0 ? "text-emerald-600" : "text-rose-600"}>{row.points > 0 ? "+" : ""}{row.points.toLocaleString("fa-IR")}</strong> },
    { id: "issuer", label: "ثبت‌کننده", value: (row) => row.awardedBy?.name ?? "سامانه" },
    { id: "reason", label: "دلیل", value: (row) => row.reason },
    { id: "context", label: "کلاس/محل", value: (row) => row.contextName ?? "—" },
    { id: "time", label: "زمان", value: (row) => row.createdAt, cell: (row) => new Date(row.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }) },
  ];
  return <section className="grid gap-4" dir="rtl"><ManagementPageHeader eyebrow="مدیریت مدرسه" title="تراکنش‌های سکه" description="ثبت‌کننده، دریافت‌کننده، دلیل، زمان و محل هر تغییر سکه." /><label className="w-full max-w-xs text-sm font-bold">منبع تراکنش<select className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3" value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option value="">همهٔ منابع</option><option value="attendance">حضور و غیاب</option><option value="manual">ثبت دستی</option><option value="reversal">معکوس‌سازی</option></select></label>{query.isLoading ? <LoadingState label="در حال دریافت تراکنش‌ها…" /> : query.isError ? <ErrorState title="تراکنش‌ها دریافت نشد." action={<button onClick={() => void query.refetch()}>تلاش دوباره</button>} /> : <Card className="rounded-3xl p-3"><DataTable data={query.data?.items ?? []} columns={columns} getRowId={(row) => row.id} onRowClick={openDetails} label="تراکنش‌های سکه" preferenceKey="rewards-transactions" /></Card>}</section>;
}
