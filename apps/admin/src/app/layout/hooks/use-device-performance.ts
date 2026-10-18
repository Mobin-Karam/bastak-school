import { useEffect, useState } from "react";
import { resolveAdminPerformanceProfile, type AdminPerformanceProfile } from "./device-performance";

type NavigatorWithDeviceHints = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
  };
  deviceMemory?: number;
};

function readDevicePerformance(): AdminPerformanceProfile {
  if (typeof window === "undefined") return "standard";
  const navigatorHints = navigator as NavigatorWithDeviceHints;
  return resolveAdminPerformanceProfile({
    prefersReducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    saveData: navigatorHints.connection?.saveData,
    effectiveType: navigatorHints.connection?.effectiveType,
    deviceMemory: navigatorHints.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  });
}

export function useDevicePerformance(): AdminPerformanceProfile {
  const [profile, setProfile] = useState<AdminPerformanceProfile>(readDevicePerformance);

  useEffect(() => {
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setProfile(readDevicePerformance());
    const connection = (navigator as NavigatorWithDeviceHints).connection;
    motionQuery?.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      motionQuery?.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return profile;
}
