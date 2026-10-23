import axe from "axe-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ModalProvider } from "../../../../shared/ui/modal";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ClassGroupsPage } from "./ClassGroupsPage";
const state = vi.hoisted(() => ({
  classes: vi.fn(),
  groups: vi.fn(),
  members: vi.fn(),
  students: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  manage: true,
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: (capability: string) => capability !== "class_groups.manage" || state.manage,
    activeRole: "PRINCIPAL",
    context: { user: { id: "staff" }, activeOrganization: { id: "school" } },
  }),
}));
vi.mock("../api/class-groups.api.ts", () => ({
  listGroupClasses: state.classes,
  listClassGroups: state.groups,
  listGroupMembers: state.members,
  listGroupStudents: state.students,
  createClassGroup: state.create,
  updateClassGroup: state.update,
  setGroupMembers: state.save,
  deleteClassGroup: state.remove,
}));
const alpha = {
  id: "group-a",
  name: "Alpha",
  code: "alpha",
  description: "First group",
  status: "ACTIVE",
  organizationId: "school",
  classId: "class-a",
  className: "Class A",
  memberCount: 1,
};
const beta = { ...alpha, id: "group-b", name: "Beta", code: "beta", classId: "class-b" };
function mount() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LocaleProvider>
        <ModalProvider>
          <main>
            <ClassGroupsPage />
          </main>
        </ModalProvider>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}
async function openMembers() {
  await userEvent.click(await screen.findByRole("button", { name: "Members of Alpha" }));
  return screen.findByRole("dialog", { name: "Members of Alpha" });
}
beforeEach(() => {
  localStorage.setItem("moshaver-admin-location", "international");
  state.manage = true;
  state.classes.mockResolvedValue([
    {
      id: "class-a",
      name: "Class A",
      code: "a",
      status: "ACTIVE",
      organizationId: "school",
      organizationName: "School",
      enrollmentCount: 2,
    },
    {
      id: "class-b",
      name: "Class B",
      code: "b",
      status: "ACTIVE",
      organizationId: "school",
      organizationName: "School",
      enrollmentCount: 1,
    },
  ]);
  state.groups.mockImplementation(async (id: string) => (id === "class-a" ? [alpha] : [beta]));
  state.members.mockResolvedValue([{ id: "alice", name: "Alice" }]);
  state.students.mockResolvedValue([
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
  ]);
  state.create.mockResolvedValue(alpha);
  state.update.mockResolvedValue(alpha);
  state.save.mockResolvedValue({ groupId: "group-a", count: 2 });
  state.remove.mockResolvedValue({ deleted: true });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
it("stages member changes and saves the complete selection for the chosen group", async () => {
  mount();
  const drawer = await openMembers();
  expect(await within(drawer).findByRole("checkbox", { name: "Alice" })).toBeChecked();
  await userEvent.click(screen.getByRole("checkbox", { name: "Bob" }));
  expect(state.save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Save members" }));
  await waitFor(() => expect(state.save).toHaveBeenCalledWith("group-a", ["alice", "bob"]));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
it("does not allow an empty roster save when loading members fails", async () => {
  state.members.mockRejectedValue(new Error("offline"));
  mount();
  await openMembers();
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load data");
  expect(screen.getByRole("button", { name: "Save members" })).toBeDisabled();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(state.save).not.toHaveBeenCalled();
});
it("retains selected members and exposes the error after a failed write", async () => {
  state.save.mockRejectedValue(new Error("Roster could not be saved"));
  mount();
  await openMembers();
  await userEvent.click(await screen.findByRole("checkbox", { name: "Bob" }));
  await userEvent.click(screen.getByRole("button", { name: "Save members" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Roster could not be saved");
  expect(screen.getByRole("checkbox", { name: "Bob" })).toBeChecked();
});
it("requires an explicit discard before closing unsaved changes", async () => {
  mount();
  await openMembers();
  await userEvent.click(await screen.findByRole("checkbox", { name: "Bob" }));
  await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
  expect(screen.getByRole("dialog", { name: "Members of Alpha" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(state.save).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
it("hides management actions and reads only current members for viewers", async () => {
  state.manage = false;
  mount();
  await screen.findByRole("heading", { name: "Alpha" });
  expect(screen.queryByRole("button", { name: "Create group" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit Alpha" })).not.toBeInTheDocument();
  await openMembers();
  await screen.findByText("Alice");
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(state.students).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Save members" })).not.toBeInTheDocument();
});
it("keeps class switches isolated from late responses for the previous class", async () => {
  let resolveFirst: (value: (typeof alpha)[]) => void = () => {};
  state.groups.mockImplementation((id: string) =>
    id === "class-a"
      ? new Promise<(typeof alpha)[]>((resolve) => {
          resolveFirst = resolve;
        })
      : Promise.resolve([beta]),
  );
  mount();
  await screen.findByRole("option", { name: /Class B/ });
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Class" }), "class-b");
  await screen.findByRole("heading", { name: "Beta" });
  resolveFirst([alpha]);
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Alpha" })).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
});
it("creates and edits group details in a modal with normalized input", async () => {
  mount();
  await screen.findByRole("heading", { name: "Alpha" });
  await userEvent.click(screen.getByRole("button", { name: "Create group" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Group name" }), " New group ");
  await userEvent.type(screen.getByRole("textbox", { name: "Group code" }), " NEW ");
  await userEvent.click(screen.getByRole("button", { name: "Save group" }));
  await waitFor(() =>
    expect(state.create).toHaveBeenCalledWith({
      classId: "class-a",
      name: "New group",
      code: "NEW",
      description: "",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: "Edit Alpha" }));
  await userEvent.clear(screen.getByRole("textbox", { name: "Group name" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Group name" }), "Renamed");
  await userEvent.click(screen.getByRole("button", { name: "Save group" }));
  await waitFor(() =>
    expect(state.update).toHaveBeenCalledWith(
      "group-a",
      expect.objectContaining({ name: "Renamed" }),
    ),
  );
});
it("reports create errors and keeps the draft available", async () => {
  state.create.mockRejectedValue(new Error("Code is already in use"));
  mount();
  await screen.findByRole("heading", { name: "Alpha" });
  await userEvent.click(screen.getByRole("button", { name: "Create group" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Group name" }), "New group");
  await userEvent.type(screen.getByRole("textbox", { name: "Group code" }), "alpha");
  await userEvent.click(screen.getByRole("button", { name: "Save group" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Code is already in use");
  expect(screen.getByRole("textbox", { name: "Group name" })).toHaveValue("New group");
});
it("has no automated accessibility violations in the page and member drawer", async () => {
  const view = mount();
  await screen.findByRole("heading", { name: "Alpha" });
  let result = await axe.run(view.container, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
  await openMembers();
  await screen.findByRole("checkbox", { name: "Alice" });
  result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
});
