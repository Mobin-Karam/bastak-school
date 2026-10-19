import { createContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../identity/auth/hooks/useAuth";
import { useNotificationInbox } from "../hooks/useNotificationInbox";
import { useNotificationRealtime } from "../hooks/useNotificationRealtime";
import { useNotificationSound } from "../hooks/useNotificationSound";
import { usePushNotifications } from "../hooks/usePushNotifications";
import type { NotificationContextValue } from "../model/notification.types";
import { useModal } from "../../../../shared/ui/modal";
import { Button } from "../../../../shared/ui/ui";

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const modal = useModal();
  const queryClient = useQueryClient();
  const notificationScopeKey = `${auth.user?.id ?? "anonymous"}:${auth.context?.activeOrganization?.id ?? "none"}:${auth.activeRole ?? "none"}`;
  const notifications = useNotificationInbox(auth.status === "authenticated", notificationScopeKey);
  const sound = useNotificationSound();
  const push = usePushNotifications(notifications.refresh);
  const shownAbsences = useRef(new Set<string>());

  useEffect(() => {
    if (!auth.hasRole("STUDENT")) return;
    const absence = notifications.items.find(
      (item) =>
        item.category === "attendance_absence" &&
        !item.isRead &&
        !shownAbsences.current.has(item.id),
    );
    if (!absence) return;
    shownAbsences.current.add(absence.id);
    modal.open({
      title: "هشدار غیبت در کلاس",
      description: "پیگیری حضوری لازم است",
      size: "full",
      content: (
        <section className="grid min-h-[60vh] content-center gap-6 p-6 text-center" dir="rtl">
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
            شما در کلاس غایب ثبت شده‌اید.
          </p>
          <p className="mx-auto max-w-md text-base leading-8 text-slate-700 dark:text-slate-200">
            برای دریافت اجازه حضور، به مدیر یا ناظر مدرسه مراجعه کنید. پس از بررسی، نتیجه برای شما
            ارسال می‌شود.
          </p>
          <p className="text-sm text-slate-500">یک سکه غیبت در کارنامه حضور شما ثبت شده است.</p>
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => {
                notifications.markRead(absence.id);
                window.location.assign("/admin/my-attendance");
              }}
            >
              مشاهده سوابق حضور
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                notifications.markRead(absence.id);
                modal.close();
              }}
            >
              متوجه شدم
            </Button>
          </div>
        </section>
      ),
    });
  }, [auth, modal, notifications.items, notifications.markRead]);

  useNotificationRealtime({
    authenticated: auth.status === "authenticated",
    queryClient,
    soundEnabled: sound.soundEnabled,
    chatSoundEnabled: sound.chatSoundEnabled,
    playSound: sound.playSound,
    onStudentRequest: (item) => {
      if (!auth.hasRole("PRINCIPAL") && !auth.hasRole("SCHOOL_SUPERVISOR")) return;
      modal.open({
        title: item.title || "درخواست جدید دانش‌آموز",
        description: "یک درخواست تازه برای بررسی شما ثبت شده است.",
        size: "full",
        content: (
          <section className="grid h-full content-center gap-6 p-6 text-center" dir="rtl">
            <p className="text-lg font-black text-ink">{item.body}</p>
            <p className="text-sm text-slate-500">
              برای مشاهده جزئیات، تصمیم‌گیری و ثبت نتیجه وارد پرونده درخواست شوید.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() =>
                  window.location.assign(item.url || "/admin/communication/notifications")
                }
              >
                باز کردن درخواست
              </Button>
              <Button variant="ghost" onClick={modal.close}>
                بعداً بررسی می‌کنم
              </Button>
            </div>
          </section>
        ),
      });
    },
  });

  const value = useMemo<NotificationContextValue>(
    () => ({
      items: notifications.items,
      unread: notifications.unread,
      loading: notifications.inbox.isLoading,
      error: notifications.inbox.isError,
      errorMessage: notifications.errorMessage,
      forbidden: notifications.forbidden,
      hasMore: Boolean(notifications.inbox.hasNextPage),
      loadingMore: notifications.inbox.isFetchingNextPage,
      refreshing: notifications.refreshing,
      markingAllRead: notifications.markingAllRead,
      soundEnabled: sound.soundEnabled,
      chatSoundEnabled: sound.chatSoundEnabled,
      setSoundEnabled: sound.setSoundEnabled,
      setChatSoundEnabled: sound.setChatSoundEnabled,
      markRead: notifications.markRead,
      markAllRead: notifications.markAllRead,
      loadMore: notifications.loadMore,
      refresh: notifications.refresh,
      pushStatus: push.pushStatus,
      enablePush: push.enablePush,
      disablePush: push.disablePush,
      savePushPreferences: push.savePushPreferences,
      testPush: push.testPush,
      testSound: sound.playSound,
    }),
    [
      notifications.items,
      notifications.unread,
      notifications.inbox.isLoading,
      notifications.inbox.isError,
      notifications.inbox.hasNextPage,
      notifications.inbox.isFetchingNextPage,
      notifications.errorMessage,
      notifications.forbidden,
      notifications.refreshing,
      notifications.markingAllRead,
      notifications.markRead,
      notifications.markAllRead,
      notifications.loadMore,
      notifications.refresh,
      sound.soundEnabled,
      sound.chatSoundEnabled,
      sound.setSoundEnabled,
      sound.setChatSoundEnabled,
      sound.playSound,
      push.pushStatus,
      push.enablePush,
      push.disablePush,
      push.savePushPreferences,
      push.testPush,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
