export function adminContentOffsetClass({
  showContextRail,
  mainCollapsed,
  contextCollapsed,
  direction = "rtl",
}: {
  showContextRail: boolean;
  mainCollapsed: boolean;
  contextCollapsed: boolean;
  direction?: "rtl" | "ltr";
}) {
  const offsets =
    direction === "rtl"
      ? {
          small: "lg:mr-[4.5rem]",
          main: "lg:mr-64",
          compact: "lg:mr-[8.5rem]",
          expanded: "lg:mr-[8.5rem] xl:mr-[17.5rem]",
          contextCompact: "lg:mr-80",
          contextExpanded: "lg:mr-80 xl:mr-[29rem]",
        }
      : {
          small: "lg:ml-[4.5rem]",
          main: "lg:ml-64",
          compact: "lg:ml-[8.5rem]",
          expanded: "lg:ml-[8.5rem] xl:ml-[17.5rem]",
          contextCompact: "lg:ml-80",
          contextExpanded: "lg:ml-80 xl:ml-[29rem]",
        };
  if (!showContextRail) return mainCollapsed ? offsets.small : offsets.main;

  // Between lg and xl the contextual rail is intentionally forced into its
  // compact 4rem form so the two fixed rails do not consume almost half of a
  // 1024–1279px viewport. At xl the user's persisted collapse preference wins.
  if (mainCollapsed) {
    return contextCollapsed ? offsets.compact : offsets.expanded;
  }

  return contextCollapsed ? offsets.contextCompact : offsets.contextExpanded;
}

/** Collapse the primary rail only when a contextual rail becomes available. */
export function shouldAutoCollapseMainRail(
  wasContextRailVisible: boolean,
  showContextRail: boolean,
) {
  return showContextRail && !wasContextRailVisible;
}
