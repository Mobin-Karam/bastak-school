import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../identity/auth";
import {
  deletePrayerTimes,
  getPrayerTimes,
  savePrayerTimes,
} from "../../../analytics/school-home/api/school-home.api";
import { useModal } from "../../../../shared/ui/modal";
import { notify } from "../../../../shared/ui/notifications";
import { Button, Card, ErrorState, Input, LoadingState } from "../../../../shared/ui/ui";

const prayerFields = [
  ["fajr", "صبح"],
  ["sunrise", "طلوع"],
  ["dhuhr", "ظهر"],
  ["asr", "عصر"],
  ["maghrib", "مغرب"],
  ["isha", "عشاء"],
] as const;

type PrayerDraft = Record<(typeof prayerFields)[number][0], string>;

const emptyDraft = (): PrayerDraft => ({
  fajr: "",
  sunrise: "",
  dhuhr: "",
  asr: "",
  maghrib: "",
  isha: "",
});

/**
 * Organisation-wide default prayer schedule. Dated overrides stay available
 * through the API, while this focused card keeps the day-to-day manager flow
 * predictable for principals and supervisors.
 */
export function PrayerTimeSettings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const modal = useModal();
  const organizationId = auth.context?.activeOrganization?.id;
  const isSchoolManager =
    auth.activeRole === "PRINCIPAL" || auth.activeRole === "SCHOOL_SUPERVISOR";
  const canManage = isSchoolManager && auth.can("prayer_times.manage");
  const [draft, setDraft] = useState<PrayerDraft>(emptyDraft);

  const prayer = useQuery({
    queryKey: ["prayer-times", organizationId, "default"],
    queryFn: () => getPrayerTimes(organizationId, ""),
    enabled: canManage && Boolean(organizationId),
  });

  useEffect(() => {
    if (!prayer.data?.times) return;
    const { fajr, sunrise, dhuhr, asr, maghrib, isha } = prayer.data.times;
    setDraft({ fajr, sunrise, dhuhr, asr, maghrib, isha });
  }, [prayer.data?.times]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["prayer-times"] });
  const save = useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("مدرسه فعال مشخص نیست.");
      return savePrayerTimes(organizationId, { ...draft, date: "" });
    },
    onSuccess: () => {
      invalidate();
      notify("اوقات شرعی پیش‌فرض مدرسه ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره اوقات شرعی انجام نشد.", "error"),
  });
  const clear = useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("مدرسه فعال مشخص نیست.");
      return deletePrayerTimes(organizationId, "");
    },
    onSuccess: () => {
      setDraft(emptyDraft());
      invalidate();
      notify("اوقات شرعی پیش‌فرض پاک شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "پاک‌کردن اوقات شرعی انجام نشد.", "error"),
  });

  if (!canManage) return null;
  if (!organizationId) {
    return (
      <ErrorState
        title="مدرسه فعال انتخاب نشده است"
        description="برای تنظیم اوقات شرعی ابتدا مدرسه فعال را از حساب خود انتخاب کنید."
      />
    );
  }
  if (prayer.isLoading) return <LoadingState label="در حال دریافت اوقات شرعی مدرسه…" />;
  if (prayer.isError) {
    return (
      <ErrorState
        title="دریافت اوقات شرعی انجام نشد"
        description="اتصال را بررسی کنید و دوباره تلاش کنید."
        action={
          <Button variant="soft" size="sm" onClick={() => void prayer.refetch()}>
            <RotateCcw size={15} />
            تلاش دوباره
          </Button>
        }
      />
    );
  }

  const complete = prayerFields.every(([key]) => /^([01]\d|2[0-3]):[0-5]\d$/.test(draft[key]));
  return (
    <Card className="grid gap-4 p-4" aria-labelledby="prayer-time-settings-title" dir="rtl">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <Clock3 size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="prayer-time-settings-title" className="font-black text-ink">
            اوقات شرعی مدرسه
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            این شش زمان روزانه، برنامه پیش‌فرض مدرسه هستند و برای روزهای بدون زمان اختصاصی نمایش
            داده می‌شوند.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {prayerFields.map(([key, label]) => (
          <label
            key={key}
            className="grid gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <span>{label}</span>
            <Input
              type="time"
              value={draft[key]}
              onChange={(event) =>
                setDraft((current) => ({ ...current, [key]: event.target.value }))
              }
              aria-label={label}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
        <Button loading={save.isPending} disabled={!complete} onClick={() => save.mutate()}>
          <Save size={16} />
          ذخیره اوقات
        </Button>
        {prayer.data?.times ? (
          <Button
            variant="soft"
            className="text-rose-700 dark:text-rose-300"
            loading={clear.isPending}
            onClick={() =>
              void modal
                .confirm({
                  title: "پاک‌کردن اوقات شرعی",
                  description:
                    "زمان‌های پیش‌فرض پاک می‌شوند. روزهای دارای زمان اختصاصی تغییری نمی‌کنند.",
                  confirmLabel: "پاک‌کردن",
                  tone: "danger",
                })
                .then((confirmed) => confirmed && clear.mutate())
            }
          >
            <Trash2 size={16} />
            پاک‌کردن پیش‌فرض
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
