import { LockKeyhole } from "lucide-react";
import { Navigate } from "react-router-dom";

import { useLocale } from "../../../shared/ui/locale";

import { BackendHealthStatus } from "../components/BackendHealthStatus";

import { LoginForm } from "../components/LoginForm";
import { PlatformBootstrapForm } from "../components/PlatformBootstrapForm";
import { useAuth } from "../hooks/useAuth";
import { usePlatformBootstrap } from "../hooks/usePlatformBootstrap";
import { AuthLocaleProvider, resolveAuthLanguage, useAuthLocale } from "../model/auth-locale";
import { LoginShell, LoginToolbar } from "../components";

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
      <LoginPageContent />
    </AuthLocaleProvider>
  );
}

/* =========================================================
   CONTENT
   ========================================================= */

function LoginPageContent() {
  const auth = useAuth();
  const { copy } = useAuthLocale();

  const { loading, setupRequired, showBootstrap, openBootstrap, closeBootstrap } =
    usePlatformBootstrap();

  if (auth.status === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <LoginShell>
      <section
        className="
          flex min-h-dvh
          min-w-0 flex-col

          px-4

          pt-[max(1rem,env(safe-area-inset-top))]
          pb-[max(1rem,env(safe-area-inset-bottom))]

          sm:px-6

          md:min-h-[580px]
          md:px-8
          md:py-7

          lg:min-h-[600px]
          lg:px-10

          xl:min-h-[620px]
          xl:px-11
          xl:py-8
        "
      >
        <LoginToolbar />

        {/* =================================================
            MAIN AUTH FLOW
            ================================================= */}

        <div
          className="
            flex flex-1
            items-center justify-center

            py-7

            sm:py-9
            md:py-8
          "
        >
          <div className="w-full max-w-[26rem]">
            {/* ---------------------------------------------
                PAGE HEADING
                --------------------------------------------- */}

            <header className="mb-5 sm:mb-6">
              <div
                className="
                  mb-2
                  inline-flex items-center gap-1.5
                  text-[11px] font-bold
                  text-brand
                "
              >
                <LockKeyhole size={13} aria-hidden="true" />

                {showBootstrap ? copy.setupPlatform : copy.workspaceLogin}
              </div>

              <h1
                className="
                  text-2xl font-black
                  leading-tight
                  tracking-tight
                  text-ink

                  sm:text-[1.75rem]
                  lg:text-3xl
                "
              >
                {showBootstrap ? copy.createFirstAdmin : copy.welcome}
              </h1>

              <p
                className="
                  mt-2
                  max-w-sm
                  text-xs leading-6
                  text-slate-500
                  dark:text-slate-400

                  sm:text-sm
                "
              >
                {showBootstrap ? copy.setupDescription : copy.loginDescription}
              </p>
            </header>

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

        <footer
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
          {copy.securityNotice}
        </footer>
      </section>
    </LoginShell>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoginFormSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading" aria-busy="true">
      <div className="h-11 rounded-lg bg-[rgb(var(--surface-muted))]" />

      <div className="h-11 rounded-lg bg-[rgb(var(--surface-muted))]" />

      <div className="h-11 rounded-lg bg-brand/10" />
    </div>
  );
}
