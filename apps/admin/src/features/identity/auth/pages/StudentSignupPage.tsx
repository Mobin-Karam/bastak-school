import {
  PublicSchoolProfileProvider,
  usePublicSchoolProfile,
  SchoolContactDetails,
} from "../components/PublicSchoolProfile";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../../../shared/ui/ui";
import { ThemeSwitcher } from "../../../shared/theme/theme";
import { getStudentSignupOptions, studentSignup, type SignupOrganization } from "../api/signup.api";
import { LoginShell } from "../components";

const steps = [
  {
    title: "مدرسه و مشخصات",
    description: "مدرسه خود را انتخاب کنید و نام و نام خانوادگی را مطابق مدارک خود بنویسید.",
  },
  {
    title: "اطلاعات ورود",
    description:
      "با این شماره همراه و رمز عبور وارد حساب می‌شوید. رمز عبور باید حداقل ۱۲ نویسه باشد.",
  },
  {
    title: "بررسی و ساخت حساب",
    description:
      "اطلاعات را بررسی کنید. برای اصلاح، به مرحله قبل برگردید؛ جزئیات پرونده را پس از ثبت‌نام تکمیل می‌کنید.",
  },
];

export function StudentSignupPage() {
  return (
    <PublicSchoolProfileProvider>
      <StudentSignupPageContent />
    </PublicSchoolProfileProvider>
  );
}

function StudentSignupPageContent() {
  const navigate = useNavigate();
  const { school, selectSchool } = usePublicSchoolProfile();
  const [organizations, setOrganizations] = useState<SignupOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  async function loadOptions() {
    setOptionsLoading(true);
    setEnabled(false);
    setMessage("");
    try {
      const data = await getStudentSignupOptions();
      setOrganizations(data.organizations);
      const requestedId = new URLSearchParams(window.location.search).get("organizationId");
      setOrganizationId(
        data.organizations.find((item) => item.id === requestedId)?.id ??
          data.organizations[0]?.id ??
          "",
      );
      setEnabled(data.enabled);
      if (!data.enabled) setMessage("ثبت‌نام مستقیم در حال حاضر غیرفعال است.");
      else if (!data.organizations.length)
        setMessage("در حال حاضر مدرسه‌ای با ظرفیت ثبت‌نام در دسترس نیست.");
    } catch {
      setMessage("دریافت مدارس فعال انجام نشد. دوباره تلاش کنید.");
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    void loadOptions();
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  useEffect(() => {
    selectSchool(organizationId);
  }, [organizationId, selectSchool]);

  const available = enabled && !!organizationId && !optionsLoading;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !available) return;
    setMessage("");
    if (step === 0 && (firstName.trim().length < 2 || lastName.trim().length < 2)) {
      setMessage("نام و نام خانوادگی باید دست‌کم دو نویسه داشته باشند.");
      return;
    }
    if (step === 1 && !/^09\d{9}$/.test(phoneNumber.trim())) {
      setMessage("شماره همراه معتبر وارد کنید؛ مانند 09123456789.");
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      await studentSignup({
        organizationId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      navigate("/login", { replace: true, state: { signupComplete: true } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت‌نام انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginShell showHero={false} direction="rtl">
      <section className="flex min-h-dvh min-w-0 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
        <header className="flex min-h-10 justify-end">
          <ThemeSwitcher />
        </header>
        <img
          src={school?.profile.logoUrl || "/logo-bastak.webp"}
          alt={school?.profile.displayName || school?.name || "مدرسه"}
          className="mx-auto mt-2 h-32 w-72 max-w-full object-contain sm:h-40 sm:w-80 md:h-44 md:w-96 lg:h-52"
          decoding="async"
        />
        <div className="mx-auto w-full max-w-sm py-4">
          <h1 className="text-center text-lg font-bold">
            {school?.profile.signupTitle || "ساخت حساب دانش‌آموز"}
          </h1>
          <ol aria-label="مراحل ثبت‌نام" className="mt-4 flex gap-2">
            {steps.map((item, index) => (
              <li
                key={item.title}
                aria-current={step === index ? "step" : undefined}
                className={`flex-1 border-t-2 pt-2 text-center text-[11px] font-bold ${index <= step ? "border-brand text-brand" : "border-[rgb(var(--border-subtle))] text-slate-500"}`}
              >
                {index + 1}. {item.title}
              </li>
            ))}
          </ol>
          <h2 ref={heading} tabIndex={-1} className="mt-4 text-sm font-bold outline-none">
            {steps[step].title}
          </h2>
          <p
            id="signup-step-description"
            className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400"
          >
            {steps[step].description}
          </p>
          <form
            className="mt-3 grid gap-3"
            onSubmit={submit}
            aria-describedby="signup-step-description"
          >
            <fieldset disabled={loading || !available} className="grid min-w-0 gap-3">
              {step === 0 ? (
                <>
                  <label className="grid gap-1 text-sm font-bold">
                    مدرسه
                    <select
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      required
                      className="h-12 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <option value="" disabled>
                        {optionsLoading ? "در حال دریافت مدارس…" : "انتخاب مدرسه"}
                      </option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-bold">
                      نام
                      <Input
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-bold">
                      نام خانوادگی
                      <Input
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                      />
                    </label>
                  </div>
                </>
              ) : step === 1 ? (
                <>
                  <label className="grid gap-1 text-sm font-bold">
                    شماره همراه
                    <Input
                      dir="ltr"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="09123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      maxLength={11}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold">
                    رمز عبور
                    <Input
                      dir="ltr"
                      autoComplete="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={12}
                      maxLength={300}
                    />
                  </label>
                </>
              ) : (
                <dl className="grid gap-3 rounded-xl bg-[rgb(var(--surface-card))]/70 p-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">مدرسه</dt>
                    <dd className="mt-1 font-bold">
                      {organizations.find((org) => org.id === organizationId)?.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">نام و نام خانوادگی</dt>
                    <dd className="mt-1 font-bold">
                      {firstName.trim()} {lastName.trim()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">شماره همراه</dt>
                    <dd className="mt-1 text-start font-bold" dir="ltr">
                      {phoneNumber.trim()}
                    </dd>
                  </div>
                </dl>
              )}
            </fieldset>
            {message ? (
              <p
                role="alert"
                className="rounded-lg bg-[rgb(var(--surface-card))] p-3 text-sm leading-6 text-rosewood"
              >
                {message}
              </p>
            ) : null}
            {!available && !optionsLoading ? (
              <Button type="button" variant="soft" onClick={() => void loadOptions()}>
                بررسی دوباره مدارس
              </Button>
            ) : null}
            <div className="flex gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="soft"
                  disabled={loading}
                  onClick={() => {
                    setMessage("");
                    setStep(step - 1);
                  }}
                >
                  مرحله قبل
                </Button>
              ) : null}
              <Button
                type="submit"
                className="h-12 flex-1"
                loading={loading}
                disabled={loading || !available}
              >
                {optionsLoading ? "در حال دریافت مدارس…" : step === 2 ? "ساخت حساب" : "ادامه"}
              </Button>
            </div>
            <Link
              className="min-h-10 text-center text-xs font-bold leading-10 text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              to={school ? `/login?organizationId=${encodeURIComponent(school.id)}` : "/login"}
            >
              حساب دارید؟ ورود
            </Link>
          </form>
          <SchoolContactDetails />
          {school?.profile.securityNotice ? (
            <p className="mt-3 text-center text-xs leading-6 text-slate-500">
              {school.profile.securityNotice}
            </p>
          ) : null}
        </div>
      </section>
    </LoginShell>
  );
}
