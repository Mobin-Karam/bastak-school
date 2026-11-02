import { describe, expect, it } from "vitest";
import { movementHistoryId, type StudentMovement } from "./student-movements.api";

describe("movementHistoryId", () => {
  it("uses the exit permission id when an exit is linked to a leave request", () => {
    const movement = {
      id: "exit:exit-1",
      kind: "exit",
      state: "outside",
      leave: { id: "leave-1" },
      exit: { id: "exit-1" },
    } as StudentMovement;

    expect(movementHistoryId(movement)).toBe("exit-1");
  });

  it("uses the leave request id for a leave-only movement", () => {
    const movement = {
      id: "leave:leave-1",
      kind: "leave",
      state: "review",
      leave: { id: "leave-1" },
      exit: null,
    } as StudentMovement;

    expect(movementHistoryId(movement)).toBe("leave-1");
  });
});
