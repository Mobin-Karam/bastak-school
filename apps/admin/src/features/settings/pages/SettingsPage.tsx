import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { changePassword, getSessions, revokeSession } from "../api/settings.api";
import { LocationSettings } from "../components/LocationSettings";
import { SessionsSettings } from "../components/SessionsSettings";
import { ApiConnectionCard } from "../components/ApiConnectionCard";
import { AccountSecurityPanel } from "../../system/components/AccountSecurityPanel";
import { ChatProfileSettings } from "../components/ChatProfileSettings";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { settingsCopy } from "../settings-locale";
export function SettingsPage() {
  const qc = useQueryClient(),
    modal = useModal(),
    locale = useLocale();
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
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <LocationSettings locale={locale} onChange={() => notify(copy.locationChanged)} />
        <ApiConnectionCard />
      </section>
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
