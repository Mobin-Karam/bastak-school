import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FloatingIslandActivity, FloatingIslandActivityPatch } from "./island.types";

type FloatingIslandApi = {
  activities: readonly FloatingIslandActivity[];
  expandedId: string | null;
  show: (activity: FloatingIslandActivity) => void;
  update: (id: string, patch: FloatingIslandActivityPatch) => void;
  dismiss: (id: string) => void;
  reset: () => void;
  expand: (id: string) => void;
  collapse: () => void;
};

const FloatingIslandContext = createContext<FloatingIslandApi | null>(null);

function byPriority(left: FloatingIslandActivity, right: FloatingIslandActivity) {
  return right.priority - left.priority || left.id.localeCompare(right.id);
}

export function FloatingIslandProvider({
  children,
  scopeKey,
}: {
  children: ReactNode;
  scopeKey?: string;
}) {
  const [activities, setActivities] = useState<FloatingIslandActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const previousScopeKey = useRef(scopeKey);
  const dismissTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearDismissTimer = useCallback((id: string) => {
    const timer = dismissTimers.current.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    dismissTimers.current.delete(id);
  }, []);

  const clearDismissTimers = useCallback(() => {
    dismissTimers.current.forEach((timer) => clearTimeout(timer));
    dismissTimers.current.clear();
  }, []);

  useEffect(() => clearDismissTimers, [clearDismissTimers]);

  useEffect(() => {
    if (previousScopeKey.current === scopeKey) return;
    previousScopeKey.current = scopeKey;
    clearDismissTimers();
    setActivities([]);
    setExpandedId(null);
  }, [clearDismissTimers, scopeKey]);

  const dismiss = useCallback(
    (id: string) => {
      clearDismissTimer(id);
      setActivities((current) => current.filter((activity) => activity.id !== id));
      setExpandedId((current) => (current === id ? null : current));
    },
    [clearDismissTimer],
  );

  const show = useCallback(
    (activity: FloatingIslandActivity) => {
      clearDismissTimer(activity.id);
      setActivities((current) => {
        const next = [...current.filter((item) => item.id !== activity.id), activity].sort(
          byPriority,
        );
        return next;
      });
      if (activity.duration && activity.duration > 0) {
        const timer = setTimeout(() => dismiss(activity.id), activity.duration);
        dismissTimers.current.set(activity.id, timer);
      }
    },
    [clearDismissTimer, dismiss],
  );

  const update = useCallback((id: string, patch: FloatingIslandActivityPatch) => {
    setActivities((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)).sort(byPriority),
    );
  }, []);

  const reset = useCallback(() => {
    clearDismissTimers();
    setActivities([]);
    setExpandedId(null);
  }, [clearDismissTimers]);
  const collapse = useCallback(() => setExpandedId(null), []);

  const value = useMemo<FloatingIslandApi>(
    () => ({
      activities,
      expandedId,
      show,
      update,
      dismiss,
      reset,
      expand: setExpandedId,
      collapse,
    }),
    [activities, collapse, dismiss, expandedId, reset, show, update],
  );

  return <FloatingIslandContext.Provider value={value}>{children}</FloatingIslandContext.Provider>;
}

export function useFloatingIsland() {
  const value = useContext(FloatingIslandContext);
  if (!value) throw new Error("useFloatingIsland must be used inside FloatingIslandProvider.");
  return value;
}
