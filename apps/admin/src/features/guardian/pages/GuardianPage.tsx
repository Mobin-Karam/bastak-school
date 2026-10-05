import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, GraduationCap, Heart, RefreshCw } from "lucide-react";
import { useAuth } from "../../auth";
import { useLocale } from "../../../shared/ui/locale";
import { notify } from "../../../shared/ui/notifications";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Select,
  Textarea,
} from "../../../shared/ui/ui";
import { guardianApi } from "../api/guardian.api";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { guardianCopy } from "../model/guardian-copy";

export function GuardianPage() {
  const auth = useAuth();
  const { formatDate, language } = useLocale();
  const copy = guardianCopy[language];
  const formatNumber = (value: number) =>
    value.toLocaleString(language === "fa" ? "fa-IR" : "en-US");
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const children = useQuery({ queryKey: ["guardian", "students"], queryFn: guardianApi.students });
  const relatedStudents = useQuery({
    queryKey: ["guardian", "relationships"],
    queryFn: guardianApi.relatedStudents,
  });
  const resources = useQuery({
    queryKey: ["guardian", studentId, "resources"],
    queryFn: () => guardianApi.assignedResources(studentId),
    enabled: Boolean(studentId),
  });
  useEffect(() => {
    if (!studentId && children.data?.[0]) setStudentId(children.data[0].id);
  }, [children.data, studentId]);

  const enabled = Boolean(studentId);
  const dashboard = useQuery({
    queryKey: ["guardian", studentId, "dashboard"],
    queryFn: () => guardianApi.dashboard(studentId),
    enabled,
  });
  const progress = useQuery({
    queryKey: ["guardian", studentId, "progress"],
    queryFn: () => guardianApi.progress(studentId),
    enabled,
  });
  const schedule = useQuery({
    queryKey: ["guardian", studentId, "schedule"],
    queryFn: () => guardianApi.schedule(studentId),
    enabled,
  });
  const exams = useQuery({
    queryKey: ["guardian", studentId, "exams"],
    queryFn: () => guardianApi.exams(studentId),
    enabled,
  });
  const reports = useQuery({
    queryKey: ["guardian", studentId, "reports"],
    queryFn: () => guardianApi.reports(studentId),
    enabled,
  });
  const detailQueries = [dashboard, progress, schedule, exams, reports];
  const encouragement = useMutation({
    mutationFn: () => guardianApi.encourage(studentId, { message, kind: "SUPPORT" }),
    onSuccess: async () => {
      setMessage("");
      notify(copy.encouragementSent, "success");
      await queryClient.invalidateQueries({ queryKey: ["guardian", studentId] });
    },
    onError: () => notify(copy.encouragementFailed, "error"),
  });
  const loading = children.isLoading || (enabled && detailQueries.some((query) => query.isLoading));
  const failed = children.isError || detailQueries.some((query) => query.isError);
  const weekly = progress.data?.weekly ?? dashboard.data?.weekly;

  if (children.isLoading)
    return (
      <Card role="status" className="p-8 text-center">
        {copy.loadingFamily}
      </Card>
    );
  if (children.isError)
    return (
      <ErrorState
        title={copy.studentsLoadFailed}
        action={
          <Button onClick={() => void children.refetch()}>
            <RefreshCw size={16} /> {copy.retry}
          </Button>
        }
      />
    );
  if (!children.data?.length)
    return (
      <EmptyState title={copy.noActiveStudent} description={copy.noActiveStudentDescription} />
    );

  return (
    <section className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <Card className="p-3">
        <Field label={copy.selectStudent}>
          <Select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {children.data.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      {failed ? (
        <ErrorState
          title={copy.detailLoadFailed}
          action={
            <Button
              variant="soft"
              onClick={() => void Promise.all(detailQueries.map((query) => query.refetch()))}
            >
              <RefreshCw size={16} /> {copy.reload}
            </Button>
          }
        />
      ) : null}
      {loading ? (
        <Card role="status" className="p-8 text-center">
          {copy.loadingStudentView}
        </Card>
      ) : null}
      {!loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label={copy.weeklyProgress}
              value={`${formatNumber(weekly?.completionPercent ?? 0)}${copy.percent}`}
            />
            <Metric
              label={copy.completedActivity}
              value={`${formatNumber(weekly?.completedTasks ?? 0)} ${copy.of} ${formatNumber(weekly?.totalTasks ?? 0)}`}
            />
            <Metric
              label={copy.weeklyStudy}
              value={`${formatNumber(weekly?.studyMinutes ?? 0)} ${copy.minute}`}
            />
            <Metric label={copy.upcomingExams} value={formatNumber(exams.data?.length ?? 0)} />
          </div>
          {dashboard.data?.attention.map((item) => (
            <Card
              key={item.type}
              className="border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            >
              {item.message}
            </Card>
          ))}
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-3">
              <h2 className="flex items-center gap-2 font-bold">
                <CalendarDays size={18} /> {copy.upcomingSchedule}
              </h2>
              <div className="mt-4 grid gap-3">
                {(schedule.data ?? []).map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
                  >
                    <strong>{formatDate(plan.date)}</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {plan.tasks.map((task) => (
                        <Badge key={task.id} tone={task.completed ? "green" : "neutral"}>
                          {task.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {!schedule.data?.length ? <EmptyState title={copy.noUpcomingSchedule} /> : null}
              </div>
            </Card>
            <Card className="p-3">
              <h2 className="flex items-center gap-2 font-bold">
                <GraduationCap size={18} /> {copy.examsAndReports}
              </h2>
              <div className="mt-4 grid gap-2 text-sm">
                {(exams.data ?? []).slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
                  >
                    {exam.title ?? copy.untitledExam}
                  </div>
                ))}
                <p className="text-slate-500">{copy.dailyReports(reports.data?.length ?? 0)}</p>
              </div>
            </Card>
          </div>
          <Card className="p-3">
            <h2 className="font-bold">{copy.relatedResources}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {relatedStudents.data?.find((item) => item.student.id === studentId)?.relationship
                .type === "GUARDIAN_OF"
                ? copy.guardianAccess
                : copy.accountResources}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(resources.data ?? []).map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 text-sm font-bold shadow-[var(--shadow-surface)] hover:border-brand"
                >
                  {resource.title}
                </a>
              ))}
              {!resources.isLoading && !resources.data?.length ? (
                <EmptyState title={copy.noResources} />
              ) : null}
            </div>
          </Card>
          {auth.can("guardian.encouragement.create") ? (
            <Card className="p-3">
              <h2 className="flex items-center gap-2 font-bold">
                <Heart size={18} /> {copy.encouragement}
              </h2>
              <form
                className="mt-4 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  encouragement.mutate();
                }}
              >
                <Field label={copy.encouragementMessage}>
                  <Textarea
                    required
                    maxLength={500}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </Field>
                <Button
                  className="w-fit"
                  loading={encouragement.isPending}
                  disabled={!message.trim()}
                >
                  {copy.sendToStudent}
                </Button>
              </form>
            </Card>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </Card>
  );
}
