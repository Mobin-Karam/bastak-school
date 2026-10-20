import type { ReactNode } from "react";

export function SharedPageViewport({
  children,
  contentOffsetClassName,
}: {
  children: ReactNode;
  contentOffsetClassName?: string;
}) {
  return (
    <div
      className={`${contentOffsetClassName || ""} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 motion-reduce:transition-none`}
    >
      <div className="admin-page-scroll scroll-reveal min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <main className="admin-page-main w-full min-w-0 px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-6 lg:pb-6 xl:px-8">
          <div className="admin-page-shell mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
