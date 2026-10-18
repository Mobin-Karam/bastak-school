import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../features/auth";
import { ThemeSwitcher } from "../../../shared/theme/theme";
import { useModal } from "../../../shared/ui/modal";
import { ViewportPopover } from "../../../shared/ui/popover";
import { Button } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { DevBackendSwitcher } from "../../dev/DevBackendSwitcher";
import { roleLabel } from "../../../shared/lib/role-ui";
import { useAdminShellCopy, useLocale } from "../../../shared/ui/locale";

export function AdminAccountMenu() {
  const auth = useAuth();
  const modal = useModal();
  const { language } = useLocale();
  const copy = useAdminShellCopy();
  const [open, setOpen] = useState(false);
  const displayName =
    auth.user?.displayName ||
    auth.user?.display_name ||
    [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(" ") ||
    auth.user?.username ||
    (language === "en" ? "Administrator" : "مدیر");
  const username = auth.user?.username;
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
          className="flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-2 py-1.5 text-start outline-none transition hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand min-[1200px]:min-h-16 min-[1200px]:gap-3 min-[1200px]:px-3"
          aria-label={copy.accountMenu}
          title={displayName}
        >
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-black text-white min-[1200px]:size-11 min-[1200px]:text-lg"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="hidden min-w-0 min-[1200px]:block">
            <span className="flex max-w-72 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <strong className="max-w-40 truncate text-sm">{displayName}</strong>
              {username && username !== displayName ? (
                <span dir="ltr" className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {username}
                </span>
              ) : null}
            </span>
            <small className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">
              {roleLabel(auth.activeRole, language)}
            </small>
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="hidden shrink-0 text-slate-500 min-[1200px]:block"
          />
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
            {username && username !== displayName ? (
              <p
                dir="ltr"
                className="mt-1 text-start text-sm tabular-nums text-slate-600 dark:text-slate-300"
              >
                {username}
              </p>
            ) : null}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
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
                void auth
                  .setActiveRole(event.target.value as NonNullable<typeof auth.activeRole>)
                  .catch((error) =>
                    notify(error instanceof Error ? error.message : String(error), "error"),
                  )
              }
            >
              {auth.context?.roles.map((role) => (
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
                void auth
                  .setActiveOrganization(
                    auth.context?.availableOrganizations.find(
                      (item) => item.id === event.target.value,
                    ) ?? null,
                  )
                  .catch((error) =>
                    notify(error instanceof Error ? error.message : String(error), "error"),
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
