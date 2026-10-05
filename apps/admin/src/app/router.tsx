import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../shared/ui/ui";
import { useAdminShellCopy } from "../shared/ui/locale";
import { LoginPage, useAuth } from "../features/auth";
import { AdminLayout } from "./layout/AdminLayout";
import { educationCapabilities } from "./layout/admin-navigation";
import { RouteErrorBoundary } from "../shared/errors";

const DashboardPage = lazy(() =>
  import("../features/dashboard").then((module) => ({ default: module.DashboardPage })),
);
const SectionDashboardPage = lazy(() =>
  import("../features/dashboard").then((module) => ({ default: module.SectionDashboardPage })),
);
const StudentsPage = lazy(() =>
  import("../features/students").then((module) => ({ default: module.StudentsPage })),
);
const ChatPage = lazy(() =>
  import("../features/chat").then((module) => ({ default: module.ChatPage })),
);
const NotificationsPage = lazy(() =>
  import("../features/notifications").then((module) => ({ default: module.NotificationsPage })),
);
const ReportsPage = lazy(() =>
  import("../features/reports").then((module) => ({ default: module.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("../features/settings").then((module) => ({ default: module.SettingsPage })),
);
const LivePage = lazy(() =>
  import("../features/live").then((module) => ({ default: module.LivePage })),
);
const SystemPage = lazy(() =>
  import("../features/system").then((module) => ({ default: module.SystemPage })),
);
const FollowUpPage = lazy(() =>
  import("../features/followup").then((module) => ({ default: module.FollowUpPage })),
);
const AttentionPage = lazy(() =>
  import("../features/attention").then((module) => ({ default: module.AttentionPage })),
);
const OrganizationsPage = lazy(() =>
  import("../features/access").then((module) => ({ default: module.OrganizationsPage })),
);
const UsersPage = lazy(() =>
  import("../features/access").then((module) => ({ default: module.UsersPage })),
);
const PlannerPage = lazy(() =>
  import("../features/education/planner").then((module) => ({ default: module.PlannerPage })),
);
const PlanTemplatesPage = lazy(() =>
  import("../features/education/planner").then((module) => ({ default: module.PlanTemplatesPage })),
);
const LearningPage = lazy(() =>
  import("../features/education/learning").then((module) => ({ default: module.LearningPage })),
);
const EducationOverviewPage = lazy(() =>
  import("../features/education").then((module) => ({ default: module.EducationOverviewPage })),
);
const ExamsPage = lazy(() =>
  import("../features/education/exams").then((module) => ({ default: module.ExamsPage })),
);
const QuestionsPage = lazy(() =>
  import("../features/education/questions").then((module) => ({ default: module.QuestionsPage })),
);
const QuizzesPage = lazy(() =>
  import("../features/education/quizzes").then((module) => ({ default: module.QuizzesPage })),
);
const SubjectsPage = lazy(() =>
  import("../features/education/subjects").then((module) => ({ default: module.SubjectsPage })),
);
const ClassesPage = lazy(() =>
  import("../features/education/classes").then((module) => ({ default: module.ClassesPage })),
);
const OnboardingPage = lazy(() =>
  import("../features/onboarding").then((module) => ({ default: module.OnboardingPage })),
);
const ResourcesPage = lazy(() =>
  import("../features/education/resources").then((module) => ({ default: module.ResourcesPage })),
);
const GuardianPage = lazy(() =>
  import("../features/guardian").then((module) => ({ default: module.GuardianPage })),
);
const PermissionRequestsPage = lazy(() =>
  import("../features/permission-requests").then((module) => ({
    default: module.PermissionRequestsPage,
  })),
);

function RouteScreen({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function RouteLoading() {
  const copy = useAdminShellCopy();
  return (
    <div role="status" className="grid gap-3" aria-label={copy.preparingPage}>
      <div className="h-14 animate-pulse rounded-lg bg-[rgb(var(--surface-card))]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg bg-[rgb(var(--surface-card))]" />
        ))}
      </div>
      <div className="h-[50vh] animate-pulse rounded-lg bg-[rgb(var(--surface-card))]" />
    </div>
  );
}

function ProtectedRoute() {
  const auth = useAuth();
  const copy = useAdminShellCopy();
  if (auth.status === "checking")
    return (
      <div className="grid min-h-screen place-items-center bg-paper p-4">
        <div className="grid max-w-md gap-4 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 text-center shadow-[var(--shadow-surface)]">
          <div
            className="mx-auto size-9 animate-spin rounded-full border-4 border-slate-200 border-t-brand"
            aria-hidden="true"
          />
          <div>
            <p className="font-bold text-slate-800">{copy.restoringSession}</p>
            <p className="mt-2 text-sm text-slate-500">{auth.message}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="soft" onClick={() => void auth.restore()}>
              <RefreshCw size={16} /> {copy.retry}
            </Button>
            <Button variant="ghost" onClick={auth.stopRestore}>
              {copy.goToLogin}
            </Button>
          </div>
        </div>
      </div>
    );
  if (auth.status !== "authenticated") return <Navigate to="/login" replace />;
  return <Outlet />;
}

function CommunicationRedirect({ page }: { page: "live" | "chat" | "notifications" }) {
  const location = useLocation();
  return <Navigate to={`/admin/communication/${page}${location.search}${location.hash}`} replace />;
}

export function CapabilityRoute({
  capability,
  children,
}: {
  capability: string | readonly string[];
  children: ReactNode;
}) {
  const auth = useAuth();
  const copy = useAdminShellCopy();
  const allowed =
    typeof capability === "string"
      ? auth.can(capability)
      : capability.some((item) => auth.can(item));
  if (!allowed)
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <h2 className="font-bold">{copy.capabilityUnavailableTitle}</h2>
        <p className="mt-2 text-sm">{copy.capabilityUnavailableDescription}</p>
        <a
          href="/admin"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
        >
          {copy.returnToWorkspace}
        </a>
      </div>
    );
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  {
    path: "/admin",
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <RouteScreen>
                <DashboardPage />
              </RouteScreen>
            ),
          },
          { path: "live", element: <CommunicationRedirect page="live" /> },
          {
            path: "family",
            element: (
              <CapabilityRoute capability="guardian.students.read">
                <RouteScreen>
                  <GuardianPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "management",
            element: (
              <RouteScreen>
                <SectionDashboardPage section="مدیریت" />
              </RouteScreen>
            ),
          },
          {
            path: "students",
            element: (
              <CapabilityRoute capability="students.read">
                <RouteScreen>
                  <StudentsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "onboarding",
            element: (
              <CapabilityRoute capability="student_onboarding.manage">
                <RouteScreen>
                  <OnboardingPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "permission-requests",
            element: (
              <CapabilityRoute capability="permission_requests.read">
                <RouteScreen>
                  <PermissionRequestsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "classes",
            element: (
              <CapabilityRoute capability="classes.read">
                <RouteScreen>
                  <ClassesPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "resources",
            element: (
              <CapabilityRoute capability="learning_resources.manage">
                <RouteScreen>
                  <ResourcesPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "users",
            element: (
              <CapabilityRoute capability="users.read">
                <RouteScreen>
                  <UsersPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "organizations",
            element: (
              <CapabilityRoute capability="organization.read">
                <RouteScreen>
                  <OrganizationsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "planner",
            element: (
              <CapabilityRoute capability="plans.read">
                <RouteScreen>
                  <PlannerPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "plan-templates",
            element: (
              <CapabilityRoute capability="plan_templates.read">
                <RouteScreen>
                  <PlanTemplatesPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "learning",
            element: (
              <CapabilityRoute capability="learning.read">
                <RouteScreen>
                  <LearningPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "education",
            element: (
              <CapabilityRoute capability={educationCapabilities}>
                <RouteScreen>
                  <EducationOverviewPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "students/:studentId/learning",
            element: (
              <CapabilityRoute capability="learning.read">
                <RouteScreen>
                  <LearningPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "exams",
            element: (
              <CapabilityRoute capability="exams.read">
                <RouteScreen>
                  <ExamsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "questions",
            element: (
              <CapabilityRoute capability="questions.read">
                <RouteScreen>
                  <QuestionsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "quizzes",
            element: (
              <CapabilityRoute capability="quizzes.read">
                <RouteScreen>
                  <QuizzesPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          { path: "chat", element: <CommunicationRedirect page="chat" /> },
          { path: "notifications", element: <CommunicationRedirect page="notifications" /> },
          {
            path: "communication",
            element: <Outlet />,
            children: [
              {
                index: true,
                element: (
                  <RouteScreen>
                    <SectionDashboardPage section="ارتباط" />
                  </RouteScreen>
                ),
              },
              {
                path: "live",
                element: (
                  <CapabilityRoute capability="student.live.read">
                    <RouteScreen>
                      <LivePage />
                    </RouteScreen>
                  </CapabilityRoute>
                ),
              },
              {
                path: "chat",
                element: (
                  <CapabilityRoute capability="chat.read">
                    <RouteScreen>
                      <ChatPage />
                    </RouteScreen>
                  </CapabilityRoute>
                ),
              },
              {
                path: "notifications",
                element: (
                  <RouteScreen>
                    <NotificationsPage />
                  </RouteScreen>
                ),
              },
            ],
          },
          {
            path: "follow-up",
            element: (
              <CapabilityRoute capability="recovery_requests.read">
                <RouteScreen>
                  <FollowUpPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "attention",
            element: (
              <RouteScreen>
                <AttentionPage />
              </RouteScreen>
            ),
          },
          {
            path: "reports",
            element: (
              <CapabilityRoute capability="reports.read">
                <RouteScreen>
                  <ReportsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "subjects",
            element: (
              <CapabilityRoute capability="subjects.read">
                <RouteScreen>
                  <SubjectsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "system",
            element: (
              <CapabilityRoute capability="system.manage">
                <RouteScreen>
                  <SystemPage view="overview" />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "releases",
            element: (
              <CapabilityRoute capability="release.read">
                <RouteScreen>
                  <SystemPage view="releases" />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "database",
            element: (
              <CapabilityRoute capability="database.read">
                <RouteScreen>
                  <SystemPage view="database" />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "audit",
            element: (
              <CapabilityRoute capability="audit.read">
                <RouteScreen>
                  <SystemPage view="audit" />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <RouteScreen>
                <SettingsPage />
              </RouteScreen>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/admin" replace /> },
]);
