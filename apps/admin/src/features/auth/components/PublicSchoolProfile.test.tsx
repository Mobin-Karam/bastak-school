import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import {
  PublicSchoolProfileProvider,
  SchoolContactDetails,
  usePublicSchoolProfile,
} from "./PublicSchoolProfile";
const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../../shared/api/api", () => ({ request: state.request }));
function Selection() {
  const { school, selectSchool } = usePublicSchoolProfile();
  return (
    <>
      <h1>{school?.profile.loginTitle || "Default login"}</h1>
      <button onClick={() => selectSchool("two")}>Second school</button>
      <SchoolContactDetails />
    </>
  );
}
afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  vi.clearAllMocks();
});
it("uses the explicit school link and changes public contact details with selection", async () => {
  window.history.replaceState({}, "", "/login?organizationId=one");
  state.request.mockResolvedValue([
    {
      id: "one",
      name: "First",
      profile: {
        loginTitle: "First login",
        address: "First address",
        phone: "07611111111",
        location: "First city",
      },
    },
    {
      id: "two",
      name: "Second",
      profile: { loginTitle: "Second login", address: "Second address" },
    },
  ]);
  render(
    <PublicSchoolProfileProvider>
      <Selection />
    </PublicSchoolProfileProvider>,
  );
  expect(await screen.findByRole("heading", { name: "First login" })).toBeInTheDocument();
  expect(screen.getByText("First address")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Second school" }));
  expect(screen.getByRole("heading", { name: "Second login" })).toBeInTheDocument();
  expect(screen.queryByText("First address")).not.toBeInTheDocument();
  expect(screen.getByText("Second address")).toBeInTheDocument();
});
it("keeps the fallback login usable if the presentation endpoint is unavailable", async () => {
  state.request.mockRejectedValue(new Error("offline"));
  render(
    <PublicSchoolProfileProvider>
      <Selection />
    </PublicSchoolProfileProvider>,
  );
  expect(screen.getByRole("heading", { name: "Default login" })).toBeInTheDocument();
});
