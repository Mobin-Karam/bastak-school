import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStudentSelection } from "../../../../shared/hooks/useStudentSelection";
import { useModal } from "../../../../shared/ui/modal";
import { AdvisorInboxPanel } from "../components/AdvisorInboxPanel";
import { MobileNotificationTabs } from "../components/MobileNotificationTabs";
import { NotificationCenterPanel } from "../components/NotificationCenterPanel";
import { NotificationSettings } from "../components/NotificationSettings";
import { NotificationsToolbar } from "../components/NotificationsToolbar";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { useAdvisorInbox } from "../hooks/useAdvisorInbox";
import { useFilteredNotifications } from "../hooks/useFilteredNotifications";
import { useAuth } from "../../../identity/auth";
import { useLocale } from "../../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";
import { useViewportShell } from "../../../../app/layout/lib/viewport-shell";
import { Button, Input } from "../../../../shared/ui/ui";
import { SegmentedControl } from "../../../../shared/ui/segmented-control";

const notificationTypes = ["all", "message", "exam", "lesson", "announcement"] as const;

export function notificationTypeFilter(value: string | null) {
  return notificationTypes.includes(value as (typeof notificationTypes)[number]) ? value! : "all";
}

export function notificationAccess(capabilities: readonly string[]) {
  const has = (capability: string) => capabilities.includes(capability);
  const advisorInbox = has("students.read") && has("recovery_requests.read");

  return {
    advisorInbox,
    manageRecovery: advisorInbox && has("recovery_requests.manage"),
    manageIssues: advisorInbox && has("tasks.update"),
  };
}

export function NotificationsPage() {
  return <ActiveNotificationsPage />;
}

function ActiveNotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const access = notificationAccess(auth.capabilities);
  const students = useStudentSelection({ enabled: access.advisorInbox });
  const notifications = useAdminNotifications();
  const modal = useModal();
  const { language } = useLocale();
  const copy = notificationCopy[language];
  const [params, setParams] = useSearchParams();

  const filter = params.get("filter") === "unread" ? "unread" : "all";
  const typeFilter = notificationTypeFilter(params.get("type"));
  const search = params.get("q") || "";
  const focusedNotificationId = params.get("notificationId") || undefined;
  const [mobilePanel, setMobilePanel] = useState<"notifications" | "inbox">("notifications");
  const isMobileShell = useViewportShell() === "mobile";

  function setNotificationView(nextView: { filter?: "all" | "unread"; type?: string; q?: string }) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (nextView.filter !== undefined)
          nextView.filter === "all" ? next.delete("filter") : next.set("filter", nextView.filter);
        if (nextView.type !== undefined)
          nextView.type === "all" ? next.delete("type") : next.set("type", nextView.type);
        if (nextView.q !== undefined) nextView.q ? next.set("q", nextView.q) : next.delete("q");
        return next;
      },
      { replace: true },
    );
  }

  const advisor = useAdvisorInbox(students.studentId, {
    enabled: access.advisorInbox && (!isMobileShell || mobilePanel === "inbox"),
    scopeKey: `${auth.activeRole || "none"}:${auth.context?.activeOrganization?.id || "global"}`,
  });
  const items = useFilteredNotifications({
    items: notifications.items,
    filter,
    typeFilter,
    search,
  });

  const openSettings = () =>
    modal.open({
      title: copy.settingsTitle,
      size: "lg",
      content: <NotificationSettings notifications={notifications} language={language} />,
    });

  const openMobileControls = () =>
    modal.open({
      title: copy.notificationOptions,
      description: copy.filterNotifications,
      size: "md",
      content: (
        <StudentNotificationControls
          copy={copy}
          filter={filter}
          typeFilter={typeFilter}
          search={search}
          unread={notifications.unread}
          markingAllRead={notifications.markingAllRead}
          refreshing={notifications.refreshing}
          onFilterChange={(next) => setNotificationView({ filter: next })}
          onTypeFilterChange={(next) => setNotificationView({ type: next })}
          onSearchChange={(next) => setNotificationView({ q: next })}
          onMarkAllRead={notifications.markAllRead}
          onRefresh={notifications.refresh}
          onOpenSettings={openSettings}
        />
      ),
    });

  return (
    <div className="flex h-[calc(100dvh-132px)] min-h-0 flex-col gap-2 overflow-hidden pb-[env(safe-area-inset-bottom)] sm:gap-3 lg:h-[calc(100dvh-96px)] lg:pb-0">
      <div className="grid shrink-0 gap-2 sm:flex sm:items-start">
        <div className="min-w-0 flex-1">
          <NotificationsToolbar
            onOpenSettings={openSettings}
            compactMobile={isMobileShell}
            onOpenMobileControls={openMobileControls}
          />
        </div>
        {auth.can("announcements.read") ? (
          <div className="flex max-w-full gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Button
              className="shrink-0"
              variant="soft"
              onClick={() => navigate("/admin/announcements")}
            >
              {copy.announcementInbox}
            </Button>
            {auth.can("announcements.manage") ? (
              <Button
                className="shrink-0"
                variant="ghost"
                onClick={() => navigate("/admin/announcements/manage")}
              >
                {copy.manageAnnouncements}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {access.advisorInbox && isMobileShell ? (
        <MobileNotificationTabs
          panel={mobilePanel}
          inboxCount={advisor.rows.length}
          onChange={setMobilePanel}
        />
      ) : null}

      <section
        className={
          access.advisorInbox
            ? "grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]"
            : "grid min-h-0 flex-1"
        }
      >
        {!isMobileShell || !access.advisorInbox || mobilePanel === "notifications" ? (
          <NotificationCenterPanel
            filter={filter}
            setFilter={(next) =>
              setNotificationView({ filter: typeof next === "function" ? next(filter) : next })
            }
            typeFilter={typeFilter}
            setTypeFilter={(next) =>
              setNotificationView({ type: typeof next === "function" ? next(typeFilter) : next })
            }
            search={search}
            setSearch={(next) =>
              setNotificationView({ q: typeof next === "function" ? next(search) : next })
            }
            items={items}
            compact={isMobileShell}
            focusedNotificationId={focusedNotificationId}
          />
        ) : null}

        {access.advisorInbox && (!isMobileShell || mobilePanel === "inbox") ? (
          <AdvisorInboxPanel
            rows={advisor.rows}
            students={students.students}
            studentId={students.studentId}
            loading={advisor.inbox.isLoading}
            error={advisor.inbox.isError}
            onStudentChange={students.selectStudent}
            recoveryPendingId={advisor.recoveryPendingId}
            issuePendingId={advisor.issuePendingId}
            onRecovery={advisor.updateRecovery}
            onIssue={advisor.updateIssue}
            canManageRecovery={access.manageRecovery}
            canManageIssues={access.manageIssues}
            onRetry={() => {
              void advisor.inbox.refetch();
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

function StudentNotificationControls({
  copy,
  filter,
  typeFilter,
  search,
  unread,
  markingAllRead,
  refreshing,
  onFilterChange,
  onTypeFilterChange,
  onSearchChange,
  onMarkAllRead,
  onRefresh,
  onOpenSettings,
}: {
  copy: Record<string, string>;
  filter: "all" | "unread";
  typeFilter: string;
  search: string;
  unread: number;
  markingAllRead: boolean;
  refreshing: boolean;
  onFilterChange: (value: "all" | "unread") => void;
  onTypeFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="grid gap-4" dir="rtl">
      <SegmentedControl
        ariaLabel={copy.readState}
        value={filter}
        onValueChange={onFilterChange}
        options={[
          { value: "all", label: copy.all },
          {
            value: "unread",
            label: `${copy.unread}${unread ? ` (${unread.toLocaleString("fa-IR")})` : ""}`,
          },
        ]}
      />
      <label className="grid gap-1.5 text-sm font-bold text-ink">
        {copy.search}
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.searchPlaceholder}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-ink">
        {copy.type}
        <AdaptiveSelect
          className="h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
        >
          <option value="all">{copy.allTypes}</option>
          <option value="message">{copy.message}</option>
          <option value="exam">{copy.exam}</option>
          <option value="lesson">{copy.lesson}</option>
          <option value="announcement">{copy.announcement}</option>
        </AdaptiveSelect>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="soft" loading={refreshing} onClick={onRefresh}>
          {copy.refresh}
        </Button>
        <Button variant="soft" disabled={!unread} loading={markingAllRead} onClick={onMarkAllRead}>
          {copy.markAll}
        </Button>
      </div>
      <Button variant="ghost" onClick={onOpenSettings}>
        {copy.deviceSettings}
      </Button>
    </div>
  );
}
