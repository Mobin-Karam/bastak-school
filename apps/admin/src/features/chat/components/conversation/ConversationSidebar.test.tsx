import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../group/GroupChatControls", () => ({
  CreateGroupButton: () => <button type="button">گروه جدید</button>,
}));
vi.mock("./CreateDirectButton", () => ({
  CreateDirectButton: () => <button type="button">گفتگوی جدید</button>,
}));

import { ConversationSidebar } from "./ConversationSidebar";
import { LocaleProvider } from "../../../../shared/ui/locale";

const defaults = {
  visible: true,
  items: [],
  activeId: undefined,
  search: "",
  filter: "all" as const,
  sort: "recent" as const,
  favoriteIds: new Set<string>(),
  drafts: {},
  total: 0,
  unread: 0,
  loading: false,
  error: false,
  fetching: false,
  hasMore: false,
  fetchingMore: false,
  onSearch: vi.fn(),
  onFilter: vi.fn(),
  onSort: vi.fn(),
  onSelect: vi.fn(),
  onToggleFavorite: vi.fn(),
  onRetry: vi.fn(),
  onMore: vi.fn(),
  onGroupCreated: vi.fn(),
};

describe("ConversationSidebar", () => {
  it("uses the shared list empty state while preserving chat controls", () => {
    render(
      <LocaleProvider>
        <ConversationSidebar {...defaults} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "گفتگوها" })).toBeInTheDocument();
    expect(screen.getByText("گفتگویی وجود ندارد.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "گفتگوی جدید" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "جستجوی گفتگوها" })).toBeInTheDocument();
  });

  it("uses the shared retry state when conversation loading fails", () => {
    render(
      <LocaleProvider>
        <ConversationSidebar {...defaults} error />
      </LocaleProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("دریافت گفتگوها ناموفق بود.");
    expect(screen.getByRole("button", { name: /تلاش دوباره/ })).toBeInTheDocument();
  });

  it("renders the operational controls in English when the workspace is LTR", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <ConversationSidebar {...defaults} />
      </LocaleProvider>,
    );

    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("heading", { name: "Conversations" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search conversations" })).toBeInTheDocument();
    expect(screen.getByText("There are no conversations.")).toBeInTheDocument();
    localStorage.removeItem("moshaver-admin-location");
  });
});
