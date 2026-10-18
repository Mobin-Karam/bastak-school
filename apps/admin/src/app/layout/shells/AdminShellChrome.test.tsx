import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./mobile/MobileShell", () => ({ MobileShell: () => <div>mobile shell</div> }));
vi.mock("./tablet/TabletShell", () => ({ TabletShell: () => <div>tablet shell</div> }));
vi.mock("./desktop/DesktopShell", () => ({ DesktopShell: () => <div>desktop shell</div> }));

import { AdminShellChrome } from "./AdminShellChrome";

afterEach(cleanup);

describe("AdminShellChrome", () => {
  it.each([
    ["mobile", "mobile shell"],
    ["tablet", "tablet shell"],
    ["desktop", "desktop shell"],
  ] as const)("renders only the active %s shell", (shell, label) => {
    render(
      <AdminShellChrome shell={shell} model={{} as never} onOpenCommandPalette={() => undefined} />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryAllByText(/shell$/)).toHaveLength(1);
  });
});
