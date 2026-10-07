export type AdminPerformanceProfile = "reduced" | "standard" | "enhanced";

export type DevicePerformanceSignals = {
  prefersReducedMotion?: boolean;
  saveData?: boolean;
  effectiveType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

/**
 * Choose presentation quality only. This must never change available routes,
 * data, or authorization: a constrained device receives the same product with
 * fewer decorative effects.
 */
export function resolveAdminPerformanceProfile({
  prefersReducedMotion,
  saveData,
  effectiveType,
  deviceMemory,
  hardwareConcurrency,
}: DevicePerformanceSignals): AdminPerformanceProfile {
  const slowConnection = effectiveType === "slow-2g" || effectiveType === "2g";
  const constrainedMemory = typeof deviceMemory === "number" && deviceMemory <= 2;
  const constrainedCpu =
    typeof hardwareConcurrency === "number" && hardwareConcurrency > 0 && hardwareConcurrency <= 2;

  if (prefersReducedMotion || saveData || slowConnection || constrainedMemory || constrainedCpu) {
    return "reduced";
  }

  const hasComfortableMemory = typeof deviceMemory === "number" && deviceMemory >= 4;
  const hasComfortableCpu = typeof hardwareConcurrency === "number" && hardwareConcurrency >= 6;
  return hasComfortableMemory && hasComfortableCpu ? "enhanced" : "standard";
}
