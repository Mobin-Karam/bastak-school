import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { listOrganizations } from "../../access/api/access.api";
import { useAuth } from "../../auth";
import { useStudentSelection } from "../../../shared/hooks/useStudentSelection";
import { Button, Card, ErrorState, LoadingState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { PlanTemplateLibrary } from "../components/PlanTemplateLibrary";
import { TemplateOrganizationPicker } from "../components/TemplateOrganizationPicker";
import { plannerCopy } from "../model/planner-copy";

export function PlanTemplatesPage() {
  const auth = useAuth();
  const { language } = useLocale();
  const copy = plannerCopy(language);
  const isPlatformAdmin = auth.hasRole("PLATFORM_ADMIN");
  const activeOrganizationId = auth.context?.activeOrganization?.id || "";
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(activeOrganizationId);
  const students = useStudentSelection({ enabled: auth.can("plans.read") });
  const organizations = useQuery({
    queryKey: ["organizations", "plan-templates-page"],
    queryFn: listOrganizations,
    enabled: isPlatformAdmin && !selectedOrganizationId,
  });

  if (!selectedOrganizationId && !isPlatformAdmin)
    return (
      <ErrorState
        title={copy.templatesUnavailable}
        description={copy.templatesUnavailableDescription}
      />
    );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-brand">{copy.organizationPlanning}</p>
          <h1 className="text-xl font-black">{copy.templates}</h1>
          <p className="mt-1 text-sm text-slate-500">{copy.templatesDescription}</p>
        </div>
        <Link
          to="/admin/planner"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowRight size={15} /> {copy.goToPlanner}
        </Link>
      </div>

      {!selectedOrganizationId ? (
        <Card className="p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold">
            <Building2 size={17} className="text-brand" /> {copy.selectOrganization}
          </div>
          {organizations.isLoading ? <LoadingState label={copy.loadingOrganizations} /> : null}
          {organizations.isError ? (
            <ErrorState
              title={copy.organizationsFailed}
              action={
                <Button variant="soft" onClick={() => void organizations.refetch()}>
                  {copy.retry}
                </Button>
              }
            />
          ) : null}
          {!organizations.isLoading && !organizations.isError ? (
            <TemplateOrganizationPicker
              organizations={organizations.data ?? []}
              onSelect={setSelectedOrganizationId}
            />
          ) : null}
        </Card>
      ) : (
        <Card className="p-4">
          {isPlatformAdmin && !activeOrganizationId ? (
            <div className="mb-4 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSelectedOrganizationId("")}>
                {copy.changeOrganization}
              </Button>
            </div>
          ) : null}
          <PlanTemplateLibrary
            organizationId={selectedOrganizationId}
            plans={[]}
            students={students.students}
            canManage={auth.can("plan_templates.manage")}
            canPublish={auth.can("plan_templates.publish")}
            canApply={auth.can("plans.create")}
            onClose={() => undefined}
            showClose={false}
          />
        </Card>
      )}
    </section>
  );
}
