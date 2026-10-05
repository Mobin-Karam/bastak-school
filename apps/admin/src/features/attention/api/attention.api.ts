import { api } from "../../../shared/api/api";

export type AttentionItem = {
  id: string;
  type:
    "recovery" | "task_issue" | "retry_request" | "unread_chat" | "sync_failure" | "inactive_user";
  title: string;
  description: string;
  descriptionKind?: "system" | "user";
  priority: "urgent" | "high" | "normal";
  owner: { id: string; label: string };
  dueAt: string | null;
  status: "open";
  student?: { id: string; name: string };
  deepLink: string;
  createdAt: string | null;
};

export type AttentionQueue = { generatedAt: string; items: AttentionItem[] };

export function getAttentionQueue(limit = 100) {
  return api.get<AttentionQueue>(`/dashboard/attention?limit=${Math.min(100, Math.max(1, limit))}`);
}
