import axe from "axe-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { ModalProvider } from "../../../shared/ui/modal";
import { OrganizationsPage } from "./OrganizationsPage";
import { accessCopy } from "./model/access-copy";
const state = vi.hoisted(() => ({
  list: vi.fn(),
  saveFeatures: vi.fn(),
  saveSignup: vi.fn(),
  saveProfile: vi.fn(),
  createStudent: vi.fn(),
  get: vi.fn(),
  canManage: true,
  platform: true,
  delegated: false,
}));
vi.mock("../auth", () => ({
  useAuth: () => ({
    can: (capability: string) =>
      capability === "system.manage"
        ? state.platform
        : capability !== "organization.manage" || state.canManage,
    context: { user: { id: "admin" }, activeOrganization: state.platform ? null : { id: "one" } },
  }),
}));
vi.mock("./OrganizationWorkspace", () => ({
  OrganizationWorkspace: () => <div>Members workspace</div>,
}));
vi.mock("../../../shared/api/api", () => ({ api: { get: state.get } }));
vi.mock("../../people/students/api/students.api.ts", () => ({ createStudent: state.createStudent }));
vi.mock("./api/access.api.ts", async (original) => ({
  ...(await original<typeof import("./api/access.api.ts")>()),
  listOrganizations: state.list,
  getPlatformStudentSignupPolicy: vi.fn().mockResolvedValue({ enabled: true }),
  setOrganizationFeatures: state.saveFeatures,
  setOrganizationStudentSignupPolicy: state.saveSignup,
  updateOrganizationAuthProfile: state.saveProfile,
}));
const copy = accessCopy.en;
function mount() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LocaleProvider>
        <ModalProvider>
          <main>
            <OrganizationsPage />
          </main>
        </ModalProvider>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}
