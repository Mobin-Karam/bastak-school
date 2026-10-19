import { useNavigate } from "react-router-dom";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminMobileBottomNav } from "../../navigation/mobile/AdminMobileNavigation";
import { BackButton, MobileHeader } from "../../../../shared/ui/mobile";

export function MobileShell({ model }: { model: AdminShellModel }) {
  const navigate = useNavigate();
  const isRoot = model.current.path === "";

  return (
    <>
      <MobileHeader
        start={!isRoot ? <BackButton onClick={() => navigate(-1)} /> : <span aria-hidden="true" />}
        title={
          <span className="text-sm font-black text-ink">{model.current.title || "سامانه"}</span>
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
