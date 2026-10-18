import { BellRing, Clock3, MailOpen, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MobileSheet } from "../../../shared/ui/mobile-sheet";
import { Button, EmptyState } from "../../../shared/ui/ui";

export type AnnouncementEnvelopeItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  expiresAt?: string | null;
};

/** A compact mobile-only entry point for already-authorized school notices. */
export function AnnouncementEnvelope({
  announcements,
}: {
  announcements: readonly AnnouncementEnvelopeItem[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const activeAnnouncements = useMemo(
    () =>
      (announcements ?? []).filter(
        (announcement) =>
          !announcement.expiresAt || new Date(announcement.expiresAt).getTime() > Date.now(),
      ),
    [announcements],
  );

  if (!activeAnnouncements.length) return null;

  return (
    <>
      <button
        type="button"
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] end-4 z-20 grid size-14 place-items-center rounded-[1.2rem] border border-teal-200/80 bg-[linear-gradient(145deg,#ffffff,#e2f8f2)] text-teal-800 shadow-[0_12px_22px_rgb(13_118_111_/_24%),inset_0_1px_0_rgb(255_255_255_/_96%),inset_0_-4px_0_rgb(13_118_111_/_16%)] outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand motion-safe:animate-bounce motion-safe:[animation-duration:2.8s] motion-reduce:animate-none lg:hidden dark:border-teal-700 dark:bg-[linear-gradient(145deg,#164b49,#0d302f)] dark:text-teal-100 dark:shadow-[0_12px_22px_rgb(0_0_0_/_28%),inset_0_1px_0_rgb(255_255_255_/_12%)]"
        aria-label={`باز کردن ${activeAnnouncements.length.toLocaleString("fa-IR")} پیام مدرسه`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-2 top-1 h-6 bg-teal-500/15 [clip-path:polygon(0_0,100%_0,50%_100%)]"
        />
        <MailOpen className="relative" size={25} strokeWidth={1.9} aria-hidden="true" />
        <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm">
          {activeAnnouncements.length > 9
            ? "۹+"
            : activeAnnouncements.length.toLocaleString("fa-IR")}
        </span>
      </button>

      <MobileSheet open={open} onOpenChange={setOpen} className="lg:hidden">
        <section className="mx-auto w-full max-w-2xl p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700"
          />
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <BellRing size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-black text-ink">پیام‌های مدرسه</h2>
                <p className="mt-1 text-xs text-slate-500">اطلاعیه‌های فعال ۲۴ ساعت گذشته</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="بستن پیام‌های مدرسه"
              onClick={() => setOpen(false)}
            >
              <X size={19} aria-hidden="true" />
            </Button>
          </header>

          {activeAnnouncements.length ? (
            <ul className="mt-5 grid gap-3" aria-label="فهرست پیام‌های مدرسه">
              {activeAnnouncements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-[linear-gradient(145deg,#ffffff,#effcf9_58%,#dff5ef)] p-4 shadow-[0_10px_18px_rgb(13_118_111_/_12%),inset_0_1px_0_rgb(255_255_255_/_95%),inset_0_-3px_0_rgb(13_118_111_/_10%)] dark:border-teal-800/70 dark:bg-[linear-gradient(145deg,#173b3a,#112f31_58%,#0d2729)] dark:shadow-[0_10px_18px_rgb(0_0_0_/_20%),inset_0_1px_0_rgb(255_255_255_/_10%)]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-8 top-0 h-9 bg-teal-500/10 [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -end-3 -top-3 size-11 rotate-45 border-b border-s-2 border-teal-500/20 bg-white/45 dark:bg-white/5"
                  />
                  <div className="relative">
                    <h3 className="text-sm font-black text-ink">{announcement.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600 dark:text-slate-300">
                      {announcement.body}
                    </p>
                    {announcement.expiresAt ? (
                      <p className="mt-3 flex items-center gap-1 text-[11px] text-teal-800/70 dark:text-teal-100/70">
                        <Clock3 size={13} aria-hidden="true" />
                        <time dateTime={announcement.expiresAt}>
                          تا {formatExpiry(announcement.expiresAt)} فعال است
                        </time>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState title="پیام فعالی ندارید." />
            </div>
          )}
        </section>
      </MobileSheet>
    </>
  );
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
