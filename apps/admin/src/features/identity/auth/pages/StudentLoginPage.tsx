import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, CalendarDays, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

import { portalUrl } from "../../../../app/routing/portal-domain";
import { BackendHealthStatus } from "../components/BackendHealthStatus";
import { LoginForm } from "../components/LoginForm";
import { LoginShell, LoginToolbar } from "../components";
import { PlatformBootstrapForm } from "../components/PlatformBootstrapForm";
import { usePublicSchoolProfile } from "../components/PublicSchoolProfile";
import { usePlatformBootstrap } from "../hooks/usePlatformBootstrap";
import { useAuthLocale } from "../model/auth-locale";

/** Loaded only for the student hostname from LoginPage. */
export function StudentLoginPage() {
  const { school, schools, selectedId, selectSchool } = usePublicSchoolProfile();
  const { copy, direction } = useAuthLocale();
  const { loading, setupRequired, showBootstrap, openBootstrap, closeBootstrap } =
    usePlatformBootstrap();
  const adminLogin = portalUrl("admin", "/login");
  const studentTitle = direction === "rtl" ? "ورود دانش‌آموزان" : "Student sign in";
  const studentDescription =
    direction === "rtl"
      ? "مسیر یادگیری، برنامه و کتابخانه‌ات را در فضای شخصی خودت دنبال کن."
      : "Keep your learning path, schedule, and library together in your personal space.";

  return (
    <LoginShell direction={direction}>
      <section className="relative flex min-h-dvh min-w-0 overflow-hidden bg-[#eff6ff] px-5 py-[max(1rem,env(safe-area-inset-top))] text-[#172554] dark:bg-[#07111f] dark:text-slate-50 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#bfdbfe_0%,transparent_36%),linear-gradient(155deg,#eff6ff_0%,#f8fafc_54%,#ecfeff_100%)] dark:bg-[radial-gradient(circle_at_50%_-10%,#1d4ed8_0%,transparent_35%),linear-gradient(155deg,#07111f_0%,#101b31_54%,#062b35_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-40 -end-32 size-96 rounded-full border border-sky-300/40 dark:border-sky-300/20"
        />
        <div
          aria-hidden="true"
          className="absolute -top-20 -end-12 size-64 rounded-full border border-cyan-400/30 dark:border-cyan-300/20"
        />
        <div
          aria-hidden="true"
          className="absolute top-56 -start-40 size-96 rounded-full bg-teal-300/15 blur-3xl dark:bg-teal-400/15"
        />

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="flex min-h-10 items-center justify-between gap-3">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-black text-[#172554] dark:text-white">
              <GraduationCap
                size={22}
                aria-hidden="true"
                className="text-[#2563eb] dark:text-sky-300"
              />
              <span>{direction === "rtl" ? "پرتال دانش‌آموزی" : "Student portal"}</span>
            </div>
            <LoginToolbar />
          </div>

          <div className="pt-7 text-center sm:pt-9">
            <div className="relative mx-auto grid size-24 place-items-center rounded-[1.75rem] border border-white/70 bg-white/80 p-3 shadow-[0_18px_45px_rgb(30_64_175_/_18%)] backdrop-blur dark:border-sky-200/15 dark:bg-slate-950/65 dark:shadow-[0_18px_45px_rgb(0_0_0_/_35%)]">
              <img
                src={school?.profile.logoUrl || "/logo-bastak.webp"}
                alt={school?.profile.displayName || school?.name || copy.productName}
                className="size-full object-contain"
                decoding="async"
              />
            </div>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-[11px] font-black text-[#1d4ed8] shadow-sm backdrop-blur dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200">
              <Sparkles size={13} aria-hidden="true" />
              <span>{direction === "rtl" ? "فضای یادگیری شخصی" : "Your learning space"}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#172554] dark:text-white sm:text-[2rem]">
              {studentTitle}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">
              {studentDescription}
            </p>
          </div>

          <div className="relative mt-7 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_28px_70px_rgb(30_64_175_/_18%)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/80 dark:shadow-[0_28px_70px_rgb(0_0_0_/_40%)] sm:p-7">
            <div
              aria-hidden="true"
              className="absolute inset-x-9 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent"
            />
            {schools.length > 1 ? (
              <label className="mb-5 grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                {direction === "rtl" ? "مدرسه" : "School"}
                <select
                  value={selectedId}
                  onChange={(event) => selectSchool(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                >
                  <option value="">{direction === "rtl" ? "انتخاب مدرسه" : "Choose school"}</option>
                  {schools.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.profile.displayName || item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div
              className="mb-5 grid grid-cols-3 gap-2"
              aria-label={
                direction === "rtl" ? "امکانات پرتال دانش‌آموزی" : "Student portal features"
              }
            >
              <StudentPortalFeature
                icon={<CalendarDays size={17} />}
                label={direction === "rtl" ? "برنامه" : "Schedule"}
                tone="blue"
              />
              <StudentPortalFeature
                icon={<BookOpenCheck size={17} />}
                label={direction === "rtl" ? "کتابخانه" : "Library"}
                tone="cyan"
              />
              <StudentPortalFeature
                icon={<ShieldCheck size={17} />}
                label={direction === "rtl" ? "حساب امن" : "Secure account"}
                tone="teal"
              />
            </div>

            <div className="mb-4">
              <BackendHealthStatus />
            </div>

            {loading ? (
              <LoginFormSkeleton />
            ) : showBootstrap ? (
              <PlatformBootstrapForm onBack={closeBootstrap} />
            ) : (
              <>
                <LoginForm />
                <Link
                  to={
                    school?.id
                      ? `/register?organizationId=${encodeURIComponent(school.id)}`
                      : "/register"
                  }
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-bold text-[#1d4ed8] transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-300 dark:hover:bg-sky-300/10"
                >
                  {school?.profile.signupLabel ||
                    (direction === "rtl" ? "ثبت‌نام دانش‌آموز جدید" : "New student signup")}
                </Link>
                {setupRequired ? (
                  <button
                    type="button"
                    onClick={openBootstrap}
                    className="mt-2 flex min-h-10 w-full items-center justify-center rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {copy.createPlatformOwner}
                  </button>
                ) : null}
              </>
            )}
          </div>

          {adminLogin ? (
            <a
              href={adminLogin}
              className="mx-auto mt-5 min-h-10 px-3 text-center text-xs font-bold text-slate-600 underline-offset-4 hover:text-[#1d4ed8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:text-sky-200"
            >
              {direction === "rtl" ? "ورود کارکنان و مدیران" : "Staff and administrator sign in"}
            </a>
          ) : null}
        </div>
      </section>
    </LoginShell>
  );
}

function StudentPortalFeature({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: "blue" | "cyan" | "teal";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200",
  };
  return (
    <div
      className={`grid min-h-[4.5rem] place-items-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-bold ${tones[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className="animate-pulse space-y-3">
      <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-11 rounded-xl bg-sky-200/70 dark:bg-sky-500/20" />
    </div>
  );
}
