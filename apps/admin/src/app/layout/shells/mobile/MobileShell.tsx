import { useNavigate } from "react-router-dom";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminMobileBottomNav } from "../../navigation/mobile/AdminMobileNavigation";
import { BackButton, MobileHeader } from "../../../../shared/ui/mobile";

function SchoolBrandHeader() {
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

  return (
    <>
      <MobileHeader
        start={!isRoot ? <BackButton onClick={() => navigate(-1)} /> : <span aria-hidden="true" />}
        title={<SchoolBrandHeader />}
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
