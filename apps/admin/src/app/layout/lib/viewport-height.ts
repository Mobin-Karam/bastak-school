type ViewportWindow = Pick<Window, "innerHeight" | "visualViewport">;

/**
 * Safari's layout viewport can remain taller than the visible area while the
 * address bar or software keyboard is changing. Prefer the visual viewport
 * when it is available, while retaining a safe fallback for other browsers.
 */
export function currentViewportHeight(viewportWindow: ViewportWindow): number {
  const height = viewportWindow.visualViewport?.height ?? viewportWindow.innerHeight;
  return Math.max(0, Math.round(height));
}
