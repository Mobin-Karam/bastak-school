import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { getAdminDashboard } from "../../../features/analytics/dashboard/api/dashboard.api";
import { notificationAdminUrl } from "../../../features/communications/notifications/model/notification-model";
import { FloatingIslandViewport, useFloatingIsland } from "../../../shared/ui/floating-island";
import type { AdminShellModel } from "../hooks/use-admin-shell-model";

/** Global shell projection of authorized, already-loaded application state. */
export function AdminFloatingIsland({ model }: { model: AdminShellModel }) {
  const island = useFloatingIsland();
  const { dismiss, reset, show } = island;
  const canViewNotifications =
    model.auth.status === "authenticated" && Boolean(model.auth.user?.id);
  const canReadAnnouncements = canViewNotifications && model.auth.can("announcements.read");
  const unread = canViewNotifications ? model.notificationState.unread : 0;
  const scopeKey = `${model.auth.user?.id ?? "anonymous"}:${model.auth.context?.activeOrganization?.id ?? "none"}:${model.auth.activeRole ?? "none"}`;
  const previousScopeKey = useRef(scopeKey);
  const shownNotificationId = useRef<string | null>(null);
  const shownAnnouncementId = useRef<string | null>(null);
  const shownAnnouncementSignature = useRef<string | null>(null);
  const dashboard = useQuery({
    queryKey: [
      "role-dashboard",
      model.auth.activeRole || "default",
      model.auth.context?.activeOrganization?.id || "platform",
    ],
    queryFn: () => getAdminDashboard(model.auth.activeRole ?? undefined),
    enabled: canReadAnnouncements,
    staleTime: 10_000,
  });
  const newestUnread = useMemo(
    () =>
      canViewNotifications ? model.notificationState.items.find((item) => !item.isRead) : undefined,
    [canViewNotifications, model.notificationState.items],
  );
  const latestAnnouncement = useMemo(() => {
    if (!canReadAnnouncements) return undefined;
    const now = Date.now();
    return (dashboard.data?.home?.announcements ?? [])
      .filter(
        (item) =>
          item.status === "ACTIVE" &&
          (!item.publishedAt || new Date(item.publishedAt).getTime() <= now) &&
          (!item.expiresAt || new Date(item.expiresAt).getTime() > now),
      )
      .sort(
        (left, right) =>
          new Date(right.publishedAt ?? right.createdAt).getTime() -
          new Date(left.publishedAt ?? left.createdAt).getTime(),
      )[0];
  }, [canReadAnnouncements, dashboard.data?.home?.announcements]);

  useEffect(() => {
    if (previousScopeKey.current === scopeKey) return;
    previousScopeKey.current = scopeKey;
    reset();
    shownNotificationId.current = null;
    shownAnnouncementId.current = null;
    shownAnnouncementSignature.current = null;
  }, [reset, scopeKey]);

  useEffect(() => {
    const id = "notifications:unread";
    if (!unread) {
      dismiss(id);
      return;
    }
    show({
      id,
      kind: "notification",
      priority: 70,
      title:
        unread === 1
          ? "یک اعلان خوانده‌نشده"
          : `${unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده`,
      description: "اعلان‌های جدید را در مرکز اعلان‌ها ببینید.",
      action: { label: "مشاهده اعلان‌ها", to: "/admin/communication/notifications" },
    });
  }, [dismiss, scopeKey, show, unread]);

  useEffect(() => {
    if (!newestUnread) {
      if (shownNotificationId.current) {
        dismiss(`notification:${shownNotificationId.current}`);
        shownNotificationId.current = null;
      }
      return;
    }
    if (newestUnread.id === shownNotificationId.current) return;
    if (shownNotificationId.current) {
      dismiss(`notification:${shownNotificationId.current}`);
    }
    shownNotificationId.current = newestUnread.id;
    show({
      id: `notification:${newestUnread.id}`,
      kind: "notification",
      priority: 90,
      title: newestUnread.title || "اعلان جدید",
      description: newestUnread.body || undefined,
      dismissible: true,
      action: { label: "مشاهده", to: notificationAdminUrl(newestUnread.url ?? undefined) },
    });
  }, [dismiss, newestUnread, show]);

  useEffect(() => {
    if (!latestAnnouncement) {
      if (shownAnnouncementId.current) {
        dismiss(`announcement:${shownAnnouncementId.current}`);
        shownAnnouncementId.current = null;
        shownAnnouncementSignature.current = null;
      }
      return;
    }
    const signature = `${latestAnnouncement.id}:${latestAnnouncement.publishedAt ?? ""}`;
    if (signature === shownAnnouncementSignature.current) return;
    shownAnnouncementSignature.current = signature;
    shownAnnouncementId.current = latestAnnouncement.id;
    const expiresAt = latestAnnouncement.expiresAt
      ? new Date(latestAnnouncement.expiresAt).getTime()
      : null;
    show({
      id: `announcement:${latestAnnouncement.id}`,
      kind: "notification",
      priority: 75,
      title: latestAnnouncement.title,
      description: latestAnnouncement.body,
      duration: expiresAt ? expiresAt - Date.now() : undefined,
      dismissible: true,
      action: { label: "مشاهده اطلاعیه‌ها", to: "/admin" },
    });
  }, [dismiss, latestAnnouncement, show]);

  return <FloatingIslandViewport direction={model.direction} performance={model.performance} />;
}
