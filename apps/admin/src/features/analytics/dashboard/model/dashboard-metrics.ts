import { type LucideIcon } from "lucide-react";

export type Metric = {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "red";
};
