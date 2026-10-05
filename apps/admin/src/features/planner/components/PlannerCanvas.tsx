import { useEffect, useRef, useState, type DragEvent, type MutableRefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  FileText,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Plan, PlanTask } from "../../../shared/types/domain";
import { useLocale } from "../../../shared/ui/locale";
import { Badge } from "../../../shared/ui/ui";
import { ViewportPopover } from "../../../shared/ui/popover";
import { fa, todayIso } from "../../../shared/lib/utils";
import type { PlannerMode } from "../model/planner.types";
import { plannerCopy, plannerTaskTypeLabel } from "../model/planner-copy";
import {
  addMinutes,
  DEFAULT_TIMELINE_CONFIG,
  durationToHeight,
  dateRange,
  getTimelineRange,
  isTaskComplete,
  minutesBetween,
  monthCells,
  parseDraggedTask,
  timeToPosition,
  minutesToTime,
} from "../lib/planner-model";

export type CanvasProps = {
  readOnly?: boolean;
  mode: PlannerMode;
  date: string;
  range: { from: string; to: string };
  plans: Plan[];
  loading: boolean;
  onSelectDay: (date: string) => void;
  onCreate: (date: string) => void;
  onQuickAdd: (date: string, start?: string) => void;
  onEditTask: (plan: Plan, task: PlanTask) => void;
  onDeleteTask: (task: PlanTask) => void;
  onDuplicateTask: (plan: Plan, task: PlanTask) => void;
  onEditPlan: (plan: Plan) => void;
  onDuplicatePlan: (plan: Plan) => void;
  onDeletePlan: (plan: Plan) => void;
  onMoveTask: (taskId: string, planDate: string, start: string, end: string) => void;
};
export function PlannerCanvas(props: CanvasProps) {
  const { formatDate, language, profile } = useLocale();
  const copy = plannerCopy(language);
  const isRtl = profile.direction === "rtl";
  const [zoom, setZoom] = useState<"4h" | "2h" | "1h" | "30m">("1h");
  const activeDrag = useRef("");
  const activeDrop = useRef<{ day: string; start: string } | null>(null);
  const map = new Map(props.plans.map((p) => [p.planDate, p]));
  if (props.loading) return <PlannerSkeleton />;
  if (props.mode === "list")
    return (
      <VirtualList
        plans={props.plans}
        onEdit={props.readOnly ? undefined : props.onEditTask}
        onMove={props.readOnly ? undefined : props.onMoveTask}
      />
    );
  if (props.mode === "month")
    return (
      <div className="h-full overflow-auto overscroll-contain">
        <div className="grid min-h-full grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4 xl:grid-cols-7">
          {monthCells(props.range.from, props.range.to).map((day, index) =>
            day ? (
              <button
                key={day}
                className={`min-h-24 bg-white p-2 text-start hover:bg-indigo-50 ${day === todayIso() ? "ring-2 ring-inset ring-brand" : ""}`}
                onClick={() => props.onSelectDay(day)}
                onDragOver={(event) => !props.readOnly && event.preventDefault()}
                onDrop={(event) => {
                  if (props.readOnly) return;
                  event.preventDefault();
                  const data = parseDraggedTask(
                    event.dataTransfer.getData("application/x-moshaver-task"),
                  );
                  if (!data) return;
                  props.onMoveTask(data.id, day, data.start, data.end);
                }}
              >
                <strong className="text-xs">
                  {formatDate(day, {
                    day: "numeric",
                    month: "short",
                    year: undefined,
                  })}
                </strong>
                <span className="mt-2 block text-xs text-slate-500">
                  {fa(map.get(day)?.tasks.length || 0)} {copy.activities}
                </span>
                {map
                  .get(day)
                  ?.tasks.slice(0, 2)
                  .map((t) => (
                    <small
                      key={t.id}
                      draggable={!props.readOnly}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(
                          "application/x-moshaver-task",
                          JSON.stringify({ id: t.id, start: t.start, end: t.end }),
                        );
                      }}
                      className="mt-1 block truncate rounded bg-slate-100 px-1"
                    >
                      {t.start} {t.title || t.subject}
                    </small>
                  ))}
              </button>
            ) : (
              <div key={`empty-${index}`} className="bg-slate-50" />
            ),
          )}
        </div>
      </div>
    );
  const days =
    props.mode === "day" ? [props.date] : dateRange(props.range.from, props.range.to).reverse();
  // A compact all-day canvas avoids making the Planner page itself scroll.
  const slotMinutes = { "4h": 240, "2h": 120, "1h": 60, "30m": 30 }[zoom];
  const timelineRange = getTimelineRange(
    props.plans.flatMap((plan) => plan.tasks),
    DEFAULT_TIMELINE_CONFIG,
  );
  const timelineSlots = zoomSlots(timelineRange.start, timelineRange.end, slotMinutes);
  const slotHeight = Math.max(18, Math.floor(620 / Math.max(1, timelineSlots.length - 1)));
  const timelineHeight = (timelineSlots.length - 1) * slotHeight;
  return (
    <div className="h-full overflow-hidden">
      <div
        dir={profile.direction}
        className={
          props.mode === "day"
            ? isRtl
              ? "grid min-h-full grid-cols-[minmax(0,1fr)_42px]"
              : "grid min-h-full grid-cols-[42px_minmax(0,1fr)]"
            : isRtl
              ? "grid min-h-full grid-cols-[repeat(7,minmax(0,1fr))_42px]"
              : "grid min-h-full grid-cols-[42px_repeat(7,minmax(0,1fr))]"
        }
      >
        {!isRtl ? (
          <SharedTimeRuler
            language={language}
            slots={timelineSlots}
            height={timelineHeight}
            slotHeight={slotHeight}
            zoom={zoom}
            onZoom={setZoom}
            onCreate={(start) => props.onQuickAdd(props.date, start)}
            disabled={props.readOnly}
          />
        ) : null}
        {days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            plan={map.get(day)}
            formatDate={formatDate}
            actions={props}
            activeDrag={activeDrag}
            activeDrop={activeDrop}
            range={timelineRange}
            timelineHeight={timelineHeight}
            slotHeight={slotHeight}
            slotMinutes={slotMinutes}
            zoom={zoom}
            language={language}
          />
        ))}
        {isRtl ? (
          <SharedTimeRuler
            language={language}
            slots={timelineSlots}
            height={timelineHeight}
            slotHeight={slotHeight}
            zoom={zoom}
            onZoom={setZoom}
            onCreate={(start) => props.onQuickAdd(props.date, start)}
            disabled={props.readOnly}
          />
        ) : null}
      </div>
    </div>
  );
}
function DayColumn({
  day,
  plan,
  formatDate,
  actions,
  activeDrag,
  activeDrop,
  range,
  timelineHeight,
  slotHeight,
  slotMinutes,
  zoom,
  language,
}: {
  day: string;
  plan?: Plan;
  formatDate: (value?: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  actions: CanvasProps;
  activeDrag: MutableRefObject<string>;
  activeDrop: MutableRefObject<{ day: string; start: string } | null>;
  range: { start: number; end: number };
  timelineHeight: number;
  slotHeight: number;
  slotMinutes: number;
  zoom: "4h" | "2h" | "1h" | "30m";
  language: "fa" | "en";
}) {
  const copy = plannerCopy(language);
  const config = DEFAULT_TIMELINE_CONFIG;
  const timelineSlots = zoomSlots(range.start, range.end, slotMinutes);
  function drop(event: DragEvent, targetStart?: string) {
    event.preventDefault();
    event.stopPropagation();
    const data = parseDraggedTask(
      event.dataTransfer.getData("application/x-moshaver-task") || activeDrag.current,
    );
    if (!data) return;
    activeDrop.current = null;
    const duration = Math.max(15, minutesBetween(data.start, data.end));
    const start = targetStart || data.start;
    actions.onMoveTask(data.id, day, start, addMinutes(start, duration));
  }
  return (
    <section
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => drop(e)}
      className="min-w-0 border-s border-slate-200 bg-slate-50/40 xl:min-h-full"
      dir={language === "fa" ? "rtl" : "ltr"}
    >
      <header
        className={`sticky top-0 z-10 border-b border-slate-200 px-1.5 py-1 ${day === todayIso() ? "bg-indigo-50" : "bg-white"}`}
      >
        <div className="flex items-start gap-1">
          <button className="min-w-0 flex-1 text-start" onClick={() => actions.onSelectDay(day)}>
            <strong className="block truncate text-xs">
              {formatDate(day, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: undefined,
              })}
            </strong>
            <span className="text-[10px] text-slate-400">
              {fa(plan?.tasks.length || 0)} {copy.activities}
              {plan ? ` · ${plan.published ? copy.published : copy.draft}` : ""}
            </span>
          </button>
          {plan && !actions.readOnly ? (
            <div className="flex shrink-0 opacity-70 transition hover:opacity-100">
              <button
                className="rounded p-1 hover:bg-slate-100"
                aria-label={copy.editPlan}
                onClick={() => actions.onEditPlan(plan)}
              >
                <Pencil size={12} />
              </button>
              <button
                className="rounded p-1 hover:bg-slate-100"
                aria-label={copy.copyPlan}
                onClick={() => actions.onDuplicatePlan(plan)}
              >
                <Copy size={12} />
              </button>
              <button
                className="rounded p-1 text-rose-600 hover:bg-rose-50"
                aria-label={copy.deletePlan}
                onClick={() => actions.onDeletePlan(plan)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className="p-1">
        <div
          dir="ltr"
          className="relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          style={{ height: timelineHeight }}
        >
          <div dir={language === "fa" ? "rtl" : "ltr"} className="relative">
            {timelineSlots.slice(0, -1).map((start, index) => (
              <button
                type="button"
                key={start}
                data-planner-drop-date={day}
                data-planner-drop-time={start}
                aria-label={copy.createActivityAt.replace("{time}", start)}
                className="after:pointer-events-none after:absolute after:end-0 after:top-0 after:w-3 after:border-t-2 after:border-dashed after:border-indigo-300/70 absolute inset-x-0 border-t border-dashed border-slate-300/90 text-transparent hover:bg-indigo-50/70 dark:border-slate-600 dark:after:border-indigo-500/70 dark:hover:bg-indigo-950/30"
                style={{ top: index * slotHeight, height: slotHeight }}
                disabled={actions.readOnly}
                onClick={() => actions.onQuickAdd(day, start)}
                onDragEnter={(event) => {
                  if (!actions.readOnly) {
                    activeDrop.current = { day, start };
                    event.preventDefault();
                  }
                }}
                onDragOver={(event) => {
                  if (!actions.readOnly) {
                    activeDrop.current = { day, start };
                    event.preventDefault();
                  }
                }}
                onDrop={(event) => !actions.readOnly && drop(event, start)}
              />
            ))}
            {(plan?.tasks || []).map((task) => {
              const fallbackTime = minutesToTime(range.start);
              const top = Math.max(
                0,
                timeToPosition(task.start || fallbackTime, range.start, slotHeight, slotMinutes),
              );
              const height = durationToHeight(
                task.start || fallbackTime,
                task.end || task.start || fallbackTime,
                slotHeight,
                slotMinutes,
              );
              const presentation =
                height < 24
                  ? "tiny"
                  : height < 52
                    ? "compact"
                    : height < 96
                      ? "standard"
                      : "detail";
              const overlaps = (plan?.tasks || [])
                .filter(
                  (other) =>
                    (task.start || "") < (other.end || "") &&
                    (other.start || "") < (task.end || ""),
                )
                .sort((a, b) => a.id.localeCompare(b.id));
              const lane = Math.max(
                0,
                overlaps.findIndex((other) => other.id === task.id),
              );
              return plan ? (
                <div
                  key={task.id}
                  className="absolute"
                  style={{
                    top: Math.max(0, top),
                    height,
                    width: `calc(${100 / overlaps.length}% - 4px)`,
                    insetInlineStart: `calc(${(lane * 100) / overlaps.length}% + 2px)`,
                  }}
                >
                  <CompactTask
                    language={language}
                    task={task}
                    plan={plan}
                    zoom={zoom}
                    presentation={presentation}
                    onEdit={actions.onEditTask}
                    onDelete={actions.onDeleteTask}
                    onDuplicate={actions.onDuplicateTask}
                    onDragPayload={(payload) => {
                      activeDrag.current = payload;
                    }}
                    onDragFinish={() => {
                      const target = activeDrop.current;
                      const data = parseDraggedTask(activeDrag.current);
                      if (!target || !data) return;
                      activeDrop.current = null;
                      const duration = Math.max(15, minutesBetween(data.start, data.end));
                      actions.onMoveTask(
                        data.id,
                        target.day,
                        target.start,
                        addMinutes(target.start, duration),
                      );
                    }}
                    readOnly={actions.readOnly}
                  />
                </div>
              ) : null;
            })}
          </div>
          {!plan?.tasks.length ? (
            <div
              dir={language === "fa" ? "rtl" : "ltr"}
              className="pointer-events-none absolute inset-0 z-[5] grid place-items-center bg-indigo-50/90 p-3 text-center backdrop-blur-[1px] dark:bg-indigo-950/80"
            >
              <div className="grid max-w-52 gap-2">
                <div>
                  <strong className="block text-xs text-slate-800 dark:text-slate-100">
                    {copy.noActivityToday}
                  </strong>
                  <p className="mt-1 text-[11px] text-slate-500">{copy.noActivityTodayHelp}</p>
                </div>
                {!actions.readOnly ? (
                  <div className="pointer-events-auto flex flex-wrap justify-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1.5 text-xs font-bold text-white hover:bg-brand/90"
                      onClick={() => actions.onQuickAdd(day, "08:00")}
                    >
                      <Plus size={13} /> {copy.startPlanning}
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1.5 text-xs font-bold text-brand hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                      onClick={() => (plan ? actions.onEditPlan(plan) : actions.onCreate(day))}
                    >
                      {copy.daySettings}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SharedTimeRuler({
  language,
  slots,
  height,
  slotHeight,
  zoom,
  onZoom,
  onCreate,
  disabled,
}: {
  language: "fa" | "en";
  slots: string[];
  height: number;
  slotHeight: number;
  zoom: "4h" | "2h" | "1h" | "30m";
  onZoom: (zoom: "4h" | "2h" | "1h" | "30m") => void;
  onCreate: (start: string) => void;
  disabled?: boolean;
}) {
  const copy = plannerCopy(language);
  const levels: Array<typeof zoom> = ["4h", "2h", "1h", "30m"];
  const index = levels.indexOf(zoom);
  return (
    <aside
      aria-label={copy.sharedTimeRuler}
      className="sticky top-0 z-20 border-e border-slate-200 bg-slate-50/95 dark:border-slate-700 dark:bg-slate-800/95"
    >
      <div className="flex h-[53px] flex-col items-center justify-center gap-0.5 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          aria-label={copy.moreTimeDetail}
          disabled={index === levels.length - 1}
          onClick={() => onZoom(levels[index + 1])}
          className="text-xs text-brand disabled:text-slate-300"
        >
          +
        </button>
        <span className="text-[8px] text-slate-500">{zoom}</span>
        <button
          type="button"
          aria-label={copy.lessTimeDetail}
          disabled={index === 0}
          onClick={() => onZoom(levels[index - 1])}
          className="text-xs text-brand disabled:text-slate-300"
        >
          −
        </button>
      </div>
      <div className="relative" style={{ height }} dir="ltr">
        {slots.slice(0, -1).map((start, index) => (
          <button
            type="button"
            key={start}
            aria-label={copy.createActivityAtTime.replace("{time}", start)}
            disabled={disabled}
            onClick={() => onCreate(start)}
            className={`absolute inset-x-0 -translate-y-1/2 px-1 text-center font-mono text-slate-400 hover:bg-indigo-100 hover:text-brand disabled:cursor-default ${zoom === "30m" ? "text-[9px]" : "text-[10px]"}`}
            style={{ top: index * slotHeight }}
          >
            {start}
          </button>
        ))}
      </div>
    </aside>
  );
}

function zoomSlots(start: number, end: number, interval: number) {
  const slots: string[] = [];
  for (let minute = start; minute < end; minute += interval) slots.push(minutesToTime(minute));
  slots.push(minutesToTime(end));
  return slots;
}

function CompactTask({
  language,
  task,
  plan,
  onEdit,
  onDelete,
  onDuplicate,
  onDragPayload,
  onDragFinish,
  zoom,
  presentation,
  readOnly = false,
}: {
  language: "fa" | "en";
  task: PlanTask;
  plan: Plan;
  onEdit: (plan: Plan, task: PlanTask) => void;
  onDelete: (task: PlanTask) => void;
  onDuplicate: (plan: Plan, task: PlanTask) => void;
  onDragPayload?: (payload: string) => void;
  onDragFinish?: () => void;
  zoom: "4h" | "2h" | "1h" | "30m";
  presentation: "tiny" | "compact" | "standard" | "detail";
  readOnly?: boolean;
}) {
  const copy = plannerCopy(language);
  const completed = isTaskComplete(task);

  const overdue = !completed && task.end && new Date(`${task.end}T23:59:59`) < new Date();

  const priority = task.type === "exam" ? "high" : task.type === "test" ? "medium" : "normal";

  return (
    <button
      data-planner-task-id={task.id}
      draggable={!readOnly}
      disabled={readOnly}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";

        const payload = JSON.stringify({
          id: task.id,
          start: task.start,
          end: task.end,
        });
        e.dataTransfer.setData("application/x-moshaver-task", payload);
        onDragPayload?.(payload);
      }}
      onDragEnd={() => onDragFinish?.()}
      onClick={() => !readOnly && onEdit(plan, task)}
      className={[
        `group relative h-full min-w-0 overflow-hidden border text-start ${presentation === "tiny" ? "rounded-sm px-0.5 py-0" : zoom === "4h" ? "rounded-md p-1" : zoom === "30m" ? "rounded-xl p-2.5 shadow-sm" : "rounded-lg p-2"}`,
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-brand/40",

        completed
          ? [
              "border-emerald-300",
              "bg-emerald-50",
              "dark:border-emerald-700",
              "dark:bg-emerald-950/30",
            ]
          : overdue
            ? ["border-red-300", "bg-red-50", "dark:border-red-700", "dark:bg-red-950/30"]
            : ["border-slate-200", "bg-white", "dark:border-slate-700", "dark:bg-slate-900"],
      ].join(" ")}
      data-task-presentation={presentation}
    >
      {/* top row */}
      <div
        className={`flex items-center justify-between gap-1 ${presentation === "tiny" ? "justify-center" : ""}`}
      >
        <div className="flex items-center gap-1">
          {presentation !== "tiny" ? (
            <GripVertical
              size={12}
              className="
              opacity-0
              transition
              group-hover:opacity-60
              text-slate-400
            "
            />
          ) : null}

          {presentation !== "tiny" ? (
            <Clock3 size={11} className={completed ? "text-emerald-600" : "text-slate-400"} />
          ) : null}

          <span
            dir="ltr"
            className="
              font-mono
              text-[10px]
              text-slate-400
            "
          >
            {task.start}
          </span>
        </div>

        {presentation !== "tiny" ? (
          <div className="flex items-center gap-1">
            {overdue && <AlertTriangle size={12} className="text-red-500" />}

            {completed && (
              <CheckCircle2
                size={13}
                className="
                text-emerald-600
                animate-in
                zoom-in
              "
              />
            )}
          </div>
        ) : null}
      </div>

      {/* title */}
      {!readOnly && presentation !== "tiny" ? (
        <div
          className="
          mt-1
          flex
          items-center
          gap-1
        "
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              priority === "high"
                ? "bg-red-500"
                : priority === "medium"
                  ? "bg-amber-500"
                  : "bg-slate-400",
            ].join(" ")}
          />

          <strong
            title={task.title || task.subject}
            className={[
              "truncate text-[11px]",
              completed ? "text-emerald-800 line-through" : "text-slate-800 dark:text-slate-100",
            ].join(" ")}
          >
            {task.title || task.subject || plannerTaskTypeLabel(task.type, language)}
          </strong>
        </div>
      ) : null}

      {/* status */}
      {presentation === "standard" || presentation === "detail" ? (
        <div className="mt-1 flex items-center justify-between">
          <span
            className={[
              "rounded-full px-1.5 py-0.5 text-[9px]",
              completed
                ? "bg-emerald-100 text-emerald-700"
                : overdue
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {completed ? `✓ ${copy.completed}` : overdue ? copy.overdue : copy.planned}
          </span>

          <span className="text-[9px] text-slate-400">
            {task.duration ? `${task.duration} ${copy.minutes}` : ""}
          </span>
        </div>
      ) : null}

      {/* hover actions */}
      {presentation !== "tiny" ? (
        <div
          className="
          absolute
          start-1
          top-1
          flex
          gap-1
          opacity-0
          transition
          group-hover:opacity-100
        "
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              onEdit(plan, task);
            }}
            className="
            rounded
            bg-white
            p-1
            shadow
            hover:bg-slate-100
          "
          >
            <Edit3 size={11} />
          </span>

          <ViewportPopover
            width={160}
            align="end"
            className="p-1"
            trigger={(props) => (
              <button
                {...props}
                type="button"
                aria-label={copy.taskMenu.replace("{title}", task.title || copy.activity)}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onClick?.();
                }}
                className="rounded bg-white p-1 shadow hover:bg-slate-100"
              >
                <MoreHorizontal size={11} />
              </button>
            )}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-start text-xs hover:bg-slate-100"
              onClick={(event) => {
                event.stopPropagation();
                onDuplicate(plan, task);
              }}
            >
              <Copy size={14} />
              {copy.duplicateInThirtyMinutes}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-start text-xs text-rose-700 hover:bg-rose-50"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(task);
              }}
            >
              <Trash2 size={14} />
              {copy.deleteActivity}
            </button>
          </ViewportPopover>
        </div>
      ) : null}

      {/* expandable info */}
      {presentation === "detail" ? (
        <div
          className="
          grid
          max-h-0
          overflow-hidden
          text-[10px]
          text-slate-500
          opacity-0
          transition-all
          group-hover:
          mt-1
          group-hover:
          group-hover:
        "
        >
          <div className="flex items-center gap-1">
            <FileText size={10} />
            {task.subject}
          </div>

          {task.note && <div className="truncate">{task.note}</div>}
        </div>
      ) : null}
    </button>
  );
}

