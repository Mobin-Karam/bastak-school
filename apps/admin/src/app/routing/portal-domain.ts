import type { RoleCode } from "../../shared/types/domain";

export type AppDomain = "student" | "admin" | "local" | "unknown";

const STUDENT_HOSTS = new Set(["stud.sultano.ir", "stud.localhost"]);
const ADMIN_HOSTS = new Set(["app.sultano.ir", "app.localhost"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const STUDENT_ONLY_ROUTES = new Set(["achievements", "my-attendance", "profile", "student-leave"]);
const STUDENT_PORTAL_ROUTES = new Set([
  "",
  ...STUDENT_ONLY_ROUTES,
  "coin-shop",
  "schedule",
  "books",
  "registration",
  "settings",
  "more",
  "communication/notifications",
]);

export function resolveAppDomain(hostname: string | null | undefined): AppDomain {
  const host = hostname?.trim().toLowerCase().replace(/\.$/, "") ?? "";
  if (STUDENT_HOSTS.has(host)) return "student";
  if (ADMIN_HOSTS.has(host)) return "admin";
  if (LOCAL_HOSTS.has(host)) return "local";
  return "unknown";
}

export function currentAppDomain(): AppDomain {
  return typeof window === "undefined" ? "unknown" : resolveAppDomain(window.location.hostname);
}

export function adminRouteSegment(pathname: string): string {
  const route = adminRoutePath(pathname);
  return route.split("/", 1)[0] ?? "";
}

function adminRoutePath(pathname: string): string {
  const segments = pathname.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  if (segments[0] !== "admin") return "";
  return segments.slice(1).join("/");
}

export function isRouteAvailableOnDomain(pathname: string, domain: AppDomain): boolean {
  if (domain === "local") return true;
  if (domain === "unknown") return false;

  const route = adminRoutePath(pathname);
  if (domain === "student") return STUDENT_PORTAL_ROUTES.has(route);
  const segment = adminRouteSegment(pathname);
  return !STUDENT_ONLY_ROUTES.has(segment);
}

export function preferredPortal(
  roles: readonly RoleCode[],
): Exclude<AppDomain, "local" | "unknown"> | null {
  if (roles.some((role) => role !== "STUDENT")) return "admin";
  return roles.includes("STUDENT") ? "student" : null;
}

export function preferredRoleForDomain(
  roles: readonly RoleCode[],
  domain: Exclude<AppDomain, "local" | "unknown">,
): RoleCode | null {
  if (domain === "student") return roles.includes("STUDENT") ? "STUDENT" : null;
  return roles.find((role) => role !== "STUDENT") ?? null;
}

export function portalUrl(
  domain: Exclude<AppDomain, "local" | "unknown">,
  path = "/admin",
  location: Pick<Location, "protocol" | "hostname" | "port"> | null = typeof window === "undefined"
    ? null
    : window.location,
): string | null {
  if (!location || resolveAppDomain(location.hostname) === "local") return null;
  const hostname = location.hostname.toLowerCase();
  const local = hostname.endsWith(".localhost");
  const targetHost = local
    ? domain === "student"
      ? "stud.localhost"
      : "app.localhost"
    : domain === "student"
      ? "stud.sultano.ir"
      : "app.sultano.ir";
  const protocol = local ? location.protocol : "https:";
  const port = local && location.port ? `:${location.port}` : "";
  return `${protocol}//${targetHost}${port}${path.startsWith("/") ? path : `/${path}`}`;
}

export function loginDestination(
  roles: readonly RoleCode[],
  requestedPath: string | null | undefined,
): { domain: Exclude<AppDomain, "local" | "unknown">; path: string } | null {
  const requestedDomain =
    requestedPath && isRouteAvailableOnDomain(requestedPath, "student") ? "student" : null;
  const domain =
    requestedDomain === "student" && roles.includes("STUDENT") ? "student" : preferredPortal(roles);
  if (!domain) return null;
  const path =
    requestedPath && isRouteAvailableOnDomain(requestedPath, domain) ? requestedPath : "/admin";
  return { domain, path };
}
