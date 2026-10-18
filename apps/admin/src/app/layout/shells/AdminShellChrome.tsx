import type { ReactNode } from "react";
import { DesktopShell } from "./DesktopShell";
import { MobileShell } from "./MobileShell";
import { TabletShell } from "./TabletShell";
import type { AdminShellModel } from "./use-admin-shell-model";
import type { AdminShellKind } from "./viewport-shell";

export function AdminShellChrome({
  shell,
  model,
  onOpenCommandPalette,
}: {
  shell: AdminShellKind;
  model: AdminShellModel;
  onOpenCommandPalette: () => void;
}): ReactNode {
  if (shell === "desktop") {
    return <DesktopShell model={model} onOpenCommandPalette={onOpenCommandPalette} />;
  }
  if (shell === "tablet") {
    return <TabletShell model={model} onOpenCommandPalette={onOpenCommandPalette} />;
  }
  return <MobileShell model={model} />;
}
