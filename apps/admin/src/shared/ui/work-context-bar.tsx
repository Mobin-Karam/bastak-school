import { Building2, Layers3, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminShellCopy } from "./locale";

export function WorkContextBar({
  role,
  organization,
  multipleRoles = false,
  studentId,
  showStudent = false,
}: {
  role: string;
  organization?: string;
  multipleRoles?: boolean;
  studentId?: string;
  showStudent?: boolean;
}) {
  const copy = useAdminShellCopy();

  return (
    <aside
      className="flex h-10 min-w-0 max-w-[48vw] shrink items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-2.5 text-xs text-slate-600 shadow-sm sm:max-w-sm sm:gap-3 sm:px-3 dark:text-slate-300"
      aria-label={copy.workContext}
      title={[role, organization || copy.platformLevel].join(" — ")}
    >
      <span className="flex min-w-0 items-center gap-1.5 font-bold text-ink">
        <Layers3 size={14} className="shrink-0 text-brand" />
        <span className="truncate">{role}</span>
      </span>
      {organization ? (
        <span className="hidden min-w-0 items-center gap-1.5 border-s border-slate-200 ps-3 sm:flex dark:border-slate-700">
          <Building2 size={14} className="shrink-0" />
          <span className="truncate">{organization}</span>
        </span>
      ) : (
        <span className="hidden border-s border-slate-200 ps-3 text-slate-400 sm:inline dark:border-slate-700">
          {copy.platformLevel}
        </span>
      )}
      {showStudent && studentId ? (
        <NavLink
          to={`/admin/students?studentId=${encodeURIComponent(studentId)}`}
          className="flex min-w-0 items-center gap-1.5 border-s border-slate-200 ps-3 font-semibold text-slate-600 outline-none transition hover:text-brand focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300"
          aria-label={copy.returnToActiveStudent}
          title={copy.returnToActiveStudent}
        >
          <UserRound size={14} className="shrink-0 text-brand" />
          <span className="truncate">{copy.activeStudent}</span>
        </NavLink>
      ) : null}
      {multipleRoles ? (
        <span className="sr-only 2xl:not-sr-only 2xl:ms-auto 2xl:whitespace-nowrap 2xl:text-[11px] 2xl:text-slate-500">
          {copy.switchRoleHint}
        </span>
      ) : null}
    </aside>
  );
}
