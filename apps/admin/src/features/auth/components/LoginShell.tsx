import type { ReactNode } from "react";

import { useAuthLocale } from "../model/auth-locale";

import { LoginHero } from "./LoginHero";

type LoginShellProps = {
  children: ReactNode;
};

export function LoginShell({ children }: LoginShellProps) {
  const { direction } = useAuthLocale();

  return (
    <main
      dir={direction}
      className="
        relative
        min-h-dvh
        overflow-x-hidden
        bg-paper
        text-ink

        md:grid
        md:place-items-center
        md:p-5

        lg:p-6
        xl:p-8
      "
    >
      {/* Large-screen decoration only */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -start-40 -top-40
          hidden size-[32rem]
          rounded-full
          bg-brand/[0.05]
          blur-3xl
          md:block
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -bottom-48 -end-40
          hidden size-[34rem]
          rounded-full
          bg-saffron/[0.05]
          blur-3xl
          md:block
        "
      />

      <div
        className="
          relative z-[1]
          mx-auto
          grid
          min-h-dvh
          w-full

          bg-[rgb(var(--surface-card))]

          md:min-h-0
          md:max-w-xl
          md:overflow-hidden
          md:rounded-3xl
          md:border
          md:border-[rgb(var(--border-subtle))]
          md:shadow-xl

          lg:max-w-2xl

          xl:max-w-6xl
          xl:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1fr)]
        "
      >
        <LoginHero />

        {children}
      </div>
    </main>
  );
}
