import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { emptyQuestion } from "../model/question-model";
import { QuestionEditor } from "./QuestionEditor";

describe("QuestionEditor flow", () => {
  it("keeps cancel and save together in a sticky modal action bar", () => {
    const onCancel = vi.fn();
    render(
      <LocaleProvider>
        <QuestionEditor
          editingId=""
          form={emptyQuestion()}
          setForm={vi.fn()}
          submitted={false}
          validationError=""
          busy={false}
          disabled={false}
          nextSortOrder={1}
          onCancel={onCancel}
          onSubmit={vi.fn()}
        />
      </LocaleProvider>,
    );

    const save = screen.getByRole("button", { name: "افزودن سؤال" });
    const actionBar = save.parentElement?.parentElement;
    expect(actionBar).toHaveClass("sticky", "bottom-0", "z-10");
    expect(screen.getByText("ذخیره سریع: Ctrl/⌘ + Enter")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "انصراف" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
