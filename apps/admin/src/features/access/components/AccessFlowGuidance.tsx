import { ShieldCheck } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { accessFlowGuidance, type AccessFlowScope } from "../model/access-flow";

export function AccessFlowGuidance({
  scope,
  canManage,
}: {
  scope: AccessFlowScope;
  canManage: boolean;
}) {
  const { language } = useLocale();
  const guidance = accessFlowGuidance(scope, canManage, language);

  return (
    <Card className="border-brand/20 bg-brand/5 p-4" aria-label={guidance.title}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={20} aria-hidden="true" />
        <div>
          <h2 className="font-black">{guidance.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {guidance.description}
          </p>
        </div>
      </div>
    </Card>
  );
}
