import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock3,
  DoorOpen,
  LogIn,
  MapPin,
  ShieldAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../identity/auth";
import { api } from "../../../shared/api/api";
import { ResponsiveDrawer } from "../../../shared/ui/responsive-drawer";
import { Button, Card } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { StudentMovementTable } from "./StudentMovementTable";
import {
  confirmStudentInSchool,
  getStudentMovementHistory,
  getStudentMovements,
  movementHistoryId,
  resolveOverdueMovement,
  type MovementState,
  type StudentMovement,
} from "./api/student-movements.api";
import { recordDeparture, recordReturn } from "../exit-permissions/api/exit-permissions.api";

const labels: Record<MovementState, string> = {
  all: "همه",
  review: "نیازمند تصمیم",
  awaiting_departure: "خروج امروز",
  outside: "خارج از مدرسه",
  overdue: "بازگشت معوق",
  archive: "بایگانی",
};

const format = (value?: string | null) =>
  value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" }) : "—";

const movementEventLabel = (type: string) =>
  ({
    requested: "درخواست ثبت شد",
    approved: "درخواست تأیید شد",
    rejected: "درخواست رد شد",
    departure_recorded: "خروج فیزیکی ثبت شد",
    return_requested: "بازگشت درخواست شد",
    return_confirmed: "بازگشت تأیید شد",
    overdue_escalated: "بازگشت معوق پیگیری شد",
    outside_school_confirmed: "خارج‌بودن از مدرسه تأیید شد",
    breach_confirmed: "تخلف خروج ثبت شد",
  })[type] ?? type;

