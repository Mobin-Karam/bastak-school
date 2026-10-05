import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../features/auth";
import { ThemeSwitcher } from "../../shared/theme/theme";
import { useModal } from "../../shared/ui/modal";
import { ViewportPopover } from "../../shared/ui/popover";
import { Button } from "../../shared/ui/ui";
import { DevBackendSwitcher } from "../dev/DevBackendSwitcher";
import { roleLabel, rolePortalTitle } from "../../shared/lib/role-ui";
import { useAdminShellCopy, useLocale } from "../../shared/ui/locale";

export function AdminAccountMenu() {
  const auth = useAuth();
  const modal = useModal();
  const { language } = useLocale();
  const copy = useAdminShellCopy();
  const [open, setOpen] = useState(false);
  const displayName =
    auth.user?.displayName ||
    auth.user?.display_name ||
    auth.user?.username ||
    (language === "en" ? "Administrator" : "مدیر");
  const initial = displayName.trim()[0] || (language === "en" ? "A" : "م");

  async function logout() {
    const confirmed = await modal.confirm({
      title: copy.signOutConfirmTitle,
      description: copy.signOutConfirmDescription,
      confirmLabel: copy.signOut,
      tone: "danger",
    });
    if (!confirmed) return;
    setOpen(false);
    await auth.logout();
  }

  return (
    <ViewportPopover
      open={open}
      onOpenChange={setOpen}
      width={320}
      className="overflow-hidden"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className="flex h-10 min-w-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-1.5 text-start outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:px-2"
          aria-label={copy.accountMenu}
          title={displayName}
        >
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-black text-white"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="hidden max-w-28 min-w-0 2xl:block">
            <strong className="block truncate text-xs">{displayName}</strong>
            <small className="block truncate text-[9px] text-slate-400">
              {rolePortalTitle(auth.activeRole, language)}
            </small>
          </span>
        </button>
      )}
    >
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-brand">
            <UserRound size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm">{displayName}</strong>
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              <ShieldCheck size={13} /> {roleLabel(auth.activeRole, language)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 p-3">
        {(auth.context?.roles.length ?? 0) > 1 ? (
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            {copy.workContextLabel}
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
              value={auth.activeRole ?? ""}
              onChange={(event) =>
                auth.setActiveRole(event.target.value as NonNullable<typeof auth.activeRole>)
              }
            >
              {auth.context?.roles
                .filter((role) => role !== "STUDENT")
                .map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role, language)}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
        {(auth.context?.availableOrganizations.length ?? 0) > 1 ? (
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            {copy.activeOrganization}
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
              value={auth.context?.activeOrganization?.id ?? ""}
              onChange={(event) =>
                auth.setActiveOrganization(
                  auth.context?.availableOrganizations.find(
                    (item) => item.id === event.target.value,
                  ) ?? null,
                )
              }
            >
              <option value="">{copy.selectOrganization}</option>
              {auth.context?.availableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-900 xl:hidden">
          <span className="text-xs font-semibold text-slate-600">{copy.display}</span>
          <ThemeSwitcher />
        </div>
        <DevBackendSwitcher />
        <Button
          className="w-full justify-start text-rose-700 hover:bg-rose-50"
          variant="ghost"
          loading={auth.status === "logging-out"}
          loadingLabel={copy.signingOut}
          onClick={() => void logout()}
        >
          <LogOut size={16} />
          {copy.signOut}
        </Button>
      </div>
    </ViewportPopover>
  );
}
