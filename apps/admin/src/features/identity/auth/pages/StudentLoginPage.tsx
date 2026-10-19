import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowUpLeft,
} from "lucide-react";

import { BackendHealthStatus } from "../components/BackendHealthStatus";
import { LoginForm } from "../components/LoginForm";
import { LoginShell, LoginToolbar } from "../components";
import { PlatformBootstrapForm } from "../components/PlatformBootstrapForm";
import { usePublicSchoolProfile } from "../components/PublicSchoolProfile";
import { usePlatformBootstrap } from "../hooks/usePlatformBootstrap";
import { useAuthLocale } from "../model/auth-locale";
// import "./student-login-glass.css";

/** Student-only presentation. Authentication and permission logic stay in their existing modules. */
export function StudentLoginPage() {
  const { school, schools, selectedId, selectSchool } = usePublicSchoolProfile();
  const { copy, direction } = useAuthLocale();
  const { loading, setupRequired, showBootstrap, openBootstrap, closeBootstrap } =
    usePlatformBootstrap();
  const studentTitle =
    direction === "rtl" ? "به دنیای یادگیری خوش آمدی!" : "Welcome to your learning world!";
  const studentDescription =
    direction === "rtl"
      ? "برنامه، کتاب‌ها و مسیر پیشرفتت، همه در یک جای دوست‌داشتنی."
      : "Your schedule, books, and progress—all in one lovely place.";

  return (
    <LoginShell direction={direction}>
      <main
        dir={direction}
        className="student-glass-page relative isolate min-h-dvh overflow-hidden bg-[#e6f3ff] text-slate-800 dark:bg-[#081429] dark:text-white"
      >
        <div
          aria-hidden="true"
          className="student-glass-mesh pointer-events-none absolute inset-0"
        />
        <div aria-hidden="true" className="student-glass-orb student-glass-orb--one" />
        <div aria-hidden="true" className="student-glass-orb student-glass-orb--two" />
        <div aria-hidden="true" className="student-glass-orb student-glass-orb--three" />

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[470px] flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
          <header className="flex items-center justify-between gap-3">
            <div className="student-glass-brand inline-flex min-h-11 items-center gap-2.5 rounded-[20px] px-3 py-2 text-sm font-extrabold">
              <span className="student-glass-brand-icon grid size-8 place-items-center rounded-xl text-blue-700 dark:text-blue-100">
                <GraduationCap size={19} aria-hidden="true" />
              </span>
              {direction === "rtl" ? "پرتال دانش‌آموزی" : "Student portal"}
            </div>
            <div className="student-glass-toolbar rounded-2xl p-1">
              <LoginToolbar />
            </div>
          </header>

          <section aria-labelledby="student-login-title" className="mt-7 text-center sm:mt-9">
            <div className="student-glass-logo relative mx-auto grid place-items-center rounded-[32px] p-4 sm:size-[116px]">
              <div
                aria-hidden="true"
                className="student-glass-logo-shine absolute inset-1 rounded-[28px]"
              />
              <img
                src={school?.profile.logoUrl || "/logo-bastak.webp"}
                alt={school?.profile.displayName || school?.name || copy.productName}
                className="relative z-10 size-full object-contain drop-shadow-[0_5px_6px_rgba(30,64,175,0.15)]"
                decoding="async"
              />
              <span
                aria-hidden="true"
                className="student-glass-sparkle absolute -end-3 -top-2 grid size-10 place-items-center rounded-2xl text-amber-500"
              >
                <Sparkles size={20} strokeWidth={2.6} />
              </span>
            </div>
            {/* <div className="student-glass-pill mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold text-blue-700 dark:text-sky-100">
              <Sparkles size={14} aria-hidden="true" />
              {direction === "rtl"
                ? "ماجراجویی علمی تو از اینجا شروع می‌شود"
                : "Your learning adventure starts here"}
            </div> */}
            {/* <h1
              id="student-login-title"
              className="mt-4 text-[clamp(1.55rem,6vw,2.2rem)] font-black leading-[1.5] tracking-tight text-[#17346f] dark:text-white"
            >
              {studentTitle}
            </h1>
            <p className="mx-auto mt-1.5 max-w-[340px] text-[13px] font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-sm">
              {studentDescription}
            </p> */}
          </section>

          <section
            aria-label={direction === "rtl" ? "فرم ورود" : "Sign-in form"}
            className="student-glass-panel relative mt-6 rounded-[34px] px-5 pb-5 pt-6 sm:px-7 sm:pb-7"
          >
            <div
              aria-hidden="true"
              className="student-glass-top-glint absolute inset-x-12 top-px h-px"
            />
            {schools.length > 1 && (
              <label className="mb-5 grid gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-100">
                {direction === "rtl" ? "مدرسه خودت را انتخاب کن" : "Choose your school"}
                <select
                  value={selectedId}
                  onChange={(event) => selectSchool(event.target.value)}
                  className="student-glass-input min-h-12 w-full rounded-2xl px-4 text-sm font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                >
                  <option value="">{direction === "rtl" ? "انتخاب مدرسه" : "Choose school"}</option>
                  {schools.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.profile.displayName || item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div
              className="mb-6 grid grid-cols-3 gap-2.5"
              aria-label={
                direction === "rtl" ? "امکانات پرتال دانش‌آموزی" : "Student portal features"
              }
            >
              <StudentPortalFeature
                icon={<CalendarDays size={22} strokeWidth={2.2} />}
                label={direction === "rtl" ? "برنامه" : "Schedule"}
                tone="blue"
              />
              <StudentPortalFeature
                icon={<BookOpenCheck size={22} strokeWidth={2.2} />}
                label={direction === "rtl" ? "کتابخانه" : "Library"}
                tone="cyan"
              />
              <StudentPortalFeature
                icon={<ShieldCheck size={22} strokeWidth={2.2} />}
                label={direction === "rtl" ? "حساب امن" : "Secure"}
                tone="mint"
              />
            </div>

            <div className="student-glass-health mb-5">
              <BackendHealthStatus />
            </div>

            <div className="student-glass-form">
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
                    className="student-glass-secondary mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-center text-sm font-extrabold text-blue-700 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-sky-100"
                  >
                    <ArrowUpLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                    {school?.profile.signupLabel ||
                      (direction === "rtl" ? "ثبت‌نام دانش‌آموز جدید" : "New student signup")}
                  </Link>
                  {setupRequired && (
                    <button
                      type="button"
                      onClick={openBootstrap}
                      className="mt-3 min-h-11 w-full rounded-xl px-3 text-xs font-bold text-slate-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300"
                    >
                      {copy.createPlatformOwner}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
          <p className="mt-5 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {school?.profile.displayName || school?.name || copy.productName}
          </p>
        </div>
      </main>
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
  tone: "blue" | "cyan" | "mint";
}) {
  return (
    <div
      className={`student-glass-feature student-glass-feature--${tone} flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-[22px] px-1.5 py-3 text-center text-[11px] font-extrabold`}
    >
      <span
        aria-hidden="true"
        className="student-glass-feature-icon grid size-11 place-items-center rounded-[16px]"
      >
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className="animate-pulse space-y-3">
      <div className="h-12 rounded-2xl bg-white/65 dark:bg-slate-700/50" />
      <div className="h-12 rounded-2xl bg-white/65 dark:bg-slate-700/50" />
      <div className="h-12 rounded-2xl bg-blue-300/60 dark:bg-blue-500/35" />
    </div>
  );
}
