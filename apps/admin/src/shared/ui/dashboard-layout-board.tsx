import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { GripVertical, MoveDown, MoveUp, PanelTop, Shrink, StretchHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

export type DashboardBoardItem = {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  content: ReactNode;
};

/**
 * Framework-local renderer for the portable dashboard layout model. The model
 * stores only order and footprint; the host owns widget data and permissions.
 */
export function DashboardLayoutBoard({
  items,
  editing,
  labels,
  onChange,
  onReorder,
}: {
  items: DashboardBoardItem[];
  editing: boolean;
  labels: {
    boardLabel: string;
    footprint: string;
    dragHint: string;
    moveEarlier: string;
    moveLater: string;
    makeNarrower: string;
    makeWider: string;
    makeShorter: string;
    makeTaller: string;
  };
  onChange: (id: string, patch: { order?: number; width?: number; height?: number }) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sourceIds = useMemo(() => items.map((item) => item.id), [items]);
  const sourceOrder = sourceIds.join("|");
  const publishedOrder = useRef(sourceOrder);
  const onReorderRef = useRef(onReorder);
  const dragConfig = useMemo(
    () => ({
      disabled: !editing,
      dragHandle: ".dashboard-widget-drag-handle",
      draggingClass: "opacity-50",
      dropZoneClass: "ring-2 ring-brand/40",
      plugins: [
        (element: HTMLElement) => ({
          remapFinished: () => {
            if (editing) return;
            element.setAttribute("role", "group");
            for (const name of [
              "aria-multiselectable",
              "aria-activedescendant",
              "aria-describedby",
              "tabindex",
            ])
              element.removeAttribute(name);
            for (const child of element.querySelectorAll(':scope > [role="option"]')) {
              child.setAttribute("role", "article");
              child.removeAttribute("aria-selected");
            }
          },
        }),
      ],
    }),
    [editing],
  );
  const [parent, orderedIds, , updateConfig] = useDragAndDrop<HTMLDivElement, string>(
    sourceIds,
    dragConfig,
  );
  const updateConfigRef = useRef(updateConfig);
  updateConfigRef.current = updateConfig;
  useEffect(() => {
    updateConfigRef.current(dragConfig);
  }, [dragConfig]);
  const orderedItems = useMemo(
    () =>
      orderedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as DashboardBoardItem[],
    [items, orderedIds],
  );
  const orderedItemIds = orderedItems.map((item) => item.id).join("|");

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    if (!orderedItemIds || orderedItemIds === publishedOrder.current) return;
    publishedOrder.current = orderedItemIds;
    onReorderRef.current(orderedItems.map((item) => item.id));
  }, [orderedItemIds, orderedItems]);

  const move = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const source = orderedItems.findIndex((item) => item.id === sourceId);
    const target = orderedItems.findIndex((item) => item.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...orderedItems];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    onReorder(next.map((item) => item.id));
  };

  return (
    <div
      ref={parent}
      aria-label={labels.boardLabel}
      className="grid min-w-0 grid-cols-1 gap-3 md:auto-rows-[minmax(5rem,auto)] md:grid-cols-12"
    >
      {orderedItems.map((item, index) => (
        <div
          role={editing ? "option" : "article"}
          key={item.id}
          className={`group relative min-w-0 ${editing ? "rounded-xl outline outline-1 outline-dashed outline-brand/40" : ""}`}
          style={{
            gridColumn: `span ${Math.min(12, Math.max(1, item.width))} / span ${Math.min(12, Math.max(1, item.width))}`,
            gridRow: `span ${Math.min(4, Math.max(1, item.height))} / span ${Math.min(4, Math.max(1, item.height))}`,
          }}
        >
          {editing ? (
            <div className="flex min-h-9 items-center gap-1 border-b border-brand/15 bg-brand/[0.035] px-2 text-[11px] text-slate-600 dark:text-slate-300">
              <GripVertical
                className="dashboard-widget-drag-handle size-4 shrink-0 cursor-grab touch-none text-brand active:cursor-grabbing"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate font-bold text-ink">{item.title}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {labels.footprint}: {item.width}×{item.height}
              </span>
              <BoardButton
                label={labels.moveEarlier}
                disabled={index === 0}
                onClick={() => move(item.id, orderedItems[index - 1]?.id || item.id)}
              >
                <MoveUp size={14} />
              </BoardButton>
              <BoardButton
                label={labels.moveLater}
                disabled={index === orderedItems.length - 1}
                onClick={() => move(item.id, orderedItems[index + 1]?.id || item.id)}
              >
                <MoveDown size={14} />
              </BoardButton>
              <BoardButton
                label={labels.makeNarrower}
                disabled={item.width <= 4}
                onClick={() => onChange(item.id, { width: Math.max(4, item.width - 4) })}
              >
                <Shrink size={14} />
              </BoardButton>
              <BoardButton
                label={labels.makeWider}
                disabled={item.width >= 12}
                onClick={() => onChange(item.id, { width: Math.min(12, item.width + 4) })}
              >
                <StretchHorizontal size={14} />
              </BoardButton>
              <BoardButton
                label={labels.makeShorter}
                disabled={item.height <= 1}
                onClick={() => onChange(item.id, { height: item.height - 1 })}
              >
                <PanelTop size={14} />
              </BoardButton>
              <BoardButton
                label={labels.makeTaller}
                disabled={item.height >= 4}
                onClick={() => onChange(item.id, { height: item.height + 1 })}
              >
                <PanelTop className="rotate-180" size={14} />
              </BoardButton>
            </div>
          ) : null}
          <div className={editing ? "pointer-events-none" : undefined}>{item.content}</div>
          {editing ? (
            <span className="sr-only">
              {labels.dragHint}: {item.title}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function BoardButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 shrink-0 place-items-center rounded text-slate-500 hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      {children}
    </button>
  );
}
