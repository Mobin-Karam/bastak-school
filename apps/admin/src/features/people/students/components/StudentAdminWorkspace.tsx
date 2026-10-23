import type { ReactNode } from "react";

/**
 * Route-level student workspace. Keeps the directory and the selected record
 * in one responsive composition without duplicating the feature by viewport.
 */
export function StudentAdminWorkspace({
  directory,
  detail,
  directoryVisible,
  detailVisible,
}: {
  directory: ReactNode;
  detail: ReactNode;
  directoryVisible: boolean;
  detailVisible: boolean;
}) {
  return (
    <section
      aria-label="Student administration workspace"
      className="students-workspace grid min-w-0 gap-4 xl:h-[calc(100dvh-7rem)] xl:min-h-0 xl:grid-cols-1"
    >
      <div className={`min-w-0 xl:min-h-0 ${directoryVisible ? "block" : "hidden xl:block"}`}>
        {directory}
      </div>
      <div className={`contents ${detailVisible ? "block" : "hidden"}`}>{detail}</div>
    </section>
  );
}
