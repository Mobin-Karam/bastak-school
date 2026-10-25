import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { Card, ErrorState, LoadingState } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { getMyRewardLedger, getMyRewardSummary } from "../api/rewards.api";

export function MyRewardsPage() {
  const summary = useQuery({ queryKey: ["rewards", "me", "summary"], queryFn: getMyRewardSummary });
  const ledger = useQuery({ queryKey: ["rewards", "me", "ledger"], queryFn: () => getMyRewardLedger() });
  return <section className="grid gap-4" dir="rtl">
    <ManagementPageHeader eyebrow="حساب من" title="سکه‌های من" description="همه تغییرات سکه به‌صورت شفاف و قابل پیگیری ثبت می‌شوند." />
    {summary.isLoading ? <LoadingState label="در حال دریافت سکه‌ها…" /> : summary.isError ? <ErrorState title="سکه‌ها دریافت نشد." action={<button onClick={() => void summary.refetch()}>تلاش دوباره</button>} /> : <Card className="flex items-center gap-4 rounded-3xl border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30"><Coins className="size-10 text-amber-600" /><div><p className="text-sm text-slate-600">موجودی فعلی</p><strong className="text-3xl font-black">{(summary.data?.points ?? 0).toLocaleString("fa-IR")} سکه</strong></div></Card>}
    <Card className="space-y-3 rounded-3xl p-5"><h2 className="font-black">تاریخچهٔ تراکنش‌ها</h2>{ledger.isLoading ? <LoadingState label="در حال دریافت تاریخچه…" /> : ledger.isError ? <ErrorState title="تاریخچه دریافت نشد." /> : ledger.data?.items.length ? <ul className="divide-y divide-[rgb(var(--border-subtle))]">{ledger.data.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-3 py-3"><div><p className="font-bold">{item.reason}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}{item.contextName ? ` · ${item.contextName}` : ""}</p></div><strong className={item.points >= 0 ? "text-emerald-600" : "text-rose-600"}>{item.points > 0 ? "+" : ""}{item.points.toLocaleString("fa-IR")}</strong></li>)}</ul> : <p className="text-sm text-slate-500">هنوز تراکنشی ثبت نشده است.</p>}</Card>
  </section>;
}
