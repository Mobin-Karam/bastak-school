import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { DashboardCalendar } from "../../../analytics/dashboard/components/DashboardCalendar";
import { todayIso } from "../../../../shared/lib/utils";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { useLocale } from "../../../../shared/ui/locale";
import { notify } from "../../../../shared/ui/notifications";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Textarea,
} from "../../../../shared/ui/ui";
import {
  createStudentLeaveRequest,
  listStudentLeaveRequests,
  type StudentLeaveStatus,
  type StudentLeaveType,
} from "../api/student-leave.api";

const requestTypes: ReadonlyArray<{
  id: StudentLeaveType;
  title: string;
  description: string;
  approver: string;
  icon: typeof DoorOpen;
  accent: string;
}> = [
  {
    id: "SCHOOL_EXIT",
    title: "خروج از مدرسه",
    description: "برای خروج موقت از محوطه مدرسه",
    approver: "ارسال برای ناظم مدرسه",
    icon: DoorOpen,
    accent:
      "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100",
  },
  {
    id: "LEAVE",
    title: "درخواست مرخصی",
    description: "برای غیبت یک‌روزه یا چندروزه",
    approver: "ارسال برای مدیر مدرسه",
    icon: CalendarDays,
    accent:
      "border-teal-300 bg-teal-50 text-teal-950 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-100",
  },
];

const statusMeta: Record<
  StudentLeaveStatus,
  { label: string; tone: "amber" | "green" | "red" | "blue" | "neutral" }
> = {
  PENDING: { label: "در انتظار بررسی", tone: "amber" },
  APPROVED: { label: "تأیید شده", tone: "green" },
  REJECTED: { label: "رد شده", tone: "red" },
  CANCELLED: { label: "لغو شده", tone: "neutral" },
  COMPLETED: { label: "تکمیل شده", tone: "blue" },
};

