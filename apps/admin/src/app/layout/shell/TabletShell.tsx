import type { AdminShellModel } from "./use-admin-shell-model";
import { AdminMainSidebar } from "../navigation/AdminMainSidebar";
import { AdminHeader } from "./AdminHeader";

/** Compact rail plus workspace header for 768px through 1199px viewports. */
export function TabletShell({
  model,
  onOpenCommandPalette,
}: {
  model: AdminShellModel;
  onOpenCommandPalette: () => void;
}) {
  return (
    <>
      <AdminMainSidebar
        viewport="tablet"
        collapsed={model.mainCollapsed}
        currentSection={model.current.section}
        currentPath={model.current.path}
        selectedStudentId={model.selectedStudentId}
        onToggle={() => model.setMainCollapsed((value) => !value)}
        onOpenSearch={onOpenCommandPalette}
        direction={model.direction}
      />
      <div className={`shrink-0 ${model.mainCollapsed ? "md:ms-[4.5rem]" : "md:ms-64"}`}>
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
