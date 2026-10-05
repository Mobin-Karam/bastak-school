import { Card, EmptyState } from "../../../shared/ui/ui";
import { PlannerCanvas } from "./PlannerCanvas";
import { useLocale } from "../../../shared/ui/locale";
import { plannerCopy } from "../model/planner-copy";

export function PlannerContent(props: any) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const { studentId } = props;
  return (
    <Card className="h-[calc(100vh-235px)] min-h-[480px] overflow-hidden p-0">
      {!studentId ? (
        <div className="grid h-full place-items-center p-6">
          <EmptyState title={copy.noStudent} />
        </div>
      ) : (
        <PlannerCanvas {...props} />
      )}
    </Card>
  );
}
