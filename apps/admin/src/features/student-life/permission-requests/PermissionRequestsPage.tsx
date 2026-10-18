import { useEffect, useId, useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { api } from "../../shared/api/api";
import { AdminList } from "../../shared/ui/admin-list";
import { CollectionToolbar } from "../../shared/ui/collection-toolbar";
import {
  ManagementPageHeader,
  ManagementStat,
  ManagementSummaryBar,
} from "../../shared/ui/management-workspace";
import { useModal } from "../../shared/ui/modal";
import { Badge, Button, Textarea } from "../../shared/ui/ui";
import { useLocale, useOptionalAdminLanguage } from "../../shared/ui/locale";
import { permissionRequestsCopy } from "./permission-requests-locale";

type Request = {
  id: string;
  studentName?: string;
  organizationName?: string;
  kind: string;
  title: string;
  details: string;
  requestedFor: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  supervisorNote: string;
  createdAt: string | null;
};
const statusTone = { PENDING: "amber", APPROVED: "green", REJECTED: "red" } as const;

export function PermissionRequestsPage() {
  const [rows, setRows] = useState<Request[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | Request["status"]>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const modal = useModal();
  const { language, profile } = useLocale();
  const copy = permissionRequestsCopy(language);
  const load = () => {
    setLoading(true);
    setError("");
    void api
      .get<Request[]>("/permission-requests")
      .then(setRows)
      .catch((value) => setError(value.message || copy.loadFailed))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fa-IR");
    return rows.filter(
      (row) =>
        (status === "ALL" || row.status === status) &&
        (!needle ||
          [row.title, row.details, row.studentName, row.organizationName, row.kind]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("fa-IR")
            .includes(needle)),
    );
  }, [query, rows, status]);
  async function decide(row: Request, next: "APPROVED" | "REJECTED", supervisorNote: string) {
    setBusy(row.id);
    try {
      const updated = await api.patch<Request>(`/permission-requests/${row.id}`, {
        status: next,
        supervisorNote,
      });
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      return true;
    } catch (value) {
      setError(value instanceof Error ? value.message : copy.saveFailed);
      return false;
    } finally {
      setBusy("");
    }
  }
  function openDecisionModal(row: Request, next: "APPROVED" | "REJECTED") {
    const approving = next === "APPROVED";
    modal.open({
      title: approving ? copy.approveTitle : copy.rejectTitle,
      description: approving ? copy.approveDescription : copy.rejectDescription,
      size: "md",
      content: (
        <PermissionDecisionModal
          request={row}
          decision={next}
          busy={busy === row.id}
          onCancel={modal.close}
          onSubmit={async (note) => {
            if (await decide(row, next, note)) modal.close();
          }}
        />
      ),
    });
  }
  const pending = rows.filter((row) => row.status === "PENDING").length;
  return (
    <section className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          <Button size="sm" variant="soft" loading={loading} onClick={load}>
            <RefreshCw size={14} />
            {copy.refresh}
          </Button>
        }
      />
      <ManagementSummaryBar label={copy.summary}>
        <div className="grid min-w-[min(100%,32rem)] flex-1 grid-cols-3 gap-2">
          <ManagementStat
            label={copy.pending}
            value={pending}
            active={status === "PENDING"}
            tone="warning"
            onClick={() => setStatus("PENDING")}
          />
          <ManagementStat
            label={copy.approved}
            value={rows.filter((row) => row.status === "APPROVED").length}
            active={status === "APPROVED"}
            tone="success"
            onClick={() => setStatus("APPROVED")}
          />
          <ManagementStat
            label={copy.allItems}
            value={rows.length}
            active={status === "ALL"}
            tone="muted"
            onClick={() => setStatus("ALL")}
          />
        </div>
      </ManagementSummaryBar>
      <AdminList
        label={copy.queue}
        description={copy.queueDescription}
        items={visible}
        loading={loading}
        error={Boolean(error)}
        errorTitle={error || undefined}
        onRetry={load}
        emptyTitle={status === "PENDING" ? copy.noPending : copy.noMatches}
        toolbar={
          <CollectionToolbar
            search={query}
            onSearchChange={setQuery}
            placeholder={copy.search}
            resultLabel={copy.result(visible.length, profile.locale)}
            onClear={
              query || status !== "PENDING"
                ? () => {
                    setQuery("");
                    setStatus("PENDING");
                  }
                : undefined
            }
            filters={(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded px-2 py-1 text-[11px] ${status === item ? "bg-[rgb(var(--surface-card))] font-semibold text-brand shadow-sm" : "text-slate-500"}`}
                onClick={() => setStatus(item)}
              >
                {item === "ALL" ? copy.all : copy.status[item]}
              </button>
            ))}
          />
        }
      >
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {visible.map((row) => (
            <article
              key={row.id}
              className="grid gap-3 px-1 py-3 sm:px-2 lg:grid-cols-[minmax(15rem,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink">{row.title}</h2>
                  <Badge tone={statusTone[row.status]}>{copy.status[row.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {row.studentName || copy.student} · {row.organizationName || copy.organization} ·{" "}
                  {row.kind}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {row.details}
                </p>
                {row.supervisorNote ? (
                  <p className="mt-2 rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1.5 text-xs text-slate-600">
                    {copy.note}: {row.supervisorNote}
                  </p>
                ) : null}
              </div>
              {row.status === "PENDING" ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    disabled={busy === row.id}
                    onClick={() => openDecisionModal(row, "APPROVED")}
                  >
                    <Check size={14} />
                    {copy.approve}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy === row.id}
                    onClick={() => openDecisionModal(row, "REJECTED")}
                  >
                    <X size={14} />
                    {copy.reject}
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </AdminList>
    </section>
  );
}

export function PermissionDecisionModal({
  request,
  decision,
  busy,
  onCancel,
  onSubmit,
}: {
  request: Request;
  decision: "APPROVED" | "REJECTED";
  busy: boolean;
  onCancel: () => void;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const language = useOptionalAdminLanguage();
  const copy = permissionRequestsCopy(language);
  const approving = decision === "APPROVED";
  const noteInstanceId = useId();
  const noteId = `permission-note-${request.id}-${noteInstanceId}`;
  const noteLabelId = `permission-note-label-${request.id}-${noteInstanceId}`;
  const noteHelpId = `permission-note-help-${request.id}-${noteInstanceId}`;
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(note.trim());
      }}
    >
      <section className="grid gap-2 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-ink">{request.title}</strong>
          <Badge tone={approving ? "green" : "red"}>
            {approving ? copy.approving : copy.rejecting}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {copy.requestFor(
            request.studentName || copy.student,
            request.organizationName || copy.organization,
          )}
        </p>
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{request.details}</p>
      </section>
      <div className="grid gap-1.5">
        <label id={noteLabelId} htmlFor={noteId} className="text-sm font-semibold text-ink">
          {copy.studentMessage} <span className="font-normal text-slate-500">{copy.optional}</span>
        </label>
        <p id={noteHelpId} className="text-xs leading-5 text-slate-500">
          {approving ? copy.approveHelp : copy.rejectHelp}
        </p>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-labelledby={noteLabelId}
          aria-describedby={noteHelpId}
          placeholder={approving ? copy.approvePlaceholder : copy.rejectPlaceholder}
          rows={3}
          autoFocus
        />
      </div>
      <p className="rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
        {approving ? copy.approveNotice : copy.rejectNotice}
      </p>
      <div className="flex flex-wrap justify-end gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
        <Button type="button" variant="soft" disabled={busy} onClick={onCancel}>
          {copy.cancel}
        </Button>
        <Button
          type="submit"
          variant={approving ? "primary" : "danger"}
          loading={busy}
          loadingLabel={copy.saving}
        >
          {approving ? copy.submitApprove : copy.submitReject}
        </Button>
      </div>
    </form>
  );
}
