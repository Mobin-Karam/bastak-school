import { BookOpenCheck, Languages, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DevBackendSwitcher } from "../../../app/dev/DevBackendSwitcher";
import { useLocale } from "../../../shared/ui/locale";
import { BackendHealthStatus } from "../components/BackendHealthStatus";
import { LoginForm } from "../components/LoginForm";
import { PlatformBootstrapForm } from "../components/PlatformBootstrapForm";
import { useAuth } from "../hooks/useAuth";
import { getPlatformBootstrapStatus } from "../api/auth.api";
import { AuthLocaleProvider, resolveAuthLanguage, useAuthLocale } from "../model/auth-locale";

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

function LoginPageContent() {
  const auth = useAuth();
  const { copy, direction, toggleLanguage } = useAuthLocale();
  const [setupRequired, setSetupRequired] = useState(false);
  const [showBootstrap, setShowBootstrap] = useState(false);

  useEffect(() => {
    void getPlatformBootstrapStatus()
      .then((result) => {
        setSetupRequired(result.setupRequired);
        setShowBootstrap(result.setupRequired);
      })
      .catch(() => undefined);
  }, []);

  if (auth.status === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main
      dir={direction}
      className="scroll-reveal relative h-dvh overflow-x-hidden overflow-y-auto bg-paper px-4 py-6 sm:px-6 lg:grid lg:place-items-center lg:px-8"
    >
      <div className="pointer-events-none absolute -top-24 -start-24 size-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -end-20 size-96 rounded-full bg-saffron/10 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:grid-cols-2">
        <section className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -start-20 top-24 size-64 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <BookOpenCheck size={24} />
              </span>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-teal-200">{copy.brandName}</p>
                <strong className="text-lg">{copy.productName}</strong>
              </div>
            </div>
            <h2 className="max-w-lg text-3xl font-black leading-[1.65]">{copy.heroTitle}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">{copy.heroDescription}</p>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-3">
            <LoginBenefit
              icon={<UsersRound size={19} />}
              title={copy.benefitRoleTitle}
              text={copy.benefitRoleText}
            />
            <LoginBenefit
              icon={<ShieldCheck size={19} />}
              title={copy.benefitSecureTitle}
              text={copy.benefitSecureText}
            />
            <LoginBenefit
              icon={<BookOpenCheck size={19} />}
              title={copy.benefitUnifiedTitle}
              text={copy.benefitUnifiedText}
            />
          </div>
        </section>
        <section className="flex min-h-[620px] flex-col p-5 sm:p-8 lg:min-h-[680px] lg:p-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand text-white">
                <LockKeyhole size={21} />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-brand">MOSHAVER</p>
                <strong>مشاور</strong>
              </div>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-brand/30 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 dark:border-slate-700 dark:text-slate-200"
                aria-label={copy.languageSwitch}
                onClick={toggleLanguage}
              >
                <Languages size={16} aria-hidden="true" />
                {copy.languageSwitch}
              </button>
              <DevBackendSwitcher />
            </div>
          </div>
          <div className="my-auto py-8">
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold text-brand">
                {showBootstrap ? copy.setupPlatform : copy.workspaceLogin}
              </p>
              <h1 className="text-2xl font-black sm:text-3xl">
                {showBootstrap ? copy.createFirstAdmin : copy.welcome}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {showBootstrap ? copy.setupDescription : copy.loginDescription}
              </p>
            </div>
            <BackendHealthStatus />
            {showBootstrap ? (
              <PlatformBootstrapForm onBack={() => setShowBootstrap(false)} />
            ) : (
              <>
                <LoginForm />
                {setupRequired ? (
                  <button
                    type="button"
                    className="mt-4 w-full text-center text-sm font-bold text-brand underline-offset-4 hover:underline"
                    onClick={() => setShowBootstrap(true)}
                  >
                    {copy.createPlatformOwner}
                  </button>
                ) : null}
              </>
            )}
          </div>
          <p className="text-center text-[11px] text-slate-400">{copy.securityNotice}</p>
        </section>
      </div>
    </main>
  );
}

function LoginBenefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <span className="mb-3 grid size-9 place-items-center rounded-xl bg-teal-300/10 text-teal-200">
        {icon}
      </span>
      <strong className="block text-sm">{title}</strong>
      <span className="mt-1 block text-[11px] text-slate-400">{text}</span>
    </div>
  );
}
