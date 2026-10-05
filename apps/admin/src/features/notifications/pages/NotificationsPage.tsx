import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStudentSelection } from "../../../shared/hooks/useStudentSelection";
import { useModal } from "../../../shared/ui/modal";
import { AdvisorInboxPanel } from "../components/AdvisorInboxPanel";
import { MobileNotificationTabs } from "../components/MobileNotificationTabs";
import { NotificationCenterPanel } from "../components/NotificationCenterPanel";
import { NotificationSettings } from "../components/NotificationSettings";
import { NotificationsToolbar } from "../components/NotificationsToolbar";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { useAdvisorInbox } from "../hooks/useAdvisorInbox";
import { useFilteredNotifications } from "../hooks/useFilteredNotifications";
import { useAuth } from "../../auth";
import { useLocale } from "../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";

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
  const auth = useAuth();
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
  const [mobilePanel, setMobilePanel] = useState<"notifications" | "inbox">("notifications");

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
    enabled: access.advisorInbox,
    scopeKey: `${auth.activeRole || "none"}:${auth.context?.activeOrganization?.id || "global"}`,
  });
  const items = useFilteredNotifications({
    items: notifications.items,
    filter,
    typeFilter,
    search,
  });

  return (
    <div className="flex h-[calc(100dvh-132px)] min-h-0 flex-col gap-3 overflow-hidden lg:h-[calc(100dvh-96px)]">
      <NotificationsToolbar
        onOpenSettings={() =>
          modal.open({
            title: copy.settingsTitle,
            size: "lg",
            // Important: global modal providers may render outside NotificationProvider.
            // Passing the controller avoids a context crash in modal content.
            content: <NotificationSettings notifications={notifications} language={language} />,
          })
        }
      />

      {access.advisorInbox ? (
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
        <NotificationCenterPanel
          mobilePanel={access.advisorInbox ? mobilePanel : "notifications"}
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
        />

        {access.advisorInbox ? (
          <AdvisorInboxPanel
            mobilePanel={mobilePanel}
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
