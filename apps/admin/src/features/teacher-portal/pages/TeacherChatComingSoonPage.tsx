import { Clock3, MessageCircle } from "lucide-react";

export function TeacherChatComingSoonPage() {
  return (
    <section
      className="relative grid min-h-[calc(100dvh-12rem)] place-items-center overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5"
      aria-labelledby="teacher-chat-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-sky-100/50 dark:to-sky-950/20"
      />
      <div className="relative grid max-w-sm justify-items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand text-white shadow-[0_16px_32px_rgb(var(--color-brand)_/_28%)]">
          <MessageCircle size={30} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold text-brand">به‌زودی</p>
          <h2 id="teacher-chat-title" className="sr-only">
            گفت‌وگوی مدرسه
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            پیام‌رسانی استاد، دانش‌آموز و مدرسه در نسخه بعدی از این صفحه فعال می‌شود.
          </p>
        </div>
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <Clock3 size={16} aria-hidden="true" />
          این بخش هنوز پیام ارسال نمی‌کند.
        </p>
      </div>
    </section>
  );
}
