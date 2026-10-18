import { useState } from "react";
import type { OrganizationAuthProfile } from "@moshaver/api-contract";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "../../../shared/ui/locale";
import { Button, Field, Input } from "../../../shared/ui/ui";
import { updateOrganizationAuthProfile, type PortalOrganization } from "../api/access.api";
import { notify } from "../../../shared/ui/notifications";

export const profileFields: Array<{
  key: Exclude<keyof OrganizationAuthProfile, "published">;
  en: string;
  fa: string;
  max: number;
}> = [
  { key: "displayName", en: "School display name", fa: "نام نمایشی مدرسه", max: 180 },
  { key: "brandName", en: "Brand name", fa: "نام برند", max: 100 },
  { key: "description", en: "School introduction", fa: "معرفی مدرسه", max: 1000 },
  { key: "address", en: "School address", fa: "نشانی مدرسه", max: 500 },
  { key: "phone", en: "School phone", fa: "تلفن مدرسه", max: 40 },
  { key: "location", en: "City / location", fa: "شهر / موقعیت مدرسه", max: 180 },
  { key: "logoUrl", en: "Logo image URL", fa: "نشانی تصویر نشان", max: 1000 },
  { key: "backgroundUrl", en: "Background image URL", fa: "نشانی تصویر پس‌زمینه", max: 1000 },
  { key: "loginTitle", en: "Login heading", fa: "عنوان صفحه ورود", max: 180 },
  { key: "signupTitle", en: "Signup heading", fa: "عنوان صفحه ثبت‌نام", max: 180 },
  { key: "signupLabel", en: "Signup link text", fa: "متن پیوند ثبت‌نام", max: 180 },
  { key: "securityNotice", en: "Footer notice", fa: "متن اطلاع‌رسانی پایین صفحه", max: 1000 },
];
export function OrganizationProfileEditor({
  organization,
  onSaved,
}: {
  organization: PortalOrganization;
  onSaved?: () => void;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  const qc = useQueryClient();
  const [name, setName] = useState(organization.name);
  const [draft, setDraft] = useState<OrganizationAuthProfile>(
    () =>
      ({
        published: organization.authProfile?.published ?? false,
        ...Object.fromEntries(
          profileFields.map(({ key }) => [key, organization.authProfile?.[key] ?? ""]),
        ),
      }) as OrganizationAuthProfile,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const titles = fa
    ? ["مشخصات و تماس", "ظاهر و متن‌ها", "بررسی و انتشار"]
    : ["Identity and contact", "Images and text", "Review and publish"];
  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (step < 2) {
          setStep(step + 1);
          return;
        }
        setPending(true);
        try {
          await updateOrganizationAuthProfile(organization.id, { ...draft, name });
          await qc.invalidateQueries({ queryKey: ["organizations"] });
          await qc.invalidateQueries({ queryKey: ["public-organization-profiles"] });
          notify(fa ? "مشخصات مدرسه ذخیره شد." : "School profile saved.");
          onSaved?.();
        } catch (reason) {
          setError(
            reason instanceof Error
              ? reason.message
              : fa
                ? "ذخیره ناموفق بود."
                : "Unable to save profile.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <ol
        aria-label={fa ? "مراحل ویرایش مشخصات" : "Profile editing steps"}
        className="grid grid-cols-3 gap-2"
      >
        {titles.map((title, index) => (
          <li
            key={title}
            aria-current={step === index ? "step" : undefined}
            className={`border-t-2 pt-2 text-xs font-bold ${step >= index ? "border-brand text-brand" : "border-slate-200 text-slate-500"}`}
          >
            {index + 1}. {title}
          </li>
        ))}
      </ol>
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        {step === 0 ? (
          <Field label={fa ? "نام سازمان" : "Organization name"}>
            <Input
              required
              minLength={2}
              maxLength={180}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        ) : null}
        {step < 2 ? (
          profileFields
            .filter((_, index) => (step === 0 ? index < 6 : index >= 6))
            .map(({ key, en, fa: label, max }) => (
              <Field key={key} label={fa ? label : en}>
                <Input
                  maxLength={max}
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                  dir={key.endsWith("Url") || key === "phone" ? "ltr" : undefined}
                  placeholder={key.endsWith("Url") ? "/image.png or https://…" : undefined}
                />
              </Field>
            ))
        ) : (
          <>
            <p className="rounded-xl bg-brand/5 p-3 text-sm leading-6">
              {fa
                ? "اطلاعات منتشرشده برای همه در صفحات ورود و ثبت‌نام قابل مشاهده خواهد بود. داده‌های خصوصی را وارد نکنید."
                : "Published information is visible to everyone on login and signup pages. Use public school contact details."}
            </p>
            <dl className="grid gap-3">
              {profileFields.map(({ key, en, fa: label }) => (
                <div key={key}>
                  <dt className="text-xs text-slate-500">{fa ? label : en}</dt>
                  <dd className="break-words text-sm">{draft[key] || "—"}</dd>
                </div>
              ))}
            </dl>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
              />
              <span className="text-sm font-bold">
                {fa ? "نمایش عمومی در صفحات ورود و ثبت‌نام" : "Publish on login and signup pages"}
              </span>
            </label>
          </>
        )}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {step > 0 ? (
          <Button type="button" variant="soft" disabled={pending} onClick={() => setStep(step - 1)}>
            {fa ? "مرحله قبل" : "Back"}
          </Button>
        ) : null}
        <Button loading={pending}>
          {step === 2 ? (fa ? "ذخیره مشخصات" : "Save profile") : fa ? "ادامه" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
