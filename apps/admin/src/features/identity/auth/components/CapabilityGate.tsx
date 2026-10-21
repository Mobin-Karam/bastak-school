import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

type Props = {
  capability?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Declarative UI gate for optional controls inside an already-authorized page.
 * API authorization remains the source of truth for every request.
 */
export function CapabilityGate({ capability, anyOf, allOf, fallback = null, children }: Props) {
  const auth = useAuth();
  const allowed =
    (!capability || auth.can(capability)) &&
    (!anyOf?.length || auth.canAny(anyOf)) &&
    (!allOf?.length || auth.canAll(allOf));
  return allowed ? <>{children}</> : <>{fallback}</>;
}
