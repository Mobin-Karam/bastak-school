import { RegistrationProvider } from "./registration.context.tsx";

export function RegistrationFeatureProvider({ children }: { children: React.ReactNode }) {
  return <RegistrationProvider>{children}</RegistrationProvider>;
}