async function openDirectory() {
  await userEvent.click(screen.getAllByRole("button", { name: "Choose organization" })[0]);
  return screen.findByRole("button", { name: "Actions for First school" });
}
beforeEach(() => {
  localStorage.setItem("moshaver-admin-location", "international");
  state.platform = true;
  state.canManage = true;
  state.list.mockResolvedValue([
    { id: "one", name: "First school", type: "SCHOOL", status: "ACTIVE", studentSignupLimit: 25 },
    { id: "two", name: "Second school", type: "SCHOOL", status: "ACTIVE", studentSignupLimit: 75 },
  ]);
  state.saveFeatures.mockResolvedValue({});
  state.saveSignup.mockResolvedValue({});
  state.saveProfile.mockResolvedValue({});
  state.createStudent.mockResolvedValue({ id: "new-student" });
  state.get.mockResolvedValue({
    grades: [{ id: 7, fa: "Grade 7" }],
    educationTypes: [{ id: "general", fa: "General" }],
    theoreticalTracks: [],
    vocationalFields: [],
    gradeStructure: [{ grades: [7], education_type_ids: ["general"], track_required: false }],
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
it("discards unsaved signup changes and uses the next organization's capacity", async () => {
  mount();
  await userEvent.click(await openDirectory());
  await userEvent.click(screen.getByRole("button", { name: "Signup settings" }));
  const capacity = screen.getByRole("spinbutton");
  expect(capacity).toHaveValue(25);
  await userEvent.clear(capacity);
  await userEvent.type(capacity, "40");
  await userEvent.click(
    within(screen.getByRole("dialog", { name: "Student signup access" })).getByRole("button", {
      name: "Cancel",
    }),
  );
  expect(state.saveSignup).not.toHaveBeenCalled();
  await openDirectory();
  await userEvent.click(screen.getByRole("button", { name: "Actions for Second school" }));
  await userEvent.click(screen.getByRole("button", { name: "Signup settings" }));
  expect(screen.getByRole("spinbutton")).toHaveValue(75);
});
it("stages feature changes until saved", async () => {
  mount();
  await userEvent.click(await openDirectory());
  await userEvent.click(screen.getByRole("button", { name: copy.manageFeatures }));
  await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(state.saveFeatures).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Select all" }));
  await userEvent.click(screen.getByRole("button", { name: copy.saveChanges }));
  await waitFor(() =>
    expect(state.saveFeatures).toHaveBeenCalledWith(
      "one",
      expect.arrayContaining(["PLANNER", "IMPORT_EXPORT"]),
    ),
  );
});
it("combines directory filters with search", async () => {
  mount();
  await openDirectory();
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: copy.accountStatus }),
    "ARCHIVED",
  );
  expect(screen.queryByText("First school")).not.toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(copy.searchOrganizations), "missing");
  await userEvent.click(screen.getAllByRole("button", { name: copy.clearSearch })[0]);
  expect(screen.getByText("First school")).toBeInTheDocument();
});
it("keeps failed signup saves open with an error", async () => {
  state.saveSignup.mockRejectedValue(new Error("Capacity could not be saved"));
  mount();
  await userEvent.click(await openDirectory());
  await userEvent.click(screen.getByRole("button", { name: "Signup settings" }));
  await userEvent.click(screen.getByRole("button", { name: "Save signup settings" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Capacity could not be saved");
});
it("never offers platform controls to principals with organization.manage", async () => {
  state.platform = false;
  mount();
  await screen.findByRole("heading", { name: "First school" });
  expect(screen.queryByRole("button", { name: copy.newOrganization })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Members and relationships" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("checkbox", { name: "Global student self-signup" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.manageFeatures })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Signup settings" })).not.toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("button", { name: "Choose organization" })[0]);
  expect(
    screen.queryByRole("button", { name: "Actions for First school" }),
  ).not.toBeInTheDocument();
});
it("saves a principal's school profile only after review", async () => {
  state.platform = false;
  mount();
  await screen.findByRole("heading", { name: "First school" });
  await userEvent.click(screen.getByRole("button", { name: /2.*School profile/ }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "School address" }),
    "Public school street",
  );
  await userEvent.type(screen.getByRole("textbox", { name: "School phone" }), "07612345678");
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Login heading" }),
    "Welcome to our school",
  );
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  await userEvent.click(
    screen.getByRole("checkbox", { name: "Publish on login and signup pages" }),
  );
  expect(state.saveProfile).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() =>
    expect(state.saveProfile).toHaveBeenCalledWith(
      "one",
      expect.objectContaining({
        address: "Public school street",
        phone: "07612345678",
        loginTitle: "Welcome to our school",
        published: true,
      }),
    ),
  );
});
it("creates a student in the selected school only after the three steps", async () => {
  state.platform = false;
  mount();
  await screen.findByRole("heading", { name: "First school" });
  await userEvent.click(screen.getByRole("button", { name: /3.*Student accounts/ }));
  await userEvent.type(screen.getByRole("textbox", { name: "Student full name" }), "New Student");
  await userEvent.type(
    screen.getByRole("textbox", { name: "Student mobile number" }),
    "09123456789",
  );
  await userEvent.type(
    screen.getByLabelText("Initial password (at least 12 characters)"),
    "initial-password-123",
  );
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Grade" }), "7");
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Education type" }),
    "general",
  );
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(state.createStudent).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Create student account" }));
  await waitFor(() =>
    expect(state.createStudent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Student", gradeId: "7", educationTypeId: "general" }),
      "one",
    ),
  );
});
it("has no automated accessibility violations in the school view and signup modal", async () => {
  state.platform = false;
  state.list.mockResolvedValue([
    {
      id: "one",
      name: "First school",
      type: "SCHOOL",
      status: "ACTIVE",
      studentSignupManagedByOrganization: true,
      studentSignupLimit: 25,
    },
  ]);
  mount();
  await screen.findByRole("heading", { name: "First school" });
  let result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
  await userEvent.click(screen.getByRole("button", { name: "Signup settings" }));
  expect(screen.queryByLabelText("Delegate to organization admin")).not.toBeInTheDocument();
  result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
});
