import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { defaultTableQuery, type DataTableQuery } from "./data-table-types";

const querySchema = z.object({
  search: z.string().max(500),
  filters: z.array(z.object({ id: z.string(), value: z.string() })).max(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).max(20),
  pagination: z.object({
    pageIndex: z.number().int().min(0).max(100000),
    pageSize: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
  }),
});

/** Optional URL adapter. Server consumers can instead own query state alongside useQuery. */
export function useDataTableUrlQuery(key: string) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const query = useMemo(() => {
    try {
      const parsed = querySchema.safeParse(JSON.parse(raw || "null"));
      if (parsed.success) return parsed.data;
    } catch {
      /* An invalid URL falls back to a safe default. */
    }
    return defaultTableQuery;
  }, [raw]);
  const onQueryChange = (next: DataTableQuery) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (JSON.stringify(next) === JSON.stringify(defaultTableQuery)) updated.delete(key);
        else updated.set(key, JSON.stringify(next));
        return updated;
      },
      { replace: true },
    );
  return { query, onQueryChange };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

const preferencesSchema = z.object({
  visibility: z.record(z.string(), z.boolean()),
  mode: z.enum(["auto", "table", "cards"]),
  density: z.enum(["comfortable", "compact"]),
});
export function useTablePreferences(key?: string) {
  const [preferences, setPreferences] = useState<z.infer<typeof preferencesSchema>>(() => {
    try {
      const parsed = preferencesSchema.safeParse(
        JSON.parse(key ? localStorage.getItem(key) || "null" : "null"),
      );
      if (parsed.success) return parsed.data;
    } catch {
      /* Browser storage may be disabled. */
    }
    return { visibility: {}, mode: "auto", density: "comfortable" };
  });
  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* Preferences remain usable in memory. */
    }
  }, [key, preferences]);
  return [preferences, setPreferences] as const;
}