function VirtualList({
  plans,
  onEdit,
  onMove,
}: {
  plans: Plan[];
  onEdit?: (plan: Plan, task: PlanTask) => void;
  onMove?: (taskId: string, planDate: string, start: string, end: string) => void;
}) {
  const { language } = useLocale();
  const tasks = plans.flatMap((plan) => plan.tasks.map((task) => ({ plan, task })));
  const [start, setStart] = useState(0);
  useEffect(() => setStart((c) => Math.min(c, Math.max(0, tasks.length - 1))), [tasks.length]);
  const row = 58,
    visible = 14;
  return (
    <div
      className="h-full overflow-auto"
      onScroll={(e) => setStart(Math.floor(e.currentTarget.scrollTop / row))}
    >
      <div style={{ height: tasks.length * row, position: "relative" }}>
        {tasks.slice(start, start + visible + 4).map(({ plan, task }, index) => (
          <button
            key={task.id}
            draggable={Boolean(onMove)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "application/x-moshaver-task",
                JSON.stringify({ id: task.id, start: task.start, end: task.end }),
              );
            }}
            onDragOver={(event) => onMove && event.preventDefault()}
            onDrop={(event) => {
              if (!onMove) return;
              event.preventDefault();
              const data = parseDraggedTask(
                event.dataTransfer.getData("application/x-moshaver-task"),
              );
              if (!data || data.id === task.id) return;
              const duration = Math.max(15, minutesBetween(data.start, data.end));
              const targetStart = task.start || "00:00";
              onMove(data.id, plan.planDate, targetStart, addMinutes(targetStart, duration));
            }}
            onClick={() => onEdit?.(plan, task)}
            className="absolute start-0 grid w-full grid-cols-[80px_72px_minmax(0,1fr)] items-center gap-2 border-b border-slate-100 px-3 text-start hover:bg-slate-50 sm:grid-cols-[110px_90px_minmax(0,1fr)_auto] sm:gap-3 sm:px-4"
            style={{ height: row, top: (start + index) * row }}
          >
            <span className="text-xs text-slate-500">{plan.planDate}</span>
            <span className="font-mono text-xs" dir="ltr">
              {task.start}–{task.end}
            </span>
            <strong className="truncate text-sm">
              {task.subject ? `${task.subject} — ` : ""}
              {task.title || plannerTaskTypeLabel(task.type, language)}
            </strong>
            <span className="hidden sm:inline-flex">
              <Badge>{plannerTaskTypeLabel(task.type, language)}</Badge>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
function PlannerSkeleton() {
  return (
    <div className="grid h-full grid-cols-7 gap-px bg-slate-200">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <div key={day} className="bg-white p-2">
          <div className="h-8 animate-pulse rounded bg-slate-100" />
          {[1, 2, 3].map((x) => (
            <div key={x} className="mt-2 h-16 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}
