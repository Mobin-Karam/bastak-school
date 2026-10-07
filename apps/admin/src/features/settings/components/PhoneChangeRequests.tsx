import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, X } from "lucide-react";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { listPhoneChangeRequests, reviewPhoneChangeRequest } from "../api/settings.api";

export function PhoneChangeRequests() {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["account", "phone-change-requests"],
    queryFn: listPhoneChangeRequests,
  });
  const review = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      reviewPhoneChangeRequest(id, approved),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["account", "phone-change-requests"] });
      notify("درخواست بررسی شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "بررسی درخواست انجام نشد.", "error"),
  });
  if (requests.isLoading) return <LoadingState label="در حال دریافت درخواست‌ها…" />;
  if (requests.isError) return null;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <ClipboardList size={18} className="text-brand" />
        <h2 className="font-black">درخواست‌های تغییر شماره</h2>
      </div>
      {requests.data?.length ? (
        <ul className="mt-3 grid gap-2">
          {requests.data.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[rgb(var(--surface-muted))] p-3"
            >
              <div>
                <p className="text-sm font-bold">
                  {request.user?.firstName || request.user?.username || "کاربر"}
                </p>
                <p dir="ltr" className="mt-1 text-xs text-slate-500">
                  {request.requestedValue}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    request.status === "PENDING"
                      ? "amber"
                      : request.status === "APPROVED"
                        ? "green"
                        : "red"
                  }
                >
                  {request.status === "PENDING"
                    ? "در انتظار"
                    : request.status === "APPROVED"
                      ? "تأیید"
                      : "رد"}
                </Badge>
                {request.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      aria-label="تأیید تغییر شماره"
                      onClick={() => review.mutate({ id: request.id, approved: true })}
                    >
                      <Check size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="رد تغییر شماره"
                      onClick={() => review.mutate({ id: request.id, approved: false })}
                    >
                      <X size={15} />
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="درخواست در انتظار بررسی وجود ندارد." />
      )}
    </Card>
  );
}
