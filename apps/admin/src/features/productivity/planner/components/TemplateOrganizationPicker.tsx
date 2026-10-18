import type { PortalOrganization } from "../../access/api/access.api";
import { Button, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { plannerCopy } from "../model/planner-copy";

export function TemplateOrganizationPicker({
  organizations,
  onSelect,
  onClose,
}: {
  organizations: PortalOrganization[];
  onSelect: (organizationId: string) => void;
  onClose?: () => void;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  if (!organizations.length)
    return (
      <div className="grid gap-4">
        <EmptyState title={copy.noTemplateOrganizations} />
        {onClose ? (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              {copy.close}
            </Button>
          </div>
        ) : null}
      </div>
    );

  return (
    <div className="grid gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">{copy.templateOrganizationHelp}</p>
      <div className="grid max-h-80 gap-2 overflow-y-auto">
        {organizations.map((organization) => (
          <Button
            key={organization.id}
            variant="soft"
            className="justify-between"
            onClick={() => onSelect(organization.id)}
          >
            <span>{organization.name}</span>
            <span className="text-xs text-slate-500">{organization.type}</span>
          </Button>
        ))}
      </div>
      {onClose ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            {copy.cancel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
