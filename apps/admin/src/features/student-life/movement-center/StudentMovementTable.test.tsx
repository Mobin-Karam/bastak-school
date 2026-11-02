import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { StudentMovementTable } from "./StudentMovementTable";
import type { StudentMovement } from "./api/student-movements.api";

const activeMovement: StudentMovement = {
  id: "exit:exit-1",
  kind: "exit",
  state: "outside",
  leave: null,
  exit: {
    id: "exit-1",
    organizationId: "org-1",
    organizationName: "مدرسه",
    studentId: "student-1",
    studentName: "علی احمدی",
    destination: "درمانگاه",
    reason: "مراجعهٔ پزشکی",
    requestedDepartureAt: "2026-11-01T08:00:00.000Z",
    expectedReturnAt: "2026-11-01T12:00:00.000Z",
    actualDepartureAt: "2026-11-01T08:15:00.000Z",
    actualReturnAt: null,
    returnRequestedAt: null,
    returnRequestNote: "",
    returnVerifiedById: null,
    returnVerifiedAt: null,
    note: "",
    status: "APPROVED",
    approverId: "principal-1",
    reviewedAt: "2026-11-01T07:45:00.000Z",
    createdAt: "2026-11-01T07:30:00.000Z",
  },
};

function renderTable(canResolveMovement: boolean, onAction = vi.fn()) {
  return {
    onAction,
    ...render(
      <LocaleProvider>
        <StudentMovementTable
          items={[activeMovement]}
          loading={false}
          error={false}
          busy={false}
          canManageLeave
          canManageExit
          canResolveMovement={canResolveMovement}
          preferenceKey="student-movement-test"
          onRefresh={vi.fn()}
          onOpenDetails={vi.fn()}
          onAction={onAction}
        />
      </LocaleProvider>,
    ),
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("StudentMovementTable", () => {
  it("offers a principal check-in action without requiring a student return request", async () => {
    const user = userEvent.setup();
    const { onAction } = renderTable(true);
    await user.click(screen.getAllByRole("button", { name: /exit:exit-1/ })[0]);
    const menu = within(await screen.findByRole("menu"));
    await user.click(menu.getByRole("menuitem", { name: "تأیید حضور در مدرسه" }));
    expect(onAction).toHaveBeenCalledWith("confirm_in_school", activeMovement);
  });

  it("does not show the principal check-in action without its capability", async () => {
    const user = userEvent.setup();
    renderTable(false);
    await user.click(screen.getAllByRole("button", { name: /exit:exit-1/ })[0]);
    expect(
      within(await screen.findByRole("menu")).queryByRole("menuitem", {
        name: "تأیید حضور در مدرسه",
      }),
    ).not.toBeInTheDocument();
  });
});
