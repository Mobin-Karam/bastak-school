import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, LogOut, MapPin, Plug, ShieldCheck, UserRound } from "lucide-react";
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
    <div className="settings-workspace grid gap-6">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <SettingsNavigation showSchool={auth.can("prayer_times.manage")} />
      <MobileAccountActions />
      <section id="account" className="settings-section" aria-labelledby="settings-account-title">
        <SettingsSectionHeading
          icon={KeyRound}
          id="settings-account-title"
          title={locale.language === "en" ? "Account and security" : "حساب و امنیت"}
          description={
            locale.language === "en"
              ? "Control sign-in details and connected devices."
              : "اطلاعات ورود و دستگاه‌های متصل را مدیریت کنید."
          }
        />
        <div className="settings-section-grid">
          <PhoneNumberSettings />
          {auth.can("account_change_requests.read") ? <PhoneChangeRequests /> : null}
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
      <section id="display" className="settings-section" aria-labelledby="settings-display-title">
        <SettingsSectionHeading
          icon={MapPin}
          id="settings-display-title"
          title={locale.language === "en" ? "Display and profile" : "نمایش و پروفایل"}
          description={
            locale.language === "en"
              ? "Choose your local date display and conversation identity."
              : "نمایش محلی تاریخ و هویت گفت‌وگوی خود را انتخاب کنید."
          }
        />
        <div className="settings-section-grid">
          <LocationSettings locale={locale} onChange={() => notify(copy.locationChanged)} />
          <ChatProfileSettings />
        </div>
      </section>
      {auth.can("prayer_times.manage") ? (
        <section id="school" className="settings-section" aria-labelledby="settings-school-title">
          <SettingsSectionHeading
            icon={ShieldCheck}
            id="settings-school-title"
            title={locale.language === "en" ? "School defaults" : "پیش‌فرض‌های مدرسه"}
            description={
              locale.language === "en"
                ? "Manage shared daily defaults for your school."
                : "پیش‌فرض‌های روزانه مشترک مدرسه را مدیریت کنید."
            }
          />
          <PrayerTimeSettings />
        </section>
      ) : null}
      <section
        id="integration"
        className="settings-section"
        aria-labelledby="settings-integration-title"
      >
        <SettingsSectionHeading
          icon={Plug}
          id="settings-integration-title"
          title={locale.language === "en" ? "Application and connection" : "برنامه و اتصال"}
          description={
            locale.language === "en"
              ? "Review how this workspace is connected and installed."
              : "اتصال و نصب این محیط کار را بررسی کنید."
          }
        />
        <div className="settings-section-grid">
          <ApiConnectionCard />
          <PWAInstallSettingsCard />
        </div>
      </section>
    </div>
  );
}

/** Personal accounts deliberately omit operational integrations and organization settings. */
function PersonalSettingsPage() {
  const { language } = useLocale();
  return (
    <div className="settings-workspace mx-auto grid w-full max-w-4xl gap-6">
      <ManagementPageHeader
        eyebrow={language === "en" ? "My account" : "حساب من"}
        title={language === "en" ? "Settings" : "تنظیمات"}
        description={
          language === "en"
            ? "Manage sign-in details and active sessions."
            : "شماره ورود و نشست‌های فعال حساب خود را مدیریت کنید."
        }
      />
      <SettingsNavigation personal />
      <section
        id="account"
        className="settings-section"
        aria-label={language === "en" ? "Account" : "حساب"}
      >
        <PhoneNumberSettings />
      </section>
      <MobileAccountActions />
    </div>
  );
}

function SettingsNavigation({
  personal = false,
  showSchool = false,
}: {
  personal?: boolean;
  showSchool?: boolean;
}) {
  const { language } = useLocale();
  const items = personal
    ? [{ href: "#account", label: language === "en" ? "Account" : "حساب" }]
    : [
        { href: "#account", label: language === "en" ? "Account" : "حساب" },
        { href: "#display", label: language === "en" ? "Display" : "نمایش" },
        ...(showSchool ? [{ href: "#school", label: language === "en" ? "School" : "مدرسه" }] : []),
        { href: "#integration", label: language === "en" ? "Application" : "برنامه" },
      ];
  return (
    <nav
      className="settings-nav"
      aria-label={language === "en" ? "Settings sections" : "بخش‌های تنظیمات"}
    >
      {items.map((item) => (
        <a key={item.href} href={item.href} className="settings-nav__item">
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function SettingsSectionHeading({
  icon: Icon,
  id,
  title,
  description,
}: {
  icon: typeof KeyRound;
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="settings-section__heading">
      <span className="settings-section__icon">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
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
