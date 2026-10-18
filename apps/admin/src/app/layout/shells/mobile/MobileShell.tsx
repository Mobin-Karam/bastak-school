import { Bell, ChevronDown, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminMobileBottomNav } from "../../navigation/mobile/AdminMobileNavigation";
import { BackButton, MobileHeader } from "../../../../shared/ui/mobile";
import { getAdminDashboard } from "../../../../features/analytics/dashboard/api/dashboard.api";

function StudentFloatingIsland({ model }: { model: AdminShellModel }) {
  const [expanded, setExpanded] = useState(false);
  const unread = model.notificationState.unread;
  const firstName = model.auth.user?.firstName || model.auth.user?.displayName || "دانش‌آموز";
  const pageLabel = model.current.title;

  return (
    <div className="relative flex justify-center" dir="rtl">
      <div
        className={[
          "flex h-10 items-center overflow-hidden rounded-full border border-slate-900/10 bg-slate-950 text-white shadow-[0_10px_28px_rgb(15_23_42_/_24%)] transition-[width,box-shadow,background-color] duration-300 ease-out dark:border-white/10 dark:bg-slate-50 dark:text-slate-950",
          expanded
            ? "w-[min(20rem,calc(100vw-2rem))] shadow-[0_14px_34px_rgb(15_23_42_/_30%)]"
            : "w-36",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label={expanded ? "بستن گزینه‌های زنین" : "باز کردن گزینه‌های زنین"}
          aria-expanded={expanded}
          aria-controls="student-floating-island-actions"
          onClick={() => setExpanded((value) => !value)}
          className="flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-black text-white">
            {firstName.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-bold">
            {expanded ? `${firstName} · ${pageLabel}` : "اعلان ها"}
          </span>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <div
          id="student-floating-island-actions"
          aria-hidden={!expanded}
          className={`flex h-full shrink-0 items-center gap-1 overflow-hidden border-s border-white/15 pe-1 ps-2 transition-[width,opacity] duration-300 dark:border-slate-900/15 ${expanded ? "w-20 opacity-100" : "w-0 opacity-0"}`}
        >
          <Link
            to="/admin/communication/notifications"
            tabIndex={expanded ? 0 : -1}
            aria-label={unread ? `${unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده` : "اعلان‌ها"}
            className="relative grid size-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:text-slate-800 dark:hover:bg-slate-900/10 dark:focus-visible:ring-slate-900"
          >
            <Bell size={16} aria-hidden="true" />
            {unread ? (
              <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black leading-4 text-white">
                {Math.min(unread, 99).toLocaleString("fa-IR")}
              </span>
            ) : null}
          </Link>
          <Link
            to="/admin/profile"
            tabIndex={expanded ? 0 : -1}
            aria-label="پروفایل من"
            className="grid size-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:text-slate-800 dark:hover:bg-slate-900/10 dark:focus-visible:ring-slate-900"
          >
            <UserRound size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StudentQuietHeader() {
  return (
    <div
      className="relative flex h-10 w-full items-center justify-center"
      aria-label="مدرسه دینی سلطان العلماء بستک"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 w-20 overflow-hidden opacity-90"
      >
        <img
          src="/right-left-angel.png"
          alt=""
          className="absolute end-0 top-1/2 h-11 w-auto max-w-none -translate-y-1/2 scale-x-[-1]"
        />
      </span>
      <img
        src="/logo-bastak.webp"
        alt="مدرسه دینی سلطان العلماء بستک"
        width={120}
        height={40}
        className="relative z-10 h-8 w-auto rounded bg-white/95 px-1 object-contain shadow-sm dark:bg-slate-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 w-20 overflow-hidden opacity-90"
      >
        <img
          src="/right-left-angel.png"
          alt=""
          className="absolute start-0 top-1/2 h-11 w-auto max-w-none -translate-y-1/2"
        />
      </span>
    </div>
  );
}

export function MobileShell({ model }: { model: AdminShellModel }) {
  const navigate = useNavigate();
  const isRoot = model.current.path === "";
  const isStudent = model.auth.activeRole === "STUDENT";
  const studentHome = useQuery({
    queryKey: ["dashboard", "student-home"],
    queryFn: () => getAdminDashboard("STUDENT"),
    enabled: isStudent,
    staleTime: 30_000,
  });
  const hasActiveAnnouncement = useMemo(
    () =>
      (studentHome.data?.home?.announcements ?? []).some(
        (announcement) =>
          !announcement.expiresAt || new Date(announcement.expiresAt).getTime() > Date.now(),
      ),
    [studentHome.data?.home?.announcements],
  );
  const showStudentIsland = model.notificationState.unread > 0 || hasActiveAnnouncement;

  return (
    <>
      <MobileHeader
        start={!isRoot ? <BackButton onClick={() => navigate(-1)} /> : <span aria-hidden="true" />}
        title={
          isStudent && showStudentIsland ? (
            <StudentFloatingIsland model={model} />
          ) : isStudent ? (
            <StudentQuietHeader />
          ) : (
            <h1 className="truncate text-base font-black text-ink">{model.current.title}</h1>
          )
        }
        className="admin-mobile-masthead relative z-30 shrink-0 lg:hidden"
      />

      <AdminMobileBottomNav
        current={model.current}
        selectedStudentId={model.selectedStudentId}
        performance={model.performance}
      />
    </>
  );
}
