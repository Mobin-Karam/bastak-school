import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAdminShellCopy, useLocale } from "../../../../shared/ui/locale";
import { useModal } from "../../../../shared/ui/modal";
import { notify } from "../../../../shared/ui/notifications";
import { changePassword, getSessions, revokeSession } from "../api/settings.api";
import { LocationSettings } from "../components/LocationSettings";
import { SessionsSettings } from "../components/SessionsSettings";
import { ApiConnectionCard } from "../components/ApiConnectionCard";
import { AccountSecurityPanel } from "../../system/components/AccountSecurityPanel";
import { ChatProfileSettings } from "../components/ChatProfileSettings";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { settingsCopy } from "../settings-locale";
import { PWAInstallSettingsCard } from "../../pwa";
import { useAuth } from "../../../identity/auth";
import { PhoneNumberSettings } from "../components/PhoneNumberSettings";
import { PhoneChangeRequests } from "../components/PhoneChangeRequests";
import { Button, Card } from "../../../../shared/ui/ui";
import { MobileSelect } from "../../../../shared/ui/mobile/forms";
import { PrayerTimeSettings } from "../components/PrayerTimeSettings";
import { roleLabel } from "../../../../shared/lib/role-ui";
export function SettingsPage() {
  const auth = useAuth();
  return auth.activeRole === "STUDENT" || auth.activeRole === "TEACHER" ? (
    <PersonalSettingsPage />
  ) : (
    <WorkspaceSettingsPage />
  );
}

function WorkspaceSettingsPage() {
  const qc = useQueryClient(),
    modal = useModal(),
    locale = useLocale();
  const copy = settingsCopy(locale.language);
  const auth = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: getSessions });
  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
    meta: { successMessage: copy.sessionRevoked },
  });
  const password = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: () => {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      notify(copy.passwordChanged);
      void qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.passwordFailed, "error"),
  });
  return (
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <MobileAccountActions />
      <section className="grid gap-4 lg:grid-cols-2">
        <LocationSettings locale={locale} onChange={() => notify(copy.locationChanged)} />
        <ApiConnectionCard />
      </section>
      <PWAInstallSettingsCard />
      <PhoneNumberSettings />
      {auth.can("account_change_requests.read") ? <PhoneChangeRequests /> : null}
      <PrayerTimeSettings />
      <section aria-labelledby="account-security-title">
        <h2 id="account-security-title" className="mb-3 flex items-center gap-2 text-sm font-bold">
          <ShieldCheck size={17} />
          {copy.accountSecurity}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <AccountSecurityPanel
            passwords={passwords}
            setPasswords={setPasswords}
            busy={password.isPending}
            onSubmit={() =>
              void modal
                .confirm({
                  title: copy.changePasswordTitle,
                  description: copy.changePasswordDescription,
                  confirmLabel: copy.changePassword,
                })
                .then((confirmed) => confirmed && password.mutate())
            }
          />
          <SessionsSettings
            sessions={sessions}
            revoke={revoke}
            formatDateTime={locale.formatDateTime}
            confirm={(id) =>
              void modal
                .confirm({
                  title: copy.revokeTitle,
                  description: copy.revokeDescription,
                  tone: "danger",
                  confirmLabel: copy.revoke,
                })
                .then((confirmed) => confirmed && revoke.mutate(id))
            }
          />
        </div>
      </section>
      <ChatProfileSettings />
    </div>
  );
}

/** Personal accounts deliberately omit operational integrations and organization settings. */
function PersonalSettingsPage() {
  const qc = useQueryClient();
  const modal = useModal();
  const locale = useLocale();
  const copy = settingsCopy(locale.language);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: getSessions });
  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
    meta: { successMessage: copy.sessionRevoked },
  });
  const password = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: () => {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      notify(copy.passwordChanged);
      void qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.passwordFailed, "error"),
  });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="تنظیمات"
        description="شماره همراه، گذرواژه و نشست‌های فعال حساب شما."
      />
      <PhoneNumberSettings />
      <MobileAccountActions />
      {/* <section aria-labelledby="personal-account-security-title">
        <h2
          id="personal-account-security-title"
          className="mb-3 flex items-center gap-2 text-sm font-bold"
        >
          <ShieldCheck size={17} />
          {copy.accountSecurity}
        </h2>
        <div className="grid gap-4">
          <AccountSecurityPanel
            passwords={passwords}
            setPasswords={setPasswords}
            busy={password.isPending}
            onSubmit={() =>
              void modal
                .confirm({
                  title: copy.changePasswordTitle,
                  description: copy.changePasswordDescription,
                  confirmLabel: copy.changePassword,
                })
                .then((confirmed) => confirmed && password.mutate())
            }
          />
          <SessionsSettings
            sessions={sessions}
            revoke={revoke}
            formatDateTime={locale.formatDateTime}
            confirm={(id) =>
              void modal
                .confirm({
                  title: copy.revokeTitle,
                  description: copy.revokeDescription,
                  tone: "danger",
                  confirmLabel: copy.revoke,
                })
                .then((confirmed) => confirmed && revoke.mutate(id))
            }
          />
        </div>
      </section> */}
    </div>
  );
}

/**
 * Desktop has these controls in the account menu. On narrow screens the
 * account menu is intentionally absent, so expose the same safe actions here
 * for every authenticated role.
 */
function MobileAccountActions() {
  const auth = useAuth();
  const modal = useModal();
  const copy = useAdminShellCopy();
  const { language } = useLocale();

  async function logout() {
    const confirmed = await modal.confirm({
      title: copy.signOutConfirmTitle,
      description: copy.signOutConfirmDescription,
      confirmLabel: copy.signOut,
      tone: "danger",
    });
    if (confirmed) await auth.logout();
  }

  return (
    <Card className="grid gap-3 p-3 md:hidden" aria-label={copy.accountMenu}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-ink">{copy.accountMenu}</h2>
          <p className="mt-1 text-xs text-slate-500">{copy.display}</p>
        </div>

      </div>
      {(auth.context?.roles.length ?? 0) > 1 ? (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <MobileSelect
            label={
              <span className="flex items-center gap-2">
                <UserRound size={15} aria-hidden="true" />
                {copy.workContextLabel}
              </span>
            }
            value={auth.activeRole ?? ""}
            disabled={auth.status === "checking"}
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
          </MobileSelect>
        </div>
      ) : null}
      <Button
        className="w-full justify-center text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
        variant="soft"
        loading={auth.status === "logging-out"}
        loadingLabel={copy.signingOut}
        onClick={() => void logout()}
      >
        <LogOut size={17} aria-hidden="true" />
        {copy.signOut}
      </Button>
    </Card>
  );
}
