import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "../../shared/ui/ui";
import { useAdminShellCopy } from "../../shared/ui/locale";
import {
  isSupportedAdminPortalRole,
  LoginPage,
  LoginSuccessSplash,
  UnsupportedRoleModal,
  useAuth,
} from "../../features/auth";
import { AUTH_SUCCESS_SPLASH_KEY } from "../../features/auth/lib/auth-session";
import { AdminLayout } from "../layout/shell/AdminLayout";
import { RouteErrorBoundary } from "../../shared/errors";

const StudentSignupPage = lazy(() =>
  import("../../features/auth/pages/StudentSignupPage").then((m) => ({
    default: m.StudentSignupPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../../features/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const StudentsPage = lazy(() =>
  import("../../features/students").then((m) => ({ default: m.StudentsPage })),
);
const ClassesPage = lazy(() =>
  import("../../features/education/classes").then((m) => ({ default: m.ClassesPage })),
);
const BookShelfPage = lazy(() =>
  import("../../features/education/books").then((m) => ({ default: m.BookShelfPage })),
);
const ClassGroupsPage = lazy(() =>
  import("../../features/class-groups").then((m) => ({ default: m.ClassGroupsPage })),
);
const AttendancePage = lazy(() =>
  import("../../features/attendance").then((m) => ({ default: m.AttendancePage })),
);
const MyAttendancePage = lazy(() =>
  import("../../features/attendance").then((m) => ({ default: m.MyAttendancePage })),
);
const GuardianPage = lazy(() =>
  import("../../features/guardian").then((m) => ({ default: m.GuardianPage })),
);
const SchedulePage = lazy(() =>
  import("../../features/schedule").then((m) => ({ default: m.SchedulePage })),
);
const LeaveRequestsPage = lazy(() =>
  import("../../features/leave-requests").then((m) => ({ default: m.LeaveRequestsPage })),
);
const ExitPermissionsPage = lazy(() =>
  import("../../features/exit-permissions").then((m) => ({ default: m.ExitPermissionsPage })),
);
const DormitoryPage = lazy(() =>
  import("../../features/dormitory").then((m) => ({ default: m.DormitoryPage })),
);
const RegistrationComingSoonPage = lazy(() =>
  import("../../features/registration").then((m) => ({
    default: m.RegistrationComingSoonPage,
  })),
);
const OrganizationsPage = lazy(() =>
  import("../../features/access").then((m) => ({ default: m.OrganizationsPage })),
);
const UsersPage = lazy(() =>
  import("../../features/access").then((m) => ({ default: m.UsersPage })),
);
const SettingsPage = lazy(() =>
  import("../../features/settings").then((m) => ({ default: m.SettingsPage })),
);
const StudentProfilePage = lazy(() =>
  import("../../features/student-portal").then((m) => ({ default: m.StudentProfilePage })),
);
const StudentLeaveRequestsPage = lazy(() =>
  import("../../features/student-portal").then((m) => ({ default: m.StudentLeaveRequestsPage })),
);
const TeacherProfilePage = lazy(() =>
  import("../../features/teacher-portal").then((m) => ({ default: m.TeacherProfilePage })),
);
const TeacherChatComingSoonPage = lazy(() =>
  import("../../features/teacher-portal").then((m) => ({
    default: m.TeacherChatComingSoonPage,
  })),
);
const SystemPage = lazy(() =>
  import("../../features/system").then((m) => ({ default: m.SystemPage })),
);
const MobileMorePage = lazy(() =>
  import("../../features/mobile/MobileMorePage").then((m) => ({ default: m.MobileMorePage })),
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
  const [showLoginSplash, setShowLoginSplash] = useState(
    () => sessionStorage.getItem(AUTH_SUCCESS_SPLASH_KEY) === "1",
  );

  useEffect(() => {
    if (!showLoginSplash || auth.status !== "authenticated") return;
    sessionStorage.removeItem(AUTH_SUCCESS_SPLASH_KEY);
    const timer = window.setTimeout(() => setShowLoginSplash(false), 3_000);
    return () => window.clearTimeout(timer);
  }, [auth.status, showLoginSplash]);

  if (auth.status === "checking") {
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
  }
  if (auth.status !== "authenticated") return <Navigate to="/login" replace />;
  if (!isSupportedAdminPortalRole(auth.activeRole)) return <UnsupportedRoleModal />;
  if (showLoginSplash) return <LoginSuccessSplash />;
  return <Outlet />;
}

export function CapabilityRoute({
  capability,
  allOf,
  children,
}: {
  capability: string | readonly string[];
  allOf?: readonly string[];
  children: ReactNode;
}) {
  const auth = useAuth();
  const copy = useAdminShellCopy();
  const allowed = typeof capability === "string" ? auth.can(capability) : auth.canAny(capability);
  if (!allowed || (allOf?.length && !auth.canAll(allOf))) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <h2 className="font-bold">{copy.capabilityUnavailableTitle}</h2>
        <p className="mt-2 text-sm">{copy.capabilityUnavailableDescription}</p>
        <a
          href="/admin"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white"
        >
          {copy.returnToWorkspace}
        </a>
      </div>
    );
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  {
    path: "/register",
    element: (
      <RouteScreen>
        <StudentSignupPage />
      </RouteScreen>
    ),
    errorElement: <RouteErrorBoundary />,
  },
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
            path: "registration",
            element: (
              <CapabilityRoute capability="registration.read">
                <RouteScreen>
                  <RegistrationComingSoonPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "schedule",
            element: (
              <CapabilityRoute capability="schedule.read">
                <RouteScreen>
                  <SchedulePage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "teacher-profile",
            element: (
              <RouteScreen>
                <TeacherProfilePage />
              </RouteScreen>
            ),
          },
          {
            path: "teacher-chat",
            element: (
              <RouteScreen>
                <TeacherChatComingSoonPage />
              </RouteScreen>
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
            path: "books",
            element: (
              <RouteScreen>
                <BookShelfPage />
              </RouteScreen>
            ),
          },
          {
            path: "class-groups",
            element: (
              <CapabilityRoute capability="class_groups.read">
                <RouteScreen>
                  <ClassGroupsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "attendance",
            element: (
              <CapabilityRoute capability="attendance.read">
                <RouteScreen>
                  <AttendancePage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "my-attendance",
            element: (
              <CapabilityRoute capability="attendance.self.read">
                <RouteScreen>
                  <MyAttendancePage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
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
            path: "leave-requests",
            element: (
              <CapabilityRoute capability="leave.read">
                <RouteScreen>
                  <LeaveRequestsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "exit-permissions",
            element: (
              <CapabilityRoute capability="exit.read">
                <RouteScreen>
                  <ExitPermissionsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "dormitory",
            element: (
              <CapabilityRoute capability="dormitory.read">
                <RouteScreen>
                  <DormitoryPage />
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
            path: "settings",
            element: (
              <RouteScreen>
                <SettingsPage />
              </RouteScreen>
            ),
          },
          {
            path: "profile",
            element: (
              <RouteScreen>
                <StudentProfilePage />
              </RouteScreen>
            ),
          },
          {
            path: "student-registration",
            element: (
              <CapabilityRoute capability="registration.read">
                <Navigate to="/admin/registration" replace />
              </CapabilityRoute>
            ),
          },
          {
            path: "student-leave",
            element: (
              <CapabilityRoute
                capability={["leave.read", "leave.manage"]}
                allOf={["leave.read", "leave.manage"]}
              >
                <RouteScreen>
                  <StudentLeaveRequestsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "more",
            element: (
              <RouteScreen>
                <MobileMorePage />
              </RouteScreen>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/admin" replace /> },
]);
