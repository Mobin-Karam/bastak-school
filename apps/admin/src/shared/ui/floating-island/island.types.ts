export type FloatingIslandKind =
  "notification" | "system" | "attendance" | "class" | "prayer" | "reward";

export type FloatingIslandActivity = {
  id: string;
  kind: FloatingIslandKind;
  priority: number;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: { label: string; to: string };
};

export type FloatingIslandActivityPatch = Partial<Omit<FloatingIslandActivity, "id">>;
