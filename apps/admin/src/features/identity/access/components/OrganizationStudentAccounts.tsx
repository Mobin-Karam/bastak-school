import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../shared/api/api";
import { useAuth } from "../../auth";
import { useLocale } from "../../../../shared/ui/locale";
import { Button, EmptyState, Field, Input, Select } from "../../../../shared/ui/ui";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { createStudent } from "../../../people/students/api/students.api";
import {
  emptyStudentForm,
  normalizeIranianPhoneNumber,
} from "../../../people/students/model/student-form";
import type { Student } from "../../../../shared/types/domain";
import { notify } from "../../../../shared/ui/notifications";

type Catalog = {
  grades: { id: number; fa: string }[];
  educationTypes: { id: string; fa: string }[];
  theoreticalTracks: { id: string; fa: string }[];
  vocationalFields: { id: string; fa: string }[];
  gradeStructure: { grades: number[]; education_type_ids: string[]; track_required: boolean }[];
};
export function OrganizationStudentAccounts({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const auth = useAuth();
  const { language } = useLocale();
  const fa = language === "fa";
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyStudentForm);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const catalog = useQuery({
    queryKey: ["education-catalog", "signup-options"],
    queryFn: () => api.get<Catalog>("/education-catalog/signup-options"),
    enabled: auth.can("students.create"),
  });
  const students = useQuery({
    queryKey: [
      "students",
      "organization-accounts",
      auth.context?.user?.id,
      auth.activeRole,
      organizationId,
    ],
    queryFn: () =>
      api.get<Student[]>(`/students?organizationId=${encodeURIComponent(organizationId)}`),
    enabled: drawer && auth.can("students.read"),
  });
  const structure = catalog.data?.gradeStructure.find((item) =>
    item.grades.includes(Number(form.gradeId)),
  );
  const types =
    catalog.data?.educationTypes.filter((item) =>
      structure?.education_type_ids.includes(item.id),
    ) ?? [];
  const tracks =
    form.educationTypeId === "theoretical"
      ? (catalog.data?.theoreticalTracks ?? [])
      : ["technical_vocational", "kar_danesh"].includes(form.educationTypeId)
        ? (catalog.data?.vocationalFields ?? [])
        : [];
  const titles = fa
    ? ["مشخصات و ورود", "اطلاعات آموزشی", "بررسی و ساخت"]
    : ["Identity and login", "Education", "Review and create"];
  const field = (key: keyof typeof form, value: string) => {
    setSuccess("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  return (
    <div className="grid gap-4">
      {auth.can("students.read") ? (
        <Button variant="soft" onClick={() => setDrawer(true)}>
          {fa ? "مشاهده حساب‌های دانش‌آموزان" : "View student accounts"}
        </Button>
      ) : null}
      {auth.can("students.create") ? (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setSuccess("");
            if (step === 0 && !/^09\d{9}$/.test(normalizeIranianPhoneNumber(form.username))) {
              setError(fa ? "شماره همراه معتبر وارد کنید." : "Enter a valid mobile number.");
              return;
            }
            if (
              step === 1 &&
              (!structure || !form.educationTypeId || (structure.track_required && !form.trackId))
            ) {
              setError(fa ? "اطلاعات آموزشی را کامل کنید." : "Complete the education fields.");
              return;
            }
            if (step < 2) {
              setStep(step + 1);
              return;
            }
            setPending(true);
            try {
              await createStudent(form, organizationId);
              await qc.invalidateQueries({ queryKey: ["students"] });
              setForm(emptyStudentForm());
              setStep(0);
              setSuccess(fa ? "حساب دانش‌آموز ساخته شد." : "Student account created.");
              notify(fa ? "حساب ساخته شد." : "Account created.");
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Unable to create account.");
            } finally {
              setPending(false);
            }
          }}
        >
          <ol
            aria-label={fa ? "مراحل ساخت حساب" : "Account creation steps"}
            className="grid grid-cols-3 gap-2"
          >
            {titles.map((title, index) => (
              <li
                key={title}
                aria-current={index === step ? "step" : undefined}
                className={`border-t-2 pt-2 text-xs font-bold ${index <= step ? "border-brand text-brand" : "border-slate-200 text-slate-500"}`}
              >
                {index + 1}. {title}
              </li>
            ))}
          </ol>
          <fieldset disabled={pending} className="grid min-w-0 gap-3">
            {step === 0 ? (
              <>
                <Field label={fa ? "نام و نام خانوادگی" : "Student full name"}>
                  <Input
                    required
                    minLength={2}
                    maxLength={160}
                    value={form.name}
                    onChange={(event) => field("name", event.target.value)}
                  />
                </Field>
                <Field label={fa ? "شماره همراه دانش‌آموز" : "Student mobile number"}>
                  <Input
                    required
                    inputMode="tel"
                    autoComplete="off"
                    dir="ltr"
                    value={form.username}
                    onChange={(event) => field("username", event.target.value)}
                  />
                </Field>
                <Field
                  label={
                    fa
                      ? "رمز عبور اولیه (حداقل ۱۲ نویسه)"
                      : "Initial password (at least 12 characters)"
                  }
                >
                  <Input
                    required
                    type="password"
                    minLength={12}
                    maxLength={300}
                    autoComplete="new-password"
                    dir="ltr"
                    value={form.password}
                    onChange={(event) => field("password", event.target.value)}
                  />
                </Field>
              </>
            ) : step === 1 ? (
              <>
                {catalog.isLoading ? (
                  <p role="status">
                    {fa ? "دریافت اطلاعات آموزشی…" : "Loading education options…"}
                  </p>
                ) : catalog.isError ? (
                  <div role="alert">
                    <p>
                      {fa
                        ? "دریافت اطلاعات آموزشی ناموفق بود."
                        : "Could not load education options."}
                    </p>
                    <Button type="button" variant="soft" onClick={() => void catalog.refetch()}>
                      {fa ? "تلاش دوباره" : "Retry"}
                    </Button>
                  </div>
                ) : null}
                <Field label={fa ? "پایه" : "Grade"}>
                  <Select
                    required
                    value={form.gradeId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gradeId: event.target.value,
                        educationTypeId: "",
                        trackId: "",
                      })
                    }
                  >
                    <option value="">{fa ? "انتخاب پایه" : "Select grade"}</option>
                    {catalog.data?.grades.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.fa}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={fa ? "نوع آموزش" : "Education type"}>
                  <Select
                    required
                    value={form.educationTypeId}
                    onChange={(event) =>
                      setForm({ ...form, educationTypeId: event.target.value, trackId: "" })
                    }
                  >
                    <option value="">{fa ? "انتخاب نوع آموزش" : "Select education type"}</option>
                    {types.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.fa}
                      </option>
                    ))}
                  </Select>
                </Field>
                {structure?.track_required ? (
                  <Field label={fa ? "رشته" : "Track"}>
                    <Select
                      required
                      value={form.trackId}
                      onChange={(event) => field("trackId", event.target.value)}
                    >
                      <option value="">{fa ? "انتخاب رشته" : "Select track"}</option>
                      {tracks.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fa}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </>
            ) : (
              <dl className="grid gap-3 rounded-xl bg-brand/5 p-4">
                {[
                  [fa ? "مدرسه" : "School", organizationName],
                  [fa ? "نام" : "Name", form.name],
                  [fa ? "شماره همراه" : "Mobile", normalizeIranianPhoneNumber(form.username)],
                  [
                    fa ? "پایه" : "Grade",
                    catalog.data?.grades.find((item) => String(item.id) === form.gradeId)?.fa,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </fieldset>
          {error ? (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="text-sm text-emerald-700">
              {success}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="soft"
                disabled={pending}
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                {fa ? "مرحله قبل" : "Back"}
              </Button>
            ) : null}
            <Button loading={pending} disabled={step === 1 && !catalog.data}>
              {step === 2
                ? fa
                  ? "ساخت حساب دانش‌آموز"
                  : "Create student account"
                : fa
                  ? "ادامه"
                  : "Continue"}
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState title={fa ? "اجازه ساخت حساب ندارید." : "You cannot create accounts."} />
      )}
      <ResponsiveDrawer
        open={drawer}
        onOpenChange={setDrawer}
        title={fa ? "حساب‌های دانش‌آموزان" : "Student accounts"}
        description={organizationName}
        className="md:w-[min(56rem,94vw)]"
      >
        <Field label={fa ? "جستجوی دانش‌آموز" : "Search students"}>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} />
        </Field>
        {students.isLoading ? (
          <p role="status" className="mt-4">
            {fa ? "در حال دریافت…" : "Loading…"}
          </p>
        ) : students.isError ? (
          <div role="alert" className="mt-4">
            <p>{fa ? "دریافت حساب‌ها ناموفق بود." : "Could not load accounts."}</p>
            <Button variant="soft" onClick={() => void students.refetch()}>
              {fa ? "تلاش دوباره" : "Retry"}
            </Button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-start text-sm">
              <caption className="sr-only">{organizationName}</caption>
              <thead>
                <tr>
                  <th scope="col" className="p-3 text-start">
                    {fa ? "دانش‌آموز" : "Student"}
                  </th>
                  <th scope="col" className="p-3 text-start">
                    {fa ? "شماره همراه" : "Mobile"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(students.data ?? [])
                  .filter((item) =>
                    `${item.name} ${item.user?.phoneNumber ?? ""}`
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  )
                  .map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3" dir="ltr">
                        {item.user?.phoneNumber ?? "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!(students.data ?? []).some((item) =>
              `${item.name} ${item.user?.phoneNumber ?? ""}`
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
            ) ? (
              <EmptyState title={fa ? "حسابی یافت نشد." : "No accounts found."} />
            ) : null}
          </div>
        )}
      </ResponsiveDrawer>
    </div>
  );
}
