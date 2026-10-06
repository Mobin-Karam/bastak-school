import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../../shared/ui/ui";
import { getStudentSignupOptions, studentSignup, type SignupOrganization } from "../api/signup.api";

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
    void getStudentSignupOptions().then((data) => {
      setOrganizations(data.organizations);
      setOrganizationId(data.organizations[0]?.id ?? "");
      if (!data.enabled) setMessage("ثبت‌نام مستقیم در حال حاضر غیرفعال است.");
    }).catch(() => setMessage("دریافت مدارس فعال انجام نشد."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(""); setLoading(true);
    try {
      await studentSignup({ organizationId, firstName, lastName, phoneNumber, password });
      navigate("/login", { replace: true, state: { signupComplete: true } });
    } catch (error) { setMessage(error instanceof Error ? error.message : "ثبت‌نام انجام نشد."); }
    finally { setLoading(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-paper p-4" dir="rtl">
    <Card className="w-full max-w-lg p-5">
      <h1 className="text-2xl font-black text-ink">ساخت حساب طلبه</h1>
      <p className="mt-2 text-sm text-slate-500">برای شروع فقط مدرسه، نام، شماره همراه و رمز عبور لازم است. جزئیات پرونده بعداً مرحله‌به‌مرحله تکمیل می‌شود.</p>
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        <label className="grid gap-1 text-sm font-bold text-ink">مدرسه
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3">
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-ink">نام<Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required minLength={2} /></label>
          <label className="grid gap-1 text-sm font-bold text-ink">نام خانوادگی<Input value={lastName} onChange={(e) => setLastName(e.target.value)} required minLength={2} /></label>
        </div>
        <label className="grid gap-1 text-sm font-bold text-ink">شماره همراه<Input dir="ltr" inputMode="numeric" placeholder="09123456789" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">رمز عبور<Input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} /></label>
        {message ? <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{message}</p> : null}
        <Button type="submit" loading={loading} disabled={!organizationId}>ساخت حساب</Button>
        <Link className="text-center text-sm font-bold text-brand" to="/login">حساب دارید؟ ورود</Link>
      </form>
    </Card>
  </main>;
}
