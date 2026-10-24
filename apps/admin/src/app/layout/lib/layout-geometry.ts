export function adminContentOffsetClass({
  showContextRail,
  mainCollapsed,
  contextCollapsed,
  mainHidden = false,
  direction = "rtl",
}: {
  showContextRail: boolean;
  mainCollapsed: boolean;
  contextCollapsed: boolean;
  mainHidden?: boolean;
  direction?: "rtl" | "ltr";
}) {
  const offsets =
    direction === "rtl"
      ? {
          small: "min-[1200px]:mr-[4.5rem]",
          main: "min-[1200px]:mr-64",
          compact: "min-[1200px]:mr-[8.5rem]",
          expanded: "min-[1200px]:mr-[8.5rem] min-[1280px]:mr-[17.5rem]",
          contextCompact: "min-[1200px]:mr-80",
          contextExpanded: "min-[1200px]:mr-80 min-[1280px]:mr-[29rem]",
        }
      : {
          small: "min-[1200px]:ml-[4.5rem]",
          main: "min-[1200px]:ml-64",
          compact: "min-[1200px]:ml-[8.5rem]",
          expanded: "min-[1200px]:ml-[8.5rem] min-[1280px]:ml-[17.5rem]",
          contextCompact: "min-[1200px]:ml-80",
          contextExpanded: "min-[1200px]:ml-80 min-[1280px]:ml-[29rem]",
        };
  if (mainHidden) return "";
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
