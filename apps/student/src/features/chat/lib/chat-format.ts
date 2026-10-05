// src/pages/student/chat/lib/chat-format.ts
export function formatTime(value?: string) {
  return value
    ? new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";
}

export function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("fa-IR", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date(value))
    : "";
}

export function formatInboxTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? formatTime(value)
    : new Intl.DateTimeFormat("fa-IR", {
        month: "short",
        day: "numeric",
      }).format(date);
}

export function initials(value?: string) {
  return (value || "گ").trim().slice(0, 1);
}

export function statusLabel(status: string, online: boolean) {
  if (!online) return "آفلاین";
  if (status === "loading") return "در حال دریافت پیام‌ها";
  if (status === "sending") return "در حال ارسال";
  if (status === "error") return "خطا در اتصال";
  return "آنلاین";
}