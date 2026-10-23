import { useEffect } from "react";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import { notifications } from "../../../../shared/ui/notifications";
import {
  normalizeAdminNotification,
  notificationAdminUrl,
  type AdminNotification,
  type NotificationPage,
} from "../model/notification-model";

export function useNotificationRealtime({
  authenticated,
  scopeKey,
  organizationId,
  queryClient,
  soundEnabled,
  chatSoundEnabled,
  playSound,
  showToast,
  onStudentRequest,
}: {
  authenticated: boolean;
  scopeKey: string;
  organizationId?: string;
  queryClient: QueryClient;
  soundEnabled: boolean;
  chatSoundEnabled: boolean;
  playSound: (chat?: boolean) => void;
  /** Students use the floating island so the bottom-corner toast is not duplicated. */
  showToast: boolean;
  onStudentRequest: (item: AdminNotification) => void;
}) {
  useEffect(() => {
    if (!authenticated || typeof window === "undefined") {
      return;
    }

    let source: ReturnType<typeof api.openEvents> | null = null;

    try {
      source = api.openEvents((type, data) => {
        if (type === "notification.created") {
          const item = normalizeAdminNotification(data as AdminNotification);
          if (item.organizationId && organizationId && item.organizationId !== organizationId)
            return;
          if (item.category === "student_request") onStudentRequest(item);

          const notificationQueryKey = ["notifications", scopeKey] as const;
          queryClient.setQueryData<InfiniteData<NotificationPage>>(
            notificationQueryKey,
            (current) => {
              if (
                !current?.pages.length ||
                current.pages.some((page) => page.items.some((existing) => existing.id === item.id))
              ) {
                return current;
              }

              const pages = [...current.pages];
              const first = pages[0];

              pages[0] = {
                ...first,
                unreadCount: Number(first.unreadCount || 0) + 1,
                items: [{ ...item, isRead: false }, ...first.items].slice(0, 20),
              };

              return { ...current, pages };
            },
          );

          if (showToast) {
            notifications.info(item.title || "اعلان جدید", {
              id: item.id,
              description: item.body,
              duration: 6500,
              action: {
                label: "مشاهده",
                onClick: () => window.location.assign(notificationAdminUrl(item.url ?? undefined)),
              },
            });
          }

          window.setTimeout(
            () =>
              void queryClient.invalidateQueries({
                queryKey: notificationQueryKey,
              }),
            500,
          );

          if (item.type !== "message" && soundEnabled) {
            playSound(false);
          }

          if (
            typeof document !== "undefined" &&
            document.hidden &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              const systemNotification = new Notification(item.title || "اعلان مشاور", {
                body: item.body || "",
                tag: item.id,
              });

              systemNotification.onclick = () => {
                window.focus();
                window.location.assign(notificationAdminUrl(item.url ?? undefined));
                systemNotification.close();
              };
            } catch {
              // Browser/system notifications are optional.
            }
          }
        }

        if (type === "chat.message.created" && chatSoundEnabled) {
          playSound(true);
        }

        if (
          [
            "recovery.requested",
            "issue.created",
            "exam.retry_requested",
            "review.created",
          ].includes(type)
        ) {
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
        }

        if (
          [
            "recovery.requested",
            "report.submitted",
            "plan.published",
            "plan.updated",
            "chat.message.created",
            "exam.updated",
          ].includes(type)
        ) {
          void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }

        if (
          ["review.created", "quiz.completed", "presence.changed", "study.finished"].includes(type)
        ) {
          void queryClient.invalidateQueries({ queryKey: ["admin-attention"] });
        }
      });
    } catch {
      // Realtime is an enhancement. The normal query remains the source of truth.
    }

    return () => source?.close();
  }, [
    authenticated,
    scopeKey,
    organizationId,
    soundEnabled,
    chatSoundEnabled,
    queryClient,
    playSound,
    showToast,
    onStudentRequest,
  ]);
}
