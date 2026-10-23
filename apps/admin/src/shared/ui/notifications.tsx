import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert, Undo2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Toaster, toast, type ExternalToast } from "sonner";
import { useTheme } from "../theme/theme";
import { useLocale } from "./locale";

export type NotificationTone = "success" | "error" | "warning" | "info" | "loading";
export type NotificationOptions = ExternalToast & { description?: ReactNode };
type ExtendedNotificationResult = NotificationOptions & { message: ReactNode };
export type PromiseNotificationData<T> = Omit<NotificationOptions, "description"> & {
  loading?: ReactNode;
  success?:
    | ReactNode
    | ExtendedNotificationResult
    | ((data: T) => ReactNode)
    | ((data: T) => ExtendedNotificationResult);
  error?:
    | ReactNode
    | ExtendedNotificationResult
    | ((error: unknown) => ReactNode)
    | ((error: unknown) => ExtendedNotificationResult);
  description?: ReactNode | ((data: T) => ReactNode);
};
const duration = 5000;
const toneDuration = { success: duration, info: duration, warning: 6500, error: 8000 };
const loadingIcon = (
  <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
);

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
      position={profile.direction === "rtl" ? "bottom-left" : "bottom-right"}
      closeButton
      expand={false}
      visibleToasts={3}
      gap={10}
      offset={16}
      mobileOffset={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))", left: 12, right: 12 }}
      style={
        {
          "--width": "min(26rem, calc(100vw - 1.5rem))",
          fontFamily: "Vazirmatn, Tahoma, Arial, sans-serif",
        } as CSSProperties
      }
      icons={{
        success: <CircleCheck size={20} aria-hidden="true" />,
        error: <CircleX size={20} aria-hidden="true" />,
        warning: <TriangleAlert size={20} aria-hidden="true" />,
        info: <Info size={20} aria-hidden="true" />,
        loading: loadingIcon,
      }}
      duration={duration}
      containerAriaLabel={language === "en" ? "Notifications" : "اعلان‌ها"}
      className="admin-sonner-toaster"
      toastOptions={{
        closeButtonAriaLabel: language === "en" ? "Dismiss notification" : "بستن اعلان",
        classNames: {
          toast: "admin-sonner-toast",
          title: "admin-sonner-title",
          description: "admin-sonner-description",
          icon: "admin-sonner-icon",
          actionButton: "admin-sonner-action",
          cancelButton: "admin-sonner-cancel",
          closeButton: "admin-sonner-close",
        },
      }}
    />
  );
}

export function notify(
  message: string,
  tone: NotificationTone = "success",
  displayDuration?: number,
) {
  if (tone === "loading")
    return notifications.loading(message, { duration: displayDuration ?? Infinity });
  return typedToast(tone, message, { duration: displayDuration ?? toneDuration[tone] });
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
    ...options,
    id: options?.id ?? notificationId(tone, message),
    duration: options?.duration ?? toneDuration[tone],
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
      icon: loadingIcon,
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
    return toast.promise(promise, { duration, ...data });
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