/** One operational surface; legacy routes supply a suggested initial filter. */
export function StudentMovementCenterPage({
  defaultState = "all",
}: {
  defaultState?: MovementState;
}) {
  const auth = useAuth();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const queryState = params.get("state") as MovementState | null;
  const state = queryState && labels[queryState] ? queryState : defaultState;
  const organizationId = auth.context?.activeOrganization?.id;
  const [selected, setSelected] = useState<StudentMovement | null>(null);
  const [note, setNote] = useState("");
  const movements = useQuery({
    queryKey: ["student-movements", organizationId, state],
    queryFn: () => getStudentMovements({ organizationId, state }),
    enabled: Boolean(organizationId),
  });
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["student-movements"] });
    void client.invalidateQueries({ queryKey: ["exit-permissions"] });
    void client.invalidateQueries({ queryKey: ["leave-requests"] });
    void client.invalidateQueries({ queryKey: ["attendance", "occupancy"] });
    void client.invalidateQueries({ queryKey: ["principal-dashboard"] });
  }, [client]);
  useEffect(() => {
    const events = api.openEvents((type, event) => {
      if (type === "student-movement.changed" && event.organizationId === organizationId)
        invalidate();
    });
    return () => events.close();
  }, [invalidate, organizationId]);

  const action = useMutation({
    mutationFn: async (input: {
      type:
        | "approve"
        | "reject"
        | "departure"
        | "return"
        | "returned"
        | "outside_school"
        | "breach"
        | "confirm_in_school";
      item: StudentMovement;
    }) => {
      const { item, type } = input;
      if (type === "approve" || type === "reject") {
        const path = item.leave
          ? `/leave-requests/${item.leave.id}`
          : item.exit
            ? `/exit-permissions/${item.exit.id}`
            : null;
        if (!path) throw new Error("درخواست تردد پیدا نشد.");
        return api.patch(path, {
          status: type === "approve" ? "APPROVED" : "REJECTED",
          note: note.trim() || undefined,
        });
      }
      if (!item.exit) throw new Error("رکورد حرکت پیدا نشد.");
      if (type === "departure") return recordDeparture(item.exit.id);
      if (type === "return") return recordReturn(item.exit.id);
      if (type === "confirm_in_school")
        return confirmStudentInSchool(item.exit.id, note.trim() || undefined);
      return resolveOverdueMovement(
        item.exit.id,
        type as "returned" | "outside_school" | "breach",
        note.trim() || undefined,
      );
    },
    onSuccess: () => {
      notify("وضعیت تردد دانش‌آموز ذخیره شد.", "success");
      setNote("");
      setSelected(null);
      invalidate();
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "عملیات انجام نشد.", "error"),
  });

  const visible = useMemo(() => {
    return (movements.data?.items ?? []).filter((item) => state === "all" || item.state === state);
  }, [movements.data?.items, state]);
  const selectState = (next: MovementState) => {
    const nextParams = new URLSearchParams(params);
    if (next === "all") nextParams.delete("state");
    else nextParams.set("state", next);
    setParams(nextParams, { replace: true });
  };

  const counts = movements.data?.counts;
  return (
    <section
      dir="rtl"
      className="mx-auto grid w-full max-w-7xl gap-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8"
    >
      <header className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-sm sm:p-6">
        <p className="text-xs font-black text-brand">مرکز عملیات دانش‌آموز</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-ink">تردد و مرخصی</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              تأیید غیبت، خروج فیزیکی، بازگشت و پیگیری بازگشت‌های معوق در یک جریان.
            </p>
          </div>
          <Button variant="soft" onClick={() => void movements.refetch()}>
            به‌روزرسانی
          </Button>
        </div>
      </header>

      <section
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="شمارنده عملیات تردد"
      >
        <Metric
          icon={Clock3}
          label="مرخصی‌های مدیر"
          value={counts?.pendingLongLeaves ?? 0}
          onClick={() => selectState("review")}
        />
        <Metric
          icon={DoorOpen}
          label="خروج‌های کوتاه"
          value={counts?.pendingShortExits ?? 0}
          onClick={() => selectState("review")}
        />
        <Metric
          icon={MapPin}
          label="آمادهٔ خروج"
          value={counts?.awaitingDeparture ?? 0}
          onClick={() => selectState("awaiting_departure")}
        />
        <Metric
          icon={ShieldAlert}
          label="خارج از مدرسه"
          value={counts?.currentlyOutside ?? 0}
          onClick={() => selectState("outside")}
        />
        <Metric
          icon={AlertTriangle}
          label="بازگشت معوق"
          value={counts?.overdueReturns ?? 0}
          attention
          onClick={() => selectState("overdue")}
        />
      </section>

      <Card className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="فیلتر تردد">
          {(Object.keys(labels) as MovementState[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={state === key ? "primary" : "ghost"}
              onClick={() => selectState(key)}
            >
              {labels[key]}
            </Button>
          ))}
        </div>
      </Card>

      <StudentMovementTable
        items={visible}
        loading={movements.isLoading}
        error={movements.isError}
        busy={action.isPending}
        canManageLeave={auth.can("leave.manage")}
        canManageExit={auth.can("exit.manage")}
        canResolveMovement={auth.can("student.movement.resolve")}
        preferenceKey={`student-movements:${organizationId ?? "none"}`}
        onRefresh={() => void movements.refetch()}
        onOpenDetails={setSelected}
        onAction={(type, item) => action.mutate({ type, item })}
      />

      <ResponsiveDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title="جزئیات تردد دانش‌آموز"
        description="وضعیت‌ها به ترتیب ثبت و تنها با اقدام مجاز نقش فعال تغییر می‌کنند."
        desktopSide="left"
      >
        {selected ? (
          <MovementDrawer
            item={selected}
            note={note}
            setNote={setNote}
            canManageLeave={auth.can("leave.manage")}
            canManageExit={auth.can("exit.manage")}
            canResolveMovement={auth.can("student.movement.resolve")}
            busy={action.isPending}
            organizationId={organizationId}
            onAction={(type) => action.mutate({ type, item: selected })}
          />
        ) : null}
      </ResponsiveDrawer>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  onClick,
  attention = false,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  onClick: () => void;
  attention?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-24 rounded-2xl border p-3 text-right transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${attention && value ? "border-danger/50 bg-danger/10" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]"}`}
    >
      <Icon size={18} className="text-brand" aria-hidden="true" />
      <b className="mt-2 block text-2xl text-ink">{value.toLocaleString("fa-IR")}</b>
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </button>
  );
}

