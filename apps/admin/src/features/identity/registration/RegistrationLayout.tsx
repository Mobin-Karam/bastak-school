import { RegistrationComingSoonPage } from "./pages/RegistrationComingSoonPage";

/**
 * Compatibility boundary for older registration entry points.  The full
 * workflow is intentionally not live yet, so this component must never issue
 * its former registration API request.
 */
export function RegistrationLayout() {
  return <RegistrationComingSoonPage />;
}
