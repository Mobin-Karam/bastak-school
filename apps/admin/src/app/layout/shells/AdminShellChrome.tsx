import type { ReactNode } from "react";
import { DesktopShell } from "./desktop/DesktopShell";
import { MobileShell } from "./mobile/MobileShell";
import { TabletShell } from "./tablet/TabletShell";
import type { AdminShellModel } from "../hooks/use-admin-shell-model";
import type { AdminShellKind } from "../lib/viewport-shell";

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
