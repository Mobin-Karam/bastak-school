import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "../../../shared/types/domain";
import { StudentAllocationControl } from "../../../shared/ui/student-allocation-control";
import { Button, EmptyState } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useLocale } from "../../../shared/ui/locale";
import { listClasses } from "../../education/api/classes.api";
import {
  applyPlanTemplate,
  createPlanTemplate,
  getPlanTemplates,
  publishPlanTemplate,
  type PlanTemplate,
} from "../api/plan-templates.api";
import { plannerCopy } from "../model/planner-copy";

type Props = {
  organizationId: string;
  plans: Plan[];
  students: Parameters<typeof StudentAllocationControl>[0]["students"];
  canManage: boolean;
  canPublish: boolean;
  canApply: boolean;
  onClose: () => void;
  showClose?: boolean;
};

function templateDays(plans: Plan[], fallbackTitle: string) {
  return plans
    .slice()
    .sort((left, right) => left.planDate.localeCompare(right.planDate))
    .map((plan, offset) => ({
      offset,
      title: plan.title || fallbackTitle,
      motivationText: plan.motivationText || "",
      tasks: plan.tasks.map(
        ({ id: _id, completedAt: _completedAt, completion: _completion, ...task }) => task,
      ),
    }));
}

function interpolate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function PlanTemplateLibrary({
  organizationId,
  plans,
  students,
  canManage,
  canPublish,
  canApply,
  onClose,
  showClose = true,
}: Props) {
  const locale = useLocale();
  const copy = plannerCopy(locale.language);
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [targetStartDate, setTargetStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const templates = useQuery({
    queryKey: ["plan-templates", organizationId],
    queryFn: () => getPlanTemplates(organizationId),
  });
  const snapshot = useMemo(
    () => templateDays(plans, copy.templateDayFallback),
    [copy.templateDayFallback, plans],
  );
  const classes = useQuery({
    queryKey: ["classes", "plan-template-apply"],
    queryFn: () => listClasses(organizationId),
    enabled: canApply,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["plan-templates", organizationId] });
  const create = useMutation({
    mutationFn: () =>
      createPlanTemplate({
        organizationId,
        title,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        days: snapshot,
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTags("");
      void refresh();
    },
  });
  const publish = useMutation({
    mutationFn: publishPlanTemplate,
    onSuccess: refresh,
  });
  const apply = useMutation({
    mutationFn: () =>
      applyPlanTemplate(selectedTemplate!.id, { targetStudentIds, targetStartDate }),
    onSuccess: (result) => {
      notify(
        interpolate(copy.templateApplySucceeded, {
          created: result.created.length.toLocaleString(locale.profile.locale),
          skipped: result.skipped.length
            ? interpolate(copy.templateApplySkipped, {
                count: result.skipped.length.toLocaleString(locale.profile.locale),
              })
            : "",
        }),
      );
      setTargetStudentIds([]);
      setSelectedTemplate(null);
      void client.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.templateApplyFailed, "error"),
  });

  return (
    <div className="grid gap-5" dir={locale.profile.direction}>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {interpolate(copy.templateLibraryDescription, {
          days: snapshot.length.toLocaleString(locale.profile.locale),
        })}
      </p>
      {canManage ? (
        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) create.mutate();
          }}
        >
          <label className="grid gap-1 text-sm font-medium">
            {copy.templateTitle}
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {copy.templateDescription}
            <textarea
              className="min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={4000}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {copy.templateTags}
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              maxLength={2400}
              placeholder={copy.templateTagsPlaceholder}
            />
          </label>
          {create.isError ? (
            <p className="text-sm text-rose-700" role="alert">
              {copy.templateSaveFailed}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={!title.trim() || create.isPending || snapshot.length === 0}
          >
            {create.isPending ? copy.creatingTemplate : copy.createTemplate}
          </Button>
          {snapshot.length === 0 ? (
            <p className="text-xs text-amber-700">{copy.templateNeedsPlans}</p>
          ) : null}
        </form>
      ) : null}
      <section className="grid gap-2">
        <h3 className="text-sm font-bold">{copy.organizationTemplates}</h3>
        {templates.isLoading ? (
          <p className="text-sm text-slate-500">{copy.loadingOrganizations}</p>
        ) : null}
        {templates.isError ? (
          <p className="text-sm text-rose-700" role="alert">
            {copy.templatesLoadFailed}
          </p>
        ) : null}
        {!templates.isLoading && !templates.isError && !templates.data?.length ? (
          <EmptyState title={copy.noTemplates} />
        ) : null}
        {templates.data?.map((template) => (
          <article
            key={template.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {template.title}{" "}
                <span className="text-xs font-normal text-slate-500">
                  {copy.version} {template.version.toLocaleString(locale.profile.locale)}
                </span>
              </p>
              {template.description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {template.description}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                {copy.templateState[template.state]} ·{" "}
                {template.days.length.toLocaleString(locale.profile.locale)} {copy.templateDays}{" "}
                {template.tags.length ? `· ${template.tags.join("، ")}` : ""}
              </p>
            </div>
            {canPublish && template.state !== "PUBLISHED" && template.state !== "ARCHIVED" ? (
              <Button
                className="h-8"
                variant="soft"
                disabled={publish.isPending}
                onClick={() => publish.mutate(template.id)}
              >
                {copy.publish}
              </Button>
            ) : null}
            {canApply && template.state === "PUBLISHED" ? (
              <Button className="h-8" variant="soft" onClick={() => setSelectedTemplate(template)}>
                {copy.applyToAudience}
              </Button>
            ) : null}
          </article>
        ))}
      </section>
      {selectedTemplate ? (
        <section className="grid gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
          <div>
            <h3 className="text-sm font-bold">
              {interpolate(copy.applyTemplate, { title: selectedTemplate.title })}
            </h3>
            <p className="text-xs text-slate-500">{copy.applyTemplateDescription}</p>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            {copy.applyStartDate}
            <input
              type="date"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={targetStartDate}
              onChange={(event) => setTargetStartDate(event.target.value)}
            />
          </label>
          <StudentAllocationControl
            students={students}
            selectedIds={targetStudentIds}
            onChange={setTargetStudentIds}
            classes={classes.data || []}
            label={copy.templateAudience}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              loading={apply.isPending}
              disabled={!targetStudentIds.length || !targetStartDate}
              onClick={() => apply.mutate()}
            >
              {interpolate(copy.applyToStudents, {
                count: targetStudentIds.length.toLocaleString(locale.profile.locale),
              })}
            </Button>
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
              {copy.cancel}
            </Button>
          </div>
        </section>
      ) : null}
      {showClose ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            {copy.close}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
