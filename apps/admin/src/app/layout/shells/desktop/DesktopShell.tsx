import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminMainSidebar } from "../../navigation/desktop/AdminMainSidebar";
import { adminContentOffsetClass } from "../../lib/layout-geometry";
import { AdminHeader } from "../../components/AdminHeader";

export function DesktopShell({
  model,
  onOpenCommandPalette,
}: {
  model: AdminShellModel;
  onOpenCommandPalette: () => void;
}) {
  return (
    <>
      {!model.desktopSidebarHidden ? (
        <AdminMainSidebar
          viewport="desktop"
          collapsed={false}
          currentSection={model.current.section}
          currentPath={model.current.path}
          selectedStudentId={model.selectedStudentId}
          onToggle={() => model.setDesktopSidebarHidden(true)}
          onOpenSearch={onOpenCommandPalette}
          direction={model.direction}
        />
      ) : null}
      <div
        className={`${adminContentOffsetClass({ showContextRail: false, mainCollapsed: false, contextCollapsed: false, mainHidden: model.desktopSidebarHidden, direction: model.direction })} hidden shrink-0 min-[1200px]:block transition-[margin] duration-200 motion-reduce:transition-none`}
      >
        <AdminHeader
          current={model.current}
          breadcrumbs={model.breadcrumbs}
          selectedStudentId={model.selectedStudentId}
          sticky={false}
          role={model.role}
          organization={model.organization}
          multipleRoles={model.multipleRoles}
          showStudent={model.showStudent}
          performance={model.performance}
          mainSidebarHidden={model.desktopSidebarHidden}
          onShowMainSidebar={() => model.setDesktopSidebarHidden(false)}
        />
      </div>
    </>
  );
}
