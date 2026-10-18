import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useAuth } from "../../auth";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState, ErrorState } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { useLocale } from "../../../shared/ui/locale";
import { listRecoveryRequests, moderateRecoveryRequest } from "../api/followup.api";
import { followupCopy } from "../model/followup-copy";

export function FollowUpPage() {
  const auth = useAuth();
  const { language } = useLocale();
  const copy = followupCopy(language);
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ["recovery-requests"], queryFn: listRecoveryRequests });
  const moderate = useMutation({
    mutationFn: moderateRecoveryRequest,
    onSuccess: async () => {
      notify(copy.updated, "success");
      await queryClient.invalidateQueries({ queryKey: ["recovery-requests"] });
    },
    onError: () => notify(copy.updateFailed, "error"),
  });
  const pending = (requests.data ?? []).filter((item) => item.status === "pending");

  return (
    <section className="space-y-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      {requests.isLoading ? (
        <Card role="status" className="p-8 text-center">
          {copy.loading}
        </Card>
      ) : null}
      {requests.isError ? (
        <ErrorState
          title={copy.loadFailed}
          action={
            <Button variant="soft" onClick={() => void requests.refetch()}>
              <RefreshCw size={16} /> {copy.retry}
            </Button>
          }
        />
      ) : null}
      {!requests.isLoading && !requests.isError && !pending.length ? (
        <EmptyState title={copy.empty} description={copy.emptyDescription} />
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {pending.map((item) => (
          <Card key={item.id} className="p-3 hover:border-brand/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="blue">{copy.request}</Badge>
                <h2 className="mt-2 font-bold">{item.student?.name ?? copy.student}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {copy.plan} {item.planDate ?? item.plan_date ?? "—"}
                </p>
              </div>
            </div>
            {item.reason ? <p className="mt-3 text-sm font-bold">{item.reason}</p> : null}
            {item.note ? (
              <p className="mt-2 rounded-md bg-[rgb(var(--surface-muted))] p-3 text-sm">
                {item.note}
              </p>
            ) : null}
            {auth.can("recovery_requests.manage") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={moderate.isPending && moderate.variables?.id === item.id}
                  onClick={() => moderate.mutate({ id: item.id, status: "resolved" })}
                >
                  <CheckCircle2 size={15} /> {copy.resolved}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={moderate.isPending && moderate.variables?.id === item.id}
                  onClick={() => moderate.mutate({ id: item.id, status: "dismissed" })}
                >
                  <XCircle size={15} /> {copy.dismiss}
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
