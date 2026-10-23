import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { getAdminDashboard } from "../../../features/analytics/dashboard/api/dashboard.api";
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
  const shownAnnouncementSignatures = useRef(new Map<string, string>());
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
  const unreadNotificationIds = useMemo(
    () =>
      new Set(
        canViewNotifications
          ? model.notificationState.items.filter((item) => !item.isRead).map((item) => item.id)
          : [],
      ),
    [canViewNotifications, model.notificationState.items],
  );
  const activeAnnouncements = useMemo(() => {
    if (!canReadAnnouncements) return [];
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
      );
  }, [canReadAnnouncements, dashboard.data?.home?.announcements]);

  useEffect(() => {
    if (previousScopeKey.current === scopeKey) return;
    previousScopeKey.current = scopeKey;
    reset();
    shownNotificationId.current = null;
    shownAnnouncementSignatures.current.clear();
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
    island.activities.forEach((activity) => {
      if (!activity.id.startsWith("notification:") || activity.id === "notifications:unread") {
        return;
      }
      const notificationId = activity.id.slice("notification:".length);
      if (!unreadNotificationIds.has(notificationId)) dismiss(activity.id);
    });
  }, [dismiss, island.activities, unreadNotificationIds]);

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
      action: {
        label: "مشاهده",
        to: `/admin/communication/notifications?notificationId=${encodeURIComponent(newestUnread.id)}`,
      },
    });
  }, [dismiss, newestUnread, show]);

  useEffect(() => {
    const signatures = shownAnnouncementSignatures.current;
    const activeIds = new Set(activeAnnouncements.map((item) => item.id));
    for (const id of signatures.keys()) {
      if (activeIds.has(id)) continue;
      dismiss(`announcement:${id}`);
      signatures.delete(id);
    }

    // Students receive the full authorized announcement queue. The provider keeps
    // the highest-priority activity visible and exposes the rest after dismissal.
    const announcements =
      model.auth.activeRole === "STUDENT" ? activeAnnouncements : activeAnnouncements.slice(0, 1);
    announcements.forEach((announcement, index) => {
      const signature = `${announcement.publishedAt ?? ""}:${announcement.expiresAt ?? ""}:${announcement.title}:${announcement.body}`;
      if (signatures.get(announcement.id) === signature) return;
      signatures.set(announcement.id, signature);
      const expiresAt = announcement.expiresAt ? new Date(announcement.expiresAt).getTime() : null;
      show({
        id: `announcement:${announcement.id}`,
        kind: "notification",
        priority: 80 - index,
        title: announcement.title,
        description: announcement.body,
        duration: expiresAt ? expiresAt - Date.now() : undefined,
        dismissible: true,
        action: { label: "مشاهده اطلاعیه‌ها", to: "/admin/announcements" },
      });
    });
  }, [activeAnnouncements, dismiss, model.auth.activeRole, show]);

  return <FloatingIslandViewport direction={model.direction} performance={model.performance} />;
}
