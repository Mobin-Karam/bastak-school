import { LoaderCircle, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { Toaster, toast, type ExternalToast } from "sonner";
import { useTheme } from "../theme/theme";
import { useLocale } from "./locale";

export type NotificationTone = "success" | "error" | "warning" | "info" | "loading";
type NotificationOptions = ExternalToast & { description?: ReactNode };
type PromiseNotificationData<T> = {
  loading?: ReactNode;
  success?: ReactNode | ((data: T) => ReactNode);
  error?: ReactNode | ((error: unknown) => ReactNode);
  description?: ReactNode | ((data: T) => ReactNode);
};
const duration = 4500;

function notificationId(tone: Exclude<NotificationTone, "loading">, message: string) {
  return `admin:${tone}:${message}`;
}

export function AppToaster() {
  const { language, profile } = useLocale();
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      dir={profile.direction}
      position="bottom-left"
      closeButton
      richColors
      expand
      visibleToasts={5}
      gap={12}
      offset={16}
      duration={duration}
      containerAriaLabel={language === "en" ? "Notifications" : "اعلان‌ها"}
      className="admin-sonner-toaster"
      toastOptions={{
        classNames: {
          toast: "admin-sonner-toast",
          title: "admin-sonner-title",
          description: "admin-sonner-description",
          icon: "admin-sonner-icon",
          actionButton: "admin-sonner-action",
        },
      }}
    />
  );
}

export function notify(
  message: string,
  tone: NotificationTone = "success",
  displayDuration = tone === "loading" ? Infinity : duration,
) {
  if (tone === "loading")
    return toast.loading(message, {
      duration: displayDuration,
      icon: <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />,
    });
  return toast[tone](message, {
    id: notificationId(tone, message),
    duration: displayDuration,
  });
}

function notificationLanguage() {
  return typeof document !== "undefined" && document.documentElement.lang.startsWith("en")
    ? "en"
    : "fa";
}

function countdownDescription(seconds: number) {
  const language = notificationLanguage();
  const formatted = Math.max(0, seconds).toLocaleString(language === "en" ? "en-US" : "fa-IR");
  return language === "en"
    ? `Auto-delete in ${formatted} seconds`
    : `حذف خودکار تا ${formatted} ثانیه دیگر`;
}

function typedToast(
  tone: Exclude<NotificationTone, "loading">,
  message: string,
  options?: NotificationOptions,
) {
  return toast[tone](message, {
    id: options?.id ?? notificationId(tone, message),
    duration: tone === "error" ? (options?.duration ?? 6000) : (options?.duration ?? duration),
    ...options,
  });
}

export const notifications = {
  success: (message: string, options?: NotificationOptions) =>
    typedToast("success", message, options),
  error: (message: string, options?: NotificationOptions) => typedToast("error", message, options),
  warning: (message: string, options?: NotificationOptions) =>
    typedToast("warning", message, options),
  info: (message: string, options?: NotificationOptions) => typedToast("info", message, options),
  loading(message: string, options?: NotificationOptions) {
    return toast.loading(message, {
      duration: Infinity,
      icon: <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />,
      ...options,
    });
  },
  undo(message: string, onUndo: () => void, options?: NotificationOptions, undoDuration = 10000) {
    const language = notificationLanguage();
    return toast.warning(message, {
      duration: undoDuration,
      description:
        language === "en"
          ? "Choose the button below to restore it."
          : "برای بازگردانی، دکمه زیر را انتخاب کنید.",
      icon: <Undo2 size={18} aria-hidden="true" />,
      action: {
        label: language === "en" ? "Restore" : "بازگردانی",
        onClick: onUndo,
      },
      ...options,
    });
  },
  promise<T>(promise: Promise<T>, data: PromiseNotificationData<T>) {
    return toast.promise(promise, data);
  },
  undoCountdown(
    message: string,
    seconds: number,
    onUndo: () => void,
    options?: NotificationOptions,
  ) {
    const language = notificationLanguage();
    let remaining = seconds;
    let timer = 0;
    const toastOptions = {
      duration: seconds * 1000,
      icon: <Undo2 size={18} aria-hidden="true" />,
      action: {
        label: language === "en" ? "Undo deletion" : "لغو حذف",
        onClick() {
          window.clearInterval(timer);
          onUndo();
        },
      },
      ...options,
    };
    const id = toast.warning(message, {
      ...toastOptions,
      description: countdownDescription(remaining),
    });
    timer = window.setInterval(() => {
      remaining -= 1;
      toast.warning(message, {
        ...toastOptions,
        id,
        description: countdownDescription(remaining),
      });
      if (remaining <= 0) window.clearInterval(timer);
    }, 1000);
    return id;
  },
  update(id: string | number, message: string, options?: NotificationOptions) {
    toast(message, { ...options, id });
    return id;
  },
  dismiss: toast.dismiss,
};
