import type { ReactNode } from "react";

import { LoginHero } from "./LoginHero";

type LoginShellProps = {
  children: ReactNode;
  direction?: "rtl" | "ltr";
  showHero?: boolean;
};

export function LoginShell({ children, direction = "rtl", showHero = true }: LoginShellProps) {
  return (
    <main
      dir={direction}
      className="
        relative
        min-h-dvh
        overflow-x-hidden
        bg-[#0e324d]
        text-ink

        md:grid
        md:place-items-center
        md:p-5

        lg:p-6
        xl:p-8
      "
    >
      <div
        aria-hidden="true"
        className="
          absolute inset-0 bg-cover bg-center bg-no-repeat
          opacity-35
          md:opacity-45
        "
        style={{ backgroundImage: "url('/bg-login.png')" }}
      />

      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-[linear-gradient(110deg,rgb(5_42_61_/_92%),rgb(8_68_74_/_72%),rgb(12_44_63_/_88%))]
        "
      />

      <div
        className="
          relative z-[1]
          mx-auto
          grid
          min-h-dvh
          w-full

          bg-[rgb(var(--surface-card))]/[0.97]
          shadow-[0_24px_70px_rgb(3_28_42_/_35%)]
          backdrop-blur-sm

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
        {showHero ? <LoginHero /> : null}

        {children}
      </div>
    </main>
  );
}
