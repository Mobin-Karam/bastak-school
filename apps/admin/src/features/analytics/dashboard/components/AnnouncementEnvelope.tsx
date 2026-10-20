import { BellRing, Clock3, MailOpen, MessageCircle, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { MobileSheet } from "../../../../shared/ui/mobile-sheet";
import { Button, EmptyState } from "../../../../shared/ui/ui";

export type AnnouncementEnvelopeItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  expiresAt?: string | null;
};

const POPUP_DELAY = 1500;
const POPUP_DURATION = 9000;
const TYPING_SPEED = 65;

const STORAGE_KEY = "bastak-announcements-previewed";

const PREVIEW_MESSAGE = "مدیر مدرسه اطلاعیه‌ای برای شما دارد...";

/**
 * Floating Persian chat notification.
 */
function AnnouncementChatBubble({
  count,
  onClick,
  onClose,
}: {
  count: number;
  onClick: () => void;
  onClose: () => void;
}) {
  const [visibleText, setVisibleText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setVisibleText(PREVIEW_MESSAGE);
      setIsTyping(false);
      return;
    }

    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;

      setVisibleText(PREVIEW_MESSAGE.slice(0, index));

      if (index >= PREVIEW_MESSAGE.length) {
        window.clearInterval(interval);
        setIsTyping(false);
      }
    }, TYPING_SPEED);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      dir="rtl"
      className="
        absolute
        bottom-[calc(100%+14px)]
        end-0
        z-30
        w-[270px]
        max-w-[calc(100vw-2rem)]
        animate-in
        fade-in
        slide-in-from-bottom-3
        duration-500
        motion-reduce:animate-none
      "
    >
      <div
        className="
          relative
          overflow-hidden
          rounded-[20px]
          border
          border-teal-200/80
          bg-[linear-gradient(145deg,#ffffff,#effcf9_58%,#dff5ef)]
          p-3.5
          shadow-[0_12px_35px_rgb(13_118_111_/_18%),inset_0_1px_0_rgb(255_255_255_/_95%)]
          transition-all
          duration-300
          hover:-translate-y-1
          dark:border-teal-800/70
          dark:bg-[linear-gradient(145deg,#173b3a,#112f31_58%,#0d2729)]
          dark:shadow-[0_12px_35px_rgb(0_0_0_/_25%)]
          motion-reduce:transform-none
        "
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="بستن پیش‌نمایش اطلاعیه"
          onClick={onClose}
          className="
            absolute
            left-2
            top-2
            z-10
            grid
            size-7
            place-items-center
            rounded-full
            text-slate-400
            transition
            hover:bg-slate-200/70
            hover:text-slate-700
            dark:hover:bg-white/10
            dark:hover:text-white
          "
        >
          <X size={14} />
        </button>

        {/* Clickable announcement */}
        <button
          type="button"
          onClick={onClick}
          className="
            block
            w-full
            text-start
            outline-none
            focus-visible:rounded-xl
            focus-visible:ring-2
            focus-visible:ring-brand
          "
        >
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <span
              className="
                grid
                size-10
                shrink-0
                place-items-center
                rounded-xl
                bg-teal-100
                text-teal-700
                shadow-inner
                dark:bg-teal-900
                dark:text-teal-200
              "
            >
              <MessageCircle size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  مدیر مدرسه
                </span>

                <span
                  aria-hidden="true"
                  className="
                    size-1.5
                    rounded-full
                    bg-emerald-500
                    motion-safe:animate-pulse
                  "
                />
              </div>

              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">پیام جدید</p>
            </div>
          </div>

          {/* Animated text */}
          <div className="mt-3 min-h-[48px]">
            <p className="text-xs leading-6 text-slate-600 dark:text-slate-200">
              <span aria-hidden="true">
                {visibleText}

                {isTyping && (
                  <span
                    className="
                      me-0.5
                      inline-block
                      h-3.5
                      w-[2px]
                      animate-pulse
                      bg-teal-500
                      align-middle
                    "
                  />
                )}
              </span>

              <span className="sr-only">{PREVIEW_MESSAGE}</span>
            </p>
          </div>

          {/* Footer */}
          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              border-t
              border-teal-100
              pt-2
              dark:border-teal-800
            "
          >
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300">
              مشاهده اطلاعیه‌ها
            </span>

            <span
              className="
                rounded-full
                bg-rose-500
                px-2
                py-0.5
                text-[10px]
                font-bold
                text-white
              "
            >
              {count.toLocaleString("fa-IR")} جدید
            </span>
          </div>
        </button>
      </div>

      {/* Chat pointer */}
      <span
        aria-hidden="true"
        className="
          absolute
          -bottom-[7px]
          end-5
          size-3.5
          rotate-45
          border-b
          border-r
          border-teal-200/80
          bg-[#dff5ef]
          dark:border-teal-800/70
          dark:bg-[#0d2729]
        "
      />
    </div>
  );
}

/**
 * Mobile-only announcement entry.
 *
 * Features:
 * - Floating notification
 * - Persian typing animation
 * - Persistent preview tracking
 * - Existing announcement sheet
 */
export function AnnouncementEnvelope({
  announcements,
}: {
  announcements: readonly AnnouncementEnvelopeItem[] | undefined;
}) {
  const [open, setOpen] = useState(false);

  const [showChatBubble, setShowChatBubble] = useState(false);

  const activeAnnouncements = useMemo(
    () =>
      (announcements ?? []).filter(
        (announcement) =>
          !announcement.expiresAt || new Date(announcement.expiresAt).getTime() > Date.now(),
      ),
    [announcements],
  );

  /**
   * Identifies the active announcements.
   * Sorting prevents unnecessary changes when API order changes.
   */
  const announcementSignature = useMemo(
    () =>
      activeAnnouncements
        .map((announcement) => `${announcement.id}:${announcement.publishedAt ?? ""}`)
        .sort()
        .join("|"),
    [activeAnnouncements],
  );

  /**
   * Show notification only for new announcements.
   */
  useEffect(() => {
    if (!announcementSignature || open) {
      return;
    }

    let alreadyPreviewed = false;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      alreadyPreviewed = stored === announcementSignature;
    } catch {
      // Storage may be unavailable.
    }

    if (alreadyPreviewed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowChatBubble(true);

      try {
        localStorage.setItem(STORAGE_KEY, announcementSignature);
      } catch {
        // Storage may be unavailable.
      }
    }, POPUP_DELAY);

    return () => window.clearTimeout(timer);
  }, [announcementSignature, open]);

  /**
   * Automatically hide floating notification.
   */
  useEffect(() => {
    if (!showChatBubble) return;

    const timer = window.setTimeout(() => {
      setShowChatBubble(false);
    }, POPUP_DURATION);

    return () => window.clearTimeout(timer);
  }, [showChatBubble]);

  /**
   * Close floating notification when the sheet opens.
   */
  useEffect(() => {
    if (open) {
      setShowChatBubble(false);
    }
  }, [open]);

  if (!activeAnnouncements.length) return null;

  return (
    <>
      {/* Floating announcement entry */}
      <div
        dir="rtl"
        className="
          fixed
          bottom-[calc(5.75rem+env(safe-area-inset-bottom))]
          end-4
          z-20
          lg:hidden
        "
      >
        {/* Persian chat preview */}
        {showChatBubble && !open && (
          <AnnouncementChatBubble
            count={activeAnnouncements.length}
            onClick={() => {
              setShowChatBubble(false);
              setOpen(true);
            }}
            onClose={() => {
              setShowChatBubble(false);
            }}
          />
        )}

        {/* Original envelope button */}
        <button
          type="button"
          className="
            relative
            grid
            size-14
            place-items-center
            rounded-[1.2rem]
            border
            border-teal-200/80
            bg-[linear-gradient(145deg,#ffffff,#e2f8f2)]
            text-teal-800
            shadow-[0_12px_22px_rgb(13_118_111_/_24%),inset_0_1px_0_rgb(255_255_255_/_96%),inset_0_-4px_0_rgb(13_118_111_/_16%)]
            outline-none
            transition
            hover:-translate-y-0.5
            focus-visible:ring-2
            focus-visible:ring-brand
            dark:border-teal-700
            dark:bg-[linear-gradient(145deg,#164b49,#0d302f)]
            dark:text-teal-100
            dark:shadow-[0_12px_22px_rgb(0_0_0_/_28%),inset_0_1px_0_rgb(255_255_255_/_12%)]
          "
          aria-label={`باز کردن ${activeAnnouncements.length.toLocaleString("fa-IR")} پیام مدرسه`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setShowChatBubble(false);
            setOpen(true);
          }}
        >
          <span
            aria-hidden="true"
            className="
              absolute
              inset-x-2
              top-1
              h-6
              bg-teal-500/15
              [clip-path:polygon(0_0,100%_0,50%_100%)]
            "
          />

          <MailOpen className="relative" size={25} strokeWidth={1.9} aria-hidden="true" />

          <span
            className="
              absolute
              -end-1
              -top-1
              grid
              size-5
              place-items-center
              rounded-full
              bg-rose-500
              text-[10px]
              font-black
              text-white
              shadow-sm
            "
          >
            {activeAnnouncements.length > 9
              ? "۹+"
              : activeAnnouncements.length.toLocaleString("fa-IR")}
          </span>
        </button>
      </div>

      {/* Existing mobile sheet */}
      <MobileSheet open={open} onOpenChange={setOpen} className="lg:hidden">
        <section
          dir="rtl"
          className="
            mx-auto
            w-full
            max-w-2xl
            p-4
            pb-[max(1.25rem,env(safe-area-inset-bottom))]
          "
        >
          {/* Drag indicator */}
          <div
            aria-hidden="true"
            className="
              mx-auto
              mb-4
              h-1.5
              w-12
              rounded-full
              bg-slate-200
              dark:bg-slate-700
            "
          />

          {/* Header */}
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="
                  grid
                  size-11
                  shrink-0
                  place-items-center
                  rounded-2xl
                  bg-brand/10
                  text-brand
                "
              >
                <BellRing size={21} aria-hidden="true" />
              </span>

              <div>
                <h2 className="text-base font-black text-ink">پیام‌های مدرسه</h2>

                <p className="mt-1 text-xs text-slate-500">اطلاعیه‌های فعال مدرسه</p>
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

          {/* Announcements */}
          {activeAnnouncements.length ? (
            <ul className="mt-5 grid gap-3" aria-label="فهرست پیام‌های مدرسه">
              {activeAnnouncements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-teal-200/80
                    bg-[linear-gradient(145deg,#ffffff,#effcf9_58%,#dff5ef)]
                    p-4
                    shadow-[0_10px_18px_rgb(13_118_111_/_12%),inset_0_1px_0_rgb(255_255_255_/_95%),inset_0_-3px_0_rgb(13_118_111_/_10%)]
                    dark:border-teal-800/70
                    dark:bg-[linear-gradient(145deg,#173b3a,#112f31_58%,#0d2729)]
                    dark:shadow-[0_10px_18px_rgb(0_0_0_/_20%),inset_0_1px_0_rgb(255_255_255_/_10%)]
                  "
                >
                  {/* Decorative envelope shape */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-8
                      top-0
                      h-9
                      bg-teal-500/10
                      [clip-path:polygon(0_0,100%_0,50%_100%)]
                    "
                  />

                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      -end-3
                      -top-3
                      size-11
                      rotate-45
                      border-b
                      border-s-2
                      border-teal-500/20
                      bg-white/45
                      dark:bg-white/5
                    "
                  />

                  <div className="relative">
                    <h3 className="text-sm font-black text-ink">{announcement.title}</h3>

                    <p
                      className="
                        mt-2
                        whitespace-pre-wrap
                        text-xs
                        leading-6
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {announcement.body}
                    </p>

                    {announcement.expiresAt && (
                      <p
                        className="
                          mt-3
                          flex
                          items-center
                          gap-1
                          text-[11px]
                          text-teal-800/70
                          dark:text-teal-100/70
                        "
                      >
                        <Clock3 size={13} aria-hidden="true" />

                        <time dateTime={announcement.expiresAt}>
                          تا {formatExpiry(announcement.expiresAt)} فعال است
                        </time>
                      </p>
                    )}
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

/**
 * Persian date formatting.
 */
function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