/** Mobile-first student request flow with server-owned reviewer routing. */
export function StudentLeaveRequestsPage() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const client = useQueryClient();
  const organizationId =
    auth.context?.activeOrganization?.id ??
    auth.context?.availableOrganizations[0]?.id ??
    auth.context?.memberships[0]?.id ??
    "";
  const [draft, setDraft] = useState({
    leaveType: "SCHOOL_EXIT" as StudentLeaveType,
    startDate: todayIso(),
    endDate: todayIso(),
    startTime: "08:00",
    endTime: "18:00",
    includesLunch: false,
    includesDinner: false,
    reason: "",
    note: "",
  });
  const selectedType = requestTypes.find((type) => type.id === draft.leaveType) ?? requestTypes[0];
  const requests = useQuery({
    queryKey: ["student", "leave-requests"],
    queryFn: listStudentLeaveRequests,
  });
  const create = useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("مدرسه فعال مشخص نیست.");
      const { startTime, endTime, ...leaveDraft } = draft;
      return createStudentLeaveRequest({
        organizationId,
        ...leaveDraft,
        startDate: `${draft.startDate}T${startTime}:00`,
        endDate: `${draft.endDate}T${endTime}:00`,
      });
    },
    onSuccess: () => {
      setDraft({
        leaveType: draft.leaveType,
        startDate: todayIso(),
        endDate: todayIso(),
        startTime: "08:00",
        endTime: "18:00",
        includesLunch: false,
        includesDinner: false,
        reason: "",
        note: "",
      });
      void client.invalidateQueries({ queryKey: ["student", "leave-requests"] });
      notify(
        draft.leaveType === "SCHOOL_EXIT"
          ? "درخواست خروج برای ناظم مدرسه ارسال شد."
          : "درخواست مرخصی برای مدیر مدرسه ارسال شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال درخواست انجام نشد.", "error"),
  });

  const chooseStartDate = (startDate: string) => {
    setDraft((current) => ({
      ...current,
      startDate,
      endDate: !current.endDate || current.endDate < startDate ? startDate : current.endDate,
    }));
  };

  const canSubmitDates = Boolean(organizationId && draft.startDate && draft.endDate);
  const submit = () => {
    if (!canSubmitDates) {
      notify("مدرسه یا تاریخ درخواست مشخص نیست.", "error");
      return;
    }
    if (!draft.reason.trim()) {
      notify("لطفاً دلیل درخواست را بنویسید.", "error");
      return;
    }
    create.mutate();
  };

  if (requests.isLoading) return <LoadingState label="در حال دریافت درخواست‌ها…" />;

  return (
    <main className="mx-auto w-full max-w-2xl pb-6" dir="rtl">
      <section className="px-1 pt-1">
        <p className="text-xs font-bold text-brand">خدمات دانش‌آموزی</p>
        <h2 className="sr-only">خروج و مرخصی</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          نوع درخواست، تاریخ و دلیل را انتخاب کنید؛ نتیجه بررسی در همین صفحه ثبت می‌شود.
        </p>
      </section>

      <section className="mt-4" aria-labelledby="request-kind-heading">
        <div className="mb-2 flex items-center gap-2 px-1">
          <ShieldCheck size={17} className="text-brand" aria-hidden="true" />
          <h2 id="request-kind-heading" className="text-sm font-black text-ink">
            نوع درخواست
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {requestTypes.map((type) => {
            const Icon = type.icon;
            const selected = type.id === draft.leaveType;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setDraft((current) => ({ ...current, leaveType: type.id }))}
                className={`min-h-36 rounded-2xl border p-3 text-right outline-none transition focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${
                  selected
                    ? `${type.accent} shadow-sm ring-2 ring-brand/25`
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-950/40">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="mt-3 block text-sm font-black">{type.title}</span>
                <span className="mt-1 block text-xs leading-5 opacity-75">{type.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="mt-4 overflow-hidden border-slate-200/90 p-3 shadow-sm dark:border-slate-800">
        <div className="flex items-start gap-2 px-1 pb-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-black text-ink">تاریخ درخواست</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              روز شروع را از تقویم انتخاب کنید. برای مرخصی چندروزه، تاریخ پایان را هم مشخص کنید.
            </p>
          </div>
        </div>
        <DashboardCalendar
          value={draft.startDate}
          onChange={chooseStartDate}
          capabilities={auth.capabilities}
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/50">
            <span className="text-[11px] font-bold text-slate-500">شروع</span>
            <p className="mt-0.5 text-sm font-bold text-ink">{formatDate(draft.startDate)}</p>
          </div>
          <label className="grid gap-1 text-[11px] font-bold text-slate-500">
            پایان {draft.leaveType === "SCHOOL_EXIT" ? "خروج" : "مرخصی"}
            <DatePicker
              value={draft.endDate}
              min={draft.startDate}
              required
              clearable={false}
              showToday={false}
              onChange={(endDate) => setDraft((current) => ({ ...current, endDate }))}
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-slate-500">
            ساعت شروع
            <input
              type="time"
              value={draft.startTime}
              onChange={(event) =>
                setDraft((current) => ({ ...current, startTime: event.target.value }))
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-slate-500">
            ساعت پایان
            <input
              type="time"
              value={draft.endTime}
              onChange={(event) =>
                setDraft((current) => ({ ...current, endTime: event.target.value }))
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>
      </Card>

      <Card className="mt-3 p-3">
        <h2 className="text-sm font-black text-ink">وضعیت وعده‌ها در زمان مرخصی</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-ink">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.includesLunch}
              onChange={(event) =>
                setDraft((current) => ({ ...current, includesLunch: event.target.checked }))
              }
            />{" "}
            ناهار
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.includesDinner}
              onChange={(event) =>
                setDraft((current) => ({ ...current, includesDinner: event.target.checked }))
              }
            />{" "}
            شام
          </label>
        </div>
      </Card>

      <Card className="mt-3 p-3">
        <label className="grid gap-1.5 text-sm font-black text-ink">
          دلیل {selectedType.title}
          <Textarea
            className="min-h-24 resize-none text-sm font-normal"
            placeholder={
              draft.leaveType === "SCHOOL_EXIT"
                ? "مثلاً مراجعه درمانی یا کار ضروری"
                : "مثلاً بیماری یا امور خانوادگی"
            }
            value={draft.reason}
            onChange={(event) => setDraft((value) => ({ ...value, reason: event.target.value }))}
          />
        </label>
        <label className="mt-3 grid gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          توضیح تکمیلی <span className="font-normal text-slate-400">(اختیاری)</span>
          <Textarea
            className="min-h-20 resize-none text-sm font-normal"
            placeholder="در صورت نیاز، توضیح بیشتری بنویسید."
            value={draft.note}
            onChange={(event) => setDraft((value) => ({ ...value, note: event.target.value }))}
          />
        </label>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
          <Building2 size={16} className="shrink-0 text-brand" aria-hidden="true" />
          <span>{selectedType.approver}</span>
        </div>
        {!draft.reason.trim() ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">
            برای ثبت نهایی، دلیل درخواست را وارد کنید.
          </p>
        ) : null}
        <Button
          className="mt-3 min-h-11 w-full"
          disabled={!canSubmitDates}
          loading={create.isPending}
          onClick={submit}
        >
          <Send size={16} aria-hidden="true" />
          {selectedType.approver}
        </Button>
      </Card>

      <section className="mt-5" aria-labelledby="student-leave-history">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Clock3 size={17} className="text-brand" aria-hidden="true" />
          <h2 id="student-leave-history" className="text-sm font-black text-ink">
            پیگیری درخواست‌ها
          </h2>
        </div>
        {requests.isError ? (
          <ErrorState
            title="دریافت درخواست‌ها انجام نشد"
            description="اتصال را بررسی کنید و دوباره تلاش کنید."
            action={
              <Button variant="soft" onClick={() => void requests.refetch()}>
                تلاش دوباره
              </Button>
            }
          />
        ) : !requests.data?.length ? (
          <EmptyState title="هنوز درخواستی ثبت نکرده‌اید." />
        ) : (
          <div className="grid gap-2">
            {requests.data.map((request) => {
              const type =
                requestTypes.find((item) => item.id === request.leaveType) ?? requestTypes[1];
              const Icon = type.icon;
              return (
                <Card key={request.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-ink">{type.title}</p>
                        <Badge tone={statusMeta[request.status].tone}>
                          {statusMeta[request.status].label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(request.startDate.slice(0, 10))} تا{" "}
                        {formatDate(request.endDate.slice(0, 10))}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {request.reason}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                        <CheckCircle2 size={14} className="text-brand" aria-hidden="true" />
                        {request.reviewerRole === "SCHOOL_SUPERVISOR"
                          ? "بررسی توسط ناظم"
                          : "بررسی توسط مدیر"}
                      </p>
                      {request.note ? (
                        <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                          یادداشت مدرسه: {request.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
