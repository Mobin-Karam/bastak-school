import { CheckCheck, RefreshCw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import type { AdminNotification } from "../model/notification-model";
import {
  notificationAdminUrl,
  notificationTone,
  notificationTypeLabel,
} from "../model/notification-model";

export function NotificationCenterPanel({
  mobilePanel,
  filter,
  setFilter,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  items,
}: {
  mobilePanel: "notifications" | "inbox";
  filter: "all" | "unread";
  setFilter: Dispatch<SetStateAction<"all" | "unread">>;
  typeFilter: string;
  setTypeFilter: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  items: AdminNotification[];
}) {
  const notifications = useAdminNotifications();
  const { formatDateTime, language } = useLocale();
  const copy = notificationCopy[language];
  const navigate = useNavigate();

  return (
    <AdminList
      label={copy.center}
      description={copy.centerDescription}
      items={items}
      loading={notifications.loading}
      error={notifications.error}
      errorTitle={notifications.errorMessage || copy.loadFailed}
      onRetry={notifications.refresh}
      className={[
        mobilePanel === "inbox" ? "hidden lg:flex" : "flex",
        "min-h-0 flex-col dark:border-slate-800 dark:bg-slate-900",
      ].join(" ")}
      contentClassName="min-h-0 flex-1 overflow-hidden"
      stickyHeader
      emptyTitle={
        filter === "unread"
          ? copy.allRead
          : search || typeFilter !== "all"
            ? copy.noMatch
            : copy.none
      }
      actions={
        <>
          {notifications.unread ? (
            <Button
              className="h-8 px-2 text-xs"
              variant="ghost"
              loading={notifications.markingAllRead}
              onClick={notifications.markAllRead}
            >
              <CheckCheck size={15} />
              {copy.markAll}
            </Button>
          ) : null}
          <Button
            className="h-8 px-2"
            variant="ghost"
            aria-label={copy.refresh}
            loading={notifications.refreshing}
            onClick={notifications.refresh}
          >
            <RefreshCw size={15} />
          </Button>
        </>
      }
      toolbar={
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder={copy.searchPlaceholder}
          searchLabel={copy.search}
          searchInputType="text"
          onClear={search ? () => setSearch("") : undefined}
          filters={
            <select
              className="h-8 min-w-28 border-0 bg-transparent px-2 text-xs outline-none"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label={copy.type}
            >
              <option value="all">{copy.allTypes}</option>
              <option value="message">{copy.message}</option>
              <option value="exam">{copy.exam}</option>
              <option value="lesson">{copy.lesson}</option>
              <option value="announcement">{copy.announcement}</option>
            </select>
          }
          actions={
            <SegmentedControl
              ariaLabel={copy.readState}
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: copy.all },
                {
                  value: "unread",
                  label: (
                    <>
                      {copy.unread}{" "}
                      {notifications.unread > 0 ? (
                        <span className="rounded-full bg-rose-600 px-1.5 text-white">
                          {notifications.unread.toLocaleString(
                            language === "fa" ? "fa-IR" : "en-US",
                          )}
                        </span>
                      ) : null}
                    </>
                  ),
                },
              ]}
            />
          }
        />
      }
      footer={
        notifications.hasMore ? (
          <Button
            className="w-full sm:w-auto"
            variant="soft"
            loading={notifications.loadingMore}
            onClick={notifications.loadMore}
          >
            {copy.more}
          </Button>
        ) : null
      }
    >
      <div className="grid h-full min-h-0 gap-1 overflow-y-auto overscroll-contain [padding-inline-start:0.25rem] [scrollbar-gutter:stable]">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "76px",
            }}
            className={[
              "rounded-lg border px-3 py-2 text-start shadow-[var(--shadow-surface)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
              item.isRead
                ? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand dark:hover:border-brand"
                : "border-indigo-200 bg-indigo-50/70 hover:border-brand dark:border-indigo-900 dark:bg-indigo-950/20",
            ].join(" ")}
            onClick={() => {
              if (!item.isRead) {
                notifications.markRead(item.id);
              }
              navigate(notificationAdminUrl(item.url ?? undefined));
            }}
          >
            <span className="flex items-center gap-2">
              <strong className="min-w-0 flex-1 truncate text-sm text-slate-900 dark:text-white">
                {item.title}
              </strong>
              <Badge tone={notificationTone(item.type)}>
                {notificationTypeLabel(item.type, language)}
              </Badge>
              {!item.isRead ? (
                <span className="size-2 rounded-full bg-rose-600" aria-label={copy.unreadDot} />
              ) : null}
            </span>

            {item.body ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {item.body}
              </p>
            ) : null}

            {item.createdAt ? (
              <small className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</small>
            ) : null}
          </button>
        ))}
      </div>
    </AdminList>
  );
}
