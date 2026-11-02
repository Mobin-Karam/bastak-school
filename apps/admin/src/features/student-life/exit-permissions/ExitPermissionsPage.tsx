import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, DoorOpen, LogIn, Phone, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../identity/auth";
import { useModal } from "../../../shared/ui/modal";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../shared/ui/ui";
import { SearchBar } from "../../../shared/ui/mobile/forms";
import { notify } from "../../../shared/ui/notifications";
import { api } from "../../../shared/api/api";
import {
  getSchoolOccupancy,
  listExitPermissions,
  recordDeparture,
  recordGateDeparture,
  recordGateReturn,
  recordReturn,
  requestReturn,
  reviewExitPermission,
  type ExitPermission,
  type ExitPermissionStatus,
} from "./api/exit-permissions.api";

const tones: Record<ExitPermissionStatus, "amber" | "green" | "red" | "blue" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "neutral",
  COMPLETED: "blue",
};

const labels: Record<ExitPermissionStatus, string> = {
  PENDING: "در انتظار تصمیم",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  CANCELLED: "لغو شده",
  COMPLETED: "بازگشته",
};

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })
    : "—";
}

/** Gate workflow for approved exits. Physical departure and return are distinct audited events. */
export function ExitPermissionsPage() {
  const auth = useAuth();
  const modal = useModal();
  const queryClient = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const [filter, setFilter] = useState<ExitPermissionStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [gatePhone, setGatePhone] = useState("");
  const [gateDestination, setGateDestination] = useState("");
  const [gateReason, setGateReason] = useState("");
  const canOperateGate =
    auth.can("exit.manage") &&
    [
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "SCHOOL_SUPERVISOR",
      "DISCIPLINARIAN",
    ].includes(auth.activeRole ?? "");
  const exits = useQuery({
    queryKey: ["exit-permissions", organizationId],
    queryFn: () => listExitPermissions(organizationId),
  });
  const occupancy = useQuery({
    queryKey: ["attendance", "occupancy", organizationId],
    queryFn: () => getSchoolOccupancy(organizationId),
    enabled: auth.can("school.occupancy.read"),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["exit-permissions", organizationId] });
    void queryClient.invalidateQueries({ queryKey: ["attendance", "occupancy", organizationId] });
  };
  const mutation = useMutation({
    mutationFn: async ({
      row,
      action,
    }: {
      row: ExitPermission;
      action: "approve" | "reject" | "departure" | "return" | "request-return";
    }) => {
      if (action === "approve") return reviewExitPermission(row.id, "APPROVED");
      if (action === "reject") return reviewExitPermission(row.id, "REJECTED");
      if (action === "departure") return recordDeparture(row.id);
      if (action === "request-return") return requestReturn(row.id);
      return recordReturn(row.id);
    },
    onSuccess: (_, variables) => {
      refresh();
      notify(
        variables.action === "departure"
          ? "خروج فیزیکی ثبت شد و آمار مدرسه به‌روز شد."
          : variables.action === "return"
            ? "بازگشت دانش‌آموز ثبت شد و آمار مدرسه به‌روز شد."
            : variables.action === "request-return"
              ? "درخواست بازگشت برای تأیید مسئول مدرسه ارسال شد."
              : "تصمیم درخواست ثبت شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "عملیات انجام نشد.", "error"),
  });
  const gateMutation = useMutation({
    mutationFn: (action: "departure" | "return") => {
      if (!organizationId) throw new Error("مدرسه فعال مشخص نیست.");
      if (action === "return") {
        return recordGateReturn({ organizationId, phoneNumber: gatePhone });
      }
      return recordGateDeparture({
        organizationId,
        phoneNumber: gatePhone,
        destination: gateDestination,
        reason: gateReason,
      });
    },
    onSuccess: (_, action) => {
      setGatePhone("");
      setGateDestination("");
      setGateReason("");
      refresh();
      notify(
        action === "departure"
          ? "مجوز و خروج دانش‌آموز ثبت شد؛ آمار مدرسه به‌روز شد."
          : "ورود دانش‌آموز تأیید شد؛ آمار مدرسه به‌روز شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "عملیات دروازه انجام نشد.", "error"),
  });

  useEffect(() => {
    const events = api.openEvents((type, event) => {
      if (type !== "school.occupancy.updated" || event.organizationId !== organizationId) return;
      void queryClient.invalidateQueries({ queryKey: ["exit-permissions", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["attendance", "occupancy", organizationId] });
    });
    return () => events.close();
  }, [organizationId, queryClient]);

  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fa-IR");
    return (exits.data ?? []).filter(
      (row) =>
        (filter === "ALL" || row.status === filter) &&
        (!needle ||
          [row.studentName, row.destination, row.reason, row.organizationName]
            .join(" ")
            .toLocaleLowerCase("fa-IR")
            .includes(needle)),
    );
  }, [exits.data, filter, search]);

  const confirmAction = async (
    row: ExitPermission,
    action: "approve" | "reject" | "departure" | "return" | "request-return",
  ) => {
    const copy = {
      approve: ["تأیید مجوز خروج", "این درخواست برای ثبت خروج در دروازه آماده می‌شود."],
      reject: ["رد مجوز خروج", "دانش‌آموز اجازه خروج نخواهد داشت."],
      departure: ["ثبت خروج فیزیکی", "این دانش‌آموز از آمار حاضرین مدرسه کم می‌شود."],
      return: ["ثبت بازگشت", "این دانش‌آموز دوباره در آمار حاضرین مدرسه حساب می‌شود."],
      "request-return": [
        "درخواست بازگشت",
        "پس از تأیید مسئول مدرسه، حضور شما در مدرسه ثبت می‌شود.",
      ],
    }[action];
    const approved = await modal.confirm({
      title: copy[0],
      description: `${row.studentName} · ${copy[1]}`,
      confirmLabel: action === "reject" ? "رد درخواست" : "تأیید و ثبت",
      tone: action === "reject" ? "danger" : "default",
    });
    if (approved) mutation.mutate({ row, action });
  };

  if (exits.isLoading) return <LoadingState label="در حال دریافت مجوزهای خروج…" />;
  if (exits.isError) {
    return (
      <EmptyState
        title="دریافت مجوزهای خروج انجام نشد."
        action={<Button onClick={refresh}>تلاش مجدد</Button>}
      />
    );
  }

  return (
    <section
      dir="rtl"
      className="mx-auto w-full max-w-6xl space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8"
    >
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand">دروازه مدرسه</p>
          <h2 className="sr-only">خروج و بازگشت دانش‌آموزان</h2>
          <p className="mt-1 text-sm text-slate-500">
            تأیید مجوز با ثبت خروج فیزیکی تفاوت دارد؛ آمار فقط پس از ثبت حرکت تغییر می‌کند.
          </p>
        </div>
        <Button variant="soft" onClick={refresh} loading={exits.isFetching || occupancy.isFetching}>
          <RefreshCw size={16} /> به‌روزرسانی
        </Button>
      </section>

      {auth.can("school.occupancy.read") ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {(occupancy.data ?? []).map((item) => (
            <Card key={item.organizationId} className="grid grid-cols-3 gap-2 p-3 text-center">
              <div>
                <b className="block text-lg text-ink">
                  {item.totalStudents.toLocaleString("fa-IR")}
                </b>
                <span className="text-xs text-slate-500">کل</span>
              </div>
              <div>
                <b className="block text-lg text-emerald-700">
                  {item.currentlyInSchool.toLocaleString("fa-IR")}
                </b>
                <span className="text-xs text-slate-500">داخل مدرسه</span>
              </div>
              <div>
                <b className="block text-lg text-amber-700">
                  {item.currentlyOut.toLocaleString("fa-IR")}
                </b>
                <span className="text-xs text-slate-500">خارج از مدرسه</span>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {canOperateGate ? (
        <Card className="border-brand/20 bg-brand/5 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <Phone size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-black text-ink">ثبت تردد با شماره همراه</h2>
              <p className="mt-1 text-xs text-slate-500">
                برای دانش‌آموزی که به برنامه دسترسی ندارد، شماره همراه ثبت‌شده را وارد کنید.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Input
              dir="ltr"
              inputMode="tel"
              value={gatePhone}
              onChange={(event) => setGatePhone(event.target.value)}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              aria-label="شماره همراه دانش‌آموز"
            />
            <Input
              value={gateDestination}
              onChange={(event) => setGateDestination(event.target.value)}
              placeholder="مقصد خروج، اختیاری"
              aria-label="مقصد خروج"
            />
            <Input
              value={gateReason}
              onChange={(event) => setGateReason(event.target.value)}
              placeholder="دلیل خروج، اختیاری"
              aria-label="دلیل خروج"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!gatePhone.trim()}
              loading={gateMutation.isPending}
              onClick={() => gateMutation.mutate("departure")}
            >
              <DoorOpen size={16} /> ثبت مجوز و خروج
            </Button>
            <Button
              variant="soft"
              disabled={!gatePhone.trim() || gateMutation.isPending}
              onClick={() => gateMutation.mutate("return")}
            >
              <LogIn size={16} /> تأیید ورود به مدرسه
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی دانش‌آموز، مقصد یا دلیل…"
          aria-label="جست‌وجوی مجوز خروج"
        />
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="فیلتر وضعیت مجوز خروج">
          {(["PENDING", "APPROVED", "COMPLETED", "REJECTED", "ALL"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filter === status ? "primary" : "ghost"}
              onClick={() => setFilter(status)}
            >
              {status === "ALL" ? "همه" : labels[status]}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="divide-y divide-[rgb(var(--border-subtle))]">
        {!rows.length ? (
          <EmptyState title="مجوزی با این وضعیت وجود ندارد." />
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black text-ink">{row.studentName}</h2>
                  <Badge tone={tones[row.status]}>{labels[row.status]}</Badge>
                  {row.origin === "dorm_unauthorized" ? (
                    <Badge tone="red">خروج غیرمجاز</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-bold text-brand">{row.destination}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.reason}</p>
                <p className="mt-2 text-xs text-slate-500">
                  درخواست خروج: {formatDate(row.requestedDepartureAt)} · بازگشت مورد انتظار:{" "}
                  {formatDate(row.expectedReturnAt)}
                </p>
                {row.actualDepartureAt ? (
                  <p className="mt-1 text-xs text-amber-700">
                    خروج ثبت شده: {formatDate(row.actualDepartureAt)}
                  </p>
                ) : null}
                {row.actualReturnAt ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    بازگشت ثبت شده: {formatDate(row.actualReturnAt)}
                  </p>
                ) : null}
                {row.returnRequestedAt && !row.actualReturnAt ? (
                  <p className="mt-1 text-xs text-sky-700">
                    درخواست بازگشت: {formatDate(row.returnRequestedAt)}
                  </p>
                ) : null}
              </div>
              {auth.activeRole === "STUDENT" &&
              row.status === "APPROVED" &&
              row.actualDepartureAt &&
              !row.actualReturnAt &&
              !row.returnRequestedAt ? (
                <Button
                  size="sm"
                  loading={mutation.isPending}
                  onClick={() => void confirmAction(row, "request-return")}
                >
                  <LogIn size={15} /> درخواست بازگشت
                </Button>
              ) : null}
              {auth.can("exit.manage") && auth.activeRole !== "STUDENT" ? (
                <div className="flex flex-wrap gap-2">
                  {row.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        loading={mutation.isPending}
                        onClick={() => void confirmAction(row, "approve")}
                      >
                        <Check size={15} /> تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={mutation.isPending}
                        onClick={() => void confirmAction(row, "reject")}
                      >
                        <X size={15} /> رد
                      </Button>
                    </>
                  ) : null}
                  {row.status === "APPROVED" && !row.actualDepartureAt ? (
                    <Button
                      size="sm"
                      loading={mutation.isPending}
                      onClick={() => void confirmAction(row, "departure")}
                    >
                      <DoorOpen size={15} /> ثبت خروج
                    </Button>
                  ) : null}
                  {row.status === "APPROVED" &&
                  row.actualDepartureAt &&
                  !row.actualReturnAt &&
                  row.returnRequestedAt ? (
                    <Button
                      size="sm"
                      loading={mutation.isPending}
                      onClick={() => void confirmAction(row, "return")}
                    >
                      <LogIn size={15} /> تأیید ورود
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </Card>
    </section>
  );
}
