import type { AdminShellModel } from "../../hooks/use-admin-shell-model";
import { AdminContextSidebar } from "../../navigation/desktop/AdminContextSidebar";
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
      <AdminMainSidebar
        viewport="desktop"
        collapsed={model.mainCollapsed}
        currentSection={model.current.section}
        currentPath={model.current.path}
        selectedStudentId={model.selectedStudentId}
        onToggle={() => model.setMainCollapsed((value) => !value)}
        onOpenSearch={onOpenCommandPalette}
        direction={model.direction}
      />
      {model.showContextRail ? (
        <AdminContextSidebar
          collapsed={model.contextCollapsed}
          mainCollapsed={model.mainCollapsed}
          current={model.current}
          sourceSection={model.sourceCurrent.section}
          items={model.contextual}
          unreadNotifications={model.notificationState.unread}
          selectedStudentId={model.selectedStudentId}
          onToggle={() => model.setContextCollapsed((value) => !value)}
          direction={model.direction}
        />
      ) : null}
      <div
        className={`${adminContentOffsetClass({ showContextRail: model.showContextRail, mainCollapsed: model.mainCollapsed, contextCollapsed: model.contextCollapsed, direction: model.direction })} hidden shrink-0 min-[1200px]:block transition-[margin] duration-200 motion-reduce:transition-none`}
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
        />
      </div>
    </>
  );
}
