import {
  Shield,
  Building2,
  FileText,
  Users,
  GraduationCap,
  Compass,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

export type UserRole =
  | "PLATFORM_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "CONTENT_MANAGER"
  | "MENTOR"
  | "TEACHER"
  | "ADVISOR"
  | "GUARDIAN";

export const ROLE_CONFIG: Record<UserRole, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
  PLATFORM_ADMIN: { tone: "red", icon: Shield, label: "Platform Admin" },
  ORGANIZATION_ADMIN: { tone: "amber", icon: Building2, label: "Organization Admin" },
  CONTENT_MANAGER: { tone: "amber", icon: FileText, label: "Content Manager" },
  MENTOR: { tone: "blue", icon: Users, label: "Mentor" },
  TEACHER: { tone: "green", icon: GraduationCap, label: "Teacher" },
  ADVISOR: { tone: "blue", icon: Compass, label: "Advisor" },
  GUARDIAN: { tone: "neutral", icon: HeartHandshake, label: "Guardian" },
};

export function getRoleConfig(role: string | undefined): {
  tone: BadgeTone;
  icon: LucideIcon;
  label: string;
} {
  return (
    ROLE_CONFIG[role as UserRole] ?? {
      tone: "neutral" as BadgeTone,
      icon: Users,
      label: role,
    }
  );
}