function MovementDrawer({
  item,
  note,
  setNote,
  canManageLeave,
  canManageExit,
  canResolveMovement,
  busy,
  organizationId,
  onAction,
}: {
  item: StudentMovement;
  note: string;
  setNote: (value: string) => void;
  canManageLeave: boolean;
  canManageExit: boolean;
  canResolveMovement: boolean;
  busy: boolean;
  organizationId?: string;
  onAction: (
    type:
      | "approve"
      | "reject"
      | "departure"
      | "return"
      | "returned"
      | "outside_school"
      | "breach"
      | "confirm_in_school",
  ) => void;
}) {
  const student = item.leave?.studentName ?? item.exit?.studentName ?? "دانش‌آموز";
  const reason = item.leave?.reason ?? item.exit?.reason ?? "";
  const isReview = item.state === "review";
  const canReview = item.leave ? canManageLeave : canManageExit;
  const historyId = movementHistoryId(item);
  const history = useQuery({
    queryKey: ["student-movement-history", organizationId, item.kind, historyId],
    queryFn: () => getStudentMovementHistory(item.kind, historyId ?? "", organizationId),
    enabled: Boolean(historyId),
  });
  return (
    <div className="grid gap-4" dir="rtl">
      <Card className="grid gap-2 p-4">
        <strong className="text-xl text-ink">{student}</strong>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span>درخواست: {format(item.leave?.createdAt ?? item.exit?.createdAt)}</span>
          <span>خروج: {format(item.exit?.actualDepartureAt ?? item.leave?.startDate)}</span>
          <span>
            بازگشت:{" "}
            {format(
              item.exit?.actualReturnAt ?? item.exit?.expectedReturnAt ?? item.leave?.endDate,
            )}
          </span>
          <span>
            منبع: {item.exit?.origin === "dorm_unauthorized" ? "خوابگاه" : "درخواست دانش‌آموز"}
          </span>
        </div>
        {item.leave ? (
          <p className="text-xs font-bold text-brand">
            وعدهٔ روز خروج: {item.leave.includesLunch ? "ناهار" : ""}
            {item.leave.includesLunch && item.leave.includesDinner ? " و " : ""}
            {item.leave.includesDinner ? "شام" : "هیچ‌کدام"}
          </p>
        ) : null}
      </Card>
      <section aria-label="تاریخچهٔ تغییرات" className="grid gap-2">
        <h2 className="text-sm font-black text-ink">تاریخچهٔ ثبت‌شده</h2>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">در حال دریافت تاریخچه…</p>
        ) : null}
        {history.isError ? <p className="text-sm text-danger">دریافت تاریخچه انجام نشد.</p> : null}
        {history.data?.length ? (
          <ol className="grid gap-2 text-sm">
            {history.data.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[rgb(var(--border-subtle))] p-2"
              >
                <b className="block text-ink">{movementEventLabel(event.type)}</b>
                <span className="text-xs text-muted-foreground">
                  {format(event.createdAt)}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                </span>
                {event.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : history.isSuccess ? (
          <p className="text-sm text-muted-foreground">رویدادی ثبت نشده است.</p>
        ) : null}
      </section>
      {canManageLeave || canManageExit || canResolveMovement ? (
        <>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            یادداشت عملیات
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-20 rounded-xl border border-[rgb(var(--border-subtle))] bg-transparent p-2 font-normal"
              placeholder="یادداشت اختیاری یا نتیجهٔ پیگیری…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {isReview && canReview ? (
              <>
                <Button loading={busy} onClick={() => onAction("approve")}>
                  <Check size={16} /> تأیید
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => onAction("reject")}>
                  <X size={16} /> رد
                </Button>
              </>
            ) : null}
            {item.state === "awaiting_departure" && canManageExit ? (
              <Button loading={busy} onClick={() => onAction("departure")}>
                <DoorOpen size={16} /> ثبت خروج فیزیکی
              </Button>
            ) : null}
            {item.state === "outside" && item.exit?.returnRequestedAt && canManageExit ? (
              <Button loading={busy} onClick={() => onAction("return")}>
                <LogIn size={16} /> تأیید بازگشت
              </Button>
            ) : null}
            {canResolveMovement && item.exit?.actualDepartureAt && !item.exit.actualReturnAt ? (
              <Button loading={busy} onClick={() => onAction("confirm_in_school")}>
                <Check size={16} /> تأیید حضور در مدرسه
              </Button>
            ) : null}
            {item.state === "overdue" && canResolveMovement ? (
              <>
                <Button loading={busy} onClick={() => onAction("returned")}>
                  <LogIn size={16} /> بازگشته است
                </Button>
                <Button variant="soft" disabled={busy} onClick={() => onAction("outside_school")}>
                  تأیید خارج از مدرسه
                </Button>
                <Button variant="danger" disabled={busy} onClick={() => onAction("breach")}>
                  ثبت تخلف خروج
                </Button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
