import axe from "axe-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { ModalProvider } from "../../../shared/ui/modal";
import { UsersPage } from "./UsersPage";
import { accessCopy } from "./model/access-copy";

const state = vi.hoisted(() => ({
  manage: true,
  listUsers: vi.fn(),
  setUserActive: vi.fn(),
  updateUser: vi.fn(),
  setUserRoles: vi.fn(),
  createUser: vi.fn(),
  archiveUser: vi.fn(),
}));
vi.mock("../auth", () => ({
  useAuth: () => ({
    can: () => state.manage,
    hasRole: () => false,
    activeRole: "PRINCIPAL",
    context: { user: { id: "self" }, activeOrganization: { id: "school" } },
  }),
}));
vi.mock("./api/access.api.ts", () => ({
  listUsers: state.listUsers,
  listOrganizations: vi.fn(),
  setUserActive: state.setUserActive,
  createUser: state.createUser,
  archiveUser: state.archiveUser,
  transferPlatformOwnership: vi.fn(),
  updateUser: state.updateUser,
  setUserRoles: state.setUserRoles,
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
  expect(state.listUsers).toHaveBeenCalledWith("school", true);
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
it("lets a principal archive a staff account in their active school", async () => {
  mount();
  await screen.findByRole("table");
  const row = within(screen.getByRole("table")).getByText("Employee").closest("tr")!;

  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: copy.archive }));
  const dialog = screen.getByRole("dialog", { name: copy.archiveAccountTitle });
  await userEvent.type(
    within(dialog).getByLabelText(`Confirmation phrase ${copy.archive}`),
    copy.archive,
  );
  await userEvent.click(within(dialog).getByRole("button", { name: copy.archive }));

  await waitFor(() => expect(state.archiveUser).toHaveBeenCalledWith("staff", expect.anything()));
});
it("keeps read-only users out of account mutations and selection", async () => {
  state.manage = false;
  mount();
  await screen.findByRole("table");
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.newUser })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
});

it("opens selected staff details in a drawer on desktop", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(within(screen.getByRole("table")).getByText("Employee"));
  expect(screen.getByRole("dialog", { name: "Employee" })).toBeInTheDocument();
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
it("shows every account field in the single-step staff creation drawer", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: copy.newUser }));
  const dialog = within(screen.getByRole("dialog", { name: copy.newUser }));
  expect(dialog.getByLabelText(copy.phoneNumber)).toBeInTheDocument();
  await userEvent.type(dialog.getByLabelText(copy.phoneNumber), "09333333333");
  await userEvent.type(dialog.getByLabelText(copy.password), "ValidPassword123");
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "password");
  await userEvent.click(dialog.getByRole("button", { name: "Show password" }));
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "text");
  await userEvent.click(dialog.getByRole("button", { name: "Hide password" }));
  expect(dialog.getByLabelText(copy.password)).toHaveAttribute("type", "password");
  expect(dialog.getByLabelText(copy.role)).toBeInTheDocument();
  expect(dialog.getByLabelText(copy.phoneNumber)).toHaveValue("09333333333");
  expect(dialog.getByLabelText(copy.password)).toHaveValue("ValidPassword123");
  expect(dialog.queryByRole("checkbox", { name: "Student" })).not.toBeInTheDocument();
});

