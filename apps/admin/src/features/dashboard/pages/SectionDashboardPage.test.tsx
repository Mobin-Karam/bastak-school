import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { SectionDashboardPage } from "./SectionDashboardPage";

vi.mock("../../auth", () => ({
  useAuth: () => ({
    activeRole: "ORGANIZATION_ADMIN",
    capabilities: ["chat.read", "student.live.read", "students.read", "users.read"],
  }),
}));

vi.mock("../hooks/useDashboardData", () => ({
  useDashboardData: () => ({
    summary: { data: { generatedAt: "2026-01-01T00:00:00.000Z" } },
    workQueue: { isLoading: false, isError: false, refetch: vi.fn() },
    workItems: [
      {
        id: "chat-1",
        type: "unread_chat",
        priority: "high",
        status: "open",
        title: "Unread conversation",
        description: "Unread conversation",
        descriptionKind: "system",
        deepLink: "/admin/communication/chat",
        dueAt: null,
        createdAt: null,
      },
      {
        id: "recovery-1",
        type: "recovery",
        priority: "normal",
        status: "open",
        title: "Recovery request",
        description: "Recovery request",
        descriptionKind: "system",
        deepLink: "/admin/follow-up",
        dueAt: null,
        createdAt: null,
      },
    ],
    refresh: vi.fn(),
    refreshing: false,
  }),
}));

describe("SectionDashboardPage", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("gives the Communication landing an English tool directory and only communication work", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <SectionDashboardPage section="ارتباط" />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Communication and follow-up workspace" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Conversations/i })).toHaveAttribute(
      "href",
      "/admin/communication/chat",
    );
    expect(screen.getAllByText("Conversation needing a response")).not.toHaveLength(0);
    expect(screen.queryByText("Plan recovery request")).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
