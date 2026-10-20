import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";
import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  Outlet,
  type RouteObject,
  useLocation,
} from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "../../shared/ui/ui";
import { useAdminShellCopy } from "../../shared/ui/locale";
import {
  isSupportedAdminPortalRole,
  isReleasedSchoolPortalRole,
  LoginPage,
  LoginSuccessSplash,
  UnsupportedRoleModal,
  useAuth,
} from "../../features/identity/auth";
import { AUTH_SUCCESS_SPLASH_KEY } from "../../features/identity/auth/lib/auth-session";
import { AdminLayout } from "../layout/shells/AdminLayout";
import { RouteErrorBoundary } from "../../shared/errors";
import { underBuilding, underBuildingEndsAt } from "../config/under-building";
import UnderConstruction from "../../features/people/students/components/UnderConstruction";
import {
  currentAppDomain,
  isRouteAvailableOnDomain,
  portalUrl,
  preferredPortal,
  preferredRoleForDomain,
} from "./portal-domain";

const StudentSignupPage = lazy(() =>
  import("../../features/identity/auth/pages/StudentSignupPage").then((m) => ({
    default: m.StudentSignupPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../../features/analytics/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const StudentsPage = lazy(() =>
  import("../../features/people/students").then((m) => ({ default: m.StudentsPage })),
);
const ClassesPage = lazy(() =>
  import("../../features/academics/education/classes").then((m) => ({ default: m.ClassesPage })),
);
const BookShelfPage = lazy(() =>
  import("../../features/academics/education/books").then((m) => ({ default: m.BookShelfPage })),
);
const ClassGroupsPage = lazy(() =>
  import("../../features/academics/class-groups").then((m) => ({ default: m.ClassGroupsPage })),
);
const AttendancePage = lazy(() =>
  import("../../features/student-life/attendance").then((m) => ({ default: m.AttendancePage })),
);
const MyAttendancePage = lazy(() =>
  import("../../features/student-life/attendance").then((m) => ({ default: m.MyAttendancePage })),
);
const GuardianPage = lazy(() =>
  import("../../features/people/guardian").then((m) => ({ default: m.GuardianPage })),
);
const SchedulePage = lazy(() =>
  import("../../features/academics/schedule").then((m) => ({ default: m.SchedulePage })),
);
const LeaveRequestsPage = lazy(() =>
  import("../../features/student-life/leave-requests").then((m) => ({
    default: m.LeaveRequestsPage,
  })),
);
const PermissionRequestsPage = lazy(() =>
  import("../../features/student-life/permission-requests").then((m) => ({
    default: m.PermissionRequestsPage,
  })),
);
const ExitPermissionsPage = lazy(() =>
  import("../../features/student-life/exit-permissions").then((m) => ({
    default: m.ExitPermissionsPage,
  })),
);
const DormitoryPage = lazy(() =>
  import("../../features/student-life/dormitory").then((m) => ({ default: m.DormitoryPage })),
);
const RegistrationComingSoonPage = lazy(() =>
  import("../../features/identity/registration").then((m) => ({
    default: m.RegistrationComingSoonPage,
  })),
);
const OrganizationsPage = lazy(() =>
  import("../../features/identity/access").then((m) => ({ default: m.OrganizationsPage })),
);
const UsersPage = lazy(() =>
  import("../../features/identity/access").then((m) => ({ default: m.UsersPage })),
);
const SettingsPage = lazy(() =>
  import("../../features/platform/settings").then((m) => ({ default: m.SettingsPage })),
);
const StudentProfilePage = lazy(() =>
  import("../../features/people/student-portal").then((m) => ({ default: m.StudentProfilePage })),
);
const StudentLeaveRequestsPage = lazy(() =>
  import("../../features/people/student-portal").then((m) => ({
    default: m.StudentLeaveRequestsPage,
  })),
);
const StudentTextbooksPage = lazy(() =>
  import("../../features/people/student-portal").then((m) => ({
    default: m.StudentTextbooksPage,
  })),
);
const TeacherProfilePage = lazy(() =>
  import("../../features/people/teacher-portal").then((m) => ({ default: m.TeacherProfilePage })),
);
const TeacherChatComingSoonPage = lazy(() =>
  import("../../features/people/teacher-portal").then((m) => ({
    default: m.TeacherChatComingSoonPage,
  })),
);
const SystemPage = lazy(() =>
  import("../../features/platform/system").then((m) => ({ default: m.SystemPage })),
);
const SmsPage = lazy(() =>
  import("../../features/communications/sms").then((m) => ({ default: m.SmsPage })),
);
const NotificationsPage = lazy(() =>
  import("../../features/communications/notifications").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const AnnouncementInboxPage = lazy(() =>
  import("../../features/communications/announcements").then((m) => ({
    default: m.AnnouncementInboxPage,
  })),
);
const AnnouncementManagementPage = lazy(() =>
  import("../../features/communications/announcements").then((m) => ({
    default: m.AnnouncementManagementPage,
  })),
);
const MobileMorePage = lazy(() =>
  import("../../features/mobile/MobileMorePage").then((m) => ({ default: m.MobileMorePage })),
);
const AchievementsComingSoonPage = lazy(() =>
  import("../../features/achievements").then((m) => ({ default: m.AchievementsComingSoonPage })),
);
const CoinShopComingSoonPage = lazy(() =>
  import("../../features/coin-shop").then((m) => ({ default: m.CoinShopComingSoonPage })),
);
const ManagementComingSoonPage = lazy(() =>
  import("../../features/management").then((m) => ({ default: m.ManagementComingSoonPage })),
);

function RouteScreen({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function BooksPage() {
  const auth = useAuth();
  return auth.activeRole === "STUDENT" ? <StudentTextbooksPage /> : <BookShelfPage />;
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
  const location = useLocation();
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
  if (auth.status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  if (!isSupportedAdminPortalRole(auth.activeRole)) return <UnsupportedRoleModal />;
  if (!isReleasedSchoolPortalRole(auth.activeRole)) return <UnsupportedRoleModal />;
  if (showLoginSplash) return <LoginSuccessSplash />;
  if (underBuilding) return <UnderConstruction endTime={underBuildingEndsAt} />;
  return <PortalHostBoundary />;
}

function PortalHostBoundary() {
  const auth = useAuth();
  const location = useLocation();
  const domain = currentAppDomain();
  const requestedPath = `${location.pathname}${location.search}${location.hash}`;

  if (domain === "unknown") {
    return <PortalUnavailable title="این نشانی برای ورود به سامانه تأیید نشده است." />;
  }
  if (domain === "local") return <Outlet />;
  if (!isRouteAvailableOnDomain(requestedPath, domain)) {
    return <PortalUnavailable title="این صفحه در نشانی فعلی سامانه در دسترس نیست." />;
  }

  const desiredRole = preferredRoleForDomain(auth.context?.roles ?? [], domain);
  if (desiredRole && auth.activeRole !== desiredRole) {
    return <PortalRoleSwitch desiredRole={desiredRole} />;
  }
  if (desiredRole) return <Outlet />;

  const destination = preferredPortal(auth.context?.roles ?? []);
  const target = destination ? portalUrl(destination, "/admin") : null;
  return target ? (
    <PortalUnavailable
      title="این حساب در نشانی فعلی سامانه قابل استفاده نیست."
      portalUrl={target}
    />
  ) : (
    <PortalUnavailable title="این حساب به هیچ پرتال فعالی دسترسی ندارد." />
  );
}

function PortalRoleSwitch({
  desiredRole,
}: {
  desiredRole: NonNullable<ReturnType<typeof preferredRoleForDomain>>;
}) {
  const auth = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void auth.setActiveRole(desiredRole).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [auth, desiredRole]);

  if (failed) return <PortalUnavailable title="تغییر زمینه کاری برای این پرتال تأیید نشد." />;
  return <RouteLoading />;
}

function PortalUnavailable({ title, portalUrl }: { title: string; portalUrl?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4" role="alert">
      <section className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-5 text-center text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <h1 className="font-bold">{title}</h1>
        <p className="mt-2 text-sm">مجوزهای حساب شما همچنان در سمت سرور بررسی می‌شوند.</p>
        {portalUrl ? (
          <a
            href={portalUrl}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {portalUrl}
          </a>
        ) : null}
      </section>
    </main>
  );
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

function StudentOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return auth.activeRole === "STUDENT" ? <>{children}</> : <Navigate to="/admin" replace />;
}

function PrincipalOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return auth.activeRole === "PRINCIPAL" ? <>{children}</> : <Navigate to="/admin" replace />;
}

function CoinShopAudienceRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return ["STUDENT", "PRINCIPAL", "SCHOOL_SUPERVISOR"].includes(auth.activeRole ?? "") ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin" replace />
  );
}

function TeacherOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return auth.activeRole === "TEACHER" ? <>{children}</> : <Navigate to="/admin" replace />;
}

export const adminRouteObjects = [
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
              <TeacherOnlyRoute>
                <RouteScreen>
                  <TeacherProfilePage />
                </RouteScreen>
              </TeacherOnlyRoute>
            ),
          },
          {
            path: "teacher-chat",
            element: (
              <TeacherOnlyRoute>
                <RouteScreen>
                  <TeacherChatComingSoonPage />
                </RouteScreen>
              </TeacherOnlyRoute>
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
                <BooksPage />
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
            path: "sms",
            element: (
              <CapabilityRoute capability="sms.read">
                <RouteScreen>
                  <SmsPage />
                </RouteScreen>
              </CapabilityRoute>
            ),
          },
          {
            path: "communication/notifications",
            element: (
              <RouteScreen>
                <NotificationsPage />
              </RouteScreen>
            ),
          },
          {
            path: "announcements",
            element: (
              <RouteScreen>
                <AnnouncementInboxPage />
              </RouteScreen>
            ),
          },
          {
            path: "announcements/manage",
            element: (
              <CapabilityRoute capability="announcements.manage">
                <RouteScreen>
                  <AnnouncementManagementPage />
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
              <StudentOnlyRoute>
                <RouteScreen>
                  <StudentProfilePage />
                </RouteScreen>
              </StudentOnlyRoute>
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
          {
            path: "achievements",
            element: (
              <StudentOnlyRoute>
                <RouteScreen>
                  <AchievementsComingSoonPage />
                </RouteScreen>
              </StudentOnlyRoute>
            ),
          },
          {
            path: "coin-shop",
            element: (
              <CoinShopAudienceRoute>
                <RouteScreen>
                  <CoinShopComingSoonPage />
                </RouteScreen>
              </CoinShopAudienceRoute>
            ),
          },
          {
            path: "management",
            element: (
              <PrincipalOnlyRoute>
                <RouteScreen>
                  <ManagementComingSoonPage />
                </RouteScreen>
              </PrincipalOnlyRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: underBuilding ? (
      <UnderConstruction endTime={underBuildingEndsAt} />
    ) : (
      <Navigate to="/admin" replace />
    ),
  },
] satisfies RouteObject[];

export const router = createBrowserRouter(adminRouteObjects);

/** Reuses the production route tree for deterministic Storybook page stories. */
export function createStorybookRouter(initialEntry = "/admin") {
  return createMemoryRouter(adminRouteObjects, { initialEntries: [initialEntry] });
}
