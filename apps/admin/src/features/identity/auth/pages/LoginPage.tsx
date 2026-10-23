import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import {
  PublicSchoolProfileProvider,
  usePublicSchoolProfile,
} from "../components/PublicSchoolProfile";
import { lazy, Suspense } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { useLocale } from "../../../../shared/ui/locale";

import { BackendHealthStatus } from "../components/BackendHealthStatus";

import { LoginForm } from "../components/LoginForm";
import { PlatformBootstrapForm } from "../components/PlatformBootstrapForm";
import { useAuth } from "../hooks/useAuth";
import { usePlatformBootstrap } from "../hooks/usePlatformBootstrap";
import { AuthLocaleProvider, resolveAuthLanguage, useAuthLocale } from "../model/auth-locale";
import { LoginShell, LoginToolbar } from "../components";
import {
  currentAppDomain,
  loginDestination,
  portalUrl,
} from "../../../../app/routing/portal-domain";

const StudentLoginPage = lazy(() =>
  import("./StudentLoginPage").then(({ StudentLoginPage: Page }) => ({ default: Page })),
);

/* =========================================================
   PAGE
   ========================================================= */

export function LoginPage() {
  const locale = useLocale();

  const language = resolveAuthLanguage(locale.profile.locale);

  return (
    <AuthLocaleProvider
      language={language}
      onToggleLanguage={() => locale.setLanguage(language === "fa" ? "en" : "fa")}
    >
      <PublicSchoolProfileProvider>
        <LoginPageContent />
      </PublicSchoolProfileProvider>
    </AuthLocaleProvider>
  );
}

/* =========================================================
   CONTENT
   ========================================================= */

function LoginPageContent() {
  const auth = useAuth();
  const location = useLocation();
  const { school, schools, selectedId, selectSchool } = usePublicSchoolProfile();
  const { copy, direction } = useAuthLocale();

  const { loading, setupRequired, showBootstrap, openBootstrap, closeBootstrap } =
    usePlatformBootstrap();

  if (auth.status === "authenticated") {
    const requestedPath = (location.state as { from?: unknown } | null)?.from;
    const destination = loginDestination(
      auth.context?.roles ?? [],
      typeof requestedPath === "string" ? requestedPath : undefined,
    );
    if (
      !destination ||
      currentAppDomain() === "local" ||
      currentAppDomain() === destination.domain
    ) {
      return <Navigate to={destination?.path ?? "/admin"} replace />;
    }
    const target = portalUrl(destination.domain, destination.path);
    return target ? (
      <CrossPortalLoginMessage target={target} />
    ) : (
      <Navigate to={destination.path} replace />
    );
  }

  if (currentAppDomain() === "student") {
    // if (true) {
    return (
      <Suspense fallback={<StudentLoginLoading direction={direction} />}>
        <StudentLoginPage />
      </Suspense>
    );
  }

  return (
    <LoginShell direction={direction}>
      <section className="flex min-h-dvh min-w-0 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
        <LoginToolbar />

        <img
          src={school?.profile.logoUrl || "/logo-bastak.webp"}
          alt={school?.profile.displayName || school?.name || copy.productName}
          className="mx-auto mt-2 h-32 w-72 max-w-full object-contain sm:h-40 sm:w-80 md:h-44 md:w-96 lg:h-52"
          decoding="async"
        />
        <div className="flex justify-center py-5 md:py-4">
          <div className="w-full max-w-sm">
            {schools.length > 1 ? (
              <label className="mb-4 grid gap-1 text-xs font-bold">
                {direction === "rtl" ? "مدرسه" : "School"}
                <AdaptiveSelect
                  value={selectedId}
                  onChange={(event) => selectSchool(event.target.value)}
                  className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
                >
                  <option value="">{direction === "rtl" ? "انتخاب مدرسه" : "Choose school"}</option>
                  {schools.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.profile.displayName || item.name}
                    </option>
                  ))}
                </AdaptiveSelect>
              </label>
            ) : null}
            {/* {school ? (
              <p className="mb-2 break-words text-center font-black">
                {school.profile.displayName || school.name}
              </p>
            ) : null}
            {school?.profile.brandName ? (
              <p className="mb-2 text-center text-xs font-bold text-brand">
                {school.profile.brandName}
              </p>
            ) : null}
            <h1 className="mb-4 text-center text-lg font-bold">
              {school?.profile.loginTitle || copy.workspaceLogin}
            </h1> */}
            <h1 className="sr-only">{school?.profile.loginTitle || copy.workspaceLogin}</h1>
            {/* ---------------------------------------------
                PAGE HEADING
                --------------------------------------------- */}

            {/* ---------------------------------------------
                BACKEND STATUS

                Don't let it dominate the page.
                --------------------------------------------- */}

            <div className="mb-4">
              <BackendHealthStatus />
            </div>

            {/* ---------------------------------------------
                FORM
                --------------------------------------------- */}

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
                  className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg px-3 text-xs font-bold text-brand transition-colors hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {school?.profile.signupLabel ||
                    (direction === "rtl" ? "ثبت‌نام دانش‌آموز جدید" : "New student signup")}
                </Link>

                {setupRequired ? (
                  <button
                    type="button"
                    onClick={openBootstrap}
                    className="
                      mt-3
                      flex min-h-10
                      w-full items-center
                      justify-center
                      rounded-lg

                      px-3

                      text-xs font-bold
                      text-brand

                      transition-colors

                      hover:bg-brand/5

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-brand/40
                    "
                  >
                    {copy.createPlatformOwner}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        {/* <footer
          className="
            mx-auto
            max-w-md
            px-2 pt-3
            text-center
            text-[10px] leading-5
            text-slate-400
            dark:text-slate-500

            sm:text-[11px]
          "
        >
          {school?.profile.securityNotice || copy.securityNotice}
          <SchoolContactDetails />
        </footer> */}
      </section>
    </LoginShell>
  );
}

function StudentLoginLoading({ direction }: { direction: "rtl" | "ltr" }) {
  return (
    <LoginShell direction={direction}>
      <section className="grid min-h-dvh place-items-center bg-[#eff6ff] px-5 dark:bg-[#07111f]">
        <div
          role="status"
          aria-label={
            direction === "rtl" ? "در حال آماده‌سازی پرتال دانش‌آموزی" : "Preparing student portal"
          }
          className="h-24 w-full max-w-sm animate-pulse rounded-[1.75rem] border border-sky-200/80 bg-white/80 shadow-xl dark:border-slate-700 dark:bg-slate-950/80"
        />
      </section>
    </LoginShell>
  );
}

function CrossPortalLoginMessage({ target }: { target: string }) {
  return (
    <LoginShell direction="rtl">
      <main className="grid min-h-dvh place-items-center bg-paper p-5" role="alert">
        <section className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950 shadow-sm dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <h1 className="text-lg font-black">این حساب در این پرتال قابل استفاده نیست.</h1>
          <p className="mt-2 text-sm leading-6">برای ادامه، نشانی درست را باز کنید.</p>
          <a
            href={target}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {target}
          </a>
        </section>
      </main>
    </LoginShell>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoginFormSkeleton() {
  return (
    <div role="status" className="animate-pulse space-y-3" aria-label="Loading" aria-busy="true">
      <div className="h-11 rounded-lg bg-[rgb(var(--surface-muted))]" />

      <div className="h-11 rounded-lg bg-[rgb(var(--surface-muted))]" />

      <div className="h-11 rounded-lg bg-brand/10" />
    </div>
  );
}
