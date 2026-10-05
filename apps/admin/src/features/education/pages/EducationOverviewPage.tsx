import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleHelp, FilePlus2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { educationNavigation } from "../../../app/layout/admin-navigation";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Button } from "../../../shared/ui/ui";
import { useAuth } from "../../auth";
import { useLocale } from "../../../shared/ui/locale";
import { getExams, getRetryRequests } from "../../exams/api/exams.api";
import {
  getEducationOperations,
  type EducationOperationsOverview,
} from "../api/education-catalog.api";
import { EducationCatalogPanel } from "../components/EducationCatalogPanel";
import { EducationExamSnapshot } from "../components/EducationExamSnapshot";
import { EducationOperationsPanel } from "../components/EducationOperationsPanel";
import { EducationSections } from "../components/EducationSection";
import {
  educationOperationsCsv,
  educationOperationsFiltersToRequest,
  educationOperationsQueryKey,
  type EducationOperationsFilters,
} from "../model/education-operations";
import { educationCopy } from "../model/education-copy";

const actionDefinitions = [
  { to: "/admin/exams", label: "createExam", capability: "exams.create", icon: FilePlus2 },
  {
    to: "/admin/questions",
    label: "createQuestion",
    capability: "questions.create",
    icon: CircleHelp,
  },
  {
    to: "/admin/questions",
    label: "importQuestion",
    capability: "import.preview",
    icon: ArrowLeft,
  },
  { to: "/admin/quizzes", label: "createQuiz", capability: "quizzes.create", icon: Sparkles },
  {
    to: "/admin/exams",
    label: "recoveryRequests",
    capability: "retry_requests.read",
    icon: RotateCcw,
  },
] as const;

function downloadOperationsCsv(overview: EducationOperationsOverview) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${educationOperationsCsv(overview)}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "moshaver-education-operations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function EducationOverviewPage() {
  const auth = useAuth();
  const { language } = useLocale();
  const copy = educationCopy(language);
  const [filters, setFilters] = useState<EducationOperationsFilters>({
    periodFrom: "",
    periodTo: "",
    cohortGrade: "",
  });
  const canReadExams = auth.can("exams.read");
  const canReadRetries = auth.can("retry_requests.read");
  const canReadOperations = auth.can("education.operations.read");
  const exams = useQuery({ queryKey: ["exams"], queryFn: getExams, enabled: canReadExams });
  const retries = useQuery({
    queryKey: ["exam-retry"],
    queryFn: getRetryRequests,
    enabled: canReadRetries,
  });
  const operations = useQuery({
    queryKey: educationOperationsQueryKey(filters),
    queryFn: () => getEducationOperations(educationOperationsFiltersToRequest(filters)),
    enabled: canReadOperations,
  });
  const visibleActions = actionDefinitions.filter((action) => auth.can(action.capability));
  const visibleSections = educationNavigation.filter((section) => auth.can(section.capability));

  return (
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.education}
        title={copy.center}
        description={copy.description}
      />
      <EducationSections sections={visibleSections} />
      {canReadOperations ? (
        <EducationOperationsPanel
          filters={filters}
          onFiltersChange={setFilters}
          operations={operations}
          onExport={downloadOperationsCsv}
        />
      ) : null}
      {canReadExams ? <EducationExamSnapshot exams={exams} retries={retries} /> : null}
      {visibleActions.length ? (
        <section aria-label={copy.actions} className="flex flex-wrap gap-2">
          {visibleActions.map((action) => (
            <Link key={`${action.to}-${action.label}`} to={action.to}>
              <Button variant="soft" size="sm">
                <action.icon size={14} aria-hidden="true" />
                {copy[action.label]}
              </Button>
            </Link>
          ))}
        </section>
      ) : null}
      {auth.can("education.catalog.read") ? (
        <details className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3">
          <summary className="cursor-pointer text-sm font-black text-ink">{copy.catalog}</summary>
          <p className="mt-1 text-xs text-slate-500">{copy.catalogDescription}</p>
          <div className="mt-3">
            <EducationCatalogPanel
              canManage={auth.can("education.catalog.manage")}
              canPublish={auth.can("education.catalog.publish")}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
