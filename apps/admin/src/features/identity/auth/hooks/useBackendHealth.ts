import { useCallback, useEffect, useRef, useState } from "react";
import { checkBackendHealth } from "../api/auth.api.ts";
import type { BackendHealth } from "../model/auth.types.ts";

type BackendHealthState = {
  status: "checking" | "ready" | "unavailable";
  data?: BackendHealth;
  error?: string;
  checkedAt?: number;
};

export function useBackendHealth() {
  const [health, setHealth] = useState<BackendHealthState>({
    status: "checking",
  });
  const requestId = useRef(0);

  const checkHealth = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setHealth((current) => ({ ...current, status: "checking", error: undefined }));

    try {
      const data = await checkBackendHealth();
      if (requestId.current !== currentRequest) return;
      setHealth({ status: "ready", data, checkedAt: Date.now() });
    } catch {
      if (requestId.current !== currentRequest) return;
      setHealth({
        status: "unavailable",
        error: "این بک‌اند در دسترس نیست.",
        checkedAt: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    return () => {
      requestId.current += 1;
    };
  }, [checkHealth]);

  return {
    health,
    checkHealth,
  };
}