it("preserves all roles when saving only profile details", async () => {
  state.listUsers.mockResolvedValue([
    {
      id: "staff",
      firstName: "Employee",
      username: "09222222222",
      status: "ACTIVE",
      assignments: [
        { role: "TEACHER", organizationId: "school" },
        { role: "SCHOOL_SUPERVISOR", organizationId: "school" },
        { role: "COUNSELOR", organizationId: "school" },
      ],
    },
  ]);
  mount();
  const row = within(await screen.findByRole("table"))
    .getByText("Employee")
    .closest("tr")!;
  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: copy.edit }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("checkbox", { name: "Teacher" })).toBeChecked();
  expect(dialog.getByRole("checkbox", { name: "School supervisor" })).toBeChecked();
  await userEvent.clear(dialog.getByLabelText(copy.firstName));
  await userEvent.type(dialog.getByLabelText(copy.firstName), "Updated");
  await userEvent.click(dialog.getByRole("button", { name: copy.saveChanges }));
  expect(state.updateUser).toHaveBeenCalledWith(
    "staff",
    expect.objectContaining({ firstName: "Updated" }),
  );
  expect(state.setUserRoles).not.toHaveBeenCalled();
});
it("submits a principal password reset without a current-password field", async () => {
  mount();
  const row = within(await screen.findByRole("table"))
    .getByText("Employee")
    .closest("tr")!;
  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: copy.edit }));
  const drawer = within(screen.getByRole("dialog", { name: copy.editAccount("Employee") }));
  await userEvent.type(drawer.getByLabelText(copy.resetPassword), "ReplacementPassword123");
  await userEvent.click(drawer.getByRole("button", { name: copy.saveChanges }));
  await waitFor(() =>
    expect(state.updateUser).toHaveBeenCalledWith(
      "staff",
      expect.objectContaining({ password: "ReplacementPassword123" }),
    ),
  );
});
it("lets a principal update every operational school role", async () => {
  state.listUsers.mockResolvedValue([
    {
      id: "staff",
      firstName: "Employee",
      username: "09222222222",
      status: "ACTIVE",
      assignments: [
        { role: "TEACHER", organizationId: "school" },
        { role: "SCHOOL_SUPERVISOR", organizationId: "school" },
        { role: "COUNSELOR", organizationId: "school" },
      ],
    },
  ]);
  mount();
  const row = within(await screen.findByRole("table"))
    .getByText("Employee")
    .closest("tr")!;
  await userEvent.click(within(row).getByRole("button", { name: /actions/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: copy.edit }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("checkbox", { name: "Counselor" })).not.toBeDisabled();
  await userEvent.click(dialog.getByRole("checkbox", { name: "Teacher" }));
  await userEvent.click(dialog.getByRole("button", { name: copy.saveChanges }));
  expect(state.updateUser).not.toHaveBeenCalled();
  expect(state.setUserRoles).toHaveBeenCalledWith("staff", {
    roleCodes: ["SCHOOL_SUPERVISOR", "COUNSELOR"],
    organizationId: "school",
  });
});
it("shows the full operational school role catalog when a principal creates an account", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: copy.newUser }));
  const dialog = within(screen.getByRole("dialog"));
  await userEvent.type(dialog.getByLabelText(copy.phoneNumber), "09333333333");
  await userEvent.type(dialog.getByLabelText(copy.password), "ValidPassword123");
  expect(dialog.getByRole("checkbox", { name: "Guardian" })).toBeEnabled();
  expect(dialog.getByRole("checkbox", { name: "Counselor" })).toBeEnabled();
  expect(dialog.getByRole("checkbox", { name: "Content manager" })).toBeEnabled();
  expect(dialog.getByRole("checkbox", { name: "School administrator" })).toBeEnabled();
  expect(dialog.queryByRole("checkbox", { name: "Disciplinarian" })).not.toBeInTheDocument();
});
it("creates one account with supervisor and teacher roles", async () => {
  mount();
  await screen.findByRole("table");
  await userEvent.click(screen.getByRole("button", { name: copy.newUser }));
  const dialog = within(screen.getByRole("dialog"));
  await userEvent.type(dialog.getByLabelText(copy.phoneNumber), "09333333333");
  await userEvent.type(dialog.getByLabelText(copy.password), "ValidPassword123");
  await userEvent.click(dialog.getByRole("checkbox", { name: "Teacher" }));
  await userEvent.click(dialog.getByRole("checkbox", { name: "School supervisor" }));
  await userEvent.click(dialog.getByRole("button", { name: copy.createAccount }));
  expect(state.createUser).toHaveBeenCalledWith(
    expect.objectContaining({
      roleCodes: ["TEACHER", "SCHOOL_SUPERVISOR"],
      organizationId: "school",
    }),
  );
});

it.each([false, true])(
  "keeps multi-role selection keyboard accessible (mobile=%s)",
  async (mobile) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    mount();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: copy.newUser }));
    const element = screen.getByRole("dialog");
    const dialog = within(element);
    await userEvent.type(dialog.getByLabelText(copy.phoneNumber), "09333333333");
    await userEvent.type(dialog.getByLabelText(copy.password), "ValidPassword123");
    const teacher = dialog.getByRole("checkbox", { name: "Teacher" });
    teacher.focus();
    await userEvent.keyboard("[Space]");
    expect(teacher).toBeChecked();
    expect(
      (await axe.run(element, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toEqual([]);
  },
);
