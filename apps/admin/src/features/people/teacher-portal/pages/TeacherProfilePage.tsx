import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { getAccountProfile } from "../../../platform/settings/api/settings.api";
import { ManagementPageHeader } from "../../../../shared/ui/management-workspace";
import { MobileCard } from "../../../../shared/ui/mobile/layout";
import { Badge, Button } from "../../../../shared/ui/ui";
import { DatePicker } from "../../../../shared/ui/date-picker";
import { notify } from "../../../../shared/ui/notifications";
import {
  createTeacherLeaveRequest,
  listTeacherLeaveRequests,
} from "../../../academics/schedule/api/teacher-leave.api";
import { useState } from "react";

export function TeacherProfilePage() {
  const auth = useAuth();
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountProfile });
  const client = useQueryClient();
  const organizationId = auth.context?.activeOrganization?.id;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const leaves = useQuery({
    queryKey: ["teacher-leaves", organizationId],
    queryFn: listTeacherLeaveRequests,
    enabled: Boolean(organizationId),
  });
  const requestLeave = useMutation({
    mutationFn: createTeacherLeaveRequest,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teacher-leaves"] });
      setReason("");
      notify("درخواست مرخصی برای مدیر ارسال شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ارسال درخواست انجام نشد.", "error"),
  });
  const activeLeave = (leaves.data ?? []).find(
    (leave) =>
      leave.status === "approved" &&
      leave.startDate <= new Date().toISOString().slice(0, 10) &&
      leave.endDate >= new Date().toISOString().slice(0, 10),
  );
  const fullName = [auth.user?.firstName, auth.user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const name =
    fullName || auth.user?.displayName || auth.user?.display_name || auth.user?.username || "استاد";
  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="پروفایل من"
        description="اطلاعات حساب استاد را مرور کنید."
      />
      <MobileCard className="flex items-center gap-3 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <UserRound size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-ink">{name}</h2>
          {activeLeave ? <Badge tone="amber">در مرخصی</Badge> : null}
          <p className="mt-1 text-xs text-slate-500">
            {profile.isLoading
              ? "در حال دریافت شماره همراه…"
              : profile.data?.phoneNumber || "شماره همراه ثبت نشده"}
          </p>
        </div>
      </MobileCard>
      <MobileCard className="grid gap-3 p-4" dir="rtl">
        <div>
          <h2 className="text-sm font-black text-ink">درخواست مرخصی</h2>
          <p className="mt-1 text-xs text-slate-500">
            بازه مرخصی و دلیل را برای بررسی مدیر ارسال کنید.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs font-bold">
            از تاریخ
            <DatePicker calendar="persian" value={startDate} onChange={setStartDate} />
          </label>
          <label className="grid gap-1 text-xs font-bold">
            تا تاریخ
            <DatePicker calendar="persian" value={endDate} min={startDate} onChange={setEndDate} />
          </label>
        </div>
        <textarea
          className="min-h-20 rounded-lg border border-[rgb(var(--border-subtle))] p-2 text-sm"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="دلیل مرخصی یا بیماری"
        />
        <Button
          disabled={
            !organizationId ||
            !startDate ||
            !endDate ||
            reason.trim().length < 2 ||
            requestLeave.isPending
          }
          onClick={() =>
            requestLeave.mutate({ organizationId: organizationId!, startDate, endDate, reason })
          }
        >
          ارسال درخواست مرخصی
        </Button>
      </MobileCard>
    </section>
  );
}
