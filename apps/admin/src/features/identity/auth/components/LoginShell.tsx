import { AuthThemeProvider } from "../../../../shared/theme/theme";
import { usePublicSchoolProfile } from "./PublicSchoolProfile";
import type { ReactNode } from "react";

type LoginShellProps = {
  children: ReactNode;
  direction?: "rtl" | "ltr";
  showHero?: boolean;
};

export function LoginShell({ children, direction = "rtl" }: LoginShellProps) {
  const { school } = usePublicSchoolProfile();
  return (
    <AuthThemeProvider>
      <main
        dir={direction}
        className="relative isolate min-h-dvh bg-[rgb(var(--surface-card))] text-ink"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${school?.profile.backgroundUrl || "/bg-login.png"}")` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[rgb(var(--surface-card))]/[0.85]"
        />
        <div className="mx-auto flex w-full max-w-lg flex-col">{children}</div>
      </main>
    </AuthThemeProvider>
  );
}
