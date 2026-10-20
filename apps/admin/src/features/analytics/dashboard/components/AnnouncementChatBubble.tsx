import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

type AnnouncementChatBubbleProps = {
  onClick: () => void;
  onClose: () => void;
  count: number;
};

const MESSAGE = "مدیر مدرسه اطلاعیه‌ای برای شما دارد...";

export function AnnouncementChatBubble({ onClick, onClose, count }: AnnouncementChatBubbleProps) {
  const [visibleText, setVisibleText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;

    const interval = window.setInterval(() => {
      index++;

      setVisibleText(MESSAGE.slice(0, index));

      if (index >= MESSAGE.length) {
        window.clearInterval(interval);
        setIsTyping(false);
      }
    }, 65);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      dir="rtl"
      className="absolute bottom-[calc(100%+14px)] end-0 z-30 w-[260px] max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-3 duration-500"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        className="
          group relative cursor-pointer
          overflow-hidden
          rounded-[20px]
          border border-teal-200/80
          bg-gradient-to-br from-white via-teal-50 to-emerald-50
          p-3.5
          shadow-[0_12px_35px_rgba(13,118,111,0.18)]
          transition-all duration-300
          hover:-translate-y-1
          hover:shadow-[0_16px_40px_rgba(13,118,111,0.25)]
          dark:border-teal-700/70
          dark:from-[#173b3a]
          dark:via-[#112f31]
          dark:to-[#0d2729]
        "
      >
        {/* Close */}
        <button
          type="button"
          aria-label="بستن پیش‌نمایش اطلاعیه"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="
            absolute left-2 top-2
            rounded-full p-1
            text-slate-400
            hover:bg-slate-200/70
            dark:hover:bg-white/10
          "
        >
          <X size={13} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="
              grid size-9 shrink-0 place-items-center
              rounded-xl
              bg-teal-100
              text-teal-700
              shadow-inner
              dark:bg-teal-900
              dark:text-teal-200
            "
          >
            <MessageCircle size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 dark:text-white">مدیر مدرسه</span>

              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>

            <span className="text-[10px] text-slate-500 dark:text-slate-400">پیام جدید</span>
          </div>
        </div>

        {/* Typing message */}
        <div className="mt-3 min-h-[42px]">
          <p className="text-xs leading-6 text-slate-600 dark:text-slate-200">
            {visibleText}

            {isTyping && (
              <span className="mr-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-teal-500 align-middle" />
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-teal-100 pt-2 dark:border-teal-800">
          <span className="text-[10px] text-teal-700 dark:text-teal-300">مشاهده اطلاعیه‌ها</span>

          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {count.toLocaleString("fa-IR")} جدید
          </span>
        </div>
      </div>

      {/* Chat pointer */}
      <div
        className="
          absolute -bottom-[7px] end-5
          size-3.5 rotate-45
          border-b border-r border-teal-200/80
          bg-emerald-50
          dark:border-teal-700/70
          dark:bg-[#0d2729]
        "
      />
    </div>
  );
}
