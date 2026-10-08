import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../../shared/ui/ui";
import { ThemeSwitcher } from "../../../shared/theme/theme";
import { getStudentSignupOptions, studentSignup, type SignupOrganization } from "../api/signup.api";
import { LoginBrand, LoginShell } from "../components";

export function StudentSignupPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<SignupOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getStudentSignupOptions()
      .then((data) => {
        setOrganizations(data.organizations);
        setOrganizationId(data.organizations[0]?.id ?? "");
        if (!data.enabled) setMessage("ثبت‌نام مستقیم در حال حاضر غیرفعال است.");
      })
      .catch(() => setMessage("دریافت مدارس فعال انجام نشد."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await studentSignup({ organizationId, firstName, lastName, phoneNumber, password });
      navigate("/login", { replace: true, state: { signupComplete: true } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت‌نام انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginShell showHero={false} direction="rtl">
      <section className="flex min-h-dvh min-w-0 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 md:min-h-[620px] md:px-8 md:py-7">
        <header className="flex min-h-10 items-center justify-between gap-3">
          <LoginBrand brandName="ZANIN" productName="مدرسه دینی سلطان‌العلمای بستک" />
          <ThemeSwitcher />
        </header>
        <div className="flex flex-1 items-center justify-center py-7 sm:py-9">
          <Card className="w-full max-w-lg rounded-2xl border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5 shadow-[0_18px_40px_rgb(0_64_72_/_10%)] sm:p-7">
            <span className="inline-flex rounded-full bg-saffron/15 px-3 py-1 text-[11px] font-black text-[#926b1c] dark:text-saffron">
              شروع مسیر آموزشی
            </span>
            <h1 className="mt-3 text-2xl font-black text-ink">ساخت حساب طلبه</h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              برای شروع فقط مدرسه، نام، شماره همراه و رمز عبور لازم است. جزئیات پرونده بعداً
              مرحله‌به‌مرحله تکمیل می‌شود.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={submit}>
              <label className="grid gap-1 text-sm font-bold text-ink">
                مدرسه
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  required
                  className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold text-ink">
                  نام
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    minLength={2}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-ink">
                  نام خانوادگی
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    minLength={2}
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-bold text-ink">
                شماره همراه
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="09123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold text-ink">
                رمز عبور
                <Input
                  dir="ltr"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                />
              </label>
              {message ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  {message}
                </p>
              ) : null}
              <Button type="submit" className="h-12" loading={loading} disabled={!organizationId}>
                ساخت حساب
              </Button>
              <Link
                className="min-h-10 text-center text-sm font-bold leading-10 text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                to="/login"
              >
                حساب دارید؟ ورود
              </Link>
            </form>
          </Card>
        </div>
      </section>
    </LoginShell>
  );
}
