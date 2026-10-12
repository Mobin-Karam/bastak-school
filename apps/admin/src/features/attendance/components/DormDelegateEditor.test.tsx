import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { DormDelegateEditor } from "./DormDelegateEditor";
const mocks = vi.hoisted(() => ({
  delegates: vi.fn(),
  residents: vi.fn(),
  all: vi.fn(),
  room: vi.fn(),
  revokeAll: vi.fn(),
  revokeRoom: vi.fn(),
}));
vi.mock("../api/attendance-operations.api", () => ({
  getDormDelegates: mocks.delegates,
  getDormResidents: mocks.residents,
  setDormWideDelegate: mocks.all,
  setDormDelegate: mocks.room,
  revokeDormWideDelegate: mocks.revokeAll,
  revokeDormDelegate: mocks.revokeRoom,
}));
vi.mock("../../../shared/ui/notifications", () => ({ notify: vi.fn() }));
function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.delegates.mockResolvedValue([]);
  mocks.residents.mockResolvedValue([
    { id: "resident", name: "علی", userId: "account", organizationId: "school" },
  ]);
  mocks.all.mockResolvedValue([]);
  mocks.revokeAll.mockResolvedValue({ revoked: true });
});
describe("dorm delegation scopes", () => {
  it("assigns a school dorm resident to all rooms through the explicit all-room endpoint", async () => {
    const user = userEvent.setup();
    render(<DormDelegateEditor roomId="all" members={[]} scope="school" />, { wrapper: Providers });
    await user.click(screen.getByText("مسئول حضور تمام اتاق‌های خوابگاه"));
    await screen.findByRole("option", { name: "علی" });
    await user.selectOptions(screen.getByRole("combobox"), "resident");
    await user.click(
      screen.getByRole("button", { name: "تعیین مسئول تمام اتاق‌های خوابگاه و بازه" }),
    );
    await waitFor(() => expect(mocks.all).toHaveBeenCalledOnce());
    expect(mocks.all.mock.calls[0][0]).toMatchObject({
      studentId: "resident",
      startsOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endsOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(mocks.room).not.toHaveBeenCalled();
  });
  it("revokes the all-room responsibility through its scoped endpoint", async () => {
    mocks.delegates.mockResolvedValue([
      {
        id: "grant",
        roomId: "room",
        roomName: "اتاق",
        studentId: "resident",
        studentName: "علی",
        startsOn: "2026-10-11",
        endsOn: "2026-10-12",
        revoked: false,
        dormWide: true,
      },
    ]);
    const user = userEvent.setup();
    render(<DormDelegateEditor roomId="all" members={[]} scope="school" />, { wrapper: Providers });
    await user.click(await screen.findByText("مسئول حضور تمام اتاق‌های خوابگاه: علی"));
    await user.click(screen.getByRole("button", { name: "لغو مسئولیت" }));
    await waitFor(() => expect(mocks.revokeAll).toHaveBeenCalledOnce());
    expect(mocks.revokeRoom).not.toHaveBeenCalled();
  });
  it("keeps room-only delegation limited to the supplied roster", async () => {
    render(
      <DormDelegateEditor
        roomId="room"
        members={[
          { id: "resident", name: "علی", userId: "account", studentNumber: "", status: "unmarked" },
        ]}
        scope="school"
      />,
      { wrapper: Providers },
    );
    await screen.findByText("مسئول حضور اتاق");
    expect(mocks.residents).not.toHaveBeenCalled();
  });
});
