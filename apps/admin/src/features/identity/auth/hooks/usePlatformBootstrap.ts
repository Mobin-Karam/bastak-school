import { useCallback, useEffect, useState } from "react";

import { getPlatformBootstrapStatus } from "../api/auth.api.ts";

export function usePlatformBootstrap() {
  const [setupRequired, setSetupRequired] = useState(false);
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getPlatformBootstrapStatus()
      .then((result) => {
        if (!active) return;

        setSetupRequired(result.setupRequired);
        setShowBootstrap(result.setupRequired);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const openBootstrap = useCallback(() => {
    setShowBootstrap(true);
  }, []);

  const closeBootstrap = useCallback(() => {
    setShowBootstrap(false);
  }, []);

  return {
    loading,
    setupRequired,
    showBootstrap,
    openBootstrap,
    closeBootstrap,
  };
}
