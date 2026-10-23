import { useAdminShellCopy } from "@/shared/ui/locale";
import { brand } from "@/app/config/brand";
import { ResponsiveDrawer } from "@/shared/ui/responsive-drawer";
import { ArrowUpLeft, GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type StudentWelcomeCardProps = {
  firstName?: string | null;
  lastName?: string | null;
  grade?: string | null;
  schoolName?: string | null;
  profileUrl?: string;
};

export function StudentWelcomeCard({
  firstName,
  lastName,
  grade,
  schoolName = brand.name.fa,
  profileUrl = "/admin/profile",
}: StudentWelcomeCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const copy = useAdminShellCopy();

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "دانش‌آموز عزیز";

  return (
    <section
      dir="rtl"
      aria-label="خوش‌آمدگویی دانش‌آموز"
      className="
        relative isolate w-full min-w-0
        overflow-hidden rounded-[1.75rem]
        border border-emerald-200/60
        bg-gradient-to-br
        from-emerald-50 via-teal-50 to-cyan-50
        shadow-sm
        dark:border-emerald-800/40
        dark:from-emerald-950
        dark:via-slate-900
        dark:to-teal-950
      "
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -left-12 -top-16
          size-52 rounded-full
          bg-emerald-300/20 blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute
          -bottom-20 right-10
          size-48 rounded-full
          bg-cyan-300/20 blur-3xl
        "
      />

      <div className="relative flex min-h-48 items-center sm:min-h-56">
        {/* Student information */}
        <div
          className="
            relative z-10 flex min-w-0 flex-1
            flex-col items-start
            gap-3 py-5
            pr-5 pl-1
            sm:gap-4 sm:py-7 sm:pr-8
          "
        >
          <div
            className="
              inline-flex items-center gap-1.5
              rounded-full border
              border-emerald-200/70
              bg-white/70
              px-3 py-1
              text-[10px] font-bold
              text-emerald-700
              dark:border-emerald-700/50
              dark:bg-emerald-900/40
              dark:text-emerald-300
            "
          >
            {/* {formatDate(calendarDate, { dateStyle: "medium" })} */}
            <GraduationCap size={13} aria-hidden="true" />
            پنل دانش‌آموزی
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              سلام، خوش اومدی!
            </p>

            <h1
              className="
                mt-1 break-words
                text-lg font-black leading-relaxed
                text-slate-900
                dark:text-white
                sm:text-2xl
              "
            >
              {fullName}
            </h1>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            {grade && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <GraduationCap size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="truncate">{grade}</span>
              </div>
            )}

            {schoolName && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <School size={13} className="shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="line-clamp-2">{schoolName}</span>
              </div>
            )}
          </div>

          <Link
            to={profileUrl}
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
            className="
              inline-flex min-h-9 items-center
              justify-center gap-2
              rounded-xl
              bg-emerald-600 px-4 py-2
              text-xs font-bold text-white
              shadow-sm shadow-emerald-600/20
              transition-colors duration-200
              hover:bg-emerald-700
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-500
              focus-visible:ring-offset-2
              active:bg-emerald-800
            "
          >
            مشاهده پروفایل
            <ArrowUpLeft size={15} aria-hidden="true" />
            <ResponsiveDrawer
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              title={copy.allRoutes}
              description={"بخش‌های در دسترس با نقش فعلی شما"}
              className="md:hidden"
            >
              <aside
                id="admin-mobile-navigation-sheet"

                className="grid gap-5"
              ></aside>
            </ResponsiveDrawer>
          </Link>
        </div>

        {/* Student illustration */}
        <div
          aria-hidden="true"
          className="
            relative self-stretch
            w-[35%] shrink-0
            sm:w-[38%]
            md:w-[35%]
          "
        >
          <div
            className="
              absolute bottom-0 left-1/2
              h-[90%] w-[145%]
              -translate-x-1/2
              rounded-t-full
              bg-emerald-200/30
              blur-xl
              dark:bg-emerald-700/20
            "
          />

          <img
            src="/images/bastak-student-avatar.webp"
            alt=""
            decoding="async"
            className="
              pointer-events-none
              absolute bottom-0 left-1/2
              h-[95%] w-[130%]
              max-w-none
              -translate-x-1/2
              select-none
              object-contain object-bottom
              sm:h-full
            "
          />
        </div>
      </div>
    </section>
  );
}
