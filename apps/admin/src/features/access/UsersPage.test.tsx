import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { ModalProvider } from "../../shared/ui/modal";
import { UsersPage } from "./UsersPage";
import { accessCopy } from "./model/access-copy";

const state = vi.hoisted(() => ({ manage: true, listUsers: vi.fn(), setUserActive: vi.fn() }));
vi.mock("../auth", () => ({
  useAuth: () => ({
    can: () => state.manage,
    hasRole: () => false,
    activeRole: "PRINCIPAL",
    context: { user: { id: "self" }, activeOrganization: { id: "school" } },
  }),
}));
vi.mock("./api/access.api", () => ({
  listUsers: state.listUsers,
  listOrganizations: vi.fn(),
  setUserActive: state.setUserActive,
  createUser: vi.fn(),
  archiveUser: vi.fn(),
  transferPlatformOwnership: vi.fn(),
  updateUser: vi.fn(),
  setUserRoles: vi.fn(),
}));
const copy = accessCopy.en;
function mount() {
  render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LocaleProvider>
          <ModalProvider>
            <UsersPage />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.setItem("moshaver-admin-location", "international");
  state.manage = true;
  state.listUsers.mockResolvedValue([
    {
      id: "self",
      firstName: "Current",
      username: "09111111111",
      status: "ACTIVE",
      assignments: [{ role: "PRINCIPAL", organizationId: "school" }],
    },
    {
      id: "staff",
      firstName: "Employee",
      username: "09222222222",
      status: "ACTIVE",
      assignments: [{ role: "TEACHER", organizationId: "school" }],
    },
  ]);
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it("opens account editing in a dialog from the shared action menu", async () => {
  mount();
  await screen.findByRole("table");
  const row = within(screen.getByRole("table")).getByText("Employee").closest("tr")!;
  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: copy.edit }));
  expect(screen.getByRole("dialog", { name: copy.editAccount("Employee") })).toBeInTheDocument();
  expect(screen.getByLabelText(copy.phoneNumber)).toHaveValue("09222222222");
});
it("hides destructive actions for the current account", async () => {
  mount();
  await screen.findByRole("table");
  const row = within(screen.getByRole("table")).getByText("Current").closest("tr")!;
  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  expect(screen.queryByRole("menuitem", { name: copy.disable })).not.toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: copy.archive })).not.toBeInTheDocument();
});
it("keeps read-only users out of account mutations and selection", async () => {
  state.manage = false;
  mount();
  await screen.findByRole("table");
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.newUser })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
});

it("keeps desktop details beside the table without opening a dialog", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(within(screen.getByRole("table")).getByText("Employee"));
  expect(
    within(screen.getByRole("complementary")).getByRole("heading", { name: "Employee" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("shows user details in a drawer on mobile", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  mount();
  await screen.findByRole("table");
  await userEvent.click(within(screen.getByRole("table")).getByText("Employee"));
  expect(screen.getByRole("dialog", { name: "Employee" })).toBeInTheDocument();
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});
it("validates account details before the access step and retains them when going back", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: copy.newUser }));
  const dialog = within(screen.getByRole("dialog", { name: copy.newUser }));
  await userEvent.click(dialog.getByRole("button", { name: "Continue" }));
  expect(dialog.getByLabelText(copy.phoneNumber)).toBeInTheDocument();
  await userEvent.type(dialog.getByLabelText(copy.phoneNumber), "09333333333");
  await userEvent.type(dialog.getByLabelText(copy.password), "ValidPassword123");
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "password");
  await userEvent.click(dialog.getByRole("button", { name: "Show password" }));
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "text");
  await userEvent.click(dialog.getByRole("button", { name: "Hide password" }));
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "password");
  await userEvent.click(dialog.getByRole("button", { name: "Continue" }));
  expect(dialog.getByLabelText(copy.role)).toBeInTheDocument();
  expect(dialog.queryByLabelText(copy.password)).not.toBeInTheDocument();
  await userEvent.click(dialog.getByRole("button", { name: "Back" }));
  expect(dialog.getByLabelText(copy.phoneNumber)).toHaveValue("09333333333");
  expect(dialog.getByLabelText(copy.password)).toHaveValue("ValidPassword123");
});
