import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import type { TimetableLesson, TimetablePeriod } from "@moshaver/api-contract";
import { persianWeekdays } from "../lib/timetable-workbook";
const coordinates: KeyboardCoordinateGetter = (event, { context }) => {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) return;
  event.preventDefault();
  const current = context.over?.rect ?? context.collisionRect;
  if (!current) return;
  const center = { x: current.left + current.width / 2, y: current.top + current.height / 2 };
  const next = context.droppableContainers
    .getEnabled()
    .map((x) => x.rect.current)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((x) => ({ x: x.left + x.width / 2, y: x.top + x.height / 2 }))
    .filter((x) =>
      event.code === "ArrowLeft"
        ? x.x < center.x - 10 && Math.abs(x.y - center.y) < 40
        : event.code === "ArrowRight"
          ? x.x > center.x + 10 && Math.abs(x.y - center.y) < 40
          : event.code === "ArrowUp"
            ? x.y < center.y - 10 && Math.abs(x.x - center.x) < 80
            : x.y > center.y + 10 && Math.abs(x.x - center.x) < 80,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y),
    )[0];
  return next;
};
export function TimetableGrid({
  lessons,
  periods,
  editable,
  onEdit,
  onAdd,
  onMove,
}: {
  lessons: TimetableLesson[];
  periods: TimetablePeriod[];
  editable: boolean;
  onEdit: (lesson: TimetableLesson) => void;
  onAdd: (period: TimetablePeriod, weekday: number) => void;
  onMove: (lesson: TimetableLesson, period: TimetablePeriod, weekday: number) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: coordinates }),
  );
  const [active, setActive] = useState<TimetableLesson | null>(null);
  const valid = (period: TimetablePeriod, weekday: number) =>
    !active ||
    !lessons.some(
      (x) =>
        x.id !== active.id &&
        x.weekday === weekday &&
        x.startsOn <= active.endsOn &&
        x.endsOn >= active.startsOn &&
        x.startTime < period.endTime &&
        period.startTime < x.endTime &&
        (x.classroomId === active.classroomId ||
          (x.teacherId && x.teacherId === active.teacherId) ||
          (x.locationId && x.locationId === active.locationId)),
    );
  const finish = (event: DragEndEvent) => {
    setActive(null);
    if (!event.over) return;
    const lesson = lessons.find((x) => x.id === event.active.id);
    const [day, periodId] = String(event.over.id).split("|");
    const period = periods.find((x) => x.id === periodId);
    if (lesson && period && (lesson.weekday !== Number(day) || lesson.periodId !== periodId))
      onMove(lesson, period, Number(day));
  };
  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActive(lessons.find((x) => x.id === event.active.id) ?? null)}
      onDragEnd={finish}
      onDragCancel={() => setActive(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "برای جابجایی فاصله یا Enter، سپس کلیدهای جهت‌دار؛ برای لغو Escape. ویرایش درس نیز همیشه در دسترس است.",
        },
      }}
    >
      <div
        className="max-w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10"
        tabIndex={0}
        aria-label="جدول هفتگی؛ برای ستون‌ها پیمایش افقی کنید"
      >
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-[rgb(var(--surface-card))]">
            <tr>
              <th
                scope="col"
                className="sticky start-0 z-10 w-32 border-b bg-[rgb(var(--surface-card))] p-3 text-start"
              >
                زنگ / ساعت
              </th>
              {persianWeekdays.map((day) => (
                <th key={day.id} scope="col" className="border-b p-3 text-start">
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <th
                  scope="row"
                  className="sticky start-0 z-10 border-b bg-[rgb(var(--surface-card))] p-3 text-start font-medium"
                >
                  <span className="block">{period.name}</span>
                  <span className="mt-1 block text-xs text-slate-500" dir="ltr">
                    {period.startTime}–{period.endTime}
                  </span>
                </th>
                {persianWeekdays.map((day) => (
                  <TimetableCell
                    key={day.id}
                    period={period}
                    weekday={day.id}
                    valid={valid(period, day.id)}
                    active={!!active}
                    editable={editable}
                    onAdd={() => onAdd(period, day.id)}
                  >
                    {lessons
                      .filter((x) => x.periodId === period.id && x.weekday === day.id)
                      .map((lesson) => (
                        <DraggableLesson
                          key={lesson.id}
                          lesson={lesson}
                          editable={editable}
                          onEdit={() => onEdit(lesson)}
                        />
                      ))}
                  </TimetableCell>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
function TimetableCell({
  period,
  weekday,
  valid,
  active,
  editable,
  onAdd,
  children,
}: {
  period: TimetablePeriod;
  weekday: number;
  valid: boolean;
  active: boolean;
  editable: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${weekday}|${period.id}`,
    disabled: !editable,
  });
  return (
    <td
      ref={setNodeRef}
      className={`min-w-36 border-b border-s border-slate-200 p-2 align-top dark:border-white/10 ${active ? (valid ? "bg-emerald-50/40 dark:bg-emerald-950/20" : "bg-red-50/60 dark:bg-red-950/20") : ""} ${isOver ? "ring-2 ring-inset ring-brand" : ""}`}
    >
      <div className="grid min-h-20 gap-2">
        {children}
        {editable ? (
          <button
            type="button"
            className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-slate-500 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`افزودن درس ${persianWeekdays.find((x) => x.id === weekday)?.name} ${period.name}`}
            onClick={onAdd}
          >
            <Plus size={14} />
            افزودن
          </button>
        ) : null}
        {active && !valid ? (
          <span className="text-xs text-red-700 dark:text-red-300">تداخل احتمالی</span>
        ) : null}
      </div>
    </td>
  );
}
function DraggableLesson({
  lesson,
  editable,
  onEdit,
}: {
  lesson: TimetableLesson;
  editable: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: lesson.id, disabled: !editable });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`relative rounded-lg border border-brand/20 bg-[rgb(var(--surface-card))] p-2 ${isDragging ? "z-20 opacity-70 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="min-h-10 flex-1 text-start focus-visible:ring-2 focus-visible:ring-brand"
          onClick={onEdit}
        >
          <strong className="block text-sm">{lesson.title}</strong>
          <span className="block text-xs text-slate-500">{lesson.classroomName}</span>
        </button>
        {editable ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="grid size-10 touch-none place-items-center rounded-lg text-slate-400 focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`جابجایی ${lesson.title} ${lesson.classroomName}`}
          >
            <GripVertical size={16} />
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs">{lesson.teacherName || "استاد تعیین نشده"}</p>
      <p className="mt-1 text-xs text-slate-500">{lesson.locationName || "محل تعیین نشده"}</p>
      <p className="mt-1 text-xs" dir="ltr">
        {lesson.startTime}–{lesson.endTime}
      </p>
    </article>
  );
}
