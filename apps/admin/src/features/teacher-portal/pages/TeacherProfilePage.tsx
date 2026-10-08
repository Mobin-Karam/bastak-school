import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useAuth } from "../../auth";
import { getAccountProfile } from "../../settings/api/settings.api";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Card } from "../../../shared/ui/ui";

export function TeacherProfilePage() {
  const auth = useAuth();
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountProfile });
  const name = auth.user?.displayName || auth.user?.display_name || auth.user?.username || "استاد";
  return (
    <section className="mx-auto grid w-full max-w-2xl gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="پروفایل من"
        description="اطلاعات حساب استاد را مرور کنید."
      />
      <Card className="flex items-center gap-3 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <UserRound size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-ink">{name}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {profile.isLoading
              ? "در حال دریافت شماره همراه…"
              : profile.data?.phoneNumber || "شماره همراه ثبت نشده"}
          </p>
        </div>
      </Card>
    </section>
  );
}
