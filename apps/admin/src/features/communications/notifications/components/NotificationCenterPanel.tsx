import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import { CheckCheck, Headphones, PlayCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLocale } from "../../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";
import { AdminList } from "../../../../shared/ui/admin-list";
import { Badge, Button } from "../../../../shared/ui/ui";
import { CollectionToolbar } from "../../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../../shared/ui/segmented-control";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import type { AdminNotification } from "../model/notification-model";
import {
  notificationAdminUrl,
  notificationTone,
  notificationTypeLabel,
} from "../model/notification-model";

export function NotificationCenterPanel({
  filter,
  setFilter,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  items,
  compact = false,
  focusedNotificationId,
}: {
  /** Kept for existing callers; shell composition now decides whether to mount this panel. */
  mobilePanel?: "notifications" | "inbox";
  filter: "all" | "unread";
  setFilter: Dispatch<SetStateAction<"all" | "unread">>;
  typeFilter: string;
  setTypeFilter: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  items: AdminNotification[];
  /** Student mobile view keeps controls in a focused dialog. */
  compact?: boolean;
  /** A stable URL target from the floating island or another notification entrypoint. */
  focusedNotificationId?: string;
}) {
  const notifications = useAdminNotifications();
  const { formatDateTime, language } = useLocale();
  const copy = notificationCopy[language];
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusedAnnouncementId = params.get("announcementId");
  const focusedItem = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!focusedNotificationId || !focusedItem.current) return;
    focusedItem.current.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [focusedNotificationId, items]);

  return (
    <AdminList
      label={copy.center}
      description={copy.centerDescription}
      items={items}
      loading={notifications.loading}
      error={notifications.error}
      errorTitle={notifications.errorMessage || copy.loadFailed}
      onRetry={notifications.refresh}
      className="flex min-h-0 flex-col dark:border-slate-800 dark:bg-slate-900"
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
        compact ? undefined : (
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
        )
      }
      toolbar={
        compact ? undefined : (
          <CollectionToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder={copy.searchPlaceholder}
            searchLabel={copy.search}
            searchInputType="text"
            onClear={search ? () => setSearch("") : undefined}
            filters={
              <AdaptiveSelect
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
              </AdaptiveSelect>
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
        )
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
        {items.map((item) => {
          const announcement = item.type === "announcement";
          const data = item.data as
            | {
                announcementId?: string;
                mediaUrl?: string | null;
                mediaType?: "VIDEO" | "AUDIO" | null;
              }
            | undefined;
          const selectedAnnouncement =
            announcement && data?.announcementId === focusedAnnouncementId;
          const itemContent = (
            <>
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
                <small className="text-[10px] text-slate-400">
                  {formatDateTime(item.createdAt)}
                </small>
              ) : null}
            </>
          );
          const itemClassName = [
            "rounded-lg border px-3 py-2 text-start shadow-[var(--shadow-surface)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
            (item.id === focusedNotificationId || selectedAnnouncement) &&
              "ring-2 ring-brand ring-offset-2 dark:ring-offset-slate-950",
            item.isRead
              ? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand dark:hover:border-brand"
              : "border-indigo-200 bg-indigo-50/70 hover:border-brand dark:border-indigo-900 dark:bg-indigo-950/20",
          ].join(" ");
          const open = () => {
            if (!item.isRead) notifications.markRead(item.id);
            navigate(notificationAdminUrl(item.url ?? undefined));
          };
          return announcement ? (
            <article
              key={item.id}
              ref={item.id === focusedNotificationId ? focusedItem : undefined}
              className={itemClassName}
              aria-current={
                item.id === focusedNotificationId || selectedAnnouncement ? "true" : undefined
              }
            >
              <button type="button" className="w-full text-start" onClick={open}>
                {itemContent}
              </button>
              <AnnouncementMedia data={data} title={item.title} />
            </article>
          ) : (
            <button
              key={item.id}
              ref={item.id === focusedNotificationId ? focusedItem : undefined}
              type="button"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "76px",
              }}
              className={itemClassName}
              aria-current={item.id === focusedNotificationId ? "true" : undefined}
              onClick={open}
            >
              {itemContent}
            </button>
          );
        })}
      </div>
    </AdminList>
  );
}

function AnnouncementMedia({
  data,
  title,
}: {
  data?: { mediaUrl?: string | null; mediaType?: "VIDEO" | "AUDIO" | null };
  title: string;
}) {
  if (!data?.mediaUrl) return null;
  if (data.mediaType === "AUDIO") {
    return (
      <div className="mt-3 border-t border-[rgb(var(--border-subtle))] pt-3">
        <span className="mb-1 flex items-center gap-1 text-xs font-bold text-brand">
          <Headphones size={14} /> صوت اطلاعیه
        </span>
        <audio className="w-full" controls preload="metadata" src={data.mediaUrl}>
          مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
        </audio>
      </div>
    );
  }
  const url = data.mediaUrl
    .replace("youtu.be/", "www.youtube.com/embed/")
    .replace("watch?v=", "embed/");
  return (
    <div className="mt-3 border-t border-[rgb(var(--border-subtle))] pt-3">
      <span className="mb-1 flex items-center gap-1 text-xs font-bold text-brand">
        <PlayCircle size={14} /> ویدئوی اطلاعیه
      </span>
      <iframe
        className="aspect-video w-full rounded-lg border"
        src={url}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
