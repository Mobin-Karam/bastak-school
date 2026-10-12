import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui";
import type { DataTableAction } from "./data-table-types";

export function DataTableRowActions<TData>({
  row,
  actions,
  label,
  busy,
}: {
  row: TData;
  actions: DataTableAction<TData>[];
  label: string;
  busy?: boolean;
}) {
  const visible = actions.filter((action) => !action.visible || action.visible(row));
  if (!visible.length) return null;
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            variant="ghost"
            className="min-h-11 min-w-11"
            disabled={busy}
            aria-label={label}
          />
        }
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end" className="z-[110]">
          <Menu.Popup className="min-w-44 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1 text-sm text-ink shadow-lg outline-none">
            {visible.map((action) => (
              <Menu.Item
                key={action.id}
                disabled={busy || action.disabled?.(row)}
                onClick={() => action.onClick(row)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 outline-none data-[highlighted]:bg-[rgb(var(--surface-muted))] data-[disabled]:opacity-50 ${action.tone === "danger" ? "text-rosewood" : ""}`}
              >
                {action.icon}
                {action.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
