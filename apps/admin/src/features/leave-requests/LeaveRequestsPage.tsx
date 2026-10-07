import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { api } from "../../shared/api/api";
import { Button, Card, EmptyState, Input, Badge } from "../../shared/ui/ui";
import { useLocale } from "../../shared/ui/locale";
import { leaveRequestsCopy } from "./leave-requests-locale";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
type LeaveRequest = { id: string; studentName: string | null; organizationName: string; leaveType: string; startDate: string; endDate: string; reason: string; note: string; status: Status };
const tones: Record<Status, "warning" | "success" | "danger" | "info" | "neutral"> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral", COMPLETED: "info" };

export function LeaveRequestsPage() {
  const { language, profile } = useLocale();
  const copy = leaveRequestsCopy(language);
  const [rows, setRows] = useState<LeaveRequest[]>([]), [query, setQuery] = useState(""), [filter, setFilter] = useState<Status | "ALL">("PENDING"), [loading, setLoading] = useState(true), [error, setError] = useState(""), [busy, setBusy] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setRows(await api.get<LeaveRequest[]>("/leave-requests")); } catch (e) { setError(e instanceof Error ? e.message : copy.loadFailed); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => { const needle = query.trim().toLocaleLowerCase("fa-IR"); return rows.filter((row) => (filter === "ALL" || row.status === filter) && (!needle || [row.studentName, row.organizationName, row.reason, row.leaveType].filter(Boolean).join(" ").toLocaleLowerCase("fa-IR").includes(needle))); }, [filter, query, rows]);
  const review = async (row: LeaveRequest, status: "APPROVED" | "REJECTED") => { setBusy(row.id); setError(""); try { const updated = await api.patch<LeaveRequest>(`/leave-requests/${row.id}`, { status }); setRows((items) => items.map((item) => item.id === row.id ? updated : item)); } catch (e) { setError(e instanceof Error ? e.message : copy.saveFailed); } finally { setBusy(""); } };
  return <section className="grid gap-4" aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-brand">{copy.eyebrow}</p><h1 className="mt-1 text-2xl font-black">{copy.title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{copy.description}</p></div><Button variant="soft" loading={loading} onClick={() => void load()}><RefreshCw size={16}/>{copy.refresh}</Button></header>
    <Card className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.search} aria-label={copy.search}/><div className="flex flex-wrap gap-1" role="group" aria-label={copy.summary}>{(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((status) => <Button key={status} size="sm" variant={filter === status ? "primary" : "ghost"} onClick={() => setFilter(status)}>{status === "ALL" ? copy.all : copy.status[status]}</Button>)}</div></Card>
    {error ? <Card className="border-danger/30 p-4 text-sm text-danger">{error}</Card> : null}
    <Card className="divide-y divide-[rgb(var(--border-subtle))]">{!loading && !visible.length ? <EmptyState title={filter === "PENDING" ? copy.noPending : copy.noMatches} /> : visible.map((row) => <article key={row.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{row.studentName || copy.student}</h2><Badge tone={tones[row.status]}>{copy.status[row.status]}</Badge></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.reason}</p><p className="mt-1 text-xs text-slate-500">{new Date(row.startDate).toLocaleDateString(profile.locale)} — {new Date(row.endDate).toLocaleDateString(profile.locale)} · {row.organizationName}</p>{row.note ? <p className="mt-2 text-xs text-slate-500">{copy.note}: {row.note}</p> : null}</div>{row.status === "PENDING" ? <div className="flex gap-2"><Button size="sm" loading={busy === row.id} onClick={() => void review(row, "APPROVED")}><Check size={15}/>{copy.approve}</Button><Button size="sm" variant="danger" disabled={busy === row.id} onClick={() => void review(row, "REJECTED")}><X size={15}/>{copy.reject}</Button></div> : null}</article>)}</Card>
  </section>;
}
