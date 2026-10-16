import { StudentAttendancePoolPrompt } from "../../../features/attendance/components/StudentAttendanceWorkspace";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth";
import { AdminCommandPalette } from "../command-palette/AdminCommandPalette";
import { adminContentOffsetClass } from "./layout-geometry";
import { api } from "../../../shared/api/api";
import { useModal } from "../../../shared/ui/modal";
import { Button } from "../../../shared/ui/ui";
import { AdminShellChrome } from "./AdminShellChrome";
import { SharedPageViewport } from "./SharedPageViewport";
import { useAdminShellModel } from "./use-admin-shell-model";
import { useViewportShell } from "./viewport-shell";
import { currentViewportHeight } from "./viewport-height";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"], [role="combobox"]',
    ),
  );
}

export function AdminLayout() {
  const model = useAdminShellModel();
  const shell = useViewportShell();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  useEffect(() => {
    document.documentElement.dataset.adminMotion =
      model.performance === "reduced" ? "reduce" : "full";
    return () => {
      delete document.documentElement.dataset.adminMotion;
    };
  }, [model.performance]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let frame: number | undefined;
    const syncHeight = () => {
      frame = undefined;
      root.style.setProperty("--admin-viewport-height", `${currentViewportHeight(window)}px`);
    };
    const scheduleSync = () => {
      if (frame !== undefined) return;
      frame = window.requestAnimationFrame(syncHeight);
    };
    const visualViewport = window.visualViewport;

    syncHeight();
    window.addEventListener("resize", scheduleSync, { passive: true });
    visualViewport?.addEventListener("resize", scheduleSync, { passive: true });
    visualViewport?.addEventListener("scroll", scheduleSync, { passive: true });

    return () => {
      window.removeEventListener("resize", scheduleSync);
      visualViewport?.removeEventListener("resize", scheduleSync);
      visualViewport?.removeEventListener("scroll", scheduleSync);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--admin-viewport-height");
    };
  }, []);

  return (
    <div
      className="admin-role-shell flex h-dvh flex-col overflow-hidden bg-paper text-ink"
      data-role={model.auth.activeRole ?? "DEFAULT"}
      data-performance={model.performance}
      data-shell={shell}
      dir={model.direction}
    >
      <PrincipalLeaveRequestAlert />
      {model.auth.can("attendance.self.read") ? <StudentAttendancePoolPrompt /> : null}
      <AdminShellChrome shell={shell} model={model} onOpenCommandPalette={openCommandPalette} />
      <SharedPageViewport
        contentOffsetClassName={
          shell === "desktop"
            ? adminContentOffsetClass({
                showContextRail: model.showContextRail,
                mainCollapsed: model.mainCollapsed,
                contextCollapsed: model.contextCollapsed,
                direction: model.direction,
              })
            : shell === "tablet"
              ? model.mainCollapsed
                ? "md:ms-[4.5rem]"
                : "md:ms-64"
              : undefined
        }
      >
        <Outlet />
      </SharedPageViewport>
      <AdminCommandPalette
        open={commandPaletteOpen}
        current={model.current}
        selectedStudentId={model.selectedStudentId}
        onClose={closeCommandPalette}
      />
    </div>
  );
}

type PendingLeaveRequest = {
  id: string;
  studentName: string | null;
  organizationName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  note: string;
  status: "PENDING" | string;
};

function PrincipalLeaveRequestAlert() {
  const auth = useAuth();
  const modal = useModal();
  const navigate = useNavigate();
  const shown = useRef<string | null>(null);
  const enabled = auth.activeRole === "PRINCIPAL" && auth.can("leave.read");
  const requests = useQuery({
    queryKey: ["leave-requests", "startup-alert", auth.context?.activeOrganization?.id ?? "all"],
    queryFn: () => api.get<PendingLeaveRequest[]>("/leave-requests"),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    const latest = requests.data?.find((request) => request.status === "PENDING");
    if (!latest || shown.current === latest.id) return;
    shown.current = latest.id;
    modal.open({
      title: "درخواست مرخصی جدید",
      description: "پیش از ورود به میز کار، آخرین درخواست در انتظار بررسی را ببینید.",
      size: "full",
      content: (
        <section className="grid h-full content-center gap-6 p-6 text-center" dir="rtl">
          <div className="mx-auto grid w-full max-w-2xl gap-4 rounded-2xl bg-[rgb(var(--surface-muted))] p-5 text-right">
            <div>
              <p className="text-xs font-bold text-brand">{latest.organizationName}</p>
              <h2 className="mt-1 text-xl font-black text-ink">
                {latest.studentName || "دانش‌آموز"}
              </h2>
            </div>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">نوع درخواست</dt>
                <dd className="mt-1 font-bold text-ink">
                  {latest.leaveType === "SCHOOL_EXIT" ? "خروج از مدرسه" : "مرخصی"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">بازه زمانی</dt>
                <dd className="mt-1 font-bold text-ink">
                  {new Date(latest.startDate).toLocaleDateString("fa-IR")} تا{" "}
                  {new Date(latest.endDate).toLocaleDateString("fa-IR")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">دلیل</dt>
                <dd className="mt-1 leading-6 text-ink">{latest.reason}</dd>
              </div>
              {latest.note ? (
                <div>
                  <dt className="text-slate-500">یادداشت</dt>
                  <dd className="mt-1 leading-6 text-ink">{latest.note}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="flex flex-col-reverse justify-center gap-2 sm:flex-row">
            <Button variant="ghost" onClick={modal.close}>
              بستن و ورود به برنامه
            </Button>
            <Button
              onClick={() => {
                modal.close();
                navigate("/admin/leave-requests");
              }}
            >
              مشاهده و مدیریت بیشتر
            </Button>
          </div>
        </section>
      ),
    });
  }, [modal, navigate, requests.data]);
  return null;
}
