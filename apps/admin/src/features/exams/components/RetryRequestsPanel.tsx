import { Check, X } from "lucide-react";
import { Button, Badge, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { examsCopy } from "../exams-locale";
import type { RetryRequest } from "../model/exam.types";

export function RetryRequestsPanel({
  requests,
  onReview,
}: {
  requests: RetryRequest[];
  onReview?: (request: RetryRequest, status: "approved" | "rejected") => void;
}) {
  const { language } = useLocale();
  const copy = examsCopy(language);
  if (!requests.length) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <details open>
        <summary className="cursor-pointer font-bold">
          {copy.retryRequests(requests.length)}
        </summary>

        <div className="divide-y rounded-md border bg-white">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-sm">
                    {request.examTitle || copy.untitledExam}
                  </strong>

                  {!onReview && <Badge tone="amber">{copy.awaitingAdvisor}</Badge>}
                </div>

                <p className="truncate text-xs text-slate-500">
                  {request.reason || request.message || copy.noExplanation}
                </p>
              </div>

              {onReview && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    aria-label={copy.approve}
                    title={copy.approve}
                    onClick={() => onReview(request, "approved")}
                  >
                    <Check size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    aria-label={copy.reject}
                    title={copy.reject}
                    onClick={() => onReview(request, "rejected")}
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}
